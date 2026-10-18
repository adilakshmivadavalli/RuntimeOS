/**
 * Model Context Protocol (MCP) middleware.
 *
 * Governs any MCP `tools/call` request before it reaches the real MCP
 * server. Works two ways:
 *
 * 1. As a **JSON-RPC proxy handler**: give it an inbound RPC message, it
 *    evaluates via MemoryGate, and returns either the (possibly modified)
 *    forwarded response or an error object.
 *
 * 2. As a **middleware factory** you can drop into any MCP framework
 *    (mcp-typescript-sdk, `@modelcontextprotocol/sdk`, etc.).
 *
 * ```ts
 * import { MemoryGate } from "@memorygate/sdk";
 * import { governMcp } from "@memorygate/sdk/middleware/mcp";
 *
 * const mg = new MemoryGate({ apiKey: process.env.MG_KEY });
 *
 * const proxy = governMcp(mg, "agent_mcp", {
 *   forward: async (msg) => await realMcpClient.send(msg),
 * });
 *
 * // Then wire proxy(rpc) into your MCP transport.
 * ```
 */
import type { MemoryGate } from "../client.js";

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: {
    name?: string;
    arguments?: Record<string, unknown>;
    [k: string]: unknown;
  };
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id?: string | number | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

export interface McpProxyOptions {
  /** Called for `tools/call` when the runtime returns allow / modify. */
  forward: (msg: JsonRpcRequest) => Promise<JsonRpcResponse>;
  /** Override how the (resource, action) pair is derived. */
  resourceOf?: (msg: JsonRpcRequest) => string;
  actionOf?: (msg: JsonRpcRequest) => string;
  purposeOf?: (msg: JsonRpcRequest) => string;
}

const CODE_BLOCKED = -32001;
const CODE_ESCALATED = -32002;

export function governMcp(
  mg: MemoryGate,
  agentId: string,
  opts: McpProxyOptions,
): (msg: JsonRpcRequest) => Promise<JsonRpcResponse> {
  const resourceOf =
    opts.resourceOf ??
    ((m) => `mcp.tools.${m.params?.name ?? "unknown"}`);
  const actionOf = opts.actionOf ?? (() => "call");
  const purposeOf = opts.purposeOf ?? (() => "mcp");

  return async (msg: JsonRpcRequest): Promise<JsonRpcResponse> => {
    // Only govern `tools/call`. Everything else (initialize, list, ping)
    // is forwarded untouched.
    if (msg.method !== "tools/call") return opts.forward(msg);

    const args = (msg.params?.arguments ?? {}) as Record<string, unknown>;
    const decision = await mg.evaluate({
      agentId,
      resource: resourceOf(msg),
      action: actionOf(msg),
      purpose: purposeOf(msg),
      payload: args,
    });

    if (decision.effect === "block") {
      return {
        jsonrpc: "2.0",
        id: msg.id ?? null,
        error: {
          code: CODE_BLOCKED,
          message: decision.reason || "Blocked by MemoryGate policy",
          data: { policyName: decision.policyName, decisionId: decision.id },
        },
      };
    }
    if (decision.effect === "escalate") {
      return {
        jsonrpc: "2.0",
        id: msg.id ?? null,
        error: {
          code: CODE_ESCALATED,
          message: decision.reason || "Escalated to human approval",
          data: { decisionId: decision.id },
        },
      };
    }
    // allow or modify — forward with (possibly) redacted arguments.
    const effective =
      decision.effect === "modify"
        ? (decision.effectivePayload ?? args)
        : args;
    const forwarded: JsonRpcRequest = {
      ...msg,
      params: { ...(msg.params ?? {}), arguments: effective },
    };
    return opts.forward(forwarded);
  };
}
