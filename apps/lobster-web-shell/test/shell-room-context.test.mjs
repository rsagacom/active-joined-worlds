/* ============================================================
   shell-room-context.test.mjs — 房间 governance-aware 上下文纯函数测试
   chatDetailRoomContextModelForState / directRoomPeerOnlineStatusForState /
   roomContextSummaryForState / roomRouteLabelForState 从 app.js 提取，
   governance 查询 + 全局通过 deps 注入，脱离全局即可单测。
   ============================================================ */

import test from "node:test";
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";

const modUrl = new URL("../shell-room-context.js", import.meta.url);
const mod = await import(pathToFileURL(modUrl.pathname).href);
const {
  chatDetailRoomContextModelForState,
  directRoomPeerOnlineStatusForState,
  roomContextSummaryForState,
  roomRouteLabelForState,
  roomMemberCountForState,
  roomAudienceLabelForState,
} = mod;

// 默认 deps：governance 查询返回 null，全局空
function deps(over = {}) {
  return {
    publicRoomRecordForConversation: () => null,
    cityStateForConversation: () => null,
    worldDirectoryCity: () => null,
    membershipForCity: () => null,
    publicRoomsForCity: () => [],
    residents: [],
    world: null,
    memberships: [],
    currentIdentity: () => "me",
    shellPage: "admin",
    roomKind: () => "public",
    roomQuickActionContextCopy: () => "",
    roomDisplayPeer: () => "对方",
    roomPreview: () => "预览",
    translateFederationPolicy: () => "联邦策略文案",
    displayCityTitle: (city) => (city?.title || "城市"),
    ...over,
  };
}

// ====== chatDetailRoomContextModel ======

test("chatDetailContext: 无 publicRoom 时返回空治理字段 + 空 siblingRooms", () => {
  const model = chatDetailRoomContextModelForState({ id: "dm:a:b" }, deps());
  assert.equal(model.publicRoom, null);
  assert.equal(model.cityState, null);
  assert.equal(model.directoryCity, null);
  assert.equal(model.membership, null);
  assert.equal(model.cityProfile, null);
  assert.deepEqual(model.siblingRooms, []);
});

test("chatDetailContext: 有 publicRoom 时聚合 city/membership/siblings", () => {
  const publicRoom = { room_id: "r1", city_id: "c1", slug: "lobby" };
  const cityState = { profile: { title: "城A", federation_policy: "open" } };
  const directoryCity = { title: "目录城A", trust_state: "Healthy" };
  const membership = { state: "Active" };
  const d = deps({
    publicRoomRecordForConversation: () => publicRoom,
    cityStateForConversation: () => cityState,
    worldDirectoryCity: () => directoryCity,
    membershipForCity: () => membership,
    publicRoomsForCity: () => [publicRoom, { room_id: "r2", city_id: "c1" }],
  });
  const model = chatDetailRoomContextModelForState({ id: "r1" }, d);
  assert.equal(model.publicRoom.room_id, "r1");
  assert.equal(model.membership.state, "Active");
  // cityProfile 优先用 cityState.profile
  assert.equal(model.cityProfile.title, "城A");
  // siblingRooms 排除当前 room
  assert.equal(model.siblingRooms.length, 1);
  assert.equal(model.siblingRooms[0].room_id, "r2");
});

test("chatDetailContext: cityProfile 无 cityState 时回退 directoryCity", () => {
  const publicRoom = { room_id: "r1", city_id: "c1" };
  const directoryCity = { title: "目录城A" };
  const d = deps({
    publicRoomRecordForConversation: () => publicRoom,
    cityStateForConversation: () => null,
    worldDirectoryCity: () => directoryCity,
  });
  const model = chatDetailRoomContextModelForState({ id: "r1" }, d);
  assert.equal(model.cityProfile.title, "目录城A");
});

test("chatDetailContext: cityProfile 无 cityState/directory 时用 city_id 占位", () => {
  const publicRoom = { room_id: "r1", city_id: "c1" };
  const d = deps({
    publicRoomRecordForConversation: () => publicRoom,
    cityStateForConversation: () => null,
    worldDirectoryCity: () => null,
  });
  const model = chatDetailRoomContextModelForState({ id: "r1" }, d);
  assert.equal(model.cityProfile.title, "c1");
  assert.equal(model.cityProfile.slug, "c1");
});

// ====== directRoomPeerOnlineStatus ======

test("peerOnline: null room 返回 null", () => {
  assert.equal(directRoomPeerOnlineStatusForState(null, deps({ roomKind: () => "direct" })), null);
});

test("peerOnline: 非 direct 房间返回 null", () => {
  assert.equal(directRoomPeerOnlineStatusForState({ id: "r1" }, deps({ roomKind: () => "public" })), null);
});

test("peerOnline: 无 residents 返回 null", () => {
  const room = { id: "dm:me:peer", participants: ["me", "peer"] };
  assert.equal(directRoomPeerOnlineStatusForState(room, deps({ roomKind: () => "direct", residents: [] })), null);
});

test("peerOnline: 无 participants 返回 null", () => {
  const room = { id: "dm:me:peer" };
  assert.equal(directRoomPeerOnlineStatusForState(room, deps({ roomKind: () => "direct" })), null);
});

test("peerOnline: peer 在线返回 online", () => {
  const room = { id: "dm:me:peer", participants: ["me", "peer"] };
  const d = deps({ roomKind: () => "direct", residents: [{ resident_id: "peer", online: true }] });
  assert.equal(directRoomPeerOnlineStatusForState(room, d), "online");
});

test("peerOnline: peer 离线返回 offline", () => {
  const room = { id: "dm:me:peer", participants: ["me", "peer"] };
  const d = deps({ roomKind: () => "direct", residents: [{ resident_id: "peer", online: false }] });
  assert.equal(directRoomPeerOnlineStatusForState(room, d), "offline");
});

test("peerOnline: peer 不在 residents 返回 null", () => {
  const room = { id: "dm:me:peer", participants: ["me", "peer"] };
  const d = deps({ roomKind: () => "direct", residents: [{ resident_id: "other", online: true }] });
  assert.equal(directRoomPeerOnlineStatusForState(room, d), null);
});

test("peerOnline: participants 为对象数组时取 id/resident_id", () => {
  const room = { id: "dm:me:peer", participants: [{ id: "me" }, { resident_id: "peer" }] };
  const d = deps({ roomKind: () => "direct", residents: [{ resident_id: "peer", online: true }] });
  assert.equal(directRoomPeerOnlineStatusForState(room, d), "online");
});

// ====== roomContextSummary ======

test("contextSummary: null room 返回占位提示", () => {
  assert.equal(
    roomContextSummaryForState(null, deps()),
    "打开一个会话后，这里会显示上下文摘要。",
  );
});

test("contextSummary: 有 actionCopy 时前缀拼接", () => {
  const d = deps({ roomQuickActionContextCopy: () => "委托进行中" });
  const room = { id: "r1", scene_summary: "场景摘要" };
  assert.equal(roomContextSummaryForState(room, d), "委托进行中 · 场景摘要");
});

test("contextSummary: 无 actionCopy 有 context_summary 字段时用字段", () => {
  const room = { id: "r1", context_summary: "  自定义上下文  " };
  assert.equal(roomContextSummaryForState(room, deps()), "自定义上下文");
});

test("contextSummary: actionCopy 优先于 context_summary 字段", () => {
  const d = deps({ roomQuickActionContextCopy: () => "动作" });
  const room = { id: "r1", context_summary: "字段", scene_summary: "场景" };
  assert.equal(roomContextSummaryForState(room, d), "动作 · 场景");
});

test("contextSummary: 无 actionCopy/字段时用 scene_summary", () => {
  const room = { id: "r1", scene_summary: "  场景摘要  " };
  assert.equal(roomContextSummaryForState(room, deps()), "场景摘要");
});

test("contextSummary: 无 scene_summary 时用 publicRoom.description", () => {
  const d = deps({ publicRoomRecordForConversation: () => ({ description: "  公开房间描述  " }) });
  assert.equal(roomContextSummaryForState({ id: "r1" }, d), "公开房间描述");
});

test("contextSummary: direct 房间无描述时用 roomDisplayPeer 拼接", () => {
  const d = deps({ roomKind: () => "direct", roomDisplayPeer: () => "爱丽丝" });
  assert.equal(roomContextSummaryForState({ id: "dm:me:a" }, d), "直接和 爱丽丝 继续一对一沟通。");
});

test("contextSummary: direct 房间有 overview_summary 优先", () => {
  const d = deps({ roomKind: () => "direct" });
  const room = { id: "dm:me:a", overview_summary: "已有概览" };
  assert.equal(roomContextSummaryForState(room, d), "已有概览");
});

test("contextSummary: public 房间无描述时用 roomPreview 回退", () => {
  const d = deps({ roomKind: () => "public", roomPreview: () => "预览文案" });
  assert.equal(roomContextSummaryForState({ id: "r1" }, d), "预览文案");
});

// ====== roomRouteLabel ======

test("routeLabel: null room 返回等待连接", () => {
  assert.equal(roomRouteLabelForState(null, deps()), "等待连接");
});

test("routeLabel: 有 route_label 字段优先", () => {
  assert.equal(roomRouteLabelForState({ id: "r1", route_label: "  自定义路由  " }, deps()), "自定义路由");
});

test("routeLabel: public 房间冻结时返回房间已冻结", () => {
  const d = deps({
    roomKind: () => "public",
    publicRoomRecordForConversation: () => ({ frozen: true }),
  });
  assert.equal(roomRouteLabelForState({ id: "r1" }, d), "房间已冻结");
});

test("routeLabel: public 有 federation 返回翻译文案", () => {
  const d = deps({
    roomKind: () => "public",
    cityStateForConversation: () => ({ profile: { federation_policy: "open" } }),
    translateFederationPolicy: () => "开放联邦",
  });
  assert.equal(roomRouteLabelForState({ id: "r1" }, d), "开放联邦");
});

test("routeLabel: public 无 federation user 页返回城镇频道可发言", () => {
  const d = deps({ roomKind: () => "public", shellPage: "user" });
  assert.equal(roomRouteLabelForState({ id: "r1" }, d), "城镇频道可发言");
});

test("routeLabel: public 无 federation admin 页返回房间可发言", () => {
  const d = deps({ roomKind: () => "public", shellPage: "admin" });
  assert.equal(roomRouteLabelForState({ id: "r1" }, d), "房间可发言");
});

test("routeLabel: direct user 页 world 允许跨城私信", () => {
  const d = deps({ roomKind: () => "direct", shellPage: "user", world: { allows_cross_city_private_messages: true } });
  assert.equal(roomRouteLabelForState({ id: "dm:a:b" }, d), "居民私信已连通");
});

test("routeLabel: direct user 页 world 不允许跨城私信", () => {
  const d = deps({ roomKind: () => "direct", shellPage: "user", world: { allows_cross_city_private_messages: false } });
  assert.equal(roomRouteLabelForState({ id: "dm:a:b" }, d), "居民私信待网关确认");
});

test("routeLabel: direct admin 页 world 允许跨城私信", () => {
  const d = deps({ roomKind: () => "direct", shellPage: "admin", world: { allows_cross_city_private_messages: true } });
  assert.equal(roomRouteLabelForState({ id: "dm:a:b" }, d), "跨城私信已开启");
});

test("routeLabel: system user 页返回城门消息同步", () => {
  const d = deps({ roomKind: () => "system", shellPage: "user" });
  assert.equal(roomRouteLabelForState({ id: "sys" }, d), "城门消息同步");
});

test("routeLabel: system admin 页返回系统状态同步", () => {
  const d = deps({ roomKind: () => "system", shellPage: "admin" });
  assert.equal(roomRouteLabelForState({ id: "sys" }, d), "系统状态同步");
});

// ====== roomMemberCount ======

test("memberCount: 显式 member_count 优先", () => {
  assert.equal(roomMemberCountForState({ id: "r1", member_count: 5 }, deps()), 5);
});

test("memberCount: member_count=0 不用显式值", () => {
  assert.equal(roomMemberCountForState({ id: "r1", member_count: 0 }, deps()), 1);
});

test("memberCount: public 房间用 governance memberships 活跃数", () => {
  const d = deps({
    roomKind: () => "public",
    publicRoomRecordForConversation: () => ({ city_id: "c1" }),
    memberships: [
      { city_id: "c1", state: "Active" },
      { city_id: "c1", state: "Active" },
      { city_id: "c1", state: "Pending" },
      { city_id: "c2", state: "Active" },
    ],
  });
  assert.equal(roomMemberCountForState({ id: "r1" }, d), 2);
});

test("memberCount: public 无活跃成员时回退 participants", () => {
  const d = deps({
    roomKind: () => "public",
    publicRoomRecordForConversation: () => ({ city_id: "c1" }),
    memberships: [],
    currentIdentity: () => "me",
  });
  const room = { id: "r1", messages: [{ sender: "a" }, { sender: "b" }] };
  assert.equal(roomMemberCountForState(room, d), 3); // a + b + me
});

test("memberCount: 无 publicRoom 时用 messages participants + identity", () => {
  const d = deps({ currentIdentity: () => "me" });
  const room = { id: "dm:me:x", messages: [{ sender: "x" }] };
  assert.equal(roomMemberCountForState(room, d), 2); // x + me
});

test("memberCount: 无 participants 且无 identity 时 direct 返回 2 public 返回 1", () => {
  const noId = deps({ currentIdentity: () => "" });
  assert.equal(roomMemberCountForState({ id: "dm:a:b" }, { ...noId, roomKind: () => "direct" }), 2);
  assert.equal(roomMemberCountForState({ id: "r1" }, { ...noId, roomKind: () => "public" }), 1);
});

// ====== roomAudienceLabel ======

test("audienceLabel: null room 返回未选会话", () => {
  assert.equal(roomAudienceLabelForState(null, deps()), "未选会话");
});

test("audienceLabel: direct 用 participant_label 优先", () => {
  const d = deps({ roomKind: () => "direct" });
  assert.equal(roomAudienceLabelForState({ id: "dm:a:b", participant_label: "你与 爱丽丝" }, d), "你与 爱丽丝");
});

test("audienceLabel: direct 无 label 时用 roomDisplayPeer 拼接", () => {
  const d = deps({ roomKind: () => "direct", roomDisplayPeer: () => "鲍勃" });
  assert.equal(roomAudienceLabelForState({ id: "dm:a:b" }, d), "你与 鲍勃");
});

test("audienceLabel: public 有 publicRoom 时用城市标题·slug", () => {
  const d = deps({
    roomKind: () => "public",
    publicRoomRecordForConversation: () => ({ city_id: "c1", slug: "lobby" }),
    cityStateForConversation: () => ({ profile: { title: "城A" } }),
    displayCityTitle: (city) => city?.title || "城市",
  });
  assert.equal(roomAudienceLabelForState({ id: "r1" }, d), "城A · lobby");
});

test("audienceLabel: public 无 cityState 时用 worldDirectoryCity 回退", () => {
  const d = deps({
    roomKind: () => "public",
    publicRoomRecordForConversation: () => ({ city_id: "c1", room_id: "r1" }),
    cityStateForConversation: () => null,
    worldDirectoryCity: () => ({ title: "目录城A" }),
    displayCityTitle: (city) => city?.title || "城市",
  });
  assert.equal(roomAudienceLabelForState({ id: "r1" }, d), "目录城A · r1");
});

test("audienceLabel: public 无 publicRoom 时用 participant_label 或公开频道", () => {
  const d = deps({ roomKind: () => "public" });
  assert.equal(roomAudienceLabelForState({ id: "r1", participant_label: "自定义" }, d), "自定义");
  assert.equal(roomAudienceLabelForState({ id: "r1" }, d), "公开频道");
});

test("audienceLabel: system 用 participant_label 或系统会话", () => {
  const d = deps({ roomKind: () => "system" });
  assert.equal(roomAudienceLabelForState({ id: "sys", participant_label: "系统" }, d), "系统");
  assert.equal(roomAudienceLabelForState({ id: "sys" }, d), "系统会话");
});
