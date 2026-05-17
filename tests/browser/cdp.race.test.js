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

function normalize(u) {
  const base = new URL(BROWSERLESS_WS);
  const url = new URL(u);
  url.protocol = base.protocol;
  url.host = base.host;
  return url.toString();
}

maybeTest("cdp: rapid interleaved commands stay consistent", async () => {
  const created = await server.rpc("http.get", {
    url: `${BROWSERLESS_HTTP}/json/new`
  });
  if (created.status !== 200) return;

  const wsUrl = normalize(JSON.parse(created.body).webSocketDebuggerUrl);

  const { sessionId } = await server.rpc("cdp.connect", { wsEndpoint: wsUrl });

  const commands = Array.from({ length: 10 }).map((_, i) =>
    server.rpc("cdp.send", {
      sessionId,
      method: "Runtime.evaluate",
      params: { expression: `${i} + ${i}` }
    })
  );

  const results = await Promise.all(commands);

  results.forEach((r, i) => {
    expect(r.result.result.value).toBe(i + i);
  });
});
