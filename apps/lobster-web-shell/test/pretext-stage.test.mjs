import test from "node:test";
import assert from "node:assert/strict";

import {
  buildStageTextModel,
  buildPortraitTextModel,
  buildRoomVisualModel,
  renderStageCanvas,
  renderPortraitCanvas,
  stageVariantForRoom,
} from "../pretext-stage.js";

test("stageVariantForRoom maps direct conversations to the home scene", () => {
  assert.equal(stageVariantForRoom({ id: "dm:tiyan:guide" }), "home");
  assert.equal(stageVariantForRoom({ id: "room:world:lobby" }), "city");
  assert.equal(stageVariantForRoom(null), "city");
});

test("buildStageTextModel derives a stable city/home text payload", () => {
  const city = buildStageTextModel(
    {
      id: "room:world:lobby",
      title: "第一城大厅",
      scene_summary: "公告和跨城讨论会先落在这里。",
    },
  );
  const home = buildStageTextModel(
    {
      id: "dm:tiyan:guide",
      title: "私信 · guide",
      scene_summary: "回到住处后继续一对一交谈。",
    },
  );

  assert.equal(city.variant, "city");
  assert.equal(city.kicker, "城市 / 公共频道");
  assert.match(city.summary, /公告和跨城讨论/);

  assert.equal(home.variant, "home");
  assert.equal(home.kicker, "住宅 / 私聊");
  assert.match(home.summary, /一对一/);
});

test("buildRoomVisualModel returns paired stage and portrait payloads", () => {
  const visual = buildRoomVisualModel(
    {
      id: "dm:tiyan:guide",
      title: "私信 · guide",
      scene_summary: "回到住处后继续一对一交谈。",
      scene_banner: "直接协作",
      member_count: 2,
      caretaker: {
        name: "旺财",
        role_label: "房间管家",
        status: "在线值守",
        pending_visitors: 2,
      },
    },
    undefined,
    {
      title: "guide 头像",
      summary: "给出下一步建议。",
    },
  );

  assert.equal(visual.stage.variant, "home");
  assert.equal(visual.stage.kicker, "住宅 / 私聊");
  assert.equal(visual.stage.title, "私信 · guide");
  assert.match(visual.stage.summary, /一对一/);
  assert.equal(visual.stage.visual.motif, "courtyard");
  assert.equal(visual.stage.visual.badge, "直接协作");
  assert.equal(visual.stage.visual.signalCount, 2);

  assert.equal(visual.portrait.variant, "home");
  assert.equal(visual.portrait.kicker, "人物 / 头像");
  assert.equal(visual.portrait.title, "guide 头像");
  assert.equal(visual.portrait.summary, "给出下一步建议。");
  assert.equal(visual.portrait.visual.motif, "caretaker");
  assert.equal(visual.portrait.visual.monogram, "G");
  assert.equal(visual.portrait.visual.badge, "房间管家");
  assert.equal(visual.portrait.visual.signalCount, 2);
});

test("buildPortraitTextModel resolves portrait copy with room fallback", () => {
  const portrait = buildPortraitTextModel(
    {
      id: "room:world:lobby",
      title: "第一城大厅",
      scene_summary: "公告和跨城讨论会先落在这里。",
    },
    {
      name: "阿洛",
      bio: "负责把消息解释成下一步动作。",
    },
  );

  assert.equal(portrait.variant, "city");
  assert.equal(portrait.kicker, "人物 / 头像");
  assert.equal(portrait.title, "阿洛");
  assert.equal(portrait.summary, "负责把消息解释成下一步动作。");
});

test("renderStageCanvas no-ops without canvas context support", () => {
  const result = renderStageCanvas(
    {},
    buildStageTextModel({ id: "room:world:lobby", title: "第一城大厅" }),
  );

  assert.equal(result, false);
});

test("renderStageCanvas uses injected Pretext layout and draws title plus summary", () => {
  const calls = [];
  const ctx = {
    clearRect: (...args) => calls.push(["clearRect", ...args]),
    fillRect: (...args) => calls.push(["fillRect", ...args]),
    fillText: (...args) => calls.push(["fillText", ...args]),
    beginPath: (...args) => calls.push(["beginPath", ...args]),
    closePath: (...args) => calls.push(["closePath", ...args]),
    arc: (...args) => calls.push(["arc", ...args]),
    fill: (...args) => calls.push(["fill", ...args]),
    stroke: (...args) => calls.push(["stroke", ...args]),
    setTransform: (...args) => calls.push(["setTransform", ...args]),
    scale: (...args) => calls.push(["scale", ...args]),
  };
  const canvas = {
    width: 0,
    height: 0,
    clientWidth: 360,
    dataset: {},
    getContext(type) {
      assert.equal(type, "2d");
      return ctx;
    },
  };
  const deps = {
    devicePixelRatio: 1,
    prepareWithSegments(text, font) {
      return { text, font };
    },
    layoutWithLines(prepared) {
      if (prepared.text === "第一城大厅") {
        return {
          height: 28,
          lineCount: 1,
          lines: [{ text: "第一城大厅", width: 160 }],
        };
      }
      return {
        height: 44,
        lineCount: 2,
        lines: [
          { text: "公告和跨城讨论", width: 180 },
          { text: "会先落在这里。", width: 156 },
        ],
      };
    },
  };

  const result = renderStageCanvas(
    canvas,
    buildRoomVisualModel(
      {
        id: "room:world:lobby",
        title: "第一城大厅",
        scene_summary: "公告和跨城讨论会先落在这里。",
        scene_banner: "公共频道",
        member_count: 12,
      },
      undefined,
      { title: "巡逻犬", summary: "只在需要时出来提醒。" },
    ).stage,
    deps,
  );

  assert.equal(result, true);
  assert.ok(canvas.height > 0);
  assert.equal(canvas.dataset.kind, "stage");
  assert.equal(canvas.dataset.motif, "watchtower");
  assert.ok(calls.some((entry) => entry[0] === "arc"));
  const texts = calls.filter((entry) => entry[0] === "fillText").map((entry) => entry[1]);
  assert.ok(texts.includes("第一城大厅"));
  assert.ok(texts.includes("公告和跨城讨论"));
  assert.ok(texts.includes("会先落在这里。"));
  assert.ok(texts.includes("公共频道"));
});

test("renderPortraitCanvas uses injected Pretext layout and draws portrait copy", () => {
  const calls = [];
  const ctx = {
    clearRect: (...args) => calls.push(["clearRect", ...args]),
    fillRect: (...args) => calls.push(["fillRect", ...args]),
    fillText: (...args) => calls.push(["fillText", ...args]),
    beginPath: (...args) => calls.push(["beginPath", ...args]),
    closePath: (...args) => calls.push(["closePath", ...args]),
    arc: (...args) => calls.push(["arc", ...args]),
    fill: (...args) => calls.push(["fill", ...args]),
    stroke: (...args) => calls.push(["stroke", ...args]),
    setTransform: (...args) => calls.push(["setTransform", ...args]),
    scale: (...args) => calls.push(["scale", ...args]),
  };
  const canvas = {
    width: 0,
    height: 0,
    clientWidth: 320,
    dataset: {},
    getContext(type) {
      assert.equal(type, "2d");
      return ctx;
    },
  };
  const deps = {
    devicePixelRatio: 1,
    prepareWithSegments(text, font) {
      return { text, font };
    },
    layoutWithLines(prepared) {
      if (prepared.text === "阿洛") {
        return {
          height: 24,
          lineCount: 1,
          lines: [{ text: "阿洛", width: 64 }],
        };
      }
      return {
        height: 40,
        lineCount: 2,
        lines: [
          { text: "负责把消息解释成", width: 176 },
          { text: "下一步动作。", width: 120 },
        ],
      };
    },
  };

  const result = renderPortraitCanvas(
    canvas,
    buildRoomVisualModel(
      {
        id: "room:world:lobby",
        title: "第一城大厅",
        scene_banner: "公共频道",
        caretaker: {
          role_label: "频道巡视",
          status: "低打扰巡视",
          pending_visitors: 1,
        },
      },
      undefined,
      { name: "阿洛", bio: "负责把消息解释成下一步动作。" },
    ).portrait,
    deps,
  );

  assert.equal(result, true);
  assert.ok(canvas.height > 0);
  assert.equal(canvas.dataset.kind, "portrait");
  assert.equal(canvas.dataset.motif, "sentinel");
  assert.equal(canvas.dataset.monogram, "阿");
  assert.ok(calls.some((entry) => entry[0] === "arc"));
  const texts = calls.filter((entry) => entry[0] === "fillText").map((entry) => entry[1]);
  assert.ok(texts.includes("阿洛"));
  assert.ok(texts.includes("负责把消息解释成"));
  assert.ok(texts.includes("下一步动作。"));
  assert.ok(texts.includes("频道巡视"));
});
