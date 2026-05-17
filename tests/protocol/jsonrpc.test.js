import { startServer } from "../_helpers/mcpServer.js";

let server;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  await server.close();
});

test("invalid method returns JSON-RPC error", async () => {
  await expect(
    server.rpc("invalid.method", {})
  ).rejects.toThrow(/Unknown method/);
});


test("missing params does not crash", async () => {
  const res = await server.rpc("ping", null);

  expect(res).toBeDefined();
});