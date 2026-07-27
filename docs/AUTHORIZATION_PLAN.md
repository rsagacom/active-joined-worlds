# 鉴权与权限规划

> 当前状态（2026-07-27）：本文保留最初的威胁边界和实施顺序；下方历史缺口已按当前实现重写。session bearer、30 天过期、logout/revoke、OTP 请求/验证限流、能力校验、管理审计、生产 CORS 配置及关闭 dev bypass 的写路由门禁均已落地并进入 Gateway/release gate 回归。H5 与 admin-ds 的可见退出入口现在都会调用 `/v1/auth/logout`；公网生产主机、域名/TLS、真实邮件和双端验收仍未执行。

## 结论

当前本地系统已经闭合“认证、会话、授权、审计”四层：邮箱 OTP、Bearer session、访客态限制、居民身份、私聊参与者可见性、角色/capability 校验和高风险审计均由 Gateway 真源提供，H5/TUI/CLI/admin-ds 只消费这些合同。

这仍不等于公网生产验收；外部环境的真实邮件投递、TLS/代理、目标主机和双端行为需要另行执行。

## 当前已有能力

| 层级 | 已有能力 | 状态 |
| --- | --- | --- |
| 访客态 | `访客` 不能发送正式消息，不能打开私聊 | 已有测试覆盖 |
| 居民登录 | email OTP request / verify，登录后生成 resident 和 Bearer session | Gateway/release gate 已覆盖 |
| 会话生命周期 | 30 天过期、`GET /v1/auth/session`、`POST /v1/auth/logout` 服务端撤销 | 已完成；refresh token/轮换仍后置 |
| 私聊可见性 | direct thread 只对参与者可见；非参与者不能写入 | 已有测试覆盖 |
| 消息归属 | edit / recall 只能由发送者执行 | 已有测试覆盖 |
| 城市角色 | city lord / steward / membership / room freeze 等模型 | 部分可用 |
| 黑名单 | 邮箱/手机号/设备哈希黑名单 preflight | 已有骨架 |
| 前端状态 | H5 禁用访客发送；H5/admin-ds 显示登录与退出入口 | UI 仅作 UX，安全边界在 Gateway |

## 历史规划项与当前状态

1. **正式 session token：已完成本地实现**
   - OTP verify 返回 Bearer session，Gateway 绑定 resident/device/issued/expires 并校验 actor。
   - H5/admin-ds 退出时调用 `/v1/auth/logout`；旧 token 在 Gateway 上立即失效，网络失败会清理本地状态并显示待重试。
   - refresh token、token rotation 和设备会话列表仍是后续增强项。

2. **admin 独立主体：当前采用共享 Gateway session + capability**
   - admin-ds 复用居民 OTP/Bearer session，管理读写由 Gateway 验证 token、role/capability 和目标范围。
   - 独立的管理员主体、设备列表和更细的后台会话策略仍未单独产品化。

3. **权限模型：已完成主要本地闭环**
   - `resident / city_lord / steward / world_safety / system_admin` 已进入统一 capability 校验和管理端点门禁。
   - 仍可继续细化 capability 文档与跨城市策略，但不再依赖前端 disabled 或 query identity。

4. **高风险动作：已完成本地审计闭环**
   - 制裁、封禁、冻结房间、治理配置、设备和消息管理动作由 Gateway 写审计并持久化。
   - admin-ds 提供受控操作与明确失败反馈；公网演练仍待执行。

5. **token 生命周期：本地 session 已完成，增强项后置**
   - access/session token、失效时间、logout、revoke 已完成并有回归测试。
   - refresh token、轮换、设备列表和跨设备撤销仍未实现。

6. **生产安全边界：代码门禁已完成，外部验收未完成**
   - 本地已覆盖 OTP 限流、防暴力、HTTPS CORS、Bearer 代理透传和关闭 dev bypass 的 readiness 检查。
   - 目标 Linux 主机、正式域名/TLS、真实邮件 Webhook、公网双端及账号申诉演练仍需执行。

## 目标权限模型

### 身份主体

| 主体 | 说明 |
| --- | --- |
| `guest` | 未登录访客，只能读公开入口，不能发正式消息 |
| `resident` | 已验证居民，可看自己可见会话、发消息、打开私聊 |
| `city_lord` | 城市城主，可管理本城公共空间和成员，不可读居民私聊明文 |
| `steward` | 城主授权的协管，可处理指定范围事务 |
| `world_safety` | 世界安全协调角色，可处理举报、隔离恶意城市、发布安全通告 |
| `system_admin` | 本地部署管理员，只做网关配置、备份、诊断，不默认拥有私聊读取权 |

### 能力表

| 能力 | resident | steward | city_lord | world_safety | system_admin |
| --- | --- | --- | --- | --- | --- |
| 读公开群聊 | 是 | 是 | 是 | 是 | 是 |
| 读本人私聊 | 是 | 仅本人 | 仅本人 | 仅本人 | 仅本人 |
| 发送消息 | 是 | 是 | 是 | 是 | 可选 |
| 编辑/撤回本人消息 | 是 | 是 | 是 | 是 | 可选 |
| 冻结公共房间 | 否 | 授权后 | 本城 | 否 | 否 |
| 发布公告 | 否 | 授权后 | 本城 | 世界安全公告 | 否 |
| 处理举报 | 否 | 授权后 | 本城 | 跨城/世界 | 否 |
| 封禁/限制居民 | 否 | 授权后 | 本城范围 | 跨城风险范围 | 否 |
| 改世界信任状态 | 否 | 否 | 本城自隔离 | 是 | 否 |
| 网关诊断/备份 | 否 | 否 | 本城部署可选 | 否 | 是 |

## 接口鉴权规则

1. 所有写接口必须带认证凭证，不接受裸 `sender/resident_id` 作为可信身份。
2. gateway 从 token 解析 `actor_id`，请求体里的 `sender` 只能与 actor 一致，或由明确授权代理。
3. direct 私聊接口必须校验 actor 是参与者。
4. city 管理接口必须校验 actor 对目标 city 有 `city_lord` 或对应 `steward` capability。
5. world safety 接口必须校验 `world_safety` capability。
6. system 诊断接口必须校验本地部署管理员权限，且不得泄露私聊内容。
7. 所有高风险动作必须写 audit event。

## Admin 后台落地原则

1. admin 首屏不等于授权成功；必须先显示当前登录身份与权限范围。
2. 左侧工具入口根据 capability 动态显示，不是只靠 disabled。
3. 无权限功能默认隐藏；需要解释时才显示“无权限原因”。
4. 高风险按钮必须二次确认：对象、动作、影响范围、原因。
5. 前端可以做 UX 禁用，但安全边界必须在 gateway。

## 实施顺序

### Phase A：本地安全 MVP（已完成）

- 为 OTP verify 返回 `session_token`。
- gateway 增加 `Authorization: Bearer <token>` 解析。
- token 绑定 resident_id、device_id、issued_at、expires_at。
- `/v1/shell/message` 不再信任裸 sender；要求 token actor 与 sender 一致。
- 保留 dev fallback，但必须由 `LOBSTER_DEV_AUTH_BYPASS=1` 显式开启。

### Phase B：admin 权限（已完成主要范围）

- 给 resident 增加 role/capability projection。
- admin.html 启动后请求 `GET /v1/auth/session` 或 shell state 中的 capability 摘要。
- 公告、安全、房间、世界工具按 capability 显示。
- 后端为公告/安全/房间操作补 capability check。

### Phase C：审计与高风险动作（已完成主要范围）

- 新增 `audit-log.jsonl` 或 runtime audit store。
- 记录 high-risk action：actor、capability、target、before、after、reason、request_id。
- admin 读取审计摘要，但不泄露私聊明文。

### Phase D：生产化（本地门禁完成，外部验收待执行）

- 已完成：session revoke / logout、OTP 限流和防暴力、CORS 允许列表、Bearer-only 写 API 策略、部署密钥配置文档。
- 待完成：refresh token/rotation、设备会话列表、目标 Linux 主机部署、正式域名/TLS、真实邮件和公网双端验收。

## 测试要求

- 未登录不能发送正式消息。
- token actor 与 sender 不一致必须失败。
- 非 direct 参与者不能读/写 direct thread。
- 非 city_lord 不能冻结房间、批准成员、发布本城公告。
- steward 只能执行授权范围内动作。
- system_admin 不能读取居民私聊明文。
- 高风险动作必须生成 audit event。
- dev auth bypass 未开启时，所有写接口必须拒绝裸身份。
