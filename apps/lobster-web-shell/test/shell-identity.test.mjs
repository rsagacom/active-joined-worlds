/* shell-identity.test.mjs — identity helper unit tests */

import test from "node:test";
import assert from "node:assert/strict";
import { isVisitorIdentity, residentScopedShellStatePage, translateClientDisplayName, translateRoutePrefix } from "../shell-identity.js";

test("isVisitorIdentity: empty value is visitor", () => {
  assert.equal(isVisitorIdentity(""), true);
  assert.equal(isVisitorIdentity("  "), true);
  assert.equal(isVisitorIdentity(null), true);
  assert.equal(isVisitorIdentity(undefined), true);
});

test("isVisitorIdentity: 访客 is visitor", () => {
  assert.equal(isVisitorIdentity("访客"), true);
});

test("isVisitorIdentity: named user is not visitor", () => {
  assert.equal(isVisitorIdentity("rsaga"), false);
  assert.equal(isVisitorIdentity("alice"), false);
});

test("residentScopedShellStatePage: user shell is scoped", () => {
  assert.equal(residentScopedShellStatePage("user"), true);
  assert.equal(residentScopedShellStatePage("hub"), true);
  assert.equal(residentScopedShellStatePage("admin"), true);
});

test("residentScopedShellStatePage: other pages are not scoped", () => {
  assert.equal(residentScopedShellStatePage("unified"), false);
  assert.equal(residentScopedShellStatePage("public-square"), false);
  assert.equal(residentScopedShellStatePage(""), false);
});

test("translateClientDisplayName: mobile web translates", () => {
  assert.equal(translateClientDisplayName("mobile web"), "移动网页");
  assert.equal(translateClientDisplayName("Mobile Web"), "移动网页");
});

test("translateClientDisplayName: unknown returns original", () => {
  assert.equal(translateClientDisplayName("desktop"), "desktop");
  assert.equal(translateClientDisplayName(""), "未知终端");
  assert.equal(translateClientDisplayName(null), "未知终端");
});

test("translateRoutePrefix: /app translates", () => {
  assert.equal(translateRoutePrefix("/app"), "主入口");
});

test("translateRoutePrefix: unknown returns original", () => {
  assert.equal(translateRoutePrefix("/admin"), "/admin");
  assert.equal(translateRoutePrefix(""), "默认入口");
  assert.equal(translateRoutePrefix(null), "默认入口");
});
