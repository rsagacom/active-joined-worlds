# Pixel Asset Handoff

This folder keeps PNG masters for inspection and compressed runtime assets for the web runtime. HTML/CSS should reference the indexed 256-color PNG scene assets for IM backgrounds when visual clarity is more important than minimum transfer size. PNG masters are source files only and should not be shipped directly as page backgrounds.

## Scene Assets

| Scene | Desktop runtime | Mobile runtime | Source/master |
| --- | --- | --- | --- |
| 主城 | `composed/hub-main-city-scene-v1-256.png` | `composed/hub-main-city-scene-v1-mobile-256.png` | `composed/hub-main-city-scene-v1.png` |
| 住宅 | `composed/creative-room-scene-v2-256.png` | `composed/creative-room-scene-v2-mobile-256.png` | `composed/creative-room-scene-v2.png` |
| 世界入口 / 地铁候车站 | `composed/world-metro-station-scene-v1-256.png` | `composed/world-metro-station-scene-v1-mobile-256.png` | `composed/world-metro-station-scene-v1.png` |

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
