use chat_core::{
    Conversation, DeviceId, IdentityId, MessageBody, MessageEnvelope, MessageId, PayloadType,
};
use chat_storage::{FileTimelineStore, TimelineStore};

use crate::{TransportAdapter, current_time_ms, seed_messages_for_conversation};

pub(crate) fn seed_missing_messages(
    store: &mut FileTimelineStore,
    transport: &mut dyn TransportAdapter,
    known_conversations: &[Conversation],
) -> Result<(), String> {
    let now_ms = current_time_ms()?;
    for (index, conversation) in known_conversations.iter().enumerate() {
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
                    message_id: MessageId(format!("m-{index}-{seed_index}")),
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
                transport.publish(&message)?;
                store.append_message(message)?;
            }
        }
    }
    Ok(())
}
