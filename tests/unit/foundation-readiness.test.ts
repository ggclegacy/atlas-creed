import { describe, expect, it } from "vitest";

import { isConstitutionalFoundationReady } from "@/lib/constitutional/foundation-readiness";

const expectations = {
  activeCanonIds: ["atlas-001", "atlas-002"],
  projectKnowledgeCounts: { atlas: 0, "gent-logistics": 2 },
};

describe("constitutional foundation readiness", () => {
  it("requires both active canon and every owner-scoped fixture", () => {
    expect(
      isConstitutionalFoundationReady(
        {
          canon: [
            { canonicalId: "atlas-001", status: "active" },
            { canonicalId: "atlas-002", status: "active" },
          ],
          projects: [
            { slug: "atlas", knowledgeCount: 0 },
            { slug: "gent-logistics", knowledgeCount: 2 },
          ],
        },
        expectations,
      ),
    ).toBe(true);
  });

  it("fails closed when global canon exists but owner knowledge is absent", () => {
    expect(
      isConstitutionalFoundationReady(
        {
          canon: [
            { canonicalId: "atlas-001", status: "active" },
            { canonicalId: "atlas-002", status: "active" },
          ],
          projects: [],
        },
        expectations,
      ),
    ).toBe(false);
  });

  it("does not accept inactive or partially loaded canon", () => {
    expect(
      isConstitutionalFoundationReady(
        {
          canon: [
            { canonicalId: "atlas-001", status: "active" },
            { canonicalId: "atlas-002", status: "superseded" },
          ],
          projects: [
            { slug: "atlas", knowledgeCount: 0 },
            { slug: "gent-logistics", knowledgeCount: 3 },
          ],
        },
        expectations,
      ),
    ).toBe(false);
  });
});
