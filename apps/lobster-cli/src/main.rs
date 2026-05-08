use serde::{Deserialize, Serialize};
use std::{collections::HashSet, thread, time::Duration};

#[derive(Debug, Clone, PartialEq, Eq)]
enum Command {
    Send(SendCommand),
    Edit(EditCommand),
    Recall(RecallCommand),
    Inbox(QueryCommand),
    Rooms(QueryCommand),
    Tail(TailCommand),
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
struct QueryCommand {
    target: String,
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
        return Err("missing command".into());
    };

    match command.as_str() {
        "send" => parse_send_command(iter.collect::<Vec<_>>()).map(Command::Send),
        "edit" => parse_edit_command(iter.collect::<Vec<_>>()).map(Command::Edit),
        "recall" => parse_recall_command(iter.collect::<Vec<_>>()).map(Command::Recall),
        "inbox" => parse_query_command(iter.collect::<Vec<_>>()).map(Command::Inbox),
        "rooms" => parse_query_command(iter.collect::<Vec<_>>()).map(Command::Rooms),
        "tail" => parse_tail_command(iter.collect::<Vec<_>>()).map(Command::Tail),
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

fn run_command(command: Command) -> Result<String, String> {
    match command {
        Command::Send(command) => run_send(command),
        Command::Edit(command) => run_edit(command),
        Command::Recall(command) => run_recall(command),
        Command::Inbox(command) => run_inbox(command),
        Command::Rooms(command) => run_rooms(command),
        Command::Tail(command) => run_tail(command),
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
}
