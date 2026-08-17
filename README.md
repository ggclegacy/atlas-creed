# Atlas Creed

Atlas Creed is a private, single-owner personal intelligence environment built
with Next.js, Postgres/Neon, Auth.js, and a provider-neutral model boundary.

**Current status:** the committed Phase 2 application is the reconciled F0
baseline. F1 adds the constitutional foundation: a compact kernel, a
checksummed 001-011 canon registry, governed living-company knowledge, scoped
context compilation, safe context traces, protected amendment workflow, and a
read-first Brain view. F2 and later capabilities remain out of scope.

## Start locally

Node 24 and pnpm 11.18.0 are pinned by `.nvmrc` and `package.json`.

```bash
corepack pnpm install
cp .env.example .env.local
corepack pnpm dev
```

Use `corepack pnpm` unless a pnpm Corepack shim is already on `PATH`.

## Important commands

| Command                                                      | Purpose                                                                    |
| ------------------------------------------------------------ | -------------------------------------------------------------------------- |
| `corepack pnpm verify`                                       | Typecheck, lint, format check, unit tests, production build                |
| `corepack pnpm test:integration`                             | Database-backed tests against an explicitly supplied test database         |
| `corepack pnpm test:e2e`                                     | Authenticated browser stories; requires the documented fixture environment |
| `corepack pnpm db:check`                                     | Validate Drizzle migration consistency                                     |
| `corepack pnpm db:migrate`                                   | Apply migrations to the explicitly configured database                     |
| `corepack pnpm db:verify`                                    | Read-only migration-ledger, table, and security-constraint verification    |
| `corepack pnpm env:check:production`                         | Validate the real production environment without printing values           |
| `corepack pnpm canon:import -- --source-dir /private/source` | Rebuild normalized canon from private DOCX sources                         |

The canon import stores normalized text, source references, checksums, and
provenance. It does not copy private Word binaries into the repository.

## F1 boundaries

- The Constitutional Kernel is provider-independent and always included.
- Canon and living knowledge are retrieved by relevance, authority, project
  scope, classification, and token budget.
- Retrieved company material is labeled as data, never instructions.
- `SECRETS` cannot be stored as canon or ordinary knowledge and cannot enter
  context traces or model context.
- Supersession and deletion are separate lifecycle states.
- Ordinary conversation cannot amend the constitution. Approval and activation
  require separate exact-phrase owner actions, evidence, and immutable versions.
- Brain shows metadata, selected sources, conflicts, model identity, and actual
  capability status—never credentials, secret values, or hidden reasoning.
- Long-term memory, autonomous action, tools, agents, voice, Atlas Architect,
  embeddings, and proactive jobs are not implemented in F1.

## Database safety

Do not run migrations against a shared or protected Neon branch until its
schema is reconciled with the Drizzle migration ledger. The F0 audit found the
existing shared branches had application tables but no
`drizzle.__drizzle_migrations` history. Clean branch rehearsals are the source
of truth until that separate deployment decision is approved.

For a new deployment, use a new empty Neon database and follow the complete
[fresh Vercel deployment runbook](docs/operations/VERCEL_DEPLOYMENT.md). It
defines every environment variable, the safe migration sequence, Vercel
settings, production preflight, and post-deployment smoke tests. No legacy
Vercel project or undocumented setting is required.

## Architecture rules

Provider SDKs may only be imported in `lib/model/`. Runtime environment values
may only be read in `lib/env/`. These boundaries are defined in
`architecture.json`, enforced by ESLint, and tested in `tests/arch/`.

## Documentation

- `docs/operations/F0_BASELINE_2026-08-17.md` — verified inherited baseline
- `docs/operations/VERCEL_DEPLOYMENT.md` — fresh production deployment runbook
- `docs/architecture/F1_CONSTITUTIONAL_FOUNDATION.md` — implemented F1 design
- `docs/ATLAS_FOUNDATIONAL_SYSTEM_BUILD_PLAN.md` — milestone roadmap
- `docs/canon/ATLAS-CREED-BIBLE.md` — earlier product canon
- `docs/product/V1-PRODUCT-DEFINITION.md` — V1 product definition
- `docs/ATLAS_DESIGN_SYSTEM_V1.md` — interface standard
