use std::{
    io::Cursor,
    sync::{Arc, Mutex},
};

use tiny_http::{Method, Request, Response, StatusCode};

use crate::{
    GatewayRuntime, GatewayStateNotifier,
    http_auth_routes::{
        handle_post_auth_preflight, handle_post_request_email_otp, handle_post_verify_email_otp,
    },
    http_city_write_routes::{
        handle_post_approve_city_join, handle_post_create_city, handle_post_create_public_room,
        handle_post_freeze_public_room, handle_post_join_city,
        handle_post_update_federation_policy, handle_post_update_steward,
    },
    http_governance_write_routes::{
        handle_post_publish_safety_advisory, handle_post_publish_world_notice,
        handle_post_review_safety_report, handle_post_sanction_resident,
        handle_post_submit_safety_report, handle_post_update_city_trust,
    },
    http_read_routes::{
        handle_get_cities, handle_get_cli_inbox, handle_get_cli_rooms, handle_get_cli_tail,
        handle_get_export, handle_get_provider, handle_get_residents, handle_get_shell_bootstrap,
        handle_get_shell_events, handle_get_shell_state, handle_get_world,
        handle_get_world_directory, handle_get_world_entry, handle_get_world_mirror_sources,
        handle_get_world_mirrors, handle_get_world_safety, handle_get_world_safety_reports,
        handle_get_world_safety_residents, handle_get_world_snapshot, handle_get_world_square,
    },
    http_support::{split_path_and_query, text_header},
    http_write_routes::{
        handle_post_cli_send, handle_post_direct_open, handle_post_provider_connect,
        handle_post_provider_disconnect, handle_post_shell_message, handle_post_shell_message_edit,
        handle_post_shell_message_recall, handle_post_waku, handle_post_world_mirror_sources,
    },
};

pub(crate) type HttpResponse = Response<Cursor<Vec<u8>>>;

pub(crate) fn dispatch_http_request(
    runtime: &Arc<Mutex<GatewayRuntime>>,
    notifier: &Arc<GatewayStateNotifier>,
    listen_addr: &str,
    request: &mut Request,
) -> HttpResponse {
    let method = request.method().clone();
    let url = request.url().to_string();
    let (path, query_params) = split_path_and_query(&url);

    match (method, path) {
        (Method::Options, _) => Response::from_string("")
            .with_status_code(StatusCode(204))
            .with_header(text_header()),
        (Method::Get, "/health") | (Method::Head, "/health") => Response::from_string("ok")
            .with_status_code(StatusCode(200))
            .with_header(text_header()),
        (Method::Get, "/v1/provider") => handle_get_provider(runtime),
        (Method::Post, "/v1/provider/connect") => handle_post_provider_connect(runtime, request),
        (Method::Post, "/v1/provider/disconnect") => handle_post_provider_disconnect(runtime),
        (Method::Get, "/v1/shell/bootstrap") => handle_get_shell_bootstrap(listen_addr),
        (Method::Get, "/v1/shell/events") => {
            handle_get_shell_events(runtime, notifier, &query_params)
        }
        (Method::Get, "/v1/shell/state") => handle_get_shell_state(runtime, &query_params),
        (Method::Get, "/v1/world") => handle_get_world(runtime),
        (Method::Get, "/v1/cities") => handle_get_cities(runtime),
        (Method::Get, "/v1/residents") => handle_get_residents(runtime),
        (Method::Post, "/v1/auth/preflight") => handle_post_auth_preflight(runtime, request),
        (Method::Post, "/v1/auth/email-otp/request") => {
            handle_post_request_email_otp(runtime, request)
        }
        (Method::Post, "/v1/auth/email-otp/verify") => {
            handle_post_verify_email_otp(runtime, notifier, request)
        }
        (Method::Get, "/v1/export") => handle_get_export(runtime, &query_params),
        (Method::Get, "/v1/world-square") => handle_get_world_square(runtime),
        (Method::Get, "/v1/world-safety") => handle_get_world_safety(runtime),
        (Method::Get, "/v1/world-safety/reports") => handle_get_world_safety_reports(runtime),
        (Method::Get, "/v1/world-safety/residents") => handle_get_world_safety_residents(runtime),
        (Method::Get, "/v1/world-directory") => handle_get_world_directory(runtime),
        (Method::Get, "/v1/world-entry") => handle_get_world_entry(runtime),
        (Method::Get, "/v1/world-snapshot") => handle_get_world_snapshot(runtime),
        (Method::Get, "/v1/world-mirrors") => handle_get_world_mirrors(runtime),
        (Method::Get, "/v1/world-mirror-sources") => handle_get_world_mirror_sources(runtime),
        (Method::Post, "/v1/world-mirror-sources") => {
            handle_post_world_mirror_sources(runtime, request)
        }
        (Method::Post, "/v1/shell/message") => {
            handle_post_shell_message(runtime, notifier, request)
        }
        (Method::Post, "/v1/shell/message/recall") => {
            handle_post_shell_message_recall(runtime, notifier, request)
        }
        (Method::Post, "/v1/shell/message/edit") => {
            handle_post_shell_message_edit(runtime, notifier, request)
        }
        (Method::Post, "/v1/cli/send") => handle_post_cli_send(runtime, notifier, request),
        (Method::Get, "/v1/cli/inbox") => handle_get_cli_inbox(runtime, &query_params),
        (Method::Get, "/v1/cli/rooms") => handle_get_cli_rooms(runtime, &query_params),
        (Method::Get, "/v1/cli/tail") => handle_get_cli_tail(runtime, &query_params),
        (Method::Post, "/v1/direct/open") => handle_post_direct_open(runtime, notifier, request),
        (Method::Post, "/v1/cities") => handle_post_create_city(runtime, notifier, request),
        (Method::Post, "/v1/cities/join") => handle_post_join_city(runtime, notifier, request),
        (Method::Post, "/v1/cities/approve") => {
            handle_post_approve_city_join(runtime, notifier, request)
        }
        (Method::Post, "/v1/cities/stewards") => {
            handle_post_update_steward(runtime, notifier, request)
        }
        (Method::Post, "/v1/cities/federation-policy") => {
            handle_post_update_federation_policy(runtime, notifier, request)
        }
        (Method::Post, "/v1/cities/rooms") => {
            handle_post_create_public_room(runtime, notifier, request)
        }
        (Method::Post, "/v1/cities/rooms/freeze") => {
            handle_post_freeze_public_room(runtime, notifier, request)
        }
        (Method::Post, "/v1/world-square/notices") => {
            handle_post_publish_world_notice(runtime, notifier, request)
        }
        (Method::Post, "/v1/world-safety/cities/trust") => {
            handle_post_update_city_trust(runtime, notifier, request)
        }
        (Method::Post, "/v1/world-safety/reports") => {
            handle_post_submit_safety_report(runtime, notifier, request)
        }
        (Method::Post, "/v1/world-safety/reports/review") => {
            handle_post_review_safety_report(runtime, notifier, request)
        }
        (Method::Post, "/v1/world-safety/advisories") => {
            handle_post_publish_safety_advisory(runtime, notifier, request)
        }
        (Method::Post, "/v1/world-safety/residents/sanction") => {
            handle_post_sanction_resident(runtime, notifier, request)
        }
        (Method::Post, "/v1/waku") => handle_post_waku(runtime, request),
        _ => Response::from_string("not found")
            .with_status_code(StatusCode(404))
            .with_header(text_header()),
    }
}
