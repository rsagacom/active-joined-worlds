# app.js 拆分审计报告

> 生成日期：2026-05-27  
> 基准：app.js 9,879 行（已拆分 13 个模块）

## 1. 当前状态

### 1.1 app.js 规模
- **行数**：9,879 行
- **函数/渲染器**：20 个 render 函数（renderRooms, renderTimeline, renderGovernance 等）
- **全局状态**：state.rooms, activeRoomId, roomFilter, roomSearch, gatewayUrl, roomSendErrors 等

### 1.2 已拆出模块（13 个，含 HTML/CSS）
| 模块 | 文件 | 大小 | 职责 |
|------|------|------|------|
| composer-state | composer-state.js | 1KB | 输入框可用性计算 |
| shell-errors | shell-errors.js | 1.4KB | Gateway 错误消息本地化 |
| shell-gateway | shell-gateway.js | 1.7KB | Gateway URL 解析与 SSE 端点 |
| shell-labels | shell-labels.js | 4.3KB | 所有翻译/标签枚举 |
| shell-message-state | shell-message-state.js | 1.3KB | pending echo 与 committed 去重 |
| shell-scene-runtime | shell-scene-runtime.js | 9.7KB | 像素场景运行时 |
| shell-auth | shell-auth.js | 10.5KB | 登录认证 (OTP/Session) |
| shell-room-profiles | shell-room-profiles.js | 1.8KB | Room profile 投影提取 |
| shell-shared | shell-shared.js | 6KB | 存储/ShellMode/Provider 等共享工具 |
| shell-scene-hotspots | shell-scene-hotspots.js | 2.7KB | 场景热点 spec 计算 |
| pretext-stage | pretext-stage.js | 16.7KB | 舞台/肖像 Pretext 渲染 |
| shell-room-rail | shell-room-rail.js | 17.6KB | **房间列表数据层**（本轮重点） |
| shell-composer | shell-composer.js | 18KB | 输入框组件 |

### 1.3 shell-room-rail.js 已承接内容

#### 依赖注入入口
- `initRail(elMap, cbs)` — 注入 DOM refs 和 40+ 回调函数

#### 纯数据 helper（24 个 export）
| 函数 | 类型 | 说明 |
|------|------|------|
| `roomKind(room)` | pure | dm:/room: → direct/public/system |
| `badgeToken(value, fallback)` | pure | 头像 token 提取 |
| `roomDisplayPeer(room)` | pure* | 对方显示名（需 getCurrentIdentity） |
| `roomThreadHeadline(room)` | pure* | 线程标题（需 getShellPage） |
| `roomAudienceLabel(room)` | **简化版** | 听众标签（无 governance 访问） |
| `roomMemberCount(room)` | pure* | 成员计数（需 getCurrentIdentity） |
| `roomActivityTime(room)` | pure* | 活动时间（需 visiblePendingEchoesForRoom） |
| `latestRoomMessageLike(room)` | pure* | 最后消息（需 visiblePendingEchoesForRoom） |
| `roomPreview(room)` | pure* | 预览文本（需 resolveRoomQuickPreview 等 3 个回调） |
| `roomSummaryLine(room)` | pure* | 摘要行（需 6 个回调） |
| `roomStatusLine(room)` | pure* | 状态行（需 roomRouteLabel, roomLastActivity） |
| `unreadCount(room)` | pure* | 未读计数（需 getRoomReadMarkers） |
| `markRoomRead(roomId)` | impure | 更新已读标记（需 persistRoomReadMarkers） |
| `defaultActiveRoomId(rooms)` | pure | 默认活跃房间选择 |
| `roomMatchesSearch(room, query)` | pure | 搜索匹配 |
| `filteredRooms(rooms, filter, search)` | pure | 筛选+搜索组合 |
| `roomGroupBlueprints(...)` | pure | 房间分组排序 |
| `createRoomUnreadBadgeNode(unread)` | DOM工厂 | 创建未读 badge 元素 |
| `roomAvatarSpec({room,kind,shellPage,headline})` | data spec | 头像规格 |
| `roomButtonClassSpec({roomId,activeRoomId,unread,kind})` | data spec | 按钮 class 规格 |
| `roomTitleStackSpec(room, kicker)` | data spec | 标题栈规格 |
| `roomTopMetaSpec({room,kind,kindPillLabel,activeRoomId,unread,shellPage})` | data spec | 顶部 meta 规格 |

\* pure* = 逻辑是纯的，但内部读取模块级 `_callbacks`（由 initRail 注入）

## 2. renderRooms() 剩余职责分析

### 2.1 当前结构（约 195 行，L6377-L6570）

```
renderRooms()
├── 统计计算 (L6383-6397) — unreadTotal, draftTotal, followUpTotal
├── 工具栏更新 (L6400-6429) — roomToolbarNoteEl 文本拼接
├── 空状态渲染 (L6431-6438) — 无房间时的 empty-note
├── Group 迭代 (L6441-6568)
│   ├── Section header 渲染 (L6444-6451)
│   └── Room item 渲染 (L6456-6564)
│       ├── button + class spec ← roomButtonClassSpec ✅
│       ├── click 事件绑定 → focusRoom + re-render
│       ├── avatar + resident entry 事件 ← roomAvatarSpec ✅
│       ├── title stack ← roomTitleStackSpec ✅
│       ├── unread badge
│       ├── meta stack ← roomTopMetaSpec ✅
│       ├── createRoomPreviewNode(room)  ← DOM 工厂，未拆
│       ├── tag row (actionPill, previewPill, draft, pending, sendError, caretaker, scene_banner)
│       ├── inline actions
│       ├── roomSummaryLine(room) ← 已委托 rail
│       └── roomStatusLine(room) ← 已委托 rail
└── ensureRoomQuickActions() (L6569)
```

### 2.2 可安全继续拆的纯 helper

| 优先级 | 目标 | 风险 | 预估改动 |
|--------|------|------|---------|
| 低 | `roomTagRowSpec(room)` — 把 tag row 的 pill 判断逻辑抽成 data spec | 低 | ~40 行 |
| 低 | `roomToolbarNoteSpec(...)` — 工具栏文本拼接抽纯函数 | 低 | ~30 行 |
| 低 | `roomStatsSpec(rooms)` — unreadTotal/draftTotal/followUpTotal 统计 | 低 | ~20 行 |

这些都可以写成纯 object→object 的函数，遵循与前三步完全相同的 thin-wrapper 模式。

### 2.3 不能拆的职责（强依赖 DOM / 事件 / 全局状态）

| 职责 | 原因 |
|------|------|
| 整个 renderRooms 循环体 | 包含 click 事件绑定 → focusRoom + re-render |
| avatar 的 resident-room-entry click | 事件 → confirmResidentRoomJump |
| createRoomPreviewNode(room) | DOM 工厂，依赖 createLine, createPill |
| createRoomQuickActionPill / PreviewPill / InlineActions | DOM 工厂，依赖 gateway 数据投影 |
| ensureRoomQuickActions() | 需要操作已渲染 DOM |
| 空状态渲染分支 | 依赖 gatewayUrl 判断文案 |
| 所有 `createElement` / `appendChild` 序列 | DOM 操作，不是数据 spec |

**核心约束**：任何包含 `addEventListener`、`createElement`、`appendChild` 的代码块都不适合作为纯 helper 提取。纯 helper 只返回 plain object/string/number。

### 2.4 架构约束：governance 依赖

`roomAudienceLabel` 是 shell-room-rail.js 与 app.js 的关键差异点：
- **app.js 版本** (L5092)：有完整的 governance 访问 — `publicRoomRecordForConversation()`, `cityStateForConversation()`, `worldDirectoryCity()`，能返回 `"跨城共响回廊 · general"` 这类城市名+频道名
- **shell-room-rail.js 版本** (L141)：简化 fallback — 只能返回 `"3 名成员"`

`roomTitleStackSpec` 已通过 `kicker` 参数注入解决了这个问题（app.js 调用 `roomTitleStackSpec(room, roomAudienceLabel(room))` 传入 governance 版本）。未来任何涉及 `roomAudienceLabel` 的提取都要注意这个注入模式。

## 3. test/fake-dom.mjs 的 import 替换机制

### 3.1 为什么需要 fake-dom.mjs

测试环境是 Node.js，import 语句中的相对路径 `./shell-room-rail.js` 需要用 `file://` 绝对路径替换才能被 Node.js ESM loader 解析。

fake-dom.mjs 使用 `.replace()` 链将 app.js 源码中的相对 import 替换为绝对 `file://` URL：

```javascript
const url = pathToFileURL(path.join(WEB_SHELL_ROOT, moduleName)).href;
source.replace(`from "./${moduleName}"`, `from "${url}"`);
```

### 3.2 为什么每次添加新 import 都必须更新 fake-dom.mjs

当 app.js 的 import 语句中新增了从 shell-room-rail.js（或其他模块）导入的符号时：

1. **旧的 `.replace()` 不再匹配** — 替换用的 `oldString` 是完整的 import 语句文本，新增的导出符号改变了文本，导致 `.replace()` 静默失败
2. **结果** — 测试加载 app.js 时会尝试 `import { roomTopMetaSpec } from "./shell-room-rail.js"`，Node.js 无法解析相对路径，测试报错

### 3.3 当前状态

fake-dom.mjs 已随 Phase 1 三步同步更新，两个 import 替换块都包含完整的 14 个导出符号列表。不需要额外修改。

如果未来继续从 shell-room-rail.js 添加 import，必须同步更新 fake-dom.mjs 中 **两处**（旧路径字符串和新 `file://` 路径字符串）的导入符号列表。

## 4. 下一步建议

### 4.1 拆分风险评估

| 风险等级 | 操作 | 说明 |
|----------|------|------|
| **低风险** | 提取纯 data spec（如 roomTagRowSpec, roomToolbarNoteSpec） | 与前三步相同模式，零 DOM 零事件，改动 < 60 行/步 |
| **中风险** | 提取 DOM 工厂函数（如 createRoomPreviewNode） | 需要 fake-dom 覆盖，可能影响 6+ 测试 |
| **高风险** | 迁移 renderRooms 整体到独立模块 | 涉及事件绑定、DOM refs、状态闭包、initRail 重构，影响面极大 |
| **高风险** | 分拆 renderTimeline / renderGovernance 等大函数 | 每个 200-400 行，内部依赖复杂，测试覆盖验证成本高 |

### 4.2 明确建议

**当前不继续拆 renderRooms。** 原因：

1. Phase 1 的三个 data spec 提取已完成纯函数的低垂果实。剩余可拆内容 ROI 降低。
2. `roomTagRowSpec` 涉及 7 种 pill 条件判断（draft/pending/sendError/caretaker/scene_banner/action/preview），每种依赖不同回调，边际收益小。
3. app.js 目前减少仅 3 行，说明 import 语句增量和代码缩减几乎持平，继续拆纯 helper 不会显著缩小 app.js。

**建议切换到功能开发**，在真实需求中自然推动模块化：
- 新功能优先放在独立模块（沿用 composer-state.js / shell-auth.js 模式）
- 遇到需要修改 renderRooms 的需求时，顺便评估是否有可提取的纯 helper
- 如果要继续拆分，优先级最高的目标是 **renderTimeline**（~450 行），但它需要先补测试覆盖

### 4.3 如果必须继续拆

推荐顺序（由易到难）：
1. `roomStatsSpec(rooms)` — 最安全，纯统计函数
2. `roomEmptyStateSpec(gatewayUrl)` — 空状态文案
3. `roomTagRowSpec(room, ...)` — 需要传入 5+ 个 callback 结果，参数较多
4. `createRoomPreviewNode` → shell-room-rail.js — 需要处理 fake-dom 兼容

## 5. shell-room-rail.js 可维护性风险（子 agent 审查）

> 审查日期：2026-05-27 | 审查方式：只读 Explore 子 agent

### 5.1 模块级可变全局状态（_els, _callbacks, L7-8）
- `_els` 和 `_callbacks` 是模块作用域可变单例，通过 `initRail()` 注入
- 几乎每个导出函数都隐式读取这些全局变量
- 测试之间存在状态泄漏风险，无法并行运行
- `_callbacks` 承载 40+ 回调，所有回调有静默 no-op 兜底，遗漏回调时难以察觉

### 5.2 roomMatchesSearch 硬编码字段枚举（L289-336）
- 手动枚举 ~30 个字段拼成 haystack 数组
- 新增/修改 Room 数据模型字段时必须同步更新此函数
- 每次搜索调用创建多个中间数组（detailMeta, workflowSteps, inlineActions）
- 建议用白名单或 schema-based 遍历替代硬编码

### 5.3 roomGroupBlueprints 魔数 + joinOrFallback 重复（L352-387）
- L357-360：房间优先级加权值 100/24/12/8 无注释说明含义
- `joinOrFallback` 默认值在 `roomSummaryLine`(L228) 和 `roomStatusLine`(L240) 重复定义
- 建议提取为模块级常量/工具函数

## 6. admin-ds.js Gateway 接入缺口（子 agent 审查）

> 审查日期：2026-05-27 | 审查方式：只读 Explore 子 agent

### 6.1 真实 Gateway 数据
- `loadGatewayAdminData()` (L262-293) 通过 GET `/v1/residents` + GET `/v1/shell/state` 拉取真实数据
- 驱动 residents/rooms/messages 三个表格 + 仪表盘统计

### 6.2 仍为 Mock/占位
| 模块 | 状态 | 位置 |
|------|------|------|
| 邀请码表格 | 纯 `window.__ADMIN_DS_DATA__.inviteCodes` Mock | L952-989 |
| 日志与告警 | 纯 `window.__ADMIN_DS_DATA__.logs` Mock | L994-1061 |
| 消息上下文 | 硬编码 zhanglaosan/limei/wangdana | L772 |
| 房间分类筛选 | 硬编码 3 个房间名映射 | L804-806 |
| 系统配置模块 | 完全占位，无渲染函数 | - |

### 6.3 全部写操作缺失（13 处 markUnavailableButton）
- 禁用/恢复居民、通过/屏蔽消息、标记已处理、作废邀请码
- 新建居民、批量审核、新建权限组、生成邀请码、清空日志
- 分页按钮全部 disabled (L1134)
- **零 POST/PUT/DELETE 请求**

### 6.4 核心缺口 TOP 5
1. 全部 CRUD 写操作为零 — 管理员只能看不能做
2. 分页完全不存在 — 数据量大时页面不可用
3. 消息上下文是假数据 — 无法做真实审核决策
4. 日志和邀请码纯 Mock — 无 Gateway 数据路径
5. 系统配置模块是空壳 — 无渲染函数、无数据加载

## 7. app.js 高风险重复逻辑（子 agent 审查）

> 审查日期：2026-05-27 | 审查方式：只读 Explore 子 agent

### 7.1 Form submit 事件监听重复（~L9360-9538）
10+ 处几乎相同的 submit 处理器：cityCreateFormEl, cityJoinFormEl, roomCreateFormEl, directOpenFormEl 等。每个都重复 preventDefault → querySelector("button") → disabled → try/catch → finally。auth 两个表单多一步 persistAuthDraft()，极易在批量修改时遗漏。

### 7.2 refreshButton + exportButton + worldButton 创建模式重复（~L6718, L6807, L7112）
三个函数中重复相同的按钮创建逻辑：refreshButton.disabled = !gatewayUrl, exportButton.disabled = !gatewayUrl || !activeRoomId, addEventListener click → refreshFromGateway()。重构时三处必须同步修改。

### 7.3 Storage key / load / persist 函数群重复（~L1498-1584）
6 个 storage key 函数结构完全相同，仅字符串不同。4 对 load/persist 函数全是 parseStoredObject(safeLocalStorageGet(...)) 副本。新增存储字段需同时改 3 个函数。

### 7.4 quickAction* switch-on-action 重复（~L1842-1984）
5 个函数共用同一个 switch(action)，分支为 6 个中文常量（"整理"、"留条"、"委托"、"交易"、"续聊"、"私聊"）。新增动作类型须全部 5 处同步更新，字符串无编译期检查。

### 7.5 Fetch URL 模板 `${gatewayUrl}/v1/...` 分散
至少 7 个函数中散落 URL 构造。gatewayUrl 路由前缀变更时，每一处都需单独定位修改。

## 8. 下一轮优先级清单

基于以上审查，建议下一轮优先级：

### P0 — 真实可用性
1. admin-ds.js：接入至少一个写操作（如通过/屏蔽消息），打通端到端管理链路
2. admin-ds.js：替换消息上下文假数据为真实 Gateway 数据
3. creative.html：确认用户左栏/房间入口的真实 IM 缺口并修复

### P1 — 边界加固
4. admin-ds.js：接入分页（GET 参数 + 渲染）
5. admin-ds.js：日志模块接入真实 Gateway 数据

### P2 — 技术债治理
6. app.js：提取 roomStatsSpec/roomEmptyStateSpec（低风险）
7. shell-room-rail.js：提取 joinOrFallback 统一默认值
8. app.js：统一 storage key 生成模式
