import { describe, it, expect } from "vitest";
import { MemoryGate } from "../src/index.js";
import { governedNode } from "../src/middleware/langgraph.js";
import { governed as governedOpenAI } from "../src/middleware/openai-agents.js";
import { governCrew } from "../src/middleware/crewai.js";
import { governed as governedAdk } from "../src/middleware/google-adk.js";
import { governMcp, type JsonRpcRequest } from "../src/middleware/mcp.js";

function mockClient(effect: "allow" | "block" | "modify" | "escalate", modifiedPayload: Record<string, unknown> | null = null) {
  return new MemoryGate({
    apiKey: "mg_test",
    fetch: (async () =>
      new Response(
        JSON.stringify({
          id: "d1",
          decision: effect,
          agent_id: "a",
          agent_name: "A",
          resource: "r",
          action: "call",
          risk_score: 20,
          policy_id: "p1",
          policy_name: "pol",
          reason: "ok",
          payload: {},
          modified_payload: modifiedPayload,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      )) as unknown as typeof fetch,
  });
}

describe("LangGraph middleware", () => {
  it("allow → inner runs with original state", async () => {
    const mg = mockClient("allow");
    const node = governedNode(mg, "agent_x", {
      resource: "customers.read",
      action: "read",
      purpose: "test",
    })(async (state: { hello: string }) => ({ ...state, ran: true }));
    const out = await node({ hello: "world" });
    expect(out).toEqual({ hello: "world", ran: true });
  });

  it("block → throws PermissionDenied", async () => {
    const mg = mockClient("block");
    const node = governedNode(mg, "agent_x", { resource: "prod.deploy" })(
      async (s: unknown) => s,
    );
    await expect(node({})).rejects.toThrow();
  });

  it("modify → merges modified payload into state", async () => {
    const mg = mockClient("modify", { redacted: true });
    const node = governedNode<Record<string, unknown>>(mg, "agent_x", {
      resource: "customers.read",
    })(async (state) => state);
    const out = (await node({ customerId: 42 })) as Record<string, unknown>;
    expect(out.redacted).toBe(true);
  });
});

describe("OpenAI Agents middleware", () => {
  it("wraps every tool.execute", async () => {
    const mg = mockClient("allow");
    let ran = 0;
    const agent = {
      name: "a",
      tools: [
        { name: "readCrm", execute: async (i: Record<string, unknown>) => { ran++; return { i }; } },
      ],
    };
    governedOpenAI(mg, "agent_x", agent);
    const out = await agent.tools[0].execute!({ customerId: 1 });
    expect(ran).toBe(1);
    expect(out).toEqual({ i: { customerId: 1 } });
  });

  it("block → tool call throws", async () => {
    const mg = mockClient("block");
    const agent = {
      name: "a",
      tools: [{ name: "danger", execute: async () => ({ ok: true }) }],
    };
    governedOpenAI(mg, "agent_x", agent);
    await expect(agent.tools[0].execute!({})).rejects.toThrow();
  });
});

describe("CrewAI middleware", () => {
  it("wraps run() on every agent tool", async () => {
    const mg = mockClient("allow");
    let ran = 0;
    const crew = {
      agents: [
        {
          role: "researcher",
          tools: [{ name: "search", run: async () => { ran++; return "ok"; } }],
        },
      ],
    };
    governCrew(mg, "agent_x", crew);
    await crew.agents[0].tools![0].run!({});
    expect(ran).toBe(1);
  });
});

describe("Google ADK middleware", () => {
  it("wraps invoke() on tool", async () => {
    const mg = mockClient("allow");
    let ran = 0;
    const agent = {
      name: "help",
      tools: [{ name: "search", invoke: async () => { ran++; return "ok"; } }],
    };
    governedAdk(mg, "agent_x", agent);
    await agent.tools[0].invoke!({});
    expect(ran).toBe(1);
  });
});

describe("MCP middleware", () => {
  it("forwards non tools/call methods untouched", async () => {
    const mg = mockClient("allow");
    let forwarded: JsonRpcRequest | null = null;
    const proxy = governMcp(mg, "agent_x", {
      forward: async (m) => {
        forwarded = m;
        return { jsonrpc: "2.0", id: m.id, result: { pong: true } };
      },
    });
    const res = await proxy({ jsonrpc: "2.0", id: 1, method: "ping" });
    expect(res.result).toEqual({ pong: true });
    expect(forwarded!.method).toBe("ping");
  });

  it("blocks tools/call with -32001 on block", async () => {
    const mg = mockClient("block");
    const proxy = governMcp(mg, "agent_x", {
      forward: async () => ({ jsonrpc: "2.0", result: {} }),
    });
    const res = await proxy({
      jsonrpc: "2.0",
      id: 7,
      method: "tools/call",
      params: { name: "danger", arguments: {} },
    });
    expect(res.error?.code).toBe(-32001);
  });

  it("modifies tools/call arguments on modify", async () => {
    const mg = mockClient("modify", { safe: true });
    let sentArgs: Record<string, unknown> | undefined;
    const proxy = governMcp(mg, "agent_x", {
      forward: async (m) => {
        sentArgs = m.params?.arguments as Record<string, unknown>;
        return { jsonrpc: "2.0", id: m.id, result: { ok: true } };
      },
    });
    await proxy({
      jsonrpc: "2.0",
      id: 8,
      method: "tools/call",
      params: { name: "readCrm", arguments: { customerId: 42 } },
    });
    expect(sentArgs).toEqual({ safe: true });
  });
});
