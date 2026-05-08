# World Square and World Safety

This document defines two missing world-level layers for `lobster-chat`:

- the `World Square`
- the `World Safety` layer

These layers exist because a healthy world needs both:

- a shared public commons
- a strong emergency response path when a city turns malicious, illegal, or abusive

The goal is not to recreate a centralized world emperor.
The goal is to create a world that can defend itself without reading private user plaintext or owning resident identity.

## 1. World Square

The `World Square` is a world-scoped public forum and bulletin layer.

It is not owned by one city.
It should be mirrored across multiple cities in the same spirit as the world directory.

### What the World Square is for

- cross-city public discussion
- official world notices
- city announcements that matter beyond one city
- discovery of notable cities, rooms, and events
- appeals, warnings, and migration notices
- public incident reports

### What the World Square is not

- not a replacement for private 1v1 messaging
- not owned by one city lord
- not a place where any one city can dominate discovery forever

### Mirror model

The World Square should be:

- mirrored across multiple cities
- cached locally by clients
- signed and versioned

That way:

- a single city outage does not erase the world commons
- a single malicious city cannot permanently control the global conversation

## 2. World Safety

The `World Safety` layer is the world-level coordination layer for emergency and cross-city safety actions.

This is the tool that lets the world respond when a city:

- distributes illegal material
- runs obvious scam or trafficking infrastructure
- spreads malware
- weaponizes互联 links
- uses public rooms for organized abuse
- persistently violates baseline world policy

This layer should be powerful.
It should not be weak or symbolic.

But its power must be constrained to:

- discovery
- interconnectivity
- public world-layer access
- emergency quarantine

It must not become:

- a plaintext private-message reader
- a global owner of residents
- a secret censorship engine with no audit trail

At the same time, the world layer does need one extra emergency power for severe abuse:

- the ability to mark a resident identity as world-banned when that identity is tied to a city that is confirmed to be running illegal or clearly malicious activity

That sanction should still be:

- explicit
- logged
- reviewable
- mirrored
- appealable

## 3. Recommended world-level roles

### World Steward Council

A small world-level steward group responsible for:

- incident intake
- directory integrity
- emergency notices
- quarantine decisions
- world-square moderation

This should ideally be:

- multi-steward
- logged
- signed
- reviewable

Not just one hidden super-ruler account.

### World Sentinel

The actual service entry used by the World Steward Council.

It should manage:

- world directory mirrors
- world-square notices
- city trust state
- emergency deny lists
- quarantine policy feeds
- interconnectivity advisories
- appeal / review records

## 4. Emergency powers that are necessary

These are the world-level powers that make sense.

### A. Quarantine a city

If a city is clearly malicious, the world safety layer can mark it as:

- `Under Review`
- `Quarantined`
- `Isolated`

Practical effect:

- compliant cities stop interconnecting with it
- the city disappears from public world directory mirrors
- the city loses World Square visibility
- world-level discovery no longer routes users into it

This is the "孤城" mechanism.

It does not delete the city from existence.
It cuts it off from the shared world.

### B. Publish a deny list

The world safety layer should be able to publish signed deny lists for:

- malicious city endpoints
- dangerous provider URLs
- scam public room identifiers
- malware download links
- illegal content pointers

Cities that opt into world safety enforcement should consume this feed and apply it automatically.

### C. Freeze world-square access

A city may be blocked from:

- posting into the World Square
- appearing in World Square recommendations
- advertising its public rooms globally

This is weaker than total quarantine and useful for mid-level enforcement.

### D. Emergency world notice

The world safety layer should be able to publish:

- emergency advisories
- migration warnings
- compromised city warnings
- fraud or malware alerts

These notices belong in the World Square and world directory metadata.

### E. World identity sanctions for severe abuse

In the most serious cases, quarantining the city is not enough.
If a city is confirmed to be running illegal operations, the world safety layer may also publish a resident sanction feed.

Practical effect:

- sanctioned resident identities cannot port into other cities
- compliant cities refuse their migration requests
- their existing world identity is considered burned
- they must re-register as a new identity if the product policy allows re-entry at all

This is intentionally stronger than city quarantine.
It should only be used for:

- confirmed criminal abuse
- organized scam operations
- malware distribution
- repeated severe harm after review

It should not be used for ordinary moderation disputes.

## 5. What world-level power must still not do

Even with strong emergency tooling, the world safety layer must not:

- read plaintext 1v1 messages
- seize resident private keys
- erase resident local archives
- silently rewrite history
- trap a resident in a quarantined city

When identity sanctions are needed, the system should distribute:

- a revocation record for the world identity
- a hashed blacklist of registration handles
- a reason code
- a review trail

not raw private plaintext or silent shadow-bans.

Residents should still be able to:

- export identity
- leave a bad city
- rejoin a healthy city

That is the safety valve that keeps the world from becoming a cage.

Exception:

- if a resident identity is explicitly world-banned after severe confirmed abuse, portability is revoked for that identity and re-entry must go through a fresh registration path

## 6. Quarantine should be signed, mirrored, and expiring

World safety actions should not be hidden implementation magic.

Recommended structure:

- signed incident record
- signed quarantine decision
- reason code
- evidence pointer
- issue time
- expiry time
- review status

That allows:

- mirrored enforcement across cities
- auditability
- appeal flow
- temporary rather than permanent emergency actions by default

## 7. Relationship between city autonomy and world safety

This is the balancing rule:

### City lord controls

- city rooms
- city residents inside city policy
- city relay/storage policy
- city culture and moderation

### World safety controls

- world directory listing
- world-square access
- inter-city互联 trust
- emergency deny lists
- quarantine / isolate decisions

So:

- the city lord governs the city
- the world guards the world

That split is important.

## 8. Product stance

`lobster-chat` should not pretend that "complete freedom with no world safety tools" is enough.

A strong world needs:

- city autonomy
- resident portability
- world-square visibility
- emergency isolation tools for obvious abuse

The correct model is:

> Strong local autonomy, strong global emergency brakes, no private-message plaintext override.

## 11. Registration and blacklist model

The product should still keep a formal registration layer.

Recommended early-stage registration:

- collect mobile number as an account handle / risk signal
- collect email address
- send login / verification code by email, not SMS

This keeps:

- a portable registration path
- lower operating cost in the early stage
- a way to apply blacklist enforcement without paying for SMS infra

### Blacklist enforcement

When a resident is world-banned:

- the world publishes a signed identity revocation record
- the resident's world identity id is blacklisted
- the registration handles are blacklisted in hashed form
- compliant cities refuse new sessions / migrations from that identity

For early implementation, the blacklist should include hashes of:

- normalized email
- normalized mobile number

not raw plaintext values.

### Why hashed handles

Because the world needs to coordinate safety enforcement without turning the safety layer into a plaintext identity leak.

### Product stance

Yes, a severely abusive resident may have to register again with a new identity.
No, the original mobile number and email should not continue working once they are on the broadcast blacklist.

## 9. Recommended implementation order

### Phase 1

- define world-square metadata model
- define safety advisory model
- define city trust states

### Phase 2

- publish `GET /v1/world-directory` snapshots for clients and mirror nodes
- publish `GET /v1/world-mirrors` for quick bootstrap and steward visibility
- expose `GET /v1/world-square` and `GET /v1/world-safety` for thin projections
- let thin projections show:
  - world directory entries
  - world notices
  - quarantine / trust advisories

- add signed world notice feed
- add signed deny list feed
- add city quarantine state to world directory snapshots

### Phase 3

- add world-square moderation tools
- add multi-mirror safety sync
- add appeal workflow and review history

### Phase 4

- optional threshold signing / multi-sig review for emergency actions

## 10. Short version

If the world has many cities, it also needs:

- a world commons
- a world warning system
- a world quarantine mechanism

Otherwise one malicious city can poison discovery,互联, and public trust for everyone else.
