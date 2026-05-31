use std::fs;
use std::sync::atomic::{AtomicU64, Ordering};

use chat_core::{
    ArchivePolicy, DeviceId, IdentityId, MessageBody, MessageEnvelope, MessageId, PayloadType,
};
use chat_storage::{FileTimelineStore, TimelineStore};

use super::{
    ConversationId, ConversationRow, FocusArea, LaunchContext, LaunchSurface,
    TerminalRenderProfile, build_launch_context, conversation_participant_label,
    conversation_route_label, conversation_scene_banner, conversation_scene_summary,
    conversation_sidebar_title, conversation_surface_page, conversation_title, current_time_ms,
    launch_companion_conversations, launch_conversation, seed_messages_for_conversation,
};

static TEST_CONTEXT_COUNTER: AtomicU64 = AtomicU64::new(0);

pub(crate) fn test_context(mode: LaunchSurface) -> LaunchContext {
    let conversation = launch_conversation(mode);
    LaunchContext {
        mode,
        transport_state: "已合线 · 今轮合线 4 拍".into(),
        message_count: 7,
        latest_message_hint: "builder：先把房内牌和城门牌分清 · 刚刚".into(),
        world_title: "龙虾世界".into(),
        city_title: "第一城 · Alpha".into(),
        identity: "tiyan".into(),
        render_profile: TerminalRenderProfile::desktop_default(),
        conversation_rows: vec![ConversationRow {
            slot: 1,
            title: conversation_sidebar_title(mode, &conversation),
            summary: "城邦大厅 · 回声常亮".into(),
            is_active: true,
            is_selected: true,
            is_private: false,
        }],
        active_conversation_id: conversation.conversation_id.clone(),
        selected_conversation_id: conversation.conversation_id.clone(),
        active_conversation: conversation_title(&conversation),
        active_conversation_index: 1,
        active_participant_label: conversation_participant_label(&conversation),
        active_participant_count: conversation.participants.len().max(1),
        active_route_label: conversation_route_label(&conversation),
        active_scene_metadata: conversation.scene.clone(),
        active_scene_banner: conversation_scene_banner(&conversation),
        active_scene_summary: conversation_scene_summary(&conversation),
        active_surface_page: conversation_surface_page(&conversation),
        preview_message_count: None,
        preview_latest_message_hint: None,
        preview_conversation: None,
        preview_participant_label: None,
        preview_participant_count: None,
        preview_route_label: None,
        preview_scene_metadata: None,
        preview_scene_banner: None,
        preview_scene_summary: None,
        preview_surface_page: None,
        preview_transcript: None,
        transcript_scroll: 0,
        focus_area: FocusArea::Nav,
        input_buffer: String::new(),
        transcript: vec!["我：先把房间做顺".into(), "builder：好".into()],
    }
}

pub(crate) fn runtime_context_with_selection_preview(
    mode: LaunchSurface,
    active_conversation_id: ConversationId,
    selected_conversation_id: ConversationId,
    focus_area: FocusArea,
) -> LaunchContext {
    let unique = TEST_CONTEXT_COUNTER.fetch_add(1, Ordering::Relaxed);
    let temp_root = std::env::temp_dir().join(format!(
        "lobster-tui-selection-preview-{}-{}",
        std::process::id(),
        unique
    ));
    fs::create_dir_all(&temp_root).unwrap();
    let archive_policy = ArchivePolicy::default();
    let mut store = FileTimelineStore::open(&temp_root, archive_policy).unwrap();
    let now_ms = current_time_ms().unwrap();

    let mut conversations = vec![launch_conversation(mode)];
    conversations.extend(launch_companion_conversations(mode));
    conversations.dedup_by(|left, right| left.conversation_id == right.conversation_id);

    for (index, conversation) in conversations.iter().enumerate() {
        store.upsert_conversation(conversation.clone()).unwrap();
        if store
            .recent_messages(&conversation.conversation_id, 1)
            .is_empty()
        {
            for (seed_index, (sender, profile, text, timestamp_ms)) in
                seed_messages_for_conversation(&conversation.conversation_id, now_ms)
                    .into_iter()
                    .enumerate()
            {
                let message = MessageEnvelope {
                    message_id: MessageId(format!("t-{index}-{seed_index}")),
                    conversation_id: conversation.conversation_id.clone(),
                    sender: IdentityId(sender.clone()),
                    reply_to_message_id: None,
                    sender_device: DeviceId(format!("{sender}-device")),
                    sender_profile: profile,
                    payload_type: PayloadType::Text,
                    body: MessageBody {
                        preview: text.clone(),
                        plain_text: text,
                        language_tag: "zh-CN".into(),
                    },
                    ciphertext: vec![],
                    timestamp_ms,
                    ephemeral: false,
                };
                store.append_message(message).unwrap();
            }
        }
    }

    let context = build_launch_context(
        mode,
        &store,
        &active_conversation_id,
        &selected_conversation_id,
        "已合线 · 今轮合线 0 拍".into(),
        TerminalRenderProfile::desktop_default(),
        0,
        focus_area,
        "",
    )
    .unwrap();

    let _ = fs::remove_dir_all(&temp_root);
    context
}
