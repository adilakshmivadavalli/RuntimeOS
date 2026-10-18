"""
Dodo Payments checkout + status polling tests for /api/payments/*.

Focus: validates that Dodo Payments Checkout session creation works end-to-end,
persists a payment_transactions row, and status polling returns the
correct shape for known/unknown session_ids.
"""
import os
import pathlib
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback: try reading from frontend/.env, resolved relative to this
    # file's own location so it works regardless of the repo's checkout
    # path or which directory pytest is invoked from.
    _frontend_env = pathlib.Path(__file__).resolve().parents[2] / "frontend" / ".env"
    try:
        with open(_frontend_env) as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.split("=", 1)[1].strip().strip('"').rstrip("/")
                    break
    except FileNotFoundError:
        pass

ORIGIN = BASE_URL or "http://localhost:3000"


@pytest.fixture(scope="module")
def api():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json", "Origin": ORIGIN})
    return s


class TestDodoPaymentsCheckout:
    """POST /api/payments/checkout — creates real Dodo Payments test session."""

    def test_growth_monthly_returns_checkout_url(self, api):
        r = api.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "growth_monthly",
                "origin_url": ORIGIN,
                "email": "TEST_buyer_monthly@example.com",
                "company": "TEST Acme",
            },
            timeout=30,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "url" in data and "session_id" in data
        assert "dodopayments.com" in data["url"], data["url"]
        assert isinstance(data["session_id"], str) and len(data["session_id"]) > 5
        # stash for other tests
        pytest.monthly_session_id = data["session_id"]

    def test_growth_annual_returns_checkout_url(self, api):
        r = api.post(
            f"{BASE_URL}/api/payments/checkout",
            json={
                "package_id": "growth_annual",
                "origin_url": ORIGIN,
                "email": "TEST_buyer_annual@example.com",
            },
            timeout=30,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "dodopayments.com" in data["url"]
        assert data["session_id"]

    def test_invalid_package_returns_400(self, api):
        r = api.post(
            f"{BASE_URL}/api/payments/checkout",
            json={"package_id": "enterprise_yearly", "origin_url": ORIGIN},
            timeout=15,
        )
        # Pydantic Literal rejects unknown -> 422; explicit dict lookup -> 400.
        # The Literal typing means we should see 422 for unknown values.
        assert r.status_code in (400, 422), r.text

    def test_missing_origin_url_rejected(self, api):
        r = api.post(
            f"{BASE_URL}/api/payments/checkout",
            json={"package_id": "growth_monthly"},
            timeout=15,
        )
        assert r.status_code == 422


@pytest.fixture(scope="module")
def monthly_session(api):
    """Create one Growth Monthly checkout session for status polling tests."""
    r = api.post(
        f"{BASE_URL}/api/payments/checkout",
        json={
            "package_id": "growth_monthly",
            "origin_url": ORIGIN,
            "email": "TEST_status_poll@example.com",
        },
        timeout=30,
    )
    assert r.status_code == 200, r.text
    return r.json()


class TestDodoPaymentsStatus:
    """GET /api/payments/status/{session_id}."""

    def test_status_for_known_session(self, api, monthly_session):
        session_id = monthly_session["session_id"]
        r = api.get(f"{BASE_URL}/api/payments/status/{session_id}", timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["session_id"] == session_id
        assert "payment_status" in d
        assert "status" in d
        assert d.get("package_id") == "growth_monthly"

    def test_status_for_unknown_session_is_404(self, api):
        r = api.get(f"{BASE_URL}/api/payments/status/cks_test_does_not_exist_12345", timeout=15)
        assert r.status_code == 404


LOCAL = "http://localhost:8001"


class TestCorsCsrfSmoke:
    """Iteration_3 regression smoke — allowed vs disallowed Origin on login.
    Hits localhost:8001 directly (same as iteration_3 test_cors_csrf.py) because
    only the FastAPI CSRF middleware enforces Origin; the K8s ingress does not."""

    def test_login_from_allowed_origin(self):
        r = requests.post(
            f"{LOCAL}/api/auth/login",
            headers={"Origin": ORIGIN, "Content-Type": "application/json"},
            json={"email": "admin@sentinel.ai", "password": "REPLACE_WITH_LOCAL_ADMIN_PASSWORD"},
            timeout=20,
        )
        assert r.status_code == 200, r.text
        body = r.json()
        # backend returns {'user': ..., 'token': ...}
        assert "token" in body and body["token"]

    def test_login_from_disallowed_origin_blocked(self):
        r = requests.post(
            f"{LOCAL}/api/auth/login",
            headers={"Origin": "https://evil.example.com", "Content-Type": "application/json"},
            json={"email": "admin@sentinel.ai", "password": "REPLACE_WITH_LOCAL_ADMIN_PASSWORD"},
            timeout=20,
        )
        assert r.status_code == 403, r.text
        assert r.json().get("detail") == "Origin not allowed"

    def test_decisions_endpoint_reachable_with_auth(self):
        # smoke: iteration_2 core V1 endpoint
        login = requests.post(
            f"{BASE_URL}/api/auth/login",
            headers={"Origin": ORIGIN, "Content-Type": "application/json"},
            json={"email": "admin@sentinel.ai", "password": "REPLACE_WITH_LOCAL_ADMIN_PASSWORD"},
            timeout=20,
        )
        token = login.json()["token"]
        r = requests.get(
            f"{BASE_URL}/api/decisions?limit=5",
            headers={"Authorization": f"Bearer {token}"},
            timeout=15,
        )
        assert r.status_code == 200
        assert isinstance(r.json(), (list, dict))
