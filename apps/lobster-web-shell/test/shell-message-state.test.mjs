import test from "node:test";
import assert from "node:assert/strict";
import {
  messageIsDeliveredCopyOfPending,
  messageMatchesPendingEcho,
  normalizedMessageText,
  visiblePendingEchoesForRoomData,
} from "../shell-message-state.js";

test("normalizedMessageText trims strings and blanks non-strings", () => {
  assert.equal(normalizedMessageText("  hello  "), "hello");
  assert.equal(normalizedMessageText(null), "");
});

test("messageMatchesPendingEcho compares sender text and quick action", () => {
  const message = { sender: " builder ", text: " hi ", quick_action: "续聊" };
  const pending = { sender: "builder", text: "hi", quick_action: "续聊" };
  assert.equal(messageMatchesPendingEcho(message, pending), true);
  assert.equal(messageMatchesPendingEcho({ ...message, quick_action: "整理" }, pending), false);
});

test("messageIsDeliveredCopyOfPending only hides delivered committed copies", () => {
  const pending = { sender: "builder", text: "hi" };
  assert.equal(messageIsDeliveredCopyOfPending({ sender: "builder", text: "hi", delivery_status: "delivered" }, pending), true);
  assert.equal(messageIsDeliveredCopyOfPending({ sender: "builder", text: "hi", delivery_status: "pending" }, pending), false);
});

test("visiblePendingEchoesForRoomData keeps failed echoes and hides committed copies", () => {
  const room = {
    id: "room:1",
    messages: [{ sender: "builder", text: "done", quick_action: "续聊", delivery_status: "delivered" }],
  };
  const pendingEchoes = [
    { sender: "builder", text: "done", quick_action: "续聊", failed: false },
    { sender: "builder", text: "retry me", quick_action: "", failed: true },
    { sender: "builder", text: "still pending", quick_action: "", failed: false },
  ];

  assert.deepEqual(visiblePendingEchoesForRoomData(room, pendingEchoes).map((item) => item.text), [
    "retry me",
    "still pending",
  ]);
});
