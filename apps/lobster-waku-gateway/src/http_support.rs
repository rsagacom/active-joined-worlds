use std::{collections::HashMap, path::PathBuf};

use chat_core::{ConversationId, IdentityId};
use tiny_http::Header;

use crate::{CliAddress, ExportFormat};

pub(crate) fn json_header() -> Header {
    Header::from_bytes("Content-Type", "application/json; charset=utf-8")
        .expect("static json header should be valid")
}

pub(crate) fn text_header() -> Header {
    Header::from_bytes("Content-Type", "text/plain; charset=utf-8")
        .expect("static text header should be valid")
}

pub(crate) fn sse_header() -> Header {
    Header::from_bytes("Content-Type", "text/event-stream; charset=utf-8")
        .expect("static sse header should be valid")
}

pub(crate) fn no_cache_header() -> Header {
    Header::from_bytes("Cache-Control", "no-cache").expect("static cache header should be valid")
}

pub(crate) fn cli_missing_for_body() -> String {
    serde_json::json!({ "message": "missing for" }).to_string()
}

pub(crate) fn cors_origin_header() -> Header {
    Header::from_bytes("Access-Control-Allow-Origin", "*")
        .expect("static cors header should be valid")
}

pub(crate) fn cors_methods_header() -> Header {
    Header::from_bytes("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        .expect("static cors methods header should be valid")
}

pub(crate) fn cors_headers_header() -> Header {
    Header::from_bytes("Access-Control-Allow-Headers", "Content-Type")
        .expect("static cors headers header should be valid")
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
