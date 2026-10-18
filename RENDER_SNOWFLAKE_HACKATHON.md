# Render deployment — RuntimeOS + Snowflake

## Existing RuntimeOS backend
Keep the existing FastAPI service and environment variables. The new endpoints are:
- GET `/api/risk/summary`
- GET `/api/risk/transactions`
- GET `/api/risk/transactions/{transaction_id}`
- POST `/api/risk/copilot/query`
- POST `/api/risk/govern`
- GET `/api/risk/audit-report`
- GET `/api/risk/governance-levels`
- GET `/api/risk/scenarios`
- GET `/api/risk/scenarios/{scenario_id}/run?level=HIGH`
- GET `/api/risk/metrics`
- GET `/api/risk/audit-chain`

## Streamlit service
Create a second Render web service from this repository if you want the competition-native UI.
- Root directory: `snowflake`
- Build command: `pip install -r requirements.txt`
- Start command: `streamlit run streamlit/app.py --server.port $PORT --server.address 0.0.0.0`

Environment variables:
```
SNOWFLAKE_ACCOUNT=
SNOWFLAKE_USER=
SNOWFLAKE_PASSWORD=
SNOWFLAKE_ROLE=
SNOWFLAKE_WAREHOUSE=
SNOWFLAKE_DATABASE=RUNTIMEOS_HACK
SNOWFLAKE_SCHEMA=RISK
RUNTIMEOS_URL=https://<your-runtimeos-backend>.onrender.com
```

Never commit Snowflake credentials to GitHub.

## Competition submission URL
After deployment, the existing React site exposes the competition copilot publicly at:
`https://<your-frontend>.onrender.com/risk-copilot`

If Snowflake credentials are present on the FastAPI service, the RuntimeOS risk endpoints automatically prefer Snowflake for the risk summary, transaction feed, transaction investigation, and Cortex Search regulatory retrieval. Otherwise the same UI falls back to the bundled synthetic data so the demo stays deterministic.
