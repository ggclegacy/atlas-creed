import { describe, expect, it } from "vitest";

import { isAllowedOwnerEmail } from "../../lib/auth/owner-policy";

describe("single-owner policy", () => {
  it("allows only the exact normalized owner email", () => {
    expect(isAllowedOwnerEmail("Neil@Example.com", "neil@example.com")).toBe(
      true,
    );
    expect(isAllowedOwnerEmail("other@example.com", "neil@example.com")).toBe(
      false,
    );
    expect(isAllowedOwnerEmail(undefined, "neil@example.com")).toBe(false);
  });
});
