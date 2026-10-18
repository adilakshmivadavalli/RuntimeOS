/**
 * LangGraph, OpenAI Agents SDK, CrewAI, Google ADK, and MCP —
 * every framework example from the README, compile-checked.
 */
import { MemoryOS } from "memoryos-sdk";
import { governedNode } from "memoryos-sdk/middleware/langgraph";
import { governed as governedOpenAI } from "memoryos-sdk/middleware/openai-agents";
import { governCrew } from "memoryos-sdk/middleware/crewai";
import { governed as governedAdk } from "memoryos-sdk/middleware/google-adk";
import { governMcp, type JsonRpcRequest, type JsonRpcResponse } from "memoryos-sdk/middleware/mcp";

const mg = new MemoryOS({ apiKey: process.env.MG_KEY });

/* --------------------- LangGraph --------------------- */
interface CrmState { customerId: number; op: "read" | "write"; userTask: string; }

const guardedCrm = governedNode<CrmState>(mg, "agent_crm", {
  resource: (s) => `customers.${s.op}`,
  action: (s) => s.op,
  purpose: (s) => s.userTask,
  payload: (s) => ({ customerId: s.customerId }),
})(async (state) => ({ ...state, done: true }));

/* --------------------- OpenAI Agents SDK --------------------- */
const openaiAgent = {
  name: "finance-copilot",
  tools: [
    { name: "wireTransfer", execute: async (i: Record<string, unknown>) => i },
    { name: "readInvoice",  execute: async (i: Record<string, unknown>) => i },
  ],
};
governedOpenAI(mg, "agent_finance", openaiAgent);

/* --------------------- CrewAI --------------------- */
const crew = {
  agents: [
    { role: "researcher", tools: [{ name: "search", run: async () => "ok" }] },
  ],
};
governCrew(mg, "agent_research", crew);

/* --------------------- Google ADK --------------------- */
const adkAgent = {
  name: "support",
  tools: [{ name: "search", invoke: async () => "ok" }],
};
governedAdk(mg, "agent_support", adkAgent);

/* --------------------- MCP --------------------- */
const mcpProxy: (m: JsonRpcRequest) => Promise<JsonRpcResponse> = governMcp(
  mg,
  "agent_mcp",
  {
    forward: async (msg) => ({ jsonrpc: "2.0", id: msg.id, result: { ok: true } }),
  },
);

export const _framework = [guardedCrm, openaiAgent, crew, adkAgent, mcpProxy];
