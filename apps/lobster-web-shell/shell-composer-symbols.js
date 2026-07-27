export function selectComposerSymbolCategory(categories, tabButtons, selectedIndex) {
  categories.forEach((category, index) => {
    const active = index === selectedIndex;
    category.classList.toggle("is-active", active);
    category.hidden = !active;
    tabButtons[index]?.classList.toggle("is-active", active);
    tabButtons[index]?.setAttribute("aria-selected", active ? "true" : "false");
    tabButtons[index]?.setAttribute("tabindex", active ? "0" : "-1");
  });
}

function prepareComposerSymbolCategoryPanel(category, index) {
  const heading = category.querySelector(".composer-symbol-heading")?.textContent?.trim() || `分类 ${index + 1}`;
  const panelId = category.id || `composer-symbol-panel-${index + 1}`;
  const tabId = `composer-symbol-tab-${index + 1}`;

  category.id = panelId;
  category.setAttribute("role", "tabpanel");
  category.setAttribute("aria-labelledby", tabId);

  return { heading, panelId, tabId };
}

function handleComposerSymbolTabKeydown(event, index, categories, tabButtons, selectCategory) {
  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
  event.preventDefault();
  const direction = event.key === "ArrowRight" ? 1 : -1;
  const nextIndex = (index + direction + categories.length) % categories.length;
  selectCategory(nextIndex);
  tabButtons[nextIndex]?.focus();
}

function createComposerSymbolTabButton(doc, panel, index, categories, tabButtons, selectCategory) {
  const button = doc.createElement("button");
  button.type = "button";
  button.id = panel.tabId;
  button.className = "composer-symbol-tab";
  button.setAttribute("data-symbol-tab", String(index));
  button.setAttribute("role", "tab");
  button.setAttribute("aria-controls", panel.panelId);
  button.textContent = panel.heading.replace(/\s*\/\s*/g, "/");
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    selectCategory(index);
  });
  button.addEventListener("keydown", (event) => {
    handleComposerSymbolTabKeydown(event, index, categories, tabButtons, selectCategory);
  });
  return button;
}

function initializeComposerSymbolTabs(doc, menuEl) {
  if (!menuEl || menuEl.dataset.symbolTabsReady === "true") return;
  const categories = Array.from(menuEl.querySelectorAll(".composer-symbol-category"));
  if (categories.length <= 1) return;

  const tabBar = doc.createElement("div");
  tabBar.className = "composer-symbol-tabs";
  tabBar.setAttribute("role", "tablist");
  tabBar.setAttribute("aria-label", "颜文字分类");
  const tabButtons = [];
  const selectCategory = (selectedIndex) => selectComposerSymbolCategory(categories, tabButtons, selectedIndex);

  categories.forEach((category, index) => {
    const panel = prepareComposerSymbolCategoryPanel(category, index);
    const button = createComposerSymbolTabButton(
      doc,
      panel,
      index,
      categories,
      tabButtons,
      selectCategory,
    );
    tabButtons.push(button);
    tabBar.appendChild(button);
  });

  menuEl.insertBefore(tabBar, menuEl.firstChild);
  menuEl.classList.add("is-tabbed");
  menuEl.dataset.symbolTabsReady = "true";
  selectCategory(0);
}

export function insertComposerToken(inputEl, token, EventCtor = globalThis.Event) {
  if (!inputEl || inputEl.disabled || !token) return;
  const start = inputEl.selectionStart ?? inputEl.value.length;
  const end = inputEl.selectionEnd ?? inputEl.value.length;
  const prefix = inputEl.value.slice(0, start);
  const suffix = inputEl.value.slice(end);
  const spacer = prefix && !/\s$/.test(prefix) ? " " : "";
  const nextText = `${prefix}${spacer}${token}${suffix}`;
  const nextCursor = prefix.length + spacer.length + token.length;
  inputEl.value = nextText;
  inputEl.setSelectionRange(nextCursor, nextCursor);
  inputEl.dispatchEvent(new EventCtor("input", { bubbles: true }));
  inputEl.focus({ preventScroll: true });
}

export function createComposerSymbolController({
  doc = globalThis.document,
  inputEl = null,
  mentionTriggerEl = null,
  symbolTriggerEl = null,
  symbolMenuEl = null,
  symbolInsertEls = [],
  EventCtor = globalThis.Event,
} = {}) {
  let cleanup = null;

  function setOpen(open) {
    if (!symbolTriggerEl || !symbolMenuEl || !doc) return;
    if (open && symbolMenuEl.parentElement !== doc.body) {
      doc.body.appendChild(symbolMenuEl);
    }
    if (open) initializeComposerSymbolTabs(doc, symbolMenuEl);
    if (open) {
      Object.assign(symbolMenuEl.style, {
        position: "fixed",
        left: "clamp(170px, 16vw, 320px)",
        bottom: "94px",
        display: "block",
      });
    } else {
      symbolMenuEl.removeAttribute("style");
    }
    symbolMenuEl.hidden = !open;
    symbolTriggerEl.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function close() {
    setOpen(false);
  }

  function toggle() {
    setOpen(symbolMenuEl?.hidden ?? true);
  }

  function bind() {
    if (cleanup) return cleanup;
    const listeners = [];
    const listen = (target, type, handler) => {
      if (!target) return;
      target.addEventListener(type, handler);
      listeners.push([target, type, handler]);
    };

    listen(mentionTriggerEl, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      insertComposerToken(inputEl, "@", EventCtor);
    });
    listen(symbolTriggerEl, "click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggle();
    });
    for (const button of symbolInsertEls) {
      listen(button, "click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        insertComposerToken(
          inputEl,
          button.dataset.symbolInsert || button.textContent?.trim() || "",
          EventCtor,
        );
        close();
      });
    }
    listen(doc, "click", (event) => {
      if (!symbolMenuEl || symbolMenuEl.hidden) return;
      if (event.target?.closest?.("[data-symbol-menu], [data-symbol-trigger]")) return;
      close();
    });

    cleanup = () => {
      for (const [target, type, handler] of listeners) {
        target.removeEventListener(type, handler);
      }
      cleanup = null;
    };
    return cleanup;
  }

  return { bind, close, toggle };
}
