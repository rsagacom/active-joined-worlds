# Waku Gateway Protocol

This document describes the adapter shape that sits between `lobster-chat` clients and a future real Waku relay or light gateway.

## Why this layer exists

We want the same chat core to work across:

- embedded Lobster-like hosts
- desktop terminal shells
- mobile H5 shells
- later wearable shells

Those environments should not each reimplement their own transport logic.

So the transport stack is split into:

1. `chat-core`
2. `transport-waku`
3. a `gateway client` implementation
4. a real local sidecar, host bridge, or remote gateway later

## Design goal

The Waku gateway boundary should be:

- compact
- serializable
- easy to embed inside local host processes
- easy to expose over HTTP, WebSocket, or IPC later
- friendly to low-resource clients

## Current contract

The current serializable protocol lives in:

- `WakuGatewayBootstrap`
- `WakuGatewayRequest`
- `WakuGatewayResponse`

### Bootstrap

Bootstrap tells a host shell what session it should establish:

- endpoint config
- topic subscriptions
- history limit

### Requests

Current request types:

- `Connect`
- `Subscribe`
- `Publish`
- `Recover`
- `Poll`

### Responses

Current response types:

- `Connected`
- `Subscribed`
- `Published`
- `Frames`
- `Error`

## Why JSON first

The core message payloads already use compact binary framing via `postcard`.

The gateway request layer uses JSON first because it is:

- easy to inspect in development
- easy to serve from small local processes
- easy to bridge into H5 shells
- easy to move to HTTP or WebSocket later

This keeps the gateway request layer debuggable while the message payload layer stays compact.

## Future implementations

This protocol is meant to support multiple concrete adapters:

- in-memory development gateway
- localhost sidecar process
- embedded host bridge
- remote Waku gateway
- browser bridge for H5
- upstream gateway interconnect between city nodes

## Upstream interconnect step

The current implementation now supports a practical intermediate step before a full native Waku provider is wired in:

- a localhost city gateway can point at an upstream gateway
- local shell and governance state still stay local
- transport publish / recover / poll can route upward through the interconnect

This is useful for:

- city-to-city interconnect experiments
- low-cost hosted city relays
- separating local shell runtime from broader network transport

Current gateway startup supports:

- `--upstream-gateway-url <url>`
- or `LOBSTER_WAKU_UPSTREAM_URL=<url>`

This is not the final native Waku provider integration, but it is the first real multi-node step and keeps the client surfaces unchanged.

## Recommended next step

Implement a localhost gateway process that:

- accepts `WakuGatewayRequest`
- returns `WakuGatewayResponse`
- uses a real Waku client under the hood

That will let desktop, H5, and embedded-host experiments share one transport service without coupling the core to any one runtime.
