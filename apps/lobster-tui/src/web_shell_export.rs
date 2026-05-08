use std::{fs, path::Path};

use chat_storage::TimelineStore;
use serde::Serialize;

use crate::{
    Conversation, conversation_kind_label, conversation_participant_label,
    conversation_route_label, conversation_scene_banner, conversation_scene_summary,
    conversation_title, message_projection::timeline_entry_text, timestamp_label,
};

#[derive(Debug, Serialize)]
pub(crate) struct WebRoomMessage {
    pub(crate) sender: String,
    pub(crate) timestamp: String,
    pub(crate) text: String,
}

#[derive(Debug, Serialize)]
pub(crate) struct WebRoomState {
    pub(crate) id: String,
    pub(crate) title: String,
    pub(crate) subtitle: String,
    pub(crate) meta: String,
    pub(crate) kind_hint: String,
    pub(crate) participant_label: String,
    pub(crate) member_count: usize,
    pub(crate) scene_banner: Option<String>,
    pub(crate) scene_summary: Option<String>,
    pub(crate) messages: Vec<WebRoomMessage>,
}

#[derive(Debug, Serialize)]
pub(crate) struct WebShellState {
    pub(crate) rooms: Vec<WebRoomState>,
}

pub(crate) fn export_web_shell_data(
    generated_dir: &Path,
    bootstrap: &host_adapter::WebShellBootstrap,
    store: &impl TimelineStore,
    conversations: &[Conversation],
    now_ms: i64,
) -> Result<(), String> {
    fs::create_dir_all(generated_dir)
        .map_err(|error| format!("create web generated dir failed: {error}"))?;

    let state = WebShellState {
        rooms: conversations
            .iter()
            .map(|conversation| {
                let messages = store
                    .recent_messages(&conversation.conversation_id, 64)
                    .into_iter()
                    .map(|entry| {
                        let text = timeline_entry_text(&entry);
                        WebRoomMessage {
                            sender: entry.envelope.sender.0,
                            timestamp: timestamp_label(entry.envelope.timestamp_ms, now_ms),
                            text,
                        }
                    })
                    .collect::<Vec<_>>();

                WebRoomState {
                    id: conversation.conversation_id.0.clone(),
                    title: conversation_title(conversation),
                    subtitle: conversation_participant_label(conversation),
                    meta: conversation_route_label(conversation),
                    kind_hint: conversation_kind_label(conversation).into(),
                    participant_label: conversation_participant_label(conversation),
                    member_count: conversation.participants.len().max(1),
                    scene_banner: conversation_scene_banner(conversation),
                    scene_summary: Some(conversation_scene_summary(conversation)),
                    messages,
                }
            })
            .collect(),
    };

    let bootstrap_path = generated_dir.join("bootstrap.json");
    let state_path = generated_dir.join("state.json");

    fs::write(
        &bootstrap_path,
        serde_json::to_vec_pretty(bootstrap)
            .map_err(|error| format!("serialize web bootstrap failed: {error}"))?,
    )
    .map_err(|error| format!("write web bootstrap failed: {error}"))?;

    fs::write(
        &state_path,
        serde_json::to_vec_pretty(&state)
            .map_err(|error| format!("serialize web state failed: {error}"))?,
    )
    .map_err(|error| format!("write web state failed: {error}"))?;

    Ok(())
}
