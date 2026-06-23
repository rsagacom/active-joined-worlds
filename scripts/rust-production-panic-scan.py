#!/usr/bin/env python3
import argparse
from pathlib import Path
import sys


ROOT = Path(__file__).resolve().parent.parent
DEFAULT_SCAN_ROOTS = [
    "apps/lobster-waku-gateway/src",
    "apps/lobster-cli/src",
    "apps/lobster-tui/src",
    "crates",
]
EXCLUDED_FILE_NAMES = {
    "gateway_tests.rs",
    "gateway_test_support.rs",
    "test_support.rs",
    "tests.rs",
}
FORBIDDEN_PATTERNS = (
    ".unwrap(",
    ".expect(",
    "panic!(",
    "todo!(",
    "unimplemented!(",
    "unreachable!(",
)


def raw_string_start_at(line: str, index: int) -> tuple[str, int] | None:
    if index > 0 and (line[index - 1].isalnum() or line[index - 1] == "_"):
        return None
    if line.startswith("br", index):
        cursor = index + 2
    elif line.startswith("r", index):
        cursor = index + 1
    else:
        return None

    hashes_start = cursor
    while cursor < len(line) and line[cursor] == "#":
        cursor += 1
    if cursor >= len(line) or line[cursor] != '"':
        return None
    return line[hashes_start:cursor], cursor + 1


def strip_strings(line: str, raw_string_hashes: str | None) -> tuple[str, str | None]:
    chunks = []
    index = 0
    while index < len(line):
        if raw_string_hashes is not None:
            closing = f'"{raw_string_hashes}'
            end = line.find(closing, index)
            if end == -1:
                return "".join(chunks), raw_string_hashes
            index = end + len(closing)
            raw_string_hashes = None
            continue

        raw_start = raw_string_start_at(line, index)
        if raw_start is not None:
            raw_string_hashes, index = raw_start
            continue

        if line[index] == '"':
            index += 1
            while index < len(line):
                if line[index] == "\\":
                    index += 2
                    continue
                if line[index] == '"':
                    index += 1
                    break
                index += 1
            continue

        chunks.append(line[index])
        index += 1

    return "".join(chunks), raw_string_hashes


def strip_block_comments(line: str, in_block_comment: bool) -> tuple[str, bool]:
    chunks = []
    index = 0
    while index < len(line):
        if in_block_comment:
            end = line.find("*/", index)
            if end == -1:
                return "".join(chunks), True
            index = end + 2
            in_block_comment = False
            continue

        start = line.find("/*", index)
        if start == -1:
            chunks.append(line[index:])
            break
        chunks.append(line[index:start])
        index = start + 2
        in_block_comment = True

    return "".join(chunks), in_block_comment


def brace_delta(code: str) -> int:
    return code.count("{") - code.count("}")


def code_for_forbidden_scan(code: str) -> str:
    return code.split("//", 1)[0]


def production_lines(path: Path):
    pending_cfg_test = False
    skip_depth = 0
    in_block_comment = False
    raw_string_hashes = None

    for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        without_strings, raw_string_hashes = strip_strings(line, raw_string_hashes)
        code_without_block_comments, in_block_comment = strip_block_comments(
            without_strings, in_block_comment
        )
        stripped = code_without_block_comments.strip()

        if skip_depth > 0:
            skip_depth += brace_delta(code_without_block_comments)
            if skip_depth <= 0:
                skip_depth = 0
            continue

        if stripped.startswith("#[cfg(test)]"):
            pending_cfg_test = True
            continue

        if pending_cfg_test:
            if not stripped or stripped.startswith("#"):
                continue
            depth = brace_delta(code_without_block_comments)
            if depth > 0:
                pending_cfg_test = False
                skip_depth = depth
            elif stripped.endswith(";"):
                pending_cfg_test = False
            continue

        yield line_no, line, code_without_block_comments


def should_scan(path: Path) -> bool:
    if path.name in EXCLUDED_FILE_NAMES:
        return False
    return path.suffix == ".rs"


def resolve_scan_roots(root: Path, scan_roots: list[str] | None) -> list[Path]:
    root = root.resolve()
    selected = scan_roots or DEFAULT_SCAN_ROOTS
    return [
        Path(scan_root)
        if Path(scan_root).is_absolute()
        else root / scan_root
        for scan_root in selected
    ]


def scan(root: Path = ROOT, scan_roots: list[str] | None = None):
    root = root.resolve()
    findings = []
    for scan_root in resolve_scan_roots(root, scan_roots):
        for path in sorted(scan_root.rglob("*.rs")):
            if not should_scan(path):
                continue
            for line_no, line, code in production_lines(path):
                code = code_for_forbidden_scan(code)
                if any(pattern in code for pattern in FORBIDDEN_PATTERNS):
                    try:
                        rel = path.relative_to(root)
                    except ValueError:
                        rel = path
                    findings.append(f"{rel}:{line_no}:{line.strip()}")
    return findings


def missing_scan_roots(root: Path = ROOT, scan_roots: list[str] | None = None) -> list[Path]:
    return [
        scan_root
        for scan_root in resolve_scan_roots(root, scan_roots)
        if not scan_root.exists()
    ]


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Scan production Rust sources for panic-prone unwrap/expect/panic calls."
    )
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument(
        "--scan-root",
        action="append",
        dest="scan_roots",
        help="Root to scan, relative to --root unless absolute. Can be passed multiple times.",
    )
    return parser.parse_args(argv)


def main() -> int:
    args = parse_args(sys.argv[1:])
    missing_roots = missing_scan_roots(args.root, args.scan_roots)
    if missing_roots:
        print("Rust production panic/unwrap scan failed:", file=sys.stderr)
        for scan_root in missing_roots:
            print(f"scan root missing: {scan_root}", file=sys.stderr)
        return 1

    findings = scan(args.root, args.scan_roots)
    if findings:
        print("Rust production panic/unwrap scan failed:", file=sys.stderr)
        for finding in findings:
            print(finding, file=sys.stderr)
        return 1
    print("Rust production panic/unwrap scan passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
