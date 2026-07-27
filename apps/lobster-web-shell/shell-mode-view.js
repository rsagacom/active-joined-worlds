import {
  resolveShellMode,
  currentShellPage,
  shellModeConfig,
  translateShellMode,
} from "./shell-shared.js";

/**
 * Compute the shell mode view state from DOM/URL sources.
 * Pure function — does not mutate any global state.
 *
 * @param {{ body?: object, href?: string }} sources
 * @returns {{ shellMode: string, shellPage: string, compactShell: boolean, config: object }}
 */
export function shellModeViewState({
  body = globalThis.document?.body,
  href = globalThis.window?.location?.href || "http://localhost/",
} = {}) {
  const mode = resolveShellMode({ body, href });
  const shellPage = currentShellPage(body);
  const compactShell = shellPage === "user" || shellPage === "admin";
  const config = shellModeConfig(mode);
  return { shellMode: mode, shellPage, compactShell, config };
}

/**
 * Apply shellMode and chromeDensity to body.dataset.
 */
export function applyShellModeBodyDataset(viewState, body = globalThis.document?.body) {
  if (!body?.dataset) return;
  body.dataset.shellMode = viewState.shellMode;
  body.dataset.chromeDensity = viewState.compactShell ? "compact" : "full";
}

/**
 * Update the shell-mode-badge element text and visibility.
 */
export function updateShellModeBadge(viewState, badgeEl) {
  if (!badgeEl) return;
  badgeEl.textContent =
    viewState.shellPage === "hub"
      ? "入口：聊天入口"
      : `入口：${translateShellMode(viewState.shellMode)}`;
  badgeEl.classList.toggle("shell-hidden", viewState.compactShell);
}

/**
 * Set the document title for the current shell mode.
 * Skips hub and world-entry pages.
 */
export function updateShellModeDocumentTitle(viewState, doc = globalThis.document) {
  if (viewState.shellPage !== "hub" && viewState.shellPage !== "world-entry") {
    doc.title = `龙虾聊天 · ${translateShellMode(viewState.shellMode)}`;
  }
}

/**
 * Apply masthead eyebrow, title, and hero text.
 */
export function updateShellModeMasthead(viewState, {
  eyebrowEl,
  titleEl,
  heroEl,
} = {}) {
  if (eyebrowEl) {
    eyebrowEl.textContent = viewState.shellPage === "hub"
      ? "龙虾聊天"
      : viewState.config.eyebrow;
  }
  if (titleEl) {
    titleEl.textContent = viewState.shellPage === "hub"
      ? "选一个房间开始"
      : viewState.config.title;
  }
  if (heroEl) {
    heroEl.textContent = viewState.config.hero;
  }
}

/**
 * Render the guide items from config into the guide element.
 */
export function renderShellModeGuide(config, guideEl) {
  if (!guideEl) return;
  if (typeof guideEl.replaceChildren === "function") {
    guideEl.replaceChildren();
  } else {
    while (guideEl.firstChild) {
      guideEl.removeChild(guideEl.firstChild);
    }
  }
  for (const item of config.guide) {
    const div = globalThis.document?.createElement
      ? globalThis.document.createElement("div")
      : { className: "", textContent: "" };
    div.className = "guide-item";
    div.textContent = item;
    guideEl.appendChild(div);
  }
}

/**
 * Show/hide the entry grid based on shell page type.
 */
export function toggleShellModeEntryGrid(shellPage, entryGridEl) {
  if (!entryGridEl) return;
  entryGridEl.classList.toggle("shell-hidden", shellPage !== "hub");
}

/**
 * Show/hide status chrome elements based on compact mode.
 */
export function toggleShellModeStatusChrome(compactShell, {
  transportEl,
  storageEl,
  gatewayEl,
  providerEl,
  worldEl,
} = {}) {
  transportEl?.classList.toggle("shell-hidden", compactShell);
  storageEl?.classList.toggle("shell-hidden", compactShell);
  gatewayEl?.classList.toggle("shell-hidden", compactShell);
  providerEl?.classList.toggle("shell-hidden", compactShell);
  worldEl?.classList.toggle("shell-hidden", compactShell);
}

/**
 * Show/hide admin-only elements via data-shell-role selector.
 */
export function toggleAdminShellRoleVisibility(hideAdmin, root = globalThis.document) {
  if (!root?.querySelectorAll) return;
  for (const element of root.querySelectorAll("[data-shell-role='admin']")) {
    element.classList.toggle("shell-hidden", hideAdmin);
  }
}

/**
 * Mark the active shell entry card for the current mode.
 */
export function updateShellEntryCards(mode, cards) {
  for (const card of cards) {
    const isActive = card.dataset.shellEntry === mode;
    card.classList.toggle("active", isActive);
    if (isActive) {
      card.setAttribute("aria-current", "page");
    } else {
      card.removeAttribute("aria-current");
    }
  }
}

/**
 * Apply panel title text based on shell mode.
 */
export function updatePanelTitles(shellMode, {
  governanceEl,
  authEl,
  roomsEl,
  conversationEl,
} = {}) {
  if (governanceEl) {
    governanceEl.textContent = shellMode === "user" ? "边缘抽屉" : "更多";
  }
  if (authEl) {
    authEl.textContent = shellMode === "admin" ? "身份" : "登录";
  }
  if (roomsEl) {
    roomsEl.textContent = shellMode === "user" ? "房间列表" : "会话";
  }
  if (conversationEl) {
    conversationEl.textContent = shellMode === "user" ? "消息流" : "消息";
  }
}

/**
 * Orchestrator: apply the full shell mode view state to the DOM.
 * This is the single entry point that app.js calls.
 */
export function applyShellModeView(viewState, {
  body = globalThis.document?.body,
  badgeEl,
  doc = globalThis.document,
  eyebrowEl,
  titleEl,
  heroEl,
  guideEl,
  entryGridEl,
  statusEls = {},
  entryCards = [],
  panelTitleEls = {},
} = {}) {
  applyShellModeBodyDataset(viewState, body);
  updateShellModeBadge(viewState, badgeEl);
  updateShellModeDocumentTitle(viewState, doc);
  updateShellModeMasthead(viewState, { eyebrowEl, titleEl, heroEl });
  renderShellModeGuide(viewState.config, guideEl);
  toggleShellModeEntryGrid(viewState.shellPage, entryGridEl);
  toggleShellModeStatusChrome(viewState.compactShell, statusEls);
  toggleAdminShellRoleVisibility(viewState.shellMode === "user");
  updateShellEntryCards(viewState.shellMode, entryCards);
  updatePanelTitles(viewState.shellMode, panelTitleEls);
}
