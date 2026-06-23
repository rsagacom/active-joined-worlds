/* ============================================================
   shell-governance-render.js — 治理/世界列表渲染纯规格函数
   无 DOM / 无 fetch / 无状态变更
   ============================================================ */

import {
  displayCityDescription,
  displayCityTitle,
  displayWorldTitle,
  translateFederationPolicy,
  translateAdvisoryAction,
  translatePortability,
  translateReportStatus,
  translateRole,
  translateSourceKind,
  translateSeverity,
  translateSubjectKind,
  translateTargetKind,
  translateTrustState,
} from "./shell-labels.js";
import { formatDateTime } from "./shell-message-render.js";

export function governanceOfflineStateModel({ gatewayUrl = "", shellMode = "" } = {}) {
  return {
    worldState: "世界：离线",
    summary: shellMode === "user"
      ? (gatewayUrl
          ? "边缘抽屉已打开，正在等待世界外壳状态。"
          : "边缘抽屉默认收起，连接网关后可查看世界外壳。")
      : (gatewayUrl
          ? "正在等待世界状态"
          : "请先连接网关以加载世界与城市状态"),
    listEmptyClassName: "empty-note",
    listEmptyText: "世界层暂不可用",
    cityEmptyClassName: "empty-note",
    cityEmptyText: "世界状态暂不可用",
  };
}

export function governanceWorldHeaderModel({
  world = {},
  directory = null,
  cityCount = 0,
  worldSquareCount = 0,
  shellMode = "",
} = {}) {
  const title = displayWorldTitle(world?.title);
  const directoryCityCount = directory?.city_count ?? cityCount;
  const mirrorCount = directory?.mirror_count ?? 0;
  return {
    worldState: `世界：${title}`,
    summary: shellMode === "user"
      ? `${title} · 抽屉里放城市 ${directoryCityCount} 项 · 镜像 ${mirrorCount} 项`
      : `${title} · 城市 ${directoryCityCount} · 镜像 ${mirrorCount} · 公告 ${worldSquareCount} · 跨城私聊 ${
          world?.allows_cross_city_private_messages ? "开启" : "关闭"
        }`,
  };
}

export function governanceEmptyCityStateModel() {
  return {
    className: "empty-note",
    text: "暂时还没有公开城市",
  };
}

export function governanceCityCardBaseModel(
  city = {},
  membership = null,
  { membershipLabelFn = () => "非居民" } = {},
) {
  return {
    className: "city-card",
    titleRowClassName: "city-card-title",
    title: displayCityTitle(city),
    slug: city?.slug || "",
    description: displayCityDescription(city),
    role: `你的状态：${membershipLabelFn(membership)}`,
    access: `公开发现 ${city?.public_room_discovery_enabled ? "开启" : "关闭"} · 入城审批 ${
      city?.approval_required ? "需要审批" : "开放加入"
    }`,
  };
}

function governanceMiniButtonModel(text) {
  return { type: "button", className: "secondary mini-button", text };
}

function governanceSecondaryButtonModel(text) {
  return { type: "button", className: "secondary", text };
}

function governanceLobbyActionModel(rooms = []) {
  const roomList = Array.isArray(rooms) ? rooms : [];
  const lobby = roomList.find((room) => room?.slug === "lobby") || roomList[0];
  if (!lobby) return null;
  const slug = lobby?.slug || "";
  return {
    ...governanceSecondaryButtonModel(`打开 ${slug}`),
    roomId: lobby?.room_id || "",
    slug,
  };
}

export function governanceCityActionsModel(
  city = {},
  membership = null,
  rooms = [],
  { canCreatePublicRoomFn = () => false } = {},
) {
  const citySlug = city?.slug || "";
  const joinButton = !membership
    ? { ...governanceSecondaryButtonModel("加入"), citySlug }
    : null;
  const pendingNotice = membership?.state === "PendingApproval"
    ? { className: "city-role notice-pending", text: "等待审批" }
    : null;
  const lobbyButton = governanceLobbyActionModel(rooms);
  const createRoomButton =
    membership?.state === "Active" && canCreatePublicRoomFn(membership?.role)
      ? {
          type: "button",
          text: "新建房间",
          citySlug,
          statusText: `已准备在 ${citySlug} 中创建房间`,
        }
      : null;

  return {
    className: "city-actions",
    citySlug,
    hasActions: Boolean(joinButton || pendingNotice || lobbyButton || createRoomButton),
    joinButton,
    pendingNotice,
    lobbyButton,
    createRoomButton,
  };
}

const FEDERATION_POLICY_OPTIONS = [
  ["Open", "开放互联"],
  ["Selective", "选择互联"],
  ["Isolated", "孤城断联"],
];

export function governanceFederationPolicyControlsModel(
  city = {},
  membership = null,
  {
    canUpdateFederationFn = () => false,
    translateFederationPolicyFn = translateFederationPolicy,
  } = {},
) {
  if (!(membership?.state === "Active" && canUpdateFederationFn(membership?.role))) return null;
  const currentPolicy = city?.federation_policy || "";
  return {
    titleClassName: "city-room-list",
    title: `联邦策略 · ${translateFederationPolicyFn(currentPolicy)}`,
    wrapClassName: "city-room-wrap",
    entries: FEDERATION_POLICY_OPTIONS.map(([policyValue, label]) => {
      const isCurrent = currentPolicy === policyValue;
      return {
        policyValue,
        rowClassName: "city-room-entry",
        label: isCurrent ? `${label} · 当前生效` : `${label} · 可切换`,
        applyButton: {
          type: "button",
          className: "secondary mini-button",
          text: isCurrent ? "当前" : "应用",
          disabled: isCurrent,
        },
      };
    }),
  };
}

export function governanceCityRoomListModel(
  rooms = [],
  membership = null,
  { canFreezeRoomFn = () => false } = {},
) {
  const canFreeze = membership?.state === "Active" && canFreezeRoomFn(membership?.role);
  return {
    titleClassName: "city-room-list",
    title: "公共房间",
    wrapClassName: "city-room-wrap",
    entries: (rooms || []).map((room = {}) => ({
      roomId: room?.room_id || "",
      slug: room?.slug || "",
      frozen: Boolean(room?.frozen),
      rowClassName: "city-room-entry",
      label: `${room?.slug || ""}${room?.frozen ? " · 已冻结" : ""}`,
      controlsClassName: "city-room-controls",
      openButton: governanceMiniButtonModel("打开"),
      freezeButton: canFreeze
        ? governanceMiniButtonModel(room?.frozen ? "解冻" : "冻结")
        : null,
    })),
  };
}

export function governancePendingMemberListModel(
  pendingMembers = [],
  membership = null,
  { canApproveJoinFn = () => false } = {},
) {
  const canApprove = membership?.state === "Active" && canApproveJoinFn(membership?.role);
  return {
    titleClassName: "city-room-list",
    title: "待审批居民",
    wrapClassName: "city-room-wrap",
    entries: (pendingMembers || []).map((pending = {}) => {
      const residentId = pending?.resident_id || "";
      return {
        residentId,
        rowClassName: "city-room-entry",
        label: residentId,
        approveButton: canApprove ? governanceMiniButtonModel("批准") : null,
      };
    }),
  };
}

export function governanceActiveMemberListModel(
  activeMembers = [],
  membership = null,
  { canManageStewardsFn = () => false, translateRoleFn = translateRole } = {},
) {
  const canManageStewards =
    membership?.state === "Active" && canManageStewardsFn(membership?.role);
  return {
    titleClassName: "city-room-list",
    title: "活跃居民",
    wrapClassName: "city-room-wrap",
    entries: (activeMembers || []).map((resident = {}) => {
      const residentId = resident?.resident_id || "";
      const role = resident?.role || "";
      const stewardGrant = canManageStewards ? role !== "Steward" : false;
      return {
        residentId,
        role,
        rowClassName: "city-room-entry",
        label: `${residentId} · ${translateRoleFn(role)}`,
        stewardGrant,
        stewardButton: canManageStewards
          ? governanceMiniButtonModel(stewardGrant ? "设为执事" : "撤销执事")
          : null,
      };
    }),
  };
}

export function worldDirectoryEmptyStateText({ gatewayUrl = "" } = {}) {
  return gatewayUrl
    ? "世界目录暂时还没有公开条目"
    : "请先连接网关以加载世界目录";
}

export function worldDirectoryCityCardModel(city = {}) {
  const cityId = city?.city_id || city?.slug || city?.title || "";
  const slug = city?.slug || cityId;
  return {
    className: "city-card micro-card",
    titleRowClassName: "city-card-title",
    title: displayCityTitle(city),
    slug: `${slug} · ${translateSourceKind(city?.source_kind)}`,
    description: displayCityDescription(city),
    metrics: `信任状态 ${translateTrustState(city?.trust_state)} · 居民 ${city?.resident_count || 0} · 房间 ${city?.public_room_count || 0}`,
    mirror: `镜像 ${city?.mirror_enabled ? "已开启" : "未开启"} · 城市标识 ${cityId}`,
  };
}

export function mirrorSourcesEmptyStateText({ gatewayUrl = "" } = {}) {
  return gatewayUrl
    ? "暂时还没有配置世界镜像源"
    : "请先连接网关以管理镜像源";
}

export function mirrorSourceCardModel(source = {}, { formatDateTimeFn = formatDateTime } = {}) {
  return {
    className: "city-card micro-card",
    title: source?.base_url || "未配置镜像源",
    status: `${translateSourceKind(source?.source_kind)} · ${source?.enabled ? "已启用" : "未启用"} · ${source?.reachable ? "可达" : "不可达"}`,
    metrics: `城市 ${source?.city_count || 0} · 公告 ${source?.notice_count || 0} · 通告 ${source?.advisory_count || 0}`,
    lastSnapshot: source?.last_snapshot_at_ms
      ? `最近快照 ${formatDateTimeFn(source.last_snapshot_at_ms)}`
      : "",
  };
}

function joinOrFallback(values = [], fallback = "暂无") {
  return values.join("、") || fallback;
}

export function residentDirectoryEmptyStateText({ gatewayUrl = "" } = {}) {
  return gatewayUrl
    ? "居民目录暂时还没有条目"
    : "请先连接网关以加载居民目录";
}

export function residentDirectoryCardModel(
  resident = {},
  { translateResidentLabelFn = (residentId) => residentId || "" } = {},
) {
  const residentId = resident?.resident_id || "";
  return {
    className: "city-card",
    titleRowClassName: "city-card-title",
    title: resident?.nickname || residentId,
    slug: resident?.nickname ? residentId : translateResidentLabelFn(residentId),
    rows: [
      {
        className: "city-sub",
        text: `已加入城市：${joinOrFallback(resident?.active_cities || [], "暂无")}`,
      },
      ...(resident?.pending_cities?.length
        ? [
            {
              className: "city-sub",
              text: `待审批城市：${resident.pending_cities.join("、")}`,
            },
          ]
        : []),
      {
        className: "city-role",
        text: `身份：${joinOrFallback((resident?.roles || []).map(translateRole), "居民")}`,
      },
    ],
  };
}

export function worldSquareEmptyStateText({ gatewayUrl = "" } = {}) {
  return gatewayUrl
    ? "世界广场当前还没有新动态"
    : "请先连接网关以加载世界广场公告";
}

export function worldSquareNoticeCardModel(notice = {}, { formatDateTimeFn = formatDateTime } = {}) {
  const postedTime = notice?.posted_at_ms ? formatDateTimeFn(notice.posted_at_ms) : "暂无时间";
  return {
    className: "city-card micro-card",
    titleRowClassName: "city-card-title",
    title: notice?.title || "未命名公告",
    meta: `${translateSeverity(notice?.severity || "info")} · ${notice?.author_id || "未署名"}`,
    body: notice?.body || "暂无正文",
    tags: `标签：${(notice?.tags || []).join("、") || "无"} · ${postedTime}`,
  };
}

export function worldSafetyEmptyStateText({ gatewayUrl = "" } = {}) {
  return gatewayUrl
    ? "世界安全动态暂不可用"
    : "请先连接网关以加载世界安全状态";
}

export function worldSafetyMirrorCardModel(safety = {}) {
  const mirrors = safety?.mirrors || [];
  return {
    className: "city-card micro-card",
    title: `镜像城市 ${mirrors.filter((item) => item?.mirror_enabled).length || 0}`,
    mirrors: mirrors
      .map((mirror) => `${mirror?.slug}：${translateTrustState(mirror?.trust_state)}`)
      .join(" · ") || "暂无镜像",
    stewards: `治理员：${(safety?.stewards || []).join("、") || "暂无"}`,
  };
}

export function worldSafetyAdvisoryEmptyStateText() {
  return "当前没有生效中的世界安全通告";
}

export function worldSafetyAdvisoryCardModel(
  advisory = {},
  { formatDateTimeFn = formatDateTime } = {},
) {
  return {
    className: "city-card micro-card",
    titleRowClassName: "city-card-title",
    title: advisory?.subject_ref,
    action: translateAdvisoryAction(advisory?.action),
    reason: advisory?.reason,
    meta: `${translateSubjectKind(advisory?.subject_kind)} · ${advisory?.issued_by} · ${formatDateTimeFn(
      advisory?.issued_at_ms,
    )}`,
  };
}

export function worldSafetySanctionSummaryCardModel(
  residentSanctions = [],
  blacklistEntries = [],
) {
  return {
    className: "city-card micro-card",
    title: `居民制裁 ${residentSanctions.length}`,
    summary: residentSanctions.length
      ? residentSanctions
          .slice(0, 4)
          .map((item) => `${item?.resident_id}：${translateReportStatus(item?.status)}`)
          .join(" · ")
      : "当前没有已发布的居民制裁",
    meta: `黑名单哈希条目 ${blacklistEntries.length}`,
  };
}

export function worldSafetyReportSummaryCardModel(
  reports = [],
  { formatDateTimeFn = formatDateTime } = {},
) {
  return {
    className: "city-card micro-card",
    title: `举报记录 ${reports.length}`,
    summary: reports.length
      ? reports
          .slice(0, 4)
          .map(
            (item) =>
              `${translateTargetKind(item?.target_kind)}：${item?.target_ref}：${translateReportStatus(
                item?.status,
              )}`,
          )
          .join(" · ")
      : "当前还没有世界安全举报",
    meta: reports.length
      ? `最新时间 ${formatDateTimeFn(reports[0]?.reported_at_ms)}`
      : "居民可以在这里举报群聊和公共空间违规",
  };
}

export function worldSafetySanctionCardModel(
  sanction = {},
  { formatDateTimeFn = formatDateTime } = {},
) {
  return {
    className: "city-card micro-card",
    titleRowClassName: "city-card-title",
    title: sanction?.resident_id,
    status: `${translateReportStatus(sanction?.status)} · 迁移资格 ${translatePortability(
      sanction?.portability_revoked,
    )}`,
    reason: sanction?.reason,
    meta: `${sanction?.city_id || "世界层"} · ${formatDateTimeFn(sanction?.issued_at_ms)}`,
  };
}

export function worldSafetyReportCardModel(
  report = {},
  { formatDateTimeFn = formatDateTime } = {},
) {
  return {
    className: "city-card micro-card",
    titleRowClassName: "city-card-title",
    title: report?.target_ref,
    status: translateReportStatus(report?.status || "Pending"),
    summary: report?.summary,
    meta: `${translateTargetKind(report?.target_kind)} · ${report?.city || "世界层"} · ${
      report?.reporter_id
    } · ${formatDateTimeFn(report?.reported_at_ms)}`,
  };
}
