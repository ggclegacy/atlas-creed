import { defineConfig, devices } from "@playwright/test";

/**
 * Phase 0 establishes the E2E harness and proves it runs against a real build.
 * It deliberately contains ONE smoke test — Build Plan Phase 0 says not to
 * manufacture E2E coverage for features that do not exist yet.
 *
 * Real flows (sign-in, streaming, interrupt) arrive in Phases 1–2.
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
    // Mobile is the primary target (Build Plan §16). Added in Phase 1 once
    // there is a real interface to exercise.
  ],

  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
