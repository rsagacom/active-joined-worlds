use super::*;
use std::{
    collections::hash_map::DefaultHasher,
    hash::{Hash, Hasher},
    io::{Read, Write},
    net::{TcpListener, TcpStream},
    sync::{
        Arc, Mutex,
        atomic::{AtomicBool, Ordering},
    },
    thread,
    time::{Duration, Instant},
};

use chat_core::{
    ClientProfile, ConversationId, DeviceId, IdentityId, MessageBody, MessageEnvelope, MessageId,
    PayloadType,
};
use tiny_http::Server;

use crate::{
    http_router::dispatch_http_request,
    http_support::{cors_headers_header, cors_methods_header, cors_origin_header},
};

pub(super) fn sample_frame_with(
    conversation_id: &str,
    message_id: &str,
    plain_text: &str,
    timestamp_ms: i64,
) -> EncodedFrame {
    let message = MessageEnvelope {
        message_id: MessageId(message_id.into()),
        conversation_id: ConversationId(conversation_id.into()),
        sender: IdentityId("rsaga".into()),
        reply_to_message_id: None,
        sender_device: DeviceId("desktop-1".into()),
        sender_profile: ClientProfile::desktop_terminal(),
        payload_type: PayloadType::Text,
        body: MessageBody {
            preview: plain_text.into(),
            plain_text: plain_text.into(),
            language_tag: "en".into(),
        },
        ciphertext: vec![1, 2, 3],
        timestamp_ms,
        ephemeral: false,
    };
    transport_waku::WakuFrameCodec::encode(&message).expect("frame should encode")
}

pub(super) fn sample_frame(conversation_id: &str) -> EncodedFrame {
    sample_frame_with(
        conversation_id,
        "msg-1",
        "hello from gateway",
        1_763_560_000_000,
    )
}

pub(super) fn register_resident(runtime: &mut GatewayRuntime, resident_id: &str) {
    let mut hasher = DefaultHasher::new();
    resident_id.hash(&mut hasher);
    let seed = hasher.finish();
    let email = format!("{}@example.com", resident_id.replace('_', "-"));
    let mobile = format!("+86 13{:09}", seed % 1_000_000_000);
    let device = format!(
        "{:02X}:{:02X}:{:02X}:{:02X}:{:02X}:{:02X}",
        (seed >> 0) as u8,
        (seed >> 8) as u8,
        (seed >> 16) as u8,
        (seed >> 24) as u8,
        (seed >> 32) as u8,
        (seed >> 40) as u8,
    );

    let response = runtime
        .request_email_otp(RequestEmailOtpRequest {
            email,
            mobile: Some(mobile),
            device_physical_address: Some(device),
            resident_id: Some(resident_id.into()),
        })
        .expect("request email otp");
    runtime
        .verify_email_otp(VerifyEmailOtpRequest {
            challenge_id: response.challenge_id,
            code: response.dev_code.expect("dev otp"),
            resident_id: Some(resident_id.into()),
        })
        .expect("verify email otp");
}

pub(super) struct LocalGatewayHttpServer {
    pub(super) base_url: String,
    running: Arc<AtomicBool>,
    handle: Option<thread::JoinHandle<()>>,
}

impl Drop for LocalGatewayHttpServer {
    fn drop(&mut self) {
        self.running.store(false, Ordering::SeqCst);
        let _ = TcpStream::connect(self.base_url.trim_start_matches("http://"));
        if let Some(handle) = self.handle.take() {
            handle.join().expect("join local gateway http server");
        }
    }
}

pub(super) fn start_local_gateway_http_server(runtime: GatewayRuntime) -> LocalGatewayHttpServer {
    let server = Server::http("127.0.0.1:0").expect("bind local gateway http server");
    let listen_addr = server.server_addr().to_string();
    let base_url = format!("http://{listen_addr}");
    let runtime = Arc::new(Mutex::new(runtime));
    let notifier = Arc::new(GatewayStateNotifier::new());
    let running = Arc::new(AtomicBool::new(true));

    let shared_runtime = Arc::clone(&runtime);
    let shared_notifier = Arc::clone(&notifier);
    let keep_running = Arc::clone(&running);
    let handle = thread::spawn(move || {
        while keep_running.load(Ordering::SeqCst) {
            let Ok(Some(mut request)) = server.recv_timeout(Duration::from_millis(100)) else {
                continue;
            };
            let runtime = Arc::clone(&shared_runtime);
            let notifier = Arc::clone(&shared_notifier);
            let listen_addr = listen_addr.clone();
            thread::spawn(move || {
                let mut response =
                    dispatch_http_request(&runtime, &notifier, &listen_addr, &mut request);
                response = response
                    .with_header(cors_origin_header())
                    .with_header(cors_methods_header())
                    .with_header(cors_headers_header());
                let _ = request.respond(response);
            });
        }
    });

    LocalGatewayHttpServer {
        base_url,
        running,
        handle: Some(handle),
    }
}

pub(super) fn http_json(
    method: &str,
    base_url: &str,
    path: &str,
    body: Option<&serde_json::Value>,
) -> (u16, serde_json::Value) {
    let (status, _headers, body) = http_raw(method, base_url, path, body);
    let payload = if body.trim().is_empty() {
        serde_json::Value::Null
    } else {
        serde_json::from_str(&body).expect("json response body")
    };
    (status, payload)
}

pub(super) fn http_raw(
    method: &str,
    base_url: &str,
    path: &str,
    body: Option<&serde_json::Value>,
) -> (u16, String, String) {
    let addr = base_url.trim_start_matches("http://");
    let mut stream = TcpStream::connect(addr).expect("connect local gateway http server");
    let body_bytes = body
        .map(|value| serde_json::to_vec(value).expect("encode json body"))
        .unwrap_or_default();
    let request = format!(
        "{method} {path} HTTP/1.1\r\nHost: {addr}\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        body_bytes.len()
    );
    stream
        .write_all(request.as_bytes())
        .expect("write request headers");
    stream.write_all(&body_bytes).expect("write request body");
    stream.flush().expect("flush request");

    let mut response = Vec::new();
    stream
        .read_to_end(&mut response)
        .expect("read local gateway response");
    let header_end = response
        .windows(4)
        .position(|window| window == b"\r\n\r\n")
        .expect("http response headers");
    let headers =
        String::from_utf8(response[..header_end].to_vec()).expect("utf8 response headers");
    let body_bytes = &response[header_end + 4..];
    let body = if header_has_value(&headers, "transfer-encoding", "chunked") {
        decode_chunked_body(body_bytes)
    } else if let Some(content_length) = header_content_length(&headers) {
        body_bytes[..content_length.min(body_bytes.len())].to_vec()
    } else {
        body_bytes.to_vec()
    };
    let body = String::from_utf8(body).expect("utf8 response body");
    let status = headers
        .lines()
        .next()
        .and_then(|line| line.split_whitespace().nth(1))
        .and_then(|raw| raw.parse::<u16>().ok())
        .expect("http status");
    (status, headers, body)
}

fn header_has_value(headers: &str, name: &str, value: &str) -> bool {
    headers.lines().any(|line| {
        let Some((header_name, header_value)) = line.split_once(':') else {
            return false;
        };
        header_name.eq_ignore_ascii_case(name)
            && header_value
                .split(',')
                .any(|part| part.trim().eq_ignore_ascii_case(value))
    })
}

fn header_content_length(headers: &str) -> Option<usize> {
    headers.lines().find_map(|line| {
        let (name, value) = line.split_once(':')?;
        if name.eq_ignore_ascii_case("content-length") {
            value.trim().parse::<usize>().ok()
        } else {
            None
        }
    })
}

fn decode_chunked_body(body: &[u8]) -> Vec<u8> {
    let mut decoded = Vec::new();
    let mut offset = 0;

    loop {
        let Some(line_end) = find_crlf(&body[offset..]) else {
            panic!("chunk size line");
        };
        let size_line =
            std::str::from_utf8(&body[offset..offset + line_end]).expect("chunk size utf8");
        let size_hex = size_line.split(';').next().unwrap_or_default().trim();
        let size = usize::from_str_radix(size_hex, 16).expect("chunk size hex");
        offset += line_end + 2;

        if size == 0 {
            break;
        }

        let chunk_end = offset + size;
        assert!(chunk_end <= body.len(), "chunk body complete");
        decoded.extend_from_slice(&body[offset..chunk_end]);
        offset = chunk_end;
        assert_eq!(
            body.get(offset..offset + 2),
            Some(&b"\r\n"[..]),
            "chunk crlf"
        );
        offset += 2;
    }

    decoded
}

fn find_crlf(bytes: &[u8]) -> Option<usize> {
    bytes.windows(2).position(|window| window == b"\r\n")
}

#[derive(Debug, Default)]
pub(super) struct MockUpstreamGatewayState {
    pub(super) healthcheck_count: usize,
    pub(super) world_snapshot_request_count: usize,
    pub(super) world_request_count: usize,
    pub(super) connect_requests: Vec<WakuEndpointConfig>,
    pub(super) published_frames: Vec<EncodedFrame>,
    pub(super) world_snapshot_bundle: Option<WorldSnapshotBundle>,
    pub(super) governance_snapshot: Option<GovernanceSnapshot>,
}

fn read_http_request(stream: &mut TcpStream) -> Option<(String, Vec<u8>)> {
    const REQUEST_READ_TIMEOUT: Duration = Duration::from_secs(5);

    stream
        .set_read_timeout(Some(Duration::from_millis(250)))
        .expect("set read timeout");
    let mut buffer = Vec::new();
    let mut chunk = [0_u8; 1024];
    let started_at = Instant::now();

    loop {
        match stream.read(&mut chunk) {
            Ok(0) => break,
            Ok(read) => {
                buffer.extend_from_slice(&chunk[..read]);
                let Some(header_end) = buffer.windows(4).position(|window| window == b"\r\n\r\n")
                else {
                    continue;
                };
                let headers = String::from_utf8_lossy(&buffer[..header_end]).to_string();
                let content_length = headers
                    .lines()
                    .find_map(|line| {
                        let (name, value) = line.split_once(':')?;
                        if name.eq_ignore_ascii_case("content-length") {
                            value.trim().parse::<usize>().ok()
                        } else {
                            None
                        }
                    })
                    .unwrap_or(0);
                let body_start = header_end + 4;
                if buffer.len() < body_start + content_length {
                    continue;
                }
                let body = buffer[body_start..body_start + content_length].to_vec();
                return Some((headers, body));
            }
            Err(error)
                if matches!(
                    error.kind(),
                    std::io::ErrorKind::WouldBlock | std::io::ErrorKind::TimedOut
                ) =>
            {
                if started_at.elapsed() >= REQUEST_READ_TIMEOUT {
                    break;
                }
                continue;
            }
            Err(_) => break,
        }
    }

    None
}

fn write_http_response(stream: &mut TcpStream, status_line: &str, content_type: &str, body: &[u8]) {
    let headers = format!(
        "HTTP/1.1 {status_line}\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
        body.len()
    );
    stream
        .write_all(headers.as_bytes())
        .expect("write response headers");
    stream.write_all(body).expect("write response body");
    stream.flush().expect("flush response");
}

pub(super) fn start_mock_upstream_gateway() -> (
    String,
    Arc<Mutex<MockUpstreamGatewayState>>,
    Arc<AtomicBool>,
    thread::JoinHandle<()>,
) {
    let listener = TcpListener::bind("127.0.0.1:0").expect("bind mock upstream gateway");
    listener
        .set_nonblocking(true)
        .expect("set nonblocking listener");
    let base_url = format!(
        "http://{}",
        listener.local_addr().expect("read listener address")
    );
    let state = Arc::new(Mutex::new(MockUpstreamGatewayState::default()));
    let running = Arc::new(AtomicBool::new(true));

    let shared_state = Arc::clone(&state);
    let keep_running = Arc::clone(&running);
    let handle = thread::spawn(move || {
        while keep_running.load(Ordering::SeqCst) {
            match listener.accept() {
                Ok((mut stream, _)) => {
                    let Some((headers, body)) = read_http_request(&mut stream) else {
                        continue;
                    };
                    let request_line = headers.lines().next().unwrap_or_default();
                    if request_line.starts_with("GET /health ") {
                        shared_state
                            .lock()
                            .expect("lock mock upstream state")
                            .healthcheck_count += 1;
                        write_http_response(&mut stream, "200 OK", "text/plain", b"ok");
                        continue;
                    }

                    if request_line.starts_with("GET /v1/world-snapshot ") {
                        let body = {
                            let mut state = shared_state.lock().expect("lock mock upstream state");
                            state.world_snapshot_request_count += 1;
                            serde_json::to_vec(
                                state
                                    .world_snapshot_bundle
                                    .as_ref()
                                    .expect("mock world snapshot bundle"),
                            )
                            .expect("encode mock world snapshot bundle")
                        };
                        write_http_response(&mut stream, "200 OK", "application/json", &body);
                        continue;
                    }

                    if request_line.starts_with("GET /v1/world ") {
                        let body = {
                            let mut state = shared_state.lock().expect("lock mock upstream state");
                            state.world_request_count += 1;
                            serde_json::to_vec(
                                state
                                    .governance_snapshot
                                    .as_ref()
                                    .expect("mock governance snapshot"),
                            )
                            .expect("encode mock governance snapshot")
                        };
                        write_http_response(&mut stream, "200 OK", "application/json", &body);
                        continue;
                    }

                    if request_line.starts_with("POST /v1/waku ") {
                        let request: WakuGatewayRequest =
                            serde_json::from_slice(&body).expect("decode upstream gateway request");
                        let response = match request {
                            WakuGatewayRequest::Connect { endpoint } => {
                                shared_state
                                    .lock()
                                    .expect("lock mock upstream state")
                                    .connect_requests
                                    .push(endpoint);
                                WakuGatewayResponse::Connected
                            }
                            WakuGatewayRequest::Subscribe { .. } => WakuGatewayResponse::Subscribed,
                            WakuGatewayRequest::Publish { frame } => {
                                shared_state
                                    .lock()
                                    .expect("lock mock upstream state")
                                    .published_frames
                                    .push(frame);
                                WakuGatewayResponse::Published
                            }
                            WakuGatewayRequest::Recover {
                                content_topic,
                                limit,
                                ..
                            } => {
                                let frames = shared_state
                                    .lock()
                                    .expect("lock mock upstream state")
                                    .published_frames
                                    .iter()
                                    .filter(|frame| frame.content_topic == content_topic)
                                    .take(limit)
                                    .cloned()
                                    .collect::<Vec<_>>();
                                WakuGatewayResponse::Frames { frames }
                            }
                            WakuGatewayRequest::Poll {
                                subscriptions,
                                limit,
                            } => {
                                let requested_topics = subscriptions
                                    .into_iter()
                                    .map(|item| item.content_topic)
                                    .collect::<std::collections::HashSet<_>>();
                                let frames = shared_state
                                    .lock()
                                    .expect("lock mock upstream state")
                                    .published_frames
                                    .iter()
                                    .filter(|frame| {
                                        requested_topics.is_empty()
                                            || requested_topics.contains(&frame.content_topic)
                                    })
                                    .take(limit)
                                    .cloned()
                                    .collect::<Vec<_>>();
                                WakuGatewayResponse::Frames { frames }
                            }
                        };
                        let response_body =
                            serde_json::to_vec(&response).expect("encode upstream response");
                        write_http_response(
                            &mut stream,
                            "200 OK",
                            "application/json",
                            &response_body,
                        );
                        continue;
                    }

                    write_http_response(&mut stream, "404 Not Found", "text/plain", b"not found");
                }
                Err(error) if error.kind() == std::io::ErrorKind::WouldBlock => {
                    thread::sleep(Duration::from_millis(10));
                }
                Err(_) => break,
            }
        }
    });

    (base_url, state, running, handle)
}
