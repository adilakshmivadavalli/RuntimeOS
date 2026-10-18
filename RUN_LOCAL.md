# Run locally in VS Code

## 1) FastAPI RuntimeOS
```bash
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
# Fill the existing RuntimeOS values you already use. Snowflake values are required for the live competition intelligence path; the UI retains a deterministic local fallback for development.
cd backend
python -m uvicorn server:app --reload --port 8000
```

## 2) React console
Open another terminal:
```bash
cd frontend
cp .env.example .env
# Set REACT_APP_BACKEND_URL=http://127.0.0.1:8000
npm install --legacy-peer-deps
npm run build
npm start
```
Open:
`http://localhost:3000/risk-copilot`

## 3) Snowflake Streamlit app
```bash
cd snowflake
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env 2>/dev/null || true
streamlit run streamlit/app.py
```

## 4) CoCo CLI
Install the official Snowflake Cortex Code CLI, then start it from the repo root:
```bash
curl -LsS https://ai.snowflake.com/static/cc-scripts/install.sh | sh
cortex
```
Use the prompts in `snowflake/COCO_PROMPTS.md` to build/validate the Snowflake objects. Snowflake documents `cortex` as the default interactive mode and uses a configured Snowflake connection. 

## 5) Snowflake setup order
Run, in order, from Snowsight or through CoCo:
1. `snowflake/sql/01_bootstrap.sql`
2. Upload/load data with `snowflake/scripts/load_data.py` or the `COPY INTO` statements in `02_load.sql`
3. `snowflake/sql/03_risk_views.sql`
4. Edit `RUNTIMEOS_WH` in `04_cortex.sql` to your warehouse, then run it.
5. `05_demo_queries.sql`
6. `06_runtimeos_policy_examples.sql`

The optional anomaly detector in `04_cortex.sql` is intentionally commented until Snowflake ML privileges are confirmed.
