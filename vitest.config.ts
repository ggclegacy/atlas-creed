import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Phase 0 tests are Node-based: architecture guards and environment validation.
 * No DOM environment is configured because there are no component tests yet —
 * jsdom/happy-dom arrives with the first component that needs it.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "lib/model/**/*.test.ts"],
    // Architecture guards invoke ESLint with full type information. A cold
    // project-service start can exceed Vitest's 5s default on CI or constrained
    // machines even though the assertion itself is deterministic.
    testTimeout: 30_000,
    // Playwright specs live in tests/e2e and are run by `pnpm test:e2e`.
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**"],
    reporters: ["default"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});
