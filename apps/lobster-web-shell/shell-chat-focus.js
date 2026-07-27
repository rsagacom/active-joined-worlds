export function createChatFocusController({
  doc = globalThis.document,
  layoutEl = null,
  conversationPanelEl = null,
  getAnchor = () => null,
  getWorkspace = () => "chat",
  loadPreference = () => false,
  persistPreference = () => {},
  onStateApplied = () => {},
} = {}) {
  let preferred = false;
  let active = false;
  let toggleButtonEl = null;

  function isActive() {
    return active;
  }

  function updateToggle() {
    if (!toggleButtonEl) return;
    toggleButtonEl.textContent = active ? "退出专注" : "专注聊天";
    toggleButtonEl.setAttribute("aria-pressed", active ? "true" : "false");
    toggleButtonEl.style.display = getWorkspace() === "chat" ? "inline-flex" : "none";
  }

  function applyState() {
    if (active) {
      doc.body.dataset.chatFocus = "true";
      layoutEl?.classList.add("layout-chat-focus");
    } else {
      delete doc.body.dataset.chatFocus;
      layoutEl?.classList.remove("layout-chat-focus");
    }
    updateToggle();
    onStateApplied(active);
  }

  function setMode(value, { persist = false } = {}) {
    active = Boolean(value);
    if (persist) {
      preferred = active;
      persistPreference(active);
    }
    applyState();
    return active;
  }

  function toggle() {
    return setMode(!active, { persist: true });
  }

  function initialize() {
    preferred = Boolean(loadPreference());
    return setMode(preferred);
  }

  function ensureToggle() {
    if (!conversationPanelEl) return null;
    if (!toggleButtonEl) {
      toggleButtonEl = doc.createElement("button");
      toggleButtonEl.type = "button";
      toggleButtonEl.className = "chat-focus-toggle";
      toggleButtonEl.addEventListener("click", toggle);
    }
    if (!toggleButtonEl.isConnected) {
      const anchor = getAnchor() || conversationPanelEl.querySelector(".panel-title");
      if (anchor) {
        anchor.insertAdjacentElement("afterend", toggleButtonEl);
      } else {
        conversationPanelEl.prepend(toggleButtonEl);
      }
    }
    updateToggle();
    return toggleButtonEl;
  }

  function syncWithWorkspace() {
    if (getWorkspace() !== "chat" && active) {
      setMode(false);
    } else if (getWorkspace() === "chat" && !active && preferred) {
      setMode(true);
    } else {
      updateToggle();
    }
    return active;
  }

  return {
    ensureToggle,
    initialize,
    isActive,
    setMode,
    syncWithWorkspace,
    toggle,
  };
}
