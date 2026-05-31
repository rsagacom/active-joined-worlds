use super::*;
use sha2::{Digest, Sha256};
use std::collections::BTreeSet;

impl GatewayRuntime {
    pub(crate) fn normalize_email(value: &str) -> Option<String> {
        let normalized = value.trim().to_lowercase();
        if normalized.is_empty() || !normalized.contains('@') {
            None
        } else {
            Some(normalized)
        }
    }

    pub(crate) fn normalize_mobile(value: &str) -> Option<String> {
        let normalized = value
            .chars()
            .filter(|ch| ch.is_ascii_digit())
            .collect::<String>();
        if normalized.len() < 6 {
            None
        } else {
            Some(normalized)
        }
    }

    pub(crate) fn normalize_resident_handle(value: &str) -> Option<String> {
        let normalized = value
            .trim()
            .to_lowercase()
            .chars()
            .map(|ch| {
                if ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' {
                    ch
                } else {
                    '-'
                }
            })
            .collect::<String>()
            .trim_matches('-')
            .to_string();
        if normalized.is_empty() {
            None
        } else {
            Some(normalized)
        }
    }

    pub(crate) fn normalize_device_physical_address(value: &str) -> Option<String> {
        let normalized = value
            .chars()
            .filter(|ch| ch.is_ascii_hexdigit())
            .collect::<String>()
            .to_lowercase();
        if normalized.len() < 8 {
            None
        } else {
            Some(normalized)
        }
    }

    pub(crate) fn hash_registration_handle(handle_kind: &str, normalized: &str) -> String {
        let mut digest = Sha256::new();
        digest.update(handle_kind.as_bytes());
        digest.update(b":");
        digest.update(normalized.as_bytes());
        hex::encode(digest.finalize())
    }

    pub(crate) fn mask_email(email: &str) -> String {
        let Some((local, domain)) = email.split_once('@') else {
            return "***".into();
        };
        let head = local.chars().next().unwrap_or('*');
        format!("{head}***@{domain}")
    }

    pub(crate) fn dev_email_otp_inline_enabled() -> bool {
        cfg!(test)
            || std::env::var("LOBSTER_DEV_EMAIL_OTP_INLINE")
                .map(|value| value == "1" || value.eq_ignore_ascii_case("true"))
                .unwrap_or(false)
    }

    pub(crate) fn registration_blacklist_hit(
        &self,
        handle_kind: &str,
        normalized: &str,
    ) -> Option<&RegistrationBlacklistEntry> {
        let hash_sha256 = Self::hash_registration_handle(handle_kind, normalized);
        self.registration_blacklist
            .iter()
            .find(|entry| entry.handle_kind == handle_kind && entry.hash_sha256 == hash_sha256)
    }

    pub(crate) fn auth_preflight(
        &self,
        request: AuthPreflightRequest,
    ) -> Result<AuthPreflightResponse, String> {
        let normalized_email = Self::normalize_email(&request.email)
            .ok_or_else(|| "valid email required".to_string())?;
        let normalized_mobile = request.mobile.as_deref().and_then(Self::normalize_mobile);
        let normalized_device_physical_address = request
            .device_physical_address
            .as_deref()
            .and_then(Self::normalize_device_physical_address);

        let mut blocked_reasons = Vec::new();
        if self
            .registration_blacklist_hit("email", &normalized_email)
            .is_some()
        {
            blocked_reasons.push("email is world-blacklisted".into());
        }
        if let Some(mobile) = normalized_mobile.as_deref()
            && self.registration_blacklist_hit("mobile", mobile).is_some()
        {
            blocked_reasons.push("mobile is world-blacklisted".into());
        }
        if let Some(device) = normalized_device_physical_address.as_deref()
            && self.registration_blacklist_hit("device", device).is_some()
        {
            blocked_reasons.push("device physical address is world-blacklisted".into());
        }

        Ok(AuthPreflightResponse {
            allowed: blocked_reasons.is_empty(),
            normalized_email: Some(normalized_email),
            normalized_mobile,
            normalized_device_physical_address,
            blocked_reasons,
        })
    }

    pub(crate) fn purge_expired_email_otp_challenges(&mut self) {
        let now_ms = Self::now_ms();
        self.email_otp_challenges.retain(|challenge| {
            challenge.consumed_at_ms.is_none() && challenge.expires_at_ms >= now_ms
        });
    }

    pub(crate) fn generate_email_otp_code(&mut self) -> String {
        let seed = format!("{}:{}", self.next_message_id(), Self::now_ms());
        let digest = Sha256::digest(seed.as_bytes());
        let number = u32::from_be_bytes([digest[0], digest[1], digest[2], digest[3]]) % 1_000_000;
        format!("{number:06}")
    }

    pub(crate) fn hash_session_token(token: &str) -> String {
        Self::hash_registration_handle("session-token", token)
    }

    pub(crate) fn issue_auth_session(
        &mut self,
        resident_id: &IdentityId,
        challenge_id: &str,
        now_ms: i64,
    ) -> (String, AuthSessionView) {
        self.auth_sessions
            .retain(|session| session.revoked_at_ms.is_none() && session.expires_at_ms >= now_ms);
        let entropy = format!(
            "{}:{}:{}:{}",
            challenge_id,
            resident_id.0,
            now_ms,
            self.next_message_id()
        );
        let token_body = hex::encode(Sha256::digest(entropy.as_bytes()));
        let session_token = format!("lbst_{token_body}");
        let session_id = format!("session:{}", self.next_message_id());
        let expires_at_ms = now_ms + 30 * 24 * 60 * 60 * 1000;
        let session = AuthSession {
            session_id: session_id.clone(),
            token_hash_sha256: Self::hash_session_token(&session_token),
            resident_id: resident_id.clone(),
            issued_at_ms: now_ms,
            expires_at_ms,
            revoked_at_ms: None,
        };
        self.auth_sessions.push(session);
        (
            session_token,
            AuthSessionView {
                session_id,
                resident_id: resident_id.0.clone(),
                issued_at_ms: now_ms,
                expires_at_ms,
            },
        )
    }

    pub(crate) fn validate_bearer_session_actor(
        &self,
        token: &str,
        actor: &IdentityId,
    ) -> Result<(), String> {
        let token = token.trim();
        if token.is_empty() {
            return Err("authorization bearer token required".into());
        }
        let token_hash_sha256 = Self::hash_session_token(token);
        let now_ms = Self::now_ms();
        let Some(session) = self
            .auth_sessions
            .iter()
            .find(|session| session.token_hash_sha256 == token_hash_sha256)
        else {
            return Err("invalid or expired session".into());
        };
        if session.revoked_at_ms.is_some() || session.expires_at_ms < now_ms {
            return Err("invalid or expired session".into());
        }
        if session.resident_id != *actor {
            return Err(format!(
                "sender {} does not match authenticated session {}",
                actor.0, session.resident_id.0
            ));
        }
        Ok(())
    }

    pub(crate) fn resolve_bearer_session(&self, token: &str) -> Result<AuthSession, String> {
        let token = token.trim();
        if token.is_empty() {
            return Err("authorization bearer token required".into());
        }
        let token_hash_sha256 = Self::hash_session_token(token);
        let now_ms = Self::now_ms();
        let Some(session) = self
            .auth_sessions
            .iter()
            .find(|session| session.token_hash_sha256 == token_hash_sha256)
        else {
            return Err("invalid or expired session".into());
        };
        if session.revoked_at_ms.is_some() || session.expires_at_ms < now_ms {
            return Err("invalid or expired session".into());
        }
        Ok(session.clone())
    }

    pub(crate) fn auth_session_projection(
        &self,
        token: &str,
    ) -> Result<AuthSessionResponse, String> {
        let session = self.resolve_bearer_session(token)?;
        let resident_id = session.resident_id.clone();
        let mut roles = BTreeSet::from(["resident".to_string()]);
        let mut capabilities = BTreeSet::from([
            "direct.open".to_string(),
            "export.own".to_string(),
            "shell.message.edit_own".to_string(),
            "shell.message.recall_own".to_string(),
            "shell.message.send".to_string(),
        ]);
        if self.actor_is_world_steward(&resident_id) {
            roles.insert("world_steward".into());
            capabilities.extend([
                "world.notice.publish".to_string(),
                "world.safety.advisory.publish".to_string(),
                "world.safety.resident.sanction".to_string(),
                "world.safety.review".to_string(),
                "world.trust.update".to_string(),
            ]);
        }

        let mut city_roles = Vec::new();
        for membership in self.memberships.iter().filter(|membership| {
            membership.resident_id == resident_id && membership.state == MembershipState::Active
        }) {
            match membership.role {
                CityRole::Lord => {
                    roles.insert("city_lord".into());
                }
                CityRole::Steward => {
                    roles.insert("steward".into());
                }
                CityRole::Resident => {}
            }
            let permissions = membership
                .role
                .permissions()
                .iter()
                .map(|permission| format!("city.{permission:?}").to_lowercase())
                .collect::<Vec<_>>();
            capabilities.extend(permissions.iter().cloned());
            city_roles.push(AuthSessionCityRole {
                city_id: membership.city_id.0.clone(),
                role: format!("{:?}", membership.role).to_lowercase(),
                permissions,
            });
        }
        city_roles.sort_by(|left, right| left.city_id.cmp(&right.city_id));

        Ok(AuthSessionResponse {
            authenticated: true,
            resident_id: resident_id.0.clone(),
            session: AuthSessionView {
                session_id: session.session_id,
                resident_id: resident_id.0,
                issued_at_ms: session.issued_at_ms,
                expires_at_ms: session.expires_at_ms,
            },
            roles: roles.into_iter().collect(),
            capabilities: capabilities.into_iter().collect(),
            city_roles,
        })
    }

    pub(crate) fn derive_resident_id_from_email(&self, email: &str) -> IdentityId {
        let local = email.split('@').next().unwrap_or("resident");
        let base = Self::normalize_resident_handle(local).unwrap_or_else(|| "resident".into());
        if self
            .registrations
            .iter()
            .all(|item| item.resident_id.0 != base)
        {
            return IdentityId(base);
        }
        let suffix = Self::now_ms().rem_euclid(100_000);
        IdentityId(format!("{base}-{suffix}"))
    }

    pub(crate) fn request_email_otp(
        &mut self,
        request: RequestEmailOtpRequest,
    ) -> Result<RequestEmailOtpResponse, String> {
        let preflight = self.auth_preflight(AuthPreflightRequest {
            email: request.email,
            mobile: request.mobile.clone(),
            device_physical_address: request.device_physical_address.clone(),
        })?;
        if !preflight.allowed {
            return Err(preflight.blocked_reasons.join("; "));
        }

        let normalized_email = preflight
            .normalized_email
            .ok_or_else(|| "valid email required".to_string())?;
        let normalized_mobile = preflight.normalized_mobile;
        let normalized_device_physical_address = preflight.normalized_device_physical_address;
        let desired_resident_id = request
            .resident_id
            .as_deref()
            .and_then(Self::normalize_resident_handle)
            .map(IdentityId);

        if let Some(resident_id) = desired_resident_id.as_ref()
            && let Some(existing) = self
                .registrations
                .iter()
                .find(|item| item.resident_id == *resident_id)
            && existing.email != normalized_email
        {
            return Err(format!(
                "resident id {} is already bound to another email",
                resident_id.0
            ));
        }

        self.purge_expired_email_otp_challenges();
        self.email_otp_challenges.retain(|challenge| {
            challenge.email != normalized_email || challenge.consumed_at_ms.is_some()
        });

        let code = self.generate_email_otp_code();
        let challenge = EmailOtpChallenge {
            challenge_id: format!("otp:{}", self.next_message_id()),
            email: normalized_email.clone(),
            mobile_hash_sha256: normalized_mobile
                .as_deref()
                .map(|mobile| Self::hash_registration_handle("mobile", mobile)),
            device_hash_sha256: normalized_device_physical_address
                .as_deref()
                .map(|device| Self::hash_registration_handle("device", device)),
            desired_resident_id,
            code_hash_sha256: Self::hash_registration_handle("otp", &code),
            requested_at_ms: Self::now_ms(),
            expires_at_ms: Self::now_ms() + 10 * 60 * 1000,
            consumed_at_ms: None,
        };
        let response = RequestEmailOtpResponse {
            challenge_id: challenge.challenge_id.clone(),
            masked_email: Self::mask_email(&challenge.email),
            expires_at_ms: challenge.expires_at_ms,
            delivery_mode: if Self::dev_email_otp_inline_enabled() {
                "inline-dev".into()
            } else {
                "mailer-adapter-pending".into()
            },
            dev_code: Self::dev_email_otp_inline_enabled().then_some(code),
        };
        self.email_otp_challenges.push(challenge);
        self.persist_auth_state()?;
        Ok(response)
    }

    pub(crate) fn verify_email_otp(
        &mut self,
        request: VerifyEmailOtpRequest,
    ) -> Result<VerifyEmailOtpResponse, String> {
        self.purge_expired_email_otp_challenges();
        let Some(challenge_index) = self
            .email_otp_challenges
            .iter()
            .position(|challenge| challenge.challenge_id == request.challenge_id)
        else {
            return Err("unknown otp challenge".into());
        };

        let now_ms = Self::now_ms();
        let challenge = self.email_otp_challenges[challenge_index].clone();
        if challenge.consumed_at_ms.is_some() {
            return Err("otp challenge already consumed".into());
        }
        if challenge.expires_at_ms < now_ms {
            return Err("otp challenge expired".into());
        }

        let provided_code = request.code.trim();
        if provided_code.len() != 6
            || Self::hash_registration_handle("otp", provided_code) != challenge.code_hash_sha256
        {
            return Err("invalid otp code".into());
        }

        if self
            .registration_blacklist_hit("email", &challenge.email)
            .is_some()
        {
            return Err("email is world-blacklisted".into());
        }
        if let Some(mobile_hash) = challenge.mobile_hash_sha256.as_ref()
            && self
                .registration_blacklist
                .iter()
                .any(|entry| entry.handle_kind == "mobile" && entry.hash_sha256 == *mobile_hash)
        {
            return Err("mobile is world-blacklisted".into());
        }
        if let Some(device_hash) = challenge.device_hash_sha256.as_ref()
            && self
                .registration_blacklist
                .iter()
                .any(|entry| entry.handle_kind == "device" && entry.hash_sha256 == *device_hash)
        {
            return Err("device physical address is world-blacklisted".into());
        }

        let requested_resident_id = request
            .resident_id
            .as_deref()
            .and_then(Self::normalize_resident_handle)
            .map(IdentityId);
        if let (Some(requested), Some(expected)) = (
            requested_resident_id.as_ref(),
            challenge.desired_resident_id.as_ref(),
        ) && requested != expected
        {
            return Err("resident id does not match the issued otp challenge".into());
        }

        let existing_by_email = self
            .registrations
            .iter()
            .position(|item| item.email == challenge.email);
        let resident_id = if let Some(index) = existing_by_email {
            self.registrations[index].resident_id.clone()
        } else if let Some(expected) = challenge.desired_resident_id.clone() {
            expected
        } else if let Some(requested) = requested_resident_id {
            requested
        } else {
            self.derive_resident_id_from_email(&challenge.email)
        };

        if let Some(existing) = self
            .registrations
            .iter()
            .find(|item| item.resident_id == resident_id && item.email != challenge.email)
        {
            return Err(format!(
                "resident id {} is already bound to {}",
                resident_id.0, existing.email
            ));
        }

        let email_hash_sha256 = Self::hash_registration_handle("email", &challenge.email);
        let mobile_hash_sha256 = challenge.mobile_hash_sha256.clone();

        let registration = if let Some(existing) = self
            .registrations
            .iter_mut()
            .find(|item| item.email == challenge.email || item.resident_id == resident_id)
        {
            existing.resident_id = resident_id.clone();
            existing.email = challenge.email.clone();
            existing.email_hash_sha256 = email_hash_sha256;
            existing.mobile_hash_sha256 = mobile_hash_sha256.clone();
            if let Some(device_hash_sha256) = challenge.device_hash_sha256.clone()
                && !existing
                    .device_hashes_sha256
                    .iter()
                    .any(|item| item == &device_hash_sha256)
            {
                existing.device_hashes_sha256.push(device_hash_sha256);
            }
            existing.state = ResidentRegistrationState::Active;
            existing.verified_at_ms = now_ms;
            existing.last_login_at_ms = now_ms;
            existing.clone()
        } else {
            let registration = ResidentRegistration {
                resident_id: resident_id.clone(),
                email: challenge.email.clone(),
                email_hash_sha256,
                mobile_hash_sha256,
                device_hashes_sha256: challenge.device_hash_sha256.clone().into_iter().collect(),
                state: ResidentRegistrationState::Active,
                created_at_ms: now_ms,
                verified_at_ms: now_ms,
                last_login_at_ms: now_ms,
            };
            self.registrations.push(registration.clone());
            registration
        };

        self.ensure_verified_resident_guide_conversation(&registration.resident_id)?;
        self.email_otp_challenges[challenge_index].consumed_at_ms = Some(now_ms);
        let (session_token, session) =
            self.issue_auth_session(&registration.resident_id, &challenge.challenge_id, now_ms);
        self.persist_auth_state()?;

        Ok(VerifyEmailOtpResponse {
            resident_id: registration.resident_id.0,
            email_masked: Self::mask_email(&registration.email),
            email: registration.email,
            state: registration.state,
            created_at_ms: registration.created_at_ms,
            verified_at_ms: registration.verified_at_ms,
            last_login_at_ms: registration.last_login_at_ms,
            token_type: "Bearer".into(),
            session_token,
            session,
        })
    }
}
