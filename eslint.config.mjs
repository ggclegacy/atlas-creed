import js from "@eslint/js";
import tseslint from "typescript-eslint";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

import architecture from "./architecture.json" with { type: "json" };

export default tseslint.config(
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "coverage/**",
      "test-results/**",
      "playwright-report/**",
      "next-env.d.ts",
      // Transient files written by the architecture guard tests.
      "tests/arch/__probe__/**",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...nextCoreWebVitals,

  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ───────────────────────────────────────────────────────────────────
  // ARCHITECTURE GUARD 1 — model provider boundary (Build Plan §7)
  // Proved by tests/arch/model-boundary.test.ts
  // ───────────────────────────────────────────────────────────────────
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: architecture.providerSdkPatterns,
              message: architecture.providerSdkMessage,
            },
          ],
        },
      ],
    },
  },
  {
    files: architecture.modelBoundaryAllowlist,
    rules: { "no-restricted-imports": "off" },
  },

  // ───────────────────────────────────────────────────────────────────
  // ARCHITECTURE GUARD 2 — validated environment access (Build Plan §14)
  // Proved by tests/arch/env-boundary.test.ts
  // ───────────────────────────────────────────────────────────────────
  {
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: architecture.processEnvSelector,
          message: architecture.processEnvMessage,
        },
      ],
    },
  },
  {
    files: architecture.envBoundaryAllowlist,
    rules: { "no-restricted-syntax": "off" },
  },

  // ───────────────────────────────────────────────────────────────────
  // General correctness
  // ───────────────────────────────────────────────────────────────────
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // MUST BE LAST. Plain JS/MJS files are not part of the typed program, so
  // every type-aware rule is switched off for them. Flat config is
  // last-match-wins: placing this earlier lets a later block silently
  // re-enable a typed rule on a file that has no type information.
  {
    files: ["**/*.{js,mjs,cjs}"],
    ...tseslint.configs.disableTypeChecked,
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      // `consistent-type-imports` is NOT in disableTypeChecked's list, but it
      // does require parser services — so it must be switched off by hand or
      // linting any .mjs file throws.
      "@typescript-eslint/consistent-type-imports": "off",
    },
  },
);
