import { describe, expect, it } from "vitest";

import {
  clientEnvSchema,
  parseClientEnv,
  parseServerEnv,
  serverEnvSchema,
} from "../../lib/env/schema";

/**
 * Configuration must fail loudly at startup, never as `undefined` deep inside a
 * request. These tests pin that behaviour before any real variable exists.
 */

describe("server environment schema", () => {
  it("defaults NODE_ENV when unset", () => {
    expect(parseServerEnv({}).NODE_ENV).toBe("development");
  });

  it("accepts valid values", () => {
    expect(parseServerEnv({ NODE_ENV: "production" }).NODE_ENV).toBe(
      "production",
    );
  });

  it("throws a named, actionable error on an invalid value", () => {
    expect(() => parseServerEnv({ NODE_ENV: "staging" })).toThrowError(
      /NODE_ENV/,
    );
    expect(() => parseServerEnv({ NODE_ENV: "staging" })).toThrowError(
      /\.env\.example/,
    );
  });

  it("ignores unknown variables rather than failing the process", () => {
    expect(() =>
      parseServerEnv({ NODE_ENV: "test", SOMETHING_ELSE: "x" }),
    ).not.toThrow();
  });
});

describe("client environment schema", () => {
  it("defaults the app name", () => {
    expect(parseClientEnv({}).NEXT_PUBLIC_APP_NAME).toBe("Atlas Creed");
  });

  it("rejects an empty app name", () => {
    expect(() => parseClientEnv({ NEXT_PUBLIC_APP_NAME: "" })).toThrowError(
      /NEXT_PUBLIC_APP_NAME/,
    );
  });

  it("exposes only NEXT_PUBLIC_ keys — anything else would leak to the browser", () => {
    const keys = Object.keys(clientEnvSchema.shape);
    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      expect(
        key.startsWith("NEXT_PUBLIC_"),
        `${key} must be NEXT_PUBLIC_`,
      ).toBe(true);
    }
  });

  it("keeps server-only keys out of the client schema", () => {
    const serverKeys = Object.keys(serverEnvSchema.shape);
    const clientKeys = Object.keys(clientEnvSchema.shape);
    expect(clientKeys.some((k) => serverKeys.includes(k))).toBe(false);
  });
});
