import test from "node:test";
import assert from "node:assert/strict";

import { loadUnifiedShellApp } from "./fake-dom.mjs";

const serial = { concurrency: false };

test("world-entry fetches /v1/world-entry when gateway is present", serial, async () => {
  const app = await loadUnifiedShellApp({
    gatewayBaseUrl: "http://127.0.0.1:50651",
    locationSearch: "?gateway=http://127.0.0.1:50651",
  });

  try {
    const { fetchCalls } = app;
    assert.ok(
      fetchCalls.some((call) => call === "http://127.0.0.1:50651/v1/world-entry"),
      "should fetch /v1/world-entry",
    );
  } finally {
    app.cleanup();
  }
});

test("world-entry falls back to static routes when gateway fetch fails", serial, async () => {
  const app = await loadUnifiedShellApp({
    gatewayBaseUrl: "http://127.0.0.1:59999",
    locationSearch: "?gateway=http://127.0.0.1:59999",
  });

  try {
    const { document, fetchCalls } = app;
    assert.ok(
      fetchCalls.some((call) => call === "http://127.0.0.1:59999/v1/world-entry"),
      "should attempt to fetch /v1/world-entry",
    );
    const routeList = document.querySelector(".world-route-list");
    assert.ok(routeList, "route list should exist");
    const staticOptions = routeList.querySelectorAll(".world-route-option");
    assert.equal(staticOptions.length, 4, "static fallback keeps pre-rendered route cards");
    assert.match(staticOptions[0].textContent, /世界广场/);
    assert.match(staticOptions[1].textContent, /凛冬城主城/);
    assert.match(staticOptions[2].textContent, /海港主城/);
    assert.match(staticOptions[3].textContent, /山城主城/);
  } finally {
    app.cleanup();
  }
});

test("world-entry renders routes via DOM API with textContent", serial, async () => {
  const app = await loadUnifiedShellApp({
    gatewayBaseUrl: "http://127.0.0.1:50651",
    locationSearch: "?gateway=http://127.0.0.1:50651",
  });

  try {
    const { document } = app;
    const routeList = document.querySelector(".world-route-list");
    assert.ok(routeList, "route list should exist");

    const options = routeList.querySelectorAll(".world-route-option");
    assert.equal(options.length, 3, "should render world-square plus gateway routes");

    const first = options[0];
    assert.equal(first.getAttribute("href"), "./world-square.html");
    assert.ok(first.classList.contains("world-route-option-square"), "world-square route should be visually distinct");
    assert.match(first.textContent, /世界广场/);
    assert.match(first.textContent, /概念图 · 公共广场/);

    const second = options[1];
    assert.equal(second.getAttribute("href"), "./index.html");
    assert.ok(second.classList.contains("is-current"), "current city should have is-current class");
    assert.match(second.textContent, /核心港/);
    assert.match(second.textContent, /当前主城广场/);
    assert.match(second.textContent, /当前主城 · 健康 · 可镜像/);

    const third = options[2];
    assert.equal(third.getAttribute("href"), "./index.html?city=signal-bay");
    assert.ok(!third.classList.contains("is-current"), "non-current city should not have is-current class");
    assert.match(third.textContent, /Signal Bay/);
    assert.match(third.textContent, /visible city route/);
    assert.match(third.textContent, /健康 · 可镜像/);
  } finally {
    app.cleanup();
  }
});

test("world-entry preserves metro entry title and does not revert to generic", serial, async () => {
  const app = await loadUnifiedShellApp({
    gatewayBaseUrl: "http://127.0.0.1:50651",
    locationSearch: "?gateway=http://127.0.0.1:50651",
  });

  try {
    const { document } = app;
    assert.equal(document.title, "龙虾聊天 · 世界入口");
    assert.doesNotMatch(document.title, /城市外世界页/);
  } finally {
    app.cleanup();
  }
});

test("world-entry does not fetch /v1/world-entry when no gateway is present", serial, async () => {
  const app = await loadUnifiedShellApp();

  try {
    const { fetchCalls } = app;
    assert.ok(
      !fetchCalls.some((call) => call.includes("/v1/world-entry")),
      "should not fetch /v1/world-entry without gateway",
    );
  } finally {
    app.cleanup();
  }
});

test("world-entry route rendering uses backend href without cross-city state拼接", serial, async () => {
  const app = await loadUnifiedShellApp({
    gatewayBaseUrl: "http://127.0.0.1:50651",
    locationSearch: "?gateway=http://127.0.0.1:50651",
  });

  try {
    const { document } = app;
    const options = document.querySelectorAll(".world-route-option");
    assert.equal(options[0].getAttribute("href"), "./world-square.html");
    assert.equal(options[1].getAttribute("href"), "./index.html");
    assert.equal(options[2].getAttribute("href"), "./index.html?city=signal-bay");
  } finally {
    app.cleanup();
  }
});
