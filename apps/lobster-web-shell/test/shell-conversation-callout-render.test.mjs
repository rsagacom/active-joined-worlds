import { test } from "node:test";
import assert from "node:assert/strict";

import {
  createConversationCalloutParagraphNode,
  renderConversationCalloutContent,
} from "../shell-conversation-callout-render.js";

function fakeDocument() {
  return {
    createElement(tagName) {
      return { tagName: tagName.toUpperCase(), className: "", textContent: "" };
    },
  };
}

function fakeCallout() {
  return {
    dataset: {},
    children: [{ textContent: "旧内容" }],
    replaceChildren() {
      this.children = [];
    },
    appendChild(child) {
      this.children.push(child);
    },
  };
}

test("createConversationCalloutParagraphNode maps safe paragraph text", () => {
  const node = createConversationCalloutParagraphNode(
    { className: "conversation-callout-summary", text: "来自 Gateway 的会话摘要" },
    fakeDocument(),
  );

  assert.equal(node.tagName, "P");
  assert.equal(node.className, "conversation-callout-summary");
  assert.equal(node.textContent, "来自 Gateway 的会话摘要");
});

test("renderConversationCalloutContent replaces stale content with model projection", () => {
  const callout = fakeCallout();
  renderConversationCalloutContent(
    {
      variant: "admin",
      title: "管理后台",
      paragraphs: [
        { className: "conversation-callout-summary", text: "待处理会话 2 条" },
        { className: "conversation-callout-meta", text: "单城 Gateway 投影" },
      ],
    },
    callout,
    fakeDocument(),
  );

  assert.equal(callout.dataset.variant, "admin");
  assert.deepEqual(
    callout.children.map((child) => [child.tagName, child.className, child.textContent]),
    [
      ["STRONG", "", "管理后台"],
      ["P", "conversation-callout-summary", "待处理会话 2 条"],
      ["P", "conversation-callout-meta", "单城 Gateway 投影"],
    ],
  );
});
