# Atlas Creed Phase 1 deployment

**Scope:** secure Phase 1 application shell only. This procedure does not authorize Phase 2.

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
Auth.js/Neon. Missing or invalid requirements fail together with a named validation error. They
must still be configured before the first deployment is considered usable.

| Name | Timing | Sensitivity | Production | Preview | Development |
|---|---|---:|---:|---:|---:|
| `DATABASE_URL` | Required runtime | Secret | Required: production branch | Required: preview branch | Required to run the app |
| `DATABASE_ENVIRONMENT` | Required runtime | Non-secret | `production` | `preview` | `development` |
| `AUTH_SECRET` | Required runtime | Secret | Required, unique | Required, separate from production | Required, separate from hosted values |
| `AUTH_RESEND_KEY` | Required runtime | Secret | Required | Required; use a separately scoped key | Required to run the app |
| `AUTH_EMAIL_FROM` | Required runtime | Non-secret | Required | Required | Required to run the app |
| `OWNER_EMAIL` | Required runtime | Sensitive configuration | Required | Required | Required to run the app |
| `AUTH_URL` | Optional runtime | Non-secret | Omit on Vercel | Omit on Vercel | Optional for non-Vercel hosts |

`NODE_ENV` and `VERCEL_ENV` are server-only, platform-owned inputs. Next.js supplies `NODE_ENV`;
Vercel supplies `VERCEL_ENV`. Neither belongs in Vercel project settings. There are no
development-only, preview-only, or production-only user-managed variable names; deployment scope
is represented by each value and by `DATABASE_ENVIRONMENT`.

Preview and production values must be added to their separate Vercel scopes. Never copy the
production `DATABASE_URL` or `AUTH_SECRET` into Preview. Do not deploy a nonfunctional preview
with fabricated email credentials; configure a real, restricted preview key or leave that scope
undeployed until it exists.

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
`messages`, `system_events`) and the three Auth.js adapter tables needed for database sessions and
email verification. It creates no Phase 2 schema.

## Resend and Auth.js

1. Verify a sender domain in Resend.
2. Create a narrowly scoped API key and store it as `AUTH_RESEND_KEY`.
3. Set `AUTH_EMAIL_FROM` to a mailbox on that verified domain.
4. Generate `AUTH_SECRET` with at least 32 random bytes (for example, `openssl rand -base64 32`)
   and store it directly in Vercel. Do not paste it into chat.
5. Set `OWNER_EMAIL` to the exact mailbox authorized to use Atlas.

Auth.js derives each Vercel deployment origin, so `AUTH_URL` is intentionally omitted in hosted
environments. Magic links expire after 15 minutes and are single-use. Sessions are stored in
Postgres; Auth.js applies `HttpOnly`, `Secure`, and `SameSite=Lax` cookie defaults on HTTPS.

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
7. Verify `/sign-in`, `/manifest.webmanifest`, icons, `/sw.js`, security headers, unauthenticated
   redirects, owner magic-link sign-in, and the private desktop/mobile shell.
8. Configure a custom domain only after the generated deployment is healthy and the owner has
   selected and authorized that domain.
