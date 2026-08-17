import { describe, expect, it } from "vitest";

import { isAllowedOwnerEmail } from "../../lib/auth/owner-policy";

describe("exact owner allowlist", () => {
  it("accepts only the configured mailbox, normalized for email casing", () => {
    expect(
      isAllowedOwnerEmail(" Owner@Example.com ", "owner@example.com"),
    ).toBe(true);
  });

  it.each([
    "other@example.com",
    "owner+alias@example.com",
    "owner@example.org",
    "owner@example.com.attacker.test",
  ])("rejects unauthorized identity %s", (candidate) => {
    expect(isAllowedOwnerEmail(candidate, "owner@example.com")).toBe(false);
  });

  it("rejects absent identities", () => {
    expect(isAllowedOwnerEmail(undefined, "owner@example.com")).toBe(false);
    expect(isAllowedOwnerEmail(null, "owner@example.com")).toBe(false);
  });
});
