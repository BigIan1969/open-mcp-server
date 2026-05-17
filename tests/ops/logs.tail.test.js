import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("logs.tail returns last lines", async () => {
  const file = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "tail-")), "log.txt");
  await fs.writeFile(file, "one\ntwo\nthree\n");
  const res = await server.rpc("logs.tail", { path: file, lines: 2 });
  expect(res.stdout).toContain("two");
  expect(res.stdout).toContain("three");
});