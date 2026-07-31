# Auth And Registration

## Intent

Early-stage registration should stay lightweight and cheap:

- mobile number is still collected as a durable anti-abuse handle
- email is the first delivery channel for login verification
- SMS is deferred to a later phase to avoid early operating cost

The current gateway direction is:

- email OTP for registration / login
- mobile kept as a hashed anti-abuse handle
- optional device physical address kept as a hashed anti-abuse handle
- world blacklist can permanently burn old email/mobile/device handles after severe confirmed abuse

## Current gateway support

The gateway now exposes a minimal auth skeleton:

- `POST /v1/auth/preflight`
- `POST /v1/auth/email-otp/request`
- `POST /v1/auth/email-otp/verify`

This is intentionally a thin first step:

- enough to model low-cost registration
- enough to enforce blacklist reuse blocking
- not yet a full product auth service

The H5 projection now has a matching lightweight auth area:

- request email OTP
- remember the pending `challenge_id`
- verify OTP and bind the resulting `resident_id` back into the current window identity
- keep the mobile handle only as an anti-abuse input, not as an SMS dependency

## Flow

### 1. Preflight

Client submits:

- `email`
- optional `mobile`
- optional `device_physical_address`

Gateway normalizes the handles and checks the world blacklist feed.

If any submitted handle is blacklisted, registration/login is denied before OTP issuance.

### 2. Request email OTP

Client submits:

- `email`
- optional `mobile`
- optional `device_physical_address`
- optional `resident_id`

Gateway:

- normalizes inputs
- blocks blacklisted handles
- creates a short-lived OTP challenge
- persists the challenge in `auth-state.json`
- releases the shared Gateway runtime lock before any external mailer network call, so a slow mail service cannot block unrelated IM requests
- production mode posts the OTP to `LOBSTER_EMAIL_OTP_MAILER_URL` with `Authorization: Bearer <LOBSTER_EMAIL_OTP_MAILER_BEARER_TOKEN>`
- returns `delivery_mode: mailer-webhook` only after the mailer accepts the request; missing configuration or delivery failure rolls back the challenge and fails closed

Development mode can optionally expose the OTP inline through:

- `LOBSTER_DEV_EMAIL_OTP_INLINE=1`

This is for local testing only.

Production mailer webhook payload:

```json
{
  "kind": "lobster-email-otp",
  "to": "reader@example.com",
  "from": "我和狗蛋儿的家 <no-reply@example.com>",
  "subject": "我和狗蛋儿的家登录验证码",
  "text": "你在我和狗蛋儿的家的验证码是 483921。验证码 10 分钟内有效，请勿转发。",
  "code": "483921",
  "challenge_id": "otp:...",
  "expires_at_ms": 1800000000000
}
```

Webhook must return any `2xx` response. Remote endpoints must use HTTPS; HTTP is accepted only for loopback integration tests.

### 3. Verify email OTP

Client submits:

- `challenge_id`
- `code`
- optional `resident_id`

Gateway:

- verifies the active challenge
- re-checks blacklist state
- creates or refreshes a resident registration
- persists the registration in `auth-state.json`

## Why mobile is still collected

Even before SMS login exists, mobile remains useful for:

- blacklist enforcement after severe abuse
- later migration to SMS or stronger recovery flows
- world-level resident safety response without reading private chats

Optional device physical addresses serve a similar purpose:

- stronger ban enforcement for obviously malicious re-entry
- shared broadcast blacklist feeds across cities
- extra friction against throwaway account churn after severe abuse

Only hashes are persisted in the registration record path; the world blacklist also stores hashes instead of raw handles.

## Relationship to world safety

Severe confirmed abuse can now do two different things:

1. revoke a resident identity's cross-city portability
2. add hashed email/mobile/device handles to the registration blacklist

That means a malicious resident can be forced to:

- lose the old resident identity
- lose the old email/mobile/device handles for re-entry
- create a fresh account with fresh handles if they want to return later

## What is still missing

- provider-specific mail delivery deployment behind the generic HTTPS webhook (for example SMTP / Mailgun / Resend / SES credentials, DKIM and bounce handling)
- production acceptance on the target host/domain with a real mailbox provider
- an automated appeal ticket system; the current manual policy and operator procedure is documented in [`ACCOUNT_APPEAL_RUNBOOK.md`](ACCOUNT_APPEAL_RUNBOOK.md), backed by the admin registration projection and audit log
