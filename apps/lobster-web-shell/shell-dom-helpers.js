export function setDatasetFlag(node, key, value) {
  if (!node?.dataset) return;
  if (value == null || value === "") {
    delete node.dataset[key];
    return;
  }
  node.dataset[key] = String(value);
}

export function setInlineStyle(node, property, value, important = false) {
  if (!node?.style) return;
  if (typeof node.style.setProperty === "function") {
    node.style.setProperty(property, value, important ? "important" : "");
    return;
  }
  const camelProperty = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
  node.style[camelProperty] = value;
}

export function createLine(className, text) {
  const div = document.createElement("div");
  div.className = className;
  div.textContent = text;
  return div;
}

export function createPill(text, tone = "muted") {
  const span = document.createElement("span");
  span.className = `pill pill-${tone}`;
  span.textContent = text;
  return span;
}

export function createStageChip(text, tone = "muted") {
  const chip = document.createElement("div");
  chip.className = "stage-chip";
  chip.dataset.tone = tone;
  chip.textContent = text;
  return chip;
}

export function createMetaChip(text, tone = "muted") {
  const chip = document.createElement("span");
  chip.className = `meta-chip meta-chip-${tone}`;
  chip.textContent = text;
  return chip;
}

export function createOverviewMetric(label, value, copy, tone = "muted") {
  const card = document.createElement("div");
  card.className = "overview-metric";
  card.dataset.tone = tone;
  card.appendChild(createLine("overview-metric-label", label));
  card.appendChild(createLine("overview-metric-value", value));
  if (copy) {
    card.appendChild(createLine("overview-metric-copy", copy));
  }
  return card;
}

export function createDetailSection(title, copy = "") {
  const section = document.createElement("section");
  section.className = "chat-detail-section";

  const heading = document.createElement("div");
  heading.className = "chat-detail-section-title";
  heading.textContent = title;
  section.appendChild(heading);

  if (copy) {
    section.appendChild(createLine("chat-detail-copy", copy));
  }

  return section;
}

export function createDetailRow(label, value) {
  const row = document.createElement("div");
  row.className = "chat-detail-row";

  const labelEl = document.createElement("span");
  labelEl.className = "chat-detail-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "chat-detail-value";
  if (value instanceof Element) {
    valueEl.classList.add("chat-detail-value-rich");
    valueEl.appendChild(value);
  } else {
    valueEl.textContent = value;
  }

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return row;
}

export function createChatDetailCardMetaRow(label, value) {
  const row = document.createElement("div");
  row.className = "chat-detail-card-meta-row";

  const labelEl = document.createElement("span");
  labelEl.className = "chat-detail-card-meta-label";
  labelEl.textContent = label;

  const valueEl = document.createElement("span");
  valueEl.className = "chat-detail-card-meta-value";
  valueEl.textContent = value;

  row.appendChild(labelEl);
  row.appendChild(valueEl);
  return row;
}
