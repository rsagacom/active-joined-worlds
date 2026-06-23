// shell-governance-render.test.mjs — 治理/世界列表渲染纯规格测试
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  governanceActiveMemberListModel,
  governanceCityCardBaseModel,
  governanceCityActionsModel,
  governanceCityRoomListModel,
  governanceEmptyCityStateModel,
  governanceFederationPolicyControlsModel,
  governanceOfflineStateModel,
  governancePendingMemberListModel,
  governanceWorldHeaderModel,
  mirrorSourceCardModel,
  mirrorSourcesEmptyStateText,
  residentDirectoryCardModel,
  residentDirectoryEmptyStateText,
  worldDirectoryCityCardModel,
  worldDirectoryEmptyStateText,
  worldSafetyAdvisoryCardModel,
  worldSafetyAdvisoryEmptyStateText,
  worldSafetyEmptyStateText,
  worldSafetyMirrorCardModel,
  worldSafetyReportCardModel,
  worldSafetyReportSummaryCardModel,
  worldSafetySanctionCardModel,
  worldSafetySanctionSummaryCardModel,
  worldSquareEmptyStateText,
  worldSquareNoticeCardModel,
} from "../shell-governance-render.js";

test("governanceOfflineStateModel: builds user drawer offline copy", () => {
  assert.deepEqual(
    governanceOfflineStateModel({ shellMode: "user", gatewayUrl: "http://gateway" }),
    {
      worldState: "世界：离线",
      summary: "边缘抽屉已打开，正在等待世界外壳状态。",
      listEmptyClassName: "empty-note",
      listEmptyText: "世界层暂不可用",
      cityEmptyClassName: "empty-note",
      cityEmptyText: "世界状态暂不可用",
    },
  );
  assert.equal(
    governanceOfflineStateModel({ shellMode: "user", gatewayUrl: "" }).summary,
    "边缘抽屉默认收起，连接网关后可查看世界外壳。",
  );
});

test("governanceOfflineStateModel: builds non-user offline copy", () => {
  assert.equal(
    governanceOfflineStateModel({ shellMode: "hub", gatewayUrl: "http://gateway" }).summary,
    "正在等待世界状态",
  );
  assert.equal(
    governanceOfflineStateModel({ shellMode: "admin", gatewayUrl: "" }).summary,
    "请先连接网关以加载世界与城市状态",
  );
});

test("governanceWorldHeaderModel: builds user drawer summary", () => {
  assert.deepEqual(
    governanceWorldHeaderModel({
      world: { title: "龙虾世界", allows_cross_city_private_messages: true },
      directory: { city_count: 4, mirror_count: 2 },
      cityCount: 9,
      worldSquareCount: 7,
      shellMode: "user",
    }),
    {
      worldState: "世界：龙虾世界",
      summary: "龙虾世界 · 抽屉里放城市 4 项 · 镜像 2 项",
    },
  );
});

test("governanceWorldHeaderModel: builds non-user summary with fallbacks", () => {
  assert.deepEqual(
    governanceWorldHeaderModel({
      world: { title: "", allows_cross_city_private_messages: false },
      directory: null,
      cityCount: 3,
      worldSquareCount: 5,
      shellMode: "admin",
    }),
    {
      worldState: "世界：",
      summary: " · 城市 3 · 镜像 0 · 公告 5 · 跨城私聊 关闭",
    },
  );
});

test("governanceEmptyCityStateModel: returns stable city empty row spec", () => {
  assert.deepEqual(governanceEmptyCityStateModel(), {
    className: "empty-note",
    text: "暂时还没有公开城市",
  });
});

test("governanceCityCardBaseModel: builds city summary copy and classes", () => {
  assert.deepEqual(
    governanceCityCardBaseModel(
      {
        title: "龙虾城",
        slug: "lobster",
        description: "城邦公告与公共频道",
        public_room_discovery_enabled: true,
        approval_required: false,
      },
      { state: "Active" },
      { membershipLabelFn: () => "居民" },
    ),
    {
      className: "city-card",
      titleRowClassName: "city-card-title",
      title: "龙虾城",
      slug: "lobster",
      description: "城邦公告与公共频道",
      role: "你的状态：居民",
      access: "公开发现 开启 · 入城审批 开放加入",
    },
  );
});

test("governanceCityCardBaseModel: keeps empty city fallbacks stable", () => {
  assert.deepEqual(
    governanceCityCardBaseModel(
      {
        public_room_discovery_enabled: false,
        approval_required: true,
      },
      null,
      { membershipLabelFn: () => "非居民" },
    ),
    {
      className: "city-card",
      titleRowClassName: "city-card-title",
      title: "未命名城市",
      slug: "",
      description: "暂无城市简介",
      role: "你的状态：非居民",
      access: "公开发现 关闭 · 入城审批 需要审批",
    },
  );
});

test("governanceCityRoomListModel: builds room rows and active steward controls", () => {
  assert.deepEqual(
    governanceCityRoomListModel(
      [
        { room_id: "room-lobby", slug: "lobby", frozen: false },
        { room_id: "room-ops", slug: "ops", frozen: true },
      ],
      { state: "Active", role: "Steward" },
      { canFreezeRoomFn: (role) => role === "Steward" },
    ),
    {
      titleClassName: "city-room-list",
      title: "公共房间",
      wrapClassName: "city-room-wrap",
      entries: [
        {
          roomId: "room-lobby",
          slug: "lobby",
          frozen: false,
          rowClassName: "city-room-entry",
          label: "lobby",
          controlsClassName: "city-room-controls",
          openButton: { type: "button", className: "secondary mini-button", text: "打开" },
          freezeButton: { type: "button", className: "secondary mini-button", text: "冻结" },
        },
        {
          roomId: "room-ops",
          slug: "ops",
          frozen: true,
          rowClassName: "city-room-entry",
          label: "ops · 已冻结",
          controlsClassName: "city-room-controls",
          openButton: { type: "button", className: "secondary mini-button", text: "打开" },
          freezeButton: { type: "button", className: "secondary mini-button", text: "解冻" },
        },
      ],
    },
  );
});

test("governanceCityRoomListModel: hides freeze controls for non-active members", () => {
  assert.deepEqual(
    governanceCityRoomListModel(
      [{ room_id: "room-visitor", slug: "visitor", frozen: false }],
      { state: "PendingApproval", role: "Steward" },
      { canFreezeRoomFn: () => true },
    ),
    {
      titleClassName: "city-room-list",
      title: "公共房间",
      wrapClassName: "city-room-wrap",
      entries: [
        {
          roomId: "room-visitor",
          slug: "visitor",
          frozen: false,
          rowClassName: "city-room-entry",
          label: "visitor",
          controlsClassName: "city-room-controls",
          openButton: { type: "button", className: "secondary mini-button", text: "打开" },
          freezeButton: null,
        },
      ],
    },
  );
});

test("governancePendingMemberListModel: builds pending rows and approve controls", () => {
  assert.deepEqual(
    governancePendingMemberListModel(
      [
        { resident_id: "resident-a" },
        { resident_id: "resident-b" },
      ],
      { state: "Active", role: "Lord" },
      { canApproveJoinFn: (role) => role === "Lord" },
    ),
    {
      titleClassName: "city-room-list",
      title: "待审批居民",
      wrapClassName: "city-room-wrap",
      entries: [
        {
          residentId: "resident-a",
          rowClassName: "city-room-entry",
          label: "resident-a",
          approveButton: { type: "button", className: "secondary mini-button", text: "批准" },
        },
        {
          residentId: "resident-b",
          rowClassName: "city-room-entry",
          label: "resident-b",
          approveButton: { type: "button", className: "secondary mini-button", text: "批准" },
        },
      ],
    },
  );
});

test("governancePendingMemberListModel: hides approve controls without active permission", () => {
  assert.deepEqual(
    governancePendingMemberListModel(
      [{ resident_id: "resident-c" }],
      { state: "PendingApproval", role: "Lord" },
      { canApproveJoinFn: () => true },
    ),
    {
      titleClassName: "city-room-list",
      title: "待审批居民",
      wrapClassName: "city-room-wrap",
      entries: [
        {
          residentId: "resident-c",
          rowClassName: "city-room-entry",
          label: "resident-c",
          approveButton: null,
        },
      ],
    },
  );
});

test("governanceActiveMemberListModel: builds resident rows and steward controls", () => {
  assert.deepEqual(
    governanceActiveMemberListModel(
      [
        { resident_id: "resident-a", role: "Member" },
        { resident_id: "resident-b", role: "Steward" },
      ],
      { state: "Active", role: "Lord" },
      {
        canManageStewardsFn: (role) => role === "Lord",
        translateRoleFn: (role) => (role === "Steward" ? "执事" : "居民"),
      },
    ),
    {
      titleClassName: "city-room-list",
      title: "活跃居民",
      wrapClassName: "city-room-wrap",
      entries: [
        {
          residentId: "resident-a",
          role: "Member",
          rowClassName: "city-room-entry",
          label: "resident-a · 居民",
          stewardGrant: true,
          stewardButton: { type: "button", className: "secondary mini-button", text: "设为执事" },
        },
        {
          residentId: "resident-b",
          role: "Steward",
          rowClassName: "city-room-entry",
          label: "resident-b · 执事",
          stewardGrant: false,
          stewardButton: { type: "button", className: "secondary mini-button", text: "撤销执事" },
        },
      ],
    },
  );
});

test("governanceActiveMemberListModel: hides steward controls without active permission", () => {
  assert.deepEqual(
    governanceActiveMemberListModel(
      [{ resident_id: "resident-c", role: "Member" }],
      { state: "Active", role: "Member" },
      {
        canManageStewardsFn: () => false,
        translateRoleFn: (role) => role,
      },
    ),
    {
      titleClassName: "city-room-list",
      title: "活跃居民",
      wrapClassName: "city-room-wrap",
      entries: [
        {
          residentId: "resident-c",
          role: "Member",
          rowClassName: "city-room-entry",
          label: "resident-c · Member",
          stewardGrant: false,
          stewardButton: null,
        },
      ],
    },
  );
});

test("governanceCityActionsModel: builds visitor join and lobby actions", () => {
  assert.deepEqual(
    governanceCityActionsModel(
      { slug: "lobster" },
      null,
      [
        { room_id: "room-general", slug: "general" },
        { room_id: "room-lobby", slug: "lobby" },
      ],
      { canCreatePublicRoomFn: () => false },
    ),
    {
      className: "city-actions",
      citySlug: "lobster",
      hasActions: true,
      joinButton: { type: "button", className: "secondary", text: "加入", citySlug: "lobster" },
      pendingNotice: null,
      lobbyButton: {
        type: "button",
        className: "secondary",
        text: "打开 lobby",
        roomId: "room-lobby",
        slug: "lobby",
      },
      createRoomButton: null,
    },
  );
});

test("governanceCityActionsModel: builds pending approval notice", () => {
  assert.deepEqual(
    governanceCityActionsModel(
      { slug: "lobster" },
      { state: "PendingApproval", role: "Member" },
      [],
    ),
    {
      className: "city-actions",
      citySlug: "lobster",
      hasActions: true,
      joinButton: null,
      pendingNotice: { className: "city-role notice-pending", text: "等待审批" },
      lobbyButton: null,
      createRoomButton: null,
    },
  );
});

test("governanceCityActionsModel: builds active creator action with first-room fallback", () => {
  assert.deepEqual(
    governanceCityActionsModel(
      { slug: "harbor" },
      { state: "Active", role: "Steward" },
      [{ room_id: "room-general", slug: "general" }],
      { canCreatePublicRoomFn: (role) => role === "Steward" },
    ),
    {
      className: "city-actions",
      citySlug: "harbor",
      hasActions: true,
      joinButton: null,
      pendingNotice: null,
      lobbyButton: {
        type: "button",
        className: "secondary",
        text: "打开 general",
        roomId: "room-general",
        slug: "general",
      },
      createRoomButton: {
        type: "button",
        text: "新建房间",
        citySlug: "harbor",
        statusText: "已准备在 harbor 中创建房间",
      },
    },
  );
});

test("governanceFederationPolicyControlsModel: builds policy rows for active steward", () => {
  assert.deepEqual(
    governanceFederationPolicyControlsModel(
      { federation_policy: "Selective" },
      { state: "Active", role: "Steward" },
      {
        canUpdateFederationFn: (role) => role === "Steward",
        translateFederationPolicyFn: (policy) => `策略:${policy}`,
      },
    ),
    {
      titleClassName: "city-room-list",
      title: "联邦策略 · 策略:Selective",
      wrapClassName: "city-room-wrap",
      entries: [
        {
          policyValue: "Open",
          rowClassName: "city-room-entry",
          label: "开放互联 · 可切换",
          applyButton: { type: "button", className: "secondary mini-button", text: "应用", disabled: false },
        },
        {
          policyValue: "Selective",
          rowClassName: "city-room-entry",
          label: "选择互联 · 当前生效",
          applyButton: { type: "button", className: "secondary mini-button", text: "当前", disabled: true },
        },
        {
          policyValue: "Isolated",
          rowClassName: "city-room-entry",
          label: "孤城断联 · 可切换",
          applyButton: { type: "button", className: "secondary mini-button", text: "应用", disabled: false },
        },
      ],
    },
  );
});

test("governanceFederationPolicyControlsModel: hides policy rows without permission", () => {
  assert.equal(
    governanceFederationPolicyControlsModel(
      { federation_policy: "Open" },
      { state: "Active", role: "Member" },
      { canUpdateFederationFn: () => false },
    ),
    null,
  );
});

test("worldDirectoryEmptyStateText: follows gateway availability", () => {
  assert.equal(
    worldDirectoryEmptyStateText({ gatewayUrl: "http://gateway" }),
    "世界目录暂时还没有公开条目",
  );
  assert.equal(
    worldDirectoryEmptyStateText({ gatewayUrl: "" }),
    "请先连接网关以加载世界目录",
  );
});

test("worldDirectoryCityCardModel: builds city card copy and classes", () => {
  assert.deepEqual(
    worldDirectoryCityCardModel({
      title: "龙虾城",
      slug: "lobster",
      description: "城邦公告与公共频道",
      source_kind: "Seed",
      trust_state: "Healthy",
      resident_count: 12,
      public_room_count: 3,
      mirror_enabled: true,
      city_id: "city-lobster",
    }),
    {
      className: "city-card micro-card",
      titleRowClassName: "city-card-title",
      title: "龙虾城",
      slug: "lobster · 种子城",
      description: "城邦公告与公共频道",
      metrics: "信任状态 健康 · 居民 12 · 房间 3",
      mirror: "镜像 已开启 · 城市标识 city-lobster",
    },
  );
});

test("worldDirectoryCityCardModel: keeps display fallbacks stable", () => {
  assert.deepEqual(
    worldDirectoryCityCardModel({
      city_id: "city-fallback",
      source_kind: "Mirror",
      trust_state: "UnderReview",
      mirror_enabled: false,
    }),
    {
      className: "city-card micro-card",
      titleRowClassName: "city-card-title",
      title: "未命名城市",
      slug: "city-fallback · 镜像源",
      description: "暂无城市简介",
      metrics: "信任状态 审查中 · 居民 0 · 房间 0",
      mirror: "镜像 未开启 · 城市标识 city-fallback",
    },
  );
});

test("mirrorSourcesEmptyStateText: follows gateway availability", () => {
  assert.equal(
    mirrorSourcesEmptyStateText({ gatewayUrl: "http://gateway" }),
    "暂时还没有配置世界镜像源",
  );
  assert.equal(
    mirrorSourcesEmptyStateText({ gatewayUrl: "" }),
    "请先连接网关以管理镜像源",
  );
});

test("mirrorSourceCardModel: builds source status and metrics", () => {
  assert.deepEqual(
    mirrorSourceCardModel(
      {
        base_url: "https://mirror.example",
        source_kind: "Primary",
        enabled: true,
        reachable: false,
        city_count: 4,
        notice_count: 5,
        advisory_count: 6,
        last_snapshot_at_ms: Date.UTC(2026, 5, 18, 8, 30),
      },
      { formatDateTimeFn: () => "2026/6/18 16:30:00" },
    ),
    {
      className: "city-card micro-card",
      title: "https://mirror.example",
      status: "主源 · 已启用 · 不可达",
      metrics: "城市 4 · 公告 5 · 通告 6",
      lastSnapshot: "最近快照 2026/6/18 16:30:00",
    },
  );
});

test("mirrorSourceCardModel: omits last snapshot and defaults counts", () => {
  assert.deepEqual(
    mirrorSourceCardModel({
      base_url: "",
      source_kind: "Mirror",
      enabled: false,
      reachable: true,
    }),
    {
      className: "city-card micro-card",
      title: "未配置镜像源",
      status: "镜像源 · 未启用 · 可达",
      metrics: "城市 0 · 公告 0 · 通告 0",
      lastSnapshot: "",
    },
  );
});

test("residentDirectoryEmptyStateText: follows gateway availability", () => {
  assert.equal(
    residentDirectoryEmptyStateText({ gatewayUrl: "http://gateway" }),
    "居民目录暂时还没有条目",
  );
  assert.equal(
    residentDirectoryEmptyStateText({ gatewayUrl: "" }),
    "请先连接网关以加载居民目录",
  );
});

test("residentDirectoryCardModel: builds resident card rows with nickname", () => {
  assert.deepEqual(
    residentDirectoryCardModel({
      resident_id: "resident-a",
      nickname: "Alice",
      active_cities: ["core", "harbor"],
      pending_cities: ["north"],
      roles: ["Lord", "Steward"],
    }),
    {
      className: "city-card",
      titleRowClassName: "city-card-title",
      title: "Alice",
      slug: "resident-a",
      rows: [
        { className: "city-sub", text: "已加入城市：core、harbor" },
        { className: "city-sub", text: "待审批城市：north" },
        { className: "city-role", text: "身份：城主、执事" },
      ],
    },
  );
});

test("residentDirectoryCardModel: uses injected resident label and row fallbacks", () => {
  assert.deepEqual(
    residentDirectoryCardModel(
      {
        resident_id: "resident-b",
        roles: [],
      },
      {
        translateResidentLabelFn: (residentId) => `居民标签:${residentId}`,
      },
    ),
    {
      className: "city-card",
      titleRowClassName: "city-card-title",
      title: "resident-b",
      slug: "居民标签:resident-b",
      rows: [
        { className: "city-sub", text: "已加入城市：暂无" },
        { className: "city-role", text: "身份：居民" },
      ],
    },
  );
});

test("worldSquareEmptyStateText: follows gateway availability", () => {
  assert.equal(
    worldSquareEmptyStateText({ gatewayUrl: "http://gateway" }),
    "世界广场当前还没有新动态",
  );
  assert.equal(
    worldSquareEmptyStateText({ gatewayUrl: "" }),
    "请先连接网关以加载世界广场公告",
  );
});

test("worldSquareNoticeCardModel: builds notice copy and tag line", () => {
  assert.deepEqual(
    worldSquareNoticeCardModel(
      {
        title: "停机维护",
        severity: "warning",
        author_id: "steward-a",
        body: "今晚会短暂停机。",
        tags: ["维护", "公告"],
        posted_at_ms: Date.UTC(2026, 5, 18, 9, 0),
      },
      { formatDateTimeFn: () => "2026/6/18 17:00:00" },
    ),
    {
      className: "city-card micro-card",
      titleRowClassName: "city-card-title",
      title: "停机维护",
      meta: "警告 · steward-a",
      body: "今晚会短暂停机。",
      tags: "标签：维护、公告 · 2026/6/18 17:00:00",
    },
  );
});

test("worldSquareNoticeCardModel: defaults severity, author, tags and time", () => {
  assert.deepEqual(
    worldSquareNoticeCardModel(
      {
        body: "",
        posted_at_ms: 0,
      },
      { formatDateTimeFn: () => "never-called" },
    ),
    {
      className: "city-card micro-card",
      titleRowClassName: "city-card-title",
      title: "未命名公告",
      meta: "普通 · 未署名",
      body: "暂无正文",
      tags: "标签：无 · 暂无时间",
    },
  );
});

test("worldSafetyEmptyStateText: follows gateway availability", () => {
  assert.equal(
    worldSafetyEmptyStateText({ gatewayUrl: "http://gateway" }),
    "世界安全动态暂不可用",
  );
  assert.equal(
    worldSafetyEmptyStateText({ gatewayUrl: "" }),
    "请先连接网关以加载世界安全状态",
  );
});

test("worldSafetyMirrorCardModel: builds mirror and steward copy", () => {
  assert.deepEqual(
    worldSafetyMirrorCardModel({
      mirrors: [
        { slug: "main", trust_state: "Healthy", mirror_enabled: true },
        { slug: "remote", trust_state: "Quarantined", mirror_enabled: false },
      ],
      stewards: ["admin-a", "admin-b"],
    }),
    {
      className: "city-card micro-card",
      title: "镜像城市 1",
      mirrors: "main：健康 · remote：隔离观察",
      stewards: "治理员：admin-a、admin-b",
    },
  );
});

test("worldSafetyMirrorCardModel: defaults empty mirrors and stewards", () => {
  assert.deepEqual(
    worldSafetyMirrorCardModel({}),
    {
      className: "city-card micro-card",
      title: "镜像城市 0",
      mirrors: "暂无镜像",
      stewards: "治理员：暂无",
    },
  );
});

test("worldSafetyAdvisoryEmptyStateText: returns stable copy", () => {
  assert.equal(
    worldSafetyAdvisoryEmptyStateText(),
    "当前没有生效中的世界安全通告",
  );
});

test("worldSafetyAdvisoryCardModel: builds advisory card copy", () => {
  assert.deepEqual(
    worldSafetyAdvisoryCardModel(
      {
        subject_ref: "room:world:lobby",
        subject_kind: "Room",
        action: "block-link",
        reason: "公告刷屏",
        issued_by: "steward-a",
        issued_at_ms: Date.UTC(2026, 5, 18, 10, 0),
      },
      { formatDateTimeFn: () => "2026/6/18 18:00:00" },
    ),
    {
      className: "city-card micro-card",
      titleRowClassName: "city-card-title",
      title: "room:world:lobby",
      action: "封禁链接",
      reason: "公告刷屏",
      meta: "房间 · steward-a · 2026/6/18 18:00:00",
    },
  );
});

test("worldSafetySanctionSummaryCardModel: builds non-empty and empty copy", () => {
  assert.deepEqual(
    worldSafetySanctionSummaryCardModel(
      [
        { resident_id: "alice", status: "Pending" },
        { resident_id: "bob", status: "Resolved" },
        { resident_id: "cora", status: "Dismissed" },
        { resident_id: "dave", status: "Reviewed" },
        { resident_id: "erin", status: "Pending" },
      ],
      [{}, {}, {}],
    ),
    {
      className: "city-card micro-card",
      title: "居民制裁 5",
      summary: "alice：待处理 · bob：已处理 · cora：已驳回 · dave：已审查",
      meta: "黑名单哈希条目 3",
    },
  );
  assert.deepEqual(
    worldSafetySanctionSummaryCardModel([], []),
    {
      className: "city-card micro-card",
      title: "居民制裁 0",
      summary: "当前没有已发布的居民制裁",
      meta: "黑名单哈希条目 0",
    },
  );
});

test("worldSafetyReportSummaryCardModel: builds non-empty and empty copy", () => {
  assert.deepEqual(
    worldSafetyReportSummaryCardModel(
      [
        {
          target_kind: "Room",
          target_ref: "room:world:lobby",
          status: "Reviewed",
          reported_at_ms: Date.UTC(2026, 5, 18, 11, 0),
        },
        {
          target_kind: "Resident",
          target_ref: "bad-user",
          status: "Pending",
          reported_at_ms: Date.UTC(2026, 5, 17, 11, 0),
        },
      ],
      { formatDateTimeFn: () => "2026/6/18 19:00:00" },
    ),
    {
      className: "city-card micro-card",
      title: "举报记录 2",
      summary: "房间：room:world:lobby：已审查 · 居民：bad-user：待处理",
      meta: "最新时间 2026/6/18 19:00:00",
    },
  );
  assert.deepEqual(
    worldSafetyReportSummaryCardModel([], { formatDateTimeFn: () => "never-called" }),
    {
      className: "city-card micro-card",
      title: "举报记录 0",
      summary: "当前还没有世界安全举报",
      meta: "居民可以在这里举报群聊和公共空间违规",
    },
  );
});

test("worldSafetySanctionCardModel: builds sanction detail copy", () => {
  assert.deepEqual(
    worldSafetySanctionCardModel(
      {
        resident_id: "bad-user",
        status: "Resolved",
        portability_revoked: true,
        reason: "恶意刷屏",
        city_id: "core-harbor",
        issued_at_ms: Date.UTC(2026, 5, 18, 12, 0),
      },
      { formatDateTimeFn: () => "2026/6/18 20:00:00" },
    ),
    {
      className: "city-card micro-card",
      titleRowClassName: "city-card-title",
      title: "bad-user",
      status: "已处理 · 迁移资格 已撤销",
      reason: "恶意刷屏",
      meta: "core-harbor · 2026/6/18 20:00:00",
    },
  );
});

test("worldSafetyReportCardModel: builds report detail copy", () => {
  assert.deepEqual(
    worldSafetyReportCardModel(
      {
        target_ref: "room:world:lobby",
        target_kind: "Room",
        status: "Reviewed",
        summary: "广告刷屏",
        city: "",
        reporter_id: "resident-a",
        reported_at_ms: Date.UTC(2026, 5, 18, 13, 0),
      },
      { formatDateTimeFn: () => "2026/6/18 21:00:00" },
    ),
    {
      className: "city-card micro-card",
      titleRowClassName: "city-card-title",
      title: "room:world:lobby",
      status: "已审查",
      summary: "广告刷屏",
      meta: "房间 · 世界层 · resident-a · 2026/6/18 21:00:00",
    },
  );
});
