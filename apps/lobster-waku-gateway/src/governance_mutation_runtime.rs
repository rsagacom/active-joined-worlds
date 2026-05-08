use super::*;

impl GatewayRuntime {
    pub(crate) fn publish_world_notice(
        &mut self,
        request: PublishWorldNoticeRequest,
    ) -> Result<WorldSquareNotice, String> {
        let actor_id = IdentityId(request.actor_id);
        if !self.actor_is_world_steward(&actor_id) {
            return Err("actor lacks world-steward permission".into());
        }
        let title = request.title.trim();
        let body = request.body.trim();
        if title.is_empty() || body.is_empty() {
            return Err("world notice requires title and body".into());
        }
        let notice = WorldSquareNotice {
            notice_id: format!("notice:{}", self.next_message_id()),
            title: title.into(),
            body: body.into(),
            author_id: actor_id,
            posted_at_ms: Self::now_ms(),
            severity: request
                .severity
                .unwrap_or_else(|| "info".into())
                .trim()
                .to_lowercase(),
            tags: request.tags.unwrap_or_default(),
        };
        self.world_square_notices.push(notice.clone());
        self.persist_governance_state()?;
        Ok(notice)
    }

    pub(crate) fn update_city_trust(
        &mut self,
        request: UpdateCityTrustRequest,
    ) -> Result<CityTrustRecord, String> {
        let actor_id = IdentityId(request.actor_id);
        if !self.actor_is_world_steward(&actor_id) {
            return Err("actor lacks world-steward permission".into());
        }
        let Some(city_id) = self.resolve_city_id(&request.city) else {
            return Err(format!("unknown city: {}", request.city));
        };
        let record = CityTrustRecord {
            city_id: city_id.clone(),
            state: request.state,
            reason: request.reason,
            updated_by: actor_id.clone(),
            updated_at_ms: Self::now_ms(),
        };
        if let Some(existing) = self
            .city_trust
            .iter_mut()
            .find(|item| item.city_id == city_id)
        {
            *existing = record.clone();
        } else {
            self.city_trust.push(record.clone());
        }
        self.persist_governance_state()?;
        if matches!(
            record.state,
            CityTrustState::UnderReview | CityTrustState::Quarantined | CityTrustState::Isolated
        ) {
            let advisory = WorldSafetyAdvisory {
                advisory_id: format!("advisory:{}", self.next_message_id()),
                subject_kind: "city".into(),
                subject_ref: record.city_id.0.clone(),
                action: format!("{:?}", record.state),
                reason: record
                    .reason
                    .clone()
                    .unwrap_or_else(|| "world safety intervention".into()),
                issued_by: actor_id,
                issued_at_ms: Self::now_ms(),
                expires_at_ms: None,
            };
            self.safety_advisories.push(advisory);
            self.persist_governance_state()?;
        }
        Ok(record)
    }

    pub(crate) fn publish_safety_advisory(
        &mut self,
        request: PublishSafetyAdvisoryRequest,
    ) -> Result<WorldSafetyAdvisory, String> {
        let actor_id = IdentityId(request.actor_id);
        if !self.actor_is_world_steward(&actor_id) {
            return Err("actor lacks world-steward permission".into());
        }
        if request.subject_kind.trim().is_empty()
            || request.subject_ref.trim().is_empty()
            || request.action.trim().is_empty()
            || request.reason.trim().is_empty()
        {
            return Err(
                "safety advisory requires subject_kind, subject_ref, action, and reason".into(),
            );
        }
        let advisory = WorldSafetyAdvisory {
            advisory_id: format!("advisory:{}", self.next_message_id()),
            subject_kind: request.subject_kind.trim().into(),
            subject_ref: request.subject_ref.trim().into(),
            action: request.action.trim().into(),
            reason: request.reason.trim().into(),
            issued_by: actor_id,
            issued_at_ms: Self::now_ms(),
            expires_at_ms: request.expires_at_ms,
        };
        self.safety_advisories.push(advisory.clone());
        self.persist_governance_state()?;
        Ok(advisory)
    }

    pub(crate) fn submit_safety_report(
        &mut self,
        request: SubmitSafetyReportRequest,
    ) -> Result<WorldSafetyReport, String> {
        if request.target_kind.trim().is_empty()
            || request.target_ref.trim().is_empty()
            || request.summary.trim().is_empty()
        {
            return Err("safety report requires target_kind, target_ref, and summary".into());
        }

        let city_id = if let Some(city) = request.city.as_ref() {
            Some(
                self.resolve_city_id(city)
                    .ok_or_else(|| format!("unknown city: {city}"))?,
            )
        } else {
            None
        };

        let report = WorldSafetyReport {
            report_id: format!("report:{}", self.next_message_id()),
            target_kind: request.target_kind.trim().into(),
            target_ref: request.target_ref.trim().into(),
            city_id,
            reporter_id: IdentityId(request.reporter_id),
            summary: request.summary.trim().into(),
            evidence: request.evidence.unwrap_or_default(),
            status: WorldSafetyReportStatus::Submitted,
            submitted_at_ms: Self::now_ms(),
            reviewed_at_ms: None,
            reviewed_by: None,
            resolution: None,
        };
        self.safety_reports.push(report.clone());
        self.persist_governance_state()?;
        Ok(report)
    }

    pub(crate) fn review_safety_report(
        &mut self,
        request: ReviewSafetyReportRequest,
    ) -> Result<WorldSafetyReport, String> {
        let actor_id = IdentityId(request.actor_id.clone());
        if !self.actor_is_world_steward(&actor_id) {
            return Err("actor lacks world-steward permission".into());
        }
        let Some(report_index) = self
            .safety_reports
            .iter()
            .position(|item| item.report_id == request.report_id)
        else {
            return Err(format!("unknown safety report: {}", request.report_id));
        };

        let city_id = self.safety_reports[report_index].city_id.clone();
        let default_reason = self.safety_reports[report_index].summary.clone();
        self.safety_reports[report_index].status = request.status;
        self.safety_reports[report_index].reviewed_at_ms = Some(Self::now_ms());
        self.safety_reports[report_index].reviewed_by = Some(actor_id.clone());
        self.safety_reports[report_index].resolution = request.resolution.clone();
        let reviewed = self.safety_reports[report_index].clone();
        self.persist_governance_state()?;

        if let Some(city_state) = request.city_state {
            let Some(city_id) = city_id else {
                return Err("report is not linked to a city".into());
            };
            let trust_reason = request.resolution.clone().unwrap_or(default_reason);
            self.update_city_trust(UpdateCityTrustRequest {
                actor_id: request.actor_id.clone(),
                city: city_id.0.clone(),
                state: city_state,
                reason: Some(trust_reason),
            })?;
            let should_cascade = request
                .cascade_resident_sanctions
                .unwrap_or(matches!(city_state, CityTrustState::Isolated));
            if should_cascade
                && matches!(
                    city_state,
                    CityTrustState::Quarantined | CityTrustState::Isolated
                )
            {
                self.cascade_city_resident_sanctions(
                    &city_id,
                    &actor_id,
                    Some(reviewed.report_id.clone()),
                    reviewed
                        .resolution
                        .clone()
                        .unwrap_or_else(|| reviewed.summary.clone()),
                    request.blacklist_registered_handles.unwrap_or(true),
                )?;
            }
        }

        Ok(reviewed)
    }

    pub(crate) fn insert_registration_blacklist_entry(
        &mut self,
        resident_id: &IdentityId,
        report_id: Option<String>,
        handle_kind: &str,
        hash_sha256: String,
        reason: &str,
        actor_id: &IdentityId,
    ) {
        if self
            .registration_blacklist
            .iter()
            .any(|entry| entry.handle_kind == handle_kind && entry.hash_sha256 == hash_sha256)
        {
            return;
        }
        let entry_id = format!("blacklist:{}", self.next_message_id());
        let added_at_ms = Self::now_ms();
        self.registration_blacklist
            .push(RegistrationBlacklistEntry {
                entry_id,
                resident_id: resident_id.clone(),
                report_id,
                handle_kind: handle_kind.into(),
                hash_sha256,
                reason: reason.into(),
                added_by: actor_id.clone(),
                added_at_ms,
            });
    }

    pub(crate) fn cascade_city_resident_sanctions(
        &mut self,
        city_id: &CityId,
        actor_id: &IdentityId,
        report_id: Option<String>,
        reason: String,
        blacklist_registered_handles: bool,
    ) -> Result<usize, String> {
        let resident_ids = self
            .memberships
            .iter()
            .filter(|membership| {
                membership.city_id == *city_id && membership.state == MembershipState::Active
            })
            .map(|membership| membership.resident_id.clone())
            .collect::<Vec<_>>();

        let mut sanctioned_count = 0usize;
        for resident_id in resident_ids {
            let already_active = self.resident_sanctions.iter().any(|sanction| {
                sanction.resident_id == resident_id
                    && sanction.status == WorldResidentSanctionStatus::Active
            });
            if already_active {
                continue;
            }

            let registration = self
                .registrations
                .iter()
                .find(|item| item.resident_id == resident_id)
                .cloned();
            if blacklist_registered_handles
                && let Some(existing) = self
                    .registrations
                    .iter_mut()
                    .find(|item| item.resident_id == resident_id)
            {
                existing.state = ResidentRegistrationState::Suspended;
            }

            self.sanction_resident(SanctionResidentRequest {
                actor_id: actor_id.0.clone(),
                resident_id: resident_id.0.clone(),
                city: Some(city_id.0.clone()),
                report_id: report_id.clone(),
                reason: reason.clone(),
                email: blacklist_registered_handles
                    .then(|| registration.as_ref().map(|item| item.email.clone()))
                    .flatten(),
                mobile: None,
                device_physical_addresses: None,
                portability_revoked: Some(true),
            })?;
            if blacklist_registered_handles
                && let Some(mobile_hash_sha256) = registration
                    .as_ref()
                    .and_then(|item| item.mobile_hash_sha256.clone())
            {
                self.insert_registration_blacklist_entry(
                    &resident_id,
                    report_id.clone(),
                    "mobile",
                    mobile_hash_sha256,
                    &reason,
                    actor_id,
                );
            }
            if blacklist_registered_handles
                && let Some(device_hashes_sha256) = registration
                    .as_ref()
                    .map(|item| item.device_hashes_sha256.clone())
            {
                for device_hash_sha256 in device_hashes_sha256 {
                    self.insert_registration_blacklist_entry(
                        &resident_id,
                        report_id.clone(),
                        "device",
                        device_hash_sha256,
                        &reason,
                        actor_id,
                    );
                }
            }
            sanctioned_count += 1;
        }

        if blacklist_registered_handles {
            self.persist_auth_state()?;
            self.persist_governance_state()?;
        }

        Ok(sanctioned_count)
    }

    pub(crate) fn sanction_resident(
        &mut self,
        request: SanctionResidentRequest,
    ) -> Result<WorldResidentSanction, String> {
        let actor_id = IdentityId(request.actor_id.clone());
        if !self.actor_is_world_steward(&actor_id) {
            return Err("actor lacks world-steward permission".into());
        }
        if request.reason.trim().is_empty() {
            return Err("resident sanction requires reason".into());
        }

        let resident_id = IdentityId(request.resident_id.clone());
        let city_id = if let Some(city) = request.city.as_ref() {
            Some(
                self.resolve_city_id(city)
                    .ok_or_else(|| format!("unknown city: {city}"))?,
            )
        } else {
            None
        };
        let portability_revoked = request.portability_revoked.unwrap_or(true);
        let sanction = WorldResidentSanction {
            sanction_id: format!("resident-sanction:{}", self.next_message_id()),
            resident_id: resident_id.clone(),
            city_id,
            report_id: request.report_id.clone(),
            reason: request.reason.trim().into(),
            portability_revoked,
            status: WorldResidentSanctionStatus::Active,
            issued_by: actor_id.clone(),
            issued_at_ms: Self::now_ms(),
            lifted_at_ms: None,
        };
        self.resident_sanctions.push(sanction.clone());

        let mut blacklist_entries = Vec::new();
        if let Some(email) = request.email.as_deref().and_then(Self::normalize_email) {
            blacklist_entries.push(("email".to_string(), email));
        }
        if let Some(mobile) = request.mobile.as_deref().and_then(Self::normalize_mobile) {
            blacklist_entries.push(("mobile".to_string(), mobile));
        }
        if let Some(device_physical_addresses) = request.device_physical_addresses.as_ref() {
            for normalized in device_physical_addresses
                .iter()
                .filter_map(|value| Self::normalize_device_physical_address(value))
            {
                blacklist_entries.push(("device".to_string(), normalized));
            }
        }

        for (handle_kind, normalized) in blacklist_entries {
            let hash_sha256 = Self::hash_registration_handle(&handle_kind, &normalized);
            self.insert_registration_blacklist_entry(
                &resident_id,
                request.report_id.clone(),
                &handle_kind,
                hash_sha256,
                request.reason.trim(),
                &actor_id,
            );
        }

        self.persist_governance_state()?;
        Ok(sanction)
    }
}
