import assert from "node:assert/strict";
import test from "node:test";
import {
  gatewayJsonHeaders,
  gatewayQueryParam,
  gatewayShellEventsUrl,
  gatewayShellStateUrl,
  resolveGatewayUrlCandidate,
} from "../shell-gateway.js";

test("gatewayJsonHeaders always sends json content type", () => {
  assert.deepEqual(gatewayJsonHeaders(), {
    "Content-Type": "application/json",
  });
});

test("gatewayJsonHeaders attaches bearer session token when present", () => {
  assert.deepEqual(gatewayJsonHeaders("lbst_test_session_token"), {
    "Content-Type": "application/json",
    Authorization: "Bearer lbst_test_session_token",
  });
});

test("gatewayQueryParam extracts optional gateway query value", () => {
  assert.equal(
    gatewayQueryParam("http://127.0.0.1:18081/creative.html?gateway=http%3A%2F%2F127.0.0.1%3A8787"),
    "http://127.0.0.1:8787",
  );
  assert.equal(gatewayQueryParam("http://127.0.0.1:18081/creative.html"), null);
  assert.equal(gatewayQueryParam("not a url"), null);
});

test("resolveGatewayUrlCandidate keeps hub query-only and user pages opt-in", () => {
  assert.equal(
    resolveGatewayUrlCandidate({
      shellPage: "hub",
      queryGateway: "http://127.0.0.1:8787",
      rememberedGateway: "http://old.example",
      protocol: "http:",
      origin: "http://127.0.0.1:18081",
    }),
    "http://127.0.0.1:8787",
  );
  assert.equal(
    resolveGatewayUrlCandidate({
      shellPage: "hub",
      rememberedGateway: "http://old.example",
      protocol: "http:",
      origin: "http://127.0.0.1:18081",
    }),
    null,
  );
  assert.equal(
    resolveGatewayUrlCandidate({
      shellPage: "creative",
      userProjection: true,
      rememberedGateway: "http://127.0.0.1:8787",
      bootstrapGatewayBaseUrl: "http://bootstrap.example",
    }),
    "http://127.0.0.1:8787",
  );
  assert.equal(
    resolveGatewayUrlCandidate({
      shellPage: "creative",
      userProjection: true,
      bootstrapGatewayBaseUrl: "http://bootstrap.example",
    }),
    null,
  );
});

test("resolveGatewayUrlCandidate falls back to bootstrap, remembered, then same origin", () => {
  assert.equal(
    resolveGatewayUrlCandidate({
      shellPage: "admin",
      bootstrapGatewayBaseUrl: "http://bootstrap.example",
      rememberedGateway: "http://remembered.example",
      protocol: "http:",
      origin: "http://127.0.0.1:18081",
    }),
    "http://bootstrap.example",
  );
  assert.equal(
    resolveGatewayUrlCandidate({
      shellPage: "admin",
      rememberedGateway: "http://remembered.example",
      protocol: "http:",
      origin: "http://127.0.0.1:18081",
    }),
    "http://remembered.example",
  );
  assert.equal(
    resolveGatewayUrlCandidate({
      shellPage: "admin",
      protocol: "https:",
      origin: "https://chat.example",
    }),
    "https://chat.example",
  );
  assert.equal(resolveGatewayUrlCandidate({ shellPage: "admin", protocol: "file:" }), null);
});

test("gateway shell URLs include resident scoping and realtime cursor", () => {
  assert.equal(
    gatewayShellStateUrl({
      gatewayUrl: "http://127.0.0.1:8787",
      residentScoped: true,
      residentId: "builder",
    }),
    "http://127.0.0.1:8787/v1/shell/state?resident_id=builder",
  );
  assert.equal(
    gatewayShellEventsUrl({
      gatewayUrl: "http://127.0.0.1:8787",
      residentScoped: true,
      residentId: "builder",
      afterVersion: "v42",
    }),
    "http://127.0.0.1:8787/v1/shell/events?resident_id=builder&after=v42&wait_ms=4000",
  );
});
