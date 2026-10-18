# Cortex Code / CoCo CLI prompts — RuntimeOS Track 01

Use these prompts in **standard** Cortex Code / CoCo CLI mode. The intent is to make the Snowflake build visible, reproducible and easy to demo.

1. **Schema**
> Inspect `snowflake/sql` and create the RUNTIMEOS_HACK database, RISK schema, stage, file format, BFSI tables, governance scenario table and audit-event table. Explain relationships.

2. **Data quality**
> Load the bundled synthetic customers, accounts, transactions and regulatory knowledge CSVs. Profile row counts, nulls, duplicate transaction IDs, risk distributions and suspicious-value distributions.

3. **Behavioral risk features**
> Use Snowpark Python or SQL window functions to derive transaction velocity, cross-border signal, new-beneficiary signal, high-value signal and account baseline features without mutating the source transaction table.

4. **Risk analytics**
> Create governed views exposing transaction count, total transaction value, average risk score, fraud-label count, high-risk share and behavioral signals by day, customer, channel, country and merchant category.

5. **Semantic model**
> Validate and improve `RUNTIMEOS_HACK.RISK.RISK_INTELLIGENCE` as a native semantic view. Add synonyms and verify questions such as “show high-risk transactions”, “what is the fraud count”, and “what is average risk by country”.

6. **Regulatory search**
> Validate `REGULATORY_SEARCH` and test natural-language queries for AML, KYC, fraud-risk management and audit evidence. Return document, section hint, source URL, evidence summary and the note that bundled regulatory text is illustrative.

7. **Anomaly detection**
> If the account has the required Snowflake ML privilege, train an anomaly detector on `DAILY_ACTIVITY` for transaction value. Show anomalies and forecast bounds. Do not claim benchmark performance from this model.

8. **Risk copilot**
> Build a Streamlit risk copilot that routes analytical questions to Snowflake data, regulatory questions to Cortex Search, and summarization to Cortex. Return evidence and provenance.

9. **Runtime governance**
> Connect the copilot to RuntimeOS. Evaluate requested actions using OFF / LOW / MEDIUM / HIGH governance. LOW covers PII redaction, thresholds and escalation; MEDIUM adds delegation, step-up, constraints, defer, dual control, dry-run and tool quarantine; HIGH adds harm probability, provenance, tool metadata pinning and uncertainty-aware escalation.

10. **Attack replay**
> Replay scenarios B1–B3, F1–F3 and I1–I3 at OFF, LOW, MEDIUM and HIGH. Show the same attack, the governance decision, whether the harmful action executes, and the security/utility trade-off.

11. **Audit report**
> Generate an audit-ready report containing the question, evidence, risk factors, matched policy, governance level, decision, provenance, timestamp, regulatory evidence and source identifiers. Verify the RuntimeOS append-only audit hash chain.

12. **Competition narrative**
> Explain the architecture as: Snowflake stores and analyzes BFSI data; Cortex provides natural-language intelligence and regulatory retrieval; RuntimeOS is the runtime governance control plane that decides what consequential AI actions are allowed to reach downstream systems.
