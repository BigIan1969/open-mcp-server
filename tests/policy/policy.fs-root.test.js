import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("filesystem.read outside root is denied", async () => {
  await expect(
    server.rpc("filesystem.read", { path: "/etc/passwd" })
  ).rejects.toThrow();
});