# Pixel Asset Handoff

This folder keeps PNG masters for inspection and compressed runtime assets for the web runtime. HTML/CSS should reference the indexed 256-color PNG scene assets for IM backgrounds when visual clarity is more important than minimum transfer size. PNG masters are source files only and should not be shipped directly as page backgrounds.

## Scene Assets

| Scene | Desktop runtime | Mobile runtime | Source/master |
| --- | --- | --- | --- |
| 主城 | `composed/hub-main-city-scene-v1-256.png` | `composed/hub-main-city-scene-v1-mobile-256.png` | `composed/hub-main-city-scene-v1.png` |
| 住宅 | `composed/creative-room-scene-v2-256.png` | `composed/creative-room-scene-v2-mobile-256.png` | `composed/creative-room-scene-v2.png` |
| 世界入口 / 地铁候车站 | `composed/world-metro-station-scene-v1-256.png` | `composed/world-metro-station-scene-v1-mobile-256.png` | `composed/world-metro-station-scene-v1.png` |
| 世界广场 | `concepts/world-square-concept-20260427-256.png` | same responsive crop via CSS | `concepts/world-square-concept-20260427-256.png` |

## Day Scene Assets

Day scenes are light/temperature variants of the same night composition. Do not regenerate architecture, furniture, labels, or hotspot objects for day/night switching; hotspot coordinates depend on identical geometry.

| Scene | Desktop day runtime | Mobile day runtime |
| --- | --- | --- |
| 主城 | `composed/hub-main-city-scene-v1-day-256.png` | `composed/hub-main-city-scene-v1-mobile-day-256.png` |
| 住宅 | `composed/creative-room-scene-v2-day-256.png` | `composed/creative-room-scene-v2-mobile-day-256.png` |
| 世界入口 / 地铁候车站 | `composed/world-metro-station-scene-v1-day-256.png` | `composed/world-metro-station-scene-v1-mobile-day-256.png` |
| 世界广场 | `concepts/world-square-concept-day-256.png` | same responsive crop via CSS |

## Hotspot Slices

Use these only for on-demand popovers, thumbnails, zoom panels, or later interaction windows. Do not lay all slices on top of the scene at initial load unless the full scene background is removed for that page.

- `composed/hub-main-city-slices/metro-entrance.avif`
- `composed/hub-main-city-slices/notice-board.avif`
- `composed/hub-main-city-slices/plaza-center.avif`
- `composed/hub-main-city-slices/residential-skyline.avif`
- `composed/hub-main-city-slices/shop-cafe.avif`

## Runtime Rules

- Use indexed 256-color PNG for IM page backgrounds when reviewing visual clarity; use WebP/AVIF only after side-by-side visual acceptance.
- Keep PNG files as editable masters only.
- Desktop can use one compressed full-scene indexed PNG to preserve composition.
- Mobile must use a mobile crop indexed PNG so it does not download the full desktop master.
- Hotspot hit areas stay transparent; hover labels are text-sized only.
- Do not use generated UI sheets as button or panel backgrounds unless they are explicitly sliced into that exact component shape.
- If CC works on `unified.html`, use `world-metro-station-scene-v1-256.png` and `world-metro-station-scene-v1-mobile-256.png`, not the old `world-entry-scene-v1` gate or the main-city scene.
- Runtime day/night switching is controlled by `body[data-time-of-day]`; shared H5 pages set it from local time. CSS must switch to day assets directly, not fake daylight with screen/white overlays.
- Do not use old `*-day-draft.avif` assets in runtime CSS; they are superseded by the PNG day runtime assets above.

## 美术风格强约束（2026-06-14 新增，禁止改动）

### 1. 整体调性
- 全套场景为**像素风**（pixel-art / 等距 isometric）夜城都市美学。day/night 仅切换光照氛围，**风格、构图、几何骨架严格保持一致**。
- 夜景：冷调深蓝 + 暖灯点缀（书桌灯、便利店、城市霓虹）。
- 日景（2026-06-14 用户提供的 `ajw image/` 替换版）：**自然光**，蓝天/晨光/阴天均可，**严禁蜡黄、奶油、偏黄、夕阳橙暖染调**。室内地板保持原木深棕红色，不要被任何叠加层染成黄褐色。

### 2. 资产替换规则
当需要重做 day 资产时：
- **不要**让 AI 凭"白天=暖光"惯性自动生成偏黄渲染。
- **不要**用 `mix-blend-mode: screen` 或 `linear-gradient(rgba(255, 2xx, 1xx, ...))` 这类暖色叠加来"伪造日光"。
- 必须由用户提供新版日间 PNG，由 CC 直接覆盖到 `composed/*-day-256.png` 的对应位置。
- 资产存放路径见上方 `## Day Scene Assets` 表，桌面 + mobile 用同一张时直接复制覆盖即可。

### 3. UI Chrome 配色（pixel-map.css 等）
- 配色框架基础色：暗棕黑（`#16100c` ~ `#22181c`）+ 暗灰棕边框（`#2c2622`）。
- **禁用**金色 `#f1c978` / cream `rgba(255, 232~240, 1xx)` 类大块面板填色与边框，已于 2026-06-14 全部清理。任何对场景图施加 `radial-gradient` / `linear-gradient` 暖色罩层的写法都视为 bug。
- HUD / rail / composer / chat-frame 一律 dark-on-dark，金色仅允许出现在小字符高亮（如 active button 文字 / glyph 描边），不得做大面积填色。

### 4. 昼夜切换机制（已收口）
- 入口：`index.html` / `creative.html` / `unified.html` 内联脚本根据 `new Date().getHours()` 设置 `document.body.dataset.timeOfDay`，6:00–18:00 为 `day`，其余为 `night`。
- CSS：`styles.pixel-map.css` / `styles.world-entry.css` / `styles.world-square.css` 通过 `body[data-time-of-day="day"] .xxx-stage { background: url("*-day-256.png") ... }` 直接切换 PNG。
- JS：`app.js:presetImageLayerUrl` / `timeAdjustedRuntimeSceneUrl` 根据相同 dataset 切换运行时素材路径。
- 改昼夜规则前先确认上述三处一致，不要单独改其中一处。
- **回归测试**：`test/shell-pages-static.test.mjs` 锁定了 day 资产路径与禁止 mix-blend-mode 罩层；改 day 资产后跑该用例。

### 5. 热点层（hotspot）规范
- `.scene-hotspot` 是透明可点击命中区，固定 `64px × 34px`，紧贴标签 chip「大一圈」（chip 约 42×20，每边富余 +6~11px），无可见边框/底色。移动端（≤820px）同样启用，不再 `display:none` 裁剪隐藏。
- 默认 / hover / focus / aria-expanded / is-near-pointer / is-active 任意状态下，`background` / `border-color` / `border-width` / `outline` / `box-shadow` 必须为 `transparent` / `0` / `none`。
- 2026-06-14 的 `transform: scale(0.5)` 缩到 1/4 方案已于 2026-06-17 废弃，改为固定尺寸 + `translate(-50%,-50%)` 居中。后续若有人改回 scale 缩放或加大热点尺寸，视为 regression。

### 6. 备份文件
- 旧蜡黄版 day 资产保存为 `composed/*-day-256.png.bak_yellow_<timestamp>`。
- 创意房间替补 day 资产（11_28_37 沙发居中版）保存为 `concepts/creative-room-scene-v2-day-alt-256.png`。
- 不再使用的旧 draft（`*-day-draft.avif`）保留但 runtime CSS 不引用，参见 §4。
