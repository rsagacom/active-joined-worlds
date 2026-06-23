// shell-caretaker-panel.test.mjs — 非居民页管家面板纯规格测试
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  caretakerPanelModel,
  caretakerStatusItems,
} from "../shell-caretaker-panel.js";

test("caretakerPanelModel: exposes panel title, profile, messages and rules", () => {
  assert.deepEqual(caretakerPanelModel(), {
    title: "OpenClaw 管家 · 小狗",
    profile: {
      displayName: "OpenClaw 小狗管家",
      status: "巡检中 · 3/5 例行巡视",
      summary:
        "我会守住你的会话、记录访客留言，并把自动回复规则写在聊天区下方，确保你随时知道谁在呼叫。",
      highlight: "自动提醒 · 访客留言 · /assistant 召唤",
    },
    messages: [
      {
        title: "访客留言",
        detail: "访客「阿初」在世界广场问：今晚还要再跑一次设备配置吗？",
        time: "1 分钟前",
      },
      {
        title: "提醒",
        detail: "你刚才提到 `/assistant`，我会自动回复「小狗在」并准备访客卡片。",
        time: "刚刚",
      },
    ],
    rulesTitle: "自动回复 / 留言规则",
    rules: [
      "会话空闲 5 分钟自动回复「小狗在，继续说吧」，并通知你有人等候。",
      "提到 `/owner` 或 `/assistant` 时记录访客留言并同步给待办。",
    ],
  });
});

test("caretakerStatusItems: builds stable status line rows", () => {
  assert.deepEqual(caretakerStatusItems({ roomLabel: "世界广场" }), [
    { element: "strong", text: "OpenClaw 小狗管家" },
    { element: "span", text: "巡检中 · 3/5 例行巡视" },
    { element: "span", className: "caretaker-status-item", text: "世界广场" },
    {
      element: "span",
      className: "caretaker-status-item",
      text: "规则：会话空闲 5 分钟自动回复「小狗在，继续说吧」，并通知你有人等候。",
    },
    {
      element: "span",
      className: "caretaker-status-item",
      text: "留言：访客「阿初」在世界广场问：今晚还要再跑一次设备配置吗？",
    },
  ]);
});
