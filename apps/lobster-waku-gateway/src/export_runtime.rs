use super::*;

impl GatewayRuntime {
    fn export_shell_room_projection(
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
            title,
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

    pub(crate) fn resident_can_export_conversation(
        &self,
        resident_id: &IdentityId,
        conversation: &Conversation,
        include_public: bool,
    ) -> bool {
        match conversation.kind {
            ConversationKind::Direct => conversation
                .participants
                .iter()
                .any(|item| item == resident_id),
            ConversationKind::Room => {
                if conversation
                    .participants
                    .iter()
                    .any(|item| item == resident_id)
                {
                    return true;
                }
                if !include_public {
                    return false;
                }
                let Some(room) = self.public_room_by_conversation_id(&conversation.conversation_id)
                else {
                    return false;
                };
                self.memberships.iter().any(|membership| {
                    membership.city_id == room.city_id
                        && membership.resident_id == *resident_id
                        && membership.state != MembershipState::Removed
                })
            }
        }
    }

    pub(crate) fn conversation_title(
        &self,
        conversation: &Conversation,
        viewer: Option<&IdentityId>,
    ) -> String {
        self.conversation_title_for_viewer(conversation, viewer)
    }

    pub(crate) fn export_history(
        &self,
        resident_id: IdentityId,
        conversation_id: Option<&str>,
        format: ExportFormat,
        include_public: bool,
    ) -> Result<ExportResponse, String> {
        let mut conversations = self.timeline_store.active_conversations();
        conversations.retain(|conversation| {
            self.resident_can_export_conversation(&resident_id, conversation, include_public)
        });

        if let Some(target_id) = conversation_id {
            conversations.retain(|conversation| conversation.conversation_id.0 == target_id);
            if conversations.is_empty() {
                return Err(format!("no exportable conversation found: {target_id}"));
            }
        }

        conversations.sort_by_key(|conversation| conversation.last_active_at_ms);
        conversations.reverse();

        let mut exported = Vec::new();
        let mut rendered_blocks = Vec::new();
        for conversation in conversations {
            let entries = self
                .timeline_store
                .export_messages(&conversation.conversation_id);
            let title = self.conversation_title(&conversation, Some(&resident_id));
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
            ) = self.export_shell_room_projection(&conversation, &resident_id);
            exported.push(ExportedConversation {
                conversation_id: conversation.conversation_id.0.clone(),
                kind: Self::shell_kind(&conversation.kind),
                scope: Self::shell_scope(&conversation.scope),
                title: title.clone(),
                subtitle,
                meta,
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
                message_count: entries.len(),
            });
            rendered_blocks.push(self.render_export_block(&conversation, &title, &entries, format));
        }

        Ok(ExportResponse {
            resident_id: resident_id.0,
            format: match format {
                ExportFormat::Markdown => "markdown".into(),
                ExportFormat::Jsonl => "jsonl".into(),
                ExportFormat::Text => "txt".into(),
            },
            exported_at_ms: Self::now_ms(),
            conversation_count: exported.len(),
            rights: ResidentExportRights::protocol_safe_default(),
            conversations: exported,
            content: rendered_blocks.join("\n\n"),
        })
    }

    pub(crate) fn render_export_block(
        &self,
        conversation: &Conversation,
        title: &str,
        entries: &[chat_core::TimelineEntry],
        format: ExportFormat,
    ) -> String {
        match format {
            ExportFormat::Markdown => {
                let mut out = format!(
                    "# {}\n\n- conversation_id: `{}`\n- kind: `{}`\n- scope: `{}`\n",
                    title,
                    conversation.conversation_id.0,
                    Self::shell_kind(&conversation.kind),
                    Self::shell_scope(&conversation.scope),
                );
                for entry in entries {
                    out.push_str(&format!(
                        "\n- [{}] **{}**: {}\n",
                        entry.envelope.timestamp_ms,
                        entry.envelope.sender.0,
                        entry.envelope.body.plain_text.replace('\n', " ")
                    ));
                }
                out
            }
            ExportFormat::Text => {
                let mut out = format!(
                    "{}\nconversation_id={}\nkind={}\nscope={}\n",
                    title,
                    conversation.conversation_id.0,
                    Self::shell_kind(&conversation.kind),
                    Self::shell_scope(&conversation.scope),
                );
                for entry in entries {
                    out.push_str(&format!(
                        "\n[{}] {}: {}",
                        entry.envelope.timestamp_ms,
                        entry.envelope.sender.0,
                        entry.envelope.body.plain_text.replace('\n', " ")
                    ));
                }
                out
            }
            ExportFormat::Jsonl => entries
                .iter()
                .map(|entry| {
                    serde_json::json!({
                        "conversation_id": conversation.conversation_id.0,
                        "kind": Self::shell_kind(&conversation.kind),
                        "scope": Self::shell_scope(&conversation.scope),
                        "timestamp_ms": entry.envelope.timestamp_ms,
                        "sender": entry.envelope.sender.0,
                        "text": entry.envelope.body.plain_text,
                        "archived_at_ms": entry.archived_at_ms,
                    })
                    .to_string()
                })
                .collect::<Vec<_>>()
                .join("\n"),
        }
    }
}
