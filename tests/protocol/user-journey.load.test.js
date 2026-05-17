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

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  await server.close();
});

// ✅ Helper: one full user journey
async function runJourney(instanceId) {
  const conn = await server.rpc("pw.connect", {
    wsEndpoint: PW_ENDPOINT,
  });

  const sessionId = conn.sessionId;

  try {
    // ✅ Navigate
    await server.rpc("pw.eval", {
      sessionId,
      expression: `
        window.location.href = "https://example.com";
      `,
    });

    // ✅ wait for navigation (important)
    await new Promise((r) => setTimeout(r, 1200));

    // ✅ Extract title
    const titleRes = await server.rpc("pw.eval", {
      sessionId,
      expression: "document.title",
    });

    const title = titleRes.value;

    if (typeof title !== "string" || title.length === 0) {
      throw new Error(`Invalid title in instance ${instanceId}`);
    }

    // ✅ Persist
    const tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), `load-${instanceId}-`)
    );

    const filePath = path.join(tmpDir, "title.txt");

    await server.rpc("filesystem.write", {
      path: filePath,
      content: title,
    });

    // ✅ Read
    const read = await server.rpc("filesystem.read", {
      path: filePath,
    });

    if (read.content !== title) {
      throw new Error(`Mismatch in instance ${instanceId}`);
    }

    // ✅ Hash
    const hash = await server.rpc("hash.sha256", {
      text: read.content,
    });

    if (!hash.hash || hash.hash.length < 10) {
      throw new Error(`Invalid hash in instance ${instanceId}`);
    }

    return true;
  } finally {
    // ✅ Always cleanup session
    await server.rpc("pw.close", { sessionId }).catch(() => {});
  }
}

maybeTest(
  "load: multiple concurrent user journeys remain stable",
  async () => {
    const CONCURRENCY = 5; // ✅ safe default (increase later)

    const results = await Promise.all(
      Array.from({ length: CONCURRENCY }).map((_, i) =>
        runJourney(i)
      )
    );

    // ✅ All journeys should succeed
    results.forEach((r) => {
      expect(r).toBe(true);
    });
  }
);