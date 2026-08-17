# Atlas fresh Vercel deployment

**Status:** Production runbook for the current F0/F1 application  
**Deployment model:** New Vercel project + new migrated Neon database  
**Production branch:** `main`  
**Repository root:** project root

This runbook deliberately does not reuse the legacy shared Neon schemas. Those
schemas contain application tables without a trustworthy Drizzle ledger. A
fresh database with all committed migrations is the safe production target.

## Platform settings

- Import `ggclegacy/atlas-creed` into a new Vercel project.
- Leave Framework Preset, Install Command, Build Command, Development Command,
  and Output Directory on Vercel's detected Next.js defaults.
- Do not upload or commit `.vercel/`.
- Node `24.x` and pnpm `11.18.0` are selected by `package.json` and `.nvmrc`.
- `vercel.json` enables Fluid Compute and places Node functions in `iad1`.
  The production Neon compute should remain in AWS US East. If the database is
  deliberately created elsewhere, update the function region before deployment.
- The build does not connect to Postgres or OpenAI and requires no secrets.
  Runtime requests fail closed when required configuration is absent.

## Definitive environment inventory

All user-managed variables are server-only. Atlas has no `NEXT_PUBLIC_*`
variables. Every changed Vercel environment variable requires a redeployment.

| Variable | Required | Scope/value | Purpose and source use |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | Secret. Production must be a pooled, TLS-enabled Neon URL for the new production database. Preview must use a different branch/database. | Drizzle runtime client; migration and readiness commands. |
| `DATABASE_ENVIRONMENT` | Yes | `production` in Production, `preview` in Preview, `development` locally. | Fails closed when a Vercel scope points at the wrong database class. |
| `AUTH_SECRET` | Yes | Secret random value of at least 32 characters. Generate with `openssl rand -base64 33`. | Auth.js cookie/token cryptography. Use the same value across deployments that must share sessions; rotate to invalidate sessions. |
| `AUTH_RESEND_KEY` | Yes | Secret Resend API key beginning with `re_`. | Sends short-lived owner magic links. |
| `AUTH_EMAIL_FROM` | Yes | Verified sender, for example `Atlas Creed <atlas@auth.yourdomain.com>`. | Resend sender identity. The domain must be verified before the login smoke test. |
| `OWNER_EMAIL` | Yes | Exact private owner mailbox. | Case-insensitive allowlist applied before email send and on every authenticated request. |
| `AUTH_URL` | No | Usually leave unset. If a nonstandard Auth.js base path is introduced, set its exact HTTPS URL. | Auth.js v5 normally infers Vercel and custom-domain origins from trusted request headers. Never pin Preview to the Production URL. |
| `OPENAI_API_KEY` | Yes | Secret OpenAI project key. | Server-only Responses API calls. |
| `OPENAI_BASE_URL` | No | Omit in Vercel Production. `https://api.openai.com/v1` is the only production override accepted by preflight. | Explicit SDK base URL; CI uses a localhost stub. This is validated to prevent accidental key forwarding. |
| `ATLAS_CONVERSATION_MODEL` | No | Defaults to `gpt-5.6-sol`; set explicitly if operational policy requires it. | Streamed conversation model. |
| `ATLAS_BACKGROUND_MODEL` | No | Defaults to `gpt-5.6-terra`. | Conversation-title model. |
| `ATLAS_DAILY_SOFT_LIMIT_USD` | No | Positive number; default `10`. | Owner-visible daily usage warning. |
| `ATLAS_MONTHLY_HARD_LIMIT_USD` | No | Positive number not below the daily limit; default `150`. | Server-enforced monthly generation ceiling. |

`NODE_ENV`, `VERCEL`, `VERCEL_ENV`, `VERCEL_URL`, and related platform values
are Vercel-owned. Do not add or override them in Project Settings. CI alone uses
`OPENAI_BASE_URL=http://127.0.0.1:4010/v1`; it is not a deployment setting.

## Create and migrate the production database

1. Create a new Neon project or a new empty database intended solely for this
   Atlas deployment. Place it in AWS US East to match `iad1`.
2. Enable branch protection on the production branch before production use.
3. Copy the pooled connection string (`-pooler` hostname) with
   `sslmode=require`. Keep it out of shell history, source control, and chat.
4. Create an ignored `.env.production.local` containing the production values
   from `.env.example`. This file must never be committed.
5. Validate the complete production contract without printing values:

   ```bash
   node --env-file=.env.production.local --experimental-strip-types \
     scripts/check-deployment-env.mjs
   ```

6. Confirm in Neon that the selected database is empty. Do not use this fresh
   procedure on a schema that already contains Atlas tables.
7. Apply the committed Drizzle history once:

   ```bash
   node --env-file=.env.production.local \
     node_modules/drizzle-kit/bin.cjs migrate
   ```

8. Run the read-only ledger/schema verification:

   ```bash
   node --env-file=.env.production.local --experimental-strip-types \
     scripts/check-database-readiness.mjs
   ```

The verifier requires all five migration hashes, all sixteen application tables,
and the F1 security constraints. It never writes to the database. Migrations
must never run as part of `next build` or application startup.

## Configure Vercel

1. In the new Vercel project, add the required Production variables from the
   inventory. Mark secrets Sensitive.
2. Set `DATABASE_ENVIRONMENT=production` only in Production.
3. For Preview, create a separate Neon branch/database, migrate it independently,
   set its pooled URL, and set `DATABASE_ENVIRONMENT=preview`. Never give a
   Preview deployment the production URL. If no isolated Preview database is
   ready, leave Preview runtime configuration absent so private routes fail closed.
4. Do not set `AUTH_URL` for the generated `vercel.app` domain. Auth.js v5 uses
   the current trusted request host, which also keeps Preview URLs correct.
5. Confirm the project root is the repository root and the production branch is
   `main`. Do not add custom output or install commands.

## Repository gate before deployment

Run from a clean checkout:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm format:check
corepack pnpm test
DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder \
  corepack pnpm db:check
corepack pnpm build
```

Database integration and Playwright suites use disposable databases and local
model/email fixtures; follow CI for their complete fixture setup. A passing
GitHub Actions run is required before production deployment.

## Deploy

1. Push the reviewed commit to `main` and wait for GitHub Actions.
2. Trigger the new Vercel project's Production deployment through Git integration.
3. Confirm the build used Node 24, pnpm 11.18.0, Next.js defaults, and no custom
   output directory.
4. Keep the generated `vercel.app` domain until the smoke tests pass.
5. Attach a custom domain only after the generated deployment is healthy.
   `AUTH_URL` still remains unnecessary unless a nonstandard auth base path is used.

## Post-deployment smoke tests

1. Open `/`, `/brain`, `/settings`, and a random `/c/<uuid>` while signed out.
   Every private route must redirect to `/sign-in`.
2. Submit an unauthorized mailbox. The UI must show the neutral check-email page
   and Resend must not send a message.
3. Submit `OWNER_EMAIL`; confirm a real email arrives, its link uses the current
   HTTPS deployment host, expires after 15 minutes, and can be redeemed once.
4. Reload `/settings`; confirm the database session persists and the exact owner
   address is shown. Inspect the session cookie in browser tools: Production must
   use Auth.js's Secure, HTTP-only cookie behavior over HTTPS.
5. Open `/brain`. On a new database, enter the exact protected initialization
   phrase once. Confirm 11 active canon documents, three projects, six knowledge
   records, one disclosed conflict, and honest planned-capability labels.
6. Send a harmless conversation. Confirm streaming, persistence after reload,
   generated title, Brain context trace, and model-usage record.
7. Send a request from a browser with an invalid Origin or while signed out;
   `/api/conversations/turns` must return 403 or 401 respectively.
8. Confirm `/manifest.webmanifest`, `/sw.js`, icons, and the offline page load.
   Verify private HTML/RSC responses are not stored in Cache Storage.
9. Inspect response headers for CSP, HSTS, frame denial, content-type protection,
   referrer policy, and permissions policy. Private routes must not be publicly cached.
10. Inspect Vercel runtime logs for authentication, database, or model failures.
    Expected client cancellation may create a stream-closed event; completed and
    interrupted turns must still persist correctly.

## Rollback and observability

Vercel runtime/build logs plus Atlas's structured model-event logs are the
initial observability baseline. They cover build errors, request failures,
database exceptions, model status/latency/token usage, and persistence outcome
without logging prompts, responses, API keys, connection strings, or hidden
reasoning. Auth.js/Resend dashboards provide email-provider evidence.

Application rollback is a Vercel deployment rollback. Database migrations are
forward-only by default: never improvise a destructive rollback. Before any
future production migration, create a restorable Neon branch/restore point,
review the SQL, migrate before promoting the compatible application artifact,
and retain the recovery point through smoke testing.

## Known residual risks

- Real Resend delivery, DNS verification, and one-time redemption require the
  founder's production mailbox and cannot be proven by repository fixtures.
- The CSP still permits inline script/style execution required by the current
  Next.js application. It denies third-party script, object, frame, and network
  origins; tightening to nonces is a future measured hardening task.
- Existing legacy/shared Neon branches remain blocked. This runbook makes no
  claim that their absent migration ledgers are repaired.

