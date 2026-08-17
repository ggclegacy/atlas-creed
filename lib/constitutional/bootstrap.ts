import "server-only";

import { and, eq } from "drizzle-orm";
import { z } from "zod";

import fixturesJson from "@/data/knowledge/f1-fixtures.json";
import { CANON_REGISTRY } from "@/lib/canon/registry";
import {
  INFORMATION_STATES,
  SECURITY_CLASSIFICATIONS,
} from "@/lib/constitutional/types";
import { estimateTextTokensConservatively } from "@/lib/context/assemble";
import { getDatabase } from "@/lib/db/client";
import {
  canonDocuments,
  canonSections,
  conflictRecords,
  knowledgeRecords,
  projects,
} from "@/lib/db/schema";

const fixturesSchema = z.object({
  schemaVersion: z.literal(1),
  sources: z.array(
    z.object({
      projectSlug: z.string(),
      sourceReference: z.string(),
      sourceChecksum: z.string().regex(/^[a-f0-9]{64}$/),
    }),
  ),
  projects: z.array(
    z.object({
      slug: z.string(),
      name: z.string(),
      description: z.string(),
    }),
  ),
  records: z.array(
    z.object({
      projectSlug: z.string(),
      key: z.string(),
      title: z.string(),
      content: z.string(),
      informationState: z.enum(INFORMATION_STATES),
      authorityClass: z.enum([
        "VALIDATED_KNOWLEDGE",
        "EXPLICIT_DECISION",
        "INFERENCE",
      ]),
      confidence: z.number().int().min(0).max(100),
      lastVerifiedAt: z.iso.datetime(),
    }),
  ),
});

const fixtures = fixturesSchema.parse(fixturesJson);

export interface BootstrapResult {
  readonly documentsCreated: number;
  readonly sectionsCreated: number;
  readonly projectsCreated: number;
  readonly knowledgeCreated: number;
  readonly conflictsCreated: number;
}

export async function bootstrapConstitutionalFoundation(
  ownerId: string,
): Promise<BootstrapResult> {
  return getDatabase().transaction(async (tx) => {
    let documentsCreated = 0;
    let sectionsCreated = 0;
    for (const document of CANON_REGISTRY.documents) {
      const [active] = await tx
        .select({
          id: canonDocuments.id,
          normalizedChecksum: canonDocuments.normalizedChecksum,
        })
        .from(canonDocuments)
        .where(
          and(
            eq(canonDocuments.canonicalId, document.id),
            eq(canonDocuments.status, "active"),
          ),
        )
        .limit(1);
      if (active) {
        if (active.normalizedChecksum !== document.normalizedChecksum) {
          throw new Error(
            `Active ${document.id} differs from the approved registry; use the protected amendment workflow.`,
          );
        }
        continue;
      }
      const [created] = await tx
        .insert(canonDocuments)
        .values({
          canonicalId: document.id,
          title: document.title,
          version: document.version,
          status: "active",
          effectiveDate: document.effectiveDate,
          authority: document.authority,
          source: document.source,
          sourceReference: document.sourceReference,
          sourceChecksum: document.sourceChecksum,
          normalizedChecksum: document.normalizedChecksum,
          sensitivity: document.sensitivity,
          provenance: document.provenance,
          ingestedAt: new Date(document.ingestedAt),
          supersedesCanonicalId: document.supersedes[0] ?? null,
          supersededByCanonicalId: document.supersededBy,
        })
        .returning({ id: canonDocuments.id });
      if (!created) throw new Error(`Failed to create ${document.id}.`);
      documentsCreated += 1;
      await tx.insert(canonSections).values(
        document.sections.map((section) => ({
          documentId: created.id,
          canonicalSectionId: section.id,
          ordinal: section.ordinal,
          title: section.title,
          normalizedText: section.text,
          checksum: section.checksum,
          informationState: "CANONICAL",
          trustClass: "SYSTEM_CONSTITUTIONAL_INSTRUCTION",
          authorityClass: "PROTECTED_CONSTITUTION",
          sensitivity: document.sensitivity,
          tokenEstimate: estimateTextTokensConservatively(
            `${section.title}\n${section.text}`,
          ),
        })),
      );
      sectionsCreated += document.sections.length;
    }

    let projectsCreated = 0;
    const projectIds = new Map<string, string>();
    for (const project of fixtures.projects) {
      const [created] = await tx
        .insert(projects)
        .values({ ownerId, ...project })
        .onConflictDoNothing()
        .returning({ id: projects.id });
      if (created) projectsCreated += 1;
      const [stored] = await tx
        .select({ id: projects.id })
        .from(projects)
        .where(
          and(eq(projects.ownerId, ownerId), eq(projects.slug, project.slug)),
        )
        .limit(1);
      if (!stored)
        throw new Error(`Failed to resolve project ${project.slug}.`);
      projectIds.set(project.slug, stored.id);
    }

    let knowledgeCreated = 0;
    for (const record of fixtures.records) {
      const projectId = projectIds.get(record.projectSlug);
      const source = fixtures.sources.find(
        (candidate) => candidate.projectSlug === record.projectSlug,
      );
      if (!projectId || !source) {
        throw new Error(`Fixture scope ${record.projectSlug} is invalid.`);
      }
      const [created] = await tx
        .insert(knowledgeRecords)
        .values({
          ownerId,
          projectId,
          key: record.key,
          title: record.title,
          content: record.content,
          informationState: record.informationState,
          trustClass: "TRUSTED_FACT_SOURCE",
          authorityClass: record.authorityClass,
          sensitivity: "INTERNAL",
          confidence: record.confidence,
          sourceType: "living_company_context",
          sourceReference: `${source.sourceReference}#sha256=${source.sourceChecksum}`,
          provenance:
            "Minimal F1 fixture selected from a founder-supplied living-company context; labels remain non-canonical.",
          lastVerifiedAt: new Date(record.lastVerifiedAt),
        })
        .onConflictDoNothing()
        .returning({ id: knowledgeRecords.id });
      if (created) knowledgeCreated += 1;
    }

    let conflictsCreated = 0;
    const [existingConflict] = await tx
      .select({ id: conflictRecords.id })
      .from(conflictRecords)
      .where(
        and(
          eq(conflictRecords.ownerId, ownerId),
          eq(
            conflictRecords.summary,
            "Legacy Sanctum currently names multiple unresolved product concepts.",
          ),
        ),
      )
      .limit(1);
    if (!existingConflict) {
      const projectId = projectIds.get("groomed-gent");
      if (!projectId) throw new Error("Groomed Gent project is missing.");
      await tx.insert(conflictRecords).values({
        ownerId,
        projectId,
        summary:
          "Legacy Sanctum currently names multiple unresolved product concepts.",
        sourceIds: ["ggc.legacy-sanctum-name-conflict"],
        relevantPassages: [
          "The name has represented a performance line, member app, and physical destination.",
        ],
        authorityLevels: ["VALIDATED_KNOWLEDGE"],
        reason:
          "The living context explicitly says these related uses must not be assumed to form a finalized product architecture.",
        blocksTask: false,
        recommendedResolution:
          "Ask Neil for a current explicit naming decision before treating any one architecture as final.",
      });
      conflictsCreated = 1;
    }

    return {
      documentsCreated,
      sectionsCreated,
      projectsCreated,
      knowledgeCreated,
      conflictsCreated,
    };
  });
}

export const BOOTSTRAP_SECURITY_CLASSIFICATIONS = SECURITY_CLASSIFICATIONS;
