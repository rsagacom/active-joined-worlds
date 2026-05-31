export function boundedPermyriad(value, fallback, max = 10000) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, 0), max);
}

export function sceneHotspotSignatureForRoom(room) {
  const layer = room?.hotspot_layer;
  if (!layer || !Array.isArray(layer.hotspots) || layer.hotspots.length === 0) {
    return "static";
  }
  return JSON.stringify({
    roomId: room?.id || "",
    layerId: layer.layer_id || "",
    coordinateSystem: layer.coordinate_system || "",
    hotspots: layer.hotspots.map((hotspot) => ({
      id: hotspot.hotspot_id || "",
      label: hotspot.label || "",
      hint: hotspot.interaction_hint || "",
      x: boundedPermyriad(hotspot.x_permyriad, 0),
      y: boundedPermyriad(hotspot.y_permyriad, 0),
      width: boundedPermyriad(hotspot.width_permyriad, 800),
      height: boundedPermyriad(hotspot.height_permyriad, 600),
    })),
  });
}

export function applySceneHotspotGeometry(element, hotspot) {
  const x = boundedPermyriad(hotspot.x_permyriad, 0);
  const y = boundedPermyriad(hotspot.y_permyriad, 0);
  const width = boundedPermyriad(hotspot.width_permyriad, 800);
  const height = boundedPermyriad(hotspot.height_permyriad, 600);
  element.style.left = `${x / 100}%`;
  element.style.top = `${y / 100}%`;
  element.style.width = `${width / 100}%`;
  element.style.height = `${height / 100}%`;
}

export function createSceneHotspotElement(spec, ownerDocument = globalThis.document) {
  const element = ownerDocument.createElement(spec.href ? "a" : "button");
  element.className = spec.className || "scene-hotspot";
  if (spec.href) {
    element.href = spec.href;
    element.setAttribute("href", spec.href);
  } else {
    element.type = "button";
    element.setAttribute("type", "button");
  }
  element.dataset.hotspotTitle = spec.title || spec.label || "热点";
  element.dataset.hotspotCopy = spec.copy || "";
  if (spec.source) element.dataset.hotspotSource = spec.source;
  if (spec.hotspotId) element.dataset.hotspotId = spec.hotspotId;
  const label = ownerDocument.createElement("span");
  label.textContent = spec.label || spec.title || "热点";
  element.appendChild(label);
  if (spec.geometry) applySceneHotspotGeometry(element, spec.geometry);
  return element;
}

export function sceneHotspotSpecsForLayer(layer) {
  return (layer?.hotspots || []).map((hotspot) => ({
    className: "scene-hotspot scene-hotspot--gateway",
    title: hotspot.label || hotspot.hotspot_id || "热点",
    copy: hotspot.interaction_hint || "",
    label: hotspot.label || hotspot.hotspot_id || "热点",
    source: "gateway",
    hotspotId: hotspot.hotspot_id || "",
    geometry: hotspot,
  }));
}
