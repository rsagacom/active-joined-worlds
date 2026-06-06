import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";

import {
  APP_LOCAL_IMPORT_PATHS,
  rewriteAppLocalImports,
} from "./fake-dom.mjs";

test("fake-dom rewriteAppLocalImports covers every app.js local module import", async () => {
  const appSource = await fs.readFile(new URL("../app.js", import.meta.url), "utf8");
  const appLocalImports = Array.from(
    new Set(
      Array.from(appSource.matchAll(/from\s+["'](\.\/[^"']+\.js)["']/g), (match) => match[1]),
    ),
  ).sort();
  const configuredImports = [...APP_LOCAL_IMPORT_PATHS].sort();

  assert.deepEqual(configuredImports, appLocalImports);
});

test("fake-dom rewriteAppLocalImports rewrites registered imports and leaves unknown imports unchanged", () => {
  const source = [
    'import { computeComposerAvailability } from "./composer-state.js";',
    'import { unknown } from "./unknown-local-module.js";',
  ].join("\n");
  const rewritten = rewriteAppLocalImports(
    source,
    new Map([["./composer-state.js", "file:///web-shell/composer-state.js"]]),
  );

  assert.match(rewritten, /from "file:\/\/\/web-shell\/composer-state\.js"/);
  assert.match(rewritten, /from "\.\/unknown-local-module\.js"/);
});

test("fake-dom rewriteAppLocalImports leaves no registered relative imports in app.js", async () => {
  const appSource = await fs.readFile(new URL("../app.js", import.meta.url), "utf8");
  const rewritten = rewriteAppLocalImports(appSource);

  assert.doesNotMatch(rewritten, /from\s+["']\.\/[^"']+\.js["']/);
});
