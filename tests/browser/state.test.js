import { startServer } from "../_helpers/mcpServer.js";

let server;
let sessionId;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  if (sessionId) await server.rpc("pw.close", { sessionId }).catch(() => {});
  await server.close();
});

test("pw: eval state does not leak between sessions", async () => {
  const res1 = await server.rpc("pw.connect", {
    wsEndpoint: process.env.BROWSERLESS_WS + "/chromium/playwright"
  });

  await server.rpc("pw.setContent", {
    sessionId: res1.sessionId,
    html: "<script>window.x = 42;</script>"
  });

  const r1 = await server.rpc("pw.eval", {
    sessionId: res1.sessionId,
    expression: "window.x"
  });

  expect(r1.value).toBe(42);

  // New session
  const res2 = await server.rpc("pw.connect", {
    wsEndpoint: process.env.BROWSERLESS_WS + "/chromium/playwright"
  });

  const r2 = await server.rpc("pw.eval", {
    sessionId: res2.sessionId,
    expression: "window.x"
  });

  expect(r2.value).toBe(undefined);
});