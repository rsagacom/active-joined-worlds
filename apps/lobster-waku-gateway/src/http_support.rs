use std::{collections::HashMap, io::Read, path::PathBuf};

use chat_core::{ConversationId, IdentityId};
use tiny_http::{Header, Request, Response};

use crate::{CliAddress, ExportFormat};

pub(crate) trait ResponseHeaderExt: Sized {
    fn with_optional_header(self, header: Option<Header>) -> Self;
}

impl<R: Read> ResponseHeaderExt for Response<R> {
    fn with_optional_header(self, header: Option<Header>) -> Self {
        match header {
            Some(header) => self.with_header(header),
            None => self,
        }
    }
}

pub(crate) fn json_header() -> Option<Header> {
    Header::from_bytes("Content-Type", "application/json; charset=utf-8").ok()
}

pub(crate) fn text_header() -> Option<Header> {
    Header::from_bytes("Content-Type", "text/plain; charset=utf-8").ok()
}

pub(crate) const MAX_BODY_SIZE: u64 = 1_048_576; // 1 MiB

/// Read request body with a hard size limit to prevent OOM DoS.
pub(crate) fn read_request_body(request: &mut Request) -> Result<Vec<u8>, String> {
    let mut body = Vec::new();
    request
        .as_reader()
        .take(MAX_BODY_SIZE + 1)
        .read_to_end(&mut body)
        .map_err(|e| format!("read body failed: {e}"))?;
    if body.len() > MAX_BODY_SIZE as usize {
        return Err("request body exceeds 1 MiB limit".into());
    }
    Ok(body)
}

pub(crate) fn sse_header() -> Option<Header> {
    Header::from_bytes("Content-Type", "text/event-stream; charset=utf-8").ok()
}

pub(crate) fn no_cache_header() -> Option<Header> {
    Header::from_bytes("Cache-Control", "no-cache").ok()
}

pub(crate) fn security_headers() -> Vec<Header> {
    [
        ("X-Content-Type-Options", "nosniff"),
        ("X-Frame-Options", "DENY"),
        ("Referrer-Policy", "strict-origin-when-cross-origin"),
    ]
    .into_iter()
    .filter_map(|(name, value)| Header::from_bytes(name, value).ok())
    .collect()
}

pub(crate) fn cli_missing_for_body() -> String {
    serde_json::json!({ "message": "missing for" }).to_string()
}

pub(crate) fn cors_origin_header() -> Option<Header> {
    // Defaults to "*" for local dev compatibility.
    // Production MUST set LOBSTER_CORS_ORIGIN to the actual frontend origin.
    let origin = std::env::var("LOBSTER_CORS_ORIGIN").unwrap_or_else(|_| "*".into());
    let origin = origin.trim();
    let value = if is_safe_header_value(origin) {
        origin
    } else {
        "*"
    };
    Header::from_bytes("Access-Control-Allow-Origin", value).ok()
}

fn is_safe_header_value(value: &str) -> bool {
    !value.is_empty() && value.is_ascii() && !value.chars().any(char::is_control)
}

pub(crate) fn cors_methods_header() -> Option<Header> {
    Header::from_bytes("Access-Control-Allow-Methods", "GET, POST, OPTIONS").ok()
}

pub(crate) fn cors_headers_header() -> Option<Header> {
    Header::from_bytes(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization",
    )
    .ok()
}

pub(crate) fn authorization_bearer_token(request: &Request) -> Option<String> {
    request
        .headers()
        .iter()
        .find(|header| header.field.equiv("Authorization"))
        .and_then(|header| {
            let value = header.value.as_str().trim();
            value
                .strip_prefix("Bearer ")
                .or_else(|| value.strip_prefix("bearer "))
                .map(str::trim)
                .filter(|token| !token.is_empty())
                .map(str::to_string)
        })
}

pub(crate) fn split_path_and_query(url: &str) -> (&str, HashMap<String, String>) {
    let mut parts = url.splitn(2, '?');
    let path = parts.next().unwrap_or(url);
    let query = parts.next().unwrap_or_default();
    let mut params = HashMap::new();
    for pair in query.split('&') {
        if pair.is_empty() {
            continue;
        }
        let mut item = pair.splitn(2, '=');
        let key = decode_query_component(item.next().unwrap_or_default());
        let value = decode_query_component(item.next().unwrap_or_default());
        params.insert(key, value);
    }
    (path, params)
}

fn decode_query_component(raw: &str) -> String {
    let replaced = raw.replace('+', " ");
    let bytes = replaced.as_bytes();
    let mut decoded = Vec::with_capacity(bytes.len());
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index] == b'%'
            && index + 2 < bytes.len()
            && let (Some(high), Some(low)) = (
                decode_hex_nibble(bytes[index + 1]),
                decode_hex_nibble(bytes[index + 2]),
            )
        {
            decoded.push((high << 4) | low);
            index += 3;
            continue;
        }
        decoded.push(bytes[index]);
        index += 1;
    }
    String::from_utf8_lossy(&decoded).into_owned()
}

fn decode_hex_nibble(value: u8) -> Option<u8> {
    match value {
        b'0'..=b'9' => Some(value - b'0'),
        b'a'..=b'f' => Some(value - b'a' + 10),
        b'A'..=b'F' => Some(value - b'A' + 10),
        _ => None,
    }
}

pub(crate) fn parse_export_format(raw: Option<&str>) -> ExportFormat {
    match raw
        .unwrap_or("markdown")
        .trim()
        .to_ascii_lowercase()
        .as_str()
    {
        "jsonl" => ExportFormat::Jsonl,
        "txt" | "text" => ExportFormat::Text,
        _ => ExportFormat::Markdown,
    }
}

pub(crate) fn parse_bool(raw: Option<&str>) -> bool {
    matches!(
        raw.unwrap_or("false").trim().to_ascii_lowercase().as_str(),
        "1" | "true" | "yes" | "on"
    )
}

#[cfg_attr(not(test), allow(dead_code))]
pub(crate) fn parse_cli_address(raw: &str) -> Result<CliAddress, String> {
    let trimmed = raw.trim();
    let (prefix, rest) = trimmed
        .split_once(':')
        .ok_or_else(|| format!("unsupported cli address: {trimmed}"))?;
    if rest.trim().is_empty() {
        return Err(format!("unsupported cli address: {trimmed}"));
    }
    match prefix {
        "user" => Ok(CliAddress::User(IdentityId(rest.trim().into()))),
        "agent" => Ok(CliAddress::Agent(IdentityId(rest.trim().into()))),
        "room" => Ok(CliAddress::Room(ConversationId(trimmed.into()))),
        _ => Err(format!("unsupported cli address: {trimmed}")),
    }
}

pub(crate) fn parse_cli_args() -> (String, PathBuf, Option<String>) {
    let mut host = "127.0.0.1".to_string();
    let mut port = "8787".to_string();
    let mut state_dir = std::env::current_dir()
        .unwrap_or_else(|_| PathBuf::from("."))
        .join(".lobster-chat-dev")
        .join("gateway");
    let mut upstream_gateway_url = std::env::var("LOBSTER_WAKU_PROVIDER_URL")
        .ok()
        .or_else(|| std::env::var("LOBSTER_WAKU_UPSTREAM_URL").ok());
    let mut args = std::env::args().skip(1);

    while let Some(arg) = args.next() {
        match arg.as_str() {
            "--host" => {
                if let Some(value) = args.next() {
                    host = value;
                }
            }
            "--port" => {
                if let Some(value) = args.next() {
                    port = value;
                }
            }
            "--state-dir" => {
                if let Some(value) = args.next() {
                    state_dir = PathBuf::from(value);
                }
            }
            "--upstream-gateway-url" => {
                if let Some(value) = args.next() {
                    upstream_gateway_url = Some(value);
                }
            }
            "--provider-url" => {
                if let Some(value) = args.next() {
                    upstream_gateway_url = Some(value);
                }
            }
            _ => {}
        }
    }

    (format!("{host}:{port}"), state_dir, upstream_gateway_url)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn function_body<'a>(source: &'a str, signature: &str) -> &'a str {
        let start = source.find(signature).expect("function signature");
        let rest = &source[start..];
        let end = rest.find("\n}\n").expect("function end");
        &rest[..end]
    }

    #[test]
    fn security_headers_do_not_depend_on_unwrap() {
        let source = include_str!("http_support.rs");
        let body = function_body(source, "pub(crate) fn security_headers()");

        assert!(
            !body.contains(".unwrap()"),
            "security_headers should skip invalid static headers instead of panicking"
        );
    }

    #[test]
    fn static_header_helpers_do_not_depend_on_panic_paths() {
        let source = include_str!("http_support.rs");
        let helper_signatures = [
            "pub(crate) fn json_header()",
            "pub(crate) fn text_header()",
            "pub(crate) fn sse_header()",
            "pub(crate) fn no_cache_header()",
            "pub(crate) fn cors_origin_header()",
            "pub(crate) fn cors_methods_header()",
            "pub(crate) fn cors_headers_header()",
        ];

        for signature in helper_signatures {
            let body = function_body(source, signature);
            assert!(
                !body.contains(".expect(")
                    && !body.contains(".unwrap()")
                    && !body.contains("panic!("),
                "{signature} should skip invalid headers instead of panicking"
            );
        }
    }

    #[test]
    fn cors_origin_non_ascii_env_falls_back_to_wildcard() {
        unsafe {
            std::env::set_var("LOBSTER_CORS_ORIGIN", "https://例子.invalid");
        }

        let header = cors_origin_header().expect("cors header should be available");

        unsafe {
            std::env::remove_var("LOBSTER_CORS_ORIGIN");
        }

        assert_eq!(header.field.to_string(), "Access-Control-Allow-Origin");
        assert_eq!(header.value.as_str(), "*");
    }

    #[test]
    fn security_headers_keep_expected_header_names() {
        let names: Vec<_> = security_headers()
            .into_iter()
            .map(|header| header.field.to_string())
            .collect();

        assert_eq!(
            names,
            vec![
                "X-Content-Type-Options",
                "X-Frame-Options",
                "Referrer-Policy",
            ]
        );
    }
}
