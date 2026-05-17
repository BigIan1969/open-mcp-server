import { startServer } from "../_helpers/mcpServer.js";

const ENABLE_BROWSERLESS = process.env.ENABLE_BROWSERLESS === "true";
const maybeTest = ENABLE_BROWSERLESS ? test : test.skip;

const BROWSERLESS_HTTP = process.env.BROWSERLESS_HTTP || "http://127.0.0.1:12355";
const BROWSERLESS_WS = process.env.BROWSERLESS_WS || "ws://127.0.0.1:12355";

let server;
let sessionId;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  if (sessionId) {
    await server.rpc("cdp.close", { sessionId }).catch(() => {});
  }
  await server.close();
});

function normalizeWsUrl(raw) {
  const base = new URL(BROWSERLESS_WS);
  const u = new URL(raw);
  u.protocol = base.protocol;
  u.host = base.host;
  return u.toString();
}

maybeTest("protocol: session validation always happens before method validation", async () => {
  // ✅ Case 1: invalid session + valid method
  const res1 = await server.rpc("cdp.send", {
    sessionId: "invalid",
    method: "Runtime.evaluate",
    params: { expression: "1+1" }
  });

  expect(res1.error).toMatch(/Unknown sessionId/);

  // ✅ Case 2: invalid session + invalid method
  const res2 = await server.rpc("cdp.send", {
    sessionId: "invalid",
    method: "FakeDomain.invalidMethod"
  });

  // STILL must be session error (method must NOT be evaluated yet)
  expect(res2.error).toMatch(/Unknown sessionId/);

  // ✅ Create valid session
  const created = await server.rpc("http.get", {
    url: `${BROWSERLESS_HTTP}/json/new`
  });
  if (created.status !== 200) return;

  const target = JSON.parse(created.body);
  const wsUrl = normalizeWsUrl(target.webSocketDebuggerUrl);

  const conn = await server.rpc("cdp.connect", { wsEndpoint: wsUrl });
  sessionId = conn.sessionId;

  // ✅ Case 3: valid session + invalid method
  await expect(
    server.rpc("cdp.send", {
      sessionId,
      method: "FakeDomain.invalidMethod"
    })
  ).rejects.toThrow();

  // ✅ Case 4: valid session + valid method
  const ok = await server.rpc("cdp.send", {
    sessionId,
    method: "Runtime.evaluate",
    params: { expression: "2 + 2" }
  });

  expect(ok.result.result.value).toBe(4);
});

test("protocol: error precedence is deterministic", async () => {
  const cases = [
    { sessionId: "invalid", method: "Runtime.evaluate", expect: "session" },
    { sessionId: "invalid", method: "Fake.method", expect: "session" },
    { sessionId: null, method: "Runtime.evaluate", expect: "session" },
  ];

  for (const c of cases) {
    const res = await server.rpc("cdp.send", {
      sessionId: c.sessionId,
      method: c.method
    });

    expect(res.error).toMatch(/session/i);
  }
});