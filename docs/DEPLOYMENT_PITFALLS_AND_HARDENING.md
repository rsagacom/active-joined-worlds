# Deployment Pitfalls and Hardening Notes

This document summarizes the real deployment problems encountered while moving `lobster-chat` from a local development machine onto a fresh Ubuntu 22.04 ECS instance. It also turns those problems into concrete packaging and deployment improvements so future operators can get a node online with fewer surprises.

## Environment used during this deployment

- Host OS: macOS (developer machine)
- Target server: Ubuntu 22.04.5 LTS, x86_64
- Target size: 2 vCPU, 2 GiB RAM
- Reverse proxy: Nginx
- Gateway service: `lobster-waku-gateway`
- Shell surface: static `apps/lobster-web-shell`

The target machine size was not the problem. The deployment issues were almost entirely packaging, bootstrap, and operator-experience issues.

## Additional validation note: public IP is not the same as a working public ingress

What happened:

- the Linux laptop reported a public IPv4 address from outbound `curl`
- but external `http://<public-ip>/` and `http://<public-ip>/health` did not reach the deployed nginx at all
- one path returned unrelated content and redirects, proving the public address was not a trustworthy validation target for this host

Root cause:

- outbound public IP detection only proves what NAT egress address the host uses
- it does not prove router forwarding, ISP reachability, or that inbound `80/443` traffic lands on the same machine

Why this matters:

- operators can waste time debugging nginx or the gateway when the real problem is that the public edge is somewhere else
- "curl says I have a public IP" is not a sufficient ingress check

Hardening action:

- keep direct public-IP validation separate from application deployment validation
- when the host already runs Tailscale, prefer `tailscale funnel --bg 80` as the fastest external TLS ingress check
- verify the same three URLs through the Funnel hostname:
  - `/`
  - `/health`
  - `/v1/provider`

Recommended operator rule:

```text
If direct public IP does not clearly land on the target host, do not keep debugging nginx first.
Either validate router/firewall forwarding explicitly or switch to a known-good ingress like Tailscale Funnel.
```

## Real problems we hit

### 1. Shipping the wrong binary format

What happened:

- a gateway binary built on macOS was copied to the Linux server
- `systemd` tried to start it and failed with `Exec format error`

Root cause:

- release artifacts were not target-specific
- there was no deployment guard that checked `uname -s` / `uname -m` against the artifact

Why this matters:

- this is a classic release mistake
- it makes the project look broken even when the source code is fine

Hardening action:

- publish release artifacts per target triple
- at minimum:
  - `x86_64-unknown-linux-gnu`
  - `aarch64-unknown-linux-gnu`
  - `x86_64-apple-darwin`
  - `aarch64-apple-darwin`
- make the install script refuse to install a mismatched artifact

Recommended release layout:

```text
dist/
  lobster-waku-gateway-x86_64-unknown-linux-gnu.tar.gz
  lobster-waku-gateway-aarch64-unknown-linux-gnu.tar.gz
  lobster-waku-gateway-x86_64-apple-darwin.tar.gz
  lobster-waku-gateway-aarch64-apple-darwin.tar.gz
  lobster-web-shell.tar.gz
```

## 2. System cargo was too old for the workspace

What happened:

- Ubuntu `apt` installed a Rust toolchain that was too old
- the workspace uses `edition2024`
- the server build failed with an edition support error

Root cause:

- the deployment path implicitly assumed system package manager Rust was new enough
- the project did not include a preflight version check
- even an existing `rustup` install may still point at an old stable toolchain unless explicitly updated

Why this matters:

- many cloud images lag behind Rust stable by months
- relying on distro cargo alone makes deployment fragile

Hardening action:

- ship a preflight script that checks:
  - `rustc --version`
  - `cargo --version`
  - target compatibility
- if versions are too old, automatically switch to `rustup`
- if `rustup` is already installed, run an explicit `rustup update stable && rustup default stable`

Recommended deployment rule:

```text
Prefer rustup-managed stable toolchains for source builds.
Use distro cargo only when it already satisfies the workspace edition and feature requirements.
```

Recommended operator command:

```bash
source "$HOME/.cargo/env"
rustup update stable
rustup default stable
cargo -V
rustc -V
```

Additional hardening now applied in `scripts/install-server.sh`:

- prefer an existing `$HOME/.cargo/bin/cargo` before trying to bootstrap rustup again
- set `RUSTUP_INIT_SKIP_PATH_CHECK=yes` to avoid noisy path warnings on hosts that already ship `/usr/bin/rustc`
- only fall back to rustup bootstrap when neither a modern cargo nor rustup-managed cargo is present
- keep a persistent `CARGO_TARGET_DIR` under `/opt/lobster-chat/build/target` so repeat deployments can reuse incremental build artifacts instead of compiling from scratch every time

## 3. Official rustup bootstrap was unreliable from the target region

What happened:

- fetching `https://sh.rustup.rs` from the server timed out
- a China-friendly registry mirror was reachable and worked

Root cause:

- deployment assumed global network paths were equally reliable everywhere
- the bootstrap script did not have mirror fallback logic

Why this matters:

- this is exactly the kind of regional friction that turns an otherwise simple install into a failed one

Hardening action:

- support mirror-aware bootstrap
- document region-friendly Rust install paths
- support configurable cargo registry mirrors
- support region-friendly `RUSTUP_DIST_SERVER` / `RUSTUP_UPDATE_ROOT` for rustup itself

Recommended cargo config fallback:

```toml
[source.crates-io]
replace-with = "rsproxy-sparse"

[source.rsproxy-sparse]
registry = "sparse+https://rsproxy.cn/index/"

[net]
git-fetch-with-cli = true
```

Recommended packaging improvement:

- provide a `scripts/bootstrap-rust.sh`
- support:
  - default global bootstrap
  - China-friendly mirror bootstrap
- avoid making the operator hand-write cargo mirror config

Recommended rustup mirror fallback:

```bash
export RUSTUP_DIST_SERVER=https://rsproxy.cn
export RUSTUP_UPDATE_ROOT=https://rsproxy.cn/rustup
rustup update stable
rustup default stable
```

## 4. Source archive path layout was ambiguous

What happened:

- the uploaded source archive extracted to:
  - `/opt/lobster-chat-src/lobster-chat/...`
- initial build commands assumed:
  - `/opt/lobster-chat-src/...`

Root cause:

- the archive root and deployment instructions were not aligned
- there was no canonical extraction path contract

Why this matters:

- small path mismatches waste time and create confusing "file not found" failures

Hardening action:

- standardize the release archive layout
- define one canonical extraction root

Recommended rule:

```text
All source archives should extract to exactly one top-level folder named lobster-chat.
All deployment scripts should assume that folder explicitly.
```

Example:

```bash
tar -xzf lobster-chat-source.tar.gz -C /opt
cd /opt/lobster-chat
```

The current installer now supports both modes:

```bash
# source build on the target host
sudo ./scripts/install-server.sh

# prebuilt binary install with target-triple guard
sudo GATEWAY_ARTIFACT=./dist/lobster-waku-gateway-x86_64-unknown-linux-gnu.tar.gz \
  ./scripts/install-server.sh
```

## 5. Deployment relied too much on manual operator memory

What happened:

- several steps required remembering:
  - where the source extracted
  - how to set cargo mirrors
  - where the gateway binary should live
  - how to write the systemd unit
  - how to wire Nginx to the gateway

Root cause:

- too much operational knowledge lived in the operator's head
- not enough was encoded in scripts

Why this matters:

- a project is not truly easy to deploy if a successful install depends on the original developer being present

Hardening action:

- move repeatable deployment work into scripts
- treat operator docs as part of the product

Minimum scripts to add:

- `scripts/preflight.sh`
- `scripts/install-gateway.sh`
- `scripts/install-nginx.sh`
- `scripts/install-systemd.sh`
- `scripts/package-release.sh`

## 6. Reverse proxy was fine, but failure mode looked like app breakage

What happened:

- Nginx and static shell worked
- the proxied API returned empty/bad responses because the gateway service was not actually up

Root cause:

- gateway and proxy status were not surfaced together
- there was no "is the static shell up but the gateway down?" connectivity watch page

Why this matters:

- users often blame the product surface first
- operators need immediate visibility into whether the problem is:
  - static hosting
  - gateway service
  - upstream provider

Additional hardening:

- `scripts/install-server.sh` now stops the managed `lobster-waku-gateway.service` first, then clears any conflicting user-started `lobster-waku-gateway --host <host> --port <port>` processes before re-enabling the systemd service.
- This prevents the common real-host failure mode where an old ad-hoc gateway keeps `127.0.0.1:8787` occupied and leaves systemd in a permanent `Address already in use` restart loop.
  - routing

Hardening action:

- keep `/health`
- add a simple operator status endpoint or page
- expose service-mode info in one place

Suggested status view should show:

- static shell status
- gateway status
- provider status
- state directory path
- current upstream provider URL if present

## 7. SSH/operator access assumptions were shaky

What happened:

- SSH networking was fine
- the actual blocker was authentication mode mismatch
- the machine initially allowed publickey only, not password login

Root cause:

- initial deployment assumptions did not explicitly separate:
  - network reachability
  - SSH port reachability
  - authentication policy

Why this matters:

- it creates false debugging paths
- people waste time checking firewalls when the real issue is auth policy

Hardening action:

- add a deployment checklist item:
  - "Can the operator log in with the intended method?"
- separate:
  - connectivity check
  - auth check
  - privilege check

## What should be improved before public packaging

If `lobster-chat` is going to be shared as an open-source project that other people can actually deploy, these should be considered release-blocking improvements.

### A. Publish target-specific binaries

This is the highest-value packaging fix.

Needed artifacts:

- Linux x86_64 gateway binary
- Linux aarch64 gateway binary
- static H5 shell tarball

Optional later:

- TUI binaries for desktop operators

### B. Add a one-shot installer

At minimum:

```bash
curl -fsSL <install-url> | bash
```

or:

```bash
./scripts/install-server.sh
```

It should:

- detect OS and architecture
- install or select a matching artifact
- create state directories
- install a systemd unit
- install or configure Nginx or Caddy
- print service URLs and health commands

### C. Add a real preflight script

The preflight should validate:

- OS
- CPU architecture
- memory budget
- disk budget
- Rust toolchain version if building from source
- whether a package install path or source-build path should be used
- open ports
- current gateway config

### D. Support multiple install modes explicitly

The project should document and script three modes:

1. `Binary install`
   - easiest
   - preferred for most city operators

2. `Source build`
   - for contributors
   - requires Rust

3. `Container install`
   - useful for operators who want reproducibility

### E. Add Docker only as a convenience layer, not a requirement

Container packaging can help, but the project should stay deployable without Docker.

Good:

- `Dockerfile`
- `docker-compose.yml`

Bad:

- making Docker mandatory for all operators

This project's strength is that it can stay lightweight and headless.

### F. Keep gateway and UI packaging separate

Do not force every operator to install a full developer workspace just to host a city.

Better split:

- `lobster-waku-gateway`: server/operator runtime
- `lobster-web-shell`: static client surface
- source workspace: contributor/dev install only

## Recommended deployment shape for first public releases

For the first practical public release, the cleanest operator story is:

### City operator package

- one gateway binary
- one static H5 shell tarball
- one systemd unit template
- one Nginx or Caddy config template
- one install script

### Typical server layout

```text
/opt/lobster-chat/bin/lobster-waku-gateway
/opt/lobster-chat/web/*
/var/lib/lobster-chat/
/etc/systemd/system/lobster-waku-gateway.service
/etc/nginx/sites-available/lobster-chat
```

### Service expectations

- gateway auto-starts on boot
- state survives restart
- H5 shell is served statically
- `/v1/provider` clearly reports whether the city is:
  - local-memory only
  - remote-provider bridged
  - disconnected

## Release engineering checklist

Before asking outside users to deploy this project, we should aim to have:

- [ ] target-specific release binaries
- [x] one-step server install script
- [x] preflight checker
- [x] region-aware Rust/bootstrap fallback for source installs
- [x] systemd unit template
- [x] Nginx or Caddy template
- [x] explicit binary-vs-source deployment docs
- [ ] troubleshooting guide with common errors
- [ ] operator health/status page or consolidated status endpoint

## Operator troubleshooting checklist

If a deployment "does not work", check these in order:

1. Can you SSH in with the intended auth method?
2. Is the binary built for the target OS/architecture?
3. Is the Rust toolchain new enough if building from source?
4. Is the cargo registry reachable from the deployment region?
5. Did the source archive extract to the expected path?
6. Is `lobster-waku-gateway` running under systemd?
7. Does `curl http://127.0.0.1:<gateway-port>/health` succeed?
8. Is Nginx or Caddy serving the static shell?
9. Is the proxy actually pointing at the live gateway port?
10. Does `/v1/provider` report the transport mode you expect?

## Bottom line

The biggest deployment problems were not about application complexity. They were about packaging assumptions:

- wrong target binary
- outdated toolchain
- region-sensitive bootstrap paths
- unclear archive layout
- too much manual operator knowledge

Those are solvable. If we package for Linux properly, add a preflight check, and ship a real one-shot installer, `lobster-chat` can be much easier for city operators to deploy than the current raw-source workflow suggests.
