import { spawn } from "child_process";

export function startServer(envOverrides = {}) {
  const proc = spawn("node", ["server.js"], {
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, ...envOverrides },
  });

  proc.stdout.setEncoding("utf8");
  proc.stderr.setEncoding("utf8");

  let buf = "";
  let stderr = "";
  const waiters = new Map();

  proc.stderr.on("data", d => { stderr += d; });

  proc.stdout.on("data", chunk => {
    buf += chunk;
    let idx;
    while ((idx = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;

      let msg;
      try { msg = JSON.parse(line); } catch { continue; }

      if (waiters.has(msg.id)) {
        const { resolve, reject, timer } = waiters.get(msg.id);
        clearTimeout(timer);
        waiters.delete(msg.id);

        if (msg.error) reject(new Error(msg.error.message || "JSON-RPC error"));
        else resolve(msg.result);
      }
    }
  });

  function rpc(method, params = {}, timeoutMs = 10000) {
    const id = Math.floor(Math.random() * 1e9);
    const payload = { jsonrpc: "2.0", id, method, params };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        waiters.delete(id);
        reject(new Error(`Timeout waiting for ${method}\n${stderr}`));
      }, timeoutMs);

      waiters.set(id, { resolve, reject, timer });
      proc.stdin.write(JSON.stringify(payload) + "\n");
    });
  }

  function close() {
    return new Promise((resolve) => {
      proc.once("exit", resolve);
      try { proc.kill("SIGTERM"); } catch { resolve(); }
    });
  }

  // ✅ Some tests use stop(), some use close()
  const stop = close;

  return { rpc, close, stop };
}