import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";
import fs from "fs/promises";
import path from "path";
import os from "os";
import { execSync } from "child_process";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("git.diff shows changes", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "git-diff-"));
  execSync("git init", { cwd: dir });
  execSync("git config user.name \"Test User\"", { cwd: dir });
  execSync("git config user.email \"test@example.com\"", { cwd: dir });

  const file = path.join(dir, "a.txt");
  await fs.writeFile(file, "one\n");
  execSync("git add a.txt", { cwd: dir });
  execSync("git commit -m init", { cwd: dir });

  await fs.writeFile(file, "one\ntwo\n");

  const res = await server.rpc("git.diff", { cwd: dir });
  expect(res.stdout).toContain("+two");
});