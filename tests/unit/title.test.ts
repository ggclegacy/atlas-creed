import { describe, expect, it } from "vitest";

import {
  deterministicTitle,
  sanitizeGeneratedTitle,
} from "../../lib/conversation/title";

describe("conversation titles", () => {
  it("creates an immediate bounded fallback", () => {
    expect(deterministicTitle("  **Build**   the launch plan  ")).toBe(
      "Build the launch plan",
    );
    expect(deterministicTitle("x ".repeat(100)).length).toBeLessThanOrEqual(73);
    expect(deterministicTitle("   ")).toBe("Untitled conversation");
  });

  it("sanitizes structured model titles", () => {
    expect(sanitizeGeneratedTitle('"Atlas Launch Decisions"')).toBe(
      "Atlas Launch Decisions",
    );
    expect(sanitizeGeneratedTitle("x".repeat(73))).toBeNull();
  });
});
