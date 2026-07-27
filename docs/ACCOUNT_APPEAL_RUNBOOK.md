# 账号申诉操作手册

## 目标与边界

本手册用于单城 IM 的账号禁用、制裁和登录异常申诉。当前系统提供注册审计投影、居民制裁、恢复和审计日志；没有自动化工单系统，也没有管理员直接读取完整邮箱或私聊正文的默认权限。

原则：

- 先只读调查，后执行恢复或维持决定
- 不要求用户提交验证码、session token 或邮箱密码
- 不通过修改 JSON 文件直接恢复账号
- 所有高风险动作使用管理员 Bearer session，并确认写入审计日志
- 邮箱变更、账号合并和身份转移当前没有正式合同，不能手工伪造

## 申诉受理信息

只收集：

- 居民 ID
- 后台可核对的脱敏邮箱
- 大致注册/最近登录时间
- 申诉原因和相关 sanction/report ID（如有）
- 用户可提供的非敏感上下文

不得收集或记录：OTP 验证码、session token、邮件 Bearer 密钥、完整邮箱密码。

## 调查步骤

1. 在 admin-ds 居民管理搜索居民 ID。
2. 核对 `/v1/admin/residents` 中的：
   - `email_masked`
   - `registration_state`
   - `created_at_ms`
   - `verified_at_ms`
   - `last_login_at_ms`
   - `is_banned`
   - `sanctions`
3. 在 `/v1/admin/audit-log` 按时间和 actor 核对相关管理动作。
4. 如涉及举报，核对世界安全报告和对应 sanction/report ID。
5. 区分问题类型：
   - 邮件未到：检查 mailer，不解除制裁
   - session 失效：重新登录，不修改注册记录
   - 居民制裁：进入复核流程
   - 世界黑名单命中：不能仅用普通 unban 绕过，需要复核原始安全决定

## 决策与执行

### 维持决定

- 记录依据、相关 ID、复核人和时间
- 不重复创建同类 sanction
- 向用户说明可再次申诉所需的新证据，不泄露内部密钥或其他居民信息

### 解除普通居民制裁

1. 确认申诉对象和 sanction ID 一致。
2. 使用 admin-ds 的恢复动作或正式 `/v1/admin/residents/unban` / `unsanction` 路由。
3. 重新读取居民投影，确认 active sanction 已解除。
4. 核对 audit log 已出现恢复事件。
5. 让用户重新登录并验证 shell state；不要向用户发送管理员 token。

### 世界黑名单申诉

世界黑名单会阻止旧 email/mobile/device handle 再次获取 OTP。当前没有“静默绕过”流程：

- 必须关联原始安全报告和加入黑名单的审计事件
- 由具备世界安全权限的管理员复核
- 若当前 Gateway 没有正式撤销黑名单合同，记录为“需要代码/合同支持”，不要直接编辑 `auth-state.json` 或 blacklist JSON

## 验收与留痕

一次申诉只有同时满足以下条件才算完成：

- 决策、理由、操作者、时间和相关 ID 有记录
- 若执行恢复，Gateway 返回成功且重新读取状态符合预期
- audit log 存在对应高风险动作
- 用户重新登录验证成功，或明确记录仍失败的外部原因
- 未在聊天、截图或工单中暴露 OTP、session token、完整密钥

## 事故升级

出现以下情况时停止单账号操作，按安全事故处理：

- 多个账号同时无法收取 OTP
- audit log 缺失、损坏或出现未知 actor
- 状态恢复后又自动回到 banned/suspended
- 邮件 Webhook 泄露 OTP 或 Bearer token
- 状态目录损坏或出现跨文件不一致

先保留日志和状态备份，再处理服务恢复；不要在证据未保全时批量修改状态文件。
