import { z } from "zod";

import registryJson from "@/data/canon/registry.json";
import { SECURITY_CLASSIFICATIONS } from "@/lib/constitutional/types";

const sectionSchema = z.object({
  id: z.string().regex(/^atlas-\d{3}-s\d{2}$/),
  ordinal: z.number().int().nonnegative(),
  title: z.string().min(1),
  text: z.string().min(1),
  checksum: z.string().regex(/^[a-f0-9]{64}$/),
});

const documentSchema = z.object({
  id: z.string().regex(/^atlas-\d{3}$/),
  title: z.string().min(1),
  version: z.string().nullable(),
  status: z.enum(["active", "draft", "retired"]),
  effectiveDate: z.iso.date().nullable(),
  authority: z.string().min(1),
  source: z.literal("private_original_docx"),
  sourceReference: z.string().endsWith(".docx"),
  sourceChecksum: z.string().regex(/^[a-f0-9]{64}$/),
  normalizedChecksum: z.string().regex(/^[a-f0-9]{64}$/),
  sensitivity: z.enum(SECURITY_CLASSIFICATIONS),
  provenance: z.string().min(1),
  ingestedAt: z.iso.datetime(),
  supersedes: z.array(z.string()),
  supersededBy: z.string().nullable(),
  amendments: z.array(z.unknown()),
  statedClassification: z.string().nullable(),
  sections: z.array(sectionSchema).min(1),
});

const registrySchema = z.object({
  schemaVersion: z.literal(1),
  registryId: z.literal("atlas-foundational-canon"),
  documents: z.array(documentSchema).length(11),
});

export const CANON_REGISTRY = registrySchema.parse(registryJson);

export type CanonDocument = (typeof CANON_REGISTRY.documents)[number];
export type CanonSection = CanonDocument["sections"][number];

export function activeCanonDocuments(): readonly CanonDocument[] {
  return CANON_REGISTRY.documents.filter(
    (document) => document.status === "active",
  );
}

export function canonDocument(documentId: string): CanonDocument | null {
  return (
    CANON_REGISTRY.documents.find((document) => document.id === documentId) ??
    null
  );
}
