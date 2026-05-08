use super::*;

#[derive(Debug, Clone, Serialize)]
pub(crate) struct ShellRoomMessage {
    pub(crate) message_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) reply_to_message_id: Option<String>,
    pub(crate) is_recalled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) recalled_by: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) recalled_at_ms: Option<i64>,
    pub(crate) is_edited: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) edited_by: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) edited_at_ms: Option<i64>,
    pub(crate) sender: String,
    pub(crate) timestamp_ms: i64,
    pub(crate) timestamp_label: String,
    pub(crate) text: String,
}

#[derive(Debug, Clone, Serialize)]
pub(crate) struct ShellRoomState {
    pub(crate) id: String,
    pub(crate) kind: String,
    pub(crate) scope: String,
    pub(crate) title: String,
    pub(crate) subtitle: String,
    pub(crate) meta: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) kind_hint: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) self_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) peer_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) participant_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) route_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) list_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) status_line: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) thread_headline: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) chat_status_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) queue_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) overview_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) context_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) preview_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) last_activity_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) activity_time_label: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) search_terms: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) member_count: Option<usize>,
    pub(crate) scene_banner: Option<String>,
    pub(crate) scene_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) room_variant: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) room_motif: Option<String>,
    pub(crate) is_frozen: bool,
    pub(crate) messages: Vec<ShellRoomMessage>,
}

#[derive(Debug, Clone, Serialize)]
pub(crate) struct ConversationShellConversation {
    pub(crate) conversation_id: String,
    pub(crate) kind: String,
    pub(crate) scope: String,
    pub(crate) title: String,
    pub(crate) subtitle: String,
    pub(crate) meta: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) kind_hint: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) self_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) peer_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) participant_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) route_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) list_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) status_line: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) thread_headline: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) chat_status_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) queue_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) overview_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) context_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) preview_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) last_activity_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) activity_time_label: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) search_terms: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) member_count: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) caretaker: Option<ShellCaretakerProjection>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) detail_card: Option<ShellDetailCardProjection>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) workflow: Option<ShellWorkflowProjection>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) inline_actions: Vec<ShellInlineActionProjection>,
    pub(crate) messages: Vec<ShellRoomMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct ShellLabelValue {
    pub(crate) label: String,
    pub(crate) value: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct ShellCaretakerMessage {
    pub(crate) visitor: String,
    pub(crate) note: String,
    pub(crate) urgency: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct ShellCaretakerPatrol {
    pub(crate) mode: String,
    pub(crate) last_check: String,
    pub(crate) outcome: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct ShellCaretakerProjection {
    pub(crate) name: String,
    pub(crate) role_label: String,
    pub(crate) persona: String,
    pub(crate) status: String,
    pub(crate) memory: String,
    pub(crate) auto_reply: String,
    pub(crate) pending_visitors: usize,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) notifications: Vec<String>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) messages: Vec<ShellCaretakerMessage>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) patrol: Option<ShellCaretakerPatrol>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct ShellDetailCardProjection {
    pub(crate) summary_title: String,
    pub(crate) summary_copy: String,
    pub(crate) kicker: String,
    pub(crate) title: String,
    pub(crate) monogram: String,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) meta: Vec<ShellLabelValue>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) actions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct ShellWorkflowStage {
    pub(crate) label: String,
    pub(crate) copy: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) advance_label: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct ShellActionStateTemplateProjection {
    pub(crate) state: String,
    pub(crate) draft_template: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct ShellActionTemplateProjection {
    pub(crate) action: String,
    pub(crate) draft_template: String,
    pub(crate) send_label: String,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) state_templates: Vec<ShellActionStateTemplateProjection>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct ShellWorkflowProjection {
    pub(crate) action: String,
    pub(crate) state: String,
    pub(crate) title: String,
    pub(crate) summary: String,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) steps: Vec<ShellWorkflowStage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct ShellInlineActionProjection {
    pub(crate) role: String,
    pub(crate) label: String,
    pub(crate) action: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) next_state: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub(crate) struct ConversationShellState {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) active_conversation_id: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) action_templates: Vec<ShellActionTemplateProjection>,
    pub(crate) conversations: Vec<ConversationShellConversation>,
}

#[derive(Debug, Clone, Serialize)]
pub(crate) struct SceneRenderConversation {
    pub(crate) conversation_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) scene_banner: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) scene_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) room_variant: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) room_motif: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) stage: Option<SceneStageProjection>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) portrait: Option<ScenePortraitProjection>,
}

#[derive(Debug, Clone, Serialize)]
pub(crate) struct SceneStageProjection {
    pub(crate) title: String,
    pub(crate) summary: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) badge: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub(crate) struct ScenePortraitProjection {
    pub(crate) title: String,
    pub(crate) summary: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) badge: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) monogram: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub(crate) struct SceneRenderState {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) active_conversation_id: Option<String>,
    pub(crate) scenes: Vec<SceneRenderConversation>,
}

#[derive(Debug, Clone, Serialize)]
pub(crate) struct ShellState {
    pub(crate) state_version: String,
    pub(crate) rooms: Vec<ShellRoomState>,
    pub(crate) conversation_shell: ConversationShellState,
    pub(crate) scene_render: SceneRenderState,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct ResidentDirectoryEntry {
    pub(crate) resident_id: String,
    pub(crate) active_cities: Vec<String>,
    pub(crate) pending_cities: Vec<String>,
    pub(crate) roles: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub(crate) struct ProviderStatusResponse {
    pub(crate) mode: String,
    pub(crate) base_url: Option<String>,
    pub(crate) connection_state: WakuConnectionState,
    pub(crate) reachable: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub(crate) struct MirrorSourceConfig {
    pub(crate) base_url: String,
    pub(crate) enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct MirrorSourceStatus {
    pub(crate) base_url: String,
    pub(crate) source_kind: String,
    pub(crate) enabled: bool,
    pub(crate) reachable: bool,
    pub(crate) city_count: usize,
    pub(crate) notice_count: usize,
    pub(crate) advisory_count: usize,
    pub(crate) last_snapshot_at_ms: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub(crate) struct PersistedProviderConfig {
    pub(crate) upstream_gateway_url: Option<String>,
    #[serde(default)]
    pub(crate) mirror_sources: Vec<MirrorSourceConfig>,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct ShellMessageRequest {
    pub(crate) room_id: String,
    pub(crate) sender: String,
    pub(crate) text: String,
    pub(crate) reply_to_message_id: Option<String>,
    pub(crate) device_id: Option<String>,
    pub(crate) language_tag: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct ShellMessageResponse {
    pub(crate) ok: bool,
    pub(crate) conversation_id: String,
    pub(crate) message_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) reply_to_message_id: Option<String>,
    pub(crate) delivered_at_ms: i64,
    pub(crate) delivery_status: String,
    pub(crate) sender: String,
    pub(crate) text: String,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct RecallShellMessageRequest {
    pub(crate) room_id: String,
    pub(crate) message_id: String,
    pub(crate) actor: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct RecallShellMessageResponse {
    pub(crate) ok: bool,
    pub(crate) conversation_id: String,
    pub(crate) message_id: String,
    pub(crate) recall_status: String,
    pub(crate) recalled_at_ms: i64,
    pub(crate) recalled_by: String,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct EditShellMessageRequest {
    pub(crate) room_id: String,
    pub(crate) message_id: String,
    pub(crate) actor: String,
    pub(crate) text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct EditShellMessageResponse {
    pub(crate) ok: bool,
    pub(crate) conversation_id: String,
    pub(crate) message_id: String,
    pub(crate) edit_status: String,
    pub(crate) edited_at_ms: i64,
    pub(crate) edited_by: String,
    pub(crate) text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct CliSendRequest {
    pub(crate) from: String,
    pub(crate) to: String,
    pub(crate) text: String,
    pub(crate) client_tag: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct CliSendResponse {
    pub(crate) ok: bool,
    pub(crate) conversation_id: String,
    pub(crate) message_id: String,
    pub(crate) delivered_at_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct CliInboxConversation {
    pub(crate) conversation_id: String,
    pub(crate) title: String,
    pub(crate) subtitle: String,
    pub(crate) meta: String,
    pub(crate) kind: String,
    pub(crate) scope: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) kind_hint: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) list_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) status_line: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) chat_status_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) queue_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) overview_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) context_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) preview_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) last_activity_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) activity_time_label: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) search_terms: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) member_count: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) self_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) peer_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) participant_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) route_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) thread_headline: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) scene_banner: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) scene_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) room_variant: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) room_motif: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) caretaker: Option<ShellCaretakerProjection>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) detail_card: Option<ShellDetailCardProjection>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) workflow: Option<ShellWorkflowProjection>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) inline_actions: Vec<ShellInlineActionProjection>,
    pub(crate) updated_at_ms: i64,
    pub(crate) last_message_preview: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct CliInboxResponse {
    pub(crate) identity: String,
    pub(crate) conversations: Vec<CliInboxConversation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct CliRoomEntry {
    pub(crate) conversation_id: String,
    pub(crate) title: String,
    pub(crate) subtitle: String,
    pub(crate) meta: String,
    pub(crate) kind: String,
    pub(crate) scope: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) kind_hint: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) list_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) status_line: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) chat_status_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) queue_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) overview_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) context_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) preview_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) last_activity_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) activity_time_label: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) search_terms: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) member_count: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) self_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) peer_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) participant_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) route_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) thread_headline: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) scene_banner: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) scene_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) room_variant: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) room_motif: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) caretaker: Option<ShellCaretakerProjection>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) detail_card: Option<ShellDetailCardProjection>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) workflow: Option<ShellWorkflowProjection>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) inline_actions: Vec<ShellInlineActionProjection>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct CliRoomsResponse {
    pub(crate) identity: String,
    pub(crate) entries: Vec<CliRoomEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct CliTailMessage {
    pub(crate) message_id: String,
    pub(crate) sender: String,
    pub(crate) text: String,
    pub(crate) is_recalled: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) recalled_by: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) recalled_at_ms: Option<i64>,
    pub(crate) is_edited: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) edited_by: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) edited_at_ms: Option<i64>,
    pub(crate) timestamp_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct CliTailResponse {
    pub(crate) identity: String,
    pub(crate) conversation_id: String,
    pub(crate) title: String,
    pub(crate) subtitle: String,
    pub(crate) meta: String,
    pub(crate) kind: String,
    pub(crate) scope: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) kind_hint: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) list_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) status_line: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) chat_status_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) queue_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) overview_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) context_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) preview_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) last_activity_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) activity_time_label: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) search_terms: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) member_count: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) self_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) peer_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) participant_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) route_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) thread_headline: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) scene_banner: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) scene_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) room_variant: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) room_motif: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) caretaker: Option<ShellCaretakerProjection>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) detail_card: Option<ShellDetailCardProjection>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) workflow: Option<ShellWorkflowProjection>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) inline_actions: Vec<ShellInlineActionProjection>,
    pub(crate) messages: Vec<CliTailMessage>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct CityState {
    pub(crate) profile: CityProfile,
    pub(crate) features: CityFeatureFlags,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct PublicRoomRecord {
    pub(crate) room_id: ConversationId,
    pub(crate) city_id: CityId,
    pub(crate) slug: String,
    pub(crate) title: String,
    pub(crate) description: String,
    #[serde(default)]
    pub(crate) scene: Option<SceneMetadata>,
    pub(crate) created_by: IdentityId,
    pub(crate) created_at_ms: i64,
    pub(crate) frozen: bool,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
pub(crate) enum CityTrustState {
    #[default]
    Healthy,
    UnderReview,
    Quarantined,
    Isolated,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct WorldSquareNotice {
    pub(crate) notice_id: String,
    pub(crate) title: String,
    pub(crate) body: String,
    pub(crate) author_id: IdentityId,
    pub(crate) posted_at_ms: i64,
    pub(crate) severity: String,
    pub(crate) tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct CityTrustRecord {
    pub(crate) city_id: CityId,
    pub(crate) state: CityTrustState,
    pub(crate) reason: Option<String>,
    pub(crate) updated_by: IdentityId,
    pub(crate) updated_at_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct WorldSafetyAdvisory {
    pub(crate) advisory_id: String,
    pub(crate) subject_kind: String,
    pub(crate) subject_ref: String,
    pub(crate) action: String,
    pub(crate) reason: String,
    pub(crate) issued_by: IdentityId,
    pub(crate) issued_at_ms: i64,
    pub(crate) expires_at_ms: Option<i64>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
pub(crate) enum WorldResidentSanctionStatus {
    #[default]
    Active,
    Lifted,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct WorldResidentSanction {
    pub(crate) sanction_id: String,
    pub(crate) resident_id: IdentityId,
    pub(crate) city_id: Option<CityId>,
    pub(crate) report_id: Option<String>,
    pub(crate) reason: String,
    pub(crate) portability_revoked: bool,
    pub(crate) status: WorldResidentSanctionStatus,
    pub(crate) issued_by: IdentityId,
    pub(crate) issued_at_ms: i64,
    pub(crate) lifted_at_ms: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct RegistrationBlacklistEntry {
    pub(crate) entry_id: String,
    pub(crate) resident_id: IdentityId,
    pub(crate) report_id: Option<String>,
    pub(crate) handle_kind: String,
    pub(crate) hash_sha256: String,
    pub(crate) reason: String,
    pub(crate) added_by: IdentityId,
    pub(crate) added_at_ms: i64,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
pub(crate) enum ResidentRegistrationState {
    #[default]
    Active,
    Suspended,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct ResidentRegistration {
    pub(crate) resident_id: IdentityId,
    pub(crate) email: String,
    pub(crate) email_hash_sha256: String,
    pub(crate) mobile_hash_sha256: Option<String>,
    #[serde(default)]
    pub(crate) device_hashes_sha256: Vec<String>,
    pub(crate) state: ResidentRegistrationState,
    pub(crate) created_at_ms: i64,
    pub(crate) verified_at_ms: i64,
    pub(crate) last_login_at_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct EmailOtpChallenge {
    pub(crate) challenge_id: String,
    pub(crate) email: String,
    pub(crate) mobile_hash_sha256: Option<String>,
    pub(crate) device_hash_sha256: Option<String>,
    pub(crate) desired_resident_id: Option<IdentityId>,
    pub(crate) code_hash_sha256: String,
    pub(crate) requested_at_ms: i64,
    pub(crate) expires_at_ms: i64,
    pub(crate) consumed_at_ms: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub(crate) struct PersistedAuthState {
    #[serde(default)]
    pub(crate) registrations: Vec<ResidentRegistration>,
    #[serde(default)]
    pub(crate) email_otp_challenges: Vec<EmailOtpChallenge>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Default)]
pub(crate) enum WorldSafetyReportStatus {
    #[default]
    Submitted,
    Reviewing,
    Resolved,
    Dismissed,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct WorldSafetyReport {
    pub(crate) report_id: String,
    pub(crate) target_kind: String,
    pub(crate) target_ref: String,
    pub(crate) city_id: Option<CityId>,
    pub(crate) reporter_id: IdentityId,
    pub(crate) summary: String,
    pub(crate) evidence: Vec<String>,
    pub(crate) status: WorldSafetyReportStatus,
    pub(crate) submitted_at_ms: i64,
    pub(crate) reviewed_at_ms: Option<i64>,
    pub(crate) reviewed_by: Option<IdentityId>,
    pub(crate) resolution: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct DirectoryMirrorRecord {
    pub(crate) city_id: String,
    pub(crate) slug: String,
    pub(crate) title: String,
    pub(crate) mirror_enabled: bool,
    pub(crate) trust_state: CityTrustState,
    pub(crate) source_kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct WorldSafetySnapshot {
    pub(crate) stewards: Vec<String>,
    pub(crate) city_trust: Vec<CityTrustRecord>,
    pub(crate) advisories: Vec<WorldSafetyAdvisory>,
    pub(crate) reports: Vec<WorldSafetyReport>,
    pub(crate) resident_sanctions: Vec<WorldResidentSanction>,
    pub(crate) registration_blacklist: Vec<RegistrationBlacklistEntry>,
    pub(crate) mirrors: Vec<DirectoryMirrorRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct WorldDirectoryCityEntry {
    pub(crate) city_id: String,
    pub(crate) slug: String,
    pub(crate) title: String,
    pub(crate) description: String,
    pub(crate) trust_state: CityTrustState,
    pub(crate) mirror_enabled: bool,
    pub(crate) resident_count: usize,
    pub(crate) public_room_count: usize,
    pub(crate) source_kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct WorldDirectorySnapshot {
    pub(crate) snapshot_id: String,
    pub(crate) world_id: String,
    pub(crate) title: String,
    pub(crate) generated_at_ms: i64,
    pub(crate) city_count: usize,
    pub(crate) mirror_count: usize,
    pub(crate) notice_count: usize,
    pub(crate) advisory_count: usize,
    pub(crate) cities: Vec<WorldDirectoryCityEntry>,
    pub(crate) mirrors: Vec<DirectoryMirrorRecord>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct WorldEntryRoute {
    pub(crate) city_id: String,
    pub(crate) slug: String,
    pub(crate) title: String,
    pub(crate) description: String,
    pub(crate) href: String,
    pub(crate) trust_state: CityTrustState,
    pub(crate) status_label: String,
    pub(crate) mirror_enabled: bool,
    pub(crate) resident_count: usize,
    pub(crate) public_room_count: usize,
    pub(crate) source_kind: String,
    pub(crate) is_current: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct WorldEntryState {
    pub(crate) title: String,
    pub(crate) station_label: String,
    pub(crate) world_id: String,
    pub(crate) world_title: String,
    pub(crate) generated_at_ms: i64,
    pub(crate) current_city_slug: String,
    pub(crate) route_count: usize,
    pub(crate) mirror_count: usize,
    pub(crate) notice_count: usize,
    pub(crate) advisory_count: usize,
    pub(crate) source_summary: String,
    pub(crate) routes: Vec<WorldEntryRoute>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct WorldSnapshotMeta {
    pub(crate) snapshot_id: String,
    pub(crate) generated_at_ms: i64,
    pub(crate) world_id: String,
    pub(crate) world_title: String,
    pub(crate) checksum_sha256: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct WorldSnapshotPayload {
    pub(crate) governance: GovernanceSnapshot,
    pub(crate) residents: Vec<ResidentDirectoryEntry>,
    pub(crate) directory: WorldDirectorySnapshot,
    pub(crate) square: Vec<WorldSquareNotice>,
    pub(crate) safety: WorldSafetySnapshot,
    pub(crate) mirror_sources: Vec<MirrorSourceStatus>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct WorldSnapshotBundle {
    pub(crate) meta: WorldSnapshotMeta,
    pub(crate) payload: WorldSnapshotPayload,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub(crate) struct GovernanceSnapshot {
    pub(crate) world: WorldProfile,
    pub(crate) portability: ResidentPortability,
    pub(crate) cities: Vec<CityState>,
    pub(crate) memberships: Vec<CityMembership>,
    pub(crate) public_rooms: Vec<PublicRoomRecord>,
    #[serde(default)]
    pub(crate) world_stewards: Vec<IdentityId>,
    #[serde(default)]
    pub(crate) city_trust: Vec<CityTrustRecord>,
    #[serde(default)]
    pub(crate) world_square_notices: Vec<WorldSquareNotice>,
    #[serde(default)]
    pub(crate) safety_advisories: Vec<WorldSafetyAdvisory>,
    #[serde(default)]
    pub(crate) safety_reports: Vec<WorldSafetyReport>,
    #[serde(default)]
    pub(crate) resident_sanctions: Vec<WorldResidentSanction>,
    #[serde(default)]
    pub(crate) registration_blacklist: Vec<RegistrationBlacklistEntry>,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct CreateCityRequest {
    pub(crate) slug: Option<String>,
    pub(crate) title: String,
    pub(crate) description: String,
    pub(crate) lord_id: String,
    pub(crate) approval_required: Option<bool>,
    pub(crate) public_room_discovery_enabled: Option<bool>,
    pub(crate) federation_policy: Option<FederationPolicy>,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct JoinCityRequest {
    pub(crate) city: String,
    pub(crate) resident_id: String,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct CreatePublicRoomRequest {
    pub(crate) city: String,
    pub(crate) creator_id: String,
    pub(crate) slug: Option<String>,
    pub(crate) title: String,
    pub(crate) description: String,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct ApproveCityJoinRequest {
    pub(crate) city: String,
    pub(crate) actor_id: String,
    pub(crate) resident_id: String,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct UpdateStewardRequest {
    pub(crate) city: String,
    pub(crate) actor_id: String,
    pub(crate) resident_id: String,
    pub(crate) grant: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct FreezePublicRoomRequest {
    pub(crate) city: String,
    pub(crate) actor_id: String,
    pub(crate) room: String,
    pub(crate) frozen: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct UpdateFederationPolicyRequest {
    pub(crate) city: String,
    pub(crate) actor_id: String,
    pub(crate) policy: FederationPolicy,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct OpenDirectSessionRequest {
    pub(crate) requester_id: String,
    pub(crate) requester_device_id: Option<String>,
    pub(crate) peer_id: String,
    pub(crate) peer_device_id: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct ConnectProviderRequest {
    pub(crate) provider_url: String,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct AddWorldMirrorSourceRequest {
    pub(crate) base_url: String,
    pub(crate) enabled: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct PublishWorldNoticeRequest {
    pub(crate) actor_id: String,
    pub(crate) title: String,
    pub(crate) body: String,
    pub(crate) severity: Option<String>,
    pub(crate) tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct UpdateCityTrustRequest {
    pub(crate) actor_id: String,
    pub(crate) city: String,
    pub(crate) state: CityTrustState,
    pub(crate) reason: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct PublishSafetyAdvisoryRequest {
    pub(crate) actor_id: String,
    pub(crate) subject_kind: String,
    pub(crate) subject_ref: String,
    pub(crate) action: String,
    pub(crate) reason: String,
    pub(crate) expires_at_ms: Option<i64>,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct SubmitSafetyReportRequest {
    pub(crate) reporter_id: String,
    pub(crate) city: Option<String>,
    pub(crate) target_kind: String,
    pub(crate) target_ref: String,
    pub(crate) summary: String,
    pub(crate) evidence: Option<Vec<String>>,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct ReviewSafetyReportRequest {
    pub(crate) actor_id: String,
    pub(crate) report_id: String,
    pub(crate) status: WorldSafetyReportStatus,
    pub(crate) resolution: Option<String>,
    pub(crate) city_state: Option<CityTrustState>,
    pub(crate) cascade_resident_sanctions: Option<bool>,
    pub(crate) blacklist_registered_handles: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct SanctionResidentRequest {
    pub(crate) actor_id: String,
    pub(crate) resident_id: String,
    pub(crate) city: Option<String>,
    pub(crate) report_id: Option<String>,
    pub(crate) reason: String,
    pub(crate) email: Option<String>,
    pub(crate) mobile: Option<String>,
    pub(crate) device_physical_addresses: Option<Vec<String>>,
    pub(crate) portability_revoked: Option<bool>,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct AuthPreflightRequest {
    pub(crate) email: String,
    pub(crate) mobile: Option<String>,
    pub(crate) device_physical_address: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub(crate) struct AuthPreflightResponse {
    pub(crate) allowed: bool,
    pub(crate) normalized_email: Option<String>,
    pub(crate) normalized_mobile: Option<String>,
    pub(crate) normalized_device_physical_address: Option<String>,
    pub(crate) blocked_reasons: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct RequestEmailOtpRequest {
    pub(crate) email: String,
    pub(crate) mobile: Option<String>,
    pub(crate) device_physical_address: Option<String>,
    pub(crate) resident_id: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub(crate) struct RequestEmailOtpResponse {
    pub(crate) challenge_id: String,
    pub(crate) masked_email: String,
    pub(crate) expires_at_ms: i64,
    pub(crate) delivery_mode: String,
    pub(crate) dev_code: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct VerifyEmailOtpRequest {
    pub(crate) challenge_id: String,
    pub(crate) code: String,
    pub(crate) resident_id: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub(crate) struct VerifyEmailOtpResponse {
    pub(crate) resident_id: String,
    pub(crate) email: String,
    pub(crate) email_masked: String,
    pub(crate) state: ResidentRegistrationState,
    pub(crate) created_at_ms: i64,
    pub(crate) verified_at_ms: i64,
    pub(crate) last_login_at_ms: i64,
}

#[derive(Debug, Clone, Copy)]
pub(crate) enum ExportFormat {
    Markdown,
    Jsonl,
    Text,
}

#[derive(Debug, Clone, Serialize)]
pub(crate) struct ExportedConversation {
    pub(crate) conversation_id: String,
    pub(crate) kind: String,
    pub(crate) scope: String,
    pub(crate) title: String,
    pub(crate) subtitle: String,
    pub(crate) meta: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) kind_hint: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) list_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) status_line: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) chat_status_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) queue_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) overview_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) context_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) preview_text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) last_activity_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) activity_time_label: Option<String>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) search_terms: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) member_count: Option<usize>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) self_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) peer_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) participant_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) route_label: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) thread_headline: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) scene_banner: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) scene_summary: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) room_variant: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) room_motif: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) caretaker: Option<ShellCaretakerProjection>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) detail_card: Option<ShellDetailCardProjection>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub(crate) workflow: Option<ShellWorkflowProjection>,
    #[serde(skip_serializing_if = "Vec::is_empty", default)]
    pub(crate) inline_actions: Vec<ShellInlineActionProjection>,
    pub(crate) message_count: usize,
}

#[derive(Debug, Clone, Serialize)]
pub(crate) struct ExportResponse {
    pub(crate) resident_id: String,
    pub(crate) format: String,
    pub(crate) exported_at_ms: i64,
    pub(crate) conversation_count: usize,
    pub(crate) rights: ResidentExportRights,
    pub(crate) conversations: Vec<ExportedConversation>,
    pub(crate) content: String,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum CliIdentityKind {
    User,
    Agent,
}

#[cfg_attr(not(test), allow(dead_code))]
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum CliAddress {
    User(IdentityId),
    Agent(IdentityId),
    Room(ConversationId),
}

impl CliAddress {
    #[allow(dead_code)]
    pub(crate) fn identity_kind(&self) -> Option<CliIdentityKind> {
        match self {
            Self::User(_) => Some(CliIdentityKind::User),
            Self::Agent(_) => Some(CliIdentityKind::Agent),
            Self::Room(_) => None,
        }
    }

    pub(crate) fn identity_label(&self) -> Result<String, String> {
        match self {
            Self::User(identity) => Ok(format!("user:{}", identity.0)),
            Self::Agent(identity) => Ok(format!("agent:{}", identity.0)),
            Self::Room(_) => Err("cli identity target must be user:<id> or agent:<id>".into()),
        }
    }

    pub(crate) fn identity_ref(&self) -> Option<&IdentityId> {
        match self {
            Self::User(identity) | Self::Agent(identity) => Some(identity),
            Self::Room(_) => None,
        }
    }
}

#[derive(Debug)]
pub(crate) struct GatewayRuntime {
    pub(crate) node: InMemoryWakuLightNode,
    pub(crate) upstream_gateway: Option<HttpWakuGatewayClient>,
    pub(crate) upstream_base_url: Option<String>,
    pub(crate) mirror_sources: Vec<MirrorSourceConfig>,
    pub(crate) connection_state: WakuConnectionState,
    pub(crate) endpoint: Option<WakuEndpointConfig>,
    pub(crate) subscriptions: Vec<TopicSubscription>,
    pub(crate) cursors: HashMap<String, WakuSyncCursor>,
    pub(crate) history_limit: usize,
    pub(crate) governance_path: PathBuf,
    pub(crate) secure_sessions_path: PathBuf,
    pub(crate) provider_config_path: PathBuf,
    pub(crate) auth_state_path: PathBuf,
    pub(crate) timeline_store: FileTimelineStore,
    pub(crate) secure_sessions: SkeletonSecureSessionManager,
    pub(crate) world: WorldProfile,
    pub(crate) portability: ResidentPortability,
    pub(crate) cities: HashMap<CityId, CityState>,
    pub(crate) memberships: Vec<CityMembership>,
    pub(crate) public_rooms: Vec<PublicRoomRecord>,
    pub(crate) world_stewards: Vec<IdentityId>,
    pub(crate) city_trust: Vec<CityTrustRecord>,
    pub(crate) world_square_notices: Vec<WorldSquareNotice>,
    pub(crate) safety_advisories: Vec<WorldSafetyAdvisory>,
    pub(crate) safety_reports: Vec<WorldSafetyReport>,
    pub(crate) resident_sanctions: Vec<WorldResidentSanction>,
    pub(crate) registration_blacklist: Vec<RegistrationBlacklistEntry>,
    pub(crate) registrations: Vec<ResidentRegistration>,
    pub(crate) email_otp_challenges: Vec<EmailOtpChallenge>,
    pub(crate) message_counter: u64,
}

#[derive(Clone)]
pub(crate) struct RemoteWorldSnapshotFetch {
    pub(crate) base_url: String,
    pub(crate) source_kind: String,
    pub(crate) enabled: bool,
    pub(crate) reachable: bool,
    pub(crate) bundle: Option<WorldSnapshotBundle>,
}
