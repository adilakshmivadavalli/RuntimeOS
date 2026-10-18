import json
import os
from pathlib import Path

import pandas as pd
import streamlit as st

st.set_page_config(page_title="RuntimeOS Risk Copilot", page_icon="🛡️", layout="wide")
BASE = Path(__file__).resolve().parents[1]
DATA = BASE / "data"
RUNTIMEOS_URL = os.getenv("RUNTIMEOS_URL", "").rstrip("/")


def local_data():
    tx = pd.read_csv(DATA / "transactions_seed.csv")
    tx["amount_inr"] = pd.to_numeric(tx["amount_inr"], errors="coerce")
    tx["risk_score"] = pd.to_numeric(tx["risk_score"], errors="coerce")
    reg = pd.read_csv(DATA / "regulatory_knowledge_seed.csv")
    return tx, reg


def snowflake_session():
    if not all(os.getenv(k) for k in ["SNOWFLAKE_ACCOUNT", "SNOWFLAKE_USER", "SNOWFLAKE_PASSWORD", "SNOWFLAKE_WAREHOUSE"]):
        return None
    try:
        from snowflake.snowpark import Session
        cfg = {k: os.getenv(k) for k in [
            "SNOWFLAKE_ACCOUNT", "SNOWFLAKE_USER", "SNOWFLAKE_PASSWORD",
            "SNOWFLAKE_WAREHOUSE", "SNOWFLAKE_DATABASE", "SNOWFLAKE_SCHEMA", "SNOWFLAKE_ROLE"
        ] if os.getenv(k)}
        cfg.setdefault("database", "RUNTIMEOS_HACK")
        cfg.setdefault("schema", "RISK")
        return Session.builder.configs(cfg).create()
    except Exception as exc:
        st.sidebar.warning(f"Snowflake unavailable; using bundled demo data. {exc}")
        return None


def get_transactions(session):
    if session:
        try:
            df = session.sql("""
                SELECT TRANSACTION_ID AS transaction_id, TIMESTAMP AS timestamp,
                       ACCOUNT_ID AS account_id, CUSTOMER_ID AS customer_id,
                       AMOUNT_INR AS amount_inr, CURRENCY AS currency,
                       MERCHANT_CATEGORY AS merchant_category, CHANNEL AS channel,
                       COUNTRY AS country, BENEFICIARY_ID AS beneficiary_id,
                       IS_NEW_BENEFICIARY AS is_new_beneficiary,
                       IS_FRAUD_LABEL AS is_fraud_label,
                       TRANSACTION_STATUS AS transaction_status,
                       RISK_SCORE AS risk_score, RISK_LEVEL AS risk_level, RISK_SIGNALS AS risk_signals,
                       TXN_VELOCITY_1H, CROSS_BORDER_SIGNAL, HIGH_VALUE_SIGNAL
                FROM RUNTIMEOS_HACK.RISK.RISK_TRANSACTIONS
                ORDER BY RISK_SCORE DESC, AMOUNT_INR DESC
                LIMIT 3000
            """).to_pandas()
            df.columns = [c.lower() for c in df.columns]
            df["amount_inr"] = pd.to_numeric(df["amount_inr"], errors="coerce")
            df["risk_score"] = pd.to_numeric(df["risk_score"], errors="coerce")
            return df
        except Exception as exc:
            st.sidebar.warning(f"Snowflake query failed; using local fallback. {exc}")
    return local_data()[0]


def get_regulatory(session, query=None):
    _, local_reg = local_data()
    if session and query:
        try:
            payload = json.dumps({
                "query": query,
                "columns": ["DOCUMENT_NAME", "TOPIC", "SECTION_HINT", "GUIDANCE_SUMMARY", "SOURCE_URL", "NOTE"],
                "limit": 5,
            }).replace("'", "''")
            raw = session.sql(f"""
                SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
                  'RUNTIMEOS_HACK.RISK.REGULATORY_SEARCH',
                  '{payload}'
                ) AS RESULT
            """).collect()[0][0]
            parsed = json.loads(raw) if isinstance(raw, str) else raw
            results = parsed.get("results", parsed.get("data", [])) if parsed else []
            if results:
                return pd.DataFrame(results), "Cortex Search"
        except Exception as exc:
            st.sidebar.info(f"Cortex Search not active yet; using seeded regulatory evidence. {exc}")
    return local_reg, "Seeded evidence"



def cortex_summary(session, question, df):
    if not session:
        return None
    try:
        model = os.getenv("SNOWFLAKE_CORTEX_MODEL", "llama3.3-70b").replace("'", "''")
        evidence = df.head(8).to_json(orient="records")
        prompt = ("You are a banking risk copilot. Answer only from the provided synthetic evidence. "
                  "Identify risk signals and state that regulatory text is illustrative when appropriate. "
                  f"Question: {question}\nEvidence: {evidence}").replace("'", "''")
        raw = session.sql(f"SELECT AI_COMPLETE('{model}', '{prompt}') AS ANSWER").collect()[0][0]
        return raw
    except Exception:
        return None


st.title("RuntimeOS — Risk, Fraud & Regulatory Intelligence Copilot")
st.caption("Snowflake-native intelligence + tiered RuntimeOS governance at the action boundary. Synthetic demo data only.")
session = snowflake_session()
tx = get_transactions(session)
_, local_reg = local_data()

c1, c2, c3, c4 = st.columns(4)
c1.metric("Transactions", f"{len(tx):,}")
c2.metric("High / Critical", f"{int((tx.risk_score >= 60).sum()):,}")
c3.metric("Fraud labels", f"{int(tx.is_fraud_label.astype(str).str.upper().eq('TRUE').sum()):,}")
c4.metric("Average risk", f"{tx.risk_score.mean():.1f}")

st.info("Decision path: Identity → Risk / P(harm) → Policy → Enforcement → Audit. Governance adds controls progressively from Low to High.")

t1, t2, t3, t4, t5 = st.tabs(["Copilot", "Fraud Signals", "Regulatory", "Governance Lab", "Evidence & Metrics"])

with t1:
    st.subheader("Ask the risk copilot")
    q = st.text_input("Natural-language question", placeholder="Show high-risk transactions from the last 24 hours")
    buttons = st.columns(5)
    examples = [
        "Show high-risk transactions", "Why was TXN-00000071 flagged?", "What AML controls are relevant?",
        "Generate an audit report", "Compare governance levels",
    ]
    for col, example in zip(buttons, examples):
        if col.button(example, use_container_width=True):
            q = example
    if q:
        ql = q.lower()
        if any(k in ql for k in ["regulat", "aml", "kyc", "compliance"]):
            hits, source = get_regulatory(session, q)
            st.caption(source)
            st.dataframe(hits, use_container_width=True, hide_index=True)
        elif "why" in ql and "txn-" in ql:
            tid = next((x.strip(" .,:?").upper() for x in q.split() if x.upper().startswith("TXN-")), "")
            row = tx[tx.transaction_id == tid]
            if not row.empty:
                r = row.iloc[0]
                st.success(f"{r.transaction_id}: risk {int(r.risk_score)} — {r.risk_level}")
                st.json({k: (float(r[k]) if k == "amount_inr" else r[k]) for k in ["transaction_id","amount_inr","country","channel","is_new_beneficiary","is_fraud_label","risk_score","risk_level","risk_signals"]})
                summary = cortex_summary(session, q, row)
                if summary:
                    st.markdown("**Cortex summary**")
                    st.write(summary)
            else:
                st.warning("Transaction not found in the loaded demo window.")
        elif "audit" in ql or "report" in ql:
            st.write("Audit-ready risk snapshot")
            report = tx[tx.risk_score >= 60].sort_values("risk_score", ascending=False).head(100)
            st.download_button("Download audit CSV", report.to_csv(index=False), "runtimeos_risk_audit.csv", "text/csv")
            st.dataframe(report, use_container_width=True, hide_index=True)
        elif "compare" in ql or "level" in ql:
            st.dataframe(pd.DataFrame({"level": ["OFF","LOW","MEDIUM","HIGH"], "controls": ["none","named actions + redaction","delegation + step-up + constraints","harm + provenance + metadata pinning"]}), use_container_width=True, hide_index=True)
        else:
            high = tx[tx.risk_score >= 60].sort_values(["risk_score","amount_inr"], ascending=False).head(30)
            summary = cortex_summary(session, q, high)
            if summary:
                st.markdown("**Cortex summary**")
                st.write(summary)
            st.dataframe(high, use_container_width=True, hide_index=True)

with t2:
    st.subheader("Behavioral risk signals")
    signals = {s: int(tx.risk_signals.fillna("").str.contains(s, regex=False).sum()) for s in ["high_value","new_beneficiary","cross_border","velocity_anomaly","high_risk_merchant"]}
    st.bar_chart(pd.Series(signals).sort_values(ascending=False))
    st.dataframe(tx.sort_values("risk_score", ascending=False).head(30)[["transaction_id","amount_inr","country","channel","risk_score","risk_level","risk_signals"]], use_container_width=True, hide_index=True)

with t3:
    st.subheader("Regulatory evidence")
    topic = st.selectbox("Topic", ["All"] + sorted(local_reg.topic.unique().tolist()))
    view = local_reg if topic == "All" else local_reg[local_reg.topic == topic]
    st.dataframe(view[["document_name","topic","section_hint","guidance_summary","source_url","note"]], use_container_width=True, hide_index=True)
    st.warning("Bundled summaries are illustrative hackathon evidence. Replace them with current official source documents before production/legal use.")

with t4:
    st.subheader("Tiered runtime governance")
    level = st.radio("Governance level", ["OFF","LOW","MEDIUM","HIGH"], horizontal=True, index=3)
    action = st.selectbox("Action", ["read", "transfer", "approve", "pay", "export", "send_email"])
    resource = st.selectbox("Resource", ["account.balance", "customer.profile", "customer.account", "loan.approval", "insurance.claim", "external.email", "mcp.data_tool"])
    left, right = st.columns(2)
    with left:
        amount = st.number_input("Transaction amount (INR)", min_value=0.0, value=50000.0, step=5000.0)
        pii = st.checkbox("Contains sensitive customer data")
        external = st.checkbox("External destination")
        new_ben = st.checkbox("New beneficiary")
    with right:
        provenance = st.checkbox("Trusted provenance", value=(level != "HIGH"))
        allowlisted = st.checkbox("Tool is allow-listed", value=True)
        override = st.checkbox("Forbidden override parameter")
        uncertainty = st.slider("Estimator uncertainty", 0.0, 1.0, 0.15)
    if st.button("Evaluate through RuntimeOS", type="primary", use_container_width=True):
        payload = {
            "action": action, "resource": resource, "purpose": "Snowflake risk copilot",
            "amount_inr": amount, "contains_pii": pii, "external": external,
            "governance_level": level, "provenance_ok": provenance, "tool_allowlisted": allowlisted,
            "override_parameter": override, "uncertainty": uncertainty, "new_beneficiary": new_ben,
        }
        result = None
        try:
            if RUNTIMEOS_URL:
                import requests
                result = requests.post(f"{RUNTIMEOS_URL}/api/risk/govern", json=payload, timeout=8).json()
        except Exception as exc:
            st.error(f"RuntimeOS unavailable: {exc}")
        if result:
            st.metric("Governance decision", result.get("decision", "UNKNOWN"))
            st.write(f"Risk **{result.get('risk_score')}** · P(harm) **{result.get('harm_probability', '—')}**")
            st.write(result.get("reason", ""))
            st.json({"matched_policy": result.get("matched_policy"), "provenance": result.get("provenance"), "evaluation_trace": result.get("evaluation_trace")})

    st.divider()
    st.subheader("Scenario replay")
    scenarios = {
        "B1": "Indirect prompt injection redirects a payment to attacker IBAN",
        "B2": "Structuring split remittance to evade reporting",
        "B3": "Authority impersonation above loan limit",
        "F1": "Unsuitable high-risk financial product",
        "F2": "Forbidden bypass_compliance_check parameter",
        "F3": "Poisoned MCP tool description",
        "I1": "Urgent claim with missing documents",
        "I2": "Injected insurance override limit",
        "I3": "Cross-customer medical data request",
    }
    sid = st.selectbox("Scenario", list(scenarios), format_func=lambda x: f"{x} — {scenarios[x]}")
    if st.button("Replay selected scenario", use_container_width=True):
        import requests
        try:
            if RUNTIMEOS_URL:
                r = requests.get(f"{RUNTIMEOS_URL}/api/risk/scenarios/{sid}/run", params={"level": level}, timeout=8).json()
                st.write(f"Decision: **{r.get('decision')}** · Attack executes: **{r.get('harmful_action_executes')}**")
                st.write(r.get("reason", ""))
            else:
                st.info("Set RUNTIMEOS_URL to replay through the live backend.")
        except Exception as exc:
            st.error(str(exc))

with t5:
    st.subheader("Governance comparison")
    st.caption("Curated deterministic replay for product demonstration; this is not a claim of external benchmark performance.")
    if RUNTIMEOS_URL:
        try:
            import requests
            metrics = requests.get(f"{RUNTIMEOS_URL}/api/risk/metrics", timeout=8).json()
            st.dataframe(pd.DataFrame(metrics.get("levels", [])), use_container_width=True, hide_index=True)
        except Exception as exc:
            st.error(str(exc))
    else:
        st.dataframe(pd.DataFrame({"level":["OFF","LOW","MEDIUM","HIGH"],"purpose":["Baseline","Named action control","Contextual controls","Judgement under uncertainty"]}), use_container_width=True, hide_index=True)
    st.subheader("Compliance evidence")
    st.write("Control mapping: identity/delegation · deny-by-default policies · human escalation · provenance · tool metadata pinning · audit completeness · fairness checks.")
    st.download_button("Download governance evidence snapshot", local_reg.to_csv(index=False), "runtimeos_regulatory_evidence.csv", "text/csv")

st.sidebar.markdown("### Stack")
st.sidebar.write("Snowflake · Cortex · Snowpark · Streamlit · RuntimeOS")
if session:
    st.sidebar.success("Connected to Snowflake")
else:
    st.sidebar.info("Local mode: add SNOWFLAKE_* variables for live Snowflake queries.")
st.sidebar.caption("Flow: natural language → risk/fraud evidence → regulatory evidence → tiered RuntimeOS governance → audit")
