use super::*;
use std::{
    io::Read,
    net::TcpStream,
    sync::{Arc, Mutex, atomic::Ordering},
    thread,
    time::{Duration, Instant},
};

use crate::gateway_test_support::{
    http_json, http_raw, register_resident, sample_frame, sample_frame_with,
    start_local_gateway_http_server, start_mock_upstream_gateway,
};
use crate::http_read_routes::{handle_get_world_entry, handle_get_world_square};
use tempfile::tempdir;
use tiny_http::StatusCode;

#[test]
fn runtime_publishes_and_polls_frames() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let frame = sample_frame("dm:test:poll");
    let topic = frame.content_topic.clone();

    let connected = runtime.handle(WakuGatewayRequest::Connect {
        endpoint: WakuEndpointConfig {
            peer_mode: WakuPeerMode::DesktopLight,
            relay_urls: vec!["http://127.0.0.1:8787".into()],
            use_filter: true,
            use_store: true,
            use_light_push: true,
        },
    });
    assert!(matches!(connected, WakuGatewayResponse::Connected));

    let subscribed = runtime.handle(WakuGatewayRequest::Subscribe {
        subscriptions: vec![TopicSubscription {
            content_topic: topic.clone(),
            recover_history: true,
        }],
    });
    assert!(matches!(subscribed, WakuGatewayResponse::Subscribed));

    let published = runtime.handle(WakuGatewayRequest::Publish { frame });
    assert!(matches!(published, WakuGatewayResponse::Published));

    let polled = runtime.handle(WakuGatewayRequest::Poll {
        subscriptions: vec![],
        limit: 16,
    });
    match polled {
        WakuGatewayResponse::Frames { frames } => assert_eq!(frames.len(), 1),
        other => panic!("expected frames response, got {other:?}"),
    }
}

#[test]
fn waku_http_route_roundtrips_connect_subscribe_publish_and_poll_contract() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);
    let frame = sample_frame("dm:http:waku");
    let topic = frame.content_topic.clone();

    let (connect_status, connected) = http_json(
        "POST",
        &server.base_url,
        "/v1/waku",
        Some(
            &serde_json::to_value(WakuGatewayRequest::Connect {
                endpoint: WakuEndpointConfig {
                    peer_mode: WakuPeerMode::DesktopLight,
                    relay_urls: vec!["http://127.0.0.1:8787".into()],
                    use_filter: true,
                    use_store: true,
                    use_light_push: true,
                },
            })
            .expect("encode connect request"),
        ),
    );
    assert_eq!(connect_status, 200);
    assert_eq!(connected, serde_json::json!("Connected"));

    let (subscribe_status, subscribed) = http_json(
        "POST",
        &server.base_url,
        "/v1/waku",
        Some(
            &serde_json::to_value(WakuGatewayRequest::Subscribe {
                subscriptions: vec![TopicSubscription {
                    content_topic: topic.clone(),
                    recover_history: true,
                }],
            })
            .expect("encode subscribe request"),
        ),
    );
    assert_eq!(subscribe_status, 200);
    assert_eq!(subscribed, serde_json::json!("Subscribed"));

    let (publish_status, published) = http_json(
        "POST",
        &server.base_url,
        "/v1/waku",
        Some(
            &serde_json::to_value(WakuGatewayRequest::Publish {
                frame: frame.clone(),
            })
            .expect("encode publish request"),
        ),
    );
    assert_eq!(publish_status, 200);
    assert_eq!(published, serde_json::json!("Published"));

    let (poll_status, poll) = http_json(
        "POST",
        &server.base_url,
        "/v1/waku",
        Some(
            &serde_json::to_value(WakuGatewayRequest::Poll {
                subscriptions: vec![TopicSubscription {
                    content_topic: topic,
                    recover_history: false,
                }],
                limit: 10,
            })
            .expect("encode poll request"),
        ),
    );
    assert_eq!(poll_status, 200);
    assert_eq!(
        poll["Frames"]["frames"][0]["content_topic"],
        frame.content_topic
    );
    assert!(
        poll["Frames"]["frames"][0]["payload"]
            .as_array()
            .expect("encoded frame payload")
            .len()
            > 0
    );
}

#[test]
fn http_boundary_routes_return_health_cors_and_not_found_contract() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (health_status, health_headers, health_body) =
        http_raw("GET", &server.base_url, "/health", None);
    assert_eq!(health_status, 200);
    assert!(health_headers.contains("Content-Type: text/plain; charset=utf-8"));
    assert!(health_headers.contains("Access-Control-Allow-Origin: *"));
    assert_eq!(health_body, "ok");

    let (head_status, head_headers, _head_body) =
        http_raw("HEAD", &server.base_url, "/health", None);
    assert_eq!(head_status, 200);
    assert!(head_headers.contains("Access-Control-Allow-Origin: *"));

    let (options_status, options_headers, options_body) =
        http_raw("OPTIONS", &server.base_url, "/v1/shell/message", None);
    assert_eq!(options_status, 204);
    assert!(options_headers.contains("Access-Control-Allow-Origin: *"));
    assert!(options_headers.contains("Access-Control-Allow-Methods: GET, POST, OPTIONS"));
    assert!(options_headers.contains("Access-Control-Allow-Headers: Content-Type"));
    assert!(options_body.is_empty());

    let (missing_status, missing_headers, missing_body) =
        http_raw("GET", &server.base_url, "/v1/does-not-exist", None);
    assert_eq!(missing_status, 404);
    assert!(missing_headers.contains("Content-Type: text/plain; charset=utf-8"));
    assert!(missing_headers.contains("Access-Control-Allow-Origin: *"));
    assert_eq!(missing_body, "not found");
}

#[test]
fn shell_events_route_returns_sse_shell_state_snapshot() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (status, headers, body) = http_raw(
        "GET",
        &server.base_url,
        "/v1/shell/events?resident_id=qa-a",
        None,
    );

    assert_eq!(status, 200);
    assert!(headers.contains("Content-Type: text/event-stream; charset=utf-8"));
    assert!(headers.contains("Cache-Control: no-cache"));
    assert!(headers.contains("Access-Control-Allow-Origin: *"));
    assert!(body.starts_with("retry: 4000\n"));
    assert!(body.contains("event: shell-state\ndata: "));
    assert!(body.contains("\n\nevent: shell-heartbeat\ndata: "));
    assert!(body.ends_with("\n\n"));

    let data = body
        .split("event: shell-state\ndata: ")
        .nth(1)
        .and_then(|value| value.split("\n\n").next())
        .expect("sse shell-state payload");
    let payload: serde_json::Value = serde_json::from_str(data).expect("shell state json");
    assert!(payload["rooms"].is_array());
    assert!(payload["conversation_shell"]["conversations"].is_array());
    assert!(payload["scene_render"]["scenes"].is_array());

    let heartbeat_data = body
        .split("event: shell-heartbeat\ndata: ")
        .nth(1)
        .and_then(|value| value.split("\n\n").next())
        .expect("sse heartbeat payload");
    let heartbeat: serde_json::Value =
        serde_json::from_str(heartbeat_data).expect("heartbeat json");
    assert_eq!(heartbeat["resident_id"], "qa-a");
    assert!(heartbeat["now_ms"].as_i64().unwrap_or_default() > 0);
}

#[test]
fn shell_state_version_changes_after_message_append() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (initial_status, initial_state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-a",
        None,
    );
    assert_eq!(initial_status, 200);
    let initial_version = initial_state["state_version"]
        .as_str()
        .expect("initial state version");

    let (sent_status, _sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "qa-a",
            "text": "version bump",
            "device_id": "browser",
            "language_tag": "en"
        })),
    );
    assert_eq!(sent_status, 200);

    let (updated_status, updated_state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-a",
        None,
    );
    assert_eq!(updated_status, 200);
    let updated_version = updated_state["state_version"]
        .as_str()
        .expect("updated state version");
    assert_ne!(updated_version, initial_version);
}

#[test]
fn shell_events_can_wait_until_state_version_changes() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (initial_status, initial_state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-a",
        None,
    );
    assert_eq!(initial_status, 200);
    let initial_version = initial_state["state_version"]
        .as_str()
        .expect("initial state version")
        .to_string();

    let events_base_url = server.base_url.clone();
    let events_path =
        format!("/v1/shell/events?resident_id=qa-a&after={initial_version}&wait_ms=1000");
    let events_thread =
        thread::spawn(move || http_raw("GET", &events_base_url, &events_path, None));

    thread::sleep(Duration::from_millis(100));
    let (sent_status, _sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "qa-a",
            "text": "wake waiting events",
            "device_id": "browser",
            "language_tag": "en"
        })),
    );
    assert_eq!(sent_status, 200);

    let (events_status, _headers, body) = events_thread.join().expect("events thread");
    assert_eq!(events_status, 200);
    let data = body
        .split("event: shell-state\ndata: ")
        .nth(1)
        .and_then(|value| value.split("\n\n").next())
        .expect("sse shell-state payload");
    let payload: serde_json::Value = serde_json::from_str(data).expect("shell state json");
    let updated_version = payload["state_version"]
        .as_str()
        .expect("updated state version");
    assert_ne!(updated_version, initial_version);
}

#[test]
fn shell_events_wait_returns_current_snapshot_when_state_is_unchanged() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (initial_status, initial_state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-a",
        None,
    );
    assert_eq!(initial_status, 200);
    let initial_version = initial_state["state_version"]
        .as_str()
        .expect("initial state version");

    let (events_status, headers, body) = http_raw(
        "GET",
        &server.base_url,
        &format!("/v1/shell/events?resident_id=qa-a&after={initial_version}&wait_ms=10"),
        None,
    );
    assert_eq!(events_status, 200);
    assert!(headers.contains("Content-Type: text/event-stream; charset=utf-8"));

    let data = body
        .split("event: shell-state\ndata: ")
        .nth(1)
        .and_then(|value| value.split("\n\n").next())
        .expect("sse shell-state payload");
    let payload: serde_json::Value = serde_json::from_str(data).expect("shell state json");
    assert_eq!(payload["state_version"], initial_version);
    assert!(body.contains("\n\nevent: shell-heartbeat\ndata: "));
}

#[test]
fn resubscribe_with_recover_history_resets_gateway_cursor() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let first = sample_frame_with(
        "room:test:restart-cursor",
        "msg-reset-1",
        "hello reset one",
        1_763_560_000_100,
    );
    let second = sample_frame_with(
        "room:test:restart-cursor",
        "msg-reset-2",
        "hello reset two",
        1_763_560_000_200,
    );
    let topic = first.content_topic.clone();

    let connected = runtime.handle(WakuGatewayRequest::Connect {
        endpoint: WakuEndpointConfig {
            peer_mode: WakuPeerMode::DesktopLight,
            relay_urls: vec!["http://127.0.0.1:8787".into()],
            use_filter: true,
            use_store: true,
            use_light_push: true,
        },
    });
    assert!(matches!(connected, WakuGatewayResponse::Connected));

    let subscribe = || WakuGatewayRequest::Subscribe {
        subscriptions: vec![TopicSubscription {
            content_topic: topic.clone(),
            recover_history: true,
        }],
    };

    assert!(matches!(
        runtime.handle(subscribe()),
        WakuGatewayResponse::Subscribed
    ));
    assert!(matches!(
        runtime.handle(WakuGatewayRequest::Publish { frame: first }),
        WakuGatewayResponse::Published
    ));
    match runtime.handle(WakuGatewayRequest::Poll {
        subscriptions: vec![],
        limit: 16,
    }) {
        WakuGatewayResponse::Frames { frames } => assert_eq!(frames.len(), 1),
        other => panic!("expected frames response, got {other:?}"),
    }

    assert!(matches!(
        runtime.handle(WakuGatewayRequest::Publish { frame: second }),
        WakuGatewayResponse::Published
    ));

    assert!(matches!(
        runtime.handle(subscribe()),
        WakuGatewayResponse::Subscribed
    ));
    assert_eq!(
        runtime.cursors.get(&topic),
        Some(&WakuSyncCursor::default())
    );
    assert_eq!(
        transport_waku::WakuGatewayClient::recover_frames(
            &runtime.node,
            &topic,
            &WakuSyncCursor::default(),
            16,
        )
        .expect("recover frames after reset")
        .len(),
        2
    );

    match runtime.handle(WakuGatewayRequest::Poll {
        subscriptions: vec![],
        limit: 16,
    }) {
        WakuGatewayResponse::Frames { frames } => assert_eq!(frames.len(), 2),
        other => panic!("expected frames response, got {other:?}"),
    }
}

#[test]
fn shell_messages_publish_to_upstream_provider() {
    let temp = tempdir().expect("temp dir");
    let (base_url, state, running, handle) = start_mock_upstream_gateway();

    let outcome = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        let mut runtime =
            GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
        let provider = runtime
            .connect_provider(ConnectProviderRequest {
                provider_url: base_url.clone(),
            })
            .expect("connect provider");
        assert_eq!(provider.mode, "remote-gateway");
        assert!(provider.reachable);

        let connected = runtime.handle(WakuGatewayRequest::Connect {
            endpoint: WakuEndpointConfig {
                peer_mode: WakuPeerMode::DesktopLight,
                relay_urls: vec!["http://127.0.0.1:8787".into()],
                use_filter: true,
                use_store: true,
                use_light_push: true,
            },
        });
        assert!(matches!(connected, WakuGatewayResponse::Connected));

        runtime
            .append_shell_message(ShellMessageRequest {
                room_id: "room:world:lobby".into(),
                sender: "rsaga".into(),
                text: "hello upstream".into(),
                reply_to_message_id: None,
                device_id: Some("browser".into()),
                language_tag: Some("zh-CN".into()),
            })
            .expect("append shell message");

        let upstream_frame = {
            let shared = state.lock().expect("lock mock upstream state");
            assert!(shared.healthcheck_count >= 1);
            assert_eq!(shared.connect_requests.len(), 1);
            shared
                .published_frames
                .last()
                .cloned()
                .expect("shell message published upstream")
        };
        let decoded = transport_waku::WakuFrameCodec::decode(&upstream_frame.payload)
            .expect("decode upstream frame");
        assert_eq!(decoded.body.plain_text, "hello upstream");

        let recovered = runtime.handle(WakuGatewayRequest::Recover {
            content_topic: upstream_frame.content_topic.clone(),
            cursor: WakuSyncCursor::default(),
            limit: 16,
        });
        match recovered {
            WakuGatewayResponse::Frames { frames } => {
                let hello_count = frames
                    .iter()
                    .filter_map(|frame| transport_waku::WakuFrameCodec::decode(&frame.payload).ok())
                    .filter(|message| message.body.plain_text == "hello upstream")
                    .count();
                assert_eq!(hello_count, 1);
            }
            other => panic!("expected frames response, got {other:?}"),
        }
    }));

    running.store(false, Ordering::SeqCst);
    handle.join().expect("stop mock upstream gateway");
    if let Err(payload) = outcome {
        std::panic::resume_unwind(payload);
    }
}

#[test]
fn shell_state_exposes_seeded_rooms() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let state = runtime.shell_state();
    assert!(!state.rooms.is_empty());
    assert!(state.rooms.iter().any(|room| room.id == "room:world:lobby"));
    assert_eq!(
        state.conversation_shell.active_conversation_id,
        state.rooms.first().map(|room| room.id.clone())
    );
    assert_eq!(
        state.conversation_shell.conversations.len(),
        state.rooms.len()
    );
    assert_eq!(state.scene_render.scenes.len(), state.rooms.len());
    assert!(
        state
            .scene_render
            .scenes
            .iter()
            .any(|scene| scene.conversation_id == "room:world:lobby")
    );
}

#[test]
fn shell_state_contract_exposes_detail_workflow_and_caretaker() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let state = runtime.shell_state();
    let json = serde_json::to_value(&state).expect("serialize shell state");

    let lobby = json["conversation_shell"]["conversations"]
        .as_array()
        .expect("conversation shell array")
        .iter()
        .find(|conversation| conversation["conversation_id"] == "room:world:lobby")
        .expect("lobby conversation");

    assert_eq!(lobby["kind"], "public");
    assert_eq!(lobby["scope"], "cross_city_shared");
    assert_eq!(lobby["title"], "世界广场");
    assert_eq!(lobby["participant_label"], "跨城共响回廊");
    assert_eq!(lobby["route_label"], "跨城共响线");
    assert_eq!(lobby["list_summary"], "世界广场 · 1 人 · 2 条消息");
    assert_eq!(lobby["status_line"], "跨城共响线 · 消息数：2");
    assert_eq!(lobby["thread_headline"], "跨城共响回廊 · 群聊");
    assert_eq!(lobby["chat_status_summary"], "群聊当前比较安静");
    assert_eq!(
        lobby["queue_summary"],
        "1 条访客提醒待处理 · 1 条巡视提醒待看"
    );
    assert_eq!(
        lobby["preview_text"],
        "Local gateway online. H5 shell can now poll and post through localhost."
    );
    assert_eq!(lobby["activity_time_label"], "5m ago");
    assert!(
        lobby["last_activity_label"]
            .as_str()
            .expect("last activity label")
            .starts_with("builder · ")
    );
    assert_eq!(lobby["overview_summary"], "跨城共响回廊 · 群聊");
    assert_eq!(
        lobby["context_summary"],
        "公共房间 · 公共频道、公告板与像素座位区"
    );
    assert_eq!(lobby["caretaker"]["name"], "巡逻犬");
    assert_eq!(lobby["detail_card"]["title"], "巡逻犬 / 频道状态");
    assert_eq!(lobby["workflow"]["action"], "委托");
    assert_eq!(lobby["workflow"]["state"], "待回执");
    assert_eq!(lobby["inline_actions"][0]["label"], "跟进委托");
    let search_terms = lobby["search_terms"]
        .as_array()
        .expect("search terms array")
        .iter()
        .filter_map(|value| value.as_str())
        .collect::<Vec<_>>();
    assert!(search_terms.contains(&"跨城共响线"));
    assert!(search_terms.contains(&"当前委托正在等待第一轮回执。"));
    assert!(search_terms.contains(&"先确认需求是否被接住。"));
    assert!(search_terms.contains(&"巡逻犬 / 频道状态"));
    assert_eq!(lobby["messages"][0]["sender"], "system");

    let direct = json["conversation_shell"]["conversations"]
        .as_array()
        .expect("conversation shell array")
        .iter()
        .find(|conversation| conversation["conversation_id"] == "dm:builder:rsaga")
        .expect("direct conversation");
    assert_eq!(direct["kind"], "direct");
    assert_eq!(direct["scope"], "private");
    assert_eq!(direct["self_label"], "rsaga");
    assert_eq!(direct["peer_label"], "builder");
    assert_eq!(direct["title"], "正在与 builder 聊天");
    assert_eq!(direct["subtitle"], "居所直达 · 你与 builder");
    assert_eq!(direct["participant_label"], "你与 builder");
    assert_eq!(direct["thread_headline"], "正在与 builder 聊天");
    assert_eq!(direct["overview_summary"], "正在与 builder 聊天");
    assert_eq!(direct["detail_card"]["meta"][0]["label"], "住户");
    assert_eq!(direct["detail_card"]["meta"][0]["value"], "rsaga");
    assert_eq!(direct["detail_card"]["meta"][1]["label"], "对端");
    assert_eq!(direct["detail_card"]["meta"][1]["value"], "builder");
    assert_eq!(
        direct["detail_card"]["title"],
        "旺财 / 与 builder 的房内状态"
    );
    assert_eq!(
        direct["detail_card"]["summary_copy"],
        "旺财 会帮你记住与 builder 的留言和提醒，适合续聊、记任务和直接追问。"
    );
    let direct_search_terms = direct["search_terms"]
        .as_array()
        .expect("direct search terms array")
        .iter()
        .filter_map(|value| value.as_str())
        .collect::<Vec<_>>();
    assert!(direct_search_terms.contains(&"builder"));
    assert!(direct_search_terms.contains(&"rsaga"));

    let lobby_scene = json["scene_render"]["scenes"]
        .as_array()
        .expect("scene render array")
        .iter()
        .find(|scene| scene["conversation_id"] == "room:world:lobby")
        .expect("lobby scene");

    assert_eq!(lobby_scene["scene_banner"], "世界广场");
    assert_eq!(lobby_scene["stage"]["title"], "世界广场");
    assert_eq!(lobby_scene["stage"]["badge"], "世界广场");
    assert_eq!(lobby_scene["portrait"]["title"], "巡逻犬");
    assert_eq!(lobby_scene["portrait"]["badge"], "频道巡视");
    assert_eq!(lobby_scene["portrait"]["status"], "在线巡视");
    assert_eq!(lobby_scene["portrait"]["monogram"], "巡");

    let direct_scene = json["scene_render"]["scenes"]
        .as_array()
        .expect("scene render array")
        .iter()
        .find(|scene| scene["conversation_id"] == "dm:builder:rsaga")
        .expect("direct scene");
    assert_eq!(direct_scene["scene_banner"], "个人房间");
    assert_eq!(direct_scene["stage"]["title"], "正在与 builder 聊天");
    assert_eq!(
        direct_scene["stage"]["summary"],
        "旺财 会帮你记住与 builder 的留言和提醒，适合续聊、记任务和直接追问。"
    );
}

#[test]
fn shell_state_contract_exposes_action_templates() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let state = runtime.shell_state();
    let json = serde_json::to_value(&state).expect("serialize shell state");

    let action_templates = json["conversation_shell"]["action_templates"]
        .as_array()
        .expect("conversation shell action_templates array");
    let entrust = action_templates
        .iter()
        .find(|item| item["action"] == "委托")
        .expect("委托 action template");

    assert_eq!(
        entrust["draft_template"],
        "委托：\n- 需求：\n- 截止：\n- 交付："
    );
    assert_eq!(entrust["send_label"], "发出委托");
    let replied = entrust["state_templates"]
        .as_array()
        .expect("委托 state templates")
        .iter()
        .find(|item| item["state"] == "已回执")
        .expect("委托 已回执 template");
    assert_eq!(
        replied["draft_template"],
        "委托：\n- 回执：\n- 待确认：\n- 下一步："
    );
}

#[test]
fn shell_state_anchors_direct_identity_to_registered_resident() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    register_resident(&mut runtime, "guest-03");
    runtime
        .open_direct_session(OpenDirectSessionRequest {
            requester_id: "guest-03".into(),
            requester_device_id: Some("browser".into()),
            peer_id: "rsaga".into(),
            peer_device_id: Some("desktop-1".into()),
        })
        .expect("open direct session");

    let state = runtime.shell_state();
    let json = serde_json::to_value(&state).expect("serialize shell state");
    let direct = json["conversation_shell"]["conversations"]
        .as_array()
        .expect("conversation shell array")
        .iter()
        .find(|conversation| conversation["conversation_id"] == "dm:guest-03:rsaga")
        .expect("guest direct conversation");

    assert_eq!(direct["self_label"], "guest-03");
    assert_eq!(direct["peer_label"], "rsaga");
    assert_eq!(direct["participant_label"], "你与 rsaga");
    assert_eq!(direct["thread_headline"], "正在与 rsaga 聊天");
    assert_eq!(direct["detail_card"]["meta"][0]["label"], "住户");
    assert_eq!(direct["detail_card"]["meta"][0]["value"], "guest-03");
    assert_eq!(direct["detail_card"]["meta"][1]["label"], "对端");
    assert_eq!(direct["detail_card"]["meta"][1]["value"], "rsaga");
    assert_eq!(direct["detail_card"]["title"], "旺财 / 与 rsaga 的房内状态");
    assert_eq!(
        direct["detail_card"]["summary_copy"],
        "旺财 会帮你记住与 rsaga 的留言和提醒，适合续聊、记任务和直接追问。"
    );
}

#[test]
fn shell_state_for_viewer_filters_private_threads_and_labels_counterpart() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    register_resident(&mut runtime, "guest-03");
    runtime
        .open_direct_session(OpenDirectSessionRequest {
            requester_id: "guest-03".into(),
            requester_device_id: Some("browser".into()),
            peer_id: "rsaga".into(),
            peer_device_id: Some("desktop-1".into()),
        })
        .expect("open guest direct session");

    let guest = IdentityId("guest-03".into());
    let guest_state = runtime.shell_state_for_viewer(Some(&guest));
    let guest_ids = guest_state
        .conversation_shell
        .conversations
        .iter()
        .map(|conversation| conversation.conversation_id.as_str())
        .collect::<Vec<_>>();
    assert!(guest_ids.contains(&"dm:guest-03:rsaga"));
    assert!(!guest_ids.contains(&"dm:builder:rsaga"));

    let guest_direct = guest_state
        .conversation_shell
        .conversations
        .iter()
        .find(|conversation| conversation.conversation_id == "dm:guest-03:rsaga")
        .expect("guest direct conversation");
    assert_eq!(guest_direct.self_label.as_deref(), Some("guest-03"));
    assert_eq!(guest_direct.peer_label.as_deref(), Some("rsaga"));
    assert_eq!(
        guest_direct.participant_label.as_deref(),
        Some("你与 rsaga")
    );
    assert_eq!(guest_direct.title, "正在与 rsaga 聊天");

    let rsaga = IdentityId("rsaga".into());
    let rsaga_state = runtime.shell_state_for_viewer(Some(&rsaga));
    let rsaga_ids = rsaga_state
        .conversation_shell
        .conversations
        .iter()
        .map(|conversation| conversation.conversation_id.as_str())
        .collect::<Vec<_>>();
    assert!(rsaga_ids.contains(&"dm:guest-03:rsaga"));
    assert!(rsaga_ids.contains(&"dm:builder:rsaga"));

    let rsaga_direct = rsaga_state
        .conversation_shell
        .conversations
        .iter()
        .find(|conversation| conversation.conversation_id == "dm:guest-03:rsaga")
        .expect("rsaga direct conversation");
    assert_eq!(rsaga_direct.self_label.as_deref(), Some("rsaga"));
    assert_eq!(rsaga_direct.peer_label.as_deref(), Some("guest-03"));
    assert_eq!(
        rsaga_direct.participant_label.as_deref(),
        Some("你与 guest-03")
    );
    assert_eq!(rsaga_direct.title, "正在与 guest-03 聊天");
}

#[test]
fn shell_state_formats_unanchored_direct_threads_without_raw_dm_fallback() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    runtime
        .ensure_direct_conversation(
            &ConversationId("dm:alice:bob".into()),
            &[IdentityId("alice".into()), IdentityId("bob".into())],
        )
        .expect("ensure direct conversation");

    let state = runtime.shell_state();
    let json = serde_json::to_value(&state).expect("serialize shell state");
    let direct = json["conversation_shell"]["conversations"]
        .as_array()
        .expect("conversation shell array")
        .iter()
        .find(|conversation| conversation["conversation_id"] == "dm:alice:bob")
        .expect("unanchored direct conversation");

    assert_eq!(direct["title"], "alice 与 bob 的私聊");
    assert_eq!(direct["subtitle"], "居所直达 · alice 与 bob");
    assert_eq!(direct["participant_label"], "alice 与 bob");
    assert_eq!(direct["thread_headline"], "alice 与 bob 的私聊");
    assert_eq!(direct["overview_summary"], "alice 与 bob 的私聊");
    assert_eq!(direct["detail_card"]["title"], "旺财 / alice 与 bob 的私聊");
    assert_eq!(
        direct["detail_card"]["summary_copy"],
        "旺财 会帮你记住 alice 与 bob 的留言和提醒，适合续聊、记任务和直接追问。"
    );
    assert_eq!(direct["detail_card"]["meta"][0]["label"], "会话");
    assert_eq!(direct["detail_card"]["meta"][0]["value"], "alice 与 bob");

    let direct_scene = json["scene_render"]["scenes"]
        .as_array()
        .expect("scene render array")
        .iter()
        .find(|scene| scene["conversation_id"] == "dm:alice:bob")
        .expect("unanchored direct scene");
    assert_eq!(direct_scene["stage"]["title"], "alice 与 bob 的私聊");
}

#[test]
fn shell_state_formats_empty_direct_threads_without_direct_prefix() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    runtime
        .timeline_store
        .upsert_conversation(Conversation {
            conversation_id: ConversationId("dm:".into()),
            kind: ConversationKind::Direct,
            scope: ConversationScope::Private,
            scene: Some(GatewayRuntime::default_direct_scene(&[])),
            content_topic: transport_waku::WakuFrameCodec::content_topic_for(&ConversationId(
                "dm:".into(),
            )),
            participants: Vec::new(),
            created_at_ms: GatewayRuntime::now_ms(),
            last_active_at_ms: GatewayRuntime::now_ms(),
        })
        .expect("insert empty direct conversation");

    let state = runtime.shell_state();
    let json = serde_json::to_value(&state).expect("serialize shell state");
    let direct = json["conversation_shell"]["conversations"]
        .as_array()
        .expect("conversation shell array")
        .iter()
        .find(|conversation| conversation["conversation_id"] == "dm:")
        .expect("empty direct conversation");

    assert_eq!(direct["title"], "私聊会话");
    assert_eq!(direct["subtitle"], "居所直达 · 私聊会话");
    assert_eq!(direct["participant_label"], "私聊会话");
    assert_eq!(direct["thread_headline"], "私聊会话");
}

#[test]
fn shell_state_formats_half_anchored_direct_threads_without_current_resident_placeholder() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    runtime
        .timeline_store
        .upsert_conversation(Conversation {
            conversation_id: ConversationId("dm:rsaga".into()),
            kind: ConversationKind::Direct,
            scope: ConversationScope::Private,
            scene: Some(GatewayRuntime::default_direct_scene(&[IdentityId(
                "rsaga".into(),
            )])),
            content_topic: transport_waku::WakuFrameCodec::content_topic_for(&ConversationId(
                "dm:rsaga".into(),
            )),
            participants: vec![IdentityId("rsaga".into())],
            created_at_ms: GatewayRuntime::now_ms(),
            last_active_at_ms: GatewayRuntime::now_ms(),
        })
        .expect("insert half anchored direct conversation");

    let state = runtime.shell_state();
    let json = serde_json::to_value(&state).expect("serialize shell state");
    let direct = json["conversation_shell"]["conversations"]
        .as_array()
        .expect("conversation shell array")
        .iter()
        .find(|conversation| conversation["conversation_id"] == "dm:rsaga")
        .expect("half anchored direct conversation");

    assert_eq!(direct["title"], "rsaga 的私聊");
    assert_eq!(direct["detail_card"]["meta"][0]["label"], "会话");
    assert_eq!(direct["detail_card"]["meta"][0]["value"], "rsaga");
}

#[test]
fn shell_state_formats_unknown_room_threads_without_raw_room_prefix() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    runtime
        .timeline_store
        .upsert_conversation(Conversation {
            conversation_id: ConversationId("room:city:delta-hub:plaza".into()),
            kind: ConversationKind::Room,
            scope: ConversationScope::CityPublic,
            scene: Some(GatewayRuntime::default_public_room_scene(
                "shared",
                "channel",
                "room:city:delta-hub:plaza",
            )),
            content_topic: transport_waku::WakuFrameCodec::content_topic_for(&ConversationId(
                "room:city:delta-hub:plaza".into(),
            )),
            participants: vec![IdentityId("rsaga".into())],
            created_at_ms: GatewayRuntime::now_ms(),
            last_active_at_ms: GatewayRuntime::now_ms(),
        })
        .expect("insert unknown room conversation");

    let state = runtime.shell_state();
    let json = serde_json::to_value(&state).expect("serialize shell state");
    let room = json["conversation_shell"]["conversations"]
        .as_array()
        .expect("conversation shell array")
        .iter()
        .find(|conversation| conversation["conversation_id"] == "room:city:delta-hub:plaza")
        .expect("unknown room conversation");

    assert_eq!(room["title"], "城邦门牌 · city:delta-hub:plaza");
}

#[test]
fn runtime_persists_shell_messages_across_restart() {
    let temp = tempdir().expect("temp dir");
    let root = temp.path().join("gateway");

    {
        let mut runtime = GatewayRuntime::open(&root, 64, None).expect("runtime");
        runtime
            .append_shell_message(ShellMessageRequest {
                room_id: "room:world:lobby".into(),
                sender: "rsaga".into(),
                text: "persist me".into(),
                reply_to_message_id: None,
                device_id: Some("browser".into()),
                language_tag: Some("en".into()),
            })
            .expect("append shell message");
    }

    let runtime = GatewayRuntime::open(&root, 64, None).expect("runtime");
    let state = runtime.shell_state();
    let lobby = state
        .rooms
        .into_iter()
        .find(|room| room.id == "room:world:lobby")
        .expect("lobby room");
    assert!(
        lobby
            .messages
            .iter()
            .any(|message| message.text == "persist me")
    );
}

#[test]
fn create_city_grants_lord_membership() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let city = runtime
        .create_city(CreateCityRequest {
            slug: Some("signal-bay".into()),
            title: "Signal Bay".into(),
            description: "A city for relay experiments".into(),
            lord_id: "alice".into(),
            approval_required: Some(false),
            public_room_discovery_enabled: Some(true),
            federation_policy: None,
        })
        .expect("create city");

    assert_eq!(city.profile.slug, "signal-bay");
    let lord = runtime
        .memberships
        .iter()
        .find(|membership| membership.city_id == city.profile.city_id)
        .expect("lord membership");
    assert_eq!(lord.role, CityRole::Lord);
    assert_eq!(lord.resident_id.0, "alice");
}

#[test]
fn city_lord_can_create_public_room_but_resident_cannot() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    let denied = runtime.create_public_room(CreatePublicRoomRequest {
        city: "core-harbor".into(),
        creator_id: "visitor".into(),
        slug: Some("resident-corner".into()),
        title: "Resident Corner".into(),
        description: "should not work".into(),
    });
    assert!(denied.is_err());

    let created = runtime
        .create_public_room(CreatePublicRoomRequest {
            city: "core-harbor".into(),
            creator_id: "rsaga".into(),
            slug: Some("ops-room".into()),
            title: "Ops Room".into(),
            description: "public operations room".into(),
        })
        .expect("lord creates room");
    assert_eq!(created.room_id.0, "room:city:core-harbor:ops-room");
}

#[test]
fn city_http_routes_roundtrip_membership_room_policy_and_freeze_contract() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    register_resident(&mut runtime, "guest-04");
    let server = start_local_gateway_http_server(runtime);

    let (city_status, city) = http_json(
        "POST",
        &server.base_url,
        "/v1/cities",
        Some(&serde_json::json!({
            "slug": "approval-harbor",
            "title": "Approval Harbor",
            "description": "HTTP city contract fixture",
            "lord_id": "rsaga",
            "approval_required": true,
            "public_room_discovery_enabled": true,
            "federation_policy": "Open"
        })),
    );
    assert_eq!(city_status, 200);
    assert_eq!(city["profile"]["slug"], "approval-harbor");
    assert_eq!(city["profile"]["approval_required"], true);

    let (join_status, pending) = http_json(
        "POST",
        &server.base_url,
        "/v1/cities/join",
        Some(&serde_json::json!({
            "city": "approval-harbor",
            "resident_id": "guest-04"
        })),
    );
    assert_eq!(join_status, 200);
    assert_eq!(pending["resident_id"], "guest-04");
    assert_eq!(pending["state"], "PendingApproval");

    let (approve_status, approved) = http_json(
        "POST",
        &server.base_url,
        "/v1/cities/approve",
        Some(&serde_json::json!({
            "city": "approval-harbor",
            "actor_id": "rsaga",
            "resident_id": "guest-04"
        })),
    );
    assert_eq!(approve_status, 200);
    assert_eq!(approved["state"], "Active");
    assert_eq!(approved["added_by"], "rsaga");

    let (steward_status, steward) = http_json(
        "POST",
        &server.base_url,
        "/v1/cities/stewards",
        Some(&serde_json::json!({
            "city": "approval-harbor",
            "actor_id": "rsaga",
            "resident_id": "guest-04",
            "grant": true
        })),
    );
    assert_eq!(steward_status, 200);
    assert_eq!(steward["role"], "Steward");

    let (resident_status, resident) = http_json(
        "POST",
        &server.base_url,
        "/v1/cities/stewards",
        Some(&serde_json::json!({
            "city": "approval-harbor",
            "actor_id": "rsaga",
            "resident_id": "guest-04",
            "grant": false
        })),
    );
    assert_eq!(resident_status, 200);
    assert_eq!(resident["role"], "Resident");

    let (policy_status, policy_city) = http_json(
        "POST",
        &server.base_url,
        "/v1/cities/federation-policy",
        Some(&serde_json::json!({
            "city": "approval-harbor",
            "actor_id": "rsaga",
            "policy": "Selective"
        })),
    );
    assert_eq!(policy_status, 200);
    assert_eq!(policy_city["profile"]["federation_policy"], "Selective");

    let (room_status, room) = http_json(
        "POST",
        &server.base_url,
        "/v1/cities/rooms",
        Some(&serde_json::json!({
            "city": "approval-harbor",
            "creator_id": "rsaga",
            "slug": "qa-room",
            "title": "QA Room",
            "description": "Room created through HTTP contract"
        })),
    );
    assert_eq!(room_status, 200);
    assert_eq!(room["room_id"], "room:city:approval-harbor:qa-room");
    assert_eq!(room["frozen"], false);

    let (freeze_status, frozen) = http_json(
        "POST",
        &server.base_url,
        "/v1/cities/rooms/freeze",
        Some(&serde_json::json!({
            "city": "approval-harbor",
            "actor_id": "rsaga",
            "room": "qa-room",
            "frozen": true
        })),
    );
    assert_eq!(freeze_status, 200);
    assert_eq!(frozen["room_id"], "room:city:approval-harbor:qa-room");
    assert_eq!(frozen["frozen"], true);

    let (message_status, message_error) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:city:approval-harbor:qa-room",
            "sender": "guest-04",
            "text": "frozen room should reject this",
            "device_id": "browser",
            "language_tag": "en"
        })),
    );
    assert_eq!(message_status, 400);
    assert_eq!(message_error["Error"]["message"], "room qa-room is frozen");
}

#[test]
fn governance_state_persists_across_restart() {
    let temp = tempdir().expect("temp dir");
    let root = temp.path().join("gateway");

    {
        let mut runtime = GatewayRuntime::open(&root, 64, None).expect("runtime");
        runtime
            .create_city(CreateCityRequest {
                slug: Some("aurora".into()),
                title: "Aurora".into(),
                description: "northern city".into(),
                lord_id: "rsaga".into(),
                approval_required: Some(true),
                public_room_discovery_enabled: Some(true),
                federation_policy: None,
            })
            .expect("create city");
    }

    let runtime = GatewayRuntime::open(&root, 64, None).expect("runtime");
    assert!(
        runtime
            .cities
            .values()
            .any(|city| city.profile.slug == "aurora")
    );
}

#[test]
fn city_public_room_create_wakes_shell_events_without_waiting_for_timeout() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (initial_status, initial_state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=rsaga",
        None,
    );
    assert_eq!(initial_status, 200);
    let initial_version = initial_state["state_version"]
        .as_str()
        .expect("initial state version")
        .to_string();

    let events_base_url = server.base_url.clone();
    let events_path =
        format!("/v1/shell/events?resident_id=rsaga&after={initial_version}&wait_ms=5000");
    let started_at = Instant::now();
    let events_thread =
        thread::spawn(move || http_raw("GET", &events_base_url, &events_path, None));

    thread::sleep(Duration::from_millis(100));
    let (room_status, room) = http_json(
        "POST",
        &server.base_url,
        "/v1/cities/rooms",
        Some(&serde_json::json!({
            "city": "core-harbor",
            "creator_id": "rsaga",
            "slug": "sse-room",
            "title": "SSE Room",
            "description": "Room creation should wake shell listeners"
        })),
    );
    assert_eq!(room_status, 200);
    assert_eq!(room["room_id"], "room:city:core-harbor:sse-room");

    let (events_status, _headers, body) = events_thread.join().expect("events thread");
    let elapsed = started_at.elapsed();
    assert_eq!(events_status, 200);
    assert!(
        elapsed < Duration::from_millis(1500),
        "public room create should notify shell events promptly, elapsed {elapsed:?}"
    );
    let data = body
        .split("event: shell-state\ndata: ")
        .nth(1)
        .and_then(|value| value.split("\n\n").next())
        .expect("sse shell-state payload");
    let payload: serde_json::Value = serde_json::from_str(data).expect("shell state json");
    assert_ne!(payload["state_version"], initial_version);
    assert!(
        payload["rooms"]
            .as_array()
            .expect("rooms")
            .iter()
            .any(|room| room["id"] == "room:city:core-harbor:sse-room")
    );
}

#[test]
fn city_public_room_freeze_wakes_shell_events_without_waiting_for_timeout() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (initial_status, initial_state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=rsaga",
        None,
    );
    assert_eq!(initial_status, 200);
    let initial_version = initial_state["state_version"]
        .as_str()
        .expect("initial state version")
        .to_string();
    assert!(
        initial_state["rooms"]
            .as_array()
            .expect("initial rooms")
            .iter()
            .any(|room| room["id"] == "room:city:core-harbor:lobby")
    );

    let events_base_url = server.base_url.clone();
    let events_path =
        format!("/v1/shell/events?resident_id=rsaga&after={initial_version}&wait_ms=5000");
    let started_at = Instant::now();
    let events_thread =
        thread::spawn(move || http_raw("GET", &events_base_url, &events_path, None));

    thread::sleep(Duration::from_millis(100));
    let (freeze_status, room) = http_json(
        "POST",
        &server.base_url,
        "/v1/cities/rooms/freeze",
        Some(&serde_json::json!({
            "city": "core-harbor",
            "actor_id": "rsaga",
            "room": "lobby",
            "frozen": true
        })),
    );
    assert_eq!(freeze_status, 200);
    assert_eq!(room["room_id"], "room:city:core-harbor:lobby");
    assert_eq!(room["frozen"], true);

    let (events_status, _headers, body) = events_thread.join().expect("events thread");
    let elapsed = started_at.elapsed();
    assert_eq!(events_status, 200);
    assert!(
        elapsed < Duration::from_millis(1500),
        "public room freeze should notify shell events promptly, elapsed {elapsed:?}"
    );
    let data = body
        .split("event: shell-state\ndata: ")
        .nth(1)
        .and_then(|value| value.split("\n\n").next())
        .expect("sse shell-state payload");
    let payload: serde_json::Value = serde_json::from_str(data).expect("shell state json");
    assert_ne!(payload["state_version"], initial_version);
    let lobby = payload["rooms"]
        .as_array()
        .expect("rooms")
        .iter()
        .find(|room| room["id"] == "room:city:core-harbor:lobby")
        .expect("lobby room");
    assert_eq!(lobby["is_frozen"], true);
    assert_eq!(lobby["chat_status_summary"], "房间已冻结，仅管理员可发言");
}

#[test]
fn city_trust_update_wakes_shell_events_without_waiting_for_timeout() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (initial_status, initial_state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=outside-reader",
        None,
    );
    assert_eq!(initial_status, 200);
    let initial_version = initial_state["state_version"]
        .as_str()
        .expect("initial state version")
        .to_string();
    assert!(
        initial_state["rooms"]
            .as_array()
            .expect("initial rooms")
            .iter()
            .any(|room| room["id"] == "room:city:aurora-hub:announcements")
    );

    let events_base_url = server.base_url.clone();
    let events_path =
        format!("/v1/shell/events?resident_id=outside-reader&after={initial_version}&wait_ms=5000");
    let started_at = Instant::now();
    let events_thread =
        thread::spawn(move || http_raw("GET", &events_base_url, &events_path, None));

    thread::sleep(Duration::from_millis(100));
    let (trust_status, trust) = http_json(
        "POST",
        &server.base_url,
        "/v1/world-safety/cities/trust",
        Some(&serde_json::json!({
            "actor_id": "rsaga",
            "city": "aurora-hub",
            "state": "Isolated",
            "reason": "SSE trust update should refresh city directory"
        })),
    );
    assert_eq!(trust_status, 200);
    assert_eq!(trust["city_id"], "city:aurora-hub");
    assert_eq!(trust["state"], "Isolated");

    let (events_status, _headers, body) = events_thread.join().expect("events thread");
    let elapsed = started_at.elapsed();
    assert_eq!(events_status, 200);
    assert!(
        elapsed < Duration::from_millis(1500),
        "city trust update should notify shell events promptly, elapsed {elapsed:?}"
    );
    let data = body
        .split("event: shell-state\ndata: ")
        .nth(1)
        .and_then(|value| value.split("\n\n").next())
        .expect("sse shell-state payload");
    let payload: serde_json::Value = serde_json::from_str(data).expect("shell state json");
    assert_ne!(payload["state_version"], initial_version);
    assert!(
        !payload["rooms"]
            .as_array()
            .expect("rooms")
            .iter()
            .any(|room| room["id"] == "room:city:aurora-hub:announcements")
    );
}

#[test]
fn lord_can_approve_pending_join() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    runtime
        .create_city(CreateCityRequest {
            slug: Some("approval-bay".into()),
            title: "Approval Bay".into(),
            description: "approval on".into(),
            lord_id: "rsaga".into(),
            approval_required: Some(true),
            public_room_discovery_enabled: Some(true),
            federation_policy: None,
        })
        .expect("create city");

    register_resident(&mut runtime, "guest-01");
    let pending = runtime
        .join_city(JoinCityRequest {
            city: "approval-bay".into(),
            resident_id: "guest-01".into(),
        })
        .expect("join city");
    assert_eq!(pending.state, MembershipState::PendingApproval);

    let approved = runtime
        .approve_city_join(ApproveCityJoinRequest {
            city: "approval-bay".into(),
            actor_id: "rsaga".into(),
            resident_id: "guest-01".into(),
        })
        .expect("approve join");
    assert_eq!(approved.state, MembershipState::Active);
    assert_eq!(approved.added_by.expect("added by").0, "rsaga");
}

#[test]
fn lord_can_grant_steward_role() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    register_resident(&mut runtime, "helper");
    runtime
        .join_city(JoinCityRequest {
            city: "core-harbor".into(),
            resident_id: "helper".into(),
        })
        .expect("join core harbor");

    let steward = runtime
        .update_steward(UpdateStewardRequest {
            city: "core-harbor".into(),
            actor_id: "rsaga".into(),
            resident_id: "helper".into(),
            grant: true,
        })
        .expect("grant steward");
    assert_eq!(steward.role, CityRole::Steward);
}

#[test]
fn frozen_public_room_blocks_resident_posts() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    register_resident(&mut runtime, "guest-02");
    runtime
        .join_city(JoinCityRequest {
            city: "core-harbor".into(),
            resident_id: "guest-02".into(),
        })
        .expect("join core harbor");

    runtime
        .freeze_public_room(FreezePublicRoomRequest {
            city: "core-harbor".into(),
            actor_id: "rsaga".into(),
            room: "lobby".into(),
            frozen: true,
        })
        .expect("freeze lobby");

    let blocked = runtime.append_shell_message(ShellMessageRequest {
        room_id: "room:city:core-harbor:lobby".into(),
        sender: "guest-02".into(),
        text: "let me in".into(),
        reply_to_message_id: None,
        device_id: Some("browser".into()),
        language_tag: Some("en".into()),
    });
    assert!(blocked.is_err());

    let allowed = runtime.append_shell_message(ShellMessageRequest {
        room_id: "room:city:core-harbor:lobby".into(),
        sender: "rsaga".into(),
        text: "maintenance window".into(),
        reply_to_message_id: None,
        device_id: Some("browser".into()),
        language_tag: Some("en".into()),
    });
    assert!(allowed.is_ok());
}

#[test]
fn shell_message_rejects_visitor_sender_before_login() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let room_id = ConversationId("room:world:lobby".into());
    let before = runtime.timeline_store.recent_messages(&room_id, 64).len();

    let error = runtime
        .append_shell_message(ShellMessageRequest {
            room_id: room_id.0.clone(),
            sender: "访客".into(),
            text: "I should not be able to post before login".into(),
            reply_to_message_id: None,
            device_id: Some("browser".into()),
            language_tag: Some("zh-CN".into()),
        })
        .expect_err("visitor shell sender should be rejected before login");

    assert!(error.contains("login"));
    assert_eq!(
        runtime.timeline_store.recent_messages(&room_id, 64).len(),
        before
    );
}

#[test]
fn shell_message_response_and_projection_expose_stable_message_contract() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    let response = runtime
        .append_shell_message(ShellMessageRequest {
            room_id: "room:world:lobby".into(),
            sender: "rsaga".into(),
            text: "  交互回执稳定  ".into(),
            reply_to_message_id: None,
            device_id: Some("browser".into()),
            language_tag: Some("zh-CN".into()),
        })
        .expect("append shell message");

    assert!(response.ok);
    assert_eq!(response.conversation_id, "room:world:lobby");
    assert!(!response.message_id.is_empty());
    assert!(response.delivered_at_ms > 0);

    let state = runtime.shell_state();
    let lobby = state
        .rooms
        .iter()
        .find(|room| room.id == "room:world:lobby")
        .expect("lobby room");
    let message = lobby
        .messages
        .iter()
        .find(|message| message.message_id == response.message_id)
        .expect("projected message");

    assert_eq!(message.message_id, response.message_id);
    assert_eq!(message.text, "交互回执稳定");

    let blank = runtime
        .append_shell_message(ShellMessageRequest {
            room_id: "room:world:lobby".into(),
            sender: "rsaga".into(),
            text: "   ".into(),
            reply_to_message_id: None,
            device_id: Some("browser".into()),
            language_tag: Some("zh-CN".into()),
        })
        .expect_err("blank shell message should be rejected");
    assert!(blank.contains("text"));
}

#[test]
fn auth_http_routes_roundtrip_email_otp_registration() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (preflight_status, preflight) = http_json(
        "POST",
        &server.base_url,
        "/v1/auth/preflight",
        Some(&serde_json::json!({
            "email": "Novel.Reader@Example.COM",
            "mobile": "+86 13800138000",
            "device_physical_address": "66:55:44:33:22:11"
        })),
    );
    assert_eq!(preflight_status, 200);
    assert_eq!(preflight["allowed"], true);
    assert_eq!(preflight["normalized_email"], "novel.reader@example.com");

    let (request_status, challenge) = http_json(
        "POST",
        &server.base_url,
        "/v1/auth/email-otp/request",
        Some(&serde_json::json!({
            "email": "novel.reader@example.com",
            "mobile": "+86 13800138000",
            "device_physical_address": "66:55:44:33:22:11",
            "resident_id": "novel-reader"
        })),
    );
    assert_eq!(request_status, 200);
    assert!(
        challenge["challenge_id"]
            .as_str()
            .unwrap_or_default()
            .starts_with("otp:")
    );
    assert_eq!(challenge["delivery_mode"], "inline-dev");
    let code = challenge["dev_code"]
        .as_str()
        .expect("test gateway should expose dev otp");

    let (verify_status, verified) = http_json(
        "POST",
        &server.base_url,
        "/v1/auth/email-otp/verify",
        Some(&serde_json::json!({
            "challenge_id": challenge["challenge_id"],
            "code": code,
            "resident_id": "novel-reader"
        })),
    );
    assert_eq!(verify_status, 200);
    assert_eq!(verified["resident_id"], "novel-reader");
    assert_eq!(verified["email"], "novel.reader@example.com");

    let (state_status, state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=novel-reader",
        None,
    );
    assert_eq!(state_status, 200);
    assert!(
        state["rooms"]
            .as_array()
            .expect("rooms")
            .iter()
            .any(|room| room["id"] == "dm:guide:novel-reader")
    );
}

#[test]
fn auth_email_otp_verify_wakes_shell_events_without_waiting_for_timeout() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (request_status, challenge) = http_json(
        "POST",
        &server.base_url,
        "/v1/auth/email-otp/request",
        Some(&serde_json::json!({
            "email": "sse-login@example.com",
            "resident_id": "sse-login"
        })),
    );
    assert_eq!(request_status, 200);
    let code = challenge["dev_code"].as_str().expect("dev otp").to_string();
    let challenge_id = challenge["challenge_id"]
        .as_str()
        .expect("challenge id")
        .to_string();

    let (initial_status, initial_state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=sse-login",
        None,
    );
    assert_eq!(initial_status, 200);
    let initial_version = initial_state["state_version"]
        .as_str()
        .expect("initial state version")
        .to_string();

    let events_base_url = server.base_url.clone();
    let events_path =
        format!("/v1/shell/events?resident_id=sse-login&after={initial_version}&wait_ms=5000");
    let started_at = Instant::now();
    let events_thread =
        thread::spawn(move || http_raw("GET", &events_base_url, &events_path, None));

    thread::sleep(Duration::from_millis(100));
    let (verify_status, verified) = http_json(
        "POST",
        &server.base_url,
        "/v1/auth/email-otp/verify",
        Some(&serde_json::json!({
            "challenge_id": challenge_id,
            "code": code,
            "resident_id": "sse-login"
        })),
    );
    assert_eq!(verify_status, 200);
    assert_eq!(verified["resident_id"], "sse-login");

    let (events_status, _headers, body) = events_thread.join().expect("events thread");
    let elapsed = started_at.elapsed();
    assert_eq!(events_status, 200);
    assert!(
        elapsed < Duration::from_millis(1500),
        "otp verify should notify shell events promptly, elapsed {elapsed:?}"
    );
    let data = body
        .split("event: shell-state\ndata: ")
        .nth(1)
        .and_then(|value| value.split("\n\n").next())
        .expect("sse shell-state payload");
    let payload: serde_json::Value = serde_json::from_str(data).expect("shell state json");
    assert_ne!(payload["state_version"], initial_version);
    assert!(
        payload["rooms"]
            .as_array()
            .expect("rooms")
            .iter()
            .any(|room| room["id"] == "dm:guide:sse-login")
    );
}

#[test]
fn shell_message_http_route_reports_real_delivery_and_rejects_visitors() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (sent_status, sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "rsaga",
            "text": "  HTTP 合同消息  ",
            "device_id": "browser",
            "language_tag": "zh-CN"
        })),
    );
    assert_eq!(sent_status, 200);
    assert_eq!(sent["ok"], true);
    assert_eq!(sent["conversation_id"], "room:world:lobby");
    assert_eq!(sent["delivery_status"], "delivered");
    assert_eq!(sent["sender"], "rsaga");
    assert_eq!(sent["text"], "HTTP 合同消息");
    let message_id = sent["message_id"].as_str().expect("message id");
    assert!(!message_id.is_empty());
    assert!(sent["delivered_at_ms"].as_i64().unwrap_or_default() > 0);

    let (state_status, state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=rsaga",
        None,
    );
    assert_eq!(state_status, 200);
    let world_lobby = state["rooms"]
        .as_array()
        .expect("rooms")
        .iter()
        .find(|room| room["id"] == "room:world:lobby")
        .expect("world lobby");
    assert!(
        world_lobby["messages"]
            .as_array()
            .expect("messages")
            .iter()
            .any(
                |message| message["message_id"] == message_id && message["text"] == "HTTP 合同消息"
            )
    );

    let (visitor_status, visitor_error) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "访客",
            "text": "未登录不应入库",
            "device_id": "browser",
            "language_tag": "zh-CN"
        })),
    );
    assert_eq!(visitor_status, 400);
    assert!(
        visitor_error["Error"]["message"]
            .as_str()
            .expect("error message")
            .contains("login")
    );
}

#[test]
fn message_text_http_routes_share_trim_blank_and_length_contract() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (blank_shell_status, blank_shell) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "rsaga",
            "text": "   \n\t ",
            "device_id": "browser",
            "language_tag": "zh-CN"
        })),
    );
    assert_eq!(blank_shell_status, 400);
    assert_eq!(blank_shell["Error"]["message"], "message text required");

    let too_long_text = "长".repeat(2_001);
    let (too_long_shell_status, too_long_shell) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "rsaga",
            "text": too_long_text,
            "device_id": "browser",
            "language_tag": "zh-CN"
        })),
    );
    assert_eq!(too_long_shell_status, 400);
    assert_eq!(
        too_long_shell["Error"]["message"],
        "message text too long: max 2000 chars"
    );

    let (send_status, sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "rsaga",
            "text": "  可编辑正文  ",
            "device_id": "browser",
            "language_tag": "zh-CN"
        })),
    );
    assert_eq!(send_status, 200);
    assert_eq!(sent["text"], "可编辑正文");
    let message_id = sent["message_id"].as_str().expect("message id");

    let (blank_edit_status, blank_edit) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message/edit",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "message_id": message_id,
            "actor": "rsaga",
            "text": "   "
        })),
    );
    assert_eq!(blank_edit_status, 400);
    assert_eq!(blank_edit["Error"]["message"], "message text required");

    let (too_long_edit_status, too_long_edit) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message/edit",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "message_id": message_id,
            "actor": "rsaga",
            "text": "长".repeat(2_001)
        })),
    );
    assert_eq!(too_long_edit_status, 400);
    assert_eq!(
        too_long_edit["Error"]["message"],
        "message text too long: max 2000 chars"
    );

    let (trimmed_cli_status, trimmed_cli) = http_json(
        "POST",
        &server.base_url,
        "/v1/cli/send",
        Some(&serde_json::json!({
            "from": "agent:openclaw",
            "to": "user:rsaga",
            "text": "  CLI 正文也要裁剪  ",
            "client_tag": "openclaw"
        })),
    );
    assert_eq!(trimmed_cli_status, 200);
    assert_eq!(trimmed_cli["ok"], true);
    assert_eq!(trimmed_cli["conversation_id"], "dm:openclaw:rsaga");
    let (trimmed_tail_status, trimmed_tail) = http_json(
        "GET",
        &server.base_url,
        "/v1/cli/tail?for=user%3Arsaga&conversation_id=dm%3Aopenclaw%3Arsaga",
        None,
    );
    assert_eq!(trimmed_tail_status, 200);
    assert!(
        trimmed_tail["messages"]
            .as_array()
            .expect("tail messages")
            .iter()
            .any(|entry| entry["text"] == "CLI 正文也要裁剪")
    );

    let (blank_cli_status, blank_cli) = http_json(
        "POST",
        &server.base_url,
        "/v1/cli/send",
        Some(&serde_json::json!({
            "from": "agent:openclaw",
            "to": "user:rsaga",
            "text": "   ",
            "client_tag": "openclaw"
        })),
    );
    assert_eq!(blank_cli_status, 400);
    assert_eq!(blank_cli["Error"]["message"], "message text required");

    let (too_long_cli_status, too_long_cli) = http_json(
        "POST",
        &server.base_url,
        "/v1/cli/send",
        Some(&serde_json::json!({
            "from": "agent:openclaw",
            "to": "user:rsaga",
            "text": "长".repeat(2_001),
            "client_tag": "openclaw"
        })),
    );
    assert_eq!(too_long_cli_status, 400);
    assert_eq!(
        too_long_cli["Error"]["message"],
        "message text too long: max 2000 chars"
    );
}

#[test]
fn shell_message_http_route_accepts_open_city_public_room_posts() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (sent_status, sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:city:core-harbor:lobby",
            "sender": "qa2",
            "text": "open city lobby should accept this",
            "device_id": "browser",
            "language_tag": "en"
        })),
    );
    assert_eq!(sent_status, 200);
    assert_eq!(sent["ok"], true);
    assert_eq!(sent["conversation_id"], "room:city:core-harbor:lobby");

    let (state_status, state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa2",
        None,
    );
    assert_eq!(state_status, 200);
    let city_lobby = state["rooms"]
        .as_array()
        .expect("rooms")
        .iter()
        .find(|room| room["id"] == "room:city:core-harbor:lobby")
        .expect("city lobby");
    assert!(
        city_lobby["messages"]
            .as_array()
            .expect("messages")
            .iter()
            .any(|message| message["sender"] == "qa2"
                && message["text"] == "open city lobby should accept this")
    );
}

#[test]
fn shell_message_http_route_persists_reply_reference() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (root_status, root) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "qa-a",
            "text": "root message",
            "device_id": "browser",
            "language_tag": "en"
        })),
    );
    assert_eq!(root_status, 200);
    let root_message_id = root["message_id"].as_str().expect("root message id");

    let (reply_status, reply) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "qa-b",
            "text": "reply message",
            "device_id": "browser",
            "language_tag": "en",
            "reply_to_message_id": root_message_id
        })),
    );
    assert_eq!(reply_status, 200);
    assert_eq!(reply["reply_to_message_id"], root_message_id);

    let (state_status, state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-b",
        None,
    );
    assert_eq!(state_status, 200);
    let world_lobby = state["rooms"]
        .as_array()
        .expect("rooms")
        .iter()
        .find(|room| room["id"] == "room:world:lobby")
        .expect("world lobby");
    let reply_message = world_lobby["messages"]
        .as_array()
        .expect("messages")
        .iter()
        .find(|message| message["text"] == "reply message")
        .expect("reply message");
    assert_eq!(reply_message["reply_to_message_id"], root_message_id);
}

#[test]
fn shell_message_http_route_rejects_unknown_reply_reference() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (reply_status, reply_error) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "qa-a",
            "text": "invalid reply",
            "device_id": "browser-a",
            "language_tag": "en",
            "reply_to_message_id": "missing-message-id"
        })),
    );
    assert_eq!(reply_status, 400);
    assert_eq!(
        reply_error["Error"]["message"],
        "reply target missing-message-id not found in room:world:lobby"
    );
}

#[test]
fn shell_message_http_route_rejects_cross_room_reply_reference() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (direct_status, direct) = http_json(
        "POST",
        &server.base_url,
        "/v1/direct/open",
        Some(&serde_json::json!({
            "requester_id": "qa-a",
            "requester_device_id": "browser-a",
            "peer_id": "qa-b",
            "peer_device_id": "browser-b"
        })),
    );
    assert_eq!(direct_status, 200);
    let (direct_send_status, direct_sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": direct["conversation_id"],
            "sender": "qa-a",
            "text": "direct root",
            "device_id": "browser-a",
            "language_tag": "en"
        })),
    );
    assert_eq!(direct_send_status, 200);
    let direct_message_id = direct_sent["message_id"]
        .as_str()
        .expect("direct message id");

    let (reply_status, reply_error) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "qa-a",
            "text": "cross room reply",
            "device_id": "browser-a",
            "language_tag": "en",
            "reply_to_message_id": direct_message_id
        })),
    );
    assert_eq!(reply_status, 400);
    assert_eq!(
        reply_error["Error"]["message"],
        format!("reply target {direct_message_id} not found in room:world:lobby")
    );
}

#[test]
fn shell_message_http_route_roundtrips_two_resident_public_chat() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (a_status, a_sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "qa-a",
            "text": "qa-a says hello",
            "device_id": "browser-a",
            "language_tag": "en"
        })),
    );
    assert_eq!(a_status, 200);
    assert_eq!(a_sent["delivery_status"], "delivered");
    assert_eq!(a_sent["sender"], "qa-a");
    let a_message_id = a_sent["message_id"].as_str().expect("qa-a message id");

    let (b_status, b_sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "qa-b",
            "text": "qa-b replies",
            "device_id": "browser-b",
            "language_tag": "en"
        })),
    );
    assert_eq!(b_status, 200);
    assert_eq!(b_sent["delivery_status"], "delivered");
    assert_eq!(b_sent["sender"], "qa-b");
    let b_message_id = b_sent["message_id"].as_str().expect("qa-b message id");

    for resident_id in ["qa-a", "qa-b"] {
        let (state_status, state) = http_json(
            "GET",
            &server.base_url,
            &format!("/v1/shell/state?resident_id={resident_id}"),
            None,
        );
        assert_eq!(state_status, 200);
        let world_lobby = state["rooms"]
            .as_array()
            .expect("rooms")
            .iter()
            .find(|room| room["id"] == "room:world:lobby")
            .expect("world lobby");
        let messages = world_lobby["messages"].as_array().expect("messages");
        assert!(messages.iter().any(|message| {
            message["message_id"] == a_message_id
                && message["sender"] == "qa-a"
                && message["text"] == "qa-a says hello"
        }));
        assert!(messages.iter().any(|message| {
            message["message_id"] == b_message_id
                && message["sender"] == "qa-b"
                && message["text"] == "qa-b replies"
        }));
    }
}

#[test]
fn shell_direct_message_projection_is_visible_only_to_participants() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (direct_status, direct) = http_json(
        "POST",
        &server.base_url,
        "/v1/direct/open",
        Some(&serde_json::json!({
            "requester_id": "qa-a",
            "requester_device_id": "browser-a",
            "peer_id": "qa-b",
            "peer_device_id": "browser-b"
        })),
    );
    assert_eq!(direct_status, 200);
    assert_eq!(direct["conversation_id"], "dm:qa-a:qa-b");

    let (send_status, sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "dm:qa-a:qa-b",
            "sender": "qa-a",
            "text": "private hello",
            "device_id": "browser-a",
            "language_tag": "en"
        })),
    );
    assert_eq!(send_status, 200);
    assert_eq!(sent["delivery_status"], "delivered");
    let message_id = sent["message_id"].as_str().expect("direct message id");

    for (resident_id, self_label, peer_label) in
        [("qa-a", "qa-a", "qa-b"), ("qa-b", "qa-b", "qa-a")]
    {
        let (state_status, state) = http_json(
            "GET",
            &server.base_url,
            &format!("/v1/shell/state?resident_id={resident_id}"),
            None,
        );
        assert_eq!(state_status, 200);
        let direct_room = state["rooms"]
            .as_array()
            .expect("rooms")
            .iter()
            .find(|room| room["id"] == "dm:qa-a:qa-b")
            .expect("participant direct room");
        assert_eq!(direct_room["kind"], "direct");
        assert_eq!(direct_room["scope"], "private");
        assert_eq!(direct_room["self_label"], self_label);
        assert_eq!(direct_room["peer_label"], peer_label);
        assert!(
            direct_room["messages"]
                .as_array()
                .expect("messages")
                .iter()
                .any(|message| message["message_id"] == message_id
                    && message["sender"] == "qa-a"
                    && message["text"] == "private hello")
        );
    }

    let (outsider_status, outsider_state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-c",
        None,
    );
    assert_eq!(outsider_status, 200);
    assert!(
        outsider_state["rooms"]
            .as_array()
            .expect("rooms")
            .iter()
            .all(|room| room["id"] != "dm:qa-a:qa-b")
    );

    let (cli_tail_status, cli_tail) = http_json(
        "GET",
        &server.base_url,
        "/v1/cli/tail?for=user%3Aqa-c&conversation_id=dm%3Aqa-a%3Aqa-b",
        None,
    );
    assert_eq!(cli_tail_status, 400);
    assert!(
        cli_tail["Error"]["message"]
            .as_str()
            .unwrap_or_default()
            .contains("not visible")
    );
}

#[test]
fn direct_open_http_route_rejects_visitor_or_blank_identities() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (visitor_status, visitor_error) = http_json(
        "POST",
        &server.base_url,
        "/v1/direct/open",
        Some(&serde_json::json!({
            "requester_id": "访客",
            "requester_device_id": "browser-a",
            "peer_id": "qa-b",
            "peer_device_id": "browser-b"
        })),
    );
    assert_eq!(visitor_status, 400);
    assert_eq!(
        visitor_error["Error"]["message"],
        "direct session requires authenticated residents"
    );

    let (blank_status, blank_error) = http_json(
        "POST",
        &server.base_url,
        "/v1/direct/open",
        Some(&serde_json::json!({
            "requester_id": "qa-a",
            "requester_device_id": "browser-a",
            "peer_id": "   ",
            "peer_device_id": "browser-b"
        })),
    );
    assert_eq!(blank_status, 400);
    assert_eq!(
        blank_error["Error"]["message"],
        "direct session requires authenticated residents"
    );
}

#[test]
fn shell_direct_message_route_rejects_non_participant_sender() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (direct_status, direct) = http_json(
        "POST",
        &server.base_url,
        "/v1/direct/open",
        Some(&serde_json::json!({
            "requester_id": "qa-a",
            "requester_device_id": "browser-a",
            "peer_id": "qa-b",
            "peer_device_id": "browser-b"
        })),
    );
    assert_eq!(direct_status, 200);
    assert_eq!(direct["conversation_id"], "dm:qa-a:qa-b");

    let (blocked_status, blocked) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "dm:qa-a:qa-b",
            "sender": "qa-c",
            "text": "outsider write should be rejected",
            "device_id": "browser-c",
            "language_tag": "en"
        })),
    );
    assert_eq!(blocked_status, 400);
    assert!(
        blocked["Error"]["message"]
            .as_str()
            .expect("blocked message")
            .contains("not a participant")
    );

    for resident_id in ["qa-a", "qa-b"] {
        let (state_status, state) = http_json(
            "GET",
            &server.base_url,
            &format!("/v1/shell/state?resident_id={resident_id}"),
            None,
        );
        assert_eq!(state_status, 200);
        let direct_room = state["rooms"]
            .as_array()
            .expect("rooms")
            .iter()
            .find(|room| room["id"] == "dm:qa-a:qa-b")
            .expect("participant direct room");
        assert!(
            direct_room["messages"]
                .as_array()
                .expect("messages")
                .iter()
                .all(|message| message["text"] != "outsider write should be rejected")
        );
    }
}

#[test]
fn direct_open_wakes_peer_shell_events_without_waiting_for_timeout() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (initial_status, initial_state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-b",
        None,
    );
    assert_eq!(initial_status, 200);
    let initial_version = initial_state["state_version"]
        .as_str()
        .expect("initial state version")
        .to_string();

    let events_base_url = server.base_url.clone();
    let events_path =
        format!("/v1/shell/events?resident_id=qa-b&after={initial_version}&wait_ms=5000");
    let started_at = Instant::now();
    let events_thread =
        thread::spawn(move || http_raw("GET", &events_base_url, &events_path, None));

    thread::sleep(Duration::from_millis(100));
    let (direct_status, direct) = http_json(
        "POST",
        &server.base_url,
        "/v1/direct/open",
        Some(&serde_json::json!({
            "requester_id": "qa-a",
            "requester_device_id": "browser-a",
            "peer_id": "qa-b",
            "peer_device_id": "browser-b"
        })),
    );
    assert_eq!(direct_status, 200);
    assert_eq!(direct["conversation_id"], "dm:qa-a:qa-b");

    let (events_status, _headers, body) = events_thread.join().expect("events thread");
    let elapsed = started_at.elapsed();
    assert_eq!(events_status, 200);
    assert!(
        elapsed < Duration::from_millis(1500),
        "direct open should notify shell events promptly, elapsed {elapsed:?}"
    );
    let data = body
        .split("event: shell-state\ndata: ")
        .nth(1)
        .and_then(|value| value.split("\n\n").next())
        .expect("sse shell-state payload");
    let payload: serde_json::Value = serde_json::from_str(data).expect("shell state json");
    assert_ne!(payload["state_version"], initial_version);
    assert!(
        payload["rooms"]
            .as_array()
            .expect("rooms")
            .iter()
            .any(|room| room["id"] == "dm:qa-a:qa-b")
    );
}

#[test]
fn shell_events_wait_returns_peer_message_after_send() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (initial_status, initial_state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-b",
        None,
    );
    assert_eq!(initial_status, 200);
    let initial_version = initial_state["state_version"]
        .as_str()
        .expect("initial state version")
        .to_string();

    let events_base_url = server.base_url.clone();
    let events_path =
        format!("/v1/shell/events?resident_id=qa-b&after={initial_version}&wait_ms=1000");
    let events_thread =
        thread::spawn(move || http_raw("GET", &events_base_url, &events_path, None));

    thread::sleep(Duration::from_millis(100));
    let (sent_status, sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "qa-a",
            "text": "wake qa-b events",
            "device_id": "browser-a",
            "language_tag": "en"
        })),
    );
    assert_eq!(sent_status, 200);
    let message_id = sent["message_id"].as_str().expect("message id");

    let (events_status, _headers, body) = events_thread.join().expect("events thread");
    assert_eq!(events_status, 200);
    let data = body
        .split("event: shell-state\ndata: ")
        .nth(1)
        .and_then(|value| value.split("\n\n").next())
        .expect("sse shell-state payload");
    let payload: serde_json::Value = serde_json::from_str(data).expect("shell state json");
    assert_ne!(payload["state_version"], initial_version);
    let world_lobby = payload["rooms"]
        .as_array()
        .expect("rooms")
        .iter()
        .find(|room| room["id"] == "room:world:lobby")
        .expect("world lobby");
    assert!(
        world_lobby["messages"]
            .as_array()
            .expect("messages")
            .iter()
            .any(|message| message["message_id"] == message_id
                && message["sender"] == "qa-a"
                && message["text"] == "wake qa-b events")
    );
}

#[test]
fn shell_events_wait_returns_peer_message_after_edit() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (sent_status, sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "qa-a",
            "text": "before sse edit",
            "device_id": "browser-a",
            "language_tag": "en"
        })),
    );
    assert_eq!(sent_status, 200);
    let message_id = sent["message_id"].as_str().expect("message id").to_string();

    let (initial_status, initial_state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-b",
        None,
    );
    assert_eq!(initial_status, 200);
    let initial_version = initial_state["state_version"]
        .as_str()
        .expect("initial state version")
        .to_string();

    let events_url =
        format!("/v1/shell/events?resident_id=qa-b&after={initial_version}&wait_ms=1000");
    let events_base_url = server.base_url.clone();
    let events_thread = thread::spawn(move || http_raw("GET", &events_base_url, &events_url, None));
    thread::sleep(Duration::from_millis(50));

    let (edit_status, edit) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message/edit",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "message_id": message_id,
            "actor": "qa-a",
            "text": "after sse edit"
        })),
    );
    assert_eq!(edit_status, 200);
    assert_eq!(edit["edit_status"], "edited");

    let (events_status, _headers, body) = events_thread.join().expect("events thread");
    assert_eq!(events_status, 200);
    let data = body
        .split("event: shell-state\ndata: ")
        .nth(1)
        .and_then(|value| value.split("\n\n").next())
        .expect("sse shell-state payload");
    let payload: serde_json::Value = serde_json::from_str(data).expect("shell state json");
    assert_ne!(payload["state_version"], initial_version);
    let world_lobby = payload["rooms"]
        .as_array()
        .expect("rooms")
        .iter()
        .find(|room| room["id"] == "room:world:lobby")
        .expect("world lobby");
    let edited_message = world_lobby["messages"]
        .as_array()
        .expect("messages")
        .iter()
        .find(|message| message["message_id"] == message_id)
        .expect("edited message");
    assert_eq!(edited_message["text"], "after sse edit");
    assert_eq!(edited_message["is_edited"], true);
    assert_eq!(edited_message["edited_by"], "qa-a");
}

#[test]
fn shell_events_wait_returns_peer_message_after_recall() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (sent_status, sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "qa-a",
            "text": "before sse recall",
            "device_id": "browser-a",
            "language_tag": "en"
        })),
    );
    assert_eq!(sent_status, 200);
    let message_id = sent["message_id"].as_str().expect("message id").to_string();

    let (initial_status, initial_state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-b",
        None,
    );
    assert_eq!(initial_status, 200);
    let initial_version = initial_state["state_version"]
        .as_str()
        .expect("initial state version")
        .to_string();

    let events_url =
        format!("/v1/shell/events?resident_id=qa-b&after={initial_version}&wait_ms=1000");
    let events_base_url = server.base_url.clone();
    let events_thread = thread::spawn(move || http_raw("GET", &events_base_url, &events_url, None));
    thread::sleep(Duration::from_millis(50));

    let (recall_status, recall) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message/recall",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "message_id": message_id,
            "actor": "qa-a"
        })),
    );
    assert_eq!(recall_status, 200);
    assert_eq!(recall["recall_status"], "recalled");

    let (events_status, _headers, body) = events_thread.join().expect("events thread");
    assert_eq!(events_status, 200);
    let data = body
        .split("event: shell-state\ndata: ")
        .nth(1)
        .and_then(|value| value.split("\n\n").next())
        .expect("sse shell-state payload");
    let payload: serde_json::Value = serde_json::from_str(data).expect("shell state json");
    assert_ne!(payload["state_version"], initial_version);
    let world_lobby = payload["rooms"]
        .as_array()
        .expect("rooms")
        .iter()
        .find(|room| room["id"] == "room:world:lobby")
        .expect("world lobby");
    let recalled_message = world_lobby["messages"]
        .as_array()
        .expect("messages")
        .iter()
        .find(|message| message["message_id"] == message_id)
        .expect("recalled message");
    assert_eq!(recalled_message["text"], "消息已撤回");
    assert_eq!(recalled_message["is_recalled"], true);
    assert_eq!(recalled_message["recalled_by"], "qa-a");
}

#[test]
fn shell_message_http_route_recalls_own_message_without_deleting_audit_entry() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (sent_status, sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "qa-a",
            "text": "recall me",
            "device_id": "browser",
            "language_tag": "en"
        })),
    );
    assert_eq!(sent_status, 200);
    let message_id = sent["message_id"].as_str().expect("message id");

    let (before_recall_status, before_recall_state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-a",
        None,
    );
    assert_eq!(before_recall_status, 200);
    let before_recall_version = before_recall_state["state_version"]
        .as_str()
        .expect("before recall state version")
        .to_string();

    let (recall_status, recall) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message/recall",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "message_id": message_id,
            "actor": "qa-a"
        })),
    );
    assert_eq!(recall_status, 200);
    assert_eq!(recall["ok"], true);
    assert_eq!(recall["message_id"], message_id);
    assert_eq!(recall["recall_status"], "recalled");

    let (state_status, state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-a",
        None,
    );
    assert_eq!(state_status, 200);
    assert_ne!(
        state["state_version"]
            .as_str()
            .expect("after recall state version"),
        before_recall_version
    );
    let world_lobby = state["rooms"]
        .as_array()
        .expect("rooms")
        .iter()
        .find(|room| room["id"] == "room:world:lobby")
        .expect("world lobby");
    let recalled_message = world_lobby["messages"]
        .as_array()
        .expect("messages")
        .iter()
        .find(|message| message["message_id"] == message_id)
        .expect("recalled message");
    assert_eq!(recalled_message["is_recalled"], true);
    assert_eq!(recalled_message["recalled_by"], "qa-a");
    assert_eq!(recalled_message["text"], "消息已撤回");
}

#[test]
fn shell_message_http_route_edits_own_message_without_changing_message_id() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (sent_status, sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "qa-a",
            "text": "before edit",
            "device_id": "browser",
            "language_tag": "en"
        })),
    );
    assert_eq!(sent_status, 200);
    let message_id = sent["message_id"].as_str().expect("message id");

    let (before_edit_status, before_edit_state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-a",
        None,
    );
    assert_eq!(before_edit_status, 200);
    let before_edit_version = before_edit_state["state_version"]
        .as_str()
        .expect("before edit state version")
        .to_string();

    let (edit_status, edit) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message/edit",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "message_id": message_id,
            "actor": "qa-a",
            "text": "after edit"
        })),
    );
    assert_eq!(edit_status, 200);
    assert_eq!(edit["ok"], true);
    assert_eq!(edit["message_id"], message_id);
    assert_eq!(edit["edit_status"], "edited");
    assert_eq!(edit["text"], "after edit");

    let (state_status, state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-a",
        None,
    );
    assert_eq!(state_status, 200);
    assert_ne!(
        state["state_version"]
            .as_str()
            .expect("after edit state version"),
        before_edit_version
    );
    let world_lobby = state["rooms"]
        .as_array()
        .expect("rooms")
        .iter()
        .find(|room| room["id"] == "room:world:lobby")
        .expect("world lobby");
    let edited_message = world_lobby["messages"]
        .as_array()
        .expect("messages")
        .iter()
        .find(|message| message["message_id"] == message_id)
        .expect("edited message");
    assert_eq!(edited_message["is_edited"], true);
    assert_eq!(edited_message["edited_by"], "qa-a");
    assert_eq!(edited_message["text"], "after edit");
}

#[test]
fn shell_message_http_route_rejects_edit_from_non_sender() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (sent_status, sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "qa-a",
            "text": "owned by qa-a",
            "device_id": "browser",
            "language_tag": "en"
        })),
    );
    assert_eq!(sent_status, 200);
    let message_id = sent["message_id"].as_str().expect("message id");

    let (edit_status, edit_error) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message/edit",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "message_id": message_id,
            "actor": "qa-b",
            "text": "qa-b should not overwrite"
        })),
    );
    assert_eq!(edit_status, 400);
    assert_eq!(
        edit_error["Error"]["message"],
        "edit message failed: only the original sender can edit this message"
    );

    let (state_status, state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-a",
        None,
    );
    assert_eq!(state_status, 200);
    let world_lobby = state["rooms"]
        .as_array()
        .expect("rooms")
        .iter()
        .find(|room| room["id"] == "room:world:lobby")
        .expect("world lobby");
    let message = world_lobby["messages"]
        .as_array()
        .expect("messages")
        .iter()
        .find(|message| message["message_id"] == message_id)
        .expect("original message");
    assert_eq!(message["text"], "owned by qa-a");
    assert_eq!(message["is_edited"], false);
}

#[test]
fn shell_message_http_route_rejects_edit_after_recall() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (sent_status, sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "sender": "qa-a",
            "text": "recall before edit",
            "device_id": "browser",
            "language_tag": "en"
        })),
    );
    assert_eq!(sent_status, 200);
    let message_id = sent["message_id"].as_str().expect("message id");

    let (recall_status, recall) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message/recall",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "message_id": message_id,
            "actor": "qa-a"
        })),
    );
    assert_eq!(recall_status, 200);
    assert_eq!(recall["ok"], true);

    let (edit_status, edit_error) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message/edit",
        Some(&serde_json::json!({
            "room_id": "room:world:lobby",
            "message_id": message_id,
            "actor": "qa-a",
            "text": "recalled message should not change"
        })),
    );
    assert_eq!(edit_status, 400);
    assert_eq!(
        edit_error["Error"]["message"],
        "edit message failed: recalled messages cannot be edited"
    );

    let (state_status, state) = http_json(
        "GET",
        &server.base_url,
        "/v1/shell/state?resident_id=qa-a",
        None,
    );
    assert_eq!(state_status, 200);
    let world_lobby = state["rooms"]
        .as_array()
        .expect("rooms")
        .iter()
        .find(|room| room["id"] == "room:world:lobby")
        .expect("world lobby");
    let message = world_lobby["messages"]
        .as_array()
        .expect("messages")
        .iter()
        .find(|message| message["message_id"] == message_id)
        .expect("recalled message");
    assert_eq!(message["is_recalled"], true);
    assert_eq!(message["is_edited"], false);
    assert_eq!(message["text"], "消息已撤回");
}

#[test]
fn read_http_routes_return_stable_gateway_projection_contract() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    register_resident(&mut runtime, "read-contract-user");
    runtime
        .join_city(JoinCityRequest {
            city: "core-harbor".into(),
            resident_id: "read-contract-user".into(),
        })
        .expect("join default city");
    let server = start_local_gateway_http_server(runtime);

    let (bootstrap_status, bootstrap) =
        http_json("GET", &server.base_url, "/v1/shell/bootstrap", None);
    assert_eq!(bootstrap_status, 200);
    assert_eq!(bootstrap["gateway_base_url"], server.base_url);

    let (world_status, world) = http_json("GET", &server.base_url, "/v1/world", None);
    assert_eq!(world_status, 200);
    assert_eq!(world["world"]["title"], "Lobster World");
    assert!(world["cities"].as_array().expect("world cities").len() >= 1);
    assert!(
        world["public_rooms"]
            .as_array()
            .expect("world public rooms")
            .iter()
            .any(|room| room["room_id"] == "room:city:core-harbor:lobby")
    );

    let (cities_status, cities) = http_json("GET", &server.base_url, "/v1/cities", None);
    assert_eq!(cities_status, 200);
    assert!(
        cities
            .as_array()
            .expect("cities")
            .iter()
            .any(|city| city["profile"]["slug"] == "core-harbor")
    );

    let (residents_status, residents) = http_json("GET", &server.base_url, "/v1/residents", None);
    assert_eq!(residents_status, 200);
    assert!(
        residents
            .as_array()
            .expect("residents")
            .iter()
            .any(|resident| resident["resident_id"] == "read-contract-user")
    );

    let (directory_status, directory) =
        http_json("GET", &server.base_url, "/v1/world-directory", None);
    assert_eq!(directory_status, 200);
    assert_eq!(directory["title"], "Lobster World");
    assert!(
        directory["cities"]
            .as_array()
            .expect("directory cities")
            .iter()
            .any(|city| city["slug"] == "core-harbor")
    );

    let (snapshot_status, snapshot) =
        http_json("GET", &server.base_url, "/v1/world-snapshot", None);
    assert_eq!(snapshot_status, 200);
    assert!(
        snapshot["meta"]["checksum_sha256"]
            .as_str()
            .expect("snapshot checksum")
            .len()
            > 8
    );
    assert_eq!(
        snapshot["payload"]["governance"]["world"]["title"],
        "Lobster World"
    );

    let (mirrors_status, mirrors) = http_json("GET", &server.base_url, "/v1/world-mirrors", None);
    assert_eq!(mirrors_status, 200);
    assert!(mirrors.as_array().expect("mirrors").len() >= 1);

    let (export_missing_status, export_missing) =
        http_json("GET", &server.base_url, "/v1/export", None);
    assert_eq!(export_missing_status, 400);
    assert!(
        export_missing["Error"]["message"]
            .as_str()
            .expect("missing export error")
            .contains("resident_id")
    );

    let (sent_status, sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message",
        Some(&serde_json::json!({
            "room_id": "room:city:core-harbor:lobby",
            "sender": "read-contract-user",
            "text": "read route export message",
            "device_id": "browser",
            "language_tag": "en"
        })),
    );
    assert_eq!(sent_status, 200);
    assert_eq!(sent["ok"], true);

    let (export_status, export) = http_json(
        "GET",
        &server.base_url,
        "/v1/export?resident_id=read-contract-user&include_public=true&format=jsonl",
        None,
    );
    assert_eq!(export_status, 200);
    assert_eq!(export["resident_id"], "read-contract-user");
    assert_eq!(export["format"], "jsonl");
    assert!(
        export["content"]
            .as_str()
            .expect("export content")
            .contains("read route export message")
    );
}

#[test]
fn merge_governance_snapshots_adds_upstream_city_catalog() {
    let temp = tempdir().expect("temp dir");
    let mut primary = GatewayRuntime::open(temp.path().join("gateway"), 64, None)
        .expect("runtime")
        .governance_snapshot();
    let mut secondary = primary.clone();

    primary
        .cities
        .retain(|city| city.profile.slug == "core-harbor");
    primary.public_rooms.retain(|room| room.slug == "lobby");

    let upstream_city_id = CityId("city:aurora".into());
    secondary.cities.push(CityState {
        profile: CityProfile {
            city_id: upstream_city_id.clone(),
            world_id: secondary.world.world_id.clone(),
            slug: "aurora".into(),
            title: "Aurora".into(),
            description: "remote city".into(),
            scene: Some(GatewayRuntime::default_city_scene("aurora", "Aurora")),
            resident_portable: true,
            approval_required: true,
            public_room_discovery_enabled: true,
            federation_policy: FederationPolicy::Open,
            relay_budget_hint: RelayBudgetHint::Balanced,
            retention_policy: GatewayRuntime::default_city_retention_policy(),
        },
        features: GatewayRuntime::default_city_features(),
    });
    secondary.memberships.push(CityMembership {
        city_id: upstream_city_id.clone(),
        resident_id: IdentityId("remote-lord".into()),
        role: CityRole::Lord,
        state: MembershipState::Active,
        joined_at_ms: 1_763_560_000_001,
        added_by: None,
    });
    secondary.public_rooms.push(PublicRoomRecord {
        room_id: ConversationId("room:city:aurora:lobby".into()),
        city_id: upstream_city_id,
        slug: "lobby".into(),
        title: "Aurora Lobby".into(),
        description: "remote room".into(),
        scene: Some(GatewayRuntime::default_public_room_scene(
            "aurora",
            "lobby",
            "Aurora Lobby",
        )),
        created_by: IdentityId("remote-lord".into()),
        created_at_ms: 1_763_560_000_002,
        frozen: false,
    });

    let merged = GatewayRuntime::merge_governance_snapshots(primary, secondary);
    assert!(
        merged
            .cities
            .iter()
            .any(|city| city.profile.slug == "aurora")
    );
    assert!(
        merged
            .memberships
            .iter()
            .any(|membership| membership.resident_id.0 == "remote-lord")
    );
    assert!(
        merged
            .public_rooms
            .iter()
            .any(|room| room.room_id.0 == "room:city:aurora:lobby")
    );
}

#[test]
fn disconnect_provider_returns_local_mode() {
    let temp = tempdir().expect("temp dir");
    let storage_root = temp.path().join("disconnect-provider");
    let mut runtime = GatewayRuntime::open(&storage_root, 8, None).expect("open runtime");
    runtime
        .set_upstream_provider_url(Some("http://127.0.0.1:9999".into()))
        .expect("persist provider");

    let provider = runtime.disconnect_provider().expect("disconnect provider");
    assert_eq!(provider.mode, "local-memory");
    assert!(provider.base_url.is_none());
}

#[test]
fn provider_direct_and_mirror_http_routes_roundtrip_gateway_contract() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);
    let (upstream_base_url, upstream_state, upstream_running, upstream_handle) =
        start_mock_upstream_gateway();
    {
        let remote_runtime =
            GatewayRuntime::open(temp.path().join("remote-gateway"), 64, None).expect("remote");
        let remote_bundle = remote_runtime
            .federation_read_plan()
            .world_snapshot_bundle();
        let mut shared = upstream_state.lock().expect("lock upstream state");
        shared.world_snapshot_bundle = Some(remote_bundle.clone());
        shared.governance_snapshot = Some(remote_bundle.payload.governance.clone());
    }

    let outcome = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        let (initial_status, initial_provider) =
            http_json("GET", &server.base_url, "/v1/provider", None);
        assert_eq!(initial_status, 200);
        assert_eq!(initial_provider["mode"], "local-memory");
        assert_eq!(initial_provider["base_url"], serde_json::Value::Null);

        let (connect_status, connected_provider) = http_json(
            "POST",
            &server.base_url,
            "/v1/provider/connect",
            Some(&serde_json::json!({
                "provider_url": upstream_base_url
            })),
        );
        assert_eq!(connect_status, 200);
        assert_eq!(connected_provider["mode"], "remote-gateway");
        assert_eq!(connected_provider["base_url"], upstream_base_url);
        assert_eq!(connected_provider["reachable"], true);
        assert!(
            upstream_state
                .lock()
                .expect("lock upstream state")
                .healthcheck_count
                >= 1
        );

        let (direct_status, direct) = http_json(
            "POST",
            &server.base_url,
            "/v1/direct/open",
            Some(&serde_json::json!({
                "requester_id": "rsaga",
                "requester_device_id": "desktop-1",
                "peer_id": "builder",
                "peer_device_id": "browser"
            })),
        );
        assert_eq!(direct_status, 200);
        assert_eq!(direct["conversation_id"], "dm:builder:rsaga");
        assert_eq!(direct["kind"], "Direct");
        assert_eq!(
            direct["members"].as_array().expect("direct members").len(),
            2
        );

        let (mirror_post_status, mirror_sources) = http_json(
            "POST",
            &server.base_url,
            "/v1/world-mirror-sources",
            Some(&serde_json::json!({
                "base_url": "http://mirror.example.invalid/",
                "enabled": false
            })),
        );
        assert_eq!(mirror_post_status, 200);
        assert_eq!(
            mirror_sources
                .as_array()
                .expect("mirror source config")
                .len(),
            1
        );
        assert_eq!(
            mirror_sources[0]["base_url"],
            "http://mirror.example.invalid"
        );
        assert_eq!(mirror_sources[0]["enabled"], false);

        let (mirror_get_status, mirror_statuses) =
            http_json("GET", &server.base_url, "/v1/world-mirror-sources", None);
        assert_eq!(mirror_get_status, 200);
        assert!(
            mirror_statuses
                .as_array()
                .expect("mirror source statuses")
                .iter()
                .any(|item| item["base_url"] == "http://mirror.example.invalid"
                    && item["enabled"] == false)
        );

        let (disconnect_status, disconnected_provider) =
            http_json("POST", &server.base_url, "/v1/provider/disconnect", None);
        assert_eq!(disconnect_status, 200);
        assert_eq!(disconnected_provider["mode"], "local-memory");
        assert_eq!(disconnected_provider["base_url"], serde_json::Value::Null);
        assert_eq!(disconnected_provider["reachable"], true);
    }));

    upstream_running.store(false, Ordering::SeqCst);
    let _ = TcpStream::connect(upstream_base_url.trim_start_matches("http://"));
    upstream_handle.join().expect("join upstream gateway");
    outcome.expect("provider direct and mirror http route contract");
}

#[test]
fn provider_and_auth_state_roundtrip_across_restart() {
    let temp = tempdir().expect("temp dir");
    let root = temp.path().join("provider-auth-roundtrip");
    let (base_url, _state, running, handle) = start_mock_upstream_gateway();

    let outcome = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        {
            let mut runtime = GatewayRuntime::open(&root, 8, None).expect("open runtime");
            runtime
                .connect_provider(ConnectProviderRequest {
                    provider_url: base_url.clone(),
                })
                .expect("connect provider");
            runtime
                .add_world_mirror_source(AddWorldMirrorSourceRequest {
                    base_url: "http://mirror.example.invalid/".into(),
                    enabled: Some(true),
                })
                .expect("add mirror source");
            runtime
                .request_email_otp(RequestEmailOtpRequest {
                    email: "roundtrip@example.com".into(),
                    mobile: Some("+86 13800138009".into()),
                    device_physical_address: Some("AA:BB:CC:DD:EE:09".into()),
                    resident_id: Some("roundtrip-user".into()),
                })
                .expect("request email otp");
        }

        let runtime = GatewayRuntime::open(&root, 8, None).expect("reopen runtime");
        assert_eq!(
            runtime.upstream_base_url.as_deref(),
            Some(base_url.as_str())
        );
        assert_eq!(runtime.mirror_sources.len(), 1);
        assert_eq!(
            runtime.mirror_sources[0].base_url,
            "http://mirror.example.invalid"
        );
        assert_eq!(runtime.registrations.len(), 0);
        assert_eq!(runtime.email_otp_challenges.len(), 1);
        assert_eq!(
            runtime.email_otp_challenges[0]
                .desired_resident_id
                .as_ref()
                .map(|id| id.0.as_str()),
            Some("roundtrip-user")
        );
    }));

    running.store(false, Ordering::SeqCst);
    let _ = TcpStream::connect(base_url.trim_start_matches("http://"));
    handle.join().expect("stop mock upstream gateway");
    outcome.expect("provider/auth state should survive restart");
}

#[test]
fn resident_directory_groups_memberships_by_identity() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    runtime
        .create_city(CreateCityRequest {
            slug: Some("aurora".into()),
            title: "Aurora".into(),
            description: "remote city".into(),
            lord_id: "alice".into(),
            approval_required: Some(true),
            public_room_discovery_enabled: Some(true),
            federation_policy: None,
        })
        .expect("create city");
    register_resident(&mut runtime, "guest-01");
    runtime
        .join_city(JoinCityRequest {
            city: "aurora".into(),
            resident_id: "guest-01".into(),
        })
        .expect("join city");

    let directory = GatewayRuntime::resident_directory(&runtime.governance_snapshot());
    let alice = directory
        .iter()
        .find(|entry| entry.resident_id == "alice")
        .expect("alice entry");
    assert!(alice.active_cities.contains(&"aurora".into()));
    assert!(alice.roles.contains(&"Lord".into()));

    let guest = directory
        .iter()
        .find(|entry| entry.resident_id == "guest-01")
        .expect("guest entry");
    assert!(guest.pending_cities.contains(&"aurora".into()));
}

#[test]
fn direct_session_bootstrap_creates_private_conversation() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    let group = runtime
        .open_direct_session(OpenDirectSessionRequest {
            requester_id: "rsaga".into(),
            requester_device_id: Some("desktop-1".into()),
            peer_id: "builder".into(),
            peer_device_id: Some("browser".into()),
        })
        .expect("direct session should open");
    assert_eq!(group.scope, ConversationScope::Private);
    assert_eq!(group.members.len(), 2);
    assert!(
        runtime
            .timeline_store
            .active_conversations()
            .iter()
            .any(|conversation| conversation.conversation_id.0 == "dm:builder:rsaga")
    );
}

#[test]
fn direct_session_persists_across_restart() {
    let temp = tempdir().expect("temp dir");
    let root = temp.path().join("gateway");

    {
        let mut runtime = GatewayRuntime::open(&root, 64, None).expect("runtime");
        runtime
            .open_direct_session(OpenDirectSessionRequest {
                requester_id: "rsaga".into(),
                requester_device_id: Some("desktop-1".into()),
                peer_id: "builder".into(),
                peer_device_id: None,
            })
            .expect("direct session should open");
    }

    let runtime = GatewayRuntime::open(&root, 64, None).expect("runtime");
    let group = runtime
        .secure_sessions
        .group_state(&ConversationId("dm:builder:rsaga".into()))
        .expect("secure session should persist");
    assert_eq!(group.kind, crypto_mls::MlsGroupKind::Direct);
}

#[test]
fn direct_session_reuses_existing_legacy_conversation_id() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    let group = runtime
        .open_direct_session(OpenDirectSessionRequest {
            requester_id: "rsaga".into(),
            requester_device_id: Some("desktop-1".into()),
            peer_id: "builder".into(),
            peer_device_id: Some("browser".into()),
        })
        .expect("direct session should open");

    assert_eq!(group.conversation_id.0, "dm:builder:rsaga");
    let direct_conversations = runtime
        .timeline_store
        .active_conversations()
        .into_iter()
        .filter(|conversation| conversation.kind == ConversationKind::Direct)
        .count();
    assert_eq!(direct_conversations, 1);
}

#[test]
fn direct_session_reuses_existing_session_when_participants_are_reversed() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    let first = runtime
        .open_direct_session(OpenDirectSessionRequest {
            requester_id: "rsaga".into(),
            requester_device_id: Some("desktop-1".into()),
            peer_id: "builder".into(),
            peer_device_id: Some("browser".into()),
        })
        .expect("first direct session should open");

    let second = runtime
        .open_direct_session(OpenDirectSessionRequest {
            requester_id: "builder".into(),
            requester_device_id: Some("browser".into()),
            peer_id: "rsaga".into(),
            peer_device_id: Some("desktop-1".into()),
        })
        .expect("second direct session should reuse first");

    assert_eq!(second.conversation_id, first.conversation_id);
    assert_eq!(second.epoch, first.epoch);
    let direct_conversations = runtime
        .timeline_store
        .active_conversations()
        .into_iter()
        .filter(|conversation| conversation.kind == ConversationKind::Direct)
        .count();
    assert_eq!(direct_conversations, 1);
}

#[test]
fn cli_address_parser_accepts_user_agent_and_room() {
    let user = parse_cli_address("user:rsaga").expect("user address should parse");
    assert_eq!(user, CliAddress::User(IdentityId("rsaga".into())));

    let agent = parse_cli_address("agent:codex").expect("agent address should parse");
    assert_eq!(agent, CliAddress::Agent(IdentityId("codex".into())));

    let room = parse_cli_address("room:city:core-harbor:lobby").expect("room address should parse");
    assert_eq!(
        room,
        CliAddress::Room(ConversationId("room:city:core-harbor:lobby".into()))
    );
}

#[test]
fn cli_direct_mapping_normalizes_dm_pair_order() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    let forward = runtime.resolve_cli_direct_conversation_id(
        &IdentityId("openclaw".into()),
        &IdentityId("rsaga".into()),
    );
    let reverse = runtime.resolve_cli_direct_conversation_id(
        &IdentityId("rsaga".into()),
        &IdentityId("openclaw".into()),
    );

    assert_eq!(forward, reverse);
    assert_eq!(forward.0, "dm:openclaw:rsaga");
}

#[test]
fn cli_direct_mapping_reuses_reverse_legacy_conversation_id() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let reverse_legacy = ConversationId("dm:openclaw:rsaga".into());
    runtime
        .ensure_direct_conversation(
            &reverse_legacy,
            &[IdentityId("rsaga".into()), IdentityId("openclaw".into())],
        )
        .expect("seed reverse legacy direct conversation");

    let resolved = runtime.resolve_cli_direct_conversation_id(
        &IdentityId("openclaw".into()),
        &IdentityId("rsaga".into()),
    );

    assert_eq!(resolved, reverse_legacy);
}

#[test]
fn cli_address_parser_rejects_invalid_prefix() {
    let error = parse_cli_address("foo:bar").expect_err("invalid prefix should fail");
    assert!(error.contains("unsupported cli address"));
}

#[test]
fn cli_send_to_user_opens_direct_conversation_and_publishes() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    let response = runtime
        .send_cli_message(CliSendRequest {
            from: "agent:openclaw".into(),
            to: "user:rsaga".into(),
            text: "晚上一起吃饭吗".into(),
            client_tag: Some("openclaw".into()),
        })
        .expect("cli direct send should succeed");

    assert_eq!(response.conversation_id, "dm:openclaw:rsaga");

    let messages = runtime
        .timeline_store
        .recent_messages(&ConversationId(response.conversation_id.clone()), 8);
    assert_eq!(messages.len(), 1);
    assert_eq!(messages[0].envelope.body.plain_text, "晚上一起吃饭吗");
}

#[test]
fn cli_send_trims_text_and_rejects_blank_or_too_long_text() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    let response = runtime
        .send_cli_message(CliSendRequest {
            from: "agent:openclaw".into(),
            to: "user:rsaga".into(),
            text: "  去掉前后空白  ".into(),
            client_tag: Some("openclaw".into()),
        })
        .expect("trimmed cli send should succeed");
    let messages = runtime
        .timeline_store
        .recent_messages(&ConversationId(response.conversation_id.clone()), 8);
    assert_eq!(messages[0].envelope.body.plain_text, "去掉前后空白");

    let blank_error = runtime
        .send_cli_message(CliSendRequest {
            from: "agent:openclaw".into(),
            to: "user:rsaga".into(),
            text: "   \n\t ".into(),
            client_tag: Some("openclaw".into()),
        })
        .expect_err("blank CLI send should fail");
    assert!(blank_error.contains("message text required"));

    let too_long_error = runtime
        .send_cli_message(CliSendRequest {
            from: "agent:openclaw".into(),
            to: "user:rsaga".into(),
            text: "长".repeat(2_001),
            client_tag: Some("openclaw".into()),
        })
        .expect_err("too long CLI send should fail");
    assert!(too_long_error.contains("max 2000 chars"));
}

#[test]
fn cli_http_routes_roundtrip_send_inbox_rooms_and_tail_contract() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (missing_status, missing) = http_json("GET", &server.base_url, "/v1/cli/inbox", None);
    assert_eq!(missing_status, 400);
    assert_eq!(missing["message"], "missing for");

    let (send_status, sent) = http_json(
        "POST",
        &server.base_url,
        "/v1/cli/send",
        Some(&serde_json::json!({
            "from": "agent:openclaw",
            "to": "user:rsaga",
            "text": "今晚一起吃饭吗",
            "client_tag": "openclaw"
        })),
    );
    assert_eq!(send_status, 200);
    assert_eq!(sent["ok"], true);
    assert_eq!(sent["conversation_id"], "dm:openclaw:rsaga");

    let (inbox_status, inbox) = http_json(
        "GET",
        &server.base_url,
        "/v1/cli/inbox?for=user%3Arsaga",
        None,
    );
    assert_eq!(inbox_status, 200);
    assert_eq!(inbox["identity"], "user:rsaga");
    assert!(
        inbox["conversations"]
            .as_array()
            .expect("inbox conversations")
            .iter()
            .any(|item| item["conversation_id"] == "dm:openclaw:rsaga"
                && item["last_message_preview"] == "今晚一起吃饭吗")
    );

    let (rooms_status, rooms) = http_json(
        "GET",
        &server.base_url,
        "/v1/cli/rooms?for=user%3Arsaga",
        None,
    );
    assert_eq!(rooms_status, 200);
    assert_eq!(rooms["identity"], "user:rsaga");
    assert!(
        rooms["entries"]
            .as_array()
            .expect("room entries")
            .iter()
            .any(|item| item["conversation_id"] == "dm:openclaw:rsaga")
    );

    let (tail_status, tail) = http_json(
        "GET",
        &server.base_url,
        "/v1/cli/tail?for=user%3Arsaga&conversation_id=dm%3Aopenclaw%3Arsaga",
        None,
    );
    assert_eq!(tail_status, 200);
    assert_eq!(tail["identity"], "user:rsaga");
    assert_eq!(tail["conversation_id"], "dm:openclaw:rsaga");
    assert!(
        tail["messages"]
            .as_array()
            .expect("tail messages")
            .iter()
            .any(|item| item["sender"] == "openclaw" && item["text"] == "今晚一起吃饭吗")
    );
}

#[test]
fn cli_tail_and_inbox_project_recall_and_edit_metadata() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (edited_send_status, edited_send) = http_json(
        "POST",
        &server.base_url,
        "/v1/cli/send",
        Some(&serde_json::json!({
            "from": "user:rsaga",
            "to": "agent:openclaw",
            "text": "cli before edit",
            "client_tag": "cli"
        })),
    );
    assert_eq!(edited_send_status, 200);
    let conversation_id = edited_send["conversation_id"]
        .as_str()
        .expect("conversation id");
    let edited_message_id = edited_send["message_id"].as_str().expect("message id");

    let (edit_status, edit) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message/edit",
        Some(&serde_json::json!({
            "room_id": conversation_id,
            "message_id": edited_message_id,
            "actor": "rsaga",
            "text": "cli after edit"
        })),
    );
    assert_eq!(edit_status, 200);
    assert_eq!(edit["ok"], true);

    let (recalled_send_status, recalled_send) = http_json(
        "POST",
        &server.base_url,
        "/v1/cli/send",
        Some(&serde_json::json!({
            "from": "user:rsaga",
            "to": "agent:openclaw",
            "text": "cli before recall",
            "client_tag": "cli"
        })),
    );
    assert_eq!(recalled_send_status, 200);
    let recalled_message_id = recalled_send["message_id"].as_str().expect("message id");

    let (recall_status, recall) = http_json(
        "POST",
        &server.base_url,
        "/v1/shell/message/recall",
        Some(&serde_json::json!({
            "room_id": conversation_id,
            "message_id": recalled_message_id,
            "actor": "rsaga"
        })),
    );
    assert_eq!(recall_status, 200);
    assert_eq!(recall["ok"], true);

    let (tail_status, tail) = http_json(
        "GET",
        &server.base_url,
        "/v1/cli/tail?for=agent%3Aopenclaw&conversation_id=dm%3Aopenclaw%3Arsaga",
        None,
    );
    assert_eq!(tail_status, 200);
    let tail_messages = tail["messages"].as_array().expect("tail messages");
    let edited_message = tail_messages
        .iter()
        .find(|message| message["message_id"] == edited_message_id)
        .expect("edited message");
    assert_eq!(edited_message["text"], "cli after edit");
    assert_eq!(edited_message["is_edited"], true);
    assert_eq!(edited_message["edited_by"], "rsaga");
    assert_eq!(edited_message["is_recalled"], false);

    let recalled_message = tail_messages
        .iter()
        .find(|message| message["message_id"] == recalled_message_id)
        .expect("recalled message");
    assert_eq!(recalled_message["text"], "消息已撤回");
    assert_eq!(recalled_message["is_recalled"], true);
    assert_eq!(recalled_message["recalled_by"], "rsaga");
    assert_eq!(recalled_message["is_edited"], false);

    let (inbox_status, inbox) = http_json(
        "GET",
        &server.base_url,
        "/v1/cli/inbox?for=agent%3Aopenclaw",
        None,
    );
    assert_eq!(inbox_status, 200);
    let conversation = inbox["conversations"]
        .as_array()
        .expect("conversations")
        .iter()
        .find(|item| item["conversation_id"] == conversation_id)
        .expect("conversation");
    assert_eq!(conversation["last_message_preview"], "消息已撤回");
}

#[test]
fn cli_send_to_room_appends_message_into_existing_room() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let room_id = ConversationId("room:world:lobby".into());
    let before = runtime.timeline_store.recent_messages(&room_id, 64).len();

    let response = runtime
        .send_cli_message(CliSendRequest {
            from: "user:rsaga".into(),
            to: "room:world:lobby".into(),
            text: "今晚八点开会".into(),
            client_tag: None,
        })
        .expect("cli room send should succeed");

    assert_eq!(response.conversation_id, "room:world:lobby");

    let after_messages = runtime.timeline_store.recent_messages(&room_id, 64);
    assert_eq!(after_messages.len(), before + 1);
    assert_eq!(
        after_messages
            .last()
            .expect("last room message")
            .envelope
            .body
            .plain_text,
        "今晚八点开会"
    );
}

#[test]
fn cli_send_to_default_city_room_accepts_user_surface_identity() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let room_id = ConversationId("room:city:core-harbor:lobby".into());
    let before = runtime.timeline_store.recent_messages(&room_id, 64).len();

    let response = runtime
        .send_cli_message(CliSendRequest {
            from: "user:tiyan".into(),
            to: "room:city:core-harbor:lobby".into(),
            text: "我也在大厅里".into(),
            client_tag: None,
        })
        .expect("default user surface identity should post into city lobby");

    assert_eq!(response.conversation_id, "room:city:core-harbor:lobby");

    let after_messages = runtime.timeline_store.recent_messages(&room_id, 64);
    assert_eq!(after_messages.len(), before + 1);
    assert_eq!(
        after_messages
            .last()
            .expect("last city room message")
            .envelope
            .sender
            .0,
        "tiyan"
    );
    assert_eq!(
        after_messages
            .last()
            .expect("last city room message")
            .envelope
            .body
            .plain_text,
        "我也在大厅里"
    );
}

#[test]
fn cli_send_to_seeded_governance_room_succeeds_for_admin_identity() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let room_id = ConversationId("room:city:aurora-hub:announcements".into());
    let before = runtime.timeline_store.recent_messages(&room_id, 64).len();

    let response = runtime
        .send_cli_message(CliSendRequest {
            from: "user:rsaga".into(),
            to: "room:city:aurora-hub:announcements".into(),
            text: "城务提醒已更新".into(),
            client_tag: None,
        })
        .expect("seeded governance room should accept admin send");

    assert_eq!(
        response.conversation_id,
        "room:city:aurora-hub:announcements"
    );

    let after_messages = runtime.timeline_store.recent_messages(&room_id, 64);
    assert_eq!(after_messages.len(), before + 1);
    assert_eq!(
        after_messages
            .last()
            .expect("last governance room message")
            .envelope
            .body
            .plain_text,
        "城务提醒已更新"
    );
}

#[test]
fn cli_send_rejects_unknown_room_targets() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    let error = runtime
        .send_cli_message(CliSendRequest {
            from: "user:rsaga".into(),
            to: "room:city:phantom-city:ghost-room".into(),
            text: "今晚一起吃饭吗".into(),
            client_tag: None,
        })
        .expect_err("unknown room target should fail");

    assert!(error.contains("unknown public room"));
}

#[test]
fn cli_send_rejects_visitor_surface_identity_before_login() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let room_id = ConversationId("room:world:lobby".into());
    let before = runtime.timeline_store.recent_messages(&room_id, 64).len();

    let room_error = runtime
        .send_cli_message(CliSendRequest {
            from: "user:访客".into(),
            to: "room:world:lobby".into(),
            text: "visitor should not post".into(),
            client_tag: None,
        })
        .expect_err("visitor CLI room send should be rejected before login");

    assert!(room_error.contains("login"));
    assert_eq!(
        runtime.timeline_store.recent_messages(&room_id, 64).len(),
        before
    );

    let direct_error = runtime
        .send_cli_message(CliSendRequest {
            from: "user:访客".into(),
            to: "user:rsaga".into(),
            text: "visitor should not DM".into(),
            client_tag: None,
        })
        .expect_err("visitor CLI direct send should be rejected before login");

    assert!(direct_error.contains("login"));
}

#[test]
fn cli_inbox_returns_recent_conversation_summaries_for_identity() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    runtime
        .send_cli_message(CliSendRequest {
            from: "agent:openclaw".into(),
            to: "user:rsaga".into(),
            text: "今晚一起吃饭吗".into(),
            client_tag: Some("openclaw".into()),
        })
        .expect("seed direct message");

    let inbox = runtime
        .cli_inbox_for(&CliAddress::User(IdentityId("rsaga".into())))
        .expect("cli inbox should build");

    assert_eq!(inbox.identity, "user:rsaga");
    assert!(inbox.conversations.iter().any(|conversation| {
        conversation.conversation_id == "dm:openclaw:rsaga"
            && conversation.last_message_preview == "今晚一起吃饭吗"
            && conversation.title == "正在与 openclaw 聊天"
            && conversation.subtitle == "居所直达 · 你与 openclaw"
            && conversation.meta == "消息数：1"
            && conversation.scope == "private"
            && conversation.kind_hint.as_deref() == Some("居所")
            && conversation.list_summary.as_deref()
                == Some("正在与 openclaw 聊天 · 2 人 · 1 条消息")
            && conversation.status_line.as_deref() == Some("居所直达")
            && conversation.chat_status_summary.as_deref() == Some("可直接继续回复")
            && conversation.queue_summary.as_deref()
                == Some("1 条访客提醒待处理 · 1 条巡视提醒待看")
            && conversation.overview_summary.as_deref() == Some("正在与 openclaw 聊天")
            && conversation.context_summary.as_deref()
                == Some("旺财 会帮你记住与 openclaw 的留言和提醒，适合续聊、记任务和直接追问。")
            && conversation.preview_text.as_deref() == Some("今晚一起吃饭吗")
            && conversation
                .last_activity_label
                .as_deref()
                .is_some_and(|value| value.starts_with("openclaw · "))
            && conversation.activity_time_label.is_some()
            && conversation.self_label.as_deref() == Some("rsaga")
            && conversation.peer_label.as_deref() == Some("openclaw")
            && conversation.participant_label.as_deref() == Some("你与 openclaw")
            && conversation.route_label.as_deref() == Some("居所直达")
            && conversation.thread_headline.as_deref() == Some("正在与 openclaw 聊天")
            && conversation.member_count == Some(2)
            && conversation
                .search_terms
                .iter()
                .any(|term| term == "openclaw")
            && conversation.scene_banner.as_deref() == Some("个人房间")
            && conversation.room_variant.as_deref() == Some("private-room-loft")
            && conversation.room_motif.as_deref() == Some("木地板、工作台、沙发与像素人物")
    }));
}

#[test]
fn cli_rooms_lists_visible_room_and_direct_threads() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    runtime
        .send_cli_message(CliSendRequest {
            from: "agent:openclaw".into(),
            to: "user:rsaga".into(),
            text: "今晚一起吃饭吗".into(),
            client_tag: Some("openclaw".into()),
        })
        .expect("seed direct message");

    let rooms = runtime
        .cli_rooms_for(&CliAddress::User(IdentityId("rsaga".into())))
        .expect("cli rooms should build");

    assert!(rooms.entries.iter().any(|entry| {
        entry.conversation_id == "room:world:lobby"
            && entry.kind == "room"
            && entry.scope == "cross_city_shared"
            && entry.title == "世界广场"
            && entry.subtitle.starts_with("最近发言：")
            && entry
                .list_summary
                .as_deref()
                .is_some_and(|value| value.starts_with("世界广场 · "))
            && entry.status_line.as_deref() == Some("跨城共响线")
            && entry.chat_status_summary.as_deref() == Some("群聊当前比较安静")
            && entry.overview_summary.as_deref() == Some("跨城共响回廊 · 群聊")
            && entry.context_summary.as_deref()
                == Some("巡逻犬 会盯住公共提醒和巡视结果，适合看公告、围观和跨城讨论。")
            && entry
                .preview_text
                .as_deref()
                .is_some_and(|value| !value.is_empty())
            && entry
                .last_activity_label
                .as_deref()
                .is_some_and(|value| value.starts_with("builder · "))
            && entry.activity_time_label.as_deref() == Some("5m ago")
            && entry.participant_label.as_deref() == Some("跨城共响回廊")
            && entry.route_label.as_deref() == Some("跨城共响线")
            && entry.thread_headline.as_deref() == Some("跨城共响回廊 · 群聊")
            && entry
                .scene_banner
                .as_deref()
                .is_some_and(|value| !value.is_empty())
            && entry.scene_summary.as_deref() == Some("公共房间 · 公共频道、公告板与像素座位区")
            && entry
                .room_variant
                .as_deref()
                .is_some_and(|value| !value.is_empty())
            && entry.room_motif.as_deref() == Some("公共频道、公告板与像素座位区")
    }));
    assert!(rooms.entries.iter().any(|entry| {
        entry.conversation_id == "dm:openclaw:rsaga"
            && entry.kind == "direct"
            && entry.scope == "private"
            && entry.title == "正在与 openclaw 聊天"
            && entry.subtitle == "居所直达 · 你与 openclaw"
            && entry.list_summary.as_deref() == Some("正在与 openclaw 聊天 · 2 人 · 1 条消息")
            && entry.status_line.as_deref() == Some("居所直达")
            && entry.chat_status_summary.as_deref() == Some("可直接继续回复")
            && entry.queue_summary.as_deref() == Some("1 条访客提醒待处理 · 1 条巡视提醒待看")
            && entry.overview_summary.as_deref() == Some("正在与 openclaw 聊天")
            && entry.context_summary.as_deref()
                == Some("旺财 会帮你记住与 openclaw 的留言和提醒，适合续聊、记任务和直接追问。")
            && entry.preview_text.as_deref() == Some("今晚一起吃饭吗")
            && entry
                .last_activity_label
                .as_deref()
                .is_some_and(|value| value.starts_with("openclaw · "))
            && entry.activity_time_label.is_some()
            && entry.self_label.as_deref() == Some("rsaga")
            && entry.peer_label.as_deref() == Some("openclaw")
            && entry.participant_label.as_deref() == Some("你与 openclaw")
            && entry.route_label.as_deref() == Some("居所直达")
            && entry.thread_headline.as_deref() == Some("正在与 openclaw 聊天")
            && entry.scene_banner.as_deref() == Some("个人房间")
            && entry.room_variant.as_deref() == Some("private-room-loft")
            && entry.room_motif.as_deref() == Some("木地板、工作台、沙发与像素人物")
    }));
}

#[test]
fn cli_rooms_for_admin_identity_include_seeded_governance_room() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    let rooms = runtime
        .cli_rooms_for(&CliAddress::User(IdentityId("rsaga".into())))
        .expect("cli rooms should build");

    assert!(rooms.entries.iter().any(|entry| {
        entry.conversation_id == "room:city:aurora-hub:announcements"
            && entry.kind == "room"
            && entry.title == "城主告示"
    }));
}

#[test]
fn cli_rooms_include_participant_visible_private_room_threads() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    runtime
        .timeline_store
        .upsert_conversation(Conversation {
            conversation_id: ConversationId("room:city:delta-hub:war-room".into()),
            kind: ConversationKind::Room,
            scope: ConversationScope::CityPrivate,
            scene: Some(GatewayRuntime::default_public_room_scene(
                "shared",
                "channel",
                "城邦门牌 · city:delta-hub:war-room",
            )),
            content_topic: transport_waku::WakuFrameCodec::content_topic_for(&ConversationId(
                "room:city:delta-hub:war-room".into(),
            )),
            participants: vec![IdentityId("rsaga".into()), IdentityId("builder".into())],
            created_at_ms: GatewayRuntime::now_ms(),
            last_active_at_ms: GatewayRuntime::now_ms(),
        })
        .expect("insert participant-visible private room");

    let rooms = runtime
        .cli_rooms_for(&CliAddress::User(IdentityId("rsaga".into())))
        .expect("cli rooms should build");

    assert!(rooms.entries.iter().any(|entry| {
        entry.conversation_id == "room:city:delta-hub:war-room"
            && entry.kind == "room"
            && entry.title == "城邦门牌 · city:delta-hub:war-room"
    }));
}

#[test]
fn cli_inbox_uses_last_message_preview_instead_of_full_body() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    runtime
        .send_cli_message(CliSendRequest {
            from: "agent:openclaw".into(),
            to: "user:rsaga".into(),
            text: "第一行\n第二行".into(),
            client_tag: Some("openclaw".into()),
        })
        .expect("seed direct message");

    let inbox = runtime
        .cli_inbox_for(&CliAddress::User(IdentityId("rsaga".into())))
        .expect("cli inbox should build");
    let json = serde_json::to_string(&inbox).expect("serialize cli inbox");

    assert!(json.contains("last_message_preview"));
    assert!(!json.contains("plain_text"));
}

#[test]
fn cli_tail_returns_recent_messages_for_explicit_conversation() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let response = runtime
        .send_cli_message(CliSendRequest {
            from: "agent:openclaw".into(),
            to: "user:rsaga".into(),
            text: "今晚一起吃饭吗".into(),
            client_tag: Some("openclaw".into()),
        })
        .expect("seed direct message");

    let tail = runtime
        .cli_tail_for(
            &CliAddress::User(IdentityId("rsaga".into())),
            Some(&ConversationId(response.conversation_id.clone())),
        )
        .expect("cli tail should build");

    assert_eq!(tail.conversation_id, "dm:openclaw:rsaga");
    assert_eq!(tail.title, "正在与 openclaw 聊天");
    assert_eq!(tail.subtitle, "居所直达 · 你与 openclaw");
    assert_eq!(tail.meta, "消息数：1");
    assert_eq!(tail.kind, "direct");
    assert_eq!(tail.scope, "private");
    assert_eq!(tail.kind_hint.as_deref(), Some("居所"));
    assert_eq!(
        tail.list_summary.as_deref(),
        Some("正在与 openclaw 聊天 · 2 人 · 1 条消息")
    );
    assert_eq!(tail.status_line.as_deref(), Some("居所直达"));
    assert_eq!(tail.chat_status_summary.as_deref(), Some("可直接继续回复"));
    assert_eq!(
        tail.queue_summary.as_deref(),
        Some("1 条访客提醒待处理 · 1 条巡视提醒待看")
    );
    assert_eq!(
        tail.overview_summary.as_deref(),
        Some("正在与 openclaw 聊天")
    );
    assert_eq!(
        tail.context_summary.as_deref(),
        Some("旺财 会帮你记住与 openclaw 的留言和提醒，适合续聊、记任务和直接追问。")
    );
    assert_eq!(tail.preview_text.as_deref(), Some("今晚一起吃饭吗"));
    assert!(
        tail.last_activity_label
            .as_deref()
            .is_some_and(|value| value.starts_with("openclaw · "))
    );
    assert!(tail.activity_time_label.is_some());
    assert_eq!(tail.self_label.as_deref(), Some("rsaga"));
    assert_eq!(tail.peer_label.as_deref(), Some("openclaw"));
    assert_eq!(tail.participant_label.as_deref(), Some("你与 openclaw"));
    assert_eq!(tail.route_label.as_deref(), Some("居所直达"));
    assert_eq!(
        tail.thread_headline.as_deref(),
        Some("正在与 openclaw 聊天")
    );
    assert_eq!(tail.member_count, Some(2));
    assert!(tail.search_terms.iter().any(|term| term == "openclaw"));
    assert_eq!(tail.scene_banner.as_deref(), Some("个人房间"));
    assert_eq!(tail.room_variant.as_deref(), Some("private-room-loft"));
    assert_eq!(
        tail.room_motif.as_deref(),
        Some("木地板、工作台、沙发与像素人物")
    );
    assert_eq!(
        tail.caretaker
            .as_ref()
            .map(|caretaker| caretaker.name.as_str()),
        Some("旺财")
    );
    assert_eq!(
        tail.detail_card
            .as_ref()
            .map(|detail_card| detail_card.summary_title.as_str()),
        Some("住宅私聊 / 房内状态")
    );
    assert!(tail.workflow.is_none());
    assert!(tail.inline_actions.is_empty());
    assert_eq!(tail.messages.len(), 1);
    assert_eq!(tail.messages[0].text, "今晚一起吃饭吗");
}

#[test]
fn cli_tail_defaults_to_identity_inbox_when_conversation_missing() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    runtime
        .send_cli_message(CliSendRequest {
            from: "agent:openclaw".into(),
            to: "user:rsaga".into(),
            text: "今晚一起吃饭吗".into(),
            client_tag: Some("openclaw".into()),
        })
        .expect("seed direct message");

    let tail = runtime
        .cli_tail_for(&CliAddress::User(IdentityId("rsaga".into())), None)
        .expect("cli tail should default");

    assert_eq!(tail.conversation_id, "dm:openclaw:rsaga");
    assert_eq!(tail.title, "正在与 openclaw 聊天");
    assert_eq!(tail.subtitle, "居所直达 · 你与 openclaw");
    assert_eq!(tail.kind, "direct");
    assert_eq!(tail.scope, "private");
    assert_eq!(
        tail.list_summary.as_deref(),
        Some("正在与 openclaw 聊天 · 2 人 · 1 条消息")
    );
    assert_eq!(tail.status_line.as_deref(), Some("居所直达"));
    assert_eq!(tail.chat_status_summary.as_deref(), Some("可直接继续回复"));
    assert_eq!(
        tail.queue_summary.as_deref(),
        Some("1 条访客提醒待处理 · 1 条巡视提醒待看")
    );
    assert_eq!(
        tail.overview_summary.as_deref(),
        Some("正在与 openclaw 聊天")
    );
    assert_eq!(
        tail.context_summary.as_deref(),
        Some("旺财 会帮你记住与 openclaw 的留言和提醒，适合续聊、记任务和直接追问。")
    );
    assert_eq!(tail.preview_text.as_deref(), Some("今晚一起吃饭吗"));
    assert!(
        tail.last_activity_label
            .as_deref()
            .is_some_and(|value| value.starts_with("openclaw · "))
    );
    assert!(tail.activity_time_label.is_some());
    assert_eq!(tail.self_label.as_deref(), Some("rsaga"));
    assert_eq!(tail.peer_label.as_deref(), Some("openclaw"));
    assert_eq!(tail.participant_label.as_deref(), Some("你与 openclaw"));
    assert_eq!(tail.route_label.as_deref(), Some("居所直达"));
    assert_eq!(
        tail.thread_headline.as_deref(),
        Some("正在与 openclaw 聊天")
    );
    assert_eq!(tail.scene_banner.as_deref(), Some("个人房间"));
    assert_eq!(tail.room_variant.as_deref(), Some("private-room-loft"));
    assert_eq!(
        tail.room_motif.as_deref(),
        Some("木地板、工作台、沙发与像素人物")
    );
    assert!(
        tail.messages
            .iter()
            .any(|message| message.text == "今晚一起吃饭吗")
    );
}

#[test]
fn cli_tail_rejects_explicit_conversation_not_visible_to_identity() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let response = runtime
        .send_cli_message(CliSendRequest {
            from: "agent:openclaw".into(),
            to: "user:rsaga".into(),
            text: "今晚一起吃饭吗".into(),
            client_tag: Some("openclaw".into()),
        })
        .expect("seed direct message");

    let error = runtime
        .cli_tail_for(
            &CliAddress::User(IdentityId("lisi".into())),
            Some(&ConversationId(response.conversation_id)),
        )
        .expect_err("explicit invisible conversation should fail");

    assert!(error.contains("is not visible"));
}

#[test]
fn cli_rooms_hide_non_discoverable_city_room_from_outsiders() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    runtime
        .create_city(CreateCityRequest {
            slug: Some("hidden-harbor".into()),
            title: "Hidden Harbor".into(),
            description: "hidden city for cli visibility test".into(),
            lord_id: "warden".into(),
            approval_required: Some(false),
            public_room_discovery_enabled: Some(false),
            federation_policy: None,
        })
        .expect("create city");

    let room = runtime
        .create_public_room(CreatePublicRoomRequest {
            city: "hidden-harbor".into(),
            title: "Hidden Room".into(),
            slug: Some("hidden-room".into()),
            description: "not discoverable".into(),
            creator_id: "warden".into(),
        })
        .expect("create hidden room");

    let outsider_rooms = runtime
        .cli_rooms_for(&CliAddress::User(IdentityId("outsider".into())))
        .expect("build outsider rooms");
    assert!(
        outsider_rooms
            .entries
            .iter()
            .all(|entry| entry.conversation_id != room.room_id.0)
    );

    let lord_rooms = runtime
        .cli_rooms_for(&CliAddress::User(IdentityId("warden".into())))
        .expect("build lord rooms");
    assert!(
        lord_rooms
            .entries
            .iter()
            .any(|entry| entry.conversation_id == room.room_id.0)
    );
}

#[test]
fn split_path_and_query_decodes_percent_escaped_components() {
    let (_, params) = crate::http_support::split_path_and_query(
        "/v1/cli/tail?for=agent%3Acodex&conversation_id=dm%3Aopenclaw%3Arsaga",
    );

    assert_eq!(params.get("for").map(String::as_str), Some("agent:codex"));
    assert_eq!(
        params.get("conversation_id").map(String::as_str),
        Some("dm:openclaw:rsaga")
    );
}

#[test]
fn cli_missing_for_body_uses_message_shape() {
    assert_eq!(
        crate::http_support::cli_missing_for_body(),
        "{\"message\":\"missing for\"}"
    );
}

#[test]
fn world_steward_can_publish_notice_and_quarantine_city() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    let notice = runtime
        .publish_world_notice(PublishWorldNoticeRequest {
            actor_id: "rsaga".into(),
            title: "Mirror sync window".into(),
            body: "World Square mirrors will roll over at dusk.".into(),
            severity: Some("warning".into()),
            tags: Some(vec!["world".into(), "mirror".into()]),
        })
        .expect("publish notice");
    assert_eq!(notice.severity, "warning");

    let trust = runtime
        .update_city_trust(UpdateCityTrustRequest {
            actor_id: "rsaga".into(),
            city: "core-harbor".into(),
            state: CityTrustState::UnderReview,
            reason: Some("federation anomaly".into()),
        })
        .expect("update city trust");
    assert_eq!(trust.state, CityTrustState::UnderReview);
    assert!(!runtime.safety_advisories.is_empty());

    let safety = runtime.federation_read_plan().world_safety_snapshot();
    assert!(safety.stewards.contains(&"rsaga".into()));
    assert!(
        safety
            .advisories
            .iter()
            .any(|item| item.subject_ref == "city:core-harbor")
    );
}

#[test]
fn governance_http_routes_roundtrip_world_notice_report_review_advisory_and_sanction() {
    let temp = tempdir().expect("temp dir");
    let runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
    let server = start_local_gateway_http_server(runtime);

    let (notice_status, notice) = http_json(
        "POST",
        &server.base_url,
        "/v1/world-square/notices",
        Some(&serde_json::json!({
            "actor_id": "rsaga",
            "title": "维护窗口",
            "body": "今晚世界广场镜像短暂停机。",
            "severity": "warning",
            "tags": ["world", "maintenance"]
        })),
    );
    assert_eq!(notice_status, 200);
    assert_eq!(notice["title"], "维护窗口");
    assert_eq!(notice["severity"], "warning");

    let (report_status, report) = http_json(
        "POST",
        &server.base_url,
        "/v1/world-safety/reports",
        Some(&serde_json::json!({
            "reporter_id": "builder",
            "city": "core-harbor",
            "target_kind": "room",
            "target_ref": "room:city:core-harbor:lobby",
            "summary": "公共房间出现诈骗链接。",
            "evidence": ["https://example.invalid/evidence"]
        })),
    );
    assert_eq!(report_status, 200);
    assert_eq!(report["status"], "Submitted");
    let report_id = report["report_id"].as_str().expect("report id").to_string();

    let (review_status, reviewed) = http_json(
        "POST",
        &server.base_url,
        "/v1/world-safety/reports/review",
        Some(&serde_json::json!({
            "actor_id": "rsaga",
            "report_id": report_id,
            "status": "Resolved",
            "resolution": "已核实，隔离复查。",
            "city_state": "Quarantined",
            "cascade_resident_sanctions": false,
            "blacklist_registered_handles": false
        })),
    );
    assert_eq!(review_status, 200);
    assert_eq!(reviewed["status"], "Resolved");
    assert_eq!(reviewed["resolution"], "已核实，隔离复查。");

    let (advisory_status, advisory) = http_json(
        "POST",
        &server.base_url,
        "/v1/world-safety/advisories",
        Some(&serde_json::json!({
            "actor_id": "rsaga",
            "subject_kind": "city",
            "subject_ref": "city:core-harbor",
            "action": "watch",
            "reason": "举报已进入复查。"
        })),
    );
    assert_eq!(advisory_status, 200);
    assert_eq!(advisory["subject_ref"], "city:core-harbor");
    assert_eq!(advisory["action"], "watch");

    let (sanction_status, sanction) = http_json(
        "POST",
        &server.base_url,
        "/v1/world-safety/residents/sanction",
        Some(&serde_json::json!({
            "actor_id": "rsaga",
            "resident_id": "bad-actor",
            "city": "core-harbor",
            "report_id": reviewed["report_id"],
            "reason": "确认重复滥用。",
            "email": "bad.actor@example.com",
            "mobile": "+86 13800138000",
            "device_physical_addresses": ["00:11:22:33:44:55"],
            "portability_revoked": true
        })),
    );
    assert_eq!(sanction_status, 200);
    assert_eq!(sanction["resident_id"], "bad-actor");
    assert_eq!(sanction["status"], "Active");
    assert_eq!(sanction["portability_revoked"], true);

    let (safety_status, safety) = http_json("GET", &server.base_url, "/v1/world-safety", None);
    assert_eq!(safety_status, 200);
    assert!(
        safety["reports"]
            .as_array()
            .expect("reports array")
            .iter()
            .any(|item| item["report_id"] == reviewed["report_id"] && item["status"] == "Resolved")
    );
    assert!(
        safety["advisories"]
            .as_array()
            .expect("advisories array")
            .iter()
            .any(|item| item["subject_ref"] == "city:core-harbor")
    );
    assert!(
        safety["resident_sanctions"]
            .as_array()
            .expect("resident sanctions array")
            .iter()
            .any(|item| item["resident_id"] == "bad-actor" && item["portability_revoked"] == true)
    );
}

#[test]
fn world_directory_snapshot_hides_isolated_cities() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    runtime
        .create_city(CreateCityRequest {
            slug: Some("bad-harbor".into()),
            title: "Bad Harbor".into(),
            description: "temporary city for isolation test".into(),
            lord_id: "warden".into(),
            approval_required: Some(false),
            public_room_discovery_enabled: Some(true),
            federation_policy: None,
        })
        .expect("create city");

    runtime
        .update_city_trust(UpdateCityTrustRequest {
            actor_id: "rsaga".into(),
            city: "bad-harbor".into(),
            state: CityTrustState::Isolated,
            reason: Some("malware distribution".into()),
        })
        .expect("isolate city");

    let directory = runtime.federation_read_plan().world_directory_snapshot();
    assert!(
        directory
            .cities
            .iter()
            .all(|city| city.slug != "bad-harbor")
    );
    assert!(
        directory
            .mirrors
            .iter()
            .any(|mirror| mirror.slug == "bad-harbor" && !mirror.mirror_enabled)
    );
}

#[test]
fn resident_report_can_trigger_quarantine_and_hide_city() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    runtime
        .create_city(CreateCityRequest {
            slug: Some("bad-harbor".into()),
            title: "Bad Harbor".into(),
            description: "temporary city for safety report test".into(),
            lord_id: "warden".into(),
            approval_required: Some(false),
            public_room_discovery_enabled: Some(true),
            federation_policy: None,
        })
        .expect("create city");

    let report = runtime
        .submit_safety_report(SubmitSafetyReportRequest {
            reporter_id: "guest-01".into(),
            city: Some("bad-harbor".into()),
            target_kind: "room".into(),
            target_ref: "room:city:bad-harbor:lobby".into(),
            summary: "public room is broadcasting illegal scam links".into(),
            evidence: Some(vec!["https://example.invalid/evidence".into()]),
        })
        .expect("submit safety report");
    assert_eq!(report.status, WorldSafetyReportStatus::Submitted);

    let reviewed = runtime
        .review_safety_report(ReviewSafetyReportRequest {
            actor_id: "rsaga".into(),
            report_id: report.report_id.clone(),
            status: WorldSafetyReportStatus::Resolved,
            resolution: Some("confirmed abuse; quarantine city".into()),
            city_state: Some(CityTrustState::Quarantined),
            cascade_resident_sanctions: None,
            blacklist_registered_handles: None,
        })
        .expect("review safety report");
    assert_eq!(reviewed.status, WorldSafetyReportStatus::Resolved);

    let safety = runtime.federation_read_plan().world_safety_snapshot();
    assert!(
        safety
            .reports
            .iter()
            .any(|item| item.report_id == report.report_id && item.reviewed_by.is_some())
    );
    assert!(safety.city_trust.iter().any(
        |item| item.city_id.0 == "city:bad-harbor" && item.state == CityTrustState::Quarantined
    ));

    let directory = runtime.federation_read_plan().world_directory_snapshot();
    assert!(
        directory
            .cities
            .iter()
            .all(|city| city.slug != "bad-harbor")
    );
    assert!(
        directory
            .mirrors
            .iter()
            .any(|mirror| mirror.slug == "bad-harbor" && !mirror.mirror_enabled)
    );
}

#[test]
fn isolated_city_can_cascade_resident_ban_and_blacklist_handles() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    runtime
        .request_email_otp(RequestEmailOtpRequest {
            email: "tiyan@example.com".into(),
            mobile: Some("+86 13800138001".into()),
            device_physical_address: Some("AA:BB:CC:DD:EE:01".into()),
            resident_id: Some("tiyan".into()),
        })
        .and_then(|response| {
            runtime.verify_email_otp(VerifyEmailOtpRequest {
                challenge_id: response.challenge_id,
                code: response.dev_code.expect("dev otp"),
                resident_id: Some("tiyan".into()),
            })
        })
        .expect("register tiyann");

    runtime
        .create_city(CreateCityRequest {
            slug: Some("evil-harbor".into()),
            title: "Evil Harbor".into(),
            description: "temporary city for isolation cascade test".into(),
            lord_id: "warden".into(),
            approval_required: Some(false),
            public_room_discovery_enabled: Some(true),
            federation_policy: None,
        })
        .expect("create city");

    runtime
        .join_city(JoinCityRequest {
            city: "evil-harbor".into(),
            resident_id: "tiyan".into(),
        })
        .expect("join city");

    let report = runtime
        .submit_safety_report(SubmitSafetyReportRequest {
            reporter_id: "builder".into(),
            city: Some("evil-harbor".into()),
            target_kind: "city".into(),
            target_ref: "city:evil-harbor".into(),
            summary: "city is coordinating serious illegal abuse".into(),
            evidence: Some(vec!["https://example.invalid/abuse".into()]),
        })
        .expect("submit report");

    runtime
        .review_safety_report(ReviewSafetyReportRequest {
            actor_id: "rsaga".into(),
            report_id: report.report_id.clone(),
            status: WorldSafetyReportStatus::Resolved,
            resolution: Some("confirmed severe abuse; isolate city and burn handles".into()),
            city_state: Some(CityTrustState::Isolated),
            cascade_resident_sanctions: Some(true),
            blacklist_registered_handles: Some(true),
        })
        .expect("review report");

    let safety = runtime.federation_read_plan().world_safety_snapshot();
    assert!(
        safety
            .resident_sanctions
            .iter()
            .any(|item| item.resident_id.0 == "tiyan" && item.portability_revoked)
    );
    assert!(
        safety
            .registration_blacklist
            .iter()
            .any(|item| item.resident_id.0 == "tiyan" && item.handle_kind == "email")
    );
    assert!(
        safety
            .registration_blacklist
            .iter()
            .any(|item| item.resident_id.0 == "tiyan" && item.handle_kind == "mobile")
    );
    assert!(
        runtime
            .registrations
            .iter()
            .any(|item| item.resident_id.0 == "tiyan"
                && item.state == ResidentRegistrationState::Suspended)
    );

    let preflight = runtime
        .auth_preflight(AuthPreflightRequest {
            email: "tiyan@example.com".into(),
            mobile: Some("+86 13800138001".into()),
            device_physical_address: Some("AA-BB-CC-DD-EE-01".into()),
        })
        .expect("preflight");
    assert!(!preflight.allowed);
    assert!(
        preflight
            .blocked_reasons
            .iter()
            .any(|item| item.contains("device physical address"))
    );

    let join_err = runtime
        .join_city(JoinCityRequest {
            city: "core-harbor".into(),
            resident_id: "tiyan".into(),
        })
        .expect_err("isolated city resident should lose cross-city portability");
    assert!(join_err.contains("world-banned"));
}

#[test]
fn world_banned_resident_is_blocked_from_cross_city_join_and_handles_are_hashed() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    runtime
        .create_city(CreateCityRequest {
            slug: Some("south-harbor".into()),
            title: "South Harbor".into(),
            description: "temporary city for sanction test".into(),
            lord_id: "harbormaster".into(),
            approval_required: Some(false),
            public_room_discovery_enabled: Some(true),
            federation_policy: None,
        })
        .expect("create city");

    let sanction = runtime
        .sanction_resident(SanctionResidentRequest {
            actor_id: "rsaga".into(),
            resident_id: "bad-actor".into(),
            city: Some("south-harbor".into()),
            report_id: Some("report:test".into()),
            reason: "confirmed organized scam operation".into(),
            email: Some("Bad.Actor@example.com".into()),
            mobile: Some("+86 138-0013-8000".into()),
            device_physical_addresses: Some(vec!["00:11:22:33:44:55".into()]),
            portability_revoked: Some(true),
        })
        .expect("sanction resident");
    assert_eq!(sanction.status, WorldResidentSanctionStatus::Active);
    assert!(sanction.portability_revoked);

    let safety = runtime.federation_read_plan().world_safety_snapshot();
    assert!(
        safety
            .resident_sanctions
            .iter()
            .any(|item| item.resident_id.0 == "bad-actor")
    );
    assert_eq!(safety.registration_blacklist.len(), 3);
    assert!(
        safety
            .registration_blacklist
            .iter()
            .all(|item| !item.hash_sha256.is_empty())
    );
    assert!(
        safety
            .registration_blacklist
            .iter()
            .all(|item| item.hash_sha256 != "Bad.Actor@example.com")
    );

    let err = runtime
        .join_city(JoinCityRequest {
            city: "core-harbor".into(),
            resident_id: "bad-actor".into(),
        })
        .expect_err("world-banned resident should be blocked");
    assert!(err.contains("world-banned"));
}

#[test]
fn email_otp_registration_roundtrip_creates_persisted_resident() {
    let temp = tempdir().expect("temp dir");
    let root = temp.path().join("gateway");

    let response = {
        let mut runtime = GatewayRuntime::open(&root, 64, None).expect("runtime");
        runtime
            .request_email_otp(RequestEmailOtpRequest {
                email: "novel.reader@example.com".into(),
                mobile: Some("+86 13800138000".into()),
                device_physical_address: Some("66:55:44:33:22:11".into()),
                resident_id: Some("novel-reader".into()),
            })
            .expect("request email otp")
    };

    let dev_code = response.dev_code.expect("test mode should expose dev otp");
    {
        let mut runtime = GatewayRuntime::open(&root, 64, None).expect("runtime");
        let verified = runtime
            .verify_email_otp(VerifyEmailOtpRequest {
                challenge_id: response.challenge_id,
                code: dev_code,
                resident_id: Some("novel-reader".into()),
            })
            .expect("verify email otp");
        assert_eq!(verified.resident_id, "novel-reader");
        assert_eq!(verified.email, "novel.reader@example.com");
    }

    let runtime = GatewayRuntime::open(&root, 64, None).expect("runtime");
    assert!(runtime.registrations.iter().any(
        |item| item.resident_id.0 == "novel-reader" && item.email == "novel.reader@example.com"
    ));
}

#[test]
fn request_email_otp_replaces_prior_active_challenge_for_same_email() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    let first = runtime
        .request_email_otp(RequestEmailOtpRequest {
            email: "swap@example.com".into(),
            mobile: Some("+86 13800138000".into()),
            device_physical_address: Some("66:55:44:33:22:11".into()),
            resident_id: Some("swap-reader".into()),
        })
        .expect("first email otp request");
    let second = runtime
        .request_email_otp(RequestEmailOtpRequest {
            email: "swap@example.com".into(),
            mobile: Some("+86 13800138000".into()),
            device_physical_address: Some("66:55:44:33:22:11".into()),
            resident_id: Some("swap-reader".into()),
        })
        .expect("second email otp request");

    assert_eq!(runtime.email_otp_challenges.len(), 1);
    assert_eq!(
        runtime.email_otp_challenges[0].challenge_id,
        second.challenge_id
    );
    assert_ne!(first.challenge_id, second.challenge_id);
}

#[test]
fn email_otp_verification_seeds_canonical_guide_direct_conversation() {
    let temp = tempdir().expect("temp dir");
    let root = temp.path().join("gateway");

    let challenge = {
        let mut runtime = GatewayRuntime::open(&root, 64, None).expect("runtime");
        runtime
            .request_email_otp(RequestEmailOtpRequest {
                email: "tiyan@example.com".into(),
                mobile: Some("+86 13800138000".into()),
                device_physical_address: Some("66:55:44:33:22:11".into()),
                resident_id: Some("tiyan".into()),
            })
            .expect("request email otp")
    };

    {
        let mut runtime = GatewayRuntime::open(&root, 64, None).expect("runtime");
        runtime
            .verify_email_otp(VerifyEmailOtpRequest {
                challenge_id: challenge.challenge_id,
                code: challenge.dev_code.expect("dev otp"),
                resident_id: Some("tiyan".into()),
            })
            .expect("verify email otp");
    }

    let runtime = GatewayRuntime::open(&root, 64, None).expect("runtime");
    let expected_id =
        canonical_direct_conversation_id(&IdentityId("guide".into()), &IdentityId("tiyan".into()));
    let conversation = runtime
        .timeline_store
        .active_conversations()
        .into_iter()
        .find(|item| item.conversation_id == expected_id)
        .expect("guide direct conversation should exist");

    assert_eq!(conversation.kind, ConversationKind::Direct);
    assert_eq!(conversation.scope, ConversationScope::Private);
    assert_eq!(conversation.conversation_id, expected_id);
    assert_eq!(conversation.participants.len(), 2);
    assert!(
        conversation
            .participants
            .iter()
            .any(|participant| participant.0 == "tiyan")
    );
    assert!(
        conversation
            .participants
            .iter()
            .any(|participant| participant.0 == "guide")
    );
    let scene = conversation.scene.as_ref().expect("direct scene");
    assert_eq!(scene.scope, SceneScope::DirectRoom);
    assert_eq!(scene.title_banner.as_deref(), Some("个人房间"));
}

#[test]
fn join_city_rejects_unregistered_resident() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    let err = runtime
        .join_city(JoinCityRequest {
            city: "core-harbor".into(),
            resident_id: "guest-01".into(),
        })
        .expect_err("unregistered resident should not join");
    assert!(err.contains("not registered"));
}

#[test]
fn blacklisted_handles_are_rejected_during_auth_preflight_and_otp_issue() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    runtime
        .sanction_resident(SanctionResidentRequest {
            actor_id: "rsaga".into(),
            resident_id: "repeat-offender".into(),
            city: Some("core-harbor".into()),
            report_id: Some("report:blacklist".into()),
            reason: "repeat harassment".into(),
            email: Some("blocked@example.com".into()),
            mobile: Some("+86 13900000000".into()),
            device_physical_addresses: Some(vec!["00-22-44-66-88-AA".into()]),
            portability_revoked: Some(true),
        })
        .expect("sanction resident");

    let preflight = runtime
        .auth_preflight(AuthPreflightRequest {
            email: "blocked@example.com".into(),
            mobile: Some("+86 13900000000".into()),
            device_physical_address: Some("00:22:44:66:88:aa".into()),
        })
        .expect("auth preflight");
    assert!(!preflight.allowed);
    assert_eq!(preflight.blocked_reasons.len(), 3);

    let err = runtime
        .request_email_otp(RequestEmailOtpRequest {
            email: "blocked@example.com".into(),
            mobile: Some("+86 13900000000".into()),
            device_physical_address: Some("00:22:44:66:88:AA".into()),
            resident_id: Some("new-handle".into()),
        })
        .expect_err("blacklisted handles should not receive otp");
    assert!(err.contains("blacklisted"));
}

#[test]
fn world_snapshot_bundle_exposes_checksum_and_payload() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    let before = runtime.federation_read_plan().world_snapshot_bundle();
    assert_eq!(before.meta.world_id, "world:lobster");
    assert!(!before.meta.checksum_sha256.is_empty());
    assert!(before.payload.directory.city_count >= 1);
    assert!(!before.payload.square.is_empty());

    runtime
        .publish_world_notice(PublishWorldNoticeRequest {
            actor_id: "rsaga".into(),
            title: "Fresh notice".into(),
            body: "Mirror bundle changed.".into(),
            severity: Some("info".into()),
            tags: Some(vec!["snapshot".into()]),
        })
        .expect("publish notice");

    let after = runtime.federation_read_plan().world_snapshot_bundle();
    assert_ne!(before.meta.checksum_sha256, after.meta.checksum_sha256);
    assert!(
        after
            .payload
            .square
            .iter()
            .any(|notice| notice.title == "Fresh notice")
    );
}

#[test]
fn world_square_http_handler_returns_readonly_notice_feed() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    runtime
        .publish_world_notice(PublishWorldNoticeRequest {
            actor_id: "rsaga".into(),
            title: "Public square notice".into(),
            body: "Readonly cards can project this notice without becoming chat state.".into(),
            severity: Some("info".into()),
            tags: Some(vec!["world-square".into(), "readonly".into()]),
        })
        .expect("publish notice");

    let runtime = Arc::new(Mutex::new(runtime));
    let response = handle_get_world_square(&runtime);
    assert_eq!(response.status_code(), StatusCode(200));

    let mut body = String::new();
    response
        .into_reader()
        .read_to_string(&mut body)
        .expect("read response body");
    let payload: Vec<WorldSquareNotice> =
        serde_json::from_str(&body).expect("world-square notice json");

    assert!(
        payload
            .iter()
            .any(|notice| notice.title == "Public square notice"
                && notice.body.contains("Readonly cards")
                && notice.tags.iter().any(|tag| tag == "readonly")),
        "world-square should expose published notices as a readonly feed"
    );
}

#[test]
fn world_entry_state_projects_directory_into_route_cards() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    runtime
        .create_city(CreateCityRequest {
            slug: Some("signal-bay".into()),
            title: "Signal Bay".into(),
            description: "A visible city route for the world entry station".into(),
            lord_id: "alice".into(),
            approval_required: Some(false),
            public_room_discovery_enabled: Some(true),
            federation_policy: None,
        })
        .expect("create city");

    let entry = runtime.world_entry_state();

    assert_eq!(entry.title, "世界入口");
    assert_eq!(entry.station_label, "地铁候车站");
    assert_eq!(entry.current_city_slug, "core-harbor");
    assert!(entry.route_count >= 2);

    let signal = entry
        .routes
        .iter()
        .find(|route| route.slug == "signal-bay")
        .expect("signal bay route");
    assert_eq!(signal.title, "Signal Bay");
    assert_eq!(signal.href, "./index.html?city=signal-bay");
    assert_eq!(signal.status_label, "健康 · 可镜像");
    assert!(!signal.is_current);

    let current = entry
        .routes
        .iter()
        .find(|route| route.slug == "core-harbor")
        .expect("current city route");
    assert_eq!(current.href, "./index.html");
    assert!(current.is_current);
}

#[test]
fn world_entry_http_handler_returns_route_projection() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    runtime
        .create_city(CreateCityRequest {
            slug: Some("signal-bay".into()),
            title: "Signal Bay".into(),
            description: "A visible city route for the world entry station".into(),
            lord_id: "alice".into(),
            approval_required: Some(false),
            public_room_discovery_enabled: Some(true),
            federation_policy: None,
        })
        .expect("create city");

    let runtime = Arc::new(Mutex::new(runtime));
    let response = handle_get_world_entry(&runtime);
    assert_eq!(response.status_code(), StatusCode(200));

    let mut body = String::new();
    response
        .into_reader()
        .read_to_string(&mut body)
        .expect("read response body");
    let payload: serde_json::Value = serde_json::from_str(&body).expect("world-entry json");

    assert_eq!(payload["title"], "世界入口");
    assert_eq!(payload["station_label"], "地铁候车站");
    assert_eq!(payload["current_city_slug"], "core-harbor");
    assert!(
        payload["routes"]
            .as_array()
            .expect("route array")
            .iter()
            .any(|route| route["slug"] == "signal-bay"
                && route["href"] == "./index.html?city=signal-bay"
                && route["status_label"] == "健康 · 可镜像"
                && route["is_current"] == false)
    );
    assert!(
        payload["routes"]
            .as_array()
            .expect("route array")
            .iter()
            .any(|route| route["slug"] == "core-harbor"
                && route["href"] == "./index.html"
                && route["is_current"] == true)
    );
}

#[test]
fn world_snapshot_bundle_fetches_each_upstream_bundle_only_once() {
    let temp = tempdir().expect("temp dir");
    let (base_url, state, running, handle) = start_mock_upstream_gateway();

    let outcome = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        let mut local =
            GatewayRuntime::open(temp.path().join("local-gateway"), 64, None).expect("local");
        local
            .publish_world_notice(PublishWorldNoticeRequest {
                actor_id: "rsaga".into(),
                title: "Local notice".into(),
                body: "local".into(),
                severity: Some("info".into()),
                tags: Some(vec!["local".into()]),
            })
            .expect("publish local notice");
        let remote_bundle = local.federation_read_plan().world_snapshot_bundle();
        {
            let mut shared = state.lock().expect("lock mock upstream state");
            shared.world_snapshot_bundle = Some(remote_bundle.clone());
            shared.governance_snapshot = Some(remote_bundle.payload.governance.clone());
        }

        let mut runtime =
            GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
        runtime
            .set_upstream_provider_url(Some(base_url.clone()))
            .expect("set upstream provider");

        let _ = runtime.federation_read_plan().world_snapshot_bundle();

        let shared = state.lock().expect("lock mock upstream state");
        assert_eq!(
            shared.world_snapshot_request_count, 1,
            "world_snapshot_bundle should reuse a single upstream world snapshot fetch",
        );
        assert_eq!(
            shared.world_request_count, 0,
            "world_snapshot_bundle should not fall back to /v1/world when /v1/world-snapshot succeeds",
        );
    }));

    running.store(false, Ordering::SeqCst);
    let _ = TcpStream::connect(base_url.trim_start_matches("http://"));
    handle.join().expect("stop mock upstream gateway");
    outcome.expect("world snapshot bundle should fetch upstream once");
}

#[test]
fn federation_read_plan_world_snapshot_bundle_fetches_upstream_once() {
    let temp = tempdir().expect("temp dir");
    let (base_url, state, running, handle) = start_mock_upstream_gateway();

    let outcome = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        let mut local =
            GatewayRuntime::open(temp.path().join("local-gateway"), 64, None).expect("local");
        local
            .publish_world_notice(PublishWorldNoticeRequest {
                actor_id: "rsaga".into(),
                title: "Local notice".into(),
                body: "local".into(),
                severity: Some("info".into()),
                tags: Some(vec!["local".into()]),
            })
            .expect("publish local notice");
        let remote_bundle = local.federation_read_plan().world_snapshot_bundle();
        {
            let mut shared = state.lock().expect("lock mock upstream state");
            shared.world_snapshot_bundle = Some(remote_bundle.clone());
            shared.governance_snapshot = Some(remote_bundle.payload.governance.clone());
        }

        let mut runtime =
            GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");
        runtime
            .set_upstream_provider_url(Some(base_url.clone()))
            .expect("set upstream provider");

        let read_plan = runtime.federation_read_plan();
        let _ = read_plan.world_snapshot_bundle();

        let shared = state.lock().expect("lock mock upstream state");
        assert_eq!(
            shared.world_snapshot_request_count, 1,
            "federation read plan should fetch upstream world snapshot once",
        );
    }));

    running.store(false, Ordering::SeqCst);
    let _ = TcpStream::connect(base_url.trim_start_matches("http://"));
    handle.join().expect("stop mock upstream gateway");
    outcome.expect("federation read plan world snapshot should fetch upstream once");
}

#[test]
fn lord_can_mark_city_as_self_isolated_without_world_quarantine() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    let city = runtime
        .update_federation_policy(UpdateFederationPolicyRequest {
            city: "core-harbor".into(),
            actor_id: "rsaga".into(),
            policy: FederationPolicy::Isolated,
        })
        .expect("update federation policy");

    assert_eq!(city.profile.federation_policy, FederationPolicy::Isolated);

    let directory = runtime.federation_read_plan().world_directory_snapshot();
    let mirror = directory
        .mirrors
        .iter()
        .find(|mirror| mirror.slug == "core-harbor")
        .expect("core harbor mirror");
    assert!(!mirror.mirror_enabled);

    let trusted = runtime
        .city_trust
        .iter()
        .find(|record| record.city_id.0 == "city:core-harbor")
        .expect("trust record");
    assert_eq!(trusted.state, CityTrustState::Healthy);
}

#[test]
fn resident_can_export_private_and_public_history() {
    let temp = tempdir().expect("temp dir");
    let mut runtime = GatewayRuntime::open(temp.path().join("gateway"), 64, None).expect("runtime");

    register_resident(&mut runtime, "guest-03");
    runtime
        .join_city(JoinCityRequest {
            city: "core-harbor".into(),
            resident_id: "guest-03".into(),
        })
        .expect("join core harbor");

    runtime
        .append_shell_message(ShellMessageRequest {
            room_id: "room:city:core-harbor:lobby".into(),
            sender: "guest-03".into(),
            text: "public hello".into(),
            reply_to_message_id: None,
            device_id: Some("browser".into()),
            language_tag: Some("en".into()),
        })
        .expect("append public message");

    runtime
        .open_direct_session(OpenDirectSessionRequest {
            requester_id: "guest-03".into(),
            requester_device_id: Some("browser".into()),
            peer_id: "rsaga".into(),
            peer_device_id: Some("desktop-1".into()),
        })
        .expect("open direct session");

    runtime
        .append_shell_message(ShellMessageRequest {
            room_id: "dm:guest-03:rsaga".into(),
            sender: "guest-03".into(),
            text: "private hello".into(),
            reply_to_message_id: None,
            device_id: Some("browser".into()),
            language_tag: Some("en".into()),
        })
        .expect("append private message");

    let export = runtime
        .export_history(
            IdentityId("guest-03".into()),
            None,
            ExportFormat::Markdown,
            true,
        )
        .expect("export history");

    let guide_conversation_id = canonical_direct_conversation_id(
        &IdentityId("guest-03".into()),
        &IdentityId("guide".into()),
    );
    assert_eq!(export.conversation_count, 3);
    assert!(
        export
            .conversations
            .iter()
            .any(|conversation| conversation.conversation_id == guide_conversation_id.0)
    );
    assert!(export.conversations.iter().any(|conversation| {
        conversation.conversation_id == "room:city:core-harbor:lobby"
            && conversation.title == "第一城大厅"
            && conversation.kind == "public"
            && conversation.scope == "city_public"
            && conversation.meta == "消息数：1"
            && conversation.kind_hint.as_deref() == Some("城邦大厅")
            && conversation
                .list_summary
                .as_deref()
                .is_some_and(|value| value.starts_with("第一城大厅 · "))
            && conversation.status_line.as_deref() == Some("城内回响线")
            && conversation.chat_status_summary.as_deref() == Some("群聊当前比较安静")
            && conversation.overview_summary.as_deref() == Some("核心港回声大厅 · 群聊")
            && conversation.context_summary.as_deref()
                == Some("巡逻犬 会盯住公共提醒和巡视结果，适合看公告、围观和跨城讨论。")
            && conversation.preview_text.as_deref() == Some("public hello")
            && conversation
                .last_activity_label
                .as_deref()
                .is_some_and(|value| value.starts_with("guest-03 · "))
            && conversation.activity_time_label.is_some()
            && conversation.participant_label.as_deref() == Some("核心港回声大厅")
            && conversation
                .scene_banner
                .as_deref()
                .is_some_and(|value| !value.is_empty())
            && conversation.scene_summary.as_deref()
                == Some("公共房间 · 公共频道、公告板与像素座位区")
            && conversation
                .room_variant
                .as_deref()
                .is_some_and(|value| !value.is_empty())
            && conversation.room_motif.as_deref() == Some("公共频道、公告板与像素座位区")
            && conversation.member_count == Some(1)
            && conversation
                .search_terms
                .iter()
                .any(|term| term == "核心港回声大厅")
    }));
    assert!(export.conversations.iter().any(|conversation| {
        conversation.conversation_id == "dm:guest-03:rsaga"
            && conversation.title == "正在与 rsaga 聊天"
            && conversation.kind == "direct"
            && conversation.scope == "private"
            && conversation.meta == "消息数：1"
            && conversation.kind_hint.as_deref() == Some("居所")
            && conversation.list_summary.as_deref() == Some("正在与 rsaga 聊天 · 2 人 · 1 条消息")
            && conversation.status_line.as_deref() == Some("居所直达")
            && conversation.chat_status_summary.as_deref() == Some("可直接继续回复")
            && conversation.queue_summary.as_deref()
                == Some("1 条访客提醒待处理 · 1 条巡视提醒待看")
            && conversation.overview_summary.as_deref() == Some("正在与 rsaga 聊天")
            && conversation.context_summary.as_deref()
                == Some("旺财 会帮你记住与 rsaga 的留言和提醒，适合续聊、记任务和直接追问。")
            && conversation.preview_text.as_deref() == Some("private hello")
            && conversation
                .last_activity_label
                .as_deref()
                .is_some_and(|value| value.starts_with("guest-03 · "))
            && conversation.activity_time_label.is_some()
            && conversation.self_label.as_deref() == Some("guest-03")
            && conversation.peer_label.as_deref() == Some("rsaga")
            && conversation.participant_label.as_deref() == Some("你与 rsaga")
            && conversation.member_count == Some(2)
            && conversation.search_terms.iter().any(|term| term == "rsaga")
            && conversation.scene_banner.as_deref() == Some("个人房间")
            && conversation.room_variant.as_deref() == Some("private-room-loft")
            && conversation.room_motif.as_deref() == Some("木地板、工作台、沙发与像素人物")
            && conversation
                .caretaker
                .as_ref()
                .is_some_and(|caretaker| caretaker.name == "旺财")
            && conversation
                .detail_card
                .as_ref()
                .is_some_and(|detail_card| detail_card.summary_title == "住宅私聊 / 房内状态")
            && conversation.workflow.is_none()
            && conversation.inline_actions.is_empty()
    }));
    assert!(export.content.contains("public hello"));
    assert!(export.content.contains("private hello"));
    assert!(export.rights.may_export_private_conversations);
    assert!(export.rights.may_export_city_public_rooms);
}
