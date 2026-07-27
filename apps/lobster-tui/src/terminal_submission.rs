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

fn gateway_base_url() -> Option<String> {
    env::var("LOBSTER_WAKU_GATEWAY_URL").ok()
}

pub(crate) fn gateway_bearer_header_value(token: Option<&str>) -> Option<String> {
    token
        .map(str::trim)
        .filter(|token| !token.is_empty())
        .map(|token| format!("Bearer {token}"))
}

fn gateway_auth_header() -> Option<String> {
    for variable in ["LOBSTER_SESSION_TOKEN", "LOBSTER_AGENT_TOKEN"] {
        let value = env::var(variable).ok();
        if let Some(header) = gateway_bearer_header_value(value.as_deref()) {
            return Some(header);
        }
    }
    None
}

fn gateway_post(path: &str, body: serde_json::Value) -> Result<serde_json::Value, String> {
    let base = gateway_base_url()
        .ok_or_else(|| "Gateway 未配置 (LOBSTER_WAKU_GATEWAY_URL)".to_string())?;
    let url = format!("{}{}", base.trim_end_matches('/'), path);
    let auth_header = gateway_auth_header();
    let mut request = ureq::post(&url).set("Content-Type", "application/json");
    if let Some(header) = auth_header.as_deref() {
        request = request.set("Authorization", header);
    }
    request
        .send_json(body)
        .map_err(|e| format!("Gateway 请求失败: {e}"))?
        .into_json::<serde_json::Value>()
        .map_err(|e| format!("Gateway 响应解析失败: {e}"))
}

fn gateway_get(path: &str) -> Result<serde_json::Value, String> {
    let base = gateway_base_url()
        .ok_or_else(|| "Gateway 未配置 (LOBSTER_WAKU_GATEWAY_URL)".to_string())?;
    let url = format!("{}{}", base.trim_end_matches('/'), path);
    let auth_header = gateway_auth_header();
    let mut request = ureq::get(&url);
    if let Some(header) = auth_header.as_deref() {
        request = request.set("Authorization", header);
    }
    request
        .call()
        .map_err(|e| format!("Gateway 请求失败: {e}"))?
        .into_json::<serde_json::Value>()
        .map_err(|e| format!("Gateway 响应解析失败: {e}"))
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

pub(crate) fn build_cli_search_path(
    identity: &str,
    conversation_id: &ConversationId,
    query: &str,
    limit: usize,
) -> Result<String, String> {
    let identity = identity.trim();
    let conversation_id = conversation_id.0.trim();
    let query = query.trim();
    if identity.is_empty() {
        return Err("TUI 搜索缺少身份".into());
    }
    if conversation_id.is_empty() {
        return Err("TUI 搜索缺少当前会话".into());
    }
    if query.is_empty() {
        return Err("用法：/search <关键词>".into());
    }
    let target = if identity.starts_with("user:") || identity.starts_with("agent:") {
        identity.to_string()
    } else {
        format!("user:{identity}")
    };
    let limit = limit.clamp(1, 200);
    Ok(format!(
        "/v1/cli/search?for={}&q={}&room_id={}&limit={limit}",
        query_escape(&target),
        query_escape(query),
        query_escape(conversation_id),
    ))
}

fn cli_search_notice(query: &str, payload: &serde_json::Value) -> String {
    let Some(results) = payload.as_array() else {
        return "搜索失败：Gateway 返回格式无效".into();
    };
    if results.is_empty() {
        return format!("搜索「{query}」未找到匹配消息");
    }
    let mut lines = vec![format!("搜索「{query}」命中 {} 条：", results.len())];
    for result in results {
        let sender = result["sender"].as_str().unwrap_or("?");
        let text = result["text"].as_str().unwrap_or("");
        let timestamp = result["timestamp_label"].as_str().unwrap_or("");
        if timestamp.is_empty() {
            lines.push(format!("  {sender}: {text}"));
        } else {
            lines.push(format!("  [{timestamp}] {sender}: {text}"));
        }
    }
    lines.join("\n")
}

pub(crate) fn run_cli_search_command<G>(
    store: &mut FileTimelineStore,
    active_conversation_id: &mut ConversationId,
    selected_conversation_id: &mut ConversationId,
    identity: &str,
    query: &str,
    gateway_get_fn: &mut G,
) -> Result<(), String>
where
    G: FnMut(&str) -> Result<serde_json::Value, String>,
{
    let query = query.trim();
    let notice = if query.is_empty() {
        "用法：/search <关键词>".to_string()
    } else {
        let path = build_cli_search_path(identity, active_conversation_id, query, 20)?;
        match gateway_get_fn(&path) {
            Ok(payload) => cli_search_notice(query, &payload),
            Err(error) => format!("搜索失败：{error}"),
        }
    };
    append_terminal_notice(store, active_conversation_id, &notice)?;
    *selected_conversation_id = active_conversation_id.clone();
    Ok(())
}

pub(crate) fn build_edit_message_request(
    actor: &str,
    room_id: &ConversationId,
    message_id: &str,
    text: &str,
) -> (&'static str, serde_json::Value) {
    (
        "/v1/shell/message/edit",
        serde_json::json!({
            "room_id": room_id.0,
            "message_id": message_id,
            "actor": actor,
            "text": text,
        }),
    )
}

pub(crate) fn build_recall_message_request(
    actor: &str,
    room_id: &ConversationId,
    message_id: &str,
) -> (&'static str, serde_json::Value) {
    (
        "/v1/shell/message/recall",
        serde_json::json!({
            "room_id": room_id.0,
            "message_id": message_id,
            "actor": actor,
        }),
    )
}

pub(crate) enum SubmissionAction {
    Continue,
    Quit,
}

#[derive(Debug, Deserialize)]
struct OpenDirectSessionResponse {
    conversation_id: String,
}

pub(crate) fn resolve_direct_conversation_id<F>(
    requester_id: &str,
    peer_id: &str,
    gateway_url: Option<&str>,
    gateway_request: F,
) -> Result<ConversationId, String>
where
    F: FnOnce(String) -> Result<ConversationId, String>,
{
    let fallback = direct_conversation(requester_id, peer_id);
    let Some(base_url) = gateway_url.map(str::trim).filter(|url| !url.is_empty()) else {
        return Ok(fallback);
    };
    let url = format!("{}/v1/direct/open", base_url.trim_end_matches('/'));
    let conversation = gateway_request(url)?;
    if conversation.0.trim().is_empty() {
        return Err("Gateway 私聊响应缺少有效 conversation_id".to_string());
    }
    Ok(conversation)
}

fn open_direct_conversation_id(
    requester_id: &str,
    peer_id: &str,
) -> Result<ConversationId, String> {
    let base_url = env::var("LOBSTER_WAKU_GATEWAY_URL").ok();
    let auth_header = gateway_auth_header();
    resolve_direct_conversation_id(requester_id, peer_id, base_url.as_deref(), |url| {
        let mut request = ureq::post(&url);
        if let Some(header) = auth_header.as_deref() {
            request = request.set("Authorization", header);
        }
        request
            .send_json(serde_json::json!({
                "requester_id": requester_id,
                "peer_id": peer_id,
            }))
            .map_err(|error| format!("Gateway 打开私聊失败: {error}"))?
            .into_json::<OpenDirectSessionResponse>()
            .map(|payload| ConversationId(payload.conversation_id))
            .map_err(|error| format!("Gateway 私聊响应解析失败: {error}"))
    })
}

fn build_direct_conversation(
    store: &impl TimelineStore,
    requester_id: &str,
    peer_id: &str,
) -> Result<Conversation, String> {
    let conversation_id = open_direct_conversation_id(requester_id, peer_id)?;
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
    "终端命令：/help 查看帮助；/status 查看当前会话与连接；/refresh 刷新当前视图；/search <关键词> 搜索当前会话；/edit <消息ID> <新正文> 编辑消息；/recall <消息ID> 撤回消息；/world-status 世界治理总览；/cities 城市信任列表；/world-safety 安全快照；/safety-reports 安全报告；/safety-residents 制裁名单；/world-directory 世界黄页；/world-square 世界广场公告；/governance 进入治理房间；/dm <身份> 打开私聊；/open <序号> 打开会话；/residents 居民名单；/rooms 房间列表；/ban <居民> <原因> 封禁居民；/unban <居民> 解封居民；/freeze <房间> 冻结房间；/unfreeze <房间> 解冻房间；/invite create [次数] 创建邀请码；/invite revoke <码> 撤销邀请码；/config <key> 查看配置；/config set <key> <val> 修改配置；/quit 退出。"
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
    handle_terminal_submission_with_gateway_post(
        store,
        transport,
        launch_mode,
        active_conversation_id,
        selected_conversation_id,
        trimmed,
        &mut gateway_post,
    )
}

pub(crate) fn handle_terminal_submission_with_gateway_post<F>(
    store: &mut FileTimelineStore,
    transport: &mut dyn TransportAdapter,
    launch_mode: LaunchSurface,
    active_conversation_id: &mut ConversationId,
    selected_conversation_id: &mut ConversationId,
    trimmed: &str,
    gateway_post_fn: &mut F,
) -> Result<SubmissionAction, String>
where
    F: FnMut(&str, serde_json::Value) -> Result<serde_json::Value, String>,
{
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
        "/search" => {
            run_cli_search_command(
                store,
                active_conversation_id,
                selected_conversation_id,
                &launch_identity(launch_mode),
                "",
                &mut |path| gateway_get(path),
            )?;
            Ok(SubmissionAction::Continue)
        }
        text if text.starts_with("/search ") => {
            run_cli_search_command(
                store,
                active_conversation_id,
                selected_conversation_id,
                &launch_identity(launch_mode),
                text.trim_start_matches("/search"),
                &mut |path| gateway_get(path),
            )?;
            Ok(SubmissionAction::Continue)
        }
        "/edit" => {
            append_terminal_notice(
                store,
                active_conversation_id,
                "用法：/edit <消息ID> <新正文>",
            )?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        text if text.starts_with("/edit ") => {
            let rest = text.trim_start_matches("/edit").trim();
            let parts: Vec<&str> = rest.splitn(2, ' ').collect();
            let message_id = parts.first().map(|s| s.trim()).unwrap_or("");
            let new_text = parts.get(1).map(|s| s.trim()).unwrap_or("");
            if message_id.is_empty() || new_text.is_empty() {
                append_terminal_notice(
                    store,
                    active_conversation_id,
                    "用法：/edit <消息ID> <新正文>",
                )?;
            } else {
                let identity = launch_identity(launch_mode);
                let (path, body) = build_edit_message_request(
                    &identity,
                    active_conversation_id,
                    message_id,
                    new_text,
                );
                let notice = match gateway_post_fn(path, body) {
                    Ok(_) => format!("已编辑消息 {message_id}"),
                    Err(e) => format!("编辑消息失败：{e}"),
                };
                append_terminal_notice(store, active_conversation_id, &notice)?;
            }
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/recall" => {
            append_terminal_notice(store, active_conversation_id, "用法：/recall <消息ID>")?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        text if text.starts_with("/recall ") => {
            let message_id = text.trim_start_matches("/recall").trim();
            if message_id.is_empty() {
                append_terminal_notice(store, active_conversation_id, "用法：/recall <消息ID>")?;
            } else {
                let identity = launch_identity(launch_mode);
                let (path, body) =
                    build_recall_message_request(&identity, active_conversation_id, message_id);
                let notice = match gateway_post_fn(path, body) {
                    Ok(_) => format!("已撤回消息 {message_id}"),
                    Err(e) => format!("撤回消息失败：{e}"),
                };
                append_terminal_notice(store, active_conversation_id, &notice)?;
            }
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
        "/world-status" => {
            let notice = match gateway_get("/v1/world") {
                Ok(json) => {
                    let cities = json["cities"].as_array().map(|a| a.len()).unwrap_or(0);
                    let stewards: Vec<&str> = json["stewards"]
                        .as_array()
                        .map(|a| a.iter().filter_map(|s| s.as_str()).collect())
                        .unwrap_or_default();
                    let notice_count = json["world_square_notices"]
                        .as_array()
                        .map(|a| a.len())
                        .unwrap_or(0);
                    let report_count = json["safety_reports"]
                        .as_array()
                        .map(|a| a.len())
                        .unwrap_or(0);
                    let trust_count = json["city_trust"].as_array().map(|a| a.len()).unwrap_or(0);
                    let mut lines = vec![format!(
                        "世界治理总览：{cities} 座城市，{trust_count} 条信任记录，{notice_count} 条广场公告，{report_count} 条安全报告"
                    )];
                    if !stewards.is_empty() {
                        lines.push(format!("世界管理员：{}", stewards.join("、")));
                    }
                    lines.join("\n")
                }
                Err(e) => format!("获取世界治理信息失败：{e}"),
            };
            append_terminal_notice(store, active_conversation_id, &notice)?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/cities" => {
            let notice = match gateway_get("/v1/cities") {
                Ok(json) => {
                    let count = json.as_array().map(|a| a.len()).unwrap_or(0);
                    let mut lines = vec![format!("城市信任列表（共 {count} 座）：")];
                    if let Some(arr) = json.as_array() {
                        for city in arr {
                            let id = city["city_id"].as_str().unwrap_or("?");
                            let state = city["state"].as_str().unwrap_or("?");
                            let reason = city["reason"].as_str().unwrap_or("");
                            let reason_str = if reason.is_empty() {
                                String::new()
                            } else {
                                format!(" · {reason}")
                            };
                            lines.push(format!("  {id} [{state}]{reason_str}"));
                        }
                    }
                    lines.join("\n")
                }
                Err(e) => format!("获取城市列表失败：{e}"),
            };
            append_terminal_notice(store, active_conversation_id, &notice)?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/world-safety" => {
            let notice = match gateway_get("/v1/world-safety") {
                Ok(json) => {
                    let stewards: Vec<&str> = json["stewards"]
                        .as_array()
                        .map(|a| a.iter().filter_map(|s| s.as_str()).collect())
                        .unwrap_or_default();
                    let trust_count = json["city_trust"].as_array().map(|a| a.len()).unwrap_or(0);
                    let advisory_count =
                        json["advisories"].as_array().map(|a| a.len()).unwrap_or(0);
                    let report_count = json["reports"].as_array().map(|a| a.len()).unwrap_or(0);
                    let sanction_count = json["resident_sanctions"]
                        .as_array()
                        .map(|a| a.len())
                        .unwrap_or(0);
                    let blacklist_count = json["registration_blacklist"]
                        .as_array()
                        .map(|a| a.len())
                        .unwrap_or(0);
                    let mut lines = vec![format!(
                        "世界安全快照：{trust_count} 条信任记录，{advisory_count} 条公告，{report_count} 条报告，{sanction_count} 条制裁，{blacklist_count} 条注册黑名单"
                    )];
                    if !stewards.is_empty() {
                        lines.push(format!("安全管理员：{}", stewards.join("、")));
                    }
                    lines.join("\n")
                }
                Err(e) => format!("获取安全快照失败：{e}"),
            };
            append_terminal_notice(store, active_conversation_id, &notice)?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/safety-reports" => {
            let notice = match gateway_get("/v1/world-safety/reports") {
                Ok(json) => {
                    let count = json.as_array().map(|a| a.len()).unwrap_or(0);
                    let mut lines = vec![format!("安全报告列表（共 {count} 条）：")];
                    if let Some(arr) = json.as_array() {
                        for report in arr {
                            let id = report["report_id"].as_str().unwrap_or("?");
                            let status = report["status"].as_str().unwrap_or("?");
                            let target = report["target_ref"].as_str().unwrap_or("?");
                            let summary = report["summary"].as_str().unwrap_or("");
                            lines.push(format!("  [{status}] {id} → {target}: {summary}"));
                        }
                    }
                    lines.join("\n")
                }
                Err(e) => format!("获取安全报告失败：{e}"),
            };
            append_terminal_notice(store, active_conversation_id, &notice)?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/safety-residents" => {
            let notice = match gateway_get("/v1/world-safety/residents") {
                Ok(json) => {
                    let sanctions = json["resident_sanctions"].as_array();
                    let blacklist = json["registration_blacklist"].as_array();
                    let s_count = sanctions.map(|a| a.len()).unwrap_or(0);
                    let b_count = blacklist.map(|a| a.len()).unwrap_or(0);
                    let mut lines = vec![format!(
                        "世界安全居民：{s_count} 条制裁，{b_count} 条注册黑名单"
                    )];
                    if let Some(arr) = sanctions {
                        for s in arr {
                            let resident = s["resident_id"].as_str().unwrap_or("?");
                            let status = s["status"].as_str().unwrap_or("?");
                            let reason = s["reason"].as_str().unwrap_or("");
                            lines.push(format!("  制裁 [{status}] {resident}: {reason}"));
                        }
                    }
                    if let Some(arr) = blacklist {
                        for entry in arr {
                            let resident = entry["resident_id"].as_str().unwrap_or("?");
                            let reason = entry["reason"].as_str().unwrap_or("");
                            lines.push(format!("  黑名单 {resident}: {reason}"));
                        }
                    }
                    lines.join("\n")
                }
                Err(e) => format!("获取安全居民数据失败：{e}"),
            };
            append_terminal_notice(store, active_conversation_id, &notice)?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/world-directory" => {
            let notice = match gateway_get("/v1/world-directory") {
                Ok(json) => {
                    let cities = json["cities"].as_array();
                    let count = cities.map(|a| a.len()).unwrap_or(0);
                    let mut lines = vec![format!("世界黄页（共 {count} 座城市）：")];
                    if let Some(arr) = cities {
                        for city in arr {
                            let city_id = city["city_id"].as_str().unwrap_or("?");
                            let title = city["title"].as_str().unwrap_or(city_id);
                            let trust = city["trust_state"].as_str().unwrap_or("?");
                            let residents = city["resident_count"].as_u64().unwrap_or(0);
                            let rooms = city["public_room_count"].as_u64().unwrap_or(0);
                            let mirror = if city["mirror_enabled"].as_bool().unwrap_or(false) {
                                " [镜像]"
                            } else {
                                ""
                            };
                            lines.push(format!("  {title} ({city_id}) · {residents}人 · {rooms}间公共房 · 信任:{trust}{mirror}"));
                        }
                    }
                    lines.join("\n")
                }
                Err(e) => format!("获取世界黄页失败：{e}"),
            };
            append_terminal_notice(store, active_conversation_id, &notice)?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/world-square" => {
            let notice = match gateway_get("/v1/world-square") {
                Ok(json) => {
                    let count = json.as_array().map(|a| a.len()).unwrap_or(0);
                    let mut lines = vec![format!("世界广场公告（共 {count} 条）：")];
                    if let Some(arr) = json.as_array() {
                        for notice_item in arr {
                            let title = notice_item["title"].as_str().unwrap_or("?");
                            let severity = notice_item["severity"].as_str().unwrap_or("");
                            let body = notice_item["body"].as_str().unwrap_or("");
                            let sev_tag = if severity.is_empty() {
                                String::new()
                            } else {
                                format!("[{severity}] ")
                            };
                            lines.push(format!("  {sev_tag}{title}"));
                            if !body.is_empty() {
                                lines.push(format!("    {body}"));
                            }
                        }
                    }
                    lines.join("\n")
                }
                Err(e) => format!("获取世界广场公告失败：{e}"),
            };
            append_terminal_notice(store, active_conversation_id, &notice)?;
            *selected_conversation_id = active_conversation_id.clone();
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
        "/residents" => {
            let notice = match gateway_get("/v1/admin/residents") {
                Ok(json) => {
                    let count = json.as_array().map(|a| a.len()).unwrap_or(0);
                    let mut lines = vec![format!("居民名单（共 {count} 人）：")];
                    if let Some(arr) = json.as_array() {
                        for resident in arr {
                            let id = resident["resident_id"].as_str().unwrap_or("?");
                            let nick = resident["nickname"].as_str();
                            let online = resident["online"].as_bool().unwrap_or(false);
                            let banned = resident["is_banned"].as_bool().unwrap_or(false);
                            let roles: Vec<&str> = resident["roles"]
                                .as_array()
                                .map(|a| a.iter().filter_map(|r| r.as_str()).collect())
                                .unwrap_or_default();
                            let mut tags: Vec<String> = Vec::new();
                            if online {
                                tags.push("在线".into());
                            }
                            if banned {
                                tags.push("已封禁".into());
                            }
                            if !roles.is_empty() {
                                tags.push(format!("角色:{}", roles.join(",")));
                            }
                            let tag_str = if tags.is_empty() {
                                String::new()
                            } else {
                                format!(" [{}]", tags.join(", "))
                            };
                            let display = match nick {
                                Some(n) if !n.is_empty() => format!("{n} ({id})"),
                                _ => id.to_string(),
                            };
                            lines.push(format!("  {display}{tag_str}"));
                        }
                    }
                    lines.join("\n")
                }
                Err(e) => format!("获取居民名单失败：{e}"),
            };
            append_terminal_notice(store, active_conversation_id, &notice)?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/rooms" => {
            let notice = match gateway_get("/v1/admin/rooms") {
                Ok(json) => {
                    let count = json.as_array().map(|a| a.len()).unwrap_or(0);
                    let mut lines = vec![format!("房间列表（共 {count} 间）：")];
                    if let Some(arr) = json.as_array() {
                        for room in arr {
                            let id = room["id"].as_str().unwrap_or("?");
                            let kind = room["kind"].as_str().unwrap_or("?");
                            let title = room["title"].as_str().unwrap_or(id);
                            let frozen = room["is_frozen"].as_bool().unwrap_or(false);
                            let pcount = room["participant_count"].as_u64().unwrap_or(0);
                            let mcount = room["message_count"].as_u64().unwrap_or(0);
                            let frozen_tag = if frozen { " [已冻结]" } else { "" };
                            lines.push(format!(
                                "  {title} ({kind}) · {pcount}人 · {mcount}条消息{frozen_tag}"
                            ));
                        }
                    }
                    lines.join("\n")
                }
                Err(e) => format!("获取房间列表失败：{e}"),
            };
            append_terminal_notice(store, active_conversation_id, &notice)?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/config" => {
            append_terminal_notice(
                store,
                active_conversation_id,
                "用法：/config <key> 获取配置值  或  /config set <key> <value> 设置配置",
            )?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        text if text.starts_with("/config ") => {
            let rest = text.trim_start_matches("/config").trim();
            if rest.is_empty() {
                append_terminal_notice(
                    store,
                    active_conversation_id,
                    "用法：/config <key> 获取配置值  或  /config set <key> <value> 设置配置",
                )?;
            } else if let Some(key) = rest
                .strip_prefix("set ")
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
            {
                let parts: Vec<&str> = key.splitn(2, ' ').collect();
                let config_key = parts[0];
                let config_value = parts.get(1).copied().unwrap_or("");
                let notice = match gateway_post_fn(
                    "/v1/admin/config",
                    serde_json::json!({
                        "config": { config_key: config_value },
                    }),
                ) {
                    Ok(_) => format!("已设置 {config_key} = {config_value}"),
                    Err(e) => format!("设置配置失败：{e}"),
                };
                append_terminal_notice(store, active_conversation_id, &notice)?;
            } else {
                let notice = match gateway_get("/v1/admin/config") {
                    Ok(json) => {
                        if let Some(val) = json.get(rest) {
                            format!("{rest} = {val}")
                        } else if let Some(obj) = json.as_object() {
                            let matching: Vec<String> = obj
                                .iter()
                                .filter(|(k, _)| k.contains(rest))
                                .map(|(k, v)| format!("  {k} = {v}"))
                                .collect();
                            if matching.is_empty() {
                                format!("未找到匹配 '{rest}' 的配置项")
                            } else {
                                format!("配置项（匹配 '{rest}'）：\n{}", matching.join("\n"))
                            }
                        } else {
                            format!("{rest} 未设置")
                        }
                    }
                    Err(e) => format!("获取配置失败：{e}"),
                };
                append_terminal_notice(store, active_conversation_id, &notice)?;
            }
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/ban" => {
            append_terminal_notice(store, active_conversation_id, "用法：/ban <居民ID> [原因]")?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        text if text.starts_with("/ban ") => {
            let parts: Vec<&str> = text
                .trim_start_matches("/ban")
                .trim()
                .splitn(2, ' ')
                .collect();
            let resident_id = parts.first().map(|s| s.trim()).unwrap_or("").to_string();
            let reason = parts
                .get(1)
                .map(|s| s.trim())
                .unwrap_or("从终端封禁")
                .to_string();
            if resident_id.is_empty() {
                append_terminal_notice(
                    store,
                    active_conversation_id,
                    "用法：/ban <居民ID> [原因]",
                )?;
            } else {
                let notice = match gateway_post_fn(
                    "/v1/admin/residents/ban",
                    serde_json::json!({
                        "resident_id": &resident_id,
                        "reason": &reason,
                    }),
                ) {
                    Ok(_) => format!("已封禁居民 {resident_id}：{reason}"),
                    Err(e) => format!("封禁失败：{e}"),
                };
                append_terminal_notice(store, active_conversation_id, &notice)?;
            }
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/unban" => {
            append_terminal_notice(store, active_conversation_id, "用法：/unban <居民ID>")?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        text if text.starts_with("/unban ") => {
            let resident_id = text.trim_start_matches("/unban").trim().to_string();
            if resident_id.is_empty() {
                append_terminal_notice(store, active_conversation_id, "用法：/unban <居民ID>")?;
            } else {
                let notice = match gateway_post_fn(
                    "/v1/admin/residents/unban",
                    serde_json::json!({
                        "resident_id": &resident_id,
                    }),
                ) {
                    Ok(json) => {
                        let count = json["lifted_count"].as_u64().unwrap_or(0);
                        format!("已解封居民 {resident_id}（解除 {count} 条封禁）")
                    }
                    Err(e) => format!("解封失败：{e}"),
                };
                append_terminal_notice(store, active_conversation_id, &notice)?;
            }
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/freeze" => {
            append_terminal_notice(store, active_conversation_id, "用法：/freeze <房间ID>")?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        text if text.starts_with("/freeze ") => {
            let room_id = text.trim_start_matches("/freeze").trim().to_string();
            if room_id.is_empty() {
                append_terminal_notice(store, active_conversation_id, "用法：/freeze <房间ID>")?;
            } else {
                let notice = match gateway_post_fn(
                    "/v1/admin/rooms/freeze",
                    serde_json::json!({
                        "room_id": &room_id,
                    }),
                ) {
                    Ok(_) => format!("已冻结房间 {room_id}"),
                    Err(e) => format!("冻结失败：{e}"),
                };
                append_terminal_notice(store, active_conversation_id, &notice)?;
            }
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        "/unfreeze" => {
            append_terminal_notice(store, active_conversation_id, "用法：/unfreeze <房间ID>")?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        text if text.starts_with("/unfreeze ") => {
            let room_id = text.trim_start_matches("/unfreeze").trim().to_string();
            if room_id.is_empty() {
                append_terminal_notice(store, active_conversation_id, "用法：/unfreeze <房间ID>")?;
            } else {
                let notice = match gateway_post_fn(
                    "/v1/admin/rooms/unfreeze",
                    serde_json::json!({
                        "room_id": &room_id,
                    }),
                ) {
                    Ok(_) => format!("已解冻房间 {room_id}"),
                    Err(e) => format!("解冻失败：{e}"),
                };
                append_terminal_notice(store, active_conversation_id, &notice)?;
            }
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        text if text.starts_with("/invite create") => {
            let max_uses: u32 = text
                .trim_start_matches("/invite create")
                .trim()
                .parse()
                .unwrap_or(10);
            let identity = launch_identity(launch_mode);
            let notice = match gateway_post_fn(
                "/v1/admin/invites",
                serde_json::json!({
                    "actor_id": identity,
                    "max_uses": max_uses,
                }),
            ) {
                Ok(json) => {
                    let code = json["code"].as_str().unwrap_or("?");
                    format!("已创建邀请码：{code}（可用 {max_uses} 次）")
                }
                Err(e) => format!("创建邀请码失败：{e}"),
            };
            append_terminal_notice(store, active_conversation_id, &notice)?;
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        text if text.starts_with("/invite revoke ") => {
            let code = text.trim_start_matches("/invite revoke").trim().to_string();
            if code.is_empty() {
                append_terminal_notice(
                    store,
                    active_conversation_id,
                    "用法：/invite revoke <邀请码>",
                )?;
            } else {
                let identity = launch_identity(launch_mode);
                let notice = match gateway_post_fn(
                    "/v1/admin/invites/revoke",
                    serde_json::json!({
                        "code": &code,
                        "actor_id": identity,
                    }),
                ) {
                    Ok(_) => format!("已撤销邀请码 {code}"),
                    Err(e) => format!("撤销邀请码失败：{e}"),
                };
                append_terminal_notice(store, active_conversation_id, &notice)?;
            }
            *selected_conversation_id = active_conversation_id.clone();
            Ok(SubmissionAction::Continue)
        }
        text if text.starts_with("/invite") => {
            append_terminal_notice(
                store,
                active_conversation_id,
                "用法：/invite create [可用次数]  或  /invite revoke <邀请码>",
            )?;
            *selected_conversation_id = active_conversation_id.clone();
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
