# F1 Constitutional Foundation

**Status:** Implemented and verified on a clean disposable database  
**Date:** 2026-08-17  
**Scope:** F1 only; no F2+ capability is authorized or implied

## Outcome

F1 makes Atlas a governed intelligence layer rather than a persona prompt. The
conversation path compiles a minimal, inspectable context from an always-on
kernel, protected canon, and project-scoped living knowledge before calling the
existing provider-neutral model adapter. Brain exposes what actually happened.

## Module map

```text
private DOCX sources
  -> scripts/import-canon.mjs
  -> data/canon/registry.json (normalized text + checksums + provenance)
  -> protected bootstrap
  -> canon_documents / canon_sections

user turn
  -> task/project scope inference
  -> constitutional kernel (always)
  -> Postgres full-text retrieval
  -> classification + lifecycle filters
  -> authority/relevance ranking + reserved token budgets
  -> provider-neutral model request
  -> safe context trace + model-usage linkage

/brain
  -> kernel/canon metadata, scoped counts, conflicts, traces,
     amendment state, model identity, capability truth
```

## Constitutional Kernel

`lib/constitutional/kernel.ts` defines the stable provider-independent kernel.
It covers Atlas identity, truth over agreement, authority, content-as-data,
precedence, minimum-sufficient context, secret handling, capability truth,
growth without silent drift, and stable relationship behavior. A deterministic
checksum and a 1,200 estimated-token ceiling make drift and bloat testable.

## Canon registry and ingestion

`scripts/import-canon.mjs` reads Documents 001-011, normalizes their complete
text into deterministic sections, and writes `data/canon/registry.json`.
Every document and section has a checksum. Source filename, source checksum,
normalized checksum, provenance, authority, classification, and source-stated
version/effective date are retained. Missing source metadata remains null; it
is never invented. Private DOCX binaries remain outside the repository.

Bootstrap is idempotent and fail-closed. If an active database document has the
same canonical ID but a different normalized checksum, Atlas stops instead of
silently replacing protected canon.

## Information, trust, and precedence

The shared taxonomy includes canonical, current fact, historical fact,
decision, preference, proposal, hypothesis, brainstorm, superseded, disputed,
and unknown states. Trust classes distinguish constitutional instructions,
authorized policy, trusted fact sources, and untrusted content. Authority has a
deterministic rank from runtime security through untrusted material.

Higher authority wins only when the comparison is valid. Material conflicts at
equal authority are recorded and surfaced for resolution. The initial company
fixtures deliberately include the Groomed Gent Co. Legacy Sanctum naming
conflict as proof of this behavior.

## Context compiler

`lib/context/compiler.ts` is the sole F1 compilation path for conversation
turns. It:

1. includes the kernel on every request;
2. infers Atlas, Groomed Gent Co., or Gent Logistics scope from the task;
3. performs deterministic PostgreSQL full-text retrieval;
4. excludes deleted, superseded, secret, and cross-project records;
5. ranks by authority, relevance, then stable source ID;
6. reserves 65% of the retrieval budget for canon and 35% for scoped knowledge
   when both exist, preventing one class from starving the other;
7. labels canon as constitutional instruction and wraps living knowledge as
   data that cannot grant authority; and
8. records selected and excluded source metadata in a safe context trace.

The compiler stays above `lib/model/`, so changing providers cannot bypass
governance. Context traces link to model-usage records and store source metadata
and reasons, not hidden reasoning or credentials.

## Living-company knowledge

The F1 seed is intentionally minimal: three context projects and six records
drawn from the Groomed Gent Co. and Gent Logistics source documents. Records
carry project, state, trust, authority, classification, confidence, provenance,
validity, verification, supersession, and deletion fields.

Database constraints reject unknown taxonomy values, invalid confidence, and
`SECRETS` in ordinary canon, knowledge, and context traces. Application filters
enforce the same boundary before compilation. F1 provides retrieval and seeded
knowledge, not passive learning or long-term memory.

## Protected amendments

The amendment lifecycle is proposal -> explicit approval -> evidence-backed
activation. Approval and activation use distinct exact phrases in authenticated
server actions. Activation creates a new immutable canon revision, retires the
old revision, links both directions, and preserves the proposal, rationale,
diff, impact analysis, approver, timestamps, and evaluation evidence.
Conversation has no route to approve or activate amendments.

## Brain

`/brain` is a read-first constitutional observability surface. It shows kernel
version/checksum/budget, canon revision metadata, scoped knowledge counts, open
conflicts, recent source-selection traces, provider/model identity, protected
amendment states, and an explicit available-versus-planned capability registry.
It does not expose secret values, full retrieved content, chain-of-thought, or
unimplemented capability claims.

## Persistence

F1 adds canon, canon-section, project, knowledge, conflict, context-trace,
context-trace-item, and constitutional-amendment tables, plus context linkage on
model usage. Full-text GIN indexes support deterministic local retrieval.
Supersession is provenance-preserving; deletion uses a separate timestamp.

## Evaluation matrix

Automated tests cover:

- kernel stability, checksum, required principles, and token budget;
- precedence and equal-authority conflict behavior;
- registry completeness, order, source hashes, and section hashes;
- clean bootstrap and idempotency;
- canon and scoped company retrieval;
- project isolation and provenance;
- prompt-injection text remaining data;
- provider/model swapping without governance loss;
- brainstorm-state preservation;
- secret, lifecycle, and token-budget exclusion;
- protected amendment approval and immutable activation; and
- authenticated Brain initialization and trace visibility in the browser.

## Deployment gate and limitations

F0 found application tables on the existing shared Neon branches without a
`drizzle.__drizzle_migrations` ledger. F1 migrations must not be applied there
until an explicitly approved reconciliation establishes the authoritative
baseline. Clean disposable branch rehearsals remain the verified path.

F1 does not implement long-term memory, learning pipelines, embeddings,
external tools, specialist agents, voice, Atlas Architect, proactive work, or
autonomous execution. Those remain later milestones and must pass their own
approval gates.

