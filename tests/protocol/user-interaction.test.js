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

maybeTest("user journey: navigate → click → verify DOM change", async () => {
  const conn = await server.rpc("pw.connect", {
    wsEndpoint: PW_ENDPOINT,
  });

  sessionId = conn.sessionId;

  // ✅ Load a simple page with a button
  await server.rpc("pw.setContent", {
    sessionId,
    html: `
      <html>
        <body>
          <button id="btn">Click me</button>
          <div id="output"></div>
          <script>
            document.getElementById("btn").onclick = () => {
              document.getElementById("output").textContent = "Clicked!";
            };
          </script>
        </body>
      </html>
    `
  });

  // ✅ Simulate click
  await server.rpc("pw.eval", {
    sessionId,
    expression: `
      document.getElementById("btn").click()
    `
  });

  // ✅ Verify DOM change
  const result = await server.rpc("pw.eval", {
    sessionId,
    expression: `
      document.getElementById("output").textContent
    `
  });

  expect(result.value).toBe("Clicked!");
});