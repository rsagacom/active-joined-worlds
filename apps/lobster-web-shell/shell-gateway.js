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

export function resolveGatewayUrlCandidate({
  shellPage = "hub",
  queryGateway = null,
  rememberedGateway = null,
  bootstrapGatewayBaseUrl = null,
  protocol = "",
  origin = "",
  userProjection = false,
} = {}) {
  if (shellPage === "hub") {
    return queryGateway || null;
  }
  if (queryGateway) {
    return queryGateway;
  }
  if (userProjection) {
    return rememberedGateway || null;
  }
  if (bootstrapGatewayBaseUrl) {
    return bootstrapGatewayBaseUrl;
  }
  if (rememberedGateway) {
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
