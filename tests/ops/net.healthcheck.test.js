import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";
import http from "http";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("net.healthcheck returns 200 for local server", async () => {
  const srv = http.createServer((_, res) => {
    res.statusCode = 200; res.end("ok");
  });
  await new Promise(r => srv.listen(0, r));
  const { port } = srv.address();
  const res = await server.rpc("net.healthcheck", { url: `http://127.0.0.1:${port}` });
  srv.close();
  expect(res.status).toBe(200);
});