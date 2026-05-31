import test from "node:test";
import assert from "node:assert/strict";
import {
  gatewayErrorMessage,
  localizedRuntimeError,
} from "../shell-errors.js";

test("gatewayErrorMessage resolves nested gateway errors", () => {
  assert.equal(gatewayErrorMessage({ Error: { message: "shell state unavailable" } }, "", 500), "shell state unavailable");
  assert.equal(gatewayErrorMessage({ error: { message: "bad token" } }, "", 403), "bad token");
  assert.equal(gatewayErrorMessage(null, "plain failure", 502), "plain failure");
  assert.equal(gatewayErrorMessage(null, "", 503), "503");
});

test("localizedRuntimeError maps common gateway failures to resident copy", () => {
  assert.equal(localizedRuntimeError(new Error("login required before sending messages"), "发送失败"), "请先登录后发送");
  assert.equal(localizedRuntimeError(new Error("message text required"), "发送失败"), "请输入内容后发送");
  assert.equal(localizedRuntimeError(new Error("room cafe is frozen"), "发送失败"), "房间已冻结，暂不能发送");
  assert.equal(localizedRuntimeError(new Error("invalid or expired session"), "发送失败"), "登录已失效，请重新登录");
});

test("localizedRuntimeError keeps Chinese server messages and hides raw English", () => {
  assert.equal(localizedRuntimeError(new Error("服务暂不可用"), "同步失败"), "服务暂不可用");
  assert.equal(localizedRuntimeError(new Error("upstream timeout"), "同步失败"), "同步失败");
  assert.equal(localizedRuntimeError(null, "同步失败"), "同步失败");
});
