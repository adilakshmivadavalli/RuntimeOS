import { describe, it, expect } from "vitest";
import {
  MemoryGate,
  Decision,
  GovernanceError,
  NetworkError,
  PermissionDenied,
  HumanApprovalRequired,
} from "../src/index.js";

function mockDecision(effect: "allow" | "block" | "modify" | "escalate", extra: Record<string, unknown> = {}) {
  return {
    id: "dec_test",
    decision: effect,
    agent_id: "agent_x",
    agent_name: "Agent X",
    resource: "customers.read",
    action: "read",
    risk_score: 42,
    policy_id: "pol_1",
    policy_name: "PII redact",
    reason: "matched policy",
    payload: { customerId: 7 },
    modified_payload: { customerId: 7, _redacted: ["email"] },
    evaluation_trace: [{ step: "identity", matched: true, detail: "ok" }],
    ...extra,
  };
}

function fakeFetch(body: unknown, init: { status?: number } = {}) {
  return async () =>
    new Response(JSON.stringify(body), {
      status: init.status ?? 200,
      headers: { "Content-Type": "application/json" },
    });
}

describe("MemoryGate client", () => {
  it("requires an apiKey", () => {
    expect(() => new MemoryGate({} as never)).toThrow(GovernanceError);
  });

  it("returns a Decision from an allow", async () => {
    const mg = new MemoryGate({
      apiKey: "mg_test",
      defaultAgentId: "agent_x",
      fetch: fakeFetch(mockDecision("allow")) as unknown as typeof fetch,
    });
    const d = await mg.evaluate({ resource: "customers.read" });
    expect(d).toBeInstanceOf(Decision);
    expect(d.allowed).toBe(true);
    expect(d.effect).toBe("allow");
    expect(d.effectivePayload).toEqual({ customerId: 7 });
  });

  it("returns the modified payload on modify", async () => {
    const mg = new MemoryGate({
      apiKey: "mg_test",
      defaultAgentId: "agent_x",
      fetch: fakeFetch(mockDecision("modify")) as unknown as typeof fetch,
    });
    const d = await mg.evaluate({ resource: "customers.read" });
    expect(d.allowed).toBe(true);
    expect(d.effectivePayload).toEqual({ customerId: 7, _redacted: ["email"] });
  });

  it("guard() raises PermissionDenied on block", async () => {
    const mg = new MemoryGate({
      apiKey: "mg_test",
      defaultAgentId: "agent_x",
      fetch: fakeFetch(mockDecision("block")) as unknown as typeof fetch,
    });
    await expect(
      mg.guard({ resource: "prod.deploy", action: "delete" }),
    ).rejects.toBeInstanceOf(PermissionDenied);
  });

  it("guard() raises HumanApprovalRequired on escalate", async () => {
    const mg = new MemoryGate({
      apiKey: "mg_test",
      defaultAgentId: "agent_x",
      fetch: fakeFetch(mockDecision("escalate")) as unknown as typeof fetch,
    });
    await expect(
      mg.guard({ resource: "billing.write", action: "write" }),
    ).rejects.toBeInstanceOf(HumanApprovalRequired);
  });

  it("wraps fetch errors in NetworkError", async () => {
    const mg = new MemoryGate({
      apiKey: "mg_test",
      defaultAgentId: "agent_x",
      fetch: (async () => {
        throw new Error("ECONNRESET");
      }) as unknown as typeof fetch,
    });
    await expect(mg.evaluate({ resource: "x" })).rejects.toBeInstanceOf(NetworkError);
  });

  it("requires an agentId", async () => {
    const mg = new MemoryGate({
      apiKey: "mg_test",
      fetch: fakeFetch(mockDecision("allow")) as unknown as typeof fetch,
    });
    await expect(mg.evaluate({ resource: "x" })).rejects.toBeInstanceOf(GovernanceError);
  });
});
