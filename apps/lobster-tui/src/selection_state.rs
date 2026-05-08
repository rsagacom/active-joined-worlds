use chat_core::{Conversation, ConversationId};

use super::FocusArea;

pub(crate) fn move_selection(
    conversations: &[Conversation],
    selected_conversation_id: &ConversationId,
    delta: isize,
) -> ConversationId {
    if conversations.is_empty() {
        return selected_conversation_id.clone();
    }

    let current_index = conversations
        .iter()
        .position(|conversation| conversation.conversation_id == *selected_conversation_id)
        .unwrap_or(0);
    let next_index = (current_index as isize + delta)
        .clamp(0, conversations.len().saturating_sub(1) as isize) as usize;
    conversations[next_index].conversation_id.clone()
}

pub(crate) fn enter_selected_conversation(
    active_conversation_id: &mut ConversationId,
    selected_conversation_id: &ConversationId,
    transcript_scroll: &mut usize,
    focus_area: &mut FocusArea,
) {
    *active_conversation_id = selected_conversation_id.clone();
    *transcript_scroll = 0;
    *focus_area = FocusArea::Transcript;
}

pub(crate) fn focus_input_area(
    active_conversation_id: &mut ConversationId,
    selected_conversation_id: &ConversationId,
    transcript_scroll: &mut usize,
    focus_area: &mut FocusArea,
) {
    if *focus_area == FocusArea::Nav {
        enter_selected_conversation(
            active_conversation_id,
            selected_conversation_id,
            transcript_scroll,
            focus_area,
        );
    }
    *focus_area = FocusArea::Input;
}

pub(crate) fn leave_input_area(focus_area: &mut FocusArea) {
    *focus_area = FocusArea::Transcript;
}
