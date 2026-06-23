// shell-message-search.test.mjs — 消息搜索结果纯规格单元测试
import { test } from "node:test";
import assert from "node:assert/strict";
import * as messageSearch from "../shell-message-search.js";

const {
  messageSearchRequestModel,
  messageSearchBarDomSpec,
  searchEmptyStateDomSpec,
  searchResultItemDomSpec,
  SEARCH_RESULT_TEXT_PREVIEW_LENGTH,
} = messageSearch;

// ====== 结构与正常渲染 ======

test("messageSearchBarDomSpec: builds search bar controls without HTML strings", () => {
  assert.deepEqual(messageSearchBarDomSpec(), {
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
  });
});

test("searchResultItemDomSpec: 渲染 sender / text / time 三段结构", () => {
  assert.deepEqual(searchResultItemDomSpec({
    message_id: "msg-1",
    sender: "alice",
    text: "你好世界",
    timestamp_ms: 1700000000000,
  }, { formatDateTime: () => "2026-06-18 10:00" }), {
    tag: "div",
    className: "search-result-item",
    messageId: "msg-1",
    children: [
      { tag: "span", className: "search-result-sender", text: "alice" },
      { tag: "span", className: "search-result-text", text: "你好世界" },
      { tag: "span", className: "search-result-time", text: "2026-06-18 10:00" },
    ],
  });
});

test("searchResultItemDomSpec: 保留可字符串化的 message_id", () => {
  assert.equal(
    searchResultItemDomSpec({
      message_id: 0,
      sender: "system",
      text: "zero id",
      timestamp_ms: 0,
    }).messageId,
    "0",
  );
});

// ====== XSS 安全（搜索结果来自网关，渲染层必须走 textContent） ======

test("searchResultItemDomSpec: keeps raw sender as text, not HTML", () => {
  const spec = searchResultItemDomSpec({
    sender: "<script>alert(1)</script>",
    text: "x",
    timestamp_ms: 0,
  });
  assert.equal(spec.children[0].text, "<script>alert(1)</script>");
});

test("searchResultItemDomSpec: keeps raw text as text, not HTML", () => {
  const spec = searchResultItemDomSpec({
    sender: "u",
    text: '<img src=x onerror=alert(1)>',
    timestamp_ms: 0,
  });
  assert.equal(spec.children[1].text, '<img src=x onerror=alert(1)>');
});

// ====== 截断与缺失 ======

test("searchResultItemDomSpec: text 截断到预览长度上限", () => {
  const long = "a".repeat(SEARCH_RESULT_TEXT_PREVIEW_LENGTH + 30);
  const spec = searchResultItemDomSpec({ sender: "u", text: long, timestamp_ms: 0 });
  assert.equal(spec.children[1].text.length, SEARCH_RESULT_TEXT_PREVIEW_LENGTH);
});

test("searchResultItemDomSpec: text 缺失时渲染空 text 段", () => {
  const spec = searchResultItemDomSpec({ sender: "u", timestamp_ms: 0 });
  assert.equal(spec.children[1].text, "");
});

// ====== 依赖注入（便于隔离测试，且不破坏默认行为） ======

test("searchResultItemDomSpec: 允许注入 formatDateTime 做隔离断言", () => {
  const spec = searchResultItemDomSpec(
    { sender: "bob", text: "hi", timestamp_ms: 42 },
    {
      formatDateTime: (ms) => `T${ms}`,
    },
  );
  assert.equal(spec.children[2].text, "T42");
});

test("searchEmptyStateDomSpec: builds stable empty result row", () => {
  assert.deepEqual(searchEmptyStateDomSpec(), {
    tag: "div",
    className: "search-empty",
    text: "未找到匹配消息",
  });
});

test("SEARCH_RESULT_TEXT_PREVIEW_LENGTH: 与原硬编码 100 一致", () => {
  assert.equal(SEARCH_RESULT_TEXT_PREVIEW_LENGTH, 100);
});

test("messageSearchRequestModel: builds encoded gateway search URL", () => {
  assert.deepEqual(
    messageSearchRequestModel({
      gatewayUrl: "http://127.0.0.1:8808",
      roomId: "room:world/lobby",
      query: "  龙虾 & IM  ",
    }),
    {
      query: "龙虾 & IM",
      roomId: "room:world/lobby",
      limit: 20,
      url: "http://127.0.0.1:8808/v1/shell/messages/search?q=%E9%BE%99%E8%99%BE%20%26%20IM&room_id=room%3Aworld%2Flobby&limit=20",
    },
  );
});

test("messageSearchRequestModel: returns null without required search inputs", () => {
  assert.equal(messageSearchRequestModel({ gatewayUrl: "", roomId: "r", query: "hi" }), null);
  assert.equal(messageSearchRequestModel({ gatewayUrl: "http://g", roomId: "", query: "hi" }), null);
  assert.equal(messageSearchRequestModel({ gatewayUrl: "http://g", roomId: "r", query: "   " }), null);
});

test("messageSearchRequestModel: supports custom limit", () => {
  assert.equal(
    messageSearchRequestModel({
      gatewayUrl: "http://g",
      roomId: "r",
      query: "hi",
      limit: 5,
    }).url,
    "http://g/v1/shell/messages/search?q=hi&room_id=r&limit=5",
  );
});

test("messageSearchRowMatchesId: 用 dataset 精确匹配特殊 message_id", () => {
  assert.equal(typeof messageSearch.messageSearchRowMatchesId, "function");
  const row = { dataset: { messageId: 'msg-"x"]' } };
  assert.equal(messageSearch.messageSearchRowMatchesId(row, 'msg-"x"]'), true);
  assert.equal(messageSearch.messageSearchRowMatchesId(row, 'msg-"other"]'), false);
  assert.equal(messageSearch.messageSearchRowMatchesId({ dataset: {} }, 'msg-"x"]'), false);
  assert.equal(messageSearch.messageSearchRowMatchesId(null, 'msg-"x"]'), false);
});
