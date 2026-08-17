import { describe, expect, it } from "vitest";

import { parseServerEnv } from "../../lib/env/schema";

/**
 * Configuration must fail loudly at startup, never as `undefined` deep inside a
 * request. Test values are deliberately non-secret and non-routable.
 */

const validServerEnv = {
  DATABASE_URL: "postgresql://atlas:atlas@127.0.0.1:5432/atlas_test",
  DATABASE_ENVIRONMENT: "development",
} as const;

describe("server environment schema", () => {
  it("defaults NODE_ENV when unset", () => {
    expect(parseServerEnv(validServerEnv).NODE_ENV).toBe("development");
  });

  it("accepts valid values", () => {
    const parsed = parseServerEnv({
      ...validServerEnv,
      NODE_ENV: "production",
    });
    expect(parsed.NODE_ENV).toBe("production");
    expect(parsed.DATABASE_ENVIRONMENT).toBe("development");
  });

  it("throws a named, actionable error on an invalid value", () => {
    const invalid = { ...validServerEnv, NODE_ENV: "staging" };
    expect(() => parseServerEnv(invalid)).toThrowError(/NODE_ENV/);
    expect(() => parseServerEnv(invalid)).toThrowError(/\.env\.example/);
  });

  it("names every missing Phase 1 database requirement", () => {
    expect(() => parseServerEnv({})).toThrowError(/DATABASE_URL/);
    expect(() => parseServerEnv({})).toThrowError(/DATABASE_ENVIRONMENT/);
  });

  it("rejects non-Postgres database URLs", () => {
    expect(() =>
      parseServerEnv({
        ...validServerEnv,
        DATABASE_URL: "https://example.com/db",
      }),
    ).toThrowError(/DATABASE_URL/);
  });

  it("ignores unknown variables rather than failing the process", () => {
    expect(() =>
      parseServerEnv({
        ...validServerEnv,
        NODE_ENV: "test",
        SOMETHING_ELSE: "x",
      }),
    ).not.toThrow();
  });
});
