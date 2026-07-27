/**
 * DOM rendering helpers for the conversation callout panel.
 *
 * These functions consume the model from shell-conversation-callout.js
 * and render it into the DOM. No Gateway writes, no event listeners.
 */

/**
 * Create a paragraph node from a callout paragraph spec.
 */
export function createConversationCalloutParagraphNode(paragraph, doc = globalThis.document) {
  const node = doc.createElement("p");
  if (paragraph.className) {
    node.className = paragraph.className;
  }
  node.textContent = paragraph.text;
  return node;
}

/**
 * Render the full conversation callout content into the callout element.
 */
export function renderConversationCalloutContent(model, calloutEl, doc = globalThis.document) {
  calloutEl.dataset.variant = model.variant;
  if (typeof calloutEl.replaceChildren === "function") {
    calloutEl.replaceChildren();
  } else {
    calloutEl.innerHTML = "";
  }
  const title = doc.createElement("strong");
  title.textContent = model.title;
  calloutEl.appendChild(title);
  for (const paragraph of model.paragraphs) {
    calloutEl.appendChild(createConversationCalloutParagraphNode(paragraph, doc));
  }
}
