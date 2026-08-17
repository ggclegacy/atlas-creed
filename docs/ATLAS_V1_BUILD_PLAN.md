# ATLAS CREED
## V1 Build Plan

**Status:** Revision 3 — awaiting final approval
**Supersedes:** `docs/architecture/ARCHITECTURE.md` (v0.1 sketch, absorbed here)
**Governed by:** [canon/ATLAS-CREED-BIBLE.md](canon/ATLAS-CREED-BIBLE.md) · [product/V1-PRODUCT-DEFINITION.md](product/V1-PRODUCT-DEFINITION.md)
**Nothing in this document has been implemented.** No code, no dependencies, no services, no migrations.

**Revision 2 changes:** Core/Extended Canon split with a retrieval interface from
day one · corrected cost model accounting for cache expiry between sessions ·
tiered cache prefix · review-by-exception memory proposals · refined canon
conflict precedence · magic-link auth (passkeys deferred) · Next.js 16.x, Node
throughout, no Edge split · background-model flexibility in the abstraction ·
evaluation suite moved to Phase 3.

**Revision 3 changes:** the **minimal project primitive moves to Phase 3**
(projects are now load-bearing for retrieval and Tier 2 caching; the richer
project *experience* stays in Phase 5) · **retrieval fallback and controlled
broadening** so a thin match set never silently reads as "no relevant knowledge
exists" · **live owner authority separated from canon mutation** as two distinct
decisions.

---

# PART I — ARCHITECTURE

## 1. Application stack

| Layer | Recommendation | Why this, for Atlas specifically |
|---|---|---|
| **Framework** | **Next.js 16.x** (current stable), App Router | Streaming is first-class, which the entire chat experience depends on. Server Components keep canon, memory, and keys server-side by construction rather than by discipline — Bible §20's server/client boundary becomes a framework property. One deployable unit. |
| **Language** | TypeScript, `strict: true` | One type system from Postgres schema to React props. Drizzle infers row types; Zod validates boundaries; they meet in the middle. |
| **Runtime** | **Node.js throughout.** No Edge runtime anywhere in V1. | Auth, middleware, API routes, and streaming all run on Node. An Edge/Node split creates two sets of constraints — different APIs, different debugging, different cold-start behavior — for a latency gain a single-owner product will never notice. **Introduce Edge only against a measured need.** |
| **Frontend** | React Server Components by default; Client Components only where interaction requires | Composer, streaming message list, voice control are client. Conversation lists, brain views, project pages are server-rendered. Less JS shipped means faster mobile launch — V1 §28 and §32. |
| **API** | Next.js Route Handlers, Node runtime | Streaming chat, memory, canon, projects, files. |
| **Styling** | Tailwind CSS v4, configured **from `docs/design/tokens.css`** | Tokens are already measured. Tailwind consumes them as CSS custom properties, so the design system stays the single source of truth. **No component library** — Bible §12 requires Atlas's own design language, and shadcn/MUI/Chakra each carry a visual dialect that fights it. |
| **Components** | Hand-built primitives on Radix UI unstyled behavior | Radix supplies accessible focus management, dialog semantics, keyboard behavior. We supply every pixel. |
| **DB access** | Drizzle ORM | SQL-first, migrations in the repo, types inferred from schema, no query-engine binary in a serverless bundle. |
| **Validation** | Zod | Every API boundary, every structured model output, every ingestion parse. |
| **Auth** | **Auth.js v5, email magic link**, single-address allowlist, DB sessions | See §13 — passkeys deferred until the WebAuthn provider is production-ready. |
| **State** | React state + Server Components. **No Redux/Zustand/Jotai.** | The only genuinely client-side state is the in-flight stream and composer draft. |
| **Package manager** | pnpm | Strict layout catches phantom dependencies; first-class on Vercel. |
| **Testing** | Vitest + Playwright, plus a **model evaluation suite** (§19) | |

Deliberately absent from V1: vector database, message queue, Redis, container
orchestration, GraphQL, microservices, component library, state library, Edge
runtime.

---

## 2. Vercel architecture

| Concern | Approach |
|---|---|
| **Frontend hosting** | Static assets and RSC payloads on Vercel's CDN. |
| **API / server functions** | Route Handlers as Node serverless functions, **single region co-located with the database** (`iad1`). Cross-region DB round trips dominate serverless latency far more than compute. |
| **Auth** | Node runtime, same as everything else. No Edge middleware. |
| **Streaming** | Route Handler returns a `ReadableStream`; the model SDK's stream is piped through as SSE. Client consumes via `fetch` + reader (not `EventSource` — we need POST bodies and abort). |
| **Interruption** | Client `AbortController` → request abort → server `signal` into the SDK call. V1 §6 requires cancellation; this is the mechanism. |
| **Environment variables** | Vercel env vars, scoped per environment, server-only. **Any `NEXT_PUBLIC_` prefix on a secret is a build-blocking review failure.** |
| **Preview deployments** | Every branch gets a preview pointed at a **Neon database branch**, never production. |
| **Production** | `main` → production, protected, required checks. |
| **Domains** | One custom domain, HTTPS enforced, HSTS. Cookies `Secure` + `HttpOnly` + `SameSite=Lax`. |

### The constraint that actually matters: function duration

A streaming response holds the function open for the entire generation, and a
high-effort turn with adaptive thinking can run for minutes.

1. **Verify the ceiling on our plan before Phase 2 ends.** Set `maxDuration`
   explicitly on the chat route; never rely on the default.
2. Keep interactive turns inside the budget.
3. Emit stream keepalives — a silent thinking phase can look like a dead
   connection to intermediate proxies.
4. **The first time Atlas needs work that outlives a request** — scheduled
   briefings, bulk ingestion, long agentic runs — **that is the trigger to add a
   queue and worker**, not a reason to build one now.

### What should not run on Vercel

| Component | Where | Why |
|---|---|---|
| Database | Neon | Serverless functions cannot hold connection pools; Neon's pooler is built for this |
| Object storage | Vercel Blob (V1) → S3-compatible later | Behind a `StorageAdapter` interface |
| Long-running / scheduled work | Deferred entirely | See trigger above |
| Vector search | **Nowhere in V1.** Later: `pgvector` in the same Neon database | No separate vector service, ever |
| Error tracking | Sentry | Serverless logs are ephemeral |

---

## 3. Database

**Postgres on Neon.** The domain is relational: a memory supersedes a memory, a
conversation belongs to a project, a file produces chunks, a proposal resolves
into a memory.

Neon specifically for **database branching per preview deploy** (every PR gets a
real DB copy — the difference between testing memory migrations safely and
testing in production), serverless-native pooling, PITR, and `pgvector`
available later as an extension with **no new service**. It is plain Postgres;
migration elsewhere is a connection string.

**Postgres full-text search (`tsvector` + GIN) is the V1 retrieval substrate** —
see §6. Also zero new infrastructure.

Storage map: everything in Postgres except file bytes (Vercel Blob), with file
metadata in Postgres.

---

## 4. Memory architecture

### Canon vs. memory

| | **Canon** | **Memory** |
|---|---|---|
| Origin | Deliberately authored and ratified | Learned through interaction |
| Authority | Authoritative until explicitly changed | Weighted by source and confidence |
| Volume | Bounded by curation | Grows with use |
| Lifecycle | Versioned, edited deliberately | Created, superseded, archived |

Canon is what Atlas was *taught*. Memory is what Atlas *learned*.

### Categories

`fact · preference · decision · goal · person · company · project · principle ·
lesson · commitment · correction` — a closed enum. An open string field becomes
an unmanageable taxonomy within weeks.

### Record fields

`content · category · source · source_ref · confidence · status ·
supersedes_id · project_id · timestamps`

- **source:** `owner_explicit` · `owner_confirmed` · `atlas_inferred` ·
  `canon_document` · `imported_file`
- **status:** `active` · `superseded` · `archived`

### The write pipeline — review by exception

The design constraint from the owner: **memory maintenance must not become
another job.** An inbox the owner must clear constantly is a failed design, and
it will be abandoned by week two. But V1 §12's quality bar and the invariant that
inference never silently becomes authoritative both still hold.

Resolution: **three paths, with the primary growth path inside the conversation
rather than in a queue.**

```
┌─ PATH 1 — Explicit command ────────────────────────────────────────┐
│  "Remember this" · "Make this official" · "This is important"      │
│  · "Going forward, always…"                                        │
│                                                                     │
│  → written immediately, source = owner_explicit, confidence = high  │
│  → no queue, no review                                              │
└─────────────────────────────────────────────────────────────────────┘

┌─ PATH 2 — In-conversation confirmation ────────────────────────────┐
│  Atlas asks, at the moment of relevance, only when the item is      │
│  consequential or conflicting:                                      │
│    "That contradicts what I have for Q3 — should I update it?"      │
│                                                                     │
│  Owner says yes → written immediately, source = owner_confirmed     │
│                                                                     │
│  This is the review-by-exception path, and it is where most         │
│  non-explicit memory should be ratified — in context, when the      │
│  owner already has the subject loaded, not in a queue later.        │
└─────────────────────────────────────────────────────────────────────┘

┌─ PATH 3 — Silent proposal ─────────────────────────────────────────┐
│  Everything else inferred at conversation end.                      │
│                                                                     │
│  → memory_proposals, surfacing = silent                             │
│  → NOT injected as context, NOT authoritative, NOT surfaced in      │
│    normal UI, NO badge, NO nag                                      │
│  → visible only when the owner deliberately opens the Brain         │
│  → reviewable in batch, whenever, or never                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Surfacing rules

Each proposal carries `surfacing`, computed at capture:

| Value | When | Behavior |
|---|---|---|
| `blocking` | Conflicts with an active memory or canon entry | Atlas asks in-conversation before proceeding |
| `surface` | Category is `decision`, `commitment`, or `principle` — consequential by nature | Atlas mentions it once, in one sentence, at the end of the turn |
| `silent` | Everything else | Accumulates quietly in the Brain |

**The default is `silent`.** If tuning is required, tune toward silence. A system
that asks about everything is the inbox problem wearing a different hat.

### The invariant that survives

**Nothing is ever written as `atlas_inferred` + `active`.** Inference produces
proposals. Authority comes from the owner — explicitly (Path 1), or confirmed in
conversation (Path 2). This is the entire defense against uncontrolled automatic
memory, and it is unchanged.

### Why this still satisfies the 30-day test

Growth comes from Paths 1 and 2, which happen naturally in conversation. Path 3
is a **safety net for what wasn't flagged**, not the primary mechanism. If the
30-day evaluation (§19) shows knowledge is not compounding, the fix is to make
Atlas better at recognizing implicit ratification in Path 1 — not to start
nagging.

### Correction and supersession

`UPDATE` is never used to change a memory's meaning. A correction writes a **new
row** with `supersedes_id`; the old row flips to `superseded`. History survives —
Bible §6's requirement that correction improve memory without erasing
accountability.

Hard delete exists and is exposed in the Brain, for content that should not
persist at all (mistakenly captured secrets, private third-party information).
Distinct from archiving.

### Do memories need embeddings?

**No, not in V1.** A memory is one fact — call it 40 tokens; 1,000 active
memories is 40k tokens, filterable relationally and cheap to include. Relational
filtering (status, category, project, recency) is *more precise* than similarity
for the queries that matter.

**Trigger to revisit:** active memory exceeds ~3,000 records or ~120k tokens, or
deterministic retrieval demonstrably misses.

---

## 5. Knowledge: Core Canon and Extended Canon

### The split

The 1M context window is not permission for uncontrolled growth. Canon divides
into two tiers, declared in frontmatter:

**Core Canon** — genuinely universal context that should accompany Atlas
everywhere:

- Atlas identity and behavioral principles
- Core owner profile
- Foundational owner preferences
- Critical operating principles
- Anything Atlas must never be without

**Extended Canon** — everything that is not universally relevant:

- Company knowledge
- Project knowledge and history
- People
- Detailed standards
- Historical material
- Long-term reference

### Core Canon is budgeted, and the budget is enforced

**Target: ≤ 25,000 tokens. Hard warning at 40,000.**

`pnpm knowledge:import` computes the Core Canon token total and **fails the
build above the hard limit**, with a report of the largest contributors. A budget
that is not enforced by a script is a wish, and Core Canon will grow to fill
whatever space it is given.

When Core Canon presses the limit, the answer is to demote entries to Extended,
not to raise the ceiling.

### Source format

Markdown with YAML frontmatter — human-authorable, diff-able, reviewable in a PR.

```markdown
---
slug: owner-communication-preferences
title: Communication Preferences
tier: core                 # core | extended
category: owner            # owner | company | project | standard | ecosystem | history
authority: canon           # canon | reference
company: null              # for filtering
project: null              # for project association
keywords: [tone, writing, feedback]
version: 1
supersedes: null
---

Body in Markdown.
```

`tier`, `category`, `company`, `project`, `keywords`, and `authority` are the
**retrieval keys** (§6). They are metadata with a job, not decoration.

### Repository structure

```
docs/knowledge/
  core/           identity · owner profile · principles · preferences   (tier: core)
  companies/      one directory per company                             (tier: extended)
  projects/       one file per project                                  (tier: extended)
  standards/      design · communication · brand · software · quality   (mixed)
  ecosystem/      what Atlas is, the vision, planned Atlas systems      (mixed)
  history/        lessons, historical context, prior decisions          (tier: extended)
```

### Ingestion

`pnpm knowledge:import` walks `docs/knowledge/`, parses frontmatter, upserts into
`canon_entries` keyed on `slug`, records `source_path`, bumps `version`, builds
the `tsvector` search column, and enforces the Core budget. **Idempotent.**

**No chunking in V1.** Canon documents are hand-authored and bounded; an Extended
Canon entry is retrieved and injected whole. Chunking arrives with arbitrary
uploaded files (Phase 5), where document size is not under our control.

### Canonical vs. reference

`authority: canon` is authoritative until explicitly changed. `authority:
reference` is context Atlas should know that carries less weight. This drives
precedence (§8) and honest answers — *"you explicitly decided this"* versus
*"we discussed this, but I don't believe we made it final."*

### Seed documents stay in the repo

The repo is the **origin**, not a live mirror. After import the database is
authoritative, because the Brain edits canon at runtime (V1 §13, §14).

This creates real drift risk, managed explicitly: the import script reports
per-entry divergence between file and DB, and **refuses to overwrite runtime
edits without `--force`.** Canon also exports losslessly back to this format
(§20), so the round trip closes.

### Provenance

Every entry carries slug, title, tier, category, authority, version, and
`source_path`, rendered into the prompt as a labelled block header so Atlas
attributes claims to named sources rather than asserting them unattributed.

---

## 6. Retrieval

### Position

**V1 ships no vector database and no embeddings. V1 does ship a real retrieval
interface, used from Phase 3 onward, backed by deterministic mechanisms.**

The objective: no premature vector infrastructure, but retrieval architecture
exists from the beginning, so adding semantic search later changes one
implementation and nothing else.

### The three-tier context prefix

This is the central design, and it is what makes the economics work:

```
┌─ TIER 1 — Core Canon ──────────────────────── CACHED, always ──────┐
│  Identity · behavioral standards · owner profile · core            │
│  preferences · critical operating principles                        │
│  ≤25k tokens, budget-enforced                     ← breakpoint 1    │
└─────────────────────────────────────────────────────────────────────┘
┌─ TIER 2 — Active project context ─────────── CACHED, per-thread ───┐
│  The conversation's project record, goals, status, and its          │
│  project-scoped Extended Canon.                                     │
│  Stable for the whole conversation → cacheable    ← breakpoint 2    │
└─────────────────────────────────────────────────────────────────────┘
┌─ Conversation history ─────────────────────── CACHED, rolling ─────┐
│  Recent verbatim turns + rolling summary          ← breakpoint 3    │
└─────────────────────────────────────────────────────────────────────┘
┌─ TIER 3 — Retrieved, query-specific ───────── UNCACHED ────────────┐
│  Extended Canon matched to this turn + active memories,             │
│  injected as a role:"system" message after the cached prefix        │
└─────────────────────────────────────────────────────────────────────┘
```

**Tier 2 is the insight.** Project context is stable for an entire conversation,
so it belongs in the cached prefix rather than in the retrieved payload. Retrieved
tokens bill at full input price; cached tokens at 0.1×. Moving stable context out
of Tier 3 and into Tier 2 is a ~10× cost reduction on those tokens, and it is
free — the data was already known at conversation start.

### The retrieval interface

```ts
// lib/retrieval/types.ts
export interface RetrievalQuery {
  ownerId: string;
  conversationId: string;
  projectId?: string;
  text: string;                 // the current turn
  recentContext?: string;       // last N turns, for term extraction
  tokenBudget: number;
  include: Array<"canon" | "memory" | "chunk">;
}

export interface RetrievedItem {
  kind: "canon" | "memory" | "chunk";
  id: string;
  title: string;
  content: string;
  authority: "canon" | "reference" | "memory";
  score: number;
  reason: string;               // WHY this was retrieved — see below
  broadenLevel: 0 | 1 | 2 | 3 | 4;   // 0 = precise match; >0 = broadened
  tokens: number;
}

export interface RetrievalResult {
  items: RetrievedItem[];
  tokensUsed: number;
  strategy: string;             // "deterministic" | "hybrid" | "semantic"
  broadenedTo: 0 | 1 | 2 | 3 | 4;    // highest level reached
  confidence: "strong" | "partial" | "weak" | "none";
  trace: RetrievalTrace;        // levels attempted, considered, rejected
}

export interface Retriever {
  retrieve(q: RetrievalQuery): Promise<RetrievalResult>;
}
```

**`reason` and `trace` are not optional.** Without them, "why didn't Atlas know
that?" is unanswerable, and retrieval quality cannot be improved because it
cannot be observed. The Brain surfaces both.

### V1 implementation: `DeterministicRetriever`

No embeddings. Signals, in priority order:

| Signal | Mechanism |
|---|---|
| **Project association** | Exact FK match on `project_id` — highest precision available |
| **Explicit reference** | Message names a known slug, company, project, or person |
| **Category / company filter** | Derived from the active project or named entities |
| **Full-text search** | Postgres `tsvector` + GIN over canon body, title, keywords, and memory content; `ts_rank` for scoring |
| **Authority** | `canon` outranks `reference`; explicit memory outranks confirmed |
| **Recency** | Tiebreak, and a mild boost for recently updated entries |
| **Token budget** | Greedy fill by score, hard stop at budget; never silently overflow |

Postgres full-text search is genuinely good at the queries that dominate here —
named entities, project vocabulary, domain terms. It is exact where semantic
search is fuzzy, and it requires no infrastructure we don't already run.

### Fallback and controlled broadening

**A narrow or empty result set must never silently read to Atlas as "no relevant
knowledge exists."** That is the worst failure mode available to this
architecture: Atlas answers from the model's general priors while sitting on
canon that would have answered correctly, and neither the owner nor the logs show
anything wrong. Precision without a fallback produces confident, well-formed,
sourceless answers — exactly the failure Bible §28 and §29 forbid.

Retrieval therefore runs as a **ladder**. It stops at the first level that
produces a sufficient set, and every level is deterministic.

| Level | Signal | Intent |
|---|---|---|
| **0 — Precise** | Project FK match · explicit slug/entity reference · high-scoring full-text | The normal path |
| **1 — Adjacent** | Active project's **company** · sibling categories · same-company Extended Canon | Same neighborhood |
| **2 — Related** | Shared keywords · entries referenced by level 0–1 hits · supersession lineage | Structurally connected |
| **3 — High authority** | `authority: canon`, `tier: extended`, ordered by authority then recency, regardless of topical match | "What would a careful person always want to know here?" |
| **4 — Recent** | Recently created or updated canon entries and active memories | Last resort — recency as a weak relevance proxy |

**Escalation triggers** (any one advances a level):

- zero items returned
- fewer than the minimum viable set (default 3)
- top score below the relevance floor
- total retrieved tokens below ~20% of budget — a strong signal the match set is
  thin rather than efficiently precise

**Termination:** the ladder stops when the minimum viable set is met, when the
token budget is filled, or when level 4 is exhausted. It never runs past level 4,
and it never exceeds the budget — **broadening widens the net, it does not raise
the ceiling.**

Every broadened item is subject to the same rules as a precise one:

- **Token budget** — the hard cap is unchanged; broadened items compete for the
  same space and lose to higher-scoring precise items
- **Source attribution** — same labelled headers, same provenance
- **`reason`** — records the level and signal, e.g. `broadened:company` or
  `broadened:authority`
- **`retrieval_trace`** — records every level attempted, what each returned, and
  why escalation occurred

### Telling Atlas the truth about retrieval confidence

`RetrievalResult.confidence` is rendered into the injected context block. When
retrieval is `weak` or `none`, Atlas is told so explicitly, and instructed to say
he has nothing specific rather than reasoning from general knowledge as though he
does.

This is what converts a retrieval miss from a **silent** failure into a
**visible** one. Atlas saying *"I don't have canon on this specifically — here's
related context on the company"* is a correct answer. Atlas confabulating a
plausible answer is not, and without this signal the two are indistinguishable
from the outside.

It also connects directly to the evaluation suite: **uncertainty is one of the
Phase 3 eval dimensions**, and this is the mechanism that makes it testable.

### The upgrade path

`HybridRetriever` implements the same interface, adding `pgvector` similarity to
the existing signals and fusing scores. **Context assembly does not change** — it
calls `retrieve()` and receives `RetrievedItem[]`. Swapping the implementation is
a constructor change.

Triggers for the upgrade, in order of likelihood:

1. **File ingestion (Phase 5)** — arbitrary uploaded documents are unbounded and
   have no curated metadata; this is the strongest case for embeddings
2. Extended Canon exceeds ~150 entries and full-text recall degrades
3. Retrieval trace shows relevant entries consistently ranked below the budget cut
4. Active memory exceeds ~3,000 records

### Corrected cost model

**Two errors in Revision 1 are corrected here.**

**Error 1 — cache expiry between sessions was ignored.** Revision 1 assumed a
continuously warm cache. A real workday has gaps; every session start re-pays the
cache *write* on the entire prefix.

| Prefix size | One write | 10 sessions/day | Monthly (writes only) |
|---|---|---|---|
| 25k tokens | $0.156 | $1.56 | **~$47** |
| 50k | $0.312 | $3.12 | ~$94 |
| 150k | $0.938 | $9.38 | **~$281** |
| 200k | $1.250 | $12.50 | ~$375 |

A 150k always-injected prefix costs ~$281/month in writes alone — a cost that
was completely invisible in Revision 1. **This is the strongest cost argument for
bounding Core Canon.**

**Error 2 — retrieval was assumed to be cheaper. It is not, by itself.**
Retrieved content sits after the cache breakpoint and bills at full input price:
10× a cached token.

| Configuration | $/message |
|---|---|
| Full 150k canon, all cached | $0.0950 |
| Naive split: 25k core cached + 15k retrieved | **$0.1075** *(worse)* |
| **Tiered: 25k core + 20k project, both cached + 8k retrieved** | **$0.0825** |

Break-even for a naive split is `F = C + 10R` — with 25k core and 15k retrieved,
retrieval only wins on cost once total canon exceeds **~175k tokens**.

**Realistic monthly** (10 sessions/day, 5-minute TTL, ~3 project-prefix writes/day):

| Configuration | 80 msg/day | 150 msg/day | 250 msg/day |
|---|---|---|---|
| Full 150k injected | $509 | $709 | $994 |
| Naive split (retrieved uncached) | $305 | $531 | $853 |
| **Tiered core + project cached** | **$256** | **$429** | **$677** |

**Conclusions:**

1. **Tiering beats both alternatives**, because project context is
   conversation-stable and therefore cacheable.
2. **Bounding Core Canon matters more than retrieval does** at V1 scale — the
   write cost on a large prefix dominates.
3. **The V1 case for retrieval is not cost.** Below ~175k tokens of canon, full
   injection is cheaper and has perfect recall. The case is context discipline,
   architectural readiness, and keeping the prefix small enough that session
   writes stay cheap. That case is sound; the cost case arrives later.
4. **TTL choice is minor at Core Canon size** ($47/mo at 5m vs $30/mo at 1h).
   Decide with real session-gap data in Phase 7, not now.

### Reranking

Not in V1. It fixes noisy candidate sets; deterministic retrieval over curated
metadata produces small, precise sets. Revisit alongside embeddings.

---

## 7. AI model layer

### The abstraction

```ts
// lib/model/types.ts
export type ModelRole = "conversation" | "background";

export interface AtlasModel {
  readonly id: string;
  stream(req: AtlasRequest, signal: AbortSignal): AsyncIterable<AtlasEvent>;
  structured<T>(req: AtlasRequest, schema: ZodSchema<T>): Promise<T>;
}

export function modelFor(role: ModelRole): AtlasModel;
```

`AtlasEvent` is our own discriminated union — `text_delta`, `thinking_start`,
`tool_use`, `usage`, `done`, `error` — **not** a re-export of provider types. The
wire format stops at the adapter boundary. A lint rule fails any provider SDK
import outside `lib/model/`.

### V1 provider strategy

**Claude Opus 5 for conversation. One provider, one model, in V1.**

But `modelFor(role)` exists from day one, and **`background` resolves to Opus 5
in V1 by configuration, not by assumption.** Background operations — conversation
titling, memory extraction, classification, summarization — are lower-value calls
where a cheaper model may later be entirely adequate.

**Do not implement the optimization now.** Do ensure that when real usage
justifies it, the change is one config value rather than an audit of every call
site. The distinction costs nothing today and preserves the option.

Defaults: adaptive thinking set explicitly; effort `high` for conversation
(sweep `medium`/`low` in Phase 7); **always stream**; `max_tokens` sized with
headroom because thinking and response share the budget; **check `stop_reason`
before reading content** (safety classifiers can return HTTP 200 with empty or
partial content).

### Caching is part of the adapter's contract

The adapter places cache breakpoints (§8) and surfaces
`cache_read_input_tokens` on every response. Cache correctness is not an
optimization detail — it is the difference between $0.08 and $0.50 per message,
and it is the thing most likely to regress silently.

### Structured output, tools, fallback

Structured output (Zod in, validated object out) for proposals, titles, and
correction analysis — never parse JSON out of prose. Tool-calling shape exists
from Phase 2; **V1 registers zero tools**. No routing, no fallback in V1.

Every model call writes a `model_usage` row tagged with `purpose` and `role`.

---

## 8. Prompt and context assembly

### Ordering

The API renders `tools` → `system` → `messages`, and caching is a **prefix
match**. Assembly is ordered by stability:

```
tools                          deterministic order                     (empty in V1)
system[0]  Identity + behavioral standards          FROZEN
system[1]  Core owner profile + preferences         FROZEN
system[2]  Core Canon (≤25k, budget-enforced)       FROZEN   ← breakpoint 1
system[3]  Active project context + project canon   PER-THREAD ← breakpoint 2
messages[…] conversation history                              ← breakpoint 3
messages[n]   role:"system"  retrieved Extended Canon + memories   DYNAMIC
messages[n+1] role:"user"    the current turn                      DYNAMIC
```

Two load-bearing rules:

**Never interpolate anything volatile into `system`.** No timestamps, session
IDs, "current date", conditional sections, or name interpolation. One mutable
byte in `system[0]` invalidates every tier behind it.

**Dynamic context rides in `messages` as a `role: "system"` message.** It carries
operator authority, sits after the cached prefix, and invalidates nothing. It
must follow a user message and be either last in `messages` or followed by an
assistant turn.

Tier 2 is stable because a conversation belongs to at most one project — so the
project prefix is fixed for the conversation's life.

### Token budgets

| Layer | Budget | Cached |
|---|---|---|
| Identity + standards | ~2k | ✅ |
| Core owner profile | ~3k | ✅ |
| Core Canon | ≤20k (25k tier total, enforced) | ✅ |
| Active project context | ~15k | ✅ |
| Conversation history | ~30k | ✅ (rolling) |
| Retrieved Extended Canon | ~10k | ❌ |
| Retrieved memories | ~8k | ❌ |
| **Total** | **~88k of 1M** | |

Ample headroom, and deliberately far below the window — the window is a ceiling,
not a target.

### Precedence

| Rank | Source | Notes |
|---|---|---|
| 1 | **Explicit owner statement in the current conversation** | Governs the current conversation immediately |
| 2 | **Canon** (`authority: canon`) | Ratified and deliberate |
| 3 | **Explicit memory** (`owner_explicit`) | The owner said "remember this" |
| 4 | **Confirmed memory** (`owner_confirmed`) | Ratified in conversation |
| 5 | **Reference knowledge** (`authority: reference`) | Context, not doctrine |
| 6 | **Imported file content** | Unverified by definition |
| 7 | **Model general knowledge** | Atlas's world beats the model's priors |

### Conflict resolution — live authority and canon mutation are separate decisions

**This is the governing principle, and it resolves what would otherwise be a
contradiction between "canon outranks memory" (V1 §13) and "never sacrifice trust"
(Bible §28).**

Two questions look like one and are not:

1. **What governs this conversation, right now?**
2. **What should Atlas permanently believe?**

The owner answers (1) by speaking. Only the owner, deliberately, answers (2).
Conflating them produces one of two failures: stale canon forcing Atlas to
contradict a live correction, or a passing remark silently rewriting a ratified
decision. Both are unacceptable; separating the decisions avoids both.

#### Live authority — immediate, no permission required

**A clear current statement from the owner governs the live interaction
immediately, whatever canon or memory says.**

Atlas does not argue, does not defer to a stored value, and does not ask
permission to *act on what he has just been told*. Stale canon never forces Atlas
to contradict an explicit current correction.

#### Ordinary memory — supersede immediately, preserve lineage

When the statement corrects an ordinary memory, that is the normal path. Atlas
writes the replacement with `supersedes_id`, flips the old row to `superseded`,
and says so in one sentence. No permission needed — this is Path 1 or 2 from §4.
Lineage is preserved; nothing is destroyed.

#### Canon — surface, offer, never silently rewrite

When the statement conflicts with a canon entry, the live interaction still
proceeds under the owner's statement. **But canon is not touched without a
deliberate decision.** Atlas states the conflict, names the entry, and offers:

> "You've corrected this, so I'll treat the previous memory as outdated and work
> from what you've told me. It also conflicts with the current canonical company
> record — should I update Canon?"

Note the structure: **the correction is already in force** in the first clause;
the canon question is separate and asked second.

- **Owner confirms** → canon entry superseded, new version written, prior version
  retained, `system_event` recorded
- **Owner declines** → canon stands as the permanent record; the live
  conversation continues under the owner's statement; the disagreement is logged
  as a `system_event` so it is not lost
- **Owner doesn't answer** → the live statement still governs the conversation;
  canon is unchanged; the conflict remains visible in the Brain

Every branch is auditable, and no branch requires Atlas to contradict the person
in front of him.

#### Why this matters

Canon outranks memory *as a permanent record* — that is what makes it worth
having. It does not outrank the owner *in the moment*. A casual remark cannot
silently rewrite a deliberate decision, and a deliberate decision from six months
ago cannot override a correction made ten seconds ago. Both properties are
required; neither survives without this separation.

### Assembly is pure and testable

`assembleContext(input) → AtlasRequest` is a pure function: same inputs, same
bytes. This is what makes §19's golden snapshots possible, and those snapshots
are the regression guard on both behavior and cache economics.

---

## 9. Conversations

`conversations` (owner, optional project, title, timestamps, archived_at) and
`messages` (conversation, role, **content JSONB**, model, usage, created_at).

**Messages store the full content-block array, not flattened text.** Thinking
blocks must round-trip unmodified on the same model; flattening is very expensive
to undo later.

**Titles** generated by a cheap structured call after the first exchange
(`role: "background"`), fired after the stream closes, never blocking.

**Context window:** last ~20 turns verbatim + a rolling structured
`conversation_summaries` row (decisions, open questions, established facts,
current thread) covering everything older. Regenerated when the verbatim window
rolls past a threshold, not every turn. Stored, versioned, and **inspectable in
the Brain** — a bad summary is a silent context corruption and must be visible.

Provider-side compaction is evaluated in Phase 7 as a possible replacement; V1
owns summaries because they are also a product surface (what makes a conversation
resumable weeks later).

Cursor pagination on `created_at`. Archive is soft; delete is real and cascades,
with export offered first (§20).

---

## 10. Projects

Context containers, not project management. V1 §19 is explicit.

**Projects ship in two stages, and the split is deliberate.** `project_id` is the
highest-precision retrieval signal (§6) and the Tier 2 cache key (§8) — retrieval
does not work properly without it. So the *primitive* cannot wait for the
*experience*.

### Phase 3 — project as an intelligence and context primitive

The minimum required for retrieval and caching to function:

| Element | Phase 3 |
|---|---|
| `projects` table — id, owner_id, name, description, status, timestamps | ✅ |
| Project identity and title | ✅ |
| Description / context body — the text that enters Tier 2 | ✅ |
| Status (`active` · `paused` · `complete` · `archived`) — a retrieval filter, not a workflow | ✅ |
| `conversations.project_id` | ✅ |
| `canon_entries.project_id` — project-scoped Extended Canon | ✅ |
| `memories.project_id` | ✅ |
| **Active-project resolution** — which project a conversation belongs to | ✅ |
| **`project_id` as a retrieval signal** (level 0 precise; level 1 via company) | ✅ |
| **Tier 2 cached prefix** — project record + project-scoped Extended Canon | ✅ |
| Minimal management — create, rename, set description/status, assign a conversation | ✅ |

That is it. Enough to make retrieval precise and Tier 2 cacheable, and nothing
more. A plain form and a select control satisfy the UI requirement at this stage.

### Phase 5 — project as an organizational experience

| Element | Phase 5 |
|---|---|
| Project list and detail pages | ✅ |
| Goals as structured content | ✅ |
| Conversations, memories, and canon browsable by project | ✅ |
| `files.project_id` and per-project file management | ✅ |
| Project management in the Brain interface | ✅ |
| Project switching and context UX | ✅ |

### Relationships

Direct nullable FKs on child rows. **No polymorphic join table** — it adds query
complexity with no V1 payoff.

### Explicitly not building, in either phase

Tasks, milestones, assignees, due dates, Kanban, Gantt, time tracking,
notifications. V1 §40 lists a full PM suite among the things V1 is not, and the
gravitational pull toward building one is strong — the Phase 3 scope above is
deliberately the smallest thing that makes retrieval work, not the beginning of a
project tool.

---

## 11. Files and knowledge

**File upload is P1, Phase 5** — after the core conversation and memory loop
works. Files introduce parsing, storage, extraction, chunking, embeddings, and a
security surface, none of which improves the core loop first.

| Concern | Approach |
|---|---|
| Formats | Markdown, plain text, then **PDF as a separately-estimated task** (layout, tables, scans make it materially harder), then DOCX. Images stored, not extracted. OCR out of scope. |
| Storage | Vercel Blob behind a `StorageAdapter` |
| Metadata | Postgres `files` — filename, MIME, size, storage key, project, extraction status |
| Extraction | Server-side on upload; status tracked so failures are visible |
| Indexing | Chunk → embed → `knowledge_chunks` with `pgvector`. **This is the trigger for embeddings**, per §6. |
| Deletion | Cascades to derived chunks. A file whose chunks outlive it is a data-leak bug. |
| Reprocessing | Chunks are derived data, always rebuildable |

### File content is untrusted — non-negotiable

An uploaded file is untrusted text entering the model's context and may carry
instructions aimed at Atlas. Required from the first day files exist:

1. **Extracted content never enters `system`.** It enters as delimited,
   labelled reference content.
2. Operator instructions use the `role: "system"` channel, which document text
   cannot forge.
3. Atlas is instructed that knowledge-block content is **data to reason about,
   never instructions to follow**.
4. When tools exist, no tool call may be triggered solely by document-derived
   content without owner confirmation.
5. **Adversarial-document tests ship with the feature**, not after.

---

## 12. Voice

**Stage A only in V1: push-to-talk transcription into the composer.** Tap →
speak → see text → edit → send. Roughly 80% of the daily value, and it fails
gracefully — a bad transcription is visible before it becomes a request.

| Stage | Scope | Phase |
|---|---|---|
| A — STT input | `MediaRecorder` → server → hosted STT → composer | 6 |
| B — TTS output | Optional spoken playback, per-conversation toggle | 6 |
| C — Conversational | Continuous, interruptible, low-latency duplex | Post-V1 |

**Two STT paths, evaluated on the owner's real devices in Phase 6:** browser
`SpeechRecognition` (free, but support and behavior vary meaningfully across
mobile browsers — not dependable as the only path) vs. `MediaRecorder` + hosted
STT (per-minute cost, consistent everywhere). **Build the hosted path as the
reliable default**; use browser STT only as an opportunistic fast path where it
demonstrably works.

`SpeechAdapter` (`transcribe` / `synthesize`) — voice providers churn faster than
model providers.

Mobile: microphone requires HTTPS and a user gesture (push-to-talk is one by
construction). iOS restricts audio autoplay — TTS playback must be
user-initiated. In an installed PWA, permission persists.

---

## 13. Authentication

**Email magic link, single-address allowlist, database-backed sessions.**

**Passkeys are deferred.** The Auth.js WebAuthn provider is experimental, and
making an experimental provider the *required* production authentication path for
the owner's only access route is an unnecessary risk on a system that will hold
highly sensitive information. Magic link is boring, well-supported, and
sufficient.

| Element | Detail |
|---|---|
| Provider | Auth.js v5 email provider (Resend for delivery) |
| Allowlist | Exact owner address checked in the `signIn` callback. A valid link for any other address must fail. |
| Sessions | Database-backed, `HttpOnly` + `Secure` + `SameSite=Lax` |
| Link lifetime | Short (10–15 min), single-use |
| Runtime | Node, same as everything else — no Edge split |

**Architecture preserved for passkeys later.** Auth.js supports multiple
providers on one account, sessions are already DB-backed, and the allowlist is
provider-independent. Adding passkeys later is adding a provider — not a
migration — once the implementation is production-ready.

**Path to more users:** every owner-scoped table carries `owner_id` from
migration one. Adding a second authorized user becomes an allowlist change plus
authorization checks that are already written.

**Not building:** roles, permission matrices, orgs, SSO, SCIM, invitations.

---

## 14. Security

| Area | Control |
|---|---|
| **Authentication** | Magic link + exact allowlist (§13) |
| **Authorization** | `owner_id` is a **predicate in every query**. A Drizzle scoped-query helper makes an unscoped query visibly wrong in review. |
| **Route protection** | Middleware (Node) matching **by allowlist, never by exclusion** — an exclusion list eventually grows a hole |
| **Secrets** | Vercel env vars, server-only. Any `NEXT_PUBLIC_` on a secret fails review. |
| **DB access** | Server-only. Previews use Neon branches, never production. |
| **Server/client boundary** | Server Components by default; canon, memory, and keys never serialized into client props |
| **Prompt injection** | File content untrusted (§11); operator instructions on the unforgeable `role: "system"` channel; document text may not trigger actions |
| **API abuse** | Per-owner rate limits on chat and upload |
| **Cost control** | **Hard monthly spend cap with circuit breaker.** Degrades gracefully — Atlas says he has hit his limit rather than failing opaquely. |
| **Destructive actions** | Explicit confirmation + `system_event`. Bulk memory deletion requires typed confirmation. |
| **Logging** | Never log full prompts, message content, or memory content at info level. Identifiers and token counts only. |
| **Sensitive memory** | Credentials must never reach `memories` — they would replay into every future context. Capture prompt excludes them; Brain supports hard delete. |
| **Backups** | Neon PITR + independent scheduled logical export (§20) |
| **Admin routes** | Same auth as everything else. No separate admin credential — a second credential is a second thing to compromise. |

---

## 15. Admin / Brain interface

**P0, Phase 5.** V1 §37 places it in P1; V1 §45 makes thirty-day compounding the
primary success metric, and that metric is unmeasurable without seeing what Atlas
believes. It is the instrument for the largest V1 risk.

| Capability | V1 |
|---|---|
| Canon: browse, read, search, filter by tier/category/authority | ✅ |
| Canon: edit with version bump, view supersession | ✅ |
| **Core Canon budget meter** — current size against the 25k target | ✅ |
| Memories: browse, filter, search, edit, archive, hard delete | ✅ |
| Memory supersession chains | ✅ |
| **Pending proposals — optional batch review, no badge, no nag** | ✅ |
| Sources: what produced this memory, with `source_ref` links | ✅ |
| **Retrieval trace: what was retrieved for a turn, why, and what was cut** | ✅ |
| Atlas identity configuration: view and edit | ✅ |
| Projects | ✅ |
| Conversation summaries | ✅ |
| Usage + cost dashboard, including cache-hit health | ✅ |
| **Evaluation suite results and history** | ✅ (Phase 3) |
| Knowledge ingestion status | Phase 5 |
| Bulk operations · memory graph · canon version diffs | Later |

The proposals view is **pull, not push**. No badge on the main navigation, no
count in the header, no periodic prompt. It is there when the owner goes looking.

---

## 16. UI / UX architecture

```
/                 Home — conversation entry. Atlas, a composer, recent
                  conversations, active project. Nothing else.
/c/[id]           Conversation
/projects         Project list
/projects/[id]    Project — description, goals, conversations, memories, files
/brain            Canon · memories · proposals · retrieval traces · identity ·
                  evals · usage
/settings         Account, voice, appearance
```

**Mobile (primary target).** Composer fixed at the bottom, thumb-reachable, voice
control adjacent. Full-width message column, generous line height, never a
horizontal scroll. Navigation in a slide-over drawer. **The home screen is the
composer** — launching Atlas and starting to type must take zero navigation.

**Desktop.** Persistent left rail (recent conversations, projects, brain);
centered message column at a **68ch measure**; rail collapses below 900px into
the mobile pattern.

**Restraint.** If an element does not help the owner begin useful work, it does
not belong on the home screen. No metric tiles, activity feeds, charts, or
greeting heroes. Atlas's presence is carried by the design system's motion
signatures — the purple sweep for thinking, gold determinate progress for
execution — not an avatar or orb. Design system §Prohibited is binding.

---

## 17. PWA / mobile installation

**Ship an installable PWA in V1. No native apps.**

Manifest, icon set, minimal service worker — roughly a day of work for a
home-screen icon and a standalone window, which is the difference between feeling
like an app and feeling like a bookmark.

- **Install:** iOS via Share → Add to Home Screen (Safari only, cannot be
  prompted); Android/desktop get an install prompt
- **Notifications:** Web Push works on iOS only for installed PWAs on recent
  versions. **Not a V1 feature** — V1 §26 puts proactive Atlas out of scope, so
  there is nothing to notify about. Verify support when that changes.
- **Microphone:** works in installed PWAs; permission persists
- **Offline:** largely meaningless for a network-dependent product. Cache the app
  shell so launch is instant and the offline state is a designed screen rather
  than a browser error.
- **Native later** only for capabilities the web cannot reach: background audio
  for conversational voice, deep OS integration, share targets. Bible §29 — not
  for prestige.

---

## 18. Observability

### Per model call — `model_usage`

`input_tokens · output_tokens · cache_read_input_tokens ·
cache_creation_input_tokens · stop_reason · latency_ms ·
time_to_first_token_ms · estimated_cost_usd · purpose · role · message_id?`

**`cache_read_input_tokens` is the health metric for the entire architecture.**
Zero across consecutive turns in a session means the prefix is broken and §6's
cost model is void. This is the number to alert on.

`cache_creation_input_tokens` distinguishes a legitimate session-start write from
a broken prefix — a distinction Revision 1's model could not make.

### Retrieval tracing

Per turn: which canon entries and memories entered, their scores and reasons,
what was considered and cut, and tokens per tier. Without this, "why didn't Atlas
know that?" is guesswork and retrieval quality cannot improve.

### System events

Memory writes, supersessions, canon edits, proposal resolutions, canon conflicts
surfaced, ingestion failures, destructive actions, spend-cap trips. Bible §21's
audit spine.

### Errors

Sentry, server and client, **with message and memory content scrubbed** — an
error tracker is not an appropriate home for the owner's private context.

**Not building:** distributed tracing, custom metrics pipelines, log aggregation,
APM, dashboards beyond one usage page.

---

## 19. Testing and evaluation

Two distinct suites. The second is the one that protects Atlas's *intelligence*.

### Software tests

| Tier | Coverage | Priority |
|---|---|---|
| **Context assembly** | Golden snapshots: fixed inputs → exact prompt bytes. Tier ordering, breakpoint placement, precedence, budget enforcement. **A snapshot diff is simultaneously a behavior and a cost regression.** | Highest |
| **Memory pipeline** | Proposal → confirm → write; supersession chains; surfacing rules; **the invariant that nothing is written `inferred` + `active`** | Highest |
| **Authorization** | Every route rejects unauthenticated; every query owner-scoped; cross-owner access fails | Highest |
| **Precedence & conflict** | **Live authority: a current owner correction governs the turn even when canon disagrees.** Canon is never mutated without confirmation. Ordinary memory supersedes with lineage intact. Every branch writes a `system_event`. | Highest |
| **Retrieval** | Correct items selected; budget respected; superseded/archived never included; `reason` and `broadenLevel` populated. **Fallback: thin and empty match sets escalate through levels 0–4, stop at a sufficient set, and never exceed budget. `confidence` is reported honestly.** | High |
| **Model adapter** | Event mapping, streaming, abort, `stop_reason`, structured-output validation — against recorded fixtures, not the live API | High |
| **DB** | Migrations apply and roll back; cascades; constraints | High |
| **API routes** | Validation, error shapes, rate limits | Medium |
| **E2E (Playwright)** | Sign in → send → stream → interrupt → correction supersedes → new conversation reflects it | High |

Tooling: Vitest, Playwright, **Neon branches for integration tests against real
Postgres**. CI on every PR: typecheck, lint, unit, integration, migrations.

### The Atlas evaluation suite — begins in Phase 3

**Regression tests for Atlas's intelligence, not for the software.** They begin
the moment canon exists, not in Phase 7.

**Phase 3 — 20–30 questions grounded in canon:**

| Dimension | Example shape |
|---|---|
| Owner knowledge | Facts about the owner that Core Canon establishes |
| Company knowledge | Positioning, strategy, current priorities |
| Atlas identity | Who Atlas is, his standards, his role |
| Project understanding | Purpose, status, decisions |
| **Canon precedence** | When `canon` and `reference` disagree, canon wins |
| **Uncertainty** | Questions canon does *not* answer — Atlas must say so rather than confabulate |
| **Source awareness** | Atlas attributes claims to named entries |

**Phase 4 — expanded as memory arrives:**

memory retrieval · corrections applied · supersession respected (the superseded
value must *not* resurface) · canon conflicts surfaced rather than silently
resolved · conversation continuity across sessions

**Mechanics:** cases in `tests/eval/cases/*.yaml` with question, expected
grounding, and a pass rubric. `pnpm eval` runs them against the real assembly
path. Scoring is a mix of deterministic assertions (did the right canon entry
enter context? did the superseded value stay out?) and manual review for
open-ended answers. **Results and history live in the Brain**, so drift is
visible.

Run at the end of every phase and before any change to assembly, retrieval, or
prompts. This suite is the concrete, falsifiable answer to V1 §45's thirty-day
test — the baseline exists from Phase 3, so "does Atlas know more?" becomes a
measurement rather than a feeling.

---

## 20. Data portability and backups

| Mechanism | Detail |
|---|---|
| Automated backups | Neon PITR. Verify retention on the chosen plan. |
| **Independent logical export** | Scheduled `pg_dump` to object storage, retained separately from the DB provider. PITR protects against mistakes; an independent dump protects against losing the provider. **Both required.** |
| Full export | One command producing a zip: canon as Markdown+frontmatter, memories as JSON (with supersession chains, sources, confidence), conversations as JSON + readable Markdown, projects as JSON, files as originals + manifest |
| **Canon round-trip** | Export must reproduce `docs/knowledge/` format losslessly. Canon can always go back to plain files in git — the strongest available anti-lock-in guarantee. |
| Restore | Documented and **tested at least once in Phase 7.** An untested restore is not a backup. |
| Provider migration | Postgres → any Postgres. Blob → any S3-compatible store. Model → swap the adapter. No proprietary format in the persistence layer. |

---

# PART II — PHASED BUILD PLAN

## Phase 0 — Foundation and repository standards

**Goal:** A repository that makes the right thing easy and the wrong thing
visible, before any product code.

**Tasks**
- Next.js 16.x + TypeScript strict + pnpm
- ESLint + Prettier; **architecture lint rules**: no provider SDK import outside
  `lib/model/`, no `NEXT_PUBLIC_` on known secret names
- Vitest + Playwright configured and running in CI
- GitHub Actions: typecheck, lint, test, build per PR
- Directory skeleton with README stubs
- Tailwind v4 wired to `docs/design/tokens.css`
- `.env.example` documenting every variable

**DoD:** `pnpm dev` serves a themed empty page; CI green; a PR importing the model
SDK outside `lib/model/` fails lint.

**Not yet:** any feature, schema, or route.
**Risk:** tooling rabbit-hole — timebox to two days.

---

## Phase 1 — Application skeleton

**Goal:** The owner signs in on his phone and sees a correct, empty Atlas.

**Tasks**
- Neon project; production + preview branch strategy
- Drizzle; first migration: `owners`, `conversations`, `messages`, `system_events`
- **Auth.js v5 email magic link** (Resend), exact allowlist, DB sessions
- Node middleware protecting all routes by allowlist matcher
- App shell: home, conversation stub, responsive rail/drawer
- PWA manifest, icons, minimal service worker
- Vercel project, env vars, previews against Neon branches
- Custom domain, HTTPS, HSTS

**DoD:** Owner signs in on his phone from the real domain and installs to home
screen. A second address cannot sign in — with a test proving it.

**Not yet:** model calls, canon, memory, projects, files.
**Risks:** email deliverability (verify domain early); region mismatch (pin both
Vercel and Neon to `iad1`).

---

## Phase 2 — Atlas Lives

**Goal:** Real conversation. Fast, streaming, interruptible, persisted.

**Tasks**
- `lib/model/` — `AtlasModel`, `AtlasEvent`, Anthropic adapter, `modelFor(role)`
- Streaming chat route (Node), explicit `maxDuration`, keepalives
- `assembleContext()` v1 — identity + owner profile, breakpoint 1 placed
- Atlas identity config in DB
- Message persistence with **full content-block arrays**
- Streaming UI: markdown, code, tables, copy, auto-scroll, stop
- Abort wired end to end
- Conversation list, titling (`role: "background"`), archive/delete
- `model_usage` on every call
- **Cache assertion: `cache_read_input_tokens > 0` on turn ≥2 within a session**

**Testing:** adapter fixtures; assembly snapshots; E2E send → stream → interrupt.

**DoD:** Multi-turn conversation on mobile that feels fast, interrupts cleanly,
survives reload; cache reads non-zero from the second turn of a session.

**Not yet:** canon, memory, retrieval, projects, files, voice, tools.
**Risks:** *function duration ceiling* — verify explicitly this phase, it shapes
everything after. *Cache misconfiguration* — the assertion catches it now rather
than in a bill.

---

## Phase 3 — Atlas Knows

**Goal:** Atlas launches already understanding the owner's world — and we can
measure whether he does.

**Tasks**

*Project primitive (§10 Phase 3 scope — required for retrieval and caching)*
- `projects` schema: id, owner_id, name, description, status, timestamps
- `project_id` FKs on `conversations`, `canon_entries`, `memories`
- Active-project resolution for a conversation
- Minimal management: create, rename, edit description/status, assign a
  conversation. **A form and a select — not a projects experience.**

*Canon*
- `canon_entries` schema with `tier`, `category`, `company`, `project_id`,
  `keywords`, `authority`, `tsvector` + GIN index
- `docs/knowledge/` structure and authoring conventions
- `pnpm knowledge:import` — idempotent, versioned, drift-detecting,
  **Core Canon budget enforcement**
- Write the first real seed corpus: Core Canon (identity, owner profile,
  principles) plus Extended Canon for at least one company and one project

*Assembly and retrieval*
- `assembleContext()` v2 — **Core Canon in Tier 1**, **active project context in
  Tier 2**, both breakpoints placed
- **`Retriever` interface + `DeterministicRetriever`** — project association,
  explicit reference, category filter, full-text, authority, recency, budget
- **Fallback ladder (levels 0–4) with escalation triggers and termination**
- **`confidence` surfaced into the injected context block** so Atlas can say he
  has nothing specific rather than reasoning from general priors
- Retrieved Extended Canon injected as a `role: "system"` message
- Retrieval trace logging: `reason`, `broadenLevel`, levels attempted
- Precedence rules (§8), including **live authority vs. canon mutation**
- **Canon-conflict behavior: correction governs immediately; canon update
  offered separately, never silent**

*Evaluation*
- **Atlas evaluation suite v1 — 20–30 canon-grounded cases + `pnpm eval`**

**Testing:** import idempotency and budget enforcement; canon-in-prompt
snapshots; **Tier 2 cache behavior across project switches**; retrieval
correctness and budget; **fallback escalation — thin and empty match sets
broaden, and never exceed budget**; precedence; **live-authority tests (a
correction governs the turn even when canon disagrees)**; conflict-surfacing;
cache stability across canon edits. **Plus: the eval suite passes, including its
uncertainty cases.**

**DoD:** Atlas answers substantive questions about the owner's world, cites
sources, retrieves the right Extended Canon for the topic, broadens rather than
returning empty on a weak match, says plainly when he has nothing relevant, and
when told something contradicting canon acts on the correction immediately while
offering to update Canon separately. Evaluation baseline recorded.

**Not yet:** embeddings, chunking, file upload, memory, project list/detail UI,
goals as structured content, Brain interface.

**Risks:** *the seed corpus is the bottleneck, not the code* — start writing it
during Phase 2. *Core Canon creep* — the budget check is the guard. *Full-text
recall gaps* — the fallback ladder and trace make them visible and survivable,
which is the point of building the interface now. *Project scope creep* — the
Phase 3 list above is exhaustive; anything beyond it is Phase 5.

---

## Phase 4 — Atlas Remembers

**Goal:** The loop compounds — without becoming an inbox.

**Tasks**
- `memories`, `memory_proposals` schema with supersession and `surfacing`
- **Path 1** — explicit commands recognized (including implicit forms:
  "going forward…", "that's important") → authoritative immediately
- **Path 2** — in-conversation confirmation for `blocking`/`surface` items
- **Path 3** — silent proposals at conversation end, structured output,
  Zod-validated, deduped against active memories
- Surfacing classifier (conflict → blocking; consequential → surface; else silent)
- Correction flow: identify → confirm → supersede → report in one sentence
- Canon-conflict escalation per §8
- `assembleContext()` v3 — memories retrieved and injected in Tier 3
- Conversation summarization (§9)
- `system_events` for every memory mutation
- **Evaluation suite v2** — memory retrieval, corrections, supersession,
  conflicts, continuity

**Testing:** all three paths; supersession chains; dedupe; surfacing
classification; **the `inferred` + `active` invariant**; cache integrity with
dynamic memory injection; E2E — state a fact in conversation A, confirm it, see
it in conversation B.

**DoD:** A fact stated in week one surfaces correctly in week three. A correction
supersedes cleanly with lineage intact. The owner has not been asked to clear a
queue. Cache reads stay non-zero. Eval v2 passes.

**Not yet:** memory embeddings, memory graph, proactive surfacing.
**Risks:** *over-surfacing* — measure the ratio of blocking/surface to silent;
if Atlas interrupts more than a couple of times a day, tune toward silence.
*Under-capture* — if eval shows knowledge not compounding, improve Path 1
recognition, do not start nagging.

---

## Phase 5 — Atlas Organizes

**Goal:** The project *experience*, the Brain, and files. The project *primitive*
already exists from Phase 3.

**Tasks**
- **Project experience**: list and detail pages, goals as structured content,
  conversations/memories/canon browsable by project, project switching UX,
  `files.project_id` and per-project file management
- **Brain interface** (P0): canon browse/edit + **Core budget meter**; memory
  browse/search/edit/status/delete; **pending proposals as optional batch
  review**; supersession chains; sources; **retrieval traces including broaden
  level**; identity config; project management; conversation summaries; usage +
  cache health; **eval results and history**
- `files` + `knowledge_chunks` schema; enable `pgvector`
- Upload → Blob → extract → chunk → embed
- **`HybridRetriever`** — same interface, adds vector similarity for chunks,
  slotting into the existing fallback ladder rather than replacing it
- **Untrusted-content handling (§11) — non-negotiable**
- Ingestion failure visibility

**Testing:** project experience flows; file lifecycle including cascade delete of
chunks; **adversarial prompt-injection tests**; retrieval quality on the real
corpus; **fallback behavior unchanged when the hybrid retriever is swapped in**;
eval suite still passes with retrieval changed.

**DoD:** The owner uploads a document, Atlas uses it, and the Brain shows exactly
what Atlas believes, where each belief came from, and what was retrieved for any
given turn.

**Not yet:** OCR, image understanding, collaborative editing.
**Risks:** *prompt injection* — hence the explicit tests. *Retrieval quality
disappointing after canon's perfect recall* — the trace view is how we diagnose
rather than guess.

---

## Phase 6 — Atlas Speaks

**Goal:** Tap → speak → Atlas understands → Atlas responds.

**Tasks**
- `SpeechAdapter` interface
- Evaluate browser STT vs. hosted STT on the owner's actual devices
- `MediaRecorder` capture, push-to-talk UI, transcription into composer
- Optional TTS playback, per-conversation toggle, user-initiated
- Mobile permission handling; PWA verification

**Testing:** permission flows; adapter tests; manual device testing.

**DoD:** The owner speaks a message on his phone, sees accurate text, edits it,
sends — reliably.

**Not yet:** realtime duplex, wake words, continuous listening.
**Risks:** browser STT inconsistency (hence the hosted default); scope creep
toward conversational voice (Stage A only).

---

## Phase 7 — Production hardening and daily driver

**Goal:** Trustworthy enough to depend on daily.

**Tasks**
- Rate limiting; **spend circuit breaker with hard monthly cap**
- Sentry with content scrubbing
- Full export (§20) and **a tested restore**
- Scheduled independent `pg_dump`
- Performance pass: cold start, TTFT, mobile launch
- **Effort sweep** — `medium` and `low` against real usage
- **Cache TTL decision** — 5m vs 1h, using real session-gap data
- **Background-model evaluation** — is a cheaper model adequate for titling,
  extraction, summarization?
- Evaluate provider-side compaction vs. our summarization
- Security review against §14
- Daily use; friction logged to `docs/friction.md`
- **Eval suite run at day 0 and day 30 of daily use**

**DoD:** Thirty consecutive days of daily use. The eval suite shows measurable
knowledge growth between the two runs. A restore has been performed successfully.
The owner prefers Atlas to a general assistant for a meaningful share of daily
work.

**Not yet:** whatever the roadmap says next. V1 §43 — let usage decide.

---

# PART III — STRUCTURE, SCHEMA, SERVICES

## Repository structure

```
atlas-creed/
├── app/
│   ├── (auth)/sign-in/
│   ├── (atlas)/
│   │   ├── page.tsx                 home — conversation entry
│   │   ├── c/[id]/                  conversation
│   │   ├── projects/[id]/
│   │   ├── brain/
│   │   │   ├── canon/ memories/ proposals/ traces/ identity/ evals/ usage/
│   │   └── settings/
│   └── api/
│       ├── chat/route.ts            streaming turn handler
│       ├── conversations/ memory/ proposals/ canon/ projects/
│       ├── files/upload/ speech/transcribe/
│       └── auth/[...nextauth]/
│
├── components/
│   ├── atlas/       message-list · composer · thinking-indicator · voice-button
│   ├── brain/       memory-table · canon-editor · proposal-review · trace-viewer
│   ├── ui/          primitives on Radix, styled from tokens
│   └── layout/      shell · rail · drawer
│
├── lib/
│   ├── model/       types.ts · anthropic.ts · registry.ts · usage.ts  ← only SDK import
│   ├── brain/       assemble.ts · precedence.ts · budget.ts · trace.ts
│   ├── retrieval/   types.ts · deterministic.ts · hybrid.ts · rank.ts
│   ├── memory/      capture.ts · classify.ts · propose.ts · dedupe.ts ·
│   │                supersede.ts · commands.ts
│   ├── knowledge/   import.ts · parse.ts · budget.ts · chunk.ts · embed.ts
│   ├── conversation/ summarize.ts · window.ts
│   ├── db/          schema.ts · client.ts · scoped.ts · migrations/
│   ├── storage/     types.ts · vercel-blob.ts
│   ├── speech/      types.ts · <provider>.ts
│   ├── auth/        config.ts · guards.ts
│   ├── events/      log.ts
│   └── validation/  zod schemas shared client/server
│
├── prompts/         identity.md · memory-capture.md · summarize.md ·
│                    correction.md · conflict.md
│
├── docs/
│   ├── canon/       ATLAS-CREED-BIBLE.md
│   ├── product/     V1-PRODUCT-DEFINITION.md
│   ├── design/      DESIGN-SYSTEM.md · tokens.css
│   ├── knowledge/   core/ companies/ projects/ standards/ ecosystem/ history/
│   ├── ATLAS_V1_BUILD_PLAN.md
│   └── friction.md
│
├── scripts/         knowledge-import.ts · export.ts · eval.ts
├── tests/
│   ├── unit/ integration/ e2e/ fixtures/ snapshots/
│   └── eval/        cases/*.yaml · runner.ts · results/
└── types/
```

---

## Schema — conceptual first pass

```
owners ──┬── conversations ──┬── messages
         │                   └── conversation_summaries
         ├── projects ◄──────── (nullable FK from conversations, memories,
         │                        files, canon_entries)
         ├── canon_entries          (tier · authority · tsvector)
         ├── memories ──── supersedes_id ──► memories
         ├── memory_proposals ──► memories       (on confirm)
         ├── knowledge_sources ── knowledge_chunks    (Phase 5)
         ├── files ──────────────► knowledge_sources
         ├── atlas_config
         ├── model_usage
         ├── retrieval_traces
         └── system_events
```

| Entity | Key fields | Notes |
|---|---|---|
| `owners` | email, display_name | One row in V1 |
| `conversations` | owner_id, project_id?, title, archived_at? | |
| `messages` | conversation_id, role, **content JSONB**, model, created_at | Full content-block array |
| `conversation_summaries` | conversation_id, content, covers_through_message_id, version | Rolling, versioned, inspectable |
| `canon_entries` | slug, title, body, **tier**, category, company?, project_id?, keywords[], **authority**, version, source_path?, supersedes_id?, **search_vector** | Tier and metadata are retrieval keys |
| `memories` | category, content, source, source_ref, confidence, status, supersedes_id?, project_id?, **search_vector** | The core asset |
| `memory_proposals` | conversation_id, content, category, rationale, **surfacing**, status, resolved_at? | Review by exception |
| `projects` | name, description, status, goals | Context container only |
| `knowledge_sources` | file_id?, title, kind, status | Phase 5 |
| `knowledge_chunks` | source_id, content, embedding, ordinal | Phase 5 |
| `files` | filename, mime_type, size_bytes, storage_key, project_id?, extraction_status | |
| `atlas_config` | key, value JSONB | Identity, runtime-editable |
| `model_usage` | purpose, **role**, model, tokens…, **cache_read_input_tokens**, cost, latency, message_id? | Nullable message link |
| `retrieval_traces` | message_id, items JSONB, tokens_by_tier, strategy | Why Atlas knew (or didn't) |
| `system_events` | kind, authority_level, payload, outcome | Audit spine |

**Rejected tables:** `entities` (entity resolution with no V1 payoff;
`memories.category` covers person/company/project), `project_links` (direct
nullable FKs are simpler and type-safe), `tags` (unmanaged taxonomy),
`tool_permissions` (no tools in V1; `system_events.authority_level` already
encodes the ladder), custom `sessions` (Auth.js owns it).

---

## External services

| Service | Purpose | Needed | Alternative | Lock-in | Complexity |
|---|---|---|---|---|---|
| **Vercel** | Hosting, functions, CDN, Blob | Phase 1 | Netlify, Fly, Railway | **Medium** (App Router portable; Blob is not — hence the interface) | Low |
| **Neon** | Postgres, branching, PITR, FTS, later pgvector | Phase 1 | Supabase, RDS | **Very low** | Low |
| **Resend** | Magic-link email | Phase 1 | Postmark, SES | Very low | Low |
| **Anthropic** | Claude Opus 5 | Phase 2 | OpenAI, Google via adapter | **Low by design** | Low |
| **Vercel Blob** | File bytes | Phase 5 | S3, R2 | Low behind interface | Low |
| **Embeddings** | File chunk vectors | Phase 5 | Any; pgvector is agnostic | Low | Low |
| **STT/TTS** | Voice | Phase 6 | Multiple, behind adapter | Low | Medium |
| **Sentry** | Error tracking | Phase 7 | Axiom, self-hosted | Low | Low |

**Eight services, four deferred past Phase 4.** Rejected for V1: dedicated vector
DB, analytics, feature flags, Redis, queue.

---

## Cost considerations

| Driver | Scaling | Magnitude |
|---|---|---|
| **AI inference** | Messages/day × prefix size × sessions/day | **Dominant.** ~$256–677/mo at realistic usage (tiered config) |
| Vercel | Flat plan + function time | Small, flat |
| Neon | Flat tier; storage grows slowly | Small, flat |
| Resend | Low volume (one user) | Negligible |
| Blob | Bytes + egress | Negligible at V1 |
| Embeddings | One-time per file | Negligible |
| STT/TTS | Per minute of audio | Small; grows if voice becomes primary |
| Sentry | Event volume | Free tier likely sufficient |

**Levers, in order of effect:**

1. **Cache correctness** — the difference between $0.08 and $0.50 per message
2. **Core Canon budget** — session writes scale linearly with prefix size; this
   is why the 25k budget is enforced by a script rather than by intention
3. **Tier 2 caching** — moving stable project context out of the retrieved
   payload is a ~10× reduction on those tokens
4. **Effort level** — `medium` is materially cheaper and strong on this model
5. **Background model** — titling and extraction may not need Opus
6. **Conversation windowing** — summaries instead of transcripts

Make cost **visible** (§18) and **bounded** (circuit breaker, §14). V1 §36:
optimize for quality, not premature economics — but invisible costs are how a
private project becomes a surprise bill.

---

## Architectural risks

| # | Risk | How this architecture prevents it |
|---|---|---|
| 1 | **Memory becomes chat history** | Separate typed store with categories, sources, confidence, supersession. Conversations are never a direct memory source. |
| 2 | **Uncontrolled automatic memory** | Nothing written `inferred` + `active`. Inference produces proposals only. |
| 3 | **Memory maintenance becomes a chore** | Review by exception: explicit commands and in-conversation confirmation are the growth paths; silent proposals never nag. |
| 4 | **Prompt cache silently breaks** | Frozen-`system` rule; three-tier prefix; pure assembly with snapshots; `cache_read_input_tokens` asserted in tests and alerted in production. |
| 5 | **Core Canon grows unbounded** | Hard budget enforced by the import script; Brain shows a live meter; growth pressure resolves by demotion to Extended, not by raising the ceiling. |
| 6 | **Canon becomes unfalsifiable** | Conflicts surfaced and offered, never silently rewritten in either direction; both branches audited. |
| 7 | **Retrieval quality is unobservable** | `reason`, `broadenLevel`, and `trace` are mandatory fields; traces persisted and visible in the Brain. |
| 8 | **Prompt injection via uploaded files** | File text never in `system`; labelled untrusted; operator instructions on the unforgeable channel; adversarial tests ship with the feature. |
| 9 | **Overengineering** | Vector DB, agents, routing, queue deferred behind **named numeric triggers**. |
| 10 | **Vendor lock-in** | Plain Postgres; one-file model adapter; storage interface; canon round-trips losslessly to Markdown in git. |
| 11 | **Weak authorization** | `owner_id` from migration one; scoped-query helper; allowlist middleware; cross-owner tests. |
| 12 | **Vercel duration ceiling** | Verified in Phase 2; explicit `maxDuration`; named trigger to move work off-platform. |
| 13 | **Atlas's intelligence regresses invisibly** | Eval suite from Phase 3, run every phase and before any assembly/retrieval/prompt change. |
| 14 | **Runaway cost** | Rate limits + hard monthly cap with circuit breaker; per-call usage logging. |
| 15 | **Brittle data model** | Full content-block JSONB; supersession over update; `owner_id` everywhere. |
| 16 | **Silent retrieval miss** — Atlas answers from model priors while sitting on canon that would have answered correctly, and nothing looks wrong | The fallback ladder (§6) broadens instead of returning empty; `confidence` is rendered into context so Atlas says he has nothing specific rather than confabulating; uncertainty is an explicit eval dimension from Phase 3. |
| 17 | **Stale canon overrides a live correction** | Live authority and canon mutation are separate decisions (§8). The correction governs the turn immediately; the canon update is offered separately and never applied silently. |

---

# PART IV — DECISIONS AND CHALLENGES

## Decisions requiring owner approval

### Must decide before coding

| # | Decision | Status |
|---|---|---|
| 1 | Core/Extended Canon split with retrieval interface from Phase 3 | **Directed by owner — incorporated** |
| 2 | No embeddings in V1; `pgvector` triggered by file ingestion | **Directed — incorporated** |
| 3 | Review-by-exception memory proposals | **Directed — incorporated** |
| 4 | Canon conflict: surface and offer, never silent rewrite | **Directed — incorporated** |
| 5 | **Live owner authority separate from canon mutation** | **Directed (Rev 3) — incorporated** |
| 6 | Magic-link auth; passkeys deferred | **Directed — incorporated** |
| 7 | Next.js 16.x, Node throughout, no Edge | **Directed — incorporated** |
| 8 | Eval suite from Phase 3 | **Directed — incorporated** |
| 9 | **Minimal project primitive in Phase 3; richer experience in Phase 5** | **Directed (Rev 3) — incorporated** |
| 10 | **Retrieval fallback ladder, deterministic, no embeddings** | **Directed (Rev 3) — incorporated** |
| 11 | Brain interface at P0 | Approved in Rev 1 |
| 12 | Neon Postgres | Approved in Rev 1 |
| 13 | **Core Canon token budget — is 25k target / 40k hard limit right?** | **OPEN** |
| 14 | **Monthly spend cap — the actual dollar figure** | **OPEN — owner input required** |
| 15 | **Design-system ratification: typeface, dark-only, gold ratio, whether purple ships** | **OPEN — blocks Phase 1 UI** |

### Can decide during build

Effort level per route · conversation window size and summary threshold ·
surfacing-classifier thresholds · retrieval token budget split between canon and
memory · full-text ranking weights · **fallback escalation thresholds (minimum
viable set size, relevance floor, thin-result token percentage)** · STT provider ·
embedding model · Sentry vs alternative · cache TTL (5m vs 1h)

### Can safely defer

Tool architecture specifics · multi-model routing · background-model swap ·
realtime voice · native apps · additional users · proactive intelligence and
scheduled work · memory graph · entity resolution · provider-side compaction ·
reranking

---

## Where this plan still departs from the product canon

Six remain after Revision 2. Bible §33 requires them surfaced.

**1. §15/§41 — retrieval as P0.** Partially resolved. Retrieval now ships in
Phase 3 as directed, but **without embeddings** — deterministic mechanisms over
curated metadata. The literal §15 concern (don't inject everything) is honored by
the Core/Extended split.

**2. §37 — Brain view as P1 → P0.** Unchanged. §45's metric is unmeasurable
without it.

**3. §12 vs §45 — conservative capture vs. compounding.** Resolved differently
than Revision 1: growth comes from explicit commands and in-conversation
confirmation, not from queue review. The queue is a safety net.

**4. Missing: prompt injection via ingested content.** §20 mentions compromised
agents; nothing connects that to uploaded files. Mitigations specified in §11,
required before any file ingestion ships.

**5. Missing: spend circuit breaker.** §36 asks for cost awareness with no hard
stop. Added.

**6. §45 — the 30-day test has no defined measurement.** Now resolved by the
eval suite, with a baseline from Phase 3 rather than a scramble in Phase 7.

*Resolved since Revision 1:* the §41/§42 sequencing contradiction (phase order
fixes it), §17's undefined history strategy (rolling summaries, §9), §14's flat
PDF listing (separately estimated), and §7's ambiguous voice timing (Stage A,
Phase 6).

---

## What this plan deliberately does not build

Tools and function calling · multi-model routing · agents or sub-agents ·
proactive intelligence · scheduled jobs · notifications · realtime voice ·
native apps · multi-user · teams · tasks/milestones/Kanban · email or calendar
integration · web browsing · memory graph · entity resolution · embeddings before
file ingestion · a dedicated vector database · Redis · a message queue · Edge
runtime · analytics · feature flags.

V1 §47 is the gate: *does this improve Atlas's core loop, or establish
infrastructure the loop genuinely needs?*

---

**End of Revision 2. Awaiting approval — no implementation has begun.**
