"""
CORS/CSRF regression suite — updated for iteration_7.

Behaviour under test (post-fix):
  - Session-establishing / public endpoints (login, register, logout,
    /public/*, /leads, /payments/checkout, /payments/status/*, /webhook/*)
    are EXEMPT from the Origin-based CSRF check and MUST work from any
    origin — including previously "disallowed" ones (evil.example.com,
    external browser tabs, etc).
  - ALL OTHER /api/* mutations remain guarded: a cross-site POST with a
    disallowed Origin and no Bearer must be 403 "Origin not allowed".
  - Bearer-authenticated calls bypass CSRF from any origin (SDK use case).
  - Cookie-authenticated calls from allowed origins still work (dashboard).
  - GET requests are NEVER CSRF-guarded (auth still enforced).
  - CORS never returns wildcard ACAO.

Hits the local backend at http://localhost:8001 for raw middleware behaviour
(Cloudflare on the external URL rewrites Origin).
"""
import os
import pathlib
import pytest
import requests

LOCAL = "http://localhost:8001"
EXTERNAL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://myapp.preview.example-host.com",
).rstrip("/")

ADMIN_EMAIL = "admin@sentinel.ai"
ADMIN_PW = "REPLACE_WITH_LOCAL_ADMIN_PASSWORD"

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://myapp.preview.example-host.com",
    "https://myapp.example-host.com",
    "https://foo.example-host.com",              # via .example-host.com suffix
    "https://bar.preview.example-host.com",  # via suffix
]

DISALLOWED_ORIGINS = [
    "https://evil.example.com",
    "http://attacker.local",
    "https://random-external-site.io",
    "https://memorygate.dev.fake.host",
]


# --- Helpers ---------------------------------------------------------------

def _login(origin: str | None = None) -> dict:
    headers = {"Content-Type": "application/json"}
    if origin:
        headers["Origin"] = origin
    r = requests.post(
        f"{LOCAL}/api/auth/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PW},
        headers=headers,
        timeout=10,
    )
    assert r.status_code == 200, f"login failed origin={origin}: {r.status_code} {r.text[:200]}"
    return r.json()


# --- 1) Login / auth endpoints are EXEMPT from CSRF -----------------------

class TestLoginExemptFromCSRF:
    """POST /api/auth/login must succeed from EVERY origin (allowed or not,
    or missing entirely). No session exists yet — CSRF is architecturally N/A."""

    @pytest.mark.parametrize("origin", ALLOWED_ORIGINS + DISALLOWED_ORIGINS)
    def test_login_from_any_origin_returns_200(self, origin):
        r = requests.post(
            f"{LOCAL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PW},
            headers={"Origin": origin},
            timeout=10,
        )
        assert r.status_code == 200, f"origin={origin} → {r.status_code} {r.text[:200]}"
        body = r.json()
        assert "token" in body and body["token"].count(".") == 2, "expected JWT"
        assert body["user"]["email"] == ADMIN_EMAIL
        # The user's reported "Origin not allowed" text must NEVER appear here.
        assert "Origin not allowed" not in r.text

    def test_login_no_origin_header_is_allowed(self):
        """SDK / curl / server-to-server: no Origin ⇒ passes through."""
        r = requests.post(
            f"{LOCAL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PW},
            timeout=10,
        )
        assert r.status_code == 200
        assert "token" in r.json()

    def test_login_invalid_creds_still_401_not_403(self):
        """Even with a bad origin, wrong password should be 401 auth failure
        (NOT 403 CSRF) — proves CSRF layer was bypassed for /auth/login."""
        r = requests.post(
            f"{LOCAL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": "wrongpass"},
            headers={"Origin": "https://evil.example.com"},
            timeout=10,
        )
        assert r.status_code == 401
        assert "Origin not allowed" not in r.text


# --- 2) Register / logout / public form endpoints are EXEMPT --------------

class TestExemptEndpointsFromAnyOrigin:
    """Every prefix in _CSRF_EXEMPT_PREFIXES must be callable from evil origins."""

    def test_register_from_disallowed_origin(self):
        import uuid
        email = f"csrf-test-{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(
            f"{LOCAL}/api/auth/register",
            json={
                "email": email,
                "password": "Strong!Pass1",
                "name": "CSRF Test User",
                "org_name": f"CSRF Test Org {uuid.uuid4().hex[:6]}",
            },
            headers={"Origin": "https://evil.example.com"},
            timeout=10,
        )
        assert r.status_code == 200, f"register from evil origin: {r.status_code} {r.text[:300]}"
        body = r.json()
        assert "token" in body
        assert body["user"]["email"] == email
        assert "Origin not allowed" not in r.text

    def test_logout_from_disallowed_origin(self):
        r = requests.post(
            f"{LOCAL}/api/auth/logout",
            headers={"Origin": "https://random-external-site.io"},
            timeout=10,
        )
        # No 403 CSRF. 200 (or 401 if strict auth-required, but not 403 CSRF).
        assert r.status_code != 403, f"logout should not be CSRF-blocked, got {r.status_code}"

    def test_public_leads_from_disallowed_origin(self):
        r = requests.post(
            f"{LOCAL}/api/public/leads",
            json={
                "name": "Ada Lovelace",
                "email": "ada@example.com",
                "company": "Analytical Engines",
                "source": "pilot",
            },
            headers={"Origin": "https://random-external-site.io"},
            timeout=10,
        )
        assert r.status_code == 200, f"public leads from external origin: {r.status_code} {r.text[:300]}"
        assert r.json().get("ok") is True
        assert "Origin not allowed" not in r.text

    def test_payments_checkout_from_disallowed_origin(self):
        r = requests.post(
            f"{LOCAL}/api/payments/checkout",
            json={
                "package_id": "growth_monthly",
                "origin_url": "https://random.io",
            },
            headers={"Origin": "https://random-external-site.io"},
            timeout=15,
        )
        # Not 403 CSRF. Should be 200 with a Dodo Payments URL.
        assert r.status_code == 200, f"checkout from external origin: {r.status_code} {r.text[:300]}"
        body = r.json()
        assert "url" in body
        assert "dodopayments.com" in body["url"], f"expected Dodo Payments URL, got {body['url']}"
        assert "Origin not allowed" not in r.text


# --- 3) SECURITY REGRESSION: guarded endpoints still block cross-site -----

class TestGuardedEndpointsStillBlocked:
    """The critical non-regression: authenticated mutations from disallowed
    origins with NO Bearer must remain 403 'Origin not allowed'. This is what
    prevents session-riding CSRF."""

    @pytest.mark.parametrize("origin", DISALLOWED_ORIGINS)
    def test_post_agents_disallowed_origin_no_bearer_is_403(self, origin):
        r = requests.post(
            f"{LOCAL}/api/agents",
            json={"name": "x"},
            headers={"Origin": origin},
            timeout=10,
        )
        assert r.status_code == 403, f"origin={origin} → {r.status_code}: {r.text[:200]}"
        assert r.json().get("detail") == "Origin not allowed"

    def test_post_policies_disallowed_origin_no_bearer_is_403(self):
        r = requests.post(
            f"{LOCAL}/api/policies",
            json={"name": "x"},
            headers={"Origin": "https://evil.example.com"},
            timeout=10,
        )
        assert r.status_code == 403
        assert r.json().get("detail") == "Origin not allowed"

    def test_patch_agents_disallowed_origin_no_bearer_is_403(self):
        r = requests.patch(
            f"{LOCAL}/api/agents/fake-id",
            json={"name": "x"},
            headers={"Origin": "https://evil.example.com"},
            timeout=10,
        )
        assert r.status_code == 403
        assert r.json().get("detail") == "Origin not allowed"

    def test_delete_policies_disallowed_origin_no_bearer_is_403(self):
        r = requests.delete(
            f"{LOCAL}/api/policies/fake-id",
            headers={"Origin": "https://evil.example.com"},
            timeout=10,
        )
        assert r.status_code == 403
        assert r.json().get("detail") == "Origin not allowed"


# --- 4) SECURITY REGRESSION: Bearer bypass still works ---------------------

class TestBearerBypassStillWorks:
    """SDK / server-to-server callers with Authorization: Bearer must be
    exempt from CSRF regardless of origin — a browser attacker cannot set
    that header cross-site."""

    def test_bearer_bypass_from_evil_origin(self):
        token = _login()["token"]
        r = requests.post(
            f"{LOCAL}/api/agents",
            json={
                "name": "TEST_csrf_bearer_agent",
                "framework": "openai",
                "trust_level": "internal",
                "environment": "dev",
                "owner_email": ADMIN_EMAIL,
            },
            headers={
                "Origin": "https://random-external-site.com",
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
            timeout=10,
        )
        # Key check: NOT 403 CSRF. 200/201 ideal, 400/422 acceptable (payload
        # validation), but CSRF must be bypassed.
        assert r.status_code != 403, (
            f"Bearer + evil origin must bypass CSRF, got {r.status_code}: {r.text[:200]}"
        )
        assert "Origin not allowed" not in r.text


# --- 5) Cookie auth from allowed origins still works ----------------------

class TestCookieAuthFromAllowedOrigins:

    @pytest.mark.parametrize("origin", [
        "https://myapp.example-host.com",
        "https://myapp.preview.example-host.com",
    ])
    def test_agents_post_with_cookie_and_allowed_origin(self, origin):
        s = requests.Session()
        login = s.post(
            f"{LOCAL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PW},
            headers={"Origin": origin},
            timeout=10,
        )
        assert login.status_code == 200
        # Bearer removed to prove cookie is doing the work
        r = s.post(
            f"{LOCAL}/api/agents",
            json={
                "name": "TEST_csrf_cookie_agent",
                "framework": "openai",
                "trust_level": "internal",
                "environment": "dev",
                "owner_email": ADMIN_EMAIL,
            },
            headers={"Origin": origin},
            timeout=10,
        )
        assert r.status_code != 403, (
            f"cookie+allowed origin should not be CSRF-blocked, got {r.status_code}: {r.text[:200]}"
        )
        assert "Origin not allowed" not in r.text


# --- 6) GETs are never CSRF-guarded ---------------------------------------

class TestGetNeverCsrfBlocked:

    def test_get_decisions_from_evil_origin(self):
        """The product no longer requires signing in, so this now resolves
        to the shared demo user regardless of Origin — GETs were never
        CSRF-guarded, and there's no auth gate left to enforce either."""
        r = requests.get(
            f"{LOCAL}/api/decisions",
            headers={"Origin": "https://evil.example.com"},
            timeout=10,
        )
        assert r.status_code == 200, f"expected 200, got {r.status_code}: {r.text[:200]}"
        assert "Origin not allowed" not in r.text

    def test_get_agents_from_evil_origin_with_bearer(self):
        token = _login()["token"]
        r = requests.get(
            f"{LOCAL}/api/agents",
            headers={
                "Origin": "https://evil.example.com",
                "Authorization": f"Bearer {token}",
            },
            timeout=10,
        )
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# --- 7) Audit log entry on CSRF block -------------------------------------

class TestCsrfBlockedAuditLog:

    def test_csrf_block_writes_audit_entry(self):
        """audit_log() emits a JSON line to stderr. In a supervisor-managed
        deployment that lands in /var/log/supervisor/backend.err.log; skips
        cleanly when running locally without supervisor, since the audit
        call itself is exercised by other tests regardless."""
        import time, json as _json, pathlib

        log_file = pathlib.Path("/var/log/supervisor/backend.err.log")
        if not log_file.exists():
            pytest.skip("supervisor log not present — not running under supervisor")

        origin = "https://evil.example.com"
        marker_path = "/api/agents"
        block = requests.post(
            f"{LOCAL}{marker_path}",
            json={"name": "audit-probe"},
            headers={"Origin": origin},
            timeout=10,
        )
        assert block.status_code == 403

        # Give the logger a moment to flush.
        time.sleep(0.3)

        # Read only the tail (last ~200KB) for speed
        text = log_file.read_text(errors="ignore")[-200_000:]
        matches = []
        for line in text.splitlines()[::-1]:
            # audit lines are pure JSON — locate a '{' and parse
            if '"event":"csrf.blocked"' not in line:
                continue
            start = line.find("{")
            if start < 0:
                continue
            try:
                doc = _json.loads(line[start:])
            except Exception:
                continue
            if doc.get("origin") == origin and doc.get("path") == marker_path:
                matches.append(doc)
                break

        assert matches, (
            "no csrf.blocked audit entry with expected origin+path found in "
            "backend.err.log tail"
        )
        entry = matches[0]
        assert entry["event"] == "csrf.blocked"
        assert entry["origin"] == origin
        assert entry["path"] == marker_path


# --- 8) CORS invariants ---------------------------------------------------

class TestCorsInvariants:

    def test_acao_echoes_allowed_origin_not_wildcard(self):
        r = requests.post(
            f"{LOCAL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PW},
            headers={"Origin": "https://myapp.example-host.com"},
            timeout=10,
        )
        aco = r.headers.get("access-control-allow-origin")
        assert aco == "https://myapp.example-host.com"
        assert aco != "*"
        assert r.headers.get("access-control-allow-credentials") == "true"

    def test_options_preflight_allowed_origin(self):
        r = requests.options(
            f"{LOCAL}/api/auth/login",
            headers={
                "Origin": "https://myapp.example-host.com",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": "content-type",
            },
            timeout=10,
        )
        assert r.status_code == 200
        assert r.headers.get("access-control-allow-origin") == "https://myapp.example-host.com"
        assert "POST" in r.headers.get("access-control-allow-methods", "")


# --- 9) External URL still works from allowed origin ----------------------

class TestExternalLoginWorks:
    def test_external_login_from_deployed_origin(self):
        r = requests.post(
            f"{EXTERNAL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PW},
            headers={"Origin": "https://myapp.example-host.com"},
            timeout=15,
        )
        assert r.status_code == 200, f"external login failed: {r.status_code} {r.text[:300]}"
        body = r.json()
        assert "token" in body
        assert body["user"]["email"] == ADMIN_EMAIL

    def test_external_login_from_evil_origin_now_succeeds(self):
        """Post-fix: external URL should also accept login from any origin."""
        r = requests.post(
            f"{EXTERNAL}/api/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PW},
            headers={"Origin": "https://evil.example.com"},
            timeout=15,
        )
        # Cloudflare may strip Origin or leave it; either way login should NOT
        # be 403 "Origin not allowed".
        assert r.status_code == 200, f"external login evil origin: {r.status_code} {r.text[:300]}"
        assert "Origin not allowed" not in r.text


