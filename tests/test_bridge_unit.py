import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import json
import pytest
import bridge


# ✅ NEW approach: mock the bridge layer instead of subprocess

def test_mcp_route_forwards_request_and_returns_response(monkeypatch):
    response_obj = {"jsonrpc": "2.0", "id": 99, "result": {"ok": True}}

    calls = []

    def fake_call(payload):
        calls.append(payload)
        return response_obj

    # ✅ patch the bridge instance method
    monkeypatch.setattr(bridge.bridge, "call", fake_call)

    client = bridge.app.test_client()

    req_obj = {"jsonrpc": "2.0", "id": 99, "method": "ping"}
    resp = client.post("/mcp", json=req_obj)

    assert resp.status_code == 200
    assert resp.is_json
    assert resp.get_json() == response_obj

    # ✅ verify forwarding behavior
    assert calls == [req_obj]


def test_mcp_route_handles_non_json_body(monkeypatch):
    response_obj = {"jsonrpc": "2.0", "id": None, "error": {"message": "bad"}}

    def fake_call(payload):
        return response_obj

    monkeypatch.setattr(bridge.bridge, "call", fake_call)

    client = bridge.app.test_client()

    resp = client.post("/mcp", data="not-json", content_type="text/plain")

    assert resp.status_code == 200
    assert resp.get_json() == response_obj


def test_mcp_timeout_returns_504(monkeypatch):
    def fake_call(payload):
        raise TimeoutError("timeout")

    monkeypatch.setattr(bridge.bridge, "call", fake_call)

    client = bridge.app.test_client()

    resp = client.post("/mcp", json={"jsonrpc": "2.0"})

    assert resp.status_code == 504
    assert "timeout" in resp.get_json()["error"]