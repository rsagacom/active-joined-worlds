import { test } from "node:test";
import assert from "node:assert/strict";

import * as quickActionReaderModule from "../shell-quick-action-reader.js";

test("createQuickActionReaders keeps reader instances isolated", () => {
  assert.equal(typeof quickActionReaderModule.createQuickActionReaders, "function");

  const roomId = "room:reader-isolation";
  const firstEcho = { id: "echo:first" };
  const secondEcho = { id: "echo:second" };
  const first = quickActionReaderModule.createQuickActionReaders({
    getPendingEchoes: () => ({ [roomId]: [firstEcho] }),
  });
  const second = quickActionReaderModule.createQuickActionReaders({
    getPendingEchoes: () => ({ [roomId]: [secondEcho] }),
  });

  assert.deepEqual(first.pendingEchoesForRoom(roomId), [firstEcho]);
  assert.deepEqual(second.pendingEchoesForRoom(roomId), [secondEcho]);
  assert.deepEqual(first.pendingEchoesForRoom(roomId), [firstEcho]);
});
