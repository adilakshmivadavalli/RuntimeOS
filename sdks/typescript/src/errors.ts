/**
 * MemoryGate SDK errors.
 *
 * Every error raised by `@memorygate/sdk` inherits from `GovernanceError`,
 * so a single `catch (e: unknown)` block can differentiate by class.
 */
export class GovernanceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GovernanceError";
    // Fix prototype for older TS targets.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** Raised when the SDK cannot reach the MemoryGate runtime (timeout / DNS / TLS). */
export class NetworkError extends GovernanceError {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

/** Raised when the referenced agentId does not exist for this tenant. */
export class UnknownAgent extends GovernanceError {
  constructor(message: string) {
    super(message);
    this.name = "UnknownAgent";
  }
}

/** Raised (or convertible from a Decision) when the runtime blocked the request. */
export class PermissionDenied extends GovernanceError {
  constructor(
    public readonly reason: string,
    public readonly decisionId?: string,
    public readonly policyName?: string,
  ) {
    super(reason + (policyName ? ` (policy=${policyName})` : ""));
    this.name = "PermissionDenied";
  }
}

/** Raised (or convertible from a Decision) when the runtime escalated to a human. */
export class HumanApprovalRequired extends GovernanceError {
  constructor(
    public readonly decisionId: string,
    public readonly reason = "",
  ) {
    super(`Human approval required for decision ${decisionId}: ${reason}`);
    this.name = "HumanApprovalRequired";
  }
}
