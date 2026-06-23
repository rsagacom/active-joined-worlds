/* shell-scene-image-layer.js — 场景 image-layer URL 解析纯函数
 * 从 app.js 提取。无 DOM / 无 window 直读：env { matchMedia, timeOfDay }
 * 通过依赖注入传入，使其脱离浏览器即可单测。
 * 只返回纯 URL 字符串；DOM 落地（setProperty 等）仍由 app.js 负责。
 */

const USER_SCENE_IMAGE_LAYER_PRESETS = new Map([
  ["contract-private-room", "assets/pixel/composed/creative-room-scene-v2-256.png"],
  ["contract-square-night", "assets/pixel/composed/hub-main-city-scene-v1-256.png"],
  ["creative-room", "assets/pixel/composed/creative-room-scene-v2-256.png"],
  ["main-city", "assets/pixel/composed/hub-main-city-scene-v1-256.png"],
]);

const USER_SCENE_IMAGE_LAYER_MOBILE_PRESETS = new Map([
  ["contract-private-room", "assets/pixel/composed/creative-room-scene-v2-mobile-256.png"],
  ["contract-square-night", "assets/pixel/composed/hub-main-city-scene-v1-mobile-256.png"],
  ["creative-room", "assets/pixel/composed/creative-room-scene-v2-mobile-256.png"],
  ["main-city", "assets/pixel/composed/hub-main-city-scene-v1-mobile-256.png"],
]);

const USER_SCENE_IMAGE_LAYER_DAY_PRESETS = new Map([
  ["contract-private-room", "assets/pixel/composed/creative-room-scene-v2-day-256.png"],
  ["contract-square-night", "assets/pixel/composed/hub-main-city-scene-v1-day-256.png"],
  ["creative-room", "assets/pixel/composed/creative-room-scene-v2-day-256.png"],
  ["main-city", "assets/pixel/composed/hub-main-city-scene-v1-day-256.png"],
]);

const USER_SCENE_IMAGE_LAYER_MOBILE_DAY_PRESETS = new Map([
  ["contract-private-room", "assets/pixel/composed/creative-room-scene-v2-mobile-day-256.png"],
  ["contract-square-night", "assets/pixel/composed/hub-main-city-scene-v1-mobile-day-256.png"],
  ["creative-room", "assets/pixel/composed/creative-room-scene-v2-mobile-day-256.png"],
  ["main-city", "assets/pixel/composed/hub-main-city-scene-v1-mobile-day-256.png"],
]);

const DAY_SCENE_RUNTIME_URLS = new Map([
  ["assets/pixel/composed/creative-room-scene-v2-256.png", "assets/pixel/composed/creative-room-scene-v2-day-256.png"],
  ["assets/pixel/composed/creative-room-scene-v2-mobile-256.png", "assets/pixel/composed/creative-room-scene-v2-mobile-day-256.png"],
  ["assets/pixel/composed/hub-main-city-scene-v1-256.png", "assets/pixel/composed/hub-main-city-scene-v1-day-256.png"],
  ["assets/pixel/composed/hub-main-city-scene-v1-mobile-256.png", "assets/pixel/composed/hub-main-city-scene-v1-mobile-day-256.png"],
]);

const MOBILE_SCENE_RUNTIME_URLS = new Map([
  ["assets/pixel/composed/creative-room-scene-v2-256.png", "assets/pixel/composed/creative-room-scene-v2-mobile-256.png"],
  ["assets/pixel/composed/creative-room-scene-v2-day-256.png", "assets/pixel/composed/creative-room-scene-v2-mobile-day-256.png"],
  ["assets/pixel/composed/hub-main-city-scene-v1-256.png", "assets/pixel/composed/hub-main-city-scene-v1-mobile-256.png"],
  ["assets/pixel/composed/hub-main-city-scene-v1-day-256.png", "assets/pixel/composed/hub-main-city-scene-v1-mobile-day-256.png"],
]);

function isMobileEnv(env) {
  return Boolean(env?.matchMedia?.("(max-width: 820px)")?.matches);
}

export function presetImageLayerUrlForState(preset, env) {
  const key = String(preset || "").trim();
  if (!key) return "";
  const isMobile = isMobileEnv(env);
  if (env?.timeOfDay === "day") {
    const dayMap = isMobile ? USER_SCENE_IMAGE_LAYER_MOBILE_DAY_PRESETS : USER_SCENE_IMAGE_LAYER_DAY_PRESETS;
    return dayMap.get(key) || USER_SCENE_IMAGE_LAYER_DAY_PRESETS.get(key) || USER_SCENE_IMAGE_LAYER_PRESETS.get(key) || "";
  }
  const nightMap = isMobile ? USER_SCENE_IMAGE_LAYER_MOBILE_PRESETS : USER_SCENE_IMAGE_LAYER_PRESETS;
  return nightMap.get(key) || USER_SCENE_IMAGE_LAYER_PRESETS.get(key) || "";
}

export function timeAdjustedRuntimeSceneUrlForState(candidate, env) {
  const raw = String(candidate || "").trim();
  if (!raw) return "";
  if (!raw.startsWith("assets/")) return raw;
  const isMobile = isMobileEnv(env);
  const dayCandidate =
    env?.timeOfDay === "day"
      ? DAY_SCENE_RUNTIME_URLS.get(raw) || raw
      : raw;
  return isMobile ? MOBILE_SCENE_RUNTIME_URLS.get(dayCandidate) || dayCandidate : dayCandidate;
}

export function imageLayerUrlForState(imageLayer, env) {
  if (!imageLayer) return "";
  const directUrl =
    imageLayer.url ||
    imageLayer.src ||
    imageLayer.asset_url ||
    imageLayer.background_url ||
    imageLayer.image_url ||
    "";
  const candidate = timeAdjustedRuntimeSceneUrlForState(directUrl || presetImageLayerUrlForState(imageLayer.preset, env), env);
  if (!candidate) return "";
  if (/^(?:javascript|data):/i.test(candidate)) return "";
  if (/^https?:\/\//i.test(candidate) || candidate.startsWith("./") || candidate.startsWith("/") || candidate.startsWith("assets/")) {
    return candidate;
  }
  return "";
}
