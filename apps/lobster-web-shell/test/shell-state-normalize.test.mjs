import assert from "node:assert/strict";
import test from "node:test";
import {
  contractConversationMap,
  governanceFromWorldApiPayload,
  governanceFromWorldSnapshotBundle,
  mergeRoomWithContract,
  synthesizeRoomsFromContracts,
} from "../shell-state-normalize.js";

// Stub normalizeShellMessages — called by the module under test via shell-payload.js
// The test verifies contractConversationMap / mergeRoomWithContract pass-through,
// not the normalizeShellMessages implementation itself.

test("contractConversationMap builds a Map keyed by conversation_id", () => {
  const payload = {
    conversation_shell: {
      conversations: [
        { conversation_id: "room:lobby", title: "大厅" },
        { conversation_id: "dm:alice", title: "Alice" },
      ],
    },
    scene_render: { scenes: [] },
  };
  const map = contractConversationMap(payload);
  assert.equal(map instanceof Map, true);
  assert.equal(map.size, 2);
  assert.equal(map.get("room:lobby").title, "大厅");
  assert.equal(map.get("dm:alice").id, "dm:alice");
});

test("contractConversationMap merges scene fields into each room", () => {
  const payload = {
    conversation_shell: {
      conversations: [{ conversation_id: "room:garden", title: "花园" }],
    },
    scene_render: {
      scenes: [{ conversation_id: "room:garden", scene_banner: "欢迎", room_variant: "creative" }],
    },
  };
  const map = contractConversationMap(payload);
  const room = map.get("room:garden");
  assert.equal(room.scene_banner, "欢迎");
  assert.equal(room.room_variant, "creative");
});

test("contractConversationMap handles empty payload gracefully", () => {
  const map = contractConversationMap({});
  assert.equal(map instanceof Map, true);
  assert.equal(map.size, 0);

  const map2 = contractConversationMap(null);
  assert.equal(map2.size, 0);
});

test("contractConversationMap normalizes inline_actions to array", () => {
  const payload = {
    conversation_shell: {
      conversations: [
        { conversation_id: "room:test", inline_actions: null },
        { conversation_id: "room:test2", inline_actions: [{ label: "审核" }] },
      ],
    },
    scene_render: { scenes: [] },
  };
  const map = contractConversationMap(payload);
  assert.deepEqual(map.get("room:test").inline_actions, []);
  assert.equal(map.get("room:test2").inline_actions.length, 1);
});

test("mergeRoomWithContract applies contract defaults when room is empty", () => {
  const room = {};
  const contract = { id: "r1", title: "合同标题", member_count: 5 };
  const merged = mergeRoomWithContract(room, contract);
  assert.equal(merged.id, "r1");
  assert.equal(merged.title, "合同标题");
  assert.equal(merged.member_count, 5);
  assert.equal(merged.subtitle, "");
});

test("mergeRoomWithContract prefers contract fields, falls back to room", () => {
  const room = { id: "room-wins", title: "房间标题" };
  const contract = { id: "contract", title: "合同标题" };
  const merged = mergeRoomWithContract(room, contract);
  assert.equal(merged.id, "room-wins");
  assert.equal(merged.title, "合同标题");
});

test("mergeRoomWithContract falls back to room title when contract title is empty", () => {
  const room = { id: "r1", title: "房间标题" };
  const contract = { id: "c1", title: "" };
  const merged = mergeRoomWithContract(room, contract);
  assert.equal(merged.title, "房间标题");
});

test("mergeRoomWithContract handles missing contract", () => {
  const room = { id: "r1", messages: [] };
  const merged = mergeRoomWithContract(room, null);
  assert.equal(merged.id, "r1");
  assert.ok(Array.isArray(merged.messages));
});

test("synthesizeRoomsFromContracts converts contract map to room array", () => {
  const payload = {
    conversation_shell: {
      conversations: [{ conversation_id: "room:a" }, { conversation_id: "room:b" }],
    },
    scene_render: { scenes: [] },
  };
  const rooms = synthesizeRoomsFromContracts(payload);
  assert.equal(rooms.length, 2);
  assert.equal(rooms[0].id, "room:a");
  assert.equal(rooms[1].id, "room:b");
});

test("governanceFromWorldSnapshotBundle maps snapshot payload and world extensions", () => {
  const bundle = {
    payload: {
      governance: {
        world: { id: "world", title: "龙虾镇" },
        portability: { enabled: true },
        cities: [{ city_id: "main" }],
        memberships: [{ resident_id: "alice" }],
        public_rooms: [{ id: "room:lobby" }],
      },
      residents: [{ id: "alice" }],
      directory: { city_count: 1 },
      mirror_sources: [{ city_id: "mirror" }],
      square: [{ id: "notice-1" }],
      safety: { steward_count: 2 },
    },
  };

  assert.deepEqual(governanceFromWorldSnapshotBundle(bundle), {
    world: { id: "world", title: "龙虾镇" },
    portability: { enabled: true },
    cities: [{ city_id: "main" }],
    memberships: [{ resident_id: "alice" }],
    public_rooms: [{ id: "room:lobby" }],
    residents: [{ id: "alice" }],
    world_directory: { city_count: 1 },
    world_mirror_sources: [{ city_id: "mirror" }],
    world_square: [{ id: "notice-1" }],
    world_safety: { steward_count: 2 },
  });
});

test("governanceFromWorldSnapshotBundle returns null without a world and defaults arrays", () => {
  assert.equal(governanceFromWorldSnapshotBundle({ payload: { governance: {} } }), null);

  assert.deepEqual(
    governanceFromWorldSnapshotBundle({
      payload: {
        governance: { world: { id: "world" } },
        residents: null,
        mirror_sources: null,
        square: null,
      },
    }),
    {
      world: { id: "world" },
      portability: undefined,
      cities: [],
      memberships: [],
      public_rooms: [],
      residents: [],
      world_directory: null,
      world_mirror_sources: [],
      world_square: [],
      world_safety: null,
    },
  );
});

test("governanceFromWorldApiPayload maps legacy world and resident responses", () => {
  assert.equal(governanceFromWorldApiPayload({}, []), null);

  assert.deepEqual(
    governanceFromWorldApiPayload(
      {
        world: { id: "world", title: "龙虾镇" },
        portability: { enabled: false },
        cities: [{ city_id: "main" }],
        memberships: [{ resident_id: "bob" }],
        public_rooms: [{ id: "room:lobby" }],
      },
      [{ id: "bob" }],
    ),
    {
      world: { id: "world", title: "龙虾镇" },
      portability: { enabled: false },
      cities: [{ city_id: "main" }],
      memberships: [{ resident_id: "bob" }],
      public_rooms: [{ id: "room:lobby" }],
      residents: [{ id: "bob" }],
      world_directory: null,
      world_mirror_sources: [],
      world_square: [],
      world_safety: null,
    },
  );
});
