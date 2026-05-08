use std::{
    io::Cursor,
    sync::{Arc, Mutex},
};

use tiny_http::{Request, Response, StatusCode};
use transport_waku::{WakuGatewayRequest, WakuGatewayResponse};

use crate::{
    AddWorldMirrorSourceRequest, CliSendRequest, ConnectProviderRequest, EditShellMessageRequest,
    GatewayRuntime, GatewayStateNotifier, OpenDirectSessionRequest, RecallShellMessageRequest,
    ShellMessageRequest, http_support::json_header,
};

pub(crate) type HttpResponse = Response<Cursor<Vec<u8>>>;

pub(crate) fn handle_post_world_mirror_sources(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }

    match serde_json::from_slice::<AddWorldMirrorSourceRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .add_world_mirror_source(payload);
            match result {
                Ok(mirror_sources) => Response::from_string(
                    serde_json::to_string(&mirror_sources).unwrap_or_else(|_| "[]".into()),
                )
                .with_status_code(StatusCode(200))
                .with_header(json_header()),
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_header(json_header()),
            }
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode world mirror source failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_provider_connect(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }

    match serde_json::from_slice::<ConnectProviderRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .connect_provider(payload);
            match result {
                Ok(provider) => Response::from_string(
                    serde_json::to_string(&provider).unwrap_or_else(|_| "{}".into()),
                )
                .with_status_code(StatusCode(200))
                .with_header(json_header()),
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_header(json_header()),
            }
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode connect provider failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_provider_disconnect(
    runtime: &Arc<Mutex<GatewayRuntime>>,
) -> HttpResponse {
    let result = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .disconnect_provider();
    match result {
        Ok(provider) => {
            Response::from_string(serde_json::to_string(&provider).unwrap_or_else(|_| "{}".into()))
                .with_status_code(StatusCode(200))
                .with_header(json_header())
        }
        Err(message) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error { message })
                .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_direct_open(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }

    match serde_json::from_slice::<OpenDirectSessionRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .open_direct_session(payload);
            match result {
                Ok(group) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&group).unwrap_or_else(|_| "{}".into()),
                    )
                    .with_status_code(StatusCode(200))
                    .with_header(json_header())
                }
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_header(json_header()),
            }
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode direct session request failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_waku(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("read request body failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"Error\":\"read body failed\"}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header());
    }

    match serde_json::from_slice::<WakuGatewayRequest>(&body) {
        Ok(gateway_request) => {
            let gateway_response = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .handle(gateway_request);
            let status = match gateway_response {
                WakuGatewayResponse::Error { .. } => StatusCode(400),
                _ => StatusCode(200),
            };
            Response::from_string(
                serde_json::to_string(&gateway_response)
                    .unwrap_or_else(|_| "{\"Error\":{\"message\":\"serialize failed\"}}".into()),
            )
            .with_status_code(status)
            .with_header(json_header())
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode gateway request failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"Error\":\"decode failed\"}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_shell_message(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }

    match serde_json::from_slice::<ShellMessageRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .append_shell_message(payload);
            match result {
                Ok(response) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&response).unwrap_or_else(|_| "{\"ok\":true}".into()),
                    )
                    .with_status_code(StatusCode(200))
                    .with_header(json_header())
                }
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_header(json_header()),
            }
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode shell message failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_shell_message_recall(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }

    match serde_json::from_slice::<RecallShellMessageRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .recall_shell_message(payload);
            match result {
                Ok(response) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&response).unwrap_or_else(|_| "{\"ok\":true}".into()),
                    )
                    .with_status_code(StatusCode(200))
                    .with_header(json_header())
                }
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_header(json_header()),
            }
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode shell message recall failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_shell_message_edit(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }

    match serde_json::from_slice::<EditShellMessageRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .edit_shell_message(payload);
            match result {
                Ok(response) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&response).unwrap_or_else(|_| "{\"ok\":true}".into()),
                    )
                    .with_status_code(StatusCode(200))
                    .with_header(json_header())
                }
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_header(json_header()),
            }
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode shell message edit failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_cli_send(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }

    match serde_json::from_slice::<CliSendRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .send_cli_message(payload);
            match result {
                Ok(response) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&response).unwrap_or_else(|_| "{\"ok\":true}".into()),
                    )
                    .with_status_code(StatusCode(200))
                    .with_header(json_header())
                }
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_header(json_header()),
            }
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode cli send request failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}
