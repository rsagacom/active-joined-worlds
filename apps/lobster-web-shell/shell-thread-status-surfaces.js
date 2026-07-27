import { createLine } from "./shell-dom-helpers.js";

function defaultClearChildren(element) {
  if (!element) return;
  while (element.firstChild) element.removeChild(element.firstChild);
}

export function createThreadStatusSurfaceRenderer({
  doc = globalThis.document,
  getRailEl,
  getModel,
  createLineFn = createLine,
  clearChildrenFn = defaultClearChildren,
} = {}) {
  const documentRef = doc || globalThis.document;

  function createThreadStatusItemNode(item) {
    const chip = documentRef.createElement("div");
    chip.className = `thread-status-item thread-status-item-${item.tone}`;
    chip.appendChild(createLineFn("thread-status-label", item.label));
    chip.appendChild(createLineFn("thread-status-value", item.value));
    return chip;
  }

  function renderThreadStatusRail(room) {
    const rail = getRailEl?.();
    if (!rail) return;
    clearChildrenFn(rail);
    const model = getModel?.(room) || { visible: false, items: [] };
    if (!model.visible) {
      rail.classList.add("surface-hidden");
      return;
    }
    rail.classList.remove("surface-hidden");
    for (const item of model.items || []) {
      rail.appendChild(createThreadStatusItemNode(item));
    }
  }

  return {
    createThreadStatusItemNode,
    renderThreadStatusRail,
  };
}
