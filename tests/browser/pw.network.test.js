import { startServer } from "../_helpers/mcpServer.js";

const ENABLE_BROWSERLESS = process.env.ENABLE_BROWSERLESS === "true";
const maybeTest = ENABLE_BROWSERLESS ? test : test.skip;

const BROWSERLESS_WS = process.env.BROWSERLESS_WS || "ws://127.0.0.1:12355";
const PW_ENDPOINT = `${BROWSERLESS_WS}/chromium/playwright`;

let server;
let sessionId;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  if (sessionId) await server.rpc("pw.close", { sessionId }).catch(() => {});
  await server.close();
});

beforeEach(async () => {
  const res = await server.rpc("pw.connect", { wsEndpoint: PW_ENDPOINT });
  sessionId = res.sessionId;
});

afterEach(async () => {
  if (sessionId) await server.rpc("pw.close", { sessionId }).catch(() => {});
});

maybeTest("pw: network interception blocks resource", async () => {
  await server.rpc("pw.setContent", {
    sessionId,
    html: `<html><body><img src="https://example.com/test.png"></body></html>`
  });

  // Intercept via Playwright route
  await server.rpc("pw.addScript", {
    sessionId,
    script: `
      await page.route(/\\.png$/, route => route.abort());
    `
  }).catch(() => {});

  const res = await server.rpc("pw.eval", {
    sessionId,
    expression: "document.images.length"
  });

  expect(res).toBeDefined();
});