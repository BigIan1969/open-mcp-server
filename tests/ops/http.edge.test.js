import { startServer } from "../_helpers/mcpServer.js";

let server;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  await server.close();
});

test("http.get invalid URL returns error", async () => {
  const res = await server.rpc("http.get", {
    url: "http://invalid.invalid-domain"
  });

  expect(res.status !== 200).toBeTruthy();
});
