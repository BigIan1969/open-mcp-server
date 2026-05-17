import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("filesystem.glob finds matching files", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "glob-"));
  await server.rpc("filesystem.write", {
    path: path.join(dir, "a.txt"),
    content: "alpha"
  });
  await server.rpc("filesystem.write", {
    path: path.join(dir, "b.log"),
    content: "beta"
  });

  const res = await server.rpc("filesystem.glob", {
    cwd: dir,
    pattern: "*.txt"
  });

  expect(res.files).toHaveLength(1);
  expect(res.files[0]).toMatch(/a\.txt$/);
});