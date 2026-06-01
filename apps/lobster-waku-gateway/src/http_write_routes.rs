use std::{
    io::Cursor,
    sync::{Arc, Mutex},
};

use tiny_http::{Request, Response, StatusCode};
use transport_waku::{WakuGatewayRequest, WakuGatewayResponse};

use crate::{
    AddWorldMirrorSourceRequest, AdminBanResidentRequest, AdminConfigPayload,
    AdminFreezeRoomRequest, AdminModerateMessageRequest,
    AdminUnbanResidentRequest, AdminUnfreezeRoomRequest,
    AdminCreateInviteRequest, AdminRevokeInviteRequest,
    AdminManageRoomMemberRequest, AdminHandleLogRequest,
    CliSendRequest, ConnectProviderRequest, ConversationId,
    EditShellMessageRequest, GatewayRuntime, GatewayStateNotifier, IdentityId,
    OpenDirectSessionRequest, RecallShellMessageRequest, SceneHotspotLayer, SceneImageLayer,
    ShellMarkReadRequest, ShellMessageRequest, ShellPresenceRequest, UpdateShellSceneRequest,
    http_support::{authorization_bearer_token, json_header},
};

pub(crate) type HttpResponse = Response<Cursor<Vec<u8>>>;

fn unauthorized(message: String) -> HttpResponse {
    Response::from_string(
        serde_json::to_string(&WakuGatewayResponse::Error { message })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
    )
    .with_status_code(StatusCode(401))
    .with_header(json_header())
}

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
    let auth_token = authorization_bearer_token(request);
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }

    match serde_json::from_slice::<ShellMessageRequest>(&body) {
        Ok(payload) => {
            let result = {
                let mut runtime = runtime.lock().expect("gateway runtime mutex poisoned");
                if let Some(token) = auth_token.as_deref() {
                    let actor = chat_core::IdentityId(payload.sender.clone());
                    if let Err(message) = runtime.validate_bearer_session_actor(token, &actor) {
                        return unauthorized(message);
                    }
                }
                if let Some(retry_ms) = runtime.check_rate_limit(&payload.sender, 30) {
                    return Response::from_string(
                        format!(
                            "{{\"error\":\"rate_limited\",\"retry_after_ms\":{}}}",
                            retry_ms
                        ),
                    )
                    .with_status_code(StatusCode(429))
                    .with_header(json_header());
                }
                runtime.append_shell_message(payload)
            };
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

pub(crate) fn handle_post_shell_scene(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let auth_token = authorization_bearer_token(request);
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }

    match serde_json::from_slice::<UpdateShellSceneRequest>(&body) {
        Ok(payload) => {
            let result = {
                let mut runtime = runtime.lock().expect("gateway runtime mutex poisoned");
                if let Some(token) = auth_token.as_deref() {
                    let actor = chat_core::IdentityId(payload.actor.clone());
                    if let Err(message) = runtime.validate_bearer_session_actor(token, &actor) {
                        return unauthorized(message);
                    }
                }
                runtime.update_shell_scene(payload)
            };
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
                message: format!("decode shell scene update failed: {error}"),
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
    let auth_token = authorization_bearer_token(request);
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }

    match serde_json::from_slice::<RecallShellMessageRequest>(&body) {
        Ok(payload) => {
            let result = {
                let mut runtime = runtime.lock().expect("gateway runtime mutex poisoned");
                if let Some(token) = auth_token.as_deref() {
                    let actor = chat_core::IdentityId(payload.actor.clone());
                    if let Err(message) = runtime.validate_bearer_session_actor(token, &actor) {
                        return unauthorized(message);
                    }
                }
                runtime.recall_shell_message(payload)
            };
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
    let auth_token = authorization_bearer_token(request);
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }

    match serde_json::from_slice::<EditShellMessageRequest>(&body) {
        Ok(payload) => {
            let result = {
                let mut runtime = runtime.lock().expect("gateway runtime mutex poisoned");
                if let Some(token) = auth_token.as_deref() {
                    let actor = chat_core::IdentityId(payload.actor.clone());
                    if let Err(message) = runtime.validate_bearer_session_actor(token, &actor) {
                        return unauthorized(message);
                    }
                }
                runtime.edit_shell_message(payload)
            };
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

pub(crate) fn handle_post_shell_presence(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if let Err(error) = request.as_reader().read_to_string(&mut body) {
        return Response::from_string(format!("{{\"error\":\"read body failed: {error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }
    match serde_json::from_str::<ShellPresenceRequest>(&body) {
        Ok(presence) => {
            let resident_id = presence.resident_id.trim().to_string();
            if resident_id.is_empty() {
                return Response::from_string("{\"error\":\"resident_id is required\"}")
                    .with_status_code(StatusCode(400))
                    .with_header(json_header());
            }
            let became_online = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .record_presence(&resident_id);
            if became_online {
                notifier.notify_changed();
            }
            Response::from_string("{\"ok\":true}")
                .with_status_code(StatusCode(200))
                .with_header(json_header())
        }
        Err(error) => Response::from_string(format!("{{\"error\":\"decode failed: {error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header()),
    }
}

pub(crate) fn handle_post_shell_mark_read(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if let Err(error) = request.as_reader().read_to_string(&mut body) {
        return Response::from_string(format!("{{\"error\":\"read body failed: {error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }
    match serde_json::from_str::<ShellMarkReadRequest>(&body) {
        Ok(read_req) => {
            let resident_id = IdentityId(read_req.resident_id.trim().to_string());
            let conversation_id = ConversationId(read_req.conversation_id.trim().to_string());
            if resident_id.0.is_empty() || conversation_id.0.is_empty() {
                return Response::from_string(
                    "{\"error\":\"resident_id and conversation_id are required\"}",
                )
                .with_status_code(StatusCode(400))
                .with_header(json_header());
            }
            runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .mark_read(&resident_id, &conversation_id);
            Response::from_string("{\"ok\":true}")
                .with_status_code(StatusCode(200))
                .with_header(json_header())
        }
        Err(error) => Response::from_string(format!("{{\"error\":\"decode failed: {error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_ban_resident(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }
    match serde_json::from_str::<AdminBanResidentRequest>(&body) {
        Ok(req) => match runtime
            .lock()
            .expect("gateway runtime mutex poisoned")
            .admin_ban_resident(&req.resident_id, &req.reason)
        {
            Ok(()) => Response::from_string("{\"ok\":true}")
                .with_status_code(StatusCode(200))
                .with_header(json_header()),
            Err(e) => Response::from_string(format!("{{\"error\":\"{e}\"}}"))
                .with_status_code(StatusCode(400))
                .with_header(json_header()),
        },
        Err(e) => Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_unban_resident(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }
    match serde_json::from_str::<AdminUnbanResidentRequest>(&body) {
        Ok(req) => match runtime
            .lock()
            .expect("gateway runtime mutex poisoned")
            .admin_unban_resident(&req.resident_id)
        {
            Ok(count) => Response::from_string(
                serde_json::to_string(&serde_json::json!({"ok": true, "lifted_count": count}))
                    .unwrap_or_else(|_| "{}".into()),
            )
            .with_status_code(StatusCode(200))
            .with_header(json_header()),
            Err(e) => Response::from_string(format!("{{\"error\":\"{e}\"}}"))
                .with_status_code(StatusCode(400))
                .with_header(json_header()),
        },
        Err(e) => Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_freeze_room(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }
    match serde_json::from_str::<AdminFreezeRoomRequest>(&body) {
        Ok(req) => match runtime
            .lock()
            .expect("gateway runtime mutex poisoned")
            .admin_freeze_room(&req.room_id)
        {
            Ok(_) => Response::from_string("{\"ok\":true}")
                .with_status_code(StatusCode(200))
                .with_header(json_header()),
            Err(e) => Response::from_string(format!("{{\"error\":\"{e}\"}}"))
                .with_status_code(StatusCode(400))
                .with_header(json_header()),
        },
        Err(e) => Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_unfreeze_room(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }
    match serde_json::from_str::<AdminUnfreezeRoomRequest>(&body) {
        Ok(req) => match runtime
            .lock()
            .expect("gateway runtime mutex poisoned")
            .admin_unfreeze_room(&req.room_id)
        {
            Ok(_) => Response::from_string("{\"ok\":true}")
                .with_status_code(StatusCode(200))
                .with_header(json_header()),
            Err(e) => Response::from_string(format!("{{\"error\":\"{e}\"}}"))
                .with_status_code(StatusCode(400))
                .with_header(json_header()),
        },
        Err(e) => Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_config(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }
    match serde_json::from_str::<AdminConfigPayload>(&body) {
        Ok(payload) => {
            runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .admin_set_config(payload.config);
            Response::from_string("{\"ok\":true}")
                .with_status_code(StatusCode(200))
                .with_header(json_header())
        }
        Err(e) => Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_moderate_message(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }
    match serde_json::from_str::<AdminModerateMessageRequest>(&body) {
        Ok(req) => match runtime
            .lock()
            .expect("gateway runtime mutex poisoned")
            .admin_moderate_message(
                &req.message_id,
                &req.conversation_id,
                &req.action,
            ) {
            Ok(()) => Response::from_string(
                serde_json::to_string(&serde_json::json!({"ok": true, "message_id": req.message_id, "action": req.action}))
                    .unwrap_or_else(|_| "{}".into()),
            )
            .with_status_code(StatusCode(200))
            .with_header(json_header()),
            Err(e) => Response::from_string(format!("{{\"error\":\"{e}\"}}"))
                .with_status_code(StatusCode(400))
                .with_header(json_header()),
        },
        Err(e) => Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header()),
    }
}





pub(crate) fn handle_post_admin_create_invite(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string(r#"{"error":"read body failed"}"#)
            .with_status_code(StatusCode(400)).with_header(json_header());
    }
    let req: AdminCreateInviteRequest = match serde_json::from_str(&body) {
        Ok(r) => r,
        Err(e) => return Response::from_string(serde_json::json!({"error": e.to_string()}).to_string())
            .with_status_code(StatusCode(400)).with_header(json_header()),
    };
    let max_uses = req.max_uses.unwrap_or(10);
    let mut rt = runtime.lock().expect("gateway runtime mutex");
    let resp = rt.admin_create_invite(&req.actor_id, max_uses);
    let json = serde_json::to_string(&resp).unwrap_or_default();
    Response::from_string(json).with_status_code(StatusCode(200)).with_header(json_header())
}

pub(crate) fn handle_post_admin_revoke_invite(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string(r#"{"error":"read body failed"}"#)
            .with_status_code(StatusCode(400)).with_header(json_header());
    }
    let req: AdminRevokeInviteRequest = match serde_json::from_str(&body) {
        Ok(r) => r,
        Err(e) => return Response::from_string(serde_json::json!({"error": e.to_string()}).to_string())
            .with_status_code(StatusCode(400)).with_header(json_header()),
    };
    let mut rt = runtime.lock().expect("gateway runtime mutex");
    let ok = rt.admin_revoke_invite(&req.code);
    let body = if ok { r#"{"ok":true}"# } else { r#"{"ok":false,"error":"not found"}"# };
    let code = if ok { StatusCode(200) } else { StatusCode(404) };
    Response::from_string(body).with_status_code(code).with_header(json_header())
}


pub(crate) fn handle_post_admin_manage_room_member(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string(r#"{"error":"read body failed"}"#)
            .with_status_code(StatusCode(400)).with_header(json_header());
    }
    let req: AdminManageRoomMemberRequest = match serde_json::from_str(&body) {
        Ok(r) => r,
        Err(e) => return Response::from_string(serde_json::json!({"error": e.to_string()}).to_string())
            .with_status_code(StatusCode(400)).with_header(json_header()),
    };
    let mut rt = runtime.lock().expect("gateway runtime mutex");
    let ok = rt.admin_manage_room_member(&req.room_id, &req.resident_id, &req.action);
    let resp = if ok {
        r#"{"ok":true}"#
    } else {
        r#"{"ok":false,"error":"room not found"}"#
    };
    let code = if ok { StatusCode(200) } else { StatusCode(404) };
    Response::from_string(resp).with_status_code(code).with_header(json_header())
}

pub(crate) fn handle_post_admin_handle_log(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string(r#"{"error":"read body failed"}"#)
            .with_status_code(StatusCode(400)).with_header(json_header());
    }
    let req: AdminHandleLogRequest = match serde_json::from_str(&body) {
        Ok(r) => r,
        Err(e) => return Response::from_string(serde_json::json!({"error": e.to_string()}).to_string())
            .with_status_code(StatusCode(400)).with_header(json_header()),
    };
    let mut rt = runtime.lock().expect("gateway runtime mutex");
    rt.admin_handle_log(&req.log_id);
    Response::from_string(r#"{"ok":true}"#).with_status_code(StatusCode(200)).with_header(json_header())
}


pub(crate) fn handle_post_scene_validate(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }
    let parsed: serde_json::Value = match serde_json::from_str(&body) {
        Ok(v) => v,
        Err(e) => {
            return Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
                .with_status_code(StatusCode(400))
                .with_header(json_header());
        }
    };
    let image_layer: Option<SceneImageLayer> = parsed
        .get("image_layer")
        .and_then(|v| serde_json::from_value(v.clone()).ok());
    let hotspot_layer: Option<SceneHotspotLayer> = parsed
        .get("hotspot_layer")
        .and_then(|v| serde_json::from_value(v.clone()).ok());
    let result = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .validate_scene_config(&ConversationId("".into()), &image_layer, &hotspot_layer);
    Response::from_string(serde_json::to_string(&result).unwrap_or_else(|_| "{}".into()))
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}
