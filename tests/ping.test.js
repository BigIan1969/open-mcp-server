import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { spawn } from "child_process";

function startServer() {
  const proc = spawn("node", ["server.js"], { stdio: ["pipe", "pipe", "pipe"] });
  proc.stdout.setEncoding("utf8");

  let buf = "";
  const waiters = new Map();

  proc.stdout.on("data", (chunk) => {
    buf += chunk;
    let idx;
    while ((idx = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;

      let msg;
      try { msg = JSON.parse(line); } catch { continue; }

      if (typeof msg.id !== "undefined" && waiters.has(msg.id)) {
        const { resolve, reject, timer } = waiters.get(msg.id);
        clearTimeout(timer);
        waiters.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message || "JSON-RPC error")) : resolve(msg.result);
      }
    }
  });

  function rpc(method, params = {}, timeoutMs = 2000) {
    const id = Math.floor(Math.random() * 1e9);
    proc.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        waiters.delete(id);
        reject(new Error(`Timeout waiting for response to ${method}`));
      }, timeoutMs);
      waiters.set(id, { resolve, reject, timer });
    });
  }

  function stop() {
    try { proc.kill("SIGTERM"); } catch {}
  }

  return { rpc, stop };
}

describe("ping (JSON-RPC)", () => {
  let server;

  beforeAll(() => { server = startServer(); });
  afterAll(() => { server.stop(); });

  test("returns pong", async () => {
    const result = await server.rpc("ping");
    expect(result).toBe("pong");
  });
});