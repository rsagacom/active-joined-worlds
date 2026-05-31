import assert from "node:assert/strict";
import test from "node:test";
import {
  caretakerNotificationCount,
  caretakerPendingCount,
  caretakerProfile,
  caretakerStatusLine,
  detailCardProfile,
  inlineActionProfile,
  inlineActionProfiles,
  portraitProjection,
  stageProjection,
  workflowProfile,
} from "../shell-room-profiles.js";

const room = {
  caretaker: {
    name: "值守员",
    status: "在线",
    pending_visitors: 2,
    notifications: ["a", "b"],
    patrol: { mode: "轻巡视", last_check: "刚刚" },
  },
  detail_card: { title: "详情" },
  stage_projection: { summary: "舞台" },
  portrait_projection: { title: "画像" },
  workflow: { action: "approve" },
  inline_actions: [null, { role: "primary", label: "处理" }, { role: "secondary", label: "查看" }],
};

test("room profile helpers expose only structured room projections", () => {
  assert.equal(caretakerProfile(room), room.caretaker);
  assert.equal(detailCardProfile(room), room.detail_card);
  assert.equal(stageProjection(room), room.stage_projection);
  assert.equal(portraitProjection(room), room.portrait_projection);
  assert.equal(workflowProfile(room), room.workflow);
  assert.equal(caretakerProfile({ caretaker: "bad" }), null);
  assert.equal(detailCardProfile(null), null);
});

test("inline action helpers filter empty entries and select by role", () => {
  assert.deepEqual(inlineActionProfiles(room).map((item) => item.role), ["primary", "secondary"]);
  assert.equal(inlineActionProfile(room, "primary")?.label, "处理");
  assert.equal(inlineActionProfile(room, "missing"), null);
});

test("caretaker counters and status line keep stable fallbacks", () => {
  assert.equal(caretakerPendingCount(room), 2);
  assert.equal(caretakerNotificationCount(room), 2);
  assert.equal(caretakerStatusLine(room), "在线 · 轻巡视 · 刚刚");
  assert.equal(caretakerPendingCount({ caretaker: { messages: [{}, {}, {}] } }), 3);
  assert.equal(caretakerNotificationCount({ caretaker: {} }), 0);
  assert.equal(caretakerStatusLine({ caretaker: {} }), "在线值守");
  assert.equal(caretakerStatusLine({}), "未植入");
});
