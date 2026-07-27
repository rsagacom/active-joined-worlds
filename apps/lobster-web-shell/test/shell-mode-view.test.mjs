import { test } from "node:test";
import assert from "node:assert/strict";
import {
  shellModeViewState,
  applyShellModeBodyDataset,
  updateShellModeBadge,
  updateShellModeDocumentTitle,
  updateShellModeMasthead,
  renderShellModeGuide,
  toggleShellModeEntryGrid,
  toggleShellModeStatusChrome,
  toggleAdminShellRoleVisibility,
  updateShellEntryCards,
  updatePanelTitles,
  applyShellModeView,
} from "../shell-mode-view.js";

// --- shellModeViewState ---

test("shellModeViewState resolves user mode from body dataset", () => {
  const body = { dataset: { defaultShellMode: "user" } };
  const href = "http://localhost/";
  const vs = shellModeViewState({ body, href });
  assert.equal(vs.shellMode, "user");
  assert.equal(vs.shellPage, "hub");
  assert.equal(vs.compactShell, false);
  assert.equal(vs.config.eyebrow, "龙虾聊天 · 房间聊天");
});

test("shellModeViewState resolves admin mode from body dataset", () => {
  const body = { dataset: { defaultShellMode: "admin" } };
  const href = "http://localhost/";
  const vs = shellModeViewState({ body, href });
  assert.equal(vs.shellMode, "admin");
  assert.equal(vs.shellPage, "hub");
  assert.equal(vs.compactShell, false);
  assert.equal(vs.config.eyebrow, "龙虾聊天 · 管理后台");
});

test("shellModeViewState resolves user mode from URL query param", () => {
  const body = { dataset: {} };
  const href = "http://localhost/?mode=user";
  const vs = shellModeViewState({ body, href });
  assert.equal(vs.shellMode, "user");
});

test("shellModeViewState resolves admin mode from URL query param", () => {
  const body = { dataset: {} };
  const href = "http://localhost/?mode=admin";
  const vs = shellModeViewState({ body, href });
  assert.equal(vs.shellMode, "admin");
});

test("shellModeViewState defaults to unified", () => {
  const body = { dataset: {} };
  const href = "http://localhost/";
  const vs = shellModeViewState({ body, href });
  assert.equal(vs.shellMode, "unified");
  assert.equal(vs.config.title, "城市外世界页");
});

test("shellModeViewState returns compactShell=true for user shellPage", () => {
  const body = { dataset: { shellPage: "user" } };
  const vs = shellModeViewState({ body, href: "http://localhost/?mode=user" });
  assert.equal(vs.compactShell, true);
});

test("shellModeViewState returns compactShell=true for admin shellPage", () => {
  const body = { dataset: { shellPage: "admin" } };
  const vs = shellModeViewState({ body, href: "http://localhost/?mode=admin" });
  assert.equal(vs.compactShell, true);
});

test("shellModeViewState returns compactShell=false for hub shellPage", () => {
  const body = { dataset: { shellPage: "hub" } };
  const vs = shellModeViewState({ body, href: "http://localhost/" });
  assert.equal(vs.compactShell, false);
});

test("shellModeViewState unified config has correct guide items", () => {
  const vs = shellModeViewState({ body: { dataset: {} }, href: "http://localhost/" });
  assert.equal(vs.config.guide.length, 4);
  assert.match(vs.config.guide[0], /接入来源/);
});

test("shellModeViewState user config has correct guide items", () => {
  const vs = shellModeViewState({ body: { dataset: { defaultShellMode: "user" } }, href: "http://localhost/" });
  assert.equal(vs.config.guide.length, 4);
  assert.match(vs.config.guide[0], /左侧先选会话/);
});

test("shellModeViewState admin config has correct guide items", () => {
  const vs = shellModeViewState({ body: { dataset: { defaultShellMode: "admin" } }, href: "http://localhost/" });
  assert.equal(vs.config.guide.length, 4);
  assert.match(vs.config.guide[0], /先看当前会话/);
});

// --- applyShellModeBodyDataset ---

test("applyShellModeBodyDataset sets shellMode and chromeDensity on body", () => {
  const body = { dataset: {} };
  applyShellModeBodyDataset({ shellMode: "user", compactShell: true }, body);
  assert.equal(body.dataset.shellMode, "user");
  assert.equal(body.dataset.chromeDensity, "compact");
});

test("applyShellModeBodyDataset sets chromeDensity=full for non-compact modes", () => {
  const body = { dataset: {} };
  applyShellModeBodyDataset({ shellMode: "unified", compactShell: false }, body);
  assert.equal(body.dataset.shellMode, "unified");
  assert.equal(body.dataset.chromeDensity, "full");
});

// --- updateShellModeBadge ---

test("updateShellModeBadge sets hub badge text", () => {
  const badgeEl = { textContent: "", classList: { toggle() {} } };
  updateShellModeBadge({ shellMode: "unified", shellPage: "hub", compactShell: false }, badgeEl);
  assert.equal(badgeEl.textContent, "入口：聊天入口");
});

test("updateShellModeBadge sets user badge text", () => {
  const badgeEl = { textContent: "", classList: { toggle() {} } };
  updateShellModeBadge({ shellMode: "user", shellPage: "user", compactShell: true }, badgeEl);
  assert.match(badgeEl.textContent, /入口：房间聊天/);
});

test("updateShellModeBadge hides badge in compact mode", () => {
  const toggleCalls = [];
  const badgeEl = {
    textContent: "",
    classList: { toggle(cls, force) { toggleCalls.push([cls, force]); } },
  };
  updateShellModeBadge({ shellMode: "user", shellPage: "user", compactShell: true }, badgeEl);
  assert.deepEqual(toggleCalls, [["shell-hidden", true]]);
});

test("updateShellModeBadge shows badge in full mode", () => {
  const toggleCalls = [];
  const badgeEl = {
    textContent: "",
    classList: { toggle(cls, force) { toggleCalls.push([cls, force]); } },
  };
  updateShellModeBadge({ shellMode: "unified", shellPage: "hub", compactShell: false }, badgeEl);
  assert.deepEqual(toggleCalls, [["shell-hidden", false]]);
});

test("updateShellModeBadge is a no-op when badgeEl is null", () => {
  assert.doesNotThrow(() => updateShellModeBadge({ shellMode: "user", shellPage: "user", compactShell: false }, null));
});

// --- updateShellModeDocumentTitle ---

test("updateShellModeDocumentTitle sets page title for user mode", () => {
  const doc = { title: "" };
  updateShellModeDocumentTitle({ shellMode: "user", shellPage: "user" }, doc);
  assert.match(doc.title, /龙虾聊天 · 房间聊天/);
});

test("updateShellModeDocumentTitle sets page title for admin mode", () => {
  const doc = { title: "" };
  updateShellModeDocumentTitle({ shellMode: "admin", shellPage: "admin" }, doc);
  assert.match(doc.title, /龙虾聊天 · 管理后台/);
});

test("updateShellModeDocumentTitle sets page title for unified mode on non-hub page", () => {
  const doc = { title: "" };
  // shellPage must NOT be "hub" or "world-entry" for title to be set
  updateShellModeDocumentTitle({ shellMode: "unified", shellPage: "unified" }, doc);
  assert.match(doc.title, /龙虾聊天 · 城市外世界页/);
});

test("updateShellModeDocumentTitle skips title update on hub page", () => {
  const doc = { title: "original" };
  updateShellModeDocumentTitle({ shellMode: "unified", shellPage: "hub" }, doc);
  assert.equal(doc.title, "original");
});

test("updateShellModeDocumentTitle skips title update on world-entry page", () => {
  const doc = { title: "original" };
  updateShellModeDocumentTitle({ shellMode: "unified", shellPage: "world-entry" }, doc);
  assert.equal(doc.title, "original");
});

// --- updateShellModeMasthead ---

test("updateShellModeMasthead sets hub masthead text", () => {
  const eyebrowEl = { textContent: "" };
  const titleEl = { textContent: "" };
  const heroEl = { textContent: "" };
  updateShellModeMasthead(
    { shellMode: "unified", shellPage: "hub", config: { eyebrow: "test eyebrow", title: "test title", hero: "test hero" } },
    { eyebrowEl, titleEl, heroEl },
  );
  assert.equal(eyebrowEl.textContent, "龙虾聊天");
  assert.equal(titleEl.textContent, "选一个房间开始");
  assert.equal(heroEl.textContent, "test hero");
});

test("updateShellModeMasthead sets non-hub masthead from config", () => {
  const eyebrowEl = { textContent: "" };
  const titleEl = { textContent: "" };
  const heroEl = { textContent: "" };
  updateShellModeMasthead(
    { shellMode: "user", shellPage: "user", config: { eyebrow: "虾聊·房", title: "房间主界面", hero: "左边会话右边聊天" } },
    { eyebrowEl, titleEl, heroEl },
  );
  assert.equal(eyebrowEl.textContent, "虾聊·房");
  assert.equal(titleEl.textContent, "房间主界面");
  assert.equal(heroEl.textContent, "左边会话右边聊天");
});

test("updateShellModeMasthead skips missing dom refs", () => {
  assert.doesNotThrow(() =>
    updateShellModeMasthead(
      { shellMode: "user", shellPage: "user", config: { eyebrow: "x", title: "y", hero: "z" } },
      { eyebrowEl: null, titleEl: null, heroEl: null },
    ),
  );
});

// --- renderShellModeGuide ---

test("renderShellModeGuide renders guide items into a target element", () => {
  const children = [];
  const guideEl = {
    innerHTML: "",
    appendChild(child) { children.push(child); },
  };
  const config = { guide: ["第一步", "第二步", "第三步"] };
  renderShellModeGuide(config, guideEl);
  assert.equal(children.length, 3);
  assert.equal(children[0].className, "guide-item");
  assert.equal(children[0].textContent, "第一步");
  assert.equal(children[1].textContent, "第二步");
  assert.equal(children[2].textContent, "第三步");
});

test("renderShellModeGuide clears previous children with replaceChildren", () => {
  let replaceChildrenCalls = 0;
  const guideEl = {
    appendChild() {},
    replaceChildren() {
      replaceChildrenCalls += 1;
    },
  };
  Object.defineProperty(guideEl, "innerHTML", {
    get() {
      return "";
    },
    set() {
      throw new Error("renderShellModeGuide must not assign innerHTML");
    },
  });
  renderShellModeGuide({ guide: ["only"] }, guideEl);
  assert.equal(replaceChildrenCalls, 1);
});

test("renderShellModeGuide is a no-op when guideEl is null", () => {
  assert.doesNotThrow(() => renderShellModeGuide({ guide: ["test"] }, null));
});

// --- toggleShellModeEntryGrid ---

test("toggleShellModeEntryGrid hides entry grid on user page", () => {
  const calls = [];
  const entryGridEl = { classList: { toggle(cls, force) { calls.push([cls, force]); } } };
  toggleShellModeEntryGrid("user", entryGridEl);
  assert.deepEqual(calls, [["shell-hidden", true]]);
});

test("toggleShellModeEntryGrid hides entry grid on admin page", () => {
  const calls = [];
  const entryGridEl = { classList: { toggle(cls, force) { calls.push([cls, force]); } } };
  toggleShellModeEntryGrid("admin", entryGridEl);
  assert.deepEqual(calls, [["shell-hidden", true]]);
});

test("toggleShellModeEntryGrid shows entry grid on hub page", () => {
  const calls = [];
  const entryGridEl = { classList: { toggle(cls, force) { calls.push([cls, force]); } } };
  toggleShellModeEntryGrid("hub", entryGridEl);
  assert.deepEqual(calls, [["shell-hidden", false]]);
});

test("toggleShellModeEntryGrid is a no-op when entryGridEl is null", () => {
  assert.doesNotThrow(() => toggleShellModeEntryGrid("hub", null));
});

// --- toggleShellModeStatusChrome ---

test("toggleShellModeStatusChrome hides status chrome in compact mode", () => {
  const calls = {};
  const mkEl = (name) => ({ classList: { toggle(cls, force) { calls[name] = [cls, force]; } } });
  const els = { transportEl: mkEl("transport"), storageEl: mkEl("storage"), gatewayEl: mkEl("gateway"), providerEl: mkEl("provider"), worldEl: mkEl("world") };
  toggleShellModeStatusChrome(true, els);
  for (const name of ["transport", "storage", "gateway", "provider", "world"]) {
    assert.deepEqual(calls[name], ["shell-hidden", true], `status chrome ${name} should be hidden`);
  }
});

test("toggleShellModeStatusChrome shows status chrome in full mode", () => {
  const calls = {};
  const mkEl = (name) => ({ classList: { toggle(cls, force) { calls[name] = [cls, force]; } } });
  const els = { transportEl: mkEl("transport"), storageEl: mkEl("storage"), gatewayEl: mkEl("gateway"), providerEl: mkEl("provider"), worldEl: mkEl("world") };
  toggleShellModeStatusChrome(false, els);
  for (const name of ["transport", "storage", "gateway", "provider", "world"]) {
    assert.deepEqual(calls[name], ["shell-hidden", false], `status chrome ${name} should be shown`);
  }
});

test("toggleShellModeStatusChrome skips null elements gracefully", () => {
  assert.doesNotThrow(() => toggleShellModeStatusChrome(true, {}));
});

// --- toggleAdminShellRoleVisibility ---

test("toggleAdminShellRoleVisibility hides admin elements using querySelectorAll", () => {
  const adminEl = { classList: { toggle() {} } };
  const calls = [];
  adminEl.classList.toggle = (cls, force) => { calls.push([cls, force]); };
  const root = { querySelectorAll(selector) {
    assert.equal(selector, "[data-shell-role='admin']");
    return [adminEl];
  }};
  toggleAdminShellRoleVisibility(true, root);
  assert.deepEqual(calls, [["shell-hidden", true]]);
});

test("toggleAdminShellRoleVisibility shows admin elements when not user mode", () => {
  const adminEl = { classList: { toggle() {} } };
  const calls = [];
  adminEl.classList.toggle = (cls, force) => { calls.push([cls, force]); };
  const root = { querySelectorAll() { return [adminEl]; } };
  toggleAdminShellRoleVisibility(false, root);
  assert.deepEqual(calls, [["shell-hidden", false]]);
});

// --- updateShellEntryCards ---

test("updateShellEntryCards marks active card by mode", () => {
  const cards = [];
  for (const mode of ["unified", "user", "admin"]) {
    const toggleLog = [];
    const card = {
      dataset: { shellEntry: mode },
      _ariaCurrent: null,
      classList: { toggle(cls, force) { toggleLog.push({ cls, force }); } },
      setAttribute(name, value) { if (name === "aria-current") this._ariaCurrent = value; },
      removeAttribute(name) { if (name === "aria-current") this._ariaCurrent = undefined; },
    };
    card._toggleLog = toggleLog;
    cards.push(card);
  }
  updateShellEntryCards("user", cards);
  // user card should be active
  assert.ok(cards[1]._toggleLog.some(c => c.cls === "active" && c.force === true));
  assert.equal(cards[1]._ariaCurrent, "page");
  // unified and admin cards should be inactive
  assert.ok(cards[0]._toggleLog.some(c => c.cls === "active" && c.force === false));
  assert.equal(cards[0]._ariaCurrent, undefined);
  assert.ok(cards[2]._toggleLog.some(c => c.cls === "active" && c.force === false));
  assert.equal(cards[2]._ariaCurrent, undefined);
});

// --- updatePanelTitles ---

test("updatePanelTitles uses user mode labels", () => {
  const els = {
    governanceEl: { textContent: "" },
    authEl: { textContent: "" },
    roomsEl: { textContent: "" },
    conversationEl: { textContent: "" },
  };
  updatePanelTitles("user", els);
  assert.equal(els.governanceEl.textContent, "边缘抽屉");
  assert.equal(els.authEl.textContent, "登录");
  assert.equal(els.roomsEl.textContent, "房间列表");
  assert.equal(els.conversationEl.textContent, "消息流");
});

test("updatePanelTitles uses admin mode labels", () => {
  const els = {
    governanceEl: { textContent: "" },
    authEl: { textContent: "" },
    roomsEl: { textContent: "" },
    conversationEl: { textContent: "" },
  };
  updatePanelTitles("admin", els);
  assert.equal(els.governanceEl.textContent, "更多");
  assert.equal(els.authEl.textContent, "身份");
  assert.equal(els.roomsEl.textContent, "会话");
  assert.equal(els.conversationEl.textContent, "消息");
});

test("updatePanelTitles uses unified mode labels", () => {
  const els = {
    governanceEl: { textContent: "" },
    authEl: { textContent: "" },
    roomsEl: { textContent: "" },
    conversationEl: { textContent: "" },
  };
  updatePanelTitles("unified", els);
  assert.equal(els.governanceEl.textContent, "更多");
  assert.equal(els.authEl.textContent, "登录");
  assert.equal(els.roomsEl.textContent, "会话");
  assert.equal(els.conversationEl.textContent, "消息");
});

test("updatePanelTitles skips null elements gracefully", () => {
  assert.doesNotThrow(() => updatePanelTitles("user", {}));
});

// --- applyShellModeView orchestrator ---

test("applyShellModeView orchestrates all sub-applicators", () => {
  // shellPage must NOT be "hub" for title to be set in orchestrator
  const viewState = shellModeViewState({ body: { dataset: { shellPage: "user" } }, href: "http://localhost/?mode=user" });
  const badgeEl = { textContent: "", classList: { toggle() {} } };
  const doc = { title: "" };
  const eyebrowEl = { textContent: "" };
  const titleEl = { textContent: "" };
  const heroEl = { textContent: "" };
  const guideEl = { innerHTML: "", appendChild() {} };
  const entryGridEl = { classList: { toggle() {} } };
  const statusEls = {
    transportEl: { classList: { toggle() {} } },
    storageEl: { classList: { toggle() {} } },
    gatewayEl: { classList: { toggle() {} } },
    providerEl: { classList: { toggle() {} } },
    worldEl: { classList: { toggle() {} } },
  };
  const entryCards = [];
  const panelTitleEls = {
    governanceEl: { textContent: "" },
    authEl: { textContent: "" },
    roomsEl: { textContent: "" },
    conversationEl: { textContent: "" },
  };

  const body = { dataset: {} };

  assert.doesNotThrow(() =>
    applyShellModeView(viewState, {
      body, badgeEl, doc, eyebrowEl, titleEl, heroEl, guideEl,
      entryGridEl, statusEls, entryCards, panelTitleEls,
    }),
  );

  assert.equal(body.dataset.shellMode, "user");
  assert.equal(body.dataset.chromeDensity, "compact");
  assert.match(doc.title, /龙虾聊天/);
  assert.equal(panelTitleEls.roomsEl.textContent, "房间列表");
});
