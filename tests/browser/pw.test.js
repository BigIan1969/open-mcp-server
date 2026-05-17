import { startServer } from "../_helpers/mcpServer.js";
import fs from "fs/promises";
import path from "path";
import os from "os";

const ENABLE_BROWSERLESS = process.env.ENABLE_BROWSERLESS === "true";
const maybeTest = ENABLE_BROWSERLESS ? test : test.skip;

const BROWSERLESS_WS = process.env.BROWSERLESS_WS || "ws://127.0.0.1:12355";
const PW_ENDPOINT = `${BROWSERLESS_WS}/chromium/playwright`;

let server;
let sessionId;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  if (sessionId) {
    await server.rpc("pw.close", { sessionId }).catch(() => {});
    sessionId = null;
  }
  await server.close();
});

beforeEach(async () => {
  const res = await server.rpc("pw.connect", { wsEndpoint: PW_ENDPOINT });
  sessionId = res.sessionId;
});

afterEach(async () => {
  if (sessionId) {
    await server.rpc("pw.close", { sessionId }).catch(() => {});
    sessionId = null;
  }
});

maybeTest("pw: connect and basic interaction", async () => {
  await server.rpc("pw.setContent", {
    sessionId,
    html: "<html><head><title>Hello</title></head><body>Test</body></html>"
  });

  // ✅ evaluate the value, not a function
  const evalRes = await server.rpc("pw.eval", {
    sessionId,
    expression: "document.title"
  });

  expect(evalRes.value).toBe("Hello");
});

maybeTest("pw: screenshot file is created", async () => {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), "pw-test-"));
  const file = path.join(tmp, "shot.png");

  const res = await server.rpc("pw.screenshot", { sessionId, path: file });
  expect(res.status).toBe("ok");

  const stat = await fs.stat(file);
  expect(stat.size).toBeGreaterThan(0);
});