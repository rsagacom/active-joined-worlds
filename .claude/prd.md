# PRD: IM 后端收尾 — 持久化 + 在线广播 + 速率限制 + 测试缺口补齐

## 目标

补齐 IM 后端最后的能力缺口：在线状态/未读计数持久化、在线状态变更 SSE 广播、消息发送速率限制骨架，同时修复子 agent 审计发现的 5 个测试缺口。

## 现有基础

| 已有能力 | 状态 |
| --- | --- |
| presence heartbeat (`POST /v1/shell/presence`) | ✅ 已实现，纯内存 |
| unread 增量/清零 (`POST /v1/shell/read`) | ✅ 已实现，纯内存 |
| SSE shell-state 推送 | ✅ state_version 轮询模式 |
| governance/auth/provider 文件持久化 | ✅ JSON 文件模式可复用 |
| 消息 send/edit/recall | ✅ 已实现 |

## 新增功能

### 1. Presence/Unread 文件持久化
- 参考 `governance-state.json` 持久化模式
- 新增 `presence_path` / `unread_path`，在 `GatewayRuntime::open()` 时加载
- 每次 `record_presence()` 和 `increment_unread()` / `mark_read()` 后写入 JSON 文件
- 持久化文件路径：`{storage_root}/presence-state.json`、`{storage_root}/unread-state.json`

### 2. SSE 在线状态广播
- `record_presence()` 内调用 `notifier.notify_changed()`（当前使用 `_notifier` 忽略）
- SSE 客户端可通过 `shell-state` 事件感知在线状态变化
- 心跳更新不强制全量广播（仅状态从离线→在线或在线→离线时触发）

### 3. 消息发送速率限制骨架
- 每居民每分钟最多 N 条消息（N=30，硬编码常量）
- 超出限制时 `POST /v1/shell/message` 返回 429 + `{ error: "rate_limited", retry_after_ms }`
- 时间窗口数据仅内存存储（不持久化），重启后清零

### 4. 测试缺口补齐（Agent 审计 TOP 5）
| # | 缺口 | 补什么 |
| --- | --- | --- |
| 1 | 非发送者撤回拒绝 | `recall_rejects_non_sender` 测试 |
| 2 | edit/recall 对无效 message_id | 两个测试：不存在 message_id 拒绝 |
| 3 | edit/recall 状态跨重启 | `runtime_persists_edit_and_recall_across_restart` 测试 |
| 4 | edit/recall 对无效 room_id | 两个测试：不存在 room_id 拒绝 |
| 5 | SSE 并发竞态 | 文档说明已知限制，暂不加测试 |

## 数据模型新增

```rust
// gateway_models.rs
RateLimitState { window_start_ms: i64, count: u32 }

// core_runtime.rs GatewayRuntime 新增字段
presence_path: PathBuf,
unread_path: PathBuf,  
rate_limits: HashMap<String, RateLimitState>,
```

## 端点变更

| 端点 | 变更 |
| --- | --- |
| `POST /v1/shell/presence` | 写入后持久化 + 触发 SSE notify |
| `POST /v1/shell/read` | 写入后持久化 |
| `POST /v1/shell/message` | 新增 429 速率限制响应 |
| `POST /v1/shell/message/edit` | 新增无效 message_id / room_id 400 响应验证 |
| `POST /v1/shell/message/recall` | 新增无效 message_id / room_id 400 响应验证 |

## 约束

- 复用现有 `governance-state.json` 的 JSON 持久化模式
- 不修改 chat-core 共享合同
- 每个新功能 ≥1 集成测试
- 不破坏现有 134 个 gateway 测试
- 速率限制为骨架实现（仅内存，不持久化，单机有效）

## 验收标准

1. Gateway 重启后 presence 记录和 unread 计数可恢复
2. 离线→在线 SSE 通知可达（`shell-state` 事件 state_version 递增）
3. 消息发送超限返回 429 + `retry_after_ms`
4. 5 个测试缺口补齐（实际补 4 个，并发竞态只记文档）
5. Rust gateway 测试 ≥144 passed（原 134 + 10 新增）
