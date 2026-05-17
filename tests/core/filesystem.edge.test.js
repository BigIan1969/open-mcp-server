import { startServer } from "../_helpers/mcpServer.js";

let server;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  await server.close();
});

test("filesystem.read non-existent file returns error", async () => {
  const res = await server.rpc("filesystem.read", {
    path: "/tmp/does-not-exist.txt"
  });

  expect(res.error).toBeDefined();
});

test("filesystem.write invalid path fails gracefully", async () => {
  await expect(
    server.rpc("filesystem.write", {
      path: "/invalid/path/file.txt",
      content: "test"
    })
  ).rejects.toThrow(/Filesystem access/);
});