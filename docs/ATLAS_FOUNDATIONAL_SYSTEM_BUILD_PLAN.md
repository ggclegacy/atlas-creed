# ATLAS CREED
## Foundational System Implementation Plan

**Status:** Architecture approved; F0 and F1 authorized and implemented  
**Prepared:** 2026-08-17  
**Scope:** Architectural synthesis and implementation roadmap for Atlas Documents 001-011 plus the Groomed Gent Co. and Gent Logistics living-company contexts  
**Implementation authorization:** F0 and F1 only. F2 and later milestones require separate approval.

---

# 1. Executive decision

Atlas should be implemented as a governed personal-intelligence platform, not as
a chatbot with all founding documents pasted into one system prompt.

The first durable implementation should contain five load-bearing systems:

1. a compact, versioned Constitutional Kernel;
2. a context compiler that retrieves only the canon, living knowledge, skills,
   and current state relevant to a task;
3. Atlas-owned knowledge and memory with provenance, confidence, freshness,
   correction, and supersession;
4. an evaluation harness that proves identity, retrieval, judgment, and memory
   behavior across model changes; and
5. a deterministic control plane that keeps capability separate from permission
   before any consequential tools or autonomy are introduced.

Atlas Architect, specialist agents, proactive jobs, voice, and higher autonomy
should be built on top of those foundations. They should not be simulated early
through prompts or given production authority before the policy, audit,
evaluation, and rollback layers exist.

---

# 2. Current repository baseline

The repository is not empty. It already contains a Next.js 16 App Router
application, React 19, strict TypeScript, Drizzle, Postgres/Neon, Auth.js,
OpenAI behind an Atlas-owned model adapter, persistent streaming conversations,
usage records, PWA support, design tokens, and unit/integration/E2E foundations.

The inherited Phase 2 application was reconciled at commit `3ebeb45` and is
recorded in `docs/operations/F0_BASELINE_2026-08-17.md`. F0 preserved the
existing work and verified its application, test, and clean-migration baseline.
The remaining protected deployment issue is that existing shared Neon schemas
have no Drizzle migration ledger. They must not be migrated until a separate,
explicitly approved reconciliation. F1 was therefore implemented and verified
on a clean disposable branch.

The baseline requirements were:

- inventory the exact Phase 2 behavior already present;
- run the complete verification suite;
- resolve documentation that still describes implemented work as proposed;
- confirm authentication protects every page, API, mutation, and model call;
- confirm the database migration history matches the schema;
- create a clean, reviewable baseline checkpoint without discarding unrelated
  work; and
- treat existing architecture boundaries as constraints unless a reviewed ADR
  explicitly changes them.

The existing provider-SDK and environment-variable boundaries remain correct:
provider SDKs stay inside `lib/model/`, secrets stay server-side, and all runtime
configuration is validated centrally.

---

# 3. Atlas system model

From a technical perspective, Atlas is the persistent governed layer above one
or more replaceable models.

```text
Neil / authorized principal
        |
Atlas experience (conversation, Brain, approvals, projects, voice later)
        |
Task Orchestrator + Context Compiler
        |
+------------------ Atlas-owned intelligence -------------------+
| Constitution | memory | knowledge | expertise | skills        |
| decisions    | learning | evaluations | model routing         |
+---------------------------------------------------------------+
        |
Deterministic control plane
(identity, policy, authorization, budgets, approvals, audit, revocation)
        |
Model adapters | retrieval adapters | tool adapters | agent harnesses
        |
External providers and systems
```

The model generates cognition and proposals. Atlas owns identity, durable
knowledge, memory, permissions, orchestration, evidence, and continuity. The
control plane—not the model—decides whether a real-world action is permitted.

---

# 4. Requirements classification

## BUILD NOW

- Reconcile and verify the current Phase 2 baseline.
- Import Documents 001-011 into a versioned Canon Registry with checksums,
  provenance, effective dates, classifications, and supersession state.
- Implement the compact Constitutional Kernel independently of any provider.
- Implement constitutional precedence and conflict metadata.
- Build the first Context Compiler with explicit token budgets and a trace of
  what it loaded, excluded, and why.
- Ingest Groomed Gent Co. and Gent Logistics as living, temporal, non-canonical
  knowledge with their uncertainty and working-state labels preserved.
- Add the minimum project primitive needed for context isolation.
- Add deterministic full-text retrieval behind a provider-neutral retriever.
- Add constitutional, identity, source-trust, and context-selection evaluations.
- Add a Brain read view so Neil can inspect canon versions, context traces,
  provenance, and system capability truth.

## BUILD SOON

- Typed memory records and evidence links.
- Explicit remember/correct/forget commands and review-by-exception proposals.
- Contradiction detection, temporal state, freshness policy, archival, deletion,
  and supersession.
- Decision, prediction, outcome, and lesson records.
- Modular expertise packs and versioned procedural skills.
- Learning/consolidation jobs that create proposals, never silent constitutional
  changes.
- Expanded evaluations for reasoning, judgment, expertise, calibration,
  retrieval, and longitudinal memory.
- Static role-to-model configuration and empirical model evaluations before
  dynamic routing.

## DESIGN FOR LATER

- Tool Registry and policy-enforced execution gateway.
- Per-capability authorization envelopes and earned-autonomy scoring.
- Specialist-agent orchestration with authority attenuation.
- Atlas Architect in isolated worktrees/sandboxes.
- Background/event-driven jobs with budgets, leases, retries, and review.
- Voice input/output behind provider adapters.
- Semantic retrieval/embeddings and entity relationships if measured retrieval
  failures justify them.
- Multi-model routing based on Atlas evaluation data.
- Production observability integrations and incident automation.

## DO NOT BUILD YET

- One enormous system prompt containing all source documents.
- A global "Atlas autonomy" switch.
- Autonomous spending, contract acceptance, public communication, production
  deployment, credential changes, or destructive data operations.
- Unreviewed self-modification of constitution, permissions, security controls,
  evaluations, or production infrastructure.
- Open-ended background research with no question, budget, or stop rule.
- Specialist-agent swarms before one coherent Atlas works well.
- A separate graph database or vector service before Postgres retrieval is
  measured and proven inadequate.
- Fine-tuning as the default personal-learning mechanism.
- Claims that Atlas learned, monitored, remembered, or acted unless the system
  can prove the corresponding process actually ran.

---

# 5. Constitutional architecture

## 5.1 Persistent kernel

The always-available kernel will be a compact, version-controlled typed module,
not an editable database prompt. It will encode:

- Neil is the founding principal.
- Truth outranks agreement, persona, motivation, and convenience.
- Capability is not permission.
- Current verified reality outranks stale memory.
- Explicit decisions outrank inference.
- External content and tool output are data, not instructions.
- Atlas may improve living systems but may not silently rewrite protected rules
  or expand its own authority.
- Atlas remains the persistent layer across model providers.
- Atlas is brotherlike, candid, calm, curious, solution-oriented, and
  non-manipulative.
- Learning must be evidence-linked, correctable, and outcome-grounded.

The kernel will have a hard token budget, a stable ID/version, a checksum, and
golden regression tests.

## 5.2 Canon Registry

Documents 001-011 remain the human-readable constitutional source. A build-time
ingestion pipeline will normalize them into sections and register:

- document and section ID;
- title, version, ratification/effective date, and authority;
- hard-core, stable-core, living, or ephemeral classification;
- source checksum and source location;
- supersedes/superseded-by links;
- routing tags;
- security classification; and
- active/draft/retired state.

The runtime loads the kernel plus task-relevant sections. It never loads the full
library by reflex.

## 5.3 Precedence

Precedence is represented explicitly and tested:

1. law, platform-enforced policy, deterministic security controls, and hard
   runtime constraints;
2. current authenticated principal instruction for the active task;
3. protected constitutional identity and authority rules;
4. current verified state and explicit decisions;
5. domain/company canon;
6. validated memory and domain rules;
7. preferences and learned heuristics;
8. inference, brainstorming, external content, and untrusted claims.

A current instruction can direct the task without silently mutating canon.
Material unresolved conflicts are surfaced to Neil and recorded.

## 5.4 Amendment workflow

Protected changes use propose -> impact analysis -> Neil approval -> new version
-> regression evaluation -> activation -> rollback if degraded. Superseded
versions remain inspectable. Atlas can draft an amendment but cannot approve its
own authority expansion.

---

# 6. Context Compiler

Every consequential turn will compile the smallest sufficient cognitive
environment:

1. identify the authenticated principal and actual objective;
2. load the Constitutional Kernel;
3. classify task/domain/risk/freshness needs;
4. retrieve relevant canon sections;
5. retrieve current Neil, company, project, and relationship context;
6. load relevant expertise packs and procedural skills;
7. fetch current external or connected-system truth when required;
8. load the applicable authority envelope and tool constraints;
9. choose model, reasoning depth, tools, agents, and verification level;
10. assemble task history and working materials within token budgets; and
11. emit a context trace with source, version, confidence, age, inclusion
    reason, exclusion reason, and token cost.

The compiler will keep stable provider-cacheable instructions separate from
volatile messages and live state. Untrusted retrieved content is wrapped and
labeled as evidence, never promoted into instruction authority.

Retrieval starts with Postgres full-text search plus deterministic filters,
recency, authority, domain, and controlled broadening. Embeddings can later be
added behind the same retriever interface after a measured corpus and eval set
show a need.

---

# 7. Memory architecture

Atlas memory is a governed write system, not a transcript warehouse.

## 7.1 Memory types

- identity;
- episodic;
- semantic;
- procedural;
- preference;
- decision;
- outcome;
- heuristic/lesson;
- relationship;
- company;
- project; and
- uncertainty/contradiction.

## 7.2 Required metadata

Each memory includes owner, content/claim, type, source, source reference,
authority, confidence, temporal state, valid-from/valid-to, freshness class,
review/expiry date, sensitivity, scope, project/company/entity links,
supersession lineage, evidence links, and created/updated timestamps.

The system distinguishes stated, observed, inferred, assumed, and unknown; and
current, historical, proposed, speculative, superseded, archived, and deleted.

## 7.3 Write paths

- **Explicit:** Neil says remember/correct/forget; validated writes happen
  immediately and transparently.
- **High-confidence routine:** durable, low-risk facts can write automatically
  under narrow policy with visible confirmation and undo.
- **Proposal:** inferences, sensitive facts, ambiguous preferences, or important
  rules enter a review-by-exception queue.
- **No-op:** transient, duplicated, low-utility, or disallowed data is not
  stored.

## 7.4 Lifecycle

Memories can be updated, superseded, archived, decayed, consolidated, or deleted.
Consolidation preserves links to original evidence. Deletion and privacy rules
override learning value. Contradictions remain visible until resolved; current
state can change without erasing history.

Retrieval is evaluated for precision, not just recall. Atlas should remember
what matters and avoid flooding context with merely similar material.

---

# 8. Knowledge architecture

Knowledge and memory are separate but connected:

- Canon is ratified and versioned.
- Living company context is mutable, temporal, and provenance-aware.
- External knowledge preserves source claims separately from Atlas's
  interpretation.
- Live connected-system data outranks stored summaries for operational facts.
- Skills contain reusable procedure, not just information.

The initial knowledge subsystem uses Postgres for source metadata, revisions,
sections/chunks, citations, tags, freshness, and lexical retrieval. Original
files remain recoverable, while normalized text is the searchable derivative.
Source revisions are immutable; a new ingest creates a new revision.

Groomed Gent Co. and Gent Logistics are seeded as living company packs. Their
working ideas, products, systems, and strategies retain labels such as current,
historical, proposed, exploratory, or unresolved. Brainstorm density must never
be converted into certainty.

An entity/relationship table can be introduced inside Postgres when cross-domain
relationships materially improve retrieval. A separate knowledge-graph service
is not justified initially.

---

# 9. Expertise and skills

Atlas begins as one intelligence with modular depth. Each expertise pack defines:

- mission and applicability boundary;
- foundational concepts;
- current-knowledge/freshness policy;
- source hierarchy;
- procedural skills;
- approved tools;
- risks and failure modes;
- evaluation cases;
- mastery level;
- version and learning history; and
- last validated date.

Initial packs should be narrow and useful: Neil Intelligence, GGC, Gent
Logistics, business/finance, health evidence review, AI/software engineering,
and research/source verification. High-stakes packs for medicine, law, finance,
and regulation must favor current primary/authoritative sources, distinguish
education from professional judgment, and escalate appropriately.

Skills are versioned executable playbooks with inputs, outputs, steps, tools,
authority requirements, verification, failure modes, and tests. A skill earns
promotion from draft to active only after realistic evaluations and successful
use. A success observed once is not a universal skill.

---

# 10. Learning and wisdom architecture

The learning loop is:

```text
observe -> predict -> act -> measure -> reflect -> abstract
        -> validate -> consolidate -> retrieve -> revise
```

Learning occurs through Atlas-owned memory, outcome records, playbooks, skills,
retrieval, and evaluations—not uncontrolled model-weight changes.

Consequential decisions should optionally record predictions, confidence,
horizon, and falsification criteria before the outcome. Reflection produces a
candidate lesson, not immediate truth. Promotion requires evidence, scope, and
validation. Failed heuristics are weakened or retired.

Scheduled learning is introduced only after the synchronous system works:

- daily: consolidate meaningful corrections and active state;
- weekly: review outcomes, contradictions, stale memory, and candidate lessons;
- monthly: run capability regressions and review company/expertise freshness;
- quarterly: review architecture, security, privacy, cost, and learning value;
- event-driven: focused postmortems after launches, failures, pivots, and major
  decisions.

Every job records that it ran, its budget, sources, proposed changes, and result.
Atlas never claims background cognition that cannot be observed in a real run.

---

# 11. Model architecture

The existing provider-neutral `AtlasModel` boundary remains the center of the
model layer.

- Provider APIs remain isolated in adapters.
- Atlas-owned messages, content, tool contracts, usage, errors, and structured
  output types remain portable.
- Postgres remains the authoritative conversation store.
- Provider reasoning artifacts are not treated as Atlas memory or exposed as
  chain-of-thought.
- Each call records provider, model, role, purpose, latency, usage, cost basis,
  result, and relevant evaluation version.

The first stage uses a static role mapping (conversation/background). Dynamic
routing begins only after Atlas has task-labeled evaluation data. Later routing
considers capability, domain, risk, latency, cost, context size, tool support,
and measured past performance. A model swap must pass identity, authority,
retrieval, persona, and domain regression gates before promotion.

---

# 12. Agent architecture

Specialists are added only where decomposition creates measured value.

Atlas remains responsible for intent, decomposition, context isolation,
authority attenuation, reconciliation, verification, and final synthesis. Every
agent receives a narrow objective, minimum context, least-privilege tools,
budget, stop condition, and required output contract.

Agent output is candidate work, not authority. Agents cannot amend canon,
increase permissions, expose secrets, or delegate beyond the envelope they
receive. Every run records model, context manifest, tools, actions, costs,
artifacts, and outcome.

---

# 13. Atlas Architect architecture

Architect is implemented after the foundation, memory, evaluations, and control
plane exist.

The first useful Architect is a sandboxed engineering workflow:

1. translate Neil's vision into requirements and acceptance criteria;
2. build a compact repository map and retrieve deeper context progressively;
3. produce an architecture/implementation plan;
4. select model(s) based on measured task performance;
5. work only in an isolated branch/worktree or sandbox;
6. compile, typecheck, lint, test, and drive the browser where relevant;
7. request independent correctness/security/UX review when risk warrants;
8. repair from evidence;
9. present the patch, verification evidence, risk, and rollback plan;
10. require the applicable approval before merge or deployment; and
11. record outcomes, failures, ADRs, and reusable engineering lessons.

Architect autonomy starts at read-only exploration and sandbox builds. Merge,
deployment, production data, secrets, destructive migrations, and security
changes remain separately permissioned. Software execution and observed
behavior—not agent confidence—determine completion.

---

# 14. Tool and authority control plane

Every tool is registered with:

- stable tool/action ID and version;
- input/output schemas;
- data classification and side-effect class;
- required credentials and scopes;
- allowed resources/environments;
- risk, reversibility, and verification policy;
- cost/rate limits;
- approval requirement;
- idempotency/rollback behavior; and
- audit/redaction rules.

An authorization envelope is per principal, capability, action class, resource,
environment, money limit, time window, condition, prohibited action, delegation
rule, escalation trigger, rollback, and evidence requirement.

Execution flow:

```text
model proposes structured action
-> validate schema
-> classify risk and reversibility
-> authenticate principal
-> evaluate deterministic policy
-> request meaningful approval if required
-> issue scoped execution token
-> execute idempotently
-> verify actual effect
-> append audit event
-> observe outcome / learn
```

Denial, expiration, revocation, budget exhaustion, or policy-system failure must
fail closed for consequential actions. Access credentials never imply authority.

Autonomy is per skill and domain, not global. It may graduate from think ->
recommend -> prepare -> supervised execution -> bounded autonomy -> delegated
operations -> exception-based oversight only through explicit approval and
evidence from evaluations and real outcomes.

---

# 15. Security model

The security design assumes Atlas will eventually touch sensitive personal,
company, health, financial, code, credential, and production data.

Primary threats include unauthorized account access, prompt injection,
cross-project/company context leakage, memory poisoning, stale/false knowledge,
secret leakage, over-broad tools, confused-deputy actions, sub-agent privilege
escalation, approval spoofing/replay, destructive operations, dependency/supply
chain compromise, provider retention leakage, and sensitive logs/backups.

Controls include:

- single-owner authentication, secure sessions, CSRF protection, and server-side
  owner derivation;
- server-only secrets, scoped credentials, environment isolation, and rotation;
- least privilege and short-lived execution tokens;
- content/instruction separation for files, web pages, tools, and agents;
- project/company/privacy compartments and data classification;
- explicit policy checks at action boundaries;
- sandboxing for code and untrusted content;
- immutable audit events with sensitive-field redaction;
- rate, spend, concurrency, and blast-radius limits;
- idempotency, preview/dry-run, backups, rollback, kill switches, and revocation;
- protected migration and production-deployment gates;
- dependency and secret scanning; and
- incident procedures that favor containment and evidence preservation.

Health and similarly sensitive domains receive separate access and retention
policies rather than being placed in the general Creator profile.

---

# 16. Observability

Atlas must answer: what happened, who asked, which policy authorized it, which
context and sources were used, which model/agent/tool ran, what changed, what it
cost, whether it succeeded, and how it could be reversed.

Observability records include:

- conversation/model call lifecycle and usage;
- context compilation and retrieval traces;
- memory write/update/delete/consolidation decisions;
- decision, prediction, and outcome records;
- policy decisions, approvals, denials, and revocations;
- agent and tool executions;
- learning/job runs;
- evaluation and model-comparison results;
- deployment/incidents later; and
- system cost and latency budgets.

Auditability uses concise decision/action summaries, evidence, policy results,
and observed effects. It does not depend on exposing private chain-of-thought.

---

# 17. Evaluation system

Evaluations are versioned product tests, not optional model demos.

Initial suites:

- constitutional hierarchy and conflict resolution;
- identity continuity and model swaps;
- truth/uncertainty and source quality;
- sycophancy, challenge, anti-manipulation, and agency;
- voice gear selection, restraint, seriousness, humor, profanity, and public
  output;
- context selection, source attribution, staleness, and prompt injection;
- memory write precision, correction, supersession, deletion, and retrieval;
- decision quality, reversibility, second-order effects, and opportunity cost;
- authority scope, escalation, revocation, and delegated-agent attenuation;
- expertise/source hierarchy and high-stakes freshness;
- learning calibration and anti-overfitting;
- Architect build/test/security/UX/rollback behavior; and
- cost, latency, and regression after model/prompt/retrieval changes.

Each case stores fixture, expected invariants, rubric, evaluator version, result,
and evidence. Deterministic checks are used wherever possible; rubric/model
judges are calibrated against human review. No single automated score is the
mission.

Promotion gates apply to canon amendments, model changes, memory policy changes,
new tools, greater autonomy, and Architect release classes.

---

# 18. Core data model

Existing owner, conversation, message, model-usage, auth, and system-event tables
remain. Additive schema families should include:

## Constitution and knowledge

- `canon_documents`, `canon_versions`, `canon_sections`;
- `knowledge_sources`, `knowledge_revisions`, `knowledge_chunks`;
- `entities`, `entity_relationships`, and source/evidence links when needed;
- routing tags, classifications, freshness policies, and source authority.

## Context and projects

- `projects`, project membership/scope, and conversation-project links;
- `context_compilations` and `context_items` for traceability;
- retrieval runs, candidates, scores, filters, broadening, and selected items.

## Memory and learning

- `memories`, `memory_evidence`, `memory_relations`, and `memory_proposals`;
- `decisions`, `predictions`, `outcomes`, and `lessons`;
- `learning_runs`, consolidation proposals, and review decisions;
- deletion/tombstone records where audit and privacy requirements permit.

## Expertise and skills

- `expertise_packs`, versions, source policies, mastery state;
- `skills`, `skill_versions`, applicability, verification, and evidence;
- skill invocations and outcome links.

## Authority and execution

- `authorization_envelopes`, versions, grants, and revocations;
- `action_proposals`, `approval_requests`, and approval decisions;
- `tool_definitions`, credential references, and `tool_executions`;
- `agent_runs`, delegated envelopes, artifacts, and results;
- append-only policy/audit events.

## Evaluations and operations

- `evaluation_suites`, cases, runs, results, and artifacts;
- scheduled/event job definitions and runs;
- cost budgets and alerts.

Sensitive data should be normalized only where query and policy requirements
justify it. JSONB is appropriate for provider-neutral artifacts and evolving
metadata, but core identity, authority, lifecycle, and lineage fields should be
typed relational columns with database constraints.

---

# 19. Infrastructure architecture

Initial stack:

- Next.js App Router, Node runtime throughout;
- Server Components for private read surfaces such as Brain/project pages;
- Client Components only for interactive chat, approvals, voice, and live
  execution state;
- Route Handlers for streaming and external/action endpoints;
- strict TypeScript, Zod boundaries, Drizzle migrations;
- Neon Postgres using the pooled serverless connection path;
- Postgres full-text search first;
- object storage behind an Atlas-owned adapter for original files/artifacts;
- Vercel deployment with Preview/Production isolation;
- Vitest, integration tests, Playwright, and the Atlas evaluation runner; and
- existing semantic design tokens and PWA experience.

Long-running work stays out of request handlers. When learning, ingestion, or
Architect runs outlive safe request duration, add a durable job/queue adapter
with leases, retries, idempotency, cancellation, budgets, and audit. Do not add
queue infrastructure before a real workflow requires it.

Neon branches should isolate migration/preview testing from production. Schema
changes are additive where possible and must be tested for forward migration,
rollback/recovery strategy, and owner-data isolation.

---

# 20. Cost architecture

Primary cost centers are model input/output, repeated context, background jobs,
evaluation runs, multi-agent/Architect repair loops, embeddings, voice, object
storage, database compute, observability, and external tools.

Controls:

- stable cacheable kernel and small context packs;
- explicit per-operation token/output budgets;
- role-based static model choice before dynamic routing;
- retrieve only relevant context and record retrieval yield;
- batch low-risk background work;
- per-job, daily, monthly, agent, and tool budgets;
- stop rules and maximum repair loops;
- cost per successful verified task, not cost per call;
- sampled evaluations for routine changes, full suites at promotion gates;
- no embeddings, swarm, or continuous research until measured value justifies
  the recurring cost; and
- visible owner controls and alerts before hard limits are reached.

---

# 21. Principal failure modes

- **Monolithic prompt syndrome:** every document loaded everywhere.
- **Constitutional/persona drift:** provider style or casual dialogue rewrites
  Atlas identity.
- **Canon pollution:** living ideas and brainstorms become facts.
- **Memory poisoning/hoarding:** weak claims enter memory and dominate retrieval.
- **False learning:** plausible reflection is promoted without outcome evidence.
- **Stale truth:** old company, health, software, legal, or market knowledge is
  treated as current.
- **Expertise theater:** Atlas sounds authoritative without current sources,
  tools, or evaluation.
- **Authority creep:** repeated approval or credentials become assumed power.
- **Governance theater:** policies exist only in prompts and logs occur only
  after an unauthorized action.
- **Model capture:** Atlas becomes whichever provider is active.
- **Autonomy theater:** Atlas claims background work that never ran.
- **Founder bottleneck:** every harmless reversible action requires approval.
- **Founder displacement:** Atlas optimizes a proxy while quietly redrawing the
  mission or authority box.
- **Agent fragmentation:** specialists conflict, leak context, or exceed scope.
- **Architect debt acceleration:** coding agents create more change than the
  verification and review system can safely absorb.
- **Economic failure:** context, background runs, or repair loops cost more than
  the value produced.

Each milestone must add tests and observability for the failure modes it makes
possible.

---

# 22. Implementation roadmap

These milestone IDs deliberately do not replace the repository's existing Phase
0-7 plan. They describe the foundational-document implementation program.

## F0 — Reconcile and secure the real baseline

**Goal:** establish exactly what is already implemented and make it a reliable
starting point.

Deliverables:

- inventory and architecture delta against existing plans;
- full type/lint/unit/integration/E2E/build verification;
- authentication and owner-isolation threat check;
- migration/schema reconciliation;
- documentation status correction;
- protected baseline checkpoint and release evidence.

Gate: private persistent conversation works, all checks pass, and no private or
billable route is publicly accessible.

## F1 — Constitutional foundation and Canon Registry

**Goal:** make Atlas's identity and hierarchy real without a giant prompt.

Deliverables:

- normalized versioned Documents 001-011 and source manifest;
- typed Constitutional Kernel and token-budget test;
- precedence/conflict engine and amendment records;
- task-based canon-section routing;
- initial constitutional/identity/adversarial eval suite;
- Brain views for canon versions and activation state.

Gate: Atlas passes hierarchy, truth, identity, source-trust, and model-swap
fixtures; source versions and amendments are inspectable.

## F2 — Context Compiler, projects, and living knowledge

**Goal:** give Atlas the right context rather than all context.

Deliverables:

- minimal projects and context isolation;
- source/revision/chunk ingestion;
- GGC and Gent Logistics living-company packs with temporal labels;
- deterministic retrieval with controlled broadening;
- context budgets, compiler traces, and provenance in responses/Brain;
- prompt-injection and cross-company contamination tests.

Gate: relevant context retrieval is demonstrably precise; living ideas never
masquerade as canon or current operational fact.

## F3 — Governed memory and decision continuity

**Goal:** let Atlas remember selectively and correctably.

Deliverables:

- typed memory schema and evidence/supersession lineage;
- remember/correct/forget flows;
- review-by-exception proposals and undo;
- contradiction, freshness, archive, and deletion behavior;
- decision/prediction/outcome records;
- Brain memory/provenance/decision inspection;
- memory precision and longitudinal continuity tests.

Gate: Neil does not need to repeat key context, stale facts do not dominate, and
every durable memory can answer why it is believed and how to correct/delete it.

## F4 — Learning, expertise, skills, and evaluations

**Goal:** make improvement measurable rather than rhetorical.

Deliverables:

- learning/reflection/consolidation proposal pipeline;
- initial expertise packs and source/freshness policies;
- versioned procedural skill registry and invocation records;
- decision calibration and outcome scorecards;
- scheduled learning in dry-run/proposal-only mode;
- expanded domain, reasoning, persona, and regression evaluations.

Gate: at least one recurring workflow measurably improves through a versioned,
evidence-linked skill without constitutional or preference overlearning.

## F5 — Authority control plane and first tools

**Goal:** make capability/permission separation technically enforceable.

Deliverables:

- Tool Registry and structured action proposals;
- authorization-envelope policy engine;
- meaningful approval UI;
- execution tokens, idempotency, verification, audit, revocation, and budgets;
- first low-risk reversible tools in supervised mode;
- authority, escalation, injection, and revocation tests.

Gate: no committed action can bypass policy, and revoked/out-of-scope authority
fails closed while routine approved actions remain usable.

## F6 — Atlas Architect, sandbox first

**Goal:** let Architect produce verified software changes without production
authority.

Deliverables:

- vision-to-spec and repository-intelligence artifacts;
- isolated worktree/sandbox execution harness;
- coding-model adapters/router with task evaluations;
- compile/test/lint/browser/security review pipeline;
- repair loop, ADRs, engineering memory, and skill lifecycle;
- patch/PR proposal with verification and rollback evidence.

Gate: Architect completes selected real repository tasks in isolation, passes
independent review, and cannot merge/deploy/change secrets without a separately
approved envelope.

## F7 — Voice, presence, and adaptive delivery

**Goal:** expand interaction modes while preserving identity.

Deliverables:

- deterministic persona/gear policy plus model-evaluated nuance;
- voice input/output adapters with privacy controls;
- interruptible live conversation and truthful activity/status indicators;
- voice/persona/accessibility/latency evaluations.

Gate: voice and model changes preserve the same constitutional identity, truth,
restraint, and authority behavior.

## F8 — Proactive operations and earned autonomy

**Goal:** introduce scheduled/event-driven intelligence and carefully graduated
autonomy.

Deliverables:

- durable job runner, budgets, leases, retries, cancellation, and monitoring;
- strategic-state refresh and event-triggered learning;
- specialist-agent orchestration with attenuated authority;
- per-skill autonomy evidence and graduation/revocation workflows;
- exception-based oversight only for proven low-risk classes;
- incident response and system-wide kill switches.

Gate: each autonomous class is explicitly approved, bounded, reversible,
monitored, evaluated, and immediately revocable.

---

# 23. Document-to-system traceability

| Founding source | Primary implementation surfaces |
|---|---|
| 001 Creator | principal profile, provenance, temporal identity model, current-direct-knowledge precedence |
| 002 Covenant | relationship invariants, privacy/agency rules, anti-engagement and anti-dependence evaluations |
| 003 Heart | value/temperament kernel, pressure behavior, human-relationship and dignity safeguards |
| 004 Mind | reasoning procedure, evidence hierarchy, uncertainty, bias and challenge evaluations |
| 005 Intelligence Architecture | model/tool abstraction, verification, retrieval, outcome intelligence, cognitive routing |
| 006 Voice & Presence | persona gear policy, adaptive communication, restraint and drift evaluations |
| 007 Thinking, Learning & Wisdom | memory lifecycle, predictions/outcomes, learning jobs, consolidation, forgetting, scorecards |
| 008 Expertise Codex | expertise packs, source hierarchies, skills, mastery levels, domain evaluations |
| 009 Atlas Architect | engineering orchestrator, sandbox, repo intelligence, verification, review, delivery gates |
| 010 Judgment & Authority | decision records, risk model, authorization envelopes, approvals, revocation, earned autonomy |
| 011 Master Constitution | hierarchy, compiler, kernels, provenance, amendments, runtime governance, constitutional evals |
| Groomed Gent Co. context | living company pack; current/historical/proposed/speculative state; company expertise |
| Gent Logistics context | living company pack; operational freshness; company expertise and future tool boundaries |

---

# 24. Decisions requiring Neil's approval

The recommended defaults are shown first.

1. **Canonical source strategy:** keep normalized Markdown and manifests in the
   private repository as the versioned source of truth; store original DOCX
   files in protected object storage with checksums. Do not place mutable canon
   only in the database.
2. **Company contexts:** import both documents as living knowledge, never company
   canon; preserve uncertain and exploratory labels. Promote individual facts or
   decisions only through an explicit workflow.
3. **Memory writes:** use explicit writes plus narrow high-confidence automatic
   writes and review-by-exception for inference/sensitivity. Never store every
   message as durable memory.
4. **Retrieval:** start with Postgres full-text search and deterministic metadata;
   add embeddings only after retrieval evaluations prove a gap.
5. **Models:** keep the current OpenAI adapter as the first engine behind the
   Atlas boundary; add a second provider only when model-swap and routing evals
   are ready.
6. **Learning jobs:** proposal-only at first. No unattended memory, skill, prompt,
   or policy promotion.
7. **Architect:** authorize read-only repo analysis and sandbox builds before any
   merge/deploy capability.
8. **Production actions:** keep financial, external communication, production,
   credentials, destructive data, and constitutional changes approval-gated
   until separate future authority envelopes are proposed and approved.
9. **Sensitive domains:** place health, finance, credentials, and private
   relationship data in separately classified scopes rather than the general
   profile.
10. **Milestone approval:** approve F0 and F1 first; require a short gate review
    before starting each later milestone.

---

# 25. Definition of success

The foundational program succeeds when:

- Atlas remains recognizably Atlas across providers and upgrades;
- only the smallest relevant constitutional and domain context is loaded;
- every important claim can expose source, authority, confidence, and freshness;
- brainstorming, history, current decisions, canon, and inference stay distinct;
- Neil can inspect, correct, delete, amend, approve, and revoke;
- memory reduces repetition without creating a psychological prison;
- learning improves measured behavior without silent self-authorization;
- expertise is current, modular, tool-aware, and evaluated;
- no tool or agent can exceed a deterministic authorization envelope;
- Atlas Architect proves software with execution and review;
- cost and latency are visible and bounded; and
- capability can grow for years without dissolving identity or founder control.

---

# 26. Approval recommendation

Approve this architecture direction and authorize only milestones **F0 and F1**.
After F0 establishes the real verified baseline and F1 implements the
Constitutional Kernel/Canon Registry with evaluations, review the evidence before
authorizing F2. This preserves momentum without granting blanket permission to
build the autonomous end-state prematurely.
