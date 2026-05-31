# CC K2.6 Goal Prompt: IM 前端真实可用推进

/goal

你在 `/Volumes/AJW-Data/Projects/lobster-chat` 项目中工作。目标是继续推进 lobster-chat IM 项目前端真实可用，不要重做已完成页面，不要破坏现有 H5 三层结构：底层像素场景、中层透明热点、顶层微信式 IM 气泡。

## 当前最高约束

- H5 是当前主入口，Gateway/合同状态是事实源，前端不能私自制造 canonical 状态。
- 城邦内部先中心化真实落地，跨城去中心化后置。
- 前端交互必须 IM 第一、场景第二；不要做成 RPG 游戏。
- 热点定位依赖背景图构图。白天/夜晚只能有光照、色温、明暗差异，建筑、家具、标签、物体和画面构图不能变化。
- 不要使用旧 `*-day-draft.avif` 白天草稿，它们会洗掉像素质感。
- 不要改动旧页面为新后台样式；后台正式样式使用 `admin-ds.html` / `styles.admin-ds.css` / `admin-ds.js` 这一套。

## 已接入的白天背景素材位置

白天素材已经生成并接入运行 CSS/JS，位置如下：

- 主城桌面白天图：`/Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell/assets/pixel/composed/hub-main-city-scene-v1-day-256.png`
- 主城移动白天图：`/Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell/assets/pixel/composed/hub-main-city-scene-v1-mobile-day-256.png`
- 住宅桌面白天图：`/Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell/assets/pixel/composed/creative-room-scene-v2-day-256.png`
- 住宅移动白天图：`/Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell/assets/pixel/composed/creative-room-scene-v2-mobile-day-256.png`
- 世界入口/地铁桌面白天图：`/Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell/assets/pixel/composed/world-metro-station-scene-v1-day-256.png`
- 世界入口/地铁移动白天图：`/Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell/assets/pixel/composed/world-metro-station-scene-v1-mobile-day-256.png`
- 世界广场白天图：`/Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell/assets/pixel/concepts/world-square-concept-day-256.png`

对应夜间运行图仍保留：

- 主城桌面夜间图：`apps/lobster-web-shell/assets/pixel/composed/hub-main-city-scene-v1-256.png`
- 主城移动夜间图：`apps/lobster-web-shell/assets/pixel/composed/hub-main-city-scene-v1-mobile-256.png`
- 住宅桌面夜间图：`apps/lobster-web-shell/assets/pixel/composed/creative-room-scene-v2-256.png`
- 住宅移动夜间图：`apps/lobster-web-shell/assets/pixel/composed/creative-room-scene-v2-mobile-256.png`
- 世界入口/地铁桌面夜间图：`apps/lobster-web-shell/assets/pixel/composed/world-metro-station-scene-v1-256.png`
- 世界入口/地铁移动夜间图：`apps/lobster-web-shell/assets/pixel/composed/world-metro-station-scene-v1-mobile-256.png`
- 世界广场夜间图：`apps/lobster-web-shell/assets/pixel/concepts/world-square-concept-20260427-256.png`

## 已完成的自动切换接入

- `apps/lobster-web-shell/shell-shared.js`：`localTimeOfDay()` 以本地时间 06:00-18:00 为白天，其余为夜间。
- `apps/lobster-web-shell/styles.pixel-map.css`：主城和住宅按 `body[data-time-of-day="day"]` 切白天图。
- `apps/lobster-web-shell/styles.world-entry.css`：世界入口按 `body[data-time-of-day="day"]` 切白天图。
- `apps/lobster-web-shell/styles.world-square.css`：世界广场按 `body[data-time-of-day="day"]` 切白天图。
- `apps/lobster-web-shell/app.js`：用户房间 `image_layer.preset` 和已知运行图 URL 会按本地时间映射到白天/夜间，避免内联 `--creative-scene-image` 覆盖 CSS 白天图。
- `apps/lobster-web-shell/assets/pixel/ASSET_HANDOFF.md`：已记录白天/夜间素材表和运行规则。

## 你接下来要做的前端任务

1. 先运行验证，不要直接开改：
   - `cd /Volumes/AJW-Data/Projects/lobster-chat/apps/lobster-web-shell`
   - `npm run test:unit`
   - `npm run test:layout`
   - `npm run test:realness`
2. 用 Playwright 或可用浏览器检查以下页面，确认计算样式确实加载对应白天/夜间图，而不是只写了 CSS：
   - `creative.html`
   - `index.html`
   - `unified.html`
   - `world-square.html`
3. 继续修复前端真实可用问题，优先顺序：
   - 输入框：输入内容必须可见，Enter 发送、Shift+Enter 换行；移动端不强制 Enter 发送。
   - 热点标签：默认不遮挡场景；鼠标移到热点附近/hover/focus 时显示；点击空白场景时短暂显示全部热点标签，方便用户选择。
   - 左边栏：多个拥有左边栏的页面宽度、字号、项目高度统一；舞台框高度与左栏一致。
   - 世界广场：只保留一层真实左边栏，不显示背景图里重复的“假左栏”。
   - 后台 `admin-ds.html`：保留 DeepSeek 版设计作为正式后台方向，逐项补齐不能用的交互，但不要影响 `creative.html` / `index.html` / `unified.html`。
4. 每次修改后必须跑对应测试；如果发现测试缺口，补静态测试或 fake-dom 测试，避免同类问题回归。

## 禁止事项

- 不要重新生成白天素材，不要改变场景构图。
- 不要使用 `hub-main-city-scene-v1-day-draft.avif`、`creative-room-scene-v2-day-draft.avif`、`world-metro-station-scene-v1-day-draft.avif` 或 `world-square-concept-20260428-day-draft-256.png`。
- 不要用半透明大面板遮盖像素场景。
- 不要把白天效果做成 CSS `screen` 白色蒙层；白天必须来自独立资产。
- 不要把前端本地状态当作 Gateway 权限/房间事实源。

## 完成标准

- 四个页面白天/夜晚自动切换真实生效。
- 热点与背景物体对齐，不因日夜切换漂移。
- 输入、发送、热点标签、左栏、后台基本交互均通过真实浏览器或 fake-dom 测试。
- 输出变更摘要、验证命令结果、仍未完成项和下一步建议。
