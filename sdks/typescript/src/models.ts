import { PermissionDenied, HumanApprovalRequired } from "./errors.js";

export type Effect = "allow" | "block" | "modify" | "escalate";

export interface TraceStep {
  step: string;
  matched: boolean;
  detail: string;
}

/** Raw wire-format decision as returned by `POST /api/evaluate`. */
export interface DecisionResponse {
  id: string;
  decision: Effect;
  agent_id: string;
  agent_name: string;
  resource: string;
  action: string;
  risk_score: number;
  policy_id: string | null;
  policy_name: string;
  reason: string;
  payload?: Record<string, unknown>;
  modified_payload?: Record<string, unknown> | null;
  evaluation_trace?: TraceStep[];
  [k: string]: unknown;
}

/**
 * The decision returned by MemoryGate for one agent action.
 *
 * - `effect` is one of "allow" / "block" / "modify" / "escalate".
 * - `effectivePayload` is what the caller should actually use:
 *   the original payload for allow, the redacted one for modify,
 *   or `null` for block / escalate.
 * - `trace` is the ordered explainability trace (empty on legacy servers).
 */
export class Decision {
  readonly id: string;
  readonly decision: Effect;
  readonly agentId: string;
  readonly agentName: string;
  readonly resource: string;
  readonly action: string;
  readonly riskScore: number;
  readonly policyId: string | null;
  readonly policyName: string;
  readonly reason: string;
  readonly payload: Record<string, unknown>;
  readonly modifiedPayload: Record<string, unknown> | null;
  readonly trace: TraceStep[];
  readonly raw: DecisionResponse;

  constructor(raw: DecisionResponse) {
    this.id = raw.id;
    this.decision = raw.decision;
    this.agentId = raw.agent_id;
    this.agentName = raw.agent_name;
    this.resource = raw.resource;
    this.action = raw.action;
    this.riskScore = raw.risk_score;
    this.policyId = raw.policy_id ?? null;
    this.policyName = raw.policy_name;
    this.reason = raw.reason;
    this.payload = raw.payload ?? {};
    this.modifiedPayload = raw.modified_payload ?? null;
    this.trace = raw.evaluation_trace ?? [];
    this.raw = raw;
  }

  get effect(): Effect { return this.decision; }
  get allowed(): boolean {
    return this.decision === "allow" || this.decision === "modify";
  }

  get effectivePayload(): Record<string, unknown> | null {
    if (this.decision === "allow") return this.payload;
    if (this.decision === "modify") return this.modifiedPayload;
    return null;
  }

  toException(): Error {
    if (this.decision === "escalate") {
      return new HumanApprovalRequired(this.id, this.reason);
    }
    return new PermissionDenied(this.reason, this.id, this.policyName);
  }
}
