use std::{
    io::Cursor,
    sync::{Arc, Mutex},
};

use tiny_http::{Request, Response, StatusCode};
use transport_waku::WakuGatewayResponse;

use crate::{
    ApproveCityJoinRequest, CreateCityRequest, CreatePublicRoomRequest, FreezePublicRoomRequest,
    GatewayRuntime, GatewayStateNotifier, JoinCityRequest, UpdateFederationPolicyRequest,
    UpdateStewardRequest, http_support::json_header,
};

pub(crate) type HttpResponse = Response<Cursor<Vec<u8>>>;

pub(crate) fn handle_post_create_city(
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

    match serde_json::from_slice::<CreateCityRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .create_city(payload);
            match result {
                Ok(city) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&city).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode create city failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_join_city(
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

    match serde_json::from_slice::<JoinCityRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .join_city(payload);
            match result {
                Ok(membership) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&membership).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode join city failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_approve_city_join(
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

    match serde_json::from_slice::<ApproveCityJoinRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .approve_city_join(payload);
            match result {
                Ok(membership) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&membership).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode approve city join failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_update_steward(
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

    match serde_json::from_slice::<UpdateStewardRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .update_steward(payload);
            match result {
                Ok(membership) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&membership).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode steward update failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_update_federation_policy(
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

    match serde_json::from_slice::<UpdateFederationPolicyRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .update_federation_policy(payload);
            match result {
                Ok(city) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&city).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode federation policy update failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_create_public_room(
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

    match serde_json::from_slice::<CreatePublicRoomRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .create_public_room(payload);
            match result {
                Ok(room) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&room).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode create public room failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}

pub(crate) fn handle_post_freeze_public_room(
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

    match serde_json::from_slice::<FreezePublicRoomRequest>(&body) {
        Ok(payload) => {
            let result = runtime
                .lock()
                .expect("gateway runtime mutex poisoned")
                .freeze_public_room(payload);
            match result {
                Ok(room) => {
                    notifier.notify_changed();
                    Response::from_string(
                        serde_json::to_string(&room).unwrap_or_else(|_| "{}".into()),
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
                message: format!("decode freeze room failed: {error}"),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header()),
    }
}
