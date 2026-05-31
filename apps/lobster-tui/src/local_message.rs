use chat_core::{
    ClientProfile, ConversationId, DeliveryState, DeviceId, IdentityId, MessageBody,
    MessageEnvelope, MessageId, PayloadType,
};
use chat_storage::FileTimelineStore;

use super::{TransportAdapter, current_time_ms};

pub(crate) fn append_local_message(
    store: &mut FileTimelineStore,
    transport: &mut dyn TransportAdapter,
    conversation_id: &ConversationId,
    sender: &str,
    text: &str,
) -> Result<(), String> {
    let now_ms = current_time_ms()?;
    let message = MessageEnvelope {
        message_id: MessageId(format!("local-{sender}-{now_ms}")),
        conversation_id: conversation_id.clone(),
        sender: IdentityId(sender.into()),
        reply_to_message_id: None,
        sender_device: DeviceId(format!("{sender}-terminal")),
        sender_profile: ClientProfile::desktop_terminal(),
        payload_type: PayloadType::Text,
        body: MessageBody {
            preview: text.into(),
            plain_text: text.into(),
            language_tag: "zh-CN".into(),
        },
        ciphertext: vec![],
        timestamp_ms: now_ms,
        ephemeral: false,
    };
    store.merge_message(message.clone(), DeliveryState::PendingNetwork)?;
    if transport.publish(&message).is_ok() {
        store.merge_message(message, DeliveryState::Delivered)?;
    }
    Ok(())
}
