import test from "node:test";
import assert from "node:assert/strict";
import * as messageState from "../shell-message-state.js";

const {
  messageIsDeliveredCopyOfPending,
  messageMatchesPendingEcho,
  normalizedMessageText,
  visiblePendingEchoesForRoomData,
} = messageState;

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

test("createPendingMessageEchoStore owns isolated enqueue and mutation state", () => {
  assert.equal(
    typeof messageState.createPendingMessageEchoStore,
    "function",
    "pending echo state should be owned by an instance factory",
  );

  const first = messageState.createPendingMessageEchoStore({
    getIdentity: () => "alice",
    now: () => 1710000000000,
    random: () => 0.5,
    formatTimestamp: () => "09:30",
  });
  const second = messageState.createPendingMessageEchoStore({ getIdentity: () => "bob" });

  const echoId = first.enqueue("room:one", "hello", "续聊");
  assert.equal(echoId, "pending:1710000000000:8");
  assert.deepEqual(first.forRoom("room:one"), [{
    id: echoId,
    sender: "alice",
    timestamp: "09:30",
    text: "hello",
    quick_action: "续聊",
    pending: true,
    failed: false,
  }]);
  assert.deepEqual(second.forRoom("room:one"), [], "store instances must not share state");

  first.markFailed("room:one", echoId, true);
  assert.equal(first.forRoom("room:one")[0].failed, true);
  first.remove("room:one", echoId);
  assert.deepEqual(first.forRoom("room:one"), []);
});

test("createPendingMessageEchoStore clears one room or every room", () => {
  assert.equal(typeof messageState.createPendingMessageEchoStore, "function");
  const store = messageState.createPendingMessageEchoStore({
    getIdentity: () => "alice",
    now: (() => { let value = 1; return () => value++; })(),
    random: () => 0.25,
    formatTimestamp: () => "now",
  });
  store.enqueue("room:one", "one");
  store.enqueue("room:two", "two");

  store.clearRoom("room:one");
  assert.deepEqual(store.forRoom("room:one"), []);
  assert.equal(store.forRoom("room:two").length, 1);
  store.clearAll();
  assert.deepEqual(store.snapshot(), {});
});
