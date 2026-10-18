/**
 * @memorygate/sdk — Runtime governance for autonomous AI agents.
 *
 *   npm install @memorygate/sdk
 *
 *   import { MemoryGate } from "@memorygate/sdk";
 *   const mg = new MemoryGate({ apiKey: process.env.MG_KEY });
 *   const d  = await mg.guard({ resource: "customers.read", agentId: "..." });
 *
 * Framework middleware ships under sub-paths:
 *   `@memorygate/sdk/middleware/langgraph`
 *   `@memorygate/sdk/middleware/openai-agents`
 *   `@memorygate/sdk/middleware/crewai`
 *   `@memorygate/sdk/middleware/google-adk`
 *   `@memorygate/sdk/middleware/mcp`
 */
export { MemoryGate } from "./client.js";
export { MemoryGate as MemoryOS } from "./client.js";
export type {
  ClientOptions,
  EvaluateInput,
} from "./client.js";
export {
  Decision,
} from "./models.js";
export type {
  Effect,
  TraceStep,
  DecisionResponse,
} from "./models.js";
export {
  GovernanceError,
  NetworkError,
  UnknownAgent,
  PermissionDenied,
  HumanApprovalRequired,
} from "./errors.js";

export default { name: "memoryos-sdk", version: "0.4.0" };
