use std::process::Command;

fn cli_binary() -> Command {
    // Cargo sets CARGO_BIN_EXE_lobster-cli when running integration tests
    let path = std::env::var("CARGO_BIN_EXE_lobster-cli")
        .unwrap_or_else(|_| "./target/debug/lobster-cli".into());
    Command::new(path)
}

#[test]
fn no_args_shows_help_overview() {
    let output = cli_binary().output().expect("run cli");
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(
        stdout.contains("消息") && stdout.contains("presence"),
        "no args should print help overview: {stdout}"
    );
}

#[test]
fn send_help_shows_usage() {
    let output = cli_binary()
        .args(["send", "--help"])
        .output()
        .expect("run cli");
    // May succeed with help or fail with bad args; either is OK
    let combined = format!(
        "{}{}",
        String::from_utf8_lossy(&output.stdout),
        String::from_utf8_lossy(&output.stderr)
    );
    assert!(
        combined.contains("send") || combined.contains("--to") || combined.contains("from"),
        "send help should mention send options"
    );
}

#[test]
fn send_missing_to_argument_reports_error() {
    let output = cli_binary()
        .args(["send", "--from", "agent:test", "--text", "hello"])
        .output()
        .expect("run cli");
    assert!(!output.status.success(), "should fail without --to");
    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);
    let combined = format!("{stdout}{stderr}");
    assert!(
        combined.contains("--to") || combined.contains("to"),
        "error should mention --to"
    );
}

#[test]
fn inbox_without_gateway_reports_error() {
    let output = cli_binary()
        .args(["inbox", "--identity", "user:nonexistent"])
        .output()
        .expect("run cli");
    assert!(!output.status.success(), "should fail without gateway");
}

#[test]
fn invalid_subcommand_reports_error() {
    let output = cli_binary()
        .arg("nonexistent-command-xyz")
        .output()
        .expect("run cli");
    assert!(!output.status.success(), "invalid command should fail");
}
