import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("logs.grep finds matching lines", async () => {
  const file = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "grep-")), "log.txt");
  await fs.writeFile(file, "alpha\nbeta\ngamma\n");
  const res = await server.rpc("logs.grep", { path: file, pattern: "beta" });
  expect(res.stdout).toContain("beta");
});
