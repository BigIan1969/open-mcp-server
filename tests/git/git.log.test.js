import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { execSync } from "child_process";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("git.log returns recent commits", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "git-log-"));
  execSync("git init", { cwd: dir });
  execSync("git config user.name \"Test User\"", { cwd: dir });
  execSync("git config user.email \"test@example.com\"", { cwd: dir });

  await fs.writeFile(path.join(dir, "a.txt"), "hello");
  execSync("git add a.txt", { cwd: dir });
  execSync("git commit -m first", { cwd: dir });

  const res = await server.rpc("git.log", { cwd: dir, limit: 1 });
  expect(res.stdout).toContain("first");
});
