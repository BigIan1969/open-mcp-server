import { startServer } from "../_helpers/mcpServer.js";

let server;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  await server.close();
});

test("process.list always returns something", async () => {
  const res = await server.rpc("process.list", {});
  const output = res.output ?? res.stdout ?? res.stderr;

  expect(typeof output).toBe("string");
  expect(output.length).toBeGreaterThan(0);
});