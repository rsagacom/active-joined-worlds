export function gatewayErrorMessage(parsed, text, status) {
  const message =
    parsed?.message ||
    parsed?.Error?.message ||
    parsed?.error?.message ||
    parsed?.error ||
    text ||
    `${status}`;
  return typeof message === "string" ? message : `${status}`;
}

export function localizedRuntimeError(error, fallbackMessage) {
  const message = typeof error?.message === "string" ? error.message.trim() : "";
  if (!message) return fallbackMessage;
  if (message === "login required before sending messages") return "请先登录后发送";
  if (message === "message text required") return "请输入内容后发送";
  if (/^room .+ is frozen$/.test(message)) return "房间已冻结，暂不能发送";
  if (/^unknown public room:/.test(message)) return "房间不存在，无法发送";
  if (/^resident .+ is not active in city .+$/.test(message)) return "当前居民不在该城市，无法发送";
  if (/^authorization bearer token required$/i.test(message)) return "登录已失效，请重新登录";
  if (/^invalid or expired session$/i.test(message)) return "登录已失效，请重新登录";
  if (/^sender .+ does not match authenticated session/.test(message)) return "登录身份不匹配，请重新登录";
  if (/^Unauthorized$/i.test(message)) return "登录已失效，请重新登录";
  return /[A-Za-z]/.test(message) ? fallbackMessage : message;
}
