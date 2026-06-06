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
  └─ 私宅背景可更换（白天+夜晚两张图，缺一不可）

访客
  ├─ 只读访问他人私宅
  └─ 公聊广场发言需登录
```

## 二、热点层权限模型

| 场景 | 编辑权限 | 查看权限 |
|------|---------|---------|
| 私宅（自己的） | 房主本人 | 所有人 |
| 私宅（别人的） | 房主本人 | 所有人（只读） |
| 主城/广场 | 城主 | 所有人 |
| 世界入口/世界广场 | 平台管理员（我） | 所有人 |

**实现位置**: `conversation_runtime.rs` → `check_scene_edit_permission()`
- 私宅: 检查 `actor_id ∈ conversation.participants`
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
| P0 | world-square + admin-ds 注册弹窗 JS 接线 |
| P0 | 前端消息发送确认（URL 带 `?gateway=` 参数） |
| P1 | admin-ds 场景编辑器加 day/night URL 输入 |
| P2 | 城主后台设备管理 UI |
| P2 | 私宅访问区分"自己的"/"别人的"（隐藏编辑按钮） |
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
