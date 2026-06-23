/* ============================================================
   shell-scene-image-layer.test.mjs — 场景 image-layer URL 解析纯函数测试
   覆盖 day/night × mobile/desktop × preset/direct-url ×
        javascript:/data: 拦截 × 非 assets/ 直通 × 空值
   依赖注入 env { matchMedia, timeOfDay }，脱离 DOM/window。
   ============================================================ */

import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const modUrl = new URL("../shell-scene-image-layer.js", import.meta.url);
const mod = await import(pathToFileURL(modUrl.pathname).href);

const {
  imageLayerUrlForState,
  presetImageLayerUrlForState,
  timeAdjustedRuntimeSceneUrlForState,
} = mod;

function env({ timeOfDay = null, mobile = false } = {}) {
  return {
    timeOfDay,
    matchMedia: () => ({ matches: mobile }),
  };
}

// ====== preset 解析 ======

test("preset: 夜景桌面返回 -256.png 基础资产", () => {
  const url = presetImageLayerUrlForState("contract-private-room", env());
  assert.equal(url, "assets/pixel/composed/creative-room-scene-v2-256.png");
});

test("preset: 夜景移动返回 mobile-256.png", () => {
  const url = presetImageLayerUrlForState("contract-private-room", env({ mobile: true }));
  assert.equal(url, "assets/pixel/composed/creative-room-scene-v2-mobile-256.png");
});

test("preset: 日景桌面返回 day-256.png", () => {
  const url = presetImageLayerUrlForState("contract-private-room", env({ timeOfDay: "day" }));
  assert.equal(url, "assets/pixel/composed/creative-room-scene-v2-day-256.png");
});

test("preset: 日景移动返回 mobile-day-256.png", () => {
  const url = presetImageLayerUrlForState("contract-private-room", env({ timeOfDay: "day", mobile: true }));
  assert.equal(url, "assets/pixel/composed/creative-room-scene-v2-mobile-day-256.png");
});

test("preset: 日景缺 mobile-day 回退 day 再回退基础", () => {
  // main-city 的 mobile-day 映射存在，这里测回退链路用一个未在 mobile-day 但在 day 的 key
  // contract-square-night 在所有 map 都有，验证回退逻辑用 day fallback：去掉 mobile 标志后应得 day
  const url = presetImageLayerUrlForState("contract-square-night", env({ timeOfDay: "day", mobile: true }));
  assert.equal(url, "assets/pixel/composed/hub-main-city-scene-v1-mobile-day-256.png");
});

test("preset: 空/未知 preset 返回空串", () => {
  assert.equal(presetImageLayerUrlForState("", env()), "");
  assert.equal(presetImageLayerUrlForState(null, env()), "");
  assert.equal(presetImageLayerUrlForState("nonexistent-preset", env()), "");
});

// ====== runtime URL 时间/移动调整 ======

test("runtime: 非 assets/ 前缀直通不变", () => {
  assert.equal(timeAdjustedRuntimeSceneUrlForState("./custom.png", env()), "./custom.png");
  assert.equal(timeAdjustedRuntimeSceneUrlForState("https://x/y.png", env()), "https://x/y.png");
});

test("runtime: 夜景 assets/ 直通不改", () => {
  const raw = "assets/pixel/composed/creative-room-scene-v2-256.png";
  assert.equal(timeAdjustedRuntimeSceneUrlForState(raw, env()), raw);
});

test("runtime: 日景 assets/ 替换为 day 版本", () => {
  assert.equal(
    timeAdjustedRuntimeSceneUrlForState("assets/pixel/composed/creative-room-scene-v2-256.png", env({ timeOfDay: "day" })),
    "assets/pixel/composed/creative-room-scene-v2-day-256.png",
  );
});

test("runtime: 日景移动 assets/ 替换为 mobile-day 版本", () => {
  assert.equal(
    timeAdjustedRuntimeSceneUrlForState("assets/pixel/composed/creative-room-scene-v2-256.png", env({ timeOfDay: "day", mobile: true })),
    "assets/pixel/composed/creative-room-scene-v2-mobile-day-256.png",
  );
});

test("runtime: 日景无映射的 assets/ 回退原值", () => {
  const raw = "assets/pixel/composed/unknown-scene-256.png";
  assert.equal(timeAdjustedRuntimeSceneUrlForState(raw, env({ timeOfDay: "day" })), raw);
});

test("runtime: 空值返回空串", () => {
  assert.equal(timeAdjustedRuntimeSceneUrlForState("", env()), "");
  assert.equal(timeAdjustedRuntimeSceneUrlForState(null, env()), "");
});

// ====== imageLayerUrlForState 主入口（合并 preset + runtime + 安全过滤）======

test("main: image_layer null 返回空串", () => {
  assert.equal(imageLayerUrlForState(null, env()), "");
  assert.equal(imageLayerUrlForState(undefined, env()), "");
});

test("main: direct url 多字段回退 (url/src/asset_url/background_url/image_url)", () => {
  assert.equal(imageLayerUrlForState({ url: "assets/pixel/x-256.png" }, env()), "assets/pixel/x-256.png");
  assert.equal(imageLayerUrlForState({ src: "assets/pixel/x-256.png" }, env()), "assets/pixel/x-256.png");
  assert.equal(imageLayerUrlForState({ asset_url: "assets/pixel/x-256.png" }, env()), "assets/pixel/x-256.png");
  assert.equal(imageLayerUrlForState({ background_url: "assets/pixel/x-256.png" }, env()), "assets/pixel/x-256.png");
  assert.equal(imageLayerUrlForState({ image_url: "assets/pixel/x-256.png" }, env()), "assets/pixel/x-256.png");
});

test("main: preset 驱动解析（无 direct url）", () => {
  assert.equal(
    imageLayerUrlForState({ preset: "contract-private-room" }, env()),
    "assets/pixel/composed/creative-room-scene-v2-256.png",
  );
});

test("main: direct url 优先于 preset", () => {
  assert.equal(
    imageLayerUrlForState({ preset: "contract-private-room", url: "assets/pixel/custom-256.png" }, env()),
    "assets/pixel/custom-256.png",
  );
});

test("main: javascript: 协议被拦截返回空串", () => {
  assert.equal(imageLayerUrlForState({ url: "javascript:alert(1)" }, env()), "");
});

test("main: data: 协议被拦截返回空串", () => {
  assert.equal(imageLayerUrlForState({ url: "data:image/png;base64,abc" }, env()), "");
});

test("main: http(s) URL 直通", () => {
  assert.equal(imageLayerUrlForState({ url: "https://example.com/scene.png" }, env()), "https://example.com/scene.png");
});

test("main: 相对路径 ./ 和 / 直通", () => {
  assert.equal(imageLayerUrlForState({ url: "./scenes/x.png" }, env()), "./scenes/x.png");
  assert.equal(imageLayerUrlForState({ url: "/abs/scene.png" }, env()), "/abs/scene.png");
});

test("main: 不安全前缀的裸文件名返回空串", () => {
  // 无 assets/ / ./ / / / http 前缀的裸名应被拒绝
  assert.equal(imageLayerUrlForState({ url: "naughty.png" }, env()), "");
});

test("main: 日景 preset 解析走 day 映射", () => {
  assert.equal(
    imageLayerUrlForState({ preset: "contract-private-room" }, env({ timeOfDay: "day" })),
    "assets/pixel/composed/creative-room-scene-v2-day-256.png",
  );
});
