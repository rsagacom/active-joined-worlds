use std::{
    io::Cursor,
    sync::{Arc, Mutex},
};

use tiny_http::{Request, Response, StatusCode};
use transport_waku::{WakuGatewayRequest, WakuGatewayResponse};

use crate::{
    AddWorldMirrorSourceRequest, AdminBanResidentRequest, AdminConfigPayload,
    AdminCreateInviteRequest, AdminCreateResidentRequest, AdminFreezeRoomRequest,
    AdminHandleLogRequest, AdminManageRoomMemberRequest, AdminModerateMessageRequest,
    AdminRevokeInviteRequest, AdminSetNicknameRequest, AdminUnbanResidentRequest,
    AdminUnfreezeRoomRequest, AdminUpdateSceneRequest, AssignPermissionGroupRequest,
    CliSendRequest, ConnectProviderRequest, ConversationId, CreatePermissionGroupRequest,
    EditShellMessageRequest, GatewayRuntime, GatewayStateNotifier, IdentityId,
    OpenDirectSessionRequest, RecallShellMessageRequest, SceneHotspotLayer, SceneImageLayer,
    ShellMarkReadRequest, ShellMessageRequest, ShellPresenceRequest, ShellSetNicknameRequest,
    UpdateShellSceneRequest,
    http_support::{ResponseHeaderExt, authorization_bearer_token, json_header},
};

pub(crate) type HttpResponse = Response<Cursor<Vec<u8>>>;

fn unauthorized(message: String) -> HttpResponse {
    Response::from_string(
        serde_json::to_string(&WakuGatewayResponse::Error { message })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
    )
    .with_status_code(StatusCode(401))
    .with_optional_header(json_header())
}

fn runtime_unavailable() -> HttpResponse {
    Response::from_string(
        serde_json::to_string(&WakuGatewayResponse::Error {
            message: "gateway runtime unavailable".into(),
        })
        .unwrap_or_else(|_| "{\"error\":true}".into()),
    )
    .with_status_code(StatusCode(500))
    .with_optional_header(json_header())
}

fn with_runtime<T>(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    action: impl FnOnce(&mut GatewayRuntime) -> T,
) -> Result<T, HttpResponse> {
    match runtime.lock() {
        Ok(mut runtime) => Ok(action(&mut runtime)),
        Err(_) => Err(runtime_unavailable()),
    }
}

fn missing_admin_actor_response() -> HttpResponse {
    Response::from_string("{\"error\":\"actor_id is required for admin operations\"}")
        .with_status_code(StatusCode(401))
        .with_optional_header(json_header())
}

fn required_admin_actor(actor_id: Option<String>) -> Result<String, HttpResponse> {
    actor_id
        .filter(|id| !id.trim().is_empty())
        .ok_or_else(missing_admin_actor_response)
}

fn require_capability_or_bypass(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    actor_id: &str,
    capability: &str,
) -> Option<HttpResponse> {
    let rt = match runtime.lock() {
        Ok(runtime) => runtime,
        Err(_) => return Some(runtime_unavailable()),
    };
    if rt.dev_auth_bypass_enabled() {
        return None;
    }
    if !rt.resident_has_capability(actor_id, capability) {
        return Some(unauthorized(format!(
            "forbidden: resident {} lacks capability {}",
            actor_id, capability
        )));
    }
    None
}

/// Require a valid Bearer token for admin operations. In dev mode, bypasses if LOBSTER_DEV_AUTH_BYPASS=1.
pub(crate) fn require_admin_auth(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    request: &tiny_http::Request,
) -> Option<HttpResponse> {
    let runtime = match runtime.lock() {
        Ok(runtime) => runtime,
        Err(_) => return Some(runtime_unavailable()),
    };
    if runtime.dev_auth_bypass_enabled() {
        return None;
    }
    match crate::http_support::authorization_bearer_token(request) {
        Some(_token) => None,
        None => Some(unauthorized(
            "admin operations require a valid Bearer token".into(),
        )),
    }
}

pub(crate) fn handle_post_world_mirror_sources(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }

    match serde_json::from_slice::<AddWorldMirrorSourceRequest>(&body) {
        Ok(payload) => {
            let result =
                match with_runtime(runtime, |runtime| runtime.add_world_mirror_source(payload)) {
                    Ok(result) => result,
                    Err(response) => return response,
                };
            match result {
                Ok(mirror_sources) => Response::from_string(
                    serde_json::to_string(&mirror_sources).unwrap_or_else(|_| "[]".into()),
                )
                .with_status_code(StatusCode(200))
                .with_optional_header(json_header()),
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header()),
            }
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode world mirror source failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_optional_header(json_header()),
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
            .with_optional_header(json_header());
    }

    match serde_json::from_slice::<ConnectProviderRequest>(&body) {
        Ok(payload) => {
            let result = match with_runtime(runtime, |runtime| runtime.connect_provider(payload)) {
                Ok(result) => result,
                Err(response) => return response,
            };
            match result {
                Ok(provider) => Response::from_string(
                    serde_json::to_string(&provider).unwrap_or_else(|_| "{}".into()),
                )
                .with_status_code(StatusCode(200))
                .with_optional_header(json_header()),
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header()),
            }
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode connect provider failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_optional_header(json_header()),
    }
}

pub(crate) fn handle_post_provider_disconnect(
    runtime: &Arc<Mutex<GatewayRuntime>>,
) -> HttpResponse {
    let result = match with_runtime(runtime, |runtime| runtime.disconnect_provider()) {
        Ok(result) => result,
        Err(response) => return response,
    };
    match result {
        Ok(provider) => {
            Response::from_string(serde_json::to_string(&provider).unwrap_or_else(|_| "{}".into()))
                .with_status_code(StatusCode(200))
                .with_optional_header(json_header())
        }
        Err(message) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error { message })
                .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_optional_header(json_header()),
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
            .with_optional_header(json_header());
    }

    match serde_json::from_slice::<OpenDirectSessionRequest>(&body) {
        Ok(payload) => {
            let result = match with_runtime(runtime, |runtime| runtime.open_direct_session(payload))
            {
                Ok(result) => result,
                Err(response) => return response,
            };
            match result {
                Ok(group) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&group).unwrap_or_else(|_| "{}".into()),
                    )
                    .with_status_code(StatusCode(200))
                    .with_optional_header(json_header())
                }
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header()),
            }
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode direct session request failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_optional_header(json_header()),
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
        .with_optional_header(json_header());
    }

    match serde_json::from_slice::<WakuGatewayRequest>(&body) {
        Ok(gateway_request) => {
            let gateway_response =
                match with_runtime(runtime, |runtime| runtime.handle(gateway_request)) {
                    Ok(gateway_response) => gateway_response,
                    Err(response) => return response,
                };
            let status = match gateway_response {
                WakuGatewayResponse::Error { .. } => StatusCode(400),
                _ => StatusCode(200),
            };
            Response::from_string(
                serde_json::to_string(&gateway_response)
                    .unwrap_or_else(|_| "{\"Error\":{\"message\":\"serialize failed\"}}".into()),
            )
            .with_status_code(status)
            .with_optional_header(json_header())
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode gateway request failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"Error\":\"decode failed\"}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_optional_header(json_header()),
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
            .with_optional_header(json_header());
    }

    match serde_json::from_slice::<ShellMessageRequest>(&body) {
        Ok(payload) => {
            let result = match with_runtime(runtime, |runtime| {
                if let Some(token) = auth_token.as_deref() {
                    let actor = chat_core::IdentityId(payload.sender.clone());
                    if let Err(message) = runtime.validate_bearer_session_actor(token, &actor) {
                        return Err(unauthorized(message));
                    }
                }
                if let Some(retry_ms) = runtime.check_rate_limit(&payload.sender, 30) {
                    return Err(Response::from_string(format!(
                        "{{\"error\":\"rate_limited\",\"retry_after_ms\":{}}}",
                        retry_ms
                    ))
                    .with_status_code(StatusCode(429))
                    .with_optional_header(json_header()));
                }
                Ok(runtime.append_shell_message(payload))
            }) {
                Ok(Ok(result)) => result,
                Ok(Err(response)) | Err(response) => return response,
            };
            match result {
                Ok(response) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&response).unwrap_or_else(|_| "{\"ok\":true}".into()),
                    )
                    .with_status_code(StatusCode(200))
                    .with_optional_header(json_header())
                }
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header()),
            }
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode shell message failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_optional_header(json_header()),
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
            .with_optional_header(json_header());
    }

    match serde_json::from_slice::<UpdateShellSceneRequest>(&body) {
        Ok(payload) => {
            let result = match with_runtime(runtime, |runtime| {
                if let Some(token) = auth_token.as_deref() {
                    let actor = chat_core::IdentityId(payload.actor.clone());
                    if let Err(message) = runtime.validate_bearer_session_actor(token, &actor) {
                        return Err(unauthorized(message));
                    }
                }
                Ok(runtime.update_shell_scene(payload))
            }) {
                Ok(Ok(result)) => result,
                Ok(Err(response)) | Err(response) => return response,
            };
            match result {
                Ok(response) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&response).unwrap_or_else(|_| "{\"ok\":true}".into()),
                    )
                    .with_status_code(StatusCode(200))
                    .with_optional_header(json_header())
                }
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header()),
            }
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode shell scene update failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_optional_header(json_header()),
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
            .with_optional_header(json_header());
    }

    match serde_json::from_slice::<RecallShellMessageRequest>(&body) {
        Ok(payload) => {
            let result = match with_runtime(runtime, |runtime| {
                if let Some(token) = auth_token.as_deref() {
                    let actor = chat_core::IdentityId(payload.actor.clone());
                    if let Err(message) = runtime.validate_bearer_session_actor(token, &actor) {
                        return Err(unauthorized(message));
                    }
                }
                Ok(runtime.recall_shell_message(payload))
            }) {
                Ok(Ok(result)) => result,
                Ok(Err(response)) | Err(response) => return response,
            };
            match result {
                Ok(response) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&response).unwrap_or_else(|_| "{\"ok\":true}".into()),
                    )
                    .with_status_code(StatusCode(200))
                    .with_optional_header(json_header())
                }
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header()),
            }
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode shell message recall failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_optional_header(json_header()),
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
            .with_optional_header(json_header());
    }

    match serde_json::from_slice::<EditShellMessageRequest>(&body) {
        Ok(payload) => {
            let result = match with_runtime(runtime, |runtime| {
                if let Some(token) = auth_token.as_deref() {
                    let actor = chat_core::IdentityId(payload.actor.clone());
                    if let Err(message) = runtime.validate_bearer_session_actor(token, &actor) {
                        return Err(unauthorized(message));
                    }
                }
                Ok(runtime.edit_shell_message(payload))
            }) {
                Ok(Ok(result)) => result,
                Ok(Err(response)) | Err(response) => return response,
            };
            match result {
                Ok(response) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&response).unwrap_or_else(|_| "{\"ok\":true}".into()),
                    )
                    .with_status_code(StatusCode(200))
                    .with_optional_header(json_header())
                }
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header()),
            }
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode shell message edit failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_optional_header(json_header()),
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
            .with_optional_header(json_header());
    }

    match serde_json::from_slice::<CliSendRequest>(&body) {
        Ok(payload) => {
            let result = match with_runtime(runtime, |runtime| runtime.send_cli_message(payload)) {
                Ok(result) => result,
                Err(response) => return response,
            };
            match result {
                Ok(response) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&response).unwrap_or_else(|_| "{\"ok\":true}".into()),
                    )
                    .with_status_code(StatusCode(200))
                    .with_optional_header(json_header())
                }
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header()),
            }
        }
        Err(error) => Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: format!("decode cli send request failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_optional_header(json_header()),
    }
}

pub(crate) fn handle_post_shell_presence(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let auth_token = authorization_bearer_token(request);
    let mut body = String::new();
    if let Err(error) = request.as_reader().read_to_string(&mut body) {
        return Response::from_string(format!("{{\"error\":\"read body failed: {error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    match serde_json::from_str::<ShellPresenceRequest>(&body) {
        Ok(presence) => {
            let resident_id = presence.resident_id.trim().to_string();
            if resident_id.is_empty() {
                return Response::from_string("{\"error\":\"resident_id is required\"}")
                    .with_status_code(StatusCode(400))
                    .with_optional_header(json_header());
            }
            if let Some(token) = auth_token.as_deref() {
                let actor = chat_core::IdentityId(resident_id.clone());
                let validation = match with_runtime(runtime, |runtime| {
                    runtime.validate_bearer_session_actor(token, &actor)
                }) {
                    Ok(validation) => validation,
                    Err(response) => return response,
                };
                if let Err(message) = validation {
                    return unauthorized(message);
                }
            }
            let became_online =
                match with_runtime(runtime, |runtime| runtime.record_presence(&resident_id)) {
                    Ok(became_online) => became_online,
                    Err(response) => return response,
                };
            if became_online {
                notifier.notify_changed();
            }
            Response::from_string("{\"ok\":true}")
                .with_status_code(StatusCode(200))
                .with_optional_header(json_header())
        }
        Err(error) => Response::from_string(format!("{{\"error\":\"decode failed: {error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header()),
    }
}

pub(crate) fn handle_post_shell_mark_read(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let auth_token = authorization_bearer_token(request);
    let mut body = String::new();
    if let Err(error) = request.as_reader().read_to_string(&mut body) {
        return Response::from_string(format!("{{\"error\":\"read body failed: {error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
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
                .with_optional_header(json_header());
            }
            if let Some(token) = auth_token.as_deref() {
                let validation = match with_runtime(runtime, |runtime| {
                    runtime.validate_bearer_session_actor(token, &resident_id)
                }) {
                    Ok(validation) => validation,
                    Err(response) => return response,
                };
                if let Err(message) = validation {
                    return unauthorized(message);
                }
            }
            if let Err(response) = with_runtime(runtime, |runtime| {
                runtime.mark_read(&resident_id, &conversation_id);
            }) {
                return response;
            }
            Response::from_string("{\"ok\":true}")
                .with_status_code(StatusCode(200))
                .with_optional_header(json_header())
        }
        Err(error) => Response::from_string(format!("{{\"error\":\"decode failed: {error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_ban_resident(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    if let Some(resp) = require_admin_auth(runtime, request) {
        return resp;
    }
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    match serde_json::from_str::<AdminBanResidentRequest>(&body) {
        Ok(req) => {
            let actor = match required_admin_actor(req.actor_id.clone()) {
                Ok(actor) => actor,
                Err(response) => return response,
            };
            if let Some(ref actor_id) = req.actor_id
                && let Some(resp) =
                    require_capability_or_bypass(runtime, actor_id, crate::CAP_BAN_RESIDENT)
            {
                return resp;
            }
            match with_runtime(runtime, |rt| {
                match rt.admin_ban_resident(&req.resident_id, &req.reason) {
                    Ok(()) => {
                        rt.log_audit_event(
                            &actor,
                            "admin:ban_resident",
                            &req.resident_id,
                            Some(&req.reason),
                        );
                        Response::from_string("{\"ok\":true}")
                            .with_status_code(StatusCode(200))
                            .with_optional_header(json_header())
                    }
                    Err(e) => Response::from_string(format!("{{\"error\":\"{e}\"}}"))
                        .with_status_code(StatusCode(400))
                        .with_optional_header(json_header()),
                }
            }) {
                Ok(response) => response,
                Err(response) => response,
            }
        }
        Err(e) => Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_unban_resident(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    if let Some(resp) = require_admin_auth(runtime, request) {
        return resp;
    }
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    match serde_json::from_str::<AdminUnbanResidentRequest>(&body) {
        Ok(req) => {
            let actor = match required_admin_actor(req.actor_id.clone()) {
                Ok(actor) => actor,
                Err(response) => return response,
            };
            match with_runtime(runtime, |rt| {
                match rt.admin_unban_resident(&req.resident_id) {
                    Ok(count) => {
                        rt.log_audit_event(&actor, "admin:unban_resident", &req.resident_id, None);
                        Response::from_string(
                            serde_json::to_string(
                                &serde_json::json!({"ok": true, "lifted_count": count}),
                            )
                            .unwrap_or_else(|_| "{}".into()),
                        )
                        .with_status_code(StatusCode(200))
                        .with_optional_header(json_header())
                    }
                    Err(e) => Response::from_string(format!("{{\"error\":\"{e}\"}}"))
                        .with_status_code(StatusCode(400))
                        .with_optional_header(json_header()),
                }
            }) {
                Ok(response) => response,
                Err(response) => response,
            }
        }
        Err(e) => Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_set_nickname(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    if let Some(resp) = require_admin_auth(runtime, request) {
        return resp;
    }
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    match serde_json::from_str::<AdminSetNicknameRequest>(&body) {
        Ok(req) => {
            match with_runtime(runtime, |rt| {
                match rt.admin_set_nickname(&req.resident_id, req.nickname.as_deref()) {
                    Ok(true) => Response::from_string(
                        serde_json::to_string(&serde_json::json!({"ok": true}))
                            .unwrap_or_else(|_| "{}".into()),
                    )
                    .with_status_code(StatusCode(200))
                    .with_optional_header(json_header()),
                    Ok(false) => Response::from_string("{\"error\":\"resident not found\"}")
                        .with_status_code(StatusCode(404))
                        .with_optional_header(json_header()),
                    Err(e) => Response::from_string(format!("{{\"error\":\"{e}\"}}"))
                        .with_status_code(StatusCode(400))
                        .with_optional_header(json_header()),
                }
            }) {
                Ok(response) => response,
                Err(response) => response,
            }
        }
        Err(e) => Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header()),
    }
}

pub(crate) fn handle_post_shell_set_nickname(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let token = match authorization_bearer_token(request) {
        Some(t) => t,
        None => return unauthorized("authorization bearer token required".into()),
    };
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    let req: ShellSetNicknameRequest = match serde_json::from_str(&body) {
        Ok(r) => r,
        Err(e) => {
            return Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header());
        }
    };
    match with_runtime(runtime, |rt| {
        let session = match rt.resolve_bearer_session(&token) {
            Ok(session) => session,
            Err(e) => {
                return Response::from_string(format!("{{\"error\":\"{e}\"}}"))
                    .with_status_code(StatusCode(401))
                    .with_optional_header(json_header());
            }
        };
        match rt.shell_set_nickname(&session.resident_id.0, req.nickname.as_deref()) {
            Ok((true, nickname)) => Response::from_string(
                serde_json::to_string(&serde_json::json!({"ok": true, "nickname": nickname}))
                    .unwrap_or_else(|_| "{}".into()),
            )
            .with_status_code(StatusCode(200))
            .with_optional_header(json_header()),
            Ok((false, _)) => Response::from_string("{\"error\":\"registration not found\"}")
                .with_status_code(StatusCode(404))
                .with_optional_header(json_header()),
            Err(e) => Response::from_string(format!("{{\"error\":\"{e}\"}}"))
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header()),
        }
    }) {
        Ok(response) => response,
        Err(response) => response,
    }
}

pub(crate) fn handle_post_admin_freeze_room(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    if let Some(resp) = require_admin_auth(runtime, request) {
        return resp;
    }
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    match serde_json::from_str::<AdminFreezeRoomRequest>(&body) {
        Ok(req) => {
            let actor = match required_admin_actor(req.actor_id.clone()) {
                Ok(actor) => actor,
                Err(response) => return response,
            };
            if let Some(ref actor_id) = req.actor_id
                && let Some(resp) =
                    require_capability_or_bypass(runtime, actor_id, crate::CAP_FREEZE_ROOM)
            {
                return resp;
            }
            match with_runtime(runtime, |rt| match rt.admin_freeze_room(&req.room_id) {
                Ok(_) => {
                    rt.log_audit_event(&actor, "admin:freeze_room", &req.room_id, None);
                    Response::from_string("{\"ok\":true}")
                        .with_status_code(StatusCode(200))
                        .with_optional_header(json_header())
                }
                Err(e) => Response::from_string(format!("{{\"error\":\"{e}\"}}"))
                    .with_status_code(StatusCode(400))
                    .with_optional_header(json_header()),
            }) {
                Ok(response) => response,
                Err(response) => response,
            }
        }
        Err(e) => Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_unfreeze_room(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    if let Some(resp) = require_admin_auth(runtime, request) {
        return resp;
    }
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    match serde_json::from_str::<AdminUnfreezeRoomRequest>(&body) {
        Ok(req) => {
            let actor = match required_admin_actor(req.actor_id.clone()) {
                Ok(actor) => actor,
                Err(response) => return response,
            };
            if let Some(ref actor_id) = req.actor_id
                && let Some(resp) =
                    require_capability_or_bypass(runtime, actor_id, crate::CAP_FREEZE_ROOM)
            {
                return resp;
            }
            match with_runtime(runtime, |rt| match rt.admin_unfreeze_room(&req.room_id) {
                Ok(_) => {
                    rt.log_audit_event(&actor, "admin:unfreeze_room", &req.room_id, None);
                    Response::from_string("{\"ok\":true}")
                        .with_status_code(StatusCode(200))
                        .with_optional_header(json_header())
                }
                Err(e) => Response::from_string(format!("{{\"error\":\"{e}\"}}"))
                    .with_status_code(StatusCode(400))
                    .with_optional_header(json_header()),
            }) {
                Ok(response) => response,
                Err(response) => response,
            }
        }
        Err(e) => Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_config(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    if let Some(resp) = require_admin_auth(runtime, request) {
        return resp;
    }
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    match serde_json::from_str::<AdminConfigPayload>(&body) {
        Ok(payload) => {
            let actor = match required_admin_actor(payload.actor_id.clone()) {
                Ok(actor) => actor,
                Err(response) => return response,
            };
            if let Some(ref actor_id) = payload.actor_id
                && let Some(resp) =
                    require_capability_or_bypass(runtime, actor_id, crate::CAP_ADMIN_CONFIG)
            {
                return resp;
            }
            match with_runtime(runtime, |runtime| {
                runtime.admin_set_config(payload.config);
                runtime.log_audit_event(&actor, "admin:config", "app-config", None);
                Response::from_string("{\"ok\":true}")
                    .with_status_code(StatusCode(200))
                    .with_optional_header(json_header())
            }) {
                Ok(response) => response,
                Err(response) => response,
            }
        }
        Err(e) => Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_moderate_message(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    if let Some(resp) = require_admin_auth(runtime, request) {
        return resp;
    }
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    match serde_json::from_str::<AdminModerateMessageRequest>(&body) {
        Ok(req) => {
            let actor = match required_admin_actor(req.actor_id.clone()) {
                Ok(actor) => actor,
                Err(response) => return response,
            };
            if let Some(ref actor_id) = req.actor_id
                && let Some(resp) =
                    require_capability_or_bypass(runtime, actor_id, crate::CAP_MODERATE_MESSAGE)
            {
                return resp;
            }
            match with_runtime(runtime, |rt| {
                let msg_id = req.message_id.clone();
                let conv_id = req.conversation_id.clone();
                let action = req.action.clone();
                match rt.admin_moderate_message(&req.message_id, &req.conversation_id, &req.action)
                {
                    Ok(()) => {
                        let target = format!("msg:{}@{}", msg_id, conv_id);
                        rt.log_audit_event(
                            &actor,
                            &format!("admin:moderate_message:{}", action),
                            &target,
                            req.reason.as_deref(),
                        );
                        Response::from_string(
                            serde_json::to_string(&serde_json::json!({"ok": true, "message_id": msg_id, "action": action}))
                                .unwrap_or_else(|_| "{}".into()),
                        )
                        .with_status_code(StatusCode(200))
                        .with_optional_header(json_header())
                    }
                    Err(e) => Response::from_string(format!("{{\"error\":\"{e}\"}}"))
                        .with_status_code(StatusCode(400))
                        .with_optional_header(json_header()),
                }
            }) {
                Ok(response) => response,
                Err(response) => response,
            }
        }
        Err(e) => Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header()),
    }
}

pub(crate) fn handle_post_admin_create_invite(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    if let Some(resp) = require_admin_auth(runtime, request) {
        return resp;
    }
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string(r#"{"error":"read body failed"}"#)
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    let req: AdminCreateInviteRequest = match serde_json::from_str(&body) {
        Ok(r) => r,
        Err(e) => {
            return Response::from_string(serde_json::json!({"error": e.to_string()}).to_string())
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header());
        }
    };
    let max_uses = req.max_uses.unwrap_or(10);
    let resp = match with_runtime(runtime, |rt| {
        rt.admin_create_invite(&req.actor_id, max_uses)
    }) {
        Ok(resp) => resp,
        Err(response) => return response,
    };
    let json = serde_json::to_string(&resp).unwrap_or_default();
    Response::from_string(json)
        .with_status_code(StatusCode(200))
        .with_optional_header(json_header())
}

pub(crate) fn handle_post_admin_revoke_invite(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    if let Some(resp) = require_admin_auth(runtime, request) {
        return resp;
    }
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string(r#"{"error":"read body failed"}"#)
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    let req: AdminRevokeInviteRequest = match serde_json::from_str(&body) {
        Ok(r) => r,
        Err(e) => {
            return Response::from_string(serde_json::json!({"error": e.to_string()}).to_string())
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header());
        }
    };
    let ok = match with_runtime(runtime, |rt| rt.admin_revoke_invite(&req.code)) {
        Ok(ok) => ok,
        Err(response) => return response,
    };
    let body = if ok {
        r#"{"ok":true}"#
    } else {
        r#"{"ok":false,"error":"not found"}"#
    };
    let code = if ok { StatusCode(200) } else { StatusCode(404) };
    Response::from_string(body)
        .with_status_code(code)
        .with_optional_header(json_header())
}

pub(crate) fn handle_post_admin_manage_room_member(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    if let Some(resp) = require_admin_auth(runtime, request) {
        return resp;
    }
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string(r#"{"error":"read body failed"}"#)
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    let req: AdminManageRoomMemberRequest = match serde_json::from_str(&body) {
        Ok(r) => r,
        Err(e) => {
            return Response::from_string(serde_json::json!({"error": e.to_string()}).to_string())
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header());
        }
    };
    let ok = match with_runtime(runtime, |rt| {
        rt.admin_manage_room_member(&req.room_id, &req.resident_id, &req.action)
    }) {
        Ok(ok) => ok,
        Err(response) => return response,
    };
    let resp = if ok {
        r#"{"ok":true}"#
    } else {
        r#"{"ok":false,"error":"room not found"}"#
    };
    let code = if ok { StatusCode(200) } else { StatusCode(404) };
    Response::from_string(resp)
        .with_status_code(code)
        .with_optional_header(json_header())
}

pub(crate) fn handle_post_admin_handle_log(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string(r#"{"error":"read body failed"}"#)
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    let req: AdminHandleLogRequest = match serde_json::from_str(&body) {
        Ok(r) => r,
        Err(e) => {
            return Response::from_string(serde_json::json!({"error": e.to_string()}).to_string())
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header());
        }
    };
    if let Err(response) = with_runtime(runtime, |rt| {
        rt.admin_handle_log(&req.log_id);
    }) {
        return response;
    }
    Response::from_string(r#"{"ok":true}"#)
        .with_status_code(StatusCode(200))
        .with_optional_header(json_header())
}

pub(crate) fn handle_post_admin_clear_processed_logs(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    _request: &mut Request,
) -> HttpResponse {
    let count = match with_runtime(runtime, |rt| rt.admin_clear_processed_logs()) {
        Ok(count) => count,
        Err(response) => return response,
    };
    let body = serde_json::json!({"ok": true, "cleared": count}).to_string();
    Response::from_string(body)
        .with_status_code(StatusCode(200))
        .with_optional_header(json_header())
}

pub(crate) fn handle_post_admin_create_resident(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string(r#"{"error":"read body failed"}"#)
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    let req: AdminCreateResidentRequest = match serde_json::from_str(&body) {
        Ok(r) => r,
        Err(e) => {
            return Response::from_string(serde_json::json!({"error": e.to_string()}).to_string())
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header());
        }
    };
    let ok = match with_runtime(runtime, |rt| {
        rt.admin_create_resident(&req.resident_id, &req.email)
    }) {
        Ok(ok) => ok,
        Err(response) => return response,
    };
    let resp = if ok {
        r#"{"ok":true}"#
    } else {
        r#"{"ok":false,"error":"resident already exists"}"#
    };
    let code = if ok { StatusCode(200) } else { StatusCode(409) };
    Response::from_string(resp)
        .with_status_code(code)
        .with_optional_header(json_header())
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
            .with_optional_header(json_header());
    }
    let parsed: serde_json::Value = match serde_json::from_str(&body) {
        Ok(v) => v,
        Err(e) => {
            return Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header());
        }
    };
    let image_layer: Option<SceneImageLayer> = parsed
        .get("image_layer")
        .and_then(|v| serde_json::from_value(v.clone()).ok());
    let hotspot_layer: Option<SceneHotspotLayer> = parsed
        .get("hotspot_layer")
        .and_then(|v| serde_json::from_value(v.clone()).ok());
    let result = match with_runtime(runtime, |runtime| {
        runtime.validate_scene_config(&ConversationId("".into()), &image_layer, &hotspot_layer)
    }) {
        Ok(result) => result,
        Err(response) => return response,
    };
    Response::from_string(serde_json::to_string(&result).unwrap_or_else(|_| "{}".into()))
        .with_status_code(StatusCode(200))
        .with_optional_header(json_header())
}

pub(crate) fn handle_post_create_permission_group(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string(r#"{"error":"read body failed"}"#)
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    let req: CreatePermissionGroupRequest = match serde_json::from_str(&body) {
        Ok(r) => r,
        Err(e) => {
            return Response::from_string(serde_json::json!({"error": e.to_string()}).to_string())
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header());
        }
    };
    if req.name.is_empty() {
        return Response::from_string(r#"{"error":"name is required"}"#)
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    if req.capabilities.is_empty() {
        return Response::from_string(r#"{"error":"at least one capability is required"}"#)
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    let resp = match with_runtime(runtime, |rt| {
        let result = rt.admin_create_permission_group(
            &req.actor_id,
            &req.name,
            &req.description,
            req.capabilities,
        );
        if result.ok {
            rt.log_audit_event(
                &req.actor_id,
                "admin:create_permission_group",
                &result.group.id,
                None,
            );
        }
        result
    }) {
        Ok(resp) => resp,
        Err(response) => return response,
    };
    Response::from_string(serde_json::to_string(&resp).unwrap_or_else(|_| r#"{"ok":false}"#.into()))
        .with_status_code(StatusCode(200))
        .with_optional_header(json_header())
}

pub(crate) fn handle_post_assign_permission_group(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    _notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = String::new();
    if request.as_reader().read_to_string(&mut body).is_err() {
        return Response::from_string(r#"{"error":"read body failed"}"#)
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    let req: AssignPermissionGroupRequest = match serde_json::from_str(&body) {
        Ok(r) => r,
        Err(e) => {
            return Response::from_string(serde_json::json!({"error": e.to_string()}).to_string())
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header());
        }
    };
    if req.resident_id.is_empty() || req.permission_group_id.is_empty() {
        return Response::from_string(
            r#"{"error":"resident_id and permission_group_id are required"}"#,
        )
        .with_status_code(StatusCode(400))
        .with_optional_header(json_header());
    }
    let resp = match with_runtime(runtime, |rt| {
        let result = rt.admin_assign_permission_group(&req.resident_id, &req.permission_group_id);
        if result.ok {
            let target = format!(
                "resident:{}→pg:{}",
                req.resident_id, req.permission_group_id
            );
            rt.log_audit_event(
                &req.actor_id,
                "admin:assign_permission_group",
                &target,
                None,
            );
        }
        result
    }) {
        Ok(resp) => resp,
        Err(response) => return response,
    };
    Response::from_string(serde_json::to_string(&resp).unwrap_or_else(|_| r#"{"ok":false}"#.into()))
        .with_status_code(StatusCode(200))
        .with_optional_header(json_header())
}

pub(crate) fn handle_post_admin_scene(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    if let Some(resp) = require_admin_auth(runtime, request) {
        return resp;
    }
    let mut body = Vec::new();
    if request.as_reader().read_to_end(&mut body).is_err() {
        return Response::from_string("{\"error\":\"read body failed\"}")
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header());
    }
    match serde_json::from_slice::<AdminUpdateSceneRequest>(&body) {
        Ok(req) => {
            if let Some(ref actor_id) = req.actor_id
                && let Some(resp) =
                    require_capability_or_bypass(runtime, actor_id, crate::CAP_ADMIN_SCENE)
            {
                return resp;
            }
            let result = match with_runtime(runtime, |rt| rt.admin_update_scene(req)) {
                Ok(result) => result,
                Err(response) => return response,
            };
            match result {
                Ok(response) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&response).unwrap_or_else(|_| "{\"ok\":true}".into()),
                    )
                    .with_status_code(StatusCode(200))
                    .with_optional_header(json_header())
                }
                Err(message) => Response::from_string(
                    serde_json::to_string(&WakuGatewayResponse::Error { message })
                        .unwrap_or_else(|_| "{\"error\":true}".into()),
                )
                .with_status_code(StatusCode(400))
                .with_optional_header(json_header()),
            }
        }
        Err(e) => Response::from_string(format!("{{\"error\":\"decode failed: {e}\"}}"))
            .with_status_code(StatusCode(400))
            .with_optional_header(json_header()),
    }
}
