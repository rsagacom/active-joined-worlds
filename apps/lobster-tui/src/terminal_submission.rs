use std::env;

use chat_core::{
    ClientProfile, DeliveryState, DeviceId, IdentityId, MessageBody, MessageEnvelope, MessageId,
    PayloadType,
};
use serde::Deserialize;
use transport_waku::{TopicSubscription, WakuFrameCodec};

use chat_storage::FileTimelineStore;
use chat_storage::TimelineStore;

use super::{
    Conversation, ConversationId, ConversationKind, ConversationScope, LaunchSurface,
    TransportAdapter, append_local_message, current_time_ms, direct_conversation,
    friendly_connection_label, launch_identity, selectable_conversations,
};

pub(crate) enum SubmissionAction {
    Continue,
    Quit,
}

#[derive(Debug, Deserialize)]
struct OpenDirectSessionResponse {
    conversation_id: String,
}

fn open_direct_conversation_id(requester_id: &str, peer_id: &str) -> ConversationId {
    let fallback = direct_conversation(requester_id, peer_id);
    let Ok(base_url) = env::var("LOBSTER_WAKU_GATEWAY_URL") else {
        return fallback;
    };
    let url = format!("{}/v1/direct/open", base_url.trim_end_matches('/'));
    match ureq::post(&url).send_json(serde_json::json!({
        "requester_id": requester_id,
        "peer_id": peer_id,
    })) {
        Ok(response) => response
            .into_json::<OpenDirectSessionResponse>()
            .map(|payload| ConversationId(payload.conversation_id))
            .unwrap_or(fallback),
        Err(_) => fallback,
    }
}

fn build_direct_conversation(
    store: &impl TimelineStore,
    requester_id: &str,
    peer_id: &str,
) -> Result<Conversation, String> {
    let conversation_id = open_direct_conversation_id(requester_id, peer_id);
    if let Some(existing) = store
        .active_conversations()
        .into_iter()
        .find(|conversation| conversation.conversation_id == conversation_id)
    {
        return Ok(existing);
    }

    let now_ms = current_time_ms()?;
    Ok(Conversation {
        content_topic: WakuFrameCodec::content_topic_for(&conversation_id),
        conversation_id,
        kind: ConversationKind::Direct,
        scope: ConversationScope::Private,
        scene: None,
        participants: vec![IdentityId(requester_id.into()), IdentityId(peer_id.into())],
        created_at_ms: now_ms,
        last_active_at_ms: now_ms,
    })
}

fn open_direct_conversation(
    store: &mut FileTimelineStore,
    transport: &mut dyn TransportAdapter,
    requester_id: &str,
    peer_id: &str,
) -> Result<Option<ConversationId>, String> {
    let peer = peer_id.trim();
    if peer.is_empty() || peer == requester_id {
        return Ok(None);
    }

    let conversation = build_direct_conversation(store, requester_id, peer)?;
    let conversation_id = conversation.conversation_id.clone();
    let content_topic = conversation.content_topic.clone();
    store.upsert_conversation(conversation)?;
    transport.subscribe_topics(&[TopicSubscription {
        content_topic,
        recover_history: true,
    }])?;
    Ok(Some(conversation_id))
}

fn append_terminal_notice(
    store: &mut FileTimelineStore,
    conversation_id: &ConversationId,
    text: &str,
) -> Result<(), String> {
    let now_ms = current_time_ms()?;
    let message_index = store.export_messages(conversation_id).len() + 1;
    let message = MessageEnvelope {
        message_id: MessageId(format!("terminal-notice-{now_ms}-{message_index}")),
        conversation_id: conversation_id.clone(),
        sender: IdentityId("system".into()),
        reply_to_message_id: None,
        sender_device: DeviceId("lobster-tui".into()),
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
    store
        .merge_message(message, DeliveryState::Delivered)
        .map(|_| ())
}

fn terminal_help_notice() -> &'static str {
    "终端命令：/help 查看帮助；/status 查看当前会话与连接；/refresh 刷新当前视图；/world 进入世界大厅；/governance 进入治理房间；/dm <身份> 打开私聊；/open <序号> 打开会话；/quit 退出。"
}

fn terminal_status_notice(
    transport: &dyn TransportAdapter,
    launch_mode: LaunchSurface,
    active_conversation_id: &ConversationId,
    selected_conversation_id: &ConversationId,
) -> String {
    format!(
        "状态：身份 {}；连接 {}；当前会话 {}；选中会话 {}。",
        launch_identity(launch_mode),
        friendly_connection_label(transport.connection_state()),
        active_conversation_id.0,
        selected_conversation_id.0
    )
}

pub(crate) fn handle_terminal_submission(
    store: &mut FileTimelineStore,
    transport: &mut dyn TransportAdapter,
    launch_mode: LaunchSurface,
    active_conversation_id: &mut ConversationId,
    selected_conversation_id: &mut ConversationId,
    trimmed: &str,
) -> Result<SubmissionAction, String> {
    match trimmed {
        "/quit" | "/exit" => Ok(SubmissionAction::Quit),
        "/help" => {
            append_terminal_notice(store, active_conversation_id, terminal_help_notice())?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/status" => {
            let notice = terminal_status_notice(
                transport,
                launch_mode,
                active_conversation_id,
                selected_conversation_id,
            );
            append_terminal_notice(store, active_conversation_id, &notice)?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/refresh" => {
            append_terminal_notice(store, active_conversation_id, "已刷新当前终端视图。")?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/world" => {
            let target = ConversationId("room:world:lobby".into());
            let conversations =
                selectable_conversations(store, launch_mode, active_conversation_id);
            if conversations
                .iter()
                .any(|conversation| conversation.conversation_id == target)
            {
                *active_conversation_id = target.clone();
                *selected_conversation_id = target;
            }
            Ok(SubmissionAction::Continue)
        }
        "/governance" => {
            let target = ConversationId("room:city:aurora-hub:announcements".into());
            let conversations =
                selectable_conversations(store, launch_mode, active_conversation_id);
            if conversations
                .iter()
                .any(|conversation| conversation.conversation_id == target)
            {
                *active_conversation_id = target.clone();
                *selected_conversation_id = target;
            }
            Ok(SubmissionAction::Continue)
        }
        text if text.starts_with("/dm ") => {
            if let Some(target) = open_direct_conversation(
                store,
                transport,
                &launch_identity(launch_mode),
                text.trim_start_matches("/dm").trim(),
            )? {
                *active_conversation_id = target.clone();
                *selected_conversation_id = target;
            }
            Ok(SubmissionAction::Continue)
        }
        text if text.starts_with("/open ") => {
            let slot = text
                .trim_start_matches("/open")
                .trim()
                .parse::<usize>()
                .ok();
            let conversations =
                selectable_conversations(store, launch_mode, active_conversation_id);
            if let Some(index) = slot.filter(|value| *value > 0 && *value <= conversations.len()) {
                let target = conversations[index - 1].conversation_id.clone();
                *active_conversation_id = target.clone();
                *selected_conversation_id = target;
            }
            Ok(SubmissionAction::Continue)
        }
        text => {
            append_local_message(
                store,
                transport,
                active_conversation_id,
                &launch_identity(launch_mode),
                text,
            )?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
    }
}
