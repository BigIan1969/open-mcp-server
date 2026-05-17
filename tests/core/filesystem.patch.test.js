import { describe, test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("filesystem.patch replaces content safely", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "patch-"));
  const file = path.join(dir, "config.txt");

  await server.rpc("filesystem.write", {
    path: file,
    content: "MODE=dev\nPORT=3000\n"
  });

  const res = await server.rpc("filesystem.patch", {
    path: file,
    patches: [
      { op: "replace", from: "MODE=dev", to: "MODE=prod" }
    ]
  });

  expect(res.status).toBe("ok");

  const read = await server.rpc("filesystem.read", { path: file });
  expect(read.content).toContain("MODE=prod");
  expect(read.content).not.toContain("MODE=dev");
});
``