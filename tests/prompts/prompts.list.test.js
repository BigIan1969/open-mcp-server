import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("prompts.list returns available prompts", async () => {
  const res = await server.rpc("prompts.list");
  const names = res.prompts.map(p => p.name);

  expect(names).toContain("code_review");
  expect(names).toContain("repo_health_check");
  expect(names).toContain("incident_triage");
  expect(names).toContain("release_summary");
});