# ATLAS CREED
## V1 Technical Architecture

> ⚠️ **SUPERSEDED.** This v0.1 sketch has been absorbed into
> [../ATLAS_V1_BUILD_PLAN.md](../ATLAS_V1_BUILD_PLAN.md), which is the
> authoritative technical plan. Kept for history only — do not build from it.

**Status:** Superseded v0.1 — not ratified
**Governs:** [../product/V1-PRODUCT-DEFINITION.md](../product/V1-PRODUCT-DEFINITION.md) Phases 1–4
**Canon:** [../canon/ATLAS-CREED-BIBLE.md](../canon/ATLAS-CREED-BIBLE.md) §22, §23, §31

This document specifies how V1 is built. It exists because V1 §42 says the
technical plan is defined separately, and Bible §33 requires implementation to be
governed by documents like this one rather than invented call by call.

Nothing here is implemented yet.

---

## 1. Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router)** | One language across client and server; streaming responses are first-class; route handlers give a clean API boundary without a second service. |
| Language | **TypeScript**, strict | One type system from schema to UI. |
| Database | **Postgres** (Neon) | Relational fits the memory model — memories supersede memories, conversations belong to projects. Serverless-friendly with branching for safe migrations. Swappable: it is plain Postgres, so migration is a connection string. |
| ORM / migrations | **Drizzle** | SQL-first, migrations checked into the repo, no engine binary in serverless. |
| Auth | **Auth.js v5**, single-address allowlist | V1 §33: one owner, but don't foreclose accounts later. Every table that holds owner data carries `owner_id` from day one. |
| File storage | **Vercel Blob** | Adequate for V1 §20. Behind a storage interface so S3 is a swap, not a rewrite. |
| Hosting | **Vercel** | Matches the framework; preview deploys per branch. |
| Model provider | **Anthropic**, Claude Opus 5 | Behind the abstraction in §5 below. |

Deliberately **not** in V1: vector database, queue, cache server, container
orchestration, second service. Each would be added when the loop demands it, per
V1 §47.

---

## 2. The retrieval decision

**V1 ships no retrieval system. The entire canon corpus goes into the cached
system prefix on every request.**

This contradicts a literal reading of V1 §15 ("Atlas should not inject the entire
knowledge base into every prompt") and is a deliberate, measured departure.

The economics, at Claude Opus 5 rates ($5/MTok input, cached reads at 0.1×):

| Canon seed | 50 msg/day | 150 msg/day | 300 msg/day |
|---|---|---|---|
| 50k tokens | $114/mo | $249/mo | $452/mo |
| 100k tokens | $199/mo | $409/mo | $724/mo |
| 200k tokens | $368/mo | $728/mo | $1,268/mo |

*(Cached reads plus cache writes. The cache is kept warm by real traffic at these
rates, so writes occur only at session starts — roughly five per day.)*

What that buys:

- **Zero retrieval misses.** The most common quality failure in retrieval systems
  is not retrieving the relevant thing. Atlas cannot miss what it always sees.
- **No embedding pipeline, no chunking strategy, no re-indexing** when a canon
  document is edited.
- **§16 source awareness becomes a citation problem, not a retrieval problem** —
  every source is present, so attribution is about labelling, not recall.
- Weeks of V1 engineering not spent.

**Build the interface anyway.** `retrieveContext()` exists from day one and
returns the full corpus. When the seed outgrows the window, its implementation
changes and nothing else does. This satisfies Bible §23 (avoid lock-in) without
Bible §31's warning about premature abstraction.

**Revisit when:** the seed exceeds ~300k tokens (context pressure, not cost), or
per-message cost outweighs answer quality. Not before.

---

## 3. Brain assembly

The single most important code path. Bible §22 and V1 §9 require the brain's
layers to stay distinguishable; prompt caching requires the stable ones to stay
byte-identical. Both constraints are satisfied by one ordering rule.

The API renders `tools` → `system` → `messages`. Caching is a **prefix match** —
any byte change invalidates everything after it. So the assembly is ordered by
stability, most stable first:

```
tools                     deterministic order, sorted by name
system[0]  Identity       who Atlas is, behavioral standards        frozen
system[1]  Owner profile  who Atlas serves                          frozen
system[2]  Canon corpus   all canon documents          frozen  ← cache breakpoint
messages[…] Conversation history                          ← cache breakpoint (last turn)
messages[n] role:"system" Retrieved memory + project context        dynamic
messages[n+1] role:"user" The current turn                          dynamic
```

Two rules follow, and both are load-bearing:

**Never interpolate anything volatile into `system`.** No timestamps, no session
IDs, no "current date", no conditional sections. A single mutable byte in
`system[0]` invalidates the entire canon corpus behind it and turns a $0.07
message into $0.52.

**Dynamic context rides in `messages` as a `role: "system"` message.** Claude
Opus 5 supports mid-conversation system messages with no beta header. This is how
memory reaches Atlas without touching the cached prefix — the instruction carries
operator authority, sits after the cached history, and invalidates nothing. It
must follow a user message and be either last in `messages` or followed by an
assistant turn.

Cache breakpoints (maximum four per request; two used):

1. End of `system[2]` — caches tools + identity + owner + canon together.
2. Last content block of the most recent completed turn — history accrues hits as
   the conversation grows.

**Verification is mandatory, not optional.** Every response logs
`usage.cache_read_input_tokens`. If it is zero across consecutive turns, a silent
invalidator has been introduced and the cost model above is void. This belongs in
the observability surface (§9), not in a comment.

---

## 4. Data model

Every table carries `owner_id` even though V1 has one owner — V1 §33 requires not
foreclosing multi-account, and retrofitting a tenancy column is far worse than
carrying an unused one.

```
owners            id, email, display_name, created_at

conversations     id, owner_id, project_id?, title, created_at, updated_at,
                  archived_at?

messages          id, conversation_id, role, content jsonb, model?, usage jsonb?,
                  created_at
                  -- content is the full content-block array, not a string.
                  -- Thinking blocks must round-trip unmodified on the same model;
                  -- flattening to text breaks multi-turn continuation.

canon             id, owner_id, slug, title, body, category, source_path?,
                  version, created_at, updated_at, archived_at?

memories          id, owner_id, category, content, confidence, status,
                  source, source_ref?, supersedes_id?, created_at, updated_at,
                  archived_at?
                  -- category: fact | preference | decision | goal | person |
                  --   company | project | principle | lesson | commitment |
                  --   correction
                  -- status:   active | superseded | archived
                  -- source:   owner_explicit | owner_confirmed | atlas_inferred |
                  --   canon_document | imported_file

memory_proposals  id, owner_id, conversation_id, content, category, rationale,
                  status, created_at, resolved_at?
                  -- status: pending | accepted | rejected

projects          id, owner_id, name, description, status, goals, created_at,
                  updated_at

files             id, owner_id, project_id?, filename, mime_type, size_bytes,
                  storage_key, extracted_text?, uploaded_at

action_log        id, owner_id, kind, authority_level, payload jsonb,
                  outcome jsonb, created_at
```

Three schema decisions worth defending:

**`supersedes_id`, not `UPDATE`.** Bible §6: correction should improve memory
without erasing accountability. A corrected memory writes a new row pointing at
the old one, and the old row flips to `superseded`. History survives. This is what
makes V1 §38's correction loop auditable rather than destructive.

**Canon lives in Postgres; `docs/canon/` is the seed, not a live mirror.** V1 §13
requires canon to stay editable and §14 requires ingestion without code changes —
both demand a database. An idempotent import script reads `docs/canon/*.md` on
first run and records `source_path`. After that the database is authoritative and
the brain view edits it. The markdown files are the historical origin, not a sync
target; pretending otherwise creates two sources of truth that silently drift.

**`action_log` exists in V1 even though V1 takes almost no actions.** Bible §21
makes auditability structural. A log added after the first consequential action is
a log missing the first consequential action.

---

## 5. Model layer

Bible §22 requires that Atlas not be architecturally confused with the model
powering him. Bible §31 warns against speculative architecture. The resolution is
a thin interface with exactly one implementation:

```ts
// lib/model/types.ts
export interface AtlasModel {
  readonly id: string;
  stream(req: AtlasRequest, signal: AbortSignal): AsyncIterable<AtlasEvent>;
}
```

**One call site.** No route handler, component, or memory routine imports
`@anthropic-ai/sdk` directly. Adding a provider means adding an implementation,
not auditing the codebase. That is the whole of §22's requirement at V1 scale.

Request defaults:

- `model: "claude-opus-5"`
- `thinking: { type: "adaptive" }` — set explicitly. It is Opus 5's default, but
  the explicit form documents the intent and survives a model swap.
- `output_config: { effort: "high" }` — the default; sweep `medium` and `low`
  once real usage exists, since both are unusually strong on this model.
- **Always stream.** Interruption (V1 §6) requires it, and `max_tokens` above
  ~16k risks HTTP timeouts without it.
- `max_tokens` sized with headroom: on Opus 5 thinking and response text share
  the budget, so a limit tuned for response length alone truncates mid-answer.

**No routing.** V1 §23 is explicit — one excellent model with excellent context
beats six models with weak context. The interface makes routing possible later;
V1 does not build it.

---

## 6. Memory pipeline

V1 §12 wants conservative automatic memory. V1 §45 requires Atlas to know
materially more after thirty days. If the only reliable write path is the owner
remembering to say "remember this," the primary success metric depends on owner
discipline — and the moments most worth remembering are exactly the moments he is
too deep in work to stop and annotate.

The resolution is a **proposal queue**:

```
capture   At conversation end, Atlas drafts candidate memories with a
          one-line rationale each. Nothing is written to `memories`.
             ↓
propose   Candidates land in `memory_proposals` as `pending`.
             ↓
resolve   The owner accepts or rejects in one pass. Accepting writes a
          `memories` row with source = owner_confirmed.
             ↓
supersede A correction writes a new row and flips the old to `superseded`,
          preserving history per §4.
```

This keeps quality high (V1 §12), removes the dependency on owner discipline
(V1 §45), and produces the provenance trail V1 §16 asks for as a side effect —
the accept/reject record *is* the confidence signal.

Explicit commands (V1 §11) bypass the queue and write directly with
`source = owner_explicit`, outranking anything inferred, per V1 §11's weighting
requirement.

---

## 7. Permission scaffolding

Bible §19 defines six authority levels. V1 exercises two of them and encodes all
six, because Bible §19 requires the distinction to exist *at the architecture
level* and retrofitting an authority model onto code that assumed none is a
rewrite.

```ts
type Authority =
  | "think"      // analyze privately                V1: implemented
  | "suggest"    // recommend an action              V1: implemented
  | "prepare"    // create but do not execute        V1: enum only
  | "ask"        // request authorization            V1: enum only
  | "execute"    // perform an authorized action     V1: enum only
  | "autonomous" // bounded, pre-authorized class    V1: enum only
```

Every entry in `action_log` records its `authority_level`. V1 writes only `think`
and `suggest` rows. The design system already maps these six levels to visual
weight, so the authority of an action is legible before it is taken.

---

## 8. Security

Bible §20: security cannot be bolted on. V1 baseline:

- **Auth on every route.** A single middleware matcher covering everything except
  the sign-in path — allowlist by matcher, never by exclusion.
- **Single-address allowlist.** Auth.js `signIn` callback rejects any address but
  the owner's. A correct password on the wrong account must fail.
- **Secrets in environment variables only.** No key reaches the client bundle. The
  Anthropic key is server-side exclusively; any `NEXT_PUBLIC_` prefix on a secret
  is a review failure.
- **Owner scoping in every query.** `owner_id` is a predicate, not a comment.
- **No secrets in prompts or memory.** Anything written into `system`, `messages`,
  or `memories` is durably persisted and readable back through the app. Credentials
  go in environment variables; they never become context.
- **Rate limiting on the chat route.** A runaway client loop against a metered API
  is a financial incident, not just a bug.

---

## 9. Observability

Bible §21 and V1 §35 — enough visibility to debug the brain. Per request, log:

| Field | Why |
|---|---|
| `input_tokens`, `output_tokens` | Cost attribution (V1 §36) |
| `cache_read_input_tokens` | **Zero across consecutive turns means the cache is broken and §2's cost model is void.** The single most important number in the system. |
| `cache_creation_input_tokens` | Distinguishes a cold start from a broken prefix |
| `stop_reason` | `max_tokens` means truncation; `refusal` needs handling before reading content |
| latency to first token | V1 §32 — the number the owner actually feels |
| memory reads / writes | Whether the loop is compounding (V1 §45) |

`stop_reason: "refusal"` must be checked **before** reading `content` — Opus 5's
safety classifiers can decline a request and return an empty or partial content
array with HTTP 200. Code that indexes `content[0]` unconditionally breaks.

---

## 10. Repository structure

```
app/
  (auth)/sign-in/
  (atlas)/                     authenticated shell
    page.tsx                   home — conversation entry (V1 §27)
    c/[id]/                    conversation
    brain/                     canon · memories · projects (V1 §37)
  api/
    chat/route.ts              streaming turn handler
    memory/route.ts            proposals: accept / reject
lib/
  brain/     assemble.ts       §3 — the prompt assembly path
             retrieve.ts       §2 — returns everything, for now
  model/     types.ts          §5 — the interface
             anthropic.ts      §5 — the only SDK import
  memory/    propose.ts capture.ts supersede.ts
  db/        schema.ts client.ts migrations/
  auth/      config.ts
docs/
  canon/     ATLAS-CREED-BIBLE.md + the knowledge seed
  product/   V1-PRODUCT-DEFINITION.md
  design/    DESIGN-SYSTEM.md tokens.css
  architecture/ ARCHITECTURE.md
```

---

## 11. Build order

Maps to V1 §42, with the two P0 corrections argued below.

| Phase | Ships | Done when |
|---|---|---|
| **1 — Skeleton** | Next.js + Drizzle + Neon + Auth.js + design tokens + deploy | The owner can sign in on his phone and see an empty, correct Atlas |
| **2 — Atlas Lives** | Model layer, brain assembly, streaming chat, persistence, interruption | Conversation works and feels fast |
| **3 — Atlas Knows** | Canon import, cached prefix, cache verification | `cache_read_input_tokens` is non-zero and Atlas answers from canon |
| **4 — Atlas Remembers** | Memory schema, proposal queue, explicit commands, corrections | A fact from week one surfaces correctly in week three |
| **5 — Brain View** | Read-only canon / memory / proposal inspection | The owner can see what Atlas believes without a database client |
| **6 — Atlas Organizes** | Projects, file upload, extraction | Project context reaches the brain |
| **7 — Atlas Speaks** | Voice input, spoken responses | Tap → speak → answer, on the phone |
| **8 — Daily Driver** | Use it. Log friction. Fix what matters. | — |

**Two departures from V1 §41's priority list, both argued:**

**Retrieval moves out of P0** — see §2. The interface ships in Phase 3; the
implementation waits for evidence it is needed.

**The brain view moves into P0** (Phase 5, before projects and files). V1 §37
places it in P1, but V1 §45 makes the thirty-day compounding test the primary
success metric, and that metric cannot be evaluated without seeing what Atlas
believes. It is the instrument for the single largest V1 risk. Functional beats
elaborate — a table and a search box qualify.

---

## 12. Open decisions

Per Bible §33, these are the owner's:

**01 — Neon vs. Supabase vs. Vercel Postgres.** Recommendation: Neon, for
branching. Low stakes; it is plain Postgres either way.

**02 — Sign-in method.** Recommendation: passkey, with email magic link as
recovery. A password on a single-owner system is a liability with no upside.

**03 — Voice provider.** Deferred to Phase 7 deliberately. Browser SpeechRecognition
is free and immediate; a hosted STT/TTS pair is better and costs money. Decide
against real usage, not in advance.

**04 — Whether the proposal queue ships in Phase 4 or waits.** It is my
recommendation (§6), not canon — V1 §12 asks only for conservative automatic
memory. If it feels like friction in practice, explicit commands alone are a
legitimate V1.
