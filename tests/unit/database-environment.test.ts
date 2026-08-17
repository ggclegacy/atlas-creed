import { describe, expect, it } from "vitest";

import { assertDatabaseEnvironment } from "../../lib/db/environment";

describe("deployment database isolation", () => {
  it.each(["development", "preview", "production"] as const)(
    "accepts a %s deployment paired with the same database scope",
    (environment) => {
      expect(() =>
        assertDatabaseEnvironment({
          databaseEnvironment: environment,
          vercelEnvironment: environment,
        }),
      ).not.toThrow();
    },
  );

  it("fails closed when a preview is labelled as production", () => {
    expect(() =>
      assertDatabaseEnvironment({
        databaseEnvironment: "production",
        vercelEnvironment: "preview",
      }),
    ).toThrowError(/mismatch/i);
  });

  it("allows local use when no Vercel scope exists", () => {
    expect(() =>
      assertDatabaseEnvironment({ databaseEnvironment: "development" }),
    ).not.toThrow();
  });
});
