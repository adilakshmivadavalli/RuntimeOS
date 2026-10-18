"""Firestore persistence for copilot sessions and governance decisions.

Writes every copilot question/answer and every governed action decision to
native Firestore collections (`copilot_queries`, `governance_decisions`) so
judges and auditors can inspect them in the Firebase console. Enabled when
FIRESTORE_ENABLED=true; on Cloud Run the service account supplies credentials.
Failures are logged and never break the request path.
"""
from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any, Dict, List

logger = logging.getLogger("firestore_store")

_db = None


def enabled() -> bool:
    return os.getenv("FIRESTORE_ENABLED", "false").lower() in {"1", "true", "yes"}


def _client():
    global _db
    if _db is None:
        from google.cloud import firestore

        _db = firestore.AsyncClient(
            project=os.getenv("GOOGLE_CLOUD_PROJECT") or None,
            database=os.getenv("FIRESTORE_DATABASE", "(default)"),
        )
    return _db


async def record(collection: str, doc: Dict[str, Any]) -> None:
    if not enabled():
        return
    try:
        payload = {**doc, "created_at": datetime.now(timezone.utc).isoformat()}
        await _client().collection(collection).add(payload)
    except Exception as exc:
        logger.warning("Firestore write to %s failed: %s", collection, exc)


async def recent(collection: str, limit: int = 20) -> List[Dict[str, Any]]:
    if not enabled():
        return []
    try:
        from google.cloud import firestore

        query = _client().collection(collection).order_by("created_at", direction=firestore.Query.DESCENDING).limit(limit)
        return [d.to_dict() async for d in query.stream()]
    except Exception as exc:
        logger.warning("Firestore read from %s failed: %s", collection, exc)
        return []
