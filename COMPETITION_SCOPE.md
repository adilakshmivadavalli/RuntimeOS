# RuntimeOS — Snowflake CoCo Hackathon Scope

## Submission track
**Track 01 — Risk, Fraud and Regulatory Intelligence Copilot**

## Product
RuntimeOS is a runtime governance control plane for AI agents, with a Snowflake-native BFSI intelligence layer. Snowflake is the system of record and intelligence layer for the competition entry; RuntimeOS governs consequential agent actions.

## Hero workflow
1. Ask a natural-language BFSI risk/compliance question.
2. Query structured transaction and customer data in Snowflake.
3. Compute behavioral risk signals with Snowpark/Snowflake SQL.
4. Retrieve regulatory evidence with Cortex Search.
5. Return an audit-oriented answer.
6. When the copilot proposes an action, RuntimeOS evaluates identity, risk, policy and provenance and returns ALLOW / MODIFY / BLOCK / ESCALATE.
7. Persist the decision and evidence for audit.

## Snowflake components to demonstrate
- Snowflake tables/views as the data foundation
- Snowpark Python for risk feature engineering
- Snowflake Cortex for evidence-grounded summaries
- Cortex Search for regulatory evidence retrieval
- Semantic View for governed analytics
- Streamlit for the copilot UI
- Cortex Code / CoCo CLI for the development and validation workflow

## Demo scenarios
- High-risk transaction investigation
- Transaction anomaly explanation
- AML/KYC evidence lookup
- PII export governance
- High-value transfer governance
- Same BFSI attack under OFF / LOW / MEDIUM / HIGH RuntimeOS controls

## Deliberately out of the hero demo
Dodo Payments, Breeth memory, generic CRM/DevOps stories, unrelated Google-specific competition claims, pricing and unrelated integrations. They can remain in the broader RuntimeOS codebase, but the Snowflake entry leads with BFSI risk, fraud, regulatory intelligence and runtime governance.

## Evidence discipline
All bundled transaction data is synthetic. Regulatory seed records are illustrative summaries with source metadata, not legal advice. External benchmark adapters are contracts/documentation until an actual benchmark run has been executed and validated.
