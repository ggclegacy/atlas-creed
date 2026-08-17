# ATLAS CREED
## Proposed Phase 2 Build Plan — Atlas Lives

**Status:** Proposed for owner review; not authorized for implementation  
**Prepared:** 2026-08-17  
**Scope:** Phase 2 planning only  
**Governing documents:** `CLAUDE.md`, `docs/ATLAS_V1_BUILD_PLAN.md` Revision 3,
`docs/ATLAS_DESIGN_SYSTEM_V1.md`, `docs/canon/ATLAS-CREED-BIBLE.md`, and
`docs/product/V1-PRODUCT-DEFINITION.md`

No Phase 2 code, package, migration, service, Vercel setting, or environment
variable has been changed by this plan.

---

# 1. Outcome

Phase 2 makes Atlas usable for private, persistent conversation on phone and
desktop. The owner can start a thread, see a response stream quickly, stop it,
reload it, and continue with recent context. The experience must look and behave
like Atlas Creed, while OpenAI remains a replaceable engine behind an
Atlas-owned boundary.

Phase 2 does **not** give Atlas canon, retrieval, learned memory, projects, files,
voice, tools, web research, autonomous actions, agents, or multi-model routing.
Atlas must never imply that any of those systems exist.

The objective test is:

> The owner can have a secure, multi-turn, interruptible, durable conversation
> with Atlas in production, and the application can prove which model ran, what
> happened to the turn, how long it took, and what raw usage it consumed.

---

# 2. Repository findings that change the original Phase 2 assumptions

## 2.1 Current baseline

- `main` and `origin/main` point at `ff1ff0b`, `Launch direct-access Phase 1 shell`.
- The application is Next.js 16.3.1, React 19.2.8, strict TypeScript, Node 24,
  Drizzle, Neon HTTP, Vitest, and Playwright.
- The production project is `atlas-creed`, deployed in `iad1` with Neon intended
  to be co-located there.
- The shell is deliberately public. It has no auth route, proxy, guard, or
  session lookup. `/settings` explicitly says `Direct access` and
  `Authentication: Not configured`.
- The first migration already contains `owners`, `conversations`, `messages`,
  `system_events`, and unused Auth.js adapter tables. `messages.content` is
  JSONB, but its TypeScript type is currently `unknown[]`.
- The provider import boundary and environment access boundary already exist and
  are enforced by ESLint and architecture tests.
- `lib/model/types.ts` is a Phase 0 contract shaped around the approved
  Anthropic plan. It is not production-complete for OpenAI Responses.
- The ratified tokens, shell, PWA, security headers, responsive rail/drawer, and
  smoke-test foundation are present.
- CI runs typecheck, lint, format, Vitest, build, and a separate Playwright job.
  The Playwright job still declares inert Phase 1 Auth.js fixture variables even
  though auth code was removed; milestone 2A must replace or remove them based
  on the approved access method rather than treating them as working auth.

## 2.2 Security contradiction — implementation blocker

The product definition says V1 is private and authenticated. The current shell
is intentionally public only because it has no private data, mutations, or
billable model endpoint. Phase 2 changes all three facts.

Phase 2 must not expose conversations or an OpenAI-backed POST endpoint without
an access-control boundary. `robots: noindex` is not access control. An obscure
URL is not access control. A client-only check is not access control. Rate
limiting alone is not access control.

**Recommendation:** make access control milestone 2A and block production model
calls until the owner chooses one of these:

1. Restore the approved, portable, single-owner application authentication.
   Magic link remains the approved design, but it can wait until the domain move
   if email delivery is the constraint.
2. Use Vercel Deployment Protection as a documented temporary boundary if the
   current team plan supports production password protection and the installed
   PWA/browser flow is acceptable. Verify that it protects pages and API routes,
   and test the production custom/generated domains. This is simpler but
   platform-coupled.
3. Design and approve a minimal application-level passphrase/session gate. This
   avoids email DNS but means deliberately owning credential hashing, session
   signing, brute-force protection, CSRF posture, rotation, and recovery. It is
   not automatically safer merely because it looks simpler.

If the owner declines every access-control option, Phase 2 may be developed only
in a protected preview/local environment and **must not ship to public
production**.

The access choice also determines how the single `owners` row is provisioned and
how every request obtains a trusted `ownerId`. Do not add a public fallback owner
or accept `ownerId` from the browser.

## 2.3 Approved-plan assumptions that do not carry forward unchanged

- OpenAI replaces the planned Anthropic adapter for the first active provider.
- OpenAI prompt caching is not Anthropic's explicit four-breakpoint scheme. A
  cache hit on turn two is therefore a metric, not a Phase 2 correctness gate.
- OpenAI private reasoning is not a portable message content block and must not
  be exposed or treated as Atlas-owned history.
- Atlas-owned Postgres, not OpenAI Conversations or response chaining, is the
  authoritative conversation store.
- A DB-editable identity in Phase 2 is premature. A version-controlled,
  centralized prompt is safer until the Brain/configuration surface exists.
- Rolling conversation summaries create another paid model write path and a
  new source of silent context corruption. They belong with the approved later
  conversation/memory work, not in the first conversational milestone.

---

# 3. Current official platform findings

These findings were checked against current official documentation on
2026-08-17. Model availability, pricing, and platform limits must be rechecked at
implementation start because they are operational facts, not permanent canon.

## 3.1 OpenAI

- The [current model guide](https://developers.openai.com/api/docs/guides/latest-model)
  identifies the GPT-5.6 family. `gpt-5.6-sol` is the frontier quality choice;
  `gpt-5.6-terra` is the balanced intelligence/cost choice.
- The [Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses)
  is the recommended primitive for new reasoning, streaming, structured-output,
  and future tool-capable applications.
- Responses streaming provides semantic events such as response creation, text
  deltas, completion, and errors; see
  [Streaming Responses](https://developers.openai.com/api/docs/guides/streaming-responses).
- Responses are stored for a limited period by default; `store: false` disables
  application response storage. OpenAI Conversation objects have different
  persistence semantics. Chaining with `previous_response_id` still carries and
  bills prior input; see
  [Conversation state](https://developers.openai.com/api/docs/guides/conversation-state).
- Raw hidden reasoning is not exposed. Reasoning summaries, when requested, are
  summaries rather than chain-of-thought. Stateless continuity may involve
  provider-specific encrypted reasoning items; see
  [Reasoning](https://developers.openai.com/api/docs/guides/reasoning).
- Structured output is supported by Responses and the official server-side
  JavaScript SDK, including schema parsing; see
  [Structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
  and [SDKs](https://developers.openai.com/api/docs/libraries).
- Prompt caching exists, but its rules and usage fields are OpenAI-specific.
  GPT-5.6 supports automatic/implicit behavior and current explicit controls;
  cache reads and writes have different economics. See
  [Prompt caching](https://developers.openai.com/api/docs/guides/prompt-caching).
- API keys must remain server-side. Separate OpenAI projects/limits for
  production and non-production are preferred. See
  [Production best practices](https://developers.openai.com/api/docs/guides/production-best-practices),
  [Safety best practices](https://developers.openai.com/api/docs/guides/safety-best-practices),
  [Rate limits](https://developers.openai.com/api/docs/guides/rate-limits), and
  [Error codes](https://developers.openai.com/api/docs/guides/error-codes).

## 3.2 Vercel

- Next.js App Router Route Handlers can stream responses from Vercel Functions.
  The current route should use Node, not Edge. See
  [Streaming Functions](https://vercel.com/docs/functions/streaming-functions).
- App Router functions can export `maxDuration`; actual allowed duration depends
  on plan/project configuration and Fluid Compute. See
  [Function duration](https://vercel.com/docs/functions/configuring-functions/duration)
  and [Fluid Compute](https://vercel.com/docs/fluid-compute).
- The current `atlas-creed` project is configured for Next.js and Node 24, with
  a ready production deployment and `iad1` fixed in `vercel.json`.
- The team plan and production Deployment Protection entitlement were not
  exposed by the read-only project metadata. They must be verified before the
  access-control decision and before setting a duration value.

---

# 4. Recommended model and configuration

## 4.1 Model recommendation

Use **`gpt-5.6-sol` for `conversation`** at Phase 2 launch. Atlas is a
single-owner, quality-first personal intelligence environment; Phase 2 is where
the owner decides whether Atlas is worth preferring to a general assistant.
Choosing the current frontier model is more aligned with that test than
optimizing a still-small volume of daily turns.

Use **`gpt-5.6-terra` for `background`** title generation. Titling is bounded,
structured, low-risk work where the balanced model is appropriate. This is a
static role-to-model mapping, not intelligent routing. If the owner prefers the
simplest possible launch, both roles may point to Sol. If cost/latency evidence
later favors Terra for conversation, the model ID changes in configuration, not
at call sites.

Do not use the moving `gpt-5.6` alias for production audit records when a stable
documented model ID is available. Store the model ID returned/used for every
call. Before implementation, confirm both IDs are available to the existing
OpenAI project and recheck the official model pages.

Initial reasoning recommendation:

- `conversation`: `low` effort. It gives the model room to reason while
  preserving first-token latency for normal dialogue. Phase 7 dogfooding may
  compare `none`, `medium`, and higher effort using real Atlas work.
- `background`: `none` for titles.
- Do not request or display reasoning summaries in Phase 2.
- Set output limits intentionally per operation; do not use the model's maximum
  as a routine allowance.

## 4.2 Environment and source configuration

Required server-only additions:

```text
OPENAI_API_KEY
ATLAS_CONVERSATION_MODEL=gpt-5.6-sol
ATLAS_BACKGROUND_MODEL=gpt-5.6-terra
```

Do **not** add `ATLAS_MODEL_PROVIDER` while only one adapter can be selected. A
source-level registry maps both roles to the OpenAI adapter in Phase 2. When a
second provider actually exists, adding a validated provider selector becomes
useful rather than speculative.

Do not add `OPENAI_ORG_ID`, `OPENAI_PROJECT_ID`, public model variables, prompt
text, reasoning effort, token budgets, timeout, or title flags to the environment
without an operational need. Stable policy belongs in typed server source.
Secrets never use `NEXT_PUBLIC_`.

Production and Preview should use separate OpenAI project keys/limits if the
account supports that separation. Never copy a production key into an
untrusted preview scope. Environment parsing remains lazy so a static build does
not make a provider call or require secrets at import time.

---

# 5. Production `AtlasModel` boundary

Only files under `lib/model/providers/openai/` may import `openai` or refer to
OpenAI request/event types. `lib/model/` may own provider-neutral contracts and
registry code. UI, routes, persistence, context assembly, and conversation
services consume Atlas types only. The existing architecture guard should be
updated only as needed to keep this rule mechanically enforced.

The production contract should express results, not mirror any provider:

```ts
type ModelRole = "conversation" | "background";
type ReasoningEffort = "none" | "low" | "medium" | "high";

interface AtlasModelCapabilities {
  streaming: boolean;
  structuredOutput: boolean;
  reasoning: boolean;
  toolCalling: boolean;
}

interface AtlasGenerateRequest {
  role: ModelRole;
  instructions: readonly AtlasInstruction[];
  messages: readonly AtlasInputMessage[];
  maxOutputTokens: number;
  reasoning: { effort: ReasoningEffort };
  tools?: readonly AtlasToolDefinition[]; // empty/absent throughout Phase 2
}

interface AtlasGenerateOptions {
  signal: AbortSignal;
  operationId: string;
}

interface AtlasModel {
  readonly provider: string;
  readonly modelId: string;
  readonly capabilities: AtlasModelCapabilities;
  stream(
    request: AtlasGenerateRequest,
    options: AtlasGenerateOptions,
  ): AsyncIterable<AtlasModelEvent>;
  structured<T>(
    request: AtlasStructuredRequest<T>,
    options: AtlasGenerateOptions,
  ): Promise<AtlasStructuredResult<T>>;
}
```

`modelFor(role)` returns a configured instance and validates that the role's
model exists. It does not inspect prompt content, score tasks, fallback to
another model, or route dynamically.

Atlas-owned stream events should include:

- `generation_started`: normalized provider/model/response ID metadata.
- `status`: `thinking` or `responding`; never a reasoning transcript.
- `text_delta`: public assistant text only.
- `usage`: normalized raw counts.
- `refusal`: safe, explicit refusal metadata without provider internals.
- `completed`: normalized finish reason and final metadata.
- `error`: sanitized category, retryability, and public message.

Normalize finish reasons to `stop`, `length`, `cancelled`, `refusal`,
`content_filter`, `tool_call`, `error`, or `unknown`. `tool_call` is defined for
future compatibility but is an unexpected/error condition in Phase 2 because no
tools are registered.

Normalized usage fields:

```text
inputTokens
cachedInputTokens
cacheWriteInputTokens
outputTokens
reasoningTokens
totalTokens
```

Fields unsupported or unavailable for a call are `null`, not fabricated zeroes.
Provider request/response IDs are diagnostic metadata, not conversation keys.

Structured operations accept an Atlas/Zod schema and return validated data plus
normalized usage and finish metadata. Provider-specific schema conversion stays
inside the adapter.

---

# 6. OpenAI Responses adapter

## 6.1 SDK and request policy

- Add the official `openai` server SDK only when implementation is approved.
- Pin an exact SDK version in `package.json`/lockfile. Renovation is deliberate:
  read release notes, replay adapter fixtures, run the live smoke test, then
  update the pin.
- Use `responses.stream`/the current SDK Responses streaming primitive, not Chat
  Completions or Assistants compatibility APIs.
- Set `store: false` on every Phase 2 request.
- Map Atlas identity/behavior to Responses instructions and Atlas message blocks
  to provider input inside the adapter.
- Pass the request's `AbortSignal` to the SDK/fetch layer.
- Configure SDK automatic retries to **zero** for conversation and title calls.
  A user may explicitly submit again after a visible failure. Do not duplicate a
  billable generation because a network failure made the result ambiguous.
- Set an adapter timeout shorter than the verified Vercel duration, preserving
  at least 20–30 seconds for cancellation and final persistence.

## 6.2 Event mapping and validation

The adapter handles response-created metadata, public text deltas, completion,
usage, refusal/incomplete states, and provider errors. Unknown events may be
ignored only when documented as non-terminal and covered by a fixture; an
unknown terminal shape is `malformed_provider_response`.

On completion, validate all of the following before emitting `completed`:

- a terminal provider state exists;
- a normalized finish reason can be produced;
- public output is present unless the response is a refusal or valid empty
  structured result;
- usage parsing tolerates absent optional detail fields;
- structured results pass their Zod schema;
- no tool request is accepted in Phase 2.

Map SDK/HTTP failures into Atlas categories: `invalid_request`,
`authentication`, `permission`, `rate_limit`, `timeout`, `connection`,
`provider_unavailable`, `refusal`, `malformed_response`, `cancelled`, and
`unknown_provider_error`. Preserve HTTP status and provider error code in
server-only diagnostic fields where safe. Do not send raw provider bodies or
stack traces to the browser.

Capture request IDs from the SDK/headers and the Responses ID when available.
Rate-limit headers may inform a user-facing cooldown but must not trigger an
automatic model retry.

## 6.3 OpenAI-managed state decision

**Atlas Postgres is authoritative.** Phase 2 does not use OpenAI Conversation
objects, does not rely on `previous_response_id`, and does not retrieve old
responses from OpenAI to rebuild a thread.

Reasons:

- provider independence and future switching;
- full export, deletion, and restore under Atlas control;
- consistent owner scoping and provenance;
- explicit context-window policy rather than a hidden provider chain;
- predictable UI/history even if provider retention changes;
- no second source of truth.

The adapter may store response/request IDs for incident correlation. A later,
measured optimization may evaluate response chaining, but it may not become the
only continuation mechanism.

## 6.4 Reasoning artifacts

Phase 2 stores **no private reasoning text**, no hidden chain-of-thought, and no
provider-encrypted reasoning payload in `messages.content`.

- The UI may show the truthful state `Thinking`, not what the model is thinking.
- `reasoningTokens` may be recorded in usage.
- Reasoning summaries are not requested by default and are not rendered.
- Use the current GPT-5.6 setting that limits reasoning relevance to the current
  turn when available and supported by the selected model. Manual Atlas history
  supplies prior public conversation content.
- If a future provider optimization requires opaque encrypted artifacts, keep
  them in a provider-scoped continuation store with expiry/versioning, never in
  the portable Atlas message envelope and never as the sole history.

This deliberately trades provider-specific reasoning carryover for portability,
privacy, and a clean Phase 2 state model.

---

# 7. Phase 2 identity and pure context assembly

## 7.1 Identity

Create one version-controlled, server-only identity definition, for example
`lib/atlas/identity.ts` or `prompts/atlas-identity.ts`. Do not scatter identity
sentences across routes. Do not put it in Postgres yet.

Keep it concise—roughly 300–600 tokens—and include only:

- name: Atlas Creed, normally Atlas;
- role: the owner's primary AI counterpart and thinking partner;
- calm, sharp, capable, strategically minded communication;
- concise when appropriate and deep when necessary;
- respectful challenge rather than blind agreement;
- separate facts, assumptions, estimates, recommendations, and uncertainty;
- never claim memory, retrieval, tools, actions, external checks, or knowledge
  that the current request did not actually supply;
- do not pretend to be human or expose/claim hidden reasoning;
- ask a focused question when a missing owner decision materially changes the
  answer.

Defer owner biography/preferences, companies, projects, canon, source
precedence, retrieval instructions, memory behavior, permissions/tools, and
external knowledge to their approved later phases.

## 7.2 `assembleContext()`

`assembleContext(input) -> AtlasGenerateRequest` is pure, synchronous, and
provider-independent. No DB reads, environment reads, timestamps, random IDs,
SDK types, or network calls occur inside it.

Its Phase 2 input shape should already separate future layers:

```text
identity
behavioralStandards
ownerProfile?          absent in Phase 2
coreCanon?             absent in Phase 2
projectContext?        absent in Phase 2
conversationHistory
retrievedContext?      absent in Phase 2
currentUserMessage
availableTools         empty in Phase 2
contextBudget
```

The Phase 2 output contains stable identity/behavior instructions, a
deterministically selected recent history, and the current user message. Golden
snapshots prove ordering and exact bytes. The OpenAI adapter alone converts that
request to Responses input.

## 7.3 Long-conversation policy

Do not summarize in Phase 2. Summaries are model-generated memory-like artifacts
that require versioning, inspection, correction, and another paid call. The
approved build plan's `conversation_summaries` remains a later milestone.

Use a deterministic context budget:

1. Reserve space for identity, current input, and expected output.
2. Walk completed/interrupted public messages newest-to-oldest.
3. Include whole messages until the conservative input budget is reached; never
   split a message silently.
4. Restore chronological order before generation.
5. Exclude failed/empty/generating messages and all diagnostic/provider data.
6. If older turns were omitted, insert a truthful Atlas-owned instruction that
   earlier turns exist outside the supplied context and must not be claimed as
   remembered.

Use a provider-neutral conservative estimator initially, clearly named as an
estimate and tested at boundaries. Exact provider token counting can later be a
capability outside the pure assembly policy. The UI still shows the full durable
history even when only a recent window reaches the model.

---

# 8. Conversation persistence model and migration plan

Create one additive Phase 2 migration only after approval. Do not rewrite or
delete the applied Phase 1 baseline.

## 8.1 Portable message content

Retain JSONB, but replace unvalidated `unknown[]` at application boundaries with
an Atlas-owned, versioned envelope:

```json
{
  "version": 1,
  "blocks": [
    { "type": "text", "text": "Public message text" }
  ]
}
```

Phase 2 writes only validated public `text` blocks. The envelope can later add
Atlas-owned citation, attachment, image, tool-call, and tool-result blocks
without flattening history or changing every row. Provider wire blocks and
private reasoning do not enter this envelope. Reads validate JSONB with Zod;
invalid historical data fails visibly rather than being cast blindly.

## 8.2 `conversations`

Keep existing fields and add:

- `last_message_at timestamptz not null`, backfilled from `updated_at`;
- an index on `(owner_id, last_message_at desc, id desc)`.

Do **not** add a duplicate `status` column. `archived_at is null/not null` already
expresses the only Phase 2 conversation lifecycle. Keep `title` nullable in the
schema, but write a deterministic fallback on the first turn so normal rows do
not remain untitled.

## 8.3 `messages`

Keep existing IDs/FKs/role/content/model and add:

- `provider text` nullable for owner messages, required by service validation
  for generated assistant messages;
- `status text not null` with allowed values `pending`, `streaming`,
  `completed`, `interrupted`, `failed`; backfill existing rows as `completed`
  before enforcing the constraint;
- `client_turn_id uuid` nullable only for legacy/pre-Phase-2 rows and required by
  Phase 2 service validation for every new user/assistant turn;
- `started_at`, `completed_at` nullable timestamps;
- `finish_reason text` nullable;
- `error_code text` nullable, containing a safe category only;
- `provider_response_id text` nullable for diagnostics.

Add a unique index on `(conversation_id, client_turn_id, role)` to make a
browser retry/double-submit idempotent while allowing one owner row and one
assistant row per turn. Add an owner/conversation/order index using
`(owner_id, conversation_id, created_at, id)` for scoped cursor pagination.

The migration must wrap any legacy top-level content arrays as
`{"version":1,"blocks":...}` after validating/mapping their known text shape, or
fail explicitly on an unknown shape. It must not blindly cast historical JSON.

Roles remain `user`, `assistant`, and reserved `system`; Phase 2 persistence
writes user/assistant only. Status invariants are enforced in the service and,
where practical, SQL checks: owner messages complete immediately; only assistant
messages enter generation states.

## 8.4 `model_usage`

Add one request ledger/usage table:

```text
id uuid primary key                 operation ID
owner_id uuid not null
conversation_id uuid nullable
message_id uuid nullable
purpose text not null               conversation_turn | conversation_title
role text not null                  conversation | background
provider text not null
model text not null
status text not null                started | completed | cancelled | failed
request_id text nullable
response_id text nullable
input_tokens bigint nullable
cached_input_tokens bigint nullable
cache_write_input_tokens bigint nullable
output_tokens bigint nullable
reasoning_tokens bigint nullable
total_tokens bigint nullable
finish_reason text nullable
error_code text nullable
latency_ms integer nullable
time_to_first_token_ms integer nullable
started_at timestamptz not null
completed_at timestamptz nullable
```

Use `bigint` for provider counters. Add indexes for owner/time, conversation/time,
and message. Each model operation inserts `started` before the provider call and
updates the same row terminally. This supports rate checks and records cancelled
or failed calls even when no final usage arrives.

Do not store a mutable estimated dollar total as the source of truth. Pricing
changes and cache details evolve. Raw usage is durable; a later cost view can
apply a versioned price table. If estimated cost is ever persisted, also store
the price basis/version.

## 8.5 Tables deliberately not added

No `atlas_config`, `conversation_summaries`, `retrieval_traces`, `projects`,
canon, memory, file, tool, vector, or provider-conversation table in Phase 2.
Identity stays in versioned source. A specialized turn table is unnecessary
while `client_turn_id` and message/usage statuses express the lifecycle.

Migration verification must include applying the full migration chain to an
empty DB, applying Phase 2 to a Phase 1-shaped DB, constraint/index inspection,
and a documented rollback/forward-fix rehearsal on a disposable Neon branch.
Production migration remains an explicit, inspected operation—not part of
`next build`.

---

# 9. Turn lifecycle, streaming, interruption, and recovery

## 9.1 Normal turn

1. Authenticate/protect request and derive trusted `ownerId` server-side.
2. Validate body, content length, UUID/idempotency key, and conversation
   ownership. Reject archived conversations.
3. Enforce one active turn per conversation and the approved per-owner rate
   policy.
4. In one transaction: create the conversation if this is the first send; write
   the completed owner message; write the pending assistant placeholder; insert
   `model_usage(status=started)`; update `last_message_at`.
5. Emit `turn.started` with Atlas IDs, then mark assistant `streaming`.
6. Load scoped completed/interrupted history, assemble pure context, and start
   the OpenAI stream with the request signal.
7. Normalize provider events to Atlas SSE events. Emit a truthful `thinking`
   state, then public text deltas immediately.
8. Buffer text and checkpoint the assistant envelope at a bounded cadence (for
   example every 1–2 seconds and at least 1 KiB of change) so a function death
   loses at most a small suffix without writing per token.
9. On normal completion, transactionally write final assistant content/status,
   terminal usage/finish metadata, and conversation timestamps.
10. Emit `turn.completed`. If this is the first completed exchange, schedule the
    bounded title operation without blocking the visible answer.

Do not hold a database transaction open while the model streams.

## 9.2 Server stream protocol

Use a Node Route Handler returning a Web `ReadableStream` as Server-Sent Events.
The browser uses `fetch` plus a stream reader because the request is POST and
must be abortable. Headers should prevent caching/transformation and identify
UTF-8 SSE.

Atlas-owned events:

```text
turn.started
assistant.status       receiving | thinking | responding
assistant.text.delta
assistant.checkpoint   optional metadata, not full private content
assistant.completed
assistant.interrupted
turn.error
stream.keepalive       comment/event during silent reasoning
```

Every event carries an event schema version, operation ID, and sequence number
so the client can reject duplicates/out-of-order frames. No OpenAI event name or
payload crosses the route boundary.

## 9.3 Cancellation

During generation, Send becomes Stop. `Esc` also stops on desktop. The client
calls `AbortController.abort()`. The route observes `request.signal` and passes
it to the adapter.

Save partial public text and mark it `interrupted`; this matches what the owner
actually saw, preserves conversational truth, and enables later continuation.
If no text arrived, keep a failed/interrupted audit row but omit it from the
rendered conversation and model context. Usage may be null on cancellation if a
terminal provider usage event never arrived; never estimate it as zero.

An HTTP disconnect and an intentional Stop can look identical to the server.
Phase 2 labels both `INTERRUPTED` rather than claiming a cause it cannot prove.
No stream resume protocol is promised. Reload returns the latest durable
checkpoint and terminal state.

## 9.4 Failure matrix

| Failure | Required behavior |
|---|---|
| Owner message DB write fails | No provider call; inline retryable database error; draft retained. |
| Provider fails before text | Assistant `failed`, usage `failed`; render a conversation error, exclude empty assistant from model context. |
| Provider fails after text | Persist partial text as `failed`, show the partial with failure note and Copy; no automatic model retry. |
| User cancels/client disconnects | Abort provider; persist buffered text as `interrupted`; terminal usage only if supplied. |
| Function terminates abruptly | Checkpoints remain; stale `pending/streaming` records are reconciled to `interrupted`/`abandoned` on the next scoped conversation access or turn. |
| Final DB write fails after generation | Perform only a bounded idempotent DB finalization retry; never re-run the model. If still failing, send `persistence_failed`, retain client text for Copy, and leave the latest checkpoint visible on reload. |
| DB finalizes but client disconnects | Durable completed/interrupted state wins; reload shows it. |
| Context exceeds policy | Reject before provider call with actionable `context_too_large`; preserve draft. |
| OpenAI rate limit | Show a cooldown/retry action using safe header data; no automatic call retry. |
| Timeout | Abort before Vercel's hard limit, persist partial, mark failed/interrupted, report timeout. |
| Refusal | Persist public refusal text/status and normalized refusal finish reason; do not disguise it as a system failure. |
| Malformed/empty completion | Mark failed, persist any safe public text, capture request IDs, show retry action. |

Manual regeneration/retry of an old turn is deliberately deferred unless the
implementation can preserve an unambiguous turn lineage. Phase 2 error UI may
let the owner re-send retained draft text; it must not retry automatically.

---

# 10. Routes and server/client boundaries

Recommended Phase 2 shape:

```text
app/(atlas)/page.tsx                         blank/new conversation entry
app/(atlas)/c/[conversationId]/page.tsx      scoped durable conversation
app/api/conversations/turns/route.ts         new-thread streaming POST
app/api/conversations/[id]/turns/route.ts    existing-thread streaming POST
app/api/conversations/[id]/messages/route.ts older-message cursor GET
lib/conversation/*                           domain, validation, queries, lifecycle
lib/context/*                                pure assembly and budget policy
lib/model/*                                  contracts, registry, OpenAI adapter
components/atlas/*                           client stream, messages, composer
```

Two streaming paths may share one server-only `executeTurn` service; the only
difference is whether a conversation ID already exists. If Next routing makes a
single endpoint with an optional conversation ID clearer, prefer that and prove
both body variants with tests—do not duplicate business logic.

Server Components load the conversation list and initial message page through
owner-scoped services. The interactive transcript/composer is the smallest
necessary Client Component. Cursor pagination uses `(created_at, id)`, not
offsets. Archive/delete may use authenticated Server Actions with revalidation;
streaming stays a Route Handler. Hard delete requires an explicit confirmation
and can remain deferred if it would distract from the core loop; soft archive is
the Phase 2 navigation need.

All mutation paths re-check authentication/owner scope inside the service. UI
route protection alone is insufficient.

---

# 11. Conversation UX

## 11.1 New conversation and history

- `/` is the new-conversation composer; opening or tapping New does not write a
  row.
- The first valid Send creates conversation and messages atomically. The first
  stream event supplies the conversation ID; the client replaces the URL with
  `/c/{id}` without losing the active stream.
- No blank-row cleanup job is needed because blank rows are never created.
- Conversation navigation is newest-first by `last_message_at`, with stable ID
  tie-breaker, title, and compact timestamp.
- Opening a thread loads its newest message page; older pages load upward by
  cursor. Search is Phase 3+ evidence work, not Phase 2.
- Empty state is one restrained sentence plus the composer—no cards, mascot,
  examples carousel, or dashboard.
- Archive removes a thread from the default list without deleting it. Full
  delete/export can wait for the later data-management surface if not safely
  completed in Phase 2.

## 11.2 Titles

On first Send, persist an immediate deterministic fallback derived from the
first non-empty user text: normalize whitespace, remove markdown control noise,
cap by characters/words, and use `Untitled conversation` only if no usable text
exists. The owner never sees a list of `New Conversation` rows.

After the first **completed** assistant response, run one background Responses
structured-output call returning `{ title: string }`:

- use the configured background model, reasoning `none`;
- provide only the first user message and enough public assistant text to title
  it;
- require a short title (roughly 3–7 words, hard character cap);
- no automatic retry;
- record a separate `model_usage` row;
- validate and sanitize before update;
- on any error, keep the deterministic fallback;
- never block or fail the conversation stream because titling failed.

Use the current Next/Vercel post-response primitive only after verifying its
lifecycle and duration behavior; otherwise finalize the title before the
function exits but after the visible stream terminal event. Do not create a
client-exposed title endpoint.

This is a second paid call. Recommendation: approve it because titles are the
primary history navigation label and the operation is tightly bounded. Owner
may choose deterministic-only titles for Phase 2; the structured method should
still be adapter-tested for later background work. Manual rename can be added
later without blocking Phase 2.

## 11.3 Chat rendering

Follow the ratified asymmetric non-bubble design exactly:

- Owner: inset surface, 2px gold authority rule, left aligned, at most 60ch.
- Atlas: unbubbled prose on the base surface, 68ch, 16/26 editorial measure.
- Long responses are never collapsed.
- Code gets its own horizontally scrolling inset with a labelled Copy button.
- Tables use row hairlines and their own horizontal scroll container.
- Links are visibly identifiable, sanitized, open external targets safely, and
  never allow raw HTML/script execution.
- Blockquotes use the neutral leading rule; headings, lists, inline code, and
  fenced code maintain editorial rhythm.
- Partial/interrupted/failed output remains copyable and is marked in the
  instrument register.

Plan a safe Markdown stack that disables raw HTML and applies an explicit
sanitization/link policy. Incremental rendering must tolerate incomplete fences,
links, lists, and tables without throwing. Test XSS payloads and pathological
long code/table content.

## 11.4 Composer

- Grow from one to eight lines, then scroll internally.
- `Cmd/Ctrl+Enter` sends; Enter inserts a newline; preserve drafts on errors.
- Send is the only solid gold command and has a 44px minimum target.
- During generation, Send becomes Stop; composer stays editable for drafting the
  next thought but cannot submit another turn into the same conversation.
- `Esc` stops generation.
- Empty/whitespace, over-limit, offline, unauthenticated, and active-turn states
  explain why Send is disabled.
- Do not show microphone, attachment, slash/tool, or other dead controls. Voice
  is Phase 6 and attachments are later.

## 11.5 Truthful cognition and errors

Phase 2 states are `Receiving`, `Thinking`, `Responding`, `Interrupted`, and
`Failed`. Purple appears only while the provider is doing cognitive work. The
label says `THINKING` or `RESPONDING`; never `CONSULTING`, `RETRIEVING`,
`MEMORY`, `CANON`, or `TOOLS`.

The purple sweep respects reduced motion, becoming a static hairline with a
label. Streaming uses the gold write-head caret. Idle shows nothing.

Errors render inline at the failed turn and state what happened plus the next
legitimate action. Raw OpenAI language, request bodies, SQL, stack traces, and
secret/config details stay server-side. An API/system failure is not written in
Atlas's voice as though it were an intelligent answer.

## 11.6 Mobile acceptance

- Use `100dvh`; composer honors the bottom safe-area and remains visible above
  iOS/Android keyboards.
- No horizontal page overflow at realistic phone widths, 200% zoom, long code,
  or wide tables.
- All primary controls are at least 44×44px.
- Opening/closing the keyboard does not hide the latest turn or jump the page.
- Auto-scroll follows the write head only while the owner remains near the
  bottom. Any upward owner scroll immediately suspends it and reveals a Return
  to latest affordance.
- Stop remains thumb-reachable during a long stream.
- Navigation remains a drawer; the home screen is the composer.
- Draft and scroll position survive route navigation where feasible; reload
  restores durable messages and a safe draft, not an in-memory fake stream.
- The installed PWA exhibits the same behavior in portrait and does not break
  in landscape.

## 11.7 Desktop acceptance

- Preserve the 56px orientation rail and centered 68ch conversation column.
- Add restrained recent-conversation navigation without a permanent large SaaS
  sidebar. An overlay expansion may show titles; it must not shift the reading
  measure.
- `Cmd/Ctrl+Enter`, `Esc`, and logical focus order work.
- Do not build Projects, Brain, command search across unavailable systems, or a
  context pane. The layout may preserve the future zero-width region only.

## 11.8 Accessibility

- Transcript uses semantic article/section structure and proper heading order.
- Thinking is announced once. Do not announce every token. Buffer complete
  sentences for `aria-live=polite` or announce the completed answer; test the
  chosen behavior with VoiceOver and a second screen reader.
- Focus moves intentionally after navigation/send/error and returns correctly
  when the mobile drawer closes.
- Every icon control has an accessible name; status never depends on color.
- Reduced motion and 200% zoom remain part of E2E/manual acceptance.

---

# 12. Security and abuse controls

Phase 2 security gates:

- access control before any page data or model mutation;
- trusted server-derived `ownerId` on every query and mutation;
- no unscoped conversation/message query helper;
- OpenAI key and model configuration server-only;
- request JSON and user content hard limits; reject unsupported content types;
- one active generation per conversation and a conservative owner-level start
  rate derived from the request ledger;
- an owner-approved daily/monthly usage ceiling before unbounded dogfooding;
- CSRF/origin protection appropriate to the chosen auth/session method;
- Markdown raw HTML disabled and output sanitized;
- content security policy updated only for connections/assets actually needed;
- no full prompts, messages, response bodies, or secrets in info/error logs;
- provider request logging/data controls reviewed for private content;
- generic client errors with correlation IDs; detailed diagnostics server-only;
- Preview data/key isolation from Production;
- unauthorized and cross-owner behavior proved at service and route layers.

The free Moderation API may be evaluated, but a single-owner private thinking
tool does not need a generic moderation feature simply because it exists. The
non-negotiable controls are access, spend/abuse bounds, input limits, safe
rendering, and provider data-handling review.

---

# 13. Usage, caching, and observability

## 13.1 Caching

Do not build an application cache or copy Anthropic cache breakpoints into the
OpenAI adapter. Keep the stable identity at the start of input, order history
deterministically, and rely on documented OpenAI prompt caching initially.

Record cached-read and cache-write token details when supplied. `null` means
unavailable; zero means the provider explicitly reported no cached tokens. A
turn-two cache hit is **not** Phase 2 DoD because a short prompt may be below an
eligibility threshold, model behavior can differ, and cache state may be cold.
The useful gate is accurate usage normalization plus a measured cache report
over realistic repeated prefixes.

Do not enable explicit cache keys, retention, or paid cache writes until a small
implementation experiment demonstrates improved latency/cost for Atlas's actual
prefix. Any such knob remains inside the OpenAI adapter.

## 13.2 Minimal logs/metrics

For each operation, answer:

- operation ID, owner/conversation/message IDs;
- provider/model/role/purpose;
- started, first-token, completed timestamps and durations;
- status and normalized finish/error reason;
- raw usage and cache details;
- request/response IDs;
- whether the owner cancelled;
- last checkpoint and final persistence success.

Use structured server logs with identifiers/counters only. `model_usage` is the
durable ledger. `system_events` may record security-significant or persistence
incidents, but do not turn every text delta into an event. Sentry/custom APM and
an enterprise dashboard remain later decisions.

Operational alerts/manual checks for Phase 2: repeated provider auth failure,
rate-limit burst, stale generations, persistence failures, duration near the
function ceiling, and usage ceiling reached.

---

# 14. Testing strategy

## 14.1 Unit

- identity/context exact snapshots, layer ordering, deterministic budgets,
  omitted-history truth marker, and no future context layers;
- Atlas content-envelope validation and text extraction;
- OpenAI fixture event normalization, including split deltas, unknown events,
  refusal, length, empty/malformed completion, missing usage details, and
  request IDs;
- usage parsing with cached/write/reasoning detail combinations;
- abort propagation and normalized cancellation;
- title schema, sanitization, hard limits, and deterministic fallback;
- request/body/UUID validation and public error mapping;
- environment parsing and model role configuration;
- architecture guard: OpenAI imports fail everywhere outside the adapter.

## 14.2 Integration

Run against a disposable local/test Postgres or dedicated Neon test branch, not
Production:

- Phase 1-to-Phase 2 migration and constraints;
- owner-scoped create/list/open/archive/pagination;
- double-submit with the same `client_turn_id` creates one owner/assistant pair;
- normal lifecycle statuses, usage finalization, timestamps, and title update;
- cancel before/after first delta and partial persistence;
- provider failure before/after text;
- connection abort, checkpoint recovery, and stale-generation reconciliation;
- final DB failure never causes a second provider call;
- conversation continuation supplies only eligible recent public history;
- archived/cross-owner/unauthorized requests fail before provider invocation;
- rate/input/concurrent-turn limits.

Use a fake `AtlasModel`/recorded OpenAI fixtures. CI must make zero paid calls and
must not need a real OpenAI key.

## 14.3 E2E

With a protected test owner and deterministic fake provider:

1. unauthorized visitor cannot open history or POST a model turn;
2. owner opens Atlas and starts from the composer;
3. first Send creates one conversation and updates the URL;
4. text visibly streams rather than appearing at completion;
5. completed response persists across reload;
6. follow-up receives relevant recent history;
7. Stop aborts and leaves a visibly interrupted durable partial response;
8. conversation list orders newest-first and opens an old thread;
9. title fallback appears and validated automatic title may replace it;
10. provider/rate/network/DB errors are actionable and leak no internals;
11. phone viewport, safe area, keyboard, auto-scroll yield, long code/table, and
    Stop behavior meet mobile acceptance;
12. desktop keyboard/focus and constrained reading measure work.

## 14.4 Optional live-provider smoke

Create a manually invoked, non-CI smoke using a non-production OpenAI project
with a strict spend limit. It sends one tiny structured call and one short
stream, verifies model access, event mapping, cancellation, usage, and request
IDs, and stores no private production conversation. Run before production
release and SDK/model changes.

---

# 15. Vercel production plan

- `export const runtime = "nodejs"` on the streaming route; no Edge split.
- Verify Fluid Compute and the actual maximum duration in the current team/project
  immediately before implementation. Export an explicit `maxDuration` supported
  by that project; set OpenAI timeout lower with persistence reserve.
- Run a real preview test for first-byte latency, silent-thinking keepalives,
  abort propagation, client disconnect, and final DB writes. Local behavior is
  insufficient evidence for serverless lifecycle semantics.
- Preserve `iad1` and use the pooled Neon HTTP connection already present. Do
  not open a traditional long-lived pool.
- Make streaming responses non-cacheable. Do not route model output through CDN
  caching or a service worker response cache.
- Ensure `sw.js` never caches conversation/API responses or authenticated HTML.
- Validate Preview uses its own Neon branch and non-production OpenAI key/project.
- Add the three model variables only after implementation is approved and
  before the protected deployment test. Never reveal values in logs or the plan.
- Inspect current function duration/compute billing before launch. Streaming
  improves responsiveness; it does not make function time or model tokens free.
- Production release order: merge verified code, apply inspected Preview
  migration, test protected Preview, apply inspected Production migration,
  configure scoped secrets, deploy, run auth/stream/cancel/reload/usage smoke,
  and monitor runtime errors/usage. Each migration target is positively
  identified before applying.

---

# 16. Internal implementation sequence

## 2A — Resolve the privacy boundary and freeze contracts

**Objective:** establish the trusted owner boundary and approve departures
before a billable endpoint exists.

**Systems/files:** auth/deployment-protection decision, owner provisioning,
`lib/model/types.ts`, content schemas, route/error event schemas, ADR section in
this plan/operations docs.

**Tasks:** choose access control; define trusted `ownerId`; approve model IDs,
title-call policy, reasoning policy, Postgres authority, and usage ceiling;
finalize provider-neutral contracts and threat model.

**Tests/DoD:** unauthorized/cross-owner contract cases specified; OpenAI types
cannot cross the boundary; owner can explain how access is revoked/recovered.

**Risks:** shipping public spend/private data; inventing weak custom auth.

**Do not build:** model call, UI, migration, Phase 3 layers.

## 2B — Conversation domain and additive migration

**Objective:** durable, owner-scoped lifecycle before provider integration.

**Systems/files:** `lib/db/schema.ts`, one new migration, conversation content
and service modules, DB tests.

**Tasks:** add fields/indexes/table above; implement validated content envelope,
scoped queries, idempotent first-turn transaction, status transitions, cursor
reads, archive, stale reconciliation.

**Tests/DoD:** migration paths pass; lifecycle and owner isolation pass against
real Postgres; no provider dependency exists.

**Risks:** status drift, duplicated turns, production migration targeting.

**Do not build:** summaries, config table, search, projects, memory.

## 2C — OpenAI adapter behind `AtlasModel`

**Objective:** current Responses API works without leaking provider types.

**Systems/files:** exact `openai` dependency, `lib/model/providers/openai/*`,
registry/config, adapter fixtures/tests, env schema/example.

**Tasks:** pin SDK; implement stream/structured mappings, `store:false`, effort,
timeouts, zero retries, cancellation, errors/refusals, usage/request IDs; map
static roles to configured IDs.

**Tests/DoD:** recorded fixtures cover every terminal path; architecture guard
passes; optional live smoke proves the selected model IDs.

**Risks:** SDK event drift, model access, malformed terminal events.

**Do not build:** OpenAI Conversations, `previous_response_id`, tools, fallback,
routing.

## 2D — Pure identity and context foundation

**Objective:** Atlas speaks as Atlas with deterministic recent context.

**Systems/files:** centralized identity, `lib/context/*`, snapshots/budget tests.

**Tasks:** write concise Phase 2 identity; implement pure layering/windowing;
mark omitted history honestly; exclude nonportable/private/provider metadata.

**Tests/DoD:** exact snapshots stable; cutoff tests prove no false memory claim;
no DB/SDK/env dependency inside assembly.

**Risks:** oversized identity, accidental Phase 3 owner/canon claims, unstable
prefix.

**Do not build:** canon, retrieval, memory, project context, summaries.

## 2E — Streaming turn nervous system

**Objective:** one secure end-to-end streamed, cancellable, durable turn.

**Systems/files:** Route Handler(s), `executeTurn`, SSE schemas, checkpoint/final
persistence, fake model integration tests.

**Tasks:** implement validation/auth/rate/concurrency gates; lifecycle
transactions; stream encoder; keepalive; abort; checkpoint; failure matrix;
idempotent finalization.

**Tests/DoD:** stream begins before completion; Stop reaches fake provider;
normal/cancel/error/disconnect/final-write-failure paths persist correctly; no
automatic provider retry.

**Risks:** race between abort/finalization, excessive DB writes, Vercel death.

**Do not build:** reconnect/resume protocol, queue, background worker, tools.

## 2F — Conversation experience

**Objective:** the ratified Atlas chat, composer, history, and navigation work on
desktop and mobile.

**Systems/files:** `/`, `/c/[id]`, Atlas message/composer/stream components,
conversation list/drawer/rail, safe Markdown renderer, E2E tests.

**Tasks:** implement non-bubble transcript, composer, status/caret, Stop,
auto-scroll yield, safe Markdown/code/tables/Copy, list/pagination, new-thread URL
transition, archive, errors/accessibility.

**Tests/DoD:** deterministic E2E core loop passes at desktop and phone sizes;
screen-reader/reduced-motion/manual keyboard checks recorded.

**Risks:** mobile keyboard/safe-area bugs, token-by-token aria-live spam,
streaming Markdown instability.

**Do not build:** microphone, attachment, command palette across future data,
Projects/Brain.

## 2G — Titles, usage, and operational confidence

**Objective:** history is navigable and every external call is explainable.

**Systems/files:** title service/schema, usage queries, structured logs,
operations docs, error copy.

**Tasks:** deterministic fallback; approved background title call; usage
terminal updates; request correlation; stale/persistence checks; rate/usage
ceiling; cache measurement report.

**Tests/DoD:** title failure never harms chat; all call outcomes have ledger
rows; no content appears in normal logs; rate/ceiling behavior is explicit.

**Risks:** hidden second-call cost, post-response lifecycle, log leakage.

**Do not build:** usage dashboard, dynamic pricing engine, Sentry, retrieval
traces.

## 2H — Protected Vercel release and daily-driver hardening

**Objective:** prove the complete story on the actual production platform.

**Systems/files:** route duration/runtime config, scoped env documentation,
deployment runbook, Playwright/live smoke evidence.

**Tasks:** verify plan limits/Fluid Compute; test Preview; apply migrations by
confirmed target; configure scoped OpenAI vars; exercise phone/PWA/desktop;
deploy Production behind approved access; monitor errors/usage.

**Tests/DoD:** complete Phase 2 gate below passes in CI, protected Preview, and
Production; rollback/disable path documented.

**Risks:** wrong DB/key scope, deployment protection mismatch, duration ceiling,
production-only abort behavior.

**Do not build:** any Phase 3+ capability.

---

# 17. Exact Definition of Done — “Atlas Lives”

Phase 2 is complete only when all are objectively true:

1. The official OpenAI SDK version and chosen model IDs were revalidated against
   current official docs and account availability.
2. `AtlasModel` supports normalized streaming, structured output, effort,
   cancellation, finish/error/refusal, usage, and future capability declaration.
3. Only the OpenAI adapter imports/references OpenAI SDK/wire types; lint and a
   deliberately failing architecture fixture prove it.
4. Conversation/background model IDs are validated server configuration and do
   not appear at call sites.
5. Every provider request uses Responses with `store:false`, zero automatic
   retries, bounded output, explicit effort, abort, and a timeout below the
   verified Vercel limit.
6. Postgres is the sole authoritative thread state; continuation works without
   OpenAI Conversations or `previous_response_id`.
7. No private reasoning/chain-of-thought is displayed or stored; only public
   Atlas blocks and raw reasoning-token counts are retained.
8. The concise, centralized Phase 2 identity passes snapshots and contains no
   false canon/memory/retrieval/tool claims.
9. `assembleContext()` is pure/provider-neutral and deterministically windows
   recent history within budget.
10. The additive migration applies to clean and Phase 1 databases and creates
    only approved conversation/message/usage changes.
11. JSONB content uses a validated versioned Atlas envelope and Phase 2 writes
    public text blocks only.
12. First Send atomically creates one conversation, owner message, assistant
    placeholder, and usage operation; duplicate client turn IDs are idempotent.
13. Public assistant text appears incrementally before provider completion.
14. Stop and `Esc` abort end-to-end, retain visible partial text, and mark it
    `INTERRUPTED` across reload.
15. Normal, cancelled, provider-failed, disconnected, timed-out, stale-function,
    and final-DB-failed paths end in a defined durable status without a hidden
    model retry.
16. Completed conversations and messages survive reload, list newest-first,
    paginate, reopen, and continue with relevant recent public history.
17. Starting a new conversation creates no DB row until first valid Send.
18. An immediate deterministic title exists; if approved, the bounded structured
    title call updates it and failure leaves the fallback intact.
19. Every model operation—including titles, cancellations, and failures—has a
    raw usage/request ledger row with model/provider/role/timing and available
    token/request fields.
20. Prompt-cache read/write metrics are normalized and measured; no Anthropic
    cache assertion remains a false correctness gate.
21. Chat follows the ratified owner-inset/Atlas-unbubbled design; Markdown, code,
    tables, links, Copy, interrupted output, and errors render safely.
22. Composer multiline/keyboard/disabled/generating/Stop behavior matches the
    design system and exposes no dead microphone/attachment/tool controls.
23. Phone/PWA acceptance passes for safe area, keyboard, dynamic viewport,
    long-content overflow, auto-scroll yield, Stop reachability, drawer, text
    scale, reduced motion, and portrait/landscape integrity.
24. Desktop preserves the 56px rail, centered 68ch measure, keyboard controls,
    minimal history navigation, and no large SaaS sidebar.
25. Streaming accessibility is tested with real screen readers without
    token-by-token announcement.
26. Model/API/data routes are protected by the owner-approved access boundary;
    unauthenticated and cross-owner tests fail before provider invocation.
27. API input, concurrency, rate, and usage bounds are enforced; secrets and
    private conversation text do not appear in client bundles or normal logs.
28. CI uses a fake model/fixtures and completes with no paid call or OpenAI key;
    the optional live smoke uses a bounded non-production project.
29. Vercel Preview and Production prove Node streaming, explicit supported
    duration, abort, persistence, scoped Neon/OpenAI configuration, and no
    service-worker/API caching.
30. Typecheck, lint, format check, unit/integration tests, migration check,
    production build, and Playwright E2E are green.
31. Operations documentation explains migration order, secrets/scopes,
    disable/rollback response, rate/usage ceiling, and incident correlation.
32. No Canon, retrieval, memory, projects, files, voice, tools, web research,
    agents, routing, Brain, embeddings, or Phase 3+ UI/data was implemented.

---

# 18. Risks and owner decisions

## 18.1 Highest risks

| Risk | Control |
|---|---|
| Public endpoint leaks private data/spend | Access-control decision is milestone 2A and production gate. |
| Provider lock-in through hosted state | Postgres authority, `store:false`, no required response chain. |
| OpenAI types leak into domain/UI | Narrow directory boundary plus architecture test. |
| Cancellation loses or corrupts history | Status machine, bounded checkpoints, idempotent terminal update. |
| Ambiguous network failure duplicates spend | SDK retries zero; model never retried automatically. |
| Hidden reasoning becomes private data/UI | Store no reasoning text/encrypted payload; usage count only. |
| Infinite history/cost | Deterministic recent window and explicit omission marker. |
| Model/version drift | Exact pin/config, fixture suite, live smoke, stored model ID. |
| Streaming works locally but not Vercel | protected Preview test for duration, keepalive, abort, disconnect. |
| Final generation not durable | checkpoints, persistence reserve, idempotent DB-only retry, Copy fallback. |
| Markdown output executes unsafe content | raw HTML disabled, sanitize/link policy, XSS tests, CSP. |
| Title call becomes invisible cost/failure | separate usage row, no retry, deterministic fallback, owner approval. |
| Cache assumptions distort DoD/cost | measure OpenAI fields; no forced turn-two cache assertion. |
| Phase creep | explicit no-build list at every milestone and final gate. |

## 18.2 Decisions requiring owner approval before implementation

1. **Access boundary:** approved app auth, temporary Vercel protection, or a
   separately designed passphrase/session gate. No-access production is not
   recommended or approved by this plan.
2. **Owner provisioning:** how the trusted single owner row is created for the
   selected access method.
3. **Conversation model:** approve `gpt-5.6-sol` at `low` reasoning effort, after
   availability/current-doc recheck.
4. **Background model:** approve `gpt-5.6-terra` or use Sol for both roles.
5. **Title policy:** approve one bounded paid structured title call after the
   first completed exchange, or use deterministic-only titles for Phase 2.
6. **Usage ceiling:** choose initial daily/monthly provider budget and behavior
   when reached. It may be conservative and adjusted from real use.
7. **Interrupted output:** approve retaining visible partial text marked
   `INTERRUPTED` rather than discarding it.
8. **Reasoning policy:** approve no reasoning summaries/private reasoning
   storage and current-turn reasoning context for provider independence.
9. **History policy:** approve deterministic recent-window cutoff and defer
   summaries.
10. **Archive/delete scope:** soft archive in Phase 2; decide whether permanent
    delete/export must ship now or with the later data-management surface.

## 18.3 Explicit disagreements/changes from Revision 3

1. OpenAI Responses replaces the Anthropic/Claude implementation choice for the
   first provider, as directed by the Phase 2 brief.
2. The existing `AtlasModel` contract is revised rather than merely extended;
   its Anthropic-shaped thinking/cache fields are not portable enough.
3. `cache_read_input_tokens > 0` on turn two is removed from Phase 2 DoD. Correct
   normalization and realistic measurement replace it.
4. Reasoning blocks do not round-trip in portable message JSONB. Public Atlas
   blocks do; any future opaque provider continuation artifact is separate and
   non-authoritative.
5. OpenAI-managed state/response chaining is not used as authoritative history.
6. Identity is centralized and version-controlled in source for Phase 2, not
   runtime-editable in an `atlas_config` table.
7. Rolling summaries are deferred; Phase 2 uses a truthful deterministic cutoff.
8. `conversations.status` is rejected as duplicate state; `archived_at` remains
   the lifecycle signal.
9. A second paid title call is explicitly optional/owner-approved, with a
   deterministic fallback and separate usage record.
10. Authentication/access control is restored as a Phase 2 prerequisite because
    the actual repository intentionally removed it for the empty shell.

## 18.4 Deliberately deferred

Canon ingestion, Core/Extended Canon, owner profile, retrieval and traces,
projects, conversation summaries, persistent memory and proposals, Brain,
files/attachments, pgvector/embeddings, search, voice/microphone, tools/function
calling, web research, actions/permissions execution, agents, multi-provider
routing/fallback, realtime resume, notifications, proactive/background work,
usage dashboard, editable prompt/config UI, manual title rename, and intelligence
evaluation grounded in canon.

---

**Stop condition:** owner reviews and approves/changes the ten decisions above.
No Phase 2 implementation begins before that approval.
