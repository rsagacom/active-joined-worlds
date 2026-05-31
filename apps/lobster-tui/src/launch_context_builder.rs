use chat_storage::TimelineStore;

use crate::{
    ConversationId, ConversationKind, FocusArea, LaunchSurface, SceneMetadata, SurfacePage,
    TerminalRenderProfile, conversation_list_summary, conversation_participant_label,
    conversation_route_label, conversation_scene_banner, conversation_scene_summary,
    conversation_sidebar_title, conversation_surface_page, conversation_title, current_time_ms,
    launch_conversation, launch_identity, message_projection::timeline_entry_preview,
    selectable_conversations, timestamp_label, transcript_lines,
};

#[derive(Debug, Clone)]
pub(crate) struct ConversationRow {
    pub(crate) slot: usize,
    pub(crate) title: String,
    pub(crate) summary: String,
    pub(crate) is_active: bool,
    pub(crate) is_selected: bool,
    pub(crate) is_private: bool,
}

#[cfg_attr(not(test), allow(dead_code))]
#[derive(Debug, Clone)]
pub(crate) struct LaunchContext {
    pub(crate) mode: LaunchSurface,
    pub(crate) transport_state: String,
    pub(crate) message_count: usize,
    pub(crate) latest_message_hint: String,
    pub(crate) world_title: String,
    pub(crate) city_title: String,
    pub(crate) identity: String,
    pub(crate) render_profile: TerminalRenderProfile,
    pub(crate) conversation_rows: Vec<ConversationRow>,
    pub(crate) active_conversation_id: ConversationId,
    pub(crate) selected_conversation_id: ConversationId,
    pub(crate) active_conversation: String,
    pub(crate) active_conversation_index: usize,
    pub(crate) active_participant_label: String,
    pub(crate) active_participant_count: usize,
    pub(crate) active_route_label: String,
    pub(crate) active_scene_metadata: Option<SceneMetadata>,
    pub(crate) active_scene_banner: Option<String>,
    pub(crate) active_scene_summary: String,
    pub(crate) active_surface_page: SurfacePage,
    pub(crate) preview_message_count: Option<usize>,
    pub(crate) preview_latest_message_hint: Option<String>,
    pub(crate) preview_conversation: Option<String>,
    pub(crate) preview_participant_label: Option<String>,
    pub(crate) preview_participant_count: Option<usize>,
    pub(crate) preview_route_label: Option<String>,
    pub(crate) preview_scene_metadata: Option<SceneMetadata>,
    pub(crate) preview_scene_banner: Option<String>,
    pub(crate) preview_scene_summary: Option<String>,
    pub(crate) preview_surface_page: Option<SurfacePage>,
    pub(crate) preview_transcript: Option<Vec<String>>,
    pub(crate) transcript: Vec<String>,
    pub(crate) transcript_scroll: usize,
    pub(crate) focus_area: FocusArea,
    pub(crate) input_buffer: String,
}

pub(crate) fn build_launch_context(
    mode: LaunchSurface,
    store: &impl TimelineStore,
    active_conversation_id: &ConversationId,
    selected_conversation_id: &ConversationId,
    transport_state: String,
    render_profile: TerminalRenderProfile,
    transcript_scroll: usize,
    focus_area: FocusArea,
    input_buffer: &str,
) -> Result<LaunchContext, String> {
    let now_ms = current_time_ms()?;
    let conversations = selectable_conversations(store, mode, active_conversation_id);
    let active_conversation = conversations
        .iter()
        .find(|conversation| conversation.conversation_id == *active_conversation_id)
        .cloned()
        .unwrap_or_else(|| launch_conversation(mode));
    let preview_conversation =
        if focus_area == FocusArea::Nav && *selected_conversation_id != *active_conversation_id {
            conversations
                .iter()
                .find(|conversation| conversation.conversation_id == *selected_conversation_id)
                .cloned()
        } else {
            None
        };
    let active_title = conversation_title(&active_conversation);
    let active_participant_label = conversation_participant_label(&active_conversation);
    let active_participant_count = active_conversation.participants.len().max(1);
    let active_route_label = conversation_route_label(&active_conversation);
    let active_scene_summary = conversation_scene_summary(&active_conversation);
    let active_surface_page = conversation_surface_page(&active_conversation);
    let identity = launch_identity(mode);
    let recent_messages = store.recent_messages(&active_conversation.conversation_id, 64);
    let message_count = recent_messages.len();
    let latest_message_hint = recent_messages
        .last()
        .map(|entry| {
            format!(
                "{}：{} · {}",
                entry.envelope.sender.0,
                timeline_entry_preview(entry),
                timestamp_label(entry.envelope.timestamp_ms, now_ms)
            )
        })
        .unwrap_or_else(|| "还没有回声".into());
    let conversation_rows = conversations
        .into_iter()
        .enumerate()
        .map(|(index, conversation)| {
            let is_active = conversation.conversation_id == active_conversation.conversation_id;
            ConversationRow {
                slot: index + 1,
                title: conversation_sidebar_title(mode, &conversation),
                summary: conversation_list_summary(mode, store, &conversation, now_ms),
                is_active,
                is_selected: conversation.conversation_id == *selected_conversation_id,
                is_private: matches!(conversation.kind, ConversationKind::Direct),
            }
        })
        .collect::<Vec<_>>();

    let active_conversation_index = conversation_rows
        .iter()
        .find(|row| row.is_active)
        .map(|row| row.slot)
        .unwrap_or(1);
    let preview_message_count = preview_conversation.as_ref().map(|conversation| {
        store
            .recent_messages(&conversation.conversation_id, 64)
            .len()
    });
    let preview_latest_message_hint = preview_conversation.as_ref().map(|conversation| {
        store
            .recent_messages(&conversation.conversation_id, 64)
            .last()
            .map(|entry| {
                format!(
                    "{}：{} · {}",
                    entry.envelope.sender.0,
                    entry.envelope.body.preview,
                    timestamp_label(entry.envelope.timestamp_ms, now_ms)
                )
            })
            .unwrap_or_else(|| "还没有回声".into())
    });
    let preview_conversation_title = preview_conversation.as_ref().map(conversation_title);
    let preview_participant_label = preview_conversation
        .as_ref()
        .map(conversation_participant_label);
    let preview_participant_count = preview_conversation
        .as_ref()
        .map(|conversation| conversation.participants.len().max(1));
    let preview_route_label = preview_conversation.as_ref().map(conversation_route_label);
    let preview_scene_metadata = preview_conversation
        .as_ref()
        .and_then(|conversation| conversation.scene.clone());
    let preview_scene_banner = preview_conversation
        .as_ref()
        .and_then(conversation_scene_banner);
    let preview_scene_summary = preview_conversation
        .as_ref()
        .map(conversation_scene_summary);
    let preview_surface_page = preview_conversation.as_ref().map(conversation_surface_page);
    let preview_transcript = preview_conversation.as_ref().map(|conversation| {
        transcript_lines(
            store,
            &conversation.conversation_id,
            &identity,
            now_ms,
            render_profile,
        )
    });

    Ok(LaunchContext {
        mode,
        transport_state,
        message_count,
        latest_message_hint,
        world_title: "龙虾世界".into(),
        city_title: "第一城 · Alpha".into(),
        identity: identity.clone(),
        render_profile,
        conversation_rows,
        active_conversation_id: active_conversation.conversation_id.clone(),
        selected_conversation_id: selected_conversation_id.clone(),
        active_conversation: active_title,
        active_conversation_index,
        active_participant_label,
        active_participant_count,
        active_route_label,
        active_scene_metadata: active_conversation.scene.clone(),
        active_scene_banner: conversation_scene_banner(&active_conversation),
        active_scene_summary,
        active_surface_page,
        preview_message_count,
        preview_latest_message_hint,
        preview_conversation: preview_conversation_title,
        preview_participant_label,
        preview_participant_count,
        preview_route_label,
        preview_scene_metadata,
        preview_scene_banner,
        preview_scene_summary,
        preview_surface_page,
        preview_transcript,
        transcript_scroll,
        focus_area,
        input_buffer: input_buffer.to_string(),
        transcript: transcript_lines(
            store,
            &active_conversation.conversation_id,
            &identity,
            now_ms,
            render_profile,
        ),
    })
}
