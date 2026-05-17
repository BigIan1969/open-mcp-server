import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { spawn } from "child_process";
import path from "path";
import os from "os";
import fs from "fs/promises";

function startServer() {
  // Start `node server.js` as a subprocess
  const proc = spawn("node", ["server.js"], {
    stdio: ["pipe", "pipe", "pipe"],
  });

  proc.stdout.setEncoding("utf8");
  proc.stderr.setEncoding("utf8");

  let buf = "";
  const waiters = new Map(); // id -> {resolve, reject, timer}

  proc.stdout.on("data", (chunk) => {
    buf += chunk;
    let idx;
    while ((idx = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;

      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        continue;
      }

      if (msg && typeof msg.id !== "undefined" && waiters.has(msg.id)) {
        const { resolve, reject, timer } = waiters.get(msg.id);
        clearTimeout(timer);
        waiters.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || "JSON-RPC error"));
        else resolve(msg.result);
      }
    }
  });

  function rpc(method, params = {}, timeoutMs = 2000) {
    const id = Math.floor(Math.random() * 1e9);
    const payload = { jsonrpc: "2.0", id, method, params };

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        waiters.delete(id);
        reject(new Error(`Timeout waiting for response to ${method}`));
      }, timeoutMs);

      waiters.set(id, { resolve, reject, timer });
      proc.stdin.write(JSON.stringify(payload) + "\n");
    });
  }

  async function stop() {
    // Best-effort shutdown
    try {
      proc.kill("SIGTERM");
    } catch {}
  }

  return { proc, rpc, stop };
}

describe("server.js tools (JSON-RPC)", () => {
  let server;

  beforeAll(() => {
    server = startServer();
  });

  afterAll(async () => {
    if (server) await server.stop();
  });

  test("tools.list returns a manifest containing expected tools", async () => {
    const result = await server.rpc("tools.list");
    expect(result).toHaveProperty("tools");
    expect(Array.isArray(result.tools)).toBe(true);

    const names = result.tools.map((t) => t.name);

    // A few representative tools that server.js declares
    expect(names).toContain("shell.run");
    expect(names).toContain("filesystem.read");
    expect(names).toContain("filesystem.write");
    expect(names).toContain("http.get");
    expect(names).toContain("http.post");
    expect(names).toContain("process.list");
    expect(names).toContain("process.kill");
    expect(names).toContain("schedule.add");
  });

  test("ping returns pong", async () => {
    const result = await server.rpc("ping");
    expect(result).toBe("pong");
  });

  test("shell.run executes a simple command", async () => {
    const result = await server.rpc("shell.run", { command: "echo hello" });
    expect(result).toHaveProperty("returncode");
    expect(result.returncode).toBe(0);
    expect(result.stdout).toContain("hello");
  });

  test("filesystem.write then filesystem.read round-trips content", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "mcp-test-"));
    const filePath = path.join(tmpDir, "note.txt");

    const writeRes = await server.rpc("filesystem.write", {
      path: filePath,
      content: "copilot test",
    });
    expect(writeRes).toEqual({ status: "ok" });

    const readRes = await server.rpc("filesystem.read", { path: filePath });
    expect(readRes).toHaveProperty("content");
    expect(readRes.content).toBe("copilot test");
  });

  test("process.list returns process table output", async () => {
    const result = await server.rpc("process.list", {});
    expect(result).toHaveProperty("returncode");
    expect(result.returncode).toBe(0);
    expect(result.stdout).toContain("ps");
  });
});