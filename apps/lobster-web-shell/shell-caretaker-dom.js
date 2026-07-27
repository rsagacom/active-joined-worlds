/**
 * Pure DOM factory functions for the caretaker (看护者) panel.
 *
 * These functions create DOM elements for the caretaker detail display.
 * They do NOT attach event listeners, write to Gateway, or mutate globals.
 */

/**
 * Create the caretaker panel title node.
 */
export function createCaretakerPanelTitleNode(model, doc = globalThis.document) {
  const panelTitle = doc.createElement("div");
  panelTitle.className = "panel-title";
  panelTitle.textContent = model.title;
  return panelTitle;
}

/**
 * Create the caretaker panel header node containing profile name, status, and badge.
 */
export function createCaretakerPanelHeaderNode(model, doc = globalThis.document) {
  const profile = model.profile;
  const header = doc.createElement("div");
  header.className = "caretaker-header";
  const headerNames = doc.createElement("div");
  const name = doc.createElement("div");
  name.className = "caretaker-name";
  name.textContent = profile.displayName;
  const status = doc.createElement("div");
  status.className = "caretaker-status";
  status.textContent = profile.status;
  headerNames.appendChild(name);
  headerNames.appendChild(status);
  const badge = doc.createElement("span");
  badge.className = "caretaker-badge";
  badge.textContent = profile.highlight;
  header.appendChild(headerNames);
  header.appendChild(badge);
  return header;
}

/**
 * Create the caretaker panel summary paragraph.
 */
export function createCaretakerPanelSummaryNode(model, doc = globalThis.document) {
  const summary = doc.createElement("p");
  summary.className = "caretaker-summary";
  summary.textContent = model.profile.summary;
  return summary;
}

/**
 * Create a single caretaker message node.
 */
export function createCaretakerMessageNode(item, doc = globalThis.document) {
  const msg = doc.createElement("div");
  msg.className = "caretaker-message";
  const msgTitle = doc.createElement("div");
  msgTitle.className = "caretaker-message-title";
  const titleSpan = doc.createElement("span");
  titleSpan.textContent = item.title;
  const timeSpan = doc.createElement("span");
  timeSpan.className = "caretaker-message-time";
  timeSpan.textContent = item.time;
  msgTitle.appendChild(titleSpan);
  msgTitle.appendChild(timeSpan);
  const detail = doc.createElement("p");
  detail.textContent = item.detail;
  msg.appendChild(msgTitle);
  msg.appendChild(detail);
  return msg;
}

/**
 * Create the caretaker messages container with all message nodes.
 */
export function createCaretakerMessagesNode(model, doc = globalThis.document) {
  const messages = doc.createElement("div");
  messages.className = "caretaker-messages";
  for (const item of model.messages) {
    messages.appendChild(createCaretakerMessageNode(item, doc));
  }
  return messages;
}

/**
 * Create the caretaker rules list node.
 */
export function createCaretakerRulesNode(model, doc = globalThis.document) {
  const rules = doc.createElement("div");
  rules.className = "caretaker-rules";
  const rulesTitle = doc.createElement("div");
  rulesTitle.className = "caretaker-rules-title";
  rulesTitle.textContent = model.rulesTitle;
  const ruleList = doc.createElement("ul");
  for (const rule of model.rules) {
    const li = doc.createElement("li");
    li.textContent = rule;
    ruleList.appendChild(li);
  }
  rules.appendChild(rulesTitle);
  rules.appendChild(ruleList);
  return rules;
}

/**
 * Render the complete caretaker panel from a model.
 * Returns the filled panel body element.
 */
export function renderCaretakerPanelBody(model, doc = globalThis.document) {
  const body = doc.createElement("div");
  body.className = "caretaker-body";
  body.appendChild(createCaretakerPanelHeaderNode(model, doc));
  body.appendChild(createCaretakerPanelSummaryNode(model, doc));
  body.appendChild(createCaretakerMessagesNode(model, doc));
  body.appendChild(createCaretakerRulesNode(model, doc));
  return body;
}
