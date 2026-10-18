/**
 * CrewAI (Node/TS port) middleware.
 *
 * Wraps every tool on every agent inside a Crew so its `.run()` (or `.func()`)
 * passes through MemoryGate first. Blocks / escalations propagate as errors;
 * `modify` decisions rewrite the tool payload.
 *
 * ```ts
 * import { Crew, Agent } from "crewai-ts";  // or your local port
 * import { MemoryGate } from "@memorygate/sdk";
 * import { governCrew } from "@memorygate/sdk/middleware/crewai";
 *
 * const mg = new MemoryGate({ apiKey: process.env.MG_KEY });
 * governCrew(mg, "agent_research", crew);
 * ```
 */
import type { MemoryGate } from "../client.js";

interface CrewToolLike {
  name?: string;
  run?: (input: Record<string, unknown>) => unknown;
  func?: (input: Record<string, unknown>) => unknown;
  _run?: (input: Record<string, unknown>) => unknown;
}

interface CrewAgentLike {
  role?: string;
  name?: string;
  tools?: CrewToolLike[];
}

interface CrewLike {
  agents?: CrewAgentLike[];
  tools?: CrewToolLike[];
}

function pickFn(
  t: CrewToolLike,
): [keyof CrewToolLike, (input: Record<string, unknown>) => unknown] | null {
  if (typeof t.run === "function") return ["run", t.run.bind(t)];
  if (typeof t.func === "function") return ["func", t.func.bind(t)];
  if (typeof t._run === "function") return ["_run", t._run.bind(t)];
  return null;
}

function wrap(mg: MemoryGate, agentId: string, tool: CrewToolLike, role: string) {
  const picked = pickFn(tool);
  if (!picked) return;
  const [key, original] = picked;
  const wrapped = async (input: Record<string, unknown>) => {
    const d = await mg.evaluate({
      agentId,
      resource: `tools.${tool.name ?? "unknown"}`,
      action: "call",
      purpose: `crew:${role}`,
      payload: input ?? {},
    });
    if (!d.allowed) throw d.toException();
    const effective = d.effect === "modify" ? (d.effectivePayload ?? input) : input;
    return original(effective);
  };
  (tool as Record<string, unknown>)[key as string] = wrapped;
}

export function governCrew(mg: MemoryGate, agentId: string, crew: CrewLike): CrewLike {
  for (const tool of crew.tools ?? []) wrap(mg, agentId, tool, "crew");
  for (const agent of crew.agents ?? []) {
    const role = agent.role ?? agent.name ?? "agent";
    for (const tool of agent.tools ?? []) wrap(mg, agentId, tool, role);
  }
  return crew;
}

/** Alias for parity with the Python SDK's `GovernedCrew` name. */
export const GovernedCrew = governCrew;
