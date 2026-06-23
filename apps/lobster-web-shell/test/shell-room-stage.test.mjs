import test from "node:test";
import assert from "node:assert/strict";
import {
  roomStagePortraitChipsForState,
  roomStagePortraitSummaryForState,
  roomStagePortraitTitleForState,
  roomStageSummaryForState,
  userRoomProjectionForState,
} from "../shell-room-stage.js";

const serial = { concurrency: false };

test("roomStageSummaryForState: idle, stage override, and caretaker reply", serial, () => {
  assert.equal(roomStageSummaryForState(), "先选一个会话，房间场景会自动接上。");
  assert.equal(
    roomStageSummaryForState({
      room: { id: "dm:a:b" },
      stage: { summary: "场景已经写好" },
      caretaker: { auto_reply: "我会留意" },
      contextSummary: "普通摘要",
    }),
    "场景已经写好",
  );
  assert.equal(
    roomStageSummaryForState({
      room: { id: "dm:a:b" },
      caretaker: { auto_reply: "我会留意" },
      contextSummary: "普通摘要",
    }),
    "普通摘要 · 我会留意",
  );
});

test("roomStagePortraitSummaryForState: portrait override and caretaker profile", serial, () => {
  assert.equal(
    roomStagePortraitSummaryForState(),
    "先从左侧选会话，角色资料会跟着出现。",
  );
  assert.equal(
    roomStagePortraitSummaryForState({
      room: { id: "dm:a:b" },
      portrait: { summary: "画像摘要" },
      caretaker: { name: "灰狗", role_label: "管家" },
      contextSummary: "普通摘要",
    }),
    "画像摘要",
  );
  assert.equal(
    roomStagePortraitSummaryForState({
      room: { id: "dm:a:b" },
      caretaker: {
        name: "灰狗",
        role_label: "房间管家",
        persona: "嘴硬",
        memory: "记住留言",
        auto_reply: "先留关键词",
      },
      contextSummary: "普通摘要",
    }),
    "灰狗 · 房间管家、嘴硬、记住留言、先留关键词",
  );
});

test("roomStagePortraitTitleForState: portrait, caretaker, participant, fallback", serial, () => {
  assert.equal(roomStagePortraitTitleForState({ portrait: { title: "画像标题" } }), "画像标题");
  assert.equal(roomStagePortraitTitleForState({ caretaker: { name: "灰狗" } }), "灰狗");
  assert.equal(roomStagePortraitTitleForState({ room: { participant_label: "阿初" } }), "阿初");
  assert.equal(roomStagePortraitTitleForState(), "人物");
});

test("roomStagePortraitChipsForState: idle, room metadata, and caretaker alerts", serial, () => {
  assert.deepEqual(
    roomStagePortraitChipsForState(),
    [{ text: "等待选中会话", tone: "muted" }],
  );
  assert.deepEqual(
    roomStagePortraitChipsForState({
      room: {
        id: "dm:a:b",
        scene_banner: "私宅",
        search_terms: ["续聊", "提醒"],
      },
      portrait: { badge: "住宅 / 私聊", status: "醒着" },
      caretaker: { name: "灰狗", role_label: "房间管家", status: "在岗" },
      audienceLabel: "双人",
      memberCount: 2,
      pendingCount: 3,
    }),
    [
      { text: "住宅 / 私聊", tone: "warm" },
      { text: "双人", tone: "muted" },
      { text: "2 人", tone: "muted" },
      { text: "续聊 · 提醒", tone: "muted" },
      { text: "灰狗 · 房间管家", tone: "accent" },
      { text: "醒着", tone: "muted" },
      { text: "3 条访客提醒", tone: "warm" },
    ],
  );
});

test("userRoomProjectionForState: idle, home, and city projections", serial, () => {
  const fallback = {
    eyebrow: "默认眉题",
    title: "默认标题",
    hero: "默认说明",
  };
  assert.deepEqual(
    userRoomProjectionForState({ fallback }),
    {
      variant: "idle",
      motif: "idle",
      eyebrow: "默认眉题",
      title: "默认标题",
      hero: "默认说明",
      detailTitle: "当前房间状态",
      detailCopy: "角色资料会随着会话切换更新，消息输入保持清楚可见。",
    },
  );
  assert.deepEqual(
    userRoomProjectionForState({
      room: { id: "dm:a:b" },
      visual: { stage: { variant: "home", visual: { motif: "study" } } },
      caretaker: { name: "灰狗" },
    }),
    {
      variant: "home",
      motif: "study",
      eyebrow: "龙虾聊天 · 住宅私聊",
      title: "住宅私聊 / 房内聊天",
      hero: "像回到住处一样继续一对一聊天；场景、角色和输入都围着当前房间走。",
      detailTitle: "住宅私聊 / 房内状态",
      detailCopy: "灰狗 会帮你记住留言和提醒，适合续聊、记任务和直接追问。",
    },
  );
  assert.deepEqual(
    userRoomProjectionForState({
      room: { id: "room:world:lobby" },
      visual: { stage: { variant: "city", visual: {} } },
      detailCard: { summary_title: "频道状态", summary_copy: "公告同步中" },
    }),
    {
      variant: "city",
      motif: "watchtower",
      eyebrow: "龙虾聊天 · 公共频道",
      title: "公共频道 / 群聊现场",
      hero: "像走进公共频道一样继续聊天；公告、巡视和跨城讨论都围着当前窗口展开。",
      detailTitle: "频道状态",
      detailCopy: "公告同步中",
    },
  );
});
