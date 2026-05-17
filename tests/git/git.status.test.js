import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { execSync } from "child_process";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("git.status reports modified files", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "git-status-"));
  execSync("git init", { cwd: dir });

  await fs.writeFile(path.join(dir, "a.txt"), "hello");

  const res = await server.rpc("git.status", { cwd: dir });
  expect(res.stdout).toMatch(/a\.txt/);
});