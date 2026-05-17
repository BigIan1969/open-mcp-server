import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("ops tools are discoverable", async () => {
  const res = await server.rpc("tools.list");
  const names = res.tools.map(t => t.name);
  expect(names).toContain("logs.tail");
  expect(names).toContain("logs.grep");
  expect(names).toContain("system.info");
  expect(names).toContain("net.healthcheck");
});