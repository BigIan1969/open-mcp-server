import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";

let server;
beforeAll(() => {
  process.env.MCP_ENV = "prod";
  server = startServer({ MCP_ENV: "prod" });
});
afterAll(() => server.stop());

test("shell.run is denied in prod", async () => {
  await expect(
    server.rpc("shell.run", { command: "echo nope" })
  ).rejects.toThrow();
});

