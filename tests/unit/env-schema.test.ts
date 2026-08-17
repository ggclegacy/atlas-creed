import { describe, expect, it } from "vitest";

import { parseServerEnv } from "../../lib/env/schema";

/**
 * Configuration must fail loudly at startup, never as `undefined` deep inside a
 * request. Test values are deliberately non-secret and non-routable.
 */

const validServerEnv = {
  DATABASE_URL: "postgresql://atlas:atlas@127.0.0.1:5432/atlas_test",
  DATABASE_ENVIRONMENT: "development",
  AUTH_SECRET: "test-only-secret-that-is-at-least-32-characters",
  AUTH_RESEND_KEY: "re_test_only",
  AUTH_EMAIL_FROM: "Atlas <atlas@example.com>",
  OWNER_EMAIL: "owner@example.com",
  OPENAI_API_KEY: "sk-test-only-not-a-real-key",
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

  it("names every missing runtime requirement", () => {
    expect(() => parseServerEnv({})).toThrowError(/DATABASE_URL/);
    expect(() => parseServerEnv({})).toThrowError(/DATABASE_ENVIRONMENT/);
  });

  it("applies approved model and spend defaults", () => {
    const parsed = parseServerEnv(validServerEnv);
    expect(parsed.ATLAS_CONVERSATION_MODEL).toBe("gpt-5.6-sol");
    expect(parsed.ATLAS_BACKGROUND_MODEL).toBe("gpt-5.6-terra");
    expect(parsed.ATLAS_DAILY_SOFT_LIMIT_USD).toBe(10);
    expect(parsed.ATLAS_MONTHLY_HARD_LIMIT_USD).toBe(150);
  });

  it("rejects a monthly ceiling below the daily warning", () => {
    expect(() =>
      parseServerEnv({
        ...validServerEnv,
        ATLAS_DAILY_SOFT_LIMIT_USD: "20",
        ATLAS_MONTHLY_HARD_LIMIT_USD: "10",
      }),
    ).toThrowError(/Monthly hard limit/);
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
