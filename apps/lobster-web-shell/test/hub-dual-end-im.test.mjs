import test from "node:test";
import assert from "node:assert/strict";
import { loadHubShellApp } from "./fake-dom.mjs";

const serial = { concurrency: false };

async function flushAsyncWork() {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

test("hub shell renders every message with avatar and never groups consecutive rows", serial, async () => {
  const app = await loadHubShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651",
    gatewayBaseUrl: "http://127.0.0.1:50651",
    localStorageEntries: { "lobster-identity": "qa1" },
  });
  try {
    const { document } = app;
    const messageRows = document.querySelectorAll(".message-row");
    assert.ok(messageRows.length > 0, "should have rendered message rows");

    for (const row of messageRows) {
      assert.ok(
        row.querySelector(".message-avatar"),
        `every message row must have an avatar: ${row.textContent?.slice(0, 40)}`,
      );
      assert.notEqual(
        row.getAttribute("data-grouped"),
        "true",
        "hub pages must not group consecutive messages",
      );
    }
  } finally {
    app.cleanup();
  }
});

test("hub shell self messages stay on the right and peer messages stay on the left", serial, async () => {
  const app = await loadHubShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651&identity=builder&qa=browser",
    gatewayBaseUrl: "http://127.0.0.1:50651",
    localStorageEntries: { "lobster-identity": "builder" },
  });
  try {
    const { document } = app;
    const rows = Array.from(document.querySelectorAll(".message-row"));
    assert.ok(rows.length > 0, "should have message rows");

    const selfRows = rows.filter((r) => r.classList.contains("self"));
    const peerRows = rows.filter((r) => r.dataset.messageSide === "peer");
    const systemRows = rows.filter((r) => r.dataset.messageSide === "system");

    assert.ok(peerRows.length > 0, "fixture should contain peer messages");

    for (const row of selfRows) {
      assert.equal(row.dataset.messageSide, "self", "self row must have data-message-side=self");
      assert.ok(row.querySelector(".message-avatar"), "self row must have avatar");
    }

    for (const row of peerRows) {
      assert.equal(row.dataset.messageSide, "peer", "peer row must have data-message-side=peer");
      assert.ok(row.querySelector(".message-avatar"), "peer row must have avatar");
    }

    for (const row of systemRows) {
      assert.equal(row.dataset.messageSide, "system", "system row must have data-message-side=system");
      assert.ok(row.querySelector(".message-avatar"), "system row must have avatar");
    }
  } finally {
    app.cleanup();
  }
});

test("hub shell switching identity re-renders message sides for same room", serial, async () => {
  const app = await loadHubShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651&identity=qa1&qa=browser",
    gatewayBaseUrl: "http://127.0.0.1:50651",
    localStorageEntries: { "lobster-identity": "qa1" },
  });
  try {
    const { document } = app;
    const identityInput = document.querySelector("#identity-input");
    assert.ok(identityInput, "identity input must exist for tab simulation");

    // First identity: qa1
    let rows = Array.from(document.querySelectorAll(".message-row"));
    let selfRows = rows.filter((r) => r.classList.contains("self"));
    let peerRows = rows.filter((r) => !r.classList.contains("self"));
    const initialSelfCount = selfRows.length;
    const initialPeerCount = peerRows.length;

    // Switch to builder (who has messages in the fixture)
    identityInput.value = "builder";
    identityInput.dispatchEvent(new Event("change", { bubbles: true }));
    for (let i = 0; i < 6; i += 1) {
      await flushAsyncWork();
    }

    rows = Array.from(document.querySelectorAll(".message-row"));
    selfRows = rows.filter((r) => r.classList.contains("self"));
    peerRows = rows.filter((r) => !r.classList.contains("self"));

    assert.ok(
      selfRows.length !== initialSelfCount || peerRows.length !== initialPeerCount,
      "side distribution should change after identity switch",
    );
    assert.ok(selfRows.length > 0, "after switching, builder messages should appear as self");
    assert.ok(peerRows.length > 0, "after switching, non-builder messages should appear as peer");
  } finally {
    app.cleanup();
  }
});

test("hub shell gateway send clears input and leaves exactly one committed row", serial, async () => {
  const app = await loadHubShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651&identity=qa1&qa=browser",
    gatewayBaseUrl: "http://127.0.0.1:50651",
    localStorageEntries: { "lobster-identity": "qa1" },
  });
  try {
    const { document } = app;
    const composerForm = document.querySelector("#composer");
    const composerInput = document.querySelector("#composer-input");
    const text = `hub-send-${Date.now()}`;

    assert.ok(composerForm);
    assert.ok(composerInput);
    assert.equal(composerInput.disabled, false);

    composerInput.value = text;
    composerInput.dispatchEvent(new Event("input", { bubbles: true }));
    composerForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    for (let i = 0; i < 8; i += 1) {
      await flushAsyncWork();
    }

    const matchingRows = Array.from(document.querySelectorAll(".message-row")).filter((row) =>
      (row.textContent || "").includes(text),
    );

    assert.equal(composerInput.value, "", "composer input must be cleared immediately after send");
    assert.equal(matchingRows.length, 1, "pending echo must be replaced by exactly one committed row");
    assert.equal(matchingRows[0]?.classList.contains("self"), true, "committed row must be on the right");
    assert.match(
      matchingRows[0]?.dataset.messageId || "",
      /^msg:test-shell-message:/,
      "committed row must expose stable data-message-id for audits and message actions",
    );
    assert.equal(
      matchingRows[0]?.querySelector(".message-pending"),
      null,
      "committed row must not carry pending class",
    );
    assert.doesNotMatch(
      matchingRows[0]?.textContent || "",
      /待同步|正在投递|发送失败|待重发/,
      "committed row must not show pending or failed copy",
    );
  } finally {
    app.cleanup();
  }
});

test("hub shell keeps local-memory gateway composer online without upstream provider", serial, async () => {
  const app = await loadHubShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651&identity=qa-a&qa=browser",
    gatewayBaseUrl: "http://127.0.0.1:50651",
    localStorageEntries: { "lobster-identity": "qa-a" },
    gatewayProviderState: {
      mode: "local-memory",
      reachable: true,
      connection_state: "Disconnected",
      base_url: null,
    },
  });
  try {
    const { document } = app;
    const composerInput = document.querySelector("#composer-input");
    const composerSend = document.querySelector("#composer-send");

    assert.equal(document.body.dataset.gatewayConnection, "online");
    assert.equal(composerInput?.disabled, false);
    composerInput.value = "local gateway online";
    composerInput.dispatchEvent(new Event("input", { bubbles: true }));
    assert.equal(composerSend?.disabled, false);
    assert.doesNotMatch(composerInput?.placeholder || "", /离线|同步恢复/);
  } finally {
    app.cleanup();
  }
});

test("hub shell gateway send failure keeps input cleared and shows failed pending bubble", serial, async () => {
  const app = await loadHubShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651",
    gatewayBaseUrl: "http://127.0.0.1:50651",
    localStorageEntries: { "lobster-identity": "qa1" },
    gatewayMessageShouldFail: true,
  });
  try {
    const { document } = app;
    const composerForm = document.querySelector("#composer");
    const composerInput = document.querySelector("#composer-input");
    const text = `hub-fail-${Date.now()}`;

    assert.ok(composerForm);
    assert.ok(composerInput);
    assert.equal(composerInput.disabled, false);

    composerInput.value = text;
    composerInput.dispatchEvent(new Event("input", { bubbles: true }));
    composerForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    for (let i = 0; i < 8; i += 1) {
      await flushAsyncWork();
    }

    const matchingRows = Array.from(document.querySelectorAll(".message-row")).filter((row) =>
      (row.textContent || "").includes(text),
    );

    assert.equal(composerInput.value, "", "composer input must stay cleared after failure");
    assert.equal(matchingRows.length, 1, "exactly one failed pending row must remain");
    assert.equal(
      matchingRows[0]?.classList.contains("self"),
      true,
      "failed pending row must stay on the right",
    );
    assert.equal(
      matchingRows[0]?.dataset.messageSide,
      "self",
      "failed pending row must keep the same side contract as committed self messages",
    );
    assert.ok(
      matchingRows[0]?.querySelector(".message-pending-failed"),
      "failed row must carry message-pending-failed class",
    );
    assert.match(
      matchingRows[0]?.textContent || "",
      /发送失败|待重发/,
      "failed row must show failure copy",
    );
  } finally {
    app.cleanup();
  }
});

test("hub shell failed pending bubble can retry and become one committed row", serial, async () => {
  const app = await loadHubShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651",
    gatewayBaseUrl: "http://127.0.0.1:50651",
    localStorageEntries: { "lobster-identity": "qa1" },
    gatewayMessageFailuresBeforeSuccess: 1,
  });
  try {
    const { document, fetchRequests } = app;
    const composerForm = document.querySelector("#composer");
    const composerInput = document.querySelector("#composer-input");
    const text = `hub-retry-${Date.now()}`;

    assert.ok(composerForm);
    assert.ok(composerInput);

    composerInput.value = text;
    composerInput.dispatchEvent(new Event("input", { bubbles: true }));
    composerForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    for (let i = 0; i < 8; i += 1) {
      await flushAsyncWork();
    }

    const retryButton = document.querySelector('[data-pending-action="retry"]');
    assert.ok(retryButton, "failed pending row must expose a retry button");
    assert.match(retryButton.textContent || "", /重发/);

    retryButton.click();
    for (let i = 0; i < 10; i += 1) {
      await flushAsyncWork();
    }

    const matchingRows = Array.from(document.querySelectorAll(".message-row")).filter((row) =>
      (row.textContent || "").includes(text),
    );
    const messagePosts = fetchRequests.filter((request) => request.url.endsWith("/v1/shell/message"));

    assert.equal(messagePosts.length, 2, "retry must post the same message a second time");
    assert.equal(matchingRows.length, 1, "retry must not leave a duplicate failed bubble");
    assert.equal(matchingRows[0]?.querySelector(".message-pending-failed"), null);
    assert.doesNotMatch(matchingRows[0]?.textContent || "", /发送失败|待重发/);
    assert.equal(composerInput.value, "", "retry must keep composer cleared");
  } finally {
    app.cleanup();
  }
});

test("hub shell self messages expose edit and recall actions backed by gateway state", serial, async () => {
  const app = await loadHubShellApp({
    useGeneratedFixtures: true,
    generatedShellFixture: "generated/state.contract.json",
    locationSearch: "?gateway=http://127.0.0.1:50651&identity=qa1&qa=browser",
    gatewayBaseUrl: "http://127.0.0.1:50651",
    localStorageEntries: { "lobster-identity": "qa1" },
  });
  try {
    const { document, window } = app;
    window.confirm = () => true;
    const composerForm = document.querySelector("#composer");
    const composerInput = document.querySelector("#composer-input");
    const text = `hub-actions-${Date.now()}`;
    const editedText = `${text}-edited`;

    composerInput.value = text;
    composerInput.dispatchEvent(new Event("input", { bubbles: true }));
    composerForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    for (let i = 0; i < 8; i += 1) {
      await flushAsyncWork();
    }

    const sentRow = Array.from(document.querySelectorAll(".message-row")).find((row) =>
      (row.textContent || "").includes(text),
    );
    assert.ok(sentRow, "sent self row should render");
    const sentArticle = sentRow.querySelector(".message[data-message-stable-id]");
    assert.ok(sentArticle, "self committed row should carry stable id for action sheet");
    // fake-dom 不模拟冒泡:预置 target 并在 timeline 上派发,等价于事件冒泡到委托监听器
    const timeline = document.querySelector("#timeline");
    const contextEvent = new Event("contextmenu", { bubbles: true, cancelable: true });
    contextEvent.target = sentArticle;
    timeline.dispatchEvent(contextEvent);
    const sheetMask = document.querySelector(".message-action-sheet-mask");
    assert.ok(sheetMask && !sheetMask.hidden, "action sheet should open on contextmenu");
    const editButton = sheetMask.querySelector('[data-sheet-action="edit"]');
    const recallButton = sheetMask.querySelector('[data-sheet-action="recall"]');
    assert.ok(editButton, "action sheet should expose edit action");
    assert.ok(recallButton, "action sheet should expose recall action");

    editButton.click();
    assert.equal(composerInput.value, text);
    assert.equal(composerForm.dataset.editingMessageId?.startsWith("msg:test-shell-message:"), true);
    composerInput.value = editedText;
    composerInput.dispatchEvent(new Event("input", { bubbles: true }));
    composerForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    for (let i = 0; i < 8; i += 1) {
      await flushAsyncWork();
    }

    const editedRow = Array.from(document.querySelectorAll(".message-row")).find((row) =>
      (row.textContent || "").includes(editedText),
    );
    assert.ok(editedRow, "edited self row should render");
    assert.ok(editedRow.querySelector(".message-edited"), "edited self row should show edited chip");
    assert.equal(composerForm.dataset.editingMessageId || "", "");

    const editedArticle = editedRow.querySelector(".message[data-message-stable-id]");
    assert.ok(editedArticle, "edited self row should carry stable id");
    const recallEvent = new Event("contextmenu", { bubbles: true, cancelable: true });
    recallEvent.target = editedArticle;
    timeline.dispatchEvent(recallEvent);
    const editedRecallButton = document
      .querySelector(".message-action-sheet-mask")
      ?.querySelector('[data-sheet-action="recall"]');
    assert.ok(editedRecallButton, "action sheet should still expose recall action");
    editedRecallButton.click();
    for (let i = 0; i < 8; i += 1) {
      await flushAsyncWork();
    }

    const recalledRow = Array.from(document.querySelectorAll(".message-row")).find((row) =>
      row.querySelector(".message-body-recalled"),
    );
    assert.ok(recalledRow, "recalled row should render");
    assert.equal(recalledRow.querySelector(".message-body")?.textContent, "消息已撤回");
    assert.doesNotMatch(recalledRow.textContent || "", new RegExp(editedText));
  } finally {
    app.cleanup();
  }
});
