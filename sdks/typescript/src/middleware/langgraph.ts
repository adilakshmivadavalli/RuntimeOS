/**
 * LangGraph middleware for MemoryGate.
 *
 * Wraps a LangGraph node so its state transition passes through the
 * MemoryGate runtime first. Blocks / escalations halt the graph by
 * throwing; modified payloads are folded back into the state.
 *
 * ```ts
 * import { StateGraph } from "@langchain/langgraph";
 * import { MemoryGate } from "@memorygate/sdk";
 * import { governedNode } from "@memorygate/sdk/middleware/langgraph";
 *
 * const mg = new MemoryGate({ apiKey: process.env.MG_KEY });
 *
 * const guarded = governedNode(mg, "agent_crm", {
 *   resource: (state) => `customers.${state.op}`,
 *   action:   () => "read",
 *   purpose:  (state) => state.userTask,
 *   payload:  (state) => ({ customerId: state.customerId }),
 * })(async (state) => runYourNode(state));
 *
 * graph.addNode("crm", guarded);
 * ```
 */
import type { MemoryGate } from "../client.js";

export type StateExtractor<S, T> = (state: S) => T;

export interface GovernedNodeConfig<S> {
  resource: string | StateExtractor<S, string>;
  action?: string | StateExtractor<S, string>;
  purpose?: string | StateExtractor<S, string>;
  payload?: Record<string, unknown> | StateExtractor<S, Record<string, unknown>>;
  context?: Record<string, unknown> | StateExtractor<S, Record<string, unknown>>;
  /**
   * Called when the runtime returned `modify`. Must return the new state
   * (typically merging `d.effectivePayload` back in). Default: merge into `state`.
   */
  onModify?: (state: S, modified: Record<string, unknown> | null) => S;
}

function resolve<S, T>(v: T | StateExtractor<S, T> | undefined, s: S, fallback: T): T {
  if (v === undefined) return fallback;
  if (typeof v === "function") return (v as StateExtractor<S, T>)(s);
  return v;
}

export function governedNode<S>(
  mg: MemoryGate,
  agentId: string,
  cfg: GovernedNodeConfig<S>,
) {
  return <R>(inner: (state: S) => R | Promise<R>) => {
    return async (state: S): Promise<R> => {
      const decision = await mg.evaluate({
        agentId,
        resource: resolve<S, string>(cfg.resource, state, ""),
        action: resolve<S, string>(cfg.action, state, "read"),
        purpose: resolve<S, string>(cfg.purpose, state, ""),
        payload: resolve<S, Record<string, unknown>>(cfg.payload, state, {}),
        context: resolve<S, Record<string, unknown>>(cfg.context, state, {}),
      });
      if (!decision.allowed) throw decision.toException();
      if (decision.effect === "modify") {
        const merged = cfg.onModify
          ? cfg.onModify(state, decision.effectivePayload)
          : ({ ...state, ...(decision.effectivePayload ?? {}) } as S);
        return inner(merged);
      }
      return inner(state);
    };
  };
}
