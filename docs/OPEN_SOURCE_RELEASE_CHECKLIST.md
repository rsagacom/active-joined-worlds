# Open Source Release Checklist

Use this checklist before pushing a public repository or release archive.

## Must exclude

- `.lobster-chat-dev/`
- `target/`
- `node_modules/`
- `.playwright-cli/`
- `dist/`
- `output/`
- `backups/`
- `test-results/`
- local screenshots, logs, `.DS_Store`, and editor swap files

## Required checks

```bash
rg -n --hidden -S "(sk-[A-Za-z0-9_-]{20,}|api[_-]?key|secret|password|authorization|bearer|BEGIN (RSA|OPENSSH|PRIVATE) KEY)" . \
  --glob '!target/**' \
  --glob '!node_modules/**' \
  --glob '!.lobster-chat-dev/**' \
  --glob '!.playwright-cli/**' \
  --glob '!dist/**' \
  --glob '!output/**' \
  --glob '!backups/**' \
  --glob '!test-results/**' \
  --glob '!**/*.png' \
  --glob '!**/*.jpg' \
  --glob '!**/*.jpeg' \
  --glob '!**/*.webp' \
  --glob '!**/*.avif' \
  --glob '!**/*.wasm'
```

```bash
git log --format='%h %an <%ae>' --all | sort -u
```

```bash
cargo test --workspace
node --test apps/lobster-web-shell/test/*.mjs
./scripts/smoke-web-shell.sh
```

## Manual confirmation

- Confirm the GitHub owner and repository name.
- Confirm public/private visibility.
- Confirm license: repository uses the MIT License.
- Confirm third-party notices: `THIRD_PARTY_NOTICES.md` exists and is linked from `README.md`.
- Confirm Git author emails do not expose local machine names or private email addresses.
- Confirm contribution policy: external contributions are accepted under MIT terms.
- Confirm generated visual assets are allowed to be redistributed.
