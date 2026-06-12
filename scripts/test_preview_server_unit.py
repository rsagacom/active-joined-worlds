#!/usr/bin/env python3
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "preview-server.mjs"


def main() -> int:
    assert SCRIPT.exists(), f"missing preview server script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert text.startswith("#!/usr/bin/env node")
    assert 'import fs from "node:fs";' in text
    assert 'import http from "node:http";' in text
    assert 'import path from "node:path";' in text
    assert 'import { fileURLToPath } from "node:url";' in text
    assert 'const scriptDir = path.dirname(fileURLToPath(import.meta.url));' in text
    assert 'const repoRoot = path.resolve(scriptDir, "..");' in text
    assert 'process.env.PREVIEW_ROOT || path.join(repoRoot, "apps/lobster-web-shell")' in text
    assert 'const host = process.env.PREVIEW_HOST || "127.0.0.1";' in text
    assert 'const port = Number(process.env.PREVIEW_PORT || process.argv[2] || 4179);' in text
    assert '".html": "text/html; charset=utf-8"' in text
    assert '".js": "application/javascript; charset=utf-8"' in text
    assert '".mjs": "application/javascript; charset=utf-8"' in text
    assert '".css": "text/css; charset=utf-8"' in text
    assert '".json": "application/json; charset=utf-8"' in text
    assert '".png": "image/png"' in text
    assert '".jpg": "image/jpeg"' in text
    assert '".jpeg": "image/jpeg"' in text
    assert '".svg": "image/svg+xml"' in text
    assert '".avif": "image/avif"' in text
    assert '".webp": "image/webp"' in text
    assert "function send(res, status, body" in text
    assert "function resolveRequestPath(url)" in text
    assert "decodeURIComponent(new URL(url" in text
    assert 'pathname === "/" ? "index.html"' in text
    assert 'pathname.replace(/^\\/+/, "")' in text
    assert 'path.resolve(root, relative)' in text
    assert 'if (!filePath.startsWith(`${root}${path.sep}`) && filePath !== root)' in text
    assert 'send(res, 403, "Forbidden")' in text
    assert 'fs.statSync(target).isDirectory()' in text
    assert 'target = path.join(target, "index.html");' in text
    assert 'send(res, 404, `Not found:' in text
    assert 'mime[ext] || "application/octet-stream"' in text
    assert 'if (req.method === "HEAD")' in text
    assert "fs.createReadStream(target).pipe(res)" in text
    assert "server.listen(port, host" in text
    return 0


if __name__ == "__main__":
    sys.exit(main())
