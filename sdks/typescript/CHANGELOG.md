# CHANGELOG

All notable changes to `memoryos-sdk` are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] — 2026-02-15

### Added

- Initial public release of `memoryos-sdk` — the TypeScript / Node client for
  [MemoryOS](https://github.com/c0ntr1butr/MemoryOS) runtime governance.
- **Core client** `MemoryGate` (also exported as `MemoryOS`) with:
  - `evaluate(input)` — returns a `Decision` object (never throws on
    `block`/`escalate`; the caller decides how to react).
  - `guard(input)` — the "sharp" version that throws `PermissionDenied` or
    `HumanApprovalRequired` when the runtime doesn't allow the action.
  - `AbortController`-based timeouts, injectable `fetch` (tests, Deno, Bun,
    non-standard runtimes).
  - `MEMORYGATE_API_KEY` and `MEMORYGATE_URL` env var fallbacks.
- **Rich decision model**: `Decision.allowed`, `.effect`, `.effectivePayload`,
  `.trace: TraceStep[]`, and `.toException()` for zero-boilerplate escalation.
- **Framework middleware** (each shipped as a tree-shakable sub-path):
  - `memoryos-sdk/middleware/langgraph`   — `governedNode(mg, agentId, cfg)`
  - `memoryos-sdk/middleware/openai-agents` — `governed(mg, agentId, agent)`
  - `memoryos-sdk/middleware/crewai`      — `governCrew(mg, agentId, crew)`
  - `memoryos-sdk/middleware/google-adk`  — `governed(mg, agentId, agent)`
  - `memoryos-sdk/middleware/mcp`         — `governMcp(mg, agentId, opts)`
- **Typed error hierarchy**: `GovernanceError` → `NetworkError`,
  `UnknownAgent`, `PermissionDenied`, `HumanApprovalRequired`.
- **Multi-target build** (`tsup`): ESM + CJS + type declarations for every
  entry point. Node ≥ 18, Deno, Bun, and modern browsers supported.
- **CI / CD** via GitHub Actions:
  - `.github/workflows/sdk-ci.yml` — typecheck + tests + build + install-verify
    on Node 18/20/22 for every PR.
  - `.github/workflows/npm-publish.yml` — tag-triggered publish with npm
    provenance (signed builds).
- **Documentation**: shields.io badge row, quickstart, per-framework middleware
  examples, API reference, error handling patterns, and env / self-hosted
  configuration in `README.md`.
- **Compile-verified examples**: `examples/*.ts` are typecheck-gated in CI so
  the README never drifts from working code.

### Notes

- The runtime `MemoryGate` class name is preserved for symmetry with the
  Python SDK (`memorygate`). `MemoryOS` is exported as an alias — both names
  work identically, use whichever fits your brand.
- Provenance is enabled on publish; every version on npm carries a signed
  statement linking back to the exact GitHub commit that produced it.

[0.4.0]: https://github.com/c0ntr1butr/MemoryOS/releases/tag/v0.4.0
