use chat_storage::ArchiveStore;
use serde::Serialize;

use crate::app_bootstrap::bootstrap_app;
use crate::compact_shell::compact_terminal_shell_lines;
use crate::transport_sync::merge_polled_messages;
use crate::{
    FocusArea, LaunchContext, LaunchSurface, SurfacePage, build_launch_context, current_time_ms,
    friendly_connection_label,
};

pub(crate) fn smoke_dump_requested() -> bool {
    matches!(
        std::env::var("LOBSTER_TUI_SMOKE_DUMP").ok().as_deref(),
        Some("plain" | "json")
    )
}

pub(crate) fn dump_terminal_shell_once(launch_mode: LaunchSurface) -> Result<String, String> {
    let context = build_smoke_context(launch_mode)?;
    match std::env::var("LOBSTER_TUI_SMOKE_DUMP").ok().as_deref() {
        Some("json") => dump_terminal_shell_snapshot_json(&context),
        _ => Ok(compact_terminal_shell_lines(&context, 104, 34).join("\n")),
    }
}

fn build_smoke_context(launch_mode: LaunchSurface) -> Result<LaunchContext, String> {
    let mut bootstrap = bootstrap_app(launch_mode)?;
    let synced = bootstrap.transport.poll()?;
    let _inserted = merge_polled_messages(&mut bootstrap.store, synced.clone())?;
    let now_ms = current_time_ms()?;
    let _archived = bootstrap.store.archive_expired_messages(now_ms)?;
    let transport_state_summary = format!(
        "{} · 今轮合流 {} 拍",
        friendly_connection_label(bootstrap.transport.connection_state()),
        synced.len()
    );
    build_launch_context(
        launch_mode,
        &bootstrap.store,
        &bootstrap.active_conversation_id,
        &bootstrap.selected_conversation_id,
        transport_state_summary,
        bootstrap.desktop_render,
        bootstrap.transcript_scroll,
        bootstrap.focus_area,
        &bootstrap.input_buffer,
    )
}

#[derive(Debug, Clone, Serialize)]
struct TerminalSnapshot {
    launch_mode: String,
    surface_kind: String,
    focus_area: String,
    active_conversation_id: String,
    selected_conversation_id: String,
    active_title: String,
    visible_panels: Vec<String>,
}

fn dump_terminal_shell_snapshot_json(context: &LaunchContext) -> Result<String, String> {
    serde_json::to_string_pretty(&TerminalSnapshot {
        launch_mode: format!("{:?}", context.mode),
        surface_kind: format!("{:?}", context.active_surface_page),
        focus_area: focus_area_label(context.focus_area).to_string(),
        active_conversation_id: context.active_conversation_id.0.clone(),
        selected_conversation_id: context.selected_conversation_id.0.clone(),
        active_title: context.active_conversation.clone(),
        visible_panels: visible_panels(context),
    })
    .map_err(|error| format!("serialize smoke snapshot failed: {error}"))
}

fn focus_area_label(focus_area: FocusArea) -> &'static str {
    match focus_area {
        FocusArea::Nav => "Nav",
        FocusArea::Transcript => "Transcript",
        FocusArea::Input => "Input",
    }
}

fn visible_panels(context: &LaunchContext) -> Vec<String> {
    match context.active_surface_page {
        SurfacePage::CityPublic => vec![
            "status".into(),
            "switcher".into(),
            "scene".into(),
            "profile".into(),
            "transcript".into(),
            "input".into(),
        ],
        SurfacePage::ResidenceDirect => vec![
            "status".into(),
            "actions".into(),
            "scene".into(),
            "transcript".into(),
            "input".into(),
        ],
        SurfacePage::World => vec![
            "status".into(),
            "switcher".into(),
            "scene".into(),
            "transcript".into(),
            "input".into(),
        ],
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::test_support::test_context;
    use serde_json::Value;

    #[test]
    fn terminal_snapshot_json_reports_city_public_surface_and_layout_panels() {
        let payload = dump_terminal_shell_snapshot_json(&test_context(LaunchSurface::User))
            .expect("city public snapshot");
        let snapshot: Value = serde_json::from_str(&payload).expect("json");

        assert_eq!(snapshot["surface_kind"], "CityPublic");
        assert_eq!(
            snapshot["selected_conversation_id"],
            snapshot["active_conversation_id"]
        );
        assert_eq!(snapshot["visible_panels"][0], "status");
        assert!(
            snapshot["visible_panels"]
                .as_array()
                .expect("visible panels")
                .iter()
                .any(|item| item == "profile")
        );
        assert!(
            snapshot["visible_panels"]
                .as_array()
                .expect("visible panels")
                .iter()
                .any(|item| item == "transcript")
        );
    }

    #[test]
    fn terminal_snapshot_json_reports_residence_direct_surface_and_layout_panels() {
        let payload = dump_terminal_shell_snapshot_json(&test_context(LaunchSurface::Direct))
            .expect("residence snapshot");
        let snapshot: Value = serde_json::from_str(&payload).expect("json");

        assert_eq!(snapshot["surface_kind"], "ResidenceDirect");
        assert!(
            snapshot["visible_panels"]
                .as_array()
                .expect("visible panels")
                .iter()
                .any(|item| item == "actions")
        );
        assert!(
            snapshot["visible_panels"]
                .as_array()
                .expect("visible panels")
                .iter()
                .all(|item| item != "profile")
        );
    }
}
