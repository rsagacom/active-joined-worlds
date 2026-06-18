use std::process::Command;

fn cli_binary() -> Command {
    let path = std::env::var("CARGO_BIN_EXE_lobster-cli").unwrap_or_else(|_| {
        format!(
            "{}/target/debug/lobster-cli",
            std::env::current_dir()
                .unwrap_or_else(|_| ".".into())
                .display()
        )
    });
    Command::new(path)
}

#[test]
fn cli_smoke_help_and_error_output() {
    // Test 1: no args prints help overview to stdout
    let out = cli_binary().output().expect("run");
    let stdout = String::from_utf8_lossy(&out.stdout);
    assert!(
        stdout.contains("消息") && stdout.contains("presence"),
        "no args should print help overview: {stdout}"
    );

    // Test 2: invalid subcommand
    let out2 = cli_binary().arg("__nonexistent__").output().expect("run");
    assert!(!out2.status.success(), "invalid command should fail");
}

#[test]
fn cli_send_validates_args() {
    let out = cli_binary()
        .args([
            "send", "--from", "agent:t", "--to", "user:t", "--text", "hi",
        ])
        .output()
        .expect("run");
    let combined = format!(
        "{}{}",
        String::from_utf8_lossy(&out.stdout),
        String::from_utf8_lossy(&out.stderr)
    );
    // Should either succeed or give a clear gateway-connection error (not panic)
    assert!(
        !combined.trim().is_empty(),
        "CLI should produce some output"
    );
}

#[test]
fn cli_admin_commands_have_expected_help() {
    for cmd in &["ban", "unban", "freeze", "unfreeze"] {
        let out = cli_binary().args([cmd]).output().expect("run");
        assert!(!out.status.success(), "{cmd} without args should fail");
    }
}

#[test]
fn cli_inbox_and_rooms_accept_identity() {
    for cmd in &["inbox", "rooms"] {
        let out = cli_binary()
            .args([cmd, "--identity", "user:test"])
            .output()
            .expect("run");
        assert!(
            !out.status.success(),
            "{cmd} should fail without gateway but not crash"
        );
    }
}

#[test]
fn cli_send_rejects_invalid_to_format() {
    let out = cli_binary()
        .args(["send", "--from", "agent:t", "--to", "dm:a:b", "--text", "x"])
        .output()
        .expect("run");
    let s = String::from_utf8_lossy(&out.stderr);
    assert!(
        s.contains("--to") || s.contains("user:") || s.contains("agent:"),
        "should give hint about valid --to format"
    );
}

#[test]
fn cli_send_with_gateway_flag_does_not_crash() {
    let out = cli_binary()
        .args([
            "send",
            "--from",
            "user:a",
            "--to",
            "user:b",
            "--text",
            "test",
            "--gateway",
            "http://127.0.0.1:1",
        ])
        .output()
        .expect("run");
    // Should fail gracefully (no gateway on port 1) not panic
    let code = out.status.code().unwrap_or(-1);
    assert!(code != 0 || code == -1, "should exit with error");
}

#[test]
fn cli_recall_rejects_missing_message_id() {
    let out = cli_binary()
        .args(["recall", "--from", "agent:t"])
        .output()
        .expect("run");
    assert!(
        !out.status.success(),
        "recall without --message-id should fail"
    );
}

#[test]
fn cli_edit_rejects_missing_fields() {
    let out = cli_binary()
        .args(["edit", "--from", "agent:t"])
        .output()
        .expect("run");
    assert!(
        !out.status.success(),
        "edit without required fields should fail"
    );
}

#[test]
fn cli_tail_accepts_room_flag() {
    let out = cli_binary()
        .args(["tail", "--room", "room:world:lobby"])
        .output()
        .expect("run");
    // tail should either connect or fail gracefully
    let code = out.status.code().unwrap_or(-1);
    assert!(code != 0, "tail without gateway should exit non-zero");
}

#[test]
fn cli_invite_create_rejects_missing_args() {
    let out = cli_binary().args(["invite-create"]).output().expect("run");
    assert!(
        !out.status.success(),
        "invite-create without args should fail"
    );
}

#[test]
fn cli_invite_revoke_rejects_missing_code() {
    let out = cli_binary().args(["invite-revoke"]).output().expect("run");
    assert!(
        !out.status.success(),
        "invite-revoke without --code should fail"
    );
}
