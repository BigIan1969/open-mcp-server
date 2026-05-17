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

function normalize(u) {
  const base = new URL(BROWSERLESS_WS);
  const url = new URL(u);
  url.protocol = base.protocol;
  url.host = base.host;
  return url.toString();
}

maybeTest("cdp: simulate blocked network resource", async () => {
  const created = await server.rpc("http.get", {
    url: `${BROWSERLESS_HTTP}/json/new`
  });
  if (created.status !== 200) return;

  const target = JSON.parse(created.body);
  const wsUrl = normalize(target.webSocketDebuggerUrl);

  const conn = await server.rpc("cdp.connect", { wsEndpoint: wsUrl });
  sessionId = conn.sessionId;

  await server.rpc("cdp.send", { sessionId, method: "Network.enable" });

  // ✅ Block all images
  await server.rpc("cdp.send", {
    sessionId,
    method: "Network.setBlockedURLs",
    params: { urls: ["*.png", "*.jpg"] }
  });

  const evalRes = await server.rpc("cdp.send", {
    sessionId,
    method: "Runtime.evaluate",
    params: { expression: "document.readyState" }
  });

  expect(evalRes.result.result.value).toBe("complete");
});