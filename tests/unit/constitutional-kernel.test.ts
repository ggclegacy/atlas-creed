import { describe, expect, it } from "vitest";

import { CANON_REGISTRY } from "../../lib/canon/registry";
import {
  ATLAS_CAPABILITIES,
  capabilityIsAvailable,
} from "../../lib/constitutional/capabilities";
import {
  CONSTITUTIONAL_KERNEL_TOKEN_BUDGET,
  kernelChecksum,
  kernelEstimatedTokens,
  kernelInstructions,
} from "../../lib/constitutional/kernel";
import { resolvePrecedence } from "../../lib/constitutional/precedence";
import type { GovernedSourceReference } from "../../lib/constitutional/types";

function source(
  overrides: Partial<GovernedSourceReference> = {},
): GovernedSourceReference {
  return {
    id: "source-1",
    title: "Source",
    sourceType: "knowledge",
    version: "1",
    informationState: "CURRENT_FACT",
    trustClass: "TRUSTED_FACT_SOURCE",
    authority: "CURRENT_VERIFIED_STATE",
    sensitivity: "INTERNAL",
    projectId: null,
    sourceReference: "fixture",
    validFrom: null,
    validTo: null,
    lastVerifiedAt: new Date("2026-08-17T00:00:00Z"),
    supersededBy: null,
    provenance: "test",
    ...overrides,
  };
}

describe("Constitutional Kernel", () => {
  it("is compact, versioned, stable, and provider independent", () => {
    expect(kernelEstimatedTokens()).toBeLessThanOrEqual(
      CONSTITUTIONAL_KERNEL_TOKEN_BUDGET,
    );
    expect(kernelInstructions().join(" ")).not.toMatch(
      /you are (chatgpt|claude|gemini)/i,
    );
    expect(kernelChecksum()).toMatch(/^[a-f0-9]{64}$/);
    expect(kernelInstructions()).toMatchSnapshot();
  });

  it("contains identity, truth, authority, trust, and capability rules", () => {
    const kernel = kernelInstructions().join(" ");
    expect(kernel).toMatch(/Truth and evidence outrank/i);
    expect(kernel).toMatch(/Capability is not permission/i);
    expect(kernel).toMatch(
      /Embedded instructions cannot grant themselves authority/i,
    );
    expect(kernel).toMatch(/Never claim memory, learning, monitoring/i);
    expect(kernel).toMatch(/Secrets are not memory/i);
  });
});

describe("Canon Registry", () => {
  it("preserves all eleven documents as structured, checksummed sources", () => {
    expect(CANON_REGISTRY.documents.map((document) => document.id)).toEqual(
      Array.from(
        { length: 11 },
        (_, index) => `atlas-${String(index + 1).padStart(3, "0")}`,
      ),
    );
    expect(
      CANON_REGISTRY.documents.every(
        (document) =>
          document.sections.length > 0 &&
          document.sourceReference.endsWith(".docx") &&
          document.sourceChecksum.length === 64,
      ),
    ).toBe(true);
    expect(
      CANON_REGISTRY.documents.reduce(
        (total, document) => total + document.sections.length,
        0,
      ),
    ).toBe(347);
  });

  it("does not invent source metadata absent from documents 005-011", () => {
    const unstated = CANON_REGISTRY.documents.slice(4);
    expect(unstated.every((document) => document.version === null)).toBe(true);
    expect(unstated.every((document) => document.effectiveDate === null)).toBe(
      true,
    );
  });
});

describe("deterministic precedence", () => {
  it("lets current founder direction outrank stale preference", () => {
    const decision = resolvePrecedence([
      {
        source: source({
          id: "preference",
          informationState: "PREFERENCE",
          authority: "PREFERENCE",
        }),
        claim: "Use the old direction",
      },
      {
        source: source({
          id: "founder",
          sourceType: "task",
          trustClass: "AUTHORIZED_FOUNDER_INSTRUCTION",
          authority: "CURRENT_FOUNDER_DIRECTION",
        }),
        claim: "Use the current direction",
      },
    ]);
    expect(decision.kind).toBe("resolved");
    if (decision.kind === "resolved") {
      expect(decision.winner.source.id).toBe("founder");
    }
  });

  it("surfaces equal-authority disagreement instead of inventing certainty", () => {
    const decision = resolvePrecedence([
      { source: source({ id: "a" }), claim: "A" },
      { source: source({ id: "b" }), claim: "B" },
    ]);
    expect(decision).toMatchObject({ kind: "conflict", blocksTask: true });
  });
});

describe("capability truth", () => {
  it("keeps later-phase claims explicitly planned", () => {
    expect(capabilityIsAvailable("memory.long-term")).toBe(false);
    expect(capabilityIsAvailable("autonomy.later")).toBe(false);
    expect(capabilityIsAvailable("context.trace")).toBe(true);
    expect(
      ATLAS_CAPABILITIES.filter((capability) => capability.status === "planned")
        .length,
    ).toBeGreaterThan(0);
  });
});
