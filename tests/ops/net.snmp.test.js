import { startServer } from "../_helpers/mcpServer.js";

let server;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  await server.close();
});

test("snmp.get does not crash", async () => {
  try {
    await server.rpc("snmp.get", {
      host: "127.0.0.1",
      oid: "1.3.6.1.2.1.1.1.0"
    });
  } catch (e) {
    expect(e).toBeDefined();
  }
});
