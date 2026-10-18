"""Local RuntimeOS scenario replay used for the competition demo."""
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from risk_copilot import SCENARIOS, scenario_result, governance_metrics

if __name__ == "__main__":
    for level in ["OFF", "LOW", "MEDIUM", "HIGH"]:
        for scenario in SCENARIOS:
            r = scenario_result(scenario["id"], level)
            print(scenario["id"], level, r["decision"], "attack_executes=", r["harmful_action_executes"])
    print(governance_metrics())
