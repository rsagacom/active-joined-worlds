# Changelog

本文件记录 lobster-chat IM 项目的 notable 变更。日期为提交日期，按时间倒序。

## [Unreleased] — 2026-07-07

### Added
- 私宅主客访问确权：Gateway `personal_room` 识别（仅 `home:<owner>` 单参与者 Direct）+ `registered_all`/`friends_only` 访问策略 + 房主确权端点 `POST /v1/personal-room/access-policy` + 非房主访客不携带私宅历史消息（防泄漏）
- 好友关系流：`request`/`accept` 两步流（`POST /v1/resident-relationships/request|accept`）+ 居民目录按 viewer 投影 `relationship_state`/`relationship_requested_by`；pending 不解锁，accepted friends 才能访问 `friends_only` 私宅场景
- 注册登录共享接线：`shell-auth-standalone.js` 统一 `world-square`/`admin-ds` OTP 流程
- admin-ds 场景编辑器 day/night URL 输入 + 设备管理 UI 移入主内容区
- 纯模型模块：`shell-user-detail-card.js`（角色卡投影）、`shell-conversation-callout.js`（会话导引文案）、`shell-governance-status.js`、`shell-personal-room-policy.js`

### Changed
- app.js 减债：9694 → 9224 行；角色卡投影、会话导引文案、治理状态、私宅策略、直聊/好友提交状态下沉为 `*ForState` 注入式纯函数
- admin-ds 写操作护栏：9 处 `.then` 假成功态系统性修复，统一 `fetchGatewayJsonPost` helper，无 Gateway 端点的模块禁用 + 原因（不假成功态）

### Verified
- Gateway 274 tests / 0 fail / 0 warning
- Web Shell 1185 tests / 0 fail（unit + layout + realness）

## 2026-06-22 ~ 06-25

### Added
- CLI：`admin-nickname` / `admin config` / `admin room-member` / `create-resident` / `moderate` 命令（Bearer token 认证）
- web-shell scene-editor：undo/redo 历史栈 + 侧栏热点列表 + 未保存改动离开警告
- 模块抽取：`shell-room-context` / `shell-room-summary` / `shell-composer` / `shell-message-body` / `shell-scene-image-layer`

## 2026-06-14

### Fixed
- 像素场景美术收口：day 资产去蜡黄/奶油 + 热点层透明化（`.scene-hotspot` 缩 1/4 + 全透明边框）+ CSS 拆分防回归（`styles.css` 17852 → 5752 行）
- 测试锁定：`test/shell-pages-static.test.mjs` 钉住 day 资产路径与禁 `mix-blend-mode: screen`
