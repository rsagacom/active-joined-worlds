use super::*;

impl GatewayRuntime {
    pub(crate) fn merge_frames(
        primary: Vec<EncodedFrame>,
        secondary: Vec<EncodedFrame>,
    ) -> Vec<EncodedFrame> {
        use std::collections::HashSet;

        let mut seen = HashSet::new();
        let mut merged = Vec::new();

        for frame in primary.into_iter().chain(secondary.into_iter()) {
            let key = format!("{}:{}", frame.content_topic, hex::encode(&frame.payload));
            if seen.insert(key) {
                merged.push(frame);
            }
        }
        merged
    }

    pub(crate) fn ingest_message(&mut self, message: MessageEnvelope) -> Result<(), String> {
        self.ensure_conversation_for(&message)?;
        self.timeline_store.append_message(message)?;
        let _ = self
            .timeline_store
            .archive_expired_messages(Self::now_ms())
            .ok();
        Ok(())
    }

    pub(crate) fn publish_frame_to_transport(&mut self, frame: EncodedFrame) -> Result<(), String> {
        use transport_waku::WakuGatewayClient;

        let decoded = transport_waku::WakuFrameCodec::decode(&frame.payload).ok();
        self.node.publish_frame(frame.clone())?;
        if let Some(upstream) = self.upstream_gateway.as_mut() {
            upstream.publish_frame(frame)?;
        }
        if let Some(message) = decoded {
            self.ingest_message(message)?;
        }
        Ok(())
    }

    pub(crate) fn publish_message(&mut self, message: MessageEnvelope) -> Result<(), String> {
        let frame = transport_waku::WakuFrameCodec::encode(&message)?;
        self.publish_frame_to_transport(frame)
    }

    pub(crate) fn set_subscriptions(&mut self, subscriptions: Vec<TopicSubscription>) {
        self.subscriptions = subscriptions.clone();
        for subscription in subscriptions {
            self.node.subscribe(subscription.clone());
            let next_cursor = if subscription.recover_history {
                WakuSyncCursor::default()
            } else {
                WakuSyncCursor {
                    last_timestamp_ms: Some(i64::MAX),
                    last_message_id: None,
                }
            };
            match self.cursors.entry(subscription.content_topic.clone()) {
                std::collections::hash_map::Entry::Occupied(mut entry) => {
                    if subscription.recover_history {
                        entry.insert(next_cursor);
                    }
                }
                std::collections::hash_map::Entry::Vacant(entry) => {
                    entry.insert(next_cursor);
                }
            }
        }
    }

    pub(crate) fn update_cursor(&mut self, content_topic: &str, frames: &[EncodedFrame]) {
        if let Some(frame) = frames.last()
            && let Ok(message) = transport_waku::WakuFrameCodec::decode(&frame.payload)
        {
            self.cursors.insert(
                content_topic.to_string(),
                WakuSyncCursor {
                    last_timestamp_ms: Some(message.timestamp_ms),
                    last_message_id: Some(message.message_id.0),
                },
            );
        }
    }

    pub(crate) fn seed_demo_messages(&mut self) -> Result<(), String> {
        let now_ms = Self::now_ms();
        let seed = [
            (
                "room:world:lobby",
                "system",
                "world lobby online. Cities and residents can discover each other here.",
                now_ms - 20 * 60 * 1000,
            ),
            (
                "room:world:lobby",
                "builder",
                "Local gateway online. H5 shell can now poll and post through localhost.",
                now_ms - 5 * 60 * 1000,
            ),
            (
                "dm:builder:rsaga",
                "builder",
                "Core split: headless chat, host adapter, optional AI sidecar.",
                now_ms - 60 * 60 * 1000,
            ),
        ];

        for (conversation_id, sender, text, timestamp_ms) in seed {
            let message_id = self.next_message_id();
            self.publish_message(MessageEnvelope {
                message_id: MessageId(message_id),
                conversation_id: ConversationId(conversation_id.into()),
                sender: IdentityId(sender.into()),
                reply_to_message_id: None,
                sender_device: DeviceId(format!("{sender}-seed")),
                sender_profile: ClientProfile::mobile_web(),
                payload_type: PayloadType::Text,
                body: MessageBody {
                    preview: text.into(),
                    plain_text: text.into(),
                    language_tag: "en".into(),
                },
                ciphertext: vec![],
                timestamp_ms,
                ephemeral: false,
            })?;
        }
        Ok(())
    }
}
