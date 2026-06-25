/* shell-room-context.js — 房间 governance-aware 上下文纯函数
 * 从 app.js 提取。返回纯数据/文案，governance 查询 + 全局通过 deps 注入
 * (publicRoomRecordForConversation/cityStateForConversation/worldDirectoryCity/
 *  membershipForCity/publicRoomsForCity/residents/world/memberships/
 *  currentIdentity/shellPage/roomKind/roomQuickActionContextCopy/
 *  roomDisplayPeer/roomPreview/translateFederationPolicy/displayCityTitle)，
 * 脱离全局即可单测。
 */

import { displayCityTitle } from "./shell-labels.js";

export function chatDetailRoomContextModelForState(room, deps) {
  const publicRoom = deps.publicRoomRecordForConversation(room.id);
  const cityState = deps.cityStateForConversation(room.id);
  const directoryCity = publicRoom ? deps.worldDirectoryCity(publicRoom.city_id) : null;
  const membership = publicRoom ? deps.membershipForCity(publicRoom.city_id) : null;
  const cityProfile = publicRoom
    ? cityState?.profile || directoryCity || {
        title: publicRoom.city_id,
        slug: publicRoom.city_id,
      }
    : null;
  return {
    publicRoom,
    cityState,
    directoryCity,
    membership,
    cityProfile,
    siblingRooms: publicRoom ? deps.publicRoomsForCity(publicRoom.city_id).filter((item) => item.room_id !== room.id) : [],
  };
}

export function directRoomPeerOnlineStatusForState(room, deps) {
  if (!room || deps.roomKind(room) !== "direct") return null;
  if (!deps.residents?.length) return null;
  const identity = deps.currentIdentity();
  const participants = room.participants;
  if (!participants?.length) return null;
  const peerId = participants.find(
    (p) => (typeof p === "string" ? p : p?.id || p?.resident_id || "") !== identity,
  );
  if (!peerId) return null;
  const peerKey = typeof peerId === "string" ? peerId : peerId.id || peerId.resident_id || "";
  const resident = deps.residents.find((r) => r.resident_id === peerKey);
  if (!resident) return null;
  return resident.online ? "online" : "offline";
}

export function roomContextSummaryForState(room, deps) {
  if (!room) return "打开一个会话后，这里会显示上下文摘要。";
  const actionCopy = deps.roomQuickActionContextCopy(room);
  if (!actionCopy && typeof room.context_summary === "string" && room.context_summary.trim()) {
    return room.context_summary.trim();
  }
  let base = "";
  if (typeof room.scene_summary === "string" && room.scene_summary.trim()) {
    base = room.scene_summary.trim();
  } else {
    const publicRoom = deps.publicRoomRecordForConversation(room.id);
    if (publicRoom?.description?.trim()) {
      base = publicRoom.description.trim();
    } else if (deps.roomKind(room) === "direct") {
      base = room.overview_summary || room.subtitle || `直接和 ${deps.roomDisplayPeer(room)} 继续一对一沟通。`;
    } else {
      base = room.overview_summary || room.subtitle || deps.roomPreview(room);
    }
  }
  return actionCopy ? `${actionCopy} · ${base}` : base;
}

export function roomRouteLabelForState(room, deps) {
  if (!room) return "等待连接";
  if (typeof room.route_label === "string" && room.route_label.trim()) {
    return room.route_label.trim();
  }
  const kind = deps.roomKind(room);
  const shellPage = deps.shellPage;
  if (kind === "public") {
    const publicRoom = deps.publicRoomRecordForConversation(room.id);
    if (publicRoom?.frozen) {
      return "房间已冻结";
    }
    const federation = deps.cityStateForConversation(room.id)?.profile?.federation_policy;
    if (federation) {
      return deps.translateFederationPolicy(federation);
    }
    return shellPage === "user" ? "城镇频道可发言" : "房间可发言";
  }
  if (kind === "direct") {
    if (shellPage === "user") {
      return deps.world?.allows_cross_city_private_messages
        ? "居民私信已连通"
        : "居民私信待网关确认";
    }
    return deps.world?.allows_cross_city_private_messages ? "跨城私信已开启" : "私信待网关确认";
  }
  return shellPage === "user" ? "城门消息同步" : "系统状态同步";
}

export function roomMemberCountForState(room, deps) {
  const explicit = Number(room?.member_count);
  if (Number.isFinite(explicit) && explicit > 0) {
    return explicit;
  }
  const publicRoom = deps.publicRoomRecordForConversation(room?.id);
  if (publicRoom) {
    const activeResidents = (deps.memberships || []).filter(
      (item) => item.city_id === publicRoom.city_id && item.state === "Active",
    ).length;
    if (activeResidents > 0) {
      return activeResidents;
    }
  }
  const participants = new Set((room?.messages || []).map((message) => message.sender).filter(Boolean));
  const identity = deps.currentIdentity();
  if (identity) {
    participants.add(identity);
  }
  if (participants.size > 0) {
    return participants.size;
  }
  return deps.roomKind(room) === "direct" ? 2 : 1;
}

export function roomAudienceLabelForState(room, deps) {
  if (!room) return "未选会话";
  const kind = deps.roomKind(room);
  if (kind === "direct") {
    return room.participant_label || `你与 ${deps.roomDisplayPeer(room)}`;
  }
  if (kind === "public") {
    const publicRoom = deps.publicRoomRecordForConversation(room.id);
    const cityProfile = deps.cityStateForConversation(room.id)?.profile || deps.worldDirectoryCity(publicRoom?.city_id);
    if (publicRoom) {
      return `${displayCityTitle(cityProfile)} · ${publicRoom.slug || publicRoom.room_id}`;
    }
    return room.participant_label || "公开频道";
  }
  return room.participant_label || "系统会话";
}
