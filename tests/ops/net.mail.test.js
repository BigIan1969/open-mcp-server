import { startServer } from "../_helpers/mcpServer.js";

let server;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  await server.close();
});

test("smtp.send handles failure safely", async () => {
  await expect(
    server.rpc("smtp.send", {
      host: "127.0.0.1",
      port: 1025,
      user: "x",
      pass: "x",
      to: "x@test.com",
      subject: "a",
      text: "b"
    })
  ).rejects.toThrow();
});

test("imap.list handles failure safely", async () => {
  await expect(
    server.rpc("imap.list", {
      host: "127.0.0.1",
      port: 993,
      user: "x",
      pass: "x"
    })
  ).rejects.toThrow();
});

