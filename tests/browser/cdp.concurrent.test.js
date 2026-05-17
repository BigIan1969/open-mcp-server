import { startServer } from "../_helpers/mcpServer.js";

const ENABLE_BROWSERLESS = process.env.ENABLE_BROWSERLESS === "true";
const maybeTest = ENABLE_BROWSERLESS ? test : test.skip;

const BROWSERLESS_HTTP = process.env.BROWSERLESS_HTTP || "http://127.0.0.1:12355";
const BROWSERLESS_WS = process.env.BROWSERLESS_WS || "ws://127.0.0.1:12355";

let server;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  await server.close();
});

function normalizeWsUrl(raw) {
  const base = new URL(BROWSERLESS_WS);
  const u = new URL(raw);
  u.protocol = base.protocol;
  u.host = base.host;
  return u.toString();
}

maybeTest("cdp: multiple sessions stay isolated", async () => {
  const created = await server.rpc("http.get", {
    url: `${BROWSERLESS_HTTP}/json/new`
  });

  if (created.status !== 200) return;

  const target = JSON.parse(created.body);
  const wsUrl = normalizeWsUrl(target.webSocketDebuggerUrl);

  const sessions = await Promise.all(
    Array.from({ length: 3 }).map(() =>
      server.rpc("cdp.connect", { wsEndpoint: wsUrl })
    )
  );

  const results = await Promise.all(
    sessions.map(s =>
      server.rpc("cdp.send", {
        sessionId: s.sessionId,
        method: "Runtime.evaluate",
        params: { expression: "1 + 1" }
      })
    )
  );

  for (const r of results) {
    expect(r.result.result.value).toBe(2);
  }
});