<div align="center">

# `memoryos-sdk`

**Runtime governance for autonomous AI agents.**
_Zero-trust decisions in milliseconds — for every LangGraph node, OpenAI Agents tool,
CrewAI task, Google ADK action, and MCP call._

[![npm version](https://img.shields.io/npm/v/memoryos-sdk?color=%2306b6d4&label=npm)](https://www.npmjs.com/package/memoryos-sdk)
[![npm downloads](https://img.shields.io/npm/dw/memoryos-sdk?color=%2306b6d4)](https://www.npmjs.com/package/memoryos-sdk)
[![CI status](https://img.shields.io/github/actions/workflow/status/c0ntr1butr/MemoryOS/sdk-ci.yml?branch=main&label=CI)](https://github.com/c0ntr1butr/MemoryOS/actions/workflows/sdk-ci.yml)
[![npm provenance](https://img.shields.io/badge/provenance-verified-06b6d4)](https://docs.npmjs.com/generating-provenance-statements)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/node/v/memoryos-sdk?color=%2306b6d4)](https://nodejs.org/)
[![Apache 2.0](https://img.shields.io/npm/l/memoryos-sdk?color=%2306b6d4)](./LICENSE)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/memoryos-sdk?label=bundle&color=%2306b6d4)](https://bundlephobia.com/package/memoryos-sdk)

[Website](https://memoryos.dev) · [Docs](https://memoryos.dev/docs) · [Playground](https://memoryos.dev/playground) · [Python SDK](https://github.com/c0ntr1butr/MemoryOS/tree/main/sdks/python) · [Changelog](./CHANGELOG.md)

</div>

---

## What is MemoryOS?

MemoryOS is the **runtime infrastructure layer for autonomous AI**. Every time one
of your agents wants to read a customer record, hit a payments API, deploy code,
or call a tool, it asks the MemoryOS runtime first:

> _"Given who this agent is, what it's trying to do, and the risk of doing it —
> should I allow, block, modify, or escalate?"_

The runtime answers in milliseconds. Answers are **explainable** (every decision
carries a trace of which policies fired and why), **versioned** (policies are
first-class objects with history), and **auditable** (a signed record of every
decision is emitted for your SIEM).

This package is the TypeScript / Node client. There's also a Python SDK
([`pip install memorygate`](https://github.com/c0ntr1butr/MemoryOS/tree/main/sdks/python))
and a plain REST API.

---

## Table of contents

- [Installation](#installation)
- [Quickstart](#quickstart)
- [Configuration](#configuration)
- [API reference](#api-reference)
- [Framework middleware](#framework-middleware)
  - [LangGraph](#langgraph)
  - [OpenAI Agents SDK](#openai-agents-sdk)
  - [CrewAI](#crewai)
  - [Google ADK](#google-adk)
  - [Model Context Protocol (MCP)](#model-context-protocol-mcp)
- [Error handling](#error-handling)
- [Environment variables](#environment-variables)
- [Runtime compatibility](#runtime-compatibility)
- [Contributing](#contributing)
- [License](#license)

---

## Installation

```bash
npm install memoryos-sdk
# or: yarn add memoryos-sdk
# or: pnpm add memoryos-sdk
# or: bun add memoryos-sdk
```

Node ≥ 18 (uses native `fetch` + `AbortController`). Also works in Deno, Bun,
and modern browsers. Zero non-dev dependencies.

Grab a runtime API key at [memoryos.dev](https://memoryos.dev) → *Console* → *API
Keys*, or [book an enterprise pilot](https://memoryos.dev/pilot) for a
self-hosted install.

---

## Quickstart

```ts
import { MemoryOS } from "memoryos-sdk";

const mg = new MemoryOS({ apiKey: process.env.MEMORYOS_API_KEY });

const decision = await mg.evaluate({
  agentId:  "agent_crm_copilot",
  resource: "customers.read",
  action:   "read",
  purpose:  "Answer support ticket #4212",
  payload:  { customerId: 42 },
});

if (decision.allowed) {
  const safePayload = decision.effectivePayload;   // may be redacted on "modify"
  return await crm.read(safePayload);
}

// block or escalate — turn the Decision into a typed exception
throw decision.toException();
```

Prefer exceptions? Use `guard()` — same call, but non-allow decisions raise:

```ts
const d = await mg.guard({
  agentId:  "agent_finance",
  resource: "billing.write",
  action:   "write",
  purpose:  "wire $85,000 to vendor",
  payload:  { amount: 85_000, vendor: "ACME" },
});

await bank.transfer(d.effectivePayload!);   // safe: allowed or modified.
```

---

## Configuration

```ts
new MemoryOS({
  apiKey:         process.env.MEMORYOS_API_KEY,   // required
  baseUrl:        "https://api.memorygate.dev",   // or point at self-hosted
  timeoutMs:      5000,                           // per-request timeout
  defaultAgentId: "agent_default",                // skip agentId on every call
  fetch:          globalThis.fetch,               // inject for tests / Deno
});
```

Everything is env-driven if you don't pass options:

| Option           | Env var                 | Default                        |
|------------------|-------------------------|--------------------------------|
| `apiKey`         | `MEMORYGATE_API_KEY`    | _(required)_                   |
| `baseUrl`        | `MEMORYGATE_URL`        | `https://api.memorygate.dev`   |
| `timeoutMs`      | —                       | `5000`                         |

> **Note:** the env var names use the internal `MEMORYGATE_` prefix (they map to
> the Python SDK). `MemoryOS` is the brand; both `MemoryOS` and `MemoryGate` are
> exported classes and behave identically.

---

## API reference

### `new MemoryOS(options)`

Create a client. Throws `GovernanceError` if `apiKey` is missing.

### `mg.evaluate(input) → Promise<Decision>`

Evaluates one agent action. **Never throws on `block` / `escalate`** — inspect
`decision.effect` yourself or use `guard()`.

```ts
interface EvaluateInput {
  agentId?:  string;                       // required if no defaultAgentId
  resource:  string;                       // e.g. "customers.read"
  action?:   string;                       // "read" | "write" | "call" | ...
  purpose?:  string;                       // human-readable reason
  payload?:  Record<string, unknown>;      // the actual arguments
  context?:  Record<string, unknown>;      // request context / metadata
}
```

### `mg.guard(input) → Promise<Decision>`

Same as `evaluate()` but throws when the decision is not `allow` / `modify`.

### `Decision`

| Property             | Type                                | Notes                                        |
|----------------------|-------------------------------------|----------------------------------------------|
| `id`                 | `string`                            | Decision ID (for audit trail lookup)         |
| `effect`             | `"allow"` \| `"block"` \| `"modify"` \| `"escalate"` | Same as `.decision`                           |
| `allowed`            | `boolean`                           | `true` for `allow` **or** `modify`           |
| `effectivePayload`   | `Record<string, unknown>` \| `null` | Original for `allow`, redacted for `modify`, `null` for `block`/`escalate` |
| `riskScore`          | `number`                            | 0–100, from the runtime scorer               |
| `policyId`, `policyName` | `string`, `string`              | Which policy matched                         |
| `reason`             | `string`                            | Human explanation                            |
| `trace`              | `TraceStep[]`                       | Ordered explainability trace                 |
| `raw`                | `DecisionResponse`                  | Untouched wire response                      |
| `.toException()`     | `→ Error`                           | Convert to typed exception                   |

---

## Framework middleware

Sub-path imports — pick only what you use. Tree-shakable, zero cost for what you
don't import.

### LangGraph

```ts
import { StateGraph } from "@langchain/langgraph";
import { MemoryOS }              from "memoryos-sdk";
import { governedNode }          from "memoryos-sdk/middleware/langgraph";

interface State { customerId: number; op: "read" | "write"; userTask: string; }

const mg = new MemoryOS({ apiKey: process.env.MG_KEY });

const guardedCrmNode = governedNode<State>(mg, "agent_crm", {
  resource: (s) => `customers.${s.op}`,
  action:   (s) => s.op,
  purpose:  (s) => s.userTask,
  payload:  (s) => ({ customerId: s.customerId }),
})(async (state) => {
  // your original node logic — only runs on allow/modify
  return await crm.handle(state);
});

graph.addNode("crm", guardedCrmNode);
```

### OpenAI Agents SDK

```ts
import { Agent }    from "@openai/agents";     // or @openai/agents-sdk
import { MemoryOS } from "memoryos-sdk";
import { governed } from "memoryos-sdk/middleware/openai-agents";

const mg = new MemoryOS({ apiKey: process.env.MG_KEY });

const agent = new Agent({
  name: "finance-copilot",
  tools: [wireTransfer, readInvoice, sendEmail],
});

governed(mg, "agent_finance", agent);   // wraps every tool in place
```

### CrewAI

```ts
import { Crew, Agent } from "crewai-ts";
import { MemoryOS }    from "memoryos-sdk";
import { governCrew }  from "memoryos-sdk/middleware/crewai";

const mg = new MemoryOS({ apiKey: process.env.MG_KEY });

const crew = new Crew({ /* ... */ });
governCrew(mg, "agent_research", crew);
```

### Google ADK

```ts
import { LlmAgent } from "@google/adk";
import { MemoryOS } from "memoryos-sdk";
import { governed } from "memoryos-sdk/middleware/google-adk";

const mg = new MemoryOS({ apiKey: process.env.MG_KEY });

governed(mg, "agent_support", agent);
```

### Model Context Protocol (MCP)

Route every `tools/call` through MemoryOS before it hits the real MCP server.
Blocks return JSON-RPC error `-32001`, escalations return `-32002`.

```ts
import { MemoryOS }  from "memoryos-sdk";
import { governMcp } from "memoryos-sdk/middleware/mcp";

const mg = new MemoryOS({ apiKey: process.env.MG_KEY });

const proxy = governMcp(mg, "agent_mcp", {
  forward: async (msg) => realMcpClient.send(msg),
});

// Wire proxy(rpc) into your MCP transport instead of the raw client.
```

---

## Error handling

Every error inherits from `GovernanceError`, so one `catch` can differentiate by
class:

```ts
import {
  MemoryOS,
  PermissionDenied,
  HumanApprovalRequired,
  NetworkError,
  UnknownAgent,
} from "memoryos-sdk";

try {
  await mg.guard({ /* ... */ });
} catch (e) {
  if (e instanceof PermissionDenied) {
    // Blocked. e.reason, e.policyName, e.decisionId are populated.
    return respondPolicyBlocked(e);
  }
  if (e instanceof HumanApprovalRequired) {
    // Handed to a human. Poll /decisions/{e.decisionId} for the outcome.
    return queueForApproval(e.decisionId);
  }
  if (e instanceof UnknownAgent) {
    // The agentId doesn't exist for your tenant.
    throw new Error(`Register agent first: ${e.message}`);
  }
  if (e instanceof NetworkError) {
    // Timeout / DNS / TLS. Consider a local fail-open policy.
    return failOpen();
  }
  throw e;   // unknown — re-raise
}
```

### Two decision styles

| Method       | On `block` / `escalate`               | Best for                                  |
|--------------|---------------------------------------|-------------------------------------------|
| `evaluate()` | Returns a `Decision`; never throws.   | Custom UX, retries, telemetry.            |
| `guard()`    | Throws `PermissionDenied` / `Human…`. | Middleware, tools, RPC handlers.          |

---

## Environment variables

| Var                   | Purpose                                       |
|-----------------------|-----------------------------------------------|
| `MEMORYGATE_API_KEY`  | Falls back if `apiKey` is not passed.         |
| `MEMORYGATE_URL`      | Point at a self-hosted runtime.               |

---

## Runtime compatibility

| Runtime            | Status |
|--------------------|--------|
| Node ≥ 18          | ✅     |
| Bun                | ✅     |
| Deno               | ✅     |
| Cloudflare Workers | ✅ (pass injected `fetch`) |
| Modern browsers    | ✅ (for public playground use — do **not** ship your API key to the browser in production) |

ESM + CJS + `.d.ts` all published. Package is `sideEffects: false` so
tree-shaking works in every modern bundler.

---

## Contributing

- Repo: [c0ntr1butr/MemoryOS](https://github.com/c0ntr1butr/MemoryOS)
- Issues: [github.com/c0ntr1butr/MemoryOS/issues](https://github.com/c0ntr1butr/MemoryOS/issues)
- Local dev:
  ```bash
  git clone https://github.com/c0ntr1butr/MemoryOS
  cd MemoryOS/sdks/typescript
  yarn install
  yarn verify           # typecheck + test + example-typecheck + build
  ```
- Releasing (maintainers): see [`RELEASING.md`](./RELEASING.md).

Every PR runs typecheck + 17 vitest cases + example-compile-check + install
verify on Node 18/20/22.

---

## License

[Apache 2.0](./LICENSE) © 2026 MemoryOS.
