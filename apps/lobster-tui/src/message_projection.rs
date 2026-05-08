use chat_core::TimelineEntry;

pub(crate) fn timeline_entry_text(entry: &TimelineEntry) -> String {
    if entry.recalled_at_ms.is_some() {
        "消息已撤回".into()
    } else {
        entry.envelope.body.plain_text.clone()
    }
}

pub(crate) fn timeline_entry_preview(entry: &TimelineEntry) -> String {
    if entry.recalled_at_ms.is_some() {
        "消息已撤回".into()
    } else {
        entry.envelope.body.preview.clone()
    }
}

pub(crate) fn timeline_entry_status_label(entry: &TimelineEntry) -> Option<&'static str> {
    if entry.recalled_at_ms.is_some() {
        Some("已撤回")
    } else if entry.edited_at_ms.is_some() {
        Some("已编辑")
    } else {
        None
    }
}
