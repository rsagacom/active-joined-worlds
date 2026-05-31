# lobster-cli Sidecar Design

## 术语对照

这份文档里会保留少量英文别名，下面是中文对应：

- `sidecar`：侧车通道。意思是“挂在现有系统旁边的一条辅助入口”，不是单独再造一个主系统。
- `gateway`：本地消息网关。这里指现有 `lobster-waku-gateway`。
- `CLI`：命令行入口。
- `inbox`：收件箱摘要视图。
- `tail`：尾读/持续查看消息流。
- `rooms`：房间列表或会话列表。
- `direct`：点对点私聊会话。
- `follow`：持续跟随输出，类似日志流。
- `transport`：传输层。
- `store`：本地存储层。

## Goal

新增一条独立于 `TUI`/`H5` 的非交互聊天通道：`lobster-cli`。它挂在现有 localhost gateway 之上，为 `OpenClaw / Codex / Claude Code` 等本地智能体提供统一的内部消息发送、收件箱读取和持续监听能力。

第一版目标不是做外部 IM 聚合，而是把 `lobster-chat` 自己的消息面先做成可被 agent 直接调用的 sidecar（侧车）通道。

## Scope

第一版只做 lobster 内部送达：

- `agent -> user`
- `user -> agent`
- `user -> room`
- `agent -> room`

第一版不做：

- 飞书、微信、短信、邮件等外部送达
- 通讯录同步
- 多协议桥接
- 端到端 MLS 新能力扩展
- 独立 daemon

`lobster-cli` 是命令行入口，不是新协议层，也不是新存储层。

## Why This Shape

当前项目已经有两层合适的基础设施：

1. `transport-waku` 里稳定的 JSON gateway request/response 边界
2. `lobster-waku-gateway` 里本地 direct/open、publish/recover/poll 和世界/城邦目录接口

如果直接让 `OpenClaw / Codex / CC` 绕过 gateway 去读写 store，会立刻产生第二套消息入口，后面 `TUI / H5 / 眼镜端` 会和 agent 通道分叉。反过来，如果把 agent 通道挂成现有 gateway 的一个薄 CLI，所有入口都会复用同一消息面和同一地址语义。

## Options Considered

### Option A: 直接新增 `lobster-cli`，挂现有 gateway（网关）

做法：

- 新增 `apps/lobster-cli`
- CLI 只负责参数解析、身份声明、请求组装、输出格式
- 通过现有 gateway 接口完成 `send / inbox / tail / rooms`

优点：

- 和 `TUI / H5` 共用同一消息面
- 不把协议耦合到 `OpenClaw`
- 可逐步演进为眼镜端、自动体、脚本统一 sidecar（侧车）入口

缺点：

- 需要补一层针对 CLI 友好的 gateway 读写接口

### Option B: 让 CLI 直接读写本地 timeline/store（时间线/存储层）

优点：

- 起步最快

缺点：

- 直接分叉消息面
- 容易和 gateway/H5/TUI 状态不一致
- 后面很难收回来

### Option C: 直接把聊天通道做成 OpenClaw 插件能力

优点：

- OpenClaw 接入快

缺点：

- 聊天协议会长进 `OpenClaw`
- `Codex / CC / H5 / 眼镜端` 复用成本高
- 不符合“聊天项目自己拥有聊天通道”的目标

## Decision

采用 Option A。

`lobster-cli` 作为聊天项目自己的 sidecar CLI（侧车命令行入口），直接挂现有 localhost gateway（本地消息网关）。`OpenClaw / Codex / CC` 只是调用者，不拥有协议。

## User-Facing Commands

第一版命令面固定为四个：

### `lobster-cli send`

示例：

```bash
lobster-cli send \
  --from agent:openclaw \
  --to user:zhangsan \
  --text "晚上一起吃饭吗"
```

也支持：

```bash
lobster-cli send --from user:rsaga --to room:city:core-harbor:lobby --text "今晚八点开会"
lobster-cli send --from agent:codex --to agent:cc --text "请复核这份设计"
```

输出：

- 成功：消息 id、目标、投递时间
- 失败：明确错误，不输出交互废话

### `lobster-cli inbox`（收件箱摘要）

示例：

```bash
lobster-cli inbox --for agent:codex
```

作用：

- 拉取当前身份关联的最近会话摘要
- 默认返回最近若干会话，每个会话只展示一条尾消息摘要

### `lobster-cli tail`（持续查看消息流）

示例：

```bash
lobster-cli tail --for user:lisi
lobster-cli tail --for agent:openclaw --follow
```

作用：

- 查看某个身份当前收件箱或某个会话的连续消息流
- `--follow` 持续轮询，适合作为 agent 的被动监听通道

### `lobster-cli rooms`（房间/会话列表）

示例：

```bash
lobster-cli rooms --for user:zhangsan
```

作用：

- 返回当前身份可见的房间 / 私帖列表
- 作为 agent 的目标发现入口

## Address Model

第一版只支持三类地址：

- `user:<id>`
- `agent:<id>`
- `room:<scope>:<city>:<name>`

具体约束：

- `user:<id>` 表示居民身份，例如 `user:rsaga`
- `agent:<id>` 表示 agent 身份，例如 `agent:openclaw`
- `room:city:core-harbor:lobby` 表示城邦房间
- `room:world:lobby` 表示世界广场

第一版不引入单独的 `dm:` 作为 CLI 地址格式。CLI 层统一用 `user:` / `agent:` 目标，gateway 负责把点对点消息映射成内部 direct（点对点私聊）conversation id。

这样用户输入面更稳定，不把内部 conversation id 暴露成外部命令格式。

## Architecture

### 1. CLI 是薄入口（thin CLI）

`lobster-cli` 只做：

- 参数解析
- 地址校验
- 输出格式化
- HTTP 请求 gateway

`lobster-cli` 不做：

- 自己维护消息数据库
- 自己定义 transport
- 自己保存第二份会话状态

### 2. Gateway 继续作为唯一的本地消息权威入口

第一版的所有发送、收件箱读取、tail 读取都要经过 localhost gateway。

这保持了：

- `TUI`
- 后续 `H5`
- agent sidecar

共用同一消息语义和同一时间线。

### 3. Gateway 需要一层更适合 CLI 的接口面

现有 gateway 已有：

- `Publish`
- `Recover`
- `Poll`
- `POST /v1/direct/open`

但第一版 `lobster-cli` 需要更明确的 CLI 读写接口。推荐新增一组面向 CLI 的 HTTP 端点，而不是让 CLI 直接拼底层 transport（传输层）request：

- `POST /v1/cli/send`
- `GET /v1/cli/inbox`
- `GET /v1/cli/tail`
- `GET /v1/cli/rooms`

原因：

- CLI 需要的是会话和收件箱语义，不是 transport（传输层）原语
- 这样 `send/inbox/tail/rooms` 可以保持稳定，不把 `Publish/Recover/Poll` 暴露给最终用户

## Request/Response Shape

### `POST /v1/cli/send`

请求：

```json
{
  "from": "agent:openclaw",
  "to": "user:zhangsan",
  "text": "晚上一起吃饭吗",
  "client_tag": "openclaw"
}
```

返回：

```json
{
  "ok": true,
  "conversation_id": "dm:openclaw:zhangsan",
  "message_id": "msg_...",
  "delivered_at_ms": 1760000000000
}
```

约束：

- `from` 可以是 `user:<id>` 或 `agent:<id>`，但不能使用未登录浏览器占位身份 `user:访客`
- `user:访客` 会返回 login-required 错误，避免 CLI 侧绕过 H5 的访客发送禁用

### `GET /v1/cli/inbox?for=agent:codex`

返回：

```json
{
  "identity": "agent:codex",
  "conversations": [
    {
      "conversation_id": "dm:rsaga:codex",
      "title": "rsaga",
      "kind": "direct",
      "updated_at_ms": 1760000000000,
      "last_message_preview": "今晚一起吃饭吗"
    }
  ]
}
```

### `GET /v1/cli/tail?for=agent:codex&conversation_id=...`

返回最近消息流，`--follow` 由 CLI 轮询这一端点，不在第一版引入 websocket（长连接推送）。

### `GET /v1/cli/rooms?for=user:rsaga`

返回身份可见的房间和 direct thread 列表，供 agent 做目标发现。

## Conversation Mapping Rules

### Direct delivery

当 `to` 是 `user:` 或 `agent:` 时：

- gateway 根据 `from/to` 组合生成稳定 direct（点对点私聊）conversation id
- 如有必要，先调用已有 `POST /v1/direct/open`
- 再在对应会话上写入消息

### Room delivery

当 `to` 是 `room:` 时：

- gateway 直接向既有 room conversation 写消息

### Identity normalization

gateway 必须统一归一化：

- `user:<id>`
- `agent:<id>`

避免不同入口产生：

- `dm:openclaw:rsaga`
- `dm:rsaga:openclaw`

这类镜像重复会话。

## Error Handling

第一版错误必须明确，不允许“正在整理后回复你”这类占位废话。

最小错误集：

- `invalid_address`
- `unknown_identity`
- `conversation_not_found`
- `gateway_unreachable`
- `permission_denied`
- `message_too_large`

CLI 输出要求：

- 默认给人看：一行明确错误
- `--json` 时输出结构化错误对象

## Security and Trust Boundaries

第一版默认运行在 localhost，信任边界是本机。

因此先不做：

- 网络级鉴权
- 多租户 ACL
- 端到端外部身份校验

但要预留：

- `from` 身份声明
- 可选 `client_tag`

后续若要接 OpenClaw/Codex/CC 的更强鉴权，可以沿这个字段扩。

## Testing Strategy

第一版测试重点：

1. 地址解析
2. `user/agent/room` 映射规则
3. direct conversation id 归一化
4. CLI 请求成功/失败输出
5. gateway `send/inbox/tail/rooms` 基本回归

测试顺序：

- 先补 gateway 端点测试
- 再补 CLI 参数和输出测试
- 最后补一条端到端 smoke

## Rollout Plan

阶段 1：

- 写设计文档
- 用户确认命令面与地址格式

阶段 2：

- 在 gateway 增加 `/v1/cli/send|inbox|tail|rooms`

阶段 3：

- 新增 `apps/lobster-cli`
- 只接 `send/inbox/tail/rooms`

阶段 4：

- 让 `OpenClaw / Codex / CC` 先从 `send` 和 `tail --follow` 开始接入

## Out of Scope for This Spec

以下能力明确后置：

- 飞书/微信外部送达
- user-agent 自动路由策略
- 会话优先级、未读策略
- MLS 新协商流程
- 眼镜端交互
- `TUI` 和 `H5` 的 UI 改动

## Recommendation

按这份 spec 先做 `gateway` 的 CLI-friendly surface（面向命令行的接口层），再做 `lobster-cli`。不要先写 `lobster-cli` 去绕开 gateway，也不要把这条通道直接塞进 `OpenClaw` 插件层。
