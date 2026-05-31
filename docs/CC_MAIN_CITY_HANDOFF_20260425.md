# CC Main City Handoff 2026-04-25

把下面提示词给 CC 执行。范围只限 `index.html` 主城页和必要 CSS polish，不要碰 IM gateway 合同、`user.html` 登录逻辑或后端。

```text
项目路径：/Users/rsaga/Documents/Playground/lobster-chat

任务：基于 Codex 已生成并接入的“中国现代城区主城整图”，继续做主城页视觉收口，不要重新发散产品结构。

当前核心资产：
- 主城整图：apps/lobster-web-shell/assets/pixel/composed/hub-main-city-scene-v1.png
- 热点切片参考：
  - apps/lobster-web-shell/assets/pixel/composed/hub-main-city-slices/metro-entrance.png
  - apps/lobster-web-shell/assets/pixel/composed/hub-main-city-slices/notice-board.png
  - apps/lobster-web-shell/assets/pixel/composed/hub-main-city-slices/plaza-center.png
  - apps/lobster-web-shell/assets/pixel/composed/hub-main-city-slices/shop-cafe.png
  - apps/lobster-web-shell/assets/pixel/composed/hub-main-city-slices/residential-skyline.png

必须遵守的图层合同：
1. 底层是完整像素场景图，不要再把素材表拼贴成背景。
2. 中层是透明热点层，覆盖在地铁口、公告栏、广场、商铺等物件上。
3. 热点默认不可见，只在 hover/focus 时显示短标签，例如“地铁口”“公告栏”“广场”“商铺”“相册墙”。
4. 顶层是文字对话层，消息按微信式瀑布流：对方在左，自己在右。
5. 点击场景空白区域隐藏文字对话层；再次点击空白区域恢复。
6. 清屏时不要显示“对话框”小标签，要真正露出完整场景。
7. 点击热点不能触发清屏，只打开热点小浮层。
8. 主城是群聊场所，住宅是私聊/房间场所；不要把城主治理入口混入普通居民主导航。

本轮只做 polish：
- 优化主城聊天气泡位置，不要挡住地铁口、公告栏等核心物件太多。
- 优化热点位置和 label，不要大面积常驻描边，只在 hover/focus 出现。
- 如果右侧或顶部露出旧 `hub_full` 背景，必须清掉旧 body 伪元素背景。
- 保持 `住宅 / 主城` 简洁导航，不增加复杂菜单。
- 输入栏保持聊天 action bar，不要变成表单墙。
- 保持桌面与移动端可用。

验收：
- 运行：node --test apps/lobster-web-shell/test/*.mjs
- 截图输出：
  - hub-main-city-desktop
  - hub-main-city-clear-mode
  - hub-main-city-hotspot-hover
  - hub-main-city-mobile
- 简述修改内容和仍待 Codex 决策的问题。
```
