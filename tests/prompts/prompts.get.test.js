import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("prompts.get returns messages for code_review", async () => {
  const res = await server.rpc("prompts.get", {
    name: "code_review",
    arguments: { path: "server.js" }
  });

  expect(res.messages[0].content.text).toContain("review the code");
});