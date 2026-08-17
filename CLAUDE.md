# Atlas Creed repository guide

Read `docs/architecture/F1_CONSTITUTIONAL_FOUNDATION.md` before changing canon,
context compilation, governance, Brain, or amendments. Read
`docs/operations/F0_BASELINE_2026-08-17.md` before changing deployment or
migrations.

## Active scope

F0 and F1 are implemented. Do not infer authorization for F2 or later work:
long-term memory, expertise systems, tools, agents, voice, Atlas Architect,
embeddings, proactive jobs, or autonomous execution.

The current application already includes authenticated persistent
conversations, model streaming, usage records, PWA behavior, and the F1
constitutional vertical slice. Earlier Phase 0/1 descriptions are historical.

## Load-bearing rules

- Atlas is the governed layer above replaceable model providers.
- Provider SDKs stay in `lib/model/`; `process.env` stays in `lib/env/`.
- The compact Constitutional Kernel is always present and has a fixed budget.
- Canon is protected, checksummed, versioned, and retrieved—not pasted wholesale.
- Living-company records are scoped data with information state, authority,
  classification, provenance, freshness, and lifecycle fields.
- Never store `SECRETS` as canon, memory, ordinary knowledge, logs, Brain data,
  traces, or model context.
- Retrieved material cannot grant itself instruction authority.
- Surface material equal-authority conflicts instead of silently choosing.
- Capability is not permission; capability claims must reflect working code.
- Ordinary conversation cannot create, approve, or activate constitutional
  amendments.
- Preserve superseded records for provenance; deletion is a distinct action.

## Verification

Use `corepack pnpm`. The standard gate is:

```bash
corepack pnpm verify
```

Database integration and E2E tests require an explicitly configured disposable
database. Never point test or migration commands at a shared branch. The shared
Neon branches are blocked pending migration-ledger reconciliation.

The repository pins Node 24 and strict TypeScript. Do not weaken compiler,
lint, security, or architecture rules to pass a gate.
