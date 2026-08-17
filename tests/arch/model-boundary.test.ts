import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { ESLint } from "eslint";
import { afterAll, describe, expect, it } from "vitest";

import architecture from "../../architecture.json";
import { ROOT, isDisabled, isError, resolveRule } from "./eslint-config-helper";

/**
 * Proves the model provider boundary is REAL, not aspirational.
 *
 * Build Plan §7 / Bible §22. These tests run ESLint against the project's
 * actual configuration, so they fail if someone weakens or deletes the rule —
 * the guard cannot be quietly removed.
 *
 * Two levels of proof:
 *   1. Config geometry  — the rule is ON outside lib/model/ and OFF inside it.
 *   2. Real behaviour   — an actual provider import is genuinely rejected.
 *      Geometry alone would pass even if the glob failed to match the SDK.
 */

const PROBE_DIR = path.join(ROOT, "tests/arch/__probe__");

const RULE = "no-restricted-imports";
const PROVIDER_IMPORT = `import Anthropic from "@anthropic-ai/sdk";\nexport const client = Anthropic;\n`;

/** Writes a real file (type-aware linting needs one), lints it, cleans up. */
async function lintAs(relativePath: string, code: string) {
  const absolute = path.join(ROOT, relativePath);
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, code, "utf8");
  try {
    const eslint = new ESLint({ cwd: ROOT, ignore: false });
    const [result] = await eslint.lintFiles([absolute]);
    return result;
  } finally {
    await rm(absolute, { force: true });
  }
}

afterAll(async () => {
  await rm(PROBE_DIR, { recursive: true, force: true });
});

describe("model provider boundary — configuration", () => {
  it("restricts provider imports outside lib/model/", async () => {
    const entry = await resolveRule("app/some-feature.ts", RULE);

    expect(
      isError(entry),
      `${RULE} must be enforced at error severity outside lib/model/`,
    ).toBe(true);
  });

  it("permits provider imports inside lib/model/", async () => {
    const entry = await resolveRule("lib/model/anthropic.ts", RULE);

    expect(
      isDisabled(entry),
      "lib/model/ must be allowed to import provider SDKs",
    ).toBe(true);
  });

  it("covers every provider SDK the architecture declares", () => {
    expect(architecture.providerSdkPatterns.length).toBeGreaterThan(0);
    expect(architecture.providerSdkPatterns).toContain("@anthropic-ai/*");
    expect(architecture.modelBoundaryAllowlist).toEqual(["lib/model/**"]);
  });
});

describe("model provider boundary — enforcement", () => {
  it("REJECTS a real provider import from app/", async () => {
    const result = await lintAs(
      "tests/arch/__probe__/app-probe.ts",
      PROVIDER_IMPORT,
    );

    const violations = result?.messages.filter((m) => m.ruleId === RULE) ?? [];
    expect(
      violations.length,
      "importing @anthropic-ai/sdk outside lib/model/ must be an ESLint error",
    ).toBeGreaterThan(0);
    expect(violations[0]?.severity).toBe(2);
    expect(violations[0]?.message).toContain("lib/model");
  });

  it("ALLOWS the same import inside lib/model/", async () => {
    const result = await lintAs(
      "lib/model/__probe__/adapter-probe.ts",
      PROVIDER_IMPORT,
    );

    const violations = result?.messages.filter((m) => m.ruleId === RULE) ?? [];
    expect(
      violations,
      "lib/model/ is the designated adapter boundary and must permit the import",
    ).toEqual([]);

    await rm(path.join(ROOT, "lib/model/__probe__"), {
      recursive: true,
      force: true,
    });
  });
});
