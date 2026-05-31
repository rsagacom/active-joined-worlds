export function translateRole(role) {
  switch (role) {
    case "Lord":
      return "城主";
    case "Steward":
      return "执事";
    case "Resident":
      return "居民";
    default:
      return "未知身份";
  }
}

export function translateMembershipState(state) {
  switch (state) {
    case "Active":
      return "已激活";
    case "PendingApproval":
      return "待审批";
    case "Suspended":
      return "已暂停";
    case "Revoked":
      return "已撤销";
    default:
      return "未知状态";
  }
}

export function translateFederationPolicy(policy) {
  switch (policy) {
    case "Open":
      return "开放互联";
    case "Selective":
      return "选择互联";
    case "Isolated":
      return "孤城断联";
    default:
      return "未知策略";
  }
}

export function translateTrustState(state) {
  switch (state) {
    case "Healthy":
      return "健康";
    case "UnderReview":
      return "审查中";
    case "Quarantined":
      return "隔离观察";
    case "Isolated":
      return "孤城断联";
    default:
      return "未知状态";
  }
}

export function translateSourceKind(kind) {
  switch (kind) {
    case "Seed":
      return "种子城";
    case "Mirror":
      return "镜像源";
    case "Primary":
      return "主源";
    default:
      return "未知来源";
  }
}

export function translateSeverity(level) {
  switch (level) {
    case "info":
      return "普通";
    case "warning":
      return "警告";
    case "urgent":
      return "紧急";
    default:
      return "普通";
  }
}

export function translateSubjectKind(kind) {
  switch (kind) {
    case "City":
      return "城市";
    case "Room":
      return "房间";
    case "MirrorSource":
      return "镜像源";
    case "Resident":
      return "居民";
    default:
      return "对象";
  }
}

export function translateRoomKind(kind) {
  switch (kind) {
    case "direct":
      return "私信";
    case "public":
      return "公共频道";
    default:
      return "系统通知";
  }
}

export function translateRoomKindForShellPage(kind, shellPage = "hub") {
  if (shellPage === "user") {
    switch (kind) {
      case "direct":
        return "居民私信";
      case "public":
        return "城镇频道";
      default:
        return "城门消息";
    }
  }
  return translateRoomKind(kind);
}

export function translateReportStatus(status) {
  switch (status) {
    case "Pending":
      return "待处理";
    case "Reviewed":
      return "已审查";
    case "Resolved":
      return "已处理";
    case "Dismissed":
      return "已驳回";
    default:
      return "待处理";
  }
}

export function translateProviderMode(mode) {
  switch (mode) {
    case "local-memory":
      return "本地草稿";
    case "gateway-bridge":
      return "当前网关";
    case "remote-gateway":
      return "外部网关";
    case "remote-provider":
      return "外部消息源";
    case "unknown":
      return "未知";
    default:
      return "未知";
  }
}

export function translateProviderHealth(reachable) {
  return reachable ? "正常" : "降级";
}

export function translateTargetKind(kind) {
  return translateSubjectKind(kind);
}

export function translatePortability(revoked) {
  return revoked ? "已撤销" : "可迁移";
}

export function translateAdvisoryAction(action) {
  switch (action) {
    case "block-link":
      return "封禁链接";
    case "quarantine":
      return "隔离观察";
    case "isolate":
      return "孤城断联";
    case "disconnect":
      return "断开互联";
    case "deny-join":
      return "禁止加入";
    default:
      return "未命名动作";
  }
}

export function displayWorldTitle(title) {
  if (title === "Lobster World") return "龙虾世界";
  return title;
}

export function displayCityTitle(city) {
  if (city?.title === "Core Harbor" || city?.slug === "core-harbor") return "核心港";
  return city?.title || city?.slug || "未命名城市";
}

export function displayCityDescription(city) {
  if (city?.description === "Default city for local-first relay, shell, and governance testing.") {
    return "用于本地优先中继、聊天预览与侧边处理走查的默认测试城市。";
  }
  return city?.description || "暂无城市简介";
}
