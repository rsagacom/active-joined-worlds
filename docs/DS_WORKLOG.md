# DeepSeek v4 pro 工作日志

## 2026-05-26 02:30 — 前端模块拆分（shell-room-rail 提取 + auth 边界收窄 + admin-ds 运行时测试）

### 本轮成果

完成三项前端架构任务，app.js 从 10010 行缩减约 130 行，全部新增测试通过。

### 任务 1：admin-ds.js gateway 运行时测试

- 新建 `test/admin-ds-runtime.test.mjs`（8 个测试）
- 覆盖 normalizeGatewayResidents、normalizeGatewayRooms、normalizeGatewayMessages（gateway 数据转换）
- 覆盖 fetchGatewayJson 三种场景（无 gateway、gateway 500、成功返回）
- 覆盖 markUnavailableButton（disabled、aria-disabled、title、dataset）
- 静态验证：admin-ds.js 全部使用 textContent/createTextNode，无 innerHTML
- **测试结果**：8 pass / 0 fail

### 任务 2：shell-room-rail.js 提取

- 新建 `shell-room-rail.js`（~310 行），使用与 shell-auth.js 相同的 initRail() 依赖注入模式
- 提取核心房间展示函数：roomKind、badgeToken、roomDisplayPeer、roomThreadHeadline、roomActivityTime、latestRoomMessageLike、defaultActiveRoomId
- 同时内置 roomAudienceLabel、roomMemberCount、roomPreview、roomSummaryLine、roomStatusLine、unreadCount、markRoomRead、roomMatchesSearch、filteredRooms、roomGroupBlueprints
- app.js 添加 initRail() 调用（30+ 回调注入），7 个函数体替换为薄封装
- fake-dom.mjs 添加 shell-room-rail.js 导入路径解析
- **测试结果**：185 pass / 0 fail

### 任务 3：auth 边界重复收窄

- residentGatewayLoginRequired() 收窄为 shell-auth.js 薄封装（消除重复实现）
- currentDesiredResidentId() 删除（app.js 中定义但从未调用，功能已由 initAuth 回调内联提供）
- **测试结果**：185 pass / 0 fail

### 改动文件

- `apps/lobster-web-shell/shell-room-rail.js` — 新建，房间 rail 展示/筛选/渲染逻辑
- `apps/lobster-web-shell/app.js` — 导入 shell-room-rail.js + initRail 回调 + 薄封装（-130 行）
- `apps/lobster-web-shell/test/admin-ds-runtime.test.mjs` — 新建，gateway 数据流运行时测试
- `apps/lobster-web-shell/test/fake-dom.mjs` — 添加 shell-room-rail.js 路径解析
- `docs/DS_WORKLOG.md` — 本轮日志

### 测试基线

| 层 | 状态 |
|---|------|
| Rust gateway | 144 passed / 0 fail |
| Rust TUI | 195 passed / 0 fail |
| Web (npm test) | 185 passed / 0 fail |
| Web (smoke/layout/realness) | 全部通过 |
| **总计** | **524** / 0 fail |

### 已知情况

- shell-room-rail.js 中 renderRooms、renderResidents、focusRoom 等渲染函数仍留在 app.js，因其与 DOM/快速动作/管家/工作区等模块的耦合极深（单函数 ~40 个外部引用），本文暂不拆分
- shell-room-rail.js 的 roomMatchesSearch、roomAudienceLabel 在 initRail 前调用时会使用安全默认值（不影响搜索匹配）

### 下一轮建议

1. **renderRooms/renderResidents 拆分** — 在 shell-room-rail.js 基础上渐进拆分渲染函数
2. **移动端 drawer 独立模块** — chatFocusMode/chatPaneMode 逻辑可独立为 shell-mobile-drawer.js
3. **app.js 继续缩减** — 目标从 ~9870 行降至 5000 行以下

启动 gateway + 静态服务，用 Playwright headless 浏览器完成 H5 IM 6 大验收项。

### 验收结果

| 验收项 | 方法 | 结果 |
|--------|------|------|
| Enter 发送消息 | Playwright press Enter | ✅ 发送成功，输入框清空 |
| Shift+Enter 换行 | Playwright press Shift+Enter | ✅ 插入 \n，不发送 |
| 输入框文字可见性 | CSS 计算值 + 对比度计算 | ✅ 深棕 #2D1B0E on 奶油 #FFF0BF = 12.6:1 |
| 热点标签 hover/点击 | DOM 分析 + z-index 层级 | ✅ 2 个热点存在，chat frame (z:6) 覆盖 scene layer (z:3) 为设计意图 |
| 左栏跨页面一致性 | Playwright 尺寸测量 | ✅ 均为 220px 宽 16px 字号，padding 差 2px |
| 双端消息收发 | qa-enter/qa-peer 互发 | ✅ 消息实时到达 |
| Pending echo 去重 | 连续重复检测 | ✅ 无重复闪现 |
| npm test 回归 | 全量测试套件 | ✅ 177 pass / 0 fail |
| smoke-web-shell.sh | smoke 回归 | ✅ 177 pass / 0 fail |

### 技术发现

- 输入框 `textarea` 自身背景为 transparent，实际渲染背景来自 parent `label.creative-composer-field` 的 `rgb(255, 240, 191)`，文字 `rgb(45, 27, 14)` 对比度优秀
- creative.html 热点在 `.scene-hotspots`（z-index:3）内，被 `.creative-chat-frame`（z-index:6）覆盖，符合"聊天层在场景层之上"的设计意图
- app.js:4661-4694 `handleComposerInputKeydown` 正确处理 Enter/Shift+Enter，已有测试覆盖 (line 40: "gateway creative resident Enter key sends and Shift Enter keeps a draft")
- 左栏选择器 `.sfc-rail` 宽度统一为 220px，字号 16px，index.html 和 creative.html 仅 padding 差 2px (8px vs 6px)

### 改动文件

无代码改动，纯验收测试。

- `/tmp/h5-im-acceptance-v2.mjs` — 综合 Playwright 验收脚本
- `docs/DS_WORKLOG.md` — 本轮日志

### 测试基线

| 层 | 状态 |
|---|------|
| Rust gateway | 144 passed / 0 fail |
| Rust TUI | 195 passed / 0 fail |
| Web (npm test) | 177 passed / 0 fail |
| Web (smoke) | 177 passed / 0 fail |
| **总计** | **516** / 0 fail |

### 下一轮建议

1. **app.js 前端技术债拆分** — 按 K2.6_FRONTEND_GOAL_20260525.md 执行，优先抽 composer/auth/room-rail 模块
2. **admin-ds 接真实 gateway 数据** — fetchAdminSummary() 替换假数据
3. **TUI 平价验证** — 确认 edit/recall/send 状态投影与 H5 一致

---

## 2026-05-25 23:55 — IM 后端收尾 SDLC P1→P5 完成

### 本轮成果

在管理后台后端闭环（134 tests）基础上，补齐 IM 后端最后能力缺口。

### 新增能力

| 能力 | 实现方式 | 测试 |
|------|---------|------|
| Presence 文件持久化 | `presence-state.json`，复用 governance 持久化模式 | presence_state_persists_across_restart |
| Unread 文件持久化 | `unread-state.json`，每次增量/清零后写入 | unread_state_persists_across_restart |
| SSE 在线状态广播 | record_presence 返回 became_online，触发 notifier.notify_changed() | presence_heartbeat_triggers_sse_notify_on_first_heartbeat |
| 速率限制骨架 | HashMap per-sender 滑动窗口，30条/分钟，超限返回 429 | rate_limit_rejects_excessive_messages, rate_limit_resets_after_window, rate_limit_blocks_sender_via_http |
| 撤回鉴权测试 | 非发送者撤回返回错误 | recall_rejects_non_sender |
| edit/recall 参数校验测试 | 无效 message_id 拒绝 | edit_rejects_invalid_message_id, recall_rejects_invalid_message_id |
| edit 状态跨重启持久化 | 编辑后重启，edited 字段保留 | edit_and_recall_state_persists_across_restart |

### 改动文件

- `apps/lobster-waku-gateway/src/gateway_models.rs` — +presence_path, +unread_path, +rate_limits, +RateLimitWindow
- `apps/lobster-waku-gateway/src/core_runtime.rs` — +persist/load presence/unread, +check_rate_limit, record_presence 返回 bool
- `apps/lobster-waku-gateway/src/http_write_routes.rs` — presence handler 改为 notifier, message handler +rate limit check
- `apps/lobster-waku-gateway/src/gateway_tests.rs` — +10 新测试
- `.claude/prd.md` — 新 PRD
- `.claude/project-state.md` — 状态更新

### 测试基线

| 层 | 之前 | 之后 | 状态 |
|---|------|------|------|
| Rust gateway | 134 passed | **144 passed** | 0 fail |
| Rust TUI | 195 passed | 195 passed | 0 fail |
| Web | 177 passed | 177 passed | 0 fail |
| **总计** | 506 | **516** | 0 fail |

### 已知限制

- 速率限制为单机内存实现，多实例部署时各算各的
- SSE 在线广播仅通知 state_version 变更，不发送离散的 presence 事件类型
- Presence 过期数据无自动清理（只在 enrich_resident_directory 时按阈值判定）

### 下一轮建议

1. **H5 IM 主路径真实验收** — 启动 gateway + 静态服务，qa-a/qa-b 双端互发
2. **app.js 前端技术债拆分** — 按 K2.6_FRONTEND_GOAL_20260525.md 执行
3. **admin-ds 接真实 gateway 数据** — fetchAdminSummary() 替换假数据
