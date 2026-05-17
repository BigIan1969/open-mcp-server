import { startServer } from "../_helpers/mcpServer.js";

const ENABLE_BROWSERLESS = process.env.ENABLE_BROWSERLESS === "true";
const maybeTest = ENABLE_BROWSERLESS ? test : test.skip;

let server;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  await server.close();
});

maybeTest("chaos: random invalid calls do not crash", async () => {
  const randomMethods = [
    "Runtime.evaluate",
    "Network.enable",
    "Page.navigate",
    "FakeDomain.fakeMethod",
    "Browser.getVersion",
  ];

  for (const method of randomMethods) {
    // We deliberately use an invalid sessionId. The key assertion is:
    // - server returns a structured error OR a defined result
    // - server does NOT crash or hang
    const res = await server.rpc("cdp.send", {
      sessionId: "invalid",
      method,
      params: method === "Page.navigate" ? { url: "https://example.com" } : {},
    });

    expect(res).toBeDefined();
  }
});