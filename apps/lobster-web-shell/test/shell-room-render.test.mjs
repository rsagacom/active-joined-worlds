import test from "node:test";
import assert from "node:assert/strict";
import {
  composerHeroChipsData,
  composerHeroKicker,
  composerHeroNote,
  composerHeroTitle,
  composerMetaBaseStatus,
  composerMetaQuickHint,
  roomLastActivity,
  roomPreview,
} from "../shell-room-render.js";

const serial = { concurrency: false };

// ====== composerMetaBaseStatus ======

test("composerMetaBaseStatus: 无房间返回先打开会话", serial, () => {
  assert.equal(composerMetaBaseStatus(null, null, false, false), "先打开会话");
});

test("composerMetaBaseStatus: 发送错误", serial, () => {
  assert.equal(composerMetaBaseStatus({ id: "r1" }, "网络错误", false, false), "待修改后重发");
});

test("composerMetaBaseStatus: 发送中", serial, () => {
  assert.equal(composerMetaBaseStatus({ id: "r1" }, null, true, false), "发送中");
});

test("composerMetaBaseStatus: 有草稿", serial, () => {
  assert.equal(composerMetaBaseStatus({ id: "r1" }, null, false, true), "草稿已保存");
});

test("composerMetaBaseStatus: 正常可发送", serial, () => {
  assert.equal(composerMetaBaseStatus({ id: "r1" }, null, false, false), "可直接发送");
});

// ====== composerMetaQuickHint ======

test("composerMetaQuickHint: admin 模式", serial, () => {
  assert.equal(composerMetaQuickHint("admin"), "更多 · 刷新");
});

test("composerMetaQuickHint: 非 admin 模式", serial, () => {
  assert.equal(composerMetaQuickHint("world"), "广场 · 刷新");
  assert.equal(composerMetaQuickHint("user"), "广场 · 刷新");
});

// ====== composerHeroKicker ======

test("composerHeroKicker: admin 页面", serial, () => {
  assert.equal(composerHeroKicker("admin"), "管理后台消息区");
});

test("composerHeroKicker: user 页面", serial, () => {
  assert.equal(composerHeroKicker("user"), "房间内聊天主界面");
});

test("composerHeroKicker: 其他页面", serial, () => {
  assert.equal(composerHeroKicker("world"), "城市外世界页");
});

// ====== composerHeroTitle ======

test("composerHeroTitle: 无房间 user 页", serial, () => {
  assert.equal(composerHeroTitle(null, "user", "", "", ""), "先选房间");
});

test("composerHeroTitle: 无房间 admin 页", serial, () => {
  assert.equal(composerHeroTitle(null, "admin", "", "", ""), "先选会话");
});

test("composerHeroTitle: admin 有房间", serial, () => {
  assert.equal(
    composerHeroTitle({ id: "r1" }, "admin", "测试会话", "", "public"),
    "发消息到 测试会话",
  );
});

test("composerHeroTitle: direct 房间", serial, () => {
  const room = { thread_headline: "", peer_label: "", participant_label: "张三" };
  assert.equal(
    composerHeroTitle(room, "user", "", "李四", "direct"),
    "发消息给 张三",
  );
});

test("composerHeroTitle: direct 房间 fallback 到 displayPeer", serial, () => {
  const room = { thread_headline: "", peer_label: "", participant_label: "" };
  assert.equal(
    composerHeroTitle(room, "user", "", "李四", "direct"),
    "发消息给 李四",
  );
});

test("composerHeroTitle: public 房间", serial, () => {
  assert.equal(
    composerHeroTitle({ id: "r1" }, "user", "大厅", "", "public"),
    "发消息到 大厅",
  );
});

// ====== composerHeroNote ======

test("composerHeroNote: 无房间 admin", serial, () => {
  assert.equal(composerHeroNote(null, "admin"), "先选会话，再把记录和跟进像聊天一样写下。");
});

test("composerHeroNote: 无房间 user", serial, () => {
  assert.equal(composerHeroNote(null, "user"), "先选会话，房间内聊天主界面才会点亮。");
});

test("composerHeroNote: 无房间 world", serial, () => {
  assert.equal(composerHeroNote(null, "world"), "先选会话，再开始发消息。");
});

test("composerHeroNote: 有房间 admin", serial, () => {
  assert.equal(composerHeroNote({ id: "r1" }, "admin"), "这里优先写记录和跟进，手感仍然像聊天一样顺手。");
});

test("composerHeroNote: 有房间 user", serial, () => {
  assert.equal(
    composerHeroNote({ id: "r1" }, "user"),
    "这里就是房间内聊天主界面的输入框，Enter 发送，Shift+Enter 换行。",
  );
});

test("composerHeroNote: 有房间 world", serial, () => {
  assert.equal(
    composerHeroNote({ id: "r1" }, "world"),
    "这里就是当前会话的输入框，Enter 发送，Shift+Enter 换行。",
  );
});

// ====== composerHeroChipsData ======

test("composerHeroChipsData: 无房间 无网关", serial, () => {
  const chips = composerHeroChipsData(null, "admin", "", "", 0, 0, false, "");
  assert.equal(chips.length, 1);
  assert.equal(chips[0].text, "等待网关");
  assert.equal(chips[0].tone, "muted");
});

test("composerHeroChipsData: 无房间 有网关", serial, () => {
  const chips = composerHeroChipsData(null, "admin", "", "", 0, 0, false, "http://gw");
  assert.equal(chips.length, 1);
  assert.equal(chips[0].text, "等待会话");
});

test("composerHeroChipsData: public 房间 admin", serial, () => {
  const chips = composerHeroChipsData({ id: "r1" }, "admin", "public", "同步中", 0, 0, true, "http://gw");
  assert.equal(chips.length, 3);
  assert.equal(chips[0].text, "public");
  assert.equal(chips[0].tone, "muted");
  assert.equal(chips[1].text, "同步中");
  assert.equal(chips[1].tone, "warm");
  assert.equal(chips[2].text, "当前窗口可继续记录");
  assert.equal(chips[2].tone, "muted");
});

test("composerHeroChipsData: direct 房间 admin 有待跟进", serial, () => {
  const chips = composerHeroChipsData({ id: "r1" }, "admin", "direct", "已同步", 3, 0, false, "http://gw");
  assert.equal(chips.length, 3);
  assert.equal(chips[0].text, "direct");
  assert.equal(chips[0].tone, "accent");
  assert.equal(chips[2].text, "3 条待跟进");
  assert.equal(chips[2].tone, "warm");
});

test("composerHeroChipsData: public 房间 user 有未读", serial, () => {
  const chips = composerHeroChipsData({ id: "r1" }, "user", "public", "已同步", 0, 5, false, "http://gw");
  assert.equal(chips.length, 3);
  assert.equal(chips[2].text, "5 条未读");
  assert.equal(chips[2].tone, "warm");
});

test("composerHeroChipsData: public 房间 user 无未读", serial, () => {
  const chips = composerHeroChipsData({ id: "r1" }, "user", "public", "已同步", 0, 0, false, "http://gw");
  assert.equal(chips.length, 3);
  assert.equal(chips[2].text, "当前已读");
  assert.equal(chips[2].tone, "muted");
});

// ====== roomPreview ======

test("roomPreview: structured preview field 优先", serial, () => {
  const room = { preview_text: "预览文本" };
  const result = roomPreview(
    room,
    () => ({ structured: { fields: [{ label: "主题", value: "测试" }] } }),
    () => null,
    (structured) => structured?.fields?.[0]?.value,
  );
  assert.equal(result, "测试");
});

test("roomPreview: preview_text 次优先", serial, () => {
  const room = { preview_text: "  预览文本  " };
  const result = roomPreview(room, () => null, () => null, () => null);
  assert.equal(result, "预览文本");
});

test("roomPreview: 最新消息 fallback", serial, () => {
  const room = {};
  const result = roomPreview(room, () => null, () => ({ text: "最新消息" }), () => null);
  assert.equal(result, "最新消息");
});

test("roomPreview: 完全无内容返回默认文本", serial, () => {
  const room = {};
  const result = roomPreview(room, () => null, () => null, () => null);
  assert.equal(result, "还没有消息，先发第一句吧。");
});

// ====== roomLastActivity ======

test("roomLastActivity: last_activity_label 优先", serial, () => {
  const room = { last_activity_label: "  刚刚  " };
  const result = roomLastActivity(room, () => null);
  assert.equal(result, "刚刚");
});

test("roomLastActivity: pending 消息显示待同步", serial, () => {
  const room = {};
  const result = roomLastActivity(room, () => ({ sender: "user", pending: true, timestamp: "10:00" }));
  assert.equal(result, "user · 待同步");
});

test("roomLastActivity: 最后一条消息 timestamp", serial, () => {
  const room = {};
  const result = roomLastActivity(room, () => ({ sender: "user", pending: false, timestamp: "10:30" }));
  assert.equal(result, "user · 10:30");
});

test("roomLastActivity: 无消息返回暂无消息", serial, () => {
  const room = {};
  const result = roomLastActivity(room, () => null);
  assert.equal(result, "暂无消息");
});
