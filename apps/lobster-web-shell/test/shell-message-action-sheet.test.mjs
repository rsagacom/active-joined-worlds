import test from "node:test";
import assert from "node:assert/strict";
import { createMessageActionSheet } from "../shell-message-action-sheet.js";

function createFakeElement(tagName) {
  const el = {
    tagName: tagName.toUpperCase(),
    className: "",
    textContent: "",
    hidden: false,
    children: [],
    dataset: {},
    listeners: new Map(),
    get firstChild() {
      return this.children[0] || null;
    },
    appendChild(child) {
      this.children.push(child);
      return child;
    },
    removeChild(child) {
      const index = this.children.indexOf(child);
      if (index >= 0) this.children.splice(index, 1);
      return child;
    },
    setAttribute(name, value) {
      this[`attr:${name}`] = String(value);
    },
    addEventListener(type, handler) {
      this.listeners.set(type, handler);
    },
    click() {
      this.listeners.get("click")?.({ target: this });
    },
    querySelector(selector) {
      return this.querySelectorAll(selector)[0] || null;
    },
    querySelectorAll(selector) {
      const cls = selector.startsWith(".") ? selector.slice(1) : null;
      const out = [];
      const walk = (node) => {
        for (const child of node.children) {
          if (cls && String(child.className).split(" ").includes(cls)) out.push(child);
          walk(child);
        }
      };
      walk(this);
      return out;
    },
  };
  return el;
}

function sheetHarness() {
  const doc = { createElement: createFakeElement };
  const sheet = createMessageActionSheet({ document: doc });
  return { sheet };
}

test("action sheet opens with specs and closes on action", () => {
  const { sheet } = sheetHarness();
  const actions = [];
  const opened = sheet.open({
    specs: [
      { action: "edit", label: "编辑" },
      { action: "recall", label: "撤回", danger: true },
    ],
    quoteText: "一条消息",
    onAction: (action) => actions.push(action),
  });
  assert.equal(opened, true);
  assert.equal(sheet.isOpen(), true);
  const mask = sheet.element;
  assert.equal(mask.querySelector(".message-action-sheet-quote").textContent, "一条消息");
  const items = mask.querySelectorAll(".message-action-sheet-item");
  assert.equal(items.length, 2);
  assert.equal(items[1].className.includes("danger"), true);

  items[0].click();
  assert.deepEqual(actions, ["edit"]);
  assert.equal(sheet.isOpen(), false, "action 后自动关闭");
});

test("action sheet rejects empty specs and closes via cancel/mask", () => {
  const { sheet } = sheetHarness();
  assert.equal(sheet.open({ specs: [] }), false);
  assert.equal(sheet.isOpen(), false);

  sheet.open({ specs: [{ action: "edit", label: "编辑" }] });
  assert.equal(sheet.isOpen(), true);
  sheet.element.querySelector(".message-action-sheet-cancel").click();
  assert.equal(sheet.isOpen(), false);

  sheet.open({ specs: [{ action: "edit", label: "编辑" }] });
  sheet.element.click(); // 点遮罩空白关闭
  assert.equal(sheet.isOpen(), false);
});

test("action sheet quote hidden when empty and danger styling only for danger specs", () => {
  const { sheet } = sheetHarness();
  sheet.open({
    specs: [
      { action: "edit", label: "编辑" },
      { action: "recall", label: "撤回", danger: true },
    ],
  });
  assert.equal(sheet.element.querySelector(".message-action-sheet-quote").hidden, true);
  const items = sheet.element.querySelectorAll(".message-action-sheet-item");
  assert.equal(items[0].className.includes("danger"), false);
  assert.equal(items[1].className.includes("danger"), true);
});
