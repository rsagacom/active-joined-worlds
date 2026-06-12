/**
 * shell-avatar — deterministic pixel-art avatar styles
 *
 * Generates unique background colours and subtle patterns from a seed string
 * (resident_id, avatar_id, or display name). No images, no server round-trips.
 *
 * Usage:
 *   import { residentAvatarStyle } from "./shell-avatar.js";
 *   const style = residentAvatarStyle("rsaga");
 *   // => { backgroundColor: "#5b8c5a", color: "#fff", pattern: "dots" }
 */

/** 20-colour pixel-art palette — muted, readable, game-like */
const PALETTE = [
  "#5b8c5a", "#6b4e7a", "#c17d3a", "#4a7a8c", "#8c5a4a",
  "#4a8c6b", "#7a5a8c", "#8c7a3a", "#3a6b8c", "#8c4a6a",
  "#5a8c7a", "#6a4a8c", "#a07a3a", "#3a7a9c", "#8c5a5a",
  "#4a6b5a", "#7a6a9c", "#b07a4a", "#4a6b7a", "#9c6a4a",
];

/** Simple string → unsigned 32-bit hash (djb2 variant) */
function hashSeed(seed) {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) + h + seed.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

/**
 * Returns deterministic CSS custom properties for an avatar element.
 *
 * @param {string} seed — resident_id, avatar_id, or any stable identifier
 * @returns {{ backgroundColor: string, color: string, patternAngle: string }}
 */
export function residentAvatarStyle(seed) {
  const h = hashSeed(String(seed ?? ""));
  const bg = PALETTE[h % PALETTE.length];
  const angle = (h % 360);

  // Luminance check — pick white or near-black text for contrast
  const r = parseInt(bg.slice(1, 3), 16);
  const g = parseInt(bg.slice(3, 5), 16);
  const b = parseInt(bg.slice(5, 7), 16);
  const lum = 0.299 * r + 0.587 * g + 0.114 * b;
  const color = lum > 140 ? "#1a1a1a" : "#fff";

  return { backgroundColor: bg, color, patternAngle: angle + "deg" };
}

/**
 * Applies the avatar style to a DOM element via inline CSS.
 * Keeps any existing textContent (the initial badge) untouched.
 *
 * @param {HTMLElement} el — the avatar container element
 * @param {string} seed — stable identifier
 */
export function applyAvatarStyle(el, seed) {
  if (!el || !seed) return;
  const style = residentAvatarStyle(seed);
  el.style.backgroundColor = style.backgroundColor;
  el.style.color = style.color;
  // Subtle diagonal sheen
  el.style.backgroundImage =
    "linear-gradient(" + style.patternAngle + ", rgba(255,255,255,0.12) 0%, transparent 50%, rgba(0,0,0,0.08) 100%)";
}
