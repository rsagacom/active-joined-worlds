# lobster-chat 开发蓝图 (2026-06-04)

> Codex / Claude Code 每次启动必须读取本文档。
> 记录架构决策、权限模型、UI 规范、待办事项。

---

## 一、系统角色与权限

```
平台管理员（world_steward）
  ├─ 管理世界入口/世界广场场景
  ├─ 管理城主设备白名单
  └─ 城邦违规 → 封禁城主设备 → 城邦下线

城主（city steward）
  ├─ 管理主城/广场场景和热点层
  ├─ 管理居民、审核消息
  └─ 签发邀请码

居民（房主）
  ├─ 管理自己私宅的场景和热点层
  ├─ 私宅背景可更换（白天+夜晚两张图，缺一不可）
  └─ 决定自己私宅的主客访问策略

注册居民（访问者）
  ├─ 登录后才可请求访问他人私宅
  └─ 是否可进入由房主访问策略 + 关系权限决定

未登录访客
  ├─ 不可访问任何居民私宅
  └─ 只能看到登录引导或允许匿名只读的公共入口
```

### 私宅主客访问确权（2026-06-26）

私宅不是默认公开空间。进入他人私宅必须同时满足：

1. 访问者必须是已注册并已登录的 IM 居民，不能用 `访客`、空身份或匿名 viewer 进入。
2. Gateway 必须读取房主保存的私宅访问策略，H5 不能仅凭 `room.id`、`home:<resident>` 或前端状态自行放行。
3. 房主至少可以在两档策略中选择：
   - `registered_all`: 所有已登录注册居民都可以访问。
   - `friends_only`: 只有好友/互相关系居民可以访问。
4. 未配置策略时采用保守默认：不按“所有注册用户可访问”放行；MVP 阶段默认 `friends_only`，只有 Gateway 已确认的好友关系可以进入。
5. 私宅场景展示与私聊消息流必须分层。即使访问者被允许进入私宅场景，也不能因此读取未经授权的历史私聊消息。
6. 未来可扩展 `allowlist`、`blocklist`、一次性邀请等策略，但不能绕过上面的登录与房主确权前提。

2026-06-26 实现状态：
- Gateway 已持久化 `registered_all` / `friends_only` 两档策略，默认 `friends_only`。
- `POST /v1/personal-room/access-policy` 要求 Bearer token 与房主 `resident_id` 匹配。
- 个人房间 shell state 已暴露 `personal_room_access_policy`，用于 H5 显示当前策略。
- H5 住宅页已接入房主专属 `好友` / `注册` 分段控件；控件只在“自己的私宅”显示，提交复用现有 Bearer session。
- Gateway 已新增 `request` / `accept` 两步好友关系流：pending 不解锁，accepted friends 才能访问 `friends_only` 私宅场景。
- `GET /v1/residents?resident_id=<viewer>` 已按访问者投影 `relationship_state` / `relationship_requested_by`，供 H5 判断申请、接受和好友态。
- H5 居民目录和住宅侧栏已接入 `申请好友` / `已申请` / `接受好友` / `好友` 关系入口，提交复用 Bearer session 并通过 Gateway 端点落库。
- H5 点击未授权私宅时会按登录/申请/等待/接受状态给出下一步提示，不再切到当前 shell state 不可见的 room。
- `registered_all` 只开放私宅场景可见性；访客 shell 投影不携带房主私宅历史消息。
- 后续继续做真实移动端验收、关系按钮触控 polish 和更完整的空态视觉，不允许在 H5 本地伪造好友状态。

## 二、热点层权限模型

| 场景 | 编辑权限 | 查看权限 |
|------|---------|---------|
| 私宅（自己的） | 房主本人 | 房主本人 |
| 私宅（别人的） | 房主本人 | 已登录注册居民 + 房主访问策略授权 |
| 主城/广场 | 城主 | 所有人 |
| 世界入口/世界广场 | 平台管理员（我） | 所有人 |

**实现位置**: `conversation_runtime.rs` → `check_scene_edit_permission()`
- 私宅: 检查 `actor_id ∈ conversation.participants`
- 私宅访问: 必须新增/维护独立的 access policy 校验，不能把 1 人 Direct 默认视为公开可见
- 世界入口/广场 (`room:world:entry`, `room:world:square`): `actor_is_world_steward()`
- 公共房间: `actor_is_world_steward()`

## 三、注册与认证

### 用户注册流程
- **邮箱 = 注册ID**（不需要单独的用户名）
- 表单：邮箱地址（即注册ID）+ 用户昵称 → 获取邮箱验证码 → 完成登录
- **手机验证暂不开通**，字段保留 hidden，标记"规划中"
- **注册弹窗必须出现在所有页面**（user.html 跳转页除外）

### 设备管控（不是用户注册）
- 城主设备 MAC 白名单：平台管理员通过 `/v1/admin/devices/*` 管理
- 封禁城主设备 → 城邦整个下线
- 设备端点：`GET/POST /v1/admin/devices`, `/add`, `/remove`, `/block`, `/unblock`
- 实现文件：`http_device_routes.rs`

## 四、场景素材管理

### 背景图
- `SceneImageLayer` 新增 `day_image_url` + `night_image_url`（chat-core 合同）
- **白天和夜晚必须成对提供或同时为空**
- 校验在 `validate_scene_image_layer()` 中

### 热点编辑器
- ✅ 已实现在 admin-ds → 房间详情 → 场景配置
- 支持添加/编辑/删除热点（ID、标签、交互提示、X/Y/W/H 坐标）
- 调用 `POST /v1/admin/scene`（带权限校验）

### 预设
- creative-room, main-city, contract-private-room, contract-square-night

## 五、UI 交互规范（不可擅改）

### 场景点击
- 聊天显示时 → 热点层 `pointer-events: none`（不拦截点击，完全透明）
- 点击空白区域 → 隐藏对话框 + 显示热点标签（scene-clear-mode）
- 再次点击 / Esc → 对话框恢复 + 热点隐藏
- **侧边栏和顶栏在 clear mode 下始终保留**（舞台不撑满全屏）

### 已移除的滤镜
- ✅ `body::after` 金色光晕 `rgba(255,210,120,0.10)`
- ✅ `.map-sprite` `mix-blend-mode: multiply`
- ✅ `.map-sprite` `filter: saturate(1.05) contrast(1.06)`
- 保留：暗角 vignette（中性黑色）

### 输入框
- Hub 主城 textarea: `color: #241409`（白底深色字，可读）

## 六、存储

- 路径：`.lobster-chat-dev/gateway/`
- `device-state.json` — 设备白名单
- `moderation-state.json` — 审核状态
- `timelines/*.postcard` — 消息（二进制 postcard 格式）

## 七、质量基��

- Rust: 512 tests, 0 fail
- JS static: 50 tests, 0 fail
- 零 clippy 警告，零编译警告
- CSS tokens 在 `styles.tokens.css`，所有页面引用

## 八、关键技术债（暂不碰）

- CSS 深度拆分（admin 专属规则散布全文件）
- app.js 场景函数进一步提取
- 系统日志模块对接审计事件

## 九、当前待办

| 优先级 | 事项 |
|--------|------|
| P0 ✅ | world-square + admin-ds 注册弹窗 JS 接线（已接入 `shell-auth-standalone.js`） |
| P0 ✅ | 前端消息发送确认（`?gateway=` 双浏览器 smoke 已验证发送/编辑/撤回/失败重发） |
| P1 ✅ | admin-ds 场景编辑器加 day/night URL 输入（复用 Gateway `SceneImageLayer` 成对校验） |
| P2 ✅ | 城主后台设备管理 UI（已接入 admin-ds 主内容区，复用 `/v1/admin/devices/*`） |
| P2 ✅ | 私宅关系按钮移动端真实验收 + 未授权空态视觉 polish（住宅页状态节点 + 34px 移动按钮 realness） |
| 阻塞 | 多城邦联邦、MLS 加密（PRODUCT_CHARTER 延后） |

## 十、关键文件速查

| 文件 | 内容 |
|------|------|
| `crates/chat-core/src/lib.rs` | SceneImageLayer / SceneHotspotLayer 合同 |
| `conversation_runtime.rs` | scene 权限校验、验证逻辑 |
| `core_runtime.rs` | 设备管理、审核持久化 |
| `auth_runtime.rs` | 注册认证、设备黑白名单 |
| `http_device_routes.rs` | 设备管理 API（5 端点） |
| `shell-scene-runtime.js` | 场景交互（click / clear-mode / labels） |
| `admin-ds.js` | 管理后台（场景配置、热点编辑器） |
| `shell-auth.js` | 前端认证流程（initAuth） |
| `scripts/lobster-device-id.sh` | 本地 MAC 探针 |

## 美术风格强约束（2026-06-14 收口）

> 单一信息源：`apps/lobster-web-shell/assets/pixel/ASSET_HANDOFF.md` §"美术风格强约束"。任何 AI / 协作者改场景资产、UI chrome 配色、昼夜机制、热点层之前**必须**先读那一节，禁止凭直觉调暖色。

要点速查：
1. 像素风夜城都市美学；day/night 仅切光线，不改构图与几何骨架。
2. day 资产**严禁蜡黄/奶油/黄褐**渲染。日景应是冷调自然光（蓝天/晨光/阴天），室内地板保持深棕红原木色。
3. UI chrome（HUD / rail / composer / chat-frame）一律 dark-on-dark，不准 cream/金色大面积填色或 `radial-gradient` 暖色罩层。`--scene-gold` 仅作小字符高亮。
4. 昼夜切换：`body[data-time-of-day]` + 三个 html 内联脚本 + pixel-map.css/world-entry.css/world-square.css 切 PNG + app.js 切运行时 URL，**不要**用 `mix-blend-mode: screen` 或半透明暖叠加伪造日光。
5. 热点 `.scene-hotspot`：缩到原区域 1/4，所有状态边框 / 底色 / 阴影 / outline 全透明。详见 pixel-map.css / world-entry.css / world-square.css 末尾的"2026-06-14 热点层透明化"段。
6. 测试锁定：`apps/lobster-web-shell/test/shell-pages-static.test.mjs` 钉住了 day 资产路径与"禁 mix-blend-mode screen"。改资产或 CSS 后先跑这个用例。
