import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("system.info returns runtime info", async () => {
  const res = await server.rpc("system.info");
  expect(res).toHaveProperty("node");
  expect(res).toHaveProperty("platform");
  expect(res).toHaveProperty("memory");
});