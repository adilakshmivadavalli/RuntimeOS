"""External benchmark adapter contracts for the RuntimeOS BFSI evaluation harness.

The supplied governance research note recommends a common adapter interface:
load_cases(), run(case, level), and judge(case, final_state). These adapters are
intentionally placeholders until the external repositories are installed and
licences/setup are validated; the app must never claim benchmark results that
were not actually executed.
"""
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List


@dataclass
class BenchmarkAdapter:
    name: str
    domain: str
    source: str
    notes: str

    def load_cases(self) -> Iterable[Dict[str, Any]]:
        raise NotImplementedError("Install/configure this benchmark before execution")

    def run(self, case: Dict[str, Any], level: str) -> Dict[str, Any]:
        raise NotImplementedError("External benchmark execution is not bundled")

    def judge(self, case: Dict[str, Any], final_state: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError("Use the benchmark's native judging rules")


REGISTRY: List[BenchmarkAdapter] = [
    BenchmarkAdapter("AgentDojo", "agent safety / prompt injection", "github.com/ethz-spylab/agentdojo", "Banking suite; use its native environment state as the attack-success judge."),
    BenchmarkAdapter("FinVault", "BFSI privilege/compliance", "Yang et al., FinVault", "Execution-grounded finance scenarios; validate repository and licence before use."),
    BenchmarkAdapter("MCP Security Bench", "MCP security", "ICLR 2026 benchmark", "Real MCP attack scenarios; use native NRP and attack-success checks."),
    BenchmarkAdapter("MCPTox", "MCP tool poisoning", "AAAI 2026", "Tool metadata poisoning cases; isolate external MCP servers."),
    BenchmarkAdapter("FinGuard", "financial compliance", "2026 benchmark", "Query/response compliance pairs; useful for regulatory response evaluation."),
]
