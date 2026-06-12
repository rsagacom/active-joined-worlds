use std::{
    io::Cursor,
    sync::{Arc, Mutex},
};

use tiny_http::{Request, Response, StatusCode};
use transport_waku::WakuGatewayResponse;

use crate::{
    GatewayRuntime, GatewayStateNotifier, IdentityId, PublishSafetyAdvisoryRequest,
    PublishWorldNoticeRequest, ReviewSafetyReportRequest, SanctionResidentRequest,
    SubmitSafetyReportRequest, UnsanctionResidentRequest, UpdateCityTrustRequest,
    http_support::{authorization_bearer_token, json_header, read_request_body},
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

pub(crate) fn handle_post_publish_world_notice(
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

    match serde_json::from_slice::<PublishWorldNoticeRequest>(&body) {
        Ok(payload) => {
            let result = {
                let mut runtime = runtime.lock().expect("gateway runtime mutex poisoned");
                if let Some(token) = auth_token.as_deref() {
                    let actor = IdentityId(payload.actor_id.clone());
                    if let Err(message) = runtime.validate_bearer_session_actor(token, &actor) {
                        return unauthorized(message);
                    }
                }
                runtime.publish_world_notice(payload)
            };
            match result {
                Ok(notice) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&notice).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode world notice failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_update_city_trust(
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

    match serde_json::from_slice::<UpdateCityTrustRequest>(&body) {
        Ok(payload) => {
            let result = {
                let mut runtime = runtime.lock().expect("gateway runtime mutex poisoned");
                if let Some(token) = auth_token.as_deref() {
                    let actor = IdentityId(payload.actor_id.clone());
                    if let Err(message) = runtime.validate_bearer_session_actor(token, &actor) {
                        return unauthorized(message);
                    }
                }
                runtime.update_city_trust(payload)
            };
            match result {
                Ok(record) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&record).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode city trust update failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_submit_safety_report(
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

    match serde_json::from_slice::<SubmitSafetyReportRequest>(&body) {
        Ok(payload) => {
            let result = {
                let mut runtime = runtime.lock().expect("gateway runtime mutex poisoned");
                if let Some(token) = auth_token.as_deref() {
                    let reporter = IdentityId(payload.reporter_id.clone());
                    if let Err(message) = runtime.validate_bearer_session_actor(token, &reporter) {
                        return unauthorized(message);
                    }
                }
                runtime.submit_safety_report(payload)
            };
            match result {
                Ok(report) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&report).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode safety report failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_review_safety_report(
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

    match serde_json::from_slice::<ReviewSafetyReportRequest>(&body) {
        Ok(payload) => {
            let result = {
                let mut runtime = runtime.lock().expect("gateway runtime mutex poisoned");
                if let Some(token) = auth_token.as_deref() {
                    let actor = IdentityId(payload.actor_id.clone());
                    if let Err(message) = runtime.validate_bearer_session_actor(token, &actor) {
                        return unauthorized(message);
                    }
                }
                runtime.review_safety_report(payload)
            };
            match result {
                Ok(report) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&report).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode safety report review failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_publish_safety_advisory(
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

    match serde_json::from_slice::<PublishSafetyAdvisoryRequest>(&body) {
        Ok(payload) => {
            let result = {
                let mut runtime = runtime.lock().expect("gateway runtime mutex poisoned");
                if let Some(token) = auth_token.as_deref() {
                    let actor = IdentityId(payload.actor_id.clone());
                    if let Err(message) = runtime.validate_bearer_session_actor(token, &actor) {
                        return unauthorized(message);
                    }
                }
                runtime.publish_safety_advisory(payload)
            };
            match result {
                Ok(advisory) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&advisory).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode safety advisory failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_sanction_resident(
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

    match serde_json::from_slice::<SanctionResidentRequest>(&body) {
        Ok(payload) => {
            let result = {
                let mut runtime = runtime.lock().expect("gateway runtime mutex poisoned");
                if let Some(token) = auth_token.as_deref() {
                    let actor = IdentityId(payload.actor_id.clone());
                    if let Err(message) = runtime.validate_bearer_session_actor(token, &actor) {
                        return unauthorized(message);
                    }
                }
                runtime.sanction_resident(payload)
            };
            match result {
                Ok(sanction) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&sanction).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode resident sanction failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_unsanction_resident(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    notifier: &Arc<GatewayStateNotifier>,
    request: &mut Request,
) -> HttpResponse {
    let auth_token = authorization_bearer_token(request);
    let body = match read_request_body(request) {
        Ok(body) => body,
        Err(error) => {
            return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
                .with_status_code(StatusCode(400))
                .with_header(json_header());
        }
    };
    match serde_json::from_slice::<UnsanctionResidentRequest>(&body) {
        Ok(payload) if payload.actor_id.trim().is_empty() => {
            Response::from_string("{\"error\":\"actor_id is required\"}")
                .with_status_code(StatusCode(400))
                .with_header(json_header())
        }
        Ok(payload) if payload.sanction_id.trim().is_empty() => {
            Response::from_string("{\"error\":\"sanction_id is required\"}")
                .with_status_code(StatusCode(400))
                .with_header(json_header())
        }
        Ok(payload) => {
            let mut runtime = runtime.lock().expect("gateway runtime mutex poisoned");
            if let Some(token) = auth_token.as_deref() {
                let actor = IdentityId(payload.actor_id.clone());
                if let Err(message) = runtime.validate_bearer_session_actor(token, &actor) {
                    return unauthorized(message);
                }
            }
            match runtime.revoke_sanction(&payload.sanction_id) {
                Ok(()) => {
                    runtime.log_audit_event(
                        &payload.actor_id,
                        "admin:unsanction_resident",
                        &payload.sanction_id,
                        None,
                    );
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(
                            &serde_json::json!({"ok": true, "sanction_id": payload.sanction_id}),
                        )
                        .unwrap_or_else(|_| "{}".into()),
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
        Err(error) => Response::from_string(format!(
            "{{\"error\":\"decode unsanction request failed: {error}\"}}"
        ))
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}
