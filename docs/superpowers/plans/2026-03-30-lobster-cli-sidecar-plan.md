# lobster-cli Sidecar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 `lobster-chat` 增加一条可供 `OpenClaw / Codex / Claude Code` 复用的命令行聊天通道，让本地智能体可以通过现有 gateway 发送消息、读取收件箱、查看房间列表和持续查看消息流。

**Architecture:** 先在现有 `lobster-waku-gateway` 上补一组面向命令行的 `/v1/cli/*` HTTP 端点，再新增独立二进制 `apps/lobster-cli` 作为薄入口。CLI 只做地址解析、请求组装和输出格式化，不直接读写本地 store，也不发明第二套 transport 协议。

**Tech Stack:** Rust workspace、`tiny_http`、`serde/serde_json`、`ureq`、现有 `chat-core` / `transport-waku` / `lobster-waku-gateway`

---

## File Map

### New files

- `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-cli/Cargo.toml`
- `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-cli/src/main.rs`

### Modified files

- `/Users/rsaga/Documents/Playground/lobster-chat/Cargo.toml`
- `/Users/rsaga/Documents/Playground/lobster-chat/Cargo.lock`
- `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/main.rs`
- `/Users/rsaga/Documents/Playground/lobster-chat/README.md`

### Primary responsibilities

- `apps/lobster-waku-gateway/src/main.rs`
  - 新增 `/v1/cli/send`
  - 新增 `/v1/cli/inbox`
  - 新增 `/v1/cli/tail`
  - 新增 `/v1/cli/rooms`
  - 复用现有 direct/open、conversation 列表、timeline 恢复逻辑
- `apps/lobster-cli/src/main.rs`
  - 解析 `send / inbox / tail / rooms`
  - 校验 `user:` / `agent:` / `room:` 地址
  - 调用 gateway
  - 默认做人类可读输出，`--json` 输出结构化结果
- `README.md`
  - 补充 `lobster-cli` 启动和示例命令

## Task 1: 在 gateway 新增 CLI 地址解析和归一化

**Files:**
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/main.rs`
- Test: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/main.rs`

- [ ] **Step 1: 写失败测试，锁定地址解析和 direct 会话归一化**

先补测试，覆盖：

```rust
#[test]
fn cli_address_parser_accepts_user_agent_and_room() {}

#[test]
fn cli_direct_mapping_normalizes_dm_pair_order() {}

#[test]
fn cli_address_parser_rejects_invalid_prefix() {}
```

必须断言：

- `user:rsaga` 合法
- `agent:codex` 合法
- `room:city:core-harbor:lobby` 合法
- `foo:bar` 非法
- `agent:openclaw -> user:rsaga`
  与
  `user:rsaga -> agent:openclaw`
  指向同一个 direct conversation id

- [ ] **Step 2: 运行目标测试，确认失败**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-waku-gateway --quiet cli_
```

Expected:

- 测试失败，因为 CLI 地址模型还不存在

- [ ] **Step 3: 写最小实现**

在 gateway runtime 里新增：

- `CliAddress`
- `CliIdentityKind`
- `parse_cli_address(...)`
- `resolve_cli_direct_conversation_id(...)`

只做解析和归一化，不做 HTTP 端点。

- [ ] **Step 4: 跑测试确认通过**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-waku-gateway --quiet cli_
cargo check -p lobster-waku-gateway --quiet
```

Expected:

- 新增地址和归一化测试通过

- [ ] **Step 5: Commit**

```bash
git add /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/main.rs
git commit -m "feat: add cli address parsing for gateway"
```

## Task 2: 增加 `/v1/cli/send`

**Files:**
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/main.rs`

- [ ] **Step 1: 写失败测试，锁定 direct 和 room 两种发送**

至少补这两类测试：

```rust
#[test]
fn cli_send_to_user_opens_direct_conversation_and_publishes() {}

#[test]
fn cli_send_to_room_appends_message_into_existing_room() {}
```

断言点：

- direct 发送会复用已有 direct/open 逻辑
- room 发送会写入对应房间 timeline
- 返回包含 `conversation_id` / `message_id`

- [ ] **Step 2: 运行目标测试，确认失败**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-waku-gateway --quiet cli_send
```

Expected:

- 失败，因为 `/v1/cli/send` 还不存在

- [ ] **Step 3: 写最小实现**

在 `main.rs` 里新增：

- `CliSendRequest`
- `CliSendResponse`
- runtime 方法：
  - `send_cli_message(...)`
- 路由：
  - `POST /v1/cli/send`

实现要求：

- direct 目标先归一化 conversation id
- room 目标直接写 room conversation
- 用现有 `publish_message(...)`

- [ ] **Step 4: 跑测试确认通过**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-waku-gateway --quiet cli_send
cargo check -p lobster-waku-gateway --quiet
```

Expected:

- direct / room 发送测试通过

- [ ] **Step 5: Commit**

```bash
git add /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/main.rs
git commit -m "feat: add cli send endpoint to gateway"
```

## Task 3: 增加 `/v1/cli/inbox` 和 `/v1/cli/rooms`

**Files:**
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/main.rs`

- [ ] **Step 1: 写失败测试**

补至少 3 条：

```rust
#[test]
fn cli_inbox_returns_recent_conversation_summaries_for_identity() {}

#[test]
fn cli_rooms_lists_visible_room_and_direct_threads() {}

#[test]
fn cli_inbox_uses_last_message_preview_instead_of_full_body() {}
```

- [ ] **Step 2: 跑测试确认失败**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-waku-gateway --quiet cli_inbox
cargo test -p lobster-waku-gateway --quiet cli_rooms
```

Expected:

- 失败，因为端点还不存在

- [ ] **Step 3: 实现最小端点**

新增：

- `CliInboxConversation`
- `CliInboxResponse`
- `CliRoomEntry`
- `CliRoomsResponse`
- 路由：
  - `GET /v1/cli/inbox`
  - `GET /v1/cli/rooms`

实现要求：

- 只返回摘要，不返回整段正文
- direct 和 room 统一出现在列表里

- [ ] **Step 4: 跑测试**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-waku-gateway --quiet cli_inbox
cargo test -p lobster-waku-gateway --quiet cli_rooms
cargo check -p lobster-waku-gateway --quiet
```

Expected:

- inbox / rooms 相关测试通过

- [ ] **Step 5: Commit**

```bash
git add /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/main.rs
git commit -m "feat: add cli inbox and room listing endpoints"
```

## Task 4: 增加 `/v1/cli/tail`

**Files:**
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/main.rs`

- [ ] **Step 1: 写失败测试**

补这两条：

```rust
#[test]
fn cli_tail_returns_recent_messages_for_explicit_conversation() {}

#[test]
fn cli_tail_defaults_to_identity_inbox_when_conversation_missing() {}
```

- [ ] **Step 2: 跑测试确认失败**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-waku-gateway --quiet cli_tail
```

Expected:

- 失败，因为 `/v1/cli/tail` 还不存在

- [ ] **Step 3: 写最小实现**

新增：

- `CliTailMessage`
- `CliTailResponse`
- 路由：
  - `GET /v1/cli/tail`

第一版规则：

- 优先支持显式 `conversation_id`
- 如果没给，就回当前 identity 最近会话的尾部消息
- 不做 websocket，不做 server push

- [ ] **Step 4: 跑测试**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-waku-gateway --quiet cli_tail
cargo check -p lobster-waku-gateway --quiet
```

Expected:

- tail 测试通过

- [ ] **Step 5: Commit**

```bash
git add /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/main.rs
git commit -m "feat: add cli tail endpoint"
```

## Task 5: 把 `lobster-cli` 加入 workspace

**Files:**
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/Cargo.toml`
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/Cargo.lock`
- Create: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-cli/Cargo.toml`
- Create: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-cli/src/main.rs`

- [ ] **Step 1: 写一个最小失败测试，确认 workspace 里还没有 `lobster-cli` 行为实现**

在 `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-cli/src/main.rs` 里先放最小 `#[cfg(test)]` 测试骨架，包含：

```rust
#[test]
fn parse_send_command_rejects_missing_to() {
    let err = parse_args(["lobster-cli", "send", "--from", "agent:openclaw"]).unwrap_err();
    assert!(err.contains("--to"));
}
```

- [ ] **Step 2: 运行测试，确认当前失败**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-cli --quiet
```

Expected:

- 失败，原因是 workspace 还没有 `lobster-cli`

- [ ] **Step 3: 把 `lobster-cli` 加入 workspace，并补最小可编译入口**

最小实现要求：

- 在 workspace `members` 里加 `apps/lobster-cli`
- `apps/lobster-cli/Cargo.toml` 依赖 `serde`, `serde_json`, `ureq`
- `main.rs` 先只提供：
  - `parse_args(...)`
  - `main()`
  - 最小命令枚举
- `Cargo.lock` 随 workspace 更新一起提交

- [ ] **Step 4: 运行测试，确认最小 CLI 可以编译**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-cli --quiet
cargo check -p lobster-cli --quiet
```

Expected:

- `lobster-cli` 最小测试通过
- `cargo check` 通过

- [ ] **Step 5: Commit**

```bash
git add /Users/rsaga/Documents/Playground/lobster-chat/Cargo.toml \
        /Users/rsaga/Documents/Playground/lobster-chat/Cargo.lock \
        /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-cli/Cargo.toml \
        /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-cli/src/main.rs
git commit -m "feat: scaffold lobster-cli binary"
```

## Task 6: 实现 `lobster-cli send`

**Files:**
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-cli/src/main.rs`

- [ ] **Step 1: 写失败测试**

补至少两条：

```rust
#[test]
fn send_command_builds_expected_gateway_request() {}

#[test]
fn send_command_prints_human_readable_success_by_default() {}
```

- [ ] **Step 2: 跑测试确认失败**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-cli --quiet send_command
```

Expected:

- 失败，因为还没有 send 实现

- [ ] **Step 3: 写最小实现**

实现：

- `send` 子命令
- `--from`
- `--to`
- `--text`
- 可选 `--gateway`
- 可选 `--json`

用 `ureq` 调用：

- `POST /v1/cli/send`

- [ ] **Step 4: 跑测试**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-cli --quiet send_command
cargo check -p lobster-cli --quiet
```

Expected:

- send 解析与输出测试通过

- [ ] **Step 5: Commit**

```bash
git add /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-cli/src/main.rs
git commit -m "feat: add lobster-cli send command"
```

## Task 7: 实现 `lobster-cli inbox / rooms / tail`

**Files:**
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-cli/src/main.rs`

- [ ] **Step 1: 写失败测试**

至少补：

```rust
#[test]
fn inbox_command_renders_recent_conversation_summary() {}

#[test]
fn rooms_command_renders_visible_targets() {}

#[test]
fn tail_command_supports_follow_flag() {}
```

- [ ] **Step 2: 跑测试确认失败**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-cli --quiet inbox_command
cargo test -p lobster-cli --quiet rooms_command
cargo test -p lobster-cli --quiet tail_command
```

Expected:

- 失败，因为三个命令还未实现

- [ ] **Step 3: 写最小实现**

实现：

- `inbox`
- `rooms`
- `tail`
- `tail --follow`

第一版 `--follow` 做轮询：

```rust
loop {
    // GET /v1/cli/tail
    // print new rows
    std::thread::sleep(std::time::Duration::from_millis(1500));
}
```

- [ ] **Step 4: 跑测试**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-cli --quiet
cargo check -p lobster-cli --quiet
```

Expected:

- CLI 全部测试通过

- [ ] **Step 5: Commit**

```bash
git add /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-cli/src/main.rs
git commit -m "feat: add lobster-cli inbox rooms and tail commands"
```

## Task 8: 端到端 smoke 和文档

**Files:**
- Modify: `/Users/rsaga/Documents/Playground/lobster-chat/README.md`

- [ ] **Step 1: 写一个最小 smoke 验证脚本或 README 验证段**

最小验收命令：

```bash
cargo run -p lobster-waku-gateway -- --host 127.0.0.1 --port 8787
cargo run -p lobster-cli -- send --from agent:openclaw --to user:rsaga --text "hello"
cargo run -p lobster-cli -- inbox --for user:rsaga
cargo run -p lobster-cli -- tail --for user:rsaga
```

- [ ] **Step 2: 在 README 里补充 CLI 用法**

至少补：

- `send`
- `inbox`
- `tail`
- `rooms`

- [ ] **Step 3: 跑全量验证**

Run:

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
cargo test -p lobster-waku-gateway --quiet
cargo test -p lobster-cli --quiet
cargo test -p lobster-tui --quiet
cargo check --quiet
```

Expected:

- 三个入口都通过
- workspace `cargo check` 通过

- [ ] **Step 4: Commit**

```bash
git add /Users/rsaga/Documents/Playground/lobster-chat/README.md \
        /Users/rsaga/Documents/Playground/lobster-chat/Cargo.toml \
        /Users/rsaga/Documents/Playground/lobster-chat/Cargo.lock \
        /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-cli \
        /Users/rsaga/Documents/Playground/lobster-chat/apps/lobster-waku-gateway/src/main.rs
git commit -m "feat: add lobster-cli agent sidecar channel"
```
