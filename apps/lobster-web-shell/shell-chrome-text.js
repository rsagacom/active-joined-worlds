/**
 * Pure text models and DOM factory helpers for shell chrome elements.
 *
 * Text functions map shellMode → display strings or data arrays.
 * DOM factory functions ensure a chrome element exists and is inserted at the correct anchor.
 * They do NOT attach event listeners or write to Gateway.
 */

/**
 * Default text for the chat priority badge, keyed by shell mode.
 * The caller is responsible for applying chatFocusMode override.
 */
export function chatPriorityBadgeDefaultText(shellMode) {
  if (shellMode === "admin") return "管理后台 · 先看会话，再展开工具";
  if (shellMode === "user") return "房间聊天 · 私信/群聊像常见 IM";
  return "城市外世界页 · 先看聊天，再看后台栏目";
}

/**
 * Banner text for the current shell mode.
 */
export function modeBannerText(shellMode) {
  if (shellMode === "user") return "房间内聊天主界面 · 左侧会话，中间消息，底部输入";
  if (shellMode === "admin") return "管理后台 · 左侧选工具，中间处理当前事务";
  return "城市外世界页 · 先看消息，再看后台栏目";
}

/**
 * Quick-link button targets for the current shell mode.
 * Each entry is [label, workspace].
 */
export function chatQuickLinksTargets(shellMode) {
  if (shellMode === "admin") {
    return [
      ["当前工具", "governance"],
      ["登录与身份", "auth"],
      ["查看登录", "auth"],
    ];
  }
  if (shellMode === "user") {
    return [["继续聊天", "chat"]];
  }
  return [
    ["世界", "world"],
    ["治理", "governance"],
    ["身份/登录", "auth"],
  ];
}

// ── DOM factory helpers ──

/**
 * Ensure the mode banner element exists and is inserted before the panel title
 * (or prepended if no title is found). Returns the banner element.
 *
 * Does NOT call updateModeBanner() — the caller must update content after insertion.
 */
export function ensureModeBannerDom(shellPage, panelEl, doc = globalThis.document) {
  if (shellPage === "user" || !panelEl) return null;

  let bannerEl = panelEl.querySelector(".mode-banner");
  if (!bannerEl) {
    bannerEl = doc.createElement("div");
    bannerEl.className = "mode-banner";
    const title = panelEl.querySelector(".panel-title");
    if (title) {
      title.insertAdjacentElement("beforebegin", bannerEl);
    } else {
      panelEl.prepend(bannerEl);
    }
  }
  return bannerEl;
}

/**
 * Ensure the conversation callout element exists and is inserted before the timeline
 * (or appended if no timeline anchor is found). Returns the callout element.
 *
 * Does NOT call updateConversationCallout() — the caller must update content after insertion.
 */
export function ensureConversationCalloutDom(shellPage, panelEl, timelineEl, doc = globalThis.document) {
  if (shellPage === "user" || !panelEl) return null;

  let calloutEl = panelEl.querySelector(".conversation-callout");
  if (!calloutEl) {
    calloutEl = doc.createElement("div");
    calloutEl.className = "conversation-callout";
    if (timelineEl && timelineEl.parentElement === panelEl) {
      panelEl.insertBefore(calloutEl, timelineEl);
    } else {
      panelEl.appendChild(calloutEl);
    }
  }
  return calloutEl;
}
