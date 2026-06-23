#!/usr/bin/env python3
from pathlib import Path
import subprocess
import sys
import tempfile


ROOT = Path(__file__).resolve().parent.parent
SCRIPT = ROOT / "scripts" / "rust-production-panic-scan.py"


def run_scan_fixture(source: str) -> subprocess.CompletedProcess[str]:
    with tempfile.TemporaryDirectory(prefix="lobster-rust-panic-scan.") as tmp:
        root = Path(tmp)
        src = root / "src"
        src.mkdir()
        (src / "lib.rs").write_text(source, encoding="utf-8")
        return subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--root",
                str(root),
                "--scan-root",
                "src",
            ],
            cwd=ROOT,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )


def run_scan_with_missing_root() -> subprocess.CompletedProcess[str]:
    with tempfile.TemporaryDirectory(prefix="lobster-rust-panic-scan.") as tmp:
        root = Path(tmp)
        return subprocess.run(
            [
                sys.executable,
                str(SCRIPT),
                "--root",
                str(root),
                "--scan-root",
                "missing-src",
            ],
            cwd=ROOT,
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )


def main() -> int:
    assert SCRIPT.exists(), f"missing script: {SCRIPT}"
    text = SCRIPT.read_text(encoding="utf-8")

    assert "DEFAULT_SCAN_ROOTS" in text
    assert '"apps/lobster-waku-gateway/src"' in text
    assert '"apps/lobster-cli/src"' in text
    assert '"apps/lobster-tui/src"' in text
    assert '"crates"' in text
    assert '"--root"' in text
    assert '"--scan-root"' in text
    assert "EXCLUDED_FILE_NAMES" in text
    assert '"gateway_tests.rs"' in text
    assert '"gateway_test_support.rs"' in text
    assert '"test_support.rs"' in text
    assert '"tests.rs"' in text
    assert '"#[cfg(test)]"' in text
    assert '".unwrap("' in text
    assert '".expect("' in text
    assert '"panic!("' in text
    assert '"todo!("' in text
    assert '"unimplemented!("' in text
    assert '"unreachable!("' in text

    result = subprocess.run(
        [sys.executable, str(SCRIPT)],
        cwd=ROOT,
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )
    assert result.returncode == 0, result.stderr or result.stdout
    assert "scan passed" in result.stdout

    result = run_scan_fixture("pub fn bad() { let _ = Some(1).unwrap(); }\n")
    assert result.returncode == 1, result.stdout
    assert "src/lib.rs:1" in result.stderr
    assert ".unwrap(" in result.stderr

    result = run_scan_fixture("pub fn bad() { unimplemented!(\"later\"); }\n")
    assert result.returncode == 1, result.stdout
    assert "src/lib.rs:1" in result.stderr
    assert "unimplemented!(" in result.stderr

    result = run_scan_fixture(
        """
#[cfg(test)]
mod tests {
    #[test]
    fn ok_in_test() {
        let _ = Some(1).unwrap();
    }
}
"""
    )
    assert result.returncode == 0, result.stderr or result.stdout

    result = run_scan_fixture(
        'pub const HELP: &str = "avoid .unwrap( in production"; // panic!(not code)\n'
    )
    assert result.returncode == 0, result.stderr or result.stdout

    result = run_scan_fixture(
        'pub const RAW_HELP: &str = r#"ignore .unwrap( and panic!( plus } in raw text"#;\n'
    )
    assert result.returncode == 0, result.stderr or result.stdout

    result = run_scan_fixture(
        'pub const RAW_QUOTED: &str = r##"quoted ".unwrap( text should stay inert"##;\n'
    )
    assert result.returncode == 0, result.stderr or result.stdout

    result = run_scan_fixture(
        """
pub const MULTILINE_RAW_HELP: &str = r#"
This text mentions .unwrap( and unimplemented!( as documentation.
"#;
pub fn ok_after_multiline_raw_string() {
    let value = Some(1);
    let _ = value;
}
"""
    )
    assert result.returncode == 0, result.stderr or result.stdout

    result = run_scan_fixture(
        """
/*
This maintenance note mentions .unwrap( and panic!(.
It also contains a } that should not change brace tracking.
*/
pub fn ok_after_block_comment() {
    let value = Some(1);
    let _ = value;
}
"""
    )
    assert result.returncode == 0, result.stderr or result.stdout

    result = run_scan_with_missing_root()
    assert result.returncode == 1, result.stdout
    assert "scan root missing" in result.stderr
    assert "missing-src" in result.stderr

    return 0


if __name__ == "__main__":
    sys.exit(main())
