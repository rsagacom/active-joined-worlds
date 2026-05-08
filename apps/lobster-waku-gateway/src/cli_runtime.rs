use super::*;
use chat_core::TimelineEntry;

impl GatewayRuntime {
    fn cli_timeline_text(entry: &TimelineEntry) -> String {
        if entry.recalled_at_ms.is_some() {
            "消息已撤回".into()
        } else {
            entry.envelope.body.plain_text.clone()
        }
    }

    fn cli_shell_room_projection(
        &self,
        conversation: &Conversation,
        viewer: &IdentityId,
    ) -> (
        String,
        String,
        String,
        String,
        String,
        String,
        String,
        String,
        String,
        String,
        String,
        Option<String>,
        Vec<String>,
        Option<usize>,
        Option<String>,
        Option<String>,
        String,
        String,
        String,
        Option<String>,
        Option<String>,
        Option<String>,
        Option<String>,
        Option<ShellCaretakerProjection>,
        Option<ShellDetailCardProjection>,
        Option<ShellWorkflowProjection>,
        Vec<ShellInlineActionProjection>,
    ) {
        let title = self.conversation_title_for_viewer(conversation, Some(viewer));
        let kind_hint = Some(Self::room_kind_hint(&conversation.conversation_id));
        let self_label = self.viewer_identity_anchor(conversation, viewer);
        let peer_label = self
            .viewer_peer_label(conversation, viewer)
            .or_else(|| self.shell_peer_label(conversation));
        let participant_label =
            Self::room_participant_label(&conversation.conversation_id, peer_label.as_deref());
        let route_label = Self::room_route_label(&conversation.conversation_id);
        let caretaker = Self::shell_caretaker(&conversation.conversation_id, &participant_label);
        let room_messages = self.shell_recent_messages(&conversation.conversation_id, 32);
        let last_count = room_messages.len();
        let meta = format!("消息数：{last_count}");
        let (scene_banner, scene_summary, room_variant, room_motif) =
            Self::shell_scene_fields(conversation);
        let room = ShellRoomState {
            id: conversation.conversation_id.0.clone(),
            kind: Self::shell_kind(&conversation.kind),
            scope: Self::shell_scope(&conversation.scope),
            title: title.clone(),
            subtitle: String::new(),
            meta: String::new(),
            kind_hint: kind_hint.clone(),
            self_label: self_label.clone(),
            peer_label: peer_label.clone(),
            participant_label: Some(participant_label.clone()),
            route_label: Some(route_label.clone()),
            list_summary: None,
            status_line: None,
            thread_headline: None,
            chat_status_summary: None,
            queue_summary: None,
            preview_text: None,
            last_activity_label: None,
            activity_time_label: None,
            overview_summary: None,
            context_summary: None,
            search_terms: Vec::new(),
            member_count: Some(conversation.participants.len()),
            scene_banner: None,
            scene_summary: None,
            room_variant: None,
            room_motif: None,
            is_frozen: false,
            messages: room_messages,
        };
        let subtitle = Self::shell_subtitle(&room, "system");
        let list_summary = Self::shell_list_summary(&room);
        let status_line = Self::shell_status_line(&room);
        let chat_status_summary = Self::shell_chat_status_summary(&room);
        let queue_summary = Self::shell_queue_summary(caretaker.as_ref());
        let detail_card = Self::shell_detail_card(
            &conversation.conversation_id,
            &room.title,
            self_label.as_deref(),
            peer_label.as_deref(),
            &participant_label,
            room.member_count.unwrap_or_default(),
            caretaker.as_ref(),
        );
        let overview_summary = Self::shell_overview_summary(&room);
        let context_summary = Self::shell_context_summary(&room, Some(&detail_card));
        let preview_text = Self::shell_preview_text(&room);
        let last_activity_label = Self::shell_last_activity_label(&room);
        let activity_time_label = Self::shell_activity_time_label(&room);
        let thread_headline = Self::shell_thread_headline(&room);
        let workflow = Self::shell_workflow(&conversation.conversation_id);
        let inline_actions = Self::shell_inline_actions(workflow.as_ref());
        let search_terms = Self::shell_search_terms(
            &room,
            caretaker.as_ref(),
            Some(&detail_card),
            workflow.as_ref(),
            &inline_actions,
        );
        (
            meta,
            subtitle,
            list_summary,
            status_line,
            chat_status_summary,
            queue_summary,
            overview_summary,
            context_summary,
            preview_text,
            last_activity_label,
            activity_time_label,
            kind_hint,
            search_terms,
            room.member_count,
            self_label,
            peer_label,
            participant_label,
            route_label,
            thread_headline,
            scene_banner,
            scene_summary,
            room_variant,
            room_motif,
            caretaker,
            Some(detail_card),
            workflow,
            inline_actions,
        )
    }

    pub(crate) fn cli_room_visible_to(
        &self,
        room_id: &ConversationId,
        viewer: &IdentityId,
    ) -> bool {
        if room_id.0 == "room:world:lobby" {
            return true;
        }

        let Some(room) = self.public_room_by_conversation_id(room_id) else {
            return false;
        };

        if self.active_membership(&room.city_id, viewer).is_some() {
            return true;
        }

        let Some(city) = self.cities.get(&room.city_id) else {
            return false;
        };
        let trust_state = Self::trust_state_from_records(&self.city_trust, &room.city_id);
        Self::city_is_mirror_visible(&city.profile, trust_state)
    }

    pub(crate) fn cli_visible_conversations_for(
        &self,
        viewer: &CliAddress,
    ) -> Result<Vec<Conversation>, String> {
        let identity = viewer
            .identity_ref()
            .ok_or_else(|| "cli identity target must be user:<id> or agent:<id>".to_string())?;

        let mut conversations = self
            .timeline_store
            .active_conversations()
            .into_iter()
            .filter(|conversation| match conversation.kind {
                ConversationKind::Direct => conversation
                    .participants
                    .iter()
                    .any(|item| item == identity),
                ConversationKind::Room => {
                    conversation
                        .participants
                        .iter()
                        .any(|item| item == identity)
                        || self.cli_room_visible_to(&conversation.conversation_id, identity)
                }
            })
            .collect::<Vec<_>>();
        conversations.sort_by(|a, b| b.last_active_at_ms.cmp(&a.last_active_at_ms));
        Ok(conversations)
    }

    pub(crate) fn cli_inbox_for(&self, viewer: &CliAddress) -> Result<CliInboxResponse, String> {
        let identity = viewer.identity_label()?;
        let viewer_identity = viewer
            .identity_ref()
            .ok_or_else(|| "cli identity target must be user:<id> or agent:<id>".to_string())?;
        let conversations = self
            .cli_visible_conversations_for(viewer)?
            .into_iter()
            .map(|conversation| {
                let (
                    meta,
                    subtitle,
                    list_summary,
                    status_line,
                    chat_status_summary,
                    queue_summary,
                    overview_summary,
                    context_summary,
                    preview_text,
                    last_activity_label,
                    activity_time_label,
                    kind_hint,
                    search_terms,
                    member_count,
                    self_label,
                    peer_label,
                    participant_label,
                    route_label,
                    thread_headline,
                    scene_banner,
                    scene_summary,
                    room_variant,
                    room_motif,
                    caretaker,
                    detail_card,
                    workflow,
                    inline_actions,
                ) = self.cli_shell_room_projection(&conversation, viewer_identity);
                let last_message_preview = self
                    .timeline_store
                    .recent_messages(&conversation.conversation_id, 1)
                    .last()
                    .map(Self::cli_timeline_text)
                    .unwrap_or_default();
                CliInboxConversation {
                    conversation_id: conversation.conversation_id.0.clone(),
                    title: self.conversation_title_for_viewer(&conversation, Some(viewer_identity)),
                    subtitle,
                    meta,
                    kind: match conversation.kind {
                        ConversationKind::Direct => "direct".into(),
                        ConversationKind::Room => "room".into(),
                    },
                    scope: Self::shell_scope(&conversation.scope),
                    kind_hint,
                    list_summary: Some(list_summary),
                    status_line: Some(status_line),
                    chat_status_summary: Some(chat_status_summary),
                    queue_summary: Some(queue_summary),
                    overview_summary: Some(overview_summary),
                    context_summary: Some(context_summary),
                    preview_text: Some(preview_text),
                    last_activity_label: Some(last_activity_label),
                    activity_time_label: Some(activity_time_label),
                    search_terms,
                    member_count,
                    self_label,
                    peer_label: peer_label.clone(),
                    participant_label: Some(participant_label),
                    route_label: Some(route_label),
                    thread_headline: Some(thread_headline),
                    scene_banner,
                    scene_summary,
                    room_variant,
                    room_motif,
                    caretaker,
                    detail_card,
                    workflow,
                    inline_actions,
                    updated_at_ms: conversation.last_active_at_ms,
                    last_message_preview,
                }
            })
            .collect::<Vec<_>>();
        Ok(CliInboxResponse {
            identity,
            conversations,
        })
    }

    pub(crate) fn cli_rooms_for(&self, viewer: &CliAddress) -> Result<CliRoomsResponse, String> {
        let identity = viewer.identity_label()?;
        let viewer_identity = viewer
            .identity_ref()
            .ok_or_else(|| "cli identity target must be user:<id> or agent:<id>".to_string())?;
        let entries = self
            .cli_visible_conversations_for(viewer)?
            .into_iter()
            .map(|conversation| {
                let (
                    meta,
                    subtitle,
                    list_summary,
                    status_line,
                    chat_status_summary,
                    queue_summary,
                    overview_summary,
                    context_summary,
                    preview_text,
                    last_activity_label,
                    activity_time_label,
                    kind_hint,
                    search_terms,
                    member_count,
                    self_label,
                    peer_label,
                    participant_label,
                    route_label,
                    thread_headline,
                    scene_banner,
                    scene_summary,
                    room_variant,
                    room_motif,
                    caretaker,
                    detail_card,
                    workflow,
                    inline_actions,
                ) = self.cli_shell_room_projection(&conversation, viewer_identity);
                CliRoomEntry {
                    conversation_id: conversation.conversation_id.0.clone(),
                    title: self.conversation_title_for_viewer(&conversation, Some(viewer_identity)),
                    subtitle,
                    meta,
                    kind: match conversation.kind {
                        ConversationKind::Direct => "direct".into(),
                        ConversationKind::Room => "room".into(),
                    },
                    scope: Self::shell_scope(&conversation.scope),
                    kind_hint,
                    list_summary: Some(list_summary),
                    status_line: Some(status_line),
                    chat_status_summary: Some(chat_status_summary),
                    queue_summary: Some(queue_summary),
                    overview_summary: Some(overview_summary),
                    context_summary: Some(context_summary),
                    preview_text: Some(preview_text),
                    last_activity_label: Some(last_activity_label),
                    activity_time_label: Some(activity_time_label),
                    search_terms,
                    member_count,
                    self_label,
                    participant_label: Some(participant_label),
                    peer_label,
                    route_label: Some(route_label),
                    thread_headline: Some(thread_headline),
                    scene_banner,
                    scene_summary,
                    room_variant,
                    room_motif,
                    caretaker,
                    detail_card,
                    workflow,
                    inline_actions,
                }
            })
            .collect::<Vec<_>>();
        Ok(CliRoomsResponse { identity, entries })
    }

    pub(crate) fn cli_tail_for(
        &self,
        viewer: &CliAddress,
        conversation_id: Option<&ConversationId>,
    ) -> Result<CliTailResponse, String> {
        let identity = viewer.identity_label()?;
        let viewer_identity = viewer
            .identity_ref()
            .ok_or_else(|| "cli identity target must be user:<id> or agent:<id>".to_string())?;
        let visible_conversations = self.cli_visible_conversations_for(viewer)?;
        let resolved_conversation = if let Some(conversation_id) = conversation_id {
            visible_conversations
                .into_iter()
                .find(|conversation| conversation.conversation_id == *conversation_id)
                .ok_or_else(|| {
                    format!(
                        "conversation {} is not visible to {}",
                        conversation_id.0, identity
                    )
                })?
        } else {
            visible_conversations
                .into_iter()
                .next()
                .ok_or_else(|| "no visible conversations for cli tail".to_string())?
        };
        let resolved_conversation_id = resolved_conversation.conversation_id.clone();

        let messages = self
            .timeline_store
            .recent_messages(&resolved_conversation_id, 32)
            .into_iter()
            .map(|entry| {
                let text = Self::cli_timeline_text(&entry);
                CliTailMessage {
                    message_id: entry.envelope.message_id.0,
                    sender: entry.envelope.sender.0,
                    text,
                    is_recalled: entry.recalled_at_ms.is_some(),
                    recalled_by: entry.recalled_by.map(|identity| identity.0),
                    recalled_at_ms: entry.recalled_at_ms,
                    is_edited: entry.edited_at_ms.is_some(),
                    edited_by: entry.edited_by.map(|identity| identity.0),
                    edited_at_ms: entry.edited_at_ms,
                    timestamp_ms: entry.envelope.timestamp_ms,
                }
            })
            .collect::<Vec<_>>();
        let (
            meta,
            subtitle,
            list_summary,
            status_line,
            chat_status_summary,
            queue_summary,
            overview_summary,
            context_summary,
            preview_text,
            last_activity_label,
            activity_time_label,
            kind_hint,
            search_terms,
            member_count,
            self_label,
            peer_label,
            participant_label,
            route_label,
            thread_headline,
            scene_banner,
            scene_summary,
            room_variant,
            room_motif,
            caretaker,
            detail_card,
            workflow,
            inline_actions,
        ) = self.cli_shell_room_projection(&resolved_conversation, viewer_identity);

        Ok(CliTailResponse {
            identity,
            conversation_id: resolved_conversation_id.0,
            title: self
                .conversation_title_for_viewer(&resolved_conversation, Some(viewer_identity)),
            subtitle,
            meta,
            kind: match resolved_conversation.kind {
                ConversationKind::Direct => "direct".into(),
                ConversationKind::Room => "room".into(),
            },
            scope: Self::shell_scope(&resolved_conversation.scope),
            kind_hint,
            list_summary: Some(list_summary),
            status_line: Some(status_line),
            chat_status_summary: Some(chat_status_summary),
            queue_summary: Some(queue_summary),
            overview_summary: Some(overview_summary),
            context_summary: Some(context_summary),
            preview_text: Some(preview_text),
            last_activity_label: Some(last_activity_label),
            activity_time_label: Some(activity_time_label),
            search_terms,
            member_count,
            self_label,
            peer_label,
            participant_label: Some(participant_label),
            route_label: Some(route_label),
            thread_headline: Some(thread_headline),
            scene_banner,
            scene_summary,
            room_variant,
            room_motif,
            caretaker,
            detail_card,
            workflow,
            inline_actions,
            messages,
        })
    }
}
