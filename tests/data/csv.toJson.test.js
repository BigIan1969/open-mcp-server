import { test, expect, beforeAll, afterAll } from "@jest/globals";
import { startServer } from "../_helpers/mcpServer.js";

let server;
beforeAll(() => { server = startServer(); });
afterAll(() => server.stop());

test("csv.toJson converts CSV", async () => {
  const res = await server.rpc("csv.toJson", {
    text: "a,b\n1,2"
  });
  expect(res.value[0].a).toBe("1");
});
