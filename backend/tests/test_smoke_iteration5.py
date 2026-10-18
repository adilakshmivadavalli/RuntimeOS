"""
Smoke tests for iteration 5 (MemoryOS rebrand + inline Contact footer polish).
Per iteration_5 review request: only two backend calls needed to prove nothing broke.
Full V1/V2/V3 legacy suite already verified through iteration_4.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
ORIGIN = "http://localhost:3000"


@pytest.fixture(scope="module")
def admin_token():
    """Log in as the seeded demo admin and return the JWT."""
    r = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": "admin@sentinel.ai", "password": "REPLACE_WITH_LOCAL_ADMIN_PASSWORD"},
        headers={"Origin": ORIGIN, "Content-Type": "application/json"},
        timeout=15,
    )
    assert r.status_code == 200, f"login failed: {r.status_code} {r.text}"
    data = r.json()
    assert isinstance(data.get("token"), str) and len(data["token"]) > 20
    assert data.get("user", {}).get("email") == "admin@sentinel.ai"
    return data["token"]


class TestSmokeAuthAndPayments:
    def test_login_returns_token_and_user(self, admin_token):
        # already asserted in fixture; if we got here, login works
        assert admin_token

    def test_checkout_growth_monthly_returns_dodo_url(self, admin_token):
        r = requests.post(
            f"{BASE_URL}/api/payments/checkout",
            headers={
                "Authorization": f"Bearer {admin_token}",
                "Origin": ORIGIN,
                "Content-Type": "application/json",
            },
            json={
                "package_id": "growth_monthly",
                "origin_url": BASE_URL,
            },
            timeout=20,
        )
        assert r.status_code == 200, f"checkout failed: {r.status_code} {r.text}"
        data = r.json()
        assert "dodopayments.com" in data.get("url", ""), f"unexpected url: {data.get('url')}"
        assert data.get("session_id", "").startswith("cks_")
