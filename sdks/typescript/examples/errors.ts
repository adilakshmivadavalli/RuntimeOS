/**
 * Compile-checked mirror of the README Error handling section.
 */
import {
  MemoryOS,
  PermissionDenied,
  HumanApprovalRequired,
  NetworkError,
  UnknownAgent,
} from "memoryos-sdk";

async function handleErrors() {
  const mg = new MemoryOS({ apiKey: process.env.MG_KEY });

  try {
    await mg.guard({
      agentId: "agent_x",
      resource: "billing.write",
      action: "write",
      payload: {},
    });
  } catch (e) {
    if (e instanceof PermissionDenied) {
      return { blockedBy: e.policyName, decisionId: e.decisionId };
    }
    if (e instanceof HumanApprovalRequired) {
      return { pending: e.decisionId };
    }
    if (e instanceof UnknownAgent) {
      return { unknownAgent: true };
    }
    if (e instanceof NetworkError) {
      return { networkError: e.message };
    }
    throw e;
  }
}

export const _errors = [handleErrors];
