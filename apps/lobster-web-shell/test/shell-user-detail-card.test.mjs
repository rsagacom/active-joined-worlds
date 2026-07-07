import { test } from "node:test";
import assert from "node:assert/strict";
import {
  userDetailCardIdleProjectionForState,
  userDetailCardMonogramForState,
  userDetailCardCustomProjectionForState,
  userDetailCardCityProjectionForState,
  userDetailCardHomeProjectionForState,
  userDetailCardProjectionForState,
} from "../shell-user-detail-card.js";

const baseDeps = {
  roomChatStatusSummary: () => "在线",
  currentIdentity: () => "resident-a",
  roomDisplayPeer: () => "peer-b",
  roomAudienceLabel: () => "你与 peer-b",
};

test("idle: 无 room 返回 idle 投影", () => {
  const card = userDetailCardProjectionForState(null, { stage: {} }, {}, baseDeps);
  assert.equal(card.variant, "idle");
  assert.equal(card.monogram, "房");
  assert.deepEqual(card.actions, []);
  assert.equal(card.meta[0].value, "等待打开一个会话");
});

test("idle: 无 visual.stage 返回 idle 投影", () => {
  const card = userDetailCardProjectionForState({ id: "r1" }, {}, {}, baseDeps);
  assert.equal(card.variant, "idle");
});

test("idle: idle 投影固定结构", () => {
  const card = userDetailCardIdleProjectionForState();
  assert.deepEqual(card, {
    variant: "idle",
    motif: "idle",
    kicker: "角色卡",
    title: "当前房间角色卡",
    monogram: "房",
    meta: [{ label: "状态", value: "等待打开一个会话" }],
    actions: [],
  });
});

test("monogram: portrait.visual.monogram 优先", () => {
  const visual = { portrait: { visual: { monogram: "自" } } };
  assert.equal(userDetailCardMonogramForState(visual, { variant: "city" }), "自");
});

test("monogram: city 变体回退「巡」", () => {
  assert.equal(userDetailCardMonogramForState({ portrait: {} }, { variant: "city" }), "巡");
});

test("monogram: 非 city 回退「房」", () => {
  assert.equal(userDetailCardMonogramForState({ portrait: {} }, { variant: "home" }), "房");
  assert.equal(userDetailCardMonogramForState({ portrait: {} }, {}, ), "房");
});

test("custom: detailCard 优先于 city/home 分支", () => {
  const room = {
    id: "r1",
    detail_card: { kicker: "自定义", title: "T", monogram: "M", meta: [{ label: "L", value: "V" }], actions: ["A"] },
    caretaker: { name: "看门人", status: "忙碌" },
  };
  const visual = { stage: { variant: "home" } };
  const card = userDetailCardProjectionForState(room, visual, { variant: "home" }, baseDeps);
  assert.equal(card.variant, "home");
  assert.equal(card.kicker, "自定义");
  assert.equal(card.title, "T");
  assert.equal(card.monogram, "M");
  assert.deepEqual(card.meta, [{ label: "L", value: "V" }]);
  assert.deepEqual(card.actions, ["A"]);
});

test("custom: detailCard 空字段回退到 projection/status", () => {
  const room = {
    id: "r1",
    detail_card: {},
    caretaker: { name: "看门人", status: "值守" },
  };
  const visual = { stage: { variant: "home", visual: { motif: "watchtower" } } };
  const card = userDetailCardCustomProjectionForState(room, visual, { variant: "home" }, {}, "房", "值守");
  assert.equal(card.variant, "home");
  assert.equal(card.motif, "watchtower");
  assert.equal(card.kicker, "住宅私聊 / 角色卡");
  assert.equal(card.title, "当前房间角色卡");
  assert.equal(card.monogram, "房");
  assert.deepEqual(card.meta, [{ label: "状态", value: "值守" }]);
  assert.deepEqual(card.actions, []);
});

test("city: 无 detailCard 且 variant=city 走 city 分支", () => {
  const room = {
    id: "r1",
    thread_headline: "频道标题",
    caretaker: { name: "向导", role_label: "频道主", status: "活跃" },
  };
  const visual = { stage: {} };
  const card = userDetailCardProjectionForState(room, visual, { variant: "city", motif: "plaza" }, baseDeps);
  assert.equal(card.variant, "city");
  assert.equal(card.motif, "plaza");
  assert.equal(card.kicker, "公共频道 / 角色卡");
  assert.equal(card.title, "向导 / 频道状态");
  assert.equal(card.monogram, "巡");
  const metaMap = Object.fromEntries(card.meta.map((m) => [m.label, m.value]));
  assert.equal(metaMap["角色"], "频道主");
  assert.equal(metaMap["称号"], "向导");
  assert.equal(metaMap["当前"], "你与 peer-b");
  assert.equal(metaMap["状态"], "活跃"); // caretaker.status 优先
  assert.deepEqual(card.actions, ["私聊", "委托", "交易"]);
});

test("city: 无 caretaker 回退 thread_headline/title", () => {
  const room = { id: "r1", title: "备用标题" };
  const card = userDetailCardCityProjectionForState(room, { motif: "plaza" }, null, "巡", "空闲", baseDeps);
  assert.equal(card.title, "公共频道 / 当前状态");
  const metaMap = Object.fromEntries(card.meta.map((m) => [m.label, m.value]));
  assert.equal(metaMap["角色"], "公共频道向导");
  assert.equal(metaMap["称号"], "备用标题");
  assert.equal(metaMap["状态"], "空闲");
});

test("home: 默认分支（无 detailCard 非 city）走 home", () => {
  const room = { id: "r1", caretaker: { name: "管家", status: "在家" } };
  const visual = { stage: { variant: "home" } };
  const card = userDetailCardProjectionForState(room, visual, { variant: "home" }, baseDeps);
  assert.equal(card.variant, "home");
  assert.equal(card.motif, "courtyard");
  assert.equal(card.kicker, "住宅私聊 / 角色卡");
  assert.equal(card.title, "管家 / 房内状态");
  assert.equal(card.monogram, "房");
  const metaMap = Object.fromEntries(card.meta.map((m) => [m.label, m.value]));
  assert.equal(metaMap["住户"], "resident-a");
  assert.equal(metaMap["同住AI"], "管家");
  assert.equal(metaMap["当前"], "你与 peer-b");
  assert.equal(metaMap["状态"], "在家");
  assert.deepEqual(card.actions, ["续聊", "整理", "留条"]);
});

test("home: 无 caretaker 同住AI 回退 roomDisplayPeer", () => {
  const room = { id: "r1" };
  const card = userDetailCardHomeProjectionForState(room, {}, null, "房", "离线", baseDeps);
  const metaMap = Object.fromEntries(card.meta.map((m) => [m.label, m.value]));
  assert.equal(metaMap["同住AI"], "peer-b");
  assert.equal(metaMap["住户"], "resident-a");
  assert.equal(card.title, "住宅私聊 / 房内状态");
});

test("home: currentIdentity 为空回退「当前住户」", () => {
  const deps = { ...baseDeps, currentIdentity: () => "" };
  const card = userDetailCardHomeProjectionForState({ id: "r1" }, {}, null, "房", "离线", deps);
  const metaMap = Object.fromEntries(card.meta.map((m) => [m.label, m.value]));
  assert.equal(metaMap["住户"], "当前住户");
});

test("status: caretaker.status 优先于 roomChatStatusSummary", () => {
  const room = { id: "r1", caretaker: { status: "值守中" } };
  const visual = { stage: {} };
  const card = userDetailCardProjectionForState(room, visual, { variant: "city", motif: "x" }, baseDeps);
  const metaMap = Object.fromEntries(card.meta.map((m) => [m.label, m.value]));
  assert.equal(metaMap["状态"], "值守中");
});

test("status: 无 caretaker.status 用 roomChatStatusSummary", () => {
  const room = { id: "r1" };
  const visual = { stage: {} };
  const card = userDetailCardProjectionForState(room, visual, { variant: "city", motif: "x" }, baseDeps);
  const metaMap = Object.fromEntries(card.meta.map((m) => [m.label, m.value]));
  assert.equal(metaMap["状态"], "在线");
});
