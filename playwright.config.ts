import { defineConfig, devices } from "@playwright/test";

/**
 * Phase 1 exercises the public auth entry, protected-route boundary, PWA
 * assets, and realistic desktop/mobile layouts against a production server.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "list" : "html",
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

  webServer: {
    // CI and Vercel verify canonical Turbopack. The local Codex sandbox cannot
    // bind Turbopack's CSS worker port, so local E2E uses the equivalent
    // production webpack compiler without changing the repository build script.
    command: process.env.CI
      ? "pnpm build && pnpm start"
      : "pnpm exec next build --webpack && pnpm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
