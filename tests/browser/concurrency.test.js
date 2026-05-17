import { startServer } from "../_helpers/mcpServer.js";

const ENABLE_BROWSERLESS = process.env.ENABLE_BROWSERLESS === "true";
const maybeTest = ENABLE_BROWSERLESS ? test : test.skip;

let server;

beforeAll(() => {
  server = startServer();
});

afterAll(async () => {
  await server.close();
});

// Jest supports concurrent tests natively [2](https://docs.cute.engineer/Jest%20test%20concurrency)
maybeTest("concurrent: multiple sessions don't collide", async () => {
  const results = await Promise.all(
    Array.from({ length: 5 }).map(async () => {
      const res = await server.rpc("ping", {});
      return res;
    })
  );

  // ✅ All results should be valid
  for (const r of results) {
    expect(r).toBe("pong");
  }
});