use chat_storage::{FileTimelineStore, TimelineStore};
use crossterm::event::{KeyCode, KeyEvent, KeyModifiers};

use crate::{
    ConversationId, FocusArea, LaunchSurface, SubmissionAction, TransportAdapter,
    enter_selected_conversation, focus_input_area, handle_terminal_submission, leave_input_area,
    move_selection, selectable_conversations,
};

pub(crate) enum LoopAction {
    Continue,
    Quit,
}

pub(crate) fn handle_input_focus_key(
    key: &KeyEvent,
    focus_area: &mut FocusArea,
    input_buffer: &mut String,
    transcript_scroll: &mut usize,
    store: &mut FileTimelineStore,
    transport: &mut dyn TransportAdapter,
    launch_mode: LaunchSurface,
    active_conversation_id: &mut ConversationId,
    selected_conversation_id: &mut ConversationId,
) -> Result<LoopAction, String> {
    match key.code {
        KeyCode::Esc => leave_input_area(focus_area),
        KeyCode::Tab => *focus_area = focus_area.next(),
        KeyCode::BackTab => *focus_area = focus_area.previous(),
        KeyCode::Backspace => {
            input_buffer.pop();
        }
        KeyCode::Enter => {
            let trimmed = input_buffer.trim().to_string();
            if trimmed.is_empty() {
                leave_input_area(focus_area);
            } else {
                input_buffer.clear();
                *transcript_scroll = 0;
                if matches!(
                    handle_terminal_submission(
                        store,
                        transport,
                        launch_mode,
                        active_conversation_id,
                        selected_conversation_id,
                        &trimmed,
                    )?,
                    SubmissionAction::Quit
                ) {
                    return Ok(LoopAction::Quit);
                }
            }
        }
        KeyCode::Char(ch)
            if !key.modifiers.contains(KeyModifiers::CONTROL)
                && !key.modifiers.contains(KeyModifiers::ALT) =>
        {
            input_buffer.push(ch);
        }
        _ => {}
    }

    Ok(LoopAction::Continue)
}

pub(crate) fn handle_navigation_key(
    key: &KeyEvent,
    focus_area: &mut FocusArea,
    store: &impl TimelineStore,
    launch_mode: LaunchSurface,
    active_conversation_id: &mut ConversationId,
    selected_conversation_id: &mut ConversationId,
    transcript_scroll: &mut usize,
) -> LoopAction {
    match key.code {
        KeyCode::Char('q') => LoopAction::Quit,
        KeyCode::Tab => {
            *focus_area = focus_area.next();
            LoopAction::Continue
        }
        KeyCode::BackTab => {
            *focus_area = focus_area.previous();
            LoopAction::Continue
        }
        KeyCode::Char('i') => {
            focus_input_area(
                active_conversation_id,
                selected_conversation_id,
                transcript_scroll,
                focus_area,
            );
            LoopAction::Continue
        }
        KeyCode::Enter => {
            match focus_area {
                FocusArea::Nav => {
                    enter_selected_conversation(
                        active_conversation_id,
                        selected_conversation_id,
                        transcript_scroll,
                        focus_area,
                    );
                }
                FocusArea::Transcript => {
                    focus_input_area(
                        active_conversation_id,
                        selected_conversation_id,
                        transcript_scroll,
                        focus_area,
                    );
                }
                FocusArea::Input => {}
            }
            LoopAction::Continue
        }
        KeyCode::Up | KeyCode::Char('k') if *focus_area == FocusArea::Nav => {
            let conversations =
                selectable_conversations(store, launch_mode, active_conversation_id);
            *selected_conversation_id =
                move_selection(&conversations, selected_conversation_id, -1);
            LoopAction::Continue
        }
        KeyCode::Down | KeyCode::Char('j') if *focus_area == FocusArea::Nav => {
            let conversations =
                selectable_conversations(store, launch_mode, active_conversation_id);
            *selected_conversation_id = move_selection(&conversations, selected_conversation_id, 1);
            LoopAction::Continue
        }
        KeyCode::Up | KeyCode::Char('k') if *focus_area == FocusArea::Transcript => {
            *transcript_scroll = transcript_scroll.saturating_add(1);
            LoopAction::Continue
        }
        KeyCode::Down | KeyCode::Char('j') if *focus_area == FocusArea::Transcript => {
            *transcript_scroll = transcript_scroll.saturating_sub(1);
            LoopAction::Continue
        }
        _ => LoopAction::Continue,
    }
}
