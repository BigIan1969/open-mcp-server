import { startServer } from "../_helpers/mcpServer.js";

let server;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  await server.close();
});

test("protocol: mixed error modes are handled correctly", async () => {
  // ✅ CASE 1: Hard error (should reject)
  await expect(
    server.rpc("invalid.method", {})
  ).rejects.toThrow(/Unknown method/);

  // ✅ CASE 2: Soft error (should return error object)
  const soft = await server.rpc("filesystem.read", {
    path: "/tmp/does-not-exist.txt"
  });

  expect(soft.error).toBeDefined();

  // ✅ CASE 3: Security violation (hard error)
  await expect(
    server.rpc("filesystem.write", {
      path: "/etc/passwd",
      content: "hack"
    })
  ).rejects.toThrow(/Filesystem access/);

  // ✅ CASE 4: Valid call (sanity check)
  const ok = await server.rpc("ping", {});
  expect(ok).toBe("pong");
});


test("protocol: repeated mixed errors stay stable", async () => {
  for (let i = 0; i < 10; i++) {
    await expect(
      server.rpc("invalid.method", {})
    ).rejects.toThrow();

    const res = await server.rpc("filesystem.read", {
      path: `/tmp/missing-${i}.txt`
    });

    expect(res.error).toBeDefined();
  }
});
