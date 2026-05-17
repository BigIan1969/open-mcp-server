import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("git tools are discoverable", async () => {
  const result = await server.rpc("tools.list");
  const names = result.tools.map(t => t.name);

  expect(names).toContain("git.status");
  expect(names).toContain("git.diff");
  expect(names).toContain("git.log");
});