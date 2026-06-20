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

// ───────────────────────── 认证命令（login / set-nickname / logout）─────────────────────────

fn combined_output(out: &std::process::Output) -> String {
    format!(
        "{}{}",
        String::from_utf8_lossy(&out.stdout),
        String::from_utf8_lossy(&out.stderr)
    )
}

fn dev_gateway_reachable(host: &str) -> bool {
    std::net::TcpStream::connect(host).is_ok()
}

#[test]
fn cli_login_requires_email() {
    let out = cli_binary()
        .args(["login", "--gateway", "http://127.0.0.1:8787"])
        .output()
        .expect("run");
    assert!(!out.status.success(), "login without --email should fail");
    let s = combined_output(&out);
    assert!(
        s.contains("--email") || s.contains("email"),
        "should mention email requirement: {s}"
    );
}

/// resident 由 token session 决定（gateway http_write_routes.rs 设计），不接受 `--for`。
#[test]
fn cli_set_nickname_rejects_for() {
    let out = cli_binary()
        .args(["set-nickname", "x", "--for", "user:y"])
        .output()
        .expect("run");
    assert!(
        !out.status.success(),
        "set-nickname --for should be rejected"
    );
}

/// 隔离 HOME（无缓存）+ 排除环境 token → resolve_token 应直接报「请 login」（不连 gateway）。
#[test]
fn cli_set_nickname_without_token_hints_login() {
    let home = tempfile::tempdir().unwrap();
    let out = cli_binary()
        .args([
            "set-nickname",
            "测试昵称",
            "--gateway",
            "http://127.0.0.1:8787",
        ])
        .env("HOME", home.path())
        .env_remove("LOBSTER_SESSION_TOKEN")
        .output()
        .expect("run");
    assert!(
        !out.status.success(),
        "set-nickname without any token should fail"
    );
    let s = combined_output(&out);
    assert!(s.contains("login"), "should hint to run login: {s}");
}

/// admin 命令同样走 token 架构：隔离 HOME（无缓存）+ 排除环境 token →
/// ban 无 token 应报「请 login」，证明 admin 已从裸 post_json 迁移到 Bearer 鉴权（修复生产 401）。
#[test]
fn cli_admin_ban_without_token_hints_login() {
    let home = tempfile::tempdir().unwrap();
    let out = cli_binary()
        .args([
            "ban",
            "--target",
            "user:troublemaker",
            "--actor",
            "user:admin",
            "--gateway",
            "http://127.0.0.1:8787",
        ])
        .env("HOME", home.path())
        .env_remove("LOBSTER_SESSION_TOKEN")
        .output()
        .expect("run");
    assert!(!out.status.success(), "ban without any token should fail");
    let s = combined_output(&out);
    assert!(s.contains("login"), "should hint to run login: {s}");
}

/// moderate 同样走 token 架构：无 token 应报「请 login」（admin 治理命令统一鉴权）。
#[test]
fn cli_admin_moderate_without_token_hints_login() {
    let home = tempfile::tempdir().unwrap();
    let out = cli_binary()
        .args([
            "moderate",
            "--message-id",
            "msg-1",
            "--conversation-id",
            "room:world:lobby",
            "--action",
            "blocked",
            "--actor",
            "user:admin",
            "--gateway",
            "http://127.0.0.1:8787",
        ])
        .env("HOME", home.path())
        .env_remove("LOBSTER_SESSION_TOKEN")
        .output()
        .expect("run");
    assert!(
        !out.status.success(),
        "moderate without any token should fail"
    );
    let s = combined_output(&out);
    assert!(s.contains("login"), "should hint to run login: {s}");
}

/// logout 无 token 时跳过服务端 logout，只清本地缓存 → 设计为 Ok（gateway 不需在）。
#[test]
fn cli_logout_safe_without_token() {
    let home = tempfile::tempdir().unwrap();
    let out = cli_binary()
        .args(["logout", "--gateway", "http://127.0.0.1:8787"])
        .env("HOME", home.path())
        .env_remove("LOBSTER_SESSION_TOKEN")
        .output()
        .expect("run");
    let s = combined_output(&out);
    assert!(
        out.status.success(),
        "logout without token should succeed (local-only clear): {s}"
    );
    assert!(s.contains("已登出"), "logout message: {s}");
}

/// 真实 dev gateway 闭环：login（dev 内联 OTP）→ set-nickname（缓存 token 回退）→ logout → 再 set-nickname 报错。
/// 需 gateway 以 `LOBSTER_DEV_EMAIL_OTP_INLINE=1` 启动；否则 login 拿不到 OTP（stdin null → EOF）→ 优雅跳过。
#[test]
fn cli_auth_closed_loop_dev_gateway() {
    const HOST: &str = "127.0.0.1:8787";
    const GURL: &str = "http://127.0.0.1:8787";
    if !dev_gateway_reachable(HOST) {
        eprintln!("skip cli_auth_closed_loop_dev_gateway: dev gateway not reachable");
        return;
    }
    let home = tempfile::tempdir().unwrap();
    let email = "cli-integration@example.com";

    // 1. login：dev inline 开则成功；stdin null 防 hang（无 dev_code 时 read_line 返回 EOF）
    let login = cli_binary()
        .args(["login", "--email", email, "--gateway", GURL])
        .env("HOME", home.path())
        .stdin(std::process::Stdio::null())
        .output()
        .expect("run");
    let login_out = combined_output(&login);
    if !login.status.success() {
        eprintln!(
            "skip cli_auth_closed_loop_dev_gateway: login not ok (dev inline likely off): {login_out}"
        );
        return;
    }
    assert!(
        login_out.contains("已登录"),
        "login success message: {login_out}"
    );

    // 缓存文件出现 + Unix 0600 权限
    let cache = home.path().join(".lobster").join("cli-session.json");
    assert!(
        cache.exists(),
        "session cache should be written: {login_out}"
    );
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mode = std::fs::metadata(&cache).unwrap().permissions().mode() & 0o777;
        assert_eq!(mode, 0o600, "session cache should be 0600");
    }

    // 2. set-nickname（无 --token，验证缓存路径回退生效）
    let nick = cli_binary()
        .args(["set-nickname", "虾虾", "--gateway", GURL])
        .env("HOME", home.path())
        .output()
        .expect("run");
    let nick_out = combined_output(&nick);
    assert!(
        nick.status.success(),
        "set-nickname should succeed: {nick_out}"
    );
    assert!(nick_out.contains("虾虾"), "nickname reflected: {nick_out}");

    // 3. logout（清缓存）
    let logout = cli_binary()
        .args(["logout", "--gateway", GURL])
        .env("HOME", home.path())
        .output()
        .expect("run");
    let logout_out = combined_output(&logout);
    assert!(
        logout.status.success(),
        "logout should succeed: {logout_out}"
    );
    assert!(
        logout_out.contains("已登出"),
        "logout message: {logout_out}"
    );
    assert!(!cache.exists(), "cache deleted after logout");

    // 4. logout 后再 set-nickname 应报 not logged in（缓存已清）
    let after = cli_binary()
        .args(["set-nickname", "虾虾", "--gateway", GURL])
        .env("HOME", home.path())
        .env_remove("LOBSTER_SESSION_TOKEN")
        .output()
        .expect("run");
    let after_out = combined_output(&after);
    assert!(
        !after.status.success(),
        "set-nickname after logout should fail: {after_out}"
    );
    assert!(
        after_out.contains("login"),
        "should hint login after cache cleared: {after_out}"
    );
}
