"""Optional Snowflake-backed adapter for RuntimeOS risk intelligence.

The existing RuntimeOS demo remains runnable without Snowflake. When the
SNOWFLAKE_* environment variables are configured, these helpers become the
source of truth for the risk copilot endpoints.
"""
from __future__ import annotations

import json
import os
from typing import Any


class SnowflakeRiskAdapter:
    def __init__(self) -> None:
        self.account = os.getenv("SNOWFLAKE_ACCOUNT", "")
        self.user = os.getenv("SNOWFLAKE_USER", "")
        self.password = os.getenv("SNOWFLAKE_PASSWORD", "")
        self.warehouse = os.getenv("SNOWFLAKE_WAREHOUSE", "")
        self.database = os.getenv("SNOWFLAKE_DATABASE", "RUNTIMEOS_HACK")
        self.schema = os.getenv("SNOWFLAKE_SCHEMA", "RISK")
        self.role = os.getenv("SNOWFLAKE_ROLE", "")
        self.model = os.getenv("SNOWFLAKE_CORTEX_MODEL", "llama3.3-70b")

    @property
    def enabled(self) -> bool:
        return bool(self.account and self.user and self.password and self.warehouse)

    def _connect(self):
        if not self.enabled:
            return None
        import snowflake.connector  # type: ignore
        kwargs = {
            "account": self.account,
            "user": self.user,
            "password": self.password,
            "warehouse": self.warehouse,
            "database": self.database,
            "schema": self.schema,
        }
        if self.role:
            kwargs["role"] = self.role
        return snowflake.connector.connect(**kwargs)

    def _query(self, sql: str, params: Any = None) -> list[dict[str, Any]]:
        conn = self._connect()
        if not conn:
            return []
        cur = conn.cursor()
        try:
            cur.execute(sql, params) if params is not None else cur.execute(sql)
            cols = [d[0].lower() for d in cur.description]
            return [dict(zip(cols, row)) for row in cur.fetchall()]
        finally:
            cur.close()
            conn.close()

    def summary(self) -> dict[str, Any]:
        q = """
        SELECT COUNT(*) AS transactions,
               COALESCE(SUM(AMOUNT_INR),0) AS total_value_inr,
               COALESCE(SUM(IFF(IS_FRAUD_LABEL,1,0)),0) AS fraud_labels,
               COALESCE(SUM(IFF(RISK_LEVEL='LOW',1,0)),0) AS low,
               COALESCE(SUM(IFF(RISK_LEVEL='MEDIUM',1,0)),0) AS medium,
               COALESCE(SUM(IFF(RISK_LEVEL='HIGH',1,0)),0) AS high,
               COALESCE(SUM(IFF(RISK_LEVEL='CRITICAL',1,0)),0) AS critical
        FROM RUNTIMEOS_HACK.RISK.RISK_TRANSACTIONS
        """
        row = self._query(q)[0]
        total = int(row["transactions"] or 0)
        high_share = ((int(row["high"] or 0) + int(row["critical"] or 0)) / max(1, total)) * 100
        return {
            "transactions": total,
            "total_value_inr": float(row["total_value_inr"] or 0),
            "fraud_labels": int(row["fraud_labels"] or 0),
            "risk_counts": {k.upper(): int(row[k] or 0) for k in ["low", "medium", "high", "critical"]},
            "high_risk_share_pct": round(high_share, 2),
            "source": "snowflake",
        }

    def transactions(self, min_risk: int = 60, limit: int = 20) -> list[dict[str, Any]]:
        q = """
        SELECT TRANSACTION_ID, TIMESTAMP, ACCOUNT_ID, CUSTOMER_ID, AMOUNT_INR, CURRENCY,
               MERCHANT_ID, MERCHANT_CATEGORY, CHANNEL, COUNTRY, BENEFICIARY_ID,
               IS_NEW_BENEFICIARY, IS_FRAUD_LABEL, TRANSACTION_STATUS,
               RISK_SCORE, RISK_LEVEL, RISK_SIGNALS, TXN_VELOCITY_1H,
               CROSS_BORDER_SIGNAL, HIGH_VALUE_SIGNAL, COMPUTED_RISK_LEVEL
        FROM RUNTIMEOS_HACK.RISK.RISK_TRANSACTIONS
        WHERE RISK_SCORE >= %(min_risk)s
        ORDER BY RISK_SCORE DESC, AMOUNT_INR DESC
        LIMIT %(limit)s
        """
        return self._query(q, {"min_risk": min_risk, "limit": limit})

    def transaction(self, transaction_id: str) -> dict[str, Any] | None:
        rows = self._query(
            "SELECT * FROM RUNTIMEOS_HACK.RISK.RISK_TRANSACTIONS WHERE TRANSACTION_ID = %(transaction_id)s LIMIT 1",
            {"transaction_id": transaction_id.upper()},
        )
        return rows[0] if rows else None

    def regulatory_search(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        payload = json.dumps({
            "query": query,
            "columns": ["DOCUMENT_NAME", "TOPIC", "SECTION_HINT", "GUIDANCE_SUMMARY", "SOURCE_URL", "NOTE"],
            "limit": limit,
        }).replace("'", "''")
        sql = f"""
        SELECT SNOWFLAKE.CORTEX.SEARCH_PREVIEW(
          'RUNTIMEOS_HACK.RISK.REGULATORY_SEARCH',
          '{payload}'
        ) AS RESULT
        """
        rows = self._query(sql)
        if not rows:
            return []
        raw = rows[0].get("result")
        if isinstance(raw, str):
            try:
                parsed = json.loads(raw)
            except Exception:
                return []
        else:
            parsed = raw or {}
        return parsed.get("results", parsed.get("data", [])) or []

    def complete(self, prompt: str) -> str | None:
        safe = prompt.replace("'", "''")
        model = self.model.replace("'", "''")
        sql = f"SELECT AI_COMPLETE('{model}', '{safe}') AS ANSWER"
        rows = self._query(sql)
        return str(rows[0]["answer"]) if rows and rows[0].get("answer") is not None else None


snowflake_risk = SnowflakeRiskAdapter()
