import { startServer } from "../_helpers/mcpServer.js";

let server;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  await server.close();
});

test("cdp: using session after close returns error", async () => {
  // Create fake session
  const { sessionId } = await server.rpc("cdp.connect", { wsEndpoint: "ws://invalid" }).catch(() => ({ sessionId: "fake" }));

  // Close session (even if invalid)
  await server.rpc("cdp.close", { sessionId }).catch(() => {});

  // Try to reuse
  const res = await server.rpc("cdp.send", {
    sessionId,
    method: "Runtime.evaluate",
    params: { expression: "1+1" }
  });

  // ✅ Should fail cleanly, not crash
  expect(res.error || res.result === undefined).toBeTruthy();
});

test("cdp: invalid method returns structured error", async () => {
  const res = await server.rpc("cdp.send", {
    sessionId: "nonexistent",
    method: "FakeDomain.fakeMethod"
  });

  expect(res.error).toBeDefined();
});