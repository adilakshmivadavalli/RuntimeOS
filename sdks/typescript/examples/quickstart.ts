/**
 * Compile-checked mirror of the README Quickstart.
 * Ensures every code sample the CTO reads on npm actually type-checks.
 */
import { MemoryOS, PermissionDenied, HumanApprovalRequired } from "memoryos-sdk";

async function quickstartEvaluate() {
  const mg = new MemoryOS({ apiKey: process.env.MEMORYOS_API_KEY });

  const decision = await mg.evaluate({
    agentId: "agent_crm_copilot",
    resource: "customers.read",
    action: "read",
    purpose: "Answer support ticket #4212",
    payload: { customerId: 42 },
  });

  if (decision.allowed) {
    const safe = decision.effectivePayload;
    return safe;
  }
  throw decision.toException();
}

async function quickstartGuard() {
  const mg = new MemoryOS({ apiKey: process.env.MEMORYOS_API_KEY });

  try {
    const d = await mg.guard({
      agentId: "agent_finance",
      resource: "billing.write",
      action: "write",
      purpose: "wire $85,000 to vendor",
      payload: { amount: 85_000, vendor: "ACME" },
    });
    return d.effectivePayload;
  } catch (e) {
    if (e instanceof PermissionDenied) return { blocked: e.reason };
    if (e instanceof HumanApprovalRequired) return { pending: e.decisionId };
    throw e;
  }
}

// Force TS to keep the imports live at compile time.
export const _examples = [quickstartEvaluate, quickstartGuard];
