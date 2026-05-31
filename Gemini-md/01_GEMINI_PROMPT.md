# Prompt for Gemini Desktop

你是一个资深产品 UI/UX 设计师和前端交互架构师。请基于我附带的 `Gemini-md` 文件夹，为当前 H5 IM 项目设计一套可落地的界面方案。

请先阅读：

- `02_PROJECT_BRIEF.md`
- `context/architecture-design-excerpts.md`
- `source/creative.html`
- `source/styles.creative.css`
- `source/styles.pixel-map.css`
- `context/app-ui-excerpts.md`
- `context/ui-contract-tests-excerpts.md`
- `assets/creative-room-scene-v2-256.png`
- `assets/creative-room-scene-v2-mobile-256.png`

项目背景：

- 项目路径是 `/Volumes/AJW-Data/Projects/lobster-chat`。
- 这是一个单城 IM / 居民聊天项目，不是营销网站。
- H5 是当前主入口，TUI 是并行客户端。
- 网关 contract 是唯一事实来源，前端不能私自维护 canonical state。
- 当前重点是单城 IM 主路径：登录、居民身份、房间/私聊列表、消息流、像素场景、热点点击、基础状态反馈。
- 不要扩展世界治理、编辑器、复杂地图系统、商业化页面、社区广场等非主线功能。

核心 UI 方向：

- H5 像素场景采用三层结构：
  1. 底层：完整 composed pixel scene，作为主视觉空间。
  2. 中层：透明 hotspots，可点击场景对象/居民/空间。
  3. 顶层：类似微信的左右聊天气泡。
- 点击空白场景空间时，可以隐藏/恢复文字 chrome，让用户看清像素场景。
- 不要做大面积 glass panel。
- 不要用超大的半透明消息板遮住画面。
- 不要做 landing page、hero page 或宣传型首页。
- 设计应像真实 IM 工具，信息密度可扫描、交互直接、视觉克制，但保留像素世界感。

你的任务：

1. 总结当前 UI 的信息架构和主要交互。
2. 找出当前 H5 IM 界面的 5-10 个体验问题。
3. 给出一套完整但可分阶段落地的 UI 设计方案。
4. 明确哪些是 Phase 1 必做，哪些是 Phase 2/3。
5. 输出具体到组件、布局、状态、交互、视觉规则的设计规格。
6. 给出验收标准，方便开发者实现后检查。

输出格式：

- 设计判断摘要
- 信息架构
- 核心界面布局
- 组件规格
- 状态与交互
- 视觉规则
- 分阶段实施计划
- 验收清单

约束：

- 不要建议重写项目。
- 不要改变网关 contract。
- 不要让 H5 持有私有 canonical state。
- 不要输出大段代码，除非是很小的示例。
- 如果文件信息不足，请明确列出还需要哪些文件，不要猜测后端行为。
- 方案必须能由现有 `creative.html` + CSS + `app.js` 渐进实现。
- 优先提出 Phase 1 的最小可验证 UI 改进，而不是宏大重构。

请开始。
