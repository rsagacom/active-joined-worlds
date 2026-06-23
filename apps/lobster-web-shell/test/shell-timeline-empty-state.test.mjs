import test from "node:test";
import assert from "node:assert/strict";
import {
  localPreviewMessagesForEmptyRoom,
  shouldRenderTimelineSkeletonRows,
  timelineNoRoomEmptyStateSpec,
} from "../shell-timeline-empty-state.js";

const directRoom = { id: "dm:rsaga:builder", messages: [] };

test("timelineNoRoomEmptyStateSpec: gateway 状态提示先选择会话", () => {
  const spec = timelineNoRoomEmptyStateSpec({
    gatewayUrl: "http://127.0.0.1:8787",
    shellPage: "hub",
  });

  assert.deepEqual(spec.metaChips, [
    { text: "先选会话，消息会显示在这里。", tone: "muted" },
  ]);
  assert.equal(spec.card.className, "empty-note timeline-empty timeline-empty-card");
  assert.equal(spec.card.titleText, "先选会话，再输入第一句");
  assert.match(spec.card.copyText, /消息会按当前线程展开/);
  assert.equal(spec.card.actionText, "选中会话后，直接在底部输入即可。");
});

test("timelineNoRoomEmptyStateSpec: 后台和离线预览使用对应文案", () => {
  const adminSpec = timelineNoRoomEmptyStateSpec({
    gatewayUrl: "",
    shellPage: "admin",
  });

  assert.deepEqual(adminSpec.metaChips, [
    { text: "离线预览态，先选会话再发消息。", tone: "muted" },
  ]);
  assert.match(adminSpec.card.copyText, /离线预览态也能先把第一句写出来/);
  assert.equal(adminSpec.card.actionText, "后台页先选会话，再像聊天一样记录。");
});

test("timeline skeleton is suppressed for scene overlay and resident shells", () => {
  assert.equal(
    shouldRenderTimelineSkeletonRows({
      room: directRoom,
      localPreviewMessages: [],
      shellPage: "user",
      shellVariant: "",
    }),
    false,
  );
  assert.equal(
    shouldRenderTimelineSkeletonRows({
      room: directRoom,
      localPreviewMessages: [],
      shellPage: "hub",
      shellVariant: "creative-terminal",
    }),
    false,
  );
  assert.equal(
    shouldRenderTimelineSkeletonRows({
      room: directRoom,
      localPreviewMessages: [],
      shellPage: "hub",
      shellVariant: "public-square",
    }),
    false,
  );
});

test("timeline skeleton remains available for non-scene empty timelines only", () => {
  assert.equal(
    shouldRenderTimelineSkeletonRows({
      room: directRoom,
      localPreviewMessages: [],
      shellPage: "admin",
      shellVariant: "",
    }),
    true,
  );
  assert.equal(
    shouldRenderTimelineSkeletonRows({
      room: { id: "dm:rsaga:builder", messages: [{ text: "已有消息" }] },
      localPreviewMessages: [],
      shellPage: "admin",
      shellVariant: "",
    }),
    false,
  );
  assert.equal(
    shouldRenderTimelineSkeletonRows({
      room: directRoom,
      localPreviewMessages: [{ text: "预览消息" }],
      shellPage: "admin",
      shellVariant: "",
    }),
    false,
  );
});

test("local preview messages preserve legacy creative-terminal hub fallback", () => {
  const messages = localPreviewMessagesForEmptyRoom({
    room: directRoom,
    gatewayUrl: "",
    shellPage: "hub",
    shellVariant: "creative-terminal",
    currentIdentity: "builder",
  });

  assert.equal(messages.length, 3);
  assert.equal(messages[1]?.sender, "builder");
  assert.match(messages[0]?.text || "", /住宅私聊/);
  assert.match(messages[2]?.text || "", /楼梯热点/);
});

test("local preview messages stay disabled for gateway and non-direct rooms", () => {
  assert.deepEqual(
    localPreviewMessagesForEmptyRoom({
      room: directRoom,
      gatewayUrl: "http://127.0.0.1:8787",
      shellPage: "hub",
      shellVariant: "creative-terminal",
      currentIdentity: "builder",
    }),
    [],
  );
  assert.deepEqual(
    localPreviewMessagesForEmptyRoom({
      room: { id: "room:world:lobby", messages: [] },
      gatewayUrl: "",
      shellPage: "hub",
      shellVariant: "creative-terminal",
      currentIdentity: "builder",
    }),
    [],
  );
  assert.deepEqual(
    localPreviewMessagesForEmptyRoom({
      room: directRoom,
      gatewayUrl: "",
      shellPage: "user",
      shellVariant: "creative-terminal",
      currentIdentity: "builder",
    }),
    [],
  );
});
