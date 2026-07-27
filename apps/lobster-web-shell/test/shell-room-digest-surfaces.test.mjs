import test from "node:test";
import assert from "node:assert/strict";
import { createRoomDigestSurfaceRenderer } from "../shell-room-digest-surfaces.js";

function createFakeDocument() {
  return {
    createElement(tagName) {
      return {
        tagName: tagName.toUpperCase(),
        className: "",
        textContent: "",
        children: [],
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

function createFixture(shellPage = "admin") {
  const doc = createFakeDocument();
  const digest = doc.createElement("section");
  const rooms = [
    {
      id: "room:world:lobby",
      kind: "public",
      title: "主城大厅",
      unread: 2,
      draft: "待发",
      followUp: true,
      caretakerPending: 1,
      caretakerNotifications: 2,
    },
    {
      id: "dm:qa-a:qa-b",
      kind: "direct",
      title: "与阿乙私信",
      unread: 0,
      caretakerPending: 0,
      caretakerNotifications: 0,
    },
  ];
  const pills = [];
  const renderer = createRoomDigestSurfaceRenderer({
    doc,
    getRoomDigestEl: () => digest,
    getRooms: () => rooms,
    getActiveRoomId: () => rooms[0].id,
    getShellPage: () => shellPage,
    roomKindFn: (room) => room.kind,
    unreadCountFn: (room) => room.unread,
    roomHasDraftFn: (roomId) => roomId === rooms[0].id,
    roomFollowUpCountFn: (room) => Number(Boolean(room.followUp)),
    caretakerPendingCountFn: (room) => room.caretakerPending,
    caretakerNotificationCountFn: (room) => room.caretakerNotifications,
    roomThreadHeadlineFn: (room) => room.title,
    roomContextSummaryFn: (room) => `上下文：${room.title}`,
    roomChatStatusSummaryFn: () => "待同步",
    roomQueueSummaryFn: () => "1 条待处理",
    getRoomSendErrors: () => ({}),
    pendingEchoesForRoomFn: () => [],
    caretakerProfileFn: () => ({ name: "旺财" }),
    createPillFn: (text, tone) => {
      const pill = doc.createElement("span");
      pill.textContent = text;
      pill.tone = tone;
      pills.push(pill);
      return pill;
    },
  });
  return { digest, pills, renderer, rooms };
}

test("room digest surface renders admin metrics, active context, and caretaker state", () => {
  const { digest, pills, renderer, rooms } = createFixture("admin");

  renderer.renderRoomDigest(rooms);

  assert.equal(digest.children.length, 3);
  assert.equal(digest.children[0].textContent, "最近会话 · 2");
  assert.equal(digest.children[1].textContent, "主城大厅");
  assert.equal(digest.children[2].className, "room-digest-chips");
  assert.ok(pills.some((pill) => pill.textContent === "1 个待跟进" && pill.tone === "warm"));
  assert.ok(pills.some((pill) => pill.textContent === "当前会话 主城大厅"));
  assert.ok(pills.some((pill) => pill.textContent === "旺财 在岗 · 1 条代办" && pill.tone === "warm"));
});

test("room digest surface keeps user copy compact and safely clears stale DOM", () => {
  const { digest, renderer, rooms } = createFixture("user");
  const stale = digest.ownerDocument?.createElement?.("div") || { textContent: "stale" };
  digest.children.push(stale);

  renderer.renderRoomDigest(rooms.slice(0, 1));

  assert.equal(digest.children.length, 3);
  assert.equal(digest.children[1].textContent, "上下文：主城大厅");
  assert.equal(digest.children[2].className, "room-digest-chips");
  assert.ok(digest.children[2].children.every((pill) => !pill.textContent.includes("待同步")));
});
