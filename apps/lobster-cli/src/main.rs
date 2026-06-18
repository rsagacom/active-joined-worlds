use serde::{Deserialize, Serialize};
use std::{collections::HashSet, thread, time::Duration};

#[derive(Debug, Clone, PartialEq, Eq)]
enum Command {
    Send(SendCommand),
    Edit(EditCommand),
    Recall(RecallCommand),
    Export(ExportCommand),
    Inbox(QueryCommand),
    Rooms(QueryCommand),
    Tail(TailCommand),
    Search(SearchCommand),
    Who(QueryCommand),
    Read(ReadCommand),
    Presence(QueryCommand),
    Ban(AdminCommand),
    Unban(IdentityCommand),
    Freeze(IdentityCommand),
    Unfreeze(IdentityCommand),
    InviteCreate(InviteCreateCommand),
    InviteRevoke(InviteRevokeCommand),
    AdminResidents(QueryCommand),
    AdminRooms(QueryCommand),
    World(WorldQueryCommand),
    Square(WorldQueryCommand),
    Cities(WorldQueryCommand),
    Safety(WorldQueryCommand),
    Help(Option<String>),
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct SendCommand {
    from: String,
    to: String,
    text: String,
    gateway: String,
    json: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct EditCommand {
    actor: String,
    conversation_id: String,
    message_id: String,
    text: String,
    gateway: String,
    json: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct RecallCommand {
    actor: String,
    conversation_id: String,
    message_id: String,
    gateway: String,
    json: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct ExportCommand {
    target: String,
    conversation_id: Option<String>,
    format: String,
    include_public: bool,
    gateway: String,
    json: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct QueryCommand {
    target: String,
    gateway: String,
    json: bool,
}

/// 世界治理 / 公共广场查询：无 target 的全局只读命令（仅需 --gateway / --json）。
#[derive(Debug, Clone, PartialEq, Eq)]
struct WorldQueryCommand {
    gateway: String,
    json: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct TailCommand {
    target: String,
    conversation_id: Option<String>,
    gateway: String,
    json: bool,
    follow: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct SearchCommand {
    query: String,
    room_id: Option<String>,
    limit: Option<u32>,
    gateway: String,
    json: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct ReadCommand {
    target: String,
    conversation_id: String,
    gateway: String,
    json: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliSendRequest {
    from: String,
    to: String,
    text: String,
    client_tag: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct ShellMessageEditRequest {
    room_id: String,
    message_id: String,
    actor: String,
    text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct ShellMessageRecallRequest {
    room_id: String,
    message_id: String,
    actor: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct ShellMessageEditResponse {
    ok: bool,
    conversation_id: String,
    message_id: String,
    edit_status: String,
    edited_at_ms: i64,
    edited_by: String,
    text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct ShellMessageRecallResponse {
    ok: bool,
    conversation_id: String,
    message_id: String,
    recall_status: String,
    recalled_at_ms: i64,
    recalled_by: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliSendResponse {
    ok: bool,
    conversation_id: String,
    message_id: String,
    delivered_at_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliInboxConversation {
    conversation_id: String,
    title: String,
    kind: String,
    updated_at_ms: i64,
    last_message_preview: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliInboxResponse {
    identity: String,
    conversations: Vec<CliInboxConversation>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliRoomEntry {
    conversation_id: String,
    title: String,
    kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliRoomsResponse {
    identity: String,
    entries: Vec<CliRoomEntry>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliTailMessage {
    message_id: String,
    sender: String,
    text: String,
    is_recalled: bool,
    recalled_by: Option<String>,
    recalled_at_ms: Option<i64>,
    is_edited: bool,
    edited_by: Option<String>,
    edited_at_ms: Option<i64>,
    timestamp_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliTailResponse {
    identity: String,
    conversation_id: String,
    messages: Vec<CliTailMessage>,
}

// 对齐 Gateway ShellRoomMessage 子集（gateway_models.rs）。search 端点返回 Vec<ShellRoomMessage>。
// 只反序列化展示需要的字段，Gateway 多余字段（recalled_by/edited_by/moderation_status 等）serde 默认忽略。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliSearchMessage {
    message_id: String,
    sender: String,
    timestamp_ms: i64,
    timestamp_label: String,
    text: String,
    #[serde(default)]
    delivery_status: String,
    is_recalled: bool,
    is_edited: bool,
}

// /v1/residents 返回的居民目录条目子集（对齐 gateway_models.rs:296 ResidentDirectoryEntry）。
// 网关 resident_id 为裸名（如 "rsaga"）；nickname/online/last_seen_at_ms/avatar_id/personal_room_id
// 在网关侧 Option::is_none 时 skip 序列化，这里统一 #[serde(default)] 容错缺失字段。
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliResidentEntry {
    resident_id: String,
    #[serde(default)]
    nickname: Option<String>,
    #[serde(default)]
    active_cities: Vec<String>,
    #[serde(default)]
    pending_cities: Vec<String>,
    #[serde(default)]
    roles: Vec<String>,
    #[serde(default)]
    online: Option<bool>,
    #[serde(default)]
    last_seen_at_ms: Option<i64>,
    #[serde(default)]
    avatar_id: Option<String>,
    #[serde(default)]
    personal_room_id: Option<String>,
}

/// 公共广场公告（对齐 gateway WorldSquareNotice；author_id 为 IdentityId newtype，序列化为字符串）。
#[derive(Debug, Clone, Deserialize)]
struct CliSquareNotice {
    #[serde(default)]
    title: String,
    #[serde(default)]
    body: String,
    #[serde(default)]
    author_id: String,
    #[serde(default)]
    posted_at_ms: i64,
    #[serde(default)]
    severity: String,
    #[serde(default)]
    tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliMarkReadRequest {
    resident_id: String,
    conversation_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliReadResponse {
    ok: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliPresenceRequest {
    resident_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliPresenceResponse {
    ok: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliExportConversation {
    conversation_id: String,
    title: String,
    kind: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliExportResponse {
    resident_id: String,
    format: String,
    exported_at_ms: i64,
    conversation_count: usize,
    conversations: Vec<CliExportConversation>,
    content: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct AdminCommand {
    target: String,
    reason: String,
    gateway: String,
    json: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct IdentityCommand {
    target: String,
    gateway: String,
    json: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct InviteCreateCommand {
    actor: String,
    max_uses: u32,
    gateway: String,
    json: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
struct InviteRevokeCommand {
    actor: String,
    code: String,
    gateway: String,
    json: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct AdminBanRequest {
    resident_id: String,
    reason: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct AdminTargetRequest {
    resident_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct AdminRoomTargetRequest {
    room_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct AdminCreateInviteRequest {
    actor_id: String,
    max_uses: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct AdminRevokeInviteRequest {
    code: String,
    actor_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct AdminCreateInviteResponse {
    ok: bool,
    code: String,
    max_uses: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct AdminResidentEntry {
    resident_id: String,
    #[serde(default)]
    nickname: Option<String>,
    online: bool,
    is_banned: bool,
    roles: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct AdminRoomEntry {
    id: String,
    title: String,
    kind: String,
    participant_count: u64,
    message_count: u64,
    is_frozen: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
struct CliErrorResponse {
    message: Option<String>,
    error: Option<String>,
}

fn default_gateway_url() -> String {
    std::env::var("LOBSTER_WAKU_GATEWAY_URL").unwrap_or_else(|_| "http://127.0.0.1:8787".into())
}

fn parse_args<I, S>(args: I) -> Result<Command, String>
where
    I: IntoIterator<Item = S>,
    S: Into<String>,
{
    let mut iter = args.into_iter().map(Into::into);
    let _bin = iter.next();
    let Some(command) = iter.next() else {
        return Ok(Command::Help(None));
    };

    match command.as_str() {
        "send" => parse_send_command(iter.collect::<Vec<_>>()).map(Command::Send),
        "edit" => parse_edit_command(iter.collect::<Vec<_>>()).map(Command::Edit),
        "recall" => parse_recall_command(iter.collect::<Vec<_>>()).map(Command::Recall),
        "export" => parse_export_command(iter.collect::<Vec<_>>()).map(Command::Export),
        "inbox" => parse_query_command(iter.collect::<Vec<_>>()).map(Command::Inbox),
        "rooms" => parse_query_command(iter.collect::<Vec<_>>()).map(Command::Rooms),
        "tail" => parse_tail_command(iter.collect::<Vec<_>>()).map(Command::Tail),
        "search" => parse_search_command(iter.collect::<Vec<_>>()).map(Command::Search),
        "who" => parse_query_command(iter.collect::<Vec<_>>()).map(Command::Who),
        "read" => parse_read_command(iter.collect::<Vec<_>>()).map(Command::Read),
        "presence" => parse_query_command(iter.collect::<Vec<_>>()).map(Command::Presence),
        "ban" => parse_admin_command(iter.collect::<Vec<_>>()).map(Command::Ban),
        "unban" => parse_identity_command(iter.collect::<Vec<_>>()).map(Command::Unban),
        "freeze" => parse_identity_command(iter.collect::<Vec<_>>()).map(Command::Freeze),
        "unfreeze" => parse_identity_command(iter.collect::<Vec<_>>()).map(Command::Unfreeze),
        "invite-create" => {
            parse_invite_create_command(iter.collect::<Vec<_>>()).map(Command::InviteCreate)
        }
        "invite-revoke" => {
            parse_invite_revoke_command(iter.collect::<Vec<_>>()).map(Command::InviteRevoke)
        }
        "residents" => parse_query_command(iter.collect::<Vec<_>>()).map(Command::AdminResidents),
        "rooms-admin" => parse_query_command(iter.collect::<Vec<_>>()).map(Command::AdminRooms),
        "world" => parse_world_query_command(iter.collect::<Vec<_>>()).map(Command::World),
        "square" => parse_world_query_command(iter.collect::<Vec<_>>()).map(Command::Square),
        "cities" => parse_world_query_command(iter.collect::<Vec<_>>()).map(Command::Cities),
        "safety" => parse_world_query_command(iter.collect::<Vec<_>>()).map(Command::Safety),
        "help" => Ok(Command::Help(iter.next())),
        other => Err(format!("unsupported command: {other}")),
    }
}

fn parse_actor_identity(raw: &str) -> Result<String, String> {
    let Some((prefix, rest)) = raw.trim().split_once(':') else {
        return if raw.trim().is_empty() {
            Err("actor identity required".into())
        } else {
            Ok(raw.trim().to_string())
        };
    };
    match prefix {
        "user" | "agent" if !rest.trim().is_empty() => Ok(rest.trim().to_string()),
        _ => Err(format!(
            "actor must be an identity (`user:...` or `agent:...`), not `{raw}`"
        )),
    }
}

fn parse_send_command(args: Vec<String>) -> Result<SendCommand, String> {
    let mut from = None;
    let mut to = None;
    let mut text = None;
    let mut gateway = default_gateway_url();
    let mut json = false;

    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--from" => from = iter.next(),
            "--to" => to = iter.next(),
            "--text" => text = iter.next(),
            "--gateway" => {
                gateway = iter
                    .next()
                    .ok_or_else(|| "missing value for --gateway".to_string())?
            }
            "--json" => json = true,
            other => return Err(format!("unsupported send flag: {other}")),
        }
    }

    let from = from.ok_or_else(|| "missing required flag --from".to_string())?;
    let to = to.ok_or_else(|| "missing required flag --to".to_string())?;
    validate_send_target_address(&to)?;

    Ok(SendCommand {
        from,
        to,
        text: text.ok_or_else(|| "missing required flag --text".to_string())?,
        gateway,
        json,
    })
}

fn parse_edit_command(args: Vec<String>) -> Result<EditCommand, String> {
    let mut actor = None;
    let mut conversation_id = None;
    let mut message_id = None;
    let mut text = None;
    let mut gateway = default_gateway_url();
    let mut json = false;

    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--actor" => actor = iter.next(),
            "--conversation-id" => conversation_id = iter.next(),
            "--message-id" => message_id = iter.next(),
            "--text" => text = iter.next(),
            "--gateway" => {
                gateway = iter
                    .next()
                    .ok_or_else(|| "missing value for --gateway".to_string())?
            }
            "--json" => json = true,
            other => return Err(format!("unsupported edit flag: {other}")),
        }
    }

    Ok(EditCommand {
        actor: actor.ok_or_else(|| "missing required flag --actor".to_string())?,
        conversation_id: conversation_id
            .ok_or_else(|| "missing required flag --conversation-id".to_string())?,
        message_id: message_id.ok_or_else(|| "missing required flag --message-id".to_string())?,
        text: text.ok_or_else(|| "missing required flag --text".to_string())?,
        gateway,
        json,
    })
}

fn parse_recall_command(args: Vec<String>) -> Result<RecallCommand, String> {
    let mut actor = None;
    let mut conversation_id = None;
    let mut message_id = None;
    let mut gateway = default_gateway_url();
    let mut json = false;

    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--actor" => actor = iter.next(),
            "--conversation-id" => conversation_id = iter.next(),
            "--message-id" => message_id = iter.next(),
            "--gateway" => {
                gateway = iter
                    .next()
                    .ok_or_else(|| "missing value for --gateway".to_string())?
            }
            "--json" => json = true,
            other => return Err(format!("unsupported recall flag: {other}")),
        }
    }

    Ok(RecallCommand {
        actor: actor.ok_or_else(|| "missing required flag --actor".to_string())?,
        conversation_id: conversation_id
            .ok_or_else(|| "missing required flag --conversation-id".to_string())?,
        message_id: message_id.ok_or_else(|| "missing required flag --message-id".to_string())?,
        gateway,
        json,
    })
}

fn parse_export_command(args: Vec<String>) -> Result<ExportCommand, String> {
    let mut target = None;
    let mut conversation_id = None;
    let mut format = "md".to_string();
    let mut include_public = false;
    let mut gateway = default_gateway_url();
    let mut json = false;

    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--for" => target = iter.next(),
            "--conversation-id" => conversation_id = iter.next(),
            "--format" => {
                format = iter
                    .next()
                    .ok_or_else(|| "missing value for --format".to_string())?
            }
            "--include-public" => include_public = true,
            "--gateway" => {
                gateway = iter
                    .next()
                    .ok_or_else(|| "missing value for --gateway".to_string())?
            }
            "--json" => json = true,
            other => return Err(format!("unsupported export flag: {other}")),
        }
    }

    match format.as_str() {
        "md" | "markdown" | "jsonl" | "txt" | "text" => {}
        other => return Err(format!("unsupported export format: {other}")),
    }

    Ok(ExportCommand {
        target: target.ok_or_else(|| "missing required flag --for".to_string())?,
        conversation_id,
        format,
        include_public,
        gateway,
        json,
    })
}

fn validate_send_target_address(target: &str) -> Result<(), String> {
    if target.starts_with("user:") || target.starts_with("agent:") || target.starts_with("room:") {
        Ok(())
    } else {
        Err(format!(
            "send --to must be a CLI address (`user:...`, `agent:...`, or `room:...`), not a conversation id like `{target}`"
        ))
    }
}

fn parse_query_command(args: Vec<String>) -> Result<QueryCommand, String> {
    let mut target = None;
    let mut gateway = default_gateway_url();
    let mut json = false;

    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--for" => target = iter.next(),
            "--gateway" => {
                gateway = iter
                    .next()
                    .ok_or_else(|| "missing value for --gateway".to_string())?
            }
            "--json" => json = true,
            other => return Err(format!("unsupported query flag: {other}")),
        }
    }

    Ok(QueryCommand {
        target: target.ok_or_else(|| "missing required flag --for".to_string())?,
        gateway,
        json,
    })
}

/// 解析无 target 的全局只读命令（world / square）：仅接受 --gateway / --json。
fn parse_world_query_command(args: Vec<String>) -> Result<WorldQueryCommand, String> {
    let mut gateway = default_gateway_url();
    let mut json = false;

    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--gateway" => {
                gateway = iter
                    .next()
                    .ok_or_else(|| "missing value for --gateway".to_string())?
            }
            "--json" => json = true,
            other => return Err(format!("unsupported flag: {other}")),
        }
    }

    Ok(WorldQueryCommand { gateway, json })
}

fn parse_search_command(args: Vec<String>) -> Result<SearchCommand, String> {
    // 位置参数（非 -- 开头）拼接为搜索关键词；--flag 走显式解析。
    // 同时支持 `search 晚上吃饭 --room r --limit 5` 与 `search --room r 晚上吃饭` 两种顺序。
    let mut query_parts: Vec<String> = Vec::new();
    let mut room_id = None;
    let mut limit = None;
    let mut gateway = default_gateway_url();
    let mut json = false;

    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--room" | "--room-id" | "--conversation-id" => {
                room_id = iter.next();
            }
            "--limit" => {
                let raw = iter
                    .next()
                    .ok_or_else(|| "missing value for --limit".to_string())?;
                limit = Some(parse_search_limit(&raw)?);
            }
            "--gateway" => {
                gateway = iter
                    .next()
                    .ok_or_else(|| "missing value for --gateway".to_string())?;
            }
            "--json" => json = true,
            other => {
                if let Some(rest) = other.strip_prefix("--limit=") {
                    limit = Some(parse_search_limit(rest)?);
                } else if let Some(rest) = other.strip_prefix("--room=") {
                    room_id = Some(rest.to_string());
                } else if other.starts_with("--") {
                    return Err(format!("unsupported search flag: {other}"));
                } else {
                    query_parts.push(other.to_string());
                }
            }
        }
    }

    let query = query_parts.join(" ").trim().to_string();
    if query.is_empty() {
        return Err(
            "missing search keyword (usage: search <keyword> [--room <id>] [--limit N])".into(),
        );
    }
    Ok(SearchCommand {
        query,
        room_id,
        limit,
        gateway,
        json,
    })
}

fn parse_read_command(args: Vec<String>) -> Result<ReadCommand, String> {
    // read --for <resident> --conversation-id <id> [--gateway <url>] [--json]
    // 标记某会话已读，配合 inbox/tail 形成未读闭环。
    let mut target = None;
    let mut conversation_id = None;
    let mut gateway = default_gateway_url();
    let mut json = false;

    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--for" => target = iter.next(),
            "--conversation-id" | "--conversation" | "--room" | "--room-id" => {
                conversation_id = iter.next();
            }
            "--gateway" => {
                gateway = iter
                    .next()
                    .ok_or_else(|| "missing value for --gateway".to_string())?;
            }
            "--json" => json = true,
            other => return Err(format!("unsupported read flag: {other}")),
        }
    }

    let target = target.ok_or_else(|| {
        "missing required flag --for (usage: read --for <resident> --conversation-id <id>)"
            .to_string()
    })?;
    let conversation_id = conversation_id.ok_or_else(|| {
        "missing required flag --conversation-id (usage: read --for <resident> --conversation-id <id>)"
            .to_string()
    })?;
    if target.trim().is_empty() {
        return Err("--for must not be empty".into());
    }
    if conversation_id.trim().is_empty() {
        return Err("--conversation-id must not be empty".into());
    }
    Ok(ReadCommand {
        target,
        conversation_id,
        gateway,
        json,
    })
}

fn parse_search_limit(raw: &str) -> Result<u32, String> {
    raw.parse::<u32>()
        .map_err(|_| format!("--limit must be a non-negative number, not `{raw}`"))
}

fn parse_tail_command(args: Vec<String>) -> Result<TailCommand, String> {
    let mut target = None;
    let mut conversation_id = None;
    let mut gateway = default_gateway_url();
    let mut json = false;
    let mut follow = false;

    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--for" => target = iter.next(),
            "--conversation-id" => conversation_id = iter.next(),
            "--gateway" => {
                gateway = iter
                    .next()
                    .ok_or_else(|| "missing value for --gateway".to_string())?
            }
            "--json" => json = true,
            "--follow" => follow = true,
            other => return Err(format!("unsupported tail flag: {other}")),
        }
    }

    Ok(TailCommand {
        target: target.ok_or_else(|| "missing required flag --for".to_string())?,
        conversation_id,
        gateway,
        json,
        follow,
    })
}

fn parse_admin_command(args: Vec<String>) -> Result<AdminCommand, String> {
    let mut target = None;
    let mut reason = "从 CLI 封禁".to_string();
    let mut gateway = default_gateway_url();
    let mut json = false;

    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--target" => target = iter.next(),
            "--reason" => reason = iter.next().unwrap_or_else(|| reason.clone()),
            "--gateway" => {
                gateway = iter
                    .next()
                    .ok_or_else(|| "missing value for --gateway".to_string())?
            }
            "--json" => json = true,
            other => return Err(format!("unsupported flag: {other}")),
        }
    }

    Ok(AdminCommand {
        target: target.ok_or_else(|| "missing required flag --target".to_string())?,
        reason,
        gateway,
        json,
    })
}

fn parse_identity_command(args: Vec<String>) -> Result<IdentityCommand, String> {
    let mut target = None;
    let mut gateway = default_gateway_url();
    let mut json = false;

    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--target" => target = iter.next(),
            "--gateway" => {
                gateway = iter
                    .next()
                    .ok_or_else(|| "missing value for --gateway".to_string())?
            }
            "--json" => json = true,
            other => return Err(format!("unsupported flag: {other}")),
        }
    }

    Ok(IdentityCommand {
        target: target.ok_or_else(|| "missing required flag --target".to_string())?,
        gateway,
        json,
    })
}

fn parse_invite_create_command(args: Vec<String>) -> Result<InviteCreateCommand, String> {
    let mut actor = None;
    let mut max_uses = 10u32;
    let mut gateway = default_gateway_url();
    let mut json = false;

    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--actor" => actor = iter.next(),
            "--max-uses" => {
                if let Some(val) = iter.next() {
                    max_uses = val
                        .parse::<u32>()
                        .map_err(|_| "invalid --max-uses value".to_string())?;
                }
            }
            "--gateway" => {
                gateway = iter
                    .next()
                    .ok_or_else(|| "missing value for --gateway".to_string())?
            }
            "--json" => json = true,
            other => return Err(format!("unsupported flag: {other}")),
        }
    }

    Ok(InviteCreateCommand {
        actor: actor.ok_or_else(|| "missing required flag --actor".to_string())?,
        max_uses,
        gateway,
        json,
    })
}

fn parse_invite_revoke_command(args: Vec<String>) -> Result<InviteRevokeCommand, String> {
    let mut actor = None;
    let mut code = None;
    let mut gateway = default_gateway_url();
    let mut json = false;

    let mut iter = args.into_iter();
    while let Some(arg) = iter.next() {
        match arg.as_str() {
            "--actor" => actor = iter.next(),
            "--code" => code = iter.next(),
            "--gateway" => {
                gateway = iter
                    .next()
                    .ok_or_else(|| "missing value for --gateway".to_string())?
            }
            "--json" => json = true,
            other => return Err(format!("unsupported flag: {other}")),
        }
    }

    Ok(InviteRevokeCommand {
        actor: actor.ok_or_else(|| "missing required flag --actor".to_string())?,
        code: code.ok_or_else(|| "missing required flag --code".to_string())?,
        gateway,
        json,
    })
}

fn build_send_request(command: &SendCommand) -> CliSendRequest {
    CliSendRequest {
        from: command.from.clone(),
        to: command.to.clone(),
        text: command.text.clone(),
        client_tag: Some("lobster-cli".into()),
    }
}

fn build_edit_request(command: &EditCommand) -> Result<ShellMessageEditRequest, String> {
    Ok(ShellMessageEditRequest {
        room_id: command.conversation_id.clone(),
        message_id: command.message_id.clone(),
        actor: parse_actor_identity(&command.actor)?,
        text: command.text.clone(),
    })
}

fn build_recall_request(command: &RecallCommand) -> Result<ShellMessageRecallRequest, String> {
    Ok(ShellMessageRecallRequest {
        room_id: command.conversation_id.clone(),
        message_id: command.message_id.clone(),
        actor: parse_actor_identity(&command.actor)?,
    })
}

fn format_send_success(response: &CliSendResponse) -> String {
    format!(
        "已投递到 {}，消息 {}，时间 {}",
        response.conversation_id, response.message_id, response.delivered_at_ms
    )
}

fn format_edit_success(response: &ShellMessageEditResponse) -> String {
    format!(
        "已编辑 {} 的消息 {}，时间 {}",
        response.conversation_id, response.message_id, response.edited_at_ms
    )
}

fn format_recall_success(response: &ShellMessageRecallResponse) -> String {
    format!(
        "已撤回 {} 的消息 {}，时间 {}",
        response.conversation_id, response.message_id, response.recalled_at_ms
    )
}

fn format_inbox(response: &CliInboxResponse) -> String {
    let mut lines = vec![format!("收件箱 {}", response.identity)];
    for conversation in &response.conversations {
        lines.push(format!(
            "- [{}] {}: {}",
            conversation.kind, conversation.title, conversation.last_message_preview
        ));
    }
    lines.join("\n")
}

fn format_rooms(response: &CliRoomsResponse) -> String {
    let mut lines = vec![format!("会话列表 {}", response.identity)];
    for entry in &response.entries {
        lines.push(format!("- [{}] {}", entry.kind, entry.title));
    }
    lines.join("\n")
}

fn format_tail_message(message: &CliTailMessage) -> String {
    let status = if message.is_recalled {
        "[已撤回] "
    } else if message.is_edited {
        "[已编辑] "
    } else {
        ""
    };
    format!(
        "[{}] {status}{}: {}",
        message.timestamp_ms, message.sender, message.text
    )
}

fn format_tail(response: &CliTailResponse) -> String {
    let mut lines = vec![format!("消息流 {}", response.conversation_id)];
    for message in &response.messages {
        lines.push(format_tail_message(message));
    }
    lines.join("\n")
}

fn format_search_message(query: &str, message: &CliSearchMessage) -> String {
    let status = if message.is_recalled {
        "[已撤回] "
    } else if message.is_edited {
        "[已编辑] "
    } else {
        ""
    };
    format!(
        "[{}] {status}{}: {}",
        message.timestamp_label,
        message.sender,
        highlight_keyword(query, &message.text)
    )
}

fn format_search_results(query: &str, messages: &[CliSearchMessage]) -> String {
    let mut lines = vec![format!("搜索「{}」命中 {} 条", query, messages.len())];
    for message in messages {
        lines.push(format_search_message(query, message));
    }
    lines.join("\n")
}

// 用 «» 角括号标记命中片段，纯文本终端友好（不引入颜色转义依赖）。
// 精确子串匹配，对中文够用；大小写不敏感首版不做（会丢失原大小写）。
fn highlight_keyword(query: &str, text: &str) -> String {
    if query.is_empty() {
        return text.to_string();
    }
    text.replace(query, &format!("«{query}»"))
}

fn format_export(response: &CliExportResponse) -> String {
    response.content.clone()
}

fn query_escape(value: &str) -> String {
    value
        .bytes()
        .flat_map(|byte| match byte {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => {
                vec![byte as char]
            }
            other => format!("%{other:02X}").chars().collect(),
        })
        .collect()
}

fn extract_gateway_error_message(body: &str) -> Option<String> {
    serde_json::from_str::<CliErrorResponse>(body)
        .ok()
        .and_then(|payload| payload.message.or(payload.error))
        .map(|message| message.trim().to_string())
        .filter(|message| !message.is_empty())
}

fn format_gateway_status_error(action: &str, status: u16, body: Option<&str>) -> String {
    if let Some(message) = body.and_then(extract_gateway_error_message) {
        format!("{action} failed: {message}")
    } else {
        format!("{action} failed: status code {status}")
    }
}

fn post_json<T, R>(url: &str, request: &T, action: &str) -> Result<R, String>
where
    T: Serialize,
    R: serde::de::DeserializeOwned,
{
    let response = match ureq::post(url).send_json(
        serde_json::to_value(request)
            .map_err(|error| format!("serialize {action} request failed: {error}"))?,
    ) {
        Ok(response) => response,
        Err(ureq::Error::Status(status, response)) => {
            let body = response.into_string().ok();
            return Err(format_gateway_status_error(
                &format!("{action} request"),
                status,
                body.as_deref(),
            ));
        }
        Err(error) => return Err(format!("{action} request failed: {error}")),
    };

    response
        .into_json::<R>()
        .map_err(|error| format!("decode {action} response failed: {error}"))
}

fn run_send(command: SendCommand) -> Result<String, String> {
    let request = build_send_request(&command);
    let url = format!("{}/v1/cli/send", command.gateway.trim_end_matches('/'));
    let payload = post_json::<_, CliSendResponse>(&url, &request, "send")?;

    if command.json {
        serde_json::to_string(&payload)
            .map_err(|error| format!("serialize send response failed: {error}"))
    } else {
        Ok(format_send_success(&payload))
    }
}

fn run_edit(command: EditCommand) -> Result<String, String> {
    let request = build_edit_request(&command)?;
    let url = format!(
        "{}/v1/shell/message/edit",
        command.gateway.trim_end_matches('/')
    );
    let payload = post_json::<_, ShellMessageEditResponse>(&url, &request, "edit")?;
    if command.json {
        serde_json::to_string(&payload)
            .map_err(|error| format!("serialize edit response failed: {error}"))
    } else {
        Ok(format_edit_success(&payload))
    }
}

fn run_recall(command: RecallCommand) -> Result<String, String> {
    let request = build_recall_request(&command)?;
    let url = format!(
        "{}/v1/shell/message/recall",
        command.gateway.trim_end_matches('/')
    );
    let payload = post_json::<_, ShellMessageRecallResponse>(&url, &request, "recall")?;
    if command.json {
        serde_json::to_string(&payload)
            .map_err(|error| format!("serialize recall response failed: {error}"))
    } else {
        Ok(format_recall_success(&payload))
    }
}

fn run_export(command: ExportCommand) -> Result<String, String> {
    let resident_id = parse_actor_identity(&command.target)?;
    let mut url = format!(
        "{}/v1/export?resident_id={}&format={}&include_public={}",
        command.gateway.trim_end_matches('/'),
        query_escape(&resident_id),
        query_escape(&command.format),
        command.include_public
    );
    if let Some(conversation_id) = &command.conversation_id {
        url.push_str("&conversation_id=");
        url.push_str(&query_escape(conversation_id));
    }
    let payload = run_query::<CliExportResponse>(&url)?;
    if command.json {
        serde_json::to_string(&payload)
            .map_err(|error| format!("serialize export response failed: {error}"))
    } else {
        Ok(format_export(&payload))
    }
}

fn run_query<T>(url: &str) -> Result<T, String>
where
    T: serde::de::DeserializeOwned,
{
    let response = match ureq::get(url).call() {
        Ok(response) => response,
        Err(ureq::Error::Status(status, response)) => {
            let body = response.into_string().ok();
            return Err(format_gateway_status_error(
                "query request",
                status,
                body.as_deref(),
            ));
        }
        Err(error) => return Err(format!("query request failed: {error}")),
    };
    response
        .into_json::<T>()
        .map_err(|error| format!("decode query response failed: {error}"))
}

fn run_inbox(command: QueryCommand) -> Result<String, String> {
    let url = format!(
        "{}/v1/cli/inbox?for={}",
        command.gateway.trim_end_matches('/'),
        command.target
    );
    let payload = run_query::<CliInboxResponse>(&url)?;
    if command.json {
        serde_json::to_string(&payload)
            .map_err(|error| format!("serialize inbox response failed: {error}"))
    } else {
        Ok(format_inbox(&payload))
    }
}

fn run_rooms(command: QueryCommand) -> Result<String, String> {
    let url = format!(
        "{}/v1/cli/rooms?for={}",
        command.gateway.trim_end_matches('/'),
        command.target
    );
    let payload = run_query::<CliRoomsResponse>(&url)?;
    if command.json {
        serde_json::to_string(&payload)
            .map_err(|error| format!("serialize rooms response failed: {error}"))
    } else {
        Ok(format_rooms(&payload))
    }
}

// 调 Gateway GET /v1/shell/messages/search?q=<kw>&room_id=<id>&limit=<n>（http_router.rs:161，
// 已存在端点，无需改 Gateway）。query/room_id 经 query_escape 编码（含空格/中文/特殊字符）。
fn run_search(command: SearchCommand) -> Result<String, String> {
    let mut url = format!(
        "{}/v1/shell/messages/search?q={}",
        command.gateway.trim_end_matches('/'),
        query_escape(&command.query)
    );
    if let Some(room_id) = &command.room_id {
        url.push_str("&room_id=");
        url.push_str(&query_escape(room_id));
    }
    if let Some(limit) = command.limit {
        url.push_str(&format!("&limit={limit}"));
    }
    let payload = run_query::<Vec<CliSearchMessage>>(&url)?;
    if command.json {
        serde_json::to_string(&payload)
            .map_err(|error| format!("serialize search response failed: {error}"))
    } else if payload.is_empty() {
        Ok(format!("未找到匹配「{}」的消息", command.query))
    } else {
        Ok(format_search_results(&command.query, &payload))
    }
}

fn format_who(entry: &CliResidentEntry) -> String {
    let display_name = entry.nickname.as_deref().unwrap_or(&entry.resident_id);
    let presence = match entry.online {
        Some(true) => "● 在线",
        Some(false) => "○ 离线",
        None => "状态未知",
    };
    let mut lines = vec![
        format!("居民 {} ({})", display_name, entry.resident_id),
        format!("  状态: {}", presence),
    ];
    if !entry.roles.is_empty() {
        lines.push(format!("  角色: {}", entry.roles.join(", ")));
    }
    if !entry.active_cities.is_empty() {
        lines.push(format!("  活跃城市: {}", entry.active_cities.join(", ")));
    }
    if let Some(room_id) = &entry.personal_room_id {
        lines.push(format!("  个人房间: {}", room_id));
    }
    lines.join("\n")
}

fn format_help(topic: Option<&str>) -> String {
    match topic {
        Some(command) => format_help_for_command(command),
        None => format_help_overview(),
    }
}

fn format_help_overview() -> String {
    let lines = [
        "lobster-cli — 单城中心化 IM 客户端",
        "",
        "消息:",
        "  send             发送消息  (--from <id> --to <id> --text <msg>)",
        "  edit             编辑消息  (--actor <id> --conversation-id <id> --message-id <id> --text <msg>)",
        "  recall           撤回消息  (--actor <id> --conversation-id <id> --message-id <id>)",
        "  search           搜索历史  (<keyword> [--room <id>] [--limit N])",
        "",
        "会话:",
        "  inbox            未读会话摘要  (--for <resident>)",
        "  rooms            可见会话列表  (--for <resident>)",
        "  tail             拉取新消息  (--for <resident> [--conversation-id <id>] [--follow])",
        "  export           导出聊天记录  (--for <resident> [--conversation-id <id>] [--format md|jsonl|txt])",
        "",
        "身份与状态:",
        "  who              居民在线名片  (--for <resident>)",
        "  read             标记会话已读  (--for <resident> --conversation-id <id>)",
        "  presence         上报在线  (--for <resident>)",
        "",
        "世界:",
        "  world            世界治理总览  (城市 / 信任 / 公告 / 安全 / 管理员)",
        "  square           公共广场公告  (逐条标题 / 严重度 / 发布者)",
        "  cities           城市列表  (城市名 / 简介)",
        "  safety           世界安全快照  (信任 / 公告 / 报告 / 制裁 / 黑名单)",
        "",
        "管理（需 admin 身份）:",
        "  ban / unban      封禁 / 解封居民  (--target <resident>)",
        "  freeze / unfreeze 冻结 / 解冻房间  (--target <room>)",
        "  invite-create    生成邀请码  (--actor <admin> [--max-uses N])",
        "  invite-revoke    撤销邀请码  (--actor <admin> --code <code>)",
        "  residents        居民目录（admin 视角）",
        "  rooms-admin      房间目录（admin 视角）",
        "",
        "通用标志: --gateway <url>   --json（机器可读输出）",
        "默认网关: http://127.0.0.1:8787（或环境变量 LOBSTER_WAKU_GATEWAY_URL）",
    ];
    lines.join("\n")
}

fn format_help_for_command(command: &str) -> String {
    // 已知命令：各 parse 函数在缺少必填标志时会打印 usage，故这里只引导，不重复维护。
    let known = [
        "send",
        "edit",
        "recall",
        "search",
        "inbox",
        "rooms",
        "tail",
        "export",
        "who",
        "read",
        "presence",
        "ban",
        "unban",
        "freeze",
        "unfreeze",
        "invite-create",
        "invite-revoke",
        "residents",
        "rooms-admin",
        "world",
        "square",
        "cities",
        "safety",
    ];
    if known.contains(&command) {
        format!(
            "`{command}` 的详细用法：运行 `lobster-cli {command}` 时若缺少必填标志会打印 usage；完整命令列表见 `lobster-cli help`。"
        )
    } else {
        format!("未知命令 `{command}`。运行 `lobster-cli help` 查看全部命令。")
    }
}

// 调 Gateway GET /v1/residents?q=<关键词>（http_router.rs:166，已存在端点，无需改 Gateway）。
// 网关 resident_id 为裸名，CLI --for 接受 user:/agent:/裸名，先经 parse_actor_identity 剥前缀，
// 再按裸名精确匹配；精确失败则列 q 命中的候选，全部落空提示未找到。
fn run_who(command: QueryCommand) -> Result<String, String> {
    let resident_key = parse_actor_identity(&command.target)?;
    let url = format!(
        "{}/v1/residents?q={}",
        command.gateway.trim_end_matches('/'),
        query_escape(&resident_key)
    );
    let payload = run_query::<Vec<CliResidentEntry>>(&url)?;
    if command.json {
        let matched = payload
            .iter()
            .find(|entry| entry.resident_id == resident_key)
            .or_else(|| payload.first())
            .cloned();
        serde_json::to_string(&matched)
            .map_err(|error| format!("serialize who response failed: {error}"))
    } else if let Some(entry) = payload.iter().find(|e| e.resident_id == resident_key) {
        Ok(format_who(entry))
    } else if payload.is_empty() {
        Ok(format!("未找到居民「{}」", command.target))
    } else {
        let mut lines = vec![format!(
            "未精确匹配「{}」，相关候选 {} 个：",
            command.target,
            payload.len()
        )];
        for entry in &payload {
            let name = entry.nickname.as_deref().unwrap_or(&entry.resident_id);
            lines.push(format!("  - {} ({})", name, entry.resident_id));
        }
        Ok(lines.join("\n"))
    }
}

// 调 Gateway GET /v1/world（http_read_routes.rs:113，已存在端点，无需改 Gateway）。
// /v1/world 返回完整 GovernanceSnapshot 对象；此处只读摘要字段并渲染人类可读总览。
// 注意管理员字段名是 `world_stewards`（与 GovernanceSnapshot 字段名一致，非 `stewards`）。
fn format_world(world: &serde_json::Value) -> String {
    let title = world["world"]["title"].as_str().unwrap_or("未知世界");
    let world_id = world["world"]["world_id"].as_str().unwrap_or("?");
    let cities = world["cities"].as_array().map(|a| a.len()).unwrap_or(0);
    let stewards: Vec<&str> = world["world_stewards"]
        .as_array()
        .map(|a| a.iter().filter_map(|v| v.as_str()).collect())
        .unwrap_or_default();
    let trust_count = world["city_trust"].as_array().map(|a| a.len()).unwrap_or(0);
    let notice_count = world["world_square_notices"]
        .as_array()
        .map(|a| a.len())
        .unwrap_or(0);
    let advisory_count = world["safety_advisories"]
        .as_array()
        .map(|a| a.len())
        .unwrap_or(0);
    let report_count = world["safety_reports"]
        .as_array()
        .map(|a| a.len())
        .unwrap_or(0);
    let sanction_count = world["resident_sanctions"]
        .as_array()
        .map(|a| a.len())
        .unwrap_or(0);

    let mut lines = vec![
        format!("🌍 {title}（{world_id}）"),
        format!(
            "城市 {cities} 座 · 信任记录 {trust_count} 条 · 广场公告 {notice_count} 条 · 安全公告 {advisory_count} 条 · 安全报告 {report_count} 条 · 制裁 {sanction_count} 条"
        ),
    ];
    if !stewards.is_empty() {
        lines.push(format!("世界管理员：{}", stewards.join("、")));
    }
    lines.join("\n")
}

fn run_world(command: WorldQueryCommand) -> Result<String, String> {
    let url = format!("{}/v1/world", command.gateway.trim_end_matches('/'));
    let payload = run_query::<serde_json::Value>(&url)?;
    if command.json {
        serde_json::to_string(&payload)
            .map_err(|error| format!("serialize world response failed: {error}"))
    } else {
        Ok(format_world(&payload))
    }
}

// 调 Gateway GET /v1/world-square（http_read_routes.rs:169，已存在端点，无需改 Gateway）。
// 返回 Vec<WorldSquareNotice>；空数组提示无公告，非空逐条渲染。
fn format_square(notices: &[CliSquareNotice]) -> String {
    let mut lines = vec![format!("📢 公共广场公告（共 {} 条）", notices.len())];
    for notice in notices {
        let severity = if notice.severity.is_empty() {
            String::new()
        } else {
            format!(" [{}]", notice.severity)
        };
        let tags = if notice.tags.is_empty() {
            String::new()
        } else {
            format!(" #{}", notice.tags.join(" #"))
        };
        lines.push(format!("• {}{}{}", notice.title, severity, tags));
        let author = if notice.author_id.is_empty() {
            "匿名".to_string()
        } else {
            notice.author_id.clone()
        };
        lines.push(format!(
            "  发布者 {author} · 时间戳 {}",
            notice.posted_at_ms
        ));
        if !notice.body.is_empty() {
            lines.push(format!("  {}", notice.body));
        }
    }
    lines.join("\n")
}

fn run_square(command: WorldQueryCommand) -> Result<String, String> {
    let url = format!("{}/v1/world-square", command.gateway.trim_end_matches('/'));
    let payload = run_query::<serde_json::Value>(&url)?;
    if command.json {
        serde_json::to_string(&payload)
            .map_err(|error| format!("serialize square response failed: {error}"))
    } else {
        let notices: Vec<CliSquareNotice> = serde_json::from_value(payload)
            .map_err(|error| format!("decode square notices failed: {error}"))?;
        if notices.is_empty() {
            Ok("公共广场暂无公告".to_string())
        } else {
            Ok(format_square(&notices))
        }
    }
}

// 调 Gateway GET /v1/cities（http_read_routes.rs:124，已存在端点，无需改 Gateway）。
// 返回 Vec<CityState>；city_id/title/description 嵌套在 profile 下（CityState { profile, features }），
// CityState 本身无 state/reason 字段（信任状态在 /v1/world 的 city_trust）。
fn format_cities(cities: &serde_json::Value) -> String {
    let arr = cities.as_array();
    let count = arr.map(|a| a.len()).unwrap_or(0);
    if count == 0 {
        return "世界暂无城市".to_string();
    }
    let mut lines = vec![format!("🏙 城市列表（共 {count} 座）")];
    if let Some(arr) = arr {
        for city in arr {
            let id = city["profile"]["city_id"].as_str().unwrap_or("?");
            let title = city["profile"]["title"].as_str().unwrap_or(id);
            let desc = city["profile"]["description"].as_str().unwrap_or("");
            let desc_str = if desc.is_empty() {
                String::new()
            } else {
                format!(" — {desc}")
            };
            lines.push(format!("• {title}（{id}）{desc_str}"));
        }
    }
    lines.join("\n")
}

fn run_cities(command: WorldQueryCommand) -> Result<String, String> {
    let url = format!("{}/v1/cities", command.gateway.trim_end_matches('/'));
    let payload = run_query::<serde_json::Value>(&url)?;
    if command.json {
        serde_json::to_string(&payload)
            .map_err(|error| format!("serialize cities response failed: {error}"))
    } else {
        Ok(format_cities(&payload))
    }
}

// 调 Gateway GET /v1/world-safety（http_read_routes.rs:182，已存在端点，无需改 Gateway）。
// 返回 WorldSafetySnapshot（字段名 stewards，与 GovernanceSnapshot.world_stewards 不同结构）。
fn format_safety(safety: &serde_json::Value) -> String {
    let stewards: Vec<&str> = safety["stewards"]
        .as_array()
        .map(|a| a.iter().filter_map(|v| v.as_str()).collect())
        .unwrap_or_default();
    let trust_count = safety["city_trust"]
        .as_array()
        .map(|a| a.len())
        .unwrap_or(0);
    let advisory_count = safety["advisories"]
        .as_array()
        .map(|a| a.len())
        .unwrap_or(0);
    let report_count = safety["reports"].as_array().map(|a| a.len()).unwrap_or(0);
    let sanction_count = safety["resident_sanctions"]
        .as_array()
        .map(|a| a.len())
        .unwrap_or(0);
    let blacklist_count = safety["registration_blacklist"]
        .as_array()
        .map(|a| a.len())
        .unwrap_or(0);
    let mirror_count = safety["mirrors"].as_array().map(|a| a.len()).unwrap_or(0);

    let mut lines = vec![format!(
        "🛡 世界安全快照：信任 {trust_count} 条 · 公告 {advisory_count} 条 · 报告 {report_count} 条 · 制裁 {sanction_count} 条 · 注册黑名单 {blacklist_count} 条 · 镜像 {mirror_count} 个"
    )];
    if !stewards.is_empty() {
        lines.push(format!("安全管理员：{}", stewards.join("、")));
    }
    lines.join("\n")
}

fn run_safety(command: WorldQueryCommand) -> Result<String, String> {
    let url = format!("{}/v1/world-safety", command.gateway.trim_end_matches('/'));
    let payload = run_query::<serde_json::Value>(&url)?;
    if command.json {
        serde_json::to_string(&payload)
            .map_err(|error| format!("serialize safety response failed: {error}"))
    } else {
        Ok(format_safety(&payload))
    }
}

fn build_mark_read_request(command: &ReadCommand) -> Result<CliMarkReadRequest, String> {
    let resident_id = parse_actor_identity(&command.target)?;
    Ok(CliMarkReadRequest {
        resident_id,
        conversation_id: command.conversation_id.clone(),
    })
}

// 调 Gateway POST /v1/shell/read（http_router.rs:251，已存在端点，无需改 Gateway）。
// 网关 resident_id 为裸名，--for 经 parse_actor_identity 剥前缀；conversation_id 原样透传。
// 配合 inbox(未读数)/tail(拉新消息)：看完后标记会话已读，未读数归零，形成 IM 闭环。
fn run_read(command: ReadCommand) -> Result<String, String> {
    let request = build_mark_read_request(&command)?;
    let url = format!("{}/v1/shell/read", command.gateway.trim_end_matches('/'));
    let payload = post_json::<_, CliReadResponse>(&url, &request, "read")?;
    if command.json {
        serde_json::to_string(&payload)
            .map_err(|error| format!("serialize read response failed: {error}"))
    } else if payload.ok {
        Ok(format!("已标记会话 {} 已读", command.conversation_id))
    } else {
        Ok(format!("标记会话 {} 已读失败", command.conversation_id))
    }
}

fn build_presence_request(command: &QueryCommand) -> Result<CliPresenceRequest, String> {
    let resident_id = parse_actor_identity(&command.target)?;
    Ok(CliPresenceRequest { resident_id })
}

// 调 Gateway POST /v1/shell/presence（http_router.rs:248，已存在端点，无需改 Gateway）。
// 上报此刻在线：record_presence 更新 last_seen，120s 内 who 命令可见 ●在线，闭环。
fn run_presence(command: QueryCommand) -> Result<String, String> {
    let request = build_presence_request(&command)?;
    let url = format!(
        "{}/v1/shell/presence",
        command.gateway.trim_end_matches('/')
    );
    let payload = post_json::<_, CliPresenceResponse>(&url, &request, "presence")?;
    if command.json {
        serde_json::to_string(&payload)
            .map_err(|error| format!("serialize presence response failed: {error}"))
    } else if payload.ok {
        Ok(format!("已上报 {} 在线", command.target))
    } else {
        Ok(format!("上报 {} 在线失败", command.target))
    }
}

fn render_tail_once(command: &TailCommand) -> Result<String, String> {
    let mut url = format!(
        "{}/v1/cli/tail?for={}",
        command.gateway.trim_end_matches('/'),
        command.target
    );
    if let Some(conversation_id) = &command.conversation_id {
        url.push_str("&conversation_id=");
        url.push_str(conversation_id);
    }
    let payload = run_query::<CliTailResponse>(&url)?;
    if command.json {
        serde_json::to_string(&payload)
            .map_err(|error| format!("serialize tail response failed: {error}"))
    } else {
        Ok(format_tail(&payload))
    }
}

fn run_tail(command: TailCommand) -> Result<String, String> {
    if !command.follow {
        return render_tail_once(&command);
    }

    let mut seen = HashSet::new();
    loop {
        let mut url = format!(
            "{}/v1/cli/tail?for={}",
            command.gateway.trim_end_matches('/'),
            command.target
        );
        if let Some(conversation_id) = &command.conversation_id {
            url.push_str("&conversation_id=");
            url.push_str(conversation_id);
        }
        let payload = run_query::<CliTailResponse>(&url)?;
        for message in payload.messages {
            if seen.insert(message.message_id.clone()) {
                if command.json {
                    println!(
                        "{}",
                        serde_json::to_string(&message)
                            .map_err(|error| format!("serialize tail row failed: {error}"))?
                    );
                } else {
                    println!("{}", format_tail_message(&message));
                }
            }
        }
        thread::sleep(Duration::from_millis(1500));
    }
}

fn format_admin_residents(payload: &[AdminResidentEntry]) -> String {
    let mut lines = vec![format!("居民名单（共 {} 人）：", payload.len())];
    for resident in payload {
        let mut tags: Vec<String> = Vec::new();
        if resident.online {
            tags.push("在线".into());
        }
        if resident.is_banned {
            tags.push("已封禁".into());
        }
        if !resident.roles.is_empty() {
            tags.push(format!("角色:{}", resident.roles.join(",")));
        }
        let tag_str = if tags.is_empty() {
            String::new()
        } else {
            format!(" [{}]", tags.join(", "))
        };
        let display = match &resident.nickname {
            Some(n) if !n.is_empty() => format!("{} ({})", n, resident.resident_id),
            _ => resident.resident_id.clone(),
        };
        lines.push(format!("  {display}{tag_str}"));
    }
    lines.join("\n")
}

fn format_admin_rooms(payload: &[AdminRoomEntry]) -> String {
    let mut lines = vec![format!("房间列表（共 {} 间）：", payload.len())];
    for room in payload {
        let frozen_tag = if room.is_frozen { " [已冻结]" } else { "" };
        lines.push(format!(
            "  {} ({}) · {}人 · {}条消息{}",
            room.title, room.kind, room.participant_count, room.message_count, frozen_tag
        ));
    }
    lines.join("\n")
}

fn run_admin_ban(command: AdminCommand) -> Result<String, String> {
    let request = AdminBanRequest {
        resident_id: command.target,
        reason: command.reason,
    };
    let url = format!(
        "{}/v1/admin/residents/ban",
        command.gateway.trim_end_matches('/')
    );
    let payload = post_json::<_, serde_json::Value>(&url, &request, "ban")?;
    if command.json {
        serde_json::to_string(&payload).map_err(|e| format!("serialize response: {e}"))
    } else {
        Ok(format!("已封禁居民 {}", request.resident_id))
    }
}

fn run_admin_unban(command: IdentityCommand) -> Result<String, String> {
    let request = AdminTargetRequest {
        resident_id: command.target,
    };
    let url = format!(
        "{}/v1/admin/residents/unban",
        command.gateway.trim_end_matches('/')
    );
    let payload = post_json::<_, serde_json::Value>(&url, &request, "unban")?;
    if command.json {
        serde_json::to_string(&payload).map_err(|e| format!("serialize response: {e}"))
    } else {
        let count = payload["lifted_count"].as_u64().unwrap_or(0);
        Ok(format!(
            "已解封居民 {}（解除 {} 条封禁）",
            request.resident_id, count
        ))
    }
}

fn run_admin_freeze(command: IdentityCommand) -> Result<String, String> {
    let request = AdminRoomTargetRequest {
        room_id: command.target,
    };
    let url = format!(
        "{}/v1/admin/rooms/freeze",
        command.gateway.trim_end_matches('/')
    );
    let _payload = post_json::<_, serde_json::Value>(&url, &request, "freeze")?;
    if command.json {
        serde_json::to_string(&serde_json::json!({"ok": true, "room_id": request.room_id}))
            .map_err(|e| format!("serialize response: {e}"))
    } else {
        Ok(format!("已冻结房间 {}", request.room_id))
    }
}

fn run_admin_unfreeze(command: IdentityCommand) -> Result<String, String> {
    let request = AdminRoomTargetRequest {
        room_id: command.target,
    };
    let url = format!(
        "{}/v1/admin/rooms/unfreeze",
        command.gateway.trim_end_matches('/')
    );
    let _payload = post_json::<_, serde_json::Value>(&url, &request, "unfreeze")?;
    if command.json {
        serde_json::to_string(&serde_json::json!({"ok": true, "room_id": request.room_id}))
            .map_err(|e| format!("serialize response: {e}"))
    } else {
        Ok(format!("已解冻房间 {}", request.room_id))
    }
}

fn run_invite_create(command: InviteCreateCommand) -> Result<String, String> {
    let request = AdminCreateInviteRequest {
        actor_id: command.actor,
        max_uses: command.max_uses,
    };
    let url = format!("{}/v1/admin/invites", command.gateway.trim_end_matches('/'));
    let payload = post_json::<_, AdminCreateInviteResponse>(&url, &request, "invite create")?;
    if command.json {
        serde_json::to_string(&payload).map_err(|e| format!("serialize response: {e}"))
    } else {
        Ok(format!(
            "已创建邀请码：{}（可用 {} 次）",
            payload.code, payload.max_uses
        ))
    }
}

fn run_invite_revoke(command: InviteRevokeCommand) -> Result<String, String> {
    let request = AdminRevokeInviteRequest {
        code: command.code,
        actor_id: command.actor,
    };
    let url = format!(
        "{}/v1/admin/invites/revoke",
        command.gateway.trim_end_matches('/')
    );
    let _payload = post_json::<_, serde_json::Value>(&url, &request, "invite revoke")?;
    if command.json {
        serde_json::to_string(&serde_json::json!({"ok": true}))
            .map_err(|e| format!("serialize: {e}"))
    } else {
        Ok(format!("已撤销邀请码 {}", request.code))
    }
}

fn run_admin_residents(command: QueryCommand) -> Result<String, String> {
    let url = format!(
        "{}/v1/admin/residents",
        command.gateway.trim_end_matches('/')
    );
    let payload = run_query::<Vec<AdminResidentEntry>>(&url)?;
    if command.json {
        serde_json::to_string(&payload).map_err(|e| format!("serialize response: {e}"))
    } else {
        Ok(format_admin_residents(&payload))
    }
}

fn run_admin_rooms(command: QueryCommand) -> Result<String, String> {
    let url = format!("{}/v1/admin/rooms", command.gateway.trim_end_matches('/'));
    let payload = run_query::<Vec<AdminRoomEntry>>(&url)?;
    if command.json {
        serde_json::to_string(&payload).map_err(|e| format!("serialize response: {e}"))
    } else {
        Ok(format_admin_rooms(&payload))
    }
}

fn run_command(command: Command) -> Result<String, String> {
    match command {
        Command::Send(command) => run_send(command),
        Command::Edit(command) => run_edit(command),
        Command::Recall(command) => run_recall(command),
        Command::Export(command) => run_export(command),
        Command::Inbox(command) => run_inbox(command),
        Command::Rooms(command) => run_rooms(command),
        Command::Tail(command) => run_tail(command),
        Command::Search(command) => run_search(command),
        Command::Who(command) => run_who(command),
        Command::Read(command) => run_read(command),
        Command::Presence(command) => run_presence(command),
        Command::Ban(command) => run_admin_ban(command),
        Command::Unban(command) => run_admin_unban(command),
        Command::Freeze(command) => run_admin_freeze(command),
        Command::Unfreeze(command) => run_admin_unfreeze(command),
        Command::InviteCreate(command) => run_invite_create(command),
        Command::InviteRevoke(command) => run_invite_revoke(command),
        Command::AdminResidents(command) => run_admin_residents(command),
        Command::AdminRooms(command) => run_admin_rooms(command),
        Command::World(command) => run_world(command),
        Command::Square(command) => run_square(command),
        Command::Cities(command) => run_cities(command),
        Command::Safety(command) => run_safety(command),
        Command::Help(topic) => Ok(format_help(topic.as_deref())),
    }
}

fn main() {
    match parse_args(std::env::args()).and_then(run_command) {
        Ok(output) => println!("{output}"),
        Err(message) => {
            eprintln!("{message}");
            std::process::exit(1);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_search_command_joins_positional_args_into_query() {
        let command = parse_args(["lobster-cli", "search", "晚上", "吃饭", "--limit", "5"])
            .expect("search command should parse");
        match command {
            Command::Search(s) => {
                assert_eq!(s.query, "晚上 吃饭");
                assert_eq!(s.limit, Some(5));
                assert_eq!(s.room_id, None);
            }
            other => panic!("expected search command, got {other:?}"),
        }
    }

    #[test]
    fn parse_search_command_rejects_empty_query() {
        let err = parse_args(["lobster-cli", "search"]).expect_err("empty query should fail");
        assert!(err.contains("search keyword"));
    }

    #[test]
    fn parse_search_command_rejects_non_numeric_limit() {
        let err =
            parse_args(["lobster-cli", "search", "foo", "--limit", "abc"]).expect_err("bad limit");
        assert!(err.contains("--limit must be a non-negative number"));
    }

    #[test]
    fn parse_search_command_supports_room_filter() {
        let command = parse_args([
            "lobster-cli",
            "search",
            "hello",
            "--room",
            "room:world:lobby",
        ])
        .expect("search with room should parse");
        match command {
            Command::Search(s) => assert_eq!(s.room_id.as_deref(), Some("room:world:lobby")),
            other => panic!("expected search command, got {other:?}"),
        }
    }

    #[test]
    fn search_output_renders_hits_with_keyword_highlight() {
        let rendered = format_search_results(
            "吃饭",
            &[CliSearchMessage {
                message_id: "msg-1".into(),
                sender: "rsaga".into(),
                timestamp_ms: 1_760_000_000_000,
                timestamp_label: "06-17 12:00".into(),
                text: "晚上一起吃饭吗".into(),
                delivery_status: "delivered".into(),
                is_recalled: false,
                is_edited: false,
            }],
        );
        assert!(rendered.contains("命中 1 条"));
        assert!(rendered.contains("«吃饭»"));
        assert!(rendered.contains("rsaga"));
        assert!(rendered.contains("06-17 12:00"));
    }

    #[test]
    fn search_output_reports_zero_hits_when_empty() {
        let rendered = format_search_results("不存在", &[]);
        assert!(rendered.contains("命中 0 条"));
    }

    #[test]
    fn who_command_parses_target_and_gateway() {
        let command = parse_args([
            "lobster-cli",
            "who",
            "--for",
            "user:rsaga",
            "--gateway",
            "http://127.0.0.1:8787",
        ])
        .expect("who command should parse");

        match command {
            Command::Who(who) => {
                assert_eq!(who.target, "user:rsaga");
                assert_eq!(who.gateway, "http://127.0.0.1:8787");
            }
            other => panic!("expected who command, got {other:?}"),
        }
    }

    #[test]
    fn who_output_renders_full_resident_card() {
        let rendered = format_who(&CliResidentEntry {
            resident_id: "rsaga".into(),
            nickname: Some("阿虾".into()),
            active_cities: vec!["aurora-hub".into(), "core-harbor".into()],
            pending_cities: vec![],
            roles: vec!["Lord".into()],
            online: Some(true),
            last_seen_at_ms: Some(1_760_000_000_000),
            avatar_id: Some("avatar:rsaga".into()),
            personal_room_id: Some("dm:rsaga:private".into()),
        });

        assert!(rendered.contains("阿虾 (rsaga)"));
        assert!(rendered.contains("● 在线"));
        assert!(rendered.contains("角色: Lord"));
        assert!(rendered.contains("活跃城市: aurora-hub, core-harbor"));
        assert!(rendered.contains("个人房间: dm:rsaga:private"));
    }

    #[test]
    fn who_output_handles_offline_and_missing_fields() {
        let rendered = format_who(&CliResidentEntry {
            resident_id: "tiyan".into(),
            nickname: None,
            active_cities: vec![],
            pending_cities: vec![],
            roles: vec![],
            online: Some(false),
            last_seen_at_ms: None,
            avatar_id: None,
            personal_room_id: None,
        });

        // nickname 缺失回退到 resident_id
        assert!(rendered.contains("tiyan (tiyan)"));
        assert!(rendered.contains("○ 离线"));
        // 空字段不渲染对应行
        assert!(!rendered.contains("角色"));
        assert!(!rendered.contains("活跃城市"));
        assert!(!rendered.contains("个人房间"));
    }

    #[test]
    fn read_command_parses_target_and_conversation() {
        let command = parse_args([
            "lobster-cli",
            "read",
            "--for",
            "user:rsaga",
            "--conversation-id",
            "room:world:lobby",
            "--gateway",
            "http://127.0.0.1:8787",
        ])
        .expect("read command should parse");

        match command {
            Command::Read(read) => {
                assert_eq!(read.target, "user:rsaga");
                assert_eq!(read.conversation_id, "room:world:lobby");
                assert_eq!(read.gateway, "http://127.0.0.1:8787");
            }
            other => panic!("expected read command, got {other:?}"),
        }
    }

    #[test]
    fn read_command_requires_conversation_id() {
        let err = parse_args(["lobster-cli", "read", "--for", "user:rsaga"])
            .expect_err("missing --conversation-id should fail");
        assert!(err.contains("conversation-id"));
    }

    #[test]
    fn build_mark_read_request_strips_identity_prefix() {
        let command = ReadCommand {
            target: "user:rsaga".into(),
            conversation_id: "room:world:lobby".into(),
            gateway: "http://127.0.0.1:8787".into(),
            json: false,
        };
        let request = build_mark_read_request(&command).expect("build mark-read request");
        assert_eq!(
            request,
            CliMarkReadRequest {
                resident_id: "rsaga".into(),
                conversation_id: "room:world:lobby".into(),
            }
        );
    }

    #[test]
    fn build_mark_read_request_rejects_room_actor() {
        let command = ReadCommand {
            target: "room:world:lobby".into(),
            conversation_id: "room:world:lobby".into(),
            gateway: "http://127.0.0.1:8787".into(),
            json: false,
        };
        let err = build_mark_read_request(&command).expect_err("room actor should fail");
        assert!(err.contains("actor must be an identity"));
    }

    #[test]
    fn presence_command_parses_target() {
        let command = parse_args([
            "lobster-cli",
            "presence",
            "--for",
            "user:rsaga",
            "--gateway",
            "http://127.0.0.1:8787",
        ])
        .expect("presence command should parse");

        match command {
            Command::Presence(p) => {
                assert_eq!(p.target, "user:rsaga");
                assert_eq!(p.gateway, "http://127.0.0.1:8787");
            }
            other => panic!("expected presence command, got {other:?}"),
        }
    }

    #[test]
    fn build_presence_request_strips_identity_prefix() {
        let command = QueryCommand {
            target: "user:rsaga".into(),
            gateway: "http://127.0.0.1:8787".into(),
            json: false,
        };
        let request = build_presence_request(&command).expect("build presence request");
        assert_eq!(
            request,
            CliPresenceRequest {
                resident_id: "rsaga".into(),
            }
        );
    }

    #[test]
    fn build_presence_request_rejects_room_actor() {
        let command = QueryCommand {
            target: "room:world:lobby".into(),
            gateway: "http://127.0.0.1:8787".into(),
            json: false,
        };
        let err = build_presence_request(&command).expect_err("room actor should fail");
        assert!(err.contains("actor must be an identity"));
    }

    #[test]
    fn no_args_returns_help_overview() {
        let command = parse_args(["lobster-cli"]).expect("no args should show help");
        assert!(matches!(command, Command::Help(None)));
    }

    #[test]
    fn help_command_with_topic_parses() {
        let command = parse_args(["lobster-cli", "help", "send"]).expect("help <cmd> should parse");
        assert!(matches!(command, Command::Help(Some(ref t)) if t == "send"));
    }

    #[test]
    fn format_help_overview_lists_all_commands() {
        let overview = format_help(None);
        assert!(overview.contains("send"));
        assert!(overview.contains("search"));
        assert!(overview.contains("who"));
        assert!(overview.contains("read"));
        assert!(overview.contains("presence"));
        assert!(overview.contains("管理"));
    }

    #[test]
    fn format_help_for_known_command_guides_user() {
        let detail = format_help(Some("send"));
        assert!(detail.contains("send"));
    }

    #[test]
    fn format_help_for_unknown_command_suggests_overview() {
        let detail = format_help(Some("nonexistent"));
        assert!(detail.contains("未知命令"));
    }

    #[test]
    fn parse_send_command_rejects_missing_to() {
        let err = parse_args(["lobster-cli", "send", "--from", "agent:openclaw"])
            .expect_err("missing --to should fail");
        assert!(err.contains("--to"));
    }

    #[test]
    fn parse_send_command_rejects_conversation_id_as_target_address() {
        let err = parse_args([
            "lobster-cli",
            "send",
            "--from",
            "agent:codex",
            "--to",
            "dm:openclaw:rsaga",
            "--text",
            "hello",
        ])
        .expect_err("conversation id target should fail");

        assert!(err.contains("send --to"));
        assert!(err.contains("user:"));
        assert!(err.contains("agent:"));
        assert!(err.contains("room:"));
    }

    #[test]
    fn parse_send_command_accepts_cli_identity_addresses() {
        let user = parse_args([
            "lobster-cli",
            "send",
            "--from",
            "agent:codex",
            "--to",
            "user:rsaga",
            "--text",
            "hello",
        ])
        .expect("user target should parse");
        let agent = parse_args([
            "lobster-cli",
            "send",
            "--from",
            "agent:codex",
            "--to",
            "agent:openclaw",
            "--text",
            "hello",
        ])
        .expect("agent target should parse");
        let room = parse_args([
            "lobster-cli",
            "send",
            "--from",
            "agent:codex",
            "--to",
            "room:world:lobby",
            "--text",
            "hello",
        ])
        .expect("room target should parse");

        assert!(matches!(user, Command::Send(_)));
        assert!(matches!(agent, Command::Send(_)));
        assert!(matches!(room, Command::Send(_)));
    }

    #[test]
    fn send_command_builds_expected_gateway_request() {
        let command = parse_args([
            "lobster-cli",
            "send",
            "--from",
            "agent:openclaw",
            "--to",
            "user:zhangsan",
            "--text",
            "晚上一起吃饭吗",
            "--gateway",
            "http://127.0.0.1:8787",
        ])
        .expect("send command should parse");

        let send = match command {
            Command::Send(send) => send,
            other => panic!("expected send command, got {other:?}"),
        };
        assert_eq!(send.gateway, "http://127.0.0.1:8787");

        let request = build_send_request(&send);
        assert_eq!(
            request,
            CliSendRequest {
                from: "agent:openclaw".into(),
                to: "user:zhangsan".into(),
                text: "晚上一起吃饭吗".into(),
                client_tag: Some("lobster-cli".into()),
            }
        );
    }

    #[test]
    fn edit_command_builds_shell_edit_request() {
        let command = parse_args([
            "lobster-cli",
            "edit",
            "--actor",
            "user:rsaga",
            "--conversation-id",
            "room:world:lobby",
            "--message-id",
            "msg-1",
            "--text",
            "改过的内容",
            "--gateway",
            "http://127.0.0.1:8787",
        ])
        .expect("edit command should parse");

        let edit = match command {
            Command::Edit(edit) => edit,
            other => panic!("expected edit command, got {other:?}"),
        };
        assert_eq!(edit.gateway, "http://127.0.0.1:8787");
        assert_eq!(
            build_edit_request(&edit).expect("edit request"),
            ShellMessageEditRequest {
                room_id: "room:world:lobby".into(),
                message_id: "msg-1".into(),
                actor: "rsaga".into(),
                text: "改过的内容".into(),
            }
        );
    }

    #[test]
    fn recall_command_builds_shell_recall_request() {
        let command = parse_args([
            "lobster-cli",
            "recall",
            "--actor",
            "agent:openclaw",
            "--conversation-id",
            "dm:openclaw:rsaga",
            "--message-id",
            "msg-1",
        ])
        .expect("recall command should parse");

        let recall = match command {
            Command::Recall(recall) => recall,
            other => panic!("expected recall command, got {other:?}"),
        };
        assert_eq!(
            build_recall_request(&recall).expect("recall request"),
            ShellMessageRecallRequest {
                room_id: "dm:openclaw:rsaga".into(),
                message_id: "msg-1".into(),
                actor: "openclaw".into(),
            }
        );
    }

    #[test]
    fn export_command_parses_gateway_export_request() {
        let command = parse_args([
            "lobster-cli",
            "export",
            "--for",
            "user:rsaga",
            "--conversation-id",
            "room:world:lobby",
            "--format",
            "jsonl",
            "--include-public",
            "--gateway",
            "http://127.0.0.1:8787",
        ])
        .expect("export command should parse");

        let rendered = format!("{command:?}");
        assert!(rendered.contains("Export"));
        assert!(rendered.contains("user:rsaga"));
        assert!(rendered.contains("room:world:lobby"));
        assert!(rendered.contains("jsonl"));
        assert!(rendered.contains("include_public: true"));
    }

    #[test]
    fn export_command_rejects_room_actor_target() {
        let command = parse_args(["lobster-cli", "export", "--for", "room:world:lobby"])
            .expect("parse should defer identity validation to runner");

        let export = match command {
            Command::Export(export) => export,
            other => panic!("expected export command, got {other:?}"),
        };

        let err = run_export(export).expect_err("room actor should fail");
        assert!(err.contains("actor must be an identity"));
    }

    #[test]
    fn export_command_prints_export_content_by_default() {
        let rendered = format_export(&CliExportResponse {
            resident_id: "rsaga".into(),
            format: "md".into(),
            exported_at_ms: 1760000000300,
            conversation_count: 1,
            conversations: vec![CliExportConversation {
                conversation_id: "room:world:lobby".into(),
                title: "世界大厅".into(),
                kind: "public".into(),
            }],
            content: "# 世界大厅\n\nrsaga: hello".into(),
        });

        assert_eq!(rendered, "# 世界大厅\n\nrsaga: hello");
    }

    #[test]
    fn message_action_rejects_room_actor() {
        let command = parse_args([
            "lobster-cli",
            "recall",
            "--actor",
            "room:world:lobby",
            "--conversation-id",
            "room:world:lobby",
            "--message-id",
            "msg-1",
        ])
        .expect("parse should defer actor validation to request builder");

        let recall = match command {
            Command::Recall(recall) => recall,
            other => panic!("expected recall command, got {other:?}"),
        };
        let err = build_recall_request(&recall).expect_err("room actor should fail");
        assert!(err.contains("actor must be an identity"));
    }

    #[test]
    fn send_command_prints_human_readable_success_by_default() {
        let rendered = format_send_success(&CliSendResponse {
            ok: true,
            conversation_id: "dm:openclaw:zhangsan".into(),
            message_id: "msg-1".into(),
            delivered_at_ms: 1760000000000,
        });

        assert!(rendered.contains("dm:openclaw:zhangsan"));
        assert!(rendered.contains("msg-1"));
        assert!(rendered.contains("已投递"));
    }

    #[test]
    fn message_actions_print_human_readable_success() {
        let edited = format_edit_success(&ShellMessageEditResponse {
            ok: true,
            conversation_id: "room:world:lobby".into(),
            message_id: "msg-1".into(),
            edit_status: "edited".into(),
            edited_at_ms: 1760000000100,
            edited_by: "rsaga".into(),
            text: "改过的内容".into(),
        });
        let recalled = format_recall_success(&ShellMessageRecallResponse {
            ok: true,
            conversation_id: "room:world:lobby".into(),
            message_id: "msg-2".into(),
            recall_status: "recalled".into(),
            recalled_at_ms: 1760000000200,
            recalled_by: "rsaga".into(),
        });

        assert!(edited.contains("已编辑"));
        assert!(edited.contains("msg-1"));
        assert!(recalled.contains("已撤回"));
        assert!(recalled.contains("msg-2"));
    }

    #[test]
    fn inbox_command_renders_recent_conversation_summary() {
        let command = parse_args([
            "lobster-cli",
            "inbox",
            "--for",
            "agent:codex",
            "--gateway",
            "http://127.0.0.1:8787",
        ])
        .expect("inbox command should parse");

        match command {
            Command::Inbox(inbox) => {
                assert_eq!(inbox.target, "agent:codex");
                assert_eq!(inbox.gateway, "http://127.0.0.1:8787");
            }
            other => panic!("expected inbox command, got {other:?}"),
        }
    }

    #[test]
    fn rooms_command_renders_visible_targets() {
        let command = parse_args(["lobster-cli", "rooms", "--for", "user:rsaga"])
            .expect("rooms command should parse");

        match command {
            Command::Rooms(rooms) => assert_eq!(rooms.target, "user:rsaga"),
            other => panic!("expected rooms command, got {other:?}"),
        }
    }

    #[test]
    fn tail_command_supports_follow_flag() {
        let command = parse_args(["lobster-cli", "tail", "--for", "user:rsaga", "--follow"])
            .expect("tail command should parse");

        match command {
            Command::Tail(tail) => {
                assert_eq!(tail.target, "user:rsaga");
                assert!(tail.follow);
            }
            other => panic!("expected tail command, got {other:?}"),
        }
    }

    #[test]
    fn extract_gateway_error_message_prefers_message_field() {
        let body = r#"{"message":"room hidden from this identity","error":"legacy fallback"}"#;

        assert_eq!(
            extract_gateway_error_message(body).as_deref(),
            Some("room hidden from this identity")
        );
    }

    #[test]
    fn extract_gateway_error_message_falls_back_to_legacy_error_field() {
        let body = r#"{"error":"missing for"}"#;

        assert_eq!(
            extract_gateway_error_message(body).as_deref(),
            Some("missing for")
        );
    }

    #[test]
    fn format_gateway_status_error_uses_gateway_message_instead_of_plain_400() {
        let message = format_gateway_status_error(
            "query request",
            400,
            Some(r#"{"message":"conversation is not visible to user:lisi"}"#),
        );

        assert_eq!(
            message,
            "query request failed: conversation is not visible to user:lisi"
        );
    }

    #[test]
    fn tail_output_marks_recalled_and_edited_messages() {
        let rendered = format_tail(&CliTailResponse {
            identity: "agent:openclaw".into(),
            conversation_id: "dm:openclaw:rsaga".into(),
            messages: vec![
                CliTailMessage {
                    message_id: "msg-recalled".into(),
                    sender: "rsaga".into(),
                    text: "消息已撤回".into(),
                    is_recalled: true,
                    recalled_by: Some("rsaga".into()),
                    recalled_at_ms: Some(1760000000100),
                    is_edited: false,
                    edited_by: None,
                    edited_at_ms: None,
                    timestamp_ms: 1760000000000,
                },
                CliTailMessage {
                    message_id: "msg-edited".into(),
                    sender: "openclaw".into(),
                    text: "改过的内容".into(),
                    is_recalled: false,
                    recalled_by: None,
                    recalled_at_ms: None,
                    is_edited: true,
                    edited_by: Some("openclaw".into()),
                    edited_at_ms: Some(1760000000200),
                    timestamp_ms: 1760000000001,
                },
            ],
        });

        assert!(rendered.contains("[已撤回] rsaga: 消息已撤回"));
        assert!(rendered.contains("[已编辑] openclaw: 改过的内容"));
    }

    #[test]
    fn ban_command_parses_target_and_reason() {
        let command = parse_args([
            "lobster-cli",
            "ban",
            "--target",
            "user:troublemaker",
            "--reason",
            "spam",
        ])
        .expect("ban command should parse");

        match command {
            Command::Ban(ban) => {
                assert_eq!(ban.target, "user:troublemaker");
                assert_eq!(ban.reason, "spam");
            }
            other => panic!("expected ban command, got {other:?}"),
        }
    }

    #[test]
    fn ban_command_defaults_reason_when_missing() {
        let command = parse_args(["lobster-cli", "ban", "--target", "user:spammer"])
            .expect("ban without --reason should parse");

        match command {
            Command::Ban(ban) => {
                assert_eq!(ban.target, "user:spammer");
                assert!(ban.reason.contains("CLI"));
            }
            other => panic!("expected ban command, got {other:?}"),
        }
    }

    #[test]
    fn unban_command_parses_target() {
        let command = parse_args(["lobster-cli", "unban", "--target", "user:reformed"])
            .expect("unban command should parse");

        match command {
            Command::Unban(unban) => assert_eq!(unban.target, "user:reformed"),
            other => panic!("expected unban command, got {other:?}"),
        }
    }

    #[test]
    fn freeze_command_parses_target() {
        let command = parse_args(["lobster-cli", "freeze", "--target", "room:world:toxic"])
            .expect("freeze command should parse");

        match command {
            Command::Freeze(freeze) => assert_eq!(freeze.target, "room:world:toxic"),
            other => panic!("expected freeze command, got {other:?}"),
        }
    }

    #[test]
    fn unfreeze_command_parses_target() {
        let command = parse_args(["lobster-cli", "unfreeze", "--target", "room:world:thawed"])
            .expect("unfreeze command should parse");

        match command {
            Command::Unfreeze(unfreeze) => assert_eq!(unfreeze.target, "room:world:thawed"),
            other => panic!("expected unfreeze command, got {other:?}"),
        }
    }

    #[test]
    fn invite_create_command_parses_actor_and_max_uses() {
        let command = parse_args([
            "lobster-cli",
            "invite-create",
            "--actor",
            "user:admin",
            "--max-uses",
            "5",
        ])
        .expect("invite-create should parse");

        match command {
            Command::InviteCreate(invite) => {
                assert_eq!(invite.actor, "user:admin");
                assert_eq!(invite.max_uses, 5);
            }
            other => panic!("expected invite-create command, got {other:?}"),
        }
    }

    #[test]
    fn invite_create_defaults_max_uses_to_10() {
        let command = parse_args(["lobster-cli", "invite-create", "--actor", "user:admin"])
            .expect("invite-create without max-uses should parse");

        match command {
            Command::InviteCreate(invite) => assert_eq!(invite.max_uses, 10),
            other => panic!("expected invite-create command, got {other:?}"),
        }
    }

    #[test]
    fn invite_revoke_command_parses_actor_and_code() {
        let command = parse_args([
            "lobster-cli",
            "invite-revoke",
            "--actor",
            "user:admin",
            "--code",
            "INVITE-ABC",
        ])
        .expect("invite-revoke should parse");

        match command {
            Command::InviteRevoke(revoke) => {
                assert_eq!(revoke.actor, "user:admin");
                assert_eq!(revoke.code, "INVITE-ABC");
            }
            other => panic!("expected invite-revoke command, got {other:?}"),
        }
    }

    #[test]
    fn admin_residents_command_uses_query_parser() {
        let command = parse_args([
            "lobster-cli",
            "residents",
            "--for",
            "user:admin",
            "--gateway",
            "http://127.0.0.1:8787",
        ])
        .expect("residents command should parse");

        match command {
            Command::AdminResidents(q) => {
                assert_eq!(q.target, "user:admin");
                assert_eq!(q.gateway, "http://127.0.0.1:8787");
            }
            other => panic!("expected residents command, got {other:?}"),
        }
    }

    #[test]
    fn admin_rooms_command_uses_query_parser() {
        let command = parse_args(["lobster-cli", "rooms-admin", "--for", "user:admin"])
            .expect("rooms-admin command should parse");

        match command {
            Command::AdminRooms(q) => assert_eq!(q.target, "user:admin"),
            other => panic!("expected rooms-admin command, got {other:?}"),
        }
    }

    #[test]
    fn format_admin_residents_shows_tags() {
        let payload = vec![
            AdminResidentEntry {
                resident_id: "alice".into(),
                nickname: Some("爱丽丝".into()),
                online: true,
                is_banned: false,
                roles: vec!["moderator".into()],
            },
            AdminResidentEntry {
                resident_id: "bob".into(),
                nickname: None,
                online: false,
                is_banned: true,
                roles: vec![],
            },
        ];
        let rendered = format_admin_residents(&payload);
        assert!(rendered.contains("共 2 人"));
        assert!(rendered.contains("爱丽丝 (alice)"));
        assert!(rendered.contains("bob"));
        assert!(rendered.contains("在线"));
        assert!(rendered.contains("已封禁"));
        assert!(rendered.contains("角色:moderator"));
    }

    #[test]
    fn format_admin_rooms_shows_frozen_tag() {
        let payload = vec![
            AdminRoomEntry {
                id: "room:world:lobby".into(),
                title: "大厅".into(),
                kind: "world_public".into(),
                participant_count: 42,
                message_count: 1000,
                is_frozen: false,
            },
            AdminRoomEntry {
                id: "room:world:toxic".into(),
                title: "违规房".into(),
                kind: "world_public".into(),
                participant_count: 3,
                message_count: 50,
                is_frozen: true,
            },
        ];
        let rendered = format_admin_rooms(&payload);
        assert!(rendered.contains("共 2 间"));
        assert!(rendered.contains("大厅"));
        assert!(rendered.contains("违规房"));
        assert!(rendered.contains("已冻结"));
    }

    #[test]
    fn format_inbox_shows_identity_header() {
        let payload = CliInboxResponse {
            identity: "test-user".into(),
            conversations: vec![],
        };
        let rendered = format_inbox(&payload);
        assert!(rendered.contains("收件箱"));
        assert!(rendered.contains("test-user"));
    }

    #[test]
    fn format_rooms_shows_identity_header() {
        let payload = CliRoomsResponse {
            identity: "test-user".into(),
            entries: vec![],
        };
        let rendered = format_rooms(&payload);
        assert!(rendered.contains("会话列表"));
        assert!(rendered.contains("test-user"));
    }

    #[test]
    fn format_error_includes_action_name() {
        let rendered = format_gateway_status_error("send", 503, None);
        assert!(rendered.contains("send"));
        let rendered2 = format_gateway_status_error("edit", 400, Some("bad request"));
        assert!(rendered2.contains("edit"));
    }

    #[test]
    fn parse_world_query_command_defaults() {
        let cmd = parse_world_query_command(Vec::new()).unwrap();
        assert_eq!(cmd.gateway, "http://127.0.0.1:8787");
        assert!(!cmd.json);
    }

    #[test]
    fn parse_world_query_command_accepts_gateway_and_json() {
        let cmd = parse_world_query_command(vec![
            "--gateway".to_string(),
            "http://example:9999".to_string(),
            "--json".to_string(),
        ])
        .unwrap();
        assert_eq!(cmd.gateway, "http://example:9999");
        assert!(cmd.json);
    }

    #[test]
    fn parse_world_query_command_rejects_for_flag() {
        let err = parse_world_query_command(vec!["--for".to_string(), "user:x".to_string()])
            .expect_err("--for should be rejected");
        assert!(err.contains("unsupported flag"));
    }

    #[test]
    fn parse_args_routes_world_command() {
        let command = parse_args(["lobster-cli", "world"]).expect("world should parse");
        assert!(matches!(command, Command::World(_)));
    }

    #[test]
    fn parse_args_routes_square_command_with_json() {
        let command = parse_args(["lobster-cli", "square", "--json"]).expect("square should parse");
        match command {
            Command::Square(c) => assert!(c.json),
            other => panic!("expected Square, got {other:?}"),
        }
    }

    #[test]
    fn format_world_summarizes_governance_snapshot() {
        let world = serde_json::json!({
            "world": { "title": "极光之城世界", "world_id": "world:aurora" },
            "cities": [{}, {}, {}],
            "world_stewards": ["user:steward1", "user:steward2"],
            "city_trust": [{}],
            "world_square_notices": [{}, {}],
            "safety_advisories": [{}],
            "safety_reports": [{}, {}, {}],
            "resident_sanctions": []
        });
        let rendered = format_world(&world);
        assert!(rendered.contains("极光之城世界"));
        assert!(rendered.contains("world:aurora"));
        assert!(rendered.contains("城市 3 座"));
        assert!(rendered.contains("广场公告 2 条"));
        assert!(rendered.contains("安全报告 3 条"));
        assert!(rendered.contains("世界管理员：user:steward1、user:steward2"));
    }

    #[test]
    fn format_world_omits_admin_line_without_stewards() {
        let world = serde_json::json!({
            "world": { "title": "空世界", "world_id": "world:empty" }
        });
        let rendered = format_world(&world);
        assert!(rendered.contains("空世界"));
        assert!(rendered.contains("城市 0 座"));
        assert!(!rendered.contains("世界管理员"));
    }

    #[test]
    fn format_square_renders_notices() {
        let notices = vec![
            CliSquareNotice {
                title: "广场维护通知".into(),
                body: "今晚 22:00 维护".into(),
                author_id: "user:admin".into(),
                posted_at_ms: 1700000000,
                severity: "info".into(),
                tags: vec!["维护".into()],
            },
            CliSquareNotice {
                title: "匿名公告".into(),
                body: String::new(),
                author_id: String::new(),
                posted_at_ms: 0,
                severity: String::new(),
                tags: Vec::new(),
            },
        ];
        let rendered = format_square(&notices);
        assert!(rendered.contains("共 2 条"));
        assert!(rendered.contains("广场维护通知 [info] #维护"));
        assert!(rendered.contains("发布者 user:admin · 时间戳 1700000000"));
        assert!(rendered.contains("今晚 22:00 维护"));
        assert!(rendered.contains("匿名公告"));
        assert!(rendered.contains("发布者 匿名"));
    }

    #[test]
    fn format_square_empty_shows_count_zero() {
        let rendered = format_square(&[]);
        assert!(rendered.contains("共 0 条"));
    }

    #[test]
    fn format_cities_renders_profiles() {
        let cities = serde_json::json!([
            {
                "profile": {
                    "city_id": "city:aurora-hub",
                    "title": "Aurora Hub",
                    "description": "默认治理城市"
                }
            },
            {
                "profile": {
                    "city_id": "city:sunset",
                    "title": "Sunset Bay",
                    "description": ""
                }
            }
        ]);
        let rendered = format_cities(&cities);
        assert!(rendered.contains("共 2 座"));
        assert!(rendered.contains("Aurora Hub（city:aurora-hub） — 默认治理城市"));
        assert!(rendered.contains("Sunset Bay（city:sunset）"));
    }

    #[test]
    fn format_cities_empty_shows_placeholder() {
        let rendered = format_cities(&serde_json::json!([]));
        assert!(rendered.contains("世界暂无城市"));
    }

    #[test]
    fn parse_args_routes_cities_command() {
        let command = parse_args(["lobster-cli", "cities"]).expect("cities should parse");
        assert!(matches!(command, Command::Cities(_)));
    }

    #[test]
    fn format_safety_summarizes_snapshot() {
        let safety = serde_json::json!({
            "stewards": ["user:safety-admin"],
            "city_trust": [{}, {}],
            "advisories": [],
            "reports": [{}],
            "resident_sanctions": [],
            "registration_blacklist": [],
            "mirrors": [{}, {}, {}]
        });
        let rendered = format_safety(&safety);
        assert!(rendered.contains("信任 2 条"));
        assert!(rendered.contains("报告 1 条"));
        assert!(rendered.contains("镜像 3 个"));
        assert!(rendered.contains("安全管理员：user:safety-admin"));
    }

    #[test]
    fn format_safety_omits_admin_line_when_empty() {
        let safety = serde_json::json!({
            "stewards": [],
            "city_trust": [],
            "advisories": [],
            "reports": [],
            "resident_sanctions": [],
            "registration_blacklist": [],
            "mirrors": []
        });
        let rendered = format_safety(&safety);
        assert!(rendered.contains("信任 0 条"));
        assert!(!rendered.contains("安全管理员"));
    }

    #[test]
    fn parse_args_routes_safety_command() {
        let command = parse_args(["lobster-cli", "safety"]).expect("safety should parse");
        assert!(matches!(command, Command::Safety(_)));
    }
}
