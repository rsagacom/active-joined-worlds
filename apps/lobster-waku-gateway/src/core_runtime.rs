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
            presence_path: storage_root.join("presence-state.json"),
            unread_path: storage_root.join("unread-state.json"),
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
            auth_sessions: Vec::new(),
            message_counter: 0,
            presence: HashMap::new(),
            unread: HashMap::new(),
            rate_limits: HashMap::new(),
            message_moderation: HashMap::new(),
            started_at_ms: Self::now_ms(),
            app_config: HashMap::new(),
        };
        runtime.load_governance_state()?;
        runtime.load_secure_sessions()?;
        runtime.load_provider_config()?;
        runtime.load_auth_state()?;
        runtime.load_presence_state()?;
        runtime.load_unread_state()?;
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

    pub(crate) fn record_presence(&mut self, resident_id: &str) -> bool {
        let now_ms = Self::now_ms();
        let was_online = self.is_online(resident_id, 120_000);
        self.presence
            .insert(resident_id.to_string(), now_ms);
        let _ = self.persist_presence_state();
        !was_online
    }

    pub(crate) fn is_online(&self, resident_id: &str, threshold_ms: i64) -> bool {
        self.presence
            .get(resident_id)
            .map(|last_seen| Self::now_ms() - last_seen < threshold_ms)
            .unwrap_or(false)
    }

    pub(crate) fn increment_unread(
        &mut self,
        conversation_id: &ConversationId,
        exclude_sender: &IdentityId,
    ) {
        let conversation = self
            .timeline_store
            .active_conversations()
            .into_iter()
            .find(|item| item.conversation_id == *conversation_id);
        if let Some(conversation) = conversation {
            for participant in &conversation.participants {
                if participant == exclude_sender {
                    continue;
                }
                let key = format!("{}:{}", participant.0, conversation_id.0);
                let count = self.unread.get(&key).copied().unwrap_or(0);
                self.unread.insert(key, count.saturating_add(1));
            }
        }
        let _ = self.persist_unread_state();
    }

    pub(crate) fn mark_read(
        &mut self,
        resident_id: &IdentityId,
        conversation_id: &ConversationId,
    ) {
        let key = format!("{}:{}", resident_id.0, conversation_id.0);
        self.unread.insert(key, 0);
        let _ = self.persist_unread_state();
    }

    pub(crate) fn check_rate_limit(&mut self, sender_id: &str, max_per_minute: u32) -> Option<i64> {
        let now_ms = Self::now_ms();
        let window_ms = 60_000;
        let entry = self
            .rate_limits
            .entry(sender_id.to_string())
            .or_insert_with(|| RateLimitWindow {
                window_start_ms: now_ms,
                count: 0,
            });
        if now_ms - entry.window_start_ms > window_ms {
            entry.window_start_ms = now_ms;
            entry.count = 0;
        }
        if entry.count >= max_per_minute {
            let retry_ms = window_ms - (now_ms - entry.window_start_ms);
            return Some(retry_ms.max(1_000));
        }
        entry.count += 1;
        None
    }

    pub(crate) fn persist_presence_state(&self) -> Result<(), String> {
        let bytes = serde_json::to_vec_pretty(&self.presence)
            .map_err(|error| format!("encode presence state failed: {error}"))?;
        atomic_write_file(&self.presence_path, &bytes)
            .map_err(|error| format!("write presence state failed: {error}"))
    }

    pub(crate) fn load_presence_state(&mut self) -> Result<(), String> {
        if !self.presence_path.exists() {
            return Ok(());
        }
        let bytes = std::fs::read(&self.presence_path)
            .map_err(|error| format!("read presence state failed: {error}"))?;
        if bytes.is_empty() {
            return Ok(());
        }
        self.presence = serde_json::from_slice(&bytes)
            .map_err(|error| format!("decode presence state failed: {error}"))?;
        Ok(())
    }

    pub(crate) fn persist_unread_state(&self) -> Result<(), String> {
        let bytes = serde_json::to_vec_pretty(&self.unread)
            .map_err(|error| format!("encode unread state failed: {error}"))?;
        atomic_write_file(&self.unread_path, &bytes)
            .map_err(|error| format!("write unread state failed: {error}"))
    }

    pub(crate) fn load_unread_state(&mut self) -> Result<(), String> {
        if !self.unread_path.exists() {
            return Ok(());
        }
        let bytes = std::fs::read(&self.unread_path)
            .map_err(|error| format!("read unread state failed: {error}"))?;
        if bytes.is_empty() {
            return Ok(());
        }
        self.unread = serde_json::from_slice(&bytes)
            .map_err(|error| format!("decode unread state failed: {error}"))?;
        Ok(())
    }

    pub(crate) fn unread_count(
        &self,
        resident_id: &IdentityId,
        conversation_id: &ConversationId,
    ) -> usize {
        let key = format!("{}:{}", resident_id.0, conversation_id.0);
        self.unread.get(&key).copied().unwrap_or(0)
    }

    pub(crate) fn enrich_resident_directory(&self) -> Vec<ResidentDirectoryEntry> {
        let snapshot = self.governance_snapshot();
        let mut residents = Self::resident_directory(&snapshot);
        let online_threshold_ms = 120_000;
        for entry in &mut residents {
            let last_seen = self.presence.get(&entry.resident_id).copied();
            entry.online = last_seen.map(|ts| Self::now_ms() - ts < online_threshold_ms);
            entry.last_seen_at_ms = last_seen;
            entry.avatar_id = Some(format!("avatar:{}", entry.resident_id));
            let personal_room = self
                .timeline_store
                .active_conversations()
                .into_iter()
                .find(|conversation| {
                    conversation.kind == ConversationKind::Direct
                        && conversation
                            .participants
                            .iter()
                            .any(|p| p.0 == entry.resident_id)
                        && conversation.participants.len() == 1
                });
            entry.personal_room_id = personal_room.map(|c| c.conversation_id.0.clone());
        }
        residents
    }

    pub(crate) fn admin_summary(&self) -> AdminSummaryResponse {
        let residents = self.enrich_resident_directory();
        let conversations = self.timeline_store.active_conversations();
        let total_messages: usize = conversations
            .iter()
            .map(|conv| {
                self.timeline_store
                    .recent_messages(&conv.conversation_id, 1)
                    .len()
            })
            .sum();
        let online_count = residents.iter().filter(|entry| entry.online == Some(true)).count();
        let shell_state = self.shell_state_for_viewer(None);
        AdminSummaryResponse {
            resident_count: residents.len(),
            room_count: conversations.len(),
            message_count: total_messages,
            online_count,
            gateway_uptime_ms: Self::now_ms() - self.started_at_ms,
            state_version: shell_state.state_version,
        }
    }

    pub(crate) fn admin_conversations(&self) -> Vec<AdminConversationSummary> {
        let conversations = self.timeline_store.active_conversations();
        let snapshot = self.governance_snapshot();
        conversations
            .into_iter()
            .map(|conv| {
                let message_count = self
                    .timeline_store
                    .recent_messages(&conv.conversation_id, 500)
                    .len();
                let title = Self::room_title(&conv.conversation_id);
                let is_frozen = snapshot
                    .public_rooms
                    .iter()
                    .any(|room| room.room_id.0 == conv.conversation_id.0 && room.frozen);
                AdminConversationSummary {
                    conversation_id: conv.conversation_id.0.clone(),
                    kind: format!("{:?}", conv.kind).to_lowercase(),
                    scope: format!("{:?}", conv.scope).to_lowercase(),
                    title,
                    participant_count: conv.participants.len(),
                    message_count,
                    is_frozen,
                    created_at_ms: conv.created_at_ms,
                    last_active_at_ms: conv.last_active_at_ms,
                }
            })
            .collect()
    }

    pub(crate) fn admin_message_audit(
        &self,
        conversation_id: &ConversationId,
        limit: usize,
    ) -> Option<AdminMessageAudit> {
        let now_ms = Self::now_ms();
        let messages = self.timeline_store.recent_messages(conversation_id, limit);
        let total_count = self.timeline_store.archived_count(conversation_id);
        let shell_messages: Vec<ShellRoomMessage> = messages
            .into_iter()
            .map(|entry| ShellRoomMessage {
                message_id: entry.envelope.message_id.0,
                reply_to_message_id: entry.envelope.reply_to_message_id.map(|m| m.0),
                is_recalled: entry.recalled_at_ms.is_some(),
                recalled_by: entry.recalled_by.map(|id| id.0),
                recalled_at_ms: entry.recalled_at_ms,
                is_edited: entry.edited_at_ms.is_some(),
                edited_by: entry.edited_by.map(|id| id.0),
                edited_at_ms: entry.edited_at_ms,
                sender: entry.envelope.sender.0,
                timestamp_ms: entry.envelope.timestamp_ms,
                timestamp_label: Self::relative_label(now_ms, entry.envelope.timestamp_ms),
                delivery_status: "delivered".to_string(),
                text: if entry.recalled_at_ms.is_some() {
                    "消息已撤回".into()
                } else {
                    entry.envelope.body.plain_text
                },
            })
            .collect();
        let returned_count = shell_messages.len();
        Some(AdminMessageAudit {
            conversation_id: conversation_id.0.clone(),
            messages: shell_messages,
            total_count,
            returned_count,
        })
    }

    pub(crate) fn admin_residents(&self) -> Vec<AdminResidentDetail> {
        let is_online = |rid: &str| -> bool {
            self.presence
                .get(rid)
                .map(|last| Self::now_ms() - last < 120_000)
                .unwrap_or(false)
        };
        let snapshot = self.governance_snapshot();
        let sanctions = &self.resident_sanctions;
        let mut by_resident: HashMap<String, AdminResidentDetail> = HashMap::new();

        let city_slugs: HashMap<String, String> = snapshot
            .cities
            .iter()
            .map(|c| (c.profile.city_id.0.clone(), c.profile.slug.clone()))
            .collect();
        for member in &self.memberships {
            let rid = &member.resident_id.0;
            let city_slug = city_slugs
                .get(&member.city_id.0)
                .cloned()
                .unwrap_or_else(|| member.city_id.0.clone());
            let entry = by_resident.entry(rid.clone()).or_insert_with(|| {
                let resident_sanctions: Vec<AdminSanctionSummary> = sanctions
                    .iter()
                    .filter(|s| s.resident_id.0 == *rid)
                    .map(|s| AdminSanctionSummary {
                        sanction_id: s.sanction_id.clone(),
                        reason: s.reason.clone(),
                        status: format!("{:?}", s.status).to_lowercase(),
                        issued_at_ms: s.issued_at_ms,
                        lifted_at_ms: s.lifted_at_ms,
                    })
                    .collect();
                let is_banned = resident_sanctions
                    .iter()
                    .any(|s| s.status == "active" && s.lifted_at_ms.is_none());
                AdminResidentDetail {
                    resident_id: rid.clone(),
                    roles: Vec::new(),
                    active_cities: Vec::new(),
                    pending_cities: Vec::new(),
                    sanctions: resident_sanctions,
                    is_banned,
                    online: is_online(rid),
                    last_seen_at_ms: self.presence.get(rid).copied(),
                    avatar_id: None,
                }
            });
            match member.state {
                MembershipState::Active | MembershipState::Muted => {
                    if !entry.active_cities.contains(&city_slug) {
                        entry.active_cities.push(city_slug.clone());
                    }
                }
                MembershipState::PendingApproval => {
                    if !entry.pending_cities.contains(&city_slug) {
                        entry.pending_cities.push(city_slug.clone());
                    }
                }
                _ => {}
            }
            let role_str = format!("{:?}", member.role).to_lowercase();
            if !entry.roles.contains(&role_str) {
                entry.roles.push(role_str);
            }
        }

        let mut result: Vec<_> = by_resident.into_values().collect();
        result.sort_by(|a, b| a.resident_id.cmp(&b.resident_id));
        result
    }

    pub(crate) fn admin_ban_resident(
        &mut self,
        resident_id: &str,
        reason: &str,
    ) -> Result<(), String> {
        if reason.trim().is_empty() {
            return Err("ban reason required".into());
        }
        let rid = IdentityId(resident_id.to_string());
        let sanction = WorldResidentSanction {
            sanction_id: format!("resident-sanction:{}", self.next_message_id()),
            resident_id: rid,
            city_id: None,
            report_id: None,
            reason: reason.trim().into(),
            portability_revoked: true,
            status: WorldResidentSanctionStatus::Active,
            issued_by: IdentityId("admin".into()),
            issued_at_ms: Self::now_ms(),
            lifted_at_ms: None,
        };
        self.resident_sanctions.push(sanction);
        Ok(())
    }

    pub(crate) fn admin_unban_resident(&mut self, resident_id: &str) -> Result<usize, String> {
        let now_ms = Self::now_ms();
        let mut count = 0;
        for sanction in &mut self.resident_sanctions {
            if sanction.resident_id.0 == resident_id
                && sanction.status == WorldResidentSanctionStatus::Active
            {
                sanction.status = WorldResidentSanctionStatus::Lifted;
                sanction.lifted_at_ms = Some(now_ms);
                count += 1;
            }
        }
        Ok(count)
    }

    pub(crate) fn admin_rooms_detail(&self) -> Vec<AdminRoomDetail> {
        let snapshot = self.governance_snapshot();
        self.timeline_store
            .active_conversations()
            .into_iter()
            .map(|conv| {
                let message_count = self
                    .timeline_store
                    .recent_messages(&conv.conversation_id, 500)
                    .len();
                let is_frozen = snapshot
                    .public_rooms
                    .iter()
                    .any(|room| room.room_id.0 == conv.conversation_id.0 && room.frozen);
                let title = Self::room_title(&conv.conversation_id);
                AdminRoomDetail {
                    id: conv.conversation_id.0,
                    kind: format!("{:?}", conv.kind).to_lowercase(),
                    title,
                    participant_count: conv.participants.len(),
                    message_count,
                    is_frozen,
                    has_scene: conv.scene.is_some(),
                    created_at_ms: conv.created_at_ms,
                    last_active_at_ms: conv.last_active_at_ms,
                }
            })
            .collect()
    }

    pub(crate) fn admin_freeze_room(&mut self, room_id: &str) -> Result<bool, String> {
        for room in &mut self.public_rooms {
            if room.room_id.0 == room_id {
                if room.frozen {
                    return Err("room already frozen".into());
                }
                room.frozen = true;
                return Ok(true);
            }
        }
        Err(format!("room not found: {room_id}"))
    }

    pub(crate) fn admin_unfreeze_room(&mut self, room_id: &str) -> Result<bool, String> {
        for room in &mut self.public_rooms {
            if room.room_id.0 == room_id {
                if !room.frozen {
                    return Err("room not frozen".into());
                }
                room.frozen = false;
                return Ok(true);
            }
        }
        Err(format!("room not found: {room_id}"))
    }

    pub(crate) fn admin_get_config(&self) -> HashMap<String, String> {
        self.app_config.clone()
    }

    pub(crate) fn admin_set_config(&mut self, updates: HashMap<String, String>) {
        for (key, value) in updates {
            self.app_config.insert(key, value);
        }
    }

    pub(crate) fn admin_moderate_message(
        &mut self,
        message_id: &str,
        conversation_id: &str,
        action: &str,
    ) -> Result<(), String> {
        if !matches!(action, "approved" | "blocked" | "handled") {
            return Err(format!("invalid action: {action}"));
        }
        let messages = self
            .timeline_store
            .recent_messages(&ConversationId(conversation_id.to_string()), 500);
        let found = messages
            .iter()
            .any(|m| m.envelope.message_id.0 == message_id);
        if !found {
            return Err("message not found".into());
        }
        self.message_moderation
            .insert(message_id.to_string(), action.to_string());
        Ok(())
    }

    pub(crate) fn admin_message_moderation_status(
        &self,
        message_id: &str,
    ) -> Option<&str> {
        self.message_moderation.get(message_id).map(|s| s.as_str())
    }

    pub(crate) fn validate_scene_config(
        &self,
        _conversation_id: &ConversationId,
        image_layer: &Option<SceneImageLayer>,
        hotspot_layer: &Option<SceneHotspotLayer>,
    ) -> SceneValidateResponse {
        let mut errors = Vec::new();
        let mut warnings = Vec::new();
        if let Some(layer) = image_layer {
            if layer.asset_hint.trim().is_empty() {
                errors.push("image_layer.asset_hint must not be empty".into());
            }
        }
        if let Some(layer) = hotspot_layer {
            if layer.hotspots.is_empty() {
                warnings.push("hotspot_layer has no hotspots".into());
            }
            for (i, hotspot) in layer.hotspots.iter().enumerate() {
                if hotspot.x_permyriad > 10000 || hotspot.y_permyriad > 10000 {
                    errors.push(format!(
                        "hotspot[{}] coords out of range: ({},{})",
                        i, hotspot.x_permyriad, hotspot.y_permyriad
                    ));
                }
                if hotspot.label.trim().is_empty() {
                    warnings.push(format!("hotspot[{}] has empty label", i));
                }
            }
        }
        SceneValidateResponse {
            valid: errors.is_empty(),
            errors,
            warnings,
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
                    online: None,
                    last_seen_at_ms: None,
                    avatar_id: None,
                    personal_room_id: None,
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
        let landmarks = vec![
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
        ];
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
            image_layer: Some(Self::scene_image_layer(format!("city-{slug}"), true)),
            hotspot_layer: Some(Self::scene_hotspot_layer("city-hotspots", true, &landmarks)),
            landmarks,
        }
    }

    pub(crate) fn default_public_room_scene(
        city_slug: &str,
        room_slug: &str,
        title: &str,
    ) -> SceneMetadata {
        let landmarks = vec![
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
        ];
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
            image_layer: Some(Self::scene_image_layer(
                format!("public-room-{city_slug}-{room_slug}"),
                true,
            )),
            hotspot_layer: Some(Self::scene_hotspot_layer(
                "public-room-hotspots",
                true,
                &landmarks,
            )),
            landmarks,
        }
    }

    pub(crate) fn default_direct_scene(participants: &[IdentityId]) -> SceneMetadata {
        let display_name = participants
            .first()
            .map(|item| item.0.clone())
            .unwrap_or_else(|| "来访者".into());
        let landmarks = vec![
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
        ];
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
            image_layer: Some(Self::scene_image_layer("private-room-loft", true)),
            hotspot_layer: Some(Self::scene_hotspot_layer(
                "direct-room-hotspots",
                true,
                &landmarks,
            )),
            landmarks,
        }
    }

    pub(crate) fn scene_image_layer(
        preset: impl Into<String>,
        owner_editable: bool,
    ) -> SceneImageLayer {
        let preset = preset.into();
        SceneImageLayer {
            layer_id: "image-layer".into(),
            asset_hint: preset.clone(),
            preset,
            aspect_ratio_permyriad: 16_000,
            owner_editable,
        }
    }

    pub(crate) fn scene_hotspot_layer(
        layer_id: impl Into<String>,
        owner_editable: bool,
        landmarks: &[SceneLandmark],
    ) -> SceneHotspotLayer {
        let count = landmarks.len().max(1);
        let hotspots = landmarks
            .iter()
            .enumerate()
            .map(|(index, landmark)| {
                let x = 1_500 + ((index as u16) * 6_800 / (count as u16));
                SceneHotspot {
                    hotspot_id: landmark.slot_id.clone(),
                    label: landmark.label.clone(),
                    sprite_hint: landmark.sprite_hint.clone(),
                    interaction_hint: landmark.interaction_hint.clone(),
                    x_permyriad: x.min(9_000),
                    y_permyriad: 2_400 + ((index as u16 % 2) * 2_600),
                    width_permyriad: 900,
                    height_permyriad: 700,
                }
            })
            .collect();
        SceneHotspotLayer {
            layer_id: layer_id.into(),
            coordinate_system: "scene-permyriad".into(),
            owner_editable,
            hotspots,
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
