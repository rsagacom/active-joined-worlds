use std::sync::{Arc, Mutex};

use serde::Deserialize;
use tiny_http::{Request, Response, StatusCode};

use crate::{AdminDeviceRequest, GatewayRuntime, GatewayStateNotifier, http_support::json_header};

pub(crate) fn handle_get_admin_devices(
    runtime: &Arc<Mutex<GatewayRuntime>>,
) -> Response<std::io::Cursor<Vec<u8>>> {
    let devices = runtime.lock().expect("poisoned").admin_list_devices();
    let body = serde_json::to_string(&devices).unwrap_or_else(|_| "[]".into());
    Response::from_string(body)
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

pub(crate) fn handle_post_admin_add_device(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> Response<std::io::Cursor<Vec<u8>>> {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string(r#"{"error":"read body failed"}"#)
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }
    match serde_json::from_str::<AdminDeviceRequest>(&body) {
        Ok(req) => {
            let actor = req.actor_id.unwrap_or_else(|| "admin".into());
            match runtime.lock().expect("poisoned").admin_add_device(
                req.address,
                req.label.unwrap_or_default(),
                actor,
            ) {
                Ok(record) => Response::from_string(
                    serde_json::to_string(&record).unwrap_or_else(|_| "{}".into()),
                )
                .with_status_code(StatusCode(200))
                .with_header(json_header()),
                Err(msg) => Response::from_string(format!("{{\"error\":\"{msg}\"}}"))
                    .with_status_code(StatusCode(400))
                    .with_header(json_header()),
            }
        }
        Err(e) => Response::from_string(format!("{{\"error\":\"decode: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_remove_device(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> Response<std::io::Cursor<Vec<u8>>> {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string(r#"{"error":"read body failed"}"#)
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }
    #[derive(Deserialize)]
    struct RemoveReq {
        address: String,
    }
    match serde_json::from_str::<RemoveReq>(&body) {
        Ok(req) => match runtime
            .lock()
            .expect("poisoned")
            .admin_remove_device(&req.address)
        {
            Ok(()) => Response::from_string(r#"{"ok":true}"#)
                .with_status_code(StatusCode(200))
                .with_header(json_header()),
            Err(msg) => Response::from_string(format!("{{\"error\":\"{msg}\"}}"))
                .with_status_code(StatusCode(400))
                .with_header(json_header()),
        },
        Err(e) => Response::from_string(format!("{{\"error\":\"decode: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_block_device(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> Response<std::io::Cursor<Vec<u8>>> {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string(r#"{"error":"read body failed"}"#)
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }
    #[derive(Deserialize)]
    struct BlockReq {
        address: String,
    }
    match serde_json::from_str::<BlockReq>(&body) {
        Ok(req) => match runtime
            .lock()
            .expect("poisoned")
            .admin_block_device(&req.address)
        {
            Ok(()) => Response::from_string(r#"{"ok":true}"#)
                .with_status_code(StatusCode(200))
                .with_header(json_header()),
            Err(msg) => Response::from_string(format!("{{\"error\":\"{msg}\"}}"))
                .with_status_code(StatusCode(400))
                .with_header(json_header()),
        },
        Err(e) => Response::from_string(format!("{{\"error\":\"decode: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_unblock_device(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> Response<std::io::Cursor<Vec<u8>>> {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string(r#"{"error":"read body failed"}"#)
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }
    #[derive(Deserialize)]
    struct UnblockReq {
        address: String,
    }
    match serde_json::from_str::<UnblockReq>(&body) {
        Ok(req) => match runtime
            .lock()
            .expect("poisoned")
            .admin_unblock_device(&req.address)
        {
            Ok(()) => Response::from_string(r#"{"ok":true}"#)
                .with_status_code(StatusCode(200))
                .with_header(json_header()),
            Err(msg) => Response::from_string(format!("{{\"error\":\"{msg}\"}}"))
                .with_status_code(StatusCode(400))
                .with_header(json_header()),
        },
        Err(e) => Response::from_string(format!("{{\"error\":\"decode: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header()),
    }
}
