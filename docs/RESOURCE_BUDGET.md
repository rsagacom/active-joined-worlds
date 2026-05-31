# Resource Budget

This document captures the current measured footprint of the `lobster-chat` prototype and the practical hardware targets we should design around.

## Current measured footprint

Measured on the current macOS ARM64 development machine.

### Source tree

- project root: about `1.4G`
- almost all of that is Rust build cache under `target/`
- actual source and docs are small:
  - `crates/`: about `116K`
  - `apps/`: about `152K`
  - `docs/`: about `36K`

So the product codebase is still compact. The large number is a developer build artifact, not a user-facing install size.

### Release binaries

Current release outputs:

- `lobster-tui`: about `2.9MB`
- `lobster-waku-gateway`: about `1.5MB`
- `lobster-web-shell`: about `60KB` static assets

That means the current product-facing runtime is still lightweight enough for embedded-friendly distribution.

### Runtime memory

Current prototype measurements:

- `lobster-tui`: around `3MB` max resident size in the measured bootstrap run
- `lobster-waku-gateway`: around `2MB` max resident size in the measured bootstrap run

These numbers are early-prototype numbers, not final production guarantees, but they confirm the architecture is still in a low-resource range.

## Product budget targets

## User terminal client

Target for the shipping TUI client:

- binary size: `3MB - 10MB`
- memory target: `32MB - 128MB`
- should remain comfortable on:
  - Linux terminal hosts
  - older desktops
  - low-resource SSH environments

## H5 mobile shell

Target for the browser shell:

- static shell payload: `100KB - 500KB`
- browser cache budget: `32MB - 128MB`
- keep JavaScript framework-light so the browser remains the heavy part, not the product shell itself

## City gateway / city-lord node

Target for the city gateway without AI sidecar:

- binary size: `2MB - 8MB`
- memory target: `64MB - 256MB`
- disk target for lightweight city operation: `1GB - 5GB`

Target for a more active city with larger public history:

- `1-2 vCPU`
- `256MB - 512MB RAM`
- `5GB - 20GB` disk depending on retention

## Embedded Lobster host

Target for downward compatibility:

- keep the headless chat core usable without H5, AI, or chain layers
- core memory target: `16MB - 64MB`
- no mandatory heavy background services
- use gateway mode when transport complexity grows beyond what the host should own directly

## Wearable surfaces

Wearable devices should stay in the lowest-cost tier:

- compact message view
- short reply support
- glance-card style presence
- camera and voice are optional host features, not mandatory protocol requirements

The wearable client should behave like a thin surface over the same world/city model, not a separate full node.

## What must stay optional

To keep the product light, these must remain optional or sidecar-based:

- AI translation
- AI summarization
- semantic search and long-memory indexing
- media processing
- heavy chain interactions

The chat core must remain lightweight even when those features are absent.

## Budget guardrails

When evaluating future changes, reject or isolate anything that would force these into the base runtime:

- full AI inference in the main client
- large frontend frameworks in the H5 shell
- heavyweight chain clients in the base gateway
- always-on media processing in city nodes

## Practical deployment picture

### Ordinary user

A normal user should be able to run:

- one terminal client, or
- one H5 shell against a city gateway

without needing a dedicated server.

### City Lord

A city lord should be able to operate a city on:

- a tiny VPS
- a low-cost home machine
- a compact self-hosted box

without needing enterprise infrastructure.

### Federation / world scale

The world should scale by adding more city gateways and upstream relays, not by turning every client into a heavyweight full stack.
