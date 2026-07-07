# lobster-chat Active Work Queue

Last updated: 2026-07-07

## 2026-07-07 进度收口: 6-26~28 WIP 提交 + 继续减债

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 6-26~28 WIP 提交 | 已完成 | commit 298758e：私宅访问确权+好友关系流+前端纯状态下沉（35 文件 +3628/-284），此前停留工作树未提交 |
| 测试基线复验 | 已通过 | Gateway 274 passed/0 fail/0 warn；web-shell 1185 tests/0 fail（unit+layout+realness） |
| 主题实验隔离 | 已保留 | neon-pixel 主题/mockup/private-room-alt01 素材未接入页面，留作 untracked，不入主线提交 |

### 当前真实进度

| 模块 | 估算 | 说明 |
| --- | ---: | --- |
| P0 单城 IM 闭环 | 99% | 私宅主客访问确权+好友关系流已提交，剩余仅上线环境复验 |
| P1 空间交互 | 82% | 场景编辑器/移动端仍有 polish 空间 |
| P2 后台运维 | 93% | admin-ds 设备/场景/写操作护栏已接入 |
| P3 技术债 | 74% | app.js 9342 行（目标<8700），最大剩余债 |
| P4 TUI/CLI parity | 95% | 后续以 release smoke 复验为主 |
| P5 跨城/加密 | 15% | 后置 |

### 下一步

继续 app.js TDD 减债（9342→<8700）：优先抽 userDetailCard 投影纯模型、renderRoomStagePortrait 内联计算、shellMode 视图状态等低风险纯函数，每次配套 node --test。

## 2026-07-07 续: app.js TDD 减债推进

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| userDetailCard 投影下沉 | 已完成 | commit 22d60b9：6 内联函数 → shell-user-detail-card.js *ForState 注入式纯函数，+15 单测，app.js -65 行 |
| conversationCallout 文案下沉 | 已完成 | commit ef93132：3 内联模型 → shell-conversation-callout.js *ForState，+10 单测，app.js -53 行 |
| app.js 累计 | 9342→9224 | 两轮减债 -118 行；npm test 全绿（1185 unit + layout + realness） |
| 交付完整性 | 已完成 | README 进度章节更新到 7-07（Gateway 274/Web 1185）；CHANGELOG.md 创建；CI 覆盖三端确认 |

### 下一步

剩余 app.js 候选：消息动作 payload/guard（小）、shellMode 视图状态文案（小）、Quick-action 读取器（大但循环依赖复杂，需谨慎评估）。app.js 大量剩余是 DOM 编排+全局状态管理，纯函数拆分边际递减；P3 目标 <8700 行在 6-26~28 新增私宅/好友功能后需重新评估合理性。建议转向端到端 smoke 复验与上线环境真实可用性验证（P0 最后一公里）。

## 2026-06-28 P3 技术债推进: 直聊打开请求状态纯模型下沉

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| app.js 降债 | 已完成 | `openDirectSession()` 不再内联 trim / 空居民 / 自聊校验和 `/v1/direct/open` payload 拼装，改为消费 `directSessionOpenRequestState()` |
| Gateway 合同 | 保持不变 | 实际 `POST /v1/direct/open`、表单 reset、focus room、刷新 Gateway 投影仍由 `app.js` 编排，H5 不新增私聊会话真值 |
| 请求状态 | 已覆盖 | `directSessionOpenRequestState()` 统一产出 offline / empty-peer / self / allowed 请求状态，并保留既有私聊打开与就绪文案 |
| 防回归测试 | 已完成 | `shell-governance-render.test.mjs` 覆盖 direct open 状态；`shell-pages-static.test.mjs` 锁定 app.js 通过 helper 消费直聊请求模型 |

### 验证

```bash
node --test apps/lobster-web-shell/test/shell-governance-render.test.mjs --test-name-pattern "directSessionOpenRequestState"
node --test apps/lobster-web-shell/test/shell-pages-static.test.mjs --test-name-pattern "direct session open"
node --test apps/lobster-web-shell/test/fake-dom-import-rewrite.test.mjs
```

## 2026-06-28 P3 技术债推进: 好友关系提交状态纯模型下沉

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| app.js 降债 | 已完成 | `submitResidentRelationshipAction()` 不再直接判断 `model.endpoint` / `model.payload` 和无网关状态，改为消费 `residentRelationshipSubmitRequestState()` |
| Gateway 合同 | 保持不变 | 实际 `POST /v1/resident-relationships/request|accept`、Bearer session、刷新 Gateway 投影仍由 `app.js` 编排，H5 不新增好友关系真值 |
| 提交状态 | 已覆盖 | `residentRelationshipSubmitRequestState()` 统一产出 noop / offline / allowed 请求状态，并保留申请、接受、默认更新成功文案 |
| 防回归测试 | 已完成 | `shell-governance-render.test.mjs` 覆盖提交状态；`shell-pages-static.test.mjs` 锁定 app.js 通过 helper 消费关系提交模型 |

### 验证

```bash
node --test apps/lobster-web-shell/test/shell-governance-render.test.mjs --test-name-pattern "residentRelationship"
node --test apps/lobster-web-shell/test/shell-pages-static.test.mjs --test-name-pattern "resident relationship"
node --test apps/lobster-web-shell/test/fake-dom-import-rewrite.test.mjs
```

## 2026-06-28 P3 技术债推进: 私宅策略提交闸门纯状态下沉

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| app.js 降债 | 已完成 | `submitPersonalRoomAccessPolicy()` 不再内联判断 policy 集合、房主权限和响应 policy 兜底，改为消费 `shell-personal-room-policy.js` 的纯状态 helper |
| Gateway 合同 | 保持不变 | 实际 `POST /v1/personal-room/access-policy`、Bearer session、刷新 Gateway 投影仍由 `app.js` 编排，H5 不新增私有权限真值 |
| 提交闸门 | 已覆盖 | `personalRoomAccessPolicySubmitRequestState()` 统一产出 invalid-policy / not-owner / offline / allowed 请求状态，保留既有状态文案 |
| 响应兜底 | 已覆盖 | `appliedPersonalRoomAccessPolicy()` 只接受 Gateway 返回的合法 policy；异常响应回退到请求 policy，再回退保守默认 `friends_only` |

### 验证

```bash
node --test apps/lobster-web-shell/test/shell-personal-room-policy.test.mjs
node --test apps/lobster-web-shell/test/shell-pages-static.test.mjs --test-name-pattern "personal room access policy"
node --check apps/lobster-web-shell/app.js && node --check apps/lobster-web-shell/shell-personal-room-policy.js
```

## 2026-06-28 P3 技术债推进: 治理状态条纯状态下沉

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| app.js 降债 | 已完成 | 新增 `apps/lobster-web-shell/shell-governance-status.js`，把治理提示条文案前缀、错误状态和动态 class 清理规则从 `app.js` 下沉为纯 helper |
| 交互行为 | 保持不变 | `app.js` 继续只负责选择 `#governance-status` / `worldStateEl` 并应用 text/class，不改变好友关系、私宅访问或 Gateway 写路径 |
| fake-dom 映射 | 已同步 | `test/fake-dom.mjs` 已加入新模块，避免 app.js 本地 import 在 fake-dom 运行时遗漏重写 |
| 防回归测试 | 已完成 | 新增 `shell-governance-status.test.mjs` 覆盖 user/非 user 文案、fallback 文案、错误 class 与私宅访问提示 class；静态测试锁定 app.js 通过模块消费 |

### 验证

```bash
node --test apps/lobster-web-shell/test/shell-governance-status.test.mjs
node --test apps/lobster-web-shell/test/shell-pages-static.test.mjs --test-name-pattern "resident relationship"
node --test apps/lobster-web-shell/test/fake-dom-import-rewrite.test.mjs
```

## 2026-06-27 P3 技术债推进: 私宅访问策略控件纯状态下沉

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| app.js 降债 | 已完成 | 新增 `apps/lobster-web-shell/shell-personal-room-policy.js`，把私宅访问策略默认值、标签和控件状态计算从 `app.js` 下沉为纯 helper |
| 控件行为 | 保持不变 | `app.js` 继续负责 DOM 应用与 Gateway `POST /v1/personal-room/access-policy`，不新增 H5 私有权限真值 |
| fake-dom 映射 | 已同步 | `test/fake-dom.mjs` 已加入新模块，防止 app.js 本地 import 改动破坏运行时测试 |
| 防回归测试 | 已完成 | 新增 `shell-personal-room-policy.test.mjs` 覆盖 owner/visitor/offline/saving/online 状态；`shell-pages-static.test.mjs` 锁定 app.js 通过模块消费 |

### 验证

```bash
node --test apps/lobster-web-shell/test/shell-personal-room-policy.test.mjs
node --test apps/lobster-web-shell/test/shell-pages-static.test.mjs --test-name-pattern "personal room access policy"
node --test apps/lobster-web-shell/test/fake-dom-import-rewrite.test.mjs
```

## 2026-06-27 P2 收口: admin-ds 设备管理 UI 主内容接入

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 设备管理模块结构 | 已修复 | `mod-devices` 原本位于 `.ds-content` 结束后、右侧详情面板之后；现已移动到后台主内容区，跟随 `data-module="devices"` 正常模块切换 |
| 设备管理控件 | 已覆盖 | 静态测试将 `deviceAddressInput` / `deviceLabelInput` / `deviceAddBtn` / `deviceTableBody` 纳入后台结构合同 |
| Gateway 写操作 | 已复核 | 继续复用既有 `/v1/admin/devices/add|remove|block|unblock` 和 `GET /v1/admin/devices`，不新增 H5 私有状态 |
| 防回归测试 | 已完成 | `admin-ds-static.test.mjs` 新增主内容区层级测试，防止设备模块再次漂移到后台布局外 |

### 验证

```bash
node --test apps/lobster-web-shell/test/admin-ds-runtime.test.mjs apps/lobster-web-shell/test/admin-ds-static.test.mjs
```

## 2026-06-27 P2 收口: 私宅关系按钮移动端验收与未授权提示

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 住宅页关系反馈 | 已修复 | `creative.html` 新增 `#governance-status`，好友申请/接受与私宅访问拦截不再无处显示 |
| 未授权私宅提示 | 已增强 | `residentPrivateRoomAccessPromptModel()` 返回的 `resident-room-access-note` / `is-locked` / `is-pending` / `is-actionable` class 现在会落到状态条，形成可识别的空态反馈 |
| 移动端关系按钮 | 已验收 | `.creative-resident-list .resident-relationship-action` 最小高度提升到 34px；realness 在 390px 移动视口验证按钮可点击且未被覆盖 |
| 防回归测试 | 已完成 | `shell-pages-static.test.mjs` 锁定状态节点、class 传递与 CSS；`verify-frontend-realness.mjs` 增加 mobile relationship actions 检查 |

### 验证

```bash
node --test apps/lobster-web-shell/test/shell-pages-static.test.mjs --test-name-pattern "resident relationship"
node apps/lobster-web-shell/verify-frontend-realness.mjs
```

## 2026-06-27 P0 收口: world-square / admin-ds 注册登录 JS 接线

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 共享登录接线 | 已完成 | 新增 `apps/lobster-web-shell/shell-auth-standalone.js`，复用 `shell-auth.js` 的 OTP 流程，统一处理 `loadAuthDraft()` / `persistAuthDraft()` / `requestEmailOtp()` / `verifyEmailOtp()` / `updateAuthFormState()` |
| 世界广场登录 | 已接入 | `world-square.html` 改为调用 `initStandaloneAuthSurface()`；登录成功后继续刷新右上角“登录/连线中”状态 |
| admin-ds 登录 | 已接入 | `admin-ds.html` 不再手写 `initAuth` 细节，改为共享 standalone 登录模块，避免后台页复制认证逻辑 |
| 可选字段兼容 | 已修复 | `shell-auth.js` 的邮箱/手机 OTP 请求兼容没有 `auth-mobile-input` / `auth-device-input` 的页面；空的反滥用字段不再写入 payload |
| 防回归测试 | 已完成 | `shell-auth.test.mjs`、`admin-ds-static.test.mjs`、`shell-pages-static.test.mjs` 已锁定共享接线和可选字段行为 |

### 验证

```bash
node --test test/shell-auth.test.mjs test/admin-ds-static.test.mjs test/shell-pages-static.test.mjs
npm test
node --check shell-auth-standalone.js
```

## 2026-06-27 P0 复验: `?gateway=` 前端真实消息发送闭环

### 复验结论

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 双浏览器真实发送 | 已验证 | `scripts/smoke-web-dual-browser.mjs` 启动真实 Gateway + 静态 Web 服务，分别打开 `index.html?gateway=...&identity=qa-a` 和 `creative.html?gateway=...&identity=qa-b` |
| 消息闭环 | 已验证 | qa-a 与 qa-b 可跨页面互看 self/peer 投影；覆盖发送、编辑、撤回 |
| 失败重发 | 已验证 | smoke 故意让一次 `/v1/shell/message` 返回 503，确认 H5 显示失败 pending 气泡并可重发，最终 peer 端收到提交后的消息 |
| 当前门禁位置 | 已确认 | `make smoke-e2e` 会执行真实 Playwright 双浏览器 smoke；`smoke-release-gate.sh` 仅跑该脚本的 quick unit，避免发布快速门禁强制启动浏览器 |

### 验证

```bash
SKIP_BUILD=1 node scripts/smoke-web-dual-browser.mjs
```

## 2026-06-27 P1 收口: admin-ds 场景编辑器 day/night URL 输入

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 正式场景编辑器 | 已接入 | `admin-ds` 的“场景编辑”模块现在和房间详情面板一致，支持白天背景图 URL 与夜晚背景图 URL 输入 |
| Gateway payload | 已接入 | 保存场景时 `image_layer` 会携带 `day_image_url` / `night_image_url`；只填自定义图片、不选 preset 时也会提交 `preset: custom` |
| 成对约束 | 复用 Gateway | 前端显示“白天+夜晚必须成对填写”，最终校验仍由 Gateway `SceneImageLayer` 合同负责，避免 H5 私有权限/素材真值 |
| 防回归测试 | 已完成 | `admin-ds-static.test.mjs` 切入 `renderSceneEditor()` 函数体，防止只靠房间详情旧面板误判 |

### 验证

```bash
node --test test/admin-ds-runtime.test.mjs test/admin-ds-static.test.mjs
npm test
git diff --check
```

## 2026-06-26 产品确权: 私宅主客访问权限边界

### 新增蓝图约束

| 项目 | 结论 |
| --- | --- |
| 主客访问前提 | 用户必须是已注册、已登录的 IM 居民，未登录访客不可进入任何居民私宅 |
| 房主确权 | 是否允许他人访问由房主自己设置，不允许前端或 Gateway 默认把 `home:<resident>` 当作全公开房间 |
| MVP 策略 | 至少支持 `registered_all`（所有已登录注册用户）和 `friends_only`（好友/互相关系）两档 |
| 默认策略 | 未配置时采用保守默认；不自动等同于所有注册用户可访问。`friends_only` 仅对 Gateway 已确认的好友关系放行 |
| 消息隔离 | 私宅场景展示与私聊消息流必须分层；允许进入场景不代表允许读取历史私聊消息 |
| CC 必读 | 详见 `docs/DEVELOPMENT_BLUEPRINT.md` 的“私宅主客访问确权（2026-06-26）” |

### 对当前 WIP 的影响

本轮已把 Gateway 默认行为收口为登录 + 房主策略确权：

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 私宅识别 | 已收口 | 只有 `conversation_id == home:<owner>` 且参与者正好是 `<owner>` 的 1 人 Direct 才被视为 personal room；兼容旧 `dm:<id>` 半锚定 Direct |
| 创建权限 | 已收口 | `open_personal_room()` 要求房主是已注册居民；`POST /v1/personal-room` 要求 Bearer token 与 `resident_id` 匹配 |
| 默认可见性 | 已收口 | 未登录/匿名 shell state 不暴露私宅；默认 `friends_only` 下其他注册居民不能看到房主私宅；房主本人可见 |
| 策略表 | 已完成后端合同 | 新增 `registered_all` / `friends_only` access policy，持久化到 `personal-room-access-policies.json`，并在个人房间 shell state 暴露 `personal_room_access_policy` |
| 策略设置端点 | 已完成后端合同 | `POST /v1/personal-room/access-policy` 要求 Bearer token 与房主 `resident_id` 匹配 |
| H5 房主策略控件 | 已接入 | 住宅页仅在“自己的私宅”显示 `好友` / `注册` 分段控件；提交复用现有 Bearer session，Gateway 仍负责最终房主校验 |
| 好友关系模型 | 已完成后端合同 | 新增 `request` / `accept` 两步关系流，持久化到 `resident-relationships.json`；pending 不解锁，accepted friends 才能访问 `friends_only` 私宅场景 |
| 居民目录关系投影 | 已完成 Gateway 合同 | `GET /v1/residents?resident_id=<viewer>` 会按访问者投影 `relationship_state` / `relationship_requested_by`；H5 不需要本地伪造好友状态 |
| H5 关系入口 | 已接入 | H5 加载世界状态时会用带 `resident_id` 的居民目录覆盖 snapshot 居民列表；常规居民目录和住宅侧栏均显示 `申请好友` / `已申请` / `接受好友` / `好友`，提交复用 Bearer session |
| H5 未授权私宅提示 | 已接入 | 点击未授权的 `personal_room_id` 时不再切到不可见 room；按登录/申请/等待/接受状态提示用户下一步，并保留 Gateway 作为唯一权限真源 |
| 防消息泄漏 | 已收口 | `registered_all` 只开放私宅场景可见性；非房主访客看到 room 时不携带私宅历史消息 |
| 后续体验提示 | 待完善 | 继续做真实移动端验收、按钮触控 polish 和更完整的空态视觉；仍必须复用 Gateway 关系端点，不在 H5 本地伪造好友状态 |

CC/DS 后续不要再把 1 人 Direct 默认视为全公开主页；如要继续开放访问，必须复用 Gateway access policy 合同和测试，不要在 H5 私自放行。

## 2026-06-20 Codex 技术债推进: Rust 生产 panic 扫描门禁固化

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 红灯契约 | 完成 | `test_scripts_quick_unit_coverage.py` 与 `test_smoke_release_gate_unit.py` 先要求新增 Rust 生产 panic 扫描，并确认缺脚本/缺挂载会失败 |
| 扫描脚本 | 完成 | 新增 `scripts/rust-production-panic-scan.py`，覆盖 Gateway / CLI / TUI / crates 生产 Rust 源，排除测试文件与 `#[cfg(test)]` item |
| 崩溃宏防回归 | 完成 | 扫描器除 `.unwrap()` / `.expect()` / `panic!()` 外，也拦截生产 `todo!()` / `unimplemented!()` / `unreachable!()`，防止占位实现进入运行路径 |
| 假阳性处理 | 完成 | 扫描器在计算作用域前剥离字符串字面量，避免 `"\n}\n"`、`format!("{x}")` 等测试字符串打乱花括号计数 |
| 扫描器自验证 | 完成 | `test_rust_production_panic_scan_unit.py` 通过临时 Rust fixture 验证生产 `.unwrap()` 与 `unimplemented!()` 会失败、`#[cfg(test)]` 中 `.unwrap()` 会被忽略，带内部引号/跨行内容的 raw string 与块注释不会误报 |
| 字符串/注释过滤 | 完成 | 扫描匹配前剥离普通字符串、可跨行 Rust raw string、`//` 行注释与 `/* ... */` 块注释，避免帮助文案或注释里的 `.unwrap(`/`panic!` 造成假红灯 |
| 缺失路径假绿防护 | 完成 | 显式 `--scan-root` 或默认扫描根缺失时直接失败并输出 `scan root missing`，避免目录移动/拼写错误让门禁静默通过 |
| Rust fmt 门禁 | 完成 | `smoke-release-gate.sh` 的非 `SKIP_BUILD` 路径先跑 `cargo fmt --check` 再跑 clippy/build；`verify-complete.sh` 也在 workspace test 后、lint 前挂载 `rust fmt` |
| Release gate | 完成 | `smoke-release-gate.sh` 先跑扫描器 quick unit，再跑真实 `rust-production-panic-scan.py`，避免只测脚本、不扫真实仓库 |
| 完整验证 | 完成 | `verify-complete.sh` 也拆成扫描器 quick unit + 真实生产扫描，并用 stub 单测锁定 PASS/FAIL 记账，避免完整验证漏掉真实扫描 |

### 验证

```bash
python3 scripts/test_rust_production_panic_scan_unit.py
python3 scripts/rust-production-panic-scan.py
python3 scripts/test_scripts_quick_unit_coverage.py
python3 scripts/test_smoke_release_gate_unit.py
python3 scripts/test_verify_complete_unit.py
bash -n scripts/verify-complete.sh
bash -n scripts/smoke-release-gate.sh
```

## 2026-06-19 Codex 技术债推进: verify-complete 假绿风险收口

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 红灯契约 | 完成 | 新增 `scripts/test_verify_complete_unit.py`，锁定 `verify-complete.sh` 必须开启 `set -euo pipefail`，并用 `${PIPESTATUS[0]}` 读取 `cmd | tee` 中真实命令退出码 |
| 验收脚本 | 完成 | `verify-complete.sh` 改为 `run_logged()` 统一记录 PASS/FAIL，任一阶段失败都会让最终脚本退出非零，同时继续写完整日志 |
| 门禁覆盖 | 完成 | `test_scripts_quick_unit_coverage.py` 将 `verify-complete.sh` 纳入脚本 quick unit 映射；`smoke-release-gate.sh` 挂载 `complete verification unit`，只跑快速合同检查，不执行完整长耗时验收 |
| 真实失败路径 | 完成 | 用临时 stub 让 `npm test` 返回 7，验证脚本最终退出 `1`，日志包含 `FAIL: frontend`，后续成功项仍能继续记录 |
| 行为测试补强 | 完成 | `test_verify_complete_unit.py` 现在会实际执行 `verify-complete.sh` 的 stub 环境，覆盖 `npm` 失败与 `git status` 失败两条路径；工作区状态也改为 `run_logged "workspace status"`，不再绕过统一退出码 |
| crypto-mls panic 收口 | 完成 | `generate_key()` / `derive_epoch_key()` 从 `expect("RNG")` / `expect("HKDF")` / `expect("fill")` 改为 `Result` 错误传播；新增测试护栏防止生产 crypto helper 重新引入这些 panic |
| Gateway 安全头 panic 收口 | 完成 | `security_headers()` 不再对静态安全响应头 `unwrap()`；新增 `http_support` 单测锁定无 panic 构造并确认 `X-Content-Type-Options` / `X-Frame-Options` / `Referrer-Policy` 仍输出 |
| CORS 配置注入防护 | 完成 | `LOBSTER_CORS_ORIGIN` 若为空或包含控制字符（如换行注入）会回退 `*`；`cors_origin_reads_from_env` 覆盖合法、空值和非法换行配置，避免服务输出危险 header value |
| CORS 非 ASCII 配置防护 | 完成 | `LOBSTER_CORS_ORIGIN` 若包含非 ASCII 字符会回退 `*`；新增 `cors_origin_non_ascii_env_falls_back_to_wildcard`，避免环境变量误填导致 gateway 在 header 构造处 panic |
| Admin device 路由锁中毒防护 | 完成 | `http_device_routes.rs` 新增统一 `with_runtime()` 锁助手；设备列表/add/remove/block/unblock 遇到 poisoned runtime mutex 时返回 JSON 500，不再 `expect("poisoned")` 打崩请求线程 |
| Auth 路由锁中毒防护 | 完成 | `http_auth_routes.rs` 新增统一 `with_runtime()` 锁助手；session/preflight/email OTP/mobile OTP/logout 遇到 poisoned runtime mutex 时返回 JSON 500，不再 `expect("gateway runtime mutex poisoned")` 打崩请求线程 |
| City 写路由锁中毒防护 | 完成 | `require_admin_auth()` / `require_capability_or_bypass()` 遇到 poisoned runtime mutex 时返回 JSON 500；`http_city_write_routes.rs` 新增统一 `with_runtime()`，create/join/approve/steward/federation/public-room/freeze 不再依赖 `expect("gateway runtime mutex poisoned")` |
| Governance 写路由锁中毒防护 | 完成 | `http_governance_write_routes.rs` 新增统一 `with_runtime()`；world notice / city trust / safety report / review / advisory / sanction / unsanction 遇到 poisoned runtime mutex 时返回 JSON 500，并保留 bearer actor 校验和 unsanction 审计写入 |
| Read 路由锁中毒防护 | 完成 | `http_read_routes.rs` 统一走 `with_runtime()`；provider/shell/world/admin/read-only CLI 入口遇到 poisoned runtime mutex 时返回 JSON 500，不再依赖 `expect("gateway runtime mutex poisoned")`；`export` 也移除 `resident_id validated above` 的生产 `expect` |
| Write 路由锁中毒防护 | 完成 | `http_write_routes.rs` 新增统一 `with_runtime()`；provider/direct/waku/shell message/scene/edit/recall/presence/mark-read/CLI/admin 写入口遇到 poisoned runtime mutex 时返回 JSON 500，不再依赖 `expect("gateway runtime mutex...")`；业务变更与审计写入仍保留在同一 runtime 作用域 |
| Gateway main/notifier 锁中毒防护 | 完成 | `main.rs` 启动期 upstream 状态打印不再因 runtime mutex poisoned panic；`GatewayStateNotifier` 的 mutex/condvar poisoned 后恢复 inner guard，SSE generation/notify/wait 路径不再依赖 `expect("gateway notifier...")` |
| Admin actor unwrap 收口 | 完成 | `http_write_routes.rs` 的 ban/unban/freeze/unfreeze/config/moderate admin actor 校验改为 `required_admin_actor()` 显式返回 401，不再保留 `actor.unwrap()` 生产路径 |
| Runtime 时间 helper panic 收口 | 完成 | `GatewayRuntime::now_ms()` 不再 `expect("system time should be after unix epoch")`；系统时间异常时回退 `0`，极端未来时间 clamp 到 `i64::MAX` |
| Gateway query parser 覆盖补强 | 完成 | 新增 `split_path_and_query_keeps_unescaped_query_components_intact`，补上普通未转义 query key/value 不被截断的回归覆盖，和既有 percent escape 测试形成完整边界 |
| Gateway 静态 header helper panic 收口 | 完成 | `json_header()` / `text_header()` / `sse_header()` / `no_cache_header()` / `cors_*_header()` 改为返回 `Option<Header>`；响应构造统一用 `ResponseHeaderExt::with_optional_header()`，header 构造失败时跳过该 header 而不是 panic |
| Gateway 生产 panic 扫描 | 完成 | 排除 `gateway_tests.rs` / `gateway_test_support.rs` 后，Gateway 生产文件在 `#[cfg(test)]` 前的 `.expect()` / `.unwrap()` / `panic!()` 扫描为空 |
| Rust workspace 基线复验 | 完成 | `cargo test --workspace` 通过；覆盖 CLI 100 unit + 18 gateway integration + 5 integration、TUI 225 unit、Gateway 264 unit、核心 crates 与 doc-tests |
| Complete verification 覆盖补强 | 完成 | `verify-complete.sh` 新增 `cargo test --workspace` 与 `cargo clippy --workspace -- -D warnings`，避免“完整验证”只覆盖 gateway/cli/tui 三个包而漏掉核心 crates/doc-tests/lint |
| Release gate lint 挂载 | 完成 | `smoke-release-gate.sh` 在非 `SKIP_BUILD=1` 的发布路径中先跑 `cargo clippy --manifest-path "$ROOT_DIR/Cargo.toml" --workspace -- -D warnings`，再 build 三个共享 debug binary |

### 验证

```bash
python3 scripts/test_verify_complete_unit.py
python3 scripts/test_scripts_quick_unit_coverage.py
python3 scripts/test_smoke_release_gate_unit.py
bash -n scripts/verify-complete.sh scripts/smoke-release-gate.sh
make lint
python3 scripts/test_package_release_unit.py && python3 scripts/test_scripts_quick_unit_coverage.py && python3 scripts/test_smoke_release_gate_unit.py && python3 scripts/test_smoke_provider_federation_unit.py && python3 scripts/test_smoke_web_dual_browser_unit.py && python3 scripts/test_smoke_resident_mainline_unit.py && python3 scripts/test_smoke_cli_channel_unit.py && python3 scripts/test_smoke_auth_registration_unit.py && python3 scripts/test_smoke_shell_dual_http_unit.py && python3 scripts/test_smoke_shell_direct_http_unit.py && python3 scripts/test_smoke_web_shell_unit.py && python3 scripts/test_install_server_unit.py && python3 scripts/test_preview_server_unit.py && python3 scripts/test_start_terminal_shell_unit.py && python3 scripts/test_audit_web_assets_unit.py && python3 scripts/test_lobster_device_id_unit.py && python3 scripts/test_start_web_preview_unit.py && python3 scripts/test_restart_gateway_unit.py && python3 scripts/test_preflight_unit.py && python3 scripts/test_smoke_public_ingress_unit.py && python3 scripts/test_smoke_install_layout_unit.py && python3 scripts/test_start_terminal_unit.py && python3 scripts/test_makefile_unit.py && python3 scripts/test_verify_complete_unit.py
bash -n scripts/package-release.sh scripts/smoke-provider-federation.sh scripts/smoke-release-gate.sh scripts/smoke-resident-mainline.sh scripts/smoke-cli-channel.sh scripts/smoke-auth-registration.sh scripts/smoke-shell-dual-http.sh scripts/smoke-shell-direct-http.sh scripts/install-server.sh scripts/smoke-web-shell.sh scripts/start-terminal.sh scripts/audit-web-assets.sh scripts/lobster-device-id.sh scripts/restart-gateway.sh scripts/preflight.sh scripts/smoke-public-ingress.sh scripts/smoke-install-layout.sh scripts/verify-complete.sh
zsh -n scripts/start-web-preview.sh
node --check scripts/preview-server.mjs
node --check scripts/smoke-web-dual-browser.mjs
cargo test -p lobster-waku-gateway cors_origin_non_ascii_env_falls_back_to_wildcard
cargo test -p lobster-waku-gateway admin_devices_returns_500_when_runtime_lock_poisoned
cargo test -p lobster-waku-gateway auth_session_returns_500_when_runtime_lock_poisoned
cargo test -p lobster-waku-gateway create_city_returns_500_when_runtime_lock_poisoned
cargo test -p lobster-waku-gateway city_write_routes_do_not_depend_on_runtime_lock_expect
cargo test -p lobster-waku-gateway publish_world_notice_returns_500_when_runtime_lock_poisoned
cargo test -p lobster-waku-gateway governance_write_routes_do_not_depend_on_runtime_lock_expect
cargo test -p lobster-waku-gateway provider_status_returns_500_when_runtime_lock_poisoned
cargo test -p lobster-waku-gateway read_routes_do_not_depend_on_runtime_lock_expect
cargo test -p lobster-waku-gateway provider_disconnect_returns_500_when_runtime_lock_poisoned
cargo test -p lobster-waku-gateway write_routes_do_not_depend_on_runtime_lock_expect
cargo test -p lobster-waku-gateway gateway_main_does_not_depend_on_runtime_lock_expect
cargo test -p lobster-waku-gateway gateway_notifier_recovers_from_poisoned_mutex
cargo test -p lobster-waku-gateway gateway_notifier_does_not_depend_on_poison_expect
cargo test -p lobster-waku-gateway write_routes_do_not_depend_on_actor_unwrap
cargo test -p lobster-waku-gateway core_runtime_now_ms_does_not_depend_on_system_time_expect
cargo test -p lobster-waku-gateway split_path_and_query_keeps_unescaped_query_components_intact
cargo test -p lobster-waku-gateway static_header_helpers_do_not_depend_on_panic_paths
cargo test -p crypto-mls
cargo test -p lobster-waku-gateway
cargo test --workspace
cargo fmt --check
for f in apps/lobster-waku-gateway/src/*.rs; do case "$f" in */gateway_tests.rs|*/gateway_test_support.rs) continue ;; esac; hits=$(sed '/^#\[cfg(test)\]/,$d' "$f" | rg -n "\.expect\(|\.unwrap\(\)|panic!\(" || true); if [[ -n "$hits" ]]; then printf '%s\n%s\n' "-- $f" "$hits"; fi; done
git diff --check -- apps/lobster-waku-gateway/src/http_auth_routes.rs apps/lobster-waku-gateway/src/http_city_write_routes.rs apps/lobster-waku-gateway/src/http_device_routes.rs apps/lobster-waku-gateway/src/http_governance_write_routes.rs apps/lobster-waku-gateway/src/http_support.rs apps/lobster-waku-gateway/src/http_write_routes.rs apps/lobster-waku-gateway/src/gateway_tests.rs crates/crypto-mls/src/lib.rs scripts/verify-complete.sh scripts/test_verify_complete_unit.py scripts/test_scripts_quick_unit_coverage.py scripts/test_smoke_release_gate_unit.py scripts/smoke-release-gate.sh docs/ACTIVE_WORK_QUEUE.md
```

## 2026-06-09 Codex 技术债校准与修复

### Web Shell realness 回归修复

| 项目 | 结果 |
|------|------|
| 红灯 | `npm test` 的 `verify-frontend-realness.mjs` 失败：`/unified.html rail width should stay on the shared 220px token`，实测 `.world-entry-rail` 被后加载的 `.sfc-layout` 通用规则压成 160px |
| 修复 | 调整 `unified.html` 样式加载顺序，让 `styles.creative.css` 先加载，`styles.world-entry.css` 后加载；world-entry 专属 220px rail token 重新成为最终级联结果 |
| 验证 | `npm test` 通过：736 unit passed / 0 failed，layout passed，realness passed |

### Gateway unsanction 安全/审计债收口

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `unsanction_resident_endpoint_records_actor_audit_event`，确认解除制裁没有写 `admin:unsanction_resident` 审计事件 |
| 红灯 | 新增 `unsanction_resident_endpoint_rejects_oversized_body`，确认超 1MiB 请求体没有走统一 size limit |
| 修复 | `/v1/admin/residents/unsanction` 改用 `read_request_body()`；校验 `actor_id` / `sanction_id`；可选 bearer token 与 actor 匹配；解除成功后写审计并 `notify_changed()` |
| 验证 | `LOBSTER_DEV_AUTH_BYPASS=1 cargo test -p lobster-waku-gateway -- --test-threads=1` 通过：244 passed / 0 failed；此前 3 个 warning 清零 |

### CLI export parity 补齐

| 项目 | 结果 |
|------|------|
| 基线 | `cargo test -p lobster-tui` 通过：217 passed；`cargo test -p lobster-cli` 通过：31 unit + 11 gateway integration + 5 integration passed |
| 红灯 | 新增 `export_command_parses_gateway_export_request`，确认 CLI 不支持 `export`：`unsupported command: export` |
| 修复 | CLI 新增 `export --for user:... [--conversation-id ...] [--format md/jsonl/txt] [--include-public] [--json]`，对接 Gateway `/v1/export`；默认人类输出直接打印 `content`，JSON 模式输出完整响应 |
| 防回归 | 新增 `export_command_rejects_room_actor_target` 和 `export_command_prints_export_content_by_default`，防止把 room 当居民导出、或吞掉导出正文 |
| 验证 | `cargo test -p lobster-cli` 通过：34 unit + 11 gateway integration + 5 integration passed |

### Workspace 级测试 auth 环境债收口

| 项目 | 结果 |
|------|------|
| 红灯 | `cargo test --workspace` 失败：Gateway 244 个测试中 22 个 admin/city 写接口用例返回 401；根因是测试默认依赖外部 `LOBSTER_DEV_AUTH_BYPASS=1`，workspace 命令没有注入该环境变量 |
| 修复 | `GatewayRuntime` 新增实例级 `dev_auth_bypass`；测试构建默认开启，生产构建仍默认关闭；`require_admin_auth()` / capability gate 改为读取 runtime 实例，避免全局 env 污染并行测试 |
| 防回归 | `resident_without_capability_is_denied_admin_action` 改为关闭当前 runtime 的 test bypass，并携带 Bearer header 验证 capability 拒绝；不再 `remove_var/set_var` 影响其他测试 |
| 验证 | `cargo test -p lobster-waku-gateway` 通过：244 passed / 0 failed；`cargo test --workspace` 通过：全部 Rust workspace unit/integration/doc tests 绿 |

### 根目录 npm test 入口债收口

| 项目 | 结果 |
|------|------|
| 红灯 | 在仓库根目录执行 `npm test` 失败：`Missing script: "test"`；但多处文档和协作提示会把 `npm test` 当作前端验收入口，容易误导 CC/DS 在错误目录得出假失败 |
| 修复 | 根 `package.json` 新增 `test` / `test:frontend`，统一代理到 `apps/lobster-web-shell`；同步 root `package-lock.json` 元数据 |
| 验证 | 仓库根目录 `npm test` 通过：代理执行 web-shell 736 unit passed / 0 failed，layout passed，realness passed |

### Makefile Gateway 测试入口 workaround 收口

| 项目 | 结果 |
|------|------|
| 债务 | `make test-gateway` 仍保留旧 workaround：`LOBSTER_DEV_AUTH_BYPASS=1 cargo test -p lobster-waku-gateway -- --test-threads=1`；这会掩盖 Gateway 测试是否真的能在默认并行环境下通过 |
| 修复 | `Makefile` 的 `test-gateway` 改回标准 `cargo test -p lobster-waku-gateway`，与已修复的实例级 test bypass 保持一致 |
| 验证 | `make test-gateway` 通过：244 passed / 0 failed；`Makefile` 中已无 `LOBSTER_DEV_AUTH_BYPASS` / `--test-threads=1` |

### Clippy lint 入口收口

| 项目 | 结果 |
|------|------|
| 红灯 | `make lint` 失败：`core_runtime.rs` 的 `map_or(true, ...)` 触发 `clippy::unnecessary-map-or`；`http_support.rs` 的 `request.as_reader().bytes()` 触发 `clippy::unbuffered-bytes` |
| 修复 | 搜索过滤改用 `Option::is_none_or()`；请求体读取改为一次 `take(MAX_BODY_SIZE + 1).read_to_end()`，超过 1MiB 时按原语义报错，不再额外逐字节读取 |
| 验证 | `make lint` 通过；`unsanction_resident_endpoint_rejects_oversized_body` 与 `message_search_finds_text_in_conversation` 均通过 |

### Rust fmt 入口收口

| 项目 | 结果 |
|------|------|
| 红灯 | `cargo fmt --check` 失败，多个 Rust 文件存在格式化差异，主要来自近期 Gateway / CLI / TUI / crypto-mls 改动 |
| 修复 | 执行 `cargo fmt` 做机械格式化，不做语义修改 |
| 验证 | `cargo fmt --check`、`make lint`、`make check`、`make test` 全部通过 |

### Smoke 门禁基线复验

| 项目 | 结果 |
|------|------|
| 范围 | `make smoke` 覆盖 shell 双 HTTP 冒烟与 web-shell 冒烟 |
| 结果 | `smoke-shell-dual-http.sh` 临时启动 Gateway `127.0.0.1:8807`，`qa-a` 发送公共 shell 消息后 `qa-b` 成功收到；随后 `smoke-web-shell.sh` 跑完 web-shell 测试套件 |
| 验证 | `make smoke` 通过，当前技术债收口后的集成 smoke 基线为绿 |

### TUI edit/recall Gateway parity 补齐

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `edit_command_without_args_shows_usage_without_publishing_plain_text` / `recall_command_without_args_shows_usage_without_publishing_plain_text`，确认 TUI 会把 `/edit`、`/recall` 空命令误发布成普通正文 |
| 合同 | 新增 `terminal_edit_command_request_matches_gateway_shell_contract` / `terminal_recall_command_request_matches_gateway_shell_contract`，锁定 TUI 调用 Gateway 的 `/v1/shell/message/edit` 与 `/v1/shell/message/recall` payload |
| 修复 | TUI 终端新增 `/edit <消息ID> <新正文>` 与 `/recall <消息ID>`；帮助文案同步暴露；命令失败时写终端 notice，不再走普通消息发布路径 |
| 防回归 | 新增带参数命令测试，确认 `/edit msg text` / `/recall msg` 在 Gateway 未配置时写失败 notice 且不会落入本地普通消息 publish；`/help` 同步断言列出 edit/recall |
| 可测性 | `handle_terminal_submission_with_gateway_post()` 让 edit/recall 成功路径可通过注入 POST 函数测试，不再需要改全局 `LOBSTER_WAKU_GATEWAY_URL`；新增 success notice 测试覆盖 edit/recall 成功响应 |
| 验证 | 聚焦红灯测试转绿；`cargo test -p lobster-tui` 通过：225 passed / 0 failed；`make check`、`cargo fmt --check` 与 `make lint` 通过 |

### CLI edit/recall smoke parity 补齐

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_smoke_cli_channel_unit.py`，先确认 `smoke-cli-channel.sh` 没有 edit/recall 步骤；`test_smoke_release_gate_unit.py` 同步要求 release gate 挂载该脚本单测 |
| 修复 | `smoke-cli-channel.sh` 在 JSON 模式后新增 edit/recall smoke：先 `send --json` 获取两条 message_id，再分别执行 `edit --actor ... --conversation-id ... --message-id ... --json` 与 `recall --actor ... --conversation-id ... --message-id ... --json` |
| 防回归 | 脚本继续通过 `tail --json` 校验编辑后消息 `is_edited=true` 且正文为新文本，撤回后消息 `is_recalled=true` 且正文投影为 `消息已撤回`；release gate 在真实 CLI channel smoke 前先跑脚本合同单测 |
| 验证 | `python3 scripts/test_smoke_cli_channel_unit.py`、`python3 scripts/test_smoke_release_gate_unit.py`、`bash -n scripts/smoke-cli-channel.sh scripts/smoke-release-gate.sh` 通过；`SKIP_BUILD=1 scripts/smoke-cli-channel.sh` 通过 |

### make smoke 门禁覆盖面补齐

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_makefile_unit.py`，确认 `make smoke` 仍只声明并执行 shell/web smoke，没有纳入 CLI channel smoke |
| 修复 | `Makefile` 的 `make smoke` 帮助文案改为 `CLI + shell + web smoke`；实际执行顺序新增 `python3 ./scripts/test_smoke_cli_channel_unit.py` 与 `./scripts/smoke-cli-channel.sh`，再跑原 shell dual HTTP 与 web-shell smoke |
| 验证 | `python3 scripts/test_makefile_unit.py`、CLI/release smoke 单测、`bash -n` 通过；`make smoke` 通过，真实覆盖 CLI send/inbox/rooms/tail/follow/edit/recall、shell dual HTTP、web-shell 736 tests |

### Release gate smoke 合同漂移收口

| 项目 | 结果 |
|------|------|
| 红灯 | `test_smoke_release_gate_unit.py` 先要求 release gate 挂载 `test_makefile_unit.py`；随后 `RUN_PREFLIGHT=0 INCLUDE_PROVIDER_FEDERATION=0 SKIP_BUILD=1 scripts/smoke-release-gate.sh` 暴露 resident mainline 红灯：匿名 `/v1/cities/join` 现在先被 admin bearer gate 拒绝 |
| 修复 | `smoke-release-gate.sh` 在 CLI smoke 单测前新增 `makefile smoke unit`；`smoke-resident-mainline.sh` 改为先完成 OTP 注册拿真实 `session_token`，再用 Bearer header 校验 unregistered join 的业务错误，并用同一 Bearer 执行 registered join |
| 验证 | `SKIP_BUILD=1 scripts/smoke-resident-mainline.sh` 通过；`RUN_PREFLIGHT=0 INCLUDE_PROVIDER_FEDERATION=0 SKIP_BUILD=1 scripts/smoke-release-gate.sh` 通过，覆盖 CLI/auth/resident/shell dual/shell direct/web/terminal smoke，provider federation 本轮显式跳过 |

### Terminal smoke quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | `test_smoke_release_gate_unit.py` 要求 release gate 在长耗时 `test_start_terminal.py` 前运行 `test_start_terminal_unit.py`，先确认该 quick unit 未被挂载 |
| 修复 | `smoke-release-gate.sh` 在 `terminal smoke` 前新增 `terminal smoke unit`，让 terminal smoke 的 Python helper 合同先快速失败 |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_start_terminal_unit.py`、`bash -n scripts/smoke-release-gate.sh` 通过 |

### Provider federation smoke quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_smoke_provider_federation_unit.py` 锁定 provider federation smoke 的 artifact 解包、release build、上下游 Gateway、`remote-gateway` 状态、下游发消息上游可见与清理逻辑；`test_smoke_release_gate_unit.py` 先确认 release gate 未挂载该 quick unit |
| 修复 | `smoke-release-gate.sh` 在可选的 `provider federation smoke` 前新增 `provider federation smoke unit`，让 provider interlink 脚本合同先快速失败 |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_smoke_provider_federation_unit.py`、`bash -n scripts/smoke-release-gate.sh scripts/smoke-provider-federation.sh` 通过 |

### Install server quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | `test_smoke_release_gate_unit.py` 先要求 release gate 在 install layout quick unit 前挂载 `scripts/test_install_server_unit.py`，确认 `install-server.sh` 本体缺少直接合同检查 |
| 修复 | 新增 `scripts/test_install_server_unit.py` 锁定 `install-server.sh` 的安装路径默认值、host target/artifact 校验、Rust bootstrap、systemd unit、nginx site、冲突 Gateway 清理、端口占用检查与 health/provider 探针合同；`smoke-release-gate.sh` 在 `install layout smoke unit` 前新增 `install server unit` |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_install_server_unit.py`、`python3 scripts/test_smoke_install_layout_unit.py`、`bash -n scripts/smoke-release-gate.sh scripts/install-server.sh scripts/smoke-install-layout.sh` 通过 |

### Install layout smoke quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_smoke_install_layout_unit.py` 锁定 install layout smoke 的假 systemctl/nginx/curl、artifact 生成、`install-server.sh` 调用、systemd/nginx 产物与 health/provider 探针；`test_smoke_release_gate_unit.py` 先确认 release gate 未挂载该 quick unit |
| 修复 | `smoke-release-gate.sh` 在结束前新增 `install layout smoke unit`；只跑快速脚本合同检查，完整 `smoke-install-layout.sh` 仍按发布文档单独执行 |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_smoke_install_layout_unit.py`、`bash -n scripts/smoke-release-gate.sh scripts/smoke-install-layout.sh` 通过 |

### Public ingress smoke quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_smoke_public_ingress_unit.py` 锁定 public ingress smoke 的 `BASE_URL` 输入、首页标记、GET/HEAD `/health`、`/v1/provider` 与临时文件清理合同；`test_smoke_release_gate_unit.py` 先确认 release gate 未挂载该 quick unit |
| 修复 | `smoke-release-gate.sh` 在结束前新增 `public ingress smoke unit`；只跑快速脚本合同检查，真实外部入口 smoke 仍需按 `BASE_URL=... ./scripts/smoke-public-ingress.sh` 单独执行 |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_smoke_public_ingress_unit.py`、`bash -n scripts/smoke-release-gate.sh scripts/smoke-public-ingress.sh` 通过 |

### Package release quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_package_release_unit.py` 锁定 `package-release.sh` 的 dist 目录、host target、release build、source/web/gateway artifact、排除目录与缺失 gateway binary warning 合同；`test_smoke_release_gate_unit.py` 先确认 release gate 未挂载该 quick unit |
| 修复 | `smoke-release-gate.sh` 在结束前新增 `package release unit`；只跑快速脚本合同检查，真实 `package-release.sh` 仍按发布流程单独执行 |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_package_release_unit.py`、`bash -n scripts/smoke-release-gate.sh scripts/package-release.sh` 通过 |

### Preflight quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_preflight_unit.py` 锁定 `preflight.sh` 的命令依赖、target triple、内存/磁盘探测、cargo 1.85 edition-2024 floor、Linux/systemd/nginx 提示合同；`test_smoke_release_gate_unit.py` 先确认 release gate 未在真实 preflight 前挂载该 quick unit |
| 修复 | `smoke-release-gate.sh` 在真实 `preflight` 前新增 `preflight unit`；即使 `RUN_PREFLIGHT=0` 也会保留脚本合同快速检查 |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_preflight_unit.py`、`bash -n scripts/smoke-release-gate.sh scripts/preflight.sh` 通过 |

### Restart gateway quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_restart_gateway_unit.py` 锁定 `restart-gateway.sh` 的 debug gateway 构建、端口旧进程发现/停止、nohup 启动、日志路径、`/health`、shell state 与 admin summary 探针合同；`test_smoke_release_gate_unit.py` 先确认 release gate 未挂载该 quick unit |
| 修复 | `smoke-release-gate.sh` 在结束前新增 `restart gateway unit`；只跑快速脚本合同检查，不执行真实本地 gateway 重启 |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_restart_gateway_unit.py`、`bash -n scripts/smoke-release-gate.sh scripts/restart-gateway.sh` 通过 |

### Web preview quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_start_web_preview_unit.py` 锁定 `start-web-preview.sh` 的 zsh 入口、默认端口/根目录、PID/log 文件、已有 preview 复用、非 preview 端口拒绝、python http.server 启动与 readiness 检查合同；`test_smoke_release_gate_unit.py` 先确认 release gate 未挂载该 quick unit |
| 修复 | `smoke-release-gate.sh` 在结束前新增 `web preview unit`；只跑快速脚本合同检查，不启动真实本地预览服务 |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_start_web_preview_unit.py`、`bash -n scripts/smoke-release-gate.sh`、`zsh -n scripts/start-web-preview.sh` 通过 |

### Device id quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_lobster_device_id_unit.py` 锁定 `lobster-device-id.sh` 的网卡优先级、platform UUID fallback、默认 URL、已有 query 参数拼接与纯 MAC 输出合同；`test_smoke_release_gate_unit.py` 先确认 release gate 未挂载该 quick unit |
| 修复 | `smoke-release-gate.sh` 在结束前新增 `device id unit`；只跑快速脚本合同检查，不读取真实网卡/UUID |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_lobster_device_id_unit.py`、`bash -n scripts/smoke-release-gate.sh scripts/lobster-device-id.sh` 通过 |

### Web assets audit quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_audit_web_assets_unit.py` 锁定 `audit-web-assets.sh` 的 assets 目录检查、图片类型枚举、最大图片排序、256px 派生图引用统计、source/concepts 大文件扫描合同；`test_smoke_release_gate_unit.py` 先确认 release gate 未挂载该 quick unit |
| 修复 | `smoke-release-gate.sh` 在结束前新增 `web assets audit unit`；只跑快速脚本合同检查，不执行真实 assets 扫描 |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_audit_web_assets_unit.py`、`bash -n scripts/smoke-release-gate.sh scripts/audit-web-assets.sh` 通过 |

### Start terminal shell quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_start_terminal_shell_unit.py` 锁定 `start-terminal.sh` 的 TTY 防护、Gateway 复用/启动、state/log 目录、TUI build、`LOBSTER_WAKU_GATEWAY_URL` 传递与 `--mode` 参数合同；`test_smoke_release_gate_unit.py` 先确认 release gate 未在长 terminal smoke 前挂载该 quick unit |
| 修复 | `smoke-release-gate.sh` 在 `terminal smoke` 前新增 `start terminal shell unit`；只跑快速脚本合同检查，不进入真实交互式 TUI |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_start_terminal_shell_unit.py`、`bash -n scripts/smoke-release-gate.sh scripts/start-terminal.sh` 通过 |

### Preview server quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_preview_server_unit.py` 锁定 `preview-server.mjs` 的默认 root/host/port、MIME 表、路径解析、路径穿越拒绝、目录 index、404 与 HEAD 响应合同；`test_smoke_release_gate_unit.py` 先确认 release gate 未挂载该 quick unit |
| 修复 | `smoke-release-gate.sh` 在结束前新增 `preview server unit`；只跑快速脚本合同检查，不启动真实 Node 预览服务 |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_preview_server_unit.py`、`bash -n scripts/smoke-release-gate.sh`、`node --check scripts/preview-server.mjs` 通过 |

### Web dual browser smoke quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_smoke_web_dual_browser_unit.py` 锁定 `smoke-web-dual-browser.mjs` 的 Gateway/Web 双进程、Playwright 双页面、index/creative 身份 URL、edit/recall、pending retry 与进程/state 清理合同；`test_smoke_release_gate_unit.py` 先确认 release gate 未在 terminal smoke 前挂载该 quick unit |
| 修复 | `smoke-release-gate.sh` 在 `web shell smoke` 后新增 `web dual browser smoke unit`；只跑快速脚本合同检查，不启动真实 Playwright 双浏览器 smoke |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_smoke_web_dual_browser_unit.py`、`bash -n scripts/smoke-release-gate.sh`、`node --check scripts/smoke-web-dual-browser.mjs` 通过 |

### Auth registration smoke quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_smoke_auth_registration_unit.py` 锁定 `smoke-auth-registration.sh` 的 inline dev OTP、auth preflight、email OTP request/verify、auth-state 持久化、world-safety sanction 与黑名单 OTP 拦截合同；`test_smoke_release_gate_unit.py` 先确认 release gate 未在真实 auth smoke 前挂载该 quick unit |
| 修复 | `smoke-release-gate.sh` 在 `auth registration smoke` 前新增 `auth registration smoke unit`；只跑快速脚本合同检查，不启动真实 Gateway |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_smoke_auth_registration_unit.py`、`bash -n scripts/smoke-release-gate.sh scripts/smoke-auth-registration.sh` 通过 |

### Resident mainline smoke quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | `test_smoke_release_gate_unit.py` 先要求 release gate 在真实 `resident mainline smoke` 前挂载 `scripts/test_smoke_resident_mainline_unit.py`，确认该 quick unit 缺失 |
| 修复 | 新增 `scripts/test_smoke_resident_mainline_unit.py` 锁定 `smoke-resident-mainline.sh` 的 inline OTP 注册、Bearer join、未注册居民业务错误、CLI rooms/tail、TUI direct/user 脚本与 cleanup 合同；`smoke-release-gate.sh` 在真实 resident mainline smoke 前新增 `resident mainline smoke unit` |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_smoke_resident_mainline_unit.py`、`bash -n scripts/smoke-release-gate.sh scripts/smoke-resident-mainline.sh` 通过 |

### Shell dual HTTP smoke quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_smoke_shell_dual_http_unit.py` 锁定 `smoke-shell-dual-http.sh` 的 Gateway 启动、初始 shell state、SSE after 订阅、公共消息发送、peer state 可见与 cleanup 合同；`test_smoke_release_gate_unit.py` 先确认 release gate 未在真实 shell dual smoke 前挂载该 quick unit |
| 修复 | `smoke-release-gate.sh` 在 `shell dual HTTP smoke` 前新增 `shell dual HTTP smoke unit`；只跑快速脚本合同检查，不启动真实 Gateway |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_smoke_shell_dual_http_unit.py`、`bash -n scripts/smoke-release-gate.sh scripts/smoke-shell-dual-http.sh` 通过 |

### Shell direct HTTP smoke quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | 新增 `scripts/test_smoke_shell_direct_http_unit.py` 锁定 `smoke-shell-direct-http.sh` 的 direct open、参与者 projection、SSE after 订阅、direct 发送、edit/recall、outsider 读写拦截与 cleanup 合同；`test_smoke_release_gate_unit.py` 先确认 release gate 未在真实 shell direct smoke 前挂载该 quick unit |
| 修复 | `smoke-release-gate.sh` 在 `shell direct HTTP smoke` 前新增 `shell direct HTTP smoke unit`；只跑快速脚本合同检查，不启动真实 Gateway |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_smoke_shell_direct_http_unit.py`、`bash -n scripts/smoke-release-gate.sh scripts/smoke-shell-direct-http.sh` 通过 |

### Web shell smoke quick unit 挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | `test_smoke_release_gate_unit.py` 先要求 release gate 在真实 `web shell smoke` 前挂载 `scripts/test_smoke_web_shell_unit.py`，确认该 quick unit 缺失 |
| 修复 | 新增 `scripts/test_smoke_web_shell_unit.py` 锁定 `smoke-web-shell.sh` 从仓库根执行 `node --test --test-force-exit apps/lobster-web-shell/test/*.test.mjs`，且不依赖 root `npm test` 或 generated 目录；`smoke-release-gate.sh` 在真实 web shell smoke 前新增 `web shell smoke unit` |
| 验证 | `python3 scripts/test_smoke_release_gate_unit.py`、`python3 scripts/test_smoke_web_shell_unit.py`、`python3 scripts/test_smoke_web_dual_browser_unit.py`、`bash -n scripts/smoke-release-gate.sh scripts/smoke-web-shell.sh`、`node --check scripts/smoke-web-dual-browser.mjs` 通过 |

### Scripts quick unit coverage 护栏挂入 release gate

| 项目 | 结果 |
|------|------|
| 红灯 | `test_smoke_release_gate_unit.py` 先要求 release gate 最前置挂载 `scripts/test_scripts_quick_unit_coverage.py`；新增覆盖率测试后，它自身也先红在 release gate 未包含该护栏 |
| 修复 | 新增 `scripts/test_scripts_quick_unit_coverage.py`，显式锁定 release/smoke/install/start 类脚本与对应 quick unit 的映射，并检查 release gate 已挂载关键 quick unit；`smoke-release-gate.sh` 在 preflight unit 前新增 `scripts quick unit coverage` |
| 验证 | `python3 scripts/test_scripts_quick_unit_coverage.py`、`python3 scripts/test_smoke_release_gate_unit.py`、`bash -n scripts/smoke-release-gate.sh` 通过 |

### SKIP_BUILD 预构建 smoke 依赖债收口

| 项目 | 结果 |
|------|------|
| 红灯 | `test_smoke_release_gate_unit.py` 与 CLI/auth/resident/shell HTTP quick unit 先要求 `need_cmd cargo` 必须位于 `SKIP_BUILD != 1` 构建分支内，确认现有脚本在跳过构建时仍无条件依赖 cargo |
| 修复 | `smoke-release-gate.sh`、`smoke-cli-channel.sh`、`smoke-auth-registration.sh`、`smoke-resident-mainline.sh`、`smoke-shell-dual-http.sh`、`smoke-shell-direct-http.sh` 改为仅在实际构建时检查 cargo；`SKIP_BUILD=1` 路径保留二进制存在性校验 |
| 验证 | 相关 quick unit、`bash -n` 通过；无 cargo 的 PATH 下执行 `RUN_PREFLIGHT=0 INCLUDE_PROVIDER_FEDERATION=0 SKIP_BUILD=1 ... bash scripts/smoke-release-gate.sh` 不再报 `missing command: cargo`，而是在真实 smoke 阶段按预期报缺预构建 gateway binary |

### Resident mainline 预构建二进制检查收口

| 项目 | 结果 |
|------|------|
| 红灯 | `test_smoke_resident_mainline_unit.py` 先要求 `smoke-resident-mainline.sh` 在创建 `STATE_ROOT` 前检查 `GATEWAY_BIN`、`CLI_BIN`、`TUI_BIN` 可执行，确认现有脚本会把缺二进制错误延迟到中段命令执行 |
| 修复 | `smoke-resident-mainline.sh` 在构建分支后新增 gateway/cli/tui 三个预构建二进制存在性检查；`SKIP_BUILD=1` 路径能提前给出明确错误，并避免创建临时 state |
| 验证 | `python3 scripts/test_smoke_resident_mainline_unit.py`、相关 release/smoke quick unit 与 `bash -n` 通过；无 cargo PATH 下分别构造缺 gateway、缺 cli、缺 tui，均提前返回对应 `binary not found` |

### Web dual browser 预构建 Gateway 检查收口

| 项目 | 结果 |
|------|------|
| 红灯 | `test_smoke_web_dual_browser_unit.py` 先要求 `smoke-web-dual-browser.mjs` 在创建 `stateRoot` 前检查 `GATEWAY_BIN` 可执行，并要求入口 catch 输出简洁错误信息 |
| 修复 | `smoke-web-dual-browser.mjs` 新增 `assertExecutable()`，在 `SKIP_BUILD=1`/构建后统一校验 gateway binary；入口失败输出改为优先打印 `error.message`，避免完整 stack/cause 污染 smoke 日志 |
| 验证 | `python3 scripts/test_smoke_web_dual_browser_unit.py`、相关 release/web/resident quick unit、`node --check scripts/smoke-web-dual-browser.mjs` 通过；缺 `GATEWAY_BIN` 时只输出 `gateway binary not found or not executable: ...`，且不会创建 `/tmp/lobster-web-dual-browser.*` state 目录 |

### Web dual browser Playwright 延迟加载收口

| 项目 | 结果 |
|------|------|
| 红灯 | `test_smoke_web_dual_browser_unit.py` 先要求 `smoke-web-dual-browser.mjs` 不再顶层静态 import Playwright，确认缺依赖会早于 `GATEWAY_BIN` 检查失败 |
| 修复 | `smoke-web-dual-browser.mjs` 改为在 `assertExecutable(GATEWAY_BIN, "gateway")` 之后通过 `await import("playwright")` 延迟加载；缺预构建 gateway 时不再被 Playwright 依赖问题遮蔽 |
| 验证 | `python3 scripts/test_smoke_web_dual_browser_unit.py`、`node --check scripts/smoke-web-dual-browser.mjs` 通过；`SKIP_BUILD=1 GATEWAY_BIN=/tmp/lobster-missing-web-gateway node scripts/smoke-web-dual-browser.mjs` 只输出 gateway 缺失错误，且未创建 `/tmp/lobster-web-dual-browser.*` state 目录 |

### Provider federation 预构建路径收口

| 项目 | 结果 |
|------|------|
| 红灯 | `test_smoke_provider_federation_unit.py` 先要求 `smoke-provider-federation.sh` 仅在无 artifact 且需要构建时检查 cargo，并要求 `BIN_PATH` 可执行检查早于 `STATE_ROOT` 创建 |
| 修复 | `smoke-provider-federation.sh` 将 `need_cmd cargo` 移入构建分支；artifact 解包和 gateway binary 可执行检查前置到创建 smoke state 之前；artifact 解包临时目录纳入 cleanup |
| 验证 | `python3 scripts/test_smoke_provider_federation_unit.py`、release gate/coverage quick unit、`bash -n scripts/smoke-provider-federation.sh scripts/smoke-release-gate.sh` 通过；无 cargo PATH 下缺 `BIN_PATH` 或缺 artifact 均给出明确错误，artifact 内 gateway 不可执行时不残留 `/tmp/lobster-chat-smoke.*` |

### Package release 预构建打包路径收口

| 项目 | 结果 |
|------|------|
| 红灯 | `test_package_release_unit.py` 先要求 `package-release.sh` 仅在实际构建时检查 cargo；no-cargo `SKIP_BUILD=1` 打包验证同时暴露 source archive 会把 `.git/fsmonitor--daemon.ipc` socket 打进 tar 的警告 |
| 修复 | `package-release.sh` 将 `need_cmd cargo` 移入 `SKIP_BUILD != 1` 构建分支；source archive 新增 `.git` 排除，避免发布包携带 Git 历史、socket 和本地元数据 |
| 验证 | `python3 scripts/test_package_release_unit.py`、`bash -n scripts/package-release.sh` 通过；只提供 `rustc` 不提供 `cargo` 的 PATH 下执行 `SKIP_BUILD=1 DIST_DIR=/tmp/... bash scripts/package-release.sh` 成功生成 source/web/gateway artifacts，且 source tar 内无 `.git` 路径、无 socket 警告 |

### Package release host target override 收口

| 项目 | 结果 |
|------|------|
| 红灯 | `test_package_release_unit.py` 先要求 `package-release.sh` 支持 `HOST_TARGET_OVERRIDE`，并且只有未提供 override 时才检查 `rustc`；确认预构建打包路径仍被 rustc 环境硬依赖卡住 |
| 修复 | `package-release.sh` 新增 `HOST_TARGET_OVERRIDE`，用于直接指定 gateway artifact target 名；未设置时继续通过 `rustc -vV` 推断 host target，保持默认构建路径不变 |
| 验证 | `python3 scripts/test_package_release_unit.py`、`bash -n scripts/package-release.sh` 通过；无 `rustc/cargo` PATH 下执行 `SKIP_BUILD=1 HOST_TARGET_OVERRIDE=test-target DIST_DIR=/tmp/... bash scripts/package-release.sh` 成功生成 `lobster-waku-gateway-test-target.tar.gz` |

### Package release archive 体积/本地缓存收口

| 项目 | 结果 |
|------|------|
| 红灯 | `test_package_release_unit.py` 先要求 source archive 排除 `.playwright-cli`、根/嵌套 `node_modules`，并要求 H5 shell archive 排除 `node_modules` 与 `backups`；当前项目存在 `apps/lobster-web-shell/node_modules` 约 163M、根 `node_modules` 约 14M、`.playwright-cli` 日志约 4.5M |
| 修复 | `package-release.sh` 的 source tar 新增 `.playwright-cli`、根 `node_modules` 与任意层级 `node_modules` 排除；H5 shell tar 新增 `./node_modules` 与 `./backups` 排除；保留 `generated/`，因为静态 fallback 与测试 fixture 会引用 `generated/bootstrap.json`、`generated/state.json` 与 `generated/state.contract.json` |
| 验证 | `python3 scripts/test_package_release_unit.py`、`bash -n scripts/package-release.sh` 通过；`SKIP_BUILD=1 HOST_TARGET_OVERRIDE=test-target DIST_DIR=/tmp/... bash scripts/package-release.sh` 实测 source tar 不含 `.git`/`.playwright-cli`/`node_modules`/`target`/`dist`，web shell tar 不含 `node_modules`/`backups` 且仍包含 `generated/*.json` |

### Package release runtime artifact 边界收口

| 项目 | 结果 |
|------|------|
| 红灯 | 临时打包检查发现 H5 runtime artifact 仍包含 `screenshots`、`test`、`test-results`、`.tmp` 与根层验收/截图 `.mjs` 脚本；source archive 仍包含前端截图、test-results、backups 与 `.source.html` 生成源文件 |
| 修复 | `package-release.sh` 的 H5 shell tar 新增 `.tmp`、`test`、`test-results`、`screenshots`、根层 `*.mjs`、`.DS_Store` 与 `*.source.html` 排除；source tar 新增任意层级 `backups`、`test-results`、`screenshots`、`.tmp`、`.DS_Store` 与 `*.source.html` 排除，同时保留源码测试目录 |
| 验证 | `python3 scripts/test_package_release_unit.py`、`bash -n scripts/package-release.sh` 通过；临时 `DIST_DIR=/tmp/...` 打包实测 source tar 不含本地生成/备份产物且保留 `apps/lobster-web-shell/test/*.mjs`，web shell tar 不含测试/截图/脚本/缓存并保留运行时页面、JS/CSS、assets 与 generated fallback |

### Restart gateway 预构建入口收口

| 项目 | 结果 |
|------|------|
| 红灯 | `test_restart_gateway_unit.py` 先要求 `restart-gateway.sh` 支持 `SKIP_BUILD` 与 `GATEWAY_BIN`，并在启动/杀进程前检查 binary 可执行；`test_makefile_unit.py` 先要求 `make dev` 不再先 release build 再调用 restart 脚本 |
| 修复 | `restart-gateway.sh` 新增 `SKIP_BUILD`、`GATEWAY_BIN` 与 `need_cmd`，默认仍 build debug gateway；`SKIP_BUILD=1` 时直接使用传入/默认 binary 并提前报缺；`Makefile dev` 收敛为单入口 `./scripts/restart-gateway.sh`，避免 release build 后又 debug build |
| 验证 | `python3 scripts/test_restart_gateway_unit.py`、`python3 scripts/test_makefile_unit.py`、`python3 scripts/test_smoke_release_gate_unit.py`、`bash -n scripts/restart-gateway.sh scripts/smoke-release-gate.sh` 通过；`SKIP_BUILD=1 GATEWAY_BIN=/tmp/lobster-missing-restart-gateway bash scripts/restart-gateway.sh` 提前返回 `gateway binary not found` |

## 2026-06-08 DS v4 Pro Phase 5 完整推进摘要 (3 sessions)

### Bug 修复 (3 项)

| 项目 | 结果 |
|------|------|
| app.js prevMessage 重复声明 | 删除第二个 `const prevMessage`，复用第一个。node --check 通过 |
| Rust 测试 env var 竞争 | 22 个 admin 测试因并行竞争返回 401。Makefile 添加 `--test-threads=1` |
| 骨架头像 `room is not defined` | `room?.id` → `"timeline-skeleton"`（不在函数作用域） |
| 搜索模式全局状态泄漏 (6 测试) | renderRooms/residentList display toggle 添加 `searchModeControlsEl` 守卫 |

### Phase 5-1: 居民检索 + 个人房间入口

| 交付 | 详情 |
|------|------|
| `enterResidentRoom(resident)` | 新 helper：优先使用 `personal_room_id` 直接导航，回退到 `openDirectSession` |
| `renderResidentList()`/`renderResidents()` 收口 | 两处统一使用 `enterResidentRoom` |
| `directRoomPeerOnlineStatus(room)` | 交叉引用 `governance.residents` 获取私聊对象在线状态 |
| 房间头像在线指示器 | CSS `::after` 绿色/灰色圆点 (peer-online/peer-offline) |

### Phase 5-2: 房间 layer 配置 (审查：全链路已完整)
无需额外开发 — SceneImageLayer/HotspotLayer 合同→Gateway→Admin→前端全链路就绪。

### Phase 5-3: 居民搜索 UI 分离

| 交付 | 详情 |
|------|------|
| `searchMode` 变量 + `createSearchModeButton` + `updateSearchModeTabs` | 全部/房间/居民 三模式分段控件 |
| 搜索模式控件 | creative/user 模式搜索框上方 `.creative-search-mode` |
| 显示切换 | rooms-only 隐藏居民列表，residents-only 隐藏房间列表 |
| `bindRoomSearchInput` 增强 | 输入时同步触发 resident list re-render |

### 头像图片渲染 (shell-avatar.js)

| 交付 | 详情 |
|------|------|
| `shell-avatar.js` (NEW, 45行) | djb2 hash → 20 色调色板 → 独特背景色 + 亮度自适应文字色 + 光泽渐变 |
| 5 处渲染接入 | 房间列表、居民列表、peer 消息、self 消息、骨架占位 |
| fake-dom 支持 | 导入映射 + 模块 URL 重写 |

### 测试基线
- JS: **737 pass, 0 fail**
- Rust Gateway: **232 pass, 0 fail** (--test-threads=1)
- **Total: 969 pass, 0 fail**

### 改动文件汇总
| 文件 | 行数 | 说明 |
|------|------|------|
| `shell-avatar.js` | +45 (NEW) | 独立头像样式模块 |
| `app.js` | +150/-14 | Phase 5 全部功能 |
| `styles.css` | +39 | peer-online, creative-search-mode |
| `gateway_tests.rs` | +1 | set_var 恢复 |
| `Makefile` | +1/-1 | --test-threads=1 |
| `test/fake-dom.mjs` | +1 | shell-avatar.js |

### 下一轮建议
1. **TUI parity** — gateway recall/edit/send 端到端测试补齐
2. **Codex 继续技术债** — app.js DOM spec 提取
3. **admin-ds 增强** — 系统日志模块对接审计事件
4. **avatars 进一步** — 支持上传/像素风生成 (需后端端点)

## 2026-06-06 Codex 技术债推进摘要

### Web Shell room inline preview container renderer 复用收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-pages-static.test.mjs` 新增 `room inline preview containers share one DOM renderer`，切 `createRoomInlineActions()` 内部 meta/controls/fieldRows/actions renderer，确认缺少 `createInlineCardContainerNode()`、meta 未复用 helper、row 未复用 helper 时失败 |
| container renderer 收口 | `createRoomInlineActions()` 新增局部 `createInlineCardContainerNode(containerSpec)`，统一消费 `className`、可选 `hidden` 与可选 `ariaHidden`；meta container、controls group、field rows list、field row、actions container 不再各自手写基础容器创建 |
| 防回归测试 | 新增 1 条静态断言，要求 meta 使用 `createInlineCardContainerNode(inlineMetaDomModel)`，controls 使用 `createInlineCardContainerNode(group)`，fieldRows list 使用 `createInlineCardContainerNode(inlineFieldRowsDomModel)`，field row 使用 `createInlineCardContainerNode(rowSpec)`，actions 使用 `createInlineCardContainerNode(inlineActionDomModel)` |
| 验证 | 红灯：缺少 `createInlineCardContainerNode()` 时报错，随后 meta 未复用 helper、row 未复用 helper 均时报错；绿灯：`shell-pages-static.test.mjs` 53 passed；相关 labels/preview/static/fake-dom 测试 304 passed；`node --check apps/lobster-web-shell/app.js`、`shell-quick-action-preview.js`、`shell-pages-static.test.mjs` 通过；`npm test` 736 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8654 → 8660 → 8659 → 8658；本轮净增 4 行，用一个支持 hidden/ariaHidden 的容器入口换掉 meta/controls/fieldRows/actions 五处基础容器创建重复 |

### Web Shell room inline preview button renderer 复用收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-pages-static.test.mjs` 新增 `room inline preview buttons share one DOM renderer`，切 `createRoomInlineActions()` 内部 controls/actions renderer，确认缺少 `createInlineCardButtonNode()` 时失败 |
| button renderer 收口 | `createRoomInlineActions()` 新增局部 `createInlineCardButtonNode(buttonSpec)`，统一消费 `type/buttonType/dataset/text/title/ariaLabel/clickable`；controls 和 actions 只保留各自点击语义，不再重复初始化 button DOM 属性 |
| 防回归测试 | 新增 1 条静态断言，要求 controls/actions 都通过 `createInlineCardButtonNode(buttonSpec)` 创建按钮；同步调整 clickable 测试，让它约束共享 helper 消费 `applyInlineClickableDomSpec(button, buttonSpec.clickable)` |
| 验证 | 红灯：缺少 `createInlineCardButtonNode()` 时报错；绿灯：`shell-pages-static.test.mjs` 52 passed；相关 labels/preview/static/fake-dom 测试 303 passed；`node --check apps/lobster-web-shell/app.js`、`shell-quick-action-preview.js`、`shell-pages-static.test.mjs` 通过；`npm test` 735 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8657 → 8654；本轮净减 3 行，把 inline preview controls/actions button 属性初始化收敛为单一路径 |

### Web Shell room inline preview simple child renderer 复用收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-pages-static.test.mjs` 新增 `room inline preview simple children share one DOM renderer`，切 `createRoomInlineActions()` 内部 header / fieldRows renderer，确认缺少 `createInlineCardSimpleChildNode()` 时失败 |
| simple child renderer 收口 | `createRoomInlineActions()` 新增局部 `createInlineCardSimpleChildNode(childSpec)`，统一消费 `childSpec.type || "div"`、`className` 与 `text || ""`；inline preview header 与 field row 子节点不再各自手写同一套 DOM 创建逻辑 |
| 防回归测试 | 新增 1 条静态断言，要求 header 使用 `inlineCard.appendChild(createInlineCardSimpleChildNode(childSpec))`，field rows 使用 `row.appendChild(createInlineCardSimpleChildNode(childSpec))`；同步调整上一条 header generic child 测试，让它约束共享 helper 路径而非局部内联实现 |
| 验证 | 红灯：缺少 `createInlineCardSimpleChildNode()` 时报错；绿灯：`shell-pages-static.test.mjs` 51 passed；相关 labels/preview/static/fake-dom 测试 302 passed；`node --check apps/lobster-web-shell/app.js`、`shell-quick-action-preview.js`、`shell-pages-static.test.mjs` 通过；`npm test` 734 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8657 → 8657；本轮行数持平，消掉 header / fieldRows 两处简单 child DOM 创建重复，为后续继续统一 inline card 子渲染器留下单一入口 |

### Web Shell room inline preview header generic child render spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-pages-static.test.mjs` 新增 `room inline preview header consumes generic child render specs`，切 `createRoomInlineActions()` 内部 header renderer，确认仍用 `createLine(childSpec.className, childSpec.text)`、未消费 `childSpec.type` 时失败 |
| header 消费收口 | `createRoomInlineActions()` 的 inline preview header renderer 现在按 `childSpec.type || "div"` 创建子节点，并使用 `childSpec.text || ""` 写入文案；render model 输出的通用 child DOM spec 不再只停留在 helper 层 |
| 防回归测试 | 新增 1 条静态断言，锁住 header renderer 对 `type/text` 的通用消费路径，防止后续重新退回 `createLine(className, text)` 的局部协议 |
| 验证 | 红灯：header renderer 未消费 `childSpec.type` 时报错；绿灯：`shell-pages-static.test.mjs` 50 passed；相关 labels/preview/static/fake-dom 测试 301 passed；`node --check apps/lobster-web-shell/app.js`、`shell-quick-action-preview.js`、`shell-pages-static.test.mjs` 通过；`npm test` 733 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8654 → 8657；本轮微增 3 行，把 header 子节点创建从局部 `createLine()` 迁到通用 child render spec 消费，为后续提取统一 child renderer 铺路 |

### Web Shell room inline preview controls/actions clickable render spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-pages-static.test.mjs` 新增 `room inline preview controls and actions consume clickable render specs`，切 `createRoomInlineActions()` 内部 controls/actions renderer，确认缺少 `applyInlineClickableDomSpec(button, buttonSpec.clickable)` 时失败 |
| clickable 消费收口 | `createRoomInlineActions()` 的 inline preview controls 与 CTA actions 现在都消费 render model 的 `buttonSpec.clickable`，统一套用 `is-clickable`、`tabIndex`、`role/title/aria-label` 等可访问性规格 |
| 防回归测试 | 新增 1 条静态断言，防止后续 render model 已生成 clickable 但主入口漏消费；既有 preview helper 测试继续覆盖 clickable spec 内容 |
| 验证 | 红灯：controls renderer 缺少 clickable 消费时报错；绿灯：`shell-pages-static.test.mjs` 49 passed；相关 labels/preview/static/fake-dom 测试 300 passed；`node --check apps/lobster-web-shell/app.js`、`shell-quick-action-preview.js`、`shell-pages-static.test.mjs` 通过；`npm test` 732 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8652 → 8654；本轮微增 2 行，换来 controls/actions button 的可访问性规格与 hint/meta 路径一致 |

### Web Shell room inline preview field row children render DOM spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先增强 `shell-quick-action-preview.test.mjs` 的 `buildQuickActionInlinePreviewFieldRowsRenderDomModel` 测试，要求字段行 child 输出通用 `type/text` render spec，确认缺失 `type/text` 时失败 |
| field row children 抽取 | `buildQuickActionInlinePreviewFieldRowsRenderDomModel()` 现在在保留 `labelNode/valueNode` 兼容字段的同时，将 row children 规范化为 `{ type, className, label, text }` |
| `app.js` 收口 | `createRoomInlineActions()` 的 inline preview field rows 分支改为消费 `childSpec.type/text` 创建子节点，不再依赖字段行专属 `label` 读取路径 |
| 防回归测试 | 增强 1 条 field rows render DOM spec 测试，覆盖 label/value 子节点的 `type/text` 和空 value 的 `待补充` fallback |
| 验证 | 红灯：字段行 child 缺少 `type/text` 报错；绿灯：`shell-quick-action-preview.test.mjs` 181 passed；相关 labels/preview/static/fake-dom 测试 299 passed；`node --check apps/lobster-web-shell/app.js`、`shell-quick-action-preview.js`、`shell-quick-action-preview.test.mjs` 通过；`npm test` 731 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8649 → 8652；本轮微增 3 行，但字段行子节点渲染已改为通用 render spec 消费，为后续统一 inline card child renderer 铺路 |

### Web Shell room inline preview card children render order 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先增强 `shell-quick-action-preview.test.mjs` 的 `buildQuickActionInlinePreviewCardRenderDomModel` 测试，要求 card render model 输出有序 `children`，确认 `children` 缺失时报错 |
| card children 抽取 | `buildQuickActionInlinePreviewCardRenderDomModel()` 现在在保留 `header/meta/controls/fieldRows/actions` 兼容字段的同时，生成 `children`，明确 `header:before-meta → meta → header:after-meta → controls → fieldRows → actions` 顺序 |
| `app.js` 收口 | `createRoomInlineActions()` 改为遍历 `inlineCardChildren` 并按 kind 分发渲染；事件绑定仍保留在主文件，但 inline card 子模块插入顺序由 render model 控制 |
| CSS split 测试债 | `shell-pages-static.test.mjs` 新增 `readAdminShellCss()`，让 admin 静态断言读取 `styles.css + styles.admin.css`，修复 CSS 拆分后测试仍只看主 CSS 导致的 admin selector 假失败 |
| 防回归测试 | 增强 1 条 card render DOM spec 测试，覆盖有序 children 与 header placement 文案；`shell-pages-static.test.mjs` 继续覆盖 admin nav collapse、workspace panel、action-status 高对比样式 |
| 验证 | 红灯：`model.children` 缺失时报错；绿灯：`shell-quick-action-preview.test.mjs` 181 passed；`shell-pages-static.test.mjs` 48 passed；相关 labels/preview/static/fake-dom 测试 299 passed；`node --check apps/lobster-web-shell/app.js`、`shell-quick-action-preview.js`、`shell-pages-static.test.mjs` 通过；`npm test` 731 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8639 → 8649；本轮因主文件新增 kind 分发函数微增 10 行，但 inline card 子模块顺序规则已从主入口下沉到 render model |

### Web Shell room inline preview header children render DOM spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先增强 `shell-quick-action-preview.test.mjs` 的 `buildQuickActionInlinePreviewHeaderDomModel` 测试，要求 header 生成带 placement 的 `children` line 节点规格，确认 `children/placement` 缺失时报错 |
| header children 抽取 | `buildQuickActionInlinePreviewHeaderDomModel()` 现在在保留原 `lines` 兼容字段的同时，生成 `children`，明确 stage/summary line 的 type、key、placement、className 与 text |
| `app.js` 收口 | `createRoomInlineActions()` 的 inline preview header 分支改为按 `before-meta` / `after-meta` placement 消费 children，保持原 stage → meta → summary DOM 顺序，不再直接按 `line.key` 分两段过滤 |
| 防回归测试 | 增强 1 条 header DOM spec 测试，覆盖 stage/summary children 和 placement，避免后续重构改变 inline card 顺序 |
| 验证 | 红灯：`children` 缺失、随后 `placement` 缺失均时报错；绿灯：`shell-quick-action-preview.test.mjs` 181 passed；相关 labels/preview/static/fake-dom 测试 299 passed；`node --check apps/lobster-web-shell/app.js` 与 `shell-quick-action-preview.js` 通过；`npm test` 731 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8643 → 8639；本轮减少 4 行，并把 inline preview header 子节点与插入位置规则下沉到 render model |

### Web Shell room inline preview meta children render DOM spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先增强 `shell-quick-action-preview.test.mjs` 的 `buildQuickActionInlinePreviewMetaRenderDomModel` 测试，要求 meta section 生成 label/container/pill 的 `children` 节点规格，确认 `children` 缺失时报错 |
| meta children 抽取 | `buildQuickActionInlinePreviewMetaRenderDomModel()` 现在在保留原 `labelNode/container/pills` 兼容字段的同时，生成 `children`，明确 label、container、currentStrip、pill 的 type、className、dataset、text、actionTarget 与 clickable |
| `app.js` 收口 | `createRoomInlineActions()` 的 inline preview meta 分支改为消费 `section.children` 递归创建节点，不再本地手工拼 label/container/currentStrip/pill DOM 结构 |
| 防回归测试 | 增强 1 条 meta render DOM spec 测试，覆盖 history section 的完整子节点结构、pill actionTarget 与 clickable 可访问性规格 |
| 验证 | 红灯：`children` 缺失时报错；绿灯：`shell-quick-action-preview.test.mjs` 181 passed；相关 labels/preview/static/fake-dom 测试 299 passed；`node --check apps/lobster-web-shell/app.js` 与 `shell-quick-action-preview.js` 通过；`npm test` 731 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8661 → 8643；本轮减少 18 行，并把 inline preview meta 分区子节点结构规则下沉到 render model |

### Web Shell room inline preview action children render DOM spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先增强 `shell-quick-action-preview.test.mjs` 的 `buildQuickActionInlinePreviewActionRenderDomModel` 测试，要求 CTA actions 生成明确的 `children` button 节点规格，确认 `children` 缺失时报错 |
| action children 抽取 | `buildQuickActionInlinePreviewActionRenderDomModel()` 现在在保留原 `buttons` 兼容字段的同时，生成 `children`，明确 button 的 type、buttonType、dataset、text、title、ariaLabel、actionTarget 与 clickable |
| `app.js` 收口 | `createRoomInlineActions()` 的 inline preview CTA 分支改为消费 `inlineActionDomModel.children` 创建按钮，不再把 `buttons` 同时当业务按钮模型和 DOM 节点规格解释 |
| 防回归测试 | 增强 1 条 action render DOM spec 测试，覆盖 snapshot CTA child 的完整节点结构、actionTarget 与 clickable 可访问性规格 |
| 验证 | 红灯：`children` 缺失时报错；绿灯：`shell-quick-action-preview.test.mjs` 181 passed；相关 labels/preview/static/fake-dom 测试 299 passed；`node --check apps/lobster-web-shell/app.js` 与 `shell-quick-action-preview.js` 通过；`npm test` 731 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8661 → 8661；本轮主入口行数持平，但 CTA button DOM 节点解释规则已从主入口下沉到 render model |

### Web Shell room inline preview controls children render DOM spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先增强 `shell-quick-action-preview.test.mjs` 的 `buildQuickActionInlinePreviewControlsRenderDomModel` 测试，要求 controls group 生成明确的 `children` button 节点规格，确认字段缺失时报错 |
| controls children 抽取 | `buildQuickActionInlinePreviewControlsRenderDomModel()` 现在在保留原 `buttons` 兼容字段的同时，生成 `children`，明确 button 的 type、buttonType、dataset、text、title、actionTarget 与 clickable |
| `app.js` 收口 | `createRoomInlineActions()` 的 inline preview controls 分支改为消费 `group.children` 创建按钮，不再把 `group.buttons` 同时当业务按钮模型和 DOM 节点规格解释 |
| 防回归测试 | 增强 1 条 controls render DOM spec 测试，覆盖 history button child 的完整节点结构、actionTarget 与 clickable 可访问性规格 |
| 验证 | 红灯：`children` 缺失断言失败；绿灯：`shell-quick-action-preview.test.mjs` 181 passed；相关 labels/preview/static/fake-dom 测试 299 passed；`node --check apps/lobster-web-shell/app.js` 与 `shell-quick-action-preview.js` 通过；`npm test` 721 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8661 → 8661；本轮主入口行数持平，但 controls button DOM 节点解释规则已从主入口下沉到 render model |

### Web Shell room inline progress render DOM spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-quick-action-labels.test.mjs` 新增 `buildRoomInlineProgressRenderDomSpec` 导入与组合规格测试，确认缺少导出时报错 |
| progress render 抽取 | 新增 `buildRoomInlineProgressRenderDomSpec()`，在原 progress DOM spec 基础上组合容器、count 子节点和 label 子节点 |
| `app.js` 收口 | `createRoomInlineActions()` 不再分别手工创建 progress count / label 两个 span，改为消费 `children` render spec |
| 防回归测试 | 新增 2 条 progress render DOM spec 测试，覆盖委托中间阶段的完整子节点组合与空输入返回 null |
| 验证 | 红灯：缺少导出时报错；绿灯：`shell-quick-action-labels.test.mjs` 67 passed；相关 labels/preview/static/fake-dom 测试 299 passed；`node --check apps/lobster-web-shell/app.js` 与 `shell-quick-action-labels.js` 通过；`npm test` 721 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8665 → 8661；本轮减少 4 行，并把 inline progress 子节点组合规则下沉到纯 helper |

### Web Shell room inline primary/secondary action DOM spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-quick-action-labels.test.mjs` 新增 `buildRoomInlineActionDomSpec` 导入与 primary/secondary 节点规格测试，确认缺少导出时报错 |
| action 节点抽取 | 新增 `buildRoomInlineActionDomSpec()`，统一房间内联 primary/secondary 动作节点的 tag、class、dataset、tabIndex、role 与文案规格 |
| `app.js` 收口 | `createRoomInlineActions()` 的底部 `appendAction()` 不再本地写死 action span 结构，改为消费纯 DOM spec；点击事件与业务行为仍保留在主文件 |
| 防回归测试 | 新增 2 条 action DOM spec 测试，覆盖 primary、secondary、空 label/role 返回 null，以及未知 action 不写 `actionIntensity` |
| 验证 | 红灯：缺少导出时报错；绿灯：`shell-quick-action-labels.test.mjs` 65 passed；相关 labels/preview/static/fake-dom 测试 297 passed；`node --check apps/lobster-web-shell/app.js` 与 `shell-quick-action-labels.js` 通过；`npm test` 719 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8658 → 8665；本轮因通用 spec 消费和属性映射增加 7 行，但 primary/secondary action 节点结构规则已从主入口下沉到纯 helper |

### Web Shell room inline preview panel render DOM model 组合收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-quick-action-preview.test.mjs` 新增 `buildQuickActionInlinePreviewPanelRenderDomModel` 导入与组合规格测试，确认缺少导出时报错 |
| 组合 render 抽取 | 新增 `buildQuickActionInlinePreviewPanelRenderDomModel()`，统一组合 inline preview 的 hint render DOM model 与 card render DOM model |
| `app.js` 收口 | `createRoomInlineActions()` 不再分别调用 hint render 与 card render helper，只消费一个 panel render model |
| 防回归测试 | 新增 2 条 panel render DOM spec 测试，覆盖 hint dataset、card/header/meta/controls/fieldRows/actions 组合与空输入 |
| 验证 | 红灯：缺少导出时报错；绿灯：`shell-quick-action-preview.test.mjs` 181 passed；相关 labels/preview/static/fake-dom 测试 295 passed；`node --check apps/lobster-web-shell/shell-quick-action-preview.js` 与 `app.js` 通过；`npm test` 717 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8663 → 8658；本轮减少 5 行，并把 inline preview panel 的 render 组合关系下沉到纯 helper |

### Web Shell room inline preview card render DOM model 组合收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-quick-action-preview.test.mjs` 新增 `buildQuickActionInlinePreviewCardRenderDomModel` 导入与组合规格测试，确认缺少导出时报错 |
| 组合 render 抽取 | 新增 `buildQuickActionInlinePreviewCardRenderDomModel()`，统一组合 inline card 的 card/header/meta/controls/fieldRows/actions render DOM model |
| `app.js` 收口 | `createRoomInlineActions()` 不再分别调用 header/meta/controls/action/fieldRows 五个 DOM helper，只消费一个组合 card render model |
| 防回归测试 | 新增 2 条组合 render DOM spec 测试，覆盖 card、header stage/summary、meta 分区、controls target、fieldRows children、actions target 与空输入 |
| 验证 | 红灯：缺少导出时报错；绿灯：`shell-quick-action-preview.test.mjs` 179 passed；相关 labels/preview/static/fake-dom 测试 293 passed；`node --check apps/lobster-web-shell/shell-quick-action-preview.js` 与 `app.js` 通过；`npm test` 715 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8676 → 8663；本轮减少 13 行，并把 inline card DOM model 组合关系下沉到纯 helper |

### Web Shell room inline preview controls render DOM spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-quick-action-preview.test.mjs` 新增 `buildQuickActionInlinePreviewControlsRenderDomModel` 导入与规格测试，确认缺少导出时报错 |
| controls render 抽取 | 新增 `buildQuickActionInlinePreviewControlsRenderDomModel()`，在 controls DOM model 基础上预解析 history / field-view button 的 `actionTarget` 与 clickable 可访问性规格 |
| 空输入修复 | `buildQuickActionInlinePreviewControlsDomModel(null)` 现在安全返回 `null`，避免无效输入直接抛错 |
| `app.js` 收口 | `createRoomInlineActions()` 的 inline preview controls 分支不再本地调用 `quickActionInlinePreviewControlActionTarget()`，改为消费 `buttonSpec.actionTarget` |
| 防回归测试 | 新增 2 条 controls render DOM spec 测试，覆盖 history target、field-view target、aria/title 规格、无效 target 与空输入 |
| 验证 | 红灯：缺少导出时报错；绿灯：`shell-quick-action-preview.test.mjs` 177 passed；相关 labels/preview/static/fake-dom 测试 291 passed；`node --check apps/lobster-web-shell/shell-quick-action-preview.js` 与 `app.js` 通过；`npm test` 713 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8676 → 8676；本轮主入口行数持平，controls target 解释规则已从主文件下沉到纯 helper |

### Web Shell room inline preview action / field rows render DOM spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-quick-action-preview.test.mjs` 新增 `buildQuickActionInlinePreviewActionRenderDomModel` / `buildQuickActionInlinePreviewFieldRowsRenderDomModel` 导入与规格测试，确认缺少导出时报错 |
| action render 抽取 | 新增 `buildQuickActionInlinePreviewActionRenderDomModel()`，在 CTA DOM model 基础上预解析 snapshot/workflow 的 `actionTarget` 与 clickable 可访问性规格 |
| field rows render 抽取 | 新增 `buildQuickActionInlinePreviewFieldRowsRenderDomModel()`，把字段行 label/value 子节点组合为稳定 `children` render 规格 |
| `app.js` 收口 | `createRoomInlineActions()` 的 inline preview 底部 CTA 不再本地调用 `quickActionInlinePreviewActionTarget()`；字段行不再直接读取 `labelNode/valueNode`，改为消费 render model |
| 防回归测试 | 新增 4 条 render DOM spec 测试，覆盖 CTA target、clickable aria/title 规格、无效 action 过滤、字段行子节点组合与空输入 |
| 验证 | 红灯：缺少导出时报错；绿灯：`shell-quick-action-preview.test.mjs` 175 passed；相关 labels/preview/static/fake-dom 测试 289 passed；`node --check apps/lobster-web-shell/shell-quick-action-preview.js` 与 `app.js` 通过；`npm test` 711 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8675 → 8676；本轮因 helper 名称更长微增 1 行，但 CTA target 与字段行 render 组合规则已从主文件下沉到纯 helper |

## 2026-06-05 Codex 技术债推进摘要

### Web Shell room inline preview meta render DOM spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-quick-action-preview.test.mjs` 新增 `buildQuickActionInlinePreviewMetaRenderDomModel` 导入与组合规格测试，确认缺少导出时报错 |
| meta render 抽取 | 新增 `buildQuickActionInlinePreviewMetaRenderDomModel()`，在 meta DOM model 基础上预解析 history / field-view pill 的 `actionTarget` 与 clickable 可访问性规格 |
| `app.js` 收口 | `createRoomInlineActions()` 的 meta 分支不再本地调用 `quickActionInlinePreviewMetaActionTarget()` 或自行生成 clickable spec，只按 `pillSpec.actionTarget/clickable` 绑定 click/keydown 行为 |
| 防回归测试 | 新增 2 条 meta render DOM spec 测试，覆盖 history target、field-view target、aria/title 规格与无效 action 过滤 |
| 验证 | 红灯：缺少导出时报错；绿灯：`shell-quick-action-preview.test.mjs` 171 passed；相关 labels/preview/room-rail/static/fake-dom 测试 425 passed；`node --check apps/lobster-web-shell/app.js` 通过；`npm test` 707 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8675 → 8675；本轮主文件行数持平，但 meta action target 与 clickable 规则已从主文件下沉到纯 helper |

### Web Shell room inline preview hint render DOM spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-quick-action-preview.test.mjs` 新增 `buildQuickActionInlinePreviewHintRenderDomModel` 导入与组合规格测试，确认缺少导出时报错 |
| hint render 抽取 | 新增 `buildQuickActionInlinePreviewHintRenderDomModel()`，在 hint DOM model 基础上预解析 `actionTarget` 与 clickable 可访问性规格 |
| `app.js` 收口 | `createRoomInlineActions()` 的 hint 分支不再本地调用 `quickActionInlinePreviewHintActionTarget()` 解释 action，只消费 render model 上的 `part.actionTarget/part.clickable`；事件绑定仍留在主文件 |
| 防回归测试 | 新增 2 条 hint render DOM spec 测试，覆盖 workflow/snapshot/history target、clickable aria/title 规格与无效 action 过滤 |
| 验证 | 红灯：缺少导出时报错；绿灯：`shell-quick-action-preview.test.mjs` 169 passed；相关 labels/preview/room-rail/static/fake-dom 测试 423 passed；`node --check apps/lobster-web-shell/app.js` 通过；`npm test` 705 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8677 → 8675；本轮减少 2 行，同时把 hint action target 解释从主文件下沉到纯 helper |

### Web Shell room inline actions rail DOM spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-quick-action-labels.test.mjs` 新增 `buildRoomInlineActionsRailDomSpec` 导入与规格测试，确认缺少导出时报错 |
| rail 容器抽取 | 新增 `buildRoomInlineActionsRailDomSpec()`，统一 `room-inline-actions` 容器 class 与 `quickAction/actionIntensity` dataset 规格 |
| `app.js` 收口 | `createRoomInlineActions()` 不再本地写死 rail 容器 class 与 action dataset，改为消费纯 DOM spec；后续 hint/meta/action/fieldRows 渲染仍待继续拆 |
| 防回归测试 | 新增 2 条 rail DOM spec 测试，覆盖已知 action、未知自定义 action、空 action 返回 null |
| 验证 | 红灯：缺少导出时报错；绿灯：`shell-quick-action-labels.test.mjs` 63 passed；相关 labels/preview/room-rail/static/fake-dom 测试 421 passed；`node --check apps/lobster-web-shell/app.js` 通过；`npm test` 703 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8674 → 8677；本轮因通用 spec 消费微增 3 行，但 rail 容器 UI 规则已从主文件下沉到纯 helper |

### Web Shell room inline progress DOM spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-quick-action-labels.test.mjs` 新增 `buildRoomInlineProgressDomSpec` 导入与规格测试，确认缺少导出时报错 |
| inline progress 抽取 | 新增 `buildRoomInlineProgressDomSpec()`，统一房间 inline action 进度条的 class、dataset、title、tabIndex、role、计数和状态标签规格 |
| `app.js` 收口 | `createRoomInlineActions()` 不再本地计算 progress 的 stageIndex、count 文案、label class 与 actionIntensity dataset；点击预览行为仍保留在 `app.js` |
| 防回归测试 | 新增 2 条 inline progress DOM spec 测试，覆盖委托中间阶段、未知状态回退第一阶段、未知 action 返回 null |
| 验证 | 红灯：缺少导出时报错；绿灯：`shell-quick-action-labels.test.mjs` 61 passed；相关 labels/preview/room-rail/static/fake-dom 测试 419 passed；`node --check apps/lobster-web-shell/app.js` 通过；`npm test` 701 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8673 → 8674；本轮因通用 spec 消费与 dataset 写入微增 1 行，但进度条 UI 规则已从主文件下沉到纯 helper |

### Web Shell room quick action pill DOM spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-quick-action-labels.test.mjs` / `shell-quick-action-preview.test.mjs` 新增 `buildRoomQuickActionPillDomSpec` 与 `buildRoomQuickPreviewPillDomSpec` 导入和规格测试，确认缺少导出时报错 |
| quick action pill 抽取 | 新增 `buildRoomQuickActionPillDomSpec()`，统一房间动作 pill 的 text/tone/class/dataset/title 规格 |
| preview pill 抽取 | 新增 `buildRoomQuickPreviewPillDomSpec()`，统一房间预览 pill 的轮次文案、字段视图文案、tone、dataset 与 title 规格 |
| `app.js` 收口 | `createRoomQuickActionPill()` / `createRoomQuickPreviewPill()` 改为消费纯 DOM spec；点击事件、房间聚焦与 composer seed 行为保留在 `app.js` |
| 防回归测试 | 新增 4 条 pill DOM spec 测试，覆盖动作 pill、空 action、最新/历史预览轮次、缺失 historyLabel |
| 验证 | 红灯：两个 helper 缺少导出时报错；绿灯：相关 labels/preview/room-rail/static/fake-dom 测试 417 passed；`node --check apps/lobster-web-shell/app.js` 通过；`npm test` 699 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8675 → 8673 |

### Web Shell quick action preview card render spec 收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-quick-action-preview.test.mjs` 新增 `buildQuickActionPreviewCardRenderDomSpec` 导入与组合规格测试，确认缺少导出时报错 |
| preview card 抽取 | 新增 `buildQuickActionPreviewCardRenderDomSpec()`，统一组合普通 preview card 的 card/header/pills/copy/controlPanels/sheet render spec |
| `app.js` 收口 | `createQuickActionPreviewCard()` 不再直接串联 card/header/pills/copy/history/field-view/sheet 低层 helper，只消费组合 render spec；事件绑定与真实 DOM 创建仍留在 `app.js` |
| 防回归测试 | 新增 2 条 render spec 测试，覆盖 dataset 折叠 flag、pill wrapper、三类 pill 分区、copy、history/field-view 控制面板与 notes sheet |
| 验证 | 红灯：缺少导出时报错；绿灯：`node --test apps/lobster-web-shell/test/shell-quick-action-preview.test.mjs` 165 passed；相关静态/fake-dom 测试 216 passed；`node --check apps/lobster-web-shell/app.js` 通过；`npm test` 695 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8731 → 8675 |

### Web Shell quick action preview 控制区收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-quick-action-preview.test.mjs` 新增 `buildQuickActionPreviewControlPanelsRenderDomSpec` 测试，确认缺少导出时失败 |
| preview 控制区抽取 | 新增 `buildQuickActionPreviewControlPanelsRenderDomSpec()`，统一组合普通 preview card 的 history / field-view 控制面板 render spec |
| `app.js` 收口 | `createQuickActionPreviewCard()` 删除 history / field-view 两段重复 wrapper/button DOM 翻译逻辑，改为消费统一 panel spec；事件绑定仍留在 `app.js` |
| 防回归测试 | `shell-quick-action-preview.test.mjs` 新增复合控制面板测试，覆盖 wrapper、labelLine、buttonsClassName 与 actionTarget |
| 验证 | 红灯：缺少导出时报错；绿灯：`node --test apps/lobster-web-shell/test/shell-quick-action-preview.test.mjs` 163 passed；`node --check apps/lobster-web-shell/app.js` 通过；相关静态/fake-dom 测试 214 passed；`npm test` 最终 693 unit passed / 0 failed，layout passed，realness passed |
| 备注 | 第一次全量 `npm test` 出现一次 `hub shell keeps local-memory gateway composer online without upstream provider` 并跑抖动；该测试单跑 8/8 通过，随后全量复跑通过 |
| `app.js` 行数 | 8749 → 8731 |

### Web Shell quick action / admin-ds 安全债收口

| 项目 | 结果 |
|------|------|
| TDD 红灯 | 先在 `shell-quick-action-labels.test.mjs` 新增 `buildWorkflowProgressDomSpec` 规格测试，确认缺少导出时失败 |
| quick action 抽取 | 新增 `buildWorkflowProgressDomSpec()`，把 workflow progress 的 class/dataset/title/step 规格从 `app.js` 收到纯 helper；`createWorkflowProgress()` 只保留 DOM 创建与事件绑定 |
| admin-ds 安全修复 | 修掉 `loadDevices()` 的 `tbody.innerHTML = ...` 加载/空/失败状态，改为 `clear()` + `el()` + `textContent` |
| 防回归测试 | `shell-quick-action-labels.test.mjs` 追加 3 条 workflow progress DOM spec 边界测试；既有 `admin-ds` 静态测试继续禁止 `tbody.innerHTML` |
| 验证 | `node --test apps/lobster-web-shell/test/shell-quick-action-labels.test.mjs`：57 passed / 0 failed；`node --test apps/lobster-web-shell/test/admin-ds-static.test.mjs apps/lobster-web-shell/test/admin-ds-runtime.test.mjs`：35 passed / 0 failed；`npm test`：692 unit passed / 0 failed，layout passed，realness passed |
| `app.js` 行数 | 8758 → 8749 |

### 本轮改动文件

| 文件 | 说明 |
|------|------|
| `apps/lobster-web-shell/shell-quick-action-labels.js` | 新增 workflow progress DOM spec 纯 helper |
| `apps/lobster-web-shell/test/shell-quick-action-labels.test.mjs` | 新增 helper 单测，覆盖默认 action、自定义 stages、无 stages |
| `apps/lobster-web-shell/app.js` | `createWorkflowProgress()` 改为消费纯 spec，降低本地规则计算 |
| `apps/lobster-web-shell/admin-ds.js` | 设备管理表格状态改用安全 DOM API，恢复静态安全测试 |

### 下一轮建议

1. 继续从 `createQuickActionPreviewCard()` 拆普通 preview card 的控制区 DOM renderer，优先抽无状态 DOM spec 到 `shell-quick-action-preview.js`。
2. 若 DS/CC 正在改 H5 交互，Codex 可转向 Rust gateway/TUI 合同测试，避免并发碰 `app.js`。

## 2026-06-04 Codex 技术债推进摘要

### Gateway 持久化基线修复

| 项目 | 结果 |
|------|------|
| 根因 | `SceneImageLayer.day_image_url/night_image_url` 在 durable postcard schema 上使用 `skip_serializing_if`，当默认 scene 的两个字段为 `None` 时会省略 Option discriminant，导致重启读取 `conversations.postcard` 时布局错位并被 quarantine |
| 修复 | `chat-core` 保留 `#[serde(default)]`，移除两个 Option 字段的 `skip_serializing_if`，确保存储快照始终写出稳定二进制布局 |
| 防回归测试 | `chat-storage` 的 scene metadata roundtrip 覆盖 `image_layer: Some(...)` 且 day/night 均为 `None`；Gateway 新增 `seeded_conversations_persist_across_restart`，验证种子会话重启后不产生 `conversations.postcard.corrupt-*` |
| 验证 | `cargo test -p chat-storage`：13 passed / 0 failed；`cargo test -p lobster-waku-gateway`：232 passed / 0 failed；`cargo test -p lobster-tui`：212 passed / 0 failed；`cargo test -p lobster-cli`：28 passed / 0 failed |
| 已恢复的红灯 | `runtime_persists_shell_messages_across_restart`、`edit_and_recall_state_persists_across_restart`、`email_otp_verification_seeds_canonical_guide_direct_conversation` |

## 2026-06-02 DS v4 Pro 执行摘要

### 本轮完成

| 阶段 | 目标 | 状态 |
| --- | --- | --- |
| P0 | H5 IM 主路径真实验收 (双端消息闭环) | 完成 |
| P1 | Gateway 合同加固 + 审核持久化 + 边界测试 | 完成 |
| P3 | admin-ds 审核 (create-permission-group 需后端设计，已标注) | 完成 |
| P4 | 多页面左栏一致性验证 (已统一 220px) | 完成 |
| P5 | TUI/CLI parity 测试通过 | 完成 |

### 核心交付

| 交付 | 详情 |
|------|------|
| 审核持久化 | `message_moderation` HashMap → `moderation-state.json` 文件持久化，atomic write |
| 新增 Gateway 测试 | 审核持久化、readback、不存在房间拒绝、并发 presence HTTP |
| H5 双端验收 | qa-a ↔ qa-b 公共房间 + 直聊收发验证通过，未读标记正常 |
| 测试基线 | Gateway 214, TUI 195, CLI 16, Web Shell 688 (总计 1113, 全部 0 fail) |

### 改动文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `gateway_models.rs` | 修改 | 新增 `moderation_state_path: PathBuf` |
| `core_runtime.rs` | 修改 | 新增 `persist_moderation_state()` / `load_moderation_state()`，审核后自动持久化 |
| `gateway_tests.rs` | 新增 4 测试 | moderation_state_persists, send_to_nonexistent_room, admin_moderation_status_readback, concurrent_presence_http |
| `ACTIVE_WORK_QUEUE.md` | 更新 | 本轮摘要

### 技术债压降追加

| 项目 | 结果 |
|------|------|
| `app.js` 房间搜索重复实现 | 已删除本地 `roomMatchesSearch()`，统一委托 `shell-room-rail.js` |
| 防回归测试 | `shell-pages-static.test.mjs` 新增静态约束，禁止 `app.js` 重新保留搜索实现 |
| 角色权限 helper | 新增 `shell-role-permissions.js`，抽出 `roleAllows*` 纯权限判断 |
| 权限 helper 防回归测试 | 新增 `shell-role-permissions.test.mjs`，覆盖 Lord/Steward/Resident/空角色权限边界 |
| quick action follow-up helper | `quickActionFollowUpLabel/Copy` 从 `app.js` 移入 `shell-quick-action-labels.js` |
| quick action 标签测试 | `shell-quick-action-labels.test.mjs` 新增 3 条 follow-up helper 边界测试 |
| quick action badge helper | `quickActionBadgeLabel/Tone/Intensity` 从 `app.js` 移入 `shell-quick-action-labels.js` |
| quick action badge 测试 | `shell-quick-action-labels.test.mjs` 新增 3 条 badge helper 边界测试 |
| quick action summary/context helper | `quickActionSummary/ContextCopy` 从 `app.js` 文案拼接移入 `shell-quick-action-labels.js` |
| quick action summary/context 测试 | `shell-quick-action-labels.test.mjs` 新增 4 条 summary/context helper 边界测试 |
| quick action 状态推进 helper | `nextQuickActionState` 从 `app.js` 移入 `shell-quick-action-labels.js` |
| quick action 状态推进测试 | `shell-quick-action-labels.test.mjs` 新增 3 条 next-state 边界测试 |
| quick action 默认发送文案 helper | `quickActionDefaultSendLabel` 从 `app.js` switch 移入 `shell-quick-action-labels.js` |
| quick action 默认发送文案测试 | `shell-quick-action-labels.test.mjs` 新增 2 条 send-label 边界测试 |
| workflow progress 阶段状态 helper | `workflowProgressStageState` 从 `app.js` 移入 `shell-quick-action-labels.js` |
| workflow progress 阶段状态测试 | `shell-quick-action-labels.test.mjs` 新增 3 条 stage-state 边界测试 |
| quick action 结构化草稿 helper | `quickActionStructuredDraft` 从 `app.js` 移入 `shell-quick-actions.js` |
| quick action runtime 测试 | 新增 `shell-quick-actions.test.mjs`，覆盖结构字段草稿、默认模板、合同模板覆盖 |
| quick action preview 视图规则 helper | `quickActionPreviewDefaultFieldView` / `quickActionPreviewHistoryToneClass` 从 `app.js` 移入 `shell-quick-action-preview.js` |
| quick action preview 视图规则测试 | `shell-quick-action-preview.test.mjs` 新增 6 条默认视图 / 历史轮次 tone 边界测试 |
| quick action preview 记录视图 helper | `quickActionPreviewResolvedSnapshotIndex` / `quickActionPreviewSelectedFieldView` 抽出 record 与 snapshot 选择规则 |
| quick action preview 记录视图测试 | `shell-quick-action-preview.test.mjs` 新增 6 条 snapshot index / record fieldView 边界测试 |
| quick action preview state/index helper | `quickActionPreviewSelectedState` / `quickActionPreviewSelectedSnapshotIndex` 抽出 preview 状态与快照索引选择规则 |
| quick action preview state/index 测试 | `shell-quick-action-preview.test.mjs` 新增 5 条 state / snapshot index 边界测试 |
| quick action snapshot history helper | `quickActionSnapshotHistoryFromRecord` / `quickActionSnapshotFromHistory` 抽出 snapshot history 记录读取与快照选择规则 |
| quick action snapshot history 测试 | `shell-quick-action-preview.test.mjs` 新增 4 条 snapshot history / snapshot selection 边界测试 |
| quick action preview view helper | `resolveQuickActionPreviewView` 抽出 snapshot/stage preview 展示模型组装规则 |
| quick action preview view 测试 | `shell-quick-action-preview.test.mjs` 新增 3 条 snapshot/stage/null preview view 边界测试 |
| quick action preview model helper | `buildQuickActionPreviewModel` 抽出 room preview model 组装规则 |
| quick action preview model 测试 | `shell-quick-action-preview.test.mjs` 新增 3 条 preview model / history tone / null 边界测试 |
| quick action preview card model helper | `buildQuickActionPreviewCardModel` 抽出 preview card 历史索引、字段视图与 active structured 选择规则 |
| quick action preview card model 测试 | `shell-quick-action-preview.test.mjs` 新增 3 条 card model / fallback / null 边界测试 |
| quick action preview card chrome helper | `buildQuickActionPreviewCardChromeModel` 抽出 preview card 顶部当前条、历史轮次、字段视图 toggle 与折叠状态规则 |
| quick action preview card chrome 测试 | `shell-quick-action-preview.test.mjs` 新增 3 条 current strip / history toggle / safe fallback 边界测试 |
| quick action inline preview card model helper | `buildQuickActionInlinePreviewCardModel` 抽出 inline preview card 字段集、字段视图与摘要选择规则 |
| quick action inline preview card model 测试 | `shell-quick-action-preview.test.mjs` 新增 4 条 latest/history/resolved/null 边界测试 |
| quick action inline preview meta model helper | `buildQuickActionInlinePreviewMetaModel` 抽出 inline preview meta pill 当前条、轮次选项、字段视图选项、切换标题与折叠状态规则 |
| quick action inline preview meta model 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条多轮/单轮、history/field-view toggle 边界测试 |
| quick action inline preview controls model helper | `buildQuickActionInlinePreviewControlsModel` 抽出 inline preview 历史按钮、字段视图按钮、hidden/aria-hidden 与 dataset 规则 |
| quick action inline preview controls model 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条多轮按钮组/单轮空按钮组边界测试 |
| quick action inline preview action model helper | `buildQuickActionInlinePreviewActionModel` 抽出 inline preview 底部 snapshot/workflow CTA 顺序、默认态、优先级与提示文案规则 |
| quick action inline preview action model 测试 | `shell-quick-action-preview.test.mjs` 新增 3 条可推进阶段/不可推进阶段/历史轮 CTA 顺序边界测试 |
| quick action inline preview hint model helper | `buildQuickActionInlinePreviewHintModel` 抽出 inline preview 顶部阶段、主字段、轮次 hint 与下一轮切换规则 |
| quick action inline preview hint model 测试 | `shell-quick-action-preview.test.mjs` 新增 3 条多轮/单轮/缺失输入边界测试 |
| quick action inline preview field rows model helper | `buildQuickActionInlinePreviewFieldRowsModel` 抽出 inline preview 字段行 label/value 规范化与空值“待补充”回退规则 |
| quick action inline preview field rows model 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条字段行规范化/空输入边界测试 |
| quick action inline preview meta sections model helper | `buildQuickActionInlinePreviewMetaSectionsModel` 抽出 inline preview meta 当前/轮次/视图分区顺序与空分区过滤规则 |
| quick action inline preview meta sections model 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条分区顺序/空输入边界测试 |
| quick action inline preview header model helper | `buildQuickActionInlinePreviewHeaderModel` 抽出 inline preview card 顶部阶段/摘要文本规范化与空文本过滤规则 |
| quick action inline preview header model 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条顶部文案/空输入边界测试 |
| quick action inline preview render model helper | `buildQuickActionInlinePreviewRenderModel` 组合 card/header/meta/controls/fieldRows/actions 纯模型，减少 `app.js` 手动串联 |
| quick action inline preview render model 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条组合模型/缺失输入边界测试 |
| quick action inline preview panel model helper | `buildQuickActionInlinePreviewPanelModel` 组合 hint 与 card render model，统一 inline preview 可渲染判定 |
| quick action inline preview panel model 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 panel 组合/缺失输入边界测试 |
| quick action inline preview primary field helper | `buildQuickActionInlinePreviewPanelModel` 支持从 `resolvedPreviewView.primaryFieldText` 推导主字段，收拢 `app.js` 的 `previewField` 前置判定 |
| quick action inline preview latest-view helper | 新增 `quickActionPreviewViewingLatest`，`buildQuickActionInlinePreviewRenderModel` 可从历史快照自动推导最新/历史轮 CTA 语义 |
| quick action inline preview panel model 追加测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 resolved preview 主字段推导 / 历史快照 latest-view 推导测试 |
| quick action inline preview hint DOM model helper | 新增 `buildQuickActionInlinePreviewHintDomModel`，把 inline preview hint 容器、分隔符、stage/field/round 节点 class/title/action 规格从 `app.js` 收到纯模型 |
| quick action inline preview hint DOM model 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 hint DOM 节点规格 / 无 round 规格测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action inline preview meta DOM model helper | 新增 `buildQuickActionInlinePreviewMetaDomModel`，把 inline preview meta 容器、label、current strip、pill class/dataset/action 规格从 `app.js` 收到纯模型 |
| quick action inline preview meta DOM model 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 meta 分区 DOM 规格 / 空分区与空 pill 过滤测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action inline preview controls DOM model helper | 新增 `buildQuickActionInlinePreviewControlsDomModel`，把 inline preview history / field-view 控制按钮容器、button type/title/dataset/action 规格从 `app.js` 收到纯模型 |
| quick action inline preview controls DOM model 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 controls DOM 分组规格 / 空按钮组与空标签过滤测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action inline preview action DOM model helper | 新增 `buildQuickActionInlinePreviewActionDomModel`，把 inline preview snapshot/workflow CTA 容器、button type/title/aria/dataset/action id 规格从 `app.js` 收到纯模型 |
| quick action inline preview action DOM model 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 action DOM 按钮规格 / 空按钮组与空标签过滤测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action inline preview field rows DOM model helper | 新增 `buildQuickActionInlinePreviewFieldRowsDomModel`，把 inline preview 字段列表容器、行、label/value 节点 class 与空值回退规格从 `app.js` 收到纯模型 |
| quick action inline preview field rows DOM model 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 field rows DOM 列表规格 / 空行与空标签过滤测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action inline preview header DOM model helper | 新增 `buildQuickActionInlinePreviewHeaderDomModel`，把 inline preview 顶部阶段/摘要 line 的 class 与文本过滤规则从 `app.js` 收到纯模型 |
| quick action inline preview header DOM model 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 header DOM line 规格 / 空标题与空行过滤测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action inline preview card DOM model helper | 新增 `buildQuickActionInlinePreviewCardDomModel`，把 inline preview card 容器 class、`actionIntensity` dataset 与 history/field-view 折叠 dataset flag 键从 `app.js` 收到纯模型 |
| quick action inline preview card DOM model 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 card DOM 容器/dataset flag 规格与空 intensity/default meta 测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action inline preview render model cardDom | `buildQuickActionInlinePreviewRenderModel` 现在直接输出 `cardDom`，把 `quickActionIntensity(action)` 与 card DOM 组合从 `app.js` 收回模型层 |
| quick action inline preview render model cardDom 测试 | `shell-quick-action-preview.test.mjs` 扩展 render model 组合测试，覆盖 `cardDom.dataset.actionIntensity` 和折叠 dataset flag |
| quick action inline preview meta action target helper | 新增 `quickActionInlinePreviewMetaActionTarget`，把 inline preview meta pill 的 history / field-view action target 校验与规范化从 `app.js` 收到纯模型 |
| quick action inline preview meta action target 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 history/field-view target 解析与无效 action 过滤测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action inline preview hint action target helper | 新增 `quickActionInlinePreviewHintActionTarget`，把 inline preview 顶部 hint 的 workflow / snapshot / history action target 校验与规范化从 `app.js` 收到纯模型 |
| quick action inline preview hint action target 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 workflow/snapshot/history target 解析与无效 action 过滤测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action inline preview control action target helper | 新增 `quickActionInlinePreviewControlActionTarget`，把 inline preview history / field-view 控制按钮的 action target 校验与规范化从 `app.js` 收到纯模型 |
| quick action inline preview control action target 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 controls target 解析与无效 action 过滤测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action inline preview action target helper | 新增 `quickActionInlinePreviewActionTarget`，把 inline preview 底部 snapshot/workflow CTA button id 到 action target 的解释从 `app.js` 收到纯模型 |
| quick action inline preview action target 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 snapshot/workflow CTA target 解析与无效 id 过滤测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action inline preview clickable DOM spec helper | 新增 `quickActionInlinePreviewClickableDomSpec`，把 inline preview hint/meta 可点击节点的 `is-clickable`、`tabIndex`、`role`、title/aria 规格从 `app.js` 收到纯模型 |
| quick action inline preview clickable DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条带 title/空 title 可访问性规格测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview key activation helper | 新增 `quickActionPreviewKeyActivates`，把 preview card 与 inline preview meta pill 的 Enter/Space 键盘激活判断从 `app.js` 收到纯模型 |
| quick action preview key activation 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 Enter/Space 激活与其他键过滤测试；同步 `fake-dom.mjs` import 替换映射并修复 import 顺序匹配 |
| quick action preview card DOM spec helper | 新增 `buildQuickActionPreviewCardDomSpec`，把普通 preview card 容器 class 与 `actionIntensity/quickAction/previewState` dataset 规格从 `app.js` 收到纯模型 |
| quick action preview card DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条容器 class/dataset 规格与空输入过滤测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview clickable DOM spec helper | 新增 `quickActionPreviewClickableDomSpec`，并让 inline clickable helper 复用通用规格；普通 preview card meta pill 可点击规格不再手写在 `app.js` |
| quick action preview clickable DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条通用 preview 可点击规格测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview card header DOM spec helper | 新增 `buildQuickActionPreviewCardHeaderDomSpec`，把普通 preview card header/heading/kicker/title class 与标题 fallback 规则从 `app.js` 收到纯模型 |
| quick action preview card header DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 header DOM 规格与 title fallback 测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview history controls DOM spec helper | 新增 `buildQuickActionPreviewHistoryControlsDomSpec`，把普通 preview card 历史快照按钮区 wrapper/label/button class、dataset、text/title 规格从 `app.js` 收到纯模型 |
| quick action preview history controls DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条多轮历史按钮区/单轮空返回测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview field-view controls DOM spec helper | 新增 `buildQuickActionPreviewFieldViewControlsDomSpec`，把普通 preview card 字段视图切换区 wrapper/button dataset、title/text 与 stage/snapshot 选择规则从 `app.js` 收到纯模型 |
| quick action preview field-view controls DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条字段视图按钮区/无切换返回 null 测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview card pills DOM spec helper | 新增 `buildQuickActionPreviewCardPillsDomSpec`，把普通 preview card 当前/轮次/视图 pill 分组、dataset、title 与 action target 规格从 `app.js` 收到纯模型 |
| quick action preview card pills DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条完整 pill 分组/仅当前基础 pill 测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview card sheet DOM spec helper | 新增 `buildQuickActionPreviewCardSheetDomSpec`，把普通 preview card 字段 sheet、row/label/value class 与 notes 拼接规格从 `app.js` 收到纯模型 |
| quick action preview card sheet DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条字段截断/notes 与无效字段过滤测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview card sheet render DOM spec helper | 新增 `buildQuickActionPreviewCardSheetRenderDomSpec`，把普通 preview card sheet wrapper、字段行子节点和 notes 子节点组合规格从 `app.js` 收到纯模型 |
| quick action preview card sheet render DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 sheet render children / 空 sheet 安全返回测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview control wrapper state helper | 新增 `buildQuickActionPreviewControlWrapperDomState`，把普通 preview card history/view 控制区 wrapper class、hidden 与 `aria-hidden` 合同从 `app.js` 收到纯模型 |
| quick action preview control wrapper state 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条折叠/展开 wrapper 状态测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview control panel DOM spec helper | 新增 `buildQuickActionPreviewControlPanelDomSpec`，把普通 preview card history/view 控制区 wrapper state、label、buttons 组合规格从 `app.js` 收到纯模型 |
| quick action preview control panel DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 history panel / field-view panel 组合规格测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview card copy DOM spec helper | 新增 `buildQuickActionPreviewCardCopyDomSpec`，把普通 preview card summary/follow-up copy 优先级、class 与空值过滤从 `app.js` 收到纯模型 |
| quick action preview card copy DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 summary 优先/fallback 与空输入测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview summary line DOM spec helper | 新增 `buildQuickActionPreviewSummaryLineDomSpec`，把 preview summary 行 tag/class、lead、history chip、分隔符与 summary copy 节点规格从 `app.js` 收到纯模型 |
| quick action preview summary line DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条带前缀历史 chip/snapshot fallback 与空输入测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview card pill action target helper | 新增 `quickActionPreviewCardPillActionTarget`，把普通 preview card pill 的 history / field-view action target 校验与规范化从 `app.js` 收到纯模型 |
| quick action preview card pill action target 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 history/field-view target 解析与无效 action 过滤测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview card control action target helper | 新增 `quickActionPreviewCardControlActionTarget`，把普通 preview card 历史/字段视图控制按钮 target 校验与规范化从 `app.js` 收到纯模型 |
| quick action preview card control action target 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 history/field-view control target 解析与无效输入过滤测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview card pill sections DOM spec helper | 新增 `buildQuickActionPreviewCardPillSectionsDomSpec`，把普通 preview card pill 的 current/history/field-view 分区顺序与空分区过滤从 `app.js` 收到纯模型 |
| quick action preview card pill sections DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条分区顺序/空分区过滤测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview card pill sections 残留清理 | 删除 `app.js` 中 `currentPills` 旧预渲染残留，避免 sections helper 接管后仍保留未定义/无效 DOM 路径 |
| quick action preview card pill sections 静态防回归 | `shell-pages-static.test.mjs` 新增约束，要求 `createQuickActionPreviewCard()` 只通过 `buildQuickActionPreviewCardPillSectionsRenderDomSpec` 渲染分区，禁止 `currentPills` / `pillSection ===` / 直接 action target 解释回流 |
| quick action preview card pill sections render DOM spec helper | 新增 `buildQuickActionPreviewCardPillSectionsRenderDomSpec`，把普通 preview card pill 分区和 history/field-view action target 规范化从 `app.js` 收到纯模型 |
| quick action preview card pill sections render DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条分区 target 规范化 / 无效 target 过滤测试；同步 `fake-dom.mjs` import 替换映射 |
| quick action preview control button DOM spec helper | 新增 `buildQuickActionPreviewControlButtonDomSpec`，把普通 preview card history/field-view 控制按钮 type/class/dataset/text/title/source 规格从 `app.js` 收到纯模型 |
| quick action preview control button DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条 history button / field-view button 规格测试；`quickActionPreviewCardControlActionTarget` 支持规范化后 `source`，`app.js` 点击逻辑不再回读 raw button spec |
| quick action preview control panel render DOM spec helper | 新增 `buildQuickActionPreviewControlPanelRenderDomSpec`，把普通 preview card history/view 控制区 wrapper/label/buttons 组合与按钮规范化从 `app.js` 收到纯模型 |
| quick action preview control panel render DOM spec 测试 | `shell-quick-action-preview.test.mjs` 新增 2 条控制区 render spec / 空按钮过滤测试；同步 `fake-dom.mjs` import 替换映射，修复临时 app 拷贝的 preview 模块导入 |
| Web Shell fake-dom import 基线修复 | `fake-dom.mjs` 对 `./shell-quick-action-preview.js` 增加模块级 URL 重写兜底，避免导入清单变化导致临时 app 从 `/tmp` 解析失败 |
| Web Shell fake-dom import 统一映射 | 新增 `APP_LOCAL_IMPORT_PATHS` / `rewriteAppLocalImports()`，统一重写 `app.js` 所有 `./*.js` 本地导入，并删除旧多行 `.replace()` 链与冗余 URL 常量 |
| fake-dom import 防回归测试 | 新增 `fake-dom-import-rewrite.test.mjs`，自动对比 `app.js` 当前本地 imports 与 fake-dom 映射表，并验证真实 app rewrite 后无相对本地导入残留 |
| quick action preview 控制文案契约同步 | `shell-quick-action-preview.test.mjs` 对齐 `historyLabel` 驱动的 snapshot 切换 title，保留“字段”语义 |
| pixel scene hotspot label CSS 合同修复 | 补齐 `styles.pixel-map.css` clear-mode 下 hotspot label 隐藏/hover/near-pointer/blank-click 可见规则，恢复 `shell-pages-static.test.mjs` 静态合同 |
| creative scene hotspot 真实交互修复 | `styles.pixel-map.css` 末尾恢复具体 hotspot `pointer-events: auto`，容器保持不拦截空白区；`shell-pages-static.test.mjs` 增加防回归，`verify-frontend-realness.mjs` 通过 |
| `app.js` 行数 | 9021 → 8955 → 8942 → 8936 → 8926 → 8925 → 8918 → 8904 → 8899 → 8881 → 8864 → 8828 → 8816 → 8804 → 8775 → 8771 → 8761 → 8759 → 8744 → 8672 → 8681 → 8671 → 8677 → 8679 → 8674 → 8684 → 8656 → 8651 → 8649 → 8648 → 8645 → 8632 → 8638 → 8641 → 8651 → 8651 → 8647 → 8649 → 8651 → 8730 → 8732 → 8737 → 8738 → 8739 → 8742 → 8743 → 8744 → 8791 → 8752 → 8755 → 8764 → 8768 → 8747 → 8749 → 8752 → 8743 → 8740 → 8742 → 8746 → 8752 → 8747 → 8746 |
| Web Shell 测试 | 691 passed / 0 failed；layout / realness passed |

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

## 2026-06-11 Codex 技术债补充: start-terminal 预构建入口收口

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 红灯契约 | 完成 | `scripts/test_start_terminal_shell_unit.py` 增加 `SKIP_BUILD`、`GATEWAY_BIN`、`TUI_BIN`、binary 可执行检查和 exec 路径断言 |
| 启动脚本 | 完成 | `scripts/start-terminal.sh` 支持 `SKIP_BUILD=1` 走预构建 gateway/TUI，不再无条件要求 cargo |
| Gateway 启动 | 完成 | 非复用现有健康端点时先按需构建 `lobster-waku-gateway`，再通过 `GATEWAY_BIN` 启动 |
| TUI 启动 | 完成 | 按需构建 `lobster-tui`，最终通过 `TUI_BIN` 启动，缺失时报明确路径 |

### 验证

```bash
python3 scripts/test_start_terminal_shell_unit.py
python3 scripts/test_start_terminal_unit.py
bash -n scripts/start-terminal.sh
python3 scripts/test_package_release_unit.py && python3 scripts/test_scripts_quick_unit_coverage.py && python3 scripts/test_smoke_release_gate_unit.py && python3 scripts/test_smoke_provider_federation_unit.py && python3 scripts/test_smoke_web_dual_browser_unit.py && python3 scripts/test_smoke_resident_mainline_unit.py && python3 scripts/test_smoke_cli_channel_unit.py && python3 scripts/test_smoke_auth_registration_unit.py && python3 scripts/test_smoke_shell_dual_http_unit.py && python3 scripts/test_smoke_shell_direct_http_unit.py && python3 scripts/test_smoke_web_shell_unit.py && python3 scripts/test_install_server_unit.py && python3 scripts/test_preview_server_unit.py && python3 scripts/test_start_terminal_shell_unit.py && python3 scripts/test_audit_web_assets_unit.py && python3 scripts/test_lobster_device_id_unit.py && python3 scripts/test_start_web_preview_unit.py && python3 scripts/test_restart_gateway_unit.py && python3 scripts/test_preflight_unit.py && python3 scripts/test_smoke_public_ingress_unit.py && python3 scripts/test_smoke_install_layout_unit.py && python3 scripts/test_start_terminal_unit.py && python3 scripts/test_makefile_unit.py
bash -n scripts/package-release.sh scripts/smoke-provider-federation.sh scripts/smoke-release-gate.sh scripts/smoke-resident-mainline.sh scripts/smoke-cli-channel.sh scripts/smoke-auth-registration.sh scripts/smoke-shell-dual-http.sh scripts/smoke-shell-direct-http.sh scripts/install-server.sh scripts/smoke-web-shell.sh scripts/start-terminal.sh scripts/audit-web-assets.sh scripts/lobster-device-id.sh scripts/restart-gateway.sh scripts/preflight.sh scripts/smoke-public-ingress.sh scripts/smoke-install-layout.sh
zsh -n scripts/start-web-preview.sh
node --check scripts/preview-server.mjs
node --check scripts/smoke-web-dual-browser.mjs
git diff --check
```

## 2026-06-17 Codex 技术债推进: web-shell app.js 长函数与纯规格抽取

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| app.js 长函数清零 | 完成 | 拆分 `ensureWorkspaceChrome()`、`ensureUserSceneChrome()`、`syncRoomStageCanvas()`，并继续拆 `loadWorldState()` / `main()`；当前全部 `function`（含 async）扫描无超过 50 行的函数 |
| workspace chrome 拆分 | 完成 | 工作区 nav、用户搜索、room toolbar、composer 辅助层、caretaker chrome 分离，并新增静态护栏 |
| user scene chrome 拆分 | 完成 | 房间侧栏、舞台 canvas、人物 canvas、chat-detail 面板拆成独立 helper，不改场景热点/图层交互合同 |
| room stage canvas 拆分 | 完成 | 默认住宅画布、用户房间画布、note 更新与 visual 构建分离 |
| world state payload 纯模型 | 完成 | `governanceFromWorldSnapshotBundle()` / `governanceFromWorldApiPayload()` 移入 `shell-state-normalize.js`；`loadWorldState()` 只保留请求与赋值，新增 3 条单测和静态防回流护栏 |
| main 启动编排拆分 | 完成 | `initializeLocalShellState()`、`loadInitialRuntimeState()`、`bindSceneEditorLink()`、`renderInitialShell()` 接管启动阶段；`main()` 不再直接拼 scene-editor URL 或堆本地状态加载细节 |
| composer placeholder 纯函数 | 完成 | `composerPlaceholderForState()` 移入 `shell-room-render.js`，新增 6 条单测；`app.js` 只收集运行态并委托 |
| message owner action spec | 完成 | `messageOwnerActionSpecs()` 移入 `shell-message-render.js`，新增 edit/recall 可见性单测；DOM 事件绑定仍留在 `app.js` |
| chat detail runtime rows 纯模型 | 完成 | `chatRuntimeDetailModelForState()` 移入 `shell-room-render.js`，把聊天详情运行状态行、quick action 行、provider/输入/管家/错误行顺序下沉；`app.js` 只负责 detail row DOM 与预览卡交互 |
| timeline committed render items | 完成 | `timelineCommittedMessageRenderItems()` 移入 `shell-message-render.js`，把已提交消息的未读/日期 divider 与 message row 顺序下沉；`app.js` 只按 item 类型创建透明 DOM 节点 |
| world directory 纯规格 | 完成 | 新增 `shell-governance-render.js`，把世界目录空状态和城市卡文案/class 规格下沉；`renderWorldDirectory()` 只负责 DOM 创建和列表挂载 |
| mirror sources 纯规格 | 完成 | `mirrorSourcesEmptyStateText()` / `mirrorSourceCardModel()` 下沉世界镜像源空状态、状态行、计数行和最近快照文案；`renderMirrorSources()` 只负责 DOM 创建和列表挂载 |
| world square notice 纯规格 | 完成 | `worldSquareEmptyStateText()` / `worldSquareNoticeCardModel()` 下沉世界广场空状态、标题/meta、正文、标签/时间文案；`renderWorldSquare()` 只负责 DOM 创建和列表挂载 |
| world safety mirror 纯规格 | 完成 | `worldSafetyEmptyStateText()` / `worldSafetyMirrorCardModel()` 下沉世界安全空状态、镜像城市数量、信任状态列表和治理员文案；`renderWorldSafety()` 继续只做列表组合 |
| world safety advisory 纯规格 | 完成 | `worldSafetyAdvisoryEmptyStateText()` / `worldSafetyAdvisoryCardModel()` 下沉世界安全通告空态、动作、对象类型和发布时间文案；`appendWorldSafetyAdvisoryCards()` 只负责分支和挂载 |
| world safety summary/detail 纯规格 | 完成 | `worldSafetySanctionSummaryCardModel()` / `worldSafetyReportSummaryCardModel()` / `worldSafetySanctionCardModel()` / `worldSafetyReportCardModel()` 下沉制裁/举报摘要与明细文案；`renderWorldSafety()` 和 append helpers 只做列表组合 |
| resident directory 纯规格 | 完成 | `residentDirectoryEmptyStateText()` / `residentDirectoryCardModel()` 下沉居民目录空态、标题/slug、已加入/待审批城市与身份行文案；`app.js` 只保留 DOM 创建、私聊按钮和当前身份判断 |
| caretaker panel 纯规格 | 完成 | 新增 `shell-caretaker-panel.js`，下沉非居民页管家面板标题、资料、消息、规则和状态条 items；`app.js` 只负责 DOM 创建和当前房间标题注入 |
| governance offline/header 纯规格 | 完成 | `governanceOfflineStateModel()` / `governanceWorldHeaderModel()` / `governanceEmptyCityStateModel()` 下沉治理离线态、世界 header 摘要和空城市列表文案；`app.js` 只负责清 DOM 与挂载 |
| governance city card base 纯规格 | 完成 | `governanceCityCardBaseModel()` 下沉城市卡基础 class、标题/slug、简介、成员状态与公开发现/入城审批文案；`app.js` 只负责创建 DOM 和注入 `humanMembership()` |
| governance city room list 纯规格 | 完成 | `governanceCityRoomListModel()` 下沉公共房间标题、容器/行 class、冻结标签、打开/冻结按钮文案和冻结权限判定；`app.js` 只保留按钮事件绑定与 Gateway 调用 |
| governance member lists 纯规格 | 完成 | `governancePendingMemberListModel()` / `governanceActiveMemberListModel()` 下沉待审批/活跃居民列表标题、容器/行 class、批准/执事按钮文案和权限判定；`app.js` 只保留 approve/steward 事件绑定与 Gateway 调用 |
| governance city actions 纯规格 | 完成 | `governanceCityActionsModel()` 下沉加入、等待审批、打开大厅、新建房间动作的 class/文案/可见性与 lobby fallback；`app.js` 只保留输入聚焦、状态提示和 Gateway 调用 |
| governance federation policy 纯规格 | 完成 | `governanceFederationPolicyControlsModel()` 下沉联邦策略标题、选项行、当前/应用按钮状态和权限判定；`app.js` 只保留 `submitFederationPolicy()` 事件绑定 |
| room stage 投影纯函数 | 完成 | 新增 `shell-room-stage.js`，下沉舞台摘要、画像摘要/标题、画像 chips、私宅/公共频道投影文案；新增 5 条单测和静态防回流护栏 |
| composer context 纯模型 | 完成 | 新增 `composerContextItemsForState()`，把 composer context 文案、状态和 tone 规则移入 `shell-room-render.js`；`app.js` 与既有 `shell-composer.js` 均改为复用同一 helper，新增 4 条单测和静态防回流护栏 |
| composer hero 纯模型 | 完成 | 新增 `composerHeroModelForState()`，统一 hero variant/kicker/title/note/chips；`app.js` 和既有 `shell-composer.js` 均只负责 DOM 创建，新增 3 条单测和静态防回流护栏 |
| fake-dom import 映射 | 完成 | 全量测试红灯暴露 `app.js` 新增 `shell-room-stage.js` import 后 fake-dom 临时模块重写漏映射；已补 `APP_LOCAL_IMPORT_PATHS`，相关 import rewrite / shell init 测试转绿 |
| scene-editor token 回归 | 完成 | realness 暴露 hub 页 query-only gateway 策略导致 editor href 不带 token；新增 `sceneEditorGatewayUrl()`，只让编辑器入口 fallback 到 remembered gateway，不改变 hub 消息网关策略 |
| message search DOM 纯规格 | 完成 | `messageSearchBarDomSpec()` / `searchResultItemDomSpec()` / `searchEmptyStateDomSpec()` 下沉搜索栏与搜索结果节点规格；`app.js` 搜索 UI 改为 `createElement` / `textContent` / `replaceChildren()`，移除搜索路径 `innerHTML` sink |
| message search request 纯模型 | 完成 | `messageSearchRequestModel()` 下沉空查询/缺网关/缺房间 guard、query trim、room/query/limit 编码与 `/v1/shell/messages/search` URL 组合；`app.js` 只保留 `fetch(request.url)` 和结果渲染 |
| message search target 匹配纯函数 | 完成 | `messageSearchRowMatchesId()` 下沉搜索结果跳转的 `message_id` 精确匹配；`searchResultItemDomSpec()` 保留可字符串化 message_id（如 `0`）；`app.js` 改为扫描 `[data-message-id]` 候选后比较 `dataset.messageId`，不再把 gateway/search 返回的 messageId 拼进 CSS selector |

### 当前指标

| 指标 | 当前值 |
| --- | ---: |
| `apps/lobster-web-shell/app.js` 行数 | 9733 |
| `app.js` >50 行函数（函数体括号范围扫描，含 async） | 0 |
| `shell-pages-static.test.mjs` | 151 passed |
| `shell-caretaker-panel.test.mjs` | 2 passed |
| `shell-message-search.test.mjs` | 14 passed |
| `shell-message-render.test.mjs` | 46 passed |
| `shell-room-render.test.mjs` | 51 passed |
| `shell-governance-render.test.mjs` | 39 passed |
| `shell-state-normalize.test.mjs` | 12 passed |
| web-shell 全量测试 | 1007 unit passed / 0 failed，layout passed，realness passed |

### 验证

```bash
cd /Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell
node --test test/shell-room-render.test.mjs
node --test test/shell-message-render.test.mjs
node --test test/shell-caretaker-panel.test.mjs
node --test test/shell-message-search.test.mjs
node --test test/shell-governance-render.test.mjs
node --test test/shell-pages-static.test.mjs
node --test test/shell-state-normalize.test.mjs test/shell-pages-static.test.mjs test/fake-dom-import-rewrite.test.mjs
node --test test/shell-composer.test.mjs
node --test test/shell-room-stage.test.mjs
node --check app.js
node --check shell-message-render.js
node --check shell-room-render.js
node --check shell-caretaker-panel.js
node --check shell-governance-render.js
node --check shell-state-normalize.js
for f in app.js shell-*.js composer-state.js pretext-stage.js; do node --check "$f" || exit 1; done
node verify-frontend-realness.mjs
npm test
git diff --check
```

### 下一步建议

1. 继续按 TDD 小步拆 `app.js`，优先选不碰 CC 交互改动的纯规格/文案层：governance list DOM specs、conversation overview 非用户状态/动作 specs、thread status rail 后续组合 specs。
2. 暂缓直接外提 `roomAudienceLabel()` / `roomSummaryLine()` 这组函数；它们在 `app.js` 里仍依赖 governance/publicRoom 实时状态，需先设计参数化边界再动。
3. CC/DS 若推进场景交互，必须保留 realness 的 scene-editor owner-only/token 护栏和三层/四层热点结构测试。

## 2026-06-16 Codex 复盘: CC 近期推进核验与技术债护栏恢复

### 读取来源

| 来源 | 结论 |
| --- | --- |
| 真实代码 | `/Volumes/AJW-Data/Projects/lobster-chat` 当前仍有较多未提交改动，包含 CC/DS 推进的 admin、世界广场、像素资产和主题实验；不能只按提交记录判断完成度 |
| CC 近期记录 | `/Users/rsaga/.ai-checkpoints/claude-code-sessions/project-state.md` 与 2026-06-12 session 记录显示：Gateway 244、TUI 225、CLI 50、web-shell 800 tests 作为近期绿线；CSS 已做 `styles.user-shell.css` 抽取，`styles.css` 目标为 5752 行 |
| 当前偏差 | 本轮进入时 `npm test` 表面可过，但真实覆盖已漂移：admin-ds 写操作测试被削弱，`styles.css` 被回灌到 17852 行，页面丢失 2026-06-12 拆分样式引用，creative 场景暖色遮罩被加回 |

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| admin-ds 写操作护栏 | 完成 | 恢复/补强 ban/unban/freeze/unfreeze 运行时测试，覆盖 POST body、prompt cancel、空 ID、无 gateway、JSON POST helper |
| 受控写接口静态合同 | 完成 | 将旧“只读后台”测试修正为“读取 gateway projection + 所有写操作走统一 `fetchGatewayJsonPost` helper”，防止散落 raw POST/DELETE/PUT/PATCH |
| CSS split 防回归 | 完成 | `index.html`、`admin.html`、`creative.html` 补回 `styles.base.css` / `styles.scene.css` / `styles.chat.css` / `styles.user-shell.css` 引用断言 |
| `styles.css` 回退修复 | 完成 | 将 `styles.css` 从 17852 行恢复到已提交拆分基线 5752 行；回退前备份在 `/Volumes/AJW-Data/Backups/lobster-chat-style-regression-20260616/styles.css.before-restore` |
| 场景美术护栏 | 完成 | 移除 creative day/night 之上的暖色径向遮罩，并将测试锁定到拆分后的 `styles.scene.css` 真实位置 |
| rail 宽度覆盖 | 完成 | 修正 `styles.scene.css` 后置规则把 public-square rail 固定为 `220px` 的覆盖，统一回 `var(--im-scene-rail-width, 220px)` |
| app.js 身份 helper 去重 | 完成 | 恢复 `shell-identity.js` 复用，移除 `app.js` 内联的 visitor/scoped/route/display helper；`fake-dom` import rewrite 白名单同步补回 |

### 验证

```bash
cd /Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell
node --test test/admin-ds-runtime.test.mjs test/admin-ds-static.test.mjs test/shell-pages-static.test.mjs
# 101 passed / 0 failed

npm test
# unit: 803 passed / 0 failed
# layout: verify-scene-layout.mjs passed
# realness: verify-frontend-realness.mjs passed
```

### 当前真实进度百分比

| 模块 | 当前估算 | 依据 |
| --- | ---: | --- |
| P0 单城邦中心化 IM 真闭环 | 98% | 身份、shell state、send/edit/recall/export、presence/read、admin summary 已有测试和 smoke 基线；剩余主要是上线环境复验 |
| P1 空间房间与交互完善 | 82% | `image_layer` / `hotspot_layer` 和 H5 渲染已成型，场景编辑器存在；仍需把编辑器 UX、移动端交互和 gateway 保存路径继续压实 |
| P2 后台与运维可用 | 91% | admin-ds 已接入多类真实读写端点与失败反馈；邀请码/部分日志/高级配置仍有 mock 或待接入边界 |
| P3 技术债与工程鲁棒性 | 74% | Gateway/TUI/CLI/release gate 已大量收口，CSS 拆分恢复；但 `app.js` 仍 8892 行，`admin-ds.js` 2951 行，前端模块边界仍是最大剩余债 |
| P4 TUI/CLI parity | 95% | TUI 225、CLI 50 的近期基线存在，send/edit/recall/export parity 已补；后续以 release smoke 和真实运行复验为主 |
| P5 真实 transport / 加密 / 跨城 | 15% | 仍属后置，不应阻塞当前单城 IM MVP |

### 下一步开发计划

1. 先把本轮 web-shell 护栏保持绿色，不再让 CC/DS 在 UI/素材推进时回灌拆分前 CSS 或删除测试覆盖。
2. 继续按 TDD 拆 `app.js`，优先提取低风险纯函数：room projection/search、composer 状态、message action、scene hotspot runtime；每次只拆一个边界并跑 `node --test test/*.test.mjs`。
3. admin-ds 继续补真实后端端点的写操作闭环；没有 Gateway 端点的模块只做禁用原因/只读投影，不做假成功态。
4. 对世界广场、主题实验、像素资产改动补最小静态/realness 测试，防止视觉推进破坏 IM 主入口和 day/night 美术约束。
5. 每轮 CC/DS 合并前至少跑：`npm test`、对应 Gateway/Rust 聚焦测试、`git diff --check`；大体量素材和备份继续放 `/Volumes/AJW-Data`。

### 给 CC / DS v4 的继续推进提示词

```text
你接手 /Volumes/AJW-Data/Projects/lobster-chat，先读 /Users/rsaga/.codex/memories/ACTIVE-im.md、docs/ACTIVE_WORK_QUEUE.md、docs/IMPLEMENTATION_PHASES.md、docs/DEVELOPMENT_BLUEPRINT.md。当前主线是单城邦中心化 IM，gateway 合同是唯一真源，H5 是主入口，TUI/CLI 做同合同 parity。

不要回灌拆分前 CSS，不要删除测试让 npm test 变绿。web-shell 当前基线：npm test 必须通过，unit 约 802 passed，layout 和 realness 也必须过；styles.css 应保持约 5752 行，base/scene/chat/user-shell 拆分样式必须被 index/admin/creative 正确引用。像素日景禁止暖黄/奶油/金色罩层，day/night 走 body[data-time-of-day] + PNG 直切。

优先做非技术债业务时：只接已有 Gateway 端点，admin-ds 写操作统一走 fetchGatewayJsonPost，失败要有反馈，待接入功能必须 disabled + reason，不能假成功。推进世界广场或主题 UI 时必须保护 IM 主入口、居民房间、主城、后台三条路径。

若继续技术债：按 TDD 小步拆 app.js。下一块建议提取 room projection/search 或 composer 状态纯函数，新增/移动测试后先看红灯，再实现，最后跑 npm test。不要同时改多个边界，不要动无关素材和生成包。
```

### 给 CC/DS 的后续建议

优先继续处理不碰业务体验的大块技术债：

1. 把剩余 smoke 脚本的 `SKIP_BUILD` / `*_BIN` / artifact 行为补成统一契约测试，避免 release gate 在无 Rust 工具链环境中误触发构建。
2. 对 `apps/lobster-web-shell/app.js` 做低风险纯函数提取，每次只拆一个函数并配套 `node --test`。
3. admin-ds 继续推进非技术债业务模块时，优先接入已有后端写接口，暂缓没有 Gateway 端点的 mock 模块。
4. 每轮改动后固定跑快速脚本单测、语法检查、`git diff --check`，不要生成或提交 `dist/` 和 `apps/lobster-web-shell/generated/*.json`。

## 2026-06-11 Codex 技术债补充: install-server 依赖顺序收口

### 本轮完成

| 项目 | 状态 | 说明 |
| --- | --- | --- |
| 红灯契约 | 完成 | `scripts/test_install_server_unit.py` 锁定 `WEB_ARTIFACT` 路径校验必须早于 Rust 工具链检查，源码构建分支必须在 `cargo build` 前调用 `ensure_modern_rust` |
| 安装脚本 | 完成 | `scripts/install-server.sh` 不再在 gateway artifact 路径外提前触发 Rust 工具链；只有真正从源码构建 gateway 时才执行 `ensure_modern_rust` |
| 失败顺序 | 完成 | 缺失 `WEB_ARTIFACT` 会先明确报错，避免被 Rust bootstrap/cargo 环境问题遮蔽 |

### 验证

```bash
python3 scripts/test_install_server_unit.py
python3 scripts/test_smoke_release_gate_unit.py
bash -n scripts/install-server.sh scripts/smoke-release-gate.sh
python3 scripts/test_package_release_unit.py && python3 scripts/test_scripts_quick_unit_coverage.py && python3 scripts/test_smoke_release_gate_unit.py && python3 scripts/test_smoke_provider_federation_unit.py && python3 scripts/test_smoke_web_dual_browser_unit.py && python3 scripts/test_smoke_resident_mainline_unit.py && python3 scripts/test_smoke_cli_channel_unit.py && python3 scripts/test_smoke_auth_registration_unit.py && python3 scripts/test_smoke_shell_dual_http_unit.py && python3 scripts/test_smoke_shell_direct_http_unit.py && python3 scripts/test_smoke_web_shell_unit.py && python3 scripts/test_install_server_unit.py && python3 scripts/test_preview_server_unit.py && python3 scripts/test_start_terminal_shell_unit.py && python3 scripts/test_audit_web_assets_unit.py && python3 scripts/test_lobster_device_id_unit.py && python3 scripts/test_start_web_preview_unit.py && python3 scripts/test_restart_gateway_unit.py && python3 scripts/test_preflight_unit.py && python3 scripts/test_smoke_public_ingress_unit.py && python3 scripts/test_smoke_install_layout_unit.py && python3 scripts/test_start_terminal_unit.py && python3 scripts/test_makefile_unit.py
bash -n scripts/package-release.sh scripts/smoke-provider-federation.sh scripts/smoke-release-gate.sh scripts/smoke-resident-mainline.sh scripts/smoke-cli-channel.sh scripts/smoke-auth-registration.sh scripts/smoke-shell-dual-http.sh scripts/smoke-shell-direct-http.sh scripts/install-server.sh scripts/smoke-web-shell.sh scripts/start-terminal.sh scripts/audit-web-assets.sh scripts/lobster-device-id.sh scripts/restart-gateway.sh scripts/preflight.sh scripts/smoke-public-ingress.sh scripts/smoke-install-layout.sh
zsh -n scripts/start-web-preview.sh
node --check scripts/preview-server.mjs
node --check scripts/smoke-web-dual-browser.mjs
git diff --check
```
