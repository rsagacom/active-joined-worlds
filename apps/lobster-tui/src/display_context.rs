use super::{LaunchContext, SceneMetadata, SurfacePage};

pub(crate) fn display_message_count(context: &LaunchContext) -> usize {
    context
        .preview_message_count
        .unwrap_or(context.message_count)
}

pub(crate) fn previewing_selection(context: &LaunchContext) -> bool {
    context.preview_conversation.is_some()
}

#[cfg(test)]
pub(crate) fn display_latest_message_hint(context: &LaunchContext) -> &str {
    context
        .preview_latest_message_hint
        .as_deref()
        .unwrap_or(&context.latest_message_hint)
}

pub(crate) fn display_conversation(context: &LaunchContext) -> &str {
    context
        .preview_conversation
        .as_deref()
        .unwrap_or(&context.active_conversation)
}

#[cfg(test)]
pub(crate) fn display_participant_label(context: &LaunchContext) -> &str {
    context
        .preview_participant_label
        .as_deref()
        .unwrap_or(&context.active_participant_label)
}

pub(crate) fn display_participant_count(context: &LaunchContext) -> usize {
    context
        .preview_participant_count
        .unwrap_or(context.active_participant_count)
}

#[cfg(test)]
pub(crate) fn display_route_label(context: &LaunchContext) -> &str {
    context
        .preview_route_label
        .as_deref()
        .unwrap_or(&context.active_route_label)
}

pub(crate) fn display_scene_banner(context: &LaunchContext) -> Option<&str> {
    context
        .preview_scene_banner
        .as_deref()
        .or(context.active_scene_banner.as_deref())
}

pub(crate) fn display_scene_metadata(context: &LaunchContext) -> Option<&SceneMetadata> {
    context
        .preview_scene_metadata
        .as_ref()
        .or(context.active_scene_metadata.as_ref())
}

pub(crate) fn display_scene_summary(context: &LaunchContext) -> &str {
    context
        .preview_scene_summary
        .as_deref()
        .unwrap_or(&context.active_scene_summary)
}

pub(crate) fn display_surface_page(context: &LaunchContext) -> SurfacePage {
    context
        .preview_surface_page
        .unwrap_or(context.active_surface_page)
}

pub(crate) fn display_transcript(context: &LaunchContext) -> &[String] {
    context
        .preview_transcript
        .as_deref()
        .unwrap_or(&context.transcript)
}

pub(crate) fn transcript_body_lines(context: &LaunchContext) -> Vec<String> {
    display_transcript(context)
        .iter()
        .filter(|line| !line.trim().is_empty())
        .cloned()
        .collect()
}

pub(crate) fn transcript_scroll_start(
    total_lines: usize,
    viewport_lines: usize,
    transcript_scroll: usize,
) -> usize {
    if viewport_lines == 0 || total_lines <= viewport_lines {
        return 0;
    }
    let max_scroll = total_lines.saturating_sub(viewport_lines);
    total_lines.saturating_sub(viewport_lines + transcript_scroll.min(max_scroll))
}

pub(crate) fn transcript_window(
    lines: &[String],
    viewport_lines: usize,
    transcript_scroll: usize,
) -> Vec<String> {
    if viewport_lines == 0 {
        return Vec::new();
    }
    let start = transcript_scroll_start(lines.len(), viewport_lines, transcript_scroll);
    lines
        .iter()
        .skip(start)
        .take(viewport_lines)
        .cloned()
        .collect()
}

pub(crate) fn timestamp_label(timestamp_ms: i64, now_ms: i64) -> String {
    let delta_ms = now_ms.saturating_sub(timestamp_ms);
    let delta_minutes = delta_ms / (60 * 1000);
    if delta_minutes < 1 {
        "刚刚".into()
    } else if delta_minutes < 60 {
        format!("{} 分钟前", delta_minutes)
    } else if delta_minutes < 24 * 60 {
        format!("{} 小时前", delta_minutes / 60)
    } else {
        format!("{} 天前", delta_minutes / (24 * 60))
    }
}
