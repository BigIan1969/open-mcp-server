import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";
import { spawnSync } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

const hasRg =
  spawnSync("rg", ["--version"], { stdio: "ignore" }).status === 0;

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

(hasRg ? test : test.skip)(
  "text.search finds content in files",
  async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "search-"));
    const file = path.join(dir, "notes.txt");

    await server.rpc("filesystem.write", {
      path: file,
      content: "hello world\nsecond line\n"
    });

    const res = await server.rpc("text.search", {
      path: dir,
      pattern: "hello",
      regex: false
    });

    expect(res.matches.length).toBeGreaterThan(0);
    expect(res.matches[0].file).toMatch(/notes\.txt$/);
  }
);