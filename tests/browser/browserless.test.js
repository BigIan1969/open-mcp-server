import { startServer } from "../_helpers/mcpServer.js";

const ENABLE_BROWSERLESS = process.env.ENABLE_BROWSERLESS === "true";
const maybeTest = ENABLE_BROWSERLESS ? test : test.skip;

const BROWSERLESS_HTTP = process.env.BROWSERLESS_HTTP || "http://localhost:12355";

let server;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  await server.close();
});

maybeTest("browserless: /json/version responds", async () => {
  const res = await server.rpc("http.get", {
    url: `${BROWSERLESS_HTTP}/json/version`
  });

  // Some Browserless deployments may require token for some endpoints,
  // but /json/version is the most canonical CDP info endpoint. [2](https://deepwiki.com/browserless/browserless/4.1-websocket-api-and-cdp-endpoints)[3](https://github.com/browserless/browserless/issues/317)
  expect([200, 401, 403]).toContain(res.status);

  if (res.status === 200) {
    // Should contain CDP metadata like Browser / Protocol-Version. [3](https://github.com/browserless/browserless/issues/317)
    expect(res.body).toMatch(/Browser|Protocol/i);
  }
});