# World Metro Hotspots

`unified.html` is the world-entry page. It must use the subway waiting station scene as one full background image, with transparent hotspots above it. Do not redraw the scene in CSS.

## Runtime Assets

- Desktop background: `assets/pixel/composed/world-metro-station-scene-v1.avif`
- Mobile background: `assets/pixel/composed/world-metro-station-scene-v1-mobile.avif`
- PNG master: `assets/pixel/composed/world-metro-station-scene-v1.png`
- Source PNG from image generation: `assets/pixel/composed/world-metro-station-scene-v1.source.png`

## Desktop Hotspots

| Class | Label | Position | Behavior |
| --- | --- | --- | --- |
| `world-entry-hotspot--city` | `返回主城` | `left: 2%; top: 12%; width: 25%; height: 52%` | Link to `./index.html`; maps to exit stair, escalator, and ticket gates. |
| `world-entry-hotspot--map` | `世界线路图` | `left: 29%; top: 21%; width: 15%; height: 28%` | Popover; maps to the route map board. |
| `world-entry-hotspot--platform` | `候车站台` | `left: 30%; top: 59%; width: 27%; height: 28%` | Popover; maps to the waiting seats and platform floor. |
| `world-entry-hotspot--train` | `列车通道` | `left: 58%; top: 18%; width: 38%; height: 58%` | Popover; maps to platform screen doors, tunnel, and train light. |

## Mobile Label Positions

The mobile crop shows the stair, map board, train light, and bench. Keep the hit areas non-interactive for now and show only visible text-sized labels.

| Class | Label Position |
| --- | --- |
| `world-entry-hotspot--city` | `left: 7%; top: 31%` |
| `world-entry-hotspot--map` | `left: 42%; top: 33%` |
| `world-entry-hotspot--train` | `left: 70%; top: 45%` |
| `world-entry-hotspot--platform` | `left: 48%; top: 63%` |

## CC Constraints

- Only edit `unified.html` and `styles.world-entry.css` for this page polish unless asked otherwise.
- Do not use `world-entry-scene-v1.*`; that old gate concept is deprecated.
- Do not place generated UI sheets as backgrounds for buttons, rails, or chat panels.
- Do not add glassmorphism or large translucent panels over the art.
- Hotspot hover state must be a small text label only, not a large rectangle.
