use super::*;
use crate::email_otp_mailer::EmailOtpDelivery;
#[cfg(test)]
use crate::email_otp_mailer::deliver_email_otp_from_env;
use sha2::{Digest, Sha256};
use std::collections::BTreeSet;

#[derive(Debug)]
pub(crate) struct PreparedEmailOtpRequest {
    pub(crate) response: RequestEmailOtpResponse,
    pub(crate) delivery: Option<EmailOtpDelivery>,
    pub(crate) normalized_email: String,
}

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

        // Device check: optional, for admin-controlled devices. User registration uses email.
        if let Some(device) = normalized_device_physical_address.as_deref()
            && let Some(record) = self.allowed_devices.get(device)
            && record.blocked
        {
            blocked_reasons
                .push("device blocked: this device has been blocked by the administrator".into());
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

    fn secure_random_bytes<const N: usize>() -> Result<[u8; N], String> {
        let mut bytes = [0u8; N];
        getrandom::getrandom(&mut bytes)
            .map_err(|error| format!("secure random source unavailable: {error}"))?;
        Ok(bytes)
    }

    fn secure_random_hex<const N: usize>() -> Result<String, String> {
        Ok(hex::encode(Self::secure_random_bytes::<N>()?))
    }

    pub(crate) fn generate_email_otp_code(&mut self) -> Result<String, String> {
        // Reject the small modulo-bias tail so every six-digit code has equal weight.
        const OTP_SPACE: u32 = 1_000_000;
        let limit = u32::MAX - (u32::MAX % OTP_SPACE);
        loop {
            let bytes = Self::secure_random_bytes::<4>()?;
            let number = u32::from_be_bytes(bytes);
            if number < limit {
                return Ok(format!("{:06}", number % OTP_SPACE));
            }
        }
    }

    pub(crate) fn hash_session_token(token: &str) -> String {
        Self::hash_registration_handle("session-token", token)
    }

    fn try_issue_auth_session(
        &mut self,
        resident_id: &IdentityId,
        _challenge_id: &str,
        now_ms: i64,
    ) -> Result<(String, AuthSessionView), String> {
        self.auth_sessions
            .retain(|session| session.revoked_at_ms.is_none() && session.expires_at_ms >= now_ms);
        let token_body = Self::secure_random_hex::<32>()?;
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
        Ok((
            session_token,
            AuthSessionView {
                session_id,
                resident_id: resident_id.0.clone(),
                issued_at_ms: now_ms,
                expires_at_ms,
            },
        ))
    }

    #[cfg(test)]
    pub(crate) fn issue_auth_session(
        &mut self,
        resident_id: &IdentityId,
        challenge_id: &str,
        now_ms: i64,
    ) -> (String, AuthSessionView) {
        self.try_issue_auth_session(resident_id, challenge_id, now_ms)
            .expect("secure random source unavailable in auth session test helper")
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

    pub(crate) fn revoke_auth_session(&mut self, token: &str) -> Result<(), String> {
        let token = token.trim();
        if token.is_empty() {
            return Err("authorization bearer token required".into());
        }
        let token_hash_sha256 = Self::hash_session_token(token);
        let now_ms = Self::now_ms();
        let Some(session) = self
            .auth_sessions
            .iter_mut()
            .find(|session| session.token_hash_sha256 == token_hash_sha256)
        else {
            return Err("session not found".into());
        };
        if session.revoked_at_ms.is_some() {
            return Err("session already revoked".into());
        }
        session.revoked_at_ms = Some(now_ms);
        self.persist_auth_state()?;
        Ok(())
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

    #[cfg(test)]
    pub(crate) fn request_email_otp(
        &mut self,
        request: RequestEmailOtpRequest,
    ) -> Result<RequestEmailOtpResponse, String> {
        let inline_delivery = Self::dev_email_otp_inline_enabled();
        let prepared = self.prepare_email_otp_request(request, inline_delivery)?;
        if let Some(delivery) = prepared.delivery.as_ref()
            && let Err(error) = deliver_email_otp_from_env(delivery)
        {
            self.rollback_email_otp_request(
                &prepared.response.challenge_id,
                &prepared.normalized_email,
            )?;
            return Err(error);
        }
        Ok(prepared.response)
    }

    pub(crate) fn prepare_email_otp_request(
        &mut self,
        request: RequestEmailOtpRequest,
        inline_delivery: bool,
    ) -> Result<PreparedEmailOtpRequest, String> {
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
        // Bind device to resident ID when both are present
        if let (Some(device), Some(resident_id)) = (
            normalized_device_physical_address.as_deref(),
            request.resident_id.as_deref(),
        ) {
            self.bind_device_to_resident(device, resident_id)?;
        }
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

        if let Some(retry_ms) = self.check_rate_limit(&format!("otp-req:{}", normalized_email), 1) {
            return Err(format!(
                "too many otp requests for this email, retry in {}s",
                (retry_ms / 1000).max(1)
            ));
        }

        self.purge_expired_email_otp_challenges();
        self.email_otp_challenges.retain(|challenge| {
            challenge.email != normalized_email || challenge.consumed_at_ms.is_some()
        });

        let code = self.generate_email_otp_code()?;
        let challenge = EmailOtpChallenge {
            challenge_id: format!("otp:{}", Self::secure_random_hex::<16>()?),
            email: normalized_email.clone(),
            mobile_hash_sha256: normalized_mobile
                .as_deref()
                .map(|mobile| Self::hash_registration_handle("mobile", mobile)),
            device_hash_sha256: normalized_device_physical_address
                .as_deref()
                .map(|device| Self::hash_registration_handle("device", device)),
            desired_resident_id,
            desired_nickname: request.nickname.clone(),
            code_hash_sha256: Self::hash_registration_handle("otp", &code),
            requested_at_ms: Self::now_ms(),
            expires_at_ms: Self::now_ms() + 10 * 60 * 1000,
            consumed_at_ms: None,
        };
        let challenge_id = challenge.challenge_id.clone();
        let expires_at_ms = challenge.expires_at_ms;
        let masked_email = Self::mask_email(&challenge.email);
        self.email_otp_challenges.push(challenge);
        self.persist_auth_state()?;
        let delivery = (!inline_delivery).then_some(EmailOtpDelivery {
            to: normalized_email.clone(),
            code: code.clone(),
            challenge_id: challenge_id.clone(),
            expires_at_ms,
        });
        Ok(PreparedEmailOtpRequest {
            response: RequestEmailOtpResponse {
                challenge_id,
                masked_email,
                expires_at_ms,
                delivery_mode: if inline_delivery {
                    "inline-dev".into()
                } else {
                    "mailer-webhook".into()
                },
                dev_code: inline_delivery.then_some(code),
            },
            delivery,
            normalized_email,
        })
    }

    pub(crate) fn rollback_email_otp_request(
        &mut self,
        challenge_id: &str,
        normalized_email: &str,
    ) -> Result<bool, String> {
        let challenge_count = self.email_otp_challenges.len();
        self.email_otp_challenges
            .retain(|item| item.challenge_id != challenge_id);
        if self.email_otp_challenges.len() == challenge_count {
            return Ok(false);
        }

        self.rate_limits
            .remove(&format!("otp-req:{normalized_email}"));
        self.persist_auth_state()?;
        Ok(true)
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

        if let Some(retry_ms) =
            self.check_rate_limit(&format!("otp-verify:{}", request.challenge_id), 5)
        {
            return Err(format!(
                "too many otp verification attempts, retry in {}s",
                (retry_ms / 1000).max(1)
            ));
        }

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
            if challenge.desired_nickname.is_some() {
                existing.nickname = challenge.desired_nickname.clone();
            }
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
                nickname: challenge.desired_nickname.clone(),
            };
            self.registrations.push(registration.clone());
            registration
        };

        self.ensure_verified_resident_guide_conversation(&registration.resident_id)?;
        self.email_otp_challenges[challenge_index].consumed_at_ms = Some(now_ms);
        let (session_token, session) = self.try_issue_auth_session(
            &registration.resident_id,
            &challenge.challenge_id,
            now_ms,
        )?;
        self.persist_auth_state()?;

        Ok(VerifyEmailOtpResponse {
            resident_id: registration.resident_id.0,
            email_masked: Self::mask_email(&registration.email),
            email: registration.email,
            nickname: registration.nickname.clone(),
            state: registration.state,
            created_at_ms: registration.created_at_ms,
            verified_at_ms: registration.verified_at_ms,
            last_login_at_ms: registration.last_login_at_ms,
            token_type: "Bearer".into(),
            session_token,
            session,
        })
    }

    pub(crate) fn mask_mobile(mobile: &str) -> String {
        if mobile.len() <= 4 {
            return "***".into();
        }
        let head = mobile.chars().take(3).collect::<String>();
        let tail = mobile
            .chars()
            .rev()
            .take(4)
            .collect::<String>()
            .chars()
            .rev()
            .collect::<String>();
        format!("{head}****{tail}")
    }

    pub(crate) fn dev_mobile_otp_inline_enabled() -> bool {
        cfg!(test)
            || std::env::var("LOBSTER_DEV_MOBILE_OTP_INLINE")
                .map(|value| value == "1" || value.eq_ignore_ascii_case("true"))
                .unwrap_or(false)
    }

    pub(crate) fn request_mobile_otp(
        &mut self,
        request: RequestMobileOtpRequest,
    ) -> Result<RequestMobileOtpResponse, String> {
        let normalized_mobile = Self::normalize_mobile(&request.mobile)
            .ok_or_else(|| "valid mobile number required".to_string())?;

        if let Some(retry_ms) =
            self.check_rate_limit(&format!("mobile-otp-req:{}", normalized_mobile), 1)
        {
            return Err(format!(
                "too many otp requests for this mobile, retry in {}s",
                (retry_ms / 1000).max(1)
            ));
        }

        if self
            .registration_blacklist_hit("mobile", &normalized_mobile)
            .is_some()
        {
            return Err("mobile is world-blacklisted".into());
        }

        let normalized_email = request.email.as_deref().and_then(Self::normalize_email);
        let normalized_device = request
            .device_physical_address
            .as_deref()
            .and_then(Self::normalize_device_physical_address);
        let desired_resident_id = request
            .resident_id
            .as_deref()
            .and_then(Self::normalize_resident_handle)
            .map(IdentityId);

        self.purge_expired_email_otp_challenges();
        let code = self.generate_email_otp_code()?;
        // Encode mobile into challenge email so verify can recover it for display
        let email_for_challenge = if let Some(email) = normalized_email.as_ref() {
            format!("m:{normalized_mobile}:{email}")
        } else {
            format!("m:{normalized_mobile}@device.local")
        };
        let challenge = EmailOtpChallenge {
            challenge_id: format!("mobile-otp:{}", Self::secure_random_hex::<16>()?),
            email: email_for_challenge,
            mobile_hash_sha256: Some(Self::hash_registration_handle("mobile", &normalized_mobile)),
            device_hash_sha256: normalized_device
                .as_deref()
                .map(|device| Self::hash_registration_handle("device", device)),
            desired_resident_id,
            desired_nickname: request.nickname.clone(),
            code_hash_sha256: Self::hash_registration_handle("otp", &code),
            requested_at_ms: Self::now_ms(),
            expires_at_ms: Self::now_ms() + 10 * 60 * 1000,
            consumed_at_ms: None,
        };
        let response = RequestMobileOtpResponse {
            challenge_id: challenge.challenge_id.clone(),
            masked_mobile: Self::mask_mobile(&normalized_mobile),
            expires_at_ms: challenge.expires_at_ms,
            delivery_mode: if Self::dev_mobile_otp_inline_enabled() {
                "inline-dev".into()
            } else {
                "sms-provider-pending".into()
            },
            dev_code: Self::dev_mobile_otp_inline_enabled().then_some(code),
        };
        self.email_otp_challenges.push(challenge);
        self.persist_auth_state()?;
        Ok(response)
    }

    pub(crate) fn verify_mobile_otp(
        &mut self,
        request: VerifyMobileOtpRequest,
    ) -> Result<VerifyMobileOtpResponse, String> {
        self.purge_expired_email_otp_challenges();
        let Some(challenge_index) = self
            .email_otp_challenges
            .iter()
            .position(|challenge| challenge.challenge_id == request.challenge_id)
        else {
            return Err("unknown mobile otp challenge".into());
        };

        if let Some(retry_ms) =
            self.check_rate_limit(&format!("mobile-otp-verify:{}", request.challenge_id), 5)
        {
            return Err(format!(
                "too many otp verification attempts, retry in {}s",
                (retry_ms / 1000).max(1)
            ));
        }

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

        let mobile_hash = challenge
            .mobile_hash_sha256
            .clone()
            .ok_or_else(|| "mobile hash missing in challenge".to_string())?;

        if self
            .registration_blacklist
            .iter()
            .any(|entry| entry.handle_kind == "mobile" && entry.hash_sha256 == mobile_hash)
        {
            return Err("mobile is world-blacklisted".into());
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

        let existing_by_mobile = self
            .registrations
            .iter()
            .position(|item| item.mobile_hash_sha256.as_ref() == Some(&mobile_hash));
        let resident_id = if let Some(index) = existing_by_mobile {
            self.registrations[index].resident_id.clone()
        } else if let Some(expected) = challenge.desired_resident_id.clone() {
            expected
        } else if let Some(requested) = requested_resident_id {
            requested
        } else {
            let suffix = Self::now_ms().rem_euclid(100_000);
            IdentityId(format!("mobile-user-{suffix}"))
        };

        let registration = if let Some(existing) = self.registrations.iter_mut().find(|item| {
            item.mobile_hash_sha256.as_ref() == Some(&mobile_hash)
                || item.resident_id == resident_id
        }) {
            existing.resident_id = resident_id.clone();
            existing.mobile_hash_sha256 = Some(mobile_hash.clone());
            if let Some(device_hash) = challenge.device_hash_sha256.clone()
                && !existing
                    .device_hashes_sha256
                    .iter()
                    .any(|item| item == &device_hash)
            {
                existing.device_hashes_sha256.push(device_hash);
            }
            existing.state = ResidentRegistrationState::Active;
            existing.verified_at_ms = now_ms;
            existing.last_login_at_ms = now_ms;
            if challenge.desired_nickname.is_some() {
                existing.nickname = challenge.desired_nickname.clone();
            }
            existing.clone()
        } else {
            let registration = ResidentRegistration {
                resident_id: resident_id.clone(),
                email: challenge.email.clone(),
                email_hash_sha256: Self::hash_registration_handle("email", &challenge.email),
                mobile_hash_sha256: Some(mobile_hash.clone()),
                device_hashes_sha256: challenge.device_hash_sha256.clone().into_iter().collect(),
                state: ResidentRegistrationState::Active,
                created_at_ms: now_ms,
                verified_at_ms: now_ms,
                last_login_at_ms: now_ms,
                nickname: challenge.desired_nickname.clone(),
            };
            self.registrations.push(registration.clone());
            registration
        };

        self.ensure_verified_resident_guide_conversation(&registration.resident_id)?;
        self.email_otp_challenges[challenge_index].consumed_at_ms = Some(now_ms);
        let (session_token, session) = self.try_issue_auth_session(
            &registration.resident_id,
            &challenge.challenge_id,
            now_ms,
        )?;
        self.persist_auth_state()?;

        let mobile_for_display = challenge
            .email
            .strip_prefix("m:")
            .and_then(|rest| rest.split(':').next().or_else(|| rest.split('@').next()))
            .unwrap_or("***");
        let masked = Self::mask_mobile(mobile_for_display);
        Ok(VerifyMobileOtpResponse {
            resident_id: registration.resident_id.0,
            mobile: mobile_for_display.into(),
            mobile_masked: masked,
            nickname: registration.nickname.clone(),
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
