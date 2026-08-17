# Atlas Creed

## Canon

[docs/canon/ATLAS-CREED-BIBLE.md](docs/canon/ATLAS-CREED-BIBLE.md) is foundational product canon. Read it before any major architectural, UX, or product decision.

Per §33 of that document:

- It describes **direction, not immediate scope**. Do not implement it wholesale because it appears there.
- When a requested implementation conflicts with it, surface the conflict rather than silently resolving it.
- When multiple approaches are technically valid, prefer the one that preserves the long-term vision without adding V1 complexity.
- When uncertain, ask. Do not silently invent foundational product decisions.

## V1 scope

[docs/product/V1-PRODUCT-DEFINITION.md](docs/product/V1-PRODUCT-DEFINITION.md) governs what V1 builds. It is phase-scoped — unlike the Bible, it will be superseded rather than extended.

The engineering rule from §47 is the gate for every addition: *does this improve Atlas's core loop, or establish infrastructure the loop genuinely needs?* If neither, don't build it. §40 lists what V1 is deliberately not.

## Build plan

[docs/ATLAS_V1_BUILD_PLAN.md](docs/ATLAS_V1_BUILD_PLAN.md) is the authoritative technical plan — **Revision 3, approved**. `docs/architecture/ARCHITECTURE.md` is a superseded earlier sketch; don't build from it.

Stack: Next.js 16.x + TypeScript strict + Postgres (Drizzle/Neon) + Auth.js magic link on Vercel, **Node runtime throughout — no Edge**, with Claude Opus 5 behind a thin model interface.

Three architecture rules that are easy to violate accidentally:

- **Never interpolate volatile values into the `system` array.** The prefix is tiered (Core Canon → project context → history) and cached; one mutable byte invalidates everything behind it and multiplies per-message cost roughly sevenfold.
- **Dynamic context goes in `messages` as a `role: "system"` message**, after the cached prefix — never in top-level `system`.
- **Only `lib/model/` imports a provider SDK.** Enforced by lint and proved by test.

`cache_read_input_tokens` is the health metric for the whole design. Zero across consecutive turns within a session means the cached prefix is broken. Core Canon has an enforced token budget — when it presses the limit, demote entries to Extended Canon rather than raising the ceiling.

## Current phase

**Phase 0 (Foundation) is complete. Phase 1 has not begun.**

Implemented: Next.js app skeleton, strict TypeScript, ESLint + Prettier, Vitest + Playwright, CI, environment validation, architecture boundary enforcement, and the design-token architecture.

Not implemented: database, auth, AI calls, chat, canon, memory, retrieval, projects, files, voice. Do not add any of these without explicit approval for the relevant phase.

## Engineering conventions (Phase 0)

**Verification.** `pnpm verify` runs the full local gate: typecheck → lint → format check → tests → build. CI runs the same steps plus a Playwright smoke test. A red gate blocks the merge.

**Architecture boundaries** are defined once in [`architecture.json`](architecture.json), applied by [`eslint.config.mjs`](eslint.config.mjs), and proved by [`tests/arch/`](tests/arch/). One definition means tests cannot drift from the real config and quietly start proving nothing. Two boundaries exist today:

1. **Provider SDKs** may only be imported inside `lib/model/`.
2. **`process.env`** may only be read inside `lib/env/` (plus config files and tests). Everything else imports validated config.

**Environment.** `lib/env/schema.ts` holds pure, testable Zod schemas. `lib/env/server.ts` adds `server-only` so importing it from a Client Component is a build failure. `lib/env/client.ts` reads `NEXT_PUBLIC_*` literals. **No secret may ever carry the `NEXT_PUBLIC_` prefix** — those values are inlined into the browser bundle and are public permanently. A test enforces this against a secret-name pattern.

**Design tokens are two layers.** [`styles/tokens/primitives.css`](styles/tokens/primitives.css) holds raw values and is **provisional** — the visual system is not ratified. [`styles/tokens/semantic.css`](styles/tokens/semantic.css) is the stable layer that names roles (`--surface-card`, `--accent-authority`). **Components use semantic tokens only.** Primitives are deliberately not exposed as Tailwind utilities, so a component cannot reach past the semantic layer. Ratifying the visual system means editing primitives and nothing else.

**Formatter scope.** `docs/`, `CLAUDE.md`, and `tsconfig.json` are Prettier-ignored. The first two are authored documents whose formatting is a human decision; the third is rewritten by Next on every build.

**TypeScript strictness is load-bearing.** `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, and friends are enabled deliberately. Do not weaken them to make a build pass — fix the code.

## Design system

[docs/design/DESIGN-SYSTEM.md](docs/design/DESIGN-SYSTEM.md) translates canon §11–§14 into measured values and seven enforceable laws.

Status is **proposed, not ratified** — four decisions are still the owner's: typeface, dark-only commitment, the gold ratio, and whether purple ships at all. **This blocks Phase 1 UI work.**

Never add a color token without measuring contrast and hue separation first — three of the system's laws exist because a measurement contradicted an intuition.
