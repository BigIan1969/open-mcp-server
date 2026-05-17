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
  if (sessionId) await server.rpc("cdp.close", { sessionId }).catch(() => {});
  await server.close();
});

function normalizeWsUrl(rawWsUrl) {
  const base = new URL(BROWSERLESS_WS);
  const u = new URL(rawWsUrl);
  u.protocol = base.protocol;
  u.host = base.host;
  return u.toString();
}

maybeTest("cdp: navigate and read DOM", async () => {
  const created = await server.rpc("http.get", {
    url: `${BROWSERLESS_HTTP}/json/new`
  });

  if (created.status !== 200) return;

  const target = JSON.parse(created.body);
  const wsUrl = normalizeWsUrl(target.webSocketDebuggerUrl);

  const res = await server.rpc("cdp.connect", { wsEndpoint: wsUrl });
  sessionId = res.sessionId;

  await server.rpc("cdp.send", {
    sessionId,
    method: "Page.navigate",
    params: { url: "https://example.com" }
  });

  const evalRes = await server.rpc("cdp.send", {
    sessionId,
    method: "Runtime.evaluate",
    params: { expression: "document.title" }
  });

  expect(evalRes.result.result.value).toMatch(/Example/i);
});