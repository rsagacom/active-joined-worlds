use std::path::PathBuf;

use chat_core::{ArchivePolicy, ConversationId};
use chat_storage::{FileTimelineStore, TimelineStore};
use host_adapter::{HostCapabilities, TerminalRenderProfile};

use crate::bootstrap_paths::{default_mobile_bootstrap_from_env, resolve_bootstrap_paths};
use crate::conversation_bootstrap::bootstrap_conversations;
use crate::seed_bootstrap::seed_missing_messages;
use crate::transport_bootstrap::{
    TransportAdapter, build_transport, conversation_topic_subscriptions, desktop_light_endpoint,
};
use crate::{FocusArea, LaunchSurface, resolve_runtime_render_profile};

pub(crate) struct AppBootstrap {
    pub(crate) desktop_render: TerminalRenderProfile,
    pub(crate) mobile_bootstrap: host_adapter::WebShellBootstrap,
    pub(crate) web_generated_dir: PathBuf,
    pub(crate) store: FileTimelineStore,
    pub(crate) transport: Box<dyn TransportAdapter>,
    pub(crate) active_conversation_id: ConversationId,
    pub(crate) selected_conversation_id: ConversationId,
    pub(crate) transcript_scroll: usize,
    pub(crate) focus_area: FocusArea,
    pub(crate) input_buffer: String,
}

pub(crate) fn bootstrap_app(launch_mode: LaunchSurface) -> Result<AppBootstrap, String> {
    let desktop = HostCapabilities::desktop_terminal();
    let desktop_render =
        resolve_runtime_render_profile(desktop.recommended_terminal_render_profile());
    let archive_policy = ArchivePolicy {
        active_window_hours: 24,
        local_retention_days: Some(30),
        allow_user_pinned_archive: true,
        archive_when_idle_hours: 24,
    };
    let mobile_bootstrap = default_mobile_bootstrap_from_env();
    let bootstrap_paths = resolve_bootstrap_paths()?;
    let state_dir = bootstrap_paths.state_dir;
    let web_generated_dir = bootstrap_paths.web_generated_dir;
    let mut store = FileTimelineStore::open(&state_dir, archive_policy)?;
    let endpoint = desktop_light_endpoint();
    let (mut transport, _transport_backend) = build_transport(endpoint, 64)?;

    let conversation_bootstrap = bootstrap_conversations(launch_mode);
    let known_conversations = conversation_bootstrap.known_conversations;
    for conversation in &known_conversations {
        store.upsert_conversation(conversation.clone())?;
    }
    let active_conversation_id = conversation_bootstrap.active_conversation_id;
    let selected_conversation_id = conversation_bootstrap.selected_conversation_id;

    seed_missing_messages(&mut store, transport.as_mut(), &known_conversations)?;

    let subscriptions = conversation_topic_subscriptions(&known_conversations);
    transport.subscribe_topics(&subscriptions)?;

    Ok(AppBootstrap {
        desktop_render,
        mobile_bootstrap,
        web_generated_dir,
        store,
        transport,
        active_conversation_id,
        selected_conversation_id,
        transcript_scroll: 0,
        focus_area: FocusArea::Nav,
        input_buffer: String::new(),
    })
}
