import test from "node:test";
import assert from "node:assert/strict";
import { exportFileExtension, exportMimeType, downloadContent } from "../shell-export-utils.js";

test("exportFileExtension returns jsonl for jsonl", () => {
  assert.equal(exportFileExtension("jsonl"), "jsonl");
});

test("exportFileExtension returns txt for txt", () => {
  assert.equal(exportFileExtension("txt"), "txt");
});

test("exportFileExtension defaults to md", () => {
  assert.equal(exportFileExtension("unknown"), "md");
  assert.equal(exportFileExtension(""), "md");
  assert.equal(exportFileExtension(), "md");
});

test("exportMimeType returns ndjson for jsonl", () => {
  assert.equal(exportMimeType("jsonl"), "application/x-ndjson");
});

test("exportMimeType returns text/plain for txt", () => {
  assert.equal(exportMimeType("txt"), "text/plain;charset=utf-8");
});

test("exportMimeType defaults to markdown", () => {
  assert.equal(exportMimeType("unknown"), "text/markdown;charset=utf-8");
  assert.ok(exportMimeType("md").includes("markdown"));
});

test("downloadContent creates and cleans up anchor element", () => {
  const originalCreateElement = globalThis.document?.createElement?.bind?.({}) || null;
  let anchorCreated = false;
  let urlRevoked = false;
  const mockDoc = {
    createElement: (tag) => {
      if (tag === "a") { anchorCreated = true; return { href: "", download: "", click: () => {}, remove: () => {} }; }
      return {};
    },
    body: { appendChild: () => {} },
  };
  const mockUrl = { createObjectURL: () => "blob:test", revokeObjectURL: () => { urlRevoked = true; } };
  globalThis.document = mockDoc;
  globalThis.Blob = class { constructor(c, o) { this.c = c; this.t = o; } };
  globalThis.URL = mockUrl;
  try {
    downloadContent("test.md", "content", "text/markdown;charset=utf-8");
    assert.ok(anchorCreated, "should create anchor element");
  } finally {
    globalThis.document = undefined;
    globalThis.Blob = undefined;
    globalThis.URL = undefined;
  }
});
