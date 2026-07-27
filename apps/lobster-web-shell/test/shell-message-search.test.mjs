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
  assert.deepEqual(
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
      residentId: "alice",
      query: "  龙虾 & IM  ",
    }),
    {
      query: "龙虾 & IM",
      roomId: "room:world/lobby",
      residentId: "alice",
      limit: 20,
      url: "http://127.0.0.1:8808/v1/shell/messages/search?q=%E9%BE%99%E8%99%BE%20%26%20IM&room_id=room%3Aworld%2Flobby&resident_id=alice&limit=20",
    },
  );
});

test("messageSearchRequestModel: returns null without required search inputs", () => {
  assert.equal(messageSearchRequestModel({ gatewayUrl: "", roomId: "r", query: "hi" }), null);
  assert.equal(messageSearchRequestModel({ gatewayUrl: "http://g", roomId: "", query: "hi" }), null);
  assert.equal(messageSearchRequestModel({ gatewayUrl: "http://g", roomId: "r", residentId: "", query: "hi" }), null);
  assert.equal(messageSearchRequestModel({ gatewayUrl: "http://g", roomId: "r", query: "   " }), null);
});

test("messageSearchRequestModel: supports custom limit", () => {
  assert.equal(
    messageSearchRequestModel({
      gatewayUrl: "http://g",
      roomId: "r",
      residentId: "alice",
      query: "hi",
      limit: 5,
    }).url,
    "http://g/v1/shell/messages/search?q=hi&room_id=r&resident_id=alice&limit=5",
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

test("mountMessageSearchChrome wires search controls into timeline and stage side", () => {
  assert.equal(typeof messageSearch.mountMessageSearchChrome, "function");

  const clickHandlers = [];
  const inserted = [];
  const stageChildren = [];
  const searchBar = { className: "message-search-bar" };
  const doc = {
    createElement(tagName) {
      return {
        tagName: tagName.toUpperCase(),
        className: "",
        textContent: "",
        title: "",
        children: [],
        addEventListener(type, handler) {
          clickHandlers.push([type, handler]);
        },
        appendChild(child) {
          this.children.push(child);
        },
      };
    },
  };
  const timelineEl = {
    parentNode: {
      insertBefore(node, anchor) {
        inserted.push([node, anchor]);
      },
    },
  };
  const stageSideEl = {
    appendChild(child) {
      stageChildren.push(child);
    },
  };
  let toggles = 0;

  const chrome = messageSearch.mountMessageSearchChrome(
    { timelineEl, stageSideEl, onToggle: () => { toggles += 1; } },
    { doc, createNode: () => searchBar },
  );

  assert.equal(chrome.searchBar, searchBar);
  assert.equal(chrome.toggleButton.className, "search-toggle-btn");
  assert.equal(chrome.toggleButton.textContent, "🔍");
  assert.equal(chrome.toggleButton.title, "搜索消息");
  assert.deepEqual(inserted, [[searchBar, timelineEl]]);
  assert.equal(stageChildren[0].className, "stage-chip");
  assert.equal(stageChildren[0].children[0], chrome.toggleButton);
  clickHandlers[0][1]();
  assert.equal(toggles, 1);
});

test("createMessageSearchController owns search, result selection, and close lifecycle", async () => {
  assert.equal(typeof messageSearch.createMessageSearchController, "function");
  const inputHandlers = {};
  const closeHandlers = {};
  const resultChildren = [];
  const resultContainer = {
    replaceChildren() { resultChildren.length = 0; },
    appendChild(child) { resultChildren.push(child); },
  };
  const input = {
    value: "",
    dataset: {},
    focusCount: 0,
    addEventListener(type, handler) { inputHandlers[type] = handler; },
    removeEventListener() {},
    focus() { this.focusCount += 1; },
  };
  const closeButton = {
    addEventListener(type, handler) { closeHandlers[type] = handler; },
    removeEventListener() {},
  };
  const searchBar = {
    style: { display: "none" },
    querySelector(selector) {
      return {
        ".message-search-input": input,
        ".message-search-close": closeButton,
        ".message-search-results": resultContainer,
      }[selector] || null;
    },
  };
  const targetRow = {
    dataset: { messageId: "msg-1" },
    classList: {
      values: new Set(),
      add(value) { this.values.add(value); },
      remove(value) { this.values.delete(value); },
    },
    scrollIntoView(options) { this.scrollOptions = options; },
  };
  const doc = {
    querySelectorAll() { return [targetRow]; },
  };
  const requests = [];
  const created = [];
  const controller = messageSearch.createMessageSearchController({
    doc,
    searchBar,
    getGatewayUrl: () => "http://gateway.test",
    getRoomId: () => "room:main",
    getResidentId: () => "alice",
    getSessionToken: () => "session-token",
    fetchFn: async (url, options) => {
      requests.push({ url, options });
      return {
        ok: true,
        async json() {
          return [{ message_id: "msg-1", sender: "alice", text: "hello", timestamp_ms: 1 }];
        },
      };
    },
    createNode(spec) {
      const handlers = {};
      const node = {
        spec,
        addEventListener(type, handler) { handlers[type] = handler; },
        handlers,
      };
      created.push(node);
      return node;
    },
    setTimeoutFn() { return 1; },
    clearTimeoutFn() {},
  });

  const cleanup = controller.bind();
  controller.toggle();
  assert.equal(searchBar.style.display, "block");
  assert.equal(input.focusCount, 1);

  await controller.search(" hello ");
  assert.deepEqual(
    requests[0],
    {
      url: "http://gateway.test/v1/shell/messages/search?q=hello&room_id=room%3Amain&resident_id=alice&limit=20",
      options: { headers: { Authorization: "Bearer session-token" } },
    },
  );
  assert.equal(resultChildren.length, 1);
  resultChildren[0].handlers.click();
  assert.deepEqual(targetRow.scrollOptions, { behavior: "smooth", block: "center" });
  assert.equal(targetRow.classList.values.has("message-highlight"), true);
  assert.equal(searchBar.style.display, "none");
  assert.equal(resultChildren.length, 0);

  assert.equal(typeof inputHandlers.input, "function");
  assert.equal(typeof closeHandlers.click, "function");
  assert.equal(typeof cleanup, "function");
  cleanup();
  assert.equal(created.length, 1);
});
