.PHONY: build check test test-gateway test-frontend test-all smoke release clean dev watch

# Default target
help:
	@echo "lobster-chat build targets:"
	@echo ""
	@echo "  make build          — release build (gateway binary)"
	@echo "  make check          — cargo check (fast, no binaries)"
	@echo "  make test           — all tests (gateway + tui + cli + frontend)"
	@echo "  make test-gateway   — gateway tests only"
	@echo "  make test-tui       — TUI tests only"
	@echo "  make test-cli       — CLI tests only"
	@echo "  make test-frontend  — web-shell frontend tests only"
	@echo "  make lint           — clippy workspace-wide"
	@echo "  make smoke          — CLI + shell + web smoke"
	@echo "  make release        — full release packaging"
	@echo "  make dev            — build + restart gateway"
	@echo "  make clean          — remove build artifacts"
	@echo "  make watch          — cargo watch (gateway auto-rebuild)"

build:
	cargo build --release -p lobster-waku-gateway

check:
	cargo check --workspace

test: test-gateway test-tui test-cli test-frontend
	@echo "all tests passed"

test-gateway:
	cargo test -p lobster-waku-gateway

test-tui:
	cargo test -p lobster-tui

test-cli:
	cargo test -p lobster-cli

test-frontend:
	cd apps/lobster-web-shell && npm test

test-all:
	cargo test --workspace
	cd apps/lobster-web-shell && npm test

lint:
	cargo clippy --workspace -- -D warnings

smoke:
	python3 ./scripts/test_smoke_cli_channel_unit.py
	./scripts/smoke-cli-channel.sh
	./scripts/smoke-shell-dual-http.sh
	./scripts/smoke-web-shell.sh

release:
	./scripts/package-release.sh

dev:
	./scripts/restart-gateway.sh

clean:
	cargo clean
	rm -rf dist/

watch:
	cargo watch -x "build --release -p lobster-waku-gateway"
