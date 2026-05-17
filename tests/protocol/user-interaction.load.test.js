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

// ✅ One full interactive journey
async function runInteractiveJourney(id) {
  const conn = await server.rpc("pw.connect", {
    wsEndpoint: PW_ENDPOINT,
  });

  const sessionId = conn.sessionId;

  try {
    // ✅ Step 1: Load dynamic page
    await server.rpc("pw.setContent", {
      sessionId,
      html: `
        <html>
          <body>
            <div id="count">0</div>
            <button id="inc">Increment</button>
            <button id="done">Finish</button>

            <script>
              let count = 0;
              document.getElementById("inc").onclick = () => {
                count++;
                document.getElementById("count").textContent = count;
              };

              document.getElementById("done").onclick = () => {
                document.body.setAttribute("data-final", count);
              };
            </script>
          </body>
        </html>
      `
    });

    // ✅ Step 2: Simulate clicks (multi-step interaction)
    for (let i = 0; i < 3; i++) {
      await server.rpc("pw.eval", {
        sessionId,
        expression: `document.getElementById("inc").click()`
      });
    }

    // ✅ Step 3: Finish flow
    await server.rpc("pw.eval", {
      sessionId,
      expression: `document.getElementById("done").click()`
    });

    // ✅ Step 4: Verify final state
    const final = await server.rpc("pw.eval", {
      sessionId,
      expression: `
        ({
          count: document.getElementById("count").textContent,
          final: document.body.getAttribute("data-final")
        })
      `
    });

    if (final.value.count !== "3" || final.value.final !== "3") {
      throw new Error(`State mismatch in user ${id}`);
    }

    // ✅ Step 5: Persist state
    const tmpDir = await fs.mkdtemp(
      path.join(os.tmpdir(), `flow-${id}-`)
    );
    const filePath = path.join(tmpDir, "state.json");

    await server.rpc("filesystem.write", {
      path: filePath,
      content: JSON.stringify(final.value),
    });

    // ✅ Step 6: Read back
    const read = await server.rpc("filesystem.read", {
      path: filePath,
    });

    const parsed = JSON.parse(read.content);

    if (parsed.count !== "3") {
      throw new Error(`File mismatch in user ${id}`);
    }

    // ✅ Step 7: Hash
    const hash = await server.rpc("hash.sha256", {
      text: read.content,
    });

    if (!hash.hash || hash.hash.length < 10) {
      throw new Error(`Invalid hash in user ${id}`);
    }

    return true;
  } finally {
    await server.rpc("pw.close", { sessionId }).catch(() => {});
  }
}

maybeTest(
  "load: multi-step interactive user journeys under concurrency",
  async () => {
    const CONCURRENCY = 5;
    const DELAY_MS = 200;

    const results = [];

    for (let i = 0; i < CONCURRENCY; i++) {
      // ✅ stagger connections
      await new Promise((r) => setTimeout(r, DELAY_MS));

      results.push(runInteractiveJourney(i));
    }

    const resolved = await Promise.all(results);

    resolved.forEach((r) => {
      expect(r).toBe(true);
    });
  }
);