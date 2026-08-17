import "server-only";

import { createHash } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { estimateTextTokensConservatively } from "@/lib/context/assemble";
import { getDatabase } from "@/lib/db/client";
import {
  canonDocuments,
  canonSections,
  constitutionalAmendments,
} from "@/lib/db/schema";

const sectionSchema = z.object({
  id: z.string().min(1).max(120),
  ordinal: z.number().int().nonnegative(),
  title: z.string().trim().min(1).max(300),
  text: z.string().trim().min(1).max(100_000),
});

const proposalSchema = z.object({
  oldDocumentId: z.uuid(),
  proposedTitle: z.string().trim().min(1).max(300),
  proposedVersion: z.string().trim().min(1).max(40),
  sections: z.array(sectionSchema).min(1).max(200),
  rationale: z.string().trim().min(1).max(20_000),
  diff: z.string().trim().min(1).max(100_000),
  impactAnalysis: z.string().trim().min(1).max(40_000),
  effectiveDate: z.iso.date(),
});

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function amendmentApprovalPhrase(amendmentId: string): string {
  return `APPROVE ATLAS AMENDMENT ${amendmentId}`;
}

export function amendmentActivationPhrase(amendmentId: string): string {
  return `ACTIVATE ATLAS AMENDMENT ${amendmentId}`;
}

/** Drafts a protected proposal; it does not approve, activate, or retire canon. */
export async function proposeConstitutionalAmendment(
  ownerId: string,
  rawInput: z.input<typeof proposalSchema>,
): Promise<string> {
  const input = proposalSchema.parse(rawInput);
  const db = getDatabase();
  const [oldDocument] = await db
    .select({ id: canonDocuments.id, status: canonDocuments.status })
    .from(canonDocuments)
    .where(eq(canonDocuments.id, input.oldDocumentId))
    .limit(1);
  if (!oldDocument || oldDocument.status !== "active") {
    throw new Error("Amendments must target an active canonical document.");
  }
  const proposedSections = input.sections.map((section) => ({
    ...section,
    checksum: sha256(`${section.title}\n${section.text}`),
  }));
  const proposedNormalizedText = proposedSections
    .map((section) => `${section.title}\n${section.text}`)
    .join("\n\n");
  const [proposal] = await db
    .insert(constitutionalAmendments)
    .values({
      ownerId,
      oldDocumentId: input.oldDocumentId,
      proposedTitle: input.proposedTitle,
      proposedVersion: input.proposedVersion,
      proposedNormalizedText,
      proposedSections,
      rationale: input.rationale,
      diff: input.diff,
      impactAnalysis: input.impactAnalysis,
      effectiveDate: input.effectiveDate,
      status: "proposed",
    })
    .returning({ id: constitutionalAmendments.id });
  if (!proposal) throw new Error("Amendment proposal creation failed.");
  return proposal.id;
}

export async function approveConstitutionalAmendment(input: {
  readonly ownerId: string;
  readonly amendmentId: string;
  readonly confirmation: string;
}): Promise<void> {
  const amendmentId = z.uuid().parse(input.amendmentId);
  const expected = amendmentApprovalPhrase(amendmentId);
  if (input.confirmation !== expected) {
    throw new Error("The exact amendment approval phrase is required.");
  }
  const [approved] = await getDatabase()
    .update(constitutionalAmendments)
    .set({
      status: "approved",
      approvalPhraseHash: sha256(expected),
      approvedByOwnerId: input.ownerId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(constitutionalAmendments.id, amendmentId),
        eq(constitutionalAmendments.ownerId, input.ownerId),
        eq(constitutionalAmendments.status, "proposed"),
      ),
    )
    .returning({ id: constitutionalAmendments.id });
  if (!approved) {
    throw new Error("The amendment is unavailable or no longer proposed.");
  }
}

export async function activateConstitutionalAmendment(input: {
  readonly ownerId: string;
  readonly amendmentId: string;
  readonly confirmation: string;
  readonly evaluationEvidence: string;
}): Promise<string> {
  const amendmentId = z.uuid().parse(input.amendmentId);
  const evidence = z
    .string()
    .trim()
    .min(8)
    .max(2_000)
    .parse(input.evaluationEvidence);
  if (input.confirmation !== amendmentActivationPhrase(amendmentId)) {
    throw new Error("The exact amendment activation phrase is required.");
  }
  return getDatabase().transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${amendmentId}))`,
    );
    const [amendment] = await tx
      .select()
      .from(constitutionalAmendments)
      .where(
        and(
          eq(constitutionalAmendments.id, amendmentId),
          eq(constitutionalAmendments.ownerId, input.ownerId),
        ),
      )
      .limit(1);
    if (
      !amendment ||
      amendment.status !== "approved" ||
      !amendment.approvedAt
    ) {
      throw new Error(
        "Only an explicitly approved amendment can be activated.",
      );
    }
    const [oldDocument] = await tx
      .select()
      .from(canonDocuments)
      .where(eq(canonDocuments.id, amendment.oldDocumentId))
      .limit(1);
    if (!oldDocument || oldDocument.status !== "active") {
      throw new Error("The amendment target is no longer the active version.");
    }
    const normalizedChecksum = sha256(amendment.proposedNormalizedText);
    const [created] = await tx
      .insert(canonDocuments)
      .values({
        canonicalId: oldDocument.canonicalId,
        title: amendment.proposedTitle,
        version: amendment.proposedVersion,
        status: "active",
        effectiveDate: amendment.effectiveDate,
        authority: oldDocument.authority,
        source: "protected_amendment",
        sourceReference: `amendment:${amendment.id}`,
        sourceChecksum: normalizedChecksum,
        normalizedChecksum,
        sensitivity: oldDocument.sensitivity,
        provenance: `Founder-approved constitutional amendment ${amendment.id}; prior document ${oldDocument.id}.`,
        ingestedAt: new Date(),
        supersedesCanonicalId: `${oldDocument.canonicalId}@${oldDocument.version ?? oldDocument.normalizedChecksum}`,
      })
      .returning({ id: canonDocuments.id });
    if (!created) throw new Error("Amended canon version creation failed.");
    await tx.insert(canonSections).values(
      amendment.proposedSections.map((section) => ({
        documentId: created.id,
        canonicalSectionId: section.id,
        ordinal: section.ordinal,
        title: section.title,
        normalizedText: section.text,
        checksum: section.checksum,
        informationState: "CANONICAL",
        trustClass: "SYSTEM_CONSTITUTIONAL_INSTRUCTION",
        authorityClass: "PROTECTED_CONSTITUTION",
        sensitivity: oldDocument.sensitivity,
        tokenEstimate: estimateTextTokensConservatively(
          `${section.title}\n${section.text}`,
        ),
      })),
    );
    await tx
      .update(canonDocuments)
      .set({
        status: "retired",
        supersededByCanonicalId: `${oldDocument.canonicalId}@${amendment.proposedVersion}`,
      })
      .where(eq(canonDocuments.id, oldDocument.id));
    await tx
      .update(constitutionalAmendments)
      .set({
        status: "activated",
        activatedDocumentId: created.id,
        evaluationEvidence: evidence,
        updatedAt: new Date(),
      })
      .where(eq(constitutionalAmendments.id, amendment.id));
    return created.id;
  });
}
