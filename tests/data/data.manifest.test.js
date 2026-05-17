import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("data tools are discoverable", async () => {
  const res = await server.rpc("tools.list");
  const names = res.tools.map(t => t.name);
  expect(names).toContain("json.parse");
  expect(names).toContain("json.stringify");
  expect(names).toContain("json.query");
  expect(names).toContain("csv.toJson");
  expect(names).toContain("hash.sha256");
  expect(names).toContain("text.template");
});