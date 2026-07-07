import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GOVERNANCE_STATUS_DYNAMIC_CLASSES,
  governanceStatusClassState,
  governanceStatusText,
} from "../shell-governance-status.js";

test("governanceStatusText uses the drawer label on user shell pages", () => {
  assert.equal(
    governanceStatusText({
      message: "好友关系已更新",
      shellMode: "user",
      hasGovernanceStatus: true,
    }),
    "边缘抽屉提示：好友关系已更新",
  );
});

test("governanceStatusText uses the sidebar label outside user shell pages", () => {
  assert.equal(
    governanceStatusText({
      message: "城市已创建",
      shellMode: "hub",
      hasGovernanceStatus: true,
    }),
    "侧栏提示：城市已创建",
  );
});

test("governanceStatusText falls back to world status copy when status node is absent", () => {
  assert.equal(
    governanceStatusText({
      message: "连接成功",
      isError: false,
      shellMode: "user",
      hasGovernanceStatus: false,
    }),
    "提示：连接成功",
  );
  assert.equal(
    governanceStatusText({
      message: "连接失败",
      isError: true,
      shellMode: "user",
      hasGovernanceStatus: false,
    }),
    "提示异常：连接失败",
  );
});

test("governanceStatusClassState clears all dynamic classes before adding prompt classes", () => {
  assert.deepEqual(
    governanceStatusClassState({
      isError: false,
      extraClassName: "resident-room-access-note is-actionable",
    }),
    {
      remove: GOVERNANCE_STATUS_DYNAMIC_CLASSES,
      add: ["resident-room-access-note", "is-actionable"],
    },
  );
});

test("governanceStatusClassState keeps notice-pending for error states", () => {
  assert.deepEqual(
    governanceStatusClassState({
      isError: true,
      extraClassName: "resident-room-access-note is-locked",
    }),
    {
      remove: GOVERNANCE_STATUS_DYNAMIC_CLASSES,
      add: ["notice-pending", "resident-room-access-note", "is-locked"],
    },
  );
});
