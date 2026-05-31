# World / City / Resident Model

This document defines the social and world/city order model for `lobster-chat`.

The product should feel like a living world with many cities, not a single城邦 with one permanent capital.

## Core terms

### World

The `World` is the global protocol space:

- identity rules
- message format rules
- end-to-end security rules
- city discovery rules
- cross-city interoperability

The World is not operated by one city lord.
It is the shared rule layer of the network.

The World may still have strong world-level safety tooling.
That tooling should govern discovery, interconnectivity, and public world spaces,
not private-message plaintext or resident ownership.

### World directory mirrors

The World may expose a public city directory,
but that directory should not live on one permanent "capital host".

Instead, the directory should be mirrored across multiple cities.

Each participating city can publish a signed snapshot of:

- known cities
- public city metadata
- public room discovery metadata
- optional health /互联 hints

This means the World has:

- no mandatory permanent capital
- multiple directory mirrors
- seed cities for bootstrapping
- local client cache as a final fallback

The first city in the network may temporarily act as a seed city or bootstrap source,
but it must not become a required global authority.

### World Square

The World should also have a public cross-city commons: the `World Square`.

The World Square is:

- a forum-like public commons
- a notice board for world-level announcements
- a discovery and appeal surface
- mirrored across multiple cities

It is not a permanent capital owned by one city.

### World Safety

The World needs a strong safety layer for emergency response.

This includes:

- signed deny lists
- world-level warning notices
- quarantine decisions for malicious cities
- the ability to cut a city off from public discovery and compliant互联

This is a world-layer emergency brake, not private-message ownership.

### City

A `City` is a hosted service domain inside the World.

A city can provide:

- relay capacity
- short-window message storage
- room discovery
- public room moderation
- world-directory mirror participation
- optional local search / AI / onboarding features

Technically, a city is closer to a node cluster or hosted domain than to a normal chat group.

### Resident

A `Resident` is a user identity that participates in the World and may choose one or more cities as home or access points.

Residents must not be permanently trapped inside a single city.

They should be able to:

- leave a city
- join another city
- keep their identity
- keep private relationships that are not owned by the city

### City Lord

A `City Lord` is the keeper of a city.

This role is not a global ruler.
It is a city-level keeper with real public-space authority and real infrastructure responsibility.

The city lord should have at least the practical authority of a WeChat group owner for public city spaces, and also some extra infrastructure powers that come from running the city.

## Design intent

We want a city lord to have enough power to keep a city healthy.

We do **not** want the city lord to become:

- a global super-ruler
- a reader of private end-to-end encrypted conversations
- the owner of resident identity
- the owner of user local archives

So the model is:

- **strong city stewardship**
- **weak global sovereignty**
- **no private-message override**
- **strong world-level emergency isolation for obvious abuse**

## City lord powers

These powers are intentionally comparable to, or stronger than, a WeChat group owner inside the scope of one city.

### Public city powers

A city lord can:

- create or close public rooms inside the city
- rename the city and edit city profile / description
- publish city announcements
- pin messages or notices in city-owned public spaces
- approve or reject resident entry when a city uses approval mode
- remove residents from the city
- mute or rate-limit abusive residents inside the city
- appoint stewards / moderators
- revoke steward / moderator roles
- freeze or quarantine a public room
- set local discovery visibility for city-owned rooms

### Infrastructure powers

A city lord can:

- set relay policy for the city
- set short-window storage policy for the city
- set message retention defaults for city-hosted public rooms
- opt the city in or out of public world-directory mirroring
- publish signed city directory snapshots
- enable or disable optional city features such as search, AI sidecars, indexing, or local mirrors
- define uptime goals for city infrastructure
- publish city service status

### Economic powers

If the product later adds staking or city treasury mechanics, a city lord may also:

- register a city stake
- manage city operating budget
- receive a portion of city-level service rewards
- fund moderation or storage costs

This should still be city-scoped, not world-scoped.

## City lord limits

These limits are mandatory.

A city lord must **not** be able to:

- read the plaintext of end-to-end encrypted 1v1 private messages
- decrypt room messages without being a valid room participant
- rewrite resident identity
- seize resident local archives
- globally ban a resident from the entire World
- block a resident from moving to another city
- forge message history
- silently edit user messages after signature

The World safety layer must also **not** be able to:

- read plaintext 1v1 messages
- seize resident identity
- delete resident local archives
- silently forge history

This is the main difference between a city and a single-owner host server.

## Steward / moderator role

The city lord should be able to delegate part of their power.

Suggested role split:

- `City Lord`
  - full city-scoped stewardship
  - infrastructure control
  - role assignment
- `Steward`
  - room moderation
  - resident mute / remove within granted scope
  - announcement assistance
- `Resident`
  - ordinary use rights

Later we can add more granular roles, but MVP should keep the role model compact.

## Resident rights

Residents should always retain these rights:

- own their identity
- own their device keys
- own their local archive decision
- leave a city
- join another city
- use cross-city private messaging when policy allows
- verify city rules before joining

Residents are not tenants on a landlord-controlled host.
They are portable users inside a larger protocol world.

## Why city lords need real power

Without real city-level power, no one will want to run infrastructure.

The city lord is expected to contribute:

- uptime
- bandwidth
- short-window storage
- moderation effort
- onboarding support

So the role must have enough authority to be worth operating.

That is why we do **not** reduce the city lord to a passive node host.

They need enough practical control to:

- keep spam down
- keep public rooms clean
- keep infrastructure sustainable
- shape city culture

## Why city lords must still be constrained

If the city lord can read private traffic or control global identity, the system slides back into single-point rule.

That would break the main reason to build this product in the first place.

So our rule is:

> The city lord can keep the city, but cannot own the person.

## Technical mapping

### Best place to encode city power

City-level permissions should be expressed as signed state and policy metadata, not as hidden implementation magic.

Suggested split:

- chain or signed global state:
  - city creation
  - city lord identity
  - steward delegation records
  - city public policy commitments
- city infrastructure state:
  - relay status
  - short-window retention
  - room listings
  - moderation state for public city rooms
- end-to-end private state:
  - private conversation membership
  - private message ciphertext
  - device-level message history

### Private messages

Private 1v1 conversations should be outside city-lord plaintext control by default.

Cities may relay private-message ciphertext,
but relaying does not imply the right to read or rewrite it.

### Public city rooms

Public rooms owned by a city can be moderated by the city lord or their stewards.

That includes:

- access rules
- local posting rules
- moderation actions
- retention defaults

This is where city-level power should be strongest.

## Product stance

`lobster-chat` should present itself as:

- a World with many Cities
- where residents are portable
- and city lords are powerful local keepers, not global emperors
- with directory discovery mirrored across cities rather than owned by one center
- with a mirrored World Square and a strong world-level emergency safety coordination layer

## MVP guidance

For the MVP, keep the world/city rule model simple:

- one city lord per city
- optional stewards
- residents portable across cities
- city-owned public rooms
- private 1v1 out of city-lord plaintext reach
- one or more seed cities can mirror the public city directory
- clients should cache the last known city directory snapshot locally

That is enough to make the social model real without overbuilding rule layers too early.
