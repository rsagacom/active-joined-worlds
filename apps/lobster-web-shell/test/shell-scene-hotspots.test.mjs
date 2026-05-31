import assert from "node:assert/strict";
import test from "node:test";
import {
  boundedPermyriad,
  createSceneHotspotElement,
  sceneHotspotSignatureForRoom,
  sceneHotspotSpecsForLayer,
} from "../shell-scene-hotspots.js";

function createMinimalDocument() {
  return {
    createElement(tagName) {
      return {
        tagName: String(tagName).toUpperCase(),
        children: [],
        dataset: {},
        style: {},
        setAttribute(name, value) {
          this[name] = String(value);
        },
        appendChild(child) {
          this.children.push(child);
          return child;
        },
      };
    },
  };
}

const layer = {
  layer_id: "home-hotspots",
  coordinate_system: "scene-permyriad",
  hotspots: [
    {
      hotspot_id: "desk",
      label: "工位",
      interaction_hint: "查看工作台",
      x_permyriad: 4220,
      y_permyriad: 3000,
      width_permyriad: 900,
      height_permyriad: 650,
    },
  ],
};

test("scene hotspot helpers clamp permyriad geometry and build stable specs", () => {
  assert.equal(boundedPermyriad(-10, 5), 0);
  assert.equal(boundedPermyriad("bad", 5), 5);
  assert.equal(boundedPermyriad(12000, 5), 10000);

  const specs = sceneHotspotSpecsForLayer(layer);
  assert.equal(specs.length, 1);
  assert.equal(specs[0].source, "gateway");
  assert.equal(specs[0].hotspotId, "desk");
  assert.equal(specs[0].label, "工位");
});

test("scene hotspot signature is stable and falls back to static without gateway layer", () => {
  assert.equal(sceneHotspotSignatureForRoom({ id: "room-a" }), "static");
  assert.match(sceneHotspotSignatureForRoom({ id: "room-a", hotspot_layer: layer }), /home-hotspots/);
  assert.match(sceneHotspotSignatureForRoom({ id: "room-a", hotspot_layer: layer }), /desk/);
});

test("createSceneHotspotElement maps gateway geometry to percentage styles", () => {
  const [spec] = sceneHotspotSpecsForLayer(layer);
  const element = createSceneHotspotElement(spec, createMinimalDocument());

  assert.equal(element.tagName, "BUTTON");
  assert.equal(element.type, "button");
  assert.equal(element.dataset.hotspotSource, "gateway");
  assert.equal(element.dataset.hotspotId, "desk");
  assert.equal(element.style.left, "42.2%");
  assert.equal(element.style.top, "30%");
  assert.equal(element.style.width, "9%");
  assert.equal(element.style.height, "6.5%");
  assert.equal(element.children[0].textContent, "工位");
});
