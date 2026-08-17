import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ESLint } from "eslint";

/**
 * Shared helpers for the architecture guard tests.
 *
 * `ESLint#calculateConfigForFile` is typed as returning `any`, which would
 * spread untyped values through the assertions. Narrowing it here keeps the
 * tests type-safe under `no-unsafe-*` instead of suppressing those rules.
 */

export const ROOT = path.resolve(
  fileURLToPath(new URL("../../", import.meta.url)),
);

/** The shape of a resolved flat-config entry we actually assert against. */
interface ResolvedConfig {
  rules?: Record<string, readonly unknown[] | undefined>;
}

/**
 * Returns the resolved rule entry for `ruleId` as ESLint would apply it to
 * `relativePath`, or `undefined` when the rule is not configured there.
 *
 * The file does not need to exist — config resolution is path-based.
 */
export async function resolveRule(
  relativePath: string,
  ruleId: string,
): Promise<readonly unknown[] | undefined> {
  const eslint = new ESLint({ cwd: ROOT });
  const config = (await eslint.calculateConfigForFile(
    path.join(ROOT, relativePath),
  )) as ResolvedConfig;
  return config.rules?.[ruleId];
}

/** Writes a real file for project-service linting, then removes it. */
export async function lintCodeAs(relativePath: string, code: string) {
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

/**
 * True when a resolved rule entry means "not enforced here".
 *
 * ESLint normalizes severity to its numeric form in a resolved config, so both
 * spellings are accepted rather than assuming either one.
 */
export function isDisabled(entry: readonly unknown[] | undefined): boolean {
  if (entry === undefined) return true;
  const severity = entry[0];
  return severity === "off" || severity === 0;
}

/** True when a resolved rule entry is enforced at error severity. */
export function isError(entry: readonly unknown[] | undefined): boolean {
  if (entry === undefined) return false;
  const severity = entry[0];
  return severity === "error" || severity === 2;
}
