import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("hash.file computes file hash", async () => {
  const file = path.join(await fs.mkdtemp(path.join(os.tmpdir(), "hash-")), "a.txt");
  await fs.writeFile(file, "hash me");

  const res = await server.rpc("hash.file", { path: file });
  expect(res.hash).toMatch(/^[a-f0-9]{64}$/);
});