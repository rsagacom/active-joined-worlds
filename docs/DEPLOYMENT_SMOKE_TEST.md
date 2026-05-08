# Deployment Smoke Test

Use the local gateway bridge smoke script before shipping a new gateway build or changing the provider interlink path:

```bash
./scripts/smoke-provider-federation.sh
```

To smoke a packaged gateway artifact instead of the local `target/release` binary:

```bash
./scripts/package-release.sh
SKIP_BUILD=1 \
GATEWAY_ARTIFACT=./dist/lobster-waku-gateway-$(rustc -vV | awk '/host:/ { print $2 }').tar.gz \
  ./scripts/smoke-provider-federation.sh
```

What it validates:

- builds the current `lobster-waku-gateway` binary unless `SKIP_BUILD=1` or `GATEWAY_ARTIFACT` is set
- can unpack and run a packaged `lobster-waku-gateway-<target>.tar.gz` artifact when `GATEWAY_ARTIFACT=...`
- starts one upstream gateway and one downstream gateway with `--upstream-gateway-url`
- checks that the downstream `/v1/provider` reports `remote-gateway` and `reachable=true`
- posts a shell message into the downstream gateway
- verifies that the upstream gateway ingests the same message into `/v1/shell/state`

What it does not validate yet:

- `systemd` service install or restart behavior on a real Linux host
- direct public-IP ingress or router/firewall forwarding
- cross-machine interconnect over the public network
- a native Waku relay provider beyond the current HTTP gateway bridge
- auth/login, mirror registration, or world governance workflows
- the UI-side shell acceptance checklist, which now lives in [docs/WEB_SHELL_ACCEPTANCE.md](docs/WEB_SHELL_ACCEPTANCE.md)

CI note:

- CI already covers `scripts/smoke-cli-channel.sh`
- CI already covers `scripts/smoke-auth-registration.sh`
- CI already covers `scripts/smoke-resident-mainline.sh`
- CI already covers `scripts/smoke-provider-federation.sh`
- CI already covers `scripts/smoke-web-shell.sh`
- CI already covers `scripts/test_start_terminal.py`
- CI already covers `scripts/smoke-install-layout.sh`
- CI syntax-checks `scripts/smoke-release-gate.sh`
- `smoke-resident-mainline.sh` is now the cheapest black-box check for `注册 -> 入城 -> user TUI 首条大厅消息 -> /dm 首条私帖 -> CLI tail`

Recommended release gate:

1. Run `bash ./scripts/preflight.sh` on the target host.
2. Run `./scripts/package-release.sh` in CI or on the build host.
3. Run the unified local release gate:
   - `bash ./scripts/smoke-release-gate.sh`
   - it now includes CLI, auth, resident, provider federation, web shell, and terminal smoke
4. Run the install layout smoke to validate artifacts, generated systemd/nginx files, and install paths without touching a real Linux host:
   - `./scripts/smoke-install-layout.sh`
5. If you need to skip provider interlinking temporarily, run:
   - `INCLUDE_PROVIDER_FEDERATION=0 bash ./scripts/smoke-release-gate.sh`
6. If you are validating a candidate gateway artifact, run:
   - `SKIP_BUILD=1 GATEWAY_ARTIFACT=./dist/lobster-waku-gateway-<target>.tar.gz ./scripts/smoke-provider-federation.sh`
7. On Linux, install from:
   - source or checked-out workspace:
     - `sudo ./scripts/install-server.sh`
   - gateway artifact plus checked-out web workspace:
     - `sudo GATEWAY_ARTIFACT=./dist/lobster-waku-gateway-<target>.tar.gz ./scripts/install-server.sh`
   - full gateway + web artifact set:
     - `sudo GATEWAY_ARTIFACT=./dist/lobster-waku-gateway-<target>.tar.gz WEB_ARTIFACT=./dist/lobster-web-shell.tar.gz ./scripts/install-server.sh`
8. After install, verify `GET /health`, `HEAD /health`, `/v1/provider`, and the web shell through the reverse proxy.
9. If the target host previously had a user-started gateway on the same `127.0.0.1:8787`, the installer now stops the systemd service first and clears conflicting `lobster-waku-gateway --host <host> --port <port>` processes before enabling the managed service.
10. If the host already runs Tailscale and you need the fastest external TLS check without touching router or DNS, use Funnel:
   - reset any stale config:
     - `tailscale funnel reset`
   - expose the nginx entry:
     - `tailscale funnel --bg 80`
   - verify externally:
     - `BASE_URL=https://<node>.<tailnet>.ts.net ./scripts/smoke-public-ingress.sh`
   - or check the three URLs manually:
     - `https://<node>.<tailnet>.ts.net/`
     - `https://<node>.<tailnet>.ts.net/health`
     - `https://<node>.<tailnet>.ts.net/v1/provider`
