use std::{
    io::Cursor,
    sync::{Arc, Mutex},
};

use tiny_http::{Request, Response, StatusCode};
use transport_waku::WakuGatewayResponse;

use crate::{
    AuthPreflightRequest, GatewayRuntime, GatewayStateNotifier, RequestEmailOtpRequest,
    RequestMobileOtpRequest, VerifyEmailOtpRequest, VerifyMobileOtpRequest,
    http_support::{authorization_bearer_token, json_header},
};

pub(crate) type HttpResponse = Response<Cursor<Vec<u8>>>;

fn ok_json() -> HttpResponse {
    Response::from_string("{\"ok\":true}")
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

fn unauthorized(message: String) -> HttpResponse {
    Response::from_string(
        serde_json::to_string(&WakuGatewayResponse::Error { message })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
    )
    .with_status_code(StatusCode(401))
    .with_header(json_header())
}

pub(crate) fn handle_get_auth_session(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    request: &Request,
) -> HttpResponse {
    let Some(token) = authorization_bearer_token(request) else {
        return unauthorized("authorization bearer token required".into());
    };
    let result = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .auth_session_projection(&token);
    match result {
        Ok(session) => {
            Response::from_string(serde_json::to_string(&session).unwrap_or_else(|_| "{}".into()))
                .with_status_code(StatusCode(200))
                .with_header(json_header())
        }
        Err(message) => unauthorized(message),
    }
}

pub(crate) fn handle_post_auth_preflight(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }

    match serde_json::from_slice::<AuthPreflightRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .auth_preflight(payload);
            match result {
                Ok(preflight) => Response::from_string(
                    serde_json::to_string(&preflight).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode auth preflight failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_request_email_otp(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }

    match serde_json::from_slice::<RequestEmailOtpRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .request_email_otp(payload);
            match result {
                Ok(response_body) => Response::from_string(
                    serde_json::to_string(&response_body).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode email otp request failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_verify_email_otp(
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

    match serde_json::from_slice::<VerifyEmailOtpRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .verify_email_otp(payload);
            match result {
                Ok(response_body) => {
                    notifier.notify_changed();
                    {
                        let mut rt = runtime.lock().expect("gateway runtime mutex poisoned");
                        rt.log_audit_event(
                            &response_body.resident_id,
                            "auth:login",
                            &response_body.session.session_id,
                            None,
                        );
                    }
                    Response::from_string(
                        serde_json::to_string(&response_body).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode email otp verify failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_request_mobile_otp(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    request: &mut Request,
) -> HttpResponse {
    let mut body = Vec::new();
    if let Err(error) = request.as_reader().read_to_end(&mut body) {
        return Response::from_string(format!("{{\"error\":\"{error}\"}}"))
            .with_status_code(StatusCode(400))
            .with_header(json_header());
    }

    match serde_json::from_slice::<RequestMobileOtpRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .request_mobile_otp(payload);
            match result {
                Ok(response_body) => Response::from_string(
                    serde_json::to_string(&response_body).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode mobile otp request failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_verify_mobile_otp(
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

    match serde_json::from_slice::<VerifyMobileOtpRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .verify_mobile_otp(payload);
            match result {
                Ok(response_body) => {
                    notifier.notify_changed();
                    {
                        let mut rt = runtime.lock().expect("gateway runtime mutex poisoned");
                        rt.log_audit_event(
                            &response_body.resident_id,
                            "auth:login",
                            &response_body.session.session_id,
                            None,
                        );
                    }
                    Response::from_string(
                        serde_json::to_string(&response_body).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode mobile otp verify failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_auth_logout(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    request: &Request,
) -> HttpResponse {
    let Some(token) = authorization_bearer_token(request) else {
        return unauthorized("authorization bearer token required".into());
    };
    let mut rt = runtime.lock().expect("gateway runtime mutex poisoned");
    let session = match rt.resolve_bearer_session(&token) {
        Ok(s) => s,
        Err(e) => return unauthorized(e),
    };
    match rt.revoke_auth_session(&token) {
        Ok(()) => {
            rt.log_audit_event(
                &session.resident_id.0,
                "auth:logout",
                &session.session_id,
                None,
            );
            ok_json()
        }
        Err(message) => unauthorized(message),
    }
}
