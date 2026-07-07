export const GOVERNANCE_STATUS_DYNAMIC_CLASSES = Object.freeze([
  "notice-pending",
  "resident-room-access-note",
  "is-locked",
  "is-pending",
  "is-actionable",
]);

export function governanceStatusText({
  message = "",
  isError = false,
  shellMode = "",
  hasGovernanceStatus = true,
} = {}) {
  if (!hasGovernanceStatus) {
    return `${isError ? "提示异常" : "提示"}：${message}`;
  }
  return `${shellMode === "user" ? "边缘抽屉提示" : "侧栏提示"}：${message}`;
}

export function governanceStatusClassState({
  isError = false,
  extraClassName = "",
} = {}) {
  const add = [];
  if (isError) add.push("notice-pending");
  for (const className of String(extraClassName).split(/\s+/).filter(Boolean)) {
    if (!add.includes(className)) add.push(className);
  }
  return {
    remove: GOVERNANCE_STATUS_DYNAMIC_CLASSES,
    add,
  };
}
