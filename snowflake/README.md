# RuntimeOS + Snowflake CoCo — BFSI Risk, Fraud & Regulatory Copilot

This is the Snowflake-first competition layer for RuntimeOS.

## What is included
- Synthetic banking customers, accounts and transactions
- Risk/fraud feature views
- Snowpark Python feature engineering
- Cortex Search regulatory evidence service definition
- Governed Semantic View for risk analytics
- Cortex-powered evidence-grounded summaries
- Optional Snowflake ML anomaly-detection template
- Streamlit copilot and governance lab
- CoCo CLI prompts for the full build/validation workflow

## Setup order
1. Run `sql/01_bootstrap.sql`.
2. Upload `data/*.csv` to `@RUNTIMEOS_HACK.RISK.RAW_DATA` using `scripts/load_data.py` or Snowflake stages.
3. Run `sql/02_load.sql`.
4. Run `sql/03_risk_views.sql`.
5. Replace `RUNTIMEOS_WH` in `sql/04_cortex.sql` and run it.
6. Use `COCO_PROMPTS.md` from standard Cortex Code / CoCo CLI mode to inspect and validate the objects.
7. Run `streamlit run streamlit/app.py`.

## Competition story
Snowflake finds and explains risk. RuntimeOS controls what an agent is allowed to do with the result.

## Data disclaimer
Bundled transaction data is synthetic. Regulatory CSV entries are illustrative summaries and source metadata, not legal advice.
