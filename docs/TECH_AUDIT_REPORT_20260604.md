# lobster-chat 全面技术审查报告

**审查日期**: 2026-06-04
**审查范围**: 全栈代码、测试、文档、架构合规性
**项目路径**: `/Volumes/AJW-Data/Projects/lobster-chat`
**当前分支**: `codex/creative-pixel-scene-v2`

---

## 一、项目概览

lobster-chat 是一个以 IM 为核心、带像素空间感的城邦式交流系统。当前阶段聚焦**单城邦中心化 IM MVP**，跨城去中心化、MLS 加密、穿戴设备端均为后续演进边界。

**产品最高约束**: Gateway 合同是唯一真源，H5 是当前主入口，TUI 是并行映射客户端。

---

## 二、代码规模统计

### 2.1 后端 (Rust)

| 模块 | 路径 | 文件数 | 代码行数 | 占比 |
|------|------|--------|----------|------|
| Gateway | `apps/lobster-waku-gateway/src/` | 24 | 21,748 | 56.3% |
| TUI | `apps/lobster-tui/src/` | 46 | 11,777 | 30.5% |
| CLI | `apps/lobster-cli/src/` | 1 | 1,590 | 4.1% |
| chat-core | `crates/chat-core/src/` | 1 | 865 | 2.2% |
| chat-storage | `crates/chat-storage/src/` | 1 | 947 | 2.5% |
| transport-waku | `crates/transport-waku/src/` | 1 | 895 | 2.3% |
| crypto-mls | `crates/crypto-mls/src/` | 1 | 456 | 1.2% |
| host-adapter | `crates/host-adapter/src/` | 1 | 290 | 0.8% |
| ai-sidecar | `crates/ai-sidecar/src/` | 1 | 11 | 0.03% |
| **Rust 合计** | | **77** | **38,579** | **100%** |

### 2.2 前端 (Web Shell)

| 模块 | 路径 | 代码行数 | 占比 |
|------|------|----------|------|
| 主入口 app.js | `apps/lobster-web-shell/app.js` | 8,743 | 20.7% |
| 主样式 styles.css | `apps/lobster-web-shell/styles.css` | 17,853 | 42.2% |
| 已拆分 JS 模块 | `shell-*.js` (22 个文件) | 4,910 | 11.6% |
| admin-ds 后台 | `admin-ds.js` | 2,813 | 6.6% |
| admin-ds 数据层 | `admin-ds-data.js` | 92 | 0.2% |
| 预文本舞台 | `pretext-stage.js` | 540 | 1.3% |
| 组合器状态 | `composer-state.js` | 35 | 0.1% |
| HTML 页面 | `*.html` (8 个文件) | 1,658 | 3.9% |
| 拆分 CSS | `styles.*.css` (5 个文件) | 6,216 | 14.7% |
| 测试文件 | `test/*.mjs` (32 个文件) | 12,896 | - |
| **前端 JS 合计** | | **16,548** | - |
| **前端 CSS 合计** | | **24,069** | - |
| **前端总计** | | **42,275** | - |

### 2.3 项目整体

| 类别 | 行数 | 占比 |
|------|------|------|
| Rust 后端 | 38,579 | 47.7% |
| 前端 Web | 42,275 | 52.3% |
| **总计** | **80,854** | **100%** |

---

## 三、各模块完成度百分比

### 3.1 按实施阶段划分 (参照 IMPLEMENTATION_PHASES.md)

| 阶段 | 模块 | 完成度 | 状态说明 |
|------|------|--------|----------|
| **P0** | 单城邦中心化 IM 真闭环 | **92%** | 核心路径已闭环 |
| | 身份与会话可见性 (OTP/bearer/访客) | 100% | 邮箱 OTP、token 失效回登录态 ✅ |
| | 真实消息链路 (send/edit/recall/retry/export) | 95% | 全部走 Gateway，pending echo 可替换 ✅ |
| | 居民目录与个人房间入口 | 90% | 搜索、头像入口、私聊确认 ✅；房间自定义层预留 |
| | 公共房间 (主城/世界广场只读) | 90% | 分层清晰，世界广场只读入口 ✅ |
| | 在线状态与未读 (heartbeat/已读/unread_count) | 100% | 120s 阈值、标记清零、字段推送 ✅ |
| | 管理后台系统状态 (admin summary) | 100% | 居民/房间/消息计数、在线数、运行时长 ✅ |
| **P1** | 空间房间与交互完善 | **40%** | 合同预留，渲染部分实现 |
| | Gateway-owned room config (image/hotspot layer) | 30% | 合同字段预留，scene_render 输出框架 ✅ |
| | 房间编辑器 MVP | 10% | 仅预留数据模型，无编辑 UI |
| | 场景交互验收 (hover/清屏/标签) | 80% | 热点 hover 显示、清屏模式、标签可见性 ✅ |
| **P2** | 后台与运维可用 | **65%** | 读侧完整，写操作部分接入 |
| | DeepSeek 版 admin-ds 视觉基线 | 70% | 表格、分页、加载态、空态 ✅；部分按钮仍 disabled |
| | 后台只读 projection | 80% | 居民/房间/消息/日志/系统配置读侧 ✅ |
| | 管理操作 (权限/禁用/审计) | 40% | 消息审核写操作 ✅；居民封禁/房间冻结接口有但前端未全接 |
| **P3** | 技术债压降与工程鲁棒性 | **60%** | 持续进行中 |
| | app.js 拆分 | 60% | 9,847 -> 8,743 (-1,104)，22 个独立模块已抽出 |
| | CSS 拆分 | 40% | 5 个拆分样式文件已创建，styles.css 仍 17,853 行 |
| | 测试覆盖 | 85% | 全栈 1,148 测试 0 fail，但端到端浏览器自动化仍需加强 |
| **P4** | TUI/CLI parity | **85%** | 合同消费基本完成 |
| | TUI 映射 conversation_shell/scene_render | 85% | 消费同一合同，本地命令不写 gateway ✅ |
| | CLI 命令行通道 | 90% | 可供 OpenClaw/Codex/Claude Code 复用 ✅ |
| | edit/recall/send/export 状态一致性 | 85% | H5/TUI 语义基本一致 |
| **P5** | 真实 transport/加密/跨城 | **15%** | 架构预留，未进入实质开发 |
| | 真实 Waku/远程 gateway | 20% | upstream-gateway-url 配置存在，协议合同定义完整 |
| | MLS 加密 | 15% | crypto-mls crate 仅 456 行，骨架级 |
| | 跨城/去中心化 | 10% | 世界目录、世界广场协议预留，联邦读取端点存在 |

### 3.2 按技术层划分

| 技术层 | 完成度 | 评估依据 |
|--------|--------|----------|
| **Gateway HTTP API** | 90% | 读端点完整，写端点覆盖消息审核/系统配置/居民创建，缺房间冻结前端接入 |
| **身份认证 (Auth)** | 95% | OTP 邮箱登录、bearer 会话、访客模式完整 |
| **消息系统 (Messaging)** | 92% | send/edit/recall/retry 闭环，pending echo 正确，export 存在 |
| **居民目录 (Directory)** | 90% | 搜索、在线状态、头像、enrich 字段完整 |
| **房间系统 (Rooms)** | 75% | 公共房间/私聊房间完整，房间配置 layer 预留 |
| **在线状态 (Presence)** | 100% | heartbeat、阈值判定、未读标记完整 |
| **管理后台 (Admin)** | 65% | admin-ds 读侧完整，写操作部分接入 |
| **像素场景 (Scene)** | 70% | 三层渲染、热点交互、清屏模式基本可用 |
| **前端工程 (Frontend)** | 65% | 模块拆分进行中，app.js 仍需继续减负 |
| **TUI 客户端** | 85% | 合同消费正确，功能映射完整 |
| **CLI 工具** | 90% | 命令行通道稳定，测试覆盖 |
| **Waku Transport** | 20% | 协议定义完整，真实网络集成未启动 |
| **MLS 加密** | 15% | crate 存在，实质实现为骨架 |
| **AI Sidecar** | 10% | 仅占位，未进入开发 |
| **跨城联邦** | 15% | 世界目录/广场协议预留，联邦读取端点存在 |

---

## 四、测试基线

### 4.1 当前测试通过情况 (2026-06-04 实测)

| 测试套件 | 通过 | 失败 | 总计 |
|----------|------|------|------|
| Gateway (`cargo test -p lobster-waku-gateway`) | 231 | 0 | 231 |
| TUI (`cargo test -p lobster-tui`) | 212 | 0 | 212 |
| CLI (`cargo test -p lobster-cli`) | 28 | 0 | 28 |
| Web Shell (`npm test`) | 677 | 0 | 677 |
| **全栈合计** | **1,148** | **0** | **1,148** |

### 4.2 测试类型分布

| 类型 | 数量 | 说明 |
|------|------|------|
| Gateway 单元/集成测试 | 231 | Rust 内联测试，覆盖 HTTP 端点、状态机、合同边界 |
| TUI 单元/集成测试 | 212 | Rust 内联测试，覆盖渲染、传输、命令解析 |
| CLI 单元测试 | 28 | Rust 内联测试，覆盖命令构建、输出格式化 |
| Web 单元测试 | 677 | Node.js test runner，覆盖纯函数、DOM 模型、静态约束 |
| Layout 验证 | - | 4 个页面尺寸校验 (rail/stage 对齐) |
| Realness 验证 | - | composer、hotspot、shared scene rails、day/night、admin 通过 |

---

## 五、技术债务与风险

### 5.1 高风险

| 风险项 | 影响 | 建议 |
|--------|------|------|
| `app.js` 8,743 行 | 单文件过大，改动易引入回归 | 继续按 FRONTEND_DEBT_REDUCTION_PLAN 拆分，目标 < 5,000 行 |
| `styles.css` 17,853 行 | 样式耦合严重，跨页面不一致风险 | 加速 CSS 拆分，按 tokens/base/scene/chat/world/admin 分文件 |
| 消息审核状态内存存储 | 重启后审核记录丢失 | 已部分解决 (2026-06-02 加入 `moderation-state.json` 持久化) |
| admin-ds 写操作覆盖不足 | 居民封禁/房间冻结仍 disabled | 优先接入 `POST /v1/admin/residents/ban` 和房间冻结前端 |

### 5.2 中风险

| 风险项 | 影响 | 建议 |
|--------|------|------|
| 多页面左栏一致性 | creative/index/unified/world-square 左栏曾不一致 | 已统一 220px，但需持续维护 |
| 房间配置 (image_layer/hotspot_layer) | 合同预留但无实质编辑器 | 先补 Gateway 合同字段，再建最小编辑器 MVP |
| TUI 视觉降级 | 场景渲染在终端下可能退化不完整 | 补充终端 smoke 测试 |
| Waku/MLS 骨架代码 | 长期未动可能腐烂 | 定期编译检查，保持接口同步 |

### 5.3 低风险/已控制

| 风险项 | 状态 |
|--------|------|
| 前端状态绕过 Gateway | 已审计：无 `state.rooms.push()` 等绕过路径 |
| 假成功态 | 已审计：H5 不伪造 send 成功，pending 可被 committed 替换 |
| 本地 Storage 缓存权限 | 已审计：无 localStorage 缓存房间权限或身份 |
| 测试回归 | 1,148 测试 0 fail，基线稳定 |

---

## 六、架构合规性审查

### 6.1 产品宪章 (PRODUCT_CHARTER.md) 合规

| 原则 | 状态 | 说明 |
|------|------|------|
| 聊天优先 | 合规 | IM 主路径已闭环，场景为第二层 |
| 同窗不同权 | 合规 | 居民/城主共用同一窗口骨架 |
| 城市公共页优先 | 合规 | 默认首页为城市公共聊天室 |
| 单城邦中心化先落地 | 合规 | MVP 明确不扩张跨城网络 |
| Gateway 合同是真源 | 合规 | H5/TUI 均消费正式合同 |
| AI 是居民不是上帝 | 合规 | AI sidecar 为可选插件 |

### 6.2 实施阶段 (IMPLEMENTATION_PHASES.md) 合规

| 阶段 | 状态 | 说明 |
|------|------|------|
| P0 单城邦 IM 闭环 | 已完成 (92%) | 核心路径已验收 |
| P1 空间房间 | 进行中 (40%) | scene_render 合同已输出，编辑器未建 |
| P2 后台运维 | 进行中 (65%) | admin-ds 为正式方向 |
| P3 技术债 | 进行中 (60%) | 模块拆分持续进行 |
| P4 TUI/CLI parity | 接近完成 (85%) | 合同消费一致 |
| P5 真实 transport/加密 | 未启动 (15%) | 按规划后置 |

---

## 七、文档状态

| 文档 | 路径 | 状态 | 说明 |
|------|------|------|------|
| 产品宪章 | `docs/PRODUCT_CHARTER.md` | 最新 | 2026-04-15 重置版 |
| 实施阶段 | `docs/IMPLEMENTATION_PHASES.md` | 最新 | 含 P0-P5 详细规划 |
| 活跃工作队列 | `docs/ACTIVE_WORK_QUEUE.md` | 最新 | 2026-06-03 更新 |
| 前端技术债计划 | `docs/FRONTEND_DEBT_REDUCTION_PLAN.md` | 最新 | 拆分顺序明确 |
| H5 规划 | `docs/H5_SHELL_PLAN.md` | 最新 | 投影层设计 |
| 空间场景模型 | `docs/SPATIAL_SCENE_MODEL.md` | 最新 | 三层渲染合同 |
| Waku Gateway 协议 | `docs/WAKU_GATEWAY_PROTOCOL.md` | 最新 | 传输边界定义 |
| 世界/城邦模型 | `docs/WORLD_CITY_MODEL.md` | 最新 | 社会模型定义 |
| 后台重构方向 | `docs/admin-refactor-direction.md` | 最新 | admin-ds 为正式方向 |
| DS v4 Pro 交接 | `docs/DS_V4_PRO_CC_HANDOFF_20260525.md` | 最新 | 含详细任务边界 |
| Web 验收 | `docs/WEB_SHELL_ACCEPTANCE.md` | 需检查 | 路径可能需同步 |
| Admin 功能目录 | `docs/ADMIN_FUNCTION_CATALOG.md` | 需检查 | 可能需同步 |

---

## 八、近期提交历史

```
e369f01 test: Gateway tests 190/0 (+11 new endpoint smoke tests)
d668949 feat: create-resident endpoint + wire button
475dbed feat: batch-approve messages + clear processed logs
232914c feat: Phase 1-4 completion — Gateway write endpoints, admin-ds buttons, zero warnings
c971954 chore: sync gitignore with export repo
b902bc4 chore: scrub personal paths, IPs, and author info before open-source push
e74599e feat: admin message moderation + app.js safe extraction (Round 18-19)
59f789e fix: remove mobile viewport guard on Enter key, always send on Enter
7a67553 feat: add gateway restart script, update gitignore
4d91bfa chore: snapshot lobster chat current working state
```

**近 10 次提交趋势**: 后端 API 扩展 (create-resident, batch-approve, moderation) + 前端安全拆分 + 测试补强。

---

## 九、关键文件清单

### 9.1 Gateway 核心

| 文件 | 职责 | 行数 |
|------|------|------|
| `gateway_models.rs` | 合同模型定义 | 1,762 |
| `core_runtime.rs` | 核心运行时状态 | 1,356 |
| `shell_runtime.rs` | Shell 状态管理 | 1,332 |
| `http_write_routes.rs` | HTTP 写端点 | 1,193 |
| `auth_runtime.rs` | 身份认证运行时 | 820 |
| `http_read_routes.rs` | HTTP 读端点 | 622 |
| `gateway_tests.rs` | 内联测试 | 9,038 |
| `http_router.rs` | 路由注册 | 246 |

### 9.2 前端核心

| 文件 | 职责 | 行数 |
|------|------|------|
| `app.js` | 主入口 (仍需拆分) | 8,743 |
| `styles.css` | 主样式 (仍需拆分) | 17,853 |
| `shell-quick-action-preview.js` | 预览模型 (已拆分) | 1,679 |
| `shell-room-rail.js` | 房间栏渲染 (已拆分) | 565 |
| `shell-composer.js` | 输入组合器 (已拆分) | 525 |
| `shell-scene-runtime.js` | 场景运行时 (已拆分) | 290 |
| `admin-ds.js` | DeepSeek 后台 | 2,813 |
| `admin-ds-data.js` | 后台数据/标签 | 92 |

### 9.3 TUI 核心

| 文件 | 职责 |
|------|------|
| `terminal_app_loop.rs` | 主应用循环 |
| `terminal_shell_dispatch.rs` | Shell 命令分发 |
| `shell_layout.rs` | 布局管理 |
| `transcript_panel.rs` | 消息面板渲染 |
| `nav_panel.rs` | 导航面板 |
| `scene_panel.rs` | 场景面板 |
| `transport_sync.rs` | 传输同步 |

---

## 十、下一步建议 (按优先级)

### 10.1 P0 优先级 (本周)

1. **admin-ds 居民封禁/房间冻结写操作接入**
   - 后端接口 `POST /v1/admin/residents/ban` 已存在
   - 前端按钮当前 disabled，需接入真实调用

2. **app.js 继续安全拆分**
   - 目标：roomMatchesSearch (64 行) 及依赖函数提取
   - 每次提取后跑 `npm test` 确认 677 测试通过

### 10.2 P1 优先级 (近期)

3. **CSS 拆分加速**
   - 从 `styles.css` 17,853 行中抽出 `styles.tokens.css` 和 `styles.base.css`
   - 按页面按需加载

4. **房间配置合同补厚**
   - `image_layer` + `hotspot_layer` 进入 `scene_render` 正式输出
   - H5 渲染层消费 Gateway 配置而非写死

5. **端到端浏览器自动化**
   - 补充 Playwright smoke 覆盖双端互发、断线重连、未读标记

### 10.3 P2 优先级 (中期)

6. **TUI 场景渲染增强**
   - 像素场景在终端下的符号降级渲染

7. **真实 Waku  provider 评估**
   - 调研 nwaku/go-waku 作为 upstream gateway 的可行性

8. **MLS 加密骨架激活**
   - 1v1 conversation bootstrap 和加密 payload 边界

---

## 十一、总结

| 维度 | 评分 | 说明 |
|------|------|------|
| **单城邦 IM 可用性** | A (92%) | 核心聊天主路径已闭环，可真实使用 |
| **测试覆盖** | A (1,148/0) | 全栈测试全部通过，基线稳定 |
| **架构合规** | A | 符合产品宪章全部约束 |
| **前端工程** | B+ (65%) | 模块拆分显著进展，app.js/styles.css 仍需继续减负 |
| **后台完整度** | B (65%) | 读侧完整，写操作覆盖消息审核/系统配置，居民封禁/房间冻结待接入 |
| **场景系统** | B (70%) | 三层渲染基本可用，房间编辑器未启动 |
| **TUI/CLI** | A- (85%) | 合同消费正确，parity 接近完成 |
| **Transport/加密** | D (15%) | 架构预留充分，实质实现后置 |
| **文档完整性** | A- | 核心文档齐全，部分验收文档需同步 |

**总体判断**: lobster-chat 已达到**单城邦中心化 IM 真实可用**阶段。P0 核心目标基本完成，当前最紧迫的是继续前端技术债压降 (app.js/CSS 拆分) 和 admin-ds 写操作补全。P5 的跨城/加密按规划正确后置，不阻塞主线。
