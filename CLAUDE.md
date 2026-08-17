# Atlas Creed

## Canon

[docs/canon/ATLAS-CREED-BIBLE.md](docs/canon/ATLAS-CREED-BIBLE.md) is foundational product canon. Read it before any major architectural, UX, or product decision.

This is the canonical path. Do not create or refer to a duplicate
`docs/ATLAS_VISION_AND_STANDARDS.md` alias.

Per §33 of that document:

- It describes **direction, not immediate scope**. Do not implement it wholesale because it appears there.
- When a requested implementation conflicts with it, surface the conflict rather than silently resolving it.
- When multiple approaches are technically valid, prefer the one that preserves the long-term vision without adding V1 complexity.
- When uncertain, ask. Do not silently invent foundational product decisions.

## V1 scope

[docs/product/V1-PRODUCT-DEFINITION.md](docs/product/V1-PRODUCT-DEFINITION.md) governs what V1 builds. It is phase-scoped — unlike the Bible, it will be superseded rather than extended.

This is the canonical path. Do not create or refer to a duplicate
`docs/ATLAS_V1_PRODUCT_DEFINITION.md` alias.

The engineering rule from §47 is the gate for every addition: *does this improve Atlas's core loop, or establish infrastructure the loop genuinely needs?* If neither, don't build it. §40 lists what V1 is deliberately not.

## Build plan

[docs/ATLAS_V1_BUILD_PLAN.md](docs/ATLAS_V1_BUILD_PLAN.md) is the authoritative technical plan — **Revision 3, approved**. `docs/architecture/ARCHITECTURE.md` is a superseded earlier sketch; don't build from it.

Stack: Next.js 16.x + TypeScript strict + Postgres (Drizzle/Neon) on Vercel, **Node runtime throughout — no Edge**, with Claude Opus 5 behind a thin model interface. The approved V1 plan includes authentication, but the owner explicitly deferred it while the Phase 1 shell contains no private data.

Three architecture rules that are easy to violate accidentally:

- **Never interpolate volatile values into the `system` array.** The prefix is tiered (Core Canon → project context → history) and cached; one mutable byte invalidates everything behind it and multiplies per-message cost roughly sevenfold.
- **Dynamic context goes in `messages` as a `role: "system"` message**, after the cached prefix — never in top-level `system`.
- **Only `lib/model/` imports a provider SDK.** Enforced by lint and proved by test.

`cache_read_input_tokens` is the health metric for the whole design. Zero across consecutive turns within a session means the cached prefix is broken. Core Canon has an enforced token budget — when it presses the limit, demote entries to Extended Canon rather than raising the ceiling.

## Current phase

**Phase 0 (Foundation) is complete. Phase 1 (Skeleton) is authorized and in progress.**

Implemented: Next.js app skeleton, strict TypeScript, ESLint + Prettier, Vitest + Playwright, CI, environment validation, architecture boundary enforcement, and the design-token architecture.

Phase 1 may implement only its approved database, direct-access application shell, PWA, and deployment foundation. AI calls, chat, canon, memory, retrieval, projects, files, voice, agents, and tools remain unauthorized. Authentication is deliberately absent for the empty shell and must be restored before any private owner data or mutation ships.

## Engineering conventions (Phase 0)

**Running commands — use `corepack pnpm`.** pnpm is **not** on the default shell PATH in this environment. Node's bundled Corepack reads the `packageManager` field and runs the exact pinned version with no PATH change:

```bash
corepack pnpm install
corepack pnpm verify
```

A bare `pnpm ...` will fail with *command not found* unless a shim has been added to PATH manually — see [README.md](README.md). The one exception is `test:e2e`: Playwright's `webServer` spawns a plain shell that runs `pnpm build && pnpm start`, so E2E needs `PATH="$HOME/.local/bin:$PATH"` prefixed, or a shim on PATH.

**Node is pinned to 24** in [`.nvmrc`](.nvmrc); `engines` and CI both read that pin. Verified on v24.19.0. Don't change the runtime casually.

**Verification.** `corepack pnpm verify` runs the full local gate: typecheck → lint → format check → tests → build. CI runs the same steps plus a Playwright smoke test. A red gate blocks the merge.

**Architecture boundaries** are defined once in [`architecture.json`](architecture.json), applied by [`eslint.config.mjs`](eslint.config.mjs), and proved by [`tests/arch/`](tests/arch/). One definition means tests cannot drift from the real config and quietly start proving nothing. Two boundaries exist today:

1. **Provider SDKs** may only be imported inside `lib/model/`.
2. **`process.env`** may only be read inside `lib/env/` (plus config files and tests). Everything else calls the validated configuration helper.

**Environment.** `lib/env/schema.ts` holds the pure, testable server Zod schema. `lib/env/server.ts` adds `server-only` and validates lazily on the first server execution path that needs Phase 1 services, so runtime secrets are not required merely to inspect routes at build time. Phase 1 has no client environment variables. **No secret may ever carry the `NEXT_PUBLIC_` prefix** — those values are inlined into the browser bundle and are public permanently. A test enforces this against a secret-name pattern.

**Design tokens are two layers.** [`styles/tokens/primitives.css`](styles/tokens/primitives.css) holds the ratified raw values. [`styles/tokens/semantic.css`](styles/tokens/semantic.css) is the stable layer that names roles (`--surface-card`, `--accent-authority`). **Components use semantic tokens only.** Primitives are deliberately not exposed as Tailwind utilities, so a component cannot reach past the semantic layer. Evidence-based tuning belongs in primitives and must be recorded; components must not drift around the semantic layer.

**Formatter scope.** `docs/`, `CLAUDE.md`, and `tsconfig.json` are Prettier-ignored. The first two are authored documents whose formatting is a human decision; the third is rewritten by Next on every build.

**TypeScript strictness is load-bearing.** `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals`, and friends are enabled deliberately. Do not weaken them to make a build pass — fix the code.

## Design system

[docs/ATLAS_DESIGN_SYSTEM_V1.md](docs/ATLAS_DESIGN_SYSTEM_V1.md) is the authoritative visual and interaction standard. `docs/design/DESIGN-SYSTEM.md` is a superseded earlier exploration.

Status is **ratified and approved**. All sixteen decisions at the end of that document govern Phase 1 interface work. Minor evidence-based tuning is permitted only when it preserves the approved design language and is recorded.

The thesis in one line: **Atlas is an environment, not an application.** The chrome recedes; thinking is the content. A screen converted to grayscale must still read as Atlas.

Four rules that get violated by reflex:

- **Text on a gold fill is obsidian, never white** (white = 2.97:1, fails).
- **Gold ≤ 5% of a screen, 2–3% typical.** Solid gold fill is reserved for the composer's send and irreversible confirmations — not every primary button.
- **Purple is 0% at rest.** It means one thing: Atlas is doing cognitive work. Never a button, border, or ambient gradient.
- **Borders cannot carry information** — a structural border on near-black tops out near 1.6:1. State comes from surface shift, gold, or a semantic colour.

Never add a colour token without measuring contrast and hue separation first — several of the system's rules exist because a measurement contradicted an intuition.
