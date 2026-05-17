import fs from "fs/promises";
import os from "os";
import path from "path";
import { startServer } from "../_helpers/mcpServer.js";

let server;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  await server.close();
});

test("workflow: pw + filesystem + hash integration", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "workflow-"));
  const file = path.join(tmp, "test.txt");

  // Write file
  await server.rpc("filesystem.write", {
    path: file,
    content: "hello world"
  });

  // Read file back
  const read = await server.rpc("filesystem.read", { path: file });
  expect(read.content).toBe("hello world");

  // Hash content
  const hash = await server.rpc("hash.sha256", {
    text: read.content
  });

  expect(typeof hash.hash).toBe("string");
});
