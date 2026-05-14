# CC Task: World Metro Entry Polish

请只做 `unified.html` / `styles.world-entry.css` 的世界入口页微调，不要改 `creative.html`、`index.html`、`app.js` 的主结构。

## 已定方向

`unified.html` 是“世界入口”，视觉必须是现代中国城市地铁候车站，不是黑色传送门、科幻门户、SaaS 首页或卡片入口页。

三页动线固定：

- `creative.html` 住宅：楼梯热点进入 `./index.html`
- `index.html` 主城：地铁口热点进入 `./unified.html`
- `unified.html` 世界入口：返回主城热点进入 `./index.html`

## 必须使用的素材

- 桌面背景：`assets/pixel/composed/world-metro-station-scene-v1.avif`
- 移动端背景：`assets/pixel/composed/world-metro-station-scene-v1-mobile.avif`
- PNG 母版仅用于检查：`assets/pixel/composed/world-metro-station-scene-v1.png`
- 热点坐标合同：`assets/pixel/WORLD_METRO_HOTSPOTS.md`

禁止使用旧素材：

- 不要使用 `world-entry-scene-v1.*`
- 不要用主城图 `hub-main-city-scene-v1.*` 伪装世界入口
- 不要把任何完整 UI sheet 当按钮、面板、顶部条或输入框背景

## UI 规则

- 场景图必须完整露出，不能用毛玻璃或大暗板盖住。
- 热点层是透明的，hover 只显示文字大小的小标签，不出现大框套小框。
- 消息层采用微信式左右气泡：对方左侧，己方右侧。
- 点击场景空白区域进入清屏模式，再点空白区域恢复文字层。
- 移动端只显示当前裁切里看得见的热点标签；不要显示画面外热点。

## 验收截图

请输出并说明以下截图：

- `unified-desktop`
- `unified-mobile`

如果你顺手复查动线，也只截图：

- `creative-desktop` 楼梯热点
- `index-desktop` 地铁口热点

## 测试

必须跑：

```bash
cd /Users/rsaga/Documents/Playground/lobster-chat
node --test apps/lobster-web-shell/test/*.mjs
```

预期：全部通过。
