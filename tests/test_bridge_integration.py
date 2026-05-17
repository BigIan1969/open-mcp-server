import os
import json
import time
import subprocess
import pytest
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

pytestmark = pytest.mark.skipif(
    os.environ.get("ENABLE_BRIDGE_INTEGRATION") != "true",
    reason="Set ENABLE_BRIDGE_INTEGRATION=true to run integration test."
)

def test_bridge_http_roundtrip():
    import sys
    import os

    script = os.path.join(
        os.path.dirname(__file__), "..", "bridge.py"
    )

    proc = subprocess.Popen(
        [sys.executable, script],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )

    try:
        
        if not wait_for_server("http://127.0.0.1:3000/healthz"):
            time.sleep(0.2)  # give process time to write stderr
            stderr = proc.stderr.read()

            print("\n==== BRIDGE STDERR ====")
            print(stderr if stderr else "(no stderr output)")
            print("=======================\n")

            assert False, "Bridge server did not start"

        payload = json.dumps({"jsonrpc":"2.0","id":1,"method":"ping"})

        curl = subprocess.run(
            ["curl", "-s", "-X", "POST", "http://127.0.0.1:3000/mcp",
             "-H", "Content-Type: application/json",
             "-d", payload],
            capture_output=True,
            text=True,
            check=True
        )

        resp = json.loads(curl.stdout)

        assert resp.get("jsonrpc") == "2.0"
        assert resp.get("id") == 1

    finally:
        proc.terminate()
        proc.wait(timeout=3)

def wait_for_server(url, timeout=5.0):
    import time
    import subprocess

    start = time.time()

    while time.time() - start < timeout:
        try:
            r = subprocess.run(
                ["curl", "-s", url],
                capture_output=True,
                text=True
            )
            if r.returncode == 0:
                return True
        except Exception:
            pass

        time.sleep(0.1)

    return False