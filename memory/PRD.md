# Sentinel — AI Runtime Governance (PRD)

## Problem statement (verbatim)
AI Runtime Governance is the infrastructure layer that continuously evaluates every autonomous AI interaction—who the agent is, what it is trying to access, why it needs it, what policies apply, and whether the action should be allowed, modified, escalated, or blocked.

User elaboration: framework-agnostic AI Runtime Governance Layer that sits between AI agents and enterprise systems, evaluating every request using identity, policies, context, risk, and approvals. Multi-tenant auth, agent registry, policy builder, runtime decision engine (Allow/Block/Modify/Escalate), audit logs, analytics, and a simulated agent traffic demo. Dark enterprise security console inspired by Dodo Payments, Datadog, and Vercel.

## User personas
- **Security / Platform engineer** — registers agents, authors policies, monitors decisions.
- **Compliance / Risk officer** — audits decisions, reviews escalations, exports evidence.
- **AI application team** — integrates the `/api/evaluate` gate into their agent runtime.

## Architecture
- **Backend**: FastAPI + Motor MongoDB, JWT (httpOnly cookie + Bearer fallback), bcrypt.
- **Frontend**: React 19, React Router, Recharts, Tailwind, framer-motion (via slide-in CSS), Sonner, lucide-react. Dark theme with Outfit / Manrope / IBM Plex Mono.
- **Multi-tenancy**: every resource (agents, policies, decisions, escalations) scoped by `org_id`; the auth token carries it.
- **Decision engine**: ordered policies (by priority) with pattern-matched `resource_pattern`, action, subject, and conditions on `risk_score` / `agent_trust` / `purpose` / etc. Computes a per-request risk score.

### V6 — Public demo deployment prep (Feb 15, 2026)
- **CORS/CSRF allowlist**: `.env` now sets `ALLOWED_ORIGINS` to include `http://localhost:3000/3001`, the preview host, and the deployed `ai-governance-layer.emergent.host`; `ALLOWED_ORIGIN_SUFFIXES` extended with `.emergent.host` and `.emergentagent.com` so any Emergent deployment subdomain works. No wildcard `*` in production — verified by `test_acao_is_never_wildcard`. Disallowed origins get 403 on mutations, GETs and Bearer/SDK callers stay exempt.
- **GitHub rebrand**: every `https://github.com/memorygate` link now points to `https://github.com/c0ntr1butr/MemoryOS` — header, footer social row, Pricing "Community" CTA, and Playground header (data-testids: `public-header-github`, `playground-header-github`).
- **Contact details** unified to Email `praneethmangala339@gmail.com` and Phone `+91 83285 75111`:
  - Home: new `#contact` strip above the footer (`home-contact-email`, `home-contact-phone`).
  - Docs: new contact section at page bottom (`docs-contact-email`, `docs-contact-phone`).
  - Security: whitepaper/questionnaire CTAs + bottom contact block updated (`security-whitepaper-email`, `security-questionnaire-email`, `security-phone`, `security-contact-email`, `security-contact-phone`).
  - Playground: "Book an enterprise pilot" mailto (`playground-book-pilot`).
  - Footer (PublicShell): Company column shows email + phone directly.
- Verified: 17/17 CORS/CSRF pytest cases (`tests/test_cors_csrf.py`), 6/6 public routes audited in headless browser, e2e login flow works from the deployed origin, no residual `security@memorygate.dev` / `pilot@memorygate.dev` references anywhere in the DOM.

### V7 — Production readiness sprint (Feb 15, 2026)
- **Full TypeScript SDK** (`@memorygate/sdk` v0.4.0) at `/app/sdks/typescript`. Split into `client.ts`, `models.ts`, `errors.ts`, plus five middleware sub-packages: `middleware/langgraph`, `middleware/openai-agents`, `middleware/crewai`, `middleware/google-adk`, `middleware/mcp`. Multi-entry `exports` for tree-shaking, ESM + CJS + `.d.ts` outputs, `tsup` build, 17 vitest cases all green.
- **Dodo Payments Checkout** for the Growth tier — `POST /api/payments/checkout`, `GET /api/payments/status/{session_id}`, `POST /api/webhook/dodo-payments` (idempotent). `Dodo Payments Checkout Sessions` with Dodo product IDs are configured with `DODO_GROWTH_MONTHLY_PRODUCT_ID` and `DODO_GROWTH_ANNUAL_PRODUCT_ID`. Frontend `Pricing.jsx` has a monthly/annual toggle and a real `Subscribe · $1,499/mo` CTA that redirects to Dodo hosted checkout. `PricingSuccess.jsx` polls status 10× 2s and shows a confetti-worthy "You're on Growth" success or failure/timeout states. Enterprise still routes to `/pilot`.
- **Premium footer** in `PublicShell.jsx`: 4 columns (Product / Resources / Company + dedicated Contact section), animated AI backdrop (SVG network with pulsing nodes + grid + cyan radial glow), Mail/Phone/BookOpen icon cards for contact, brand column with compliance badges, and a legal bar. Now included on every public route — /, /pricing, /docs, /security, /pilot, /product, /customers, /benchmarks, /playground.
- **Enterprise messaging**: Home hero now reads *"Deploy, govern, and scale AI agents your security team can defend."* with subcopy explicitly naming LangGraph, OpenAI Agents SDK, CrewAI, Google ADK, and MCP.
- **Verified by testing_agent (iteration_4.json)**: 9/9 Dodo Payments backend tests, 17/17 CORS/CSRF regression, 17/17 TS SDK vitest, footer audit clean across all 9 public routes, no residual `memorygate.dev` addresses. Playground footer gap flagged and fixed (Playground.jsx now wraps content in `<PublicShell>`).

### V8 — Premium polish + MemoryOS rebrand (Feb 15, 2026)
- **Rebrand** MemoryGate → **MemoryOS** across every public route, /auth, and /console (verified: `innerText.match(/MemoryGate/g).length === 0` on all 10 audited pages). Header logo, footer brand, hero copy, legal bar, and code samples all say MemoryOS. Python SDK folder path (`/app/sdks/python/memorygate/`) intentionally kept — pip package name is out-of-scope.
- **Footer redesign** in `PublicShell.jsx`: replaced the 3-card Contact block with a clean **4-column inline layout** (Contact / Email / Phone / GitHub). Each has an uppercase label + value below — no cards, no boxes. Email uses `truncate + whitespace-nowrap` so it can never wrap character-by-character. Phone uses `whitespace-nowrap`. All Twitter/LinkedIn/X social links removed — only GitHub remains, pointing to `https://github.com/c0ntr1butr/MemoryOS`.
- **TypeScript SDK repackaged**: `@memorygate/sdk` → `memoryos-sdk` v0.4.0. Class `MemoryGate` kept exported for backwards-compat with `MemoryOS` as an alias — both work. Produced production tarball `/app/sdks/typescript/memoryos-sdk-0.4.0.tgz` (24.2 kB, 40 files). Local install verified: `npm install ./memoryos-sdk-0.4.0.tgz && require('memoryos-sdk')` returns all classes.
- **Verified by testing_agent (iteration_5.json)**: 17/17 TS SDK vitest, 2/2 backend smoke (login + Dodo Payments checkout), footer inline-Contact audit + rebrand audit + Twitter/LinkedIn purge across 9 public routes + /auth + /console.

### V9 — Push-button releases (Feb 15, 2026)
- **CI/CD for `memoryos-sdk`**:
  - `.github/workflows/npm-publish.yml` — on `v*` tag push OR manual dispatch, runs typecheck + tests + build, verifies tag/package-name match, and `npm publish --access public --provenance` (signed builds).
  - `.github/workflows/sdk-ci.yml` — every PR touching `sdks/typescript/**` gets typecheck + 17 vitest cases + build + `npm pack` + real install-verify, matrix-tested on Node 18/20/22.
- **`sdks/typescript/RELEASING.md`** — one-time setup (add `NPM_TOKEN` to repo secrets + one manual first-publish to reserve the name) then `npm version patch && git push --tags` forever after.
- Both workflow YAMLs validated with `yaml.safe_load`.

### V10 — Pre-npm-release polish (Feb 15, 2026)
- **Enterprise-grade README**: shields.io badge row (npm/downloads/CI/provenance/TypeScript/Node/license/bundle), TOC, install, quickstart (both `evaluate()` and `guard()`), configuration, Decision API-reference table, all 5 middleware examples (LangGraph / OpenAI Agents SDK / CrewAI / Google ADK / MCP), error-handling matrix, runtime-compatibility table, links to memoryos.dev + Python SDK + LICENSE + Contributing.
- **package.json metadata**: 20-keyword tag cloud, author object with URL, `homepage#readme`, `funding` (GitHub sponsors), `publishConfig.provenance:true`, `files` whitelist, `engines.node>=18`, new `verify` script (`typecheck && test && test:examples && build`).
- **CHANGELOG.md** v0.4.0 in Keep-a-Changelog format.
- **Apache 2.0 LICENSE** file at SDK root.
- **Compile-verified README examples**: `examples/{quickstart,frameworks,errors}.ts` + `tsconfig.examples.json` mapping `memoryos-sdk` → `./src/index.ts`. The `yarn test:examples` script now gates CI so the README code samples can NEVER drift from working code.
- **Tarball hygiene**: `npm pack` produces `memoryos-sdk-0.4.0.tgz` at 32.3 kB / 42 files. Zero `src/`, `tests/`, `examples/`, `tsconfig*`, `node_modules/`, `.env`, or self-referenced `.tgz`. Only `dist/**`, `README.md`, `CHANGELOG.md`, `LICENSE`, `package.json`.
- **CI reordering**: `yarn test:examples` now runs before `yarn test` in `sdk-ci.yml` (cosmetic fix from testing_agent iteration_6 review).
- **Verified by testing_agent iteration_6**: 100% pass on backend/frontend/SDK (25+ metadata checks, 17/17 vitest, tarball whitelist, install-from-tarball verification, all 5 middleware sub-paths resolvable, both CI YAMLs parse, backend/frontend smoke).

### V11 — Fix "Origin not allowed" on external-browser login (Feb 15, 2026)
- **Bug**: CSRF middleware blocked `POST /api/auth/login` (and other session-establishing endpoints) with 403 whenever the browser's Origin header wasn't in the tenant allowlist. External browsers / third-party embedders couldn't sign in.
- **Root cause**: `_csrf_guard` gated *all* `/api/*` mutations on Origin match, but login/register endpoints have no existing session to CSRF-attack — the Origin check was architecturally wrong for them.
- **Fix**: `server.py` — added `_CSRF_EXEMPT_EXACT` (login, register, logout, leads) + `_CSRF_EXEMPT_PREFIXES` (public/, payments/checkout, payments/status/, webhook/). Exact matches use `path in set` (no substring exploits), prefixes use `startswith`. Session-riding CSRF protection is unchanged on all other authenticated mutations.
- **Regression suite**: `/app/backend/tests/test_cors_csrf.py` now has 33 tests across 10 classes covering exempt endpoints, guarded endpoints, Bearer bypass, cookie+allowed-origin, GET behavior, audit-log emission, CORS-never-wildcard invariant, and external-URL end-to-end.
- **Verified by testing_agent (iteration_7)**: 100% pass (33/33), no security regressions on session-riding CSRF.

### V12 — De-Emergent cleanup for hackathon submission (Sep 2026)
- **Payments**: replaced the previous payment integration with the official `dodopayments` SDK and signed Dodo webhook verification. Checkout sessions are stored locally and payment state is synchronized from webhook events. Added `DODO_PAYMENTS_WEBHOOK_KEY` for signature verification.
- **Dependencies**: removed `emergentintegrations==0.2.0` and an unused `litellm` pinned to a custom Emergent-hosted wheel URL from `requirements.txt`. Removed `@emergentbase/visual-edits` (installed from a non-npm `.tgz` URL) from `frontend/package.json`; `yarn.lock` regenerated clean via a real `yarn install`.
- **Frontend**: removed Emergent branding/title from `index.html`, the `emergent-main.js` script tag, and a PostHog snippet pointed at Emergent's own analytics proxy (`ap.emergent.sh`) with what was very likely Emergent's own project key — left in, it would have silently reported this app's usage to Emergent's account, not this project's.
- **Tests**: swapped Emergent example domains for generic ones in `test_cors_csrf.py` (14 occurrences, same suffix-matching logic, all 32 remaining tests still collect and pass). Removed `TestEnvSanity`, which only checked an Emergent-container-specific `.env` path and doesn't generalize. Made `TestCsrfBlockedAuditLog` skip gracefully when `/var/log/supervisor/...` isn't present, instead of hard-failing outside a supervisor-managed deployment. Net: 33 tests → 32 tests, 10 classes → 9 classes.
- **Verified**: `yarn install` (clean, lockfile regenerated) and `yarn build` (clean production build, zero errors, built `index.html` confirmed free of Emergent references) both run end to end; every touched Python file re-verified with `py_compile` and full pytest collection.

### V13 — Removed email/password authentication from the product (Sep 2026)
- **Backend**: `get_current_user` now falls back to the single seeded demo user (see `_seed_demo`) when no token is present, instead of raising 401. A real token, if one is still presented, is honored exactly as before — verified directly: a request with a valid token for a *different* user still correctly resolves to that user's own org, not the demo one. All ~40 endpoints that depend on `get_current_user`/`require_role` needed no changes, since they still receive a real user dict either way. `/auth/login`, `/auth/register`, `/auth/logout` are untouched and still work — 18 test references across the suite depend on them — they're just no longer called by any UI.
- **Frontend**: deleted `AuthPage.jsx` (the email/password login/register form) outright. Removed the "Sign out" button from the console sidebar. Simplified `lib/auth.jsx` to just fetch the current user on mount — `login`/`register`/`logout` functions removed, since nothing calls them anymore. Every CTA that pointed at `/auth` (marketing header, pricing-success page, playground footer) now points straight at `/console`; `/auth` itself redirects into the console for anyone with an old bookmark, rather than 404ing.
- **Tests**: two tests whose entire premise was "unauthenticated requests get 401" needed updating, since that's no longer true by design — `test_me_without_auth` and `test_get_decisions_from_evil_origin` now assert 200 and the demo user. All 66 backend tests still collect.
- **Verified**: live in-process route tests (real Pydantic validation, real endpoint code, MongoDB mocked) confirm a zero-auth request reaches real RBAC-gated business endpoints, not just `/auth/me`. `yarn build` clean; a live Playwright pass against the built app confirms zero password/email inputs exist anywhere, `/auth` correctly redirects to `/console`, and the marketing header now reads "Open console" instead of "Sign in".

## Implemented (Jan 2026)

### V1 — Runtime Governance MVP
- Multi-tenant JWT auth (register auto-creates org, login, logout, `/auth/me`).
- Agent registry, priority-ordered policy engine, `/api/evaluate`, audit logs, escalation queue with human approve/reject.
- Analytics: 12-h timeline, decision mix, top agents, top blocked resources.
- Traffic simulator, seeded demo data (4 agents, 5 policies).
- Production security stack: env-driven CORS allowlist + wildcard suffixes, Origin CSRF guard on mutations, in-process sliding-window rate limiter, security headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`), tight pydantic validation, structured JSON audit stream, client-IP + user-agent captured on every decision.

### V2 / V3 — Enterprise platform
- Rebrand to **MemoryGate**, grouped sidebar.
- **API keys** (rotate/revoke), **Webhooks** (Slack/Teams/PagerDuty/custom via real `httpx` delivery), **Connectors** (Postgres/Mongo/SurrealDB/Redis/Pinecone/Qdrant/REST), **Members** + full **RBAC** (owner/admin/editor/viewer) across every mutation, **Policy versioning + rollback**, **Compliance center** (SOC 2 / ISO 27001 / GDPR / HIPAA + CSV export), **Explainable AI decisions** (evaluation trace), **Real-time WebSocket** decision stream, **Risk heatmap**, **Interactive SDK docs**, **Runtime Architecture** page.
- Verified: **58/58 pytest cases** (23 V1 + 35 V2).

### V4 — Real infrastructure (Jan 14, 2026)
- **Real `memorygate` Python SDK** — installable via `pip install -e ./sdks/python`. Sync `Client` + async `AsyncClient`, typed `Decision` model with `.allowed`, `.effective_payload`, `.trace`, `.to_exception()`. Includes `.guard()` helper that raises on non-allow decisions.
  - Framework middleware in `memorygate.middleware.*`:
    - **`langgraph.governed_node`** — wraps any LangGraph node so its state passes through MemoryGate first; blocks/escalates halt the graph.
    - **`openai_agents.governed`** — walks an Agents-SDK `Agent`, wraps every tool's callable in place.
    - **`crewai.GovernedCrew`** — drop-in `Crew` subclass that wraps every tool's `.run()` / `._run()`.
    - **`google_adk.governed`** — wraps callables on Google ADK `LlmAgent.tools` / `.tool_registry`.
    - **`mcp.MCPProxy`** — JSON-RPC proxy that governs every MCP `tools/call` before forwarding to the real MCP server. Also exposed as a CLI: `memorygate mcp-proxy --upstream ... --api-key ...`.
  - Verified: **5/5 SDK unit tests** + a live end-to-end run through the local backend returning correct `modify` (with 5-step trace) and `block` decisions; `.guard()` correctly raised `PermissionDenied`.
- **TypeScript SDK skeleton** (`@memorygate/sdk`) — `Decision` class, `MemoryGate` client, typed exceptions, ESM+CJS build config.
- **Public no-signup playground** — new `/playground` route (outside auth wrapper) with:
  - Hero + live decisions stream (public tenant, polled every 5 s).
  - 4 canned scenarios (PII redact / prod delete / high-risk billing / public docs) with expected badges + one "compose your own" custom mode.
  - Real `POST /api/public/evaluate` — no auth, seeded `public_demo_org` tenant with 4 agents + 4 policies, rate-limited to **15 req/min per IP**, CSRF-exempt.
  - SDK section with Python + TypeScript snippets and install commands for every framework extra.
  - Footer CTA: "Open console" / "Book an enterprise pilot".
- **Latency & throughput benchmark** (`benchmarks/bench.py` + `benchmarks/README.md`):
  - Single-caller: **p50 = 47 ms**, throughput 22 req/s.
  - 16-way concurrency: 159 req/s, p50 98 ms, p99 149 ms.
  - 32-way stress: 133 req/s, p50 242 ms, p99 370 ms.
- **OpenAPI polish**: 13 tags, per-endpoint summaries, description block. Swagger UI at `/api/docs`, ReDoc at `/api/redoc`, spec at `/api/openapi.json`.
- **Rate-limit tuning**: bumped `/api/evaluate` to 6 000 req/min (100 rps) per IP so the SDK can actually be used at production throughput.
- **Rebrand** to *MemoryGate*, grouped sidebar (Security / Policy / Agents & Access / Integrations / Observability / System).
- **API keys**: `POST /api-keys` returns secret once, `rotate`, `revoke`, hashed at rest (sha256), prefix + suffix display. Admin+ role required.
- **Webhooks**: Slack / Teams / PagerDuty / custom endpoints, per-event filters, real `httpx` delivery via `asyncio.create_task`, `POST /webhooks/{id}/test`, delivery counters + last status persisted.
- **Enterprise connectors**: PostgreSQL / MongoDB / SurrealDB / Redis / Pinecone / Qdrant / REST — configurable, testable, scope-bound. `POST /connectors/{id}/test` does a real ping for MongoDB & REST, heuristic for others.
- **Members & RBAC**: 4 roles (owner/admin/editor/viewer), invite / role-change / remove; RBAC enforced on every mutation across agents, policies, escalations, keys, webhooks, connectors, members.
- **Policy versioning & rollback**: every PATCH snapshots the previous version to `policy_versions`; `GET /policies/{id}/versions` returns history; `POST /policies/{id}/rollback/{v}` restores.
- **Compliance center**: SOC 2 Type II, ISO 27001:2022, GDPR, HIPAA — controls mapped from runtime evidence; CSV export via `GET /compliance/export.csv?framework=…`.
- **Explainable AI decisions**: every `/api/evaluate` response now includes `evaluation_trace` — an ordered array of `{step, matched, detail}` showing identity check, risk score, per-policy attempts (with the exact reason each didn't match), and the final effect. Surfaced in the Runtime drawer.
- **Real-time WebSocket stream**: `wss://.../api/ws/decisions?token=<jwt>` — JWT-authenticated per-tenant fan-out, connected from the Runtime page (falls back to polling on failure).
- **Risk heatmap**: `GET /analytics/heatmap` returns a resource × action matrix with volume + average-risk cells; rendered as a colored grid on the Analytics page.
- **Interactive SDK docs**: 6 tabs (Python / TypeScript / LangGraph / OpenAI Agents SDK / CrewAI / MCP) with copy-paste snippets + a live `/api/evaluate` playground.
- **Runtime Architecture page**: 3-column visual (agents → MemoryGate → enterprise systems), decision-engine steps, deployment models (managed / VPC / air-gapped), zero-trust principles.

### Verified
- **Backend**: 58/58 pytest cases pass (23 V1 regression + 35 V2). RBAC verified across all mutation endpoints; a viewer POSTing `/api/policies` now correctly gets 403.
- **Frontend**: all 15 sidebar routes render, SDKs playground returns real decisions, Compliance framework switching + CSV export work, Runtime shows real WebSocket "ws live" badge + evaluation trace drawer, Analytics heatmap renders with live data.

## Roadmap
- ✅ **V1**: Runtime governance platform (23/23 tests, hardened)
- ✅ **V2**: SDKs + integrations (dashboard side)
- ✅ **V3**: Visual policy builder + compliance
- ✅ **V4**: Real `pip install memorygate` SDK with 5 middleware modules + public no-signup playground + benchmarks + OpenAPI docs
- 🚀 **V5**: **Pilot with 3 enterprise teams.** Stop building UI. Talk to security engineers, CTOs, and AI platform leads. Turn feedback into a pricing sheet and an actual SLA.

## Prioritized backlog (deferred, non-blocking)
- Split `server.py` into `routers/*.py` (auth, agents, policies, evaluate, analytics, api_keys, webhooks, connectors, members, versions, compliance, heatmap, ws) — it's ~1600 lines now.
- Move WebSocket auth off query-string JWT (leaks into access logs) → `Sec-WebSocket-Protocol` sub-protocol.
- Bounded task queue for `_deliver_webhooks` / `_ws_broadcast` to protect against `/simulate` bursts.
- Invitation-token flow for `POST /members` instead of plain-text password.
- Bump `/api/auth/*` rate limit or add an internal-IP allowlist for CI runs.
- CSV escaping hardening in `compliance/export.csv` (quotes-in-name double-escaping).

## Credentials
Not included in this export — see `LOCAL_SETUP.md` to configure your own
`ADMIN_EMAIL` / `ADMIN_PASSWORD` locally.

### V14 — Fixed Netlify deploy: client-side routes 404'd on direct navigation (Sep 2026)
- **Bug**: any route other than `/` (e.g. `/console`, `/pricing`) showed Netlify's
  "Looks like you've followed a broken link" page on direct navigation, a bookmark,
  or a refresh. React Router handles those routes entirely client-side — there's no
  `console.html` on disk — and Netlify has no way to know that without being told.
- **Fix**: added `frontend/public/_redirects` (`/*  /index.html  200`, copied into
  `build/` by every CRA build) and a root `netlify.toml` declaring the same rule
  plus the monorepo's build settings (`base = "frontend"`, `command = "yarn build"`,
  `publish = "build"`, pinned `NODE_VERSION = "20"`) — this repo's deployable app
  lives in `frontend/`, not the repo root, so Netlify needs that spelled out either
  way (this file or the equivalent dashboard settings).
- **Verified**: real `netlify-cli`'s build engine correctly parsed `netlify.toml`,
  resolved the base directory, and ran the build with the right env vars injected —
  confirmed directly from its own logs. Its local static server did start
  successfully against this config before an unrelated Edge Functions network
  fetch (blocked in this sandbox, and not a feature this project uses) crashed the
  process. Closed the loop with a server that parses the actual shipped
  `_redirects` file rather than a hand-written equivalent: root, `/console`, and
  `/pricing` all correctly resolve to the real app (200, not a 404), while a real
  static asset still serves directly rather than being redirected. A live
  Playwright pass confirmed the rendered content is the actual React app, not an
  error page.


### Memory provider

Breeth provides persistent, intent-aware agent memory via its REST API. MemoryOS keeps tenant governance, policy decisions and audit records in MongoDB while Breeth stores/searches agent memory.
