import { defineConfig, devices } from "@playwright/test";

/**
 * Phase 2 exercises authenticated, database-backed streaming against a local
 * deterministic Responses API fixture. CI never performs a paid model call.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "list" : "html",
  expect: { timeout: 20_000 },
  // Spread rather than assigning `undefined`: `exactOptionalPropertyTypes`
  // treats an explicit undefined as a distinct (and invalid) value.
  ...(process.env.CI ? { workers: 1 } : {}),

  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
  ],

  webServer: [
    {
      command: "node tests/e2e/openai-stub.mjs",
      url: "http://127.0.0.1:4010/health",
      reuseExistingServer: !process.env.CI,
      timeout: 30_000,
    },
    {
      // CI and Vercel verify canonical Turbopack. The local Codex sandbox cannot
      // bind Turbopack's CSS worker port, so local E2E uses production webpack.
      command: process.env.CI
        ? "pnpm build && pnpm start"
        : "pnpm exec next build --webpack && pnpm start",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
