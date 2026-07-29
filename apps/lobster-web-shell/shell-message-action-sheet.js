// 长按/右键消息气泡弹出的底部动作面板(微信式)。
// 纯 DOM 模块,不依赖 app.js 全局,便于 fake-dom 单测。
// 视觉规范:dark-on-dark,禁大块金色/cream。

export function createMessageActionSheet({ document: doc = document } = {}) {
  const mask = doc.createElement("div");
  mask.className = "message-action-sheet-mask";
  mask.hidden = true;

  const sheet = doc.createElement("div");
  sheet.className = "message-action-sheet";
  sheet.setAttribute("role", "menu");

  const quote = doc.createElement("div");
  quote.className = "message-action-sheet-quote";

  const list = doc.createElement("div");
  list.className = "message-action-sheet-actions";

  const cancel = doc.createElement("button");
  cancel.type = "button";
  cancel.className = "message-action-sheet-cancel";
  cancel.textContent = "取消";

  sheet.appendChild(quote);
  sheet.appendChild(list);
  sheet.appendChild(cancel);
  mask.appendChild(sheet);

  let currentOnAction = null;

  function close() {
    mask.hidden = true;
    currentOnAction = null;
  }

  cancel.addEventListener("click", close);
  mask.addEventListener("click", (event) => {
    if (event.target === mask) close();
  });

  function open({ specs = [], quoteText = "", onAction = null } = {}) {
    if (!specs.length) return false;
    quote.textContent = quoteText;
    quote.hidden = !quoteText;
    while (list.firstChild) list.removeChild(list.firstChild);
    for (const spec of specs) {
      const button = doc.createElement("button");
      button.type = "button";
      button.className = `message-action-sheet-item${spec.danger ? " danger" : ""}`;
      button.dataset.sheetAction = spec.action;
      button.textContent = spec.label;
      button.addEventListener("click", () => {
        const handler = currentOnAction;
        const action = spec.action;
        close();
        if (handler) handler(action);
      });
      list.appendChild(button);
    }
    currentOnAction = onAction;
    mask.hidden = false;
    return true;
  }

  return { element: mask, open, close, isOpen: () => !mask.hidden };
}
