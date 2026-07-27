import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createCaretakerPanelTitleNode,
  createCaretakerPanelHeaderNode,
  createCaretakerPanelSummaryNode,
  createCaretakerMessageNode,
  createCaretakerMessagesNode,
  createCaretakerRulesNode,
  renderCaretakerPanelBody,
} from "../shell-caretaker-dom.js";

// --- fake doc ---

function fakeDoc() {
  return {
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(),
        className: "",
        textContent: "",
        _children: [],
        appendChild(child) { this._children.push(child); },
      };
    },
  };
}

// --- fixtures ---

function sampleModel() {
  return {
    title: "看护者面板",
    profile: {
      displayName: "龙虾守卫",
      status: "在线",
      highlight: "🔰",
      summary: "维护城邦秩序",
    },
    rulesTitle: "房间规则",
    rules: ["友善交流", "禁止广告"],
    messages: [
      { title: "欢迎", time: "12:00", detail: "欢迎来到龙虾聊天" },
    ],
  };
}

// --- createCaretakerPanelTitleNode ---

test("createCaretakerPanelTitleNode uses model title", () => {
  const node = createCaretakerPanelTitleNode(sampleModel(), fakeDoc());
  assert.equal(node.className, "panel-title");
  assert.equal(node.textContent, "看护者面板");
});

// --- createCaretakerPanelHeaderNode ---

test("createCaretakerPanelHeaderNode creates name and status", () => {
  const header = createCaretakerPanelHeaderNode(sampleModel(), fakeDoc());
  assert.equal(header.className, "caretaker-header");
  assert.equal(header._children.length, 2);
  const headerNames = header._children[0];
  const name = headerNames._children[0];
  const status = headerNames._children[1];
  assert.equal(name.textContent, "龙虾守卫");
  assert.equal(status.className, "caretaker-status");
  assert.equal(status.textContent, "在线");
});

test("createCaretakerPanelHeaderNode creates badge", () => {
  const header = createCaretakerPanelHeaderNode(sampleModel(), fakeDoc());
  const badge = header._children[1];
  assert.equal(badge.className, "caretaker-badge");
  assert.equal(badge.textContent, "🔰");
});

// --- createCaretakerPanelSummaryNode ---

test("createCaretakerPanelSummaryNode uses profile summary", () => {
  const summary = createCaretakerPanelSummaryNode(sampleModel(), fakeDoc());
  assert.equal(summary.tagName, "P");
  assert.equal(summary.className, "caretaker-summary");
  assert.equal(summary.textContent, "维护城邦秩序");
});

// --- createCaretakerMessageNode ---

test("createCaretakerMessageNode creates title with time", () => {
  const msg = createCaretakerMessageNode(
    { title: "欢迎", time: "12:00", detail: "欢迎来到龙虾聊天" },
    fakeDoc(),
  );
  assert.equal(msg.className, "caretaker-message");
  const msgTitle = msg._children[0];
  assert.equal(msgTitle.className, "caretaker-message-title");
  const titleSpan = msgTitle._children[0];
  assert.equal(titleSpan.textContent, "欢迎");
  const timeSpan = msgTitle._children[1];
  assert.equal(timeSpan.className, "caretaker-message-time");
  assert.equal(timeSpan.textContent, "12:00");
  const detail = msg._children[1];
  assert.equal(detail.tagName, "P");
  assert.equal(detail.textContent, "欢迎来到龙虾聊天");
});

// --- createCaretakerMessagesNode ---

test("createCaretakerMessagesNode renders all messages", () => {
  const model = {
    messages: [
      { title: "A", time: "1", detail: "d1" },
      { title: "B", time: "2", detail: "d2" },
    ],
  };
  const messages = createCaretakerMessagesNode(model, fakeDoc());
  assert.equal(messages.className, "caretaker-messages");
  assert.equal(messages._children.length, 2);
  assert.equal(messages._children[0]._children[0]._children[0].textContent, "A");
  assert.equal(messages._children[1]._children[0]._children[0].textContent, "B");
});

// --- createCaretakerRulesNode ---

test("createCaretakerRulesNode creates rules title and list", () => {
  const model = { rulesTitle: "房间规则", rules: ["友善交流", "禁止广告"] };
  const rules = createCaretakerRulesNode(model, fakeDoc());
  assert.equal(rules.className, "caretaker-rules");
  const rulesTitle = rules._children[0];
  assert.equal(rulesTitle.className, "caretaker-rules-title");
  assert.equal(rulesTitle.textContent, "房间规则");
  const ruleList = rules._children[1];
  assert.equal(ruleList.tagName, "UL");
  assert.equal(ruleList._children.length, 2);
  assert.equal(ruleList._children[0].textContent, "友善交流");
  assert.equal(ruleList._children[1].textContent, "禁止广告");
});

// --- renderCaretakerPanelBody ---

test("renderCaretakerPanelBody includes header, summary, messages, and rules", () => {
  const body = renderCaretakerPanelBody(sampleModel(), fakeDoc());
  assert.equal(body.className, "caretaker-body");
  assert.equal(body._children.length, 4);
  assert.equal(body._children[0].className, "caretaker-header");
  assert.equal(body._children[1].className, "caretaker-summary");
  assert.equal(body._children[2].className, "caretaker-messages");
  assert.equal(body._children[3].className, "caretaker-rules");
});
