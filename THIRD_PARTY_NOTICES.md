# Third-Party Notices

This repository is released under the MIT License. See `LICENSE`.

This file records the main open-source technologies and dependency license families used by Active Joined Worlds (A.J.W), currently prepared from the `lobster-chat` codebase. The authoritative license terms remain the upstream package manifests and license files.

## Direct Runtime And Development Dependencies

### Rust workspace

The Rust crates in this repository use the Rust 2024 edition and are licensed as MIT through the workspace manifest.

| Technology | Where used | License |
| --- | --- | --- |
| serde | Core models, gateway API payloads, storage encoding | MIT OR Apache-2.0 |
| serde_json | CLI, TUI, gateway, transport JSON contracts | MIT OR Apache-2.0 |
| tiny_http | Local gateway HTTP server | MIT OR Apache-2.0 |
| ureq | CLI/TUI/gateway HTTP client calls | MIT OR Apache-2.0 |
| postcard | Compact local/storage/transport encoding | MIT OR Apache-2.0 |
| ratatui | Terminal UI client | MIT |
| crossterm | Terminal input/output backend | MIT |
| sha2 | Hashing utilities in gateway contracts | MIT OR Apache-2.0 |
| hex | Hex encoding/decoding utilities | MIT OR Apache-2.0 |
| tempfile | Test-time temporary directories/files | MIT OR Apache-2.0 |

### H5 web shell

| Technology | Where used | License |
| --- | --- | --- |
| Phaser | Web scene/game-style rendering prototype dependency | MIT |
| RPGUI | Retro UI styling prototype dependency | Zlib |
| @chenglou/pretext | Text/pretext utility dependency | MIT |

## Transitive Dependency License Families

The Rust dependency graph currently resolves to permissive/open licenses, mainly:

- MIT
- Apache-2.0
- MIT OR Apache-2.0
- BSD-3-Clause
- ISC
- Zlib
- Unlicense OR MIT
- Unicode-3.0
- CDLA-Permissive-2.0
- Apache-2.0 WITH LLVM-exception variants

Known non-copyleft transitive packages include RustCrypto crates, rustls/webpki crates, ratatui/crossterm support crates, ICU4X Unicode data crates, and Bytecode Alliance WASI/Wasm utility crates.

## Assets And Project Content

Unless a file states otherwise, repository-owned source files, documentation, tests, and generated project assets are covered by this repository's MIT License.

Large visual reference assets that contained third-party image metadata were removed from the open-source export candidate. Reintroduced visual assets should include clear provenance notes before public release.

## Verification Commands

Use these commands to refresh the dependency/license view before a public release:

```bash
cargo metadata --format-version 1 \
  | jq -r '.packages[] | select(.source != null) | [.name,.version,(.license // "UNKNOWN"),(.repository // "")] | @tsv' \
  | sort -u

npm view @chenglou/pretext@0.0.6 license repository.url --json
npm view phaser@3.90.0 license repository.url --json
npm view rpgui@1.0.3 license repository.url --json
```
