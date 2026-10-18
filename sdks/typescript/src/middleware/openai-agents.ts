/**
 * OpenAI Agents SDK (JS) middleware.
 *
 * Wraps every tool on an `Agent` so its `.execute()` (or `.call()`) passes
 * through MemoryGate first. Non-allowed decisions raise; `modify` decisions
 * replace the tool arguments with the redacted payload.
 *
 * ```ts
 * import { Agent } from "@openai/agents";           // or @openai/agents-sdk
 * import { MemoryGate } from "@memorygate/sdk";
 * import { governed } from "@memorygate/sdk/middleware/openai-agents";
 *
 * const mg = new MemoryGate({ apiKey: process.env.MG_KEY });
 * governed(mg, "agent_finance", agent);   // mutates in place
 * ```
 */
import type { MemoryGate } from "../client.js";

interface ToolLike {
  name?: string;
  execute?: (input: Record<string, unknown>) => unknown;
  call?: (input: Record<string, unknown>) => unknown;
  handler?: (input: Record<string, unknown>) => unknown;
}

interface AgentLike {
  name?: string;
  tools?: ToolLike[];
}

export interface OpenAIAgentsOptions {
  /** Map a tool call into a `(resource, action)` pair. Default: `tools.<name>` / call. */
  resourceOf?: (tool: ToolLike, input: Record<string, unknown>) => string;
  actionOf?: (tool: ToolLike, input: Record<string, unknown>) => string;
  purposeOf?: (tool: ToolLike, input: Record<string, unknown>) => string;
}

const DEFAULT_RESOURCE = (t: ToolLike): string => `tools.${t.name ?? "unknown"}`;
const DEFAULT_ACTION = () => "call";
const DEFAULT_PURPOSE = () => "";

function pickFn(t: ToolLike): [keyof ToolLike, (input: Record<string, unknown>) => unknown] | null {
  if (typeof t.execute === "function") return ["execute", t.execute.bind(t)];
  if (typeof t.call === "function") return ["call", t.call.bind(t)];
  if (typeof t.handler === "function") return ["handler", t.handler.bind(t)];
  return null;
}

export function governed(
  mg: MemoryGate,
  agentId: string,
  agent: AgentLike,
  opts: OpenAIAgentsOptions = {},
): AgentLike {
  const resourceOf = opts.resourceOf ?? DEFAULT_RESOURCE;
  const actionOf = opts.actionOf ?? DEFAULT_ACTION;
  const purposeOf = opts.purposeOf ?? DEFAULT_PURPOSE;
  const tools = agent.tools ?? [];
  for (const tool of tools) {
    const picked = pickFn(tool);
    if (!picked) continue;
    const [key, original] = picked;
    const wrapped = async (input: Record<string, unknown>) => {
      const d = await mg.evaluate({
        agentId,
        resource: resourceOf(tool, input),
        action: actionOf(tool, input),
        purpose: purposeOf(tool, input),
        payload: input ?? {},
      });
      if (!d.allowed) throw d.toException();
      const effective = d.effect === "modify" ? (d.effectivePayload ?? input) : input;
      return original(effective);
    };
    (tool as Record<string, unknown>)[key as string] = wrapped;
  }
  return agent;
}
