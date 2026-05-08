# Security Policy

## Reporting

Please do not open a public issue for exploitable security bugs. Send a private report to the project maintainer with:

- affected component and version or commit
- reproduction steps
- expected impact
- suggested fix, if known

## Secret handling

This repository must not contain real API keys, SSH keys, local gateway state, private chat logs, or personal account credentials. Before publishing a release or opening a pull request, run a focused secret scan and verify `.gitignore` still excludes local runtime directories.

## Supported scope

The current codebase is an early IM/gateway prototype. Security-sensitive systems such as real relay federation, production identity, and MLS enforcement should be treated as experimental until explicitly documented as production-ready.
