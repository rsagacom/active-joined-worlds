use std::{
    collections::HashMap,
    path::PathBuf,
    sync::{Arc, Condvar, Mutex},
    time::Instant,
};

use chat_core::{
    AgentSceneSlot, AgentScope, AgentUseCase, ArchivePolicy, CityFeatureFlags, CityId,
    CityMembership, CityPermission, CityProfile, CityRetentionPolicy, CityRole, ClientProfile,
    Conversation, ConversationId, ConversationKind, ConversationScope, DeviceId, FederationPolicy,
    IdentityId, MembershipState, MessageBody, MessageEnvelope, MessageId, PayloadType,
    PixelAvatarProfile, RelayBudgetHint, ResidentExportRights, ResidentPortability, SceneLandmark,
    SceneMetadata, SceneRenderStyle, SceneScope, WorldId, WorldProfile,
    canonical_direct_conversation_id,
};
use chat_storage::{ArchiveStore, FileTimelineStore, TimelineStore, atomic_write_file};
use crypto_mls::{MlsGroupState, MlsMember, SecureSessionManager, SkeletonSecureSessionManager};
use serde::{Deserialize, Serialize};
use tiny_http::Server;
use transport_waku::{
    EncodedFrame, HttpWakuGatewayClient, InMemoryWakuLightNode, TopicSubscription,
    WakuConnectionState, WakuEndpointConfig, WakuGatewayRequest, WakuGatewayResponse,
    WakuLightConfig, WakuPeerMode, WakuSyncCursor,
};

mod auth_runtime;
mod city_runtime;
mod cli_runtime;
mod conversation_runtime;
mod core_runtime;
mod export_runtime;
mod federation_read;
mod gateway_models;
mod governance_mutation_runtime;
mod governance_runtime;
mod http_auth_routes;
mod http_city_write_routes;
mod http_governance_write_routes;
mod http_read_routes;
mod http_router;
mod http_support;
mod http_write_routes;
mod message_runtime;
mod provider_runtime;
mod request_runtime;
mod shell_runtime;
mod transport_runtime;

use federation_read::GatewayFederationReadPlan;
use gateway_models::*;
use http_router::dispatch_http_request;
use http_support::{
    cors_headers_header, cors_methods_header, cors_origin_header, parse_cli_address, parse_cli_args,
};

#[derive(Debug, Default)]
pub(crate) struct GatewayStateNotifier {
    generation: Mutex<u64>,
    changed: Condvar,
}

impl GatewayStateNotifier {
    pub(crate) fn new() -> Self {
        Self::default()
    }

    pub(crate) fn generation(&self) -> u64 {
        *self
            .generation
            .lock()
            .expect("gateway notifier mutex poisoned")
    }

    pub(crate) fn notify_changed(&self) {
        let mut generation = self
            .generation
            .lock()
            .expect("gateway notifier mutex poisoned");
        *generation = generation.saturating_add(1);
        self.changed.notify_all();
    }

    pub(crate) fn wait_until_changed_since(&self, observed_generation: u64, deadline: Instant) {
        let mut generation = self
            .generation
            .lock()
            .expect("gateway notifier mutex poisoned");
        while *generation == observed_generation {
            let now = Instant::now();
            if now >= deadline {
                break;
            }
            let wait_for = deadline.saturating_duration_since(now);
            let (next_generation, wait_result) = self
                .changed
                .wait_timeout(generation, wait_for)
                .expect("gateway notifier condvar poisoned");
            generation = next_generation;
            if wait_result.timed_out() {
                break;
            }
        }
    }
}

fn main() -> Result<(), String> {
    let (listen_addr, state_dir, upstream_gateway_url) = parse_cli_args();
    let server = Server::http(&listen_addr)
        .map_err(|error| format!("start localhost gateway failed: {error}"))?;
    let runtime = Arc::new(Mutex::new(GatewayRuntime::open(
        &state_dir,
        64,
        upstream_gateway_url,
    )?));
    let notifier = Arc::new(GatewayStateNotifier::new());

    println!("lobster-waku-gateway listening on http://{listen_addr}");
    println!("state dir: {}", state_dir.display());
    println!("health: GET /health");
    println!("json gateway: POST /v1/waku");
    println!("shell api: GET /v1/shell/state, GET /v1/shell/events, POST /v1/shell/message");
    println!(
        "provider api: GET /v1/provider, POST /v1/provider/connect, POST /v1/provider/disconnect"
    );
    println!(
        "governance api: GET /v1/world, GET /v1/cities, GET /v1/residents, GET /v1/export, POST /v1/direct/open, POST /v1/cities, POST /v1/cities/join, POST /v1/cities/approve, POST /v1/cities/stewards, POST /v1/cities/federation-policy, POST /v1/cities/rooms, POST /v1/cities/rooms/freeze"
    );
    println!(
        "world api: GET /v1/world-square, GET /v1/world-safety, GET /v1/world-safety/reports, GET /v1/world-safety/residents, GET /v1/world-entry, GET /v1/world-snapshot, POST /v1/world-square/notices, POST /v1/world-safety/reports, POST /v1/world-safety/reports/review, POST /v1/world-safety/cities/trust, POST /v1/world-safety/advisories, POST /v1/world-safety/residents/sanction"
    );
    println!(
        "auth api: POST /v1/auth/preflight, POST /v1/auth/email-otp/request, POST /v1/auth/email-otp/verify"
    );
    println!(
        "directory api: GET /v1/world-directory, GET /v1/world-mirrors, GET /v1/world-mirror-sources, POST /v1/world-mirror-sources"
    );
    if let Some(upstream) = runtime
        .lock()
        .expect("gateway runtime mutex poisoned")
        .upstream_status()
    {
        println!("upstream provider: {upstream}");
    }

    for mut request in server.incoming_requests() {
        let runtime = Arc::clone(&runtime);
        let notifier = Arc::clone(&notifier);
        let listen_addr = listen_addr.clone();
        std::thread::spawn(move || {
            let mut response =
                dispatch_http_request(&runtime, &notifier, &listen_addr, &mut request);

            response = response
                .with_header(cors_origin_header())
                .with_header(cors_methods_header())
                .with_header(cors_headers_header());

            let _ = request.respond(response);
        });
    }

    Ok(())
}

#[cfg(test)]
mod gateway_test_support;
#[cfg(test)]
mod gateway_tests;
