use super::*;

impl GatewayRuntime {
    pub(crate) fn actor_has_city_permission(
        &self,
        city_id: &CityId,
        actor_id: &IdentityId,
        permission: CityPermission,
    ) -> bool {
        self.active_membership(city_id, actor_id)
            .map(|membership| membership.role.has(permission))
            .unwrap_or(false)
    }

    pub(crate) fn public_room_by_conversation_id(
        &self,
        conversation_id: &ConversationId,
    ) -> Option<&PublicRoomRecord> {
        self.public_rooms
            .iter()
            .find(|room| room.room_id == *conversation_id)
    }

    pub(crate) fn create_city(&mut self, request: CreateCityRequest) -> Result<CityState, String> {
        let slug = Self::normalize_slug(request.slug.as_deref().unwrap_or(request.title.as_str()));
        if slug.is_empty() {
            return Err("city slug cannot be empty".into());
        }
        if self.cities.values().any(|city| {
            city.profile.slug == slug || city.profile.city_id.0 == format!("city:{slug}")
        }) {
            return Err(format!("city slug already exists: {slug}"));
        }
        let city_id = CityId(format!("city:{slug}"));
        let city = CityState {
            profile: CityProfile {
                city_id: city_id.clone(),
                world_id: self.world.world_id.clone(),
                slug: slug.clone(),
                title: request.title.clone(),
                description: request.description,
                scene: Some(Self::default_city_scene(&slug, &request.title)),
                resident_portable: true,
                approval_required: request.approval_required.unwrap_or(false),
                public_room_discovery_enabled: request
                    .public_room_discovery_enabled
                    .unwrap_or(true),
                federation_policy: request.federation_policy.unwrap_or(FederationPolicy::Open),
                relay_budget_hint: RelayBudgetHint::Balanced,
                retention_policy: Self::default_city_retention_policy(),
            },
            features: Self::default_city_features(),
        };
        let lord = IdentityId(request.lord_id);
        self.cities.insert(city_id.clone(), city.clone());
        self.memberships.push(CityMembership {
            city_id,
            resident_id: lord,
            role: CityRole::Lord,
            state: MembershipState::Active,
            joined_at_ms: Self::now_ms(),
            added_by: None,
        });
        self.city_trust.push(CityTrustRecord {
            city_id: CityId(format!("city:{slug}")),
            state: CityTrustState::Healthy,
            reason: Some("new city".into()),
            updated_by: IdentityId("system".into()),
            updated_at_ms: Self::now_ms(),
        });
        self.persist_governance_state()?;
        Ok(city)
    }

    pub(crate) fn join_city(&mut self, request: JoinCityRequest) -> Result<CityMembership, String> {
        let Some(city_id) = self.resolve_city_id(&request.city) else {
            return Err(format!("unknown city: {}", request.city));
        };
        let city = self
            .cities
            .get(&city_id)
            .ok_or_else(|| format!("unknown city: {}", request.city))?;
        let resident_id = IdentityId(request.resident_id);
        if self.resident_portability_revoked(&resident_id) {
            return Err(format!(
                "resident {} is world-banned and must re-register before joining another city",
                resident_id.0
            ));
        }
        if !self.registrations.iter().any(|registration| {
            registration.resident_id == resident_id
                && registration.state == ResidentRegistrationState::Active
        }) {
            return Err(format!(
                "resident {} is not registered and must verify email before joining city {}",
                resident_id.0, request.city
            ));
        }
        if let Some(existing) = self.memberships.iter().find(|membership| {
            membership.city_id == city_id && membership.resident_id == resident_id
        }) {
            return Ok(existing.clone());
        }
        let membership = CityMembership {
            city_id,
            resident_id,
            role: CityRole::Resident,
            state: if city.profile.approval_required {
                MembershipState::PendingApproval
            } else {
                MembershipState::Active
            },
            joined_at_ms: Self::now_ms(),
            added_by: None,
        };
        self.memberships.push(membership.clone());
        self.persist_governance_state()?;
        Ok(membership)
    }

    pub(crate) fn create_public_room(
        &mut self,
        request: CreatePublicRoomRequest,
    ) -> Result<PublicRoomRecord, String> {
        let Some(city_id) = self.resolve_city_id(&request.city) else {
            return Err(format!("unknown city: {}", request.city));
        };
        let actor_id = IdentityId(request.creator_id);
        if !self.actor_has_city_permission(&city_id, &actor_id, CityPermission::CreatePublicRoom) {
            return Err("creator lacks city permission: CreatePublicRoom".into());
        }

        let city = self
            .cities
            .get(&city_id)
            .ok_or_else(|| format!("unknown city: {}", request.city))?;
        let slug = Self::normalize_slug(request.slug.as_deref().unwrap_or(request.title.as_str()));
        if slug.is_empty() {
            return Err("room slug cannot be empty".into());
        }
        if self
            .public_rooms
            .iter()
            .any(|room| room.city_id == city_id && room.slug == slug)
        {
            return Err(format!("room slug already exists in city: {slug}"));
        }

        let room = PublicRoomRecord {
            room_id: ConversationId(format!("room:city:{}:{slug}", city.profile.slug)),
            city_id,
            slug: slug.clone(),
            title: request.title.clone(),
            description: request.description,
            scene: Some(Self::default_public_room_scene(
                &city.profile.slug,
                &slug,
                &request.title,
            )),
            created_by: actor_id.clone(),
            created_at_ms: Self::now_ms(),
            frozen: false,
        };
        self.ensure_room_conversation(&room)?;
        self.public_rooms.push(room.clone());
        self.persist_governance_state()?;
        Ok(room)
    }

    pub(crate) fn approve_city_join(
        &mut self,
        request: ApproveCityJoinRequest,
    ) -> Result<CityMembership, String> {
        let Some(city_id) = self.resolve_city_id(&request.city) else {
            return Err(format!("unknown city: {}", request.city));
        };
        let actor_id = IdentityId(request.actor_id);
        if !self.actor_has_city_permission(&city_id, &actor_id, CityPermission::ApproveResidentJoin)
        {
            return Err("actor lacks city permission: ApproveResidentJoin".into());
        }

        let resident_id = IdentityId(request.resident_id);
        let membership = self
            .active_membership_mut(&city_id, &resident_id)
            .ok_or_else(|| "membership not found".to_string())?;
        membership.state = MembershipState::Active;
        membership.added_by = Some(actor_id);
        let membership = membership.clone();
        self.persist_governance_state()?;
        Ok(membership)
    }

    pub(crate) fn update_steward(
        &mut self,
        request: UpdateStewardRequest,
    ) -> Result<CityMembership, String> {
        let Some(city_id) = self.resolve_city_id(&request.city) else {
            return Err(format!("unknown city: {}", request.city));
        };
        let actor_id = IdentityId(request.actor_id);
        let permission = if request.grant {
            CityPermission::AssignSteward
        } else {
            CityPermission::RevokeSteward
        };
        if !self.actor_has_city_permission(&city_id, &actor_id, permission) {
            return Err(format!("actor lacks city permission: {permission:?}"));
        }

        let resident_id = IdentityId(request.resident_id);
        let membership = self
            .active_membership_mut(&city_id, &resident_id)
            .ok_or_else(|| "membership not found".to_string())?;
        if membership.state != MembershipState::Active {
            return Err("membership is not active".into());
        }
        membership.role = if request.grant {
            CityRole::Steward
        } else {
            CityRole::Resident
        };
        membership.added_by = Some(actor_id);
        let membership = membership.clone();
        self.persist_governance_state()?;
        Ok(membership)
    }

    pub(crate) fn freeze_public_room(
        &mut self,
        request: FreezePublicRoomRequest,
    ) -> Result<PublicRoomRecord, String> {
        let Some(city_id) = self.resolve_city_id(&request.city) else {
            return Err(format!("unknown city: {}", request.city));
        };
        let actor_id = IdentityId(request.actor_id);
        if !self.actor_has_city_permission(&city_id, &actor_id, CityPermission::FreezeRoom) {
            return Err("actor lacks city permission: FreezeRoom".into());
        }

        let room = self
            .public_rooms
            .iter_mut()
            .find(|room| {
                room.city_id == city_id
                    && (room.slug == request.room || room.room_id.0 == request.room)
            })
            .ok_or_else(|| "room not found".to_string())?;
        room.frozen = request.frozen;
        let room = room.clone();
        self.persist_governance_state()?;
        Ok(room)
    }

    pub(crate) fn update_federation_policy(
        &mut self,
        request: UpdateFederationPolicyRequest,
    ) -> Result<CityState, String> {
        let Some(city_id) = self.resolve_city_id(&request.city) else {
            return Err(format!("unknown city: {}", request.city));
        };
        let actor_id = IdentityId(request.actor_id);
        if !self.actor_has_city_permission(
            &city_id,
            &actor_id,
            CityPermission::UpdateFederationPolicy,
        ) {
            return Err("actor lacks city permission: UpdateFederationPolicy".into());
        }

        let city = self
            .cities
            .get_mut(&city_id)
            .ok_or_else(|| format!("unknown city: {}", request.city))?;
        city.profile.federation_policy = request.policy;
        let city = city.clone();
        self.persist_governance_state()?;
        Ok(city)
    }
}
