import { test } from "node:test";
import assert from "node:assert/strict";

let symbolsModule = null;
try {
  symbolsModule = await import("../shell-composer-symbols.js");
} catch {
  symbolsModule = null;
}

function classListRecorder() {
  const values = new Set();
  return {
    values,
    toggle(name, enabled) {
      if (enabled) values.add(name);
      else values.delete(name);
    },
  };
}

test("selectComposerSymbolCategory projects active panel and tab state", () => {
  assert.equal(typeof symbolsModule?.selectComposerSymbolCategory, "function");
  const categories = [0, 1].map(() => ({ classList: classListRecorder(), hidden: false }));
  const tabs = [0, 1].map(() => ({
    classList: classListRecorder(),
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
  }));

  symbolsModule.selectComposerSymbolCategory(categories, tabs, 1);

  assert.equal(categories[0].hidden, true);
  assert.equal(categories[1].hidden, false);
  assert.equal(categories[1].classList.values.has("is-active"), true);
  assert.equal(tabs[0].attributes.tabindex, "-1");
  assert.equal(tabs[1].attributes["aria-selected"], "true");
});

test("insertComposerToken replaces the selection and keeps cursor after token", () => {
  assert.equal(typeof symbolsModule?.insertComposerToken, "function");
  const events = [];
  const input = {
    value: "你好世界",
    selectionStart: 2,
    selectionEnd: 4,
    disabled: false,
    setSelectionRange(start, end) { this.selection = [start, end]; },
    dispatchEvent(event) { events.push(event.type); },
    focus(options) { this.focusOptions = options; },
  };

  symbolsModule.insertComposerToken(input, "(＾▽＾)");

  assert.equal(input.value, "你好 (＾▽＾)");
  assert.deepEqual(input.selection, [8, 8]);
  assert.deepEqual(events, ["input"]);
  assert.deepEqual(input.focusOptions, { preventScroll: true });
});

test("createComposerSymbolController exposes one bind and close boundary", () => {
  assert.equal(typeof symbolsModule?.createComposerSymbolController, "function");
  const controller = symbolsModule.createComposerSymbolController({});
  assert.equal(typeof controller.bind, "function");
  assert.equal(typeof controller.close, "function");
  assert.equal(typeof controller.toggle, "function");
});
