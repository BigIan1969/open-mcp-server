import fs from "fs/promises";
import os from "os";
import path from "path";
import { startServer } from "../_helpers/mcpServer.js";

const ENABLE_BROWSERLESS = process.env.ENABLE_BROWSERLESS === "true";
const maybeTest = ENABLE_BROWSERLESS ? test : test.skip;

const PW_ENDPOINT =
  (process.env.BROWSERLESS_WS || "ws://localhost:12355") +
  "/chromium/playwright";

let server;
let sessionId;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  if (sessionId) {
    await server.rpc("pw.close", { sessionId }).catch(() => {});
  }
  await server.close();
});

maybeTest(
  "user journey: browse → extract → persist → verify",
  async () => {
    // ✅ Step 1: connect
    const conn = await server.rpc("pw.connect", {
      wsEndpoint: PW_ENDPOINT,
    });

    sessionId = conn.sessionId;

    // ✅ Step 2: navigate SAFELY (inside Playwright, not eval)
    await server.rpc("pw.eval", {
      sessionId,
      expression: `
        window.location.href = "https://example.com";
      `,
    });

    // ✅ wait for navigation to complete (important)
    await new Promise((r) => setTimeout(r, 1500));

    // ✅ Step 3: extract title AFTER navigation
    const titleRes = await server.rpc("pw.eval", {
      sessionId,
      expression: "document.title",
    });

    const title = titleRes.value;

    expect(typeof title).toBe("string");
    expect(title.length).toBeGreaterThan(0);

    // ✅ Step 4: persist to filesystem
    const tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "journey-")
    );
    const filePath = path.join(tmpDir, "title.txt");

    await server.rpc("filesystem.write", {
      path: filePath,
      content: title,
    });

    // ✅ Step 5: read back
    const read = await server.rpc("filesystem.read", {
      path: filePath,
    });

    expect(read.content).toBe(title);

    // ✅ Step 6: hash
    const hash = await server.rpc("hash.sha256", {
      text: read.content,
    });

    expect(typeof hash.hash).toBe("string");
    expect(hash.hash.length).toBeGreaterThan(10);

    // ✅ Step 7: final validation
    const finalCheck = await server.rpc("pw.eval", {
      sessionId,
      expression: "document.title",
    });

    expect(finalCheck.value).toBe(title);
  }
);
