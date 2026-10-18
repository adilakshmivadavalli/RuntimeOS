# RuntimeOS — Snowflake CoCo Hackathon Build Notes

The competition build is intentionally Snowflake-first.

## Product thesis
Snowflake provides the governed data and AI intelligence layer. RuntimeOS provides the action-governance layer between AI intent and consequential BFSI execution.

## Native Snowflake surface
- Structured BFSI transaction data in Snowflake
- Snowpark Python risk features
- Cortex Search regulatory evidence
- Semantic View for governed natural-language analytics
- Cortex model summary from retrieved evidence
- Streamlit copilot UI
- Cortex Code / CoCo CLI for creating, inspecting, testing and validating Snowflake objects

## RuntimeOS surface
- Identity and delegated scope
- Risk/context/provenance checks
- Policy engine
- ALLOW / MODIFY / BLOCK / ESCALATE
- Human escalation
- Audit trail / hash chain
- Governance-level comparison

## Principle
Keep the data plane and intelligence plane in Snowflake; keep the consequential action boundary in RuntimeOS.
