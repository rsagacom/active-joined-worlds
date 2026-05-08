use std::{
    collections::HashMap,
    io::Cursor,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

use host_adapter::default_mobile_web_bootstrap;
use tiny_http::{Response, StatusCode};
use transport_waku::WakuGatewayResponse;

use crate::{
    ConversationId, GatewayRuntime, GatewayStateNotifier, IdentityId,
    http_support::{
        cli_missing_for_body, json_header, no_cache_header, parse_bool, parse_cli_address,
        parse_export_format, sse_header,
    },
};

pub(crate) type HttpResponse = Response<Cursor<Vec<u8>>>;

pub(crate) fn handle_get_provider(runtime: &Arc<Mutex<GatewayRuntime>>) -> HttpResponse {
    let provider = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .provider_status();
    Response::from_string(serde_json::to_string(&provider).unwrap_or_else(|_| "{}".into()))
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

pub(crate) fn handle_get_shell_bootstrap(listen_addr: &str) -> HttpResponse {
    let mut bootstrap = default_mobile_web_bootstrap();
    bootstrap.gateway_base_url = Some(format!("http://{listen_addr}"));
    Response::from_string(serde_json::to_string(&bootstrap).unwrap_or_else(|_| "{}".into()))
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

pub(crate) fn handle_get_shell_state(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    query_params: &HashMap<String, String>,
) -> HttpResponse {
    let resident_id = query_params
        .get("resident_id")
        .map(|value| value.trim())
        .filter(|value| !value.is_empty())
        .map(|value| IdentityId(value.to_string()));
    let shell_state = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .shell_state_for_viewer(resident_id.as_ref());
    Response::from_string(serde_json::to_string(&shell_state).unwrap_or_else(|_| "{}".into()))
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

pub(crate) fn handle_get_shell_events(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    notifier: &Arc<GatewayStateNotifier>,
    query_params: &HashMap<String, String>,
) -> HttpResponse {
    let resident_id = query_params
        .get("resident_id")
        .map(|value| value.trim())
        .filter(|value| !value.is_empty())
        .map(|value| IdentityId(value.to_string()));
    let after_version = query_params
        .get("after")
        .map(|value| value.trim())
        .filter(|value| !value.is_empty());
    let wait_ms = parse_sse_wait_ms(query_params.get("wait_ms").map(String::as_str));
    let deadline = Instant::now() + Duration::from_millis(wait_ms);
    let shell_state = loop {
        let observed_generation = notifier.generation();
        let state = runtime
            .lock()
            .expect("gateway runtime mutex poisoned")
            .shell_state_for_viewer(resident_id.as_ref());
        let has_new_state = after_version
            .map(|version| state.state_version != version)
            .unwrap_or(true);
        if has_new_state || wait_ms == 0 || Instant::now() >= deadline {
            break state;
        }
        notifier.wait_until_changed_since(observed_generation, deadline);
    };
    let data = serde_json::to_string(&shell_state).unwrap_or_else(|_| "{}".into());
    let heartbeat = serde_json::json!({
        "now_ms": GatewayRuntime::now_ms(),
        "resident_id": resident_id.as_ref().map(|item| item.0.as_str()),
    });
    let body = format!(
        "retry: 4000\n\
         event: shell-state\n\
         data: {data}\n\n\
         event: shell-heartbeat\n\
         data: {heartbeat}\n\n"
    );
    Response::from_string(body)
        .with_status_code(StatusCode(200))
        .with_header(sse_header())
        .with_header(no_cache_header())
}

fn parse_sse_wait_ms(raw: Option<&str>) -> u64 {
    raw.and_then(|value| value.trim().parse::<u64>().ok())
        .unwrap_or(0)
        .min(5_000)
}

pub(crate) fn handle_get_world(runtime: &Arc<Mutex<GatewayRuntime>>) -> HttpResponse {
    let read_plan = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .federation_read_plan();
    let snapshot = read_plan.federated_governance_snapshot();
    Response::from_string(serde_json::to_string(&snapshot).unwrap_or_else(|_| "{}".into()))
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

pub(crate) fn handle_get_cities(runtime: &Arc<Mutex<GatewayRuntime>>) -> HttpResponse {
    let read_plan = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .federation_read_plan();
    let cities = read_plan.federated_governance_snapshot().cities;
    Response::from_string(serde_json::to_string(&cities).unwrap_or_else(|_| "[]".into()))
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

pub(crate) fn handle_get_residents(runtime: &Arc<Mutex<GatewayRuntime>>) -> HttpResponse {
    let read_plan = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .federation_read_plan();
    let snapshot = read_plan.federated_governance_snapshot();
    let residents = GatewayRuntime::resident_directory(&snapshot);
    Response::from_string(serde_json::to_string(&residents).unwrap_or_else(|_| "[]".into()))
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

pub(crate) fn handle_get_world_square(runtime: &Arc<Mutex<GatewayRuntime>>) -> HttpResponse {
    let read_plan = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .federation_read_plan();
    let notices = read_plan
        .federated_governance_snapshot()
        .world_square_notices;
    Response::from_string(serde_json::to_string(&notices).unwrap_or_else(|_| "[]".into()))
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

pub(crate) fn handle_get_world_safety(runtime: &Arc<Mutex<GatewayRuntime>>) -> HttpResponse {
    let read_plan = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .federation_read_plan();
    let snapshot = read_plan.world_safety_snapshot();
    Response::from_string(serde_json::to_string(&snapshot).unwrap_or_else(|_| "{}".into()))
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

pub(crate) fn handle_get_world_safety_reports(
    runtime: &Arc<Mutex<GatewayRuntime>>,
) -> HttpResponse {
    let read_plan = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .federation_read_plan();
    let reports = read_plan.world_safety_snapshot().reports;
    Response::from_string(serde_json::to_string(&reports).unwrap_or_else(|_| "[]".into()))
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

pub(crate) fn handle_get_world_safety_residents(
    runtime: &Arc<Mutex<GatewayRuntime>>,
) -> HttpResponse {
    let read_plan = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .federation_read_plan();
    let snapshot = read_plan.world_safety_snapshot();
    Response::from_string(
        serde_json::to_string(&serde_json::json!({
            "resident_sanctions": snapshot.resident_sanctions,
            "registration_blacklist": snapshot.registration_blacklist,
        }))
        .unwrap_or_else(|_| "{}".into()),
    )
    .with_status_code(StatusCode(200))
    .with_header(json_header())
}

pub(crate) fn handle_get_world_directory(runtime: &Arc<Mutex<GatewayRuntime>>) -> HttpResponse {
    let read_plan = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .federation_read_plan();
    let snapshot = read_plan.world_directory_snapshot();
    Response::from_string(serde_json::to_string(&snapshot).unwrap_or_else(|_| "{}".into()))
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

pub(crate) fn handle_get_world_entry(runtime: &Arc<Mutex<GatewayRuntime>>) -> HttpResponse {
    let entry = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .world_entry_state();
    Response::from_string(serde_json::to_string(&entry).unwrap_or_else(|_| "{}".into()))
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

pub(crate) fn handle_get_world_snapshot(runtime: &Arc<Mutex<GatewayRuntime>>) -> HttpResponse {
    let read_plan = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .federation_read_plan();
    let snapshot = read_plan.world_snapshot_bundle();
    Response::from_string(serde_json::to_string(&snapshot).unwrap_or_else(|_| "{}".into()))
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

pub(crate) fn handle_get_world_mirrors(runtime: &Arc<Mutex<GatewayRuntime>>) -> HttpResponse {
    let read_plan = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .federation_read_plan();
    let mirrors = read_plan.world_directory_mirrors();
    Response::from_string(serde_json::to_string(&mirrors).unwrap_or_else(|_| "[]".into()))
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

pub(crate) fn handle_get_world_mirror_sources(
    runtime: &Arc<Mutex<GatewayRuntime>>,
) -> HttpResponse {
    let read_plan = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .federation_read_plan();
    let mirror_sources = read_plan.world_mirror_source_statuses();
    Response::from_string(serde_json::to_string(&mirror_sources).unwrap_or_else(|_| "[]".into()))
        .with_status_code(StatusCode(200))
        .with_header(json_header())
}

pub(crate) fn handle_get_export(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    query_params: &HashMap<String, String>,
) -> HttpResponse {
    let resident_id = query_params.get("resident_id").cloned();
    if resident_id.as_deref().unwrap_or_default().trim().is_empty() {
        return Response::from_string(
            serde_json::to_string(&WakuGatewayResponse::Error {
                message: "resident_id query parameter required".into(),
            })
            .unwrap_or_else(|_| "{\"error\":true}".into()),
        )
        .with_status_code(StatusCode(400))
        .with_header(json_header());
    }

    let conversation_id = query_params.get("conversation_id").map(String::as_str);
    let format = parse_export_format(query_params.get("format").map(String::as_str));
    let include_public = parse_bool(query_params.get("include_public").map(String::as_str));
    let result = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .export_history(
            IdentityId(resident_id.expect("resident_id validated above")),
            conversation_id,
            format,
            include_public,
        );
    match result {
        Ok(exported) => {
            Response::from_string(serde_json::to_string(&exported).unwrap_or_else(|_| "{}".into()))
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

pub(crate) fn handle_get_cli_inbox(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    query_params: &HashMap<String, String>,
) -> HttpResponse {
    if let Some(raw_for) = query_params.get("for") {
        match parse_cli_address(raw_for) {
            Ok(viewer) => {
                let result = runtime
                    .lock()
                    .expect("gateway runtime mutex poisoned")
                    .cli_inbox_for(&viewer);
                match result {
                    Ok(response) => Response::from_string(
                        serde_json::to_string(&response)
                            .unwrap_or_else(|_| "{\"identity\":\"\"}".into()),
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
            Err(message) => Response::from_string(
                serde_json::to_string(&WakuGatewayResponse::Error { message })
                    .unwrap_or_else(|_| "{\"error\":true}".into()),
            )
            .with_status_code(StatusCode(400))
            .with_header(json_header()),
        }
    } else {
        Response::from_string(cli_missing_for_body())
            .with_status_code(StatusCode(400))
            .with_header(json_header())
    }
}

pub(crate) fn handle_get_cli_rooms(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    query_params: &HashMap<String, String>,
) -> HttpResponse {
    if let Some(raw_for) = query_params.get("for") {
        match parse_cli_address(raw_for) {
            Ok(viewer) => {
                let result = runtime
                    .lock()
                    .expect("gateway runtime mutex poisoned")
                    .cli_rooms_for(&viewer);
                match result {
                    Ok(response) => Response::from_string(
                        serde_json::to_string(&response)
                            .unwrap_or_else(|_| "{\"identity\":\"\"}".into()),
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
            Err(message) => Response::from_string(
                serde_json::to_string(&WakuGatewayResponse::Error { message })
                    .unwrap_or_else(|_| "{\"error\":true}".into()),
            )
            .with_status_code(StatusCode(400))
            .with_header(json_header()),
        }
    } else {
        Response::from_string(cli_missing_for_body())
            .with_status_code(StatusCode(400))
            .with_header(json_header())
    }
}

pub(crate) fn handle_get_cli_tail(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    query_params: &HashMap<String, String>,
) -> HttpResponse {
    if let Some(raw_for) = query_params.get("for") {
        match parse_cli_address(raw_for) {
            Ok(viewer) => {
                let conversation_id = query_params
                    .get("conversation_id")
                    .map(|value| ConversationId(value.clone()));
                let result = runtime
                    .lock()
                    .expect("gateway runtime mutex poisoned")
                    .cli_tail_for(&viewer, conversation_id.as_ref());
                match result {
                    Ok(response) => Response::from_string(
                        serde_json::to_string(&response)
                            .unwrap_or_else(|_| "{\"identity\":\"\"}".into()),
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
            Err(message) => Response::from_string(
                serde_json::to_string(&WakuGatewayResponse::Error { message })
                    .unwrap_or_else(|_| "{\"error\":true}".into()),
            )
            .with_status_code(StatusCode(400))
            .with_header(json_header()),
        }
    } else {
        Response::from_string(cli_missing_for_body())
            .with_status_code(StatusCode(400))
            .with_header(json_header())
    }
}
