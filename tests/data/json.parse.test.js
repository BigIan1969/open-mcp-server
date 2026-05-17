import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("json.parse parses valid JSON", async () => {
  const res = await server.rpc("json.parse", { text: "{\"a\":1}" });
  expect(res.value.a).toBe(1);
});