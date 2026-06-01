# lobster-chat Active Work Queue

Last updated: 2026-05-27

## Operating Rules

- 主线优先级：后端 gateway 合同 > H5 IM 主路径 > TUI parity > admin 精简 > 文档同步。
- 每轮只处理 1-2 个最高优先级任务。
- 每轮必须跑相关测试；如果测试失败，继续修到通过。
- 不提交 git，不删除重要文件，不改无关项目。
- 遇到高风险操作、需求冲突、产品取舍、外部账号/付费/删除/提交时停下来问用户。
- 每轮结束写入项目根目录的 longrun 记录文件：进度、改动文件、测试结果、下一轮目标。
- 如果 CC 正在做 H5 前端，避免并发改同一批 H5 文件；优先做 Rust gateway/TUI 或只做验收。

## 2026-05-25 四阶段后端补齐完成摘要

### Phase 1-4 已完成项

| 阶段 | 目标 | 状态 |
| --- | --- | --- |
| Phase 1 | 盘点后端结构，建立测试基线 | 完成 |
| Phase 2 | 补齐登录、身份、房间、消息、在线、未读、会话切换 | 完成 |
| Phase 3 | 居民目录搜索、在线状态、头像、私聊入口、DM 走 Gateway | 完成 |
| Phase 4 | 管理后台 API — 居民、房间、消息、系统状态的读侧端点 | 完成 |

### 新增/改动的后端能力

| 能力 | 端点/合同 | 测试 |
| --- | --- | --- |
| 在线状态 heartbeat | `POST /v1/shell/presence` | presence_http_endpoint_roundtrips |
| 未读标记清零 | `POST /v1/shell/read` | mark_read_http_endpoint_resets_unread |
| 居民搜索 | `GET /v1/residents?q=` | resident_endpoint_supports_search_query |
| 居民目录 enriched | `GET /v1/residents` (含 online/last_seen/avatar) | presence_appears_in_enriched_resident_directory |
| ShellState 未读字段 | `ShellRoomState.unread_count` | shell_state_includes_unread_count |
| 管理后台系统摘要 | `GET /v1/admin/summary` | admin_summary_endpoint_returns_counts_and_uptime |
| 消息发布后增量未读 | `publish_message()` 自动递增 | unread_increments_after_message_publish |

### 测试基线

- `cargo test -p lobster-waku-gateway`: 122 passed / 0 failed
- `cargo test --release -p lobster-waku-gateway`: 122 passed / 0 failed
- `node --test apps/lobster-web-shell/test/*.mjs`: 177 passed / 0 failed
- 总计: 299 测试全部通过

## Current Priority Queue

### P0 / P1

1. H5 IM 主路径真实验收
   - 验证 `index.html` 与 `creative.html` 双端互发。
   - 要求：发送后输入框清空；己方右侧、对方左侧；每条头像可见；pending echo 被 committed copy 替换；无重复闪现/撤回；失败状态来自真实 gateway。
   - 如果根因是 gateway 合同，修后端；如果是 UI 状态机，记录给 CC 或在未冲突时修 H5。

2. Gateway 合同继续加固
   - 检查 `/v1/shell/message`、`/v1/shell/events`、`/v1/shell/state` 的双端真实 IM 合同是否还有未覆盖边界。
   - 优先补黑盒测试，少改生产逻辑；只有测试暴露问题时再修实现。

3. TUI parity
   - 保持 `/help`、`/status`、`/refresh` 本地反馈不写 gateway。
   - 补齐 gateway recall/edit/send 状态投影端到端测试。
   - 不允许本地伪造成功态。

4. Admin 精简验收
   - 默认首屏只保留：左侧可收起分类导航、中间当前会话、右侧当前工具说明。
   - 高级功能藏到左侧分类选项卡里；disabled 必须有原因。
   - 不继续堆一屏表单墙。
   - `GET /v1/admin/summary` 端点已可用，前端对接待推进。

5. 文档同步
   - `creative.html` 是居民/住宅私聊主入口。
   - `user.html` 只保留 query-preserving 兼容跳转。
   - Gateway 是唯一合同真源。

## 2026-05-27 CC DS v4 Pro + Flash 混合执行摘要

### 本轮完成

| 阶段 | 目标 | 状态 |
| --- | --- | --- |
| Phase 0 | 建立基线，外盘备份 | 完成 |
| Phase 1 | 安全拆 app.js — shell-message-render.js (57行, 7个纯函数) | 完成 |
| Phase 2 | admin-ds 补加载/空/错误/刷新状态 | 完成 |
| Phase 3 | 补齐测试：shell-message-render 单测 + admin-ds 状态测试 | 完成 |
| Phase 4 | 技术债整理与文档同步 | 进行中 |

### 改动文件

| 文件 | 操作 | 行数变化 |
|------|------|---------|
| `shell-message-render.js` | **新增** | 57 行 |
| `app.js` | 删除 7 个函数定义 + 新增 import | 9879 → 9847 (−32) |
| `admin-ds.js` | 补 renderEmptyRow/setSectionLoading + 5 个表格空状态 + 加载/错误态改善 | 1172 → 1212 (+40) |
| `test/shell-message-render.test.mjs` | **新增** | 25 个测试 |
| `test/admin-ds-static.test.mjs` | 新增 5 个状态测试 | +~70 行 |
| `test/fake-dom.mjs` | 新增 shell-message-render.js URL 解析 + import 替换 | +~20 行 |
| `docs/app-js-split-audit.md` | 更新：子 agent 审查发现 + 下一轮优先级 | +~120 行 |

### 测试基线

- `npm test`: 338 passed / 0 failed (+30 vs 上次基线)
- `npm run smoke:dual-browser`: passed
- JS 语法检查：app.js, admin-ds.js, 13 个 shell-*.js 全部通过
- Backup: `/Volumes/AJW-Data/Backups/lobster-chat-cc-longrun-20260527-1030/`

### 真实功能新增

- admin-ds.js 全部 5 个表格现在有**空状态**占位行（含搜索无匹配提示）
- admin-ds.js 居民/房间/消息模块有**加载状态**（opacity + data-loading 属性）
- admin-ds.js 网关读取有**部分失败检测**（Promise.allSettled + rejected 处理）
- shell-message-render.js 提供 7 个可复用纯函数：messageStableId, isSystemSender, messageAvatarTone, messageThreadKind, messageRoleLabel, formatDateTime, escapeHtml

### 仍未完成

1. admin-ds sysconfig 已接入真实写操作，其余 12 处仍 disabled（需后端 Gateway 写接口）
2. admin-ds 邀请码/日志模块数据仍来自 Mock（无对应 Gateway 端点）
3. admin-ds 房间/邀请码表格尚无分页
4. app.js 仍有 9,847 行，重复逻辑未系统清理（详见审计文档第 7 节）

## 2026-05-28 第三轮摘要

### 本轮完成

- **Phase 1**: admin-ds `buildContextMessages` 假数据替换（上一轮）
- **Phase 2**: admin-ds 居民/消息/日志三表前端分页（上一轮+本轮修复）
- **Phase 3**: admin-ds 第一个真实写操作 — `POST /v1/admin/config`
  - 新增 `fetchGatewayJsonPost(path, body)` helper（安全 POST 封装）
  - 新增 `loadSysConfig()` — GET /v1/admin/config 加载配置
  - 新增 `renderSysConfigEditor(config)` — 动态渲染键值编辑 UI
  - 新增 `saveSysConfigItem(key, value, btnEl)` — POST 保存单项配置
  - 新增 `addSysConfigItem()` — 添加新参数到 Gateway
  - `switchModule('sysconfig')` 自动触发加载
- 修复 `renderPagination` 中 `el()` 调用 `className` → `class` 键名 bug
- 修复 `renderResidents` IIFE 闭包 `filtered[i]` → `residentPage[i]` bug

### 改动文件

| 文件 | 操作 | 行数变化 |
|------|------|---------|
| admin-ds.js | 增强 | 1299→~1380 |
| admin-ds.html | 增强 | sysconfig 动态编辑器 |
| verify-frontend-realness.mjs | 更新 | 分页校验规则 |

### 后端合同已验证

- `GET /v1/admin/config` → `HashMap<String, String>` JSON
- `POST /v1/admin/config` → 接受 `{"config": {"key": "value"}}`，返回 `{"ok": true}`
- `admin_set_config()` 支持增量更新（merge 而非 replace）
- 移除 `.ds-page-btn` 的 blanket `markUnavailableButton`
- `verify-frontend-realness.mjs` 分页校验规则同步更新

### 测试基线

- `npm test`: 338 passed / 0 failed
- layout: all OK
- realness: passed

### 下一轮建议

按优先级：
1. **app.js 低风险清理** — quickAction switch 函数提取（~180行，7个纯函数）
2. **admin-ds 第二个写操作** — POST /v1/admin/residents/ban 打通管理链路
3. **admin-ds 房间/邀请码表格分页** — 补全剩余两表
4. **shell-room-rail.js 魔数整治** — roomGroupBlueprints 权重值注释 + joinOrFallback 统一
5. **多页面 left-rail 一致性** — creative/index/unified/world-square 统一宽度/框架

## 2026-05-31 / 06-01 DS v4 Pro 执行摘要

### 本轮完成

| 阶段 | 目标 | 状态 |
| --- | --- | --- |
| P0-1 | 建立 git 安全快照和备份 | 完成 |
| P0-2 | 修正本地预览 gateway 启动 (restart-gateway.sh) | 完成 |
| P0-3 | 修复 H5 Enter 发送策略 (统一 PC/Mobile: Enter=发送, Shift+Enter=换行) | 完成 |
| P1-1 | admin-ds 消息审核写操作闭环 — POST /v1/admin/messages/moderate | **完成** |

### P1-1 详情: 消息审核写操作闭环

**后端 (上一轮已完成):**
- `gateway_models.rs`: 新增 `AdminModerateMessageRequest` struct
- `core_runtime.rs`: 新增 `admin_moderate_message()` 方法 + `message_moderation: HashMap<String, String>`
- `http_write_routes.rs`: 新增 `handle_post_admin_moderate_message()` handler
- `http_router.rs`: 注册 `POST /v1/admin/messages/moderate` 路由
- `gateway_tests.rs`: 3 个测试 (roundtrip / invalid action / nonexistent message)

**前端 (本轮完成):**
- `admin-ds.js` `normalizeGatewayMessages()`: 保留 `message_id` 和 `conversation_id` 字段
- `admin-ds.js`: 新增 `moderateMessage()` helper 和 `refreshCurrentMessageView()` helper
- `admin-ds.js`: "通过"/"屏蔽" 按钮接入真实 POST (含 loading 态、失败反馈、成功后刷新)
- `admin-ds.js`: 两处 "标记已处理" 按钮接入真实 POST
- `admin-ds-data.js`: 新增 `approved`/`handled` 状态标签和样式

### 改动文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `admin-ds.js` | 修改 | normalizeGatewayMessages 保留 ID 字段 + moderateMessage helper + 6 个按钮 wiring |
| `admin-ds-data.js` | 修改 | msgStatusTag/msgStatusText 增加 approved/handled 条目 |
| `restart-gateway.sh` | **新增** | Gateway 一键构建+重启+健康检查脚本 |

### 测试基线

- `cargo test -p lobster-waku-gateway`: **176 passed / 0 failed**
- `npm test` (前端): **538 passed / 0 failed**
- JS 语法检查: admin-ds.js, admin-ds-data.js 全部通过
- E2E 验证: `POST /v1/admin/messages/moderate` 三种 action + 两种错误情况全部通过

### P1-2: app.js 安全拆分 (2026-06-01)

从 app.js (9119行) 提取 3 个纯数据变换函数 → `shell-state-normalize.js` (107行):

| 函数 | 说明 |
|------|------|
| `contractConversationMap(payload)` | gateway payload → Map<conversation_id, room> |
| `mergeRoomWithContract(room, contract)` | room 原始数据 + contract 默认值合并 |
| `synthesizeRoomsFromContracts(payload)` | 组合上述两函数，生成完整 room 数组 |

- app.js: 9119 → 9020 (-99)
- 新增 `test/shell-state-normalize.test.mjs`: 9 个测试
- 累计 app.js 缩减: 9847 → 9020 (-827)
- 新增独立模块: `shell-state-normalize.js` (107行, 3 函数, 9 测试)

### 仍未完成

1. admin-ds 居民封禁/解禁、房间冻结/解冻仍 disabled（后端接口已有，前端未接入）
2. admin-ds 邀请码/日志模块数据仍来自 Mock（无对应 Gateway 端点）
3. app.js 仍有 ~9020 行，`roomMatchesSearch` (64行) 可提取但需先提取依赖函数
4. 消息审核状态仅存于 GatewayRuntime 内存（HashMap），不持久化，重启后丢失

## 前端审计结果 (2026-05-25)

- H5 `app.js` 的 `state` 变量初始化为 `structuredClone(SAMPLE_STATE)` 兜底，gateway 连接后全部来自 `normalizeShellState()`。
- `activeRoomId` 是 UI 视图状态，跟踪用户选中哪个房间，不是 canonical 数据。
- 无直接 `state.rooms.push()` 或 `state.* = ...` 绕过 gateway 的路径。
- `admin-ds.js` 只有临时渲染数组和显示标签，无本地 canonical 状态。

## Standard Test Commands

```bash
cargo test -p lobster-waku-gateway
cargo test -p lobster-tui
node --test apps/lobster-web-shell/test/*.mjs
./scripts/smoke-web-shell.sh
```

## Browser Acceptance Targets

```text
http://127.0.0.1:18081/index.html?gateway=http://127.0.0.1:8787&identity=qa-a
http://127.0.0.1:18081/creative.html?gateway=http://127.0.0.1:8787&identity=qa-b
http://127.0.0.1:18081/admin.html?gateway=http://127.0.0.1:8787&qa=manual
http://127.0.0.1:18081/unified.html?gateway=http://127.0.0.1:8787&qa=manual
http://127.0.0.1:18081/world-square.html
```
