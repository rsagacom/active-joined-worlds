/* shell-export-utils.js — 导出文件格式/下载工具函数，从 app.js 提取 */

export function exportFileExtension(format) {
  if (format === "jsonl") return "jsonl";
  if (format === "txt") return "txt";
  return "md";
}

export function exportMimeType(format) {
  if (format === "jsonl") return "application/x-ndjson";
  if (format === "txt") return "text/plain;charset=utf-8";
  return "text/markdown;charset=utf-8";
}

export function downloadContent(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

