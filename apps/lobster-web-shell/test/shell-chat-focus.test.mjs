import test from "node:test";
import assert from "node:assert/strict";

let focusModule = null;
try {
  focusModule = await import("../shell-chat-focus.js");
} catch {
  focusModule = null;
}

function createClassList() {
  const values = new Set();
  return {
    add: (...tokens) => tokens.forEach((token) => values.add(token)),
    remove: (...tokens) => tokens.forEach((token) => values.delete(token)),
    contains: (token) => values.has(token),
  };
}

function createElement() {
  const listeners = new Map();
  const attributes = new Map();
  return {
    classList: createClassList(),
    className: "",
    dataset: {},
    isConnected: false,
    style: {},
    textContent: "",
    addEventListener(type, listener) { listeners.set(type, listener); },
    click() { listeners.get("click")?.({ type: "click" }); },
    getAttribute(name) { return attributes.get(name) ?? null; },
    setAttribute(name, value) { attributes.set(name, String(value)); },
  };
}

function createHarness({ storedPreference = false, workspace = "chat" } = {}) {
  const body = createElement();
  const layoutEl = createElement();
  const titleEl = createElement();
  const panelEl = createElement();
  const inserted = [];
  let currentWorkspace = workspace;
  titleEl.insertAdjacentElement = (_position, element) => {
    element.isConnected = true;
    inserted.push(element);
  };
  panelEl.querySelector = (selector) => selector === ".panel-title" ? titleEl : null;
  panelEl.prepend = (element) => {
    element.isConnected = true;
    inserted.push(element);
  };
  const persisted = [];
  const applied = [];
  const controller = focusModule?.createChatFocusController?.({
    doc: { body, createElement },
    layoutEl,
    conversationPanelEl: panelEl,
    getAnchor: () => null,
    getWorkspace: () => currentWorkspace,
    loadPreference: () => storedPreference,
    persistPreference: (value) => persisted.push(value),
    onStateApplied: (active) => applied.push(active),
  });
  return {
    applied,
    body,
    controller,
    inserted,
    layoutEl,
    persisted,
    setWorkspace(value) { currentWorkspace = value; },
  };
}

test("chat focus controller initializes from the stored preference", () => {
  assert.equal(typeof focusModule?.createChatFocusController, "function");
  const harness = createHarness({ storedPreference: true });

  harness.controller.initialize();

  assert.equal(harness.controller.isActive(), true);
  assert.equal(harness.body.dataset.chatFocus, "true");
  assert.equal(harness.layoutEl.classList.contains("layout-chat-focus"), true);
  assert.deepEqual(harness.applied, [true]);
  assert.deepEqual(harness.persisted, []);
});

test("chat focus toggle owns its DOM, text and persisted user choice", () => {
  const harness = createHarness();
  harness.controller.initialize();

  const button = harness.controller.ensureToggle();
  assert.equal(harness.inserted.length, 1);
  assert.equal(button.textContent, "专注聊天");
  assert.equal(button.getAttribute("aria-pressed"), "false");
  assert.equal(button.style.display, "inline-flex");

  button.click();
  assert.equal(harness.controller.isActive(), true);
  assert.equal(button.textContent, "退出专注");
  assert.equal(button.getAttribute("aria-pressed"), "true");
  assert.deepEqual(harness.persisted, [true]);
});

test("workspace sync suspends focus without erasing the preferred mode", () => {
  const harness = createHarness({ storedPreference: true });
  harness.controller.initialize();
  const button = harness.controller.ensureToggle();

  harness.setWorkspace("world");
  harness.controller.syncWithWorkspace();
  assert.equal(harness.controller.isActive(), false);
  assert.equal(button.style.display, "none");
  assert.deepEqual(harness.persisted, []);

  harness.setWorkspace("chat");
  harness.controller.syncWithWorkspace();
  assert.equal(harness.controller.isActive(), true);
  assert.equal(button.style.display, "inline-flex");
  assert.deepEqual(harness.persisted, []);
});

test("chat focus controllers keep instance state isolated", () => {
  const first = createHarness({ storedPreference: true });
  const second = createHarness({ storedPreference: false });

  first.controller.initialize();
  second.controller.initialize();
  second.controller.toggle();

  assert.equal(first.controller.isActive(), true);
  assert.equal(second.controller.isActive(), true);
  second.controller.toggle();
  assert.equal(first.controller.isActive(), true);
  assert.equal(second.controller.isActive(), false);
});
