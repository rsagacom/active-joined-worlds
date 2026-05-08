# H5 Projection Plan

## Why H5 first

The mobile path should begin with an H5 projection so iOS and Android can join the network early without waiting for native App packaging, store review, or a second protocol stack. H5 is a follow-up projection, not the main battlefield.

## What the H5 projection should do

- reuse the same `chat-core` models through a bridge layer
- render compact 聚落 and DM timelines
- keep an active-window cache locally
- prefer IndexedDB for snapshots and archive pointers
- stream incremental updates from transport instead of reloading full histories
- mirror the current world, 城邦, and 居民 state without claiming higher rights than TUI

## What the H5 projection should not do at first

- it should not become the only canonical home of the product
- it should not require the AI sidecar
- it should not attempt full wearable UX
- it should not own the transport protocol directly if a host bridge can proxy it
- it should not turn into a city-order page or hidden high-rights surface

## First browser-facing boundary

1. route entry
2. local session bootstrap
3. timeline hydrate from persisted snapshot
4. subscribe to compact updates
5. render a compact room-like chat projection that still feels close to the TUI interior
6. keep the same-window contract clear: same world view, different rights

## Runtime contract

The H5 projection should consume a compact bootstrap payload that includes:

- host capabilities
- projection configuration
- initial view
- offline cache budget
- background resync policy
- resident/city-lord role tier for the current window

This keeps the browser projection thin and lets the real product logic stay in the shared core and adapter layers. The TUI still owns the main action flow; H5 only shadows it when the resident opens the browser.

## Why this keeps the project light

This path lets us keep:

- one core model
- one transport model
- one archive model
- multiple thin projections
- shared naming across world / 城邦 / 聚落 / 居民 / 城主 / 互联 / 共建

That is the right tradeoff for a product that must work:

- downward in embedded hosts
- sideways in mobile browsers as a follow-up projection
- upward in wearable devices
