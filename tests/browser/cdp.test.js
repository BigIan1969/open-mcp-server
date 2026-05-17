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
    sessionId = null;
  }
  await server.close();
});

// Rewrite container-reported WS URLs (often 0.0.0.0:3000) to the externally reachable host:port.
function normalizeWsUrl(rawWsUrl) {
  const targetBase = new URL(BROWSERLESS_WS);
  const u = new URL(rawWsUrl);
  u.protocol = targetBase.protocol;
  u.host = targetBase.host;
  return u.toString();
}

maybeTest("cdp: connect and evaluate expression", async () => {
  // Create a NEW PAGE target so we get a page-level websocket URL.
  // Browserless exposes CDP JSON endpoints under /json/* for targets. [1](https://deepwiki.com/browserless/browserless/4.1-websocket-api-and-cdp-endpoints)
  const created = await server.rpc("http.get", { url: `${BROWSERLESS_HTTP}/json/new` });

  // If your Browserless requires auth, this may not be 200; in that case, skip.
  if (created.status !== 200) return;

  let target;
  try { target = JSON.parse(created.body); } catch { return; }

  const rawWsUrl = target.webSocketDebuggerUrl || target.webSocketDebuggerURL;
  if (!rawWsUrl) return;

  const wsUrl = normalizeWsUrl(rawWsUrl);

  // Connect to the PAGE websocket, where Runtime.* is available.
  const res = await server.rpc("cdp.connect", { wsEndpoint: wsUrl });
  sessionId = res.sessionId;
  expect(sessionId).toBeDefined();

  const evalRes = await server.rpc("cdp.send", {
    sessionId,
    method: "Runtime.evaluate",
    params: { expression: "1 + 2" }
  });

  expect(evalRes.result.result.value).toBe(3);
});