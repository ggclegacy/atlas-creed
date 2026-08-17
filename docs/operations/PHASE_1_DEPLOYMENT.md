# Atlas Creed Phase 1 deployment

**Scope:** empty Phase 1 application shell only. This procedure does not authorize Phase 2.

The owner explicitly deferred authentication for this shell. It contains no conversations,
memory, or private owner data. Do not enable any such capability until an access-control boundary
is restored.

## Vercel project

- Project name: `atlas-creed`
- Git repository: `ggclegacy/atlas-creed`
- Production branch: `main`
- Root directory: repository root
- Framework, install, build, and output settings: Vercel's detected Next.js defaults
- Node: `24.x`, enforced by `package.json`
- Function region: `iad1`, enforced by `vercel.json` to match the approved Neon region

Do not add custom install, build, or output commands unless a measured incompatibility requires
one. The lockfile and `packageManager` field select pnpm 11.18.0. No `.vercel` directory is
required or committed; a fresh Git import is the supported path.

## Environment contract

Secret values belong in Vercel project environment variables, never in Git or deployment logs.
Vercel's `NODE_ENV`, `VERCEL`, and `VERCEL_ENV` values are platform-owned and must not be
overridden.

Phase 1 has **no required build-time environment variables** and no client-exposed environment
variables. The values below are server-only and validated on the first request that initializes
Neon. Missing or invalid requirements fail together with a named validation error. The static
Phase 1 shell does not initialize Neon and can be deployed before they are configured.

| Name | Timing | Sensitivity | Production | Preview | Development |
|---|---|---:|---:|---:|---:|
| `DATABASE_URL` | Required runtime | Secret | Required: production branch | Required: preview branch | Required to run the app |
| `DATABASE_ENVIRONMENT` | Required runtime | Non-secret | `production` | `preview` | `development` |

`NODE_ENV` and `VERCEL_ENV` are server-only, platform-owned inputs. Next.js supplies `NODE_ENV`;
Vercel supplies `VERCEL_ENV`. Neither belongs in Vercel project settings. There are no
development-only, preview-only, or production-only user-managed variable names; deployment scope
is represented by each value and by `DATABASE_ENVIRONMENT`.

Preview and production values must be added to their separate Vercel scopes. Never copy the
production `DATABASE_URL` into Preview.

## Neon

1. Create the production Neon project in an AWS US East region compatible with `iad1`.
2. Use a pooled, TLS-enabled Postgres connection string for `DATABASE_URL`.
3. Create a separate branch for Preview deployments. Prefer the Vercel/Neon integration when it
   can create per-preview branches; otherwise configure a dedicated non-production branch and
   rotate it deliberately.
4. Add the production URL only to Vercel Production and the preview URL only to Vercel Preview.
5. Set the matching `DATABASE_ENVIRONMENT` value in each scope.
6. After inspecting the target name and URL outside logs, run `pnpm db:migrate` once against each
   confirmed database. Migrations are never part of the application build command.

The first migration creates the four approved domain tables (`owners`, `conversations`,
`messages`, `system_events`) and three unused Auth.js adapter tables from the original baseline.
Those tables remain to avoid a destructive production schema change. It creates no Phase 2
schema.

## Deployment sequence

1. Run `corepack pnpm install --frozen-lockfile`, `corepack pnpm typecheck`,
   `corepack pnpm lint`, `corepack pnpm format:check`, `corepack pnpm test`,
   `corepack pnpm db:check`, `corepack pnpm build`, and `corepack pnpm test:e2e`.
2. Confirm the committed migration and a clean secret scan.
3. Push the verified commit to `main` and confirm GitHub Actions.
4. Link the existing Vercel project, or create `atlas-creed` if no project exists, and connect it
   to `ggclegacy/atlas-creed` with `main` as the production branch.
5. Configure the environment scopes above and apply migrations only to confirmed targets.
6. Deploy to the generated `vercel.app` domain first.
7. Verify `/`, `/settings`, `/manifest.webmanifest`, icons, `/sw.js`, security headers, and the
   direct-access desktop/mobile shell.
8. Configure a custom domain only after the generated deployment is healthy and the owner has
   selected and authorized that domain.
