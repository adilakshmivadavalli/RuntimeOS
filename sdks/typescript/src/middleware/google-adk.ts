/**
 * Google ADK (Agent Development Kit) middleware.
 *
 * Wraps every callable on an `LlmAgent.tools` (or `.toolRegistry`) so its
 * invocation passes through MemoryGate first. Blocks / escalations raise;
 * `modify` decisions rewrite the arguments.
 *
 * ```ts
 * import { LlmAgent } from "@google/adk";
 * import { MemoryGate } from "@memorygate/sdk";
 * import { governed } from "@memorygate/sdk/middleware/google-adk";
 *
 * const mg = new MemoryGate({ apiKey: process.env.MG_KEY });
 * governed(mg, "agent_support", agent);
 * ```
 */
import type { MemoryGate } from "../client.js";

interface AdkToolLike {
  name?: string;
  func?: (input: Record<string, unknown>) => unknown;
  invoke?: (input: Record<string, unknown>) => unknown;
  call?: (input: Record<string, unknown>) => unknown;
}

interface AdkAgentLike {
  name?: string;
  tools?: AdkToolLike[];
  toolRegistry?: Record<string, AdkToolLike>;
}

function pickFn(
  t: AdkToolLike,
): [keyof AdkToolLike, (input: Record<string, unknown>) => unknown] | null {
  if (typeof t.func === "function") return ["func", t.func.bind(t)];
  if (typeof t.invoke === "function") return ["invoke", t.invoke.bind(t)];
  if (typeof t.call === "function") return ["call", t.call.bind(t)];
  return null;
}

function wrap(mg: MemoryGate, agentId: string, tool: AdkToolLike, agentName: string) {
  const picked = pickFn(tool);
  if (!picked) return;
  const [key, original] = picked;
  const wrapped = async (input: Record<string, unknown>) => {
    const d = await mg.evaluate({
      agentId,
      resource: `tools.${tool.name ?? "unknown"}`,
      action: "call",
      purpose: `adk:${agentName}`,
      payload: input ?? {},
    });
    if (!d.allowed) throw d.toException();
    const effective = d.effect === "modify" ? (d.effectivePayload ?? input) : input;
    return original(effective);
  };
  (tool as Record<string, unknown>)[key as string] = wrapped;
}

export function governed(
  mg: MemoryGate,
  agentId: string,
  agent: AdkAgentLike,
): AdkAgentLike {
  const name = agent.name ?? "adk-agent";
  for (const tool of agent.tools ?? []) wrap(mg, agentId, tool, name);
  const reg = agent.toolRegistry ?? {};
  for (const key of Object.keys(reg)) wrap(mg, agentId, reg[key], name);
  return agent;
}
