# RuntimeOS evaluation harness

The evaluation approach follows the supplied BFSI tiered-governance research note.

## Local demo pack
Nine curated scenarios are implemented in `backend/risk_copilot.py`:
B1–B3 banking, F1–F3 finance, and I1–I3 insurance. They can be replayed at OFF / LOW / MEDIUM / HIGH and compared using ASR, escalation rate, PUA, NRP and local gate latency.

These local figures are deterministic product-replay metrics and **not** external benchmark results.

## External benchmark registry
`benchmark_registry.py` records integration contracts for AgentDojo, FinVault, MCP Security Bench, MCPTox and FinGuard. The supplied research note explicitly cautions that external repositories and licences should be validated before relying on them. Do not populate competition claims with external scores until the benchmark is actually executed.

## Common adapter contract
- `load_cases()`
- `run(case, level)`
- `judge(case, final_state)`

Use the native judge/environment state to determine attack success. Do not infer attack success from the assistant's text alone.
