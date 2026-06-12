/* shell-identity.js — identity helpers for lobster-chat H5 shell */

export function isVisitorIdentity(value) {
  const normalized = String(value || "").trim();
  return !normalized || normalized === "访客";
}

export function residentScopedShellStatePage(shellPage) {
  return shellPage === "user" || shellPage === "hub" || shellPage === "admin";
}

export function translateClientDisplayName(value) {
  switch ((value || "").toLowerCase()) {
    case "mobile web":
      return "移动网页";
    default:
      return value || "未知终端";
  }
}

export function translateRoutePrefix(value) {
  switch (value) {
    case "/app":
      return "主入口";
    default:
      return value || "默认入口";
  }
}
