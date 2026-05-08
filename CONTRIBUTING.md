# Contributing to lobster-chat

lobster-chat uses an open-source contribution model: use the project, report issues, and send pull requests that improve the shared codebase.

## Development flow

1. Fork the repository and create a feature branch.
2. Keep changes focused on one concern.
3. Run the relevant checks before opening a pull request.
4. Describe the user-facing behavior, tests run, and any compatibility risks.

## Local checks

```bash
cargo test --workspace
node --test apps/lobster-web-shell/test/*.mjs
./scripts/smoke-web-shell.sh
```

For gateway-only changes, run the package-level test first:

```bash
cargo test -p lobster-waku-gateway
```

## Contribution boundaries

- Do not commit local runtime state, logs, screenshots, secrets, or machine-specific paths.
- Gateway contracts are the source of truth; H5 and TUI clients should not invent private success state.
- Keep UI changes compatible with the current H5 IM path unless the pull request explicitly changes that contract.
- For generated or AI-assisted assets, document the source and confirm they are safe to redistribute.

## Licensing of contributions

By submitting a contribution, you agree that your contribution is licensed under the same MIT License that covers this repository. You must have the right to submit the contribution, and it must not knowingly include third-party code, assets, secrets, or data that cannot be redistributed under MIT terms.
