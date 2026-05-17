import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("text.template substitutes variables", async () => {
  const res = await server.rpc("text.template", {
    template: "Hello {{name}}",
    vars: { name: "World" }
  });
  expect(res.text).toBe("Hello World");
});