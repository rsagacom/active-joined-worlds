# Pixel Asset Tiling Plan

## 目标

- 大面积低信息区域使用可平铺小素材，例如地砖、墙面、路面、水泥地、普通木地板。
- 复杂区域继续使用高细节独立素材，例如家具、窗外城市、招牌、人物、交通入口、公告屏、植物、阴影接触面。
- 白天和夜晚必须是两套素材，不允许用整图加白雾、加蓝罩或整体滤镜伪装成另一时段。

## 分层合同

每个像素场景拆成四类资源：

1. `base-tile`：无方向光、无角色阴影的中性平铺底板，小图优先 `128x128` 或 `256x256`。
2. `structure-overlay`：不可平铺的建筑、家具、窗、门、站台、公告牌等透明叠层。
3. `shadow-overlay`：物体落影、环境暗角、接触阴影，透明叠层，允许压缩到较低体积。
4. `hotspot-overlay`：可选的小标签、发光点、点击热区提示，不烘焙进背景。

## 当前 H5 场景优先级

| 场景 | 当前资源 | 优先拆分区域 | 备注 |
| --- | --- | --- | --- |
| 主城广场 | `apps/lobster-web-shell/assets/pixel/composed/hub-main-city-scene-v1.png` | 广场地砖、道路、空旷地面 | 建筑、便利店、树、地铁口保留 overlay |
| 住宅私聊 | `apps/lobster-web-shell/assets/pixel/composed/creative-room-scene-v2.png` | 木地板、墙面大块暗部 | 沙发、桌面、窗景、书架、灯光保留 overlay |
| 世界入口 | `apps/lobster-web-shell/assets/pixel/composed/world-entry-scene-v1.png` | 站台地砖、墙面重复段 | 闸机、楼梯、列车门、线路图保留 overlay |
| 世界广场 | `apps/lobster-web-shell/assets/pixel/concepts/world-square-concept-20260427.png` | 广场地砖、道路 | 夜景作为基准，白天需要同构重绘，不用夜景调色 |

## CSS / DOM 落地方式

```html
<section class="scene-layered scene-layered--main-city">
  <div class="scene-base-tile"></div>
  <img class="scene-structure-overlay" src="./assets/pixel/layers/main-city/night-structure.webp" alt="" />
  <img class="scene-shadow-overlay" src="./assets/pixel/layers/main-city/night-shadow.webp" alt="" />
  <div class="scene-hotspots"></div>
</section>
```

```css
.scene-base-tile {
  position: absolute;
  inset: 0;
  background-image: url("./assets/pixel/tiles/main-city/night-ground-tile.webp");
  background-repeat: repeat;
  background-size: 128px 128px;
  image-rendering: pixelated;
}

.scene-structure-overlay,
.scene-shadow-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  image-rendering: pixelated;
  pointer-events: none;
}
```

## 制作规则

- 先在原画或重绘图里标出可平铺区域，再切 `base-tile`；不要从有强光影的区域随意裁一块当 tile。
- 地砖 tile 必须在四边无缝，横纵接缝不能出现明显重复线。
- 物体脚下阴影不属于地砖 tile，放进 `shadow-overlay`。
- 昼夜版本分别产出 `day-*` 和 `night-*`，只共享构图，不共享调色假滤镜。
- 允许先只对主城广场做试点，压缩收益和视觉稳定后再扩展到住宅、世界入口、世界广场。

## 验收标准

- 页面首屏视觉不出现白雾、蓝雾、灰罩等伪光照层。
- 平铺区域在桌面宽屏下无明显接缝，缩放后不糊。
- 同一场景的白天、夜晚构图一致，但光源、天空、窗光、招牌亮度符合真实时段。
- 聊天气泡、热点、导航不与背景合成，继续保持独立 DOM 层。
