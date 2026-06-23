// shell-message-search.js — 消息搜索 DOM 纯规格
import { formatDateTime } from "./shell-message-render.js";

/** 搜索结果文本预览长度上限，与原 renderSearchResults 的 substring(0, 100) 等价。 */
export const SEARCH_RESULT_TEXT_PREVIEW_LENGTH = 100;
export const MESSAGE_SEARCH_DEFAULT_LIMIT = 20;

export function messageSearchRequestModel({
  gatewayUrl = "",
  roomId = "",
  query = "",
  limit = MESSAGE_SEARCH_DEFAULT_LIMIT,
} = {}) {
  const normalizedGatewayUrl = String(gatewayUrl || "").trim();
  const normalizedRoomId = String(roomId || "");
  const normalizedQuery = String(query || "").trim();
  if (!normalizedGatewayUrl || !normalizedRoomId || !normalizedQuery) return null;
  const q = encodeURIComponent(normalizedQuery);
  const encodedRoomId = encodeURIComponent(normalizedRoomId);
  return {
    query: normalizedQuery,
    roomId: normalizedRoomId,
    limit,
    url: `${normalizedGatewayUrl}/v1/shell/messages/search?q=${q}&room_id=${encodedRoomId}&limit=${encodeURIComponent(String(limit))}`,
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
