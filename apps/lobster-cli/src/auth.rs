//! Bearer token 认证：login（邮箱 OTP）/ set-nickname / logout。
//!
//! token 解析三级回退：`--token` 显式 > `LOBSTER_SESSION_TOKEN` 环境变量 > 缓存文件。
//! 缓存写入 `~/.lobster/cli-session.json`（手写 HOME/USERPROFILE，不引入 dirs crate；
//! 原子写 + 0700/0600 权限）。复用 crate::post_json（login 的 request OTP 步骤无需 token）
//! 与 crate::format_gateway_status_error。
//!
//! # 安全模型
//! - 缓存文件含 session_token（敏感）：Unix 下文件 0600（仅属主可读）+ 目录 0700；Windows 无
//!   等价保护（已知限制，建议文件系统 ACL / 受限用户帐户隔离）。
//! - 原子写（`.tmp` → rename）避免 crash 留半截文件。
//! - 人类可读输出（login 成功消息 / 错误）**绝不包含 token**；仅 `--json` 输出完整缓存
//!   （含 session_token）供脚本机读——**勿将 `--json` 输出贴入日志 / issue / 聊天**。
//! - 401 不自动清缓存（保守：避免误删仍有效的缓存 token）；提示重新 login，login 覆盖缓存。

use crate::{format_gateway_status_error, post_json};
use serde::{Deserialize, Serialize};
use std::io::Write;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

const CACHE_SCHEMA: u32 = 1;
const CACHE_DIR: &str = ".lobster";
const CACHE_FILENAME: &str = "cli-session.json";
const SESSION_TOKEN_ENV: &str = "LOBSTER_SESSION_TOKEN";

// ───────────────────────── 缓存结构 ─────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub(crate) struct CliSessionCache {
    #[serde(default)]
    pub(crate) schema: u32,
    pub(crate) resident_id: String,
    pub(crate) session_token: String,
    #[serde(default)]
    pub(crate) gateway: String,
    #[serde(default)]
    pub(crate) email_masked: String,
    #[serde(default)]
    pub(crate) saved_at_ms: i64,
}

// ───────────────────────── 主目录解析 ─────────────────────────

/// 手写主目录解析（不加 dirs crate）：Unix `$HOME` / Windows `%USERPROFILE%`
/// / 回退 `%HOMEDRIVE%%HOMEPATH%`。
pub(crate) fn home_lobster_dir() -> Result<PathBuf, String> {
    if let Some(home) = std::env::var_os("HOME") {
        return Ok(PathBuf::from(home).join(CACHE_DIR));
    }
    if let Some(profile) = std::env::var_os("USERPROFILE") {
        return Ok(PathBuf::from(profile).join(CACHE_DIR));
    }
    if let (Some(drive), Some(path)) = (std::env::var_os("HOMEDRIVE"), std::env::var_os("HOMEPATH"))
    {
        let mut full = PathBuf::from(drive);
        full.push(path);
        full.push(CACHE_DIR);
        return Ok(full);
    }
    Err("cannot determine home directory; set $HOME or pass --token / LOBSTER_SESSION_TOKEN".into())
}

pub(crate) fn cache_path() -> Result<PathBuf, String> {
    Ok(home_lobster_dir()?.join(CACHE_FILENAME))
}

// ───────────────────────── 缓存 IO（路径参数版，可单测） ─────────────────────────

/// 读缓存：文件缺失或 schema 未知 → `Ok(None)`；JSON 损坏 → `Err`（区分「未登录」vs「文件损坏」）。
pub(crate) fn read_cache_at(path: &Path) -> Result<Option<CliSessionCache>, String> {
    let content = match std::fs::read_to_string(path) {
        Ok(c) => c,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(format!("read session cache failed: {error}")),
    };
    let cache: CliSessionCache = serde_json::from_str(&content).map_err(|error| {
        format!("cached session is corrupt: {error}; run `lobster-cli login` to re-authenticate")
    })?;
    if cache.schema != CACHE_SCHEMA {
        return Ok(None);
    }
    Ok(Some(cache))
}

/// 原子写：`path.tmp` → rename；父目录 0700、文件 0600（Unix）。
pub(crate) fn write_cache_at(path: &Path, cache: &CliSessionCache) -> Result<(), String> {
    let dir = path
        .parent()
        .ok_or_else(|| "session cache path has no parent directory".to_string())?;
    std::fs::create_dir_all(dir).map_err(|error| format!("create session dir failed: {error}"))?;
    set_dir_private(dir);

    let body = serde_json::to_string_pretty(cache)
        .map_err(|error| format!("serialize session cache failed: {error}"))?;
    let tmp = dir.join(format!("{CACHE_FILENAME}.tmp"));
    {
        let mut file = std::fs::File::create(&tmp)
            .map_err(|error| format!("create temp session file failed: {error}"))?;
        file.write_all(body.as_bytes())
            .map_err(|error| format!("write session cache failed: {error}"))?;
        file.sync_all().ok();
    }
    std::fs::rename(&tmp, path)
        .map_err(|error| format!("finalize session cache failed: {error}"))?;
    set_file_private(path);
    Ok(())
}

/// 幂等：文件缺失 → `Ok(())`。
pub(crate) fn delete_cache_at(path: &Path) -> Result<(), String> {
    match std::fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(format!("delete session cache failed: {error}")),
    }
}

// ───────────────────────── 缓存 IO（env 包装版，生产用） ─────────────────────────

pub(crate) fn read_cache() -> Result<Option<CliSessionCache>, String> {
    match cache_path() {
        Ok(path) => read_cache_at(&path),
        Err(_) => Ok(None),
    }
}

pub(crate) fn write_cache(cache: &CliSessionCache) -> Result<(), String> {
    write_cache_at(&cache_path()?, cache)
}

pub(crate) fn delete_cache() -> Result<(), String> {
    match cache_path() {
        Ok(path) => delete_cache_at(&path),
        Err(_) => Ok(()),
    }
}

#[cfg(unix)]
fn set_dir_private(path: &Path) {
    use std::os::unix::fs::PermissionsExt;
    let _ = std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o700));
}
#[cfg(not(unix))]
fn set_dir_private(_path: &Path) {}

#[cfg(unix)]
fn set_file_private(path: &Path) {
    use std::os::unix::fs::PermissionsExt;
    let _ = std::fs::set_permissions(path, std::fs::Permissions::from_mode(0o600));
}
#[cfg(not(unix))]
fn set_file_private(_path: &Path) {}

fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

// ───────────────────────── resolve_token（纯函数核心 + env 包装） ─────────────────────────

/// 三级回退核心（纯函数，可单测）：`explicit` > `env_token` > `cache`。
fn resolve_token_from(
    explicit: Option<&str>,
    env_token: Option<&str>,
    cache: Option<&CliSessionCache>,
) -> Result<String, String> {
    if let Some(token) = explicit.filter(|t| !t.is_empty()) {
        return Ok(token.to_string());
    }
    if let Some(token) = env_token.filter(|t| !t.is_empty()) {
        return Ok(token.to_string());
    }
    if let Some(token) = cache
        .map(|c| c.session_token.as_str())
        .filter(|t| !t.is_empty())
    {
        return Ok(token.to_string());
    }
    Err(
        "not logged in. run `lobster-cli login --email <you@example.com>`, set LOBSTER_SESSION_TOKEN, or pass --token"
            .into(),
    )
}

/// 三级回退：`--token` > `LOBSTER_SESSION_TOKEN` > 缓存。都没有 → `Err` 引导 login。
pub(crate) fn resolve_token(explicit: Option<&str>) -> Result<String, String> {
    let env_token = std::env::var(SESSION_TOKEN_ENV).ok();
    let cache = read_cache()?;
    resolve_token_from(explicit, env_token.as_deref(), cache.as_ref())
}

// ───────────────────────── 认证 HTTP ─────────────────────────

/// 镜像 crate::post_json，注入 `Authorization: Bearer <token>`。401 特殊提示重新 login。
pub(crate) fn post_json_authenticated<T, R>(
    url: &str,
    request: &T,
    token: &str,
    action: &str,
) -> Result<R, String>
where
    T: Serialize,
    R: serde::de::DeserializeOwned,
{
    let response = match ureq::post(url)
        .set("Authorization", &format!("Bearer {token}"))
        .send_json(
            serde_json::to_value(request)
                .map_err(|error| format!("serialize {action} request failed: {error}"))?,
        ) {
        Ok(response) => response,
        Err(ureq::Error::Status(status, response)) => {
            let body = response.into_string().ok();
            if status == 401 {
                return Err(format!(
                    "{action} failed: session token invalid or expired (401). run `lobster-cli login` to re-authenticate"
                ));
            }
            return Err(format_gateway_status_error(
                &format!("{action} request"),
                status,
                body.as_deref(),
            ));
        }
        Err(error) => return Err(format!("{action} request failed: {error}")),
    };

    response
        .into_json::<R>()
        .map_err(|error| format!("decode {action} response failed: {error}"))
}

// ───────────────────────── 请求/响应结构体（CLI 本地视图，对齐 gateway_models.rs） ─────────────────────────

#[derive(Debug, Clone, Serialize)]
struct RequestEmailOtpRequest<'a> {
    email: &'a str,
    mobile: Option<&'a str>,
    device_physical_address: Option<&'a str>,
    resident_id: Option<&'a str>,
    nickname: Option<&'a str>,
}

#[derive(Debug, Clone, Deserialize)]
struct RequestEmailOtpResponse {
    challenge_id: String,
    #[serde(default)]
    masked_email: String,
    #[serde(default)]
    delivery_mode: String,
    #[serde(default)]
    dev_code: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
struct VerifyEmailOtpRequest<'a> {
    challenge_id: &'a str,
    code: &'a str,
    resident_id: Option<&'a str>,
}

#[derive(Debug, Clone, Deserialize)]
struct VerifyEmailOtpResponse {
    #[serde(default)]
    resident_id: String,
    #[serde(default)]
    email_masked: String,
    session_token: String,
}

#[derive(Debug, Clone, Serialize)]
struct ShellSetNicknameRequest<'a> {
    nickname: Option<&'a str>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
struct ShellSetNicknameResponse {
    ok: bool,
    #[serde(default)]
    nickname: Option<String>,
}

// ───────────────────────── OTP 来源 ─────────────────────────

enum OtpSource {
    /// dev 环境响应内联的 OTP（`LOBSTER_DEV_EMAIL_OTP_INLINE`），CLI 直接用。
    Dev(String),
    /// 生产环境，OTP 发至邮箱，需 stdin 输入。
    Prompt,
}

/// `dev_code` 存在 → `Dev`（自动用）；否则 `Prompt`（stdin）。
fn otp_from_response(response: &RequestEmailOtpResponse) -> OtpSource {
    match &response.dev_code {
        Some(code) => OtpSource::Dev(code.clone()),
        None => OtpSource::Prompt,
    }
}

// ───────────────────────── 命令 ─────────────────────────

/// login：request OTP → dev 自动 / prod stdin → verify → 缓存。
pub(crate) fn login(email: &str, gateway: &str, json: bool) -> Result<String, String> {
    let gateway = gateway.trim_end_matches('/');
    let request_url = format!("{gateway}/v1/auth/email-otp/request");
    let request = RequestEmailOtpRequest {
        email,
        mobile: None,
        device_physical_address: None,
        resident_id: None,
        nickname: None,
    };
    let otp_response =
        post_json::<_, RequestEmailOtpResponse>(&request_url, &request, "email-otp request")?;

    let code = match otp_from_response(&otp_response) {
        OtpSource::Dev(code) => code,
        OtpSource::Prompt => {
            eprintln!(
                "OTP 已发送至 {}（delivery_mode: {}），请输入验证码：",
                otp_response.masked_email, otp_response.delivery_mode
            );
            read_line_trimmed()?.ok_or_else(|| "no code entered".to_string())?
        }
    };

    let verify_url = format!("{gateway}/v1/auth/email-otp/verify");
    let verify_request = VerifyEmailOtpRequest {
        challenge_id: &otp_response.challenge_id,
        code: &code,
        resident_id: None,
    };
    let verified: VerifyEmailOtpResponse =
        post_json::<_, VerifyEmailOtpResponse>(&verify_url, &verify_request, "email-otp verify")?;

    let cache = CliSessionCache {
        schema: CACHE_SCHEMA,
        resident_id: verified.resident_id.clone(),
        session_token: verified.session_token.clone(),
        gateway: gateway.to_string(),
        email_masked: verified.email_masked.clone(),
        saved_at_ms: now_ms(),
    };
    write_cache(&cache)?;

    if json {
        serde_json::to_string(&cache)
            .map_err(|error| format!("serialize login cache failed: {error}"))
    } else {
        let display = if cache.email_masked.is_empty() {
            email
        } else {
            &cache.email_masked
        };
        Ok(format!(
            "已登录为居民 {}（{}）。Session 已缓存至 ~/.lobster/cli-session.json",
            cache.resident_id, display
        ))
    }
}

/// set-nickname：resolve_token → POST /v1/shell/nickname（resident 由 token session 决定）。
pub(crate) fn set_nickname(
    nickname: Option<&str>,
    explicit_token: Option<&str>,
    gateway: &str,
    json: bool,
) -> Result<String, String> {
    let token = resolve_token(explicit_token)?;
    let url = format!("{}/v1/shell/nickname", gateway.trim_end_matches('/'));
    let request = ShellSetNicknameRequest { nickname };
    let payload: ShellSetNicknameResponse =
        post_json_authenticated(&url, &request, &token, "set-nickname")?;

    if json {
        serde_json::to_string(&payload)
            .map_err(|error| format!("serialize set-nickname response failed: {error}"))
    } else {
        Ok(match &payload.nickname {
            Some(name) if !name.is_empty() => format!("昵称已更新为「{name}」"),
            _ => "已清除昵称".to_string(),
        })
    }
}

/// logout：删缓存（总做）+ best-effort 服务端 logout（有 token 时，网络失败不阻止本地清缓存）。
pub(crate) fn logout(
    explicit_token: Option<&str>,
    gateway: &str,
    json: bool,
) -> Result<String, String> {
    let server_note = match resolve_token(explicit_token).ok() {
        Some(token) => {
            let url = format!("{}/v1/auth/logout", gateway.trim_end_matches('/'));
            match post_json_authenticated::<_, serde_json::Value>(
                &url,
                &serde_json::Value::Null,
                &token,
                "logout",
            ) {
                Ok(_) => "服务端登出：ok".to_string(),
                Err(error) => format!("服务端登出失败（本地缓存仍已清除）：{error}"),
            }
        }
        None => String::new(),
    };

    delete_cache()?;

    let message = if server_note.is_empty() {
        "已登出（本地 session 已清除）".to_string()
    } else {
        format!("已登出（本地 session 已清除）· {server_note}")
    };

    if json {
        serde_json::to_string(&serde_json::json!({ "ok": true, "message": message }))
            .map_err(|error| format!("serialize logout response failed: {error}"))
    } else {
        Ok(message)
    }
}

fn read_line_trimmed() -> Result<Option<String>, String> {
    let mut buf = String::new();
    match std::io::stdin().read_line(&mut buf) {
        Ok(0) => Ok(None),
        Ok(_) => Ok(Some(buf.trim().to_string())),
        Err(error) => Err(format!("read code from stdin failed: {error}")),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_cache(schema: u32, token: &str) -> CliSessionCache {
        CliSessionCache {
            schema,
            resident_id: "rsaga".into(),
            session_token: token.into(),
            gateway: "http://127.0.0.1:8787".into(),
            email_masked: "r***@x".into(),
            saved_at_ms: 1700,
        }
    }

    #[test]
    fn cache_roundtrip() {
        let cache = sample_cache(1, "st_abc");
        let json = serde_json::to_string(&cache).unwrap();
        let back: CliSessionCache = serde_json::from_str(&json).unwrap();
        assert_eq!(cache, back);
    }

    #[test]
    fn write_then_read_cache_at() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join(CACHE_FILENAME);
        let cache = sample_cache(1, "st_abc");
        write_cache_at(&path, &cache).unwrap();
        assert_eq!(read_cache_at(&path).unwrap(), Some(cache));
    }

    #[test]
    fn read_cache_at_missing_returns_none() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join(CACHE_FILENAME);
        assert_eq!(read_cache_at(&path).unwrap(), None);
    }

    #[test]
    fn read_cache_at_corrupt_errors() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join(CACHE_FILENAME);
        std::fs::write(&path, "not json{").unwrap();
        let err = read_cache_at(&path).unwrap_err();
        assert!(err.contains("corrupt"));
    }

    #[test]
    fn read_cache_at_unknown_schema_treated_as_absent() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join(CACHE_FILENAME);
        write_cache_at(&path, &sample_cache(99, "st_old")).unwrap();
        assert_eq!(read_cache_at(&path).unwrap(), None);
    }

    #[test]
    fn write_cache_at_creates_dotlobster_dir() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join(CACHE_DIR).join(CACHE_FILENAME);
        assert!(!tmp.path().join(CACHE_DIR).exists());
        write_cache_at(&path, &sample_cache(1, "t")).unwrap();
        assert!(tmp.path().join(CACHE_DIR).exists());
    }

    #[test]
    fn delete_cache_at_idempotent() {
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join(CACHE_FILENAME);
        write_cache_at(&path, &sample_cache(1, "t")).unwrap();
        delete_cache_at(&path).unwrap();
        delete_cache_at(&path).unwrap(); // 再次删（文件已不存在）仍 Ok
        assert_eq!(read_cache_at(&path).unwrap(), None);
    }

    #[cfg(unix)]
    #[test]
    fn write_cache_at_sets_0600_perms() {
        use std::os::unix::fs::PermissionsExt;
        let tmp = tempfile::tempdir().unwrap();
        let path = tmp.path().join(CACHE_FILENAME);
        write_cache_at(&path, &sample_cache(1, "t")).unwrap();
        let mode = std::fs::metadata(&path).unwrap().permissions().mode() & 0o777;
        assert_eq!(mode, 0o600);
    }

    #[test]
    fn resolve_token_prefers_explicit() {
        let cache = sample_cache(1, "cache_tok");
        let token = resolve_token_from(Some("explicit"), Some("env_tok"), Some(&cache)).unwrap();
        assert_eq!(token, "explicit");
    }

    #[test]
    fn resolve_token_falls_back_to_env() {
        let cache = sample_cache(1, "cache_tok");
        let token = resolve_token_from(None, Some("env_tok"), Some(&cache)).unwrap();
        assert_eq!(token, "env_tok");
    }

    #[test]
    fn resolve_token_falls_back_to_cache() {
        let cache = sample_cache(1, "cache_tok");
        let token = resolve_token_from(None, None, Some(&cache)).unwrap();
        assert_eq!(token, "cache_tok");
    }

    #[test]
    fn resolve_token_none_when_nothing_available() {
        let err = resolve_token_from(None, None, None).unwrap_err();
        assert!(err.contains("login"));
    }

    #[test]
    fn resolve_token_ignores_empty_explicit() {
        let cache = sample_cache(1, "cache_tok");
        // 空字符串 explicit 应跳过，回退 env
        let token = resolve_token_from(Some(""), Some("env_tok"), Some(&cache)).unwrap();
        assert_eq!(token, "env_tok");
    }

    #[test]
    fn otp_from_response_dev_when_dev_code_present() {
        let resp = RequestEmailOtpResponse {
            challenge_id: "ch".into(),
            masked_email: "m".into(),
            delivery_mode: "inline-dev".into(),
            dev_code: Some("123456".into()),
        };
        assert!(matches!(otp_from_response(&resp), OtpSource::Dev(c) if c == "123456"));
    }

    #[test]
    fn otp_from_response_prompt_when_no_dev_code() {
        let resp = RequestEmailOtpResponse {
            challenge_id: "ch".into(),
            masked_email: "m".into(),
            delivery_mode: "mailer-adapter-pending".into(),
            dev_code: None,
        };
        assert!(matches!(otp_from_response(&resp), OtpSource::Prompt));
    }
}
