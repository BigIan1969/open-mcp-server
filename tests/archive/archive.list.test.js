import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("archive.list lists zip contents", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "list-"));
  const file = path.join(dir, "a.txt");
  const zip = path.join(dir, "out.zip");

  await fs.writeFile(file, "list me");
  await server.rpc("archive.zip", { paths: [file], outPath: zip });

  const res = await server.rpc("archive.list", { zipPath: zip });
  expect(res.stdout).toContain("a.txt");
});
