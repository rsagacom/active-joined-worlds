import assert from "node:assert/strict";
import test from "node:test";
import {
  displayCityDescription,
  displayCityTitle,
  displayWorldTitle,
  translateAdvisoryAction,
  translateFederationPolicy,
  translateMembershipState,
  translatePortability,
  translateProviderHealth,
  translateProviderMode,
  translateReportStatus,
  translateRole,
  translateRoomKind,
  translateRoomKindForShellPage,
  translateSeverity,
  translateSourceKind,
  translateSubjectKind,
  translateTargetKind,
  translateTrustState,
} from "../shell-labels.js";

test("governance role and status labels stay localized", () => {
  assert.equal(translateRole("Lord"), "城主");
  assert.equal(translateRole("Steward"), "执事");
  assert.equal(translateRole("Resident"), "居民");
  assert.equal(translateRole("Other"), "未知身份");
  assert.equal(translateMembershipState("Active"), "已激活");
  assert.equal(translateMembershipState("PendingApproval"), "待审批");
  assert.equal(translateMembershipState("Suspended"), "已暂停");
  assert.equal(translateMembershipState("Revoked"), "已撤销");
});

test("world federation and safety labels map gateway enum values", () => {
  assert.equal(translateFederationPolicy("Open"), "开放互联");
  assert.equal(translateFederationPolicy("Selective"), "选择互联");
  assert.equal(translateFederationPolicy("Isolated"), "孤城断联");
  assert.equal(translateTrustState("Healthy"), "健康");
  assert.equal(translateTrustState("UnderReview"), "审查中");
  assert.equal(translateTrustState("Quarantined"), "隔离观察");
  assert.equal(translateTrustState("Isolated"), "孤城断联");
  assert.equal(translateSourceKind("Seed"), "种子城");
  assert.equal(translateSourceKind("Mirror"), "镜像源");
  assert.equal(translateSourceKind("Primary"), "主源");
  assert.equal(translateSeverity("urgent"), "紧急");
});

test("room and subject labels keep user shell copy separate", () => {
  assert.equal(translateSubjectKind("City"), "城市");
  assert.equal(translateSubjectKind("MirrorSource"), "镜像源");
  assert.equal(translateTargetKind("Room"), "房间");
  assert.equal(translateRoomKind("direct"), "私信");
  assert.equal(translateRoomKind("public"), "公共频道");
  assert.equal(translateRoomKind("unknown"), "系统通知");
  assert.equal(translateRoomKindForShellPage("direct", "user"), "居民私信");
  assert.equal(translateRoomKindForShellPage("public", "user"), "城镇频道");
  assert.equal(translateRoomKindForShellPage("system", "user"), "城门消息");
  assert.equal(translateRoomKindForShellPage("direct", "hub"), "私信");
});

test("provider, report and advisory labels use stable Chinese copy", () => {
  assert.equal(translateReportStatus("Pending"), "待处理");
  assert.equal(translateReportStatus("Reviewed"), "已审查");
  assert.equal(translateReportStatus("Resolved"), "已处理");
  assert.equal(translateReportStatus("Dismissed"), "已驳回");
  assert.equal(translateProviderMode("local-memory"), "本地草稿");
  assert.equal(translateProviderMode("gateway-bridge"), "当前网关");
  assert.equal(translateProviderMode("remote-gateway"), "外部网关");
  assert.equal(translateProviderMode("remote-provider"), "外部消息源");
  assert.equal(translateProviderHealth(true), "正常");
  assert.equal(translateProviderHealth(false), "降级");
  assert.equal(translatePortability(false), "可迁移");
  assert.equal(translatePortability(true), "已撤销");
  assert.equal(translateAdvisoryAction("block-link"), "封禁链接");
  assert.equal(translateAdvisoryAction("deny-join"), "禁止加入");
});

test("world and city display fallbacks preserve existing shell names", () => {
  assert.equal(displayWorldTitle("Lobster World"), "龙虾世界");
  assert.equal(displayWorldTitle("Test World"), "Test World");
  assert.equal(displayCityTitle({ title: "Core Harbor" }), "核心港");
  assert.equal(displayCityTitle({ slug: "core-harbor" }), "核心港");
  assert.equal(displayCityTitle({ title: "南岸" }), "南岸");
  assert.equal(displayCityTitle({ slug: "south" }), "south");
  assert.equal(displayCityDescription({}), "暂无城市简介");
  assert.equal(
    displayCityDescription({
      description: "Default city for local-first relay, shell, and governance testing.",
    }),
    "用于本地优先中继、聊天预览与侧边处理走查的默认测试城市。",
  );
});
