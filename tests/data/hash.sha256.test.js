import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("hash.sha256 hashes text", async () => {
  const res = await server.rpc("hash.sha256", { text: "hello" });
  expect(res.hash).toMatch(/^[a-f0-9]{64}$/);
});