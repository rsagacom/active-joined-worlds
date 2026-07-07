export const PERSONAL_ROOM_ACCESS_POLICIES = new Set(["friends_only", "registered_all"]);

const PERSONAL_ROOM_ACCESS_POLICY_LABELS = {
  friends_only: "好友",
  registered_all: "注册",
};

export function personalRoomAccessPolicyForRoom(room) {
  const policy = room?.personal_room_access_policy;
  return PERSONAL_ROOM_ACCESS_POLICIES.has(policy) ? policy : "friends_only";
}

export function personalRoomAccessPolicyLabel(policy) {
  return PERSONAL_ROOM_ACCESS_POLICY_LABELS[policy] || PERSONAL_ROOM_ACCESS_POLICY_LABELS.friends_only;
}

export function personalRoomAccessPolicyControlState({
  room = null,
  currentIdentity = "",
  gatewayUrl = "",
  saving = false,
  roomOwnershipForState = () => "",
} = {}) {
  const ownership = roomOwnershipForState(room, currentIdentity);
  const isOwnPersonalRoom = ownership === "own";
  const policy = personalRoomAccessPolicyForRoom(room);
  const disabled = !isOwnPersonalRoom || !gatewayUrl || saving;

  if (!isOwnPersonalRoom) {
    return {
      hidden: true,
      ariaHidden: "true",
      policy,
      disabled,
      statusText: "",
      statusIsError: false,
    };
  }

  if (saving) {
    return {
      hidden: false,
      ariaHidden: "false",
      policy,
      disabled,
      statusText: "保存中",
      statusIsError: false,
    };
  }

  if (!gatewayUrl) {
    return {
      hidden: false,
      ariaHidden: "false",
      policy,
      disabled,
      statusText: "离线",
      statusIsError: true,
    };
  }

  return {
    hidden: false,
    ariaHidden: "false",
    policy,
    disabled,
    statusText: personalRoomAccessPolicyLabel(policy),
    statusIsError: false,
  };
}

export function personalRoomAccessPolicySubmitRequestState({
  policy = "",
  room = null,
  currentIdentity = "",
  gatewayUrl = "",
  roomOwnershipForState = () => "",
} = {}) {
  if (!PERSONAL_ROOM_ACCESS_POLICIES.has(policy)) {
    return {
      allowed: false,
      reason: "invalid-policy",
      statusText: "",
      statusIsError: false,
      shouldSyncControl: false,
    };
  }

  if (roomOwnershipForState(room, currentIdentity) !== "own") {
    return {
      allowed: false,
      reason: "not-owner",
      statusText: "房主",
      statusIsError: true,
      shouldSyncControl: true,
    };
  }

  if (!gatewayUrl) {
    return {
      allowed: false,
      reason: "offline",
      statusText: "离线",
      statusIsError: true,
      shouldSyncControl: true,
    };
  }

  return {
    allowed: true,
    reason: "",
    endpoint: "/v1/personal-room/access-policy",
    payload: {
      resident_id: String(currentIdentity).trim(),
      policy,
    },
  };
}

export function appliedPersonalRoomAccessPolicy(response, requestedPolicy) {
  if (PERSONAL_ROOM_ACCESS_POLICIES.has(response?.policy)) {
    return response.policy;
  }
  if (PERSONAL_ROOM_ACCESS_POLICIES.has(requestedPolicy)) {
    return requestedPolicy;
  }
  return "friends_only";
}
