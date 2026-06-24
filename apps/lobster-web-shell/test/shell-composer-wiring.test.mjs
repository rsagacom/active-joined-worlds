/* ============================================================
   shell-composer-wiring.test.mjs — shell-composer 模块接线契约
   断言 app.js 已把 14 个 composer 函数委托给 shell-composer.js（initShellComposer
   注入 _ctx），不再保留内联副本。防止接线回退。
   ============================================================ */

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

async function readApp() {
  return fs.readFile(new URL("../app.js", import.meta.url), "utf8");
}
async function readMod() {
  return fs.readFile(new URL("../shell-composer.js", import.meta.url), "utf8");
}

// 14 个应委托给 shell-composer.js 的函数（composerStatusState 已委托，不在此列）
const DELEGATED = [
  "seedComposerFromQuickAction",
  "syncComposerDraft",
  "focusComposerInput",
  "autoSizeComposerInput",
  "ensureComposerTip",
  "renderComposerHero",
  "updateComposerContext",
  "updateComposerTip",
  "ensureComposerKeyBindings",
  "triggerComposerKeyboardSubmit",
  "handleComposerInputKeydown",
  "handleComposerFormPointerdown",
  "renderComposerMeta",
  "gatewayUnavailableForComposer",
];

test("shell-composer 接线: app.js import 了 14 个委托函数 + initShellComposer", async () => {
  const app = await readApp();
  const importBlock = app.slice(0, app.indexOf("} from \"./shell-composer.js\"") + 1);
  assert.match(importBlock, /initShellComposer/, "应 import initShellComposer");
  for (const fn of DELEGATED) {
    assert.match(importBlock, new RegExp(`\\b${fn}\\b`), `应 import ${fn}`);
  }
});

test("shell-composer 接线: app.js 不再保留 14 个内联函数定义", async () => {
  const app = await readApp();
  for (const fn of DELEGATED) {
    // 不应有 "function <fn>(" 顶层定义（含 async）
    assert.doesNotMatch(
      app,
      new RegExp(`^(?:async )?function ${fn}\\(`, "m"),
      `不应再内联定义 ${fn}（应委托 shell-composer.js）`,
    );
  }
});

test("shell-composer 接线: app.js 调用 initShellComposer 注入 deps", async () => {
  const app = await readApp();
  assert.match(app, /initShellComposer\(/, "应在初始化序列调用 initShellComposer");
});

test("shell-composer 接线: buildComposerDeps 工厂提供 _ctx 字段", async () => {
  const app = await readApp();
  // 集中工厂构造 deps 对象
  assert.match(app, /function buildComposerDeps\(/, "应有 buildComposerDeps 工厂");
});

test("shell-composer 接线: 14 个函数在 shell-composer.js 中导出", async () => {
  const mod = await readMod();
  for (const fn of DELEGATED) {
    assert.match(mod, new RegExp(`export function ${fn}\\(`), `shell-composer.js 应导出 ${fn}`);
  }
});
