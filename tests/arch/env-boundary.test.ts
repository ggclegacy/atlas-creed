import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import architecture from "../../architecture.json";
import { ROOT, isDisabled, isError, resolveRule } from "./eslint-config-helper";

/**
 * Proves the secret / environment boundary (Build Plan §14).
 *
 * The failure this prevents is quiet and permanent: a secret given the
 * NEXT_PUBLIC_ prefix is inlined into the browser bundle at build time and is
 * then public to anyone who opens devtools — with no error, no warning, and no
 * way to un-publish it.
 */

const SECRET_NAME = new RegExp(architecture.secretNamePattern, "i");

async function collectSourceFiles(dir: string): Promise<string[]> {
  const skip = new Set([
    "node_modules",
    ".next",
    ".git",
    "out",
    "build",
    "coverage",
    "test-results",
    "playwright-report",
  ]);
  const found: string[] = [];

  async function walk(current: string) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (skip.has(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
        found.push(full);
      }
    }
  }

  await walk(dir);
  return found;
}

describe("secrets must never be client-exposed", () => {
  it("no NEXT_PUBLIC_ variable in .env.example has a secret-like name", async () => {
    const contents = await readFile(path.join(ROOT, ".env.example"), "utf8");

    const offenders = contents
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split("=")[0]?.trim() ?? "")
      .filter((key) => key.startsWith("NEXT_PUBLIC_"))
      .filter((key) => SECRET_NAME.test(key));

    expect(
      offenders,
      "NEXT_PUBLIC_ variables are inlined into the client bundle and are public forever",
    ).toEqual([]);
  });

  it("no source file reads a secret-like NEXT_PUBLIC_ variable", async () => {
    const files = await collectSourceFiles(ROOT);
    const offenders: string[] = [];

    for (const file of files) {
      const source = await readFile(file, "utf8");
      // Skip this test's own pattern definition and assertions.
      if (file.endsWith("env-boundary.test.ts")) continue;

      for (const match of source.matchAll(
        /process\.env\.(NEXT_PUBLIC_[A-Z0-9_]+)/g,
      )) {
        const name = match[1];
        if (name && SECRET_NAME.test(name)) {
          offenders.push(`${path.relative(ROOT, file)}: ${name}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("every env file except .env.example is gitignored", async () => {
    const gitignore = await readFile(path.join(ROOT, ".gitignore"), "utf8");
    expect(gitignore).toMatch(/^\.env$/m);
    expect(gitignore).toMatch(/^\.env\.\*$/m);
    expect(gitignore).toMatch(/^!\.env\.example$/m);
  });

  it("no real .env file is present in the working tree", async () => {
    const entries = await readdir(ROOT);
    const leaked = entries.filter(
      (name) => name.startsWith(".env") && name !== ".env.example",
    );
    expect(
      leaked,
      "a real env file exists in the repository root — verify it is not committed",
    ).toEqual([]);
  });
});

describe("environment access boundary", () => {
  const RULE = "no-restricted-syntax";

  it("restricts direct process.env access outside lib/env/", async () => {
    const entry = await resolveRule("app/some-feature.ts", RULE);

    expect(
      isError(entry),
      "no-restricted-syntax must guard process.env at error severity",
    ).toBe(true);
  });

  it("permits process.env inside lib/env/", async () => {
    const entry = await resolveRule("lib/env/server.ts", RULE);

    expect(
      isDisabled(entry),
      "lib/env/ is the designated configuration boundary",
    ).toBe(true);
  });
});
