import test from "node:test";
import assert from "node:assert/strict";
import { createThreadStatusSurfaceRenderer } from "../shell-thread-status-surfaces.js";

function createFakeDocument() {
  return {
    createElement(tagName) {
      const tokens = new Set();
      return {
        tagName: tagName.toUpperCase(),
        className: "",
        textContent: "",
        children: [],
        classList: {
          add(...values) {
            values.forEach((value) => tokens.add(value));
          },
          remove(...values) {
            values.forEach((value) => tokens.delete(value));
          },
          contains(value) {
            return tokens.has(value);
          },
        },
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
      };
    },
  };
}

function createLineFn(className, text) {
  return { className, textContent: text, children: [] };
}

test("thread status surface hides and clears the rail when the model is not visible", () => {
  const doc = createFakeDocument();
  const rail = doc.createElement("section");
  rail.appendChild({ textContent: "stale" });
  const renderer = createThreadStatusSurfaceRenderer({
    doc,
    getRailEl: () => rail,
    getModel: () => ({ visible: false, items: [] }),
    createLineFn,
  });

  renderer.renderThreadStatusRail(null);

  assert.equal(rail.children.length, 0);
  assert.equal(rail.classList.contains("surface-hidden"), true);
});

test("thread status surface renders model items and removes the hidden state", () => {
  const doc = createFakeDocument();
  const rail = doc.createElement("section");
  rail.classList.add("surface-hidden");
  const renderer = createThreadStatusSurfaceRenderer({
    doc,
    getRailEl: () => rail,
    getModel: (room) => ({
      visible: room?.id === "room-1",
      items: [{ tone: "warm", label: "状态", value: "待同步" }],
    }),
    createLineFn,
  });

  renderer.renderThreadStatusRail({ id: "room-1" });

  assert.equal(rail.classList.contains("surface-hidden"), false);
  assert.equal(rail.children.length, 1);
  assert.equal(rail.children[0].className, "thread-status-item thread-status-item-warm");
  assert.deepEqual(
    rail.children[0].children.map((child) => [child.className, child.textContent]),
    [["thread-status-label", "状态"], ["thread-status-value", "待同步"]],
  );
});
