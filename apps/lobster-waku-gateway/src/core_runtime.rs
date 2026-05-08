use super::*;
use sha2::{Digest, Sha256};
use std::time::{SystemTime, UNIX_EPOCH};

impl GatewayRuntime {
    pub(crate) fn open(
        storage_root: impl Into<PathBuf>,
        history_limit: usize,
        upstream_base_url: Option<String>,
    ) -> Result<Self, String> {
        let storage_root = storage_root.into();
        let archive_policy = ArchivePolicy::default();
        let timeline_store = FileTimelineStore::open(&storage_root, archive_policy)?;
        let cli_provider_url = upstream_base_url;
        let mut runtime = Self {
            node: InMemoryWakuLightNode::new(
                WakuPeerMode::DesktopLight,
                WakuLightConfig {
                    relay_enabled: false,
                    filter_enabled: true,
                    store_enabled: true,
                    light_push_enabled: true,
                },
            ),
            upstream_gateway: None,
            upstream_base_url: None,
            mirror_sources: Vec::new(),
            connection_state: WakuConnectionState::Disconnected,
            endpoint: None,
            subscriptions: Vec::new(),
            cursors: HashMap::new(),
            history_limit,
            governance_path: storage_root.join("governance-state.json"),
            secure_sessions_path: storage_root.join("secure-sessions.json"),
            provider_config_path: storage_root.join("provider-config.json"),
            auth_state_path: storage_root.join("auth-state.json"),
            timeline_store,
            secure_sessions: SkeletonSecureSessionManager::new(),
            world: Self::default_world(),
            portability: ResidentPortability::protocol_safe_default(),
            cities: HashMap::new(),
            memberships: Vec::new(),
            public_rooms: Vec::new(),
            world_stewards: Vec::new(),
            city_trust: Vec::new(),
            world_square_notices: Vec::new(),
            safety_advisories: Vec::new(),
            safety_reports: Vec::new(),
            resident_sanctions: Vec::new(),
            registration_blacklist: Vec::new(),
            registrations: Vec::new(),
            email_otp_challenges: Vec::new(),
            message_counter: 0,
        };
        runtime.load_governance_state()?;
        runtime.load_secure_sessions()?;
        runtime.load_provider_config()?;
        runtime.load_auth_state()?;
        runtime.ensure_default_world_safety()?;
        if cli_provider_url.is_some() {
            runtime.set_upstream_provider_url(cli_provider_url)?;
        }
        if runtime.cities.is_empty() {
            runtime.seed_default_governance()?;
            runtime.ensure_default_world_safety()?;
        }
        let has_world_lobby = runtime
            .timeline_store
            .active_conversations()
            .into_iter()
            .any(|conversation| conversation.conversation_id.0 == "room:world:lobby");
        if !has_world_lobby {
            runtime.seed_demo_messages()?;
        }
        Ok(runtime)
    }

    pub(crate) fn federation_read_plan(&self) -> GatewayFederationReadPlan {
        GatewayFederationReadPlan {
            local_governance: self.governance_snapshot(),
            upstream_base_url: self.upstream_base_url.clone(),
            mirror_sources: self.mirror_sources.clone(),
        }
    }

    pub(crate) fn resident_directory(snapshot: &GovernanceSnapshot) -> Vec<ResidentDirectoryEntry> {
        let mut by_resident = HashMap::<String, ResidentDirectoryEntry>::new();
        let city_labels = snapshot
            .cities
            .iter()
            .map(|city| (city.profile.city_id.0.clone(), city.profile.slug.clone()))
            .collect::<HashMap<_, _>>();

        for membership in &snapshot.memberships {
            let entry = by_resident
                .entry(membership.resident_id.0.clone())
                .or_insert_with(|| ResidentDirectoryEntry {
                    resident_id: membership.resident_id.0.clone(),
                    active_cities: Vec::new(),
                    pending_cities: Vec::new(),
                    roles: Vec::new(),
                });
            let city_label = city_labels
                .get(&membership.city_id.0)
                .cloned()
                .unwrap_or_else(|| membership.city_id.0.clone());
            match membership.state {
                MembershipState::Active => {
                    if !entry.active_cities.contains(&city_label) {
                        entry.active_cities.push(city_label);
                    }
                }
                MembershipState::PendingApproval => {
                    if !entry.pending_cities.contains(&city_label) {
                        entry.pending_cities.push(city_label);
                    }
                }
                MembershipState::Muted | MembershipState::Suspended | MembershipState::Removed => {}
            }
            let role_label = format!("{:?}", membership.role);
            if !entry.roles.contains(&role_label) {
                entry.roles.push(role_label);
            }
        }

        let mut residents = by_resident.into_values().collect::<Vec<_>>();
        residents.sort_by_key(|entry| entry.resident_id.clone());
        for entry in &mut residents {
            entry.active_cities.sort();
            entry.pending_cities.sort();
            entry.roles.sort();
        }
        residents
    }

    pub(crate) fn default_world() -> WorldProfile {
        WorldProfile {
            world_id: WorldId("world:lobster".into()),
            title: "Lobster World".into(),
            portable_identity_required: true,
            allows_cross_city_private_messages: true,
        }
    }

    pub(crate) fn default_city_features() -> CityFeatureFlags {
        CityFeatureFlags {
            local_search: true,
            ai_sidecar: true,
            personal_bots: true,
            city_bots: true,
            room_scene_bots: true,
            commerce_bots: false,
            room_indexing: true,
            store_history: true,
        }
    }

    pub(crate) fn default_city_retention_policy() -> CityRetentionPolicy {
        CityRetentionPolicy {
            active_window_hours: 24,
            short_window_store_hours: 72,
            local_archive_days: Some(30),
        }
    }

    pub(crate) fn default_city_scene(slug: &str, title: &str) -> SceneMetadata {
        SceneMetadata {
            scope: SceneScope::City,
            render_style: SceneRenderStyle::SfcPixel,
            title_banner: Some(title.into()),
            background_preset: format!("city-{slug}"),
            ambiance: "像素城邦、公共广场与世界入口".into(),
            owner_editable: true,
            avatar_editable: false,
            primary_avatar: None,
            assistant_slots: vec![AgentSceneSlot {
                slot_id: "city-concierge".into(),
                display_name: "城务执事".into(),
                scope: AgentScope::City,
                use_cases: vec![AgentUseCase::Caretaking, AgentUseCase::Moderation],
                appearance_hint: "pixel-npc-concierge".into(),
                can_leave_messages: true,
                can_edit_scene: false,
                can_trade_goods: false,
            }],
            landmarks: vec![
                SceneLandmark {
                    slot_id: "lord-hall".into(),
                    label: "城主府".into(),
                    sprite_hint: "lord-hall".into(),
                    interaction_hint: "查看治理与公告".into(),
                },
                SceneLandmark {
                    slot_id: "resident-quarter".into(),
                    label: "居民区".into(),
                    sprite_hint: "resident-quarter".into(),
                    interaction_hint: "浏览活跃居民与房间".into(),
                },
                SceneLandmark {
                    slot_id: "portal".into(),
                    label: "世界传送阵".into(),
                    sprite_hint: "world-portal".into(),
                    interaction_hint: "前往世界广场或其他城市".into(),
                },
            ],
        }
    }

    pub(crate) fn default_public_room_scene(
        city_slug: &str,
        room_slug: &str,
        title: &str,
    ) -> SceneMetadata {
        SceneMetadata {
            scope: SceneScope::PublicRoom,
            render_style: SceneRenderStyle::SfcPixel,
            title_banner: Some(title.into()),
            background_preset: format!("public-room-{city_slug}-{room_slug}"),
            ambiance: "公共频道、公告板与像素座位区".into(),
            owner_editable: true,
            avatar_editable: true,
            primary_avatar: None,
            assistant_slots: vec![AgentSceneSlot {
                slot_id: "public-room-host".into(),
                display_name: "频道主持".into(),
                scope: AgentScope::Room,
                use_cases: vec![AgentUseCase::Caretaking, AgentUseCase::Research],
                appearance_hint: "pixel-room-host".into(),
                can_leave_messages: true,
                can_edit_scene: false,
                can_trade_goods: false,
            }],
            landmarks: vec![
                SceneLandmark {
                    slot_id: "bulletin".into(),
                    label: "公告牌".into(),
                    sprite_hint: "bulletin-board".into(),
                    interaction_hint: "查看固定消息与任务".into(),
                },
                SceneLandmark {
                    slot_id: "chat-floor".into(),
                    label: "会话区".into(),
                    sprite_hint: "chat-floor".into(),
                    interaction_hint: "阅读和发送频道消息".into(),
                },
            ],
        }
    }

    pub(crate) fn default_direct_scene(participants: &[IdentityId]) -> SceneMetadata {
        let display_name = participants
            .first()
            .map(|item| item.0.clone())
            .unwrap_or_else(|| "来访者".into());
        SceneMetadata {
            scope: SceneScope::DirectRoom,
            render_style: SceneRenderStyle::SfcPixel,
            title_banner: Some("个人房间".into()),
            background_preset: "private-room-loft".into(),
            ambiance: "木地板、工作台、沙发与像素人物".into(),
            owner_editable: true,
            avatar_editable: true,
            primary_avatar: Some(PixelAvatarProfile {
                avatar_id: format!("avatar:{display_name}"),
                display_name,
                archetype: "pixel-resident".into(),
                palette_hint: "warm-amber".into(),
                accessory_hint: Some("徽章".into()),
            }),
            assistant_slots: vec![
                AgentSceneSlot {
                    slot_id: "room-caretaker".into(),
                    display_name: "看家助手".into(),
                    scope: AgentScope::Room,
                    use_cases: vec![AgentUseCase::Caretaking],
                    appearance_hint: "pixel-room-caretaker".into(),
                    can_leave_messages: true,
                    can_edit_scene: false,
                    can_trade_goods: false,
                },
                AgentSceneSlot {
                    slot_id: "room-decorator".into(),
                    display_name: "装修助手".into(),
                    scope: AgentScope::Room,
                    use_cases: vec![AgentUseCase::Decoration],
                    appearance_hint: "pixel-room-decorator".into(),
                    can_leave_messages: true,
                    can_edit_scene: true,
                    can_trade_goods: false,
                },
                AgentSceneSlot {
                    slot_id: "room-merchant".into(),
                    display_name: "摆摊助手".into(),
                    scope: AgentScope::Room,
                    use_cases: vec![AgentUseCase::Commerce],
                    appearance_hint: "pixel-room-merchant".into(),
                    can_leave_messages: true,
                    can_edit_scene: false,
                    can_trade_goods: true,
                },
            ],
            landmarks: vec![
                SceneLandmark {
                    slot_id: "desk".into(),
                    label: "工作台".into(),
                    sprite_hint: "desk-crt".into(),
                    interaction_hint: "处理任务与草稿".into(),
                },
                SceneLandmark {
                    slot_id: "sofa".into(),
                    label: "会客沙发".into(),
                    sprite_hint: "cozy-sofa".into(),
                    interaction_hint: "进入私聊氛围区".into(),
                },
            ],
        }
    }

    pub(crate) fn summarize_scene(scene: Option<&SceneMetadata>) -> Option<String> {
        scene.map(|scene| {
            let scope = match scene.scope {
                SceneScope::City => "城市场景",
                SceneScope::PublicRoom => "公共房间",
                SceneScope::PersonalRoom => "个人房间",
                SceneScope::DirectRoom => "私聊房间",
            };
            let avatar = scene
                .primary_avatar
                .as_ref()
                .map(|item| format!(" · 人物 {}", item.display_name))
                .unwrap_or_default();
            format!("{scope} · {}{}", scene.ambiance, avatar)
        })
    }

    pub(crate) fn actor_is_world_steward(&self, actor_id: &IdentityId) -> bool {
        self.world_stewards.iter().any(|item| item == actor_id)
    }

    pub(crate) fn resident_portability_revoked(&self, resident_id: &IdentityId) -> bool {
        self.resident_sanctions.iter().any(|sanction| {
            sanction.resident_id == *resident_id
                && sanction.portability_revoked
                && sanction.status == WorldResidentSanctionStatus::Active
        })
    }

    pub(crate) fn trust_state_from_records(
        records: &[CityTrustRecord],
        city_id: &CityId,
    ) -> CityTrustState {
        records
            .iter()
            .find(|item| item.city_id == *city_id)
            .map(|item| item.state)
            .unwrap_or_default()
    }

    pub(crate) fn city_is_mirror_visible(city: &CityProfile, trust_state: CityTrustState) -> bool {
        city.public_room_discovery_enabled
            && city.federation_policy != FederationPolicy::Isolated
            && !matches!(
                trust_state,
                CityTrustState::Quarantined | CityTrustState::Isolated
            )
    }

    pub(crate) fn checksum_hex<T: Serialize>(value: &T) -> String {
        let bytes = serde_json::to_vec(value).unwrap_or_default();
        let digest = Sha256::digest(bytes);
        hex::encode(digest)
    }

    pub(crate) fn normalize_slug(raw: &str) -> String {
        let mut slug = raw
            .trim()
            .to_lowercase()
            .chars()
            .map(|char| {
                if char.is_ascii_alphanumeric() {
                    char
                } else {
                    '-'
                }
            })
            .collect::<String>();
        while slug.contains("--") {
            slug = slug.replace("--", "-");
        }
        slug.trim_matches('-').to_string()
    }

    pub(crate) fn resolve_city_id(&self, token: &str) -> Option<CityId> {
        let by_id = CityId(token.to_string());
        if self.cities.contains_key(&by_id) {
            return Some(by_id);
        }
        self.cities
            .values()
            .find(|city| city.profile.slug == token)
            .map(|city| city.profile.city_id.clone())
    }

    pub(crate) fn active_membership(
        &self,
        city_id: &CityId,
        resident_id: &IdentityId,
    ) -> Option<&CityMembership> {
        self.memberships.iter().find(|membership| {
            membership.city_id == *city_id
                && membership.resident_id == *resident_id
                && membership.state == MembershipState::Active
        })
    }

    pub(crate) fn active_membership_mut(
        &mut self,
        city_id: &CityId,
        resident_id: &IdentityId,
    ) -> Option<&mut CityMembership> {
        self.memberships.iter_mut().find(|membership| {
            membership.city_id == *city_id
                && membership.resident_id == *resident_id
                && membership.state != MembershipState::Removed
        })
    }

    pub(crate) fn now_ms() -> i64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("system time should be after unix epoch")
            .as_millis() as i64
    }

    pub(crate) fn next_message_id(&mut self) -> String {
        self.message_counter += 1;
        format!("gw-{}-{}", Self::now_ms(), self.message_counter)
    }
}
