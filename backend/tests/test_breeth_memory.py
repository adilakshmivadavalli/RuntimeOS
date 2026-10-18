import pytest


def test_breeth_config_defaults(monkeypatch):
    monkeypatch.delenv("BREETH_API_KEY", raising=False)
    # Importing the app should not require Breeth credentials; the integration is lazy.
    import server
    assert server.BREETH_BASE_URL == "https://api.thebreeth.com/v1"


def test_memory_models_import():
    from server import MemoryWriteIn, MemorySearchIn
    assert MemoryWriteIn(content="hello").extract_intent is True
    assert MemorySearchIn(query="hello").limit == 10
