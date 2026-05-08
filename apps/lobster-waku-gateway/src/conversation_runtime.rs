use super::*;

impl GatewayRuntime {
    pub(crate) fn conversation_blueprint(
        conversation_id: &ConversationId,
        timestamp_ms: i64,
        sender: &IdentityId,
    ) -> Conversation {
        let kind = if conversation_id.0.starts_with("dm:") {
            ConversationKind::Direct
        } else {
            ConversationKind::Room
        };
        let scope = if conversation_id.0.starts_with("room:world:") {
            ConversationScope::CrossCityShared
        } else if conversation_id.0.starts_with("room:") {
            ConversationScope::CityPublic
        } else {
            ConversationScope::Private
        };
        let participants = if matches!(kind, ConversationKind::Direct) {
            conversation_id
                .0
                .split(':')
                .skip(1)
                .map(|part| IdentityId(part.to_string()))
                .collect::<Vec<_>>()
        } else {
            vec![sender.clone()]
        };

        Conversation {
            conversation_id: conversation_id.clone(),
            kind: kind.clone(),
            scope,
            scene: if matches!(kind, ConversationKind::Direct) {
                Some(Self::default_direct_scene(&participants))
            } else {
                Some(Self::default_public_room_scene(
                    "shared",
                    "channel",
                    &Self::room_title(conversation_id),
                ))
            },
            content_topic: transport_waku::WakuFrameCodec::content_topic_for(conversation_id),
            participants,
            created_at_ms: timestamp_ms,
            last_active_at_ms: timestamp_ms,
        }
    }

    pub(crate) fn ensure_conversation_for(
        &mut self,
        message: &MessageEnvelope,
    ) -> Result<(), String> {
        let exists = self
            .timeline_store
            .active_conversations()
            .into_iter()
            .any(|item| item.conversation_id == message.conversation_id);
        if exists {
            return Ok(());
        }
        self.timeline_store
            .upsert_conversation(Self::conversation_blueprint(
                &message.conversation_id,
                message.timestamp_ms,
                &message.sender,
            ))
    }

    pub(crate) fn ensure_room_conversation(
        &mut self,
        room: &PublicRoomRecord,
    ) -> Result<(), String> {
        let exists = self
            .timeline_store
            .active_conversations()
            .into_iter()
            .any(|item| item.conversation_id == room.room_id);
        if exists {
            return Ok(());
        }
        self.timeline_store.upsert_conversation(Conversation {
            conversation_id: room.room_id.clone(),
            kind: ConversationKind::Room,
            scope: ConversationScope::CityPublic,
            scene: room.scene.clone(),
            content_topic: transport_waku::WakuFrameCodec::content_topic_for(&room.room_id),
            participants: vec![room.created_by.clone()],
            created_at_ms: room.created_at_ms,
            last_active_at_ms: room.created_at_ms,
        })
    }

    pub(crate) fn direct_conversation_id(a: &IdentityId, b: &IdentityId) -> ConversationId {
        canonical_direct_conversation_id(a, b)
    }

    pub(crate) fn legacy_direct_conversation_id(a: &IdentityId, b: &IdentityId) -> ConversationId {
        ConversationId(format!("dm:{}:{}", a.0, b.0))
    }

    pub(crate) fn resolve_direct_conversation_id(
        &self,
        a: &IdentityId,
        b: &IdentityId,
    ) -> ConversationId {
        let canonical = Self::direct_conversation_id(a, b);
        let legacy = Self::legacy_direct_conversation_id(a, b);
        let reverse_legacy = Self::legacy_direct_conversation_id(b, a);

        let known = self
            .timeline_store
            .active_conversations()
            .into_iter()
            .map(|conversation| conversation.conversation_id)
            .collect::<Vec<_>>();
        if known
            .iter()
            .any(|conversation_id| conversation_id == &canonical)
        {
            return canonical;
        }
        if known
            .iter()
            .any(|conversation_id| conversation_id == &legacy)
        {
            return legacy;
        }
        if known
            .iter()
            .any(|conversation_id| conversation_id == &reverse_legacy)
        {
            return reverse_legacy;
        }
        canonical
    }

    pub(crate) fn ensure_verified_resident_guide_conversation(
        &mut self,
        resident_id: &IdentityId,
    ) -> Result<(), String> {
        let guide_id = IdentityId("guide".into());
        if *resident_id == guide_id {
            return Ok(());
        }

        let conversation_id = Self::direct_conversation_id(resident_id, &guide_id);
        self.ensure_direct_conversation(&conversation_id, &[resident_id.clone(), guide_id])
    }

    #[cfg_attr(not(test), allow(dead_code))]
    pub(crate) fn resolve_cli_direct_conversation_id(
        &self,
        a: &IdentityId,
        b: &IdentityId,
    ) -> ConversationId {
        self.resolve_direct_conversation_id(a, b)
    }

    pub(crate) fn ensure_direct_conversation(
        &mut self,
        conversation_id: &ConversationId,
        participants: &[IdentityId],
    ) -> Result<(), String> {
        let exists = self
            .timeline_store
            .active_conversations()
            .into_iter()
            .any(|item| item.conversation_id == *conversation_id);
        if exists {
            return Ok(());
        }

        self.timeline_store.upsert_conversation(Conversation {
            conversation_id: conversation_id.clone(),
            kind: ConversationKind::Direct,
            scope: ConversationScope::Private,
            scene: Some(Self::default_direct_scene(participants)),
            content_topic: transport_waku::WakuFrameCodec::content_topic_for(conversation_id),
            participants: participants.to_vec(),
            created_at_ms: Self::now_ms(),
            last_active_at_ms: Self::now_ms(),
        })
    }

    pub(crate) fn open_direct_session(
        &mut self,
        request: OpenDirectSessionRequest,
    ) -> Result<MlsGroupState, String> {
        let requester = IdentityId(Self::normalize_direct_resident_id(request.requester_id)?);
        let peer = IdentityId(Self::normalize_direct_resident_id(request.peer_id)?);
        if requester == peer {
            return Err("direct session requires two distinct residents".into());
        }

        let conversation_id = self.resolve_direct_conversation_id(&requester, &peer);
        self.ensure_direct_conversation(&conversation_id, &[requester.clone(), peer.clone()])?;

        if let Some(existing) = self.secure_sessions.group_state(&conversation_id) {
            return Ok(existing.clone());
        }

        let members = vec![
            request
                .requester_device_id
                .map(|device| MlsMember::device(requester.0.clone(), device))
                .unwrap_or_else(|| MlsMember::identity(requester.0.clone())),
            request
                .peer_device_id
                .map(|device| MlsMember::device(peer.0.clone(), device))
                .unwrap_or_else(|| MlsMember::identity(peer.0.clone())),
        ];
        let group = self
            .secure_sessions
            .bootstrap_direct(&conversation_id, members)?;
        self.persist_secure_sessions()?;
        Ok(group)
    }

    fn normalize_direct_resident_id(raw: String) -> Result<String, String> {
        let resident_id = raw.trim().to_string();
        if resident_id.is_empty() || resident_id == "访客" {
            Err("direct session requires authenticated residents".into())
        } else {
            Ok(resident_id)
        }
    }
}
