import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createRoomStageSideElement,
  createRoomStageCanvasChrome,
  createChatDetailPanelChrome,
} from "../shell-scene-chrome.js";
import * as sceneChromeModule from "../shell-scene-chrome.js";

// --- fake doc ---

function fakeDoc() {
  const created = [];
  return {
    created,
    createElement(tag) {
      const el = {
        tagName: tag.toUpperCase(),
        className: "",
        id: "",
        textContent: "",
        _style: {},
        _attributes: {},
        _children: [],
        setAttribute(name, value) { this._attributes[name] = value; },
        appendChild(child) { this._children.push(child); },
        append(...children) { this._children.push(...children); },
      };
      created.push(el);
      return el;
    },
  };
}

// --- createRoomStageSideElement ---

test("createRoomStageSideElement returns a div with correct class", () => {
  const doc = fakeDoc();
  const side = createRoomStageSideElement(doc);
  assert.equal(side.tagName, "DIV");
  assert.equal(side.className, "conversation-stage-side");
});

test("createRoomStageSideElement sets aria-label", () => {
  const doc = fakeDoc();
  const side = createRoomStageSideElement(doc);
  assert.equal(side._attributes["aria-label"], "房间角色资料");
});

// --- createRoomStageCanvasChrome ---

test("createRoomStageCanvasChrome returns wrap and canvas with correct ids", () => {
  const doc = fakeDoc();
  const { wrap, canvas } = createRoomStageCanvasChrome("test-canvas", "测试画布", doc);
  assert.equal(wrap.tagName, "DIV");
  assert.equal(wrap.className, "conversation-stage-canvas-wrap");
  assert.equal(canvas.tagName, "CANVAS");
  assert.equal(canvas.id, "test-canvas");
  assert.equal(canvas.className, "conversation-stage-canvas");
  assert.equal(canvas._attributes["aria-label"], "测试画布");
});

test("createRoomStageCanvasChrome appends canvas to wrap", () => {
  const doc = fakeDoc();
  const { wrap, canvas } = createRoomStageCanvasChrome("c", "label", doc);
  assert.equal(wrap._children.length, 1);
  assert.equal(wrap._children[0], canvas);
});

// --- createChatDetailPanelChrome ---

test("createChatDetailPanelChrome returns panel section with correct class", () => {
  const doc = fakeDoc();
  const { panel, contentEl } = createChatDetailPanelChrome(doc);
  assert.equal(panel.tagName, "SECTION");
  assert.equal(panel.className, "panel chat-detail");
});

test("createChatDetailPanelChrome creates title element", () => {
  const doc = fakeDoc();
  const { panel } = createChatDetailPanelChrome(doc);
  const title = panel._children[0];
  assert.equal(title.tagName, "DIV");
  assert.equal(title.className, "panel-title");
  assert.equal(title.textContent, "房间资料");
});

test("createChatDetailPanelChrome creates content element with correct id", () => {
  const doc = fakeDoc();
  const { contentEl } = createChatDetailPanelChrome(doc);
  assert.equal(contentEl.id, "chat-detail-content");
  assert.equal(contentEl.className, "chat-detail-content");
});

test("createChatDetailPanelChrome appends title and content to panel", () => {
  const doc = fakeDoc();
  const { panel, contentEl } = createChatDetailPanelChrome(doc);
  assert.equal(panel._children.length, 2);
  assert.equal(panel._children[1], contentEl);
});

test("renderRoomStagePortraitChrome replaces stale portrait chrome and preserves canvas", () => {
  assert.equal(typeof sceneChromeModule.renderRoomStagePortraitChrome, "function");

  const doc = fakeDoc();
  const canvasWrap = { parentNode: null };
  const stale = { removed: false, remove() { this.removed = true; } };
  const sideEl = {
    children: [stale],
    appended: [],
    prepend(node) {
      node.parentNode = this;
      this.children.unshift(node);
    },
    appendChild(node) {
      this.appended.push(node);
    },
  };
  const portraitCalls = [];
  const createChip = (text, tone) => ({ text, tone });

  const rendered = sceneChromeModule.renderRoomStagePortraitChrome(
    {
      sideEl,
      canvasWrapEl: canvasWrap,
      canvasEl: { id: "portrait-canvas" },
      portrait: { summary: "灰狗 · 房间管家" },
      chips: [{ text: "在岗", tone: "muted" }],
    },
    {
      doc,
      createChip,
      renderPortrait: (canvas, portrait) => portraitCalls.push([canvas.id, portrait.summary]),
    },
  );

  assert.equal(rendered, true);
  assert.equal(stale.removed, true);
  assert.equal(canvasWrap.parentNode, sideEl);
  assert.deepEqual(portraitCalls, [["portrait-canvas", "灰狗 · 房间管家"]]);
  assert.equal(sideEl.appended[0].text, "角色资料");
  assert.equal(sideEl.appended[0].tone, "accent");
  assert.equal(sideEl.appended[1].className, "stage-chip");
  assert.equal(sideEl.appended[1].textContent, "灰狗 · 房间管家");
  assert.deepEqual(sideEl.appended[2], { text: "在岗", tone: "muted" });
});
