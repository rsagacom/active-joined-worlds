use std::{collections::HashMap, env, time::Duration};

use chat_core::{
    ClientProfile, Conversation, ConversationId, ConversationKind, ConversationScope,
    DeliveryState, DeviceId, IdentityId, MessageBody, MessageEnvelope, MessageId, PayloadType,
    SceneHotspotLayer, SceneImageLayer, SceneLandmark, SceneMetadata, SceneRenderStyle, SceneScope,
};
use chat_storage::{FileTimelineStore, TimelineStore};
use serde::Deserialize;
use transport_waku::WakuFrameCodec;

use crate::{
    LaunchSurface, conversation_bootstrap::ConversationBootstrap, launch_conversation,
    launch_identity,
};

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct GatewayShellState {
    #[serde(default)]
    rooms: Vec<GatewayRoom>,
    #[serde(default)]
    conversation_shell: Option<GatewayConversationShell>,
    #[serde(default)]
    scene_render: Option<GatewaySceneRender>,
}

#[derive(Debug, Clone, Deserialize)]
struct GatewayConversationShell {
    #[serde(default)]
    active_conversation_id: Option<String>,
    #[serde(default)]
    conversations: Vec<GatewayConversation>,
}

#[derive(Debug, Clone, Deserialize)]
struct GatewayConversation {
    conversation_id: String,
    kind: String,
    scope: String,
    #[serde(default)]
    messages: Vec<GatewayMessage>,
}

#[derive(Debug, Clone, Deserialize)]
struct GatewayRoom {
    id: String,
    kind: String,
    scope: String,
    #[serde(default)]
    scene_banner: Option<String>,
    #[serde(default)]
    scene_summary: Option<String>,
    #[serde(default)]
    room_variant: Option<String>,
    #[serde(default)]
    room_motif: Option<String>,
    #[serde(default)]
    image_layer: Option<SceneImageLayer>,
    #[serde(default)]
    hotspot_layer: Option<SceneHotspotLayer>,
    #[serde(default)]
    messages: Vec<GatewayMessage>,
}

#[derive(Debug, Clone, Deserialize)]
struct GatewaySceneRender {
    #[serde(default)]
    scenes: Vec<GatewayScene>,
}

#[derive(Debug, Clone, Deserialize)]
struct GatewayScene {
    conversation_id: String,
    #[serde(default)]
    scene_banner: Option<String>,
    #[serde(default)]
    scene_summary: Option<String>,
    #[serde(default)]
    room_variant: Option<String>,
    #[serde(default)]
    room_motif: Option<String>,
    #[serde(default)]
    image_layer: Option<SceneImageLayer>,
    #[serde(default)]
    hotspot_layer: Option<SceneHotspotLayer>,
}

#[derive(Debug, Clone, Deserialize)]
struct GatewayMessage {
    message_id: String,
    #[serde(default)]
    reply_to_message_id: Option<String>,
    sender: String,
    timestamp_ms: i64,
    #[serde(default)]
    delivery_status: String,
    text: String,
    #[serde(default)]
    is_recalled: bool,
    #[serde(default)]
    recalled_by: Option<String>,
    #[serde(default)]
    recalled_at_ms: Option<i64>,
    #[serde(default)]
    is_edited: bool,
    #[serde(default)]
    edited_by: Option<String>,
    #[serde(default)]
    edited_at_ms: Option<i64>,
}

#[derive(Debug, Clone)]
struct GatewayConversationRecord {
    conversation_id: String,
    kind: String,
    scope: String,
    scene_banner: Option<String>,
    scene_summary: Option<String>,
    room_variant: Option<String>,
    room_motif: Option<String>,
    image_layer: Option<SceneImageLayer>,
    hotspot_layer: Option<SceneHotspotLayer>,
    messages: Vec<GatewayMessage>,
}

fn http_agent() -> ureq::Agent {
    ureq::AgentBuilder::new()
        .timeout_connect(Duration::from_secs(10))
        .timeout_read(Duration::from_secs(30))
        .timeout_write(Duration::from_secs(10))
        .build()
}

fn query_escape(value: &str) -> String {
    const HEX: &[u8; 16] = b"0123456789ABCDEF";
    let mut escaped = String::with_capacity(value.len());
    for byte in value.bytes() {
        if byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'.' | b'_' | b'~') {
            escaped.push(byte as char);
        } else {
            escaped.push('%');
            escaped.push(HEX[(byte >> 4) as usize] as char);
            escaped.push(HEX[(byte & 0x0F) as usize] as char);
        }
    }
    escaped
}

fn gateway_auth_header() -> Option<String> {
    ["LOBSTER_SESSION_TOKEN", "LOBSTER_AGENT_TOKEN"]
        .into_iter()
        .find_map(|variable| {
            env::var(variable)
                .ok()
                .map(|value| value.trim().to_owned())
                .filter(|value| !value.is_empty())
                .map(|value| format!("Bearer {value}"))
        })
}

fn shell_state_url(base_url: &str, resident_id: &str) -> String {
    format!(
        "{}/v1/shell/state?resident_id={}",
        base_url.trim_end_matches('/'),
        query_escape(resident_id.trim())
    )
}

pub(crate) fn fetch_gateway_shell_state(
    base_url: &str,
    resident_id: &str,
) -> Result<GatewayShellState, String> {
    let url = shell_state_url(base_url, resident_id);
    let mut request = http_agent().get(&url);
    if let Some(header) = gateway_auth_header() {
        request = request.set("Authorization", &header);
    }
    request
        .call()
        .map_err(|error| format!("Gateway shell state request failed: {error}"))?
        .into_json::<GatewayShellState>()
        .map_err(|error| format!("Gateway shell state response decode failed: {error}"))
}

fn parse_kind(value: &str) -> Result<ConversationKind, String> {
    match value.trim().to_ascii_lowercase().as_str() {
        "direct" => Ok(ConversationKind::Direct),
        "room" | "public" => Ok(ConversationKind::Room),
        other => Err(format!(
            "Gateway shell state returned unsupported conversation kind: {other}"
        )),
    }
}

fn parse_scope(value: &str) -> Result<ConversationScope, String> {
    match value.trim().to_ascii_lowercase().as_str() {
        "private" => Ok(ConversationScope::Private),
        "city_public" => Ok(ConversationScope::CityPublic),
        "city_private" => Ok(ConversationScope::CityPrivate),
        "cross_city_shared" => Ok(ConversationScope::CrossCityShared),
        other => Err(format!(
            "Gateway shell state returned unsupported conversation scope: {other}"
        )),
    }
}

fn scene_scope(conversation_id: &str, scope: ConversationScope) -> SceneScope {
    if conversation_id.starts_with("dm:") || scope == ConversationScope::Private {
        SceneScope::DirectRoom
    } else if conversation_id.starts_with("room:world:")
        || scope == ConversationScope::CrossCityShared
    {
        SceneScope::PublicRoom
    } else {
        SceneScope::City
    }
}

fn scene_metadata(
    record: &GatewayConversationRecord,
    scope: ConversationScope,
) -> Option<SceneMetadata> {
    let has_scene = record.scene_banner.is_some()
        || record.scene_summary.is_some()
        || record.room_variant.is_some()
        || record.room_motif.is_some()
        || record.image_layer.is_some()
        || record.hotspot_layer.is_some();
    if !has_scene {
        return None;
    }

    let landmarks = record
        .hotspot_layer
        .as_ref()
        .map(|layer| {
            layer
                .hotspots
                .iter()
                .map(|hotspot| SceneLandmark {
                    slot_id: hotspot.hotspot_id.clone(),
                    label: hotspot.label.clone(),
                    sprite_hint: hotspot.sprite_hint.clone(),
                    interaction_hint: hotspot.interaction_hint.clone(),
                })
                .collect()
        })
        .unwrap_or_default();

    Some(SceneMetadata {
        scope: scene_scope(&record.conversation_id, scope),
        render_style: SceneRenderStyle::SfcPixel,
        title_banner: record.scene_banner.clone(),
        background_preset: record.room_variant.clone().unwrap_or_default(),
        ambiance: record
            .room_motif
            .clone()
            .or_else(|| record.scene_summary.clone())
            .unwrap_or_default(),
        owner_editable: record
            .image_layer
            .as_ref()
            .is_some_and(|layer| layer.owner_editable)
            || record
                .hotspot_layer
                .as_ref()
                .is_some_and(|layer| layer.owner_editable),
        avatar_editable: false,
        primary_avatar: None,
        assistant_slots: Vec::new(),
        image_layer: record.image_layer.clone(),
        hotspot_layer: record.hotspot_layer.clone(),
        landmarks,
    })
}

fn participants_for(
    conversation_id: &str,
    viewer_id: &str,
    kind: &ConversationKind,
    messages: &[GatewayMessage],
) -> Vec<IdentityId> {
    if matches!(kind, ConversationKind::Direct) {
        let parts = conversation_id.split(':').collect::<Vec<_>>();
        if parts.len() == 3 && parts[0] == "dm" && parts[1] != parts[2] {
            return vec![IdentityId(parts[1].into()), IdentityId(parts[2].into())];
        }
    }

    let mut participants = Vec::new();
    for identity in
        std::iter::once(viewer_id).chain(messages.iter().map(|message| message.sender.as_str()))
    {
        if identity.trim().is_empty()
            || participants
                .iter()
                .any(|item: &IdentityId| item.0 == identity)
        {
            continue;
        }
        participants.push(IdentityId(identity.to_string()));
    }
    participants
}

fn message_envelope(
    conversation_id: &str,
    message: &GatewayMessage,
) -> Result<MessageEnvelope, String> {
    if message.message_id.trim().is_empty() || message.sender.trim().is_empty() {
        return Err("Gateway shell state contains a message without message_id or sender".into());
    }
    let payload_type = if message.sender == "system" {
        PayloadType::System
    } else {
        PayloadType::Text
    };
    Ok(MessageEnvelope {
        message_id: MessageId(message.message_id.clone()),
        conversation_id: ConversationId(conversation_id.to_string()),
        sender: IdentityId(message.sender.clone()),
        sender_device: DeviceId(format!("gateway:{}-device", message.sender)),
        sender_profile: ClientProfile::desktop_terminal(),
        payload_type,
        body: MessageBody {
            preview: message.text.clone(),
            plain_text: message.text.clone(),
            language_tag: "zh-CN".into(),
        },
        ciphertext: Vec::new(),
        timestamp_ms: message.timestamp_ms,
        ephemeral: false,
        reply_to_message_id: message
            .reply_to_message_id
            .as_ref()
            .map(|value| MessageId(value.clone())),
    })
}

fn delivery_state(value: &str) -> DeliveryState {
    match value.trim().to_ascii_lowercase().as_str() {
        "local_only" => DeliveryState::LocalOnly,
        "pending_network" => DeliveryState::PendingNetwork,
        "archived_local" => DeliveryState::ArchivedLocal,
        _ => DeliveryState::Delivered,
    }
}

fn scene_by_conversation(payload: &GatewayShellState) -> HashMap<String, GatewayScene> {
    payload
        .scene_render
        .as_ref()
        .map(|render| {
            render
                .scenes
                .iter()
                .cloned()
                .map(|scene| (scene.conversation_id.clone(), scene))
                .collect()
        })
        .unwrap_or_default()
}

fn records(payload: &GatewayShellState) -> Vec<GatewayConversationRecord> {
    let rooms = payload
        .rooms
        .iter()
        .cloned()
        .map(|room| (room.id.clone(), room))
        .collect::<HashMap<_, _>>();
    let scenes = scene_by_conversation(payload);

    let contract = payload
        .conversation_shell
        .as_ref()
        .map(|shell| shell.conversations.clone())
        .unwrap_or_default();

    if !contract.is_empty() {
        return contract
            .into_iter()
            .map(|conversation| {
                let room = rooms.get(&conversation.conversation_id);
                let scene = scenes.get(&conversation.conversation_id);
                GatewayConversationRecord {
                    conversation_id: conversation.conversation_id,
                    kind: conversation.kind,
                    scope: conversation.scope,
                    scene_banner: room
                        .and_then(|item| item.scene_banner.clone())
                        .or_else(|| scene.and_then(|item| item.scene_banner.clone())),
                    scene_summary: room
                        .and_then(|item| item.scene_summary.clone())
                        .or_else(|| scene.and_then(|item| item.scene_summary.clone())),
                    room_variant: room
                        .and_then(|item| item.room_variant.clone())
                        .or_else(|| scene.and_then(|item| item.room_variant.clone())),
                    room_motif: room
                        .and_then(|item| item.room_motif.clone())
                        .or_else(|| scene.and_then(|item| item.room_motif.clone())),
                    image_layer: room
                        .and_then(|item| item.image_layer.clone())
                        .or_else(|| scene.and_then(|item| item.image_layer.clone())),
                    hotspot_layer: room
                        .and_then(|item| item.hotspot_layer.clone())
                        .or_else(|| scene.and_then(|item| item.hotspot_layer.clone())),
                    messages: if conversation.messages.is_empty() {
                        room.map(|item| item.messages.clone()).unwrap_or_default()
                    } else {
                        conversation.messages
                    },
                }
            })
            .collect();
    }

    payload
        .rooms
        .iter()
        .map(|room| {
            let scene = scenes.get(&room.id);
            GatewayConversationRecord {
                conversation_id: room.id.clone(),
                kind: room.kind.clone(),
                scope: room.scope.clone(),
                scene_banner: room
                    .scene_banner
                    .clone()
                    .or_else(|| scene.and_then(|item| item.scene_banner.clone())),
                scene_summary: room
                    .scene_summary
                    .clone()
                    .or_else(|| scene.and_then(|item| item.scene_summary.clone())),
                room_variant: room
                    .room_variant
                    .clone()
                    .or_else(|| scene.and_then(|item| item.room_variant.clone())),
                room_motif: room
                    .room_motif
                    .clone()
                    .or_else(|| scene.and_then(|item| item.room_motif.clone())),
                image_layer: room
                    .image_layer
                    .clone()
                    .or_else(|| scene.and_then(|item| item.image_layer.clone())),
                hotspot_layer: room
                    .hotspot_layer
                    .clone()
                    .or_else(|| scene.and_then(|item| item.hotspot_layer.clone())),
                messages: room.messages.clone(),
            }
        })
        .collect()
}

fn conversation_from_record(
    record: &GatewayConversationRecord,
    viewer_id: &str,
) -> Result<Conversation, String> {
    let kind = parse_kind(&record.kind)?;
    let scope = parse_scope(&record.scope)?;
    let timestamps = record.messages.iter().map(|message| message.timestamp_ms);
    let created_at_ms = timestamps.clone().min().unwrap_or_default();
    let last_active_at_ms = timestamps.max().unwrap_or(created_at_ms);
    Ok(Conversation {
        conversation_id: ConversationId(record.conversation_id.clone()),
        kind: kind.clone(),
        scope,
        scene: scene_metadata(record, scope),
        content_topic: WakuFrameCodec::content_topic_for(&ConversationId(
            record.conversation_id.clone(),
        )),
        participants: participants_for(&record.conversation_id, viewer_id, &kind, &record.messages),
        created_at_ms,
        last_active_at_ms,
    })
}

pub(crate) fn hydrate_gateway_shell_state(
    store: &mut FileTimelineStore,
    payload: GatewayShellState,
    launch_mode: LaunchSurface,
    viewer_id: &str,
) -> Result<ConversationBootstrap, String> {
    let records = records(&payload);
    if records.is_empty() {
        return Err("Gateway shell state returned no visible conversations".into());
    }

    let mut conversations = Vec::with_capacity(records.len());
    for record in &records {
        let conversation = conversation_from_record(record, viewer_id)?;
        store.upsert_conversation(conversation.clone())?;
        for message in &record.messages {
            let envelope = message_envelope(&record.conversation_id, message)?;
            store.merge_message(envelope, delivery_state(&message.delivery_status))?;
            if message.is_edited {
                let actor = message
                    .edited_by
                    .as_deref()
                    .unwrap_or(message.sender.as_str());
                store.edit_message(
                    &ConversationId(record.conversation_id.clone()),
                    &MessageId(message.message_id.clone()),
                    IdentityId(actor.to_string()),
                    message.text.clone(),
                    message.edited_at_ms.unwrap_or(message.timestamp_ms),
                )?;
            }
            if message.is_recalled {
                let actor = message
                    .recalled_by
                    .as_deref()
                    .unwrap_or(message.sender.as_str());
                store.recall_message(
                    &ConversationId(record.conversation_id.clone()),
                    &MessageId(message.message_id.clone()),
                    IdentityId(actor.to_string()),
                    message.recalled_at_ms.unwrap_or(message.timestamp_ms),
                )?;
            }
        }
        conversations.push(conversation);
    }

    let preferred_id = launch_conversation(launch_mode).conversation_id;
    let active_id = conversations
        .iter()
        .find(|item| item.conversation_id == preferred_id)
        .map(|item| item.conversation_id.clone())
        .or_else(|| {
            payload
                .conversation_shell
                .as_ref()
                .and_then(|shell| shell.active_conversation_id.as_deref())
                .map(|value| ConversationId(value.to_string()))
                .filter(|id| conversations.iter().any(|item| item.conversation_id == *id))
        })
        .unwrap_or_else(|| conversations[0].conversation_id.clone());

    Ok(ConversationBootstrap {
        known_conversations: conversations,
        active_conversation_id: active_id.clone(),
        selected_conversation_id: active_id,
    })
}

pub(crate) fn bootstrap_from_gateway(
    store: &mut FileTimelineStore,
    base_url: &str,
    launch_mode: LaunchSurface,
) -> Result<ConversationBootstrap, String> {
    let viewer_id = launch_identity(launch_mode);
    let payload = fetch_gateway_shell_state(base_url, &viewer_id)?;
    hydrate_gateway_shell_state(store, payload, launch_mode, &viewer_id)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chat_core::{ArchivePolicy, ConversationScope};
    use std::fs;

    fn sample_payload() -> GatewayShellState {
        serde_json::from_value(serde_json::json!({
            "rooms": [{
                "id": "dm:alice:bob",
                "kind": "direct",
                "scope": "private",
                "scene_banner": "夜航居所",
                "scene_summary": "一条正式的居所投影",
                "room_variant": "home",
                "messages": [{
                    "message_id": "gw-1",
                    "sender": "alice",
                    "timestamp_ms": 100,
                    "delivery_status": "delivered",
                    "text": "来自 Gateway",
                    "is_edited": true,
                    "edited_by": "alice",
                    "edited_at_ms": 120
                }]
            }],
            "conversation_shell": {
                "active_conversation_id": "dm:alice:bob",
                "conversations": [{
                    "conversation_id": "dm:alice:bob",
                    "kind": "direct",
                    "scope": "private",
                    "messages": []
                }]
            },
            "scene_render": {
                "scenes": [{
                    "conversation_id": "dm:alice:bob",
                    "room_variant": "home",
                    "room_motif": "Gateway scene"
                }]
            }
        }))
        .unwrap()
    }

    #[test]
    fn gateway_state_prefers_conversation_shell_and_merges_scene_render() {
        let (root, mut store) = temp_store("lobster-tui-shell-state");
        let bootstrap = hydrate_gateway_shell_state(
            &mut store,
            sample_payload(),
            LaunchSurface::Direct,
            "alice",
        )
        .unwrap();

        assert_eq!(bootstrap.known_conversations.len(), 1);
        let conversation = &bootstrap.known_conversations[0];
        assert_eq!(conversation.conversation_id.0, "dm:alice:bob");
        assert_eq!(conversation.scope, ConversationScope::Private);
        assert_eq!(conversation.participants.len(), 2);
        assert_eq!(
            conversation.scene.as_ref().unwrap().ambiance,
            "Gateway scene"
        );
        assert_eq!(
            store
                .recent_messages(&conversation.conversation_id, 10)
                .len(),
            1
        );
        let entry = store
            .recent_messages(&conversation.conversation_id, 10)
            .pop()
            .unwrap();
        assert_eq!(
            entry.edited_by.as_ref().map(|id| id.0.as_str()),
            Some("alice")
        );
        assert_eq!(bootstrap.active_conversation_id.0, "dm:alice:bob");
        let _ = fs::remove_dir_all(root);
    }

    #[test]
    fn shell_state_url_escapes_resident_id_and_trims_base_url() {
        assert_eq!(
            shell_state_url("http://127.0.0.1:8787/", "user:alice bob"),
            "http://127.0.0.1:8787/v1/shell/state?resident_id=user%3Aalice%20bob"
        );
    }

    fn temp_store(label: &str) -> (std::path::PathBuf, FileTimelineStore) {
        let root = std::env::temp_dir().join(format!("{label}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(&root).unwrap();
        let store = FileTimelineStore::open(&root, ArchivePolicy::default()).unwrap();
        (root, store)
    }
}
