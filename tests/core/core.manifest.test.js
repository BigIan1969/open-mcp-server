import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("core tools are discoverable", async () => {
  const result = await server.rpc("tools.list");
  const names = result.tools.map(t => t.name);

  expect(names).toContain("filesystem.glob");
  expect(names).toContain("filesystem.patch");
  expect(names).toContain("text.search");
});