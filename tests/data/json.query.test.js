import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("json.query extracts nested value", async () => {
  const res = await server.rpc("json.query", {
    value: { a: { b: 2 } },
    path: "a.b"
  });
  expect(res.value).toBe(2);
});