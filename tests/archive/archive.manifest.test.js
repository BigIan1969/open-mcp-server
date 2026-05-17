import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("archive tools are discoverable", async () => {
  const res = await server.rpc("tools.list");
  const names = res.tools.map(t => t.name);
  expect(names).toContain("archive.zip");
  expect(names).toContain("archive.unzip");
  expect(names).toContain("archive.list");
  expect(names).toContain("hash.file");
});