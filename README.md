# Atlas Creed

A persistent personal intelligence system.

**Status: Phase 0 (Foundation) complete. Phase 1 (Skeleton) authorized and in
progress.** No AI calls or Phase 2 product features are implemented. See
[`docs/ATLAS_V1_BUILD_PLAN.md`](docs/ATLAS_V1_BUILD_PLAN.md) for the approved
architecture and phase plan.

---

## Prerequisites

| Requirement | Version     | Notes                                                                       |
| ----------- | ----------- | --------------------------------------------------------------------------- |
| Node.js     | **24.x**    | Pinned in [`.nvmrc`](.nvmrc); CI reads the same file. Verified on v24.19.0. |
| pnpm        | **11.18.0** | Pinned by the `packageManager` field. Do not install globally — see below.  |

### Running pnpm — no PATH changes required

Node ships **Corepack**, which reads the `packageManager` field in
`package.json` and runs the exact pinned pnpm version. Prefix any command:

```bash
corepack pnpm install
corepack pnpm verify
```

This is the canonical invocation. It needs no global install, no PATH edit, and
guarantees everyone uses the same pnpm version.

<details>
<summary>Optional: a bare <code>pnpm</code> command</summary>

If you prefer typing `pnpm` directly, install a Corepack shim into a
user-writable directory and add it to your PATH yourself:

```bash
mkdir -p ~/.local/bin
corepack enable --install-directory ~/.local/bin pnpm
# then add to ~/.zshrc (or your shell profile):
export PATH="$HOME/.local/bin:$PATH"
```

`corepack enable` without `--install-directory` targets `/usr/local/bin` and
requires root on macOS — avoid it.

**Note:** without `pnpm` on PATH, `corepack pnpm test:e2e` fails, because
Playwright's `webServer` spawns a plain shell that runs `pnpm build && pnpm
start`. Either add the shim above, or run E2E with PATH extended for that
command only:

```bash
PATH="$HOME/.local/bin:$PATH" corepack pnpm test:e2e
```

</details>

---

## Setup

```bash
corepack pnpm install
cp .env.example .env.local   # fill in values as later phases require them
corepack pnpm dev
```

---

## Commands

| Command                                 | What it does                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------- |
| `corepack pnpm dev`                     | Development server                                                                     |
| `corepack pnpm build`                   | Production build                                                                       |
| `corepack pnpm typecheck`               | `tsc --noEmit`                                                                         |
| `corepack pnpm lint`                    | ESLint, including the architecture guards                                              |
| `corepack pnpm format` / `format:check` | Prettier                                                                               |
| `corepack pnpm test`                    | Vitest — unit and architecture tests                                                   |
| `corepack pnpm test:e2e`                | Playwright smoke test (see PATH note above)                                            |
| **`corepack pnpm verify`**              | **The full local gate: typecheck → lint → format → test → build.** Run before pushing. |

---

## Architecture guards

Two boundaries are enforced by lint and _proved_ by tests in
[`tests/arch/`](tests/arch/). Both are defined once in
[`architecture.json`](architecture.json), read by the ESLint config and the
tests alike, so the tests cannot drift from the real configuration.

1. **Provider SDKs** may only be imported inside `lib/model/`.
2. **`process.env`** may only be read inside `lib/env/`; everything else calls
   the validated server configuration helper.

**No secret may ever carry the `NEXT_PUBLIC_` prefix** — those values are inlined
into the browser bundle and are public permanently. Phase 1 exposes no client
environment variables, and a test enforces the secret-name boundary.

---

## Documentation

| Document                                                                         | Purpose                                  |
| -------------------------------------------------------------------------------- | ---------------------------------------- |
| [`CLAUDE.md`](CLAUDE.md)                                                         | Working conventions and current phase    |
| [`docs/canon/ATLAS-CREED-BIBLE.md`](docs/canon/ATLAS-CREED-BIBLE.md)             | Product canon — direction, not scope     |
| [`docs/product/V1-PRODUCT-DEFINITION.md`](docs/product/V1-PRODUCT-DEFINITION.md) | What V1 must accomplish                  |
| [`docs/ATLAS_V1_BUILD_PLAN.md`](docs/ATLAS_V1_BUILD_PLAN.md)                     | Approved architecture and phases 0–7     |
| [`docs/ATLAS_DESIGN_SYSTEM_V1.md`](docs/ATLAS_DESIGN_SYSTEM_V1.md)               | Ratified visual and interaction standard |

The Bible and V1 Product Definition paths above are canonical. Historical
top-level aliases such as `docs/ATLAS_VISION_AND_STANDARDS.md` and
`docs/ATLAS_V1_PRODUCT_DEFINITION.md` must not be recreated.
