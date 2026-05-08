use chat_core::ConversationId;
use chat_storage::TimelineStore;
use host_adapter::TerminalRenderProfile;

use super::{
    CHAT_PANEL_WIDTH, colorize, message_projection::timeline_entry_status_label,
    message_projection::timeline_entry_text, timestamp_label, use_ascii_borders, wrap_text,
};

pub(crate) fn transcript_lines(
    store: &impl TimelineStore,
    conversation_id: &ConversationId,
    identity: &str,
    now_ms: i64,
    render_profile: TerminalRenderProfile,
) -> Vec<String> {
    let mut lines = Vec::new();
    let messages = store.recent_messages(conversation_id, 8);
    let message_count = messages.len();

    for (index, entry) in messages.into_iter().enumerate() {
        let sender_identity = entry.envelope.sender.0.clone();
        let is_self = sender_identity == identity;
        let sender_label = if is_self {
            "我".to_string()
        } else {
            sender_identity.clone()
        };
        let sender_kind = if is_self {
            "success"
        } else if sender_identity == "system" {
            "muted"
        } else {
            "accent"
        };
        let marker = if is_self {
            if use_ascii_borders(render_profile) {
                ">"
            } else {
                "▌"
            }
        } else if sender_identity == "system" {
            if use_ascii_borders(render_profile) {
                "#"
            } else {
                "◇"
            }
        } else if use_ascii_borders(render_profile) {
            "*"
        } else {
            "•"
        };
        let mut meta_label = timestamp_label(entry.envelope.timestamp_ms, now_ms);
        if let Some(status_label) = timeline_entry_status_label(&entry) {
            meta_label.push_str(" · ");
            meta_label.push_str(status_label);
        }
        let header_line = format!(
            "{} {}  {}",
            colorize(render_profile, sender_kind, marker),
            colorize(render_profile, sender_kind, &sender_label),
            colorize(render_profile, "muted", &meta_label)
        );
        lines.push(header_line);
        let indent = if is_self { "    " } else { "   " };
        let body_text = timeline_entry_text(&entry);
        for body_line in wrap_text(&body_text, CHAT_PANEL_WIDTH.saturating_sub(14))
            .into_iter()
            .take(4)
        {
            lines.push(format!("{indent}{body_line}"));
        }
        if index + 1 < message_count {
            lines.push(String::new());
        }
    }

    if lines.is_empty() {
        lines.push("这里还没有回声，试着在下方落下第一句。".into());
        lines.push(String::new());
        lines.push("一旦落字，回声会立刻贴到这里，顺着往下读。".into());
    }
    lines
}
