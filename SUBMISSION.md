# Snowflake CoCo Hackathon Submission

## Track
Risk, Fraud and Regulatory Intelligence Copilot

## Product
RuntimeOS — Risk, Fraud & Regulatory Intelligence Copilot

## One-line pitch
Snowflake turns BFSI data into risk intelligence; RuntimeOS governs what AI agents are allowed to do with those insights.

## Core stack
Snowflake • Snowpark Python • Snowflake Cortex • Cortex Search • Semantic View • Streamlit • Cortex Code / CoCo CLI • FastAPI • React

## Judge flow
Natural-language question → Snowflake data/analysis → risk signal → regulatory evidence → RuntimeOS policy decision → action effect → audit trace.

## Example
“Show suspicious transactions in the last 24 hours” → investigate a high-risk transaction → ask why it was flagged → retrieve relevant AML evidence → attempt a PII export → RuntimeOS MODIFY/BLOCK/ESCALATE → audit record.

## Governance comparison
OFF / LOW / MEDIUM / HIGH. Higher levels add contextual constraints, provenance, uncertainty-aware escalation, delegation controls, tool quarantine and stronger audit evidence.

## Demo data
Synthetic BFSI data only. No real customer data or credentials are included.
