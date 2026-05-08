use chat_core::ConversationId;
use chat_storage::FileTimelineStore;

use crate::app_bootstrap::bootstrap_app;
use crate::{LaunchSurface, SubmissionAction, TransportAdapter, handle_terminal_submission};

pub(crate) fn smoke_submission_script_requested() -> bool {
    std::env::var("LOBSTER_TUI_SMOKE_SCRIPT").is_ok()
}

fn smoke_submission_script_lines() -> Vec<String> {
    std::env::var("LOBSTER_TUI_SMOKE_SCRIPT")
        .unwrap_or_default()
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .map(ToOwned::to_owned)
        .collect()
}

pub(crate) fn run_submission_script(
    store: &mut FileTimelineStore,
    transport: &mut dyn TransportAdapter,
    launch_mode: LaunchSurface,
    active_conversation_id: &mut ConversationId,
    selected_conversation_id: &mut ConversationId,
    lines: &[impl AsRef<str>],
) -> Result<SubmissionAction, String> {
    let mut last_action = SubmissionAction::Continue;
    for line in lines {
        let trimmed = line.as_ref().trim();
        if trimmed.is_empty() {
            continue;
        }
        last_action = handle_terminal_submission(
            store,
            transport,
            launch_mode,
            active_conversation_id,
            selected_conversation_id,
            trimmed,
        )?;
        if matches!(last_action, SubmissionAction::Quit) {
            break;
        }
    }
    Ok(last_action)
}

pub(crate) fn run_smoke_submission_script_once(launch_mode: LaunchSurface) -> Result<(), String> {
    let mut bootstrap = bootstrap_app(launch_mode)?;
    let script_lines = smoke_submission_script_lines();
    let _ = run_submission_script(
        &mut bootstrap.store,
        bootstrap.transport.as_mut(),
        launch_mode,
        &mut bootstrap.active_conversation_id,
        &mut bootstrap.selected_conversation_id,
        &script_lines,
    )?;
    Ok(())
}
