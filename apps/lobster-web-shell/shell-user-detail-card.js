/* ============================================================
   shell-user-detail-card.js — 用户住宅/频道角色卡投影纯规格函数
   从 app.js 提取。返回纯数据对象，无 DOM / 无 fetch / 无状态变更。
   detailCardProfile / caretakerProfile 直接复用 shell-room-profiles；
   roomChatStatusSummary / currentIdentity / roomDisplayPeer /
   roomAudienceLabel 通过 deps 注入，脱离全局即可单测。
   ============================================================ */

import { caretakerProfile, detailCardProfile } from "./shell-room-profiles.js";

export function userDetailCardIdleProjectionForState() {
  return {
    variant: "idle",
    motif: "idle",
    kicker: "角色卡",
    title: "当前房间角色卡",
    monogram: "房",
    meta: [{ label: "状态", value: "等待打开一个会话" }],
    actions: [],
  };
}

export function userDetailCardMonogramForState(visual, projection) {
  return visual.portrait?.visual?.monogram || (projection?.variant === "city" ? "巡" : "房");
}

export function userDetailCardCustomProjectionForState(room, visual, projection, detailCard, monogram, status) {
  return {
    variant: projection?.variant || (visual.stage.variant === "home" ? "home" : "city"),
    motif: projection?.motif || (visual.stage.visual?.motif || "watchtower"),
    kicker: detailCard.kicker || (projection?.variant === "city" ? "公共频道 / 角色卡" : "住宅私聊 / 角色卡"),
    title: detailCard.title || "当前房间角色卡",
    monogram: detailCard.monogram || monogram,
    meta: Array.isArray(detailCard.meta) && detailCard.meta.length
      ? detailCard.meta
      : [{ label: "状态", value: status }],
    actions: Array.isArray(detailCard.actions) ? detailCard.actions : [],
  };
}

export function userDetailCardCityProjectionForState(room, projection, caretaker, monogram, status, deps) {
  return {
    variant: "city",
    motif: projection.motif,
    kicker: "公共频道 / 角色卡",
    title: caretaker ? `${caretaker.name} / 频道状态` : "公共频道 / 当前状态",
    monogram,
    meta: [
      { label: "角色", value: caretaker?.role_label || "公共频道向导" },
      { label: "称号", value: caretaker?.name || room.thread_headline || room.title || "未知会话" },
      { label: "当前", value: deps.roomAudienceLabel(room) },
      { label: "状态", value: status },
    ],
    actions: ["私聊", "委托", "交易"],
  };
}

export function userDetailCardHomeProjectionForState(room, projection, caretaker, monogram, status, deps) {
  return {
    variant: "home",
    motif: projection?.motif || "courtyard",
    kicker: "住宅私聊 / 角色卡",
    title: caretaker ? `${caretaker.name} / 房内状态` : "住宅私聊 / 房内状态",
    monogram,
    meta: [
      { label: "住户", value: deps.currentIdentity() || "当前住户" },
      { label: "同住AI", value: caretaker?.name || deps.roomDisplayPeer(room) },
      { label: "当前", value: deps.roomAudienceLabel(room) },
      { label: "状态", value: status },
    ],
    actions: ["续聊", "整理", "留条"],
  };
}

export function userDetailCardProjectionForState(room, visual, projection, deps) {
  if (!room || !visual?.stage) return userDetailCardIdleProjectionForState();
  const detailCard = detailCardProfile(room);
  const caretaker = caretakerProfile(room);
  const monogram = userDetailCardMonogramForState(visual, projection);
  const status = caretaker?.status || deps.roomChatStatusSummary(room);
  if (detailCard) {
    return userDetailCardCustomProjectionForState(room, visual, projection, detailCard, monogram, status);
  }
  if (projection?.variant === "city") {
    return userDetailCardCityProjectionForState(room, projection, caretaker, monogram, status, deps);
  }
  return userDetailCardHomeProjectionForState(room, projection, caretaker, monogram, status, deps);
}
