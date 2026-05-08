import test from "node:test";
import assert from "node:assert/strict";

import { loadAdminShellApp, loadUnifiedShellApp } from "./fake-dom.mjs";

const serial = { concurrency: false };

async function flushAsyncWork() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test("admin shell can hydrate contract-driven callout and thread status rail", serial, async () => {
  const app = await loadAdminShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
  });
  try {
    const { document } = app;
    const activeRoom = document.querySelector(".room-button.active");
    const activeRoomName = activeRoom?.querySelector(".room-name");
    const roomStageTitle = document.body.querySelector(".conversation-stage-title");
    const caretakerStatus = document.querySelector(".caretaker-status-line");
    const composerInput = document.querySelector("#composer-input");
    const conversationMeta = document.querySelector("#conversation-meta");
    const conversationCallout = document.querySelector(".conversation-callout");
    const threadStatusRail = document.querySelector(".thread-status-rail");
    const composerHero = document.querySelector(".composer-hero");
    const composerMeta = document.querySelector(".composer-meta");
    const composerContext = document.querySelector(".composer-context");
    const composerTip = document.querySelector(".composer-tip");
    const roomDigest = document.querySelector(".room-digest");
    const conversationOverview = document.querySelector(".conversation-overview");
    const chatDetailContent = document.querySelector("#chat-detail-content");

    assert.equal(document.body.dataset.shellMode, "admin");
    assert.ok(activeRoom);
    assert.equal(activeRoomName?.textContent, "合同线程标题 · 广场群聊");
    assert.equal(roomStageTitle?.textContent, "合同线程标题 · 广场群聊");
    assert.match(caretakerStatus?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.equal(composerInput?.placeholder, "发到 合同线程标题 · 广场群聊");
    assert.ok(conversationMeta);
    assert.match(conversationMeta?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.match(
      conversationMeta?.textContent || "",
      /合同聊天状态 · 广场当前安静|委托单已发出，后续等待回执或补充交付。/,
    );
    assert.ok(conversationCallout);
    assert.equal(conversationCallout?.dataset?.variant, "admin");
    assert.match(conversationCallout?.textContent || "", /管理后台/);
    assert.match(
      conversationCallout?.textContent || "",
      /合同线程标题 · 广场群聊 · 跨城共响回廊 · 跨城共响线/,
    );
    assert.match(
      conversationCallout?.textContent || "",
      /合同聊天状态 · 广场当前安静|委托单已发出，后续等待回执或补充交付。/,
    );
    assert.match(
      conversationCallout?.textContent || "",
      /合同队列摘要 · 1 条巡视提醒待处理|1 条访客提醒/,
    );
    assert.ok(threadStatusRail);
    assert.equal(threadStatusRail?.classList?.contains("surface-hidden"), false);
    assert.match(threadStatusRail?.textContent || "", /后台对象/);
    assert.match(threadStatusRail?.textContent || "", /路由/);
    assert.match(threadStatusRail?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.match(
      threadStatusRail?.textContent || "",
      /合同聊天状态 · 广场当前安静|委托单已发出，后续等待回执或补充交付。/,
    );
    assert.match(
      threadStatusRail?.textContent || "",
      /合同队列摘要 · 1 条巡视提醒待处理|1 条访客提醒/,
    );
    assert.ok(composerHero);
    assert.match(composerHero?.textContent || "", /管理后台消息区/);
    assert.match(composerHero?.textContent || "", /发消息到 合同线程标题 · 广场群聊/);
    assert.ok(composerMeta);
    assert.match(composerMeta?.textContent || "", /线程/);
    assert.match(composerMeta?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.match(
      composerMeta?.textContent || "",
      /合同聊天状态 · 广场当前安静|委托单已发出，后续等待回执或补充交付。/,
    );
    assert.match(
      composerMeta?.textContent || "",
      /合同队列摘要 · 1 条巡视提醒待处理|1 条访客提醒/,
    );
    assert.ok(composerContext);
    assert.match(composerContext?.textContent || "", /线程/);
    assert.match(composerContext?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.match(
      composerContext?.textContent || "",
      /合同聊天状态 · 广场当前安静|委托单已发出，后续等待回执或补充交付。/,
    );
    assert.match(composerTip?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.ok(roomDigest);
    assert.match(roomDigest?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.match(roomDigest?.textContent || "", /当前会话 合同线程标题 · 广场群聊/);
    assert.match(
      roomDigest?.textContent || "",
      /合同队列摘要 · 1 条巡视提醒待处理|1 条访客提醒/,
    );
    assert.ok(conversationOverview);
    const overviewHeader = conversationOverview?.querySelector(".overview-header");
    const overviewHeaderTitle = conversationOverview?.querySelector(".overview-title");
    const overviewHeaderSummary = overviewHeader?.querySelector(".overview-summary");
    assert.equal(overviewHeaderTitle?.textContent, "合同线程标题 · 广场群聊");
    assert.equal(overviewHeaderSummary?.textContent, "后台对象 · 合同列表摘要 · 3 人 · 2 条消息");
    assert.match(conversationOverview?.textContent || "", /合同重点摘要 · 回廊总览|当前窗口重点/);
    assert.match(
      conversationOverview?.textContent || "",
      /合同聊天状态 · 广场当前安静|委托单已发出，后续等待回执或补充交付。/,
    );
    assert.match(
      conversationOverview?.textContent || "",
      /合同队列摘要 · 1 条巡视提醒待处理|1 条访客提醒/,
    );
    assert.ok(chatDetailContent);
    assert.match(chatDetailContent?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.match(
      chatDetailContent?.textContent || "",
      /合同聊天状态 · 广场当前安静|委托单已发出，后续等待回执或补充交付。/,
    );
    assert.match(
      chatDetailContent?.textContent || "",
      /合同队列摘要 · 1 条巡视提醒待处理|1 条访客提醒/,
    );
  } finally {
    app.cleanup();
  }
});

test("unified shell can hydrate contract-driven callout and thread status rail", serial, async () => {
  const app = await loadUnifiedShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
  });
  try {
    const { document } = app;
    const activeRoom = document.querySelector(".room-button.active");
    const activeRoomName = activeRoom?.querySelector(".room-name");
    const roomStageTitle = document.body.querySelector(".conversation-stage-title");
    const caretakerStatus = document.querySelector(".caretaker-status-line");
    const composerInput = document.querySelector("#composer-input");
    const conversationMeta = document.querySelector("#conversation-meta");
    const conversationCallout = document.querySelector(".conversation-callout");
    const threadStatusRail = document.querySelector(".thread-status-rail");
    const composerHero = document.querySelector(".composer-hero");
    const composerMeta = document.querySelector(".composer-meta");
    const composerContext = document.querySelector(".composer-context");
    const composerTip = document.querySelector(".composer-tip");
    const roomDigest = document.querySelector(".room-digest");
    const conversationOverview = document.querySelector(".conversation-overview");
    const chatDetailContent = document.querySelector("#chat-detail-content");

    assert.equal(document.body.dataset.shellMode, "unified");
    assert.ok(activeRoom);
    assert.equal(activeRoomName?.textContent, "合同线程标题 · 广场群聊");
    assert.equal(roomStageTitle?.textContent, "合同线程标题 · 广场群聊");
    assert.match(caretakerStatus?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.equal(composerInput?.placeholder, "在 合同线程标题 · 广场群聊 里说点什么");
    assert.ok(conversationMeta);
    assert.match(conversationMeta?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.match(
      conversationMeta?.textContent || "",
      /合同聊天状态 · 广场当前安静|委托单已发出，后续等待回执或补充交付。/,
    );
    assert.ok(conversationCallout);
    assert.equal(conversationCallout?.dataset?.variant, "unified");
    assert.match(conversationCallout?.textContent || "", /城市外世界页/);
    assert.match(conversationCallout?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.match(
      conversationCallout?.textContent || "",
      /合同上下文摘要 · 直接来自 conversation_shell 合同|最近动作：委托|conversation_shell \/ scene_render 合同/,
    );
    assert.ok(threadStatusRail);
    assert.equal(threadStatusRail?.classList?.contains("surface-hidden"), false);
    assert.match(threadStatusRail?.textContent || "", /聊天对象/);
    assert.match(threadStatusRail?.textContent || "", /路由/);
    assert.match(threadStatusRail?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.match(
      threadStatusRail?.textContent || "",
      /合同聊天状态 · 广场当前安静|委托单已发出，后续等待回执或补充交付。/,
    );
    assert.ok(composerHero);
    assert.match(composerHero?.textContent || "", /城市外世界页/);
    assert.match(composerHero?.textContent || "", /发消息到 合同线程标题 · 广场群聊/);
    assert.ok(composerMeta);
    assert.match(composerMeta?.textContent || "", /会话标题/);
    assert.match(composerMeta?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.match(
      composerMeta?.textContent || "",
      /合同聊天状态 · 广场当前安静|委托单已发出，后续等待回执或补充交付。/,
    );
    assert.ok(composerContext);
    assert.match(composerContext?.textContent || "", /会话标题/);
    assert.match(composerContext?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.match(
      composerContext?.textContent || "",
      /合同聊天状态 · 广场当前安静|委托单已发出，后续等待回执或补充交付。/,
    );
    assert.match(composerTip?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.ok(roomDigest);
    assert.match(roomDigest?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.match(roomDigest?.textContent || "", /当前 合同线程标题 · 广场群聊/);
    assert.ok(conversationOverview);
    const overviewHeader = conversationOverview?.querySelector(".overview-header");
    const overviewHeaderTitle = conversationOverview?.querySelector(".overview-title");
    const overviewHeaderSummary = overviewHeader?.querySelector(".overview-summary");
    assert.equal(overviewHeaderTitle?.textContent, "合同线程标题 · 广场群聊");
    assert.equal(overviewHeaderSummary?.textContent, "合同列表摘要 · 3 人 · 2 条消息");
    assert.match(conversationOverview?.textContent || "", /合同重点摘要 · 回廊总览|合同线程标题 · 广场群聊|最近动作：委托/);
    assert.match(
      conversationOverview?.textContent || "",
      /合同聊天状态 · 广场当前安静|委托单已发出，后续等待回执或补充交付。/,
    );
    assert.ok(chatDetailContent);
    assert.match(chatDetailContent?.textContent || "", /合同线程标题 · 广场群聊/);
    assert.match(
      chatDetailContent?.textContent || "",
      /合同聊天状态 · 广场当前安静|委托单已发出，后续等待回执或补充交付。/,
    );
  } finally {
    app.cleanup();
  }
});

test("world-entry shell hydrates route cards from gateway world-entry projection", serial, async () => {
  const app = await loadUnifiedShellApp({
    locationSearch: "?gateway=http://127.0.0.1:50651",
    gatewayBaseUrl: "http://127.0.0.1:50651",
  });
  try {
    const { document, fetchCalls } = app;
    const routeList = document.querySelector(".world-route-list");
    const options = [...routeList.querySelectorAll(".world-route-option")];

    assert.ok(fetchCalls.includes("http://127.0.0.1:50651/v1/world-entry"));
    assert.equal(options.length, 3);
    assert.equal(options[0].getAttribute("href"), "./world-square.html");
    assert.match(options[0].textContent, /世界广场/);
    assert.equal(options[1].getAttribute("href"), "./index.html");
    assert.match(options[1].textContent, /核心港/);
    assert.match(options[1].textContent, /当前主城 · 健康 · 可镜像/);
    assert.equal(options[2].getAttribute("href"), "./index.html?city=signal-bay");
    assert.match(options[2].textContent, /Signal Bay/);
    assert.match(options[2].textContent, /健康 · 可镜像/);
  } finally {
    app.cleanup();
  }
});

test("world-entry shell keeps static route fallback without gateway", serial, async () => {
  const app = await loadUnifiedShellApp();
  try {
    const { document, fetchCalls } = app;
    const routeList = document.querySelector(".world-route-list");
    const options = [...routeList.querySelectorAll(".world-route-option")];

    assert.ok(!fetchCalls.some((call) => call.includes("/v1/world-entry")));
    assert.equal(options.length, 4);
    assert.match(options[0].textContent, /世界广场/);
    assert.match(options[1].textContent, /凛冬城主城/);
    assert.match(options[2].textContent, /海港主城/);
    assert.match(options[3].textContent, /山城主城/);
  } finally {
    app.cleanup();
  }
});

test("non-user shells can switch to direct threads without leaking raw room titles into hero and placeholder", serial, async () => {
  for (const load of [loadAdminShellApp, loadUnifiedShellApp]) {
    const app = await load({
      useGeneratedFixtures: true,
      generatedShellFixture: "generated/state.contract.json",
    });
    try {
      const { document } = app;
      const builderRoom = Array.from(document.querySelectorAll(".room-button")).find((node) =>
        /builder/.test(node.textContent || ""),
      );
      const composerHero = document.querySelector(".composer-hero");
      const composerInput = document.querySelector("#composer-input");
      const roomStageTitle = document.body.querySelector(".conversation-stage-title");
      const conversationMeta = document.querySelector("#conversation-meta");
      const chatDetailContent = document.querySelector("#chat-detail-content");

      assert.ok(builderRoom);
      builderRoom.click();
      await flushAsyncWork();

      assert.match(roomStageTitle?.textContent || "", /合同线程标题 · 居所直聊/);
      assert.match(composerHero?.textContent || "", /合同线程标题 · 居所直聊/);
      assert.match(conversationMeta?.textContent || "", /合同线程标题 · 居所直聊/);
      assert.match(chatDetailContent?.textContent || "", /合同线程标题 · 居所直聊/);
      assert.match(chatDetailContent?.textContent || "", /你与 builder/);
      assert.doesNotMatch(chatDetailContent?.textContent || "", /会话对象\s*居所\s*·\s*builder/);
      assert.ok(
        composerInput?.placeholder === "发消息给 合同线程标题 · 居所直聊" ||
          composerInput?.placeholder === "发给 合同线程标题 · 居所直聊",
      );
    } finally {
      app.cleanup();
    }
  }
});

test("non-user room search can match contract route labels", serial, async () => {
  const app = await loadAdminShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
  });
  try {
    const { document } = app;
    const searchInput = document.querySelector(".search-input");

    assert.ok(searchInput);
    searchInput.value = "跨城共响线";
    searchInput.dispatchEvent({ type: "input", target: searchInput });
    await flushAsyncWork();

    const roomButtons = Array.from(document.querySelectorAll(".room-button"));
    assert.equal(roomButtons.length, 1);
    assert.match(roomButtons[0]?.textContent || "", /合同线程标题 · 广场群聊/);
  } finally {
    app.cleanup();
  }
});

test("non-user room search can match contract workflow summaries", serial, async () => {
  const app = await loadAdminShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
  });
  try {
    const { document } = app;
    const searchInput = document.querySelector(".search-input");

    assert.ok(searchInput);
    searchInput.value = "第一轮回执";
    searchInput.dispatchEvent({ type: "input", target: searchInput });
    await flushAsyncWork();

    const roomButtons = Array.from(document.querySelectorAll(".room-button"));
    assert.equal(roomButtons.length, 1);
    assert.match(roomButtons[0]?.textContent || "", /合同线程标题 · 广场群聊/);
  } finally {
    app.cleanup();
  }
});
