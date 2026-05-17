import atexit
import json
import os
import subprocess
import threading
import time
from dataclasses import dataclass
from typing import Any, Dict, Optional

from flask import Flask, request

app = Flask(__name__)

# ----------------------------
# Configuration (env-driven)
# ----------------------------

DEFAULT_NODE_CMD = os.environ.get("MCP_NODE_CMD", "node")
DEFAULT_SERVER_JS = os.environ.get("MCP_SERVER_JS", "server.js")

# Flask listen port for this bridge
DEFAULT_PORT = int(os.environ.get("BRIDGE_PORT", "3000"))

# Per-request timeout waiting for Node to respond (seconds)
DEFAULT_RPC_TIMEOUT_S = float(os.environ.get("BRIDGE_RPC_TIMEOUT_S", "5.0"))

# Forward Node stderr to bridge stderr (helpful for debugging)
FORWARD_NODE_STDERR = os.environ.get("BRIDGE_FORWARD_NODE_STDERR", "true").lower() == "true"

# How many bytes of Node stderr to include in error responses (cap)
NODE_STDERR_MAX_BYTES = int(os.environ.get("BRIDGE_NODE_STDERR_MAX_BYTES", "4000"))


# ----------------------------
# Bridge implementation
# ----------------------------

@dataclass
class MCPSubprocessBridge:
    node_cmd: str = DEFAULT_NODE_CMD
    server_js: str = DEFAULT_SERVER_JS
    rpc_timeout_s: float = DEFAULT_RPC_TIMEOUT_S

    _proc: Optional[subprocess.Popen] = None
    _lock: threading.Lock = threading.Lock()

    def start(self) -> None:
        """Start the Node MCP server if not already running."""
        if self._proc is not None and self._proc.poll() is None:
            return

        root_dir = os.path.dirname(os.path.abspath(__file__))
        script_path = os.path.join(root_dir, self.server_js)

        # Ensure deterministic execution context for Node:
        # - absolute server.js path
        # - cwd = repo root (bridge.py directory)
        self._proc = subprocess.Popen(
            [self.node_cmd, script_path],
            cwd=root_dir,
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,  # line buffered in text mode
        )

        if FORWARD_NODE_STDERR and self._proc.stderr:
            threading.Thread(
                target=self._stderr_pump, args=(self._proc.stderr,), daemon=True
            ).start()

    def stop(self) -> None:
        """Stop the Node MCP server."""
        p = self._proc
        self._proc = None
        if not p:
            return
        try:
            if p.poll() is None:
                p.terminate()
                try:
                    p.wait(timeout=2)
                except subprocess.TimeoutExpired:
                    p.kill()
        except Exception:
            pass

    def _stderr_pump(self, stderr_stream) -> None:
        """Forward Node stderr lines to this process stderr."""
        try:
            for line in stderr_stream:
                try:
                    os.write(2, line.encode("utf-8", errors="replace"))
                except Exception:
                    # last resort
                    pass
        except Exception:
            pass

    def _read_stderr_tail(self) -> str:
        """Read remaining stderr (best-effort) for debugging."""
        p = self._proc
        if not p or not p.stderr:
            return ""
        try:
            data = p.stderr.read()
            if not data:
                return ""
            # Cap size
            if len(data) > NODE_STDERR_MAX_BYTES:
                data = data[-NODE_STDERR_MAX_BYTES:]
            return data
        except Exception:
            return ""

    def _read_json_line(self, timeout_s: float) -> Dict[str, Any]:
        """
        Read newline-delimited JSON from Node stdout, skipping garbage lines.
        Uses readline() and enforces a timeout.
        """
        assert self._proc and self._proc.stdout, "Node process not started"
        deadline = time.time() + timeout_s

        while time.time() < deadline:
            # If Node died, surface a helpful message
            if self._proc.poll() is not None:
                stderr_tail = self._read_stderr_tail()
                msg = "Node MCP process exited unexpectedly"
                if stderr_tail:
                    msg += f": {stderr_tail.strip()}"
                raise RuntimeError(msg)

            line = self._proc.stdout.readline()
            if not line:
                time.sleep(0.01)
                continue

            line = line.strip()
            if not line:
                continue

            try:
                return json.loads(line)
            except json.JSONDecodeError:
                # Ignore garbage lines (e.g., accidental stdout logs)
                continue

        raise TimeoutError("Timed out waiting for MCP response from Node stdout")

    def call(self, payload: Any) -> Dict[str, Any]:
        """
        Send a JSON message to Node and return the next JSON response.
        Lock ensures request/response pairing under concurrent HTTP requests.
        """
        self.start()
        assert self._proc and self._proc.stdin and self._proc.stdout, "Node process not started"

        with self._lock:
            self._proc.stdin.write(json.dumps(payload) + "\n")
            self._proc.stdin.flush()
            return self._read_json_line(self.rpc_timeout_s)


# Global bridge instance (lazy started)
bridge = MCPSubprocessBridge()

# Ensure Node subprocess is cleaned up
atexit.register(lambda: bridge.stop())


# ----------------------------
# Flask routes
# ----------------------------

@app.route("/mcp", methods=["POST"])
def mcp():
    # Preserve legacy behavior: if not JSON, payload becomes None => "null\n"
    data = request.get_json(silent=True)
    payload = data if data is not None else None

    try:
        response = bridge.call(payload)
        return app.response_class(
            response=json.dumps(response),
            status=200,
            mimetype="application/json",
        )
    except TimeoutError as e:
        return app.response_class(
            response=json.dumps({"error": str(e)}),
            status=504,
            mimetype="application/json",
        )
    except Exception as e:
        # Return structured error for integration tests / callers
        return app.response_class(
            response=json.dumps({"error": str(e)}),
            status=500,
            mimetype="application/json",
        )


@app.route("/healthz", methods=["GET"])
def healthz():
    running = bridge._proc is not None and bridge._proc.poll() is None
    return app.response_class(
        response=json.dumps({"status": "ok", "node_running": running}),
        status=200,
        mimetype="application/json",
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=DEFAULT_PORT)