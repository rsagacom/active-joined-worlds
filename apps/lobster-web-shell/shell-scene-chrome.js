/**
 * Pure DOM factory functions for scene chrome elements.
 *
 * These functions create DOM elements used in the user scene layout.
 * They do NOT attach event listeners, write to Gateway, or mutate
 * any global state — they only return created elements.
 */

import { setInlineStyle } from "./shell-dom-helpers.js";

/**
 * Create the room stage side element.
 */
export function createRoomStageSideElement(doc = globalThis.document) {
  const side = doc.createElement("div");
  side.className = "conversation-stage-side";
  setInlineStyle(side, "display", "flex", true);
  setInlineStyle(side, "flex-direction", "column");
  setInlineStyle(side, "align-items", "flex-start");
  setInlineStyle(side, "gap", "8px");
  side.setAttribute("aria-label", "房间角色资料");
  return side;
}

/**
 * Create a stage canvas chrome element with wrap and canvas.
 */
export function createRoomStageCanvasChrome(id, label, doc = globalThis.document) {
  const wrap = doc.createElement("div");
  wrap.className = "conversation-stage-canvas-wrap";
  const canvas = doc.createElement("canvas");
  canvas.id = id;
  canvas.className = "conversation-stage-canvas";
  canvas.setAttribute("aria-label", label);
  wrap.appendChild(canvas);
  return { wrap, canvas };
}

/**
 * Create the chat detail panel chrome element.
 * Returns { panel, contentEl } — caller must assign contentEl to the global ref.
 */
export function createChatDetailPanelChrome(doc = globalThis.document) {
  const panel = doc.createElement("section");
  panel.className = "panel chat-detail";
  setInlineStyle(panel, "display", "block", true);
  setInlineStyle(panel, "grid-column", "1 / -1", true);
  const title = doc.createElement("div");
  title.className = "panel-title";
  title.textContent = "房间资料";
  const contentEl = doc.createElement("div");
  contentEl.id = "chat-detail-content";
  contentEl.className = "chat-detail-content";
  panel.append(title, contentEl);
  return { panel, contentEl };
}

/**
 * Replace the room portrait side chrome while preserving its canvas wrapper.
 * The caller owns room state/model construction; this helper only projects DOM.
 */
export function renderRoomStagePortraitChrome(
  {
    sideEl = null,
    canvasWrapEl = null,
    canvasEl = null,
    portrait = {},
    chips = [],
  } = {},
  {
    doc = globalThis.document,
    createChip = null,
    renderPortrait = null,
  } = {},
) {
  if (!sideEl) return false;
  if (canvasWrapEl && canvasWrapEl.parentNode !== sideEl) {
    sideEl.prepend(canvasWrapEl);
  }

  for (const node of Array.from(sideEl.children)) {
    if (node !== canvasWrapEl) node.remove();
  }

  if (typeof renderPortrait === "function") {
    renderPortrait(canvasEl, portrait);
  }

  const makeChip = typeof createChip === "function"
    ? createChip
    : (text, tone = "muted") => {
        const chip = doc.createElement("div");
        chip.className = "stage-chip";
        chip.dataset.tone = tone;
        chip.textContent = text;
        return chip;
      };
  sideEl.appendChild(makeChip("角色资料", "accent"));

  const lead = doc.createElement("div");
  lead.className = "stage-chip";
  lead.textContent = portrait.summary;
  sideEl.appendChild(lead);

  for (const chip of chips) {
    sideEl.appendChild(makeChip(chip.text, chip.tone));
  }
  return true;
}
