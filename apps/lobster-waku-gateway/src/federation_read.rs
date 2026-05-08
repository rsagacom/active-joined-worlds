use std::collections::HashSet;

use super::*;

pub(crate) struct GatewayFederationReadPlan {
    pub(crate) local_governance: GovernanceSnapshot,
    pub(crate) upstream_base_url: Option<String>,
    pub(crate) mirror_sources: Vec<MirrorSourceConfig>,
}

impl GatewayFederationReadPlan {
    fn local_city_ids(&self) -> HashSet<String> {
        self.local_governance
            .cities
            .iter()
            .map(|item| item.profile.city_id.0.clone())
            .collect()
    }

    fn collect_remote_world_snapshot_fetches(&self) -> Vec<RemoteWorldSnapshotFetch> {
        let mut fetches = Vec::new();
        let mut seen = HashSet::new();

        if let Some(base_url) = self.upstream_base_url.as_ref() {
            let bundle = GatewayRuntime::fetch_world_snapshot_bundle_from_base_url(base_url);
            seen.insert(base_url.clone());
            fetches.push(RemoteWorldSnapshotFetch {
                base_url: base_url.clone(),
                source_kind: "provider".into(),
                enabled: true,
                reachable: bundle.is_some(),
                bundle,
            });
        }

        for source in &self.mirror_sources {
            if !seen.insert(source.base_url.clone()) {
                continue;
            }
            let bundle = if source.enabled {
                GatewayRuntime::fetch_world_snapshot_bundle_from_base_url(&source.base_url)
            } else {
                None
            };
            fetches.push(RemoteWorldSnapshotFetch {
                base_url: source.base_url.clone(),
                source_kind: "mirror".into(),
                enabled: source.enabled,
                reachable: source.enabled && bundle.is_some(),
                bundle,
            });
        }

        fetches
    }

    fn federated_governance_snapshot_from_fetches(
        &self,
        fetches: &[RemoteWorldSnapshotFetch],
    ) -> GovernanceSnapshot {
        fetches.iter().filter_map(|item| item.bundle.as_ref()).fold(
            self.local_governance.clone(),
            |snapshot, bundle| {
                GatewayRuntime::merge_governance_snapshots(
                    snapshot,
                    bundle.payload.governance.clone(),
                )
            },
        )
    }

    pub(crate) fn federated_governance_snapshot(&self) -> GovernanceSnapshot {
        let fetches = self.collect_remote_world_snapshot_fetches();
        self.federated_governance_snapshot_from_fetches(&fetches)
    }

    fn world_directory_mirrors_from_snapshot(
        &self,
        snapshot: &GovernanceSnapshot,
    ) -> Vec<DirectoryMirrorRecord> {
        let local_city_ids = self.local_city_ids();
        let mut mirrors = snapshot.cities.clone();
        mirrors.sort_by_key(|item| item.profile.slug.clone());

        mirrors
            .into_iter()
            .map(|city| {
                let trust_state = GatewayRuntime::trust_state_from_records(
                    &snapshot.city_trust,
                    &city.profile.city_id,
                );
                DirectoryMirrorRecord {
                    city_id: city.profile.city_id.0.clone(),
                    slug: city.profile.slug.clone(),
                    title: city.profile.title.clone(),
                    mirror_enabled: GatewayRuntime::city_is_mirror_visible(
                        &city.profile,
                        trust_state,
                    ),
                    trust_state,
                    source_kind: if local_city_ids.contains(&city.profile.city_id.0) {
                        "local".into()
                    } else {
                        "federated".into()
                    },
                }
            })
            .collect::<Vec<_>>()
    }

    fn world_directory_snapshot_from_governance(
        &self,
        snapshot: &GovernanceSnapshot,
    ) -> WorldDirectorySnapshot {
        let mirrors = self.world_directory_mirrors_from_snapshot(snapshot);
        let city_trust = snapshot.city_trust.clone();
        let memberships = snapshot.memberships.clone();
        let public_rooms = snapshot.public_rooms.clone();
        let world_id = snapshot.world.world_id.0.clone();
        let world_title = snapshot.world.title.clone();
        let notice_count = snapshot.world_square_notices.len();
        let advisory_count = snapshot.safety_advisories.len();

        let mut cities = snapshot
            .cities
            .iter()
            .filter_map(|city| {
                let trust_state =
                    GatewayRuntime::trust_state_from_records(&city_trust, &city.profile.city_id);
                if matches!(
                    trust_state,
                    CityTrustState::Quarantined | CityTrustState::Isolated
                ) {
                    return None;
                }
                let resident_count = memberships
                    .iter()
                    .filter(|membership| {
                        membership.city_id == city.profile.city_id
                            && membership.state == MembershipState::Active
                    })
                    .count();
                let public_room_count = public_rooms
                    .iter()
                    .filter(|room| room.city_id == city.profile.city_id)
                    .count();
                let source_kind = mirrors
                    .iter()
                    .find(|mirror| mirror.city_id == city.profile.city_id.0)
                    .map(|mirror| mirror.source_kind.clone())
                    .unwrap_or_else(|| "local".into());

                Some(WorldDirectoryCityEntry {
                    city_id: city.profile.city_id.0.clone(),
                    slug: city.profile.slug.clone(),
                    title: city.profile.title.clone(),
                    description: city.profile.description.clone(),
                    trust_state,
                    mirror_enabled: GatewayRuntime::city_is_mirror_visible(
                        &city.profile,
                        trust_state,
                    ),
                    resident_count,
                    public_room_count,
                    source_kind,
                })
            })
            .collect::<Vec<_>>();
        cities.sort_by_key(|item| item.slug.clone());

        WorldDirectorySnapshot {
            snapshot_id: format!("directory-{}", GatewayRuntime::now_ms()),
            world_id,
            title: world_title,
            generated_at_ms: GatewayRuntime::now_ms(),
            city_count: cities.len(),
            mirror_count: mirrors.iter().filter(|item| item.mirror_enabled).count(),
            notice_count,
            advisory_count,
            cities,
            mirrors,
        }
    }

    pub(crate) fn world_directory_snapshot(&self) -> WorldDirectorySnapshot {
        let snapshot = self.federated_governance_snapshot();
        self.world_directory_snapshot_from_governance(&snapshot)
    }

    fn world_entry_status_label(trust_state: CityTrustState, mirror_enabled: bool) -> String {
        let trust = match trust_state {
            CityTrustState::Healthy => "健康",
            CityTrustState::UnderReview => "复核中",
            CityTrustState::Quarantined => "已隔离",
            CityTrustState::Isolated => "自隔离",
        };
        let mirror = if mirror_enabled {
            "可镜像"
        } else {
            "不可镜像"
        };
        format!("{trust} · {mirror}")
    }

    fn world_entry_state_from_directory(
        &self,
        directory: WorldDirectorySnapshot,
    ) -> WorldEntryState {
        let current_city_slug = "core-harbor".to_string();
        let mut routes = directory
            .cities
            .iter()
            .map(|city| {
                let is_current = city.slug == current_city_slug;
                WorldEntryRoute {
                    city_id: city.city_id.clone(),
                    slug: city.slug.clone(),
                    title: city.title.clone(),
                    description: city.description.clone(),
                    href: if is_current {
                        "./index.html".into()
                    } else {
                        format!("./index.html?city={}", city.slug)
                    },
                    trust_state: city.trust_state,
                    status_label: Self::world_entry_status_label(
                        city.trust_state,
                        city.mirror_enabled,
                    ),
                    mirror_enabled: city.mirror_enabled,
                    resident_count: city.resident_count,
                    public_room_count: city.public_room_count,
                    source_kind: city.source_kind.clone(),
                    is_current,
                }
            })
            .collect::<Vec<_>>();
        routes.sort_by_key(|route| (!route.is_current, route.slug.clone()));
        let route_count = routes.len();
        let source_summary = format!(
            "{} 条线路 · {} 个镜像 · {} 条公告 · {} 条安全提示",
            route_count, directory.mirror_count, directory.notice_count, directory.advisory_count
        );

        WorldEntryState {
            title: "世界入口".into(),
            station_label: "地铁候车站".into(),
            world_id: directory.world_id,
            world_title: directory.title,
            generated_at_ms: directory.generated_at_ms,
            current_city_slug,
            route_count,
            mirror_count: directory.mirror_count,
            notice_count: directory.notice_count,
            advisory_count: directory.advisory_count,
            source_summary,
            routes,
        }
    }

    pub(crate) fn world_entry_state(&self) -> WorldEntryState {
        let directory = self.world_directory_snapshot();
        self.world_entry_state_from_directory(directory)
    }

    fn world_safety_snapshot_from_governance(
        &self,
        snapshot: &GovernanceSnapshot,
    ) -> WorldSafetySnapshot {
        let mut stewards = snapshot
            .world_stewards
            .iter()
            .map(|item| item.0.clone())
            .collect::<Vec<_>>();
        stewards.sort();
        let mut city_trust = snapshot.city_trust.clone();
        city_trust.sort_by_key(|item| item.city_id.0.clone());
        let mut advisories = snapshot.safety_advisories.clone();
        advisories.sort_by_key(|item| item.issued_at_ms);
        let mut reports = snapshot.safety_reports.clone();
        reports.sort_by_key(|item| item.submitted_at_ms);
        let mut resident_sanctions = snapshot.resident_sanctions.clone();
        resident_sanctions.sort_by_key(|item| item.issued_at_ms);
        let mut registration_blacklist = snapshot.registration_blacklist.clone();
        registration_blacklist.sort_by_key(|item| {
            (
                item.handle_kind.clone(),
                item.hash_sha256.clone(),
                item.added_at_ms,
            )
        });
        WorldSafetySnapshot {
            stewards,
            city_trust,
            advisories,
            reports,
            resident_sanctions,
            registration_blacklist,
            mirrors: self.world_directory_mirrors_from_snapshot(snapshot),
        }
    }

    pub(crate) fn world_safety_snapshot(&self) -> WorldSafetySnapshot {
        let snapshot = self.federated_governance_snapshot();
        self.world_safety_snapshot_from_governance(&snapshot)
    }

    fn mirror_source_statuses_from_fetches(
        &self,
        fetches: &[RemoteWorldSnapshotFetch],
    ) -> Vec<MirrorSourceStatus> {
        let mut statuses = fetches
            .iter()
            .map(|item| MirrorSourceStatus {
                base_url: item.base_url.clone(),
                source_kind: item.source_kind.clone(),
                enabled: item.enabled,
                reachable: item.reachable,
                city_count: item
                    .bundle
                    .as_ref()
                    .map(|bundle| bundle.payload.directory.city_count)
                    .unwrap_or(0),
                notice_count: item
                    .bundle
                    .as_ref()
                    .map(|bundle| bundle.payload.square.len())
                    .unwrap_or(0),
                advisory_count: item
                    .bundle
                    .as_ref()
                    .map(|bundle| bundle.payload.safety.advisories.len())
                    .unwrap_or(0),
                last_snapshot_at_ms: item
                    .bundle
                    .as_ref()
                    .map(|bundle| bundle.meta.generated_at_ms),
            })
            .collect::<Vec<_>>();

        statuses.sort_by_key(|item| (item.source_kind.clone(), item.base_url.clone()));
        statuses
    }

    pub(crate) fn world_mirror_source_statuses(&self) -> Vec<MirrorSourceStatus> {
        let fetches = self.collect_remote_world_snapshot_fetches();
        self.mirror_source_statuses_from_fetches(&fetches)
    }

    pub(crate) fn world_directory_mirrors(&self) -> Vec<DirectoryMirrorRecord> {
        let snapshot = self.federated_governance_snapshot();
        self.world_directory_mirrors_from_snapshot(&snapshot)
    }

    pub(crate) fn world_snapshot_bundle(&self) -> WorldSnapshotBundle {
        let remote_fetches = self.collect_remote_world_snapshot_fetches();
        let governance = self.federated_governance_snapshot_from_fetches(&remote_fetches);
        let residents = GatewayRuntime::resident_directory(&governance);
        let directory = self.world_directory_snapshot_from_governance(&governance);
        let square = governance.world_square_notices.clone();
        let safety = self.world_safety_snapshot_from_governance(&governance);
        let mirror_sources = self.mirror_source_statuses_from_fetches(&remote_fetches);
        let payload = WorldSnapshotPayload {
            governance,
            residents,
            directory,
            square,
            safety,
            mirror_sources,
        };
        let generated_at_ms = GatewayRuntime::now_ms();
        let world_id = payload.governance.world.world_id.0.clone();
        let world_title = payload.governance.world.title.clone();
        let checksum_sha256 = GatewayRuntime::checksum_hex(&payload);
        WorldSnapshotBundle {
            meta: WorldSnapshotMeta {
                snapshot_id: format!("snapshot-{generated_at_ms}"),
                generated_at_ms,
                world_id,
                world_title,
                checksum_sha256,
            },
            payload,
        }
    }
}

impl GatewayRuntime {
    pub(crate) fn world_entry_state(&self) -> WorldEntryState {
        self.federation_read_plan().world_entry_state()
    }
}
