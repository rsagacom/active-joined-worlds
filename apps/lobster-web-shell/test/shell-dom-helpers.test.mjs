import test from "node:test";
import assert from "node:assert/strict";
import {
  createChatDetailCardMetaRow,
  createDetailRow,
  createDetailSection,
  createLine,
  createMetaChip,
  createOverviewMetric,
  createPill,
  createStageChip,
  setDatasetFlag,
  setInlineStyle,
} from "../shell-dom-helpers.js";

const serial = { concurrency: false };

// Provide minimal DOM globals for pure DOM helpers
class FakeClassList {
  constructor(owner) {
    this.owner = owner;
    this.tokens = new Set();
  }
  add(...tokens) {
    for (const t of tokens) this.tokens.add(t);
    this.owner._className = Array.from(this.tokens).join(" ");
  }
  remove(...tokens) {
    for (const t of tokens) this.tokens.delete(t);
    this.owner._className = Array.from(this.tokens).join(" ");
  }
  contains(token) {
    return this.tokens.has(token);
  }
}

class FakeElement {
  constructor(tagName) {
    this.tagName = String(tagName).toUpperCase();
    this.children = [];
    this._textContent = "";
    this._className = "";
    this._attributes = new Map();
    this.classList = new FakeClassList(this);
    this.dataset = new Proxy(
      {},
      {
        get: (_, key) => this._attributes.get(`data-${String(key).replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`) ?? undefined,
        set: (_, key, value) => {
          this._attributes.set(`data-${String(key).replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`, String(value));
          return true;
        },
        deleteProperty: (_, key) => {
          this._attributes.delete(`data-${String(key).replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}`);
          return true;
        },
      }
    );
    this.style = {};
  }

  get className() {
    return this._className;
  }
  set className(value) {
    this._className = String(value);
    this.classList.tokens = new Set(String(value).split(/\s+/).filter(Boolean));
  }

  get textContent() {
    const childText = this.children.map((c) => c.textContent).join("");
    return `${this._textContent}${childText}`;
  }
  set textContent(value) {
    this._textContent = String(value ?? "");
    this.children = [];
  }

  appendChild(child) {
    if (child.parentNode) child.parentNode.removeChild(child);
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }
}

class FakeTextNode extends FakeElement {
  constructor(text) {
    super("#text");
    this._textContent = String(text ?? "");
  }
  appendChild() {
    throw new Error("text nodes do not support children");
  }
}

class FakeDocument {
  createElement(tagName) {
    return new FakeElement(tagName);
  }
  createTextNode(text) {
    return new FakeTextNode(text);
  }
}

globalThis.document = new FakeDocument();
globalThis.Element = FakeElement;

// ====== setDatasetFlag ======

test("setDatasetFlag: sets string value", serial, () => {
  const el = document.createElement("div");
  setDatasetFlag(el, "tone", "warm");
  assert.equal(el.dataset.tone, "warm");
});

test("setDatasetFlag: deletes on null", serial, () => {
  const el = document.createElement("div");
  el.dataset.tone = "warm";
  setDatasetFlag(el, "tone", null);
  assert.equal(el.dataset.tone, undefined);
});

test("setDatasetFlag: deletes on empty string", serial, () => {
  const el = document.createElement("div");
  el.dataset.tone = "warm";
  setDatasetFlag(el, "tone", "");
  assert.equal(el.dataset.tone, undefined);
});

test("setDatasetFlag: noop on missing node", serial, () => {
  assert.doesNotThrow(() => setDatasetFlag(null, "tone", "warm"));
});

// ====== setInlineStyle ======

test("setInlineStyle: sets property", serial, () => {
  const el = document.createElement("div");
  el.style.setProperty = (prop, val, important) => {
    el.style._prop = prop;
    el.style._val = val;
    el.style._important = important;
  };
  setInlineStyle(el, "display", "flex", true);
  assert.equal(el.style._prop, "display");
  assert.equal(el.style._val, "flex");
  assert.equal(el.style._important, "important");
});

test("setInlineStyle: falls back to camelCase", serial, () => {
  const el = document.createElement("div");
  setInlineStyle(el, "flex-direction", "column");
  assert.equal(el.style.flexDirection, "column");
});

test("setInlineStyle: noop on missing node", serial, () => {
  assert.doesNotThrow(() => setInlineStyle(null, "display", "flex"));
});

// ====== createLine ======

test("createLine: creates div with class and text", serial, () => {
  const el = createLine("test-line", "hello");
  assert.equal(el.tagName, "DIV");
  assert.equal(el.className, "test-line");
  assert.equal(el.textContent, "hello");
});

// ====== createPill ======

test("createPill: creates span with pill class and tone", serial, () => {
  const el = createPill("label", "accent");
  assert.equal(el.tagName, "SPAN");
  assert.equal(el.className, "pill pill-accent");
  assert.equal(el.textContent, "label");
});

test("createPill: defaults to muted tone", serial, () => {
  const el = createPill("label");
  assert.equal(el.className, "pill pill-muted");
});

// ====== createStageChip ======

test("createStageChip: creates div with stage-chip class", serial, () => {
  const el = createStageChip("stage", "warm");
  assert.equal(el.tagName, "DIV");
  assert.equal(el.className, "stage-chip");
  assert.equal(el.dataset.tone, "warm");
  assert.equal(el.textContent, "stage");
});

// ====== createMetaChip ======

test("createMetaChip: creates span with meta-chip class", serial, () => {
  const el = createMetaChip("meta", "accent");
  assert.equal(el.tagName, "SPAN");
  assert.equal(el.className, "meta-chip meta-chip-accent");
  assert.equal(el.textContent, "meta");
});

// ====== createOverviewMetric ======

test("createOverviewMetric: creates card with label and value", serial, () => {
  const el = createOverviewMetric("居民", "42", "在线", "warm");
  assert.equal(el.tagName, "DIV");
  assert.equal(el.className, "overview-metric");
  assert.equal(el.dataset.tone, "warm");
  assert.equal(el.children.length, 3);
  assert.ok(el.textContent.includes("居民"));
  assert.ok(el.textContent.includes("42"));
  assert.ok(el.textContent.includes("在线"));
});

test("createOverviewMetric: omits copy when empty", serial, () => {
  const el = createOverviewMetric("居民", "42", "", "warm");
  assert.equal(el.children.length, 2);
});

// ====== createDetailSection ======

test("createDetailSection: creates section with title", serial, () => {
  const el = createDetailSection("标题", "说明");
  assert.equal(el.tagName, "SECTION");
  assert.equal(el.className, "chat-detail-section");
  assert.ok(el.textContent.includes("标题"));
  assert.ok(el.textContent.includes("说明"));
});

test("createDetailSection: omits copy when empty", serial, () => {
  const el = createDetailSection("标题");
  const texts = el.children.map((c) => c.textContent);
  assert.ok(!texts.includes("说明"));
});

// ====== createDetailRow ======

test("createDetailRow: creates row with label and text value", serial, () => {
  const el = createDetailRow("标签", "值");
  assert.equal(el.tagName, "DIV");
  assert.equal(el.className, "chat-detail-row");
  assert.ok(el.textContent.includes("标签"));
  assert.ok(el.textContent.includes("值"));
});

test("createDetailRow: wraps Element value in rich class", serial, () => {
  const inner = document.createElement("span");
  inner.textContent = "rich";
  const el = createDetailRow("标签", inner);
  const valueEl = el.children.find((c) => c.className?.includes("chat-detail-value"));
  assert.ok(valueEl);
  assert.ok(valueEl.className.includes("chat-detail-value-rich"));
  assert.ok(valueEl.children.includes(inner));
});

// ====== createChatDetailCardMetaRow ======

test("createChatDetailCardMetaRow: creates row with label and value", serial, () => {
  const el = createChatDetailCardMetaRow("状态", "在线");
  assert.equal(el.tagName, "DIV");
  assert.equal(el.className, "chat-detail-card-meta-row");
  assert.ok(el.textContent.includes("状态"));
  assert.ok(el.textContent.includes("在线"));
});
