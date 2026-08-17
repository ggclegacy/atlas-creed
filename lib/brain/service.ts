import "server-only";

import { and, desc, eq, inArray, sql } from "drizzle-orm";

import { getDatabase } from "@/lib/db/client";
import {
  canonDocuments,
  canonSections,
  conflictRecords,
  constitutionalAmendments,
  contextTraceItems,
  contextTraces,
  knowledgeRecords,
  projects,
} from "@/lib/db/schema";

export async function getBrainSnapshot(ownerId: string) {
  const db = getDatabase();
  const [canon, scopedProjects, conflicts, traces, amendments] =
    await Promise.all([
      db
        .select({
          id: canonDocuments.id,
          canonicalId: canonDocuments.canonicalId,
          title: canonDocuments.title,
          version: canonDocuments.version,
          status: canonDocuments.status,
          effectiveDate: canonDocuments.effectiveDate,
          sourceReference: canonDocuments.sourceReference,
          normalizedChecksum: canonDocuments.normalizedChecksum,
          sensitivity: canonDocuments.sensitivity,
          sectionCount: sql<number>`count(${canonSections.id})::int`,
        })
        .from(canonDocuments)
        .leftJoin(
          canonSections,
          eq(canonSections.documentId, canonDocuments.id),
        )
        .groupBy(canonDocuments.id)
        .orderBy(canonDocuments.canonicalId),
      db
        .select({
          id: projects.id,
          slug: projects.slug,
          name: projects.name,
          active: projects.active,
          knowledgeCount: sql<number>`count(${knowledgeRecords.id})::int`,
        })
        .from(projects)
        .leftJoin(
          knowledgeRecords,
          and(
            eq(knowledgeRecords.projectId, projects.id),
            eq(knowledgeRecords.ownerId, ownerId),
          ),
        )
        .where(eq(projects.ownerId, ownerId))
        .groupBy(projects.id)
        .orderBy(projects.name),
      db
        .select({
          id: conflictRecords.id,
          summary: conflictRecords.summary,
          reason: conflictRecords.reason,
          blocksTask: conflictRecords.blocksTask,
          recommendedResolution: conflictRecords.recommendedResolution,
          status: conflictRecords.status,
          createdAt: conflictRecords.createdAt,
        })
        .from(conflictRecords)
        .where(eq(conflictRecords.ownerId, ownerId))
        .orderBy(desc(conflictRecords.createdAt))
        .limit(20),
      db
        .select({
          id: contextTraces.id,
          taskCategory: contextTraces.taskCategory,
          kernelVersion: contextTraces.kernelVersion,
          modelProvider: contextTraces.modelProvider,
          model: contextTraces.model,
          estimatedInputTokens: contextTraces.estimatedInputTokens,
          retrievedItemCount: contextTraces.retrievedItemCount,
          excludedItemCount: contextTraces.excludedItemCount,
          status: contextTraces.status,
          createdAt: contextTraces.createdAt,
        })
        .from(contextTraces)
        .where(eq(contextTraces.ownerId, ownerId))
        .orderBy(desc(contextTraces.createdAt))
        .limit(10),
      db
        .select({
          id: constitutionalAmendments.id,
          proposedTitle: constitutionalAmendments.proposedTitle,
          proposedVersion: constitutionalAmendments.proposedVersion,
          rationale: constitutionalAmendments.rationale,
          diff: constitutionalAmendments.diff,
          impactAnalysis: constitutionalAmendments.impactAnalysis,
          status: constitutionalAmendments.status,
          approvedAt: constitutionalAmendments.approvedAt,
          effectiveDate: constitutionalAmendments.effectiveDate,
          createdAt: constitutionalAmendments.createdAt,
        })
        .from(constitutionalAmendments)
        .where(eq(constitutionalAmendments.ownerId, ownerId))
        .orderBy(desc(constitutionalAmendments.createdAt))
        .limit(20),
    ]);

  const traceIds = traces.map((trace) => trace.id);
  const traceItems = traceIds.length
    ? await db
        .select({
          traceId: contextTraceItems.traceId,
          sourceType: contextTraceItems.sourceType,
          sourceId: contextTraceItems.sourceId,
          sourceVersion: contextTraceItems.sourceVersion,
          title: contextTraceItems.title,
          informationState: contextTraceItems.informationState,
          included: contextTraceItems.included,
          reason: contextTraceItems.reason,
          tokenEstimate: contextTraceItems.tokenEstimate,
          rank: contextTraceItems.rank,
          sourceReference: contextTraceItems.sourceReference,
        })
        .from(contextTraceItems)
        .where(inArray(contextTraceItems.traceId, traceIds))
        .orderBy(contextTraceItems.traceId, contextTraceItems.rank)
    : [];

  return {
    canon,
    projects: scopedProjects,
    conflicts,
    traces: traces.map((trace) => ({
      ...trace,
      items: traceItems.filter((item) => item.traceId === trace.id),
    })),
    amendments,
  };
}
