import assert from "node:assert/strict";
import test from "node:test";
import {
  sceneIntroStorageKey,
  staticSceneHotspotSpecs,
} from "../shell-scene-runtime.js";

function hotspotFixture() {
  return {
    className: "scene-hotspot scene-hotspot--desk",
    dataset: {
      hotspotTitle: "工位",
      hotspotCopy: "打开当前会话资料。",
    },
    textContent: "工位",
    getAttribute(name) {
      return name === "href" ? "" : null;
    },
    querySelector(selector) {
      if (selector !== "span") return null;
      return { textContent: "工位" };
    },
  };
}

test("staticSceneHotspotSpecs preserves static hotspot labels and copy", () => {
  const [spec] = staticSceneHotspotSpecs([hotspotFixture()]);

  assert.equal(spec.className, "scene-hotspot scene-hotspot--desk");
  assert.equal(spec.href, "");
  assert.equal(spec.title, "工位");
  assert.equal(spec.copy, "打开当前会话资料。");
  assert.equal(spec.label, "工位");
});

test("sceneIntroStorageKey scopes first-run hint by page and shell variant", () => {
  const key = sceneIntroStorageKey({
    body: {
      dataset: {
        shellVariant: "creative-terminal",
        shellPage: "user",
      },
    },
    locationLike: {
      pathname: "/creative.html",
    },
  });

  assert.equal(key, "lobster-scene-intro-seen:/creative.html:creative-terminal");
});
