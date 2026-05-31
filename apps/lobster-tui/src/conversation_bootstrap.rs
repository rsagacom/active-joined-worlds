use chat_core::{Conversation, ConversationId};

use crate::{LaunchSurface, launch_companion_conversations, launch_conversation};

pub(crate) struct ConversationBootstrap {
    pub(crate) known_conversations: Vec<Conversation>,
    pub(crate) active_conversation_id: ConversationId,
    pub(crate) selected_conversation_id: ConversationId,
}

pub(crate) fn bootstrap_conversations(launch_mode: LaunchSurface) -> ConversationBootstrap {
    let mut known_conversations = vec![launch_conversation(launch_mode)];
    known_conversations.extend(launch_companion_conversations(launch_mode));
    known_conversations.dedup_by(|left, right| left.conversation_id == right.conversation_id);

    let active_conversation_id = known_conversations[0].conversation_id.clone();
    let selected_conversation_id = active_conversation_id.clone();

    ConversationBootstrap {
        known_conversations,
        active_conversation_id,
        selected_conversation_id,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bootstrap_conversations_deduplicates_primary_conversation() {
        let bootstrap = bootstrap_conversations(LaunchSurface::Direct);

        assert!(!bootstrap.known_conversations.is_empty());
        assert_eq!(
            bootstrap.active_conversation_id,
            bootstrap.selected_conversation_id
        );

        let direct_count = bootstrap
            .known_conversations
            .iter()
            .filter(|conversation| conversation.conversation_id == bootstrap.active_conversation_id)
            .count();
        assert_eq!(direct_count, 1);
    }
}
