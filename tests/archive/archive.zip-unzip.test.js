import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("archive.zip and archive.unzip round-trip files", async () => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "zip-"));
  const file = path.join(dir, "a.txt");
  const zip = path.join(dir, "out.zip");
  const extract = path.join(dir, "out");

  await fs.writeFile(file, "hello zip");

  await server.rpc("archive.zip", {
    paths: [file],
    outPath: zip
  });

  await server.rpc("archive.unzip", {
    zipPath: zip,
    outDir: extract
  });

  const content = await fs.readFile(path.join(extract, "a.txt"), "utf8");
  expect(content).toBe("hello zip");
});