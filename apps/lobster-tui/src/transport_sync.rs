use chat_core::DeliveryState;
use chat_storage::{FileTimelineStore, TimelineStore};

use crate::TransportAdapter;

pub(crate) fn merge_polled_messages(
    store: &mut FileTimelineStore,
    messages: impl IntoIterator<Item = chat_core::MessageEnvelope>,
) -> Result<usize, String> {
    let mut inserted = 0usize;
    for message in messages {
        if store.merge_message(message, DeliveryState::Delivered)? {
            inserted += 1;
        }
    }
    Ok(inserted)
}

pub(crate) fn republish_pending_messages(
    store: &mut FileTimelineStore,
    transport: &mut dyn TransportAdapter,
) -> Result<usize, String> {
    let mut republished = 0usize;
    for conversation in store.active_conversations() {
        let entries = store.export_messages(&conversation.conversation_id);
        for entry in entries {
            if entry.archived_at_ms.is_some()
                || entry.recalled_at_ms.is_some()
                || entry.delivery_state != DeliveryState::PendingNetwork
            {
                continue;
            }
            if transport.publish(&entry.envelope).is_err() {
                return Ok(republished);
            }
            store.merge_message(entry.envelope.clone(), DeliveryState::Delivered)?;
            republished += 1;
        }
    }
    Ok(republished)
}
