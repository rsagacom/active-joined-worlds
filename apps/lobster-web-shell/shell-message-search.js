// shell-message-search.js — 消息搜索 DOM 纯规格
import { formatDateTime } from "./shell-message-render.js";
import { createDomNodeFromSpec } from "./shell-dom-helpers.js";

/** 搜索结果文本预览长度上限，与原 renderSearchResults 的 substring(0, 100) 等价。 */
export const SEARCH_RESULT_TEXT_PREVIEW_LENGTH = 100;
export const MESSAGE_SEARCH_DEFAULT_LIMIT = 20;

export function messageSearchRequestModel({
  gatewayUrl = "",
  roomId = "",
  residentId = "",
  query = "",
  limit = MESSAGE_SEARCH_DEFAULT_LIMIT,
} = {}) {
  const normalizedGatewayUrl = String(gatewayUrl || "").trim();
  const normalizedRoomId = String(roomId || "");
  const normalizedResidentId = String(residentId || "").trim();
  const normalizedQuery = String(query || "").trim();
  if (!normalizedGatewayUrl || !normalizedRoomId || !normalizedResidentId || !normalizedQuery) return null;
  const q = encodeURIComponent(normalizedQuery);
  const encodedRoomId = encodeURIComponent(normalizedRoomId);
  const encodedResidentId = encodeURIComponent(normalizedResidentId);
  return {
    query: normalizedQuery,
    roomId: normalizedRoomId,
    residentId: normalizedResidentId,
    limit,
    url: `${normalizedGatewayUrl}/v1/shell/messages/search?q=${q}&room_id=${encodedRoomId}&resident_id=${encodedResidentId}&limit=${encodeURIComponent(String(limit))}`,
  };
}

export function messageSearchRowMatchesId(row, messageId) {
  if (messageId === null || messageId === undefined) return false;
  const targetId = String(messageId);
  if (!targetId) return false;
  return row?.dataset?.messageId === targetId;
}

export function messageSearchBarDomSpec() {
  return {
    tag: "div",
    className: "message-search-bar",
    display: "none",
    children: [
      {
        tag: "input",
        type: "search",
        className: "message-search-input",
        placeholder: "搜索消息...",
      },
      {
        tag: "button",
        type: "button",
        className: "message-search-close",
        text: "✕",
      },
      {
        tag: "div",
        className: "message-search-results",
      },
    ],
  };
}

export function mountMessageSearchChrome(
  {
    timelineEl = null,
    stageSideEl = null,
    onToggle = null,
  } = {},
  {
    doc = globalThis.document,
    createNode = createDomNodeFromSpec,
  } = {},
) {
  const toggleButton = doc.createElement("button");
  toggleButton.className = "search-toggle-btn";
  toggleButton.textContent = "🔍";
  toggleButton.title = "搜索消息";
  if (typeof onToggle === "function") {
    toggleButton.addEventListener("click", onToggle);
  }

  const searchBar = createNode(messageSearchBarDomSpec(), doc);
  if (timelineEl?.parentNode) {
    timelineEl.parentNode.insertBefore(searchBar, timelineEl);
  }
  if (stageSideEl) {
    const toggleWrapper = doc.createElement("span");
    toggleWrapper.className = "stage-chip";
    toggleWrapper.appendChild(toggleButton);
    stageSideEl.appendChild(toggleWrapper);
  }

  return { searchBar, toggleButton };
}

export function createMessageSearchController({
  doc = globalThis.document,
  searchBar = null,
  getGatewayUrl = () => "",
  getRoomId = () => "",
  getResidentId = () => "",
  getSessionToken = () => "",
  fetchFn = globalThis.fetch,
  createNode = (spec) => createDomNodeFromSpec(spec, doc),
  setTimeoutFn = globalThis.setTimeout,
  clearTimeoutFn = globalThis.clearTimeout,
  debounceMs = 300,
  highlightMs = 2000,
} = {}) {
  let debounceTimer = null;
  let searchSequence = 0;
  let cleanup = null;

  const input = () => searchBar?.querySelector?.(".message-search-input") || null;
  const closeButton = () => searchBar?.querySelector?.(".message-search-close") || null;
  const resultContainer = () => searchBar?.querySelector?.(".message-search-results") || null;

  function clearResults() {
    resultContainer()?.replaceChildren();
  }

  function close() {
    if (searchBar) searchBar.style.display = "none";
    clearResults();
  }

  function toggle() {
    if (!searchBar) return;
    const isVisible = searchBar.style.display !== "none";
    if (isVisible) {
      close();
      return;
    }
    searchBar.style.display = "block";
    input()?.focus();
  }

  function findTargetRow(messageId) {
    const rows = Array.from(doc?.querySelectorAll?.("[data-message-id]") || []);
    return rows.find((row) => messageSearchRowMatchesId(row, messageId)) || null;
  }

  function scrollToMessage(messageId) {
    const row = findTargetRow(messageId);
    if (!row) return;
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    row.classList.add("message-highlight");
    setTimeoutFn(() => row.classList.remove("message-highlight"), highlightMs);
  }

  function renderResults(messages) {
    const container = resultContainer();
    if (!container) return;
    container.replaceChildren();
    if (!messages?.length) {
      container.appendChild(createNode(searchEmptyStateDomSpec()));
      return;
    }
    for (const message of messages) {
      const item = createNode(searchResultItemDomSpec(message));
      item.addEventListener("click", () => {
        scrollToMessage(message.message_id);
        close();
      });
      container.appendChild(item);
    }
  }

  async function search(query) {
    const request = messageSearchRequestModel({
      gatewayUrl: getGatewayUrl(),
      roomId: getRoomId(),
      residentId: getResidentId(),
      query,
    });
    const sequence = ++searchSequence;
    if (!request) {
      clearResults();
      return;
    }
    try {
      const sessionToken = String(getSessionToken() || "").trim();
      const headers = sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {};
      const response = await fetchFn(request.url, { headers });
      if (!response.ok || sequence !== searchSequence) return;
      const messages = await response.json();
      if (sequence === searchSequence) renderResults(messages);
    } catch {
      // Search is an auxiliary surface; transport state remains owned by the shell.
    }
  }

  function bind() {
    if (cleanup) return cleanup;
    const searchInput = input();
    const searchCloseButton = closeButton();
    const onInput = () => {
      if (debounceTimer !== null) clearTimeoutFn(debounceTimer);
      debounceTimer = setTimeoutFn(() => {
        debounceTimer = null;
        void search(searchInput.value);
      }, debounceMs);
    };
    const onClose = () => close();
    searchInput?.addEventListener("input", onInput);
    searchCloseButton?.addEventListener("click", onClose);
    if (searchInput?.dataset) searchInput.dataset.searchWired = "true";

    cleanup = () => {
      if (debounceTimer !== null) {
        clearTimeoutFn(debounceTimer);
        debounceTimer = null;
      }
      searchInput?.removeEventListener("input", onInput);
      searchCloseButton?.removeEventListener("click", onClose);
      if (searchInput?.dataset) delete searchInput.dataset.searchWired;
      cleanup = null;
    };
    return cleanup;
  }

  return {
    bind,
    clearResults,
    close,
    findTargetRow,
    renderResults,
    scrollToMessage,
    search,
    toggle,
  };
}

export function searchEmptyStateDomSpec() {
  return {
    tag: "div",
    className: "search-empty",
    text: "未找到匹配消息",
  };
}

export function searchResultItemDomSpec(message, options = {}) {
  const formatTime = options.formatDateTime ?? formatDateTime;
  const rawText =
    typeof message?.text === "string"
      ? message.text.substring(0, SEARCH_RESULT_TEXT_PREVIEW_LENGTH)
      : "";
  const messageId =
    message?.message_id === null || message?.message_id === undefined
      ? ""
      : String(message.message_id);
  return {
    tag: "div",
    className: "search-result-item",
    messageId,
    children: [
      { tag: "span", className: "search-result-sender", text: String(message?.sender) },
      { tag: "span", className: "search-result-text", text: rawText },
      { tag: "span", className: "search-result-time", text: String(formatTime(message?.timestamp_ms)) },
    ],
  };
}
