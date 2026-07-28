export function gatewayJsonHeaders(sessionToken = null) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (sessionToken) {
    headers.Authorization = `Bearer ${sessionToken}`;
  }
  return headers;
}

export function gatewayQueryParam(href) {
  try {
    const url = new URL(href);
    return url.searchParams.get("gateway");
  } catch {
    return null;
  }
}

function isLoopbackGatewayUrl(value) {
  return (
    typeof value === "string" &&
    /^https?:\/\/(127\.0\.0\.1|localhost|\[::1\])(:\d+)?\/?$/i.test(value.trim())
  );
}

export function resolveGatewayUrlCandidate({
  shellPage = "hub",
  queryGateway = null,
  rememberedGateway = null,
  bootstrapGatewayBaseUrl = null,
  protocol = "",
  origin = "",
  userProjection = false,
} = {}) {
  // https 公网部署与 Gateway 同源(反向代理 /v1):
  // 1) hub 页无 ?gateway= 时回退到页面 origin,不再要求显式 query;
  // 2) 打包时带入的 dev loopback bootstrap 地址必须忽略,避免浏览器
  //    把消息发到访问者自己的 127.0.0.1。
  const httpsOrigin = protocol === "https:" ? origin || null : null;
  if (shellPage === "hub") {
    return queryGateway || httpsOrigin;
  }
  if (queryGateway) {
    return queryGateway;
  }
  if (userProjection) {
    return rememberedGateway || httpsOrigin;
  }
  if (bootstrapGatewayBaseUrl && !(httpsOrigin && isLoopbackGatewayUrl(bootstrapGatewayBaseUrl))) {
    return bootstrapGatewayBaseUrl;
  }
  if (rememberedGateway && !(httpsOrigin && isLoopbackGatewayUrl(rememberedGateway))) {
    return rememberedGateway;
  }
  if (protocol === "http:" || protocol === "https:") {
    return origin || null;
  }
  return null;
}

export function gatewayShellStateUrl({
  gatewayUrl,
  residentId = "",
  residentScoped = false,
} = {}) {
  const url = new URL(`${gatewayUrl}/v1/shell/state`);
  if (residentScoped) {
    url.searchParams.set("resident_id", residentId);
  }
  return url.toString();
}

export function gatewayShellEventsUrl({
  gatewayUrl,
  residentId = "",
  residentScoped = false,
  afterVersion = null,
  waitMs = 4000,
} = {}) {
  const url = new URL(`${gatewayUrl}/v1/shell/events`);
  if (residentScoped) {
    url.searchParams.set("resident_id", residentId);
  }
  if (afterVersion) {
    url.searchParams.set("after", afterVersion);
    url.searchParams.set("wait_ms", String(waitMs));
  }
  return url.toString();
}
