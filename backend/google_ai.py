"""Google Gemini reasoning layer for the RuntimeOS BFSI copilot.

Uses the Google Gen AI SDK. Two auth modes:
- Gemini API: set GEMINI_API_KEY.
- Vertex AI (recommended on Cloud Run): set GOOGLE_GENAI_USE_VERTEXAI=true,
  GOOGLE_CLOUD_PROJECT and GOOGLE_CLOUD_LOCATION; the Cloud Run service
  account supplies credentials.

generate() returns None on any failure so the copilot falls back to its
deterministic answer instead of erroring.
"""
from __future__ import annotations

import json
import logging
import os
from typing import Any, Optional

logger = logging.getLogger("google_ai")

SYSTEM_PROMPT = (
    "You are a BFSI risk, fraud and compliance analyst inside RuntimeOS. "
    "Answer the user's question using ONLY the JSON evidence provided. "
    "Cite transaction ids and regulatory source ids where relevant. "
    "Never invent transactions, amounts or regulatory requirements. "
    "If the evidence is insufficient, say so. Keep the answer under 180 words "
    "and end with one recommended next action for a human reviewer."
)

_client = None


def _get_client():
    global _client
    if _client is not None:
        return _client
    from google import genai

    if os.getenv("GOOGLE_GENAI_USE_VERTEXAI", "false").lower() in {"1", "true", "yes"}:
        _client = genai.Client(
            vertexai=True,
            project=os.getenv("GOOGLE_CLOUD_PROJECT"),
            location=os.getenv("GOOGLE_CLOUD_LOCATION", "global"),
        )
    elif os.getenv("GEMINI_API_KEY"):
        _client = genai.Client(api_key=os.environ["GEMINI_API_KEY"])
    else:
        raise RuntimeError("Gemini not configured: set GEMINI_API_KEY or GOOGLE_GENAI_USE_VERTEXAI=true")
    return _client


def generate(query: str, evidence: Any) -> Optional[str]:
    try:
        from google.genai import types

        client = _get_client()
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", "gemini-2.5-flash"),
            contents=f"Question: {query}\n\nEvidence JSON:\n{json.dumps(evidence, default=str)[:30000]}",
            config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT, temperature=0.2),
        )
        text = (response.text or "").strip()
        return text or None
    except Exception as exc:  # fall back to deterministic answer
        logger.warning("Gemini generation failed: %s", exc)
        return None
