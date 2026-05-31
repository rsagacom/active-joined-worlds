# 鉴权与权限规划

## 结论

当前系统已经有低成本认证骨架：邮箱 OTP、访客态限制、居民身份、城主/ steward 概念、私聊参与者可见性、部分 city-lord 治理接口约束。但这还不是完整生产鉴权体系。

后续 admin 后台和 gateway 必须按“认证、会话、授权、审计”四层补齐，不能只靠前端 disabled 按钮或 query identity。

## 当前已有能力

| 层级 | 已有能力 | 状态 |
| --- | --- | --- |
| 访客态 | `访客` 不能发送正式消息，不能打开私聊 | 已有测试覆盖 |
| 居民登录 | email OTP request / verify，登录后生成 resident | 骨架可用 |
| 私聊可见性 | direct thread 只对参与者可见；非参与者不能写入 | 已有测试覆盖 |
| 消息归属 | edit / recall 只能由发送者执行 | 已有测试覆盖 |
| 城市角色 | city lord / steward / membership / room freeze 等模型 | 部分可用 |
| 黑名单 | 邮箱/手机号/设备哈希黑名单 preflight | 已有骨架 |
| 前端状态 | H5 禁用访客发送、admin 未接功能 disabled | UI 层保护，不可当安全边界 |

## 明确缺口

1. **没有正式 session token**
   - 当前 H5 主要用 `resident_id` / query / localStorage 表示身份。
   - 这只能用于本地开发，不能作为生产认证。

2. **admin 没有独立登录态**
   - `admin.html` 当前只是城主投影页面，不等于已鉴权后台。
   - 城主/管理员动作必须由 gateway 验证 token + role，不能信前端页面入口。

3. **权限模型还不够显式**
   - 需要把 `resident / city_lord / steward / world_safety / system_admin` 做成统一能力表。
   - 每个接口必须声明需要什么 capability。

4. **高风险动作缺少二次确认和审计**
   - 制裁、封禁、冻结房间、隔离城市、信任状态变更必须写审计日志。
   - 需要 actor、target、reason、before/after、request_id、timestamp。

5. **token 生命周期与撤销缺失**
   - 需要 access token / refresh token 或本地 session token。
   - 需要 logout、revoke session、设备列表、失效时间。

6. **生产安全边界未完成**
   - 限流、CSRF/CORS 策略、暴力 OTP 防护、设备指纹策略、IP 风险等还未成型。

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

### Phase A：本地安全 MVP

- 为 OTP verify 返回 `session_token`。
- gateway 增加 `Authorization: Bearer <token>` 解析。
- token 绑定 resident_id、device_id、issued_at、expires_at。
- `/v1/shell/message` 不再信任裸 sender；要求 token actor 与 sender 一致。
- 保留 dev fallback，但必须由 `LOBSTER_DEV_AUTH_BYPASS=1` 显式开启。

### Phase B：admin 权限

- 给 resident 增加 role/capability projection。
- admin.html 启动后请求 `GET /v1/auth/session` 或 shell state 中的 capability 摘要。
- 公告、安全、房间、世界工具按 capability 显示。
- 后端为公告/安全/房间操作补 capability check。

### Phase C：审计与高风险动作

- 新增 `audit-log.jsonl` 或 runtime audit store。
- 记录 high-risk action：actor、capability、target、before、after、reason、request_id。
- admin 读取审计摘要，但不泄露私聊明文。

### Phase D：生产化

- refresh token / session revoke / logout。
- OTP 限流和防暴力。
- CORS 从开发通配改为允许列表。
- CSRF 策略或 bearer-only API 策略。
- 密钥轮换与部署密钥配置文档。

## 测试要求

- 未登录不能发送正式消息。
- token actor 与 sender 不一致必须失败。
- 非 direct 参与者不能读/写 direct thread。
- 非 city_lord 不能冻结房间、批准成员、发布本城公告。
- steward 只能执行授权范围内动作。
- system_admin 不能读取居民私聊明文。
- 高风险动作必须生成 audit event。
- dev auth bypass 未开启时，所有写接口必须拒绝裸身份。
