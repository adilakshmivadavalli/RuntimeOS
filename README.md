# RuntimeOS — BFSI Risk, Fraud & Regulatory Intelligence Copilot

RuntimeOS is a runtime governance control plane for AI agents. This competition profile adds a BFSI intelligence layer without changing the core governance primitive.

## Google AI Builder Cup build
Team Guardrail Architects: Adilakshmi V and Divya D (Solution Architects, Capgemini). Theme: BFSI, Intelligent Risk, Fraud & Financial Experiences.

| Google service | How RuntimeOS uses it |
|---|---|
| Gemini (Vertex AI, `gemini-2.5-flash`) | `backend/google_ai.py` turns transaction and regulatory evidence into grounded analyst answers |
| Firestore | Main database via Firestore with MongoDB compatibility (`MONGO_URL`), plus native collections `copilot_queries` and `governance_decisions` (`backend/firestore_store.py`) |
| Cloud Run | FastAPI governance API (`deploy/cloud-run/backend.Dockerfile`) |
| Firebase Hosting | React console, with `/api/**` rewritten to the Cloud Run service (`firebase.json`) |

Deploy everything: `PROJECT_ID=... ADMIN_PASSWORD=... MONGO_URL=... ./deploy/cloud-run/deploy.sh`

## Common product
- Risk/fraud transaction intelligence
- Natural-language copilot
- Regulatory evidence retrieval
- OFF / LOW / MEDIUM / HIGH governance
- Identity, risk, policy, provenance and enforcement
- ALLOW / MODIFY / BLOCK / ESCALATE
- Audit chain and audit-ready reporting
- Scenario replay and governance metrics

## Competition adapters
### Snowflake CoCo CLI Hackathon
Use Snowflake as the data/intelligence layer and CoCo CLI in the build workflow. Target track: Risk, Fraud and Regulatory Intelligence Copilot.

### Google AI Builder Cup
Use Google Gemini for generative reasoning and deploy on Google Cloud Run. Target theme: BFSI — Intelligent Risk, Fraud & Financial Experiences.

## Local run
Backend: see `LOCAL_SETUP.md`.
Frontend: see `LOCAL_SETUP.md`.
Risk Copilot: `/risk-copilot`.

## Evidence discipline
Bundled BFSI data is synthetic. Regulatory seed summaries are illustrative. External benchmark adapters are documentation/contracts only until actual runs are completed and validated.
