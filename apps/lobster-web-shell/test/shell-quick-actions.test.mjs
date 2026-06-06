// shell-quick-actions.test.mjs — Quick Action runtime helpers
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  quickActionStructuredDraft,
  resetRoomQuickActions,
  setStateGetter,
} from "../shell-quick-actions.js";

test("quickActionStructuredDraft: 结构字段生成可发送草稿", () => {
  setStateGetter(() => ({}));
  const draft = quickActionStructuredDraft({
    action: "整理",
    fields: [
      { label: "- 目标：", value: "收拢主线" },
      { label: "风险", value: "并发改动" },
    ],
    notes: ["备注：先小步拆分"],
  });

  assert.equal(
    draft,
    "整理：\n- 目标：收拢主线\n- 风险：并发改动\n备注：先小步拆分",
  );
});

test("quickActionStructuredDraft: 空结构回退到默认模板", () => {
  setStateGetter(() => ({}));

  assert.equal(quickActionStructuredDraft(null, "交易"), "交易：\n- 标的：\n- 数量：\n- 备注：");
});

test("quickActionStructuredDraft: 空结构优先回退到合同模板", () => {
  setStateGetter(() => ({
    conversation_shell: {
      action_templates: [
        {
          action: "委托",
          draft_template: "委托：\n- 需求：\n- 截止：",
        },
      ],
    },
  }));

  assert.equal(quickActionStructuredDraft(null, "委托"), "委托：\n- 需求：\n- 截止：");
  resetRoomQuickActions();
  setStateGetter(() => ({}));
});
