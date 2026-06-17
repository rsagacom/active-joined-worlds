import {
  createSceneHotspotElement,
  sceneHotspotSignatureForRoom,
  sceneHotspotSpecsForLayer,
} from "./shell-scene-hotspots.js";

const DEFAULT_STAGE_SELECTOR = ".creative-stage, .public-square-stage, .world-entry-stage, .user-stage";

export function staticSceneHotspotSpecs(hotspots = []) {
  return Array.from(hotspots).map((hotspot) => ({
    className: hotspot.className || "scene-hotspot",
    href: hotspot.getAttribute?.("href") || "",
    title: hotspot.dataset?.hotspotTitle || hotspot.textContent?.trim() || "热点",
    copy: hotspot.dataset?.hotspotCopy || "",
    label: hotspot.querySelector?.("span")?.textContent?.trim() || hotspot.textContent?.trim() || "热点",
  }));
}

export function sceneIntroStorageKey({ body, locationLike, stageVariant = "scene" } = {}) {
  const variant = body?.dataset?.shellVariant || body?.dataset?.shellPage || stageVariant;
  const pathname = locationLike?.pathname || "/";
  return `lobster-scene-intro-seen:${pathname}:${variant}`;
}

export function initSceneRuntime({
  documentRef = globalThis.document,
  windowRef = globalThis.window,
  stageSelector = DEFAULT_STAGE_SELECTOR,
  restoreSelector = ".creative-chat-frame, .public-square-chat, .user-chat-frame",
  hotspotContainerSelector = ".scene-hotspots",
  labelLayerSelector = ".scene-hotspot-label-layer",
  onEscape,
  isRailOpen,
  closeRail,
} = {}) {
  const body = documentRef?.body;
  const stageEl = documentRef?.querySelector?.(stageSelector) || null;
  const restoreEl = documentRef?.querySelector?.(restoreSelector) || null;
  const hotspotContainerEl = documentRef?.querySelector?.(hotspotContainerSelector) || null;
  const labelLayerEl = documentRef?.querySelector?.(labelLayerSelector) || null;
  let hotspotEls = Array.from(documentRef?.querySelectorAll?.(".scene-hotspot") || []);
  let hotspotLabelEls = [];
  const fallbackHotspotSpecs = staticSceneHotspotSpecs(hotspotEls);
  let hotspotLayerSignature = "";
  let popoverEl = null;
  let popoverCloseTimer = null;
  let labelTimer = null;
  let hotspotLabelsVisible = false;

  function refreshHotspots() {
    hotspotEls = Array.from(documentRef?.querySelectorAll?.(".scene-hotspot") || []);
  }

  function closePopover() {
    if (popoverCloseTimer) {
      clearTimeout(popoverCloseTimer);
      popoverCloseTimer = null;
    }
    popoverEl?.remove?.();
    popoverEl = null;
    hotspotEls.forEach((button) => button.removeAttribute?.("aria-expanded"));
  }

  function setNearHotspot(targetHotspot) {
    hotspotEls.forEach((button) => {
      button.classList?.toggle("is-near-pointer", button === targetHotspot);
    });
    hotspotLabelEls.forEach((label) => {
      const matches = targetHotspot && label.dataset?.hotspotIndex === targetHotspot.dataset?.hotspotIndex;
      label.classList?.toggle("is-near-pointer", Boolean(matches));
    });
  }

  function hotspotLabelText(button) {
    return button.querySelector?.("span")?.textContent?.trim()
      || button.dataset?.hotspotTitle
      || button.textContent?.trim()
      || "热点";
  }

  function renderHotspotLabelLayer() {
    if (!labelLayerEl || !stageEl) {
      hotspotLabelEls = [];
      return;
    }
    const stageRect = stageEl.getBoundingClientRect?.();
    if (!stageRect) {
      hotspotLabelEls = [];
      return;
    }
    const labels = hotspotEls.map((button, index) => {
      const rect = button.getBoundingClientRect?.();
      const label = documentRef.createElement("span");
      label.className = "scene-hotspot-label-chip";
      label.dataset.hotspotIndex = String(index);
      label.dataset.hotspotTitle = button.dataset?.hotspotTitle || "";
      label.textContent = hotspotLabelText(button);
      if (button.dataset) button.dataset.hotspotIndex = String(index);
      if (rect) {
        label.style.left = `${rect.left - stageRect.left + rect.width / 2}px`;
        label.style.top = `${rect.top - stageRect.top + rect.height / 2}px`;
      }
      return label;
    });
    labelLayerEl.replaceChildren?.(...labels);
    hotspotLabelEls = labels;
  }

  function setHotspotLabelsVisible(visible, { autoHideMs = 3200 } = {}) {
    hotspotLabelsVisible = Boolean(visible);
    if (hotspotLabelsVisible) renderHotspotLabelLayer();
    body?.classList?.toggle("scene-hotspot-labels-visible", hotspotLabelsVisible);
    if (labelTimer) {
      clearTimeout(labelTimer);
      labelTimer = null;
    }
    if (hotspotLabelsVisible && autoHideMs > 0) {
      labelTimer = setTimeout(() => setHotspotLabelsVisible(false), autoHideMs);
    }
  }

  function setClearMode(enabled) {
    if (enabled) {
      closePopover();
      setHotspotLabelsVisible(true, { autoHideMs: 0 });
    } else {
      setHotspotLabelsVisible(false);
      setNearHotspot(null);
    }
    body?.classList?.toggle("scene-clear-mode", Boolean(enabled));
  }

  function isClearMode() {
    return Boolean(body?.classList?.contains("scene-clear-mode"));
  }

  function schedulePopoverClose(delayMs = 1200) {
    if (popoverCloseTimer) clearTimeout(popoverCloseTimer);
    popoverCloseTimer = setTimeout(() => closePopover(), delayMs);
  }

  function openPopover(button) {
    const stage = button.closest?.(stageSelector);
    if (!stage) return;
    closePopover();
    const title = button.dataset?.hotspotTitle || button.textContent?.trim() || "热点";
    const copy = button.dataset?.hotspotCopy || "";
    const buttonRect = button.getBoundingClientRect?.();
    const stageRect = stage.getBoundingClientRect?.();
    if (!buttonRect || !stageRect) return;
    const left = Math.min(Math.max(buttonRect.left - stageRect.left + buttonRect.width / 2, 132), stageRect.width - 132);
    const top = Math.min(Math.max(buttonRect.top - stageRect.top + buttonRect.height + 10, 72), stageRect.height - 112);
    const popover = documentRef.createElement("div");
    popover.className = "scene-hotspot-popover";
    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
    const popoverTitle = documentRef.createElement("div");
    popoverTitle.className = "scene-hotspot-title";
    popoverTitle.textContent = title;
    const popoverCopy = documentRef.createElement("div");
    popoverCopy.className = "scene-hotspot-copy";
    popoverCopy.textContent = copy;
    popover.appendChild(popoverTitle);
    popover.appendChild(popoverCopy);
    stage.appendChild(popover);
    button.setAttribute?.("aria-expanded", "true");
    popoverEl = popover;
  }

  function bindHotspot(button) {
    if (!button || button.dataset?.sceneHotspotBound === "true") return;
    const isNavigationHotspot = button.tagName?.toLowerCase() === "a" && button.getAttribute?.("href");
    button.setAttribute?.("aria-expanded", "false");
    button.addEventListener?.("mouseenter", () => {
      setNearHotspot(button);
      openPopover(button);
    });
    button.addEventListener?.("mouseleave", () => {
      setNearHotspot(null);
      schedulePopoverClose(220);
    });
    button.addEventListener?.("focus", () => {
      setNearHotspot(button);
      openPopover(button);
    });
    button.addEventListener?.("blur", () => {
      setNearHotspot(null);
      schedulePopoverClose(220);
    });
    button.addEventListener?.("click", (event) => {
      if (!isNavigationHotspot) {
        event.stopPropagation?.();
      }
      setHotspotLabelsVisible(false);
      setClearMode(false);
      setNearHotspot(button);
      openPopover(button);
      if (!isNavigationHotspot) {
        schedulePopoverClose(1600);
      }
    });
    button.dataset.sceneHotspotBound = "true";
  }

  function bindHotspots() {
    refreshHotspots();
    hotspotEls.forEach(bindHotspot);
    renderHotspotLabelLayer();
  }

  function renderSceneHotspotsForRoom(room) {
    if (!hotspotContainerEl) {
      refreshHotspots();
      return;
    }
    const signature = sceneHotspotSignatureForRoom(room);
    if (signature === hotspotLayerSignature) return;
    closePopover();
    setNearHotspot(null);
    hotspotLayerSignature = signature;
    const layer = room?.hotspot_layer;
    const specs =
      layer && Array.isArray(layer.hotspots) && layer.hotspots.length
        ? sceneHotspotSpecsForLayer(layer)
        : fallbackHotspotSpecs;
    hotspotContainerEl.replaceChildren(
      ...specs.map((spec) => createSceneHotspotElement(spec, documentRef)),
    );
    bindHotspots();
    renderHotspotLabelLayer();
  }

  function updateNearHotspot(event) {
    if (!hotspotEls.length) {
      setNearHotspot(null);
      return;
    }
    const padding = 48;
    if (hotspotLabelsVisible) renderHotspotLabelLayer();
    const targetHotspot = hotspotEls.find((button) => {
      const rect = button.getBoundingClientRect?.();
      if (!rect) return false;
      return (
        event.clientX >= rect.left - padding &&
        event.clientX <= rect.right + padding &&
        event.clientY >= rect.top - padding &&
        event.clientY <= rect.bottom + padding
      );
    });
    setNearHotspot(targetHotspot || null);
  }

  function applyIntroState() {
    if (!stageEl || !body) return;
    const key = sceneIntroStorageKey({
      body,
      locationLike: windowRef?.location || globalThis.location,
    });
    try {
      if (windowRef?.localStorage?.getItem(key) === "1") {
        body.classList.add("scene-intro-seen");
        return;
      }
      body.classList.add("scene-intro-first");
      windowRef?.localStorage?.setItem(key, "1");
    } catch {
      body.classList.add("scene-intro-first");
    }
  }

  function bindStageEvents() {
    if (!stageEl) return;
    stageEl.addEventListener("pointermove", updateNearHotspot);
    stageEl.addEventListener("pointerleave", () => setNearHotspot(null));
    stageEl.addEventListener("touchstart", (event) => {
      const touch = event.touches?.[0];
      if (touch) updateNearHotspot({ clientX: touch.clientX, clientY: touch.clientY });
    }, { passive: true });
    stageEl.addEventListener("touchend", () => {
      setTimeout(() => setNearHotspot(null), 600);
    });
    stageEl.addEventListener("click", (event) => {
      if (event.target.closest(".message, .message-avatar, .message-quick-action")) return;
      if (event.target.closest("a, button, input, textarea, select, [role='button']")) return;
      if (event.target.closest(".creative-composer, .public-square-composer, .user-composer")) return;
      if (event.target.closest(".creative-rail, .public-square-rail, .world-entry-rail, .user-rail")) return;
      if (event.target.closest(".creative-hud, .public-square-hud, .world-entry-hud, .user-hud")) return;
      if (event.target.closest(".scene-hotspot-popover")) return;
      if (isClearMode()) {
        setClearMode(false);
      } else {
        setClearMode(true); // show labels and hide chat chrome
      }
    });
    windowRef?.addEventListener?.("resize", () => {
      if (hotspotLabelsVisible) renderHotspotLabelLayer();
    });
  }

  function bindTimeline(timelineEl) {
    timelineEl?.addEventListener("click", (event) => {
      if (event.target.closest("a, button, input, textarea, select, [role='button'], .message, .message-avatar, .message-quick-action")) {
        return;
      }
      if (event.target === timelineEl || event.target.closest(".message-row, .message-stack")) {
        event.stopPropagation();
        if (isClearMode()) {
          setClearMode(false);
        } else {
          setClearMode(true); // show labels and hide chat chrome
        }
      }
    });
  }

  function bindRestore() {
    restoreEl?.addEventListener("click", () => {
      if (isClearMode()) {
        setClearMode(false);
      }
    });
  }

  function bindKeyboard() {
    documentRef?.addEventListener?.("keydown", (event) => {
      if (event.key !== "Escape") return;
      onEscape?.(event);
      if (isClearMode()) {
        setClearMode(false);
      }
      if (isRailOpen?.()) {
        closeRail?.();
      }
      setHotspotLabelsVisible(false);
      closePopover();
    });
  }

  applyIntroState();
  bindHotspots();
  bindStageEvents();
  bindRestore();
  bindKeyboard();

  return {
    bindTimeline,
    closePopover,
    isClearMode,
    renderSceneHotspotsForRoom,
    setClearMode,
    setHotspotLabelsVisible,
  };
}
