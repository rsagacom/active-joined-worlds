import { test } from "node:test";
import assert from "node:assert/strict";
import {
  chatPriorityBadgeDefaultText,
  modeBannerText,
  chatQuickLinksTargets,
  ensureModeBannerDom,
  ensureConversationCalloutDom,
} from "../shell-chrome-text.js";

// --- chatPriorityBadgeDefaultText ---

test("chatPriorityBadgeDefaultText returns admin badge text", () => {
  assert.equal(
    chatPriorityBadgeDefaultText("admin"),
    "管理后台 · 先看会话，再展开工具",
  );
});

test("chatPriorityBadgeDefaultText returns user badge text", () => {
  assert.equal(
    chatPriorityBadgeDefaultText("user"),
    "房间聊天 · 私信/群聊像常见 IM",
  );
});

test("chatPriorityBadgeDefaultText returns unified badge text", () => {
  assert.equal(
    chatPriorityBadgeDefaultText("unified"),
    "城市外世界页 · 先看聊天，再看后台栏目",
  );
});

test("chatPriorityBadgeDefaultText returns unified text for unknown modes", () => {
  assert.equal(
    chatPriorityBadgeDefaultText("hub"),
    "城市外世界页 · 先看聊天，再看后台栏目",
  );
});

// --- modeBannerText ---

test("modeBannerText returns user banner text", () => {
  assert.equal(
    modeBannerText("user"),
    "房间内聊天主界面 · 左侧会话，中间消息，底部输入",
  );
});

test("modeBannerText returns admin banner text", () => {
  assert.equal(
    modeBannerText("admin"),
    "管理后台 · 左侧选工具，中间处理当前事务",
  );
});

test("modeBannerText returns unified banner text", () => {
  assert.equal(
    modeBannerText("unified"),
    "城市外世界页 · 先看消息，再看后台栏目",
  );
});

test("modeBannerText returns unified text for unknown modes", () => {
  assert.equal(
    modeBannerText("hub"),
    "城市外世界页 · 先看消息，再看后台栏目",
  );
});

// --- chatQuickLinksTargets ---

test("chatQuickLinksTargets returns admin quick link targets", () => {
  const targets = chatQuickLinksTargets("admin");
  assert.deepEqual(targets, [
    ["当前工具", "governance"],
    ["登录与身份", "auth"],
    ["查看登录", "auth"],
  ]);
});

test("chatQuickLinksTargets returns user quick link targets", () => {
  const targets = chatQuickLinksTargets("user");
  assert.deepEqual(targets, [
    ["继续聊天", "chat"],
  ]);
});

test("chatQuickLinksTargets returns unified quick link targets", () => {
  const targets = chatQuickLinksTargets("unified");
  assert.deepEqual(targets, [
    ["世界", "world"],
    ["治理", "governance"],
    ["身份/登录", "auth"],
  ]);
});

test("chatQuickLinksTargets returns unified targets for unknown modes", () => {
  const targets = chatQuickLinksTargets("hub");
  assert.deepEqual(targets, [
    ["世界", "world"],
    ["治理", "governance"],
    ["身份/登录", "auth"],
  ]);
});

// --- ensureModeBannerDom ---

test("ensureModeBannerDom returns null for user shellPage", () => {
  const panelEl = { querySelector() { return null; } };
  assert.equal(ensureModeBannerDom("user", panelEl, fakeDoc()), null);
});

test("ensureModeBannerDom returns null when panelEl is null", () => {
  assert.equal(ensureModeBannerDom("admin", null, fakeDoc()), null);
});

test("ensureModeBannerDom creates and inserts banner before panel-title", () => {
  const createdElements = [];
  const doc = fakeDoc(createdElements);
  const titleEl = { insertAdjacentElement() {} };
  const insertCalls = [];
  titleEl.insertAdjacentElement = (pos, el) => { insertCalls.push({ pos, el }); };

  const panelEl = {
    querySelector(sel) {
      if (sel === ".mode-banner") return null;
      if (sel === ".panel-title") return titleEl;
      return null;
    },
  };

  const bannerEl = ensureModeBannerDom("admin", panelEl, doc);
  assert.ok(bannerEl);
  assert.equal(bannerEl.className, "mode-banner");
  assert.equal(insertCalls.length, 1);
  assert.equal(insertCalls[0].pos, "beforebegin");
  assert.equal(insertCalls[0].el, bannerEl);
});

test("ensureModeBannerDom prepends when no panel-title exists", () => {
  const createdElements = [];
  const doc = fakeDoc(createdElements);
  const prependCalls = [];
  const panelEl = {
    querySelector(sel) {
      if (sel === ".mode-banner") return null;
      if (sel === ".panel-title") return null;
      return null;
    },
    prepend(el) { prependCalls.push(el); },
  };

  const bannerEl = ensureModeBannerDom("unified", panelEl, doc);
  assert.ok(bannerEl);
  assert.equal(prependCalls.length, 1);
  assert.equal(prependCalls[0], bannerEl);
});

test("ensureModeBannerDom returns existing banner without creating a new one", () => {
  const createdElements = [];
  const doc = fakeDoc(createdElements);
  const existingBanner = { className: "mode-banner" };
  const panelEl = {
    querySelector(sel) {
      if (sel === ".mode-banner") return existingBanner;
      return null;
    },
  };

  const result = ensureModeBannerDom("admin", panelEl, doc);
  assert.equal(result, existingBanner);
  assert.equal(createdElements.length, 0);
});

// --- ensureConversationCalloutDom ---

test("ensureConversationCalloutDom returns null for user shellPage", () => {
  const panelEl = { querySelector() { return null; } };
  assert.equal(ensureConversationCalloutDom("user", panelEl, null, fakeDoc()), null);
});

test("ensureConversationCalloutDom returns null when panelEl is null", () => {
  assert.equal(ensureConversationCalloutDom("admin", null, null, fakeDoc()), null);
});

test("ensureConversationCalloutDom inserts before timeline when anchored", () => {
  const createdElements = [];
  const doc = fakeDoc(createdElements);
  const timelineEl = { parentElement: null };
  const panelEl = {
    querySelector(sel) {
      if (sel === ".conversation-callout") return null;
      return null;
    },
    insertBefore: null,
    appendChild: null,
  };
  timelineEl.parentElement = panelEl;
  const insertCalls = [];
  panelEl.insertBefore = (el, ref) => { insertCalls.push({ el, ref }); };

  const calloutEl = ensureConversationCalloutDom("unified", panelEl, timelineEl, doc);
  assert.ok(calloutEl);
  assert.equal(calloutEl.className, "conversation-callout");
  assert.equal(insertCalls.length, 1);
  assert.equal(insertCalls[0].el, calloutEl);
  assert.equal(insertCalls[0].ref, timelineEl);
});

test("ensureConversationCalloutDom appends when timeline is not a child of panel", () => {
  const createdElements = [];
  const doc = fakeDoc(createdElements);
  const appendCalls = [];
  const panelEl = {
    querySelector(sel) {
      if (sel === ".conversation-callout") return null;
      return null;
    },
    appendChild(el) { appendCalls.push(el); },
  };

  const calloutEl = ensureConversationCalloutDom("admin", panelEl, null, doc);
  assert.ok(calloutEl);
  assert.equal(appendCalls.length, 1);
  assert.equal(appendCalls[0], calloutEl);
});

test("ensureConversationCalloutDom returns existing callout", () => {
  const existing = { className: "conversation-callout" };
  const panelEl = {
    querySelector(sel) {
      if (sel === ".conversation-callout") return existing;
      return null;
    },
  };

  const result = ensureConversationCalloutDom("unified", panelEl, null, fakeDoc());
  assert.equal(result, existing);
});

// --- helpers ---

function fakeDoc(createdElements = []) {
  return {
    createElement(tag) {
      const el = { tagName: tag.toUpperCase(), className: "", textContent: "" };
      createdElements.push(el);
      return el;
    },
  };
}
