export interface FoundationExpectations {
  readonly activeCanonIds: readonly string[];
  readonly projectKnowledgeCounts: Readonly<Record<string, number>>;
}

export interface FoundationSnapshot {
  readonly canon: readonly {
    readonly canonicalId: string;
    readonly status: string;
  }[];
  readonly projects: readonly {
    readonly slug: string;
    readonly knowledgeCount: number;
  }[];
}

/**
 * Canon is global, but projects and living knowledge are owner-scoped. A
 * partial bootstrap must remain recoverable even when canon already exists.
 */
export function isConstitutionalFoundationReady(
  snapshot: FoundationSnapshot,
  expectations: FoundationExpectations,
): boolean {
  const activeCanonIds = new Set(
    snapshot.canon
      .filter((document) => document.status === "active")
      .map((document) => document.canonicalId),
  );
  if (
    expectations.activeCanonIds.some(
      (canonicalId) => !activeCanonIds.has(canonicalId),
    )
  ) {
    return false;
  }

  const projects = new Map(
    snapshot.projects.map((project) => [project.slug, project.knowledgeCount]),
  );
  return Object.entries(expectations.projectKnowledgeCounts).every(
    ([slug, expectedKnowledgeCount]) =>
      (projects.get(slug) ?? -1) >= expectedKnowledgeCount,
  );
}
