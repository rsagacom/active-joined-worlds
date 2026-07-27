# UI 设计策划：霓虹像素城邦主题（Neon Pixel City State）

> 状态：设计稿 v1/v2 已生成，样式文件为新增，不覆盖旧有 UI。  
> 文件：
> - `/Volumes/AJW-Data/Projects/lobster-chat/docs/mockups/neon-pixel-city-hub-mockup-v1.png`
> - `/Volumes/AJW-Data/Projects/lobster-chat/docs/mockups/neon-pixel-city-hub-mockup-v2.png`
> - `/Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell/styles.theme-neon-pixel.css`

## 1. 设计目标

为 `lobster-chat` 提供一套**备选夜间主题**，在保持现有三层空间 UI 架构（场景层 / 热点层 / 聊天层）和 IM 第一原则的前提下，给城邦主入口、住宅和世界入口一个更具赛博霓虹感的视觉变体。

- **不覆盖旧 UI**：本主题为 additive，仅通过 `body[data-theme="neon-pixel"]` 或显式加载 `styles.theme-neon-pixel.css` 生效。
- **复用现有结构**：不改 `index.html` / `creative.html` / `unified.html` 的 DOM，只覆盖颜色和装饰层。
- **Gateway 合同不变**：不涉及消息、房间、身份等合同，只改渲染层。
- **保持可读性**：霓虹只是氛围，文字对比度和交互可用性仍是首位。

## 2. 设计灵感

- 参考现有 `index.html` 中式现代城市夜景，但把**暖黄路灯**替换为**青绿 + 洋红霓虹**。
- 参考 `admin-ds.html` 的清晰信息层级，但保持暗色主调。
- 参考生成的两张 mockup：v1 更偏向现代扁平霓虹城市，v2 更偏向像素游戏感街道。
- 最终方向：**像素城市夜景 + 霓虹光晕 + 高对比度聊天面板**。

## 3. 色彩系统

| Token | 值 | 用途 |
|-------|-----|------|
| `--neon-bg-deep` | `#05030d` | 页面最深背景 |
| `--neon-bg` | `#0a0718` | 场景衬底、左栏背景 |
| `--neon-panel` | `#12122a` | 面板、HUD、聊天区背景 |
| `--neon-panel-soft` | `#1a1a3a` | hover/elevated 面板 |
| `--neon-ink` | `#f0f4ff` | 主文字 |
| `--neon-muted` | `#9aa3c7` | 次要文字 |
| `--neon-line` | `rgba(126, 253, 199, 0.16)` | 边框、分隔线 |
| `--neon-cyan` | `#7efdc7` | 主强调色（在线状态、发送按钮、自己气泡） |
| `--neon-cyan-soft` | `rgba(126, 253, 199, 0.12)` | 弱强调背景 |
| `--neon-magenta` | `#ff6bc7` | 次强调色（对方气泡、热点标签、未读） |
| `--neon-magenta-soft` | `rgba(255, 107, 199, 0.12)` | 弱次强调背景 |
| `--neon-warm` | `#ffa45c` | 警告/城主标识 |

## 4. 三层架构样式规则

### 4.1 场景层（底层）

- 背景使用深紫蓝渐变 + 可选像素城市场景图。
- 不使用大面积玻璃面板覆盖场景。
- 点击空白场景：切换 HUD / 聊天层的显隐（与现有逻辑一致）。

### 4.2 热点层（中层）

- 热点区域默认不可见，hover/focus 时显示。
- 标签使用洋红描边 + 深色背景，小尺寸无衬线字体。
- 与现有 `shell-scene-hotspots.js` 配合，不改动热点数据模型。

### 4.3 聊天层（顶层）

- 聊天面板使用深色半透明背景（`rgba(10, 7, 24, 0.82)`），毛玻璃级别很轻，避免遮住场景。
- 自己消息：右侧，青色边框 + 深色填充。
- 对方消息：左侧，洋红色边框 + 深色填充。
- 系统消息：居中，小号大写字母间距，暖橙色。
- 输入框：单行，底部固定，青色 send 按钮。

## 5. 组件规范

### 5.1 HUD 顶栏

- 高度 50px，背景 `#12122a`，下边框 1px 青色霓虹线。
- 标题使用像素风字体 `"ZCOOL KuaiLe"` 或 `"Press Start 2P"` fallback 到系统无衬线。
- 在线状态 pill：青色圆点 + 文字。

### 5.2 左栏（导航 + 居民目录）

- 宽度沿用现有 token `--im-scene-rail-width: 220px`。
- 背景 `#0a0718`，右边框 1px 青色霓虹线。
- 激活项：青色背景 + 深色文字。
- 居民头像入口：圆形，hover 时洋红光晕。

### 5.3 输入区

- 底部固定，高度自适应。
- textarea 背景 `#12122a`，边框青色 1px，聚焦时发光。
- send 按钮：青色实心，深色文字。

## 6. 切换方式

### 方式 A：body 属性切换（推荐）

```html
<body data-theme="neon-pixel" ...>
```

`styles.theme-neon-pixel.css` 内所有选择器都以 `body[data-theme="neon-pixel"]` 开头，确保只在显式声明时生效。

### 方式 B：页面级 link 加载

```html
<link rel="stylesheet" href="./styles.theme-neon-pixel.css?v=20260612-neon-pixel-v1" />
```

与现有 `styles.tokens.css` 等并用时，主题文件放在最后，用更高特异性的选择器覆盖颜色。

## 7. 与现有代码的关系

| 现有文件 | 本主题是否影响 | 说明 |
|----------|----------------|------|
| `styles.tokens.css` | 否 | 本主题自定义变量以 `--neon-*` 前缀独立存在 |
| `styles.base.css` | 否 | 主题只覆盖 body 属性下的变体 |
| `styles.scene.css` | 否 | 主题用 `body[data-theme="neon-pixel"]` 限定覆盖 |
| `styles.chat.css` | 否 | 同上 |
| `index.html` | 否 | 只改 body 属性或新增 link |
| `app.js` | 否 | 不改动任何业务逻辑 |

## 8. 后续建议

1. 在 `index.html` 主题切换按钮中增加 "霓虹像素" 选项，动态切换 `body.dataset.theme`。
2. 为 `creative.html` 生成对应的室内霓虹场景（住宅夜晚版）。
3. 为 `unified.html` 生成对应的霓虹地铁站场景。
4. 跑 `npm test` 确认新增 CSS 不会破坏现有 realness/layout 测试（因为选择器限定在 `body[data-theme]` 下，默认不触发）。

## 9. 设计稿预览

- v1（现代霓虹城市）：`docs/mockups/neon-pixel-city-hub-mockup-v1.png`
- v2（像素游戏街道）：`docs/mockups/neon-pixel-city-hub-mockup-v2.png`

当前推荐以 **v1 的信息层级 + v2 的霓虹配色** 作为最终实现方向。
