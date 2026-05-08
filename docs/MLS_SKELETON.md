# MLS Skeleton

This document describes the current `MLS` layer in `lobster-chat`.

## Intent

The current implementation is a lifecycle skeleton, not a full cryptographic MLS implementation.

Its job is to stabilize:

- 1v1 bootstrap
- room bootstrap
- group membership changes
- epoch rotation
- encrypted payload boundary shape

So later we can swap in a real MLS implementation without redesigning the rest of the app.

## What exists now

The `crypto-mls` crate currently provides:

- `MlsGroupKind`
- `MlsMember`
- `MlsGroupState`
- `MlsCiphertextEnvelope`
- `SecureSessionManager`
- `InMemorySecureSessionManager`

## Current behavior

### Direct sessions

Direct sessions:

- require exactly 2 starting members
- default to `ConversationScope::Private`
- start at epoch `1`

### Room sessions

Room sessions:

- support non-private scopes
- can add and remove members
- set `pending_rekey = true` on membership changes
- rotate to a new epoch explicitly

### Ciphertext boundary

Right now the ciphertext boundary is:

- `MlsCiphertextEnvelope`
- encoded with a placeholder `SkeletonPostcard` wire format

This is intentionally just a transport boundary placeholder.
It is **not** the final cryptographic MLS wire format.

## Why this is still useful

Even without final cryptography, this layer already gives the rest of the system stable expectations for:

- when sessions are created
- what a protected room or DM needs to know
- how epochs evolve
- how transport payloads should be wrapped

That lets the host adapters, H5 shell, and Waku transport grow against a stable security lifecycle.

## Next step

The next real upgrade for this layer should be:

- replace the postcard placeholder with real MLS-backed encrypted payloads
- keep the session manager and envelope boundary shape stable
