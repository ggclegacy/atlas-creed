import {
  bigint,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import type { AtlasMessageContent } from "@/lib/conversation/content";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

/** Atlas's single-owner root entity. */
export const owners = pgTable(
  "owners",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("display_name"),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", {
      mode: "date",
      withTimezone: true,
    }),
    image: text("image"),
    ...timestamps,
  },
  (table) => [uniqueIndex("owners_email_unique").on(table.email)],
);

/** Reserved adapter table from the applied Phase 1 baseline migration. */
export const accounts = pgTable(
  "auth_accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
    index("auth_accounts_owner_idx").on(table.userId),
  ],
);

export const sessions = pgTable(
  "auth_sessions",
  {
    sessionToken: text("session_token").primaryKey(),
    userId: uuid("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => [index("auth_sessions_owner_idx").on(table.userId)],
);

export const verificationTokens = pgTable(
  "auth_verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", {
      mode: "date",
      withTimezone: true,
    }).notNull(),
  },
  (table) => [primaryKey({ columns: [table.identifier, table.token] })],
);

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    title: text("title"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...timestamps,
  },
  (table) => [
    index("conversations_owner_idx").on(table.ownerId),
    index("conversations_owner_last_message_idx").on(
      table.ownerId,
      table.lastMessageAt.desc(),
      table.id.desc(),
    ),
  ],
);

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    role: text("role").$type<"user" | "assistant" | "system">().notNull(),
    content: jsonb("content").$type<AtlasMessageContent>().notNull(),
    provider: text("provider"),
    model: text("model"),
    status: text("status")
      .$type<"pending" | "streaming" | "completed" | "interrupted" | "failed">()
      .default("completed")
      .notNull(),
    clientTurnId: uuid("client_turn_id"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    finishReason: text("finish_reason"),
    errorCode: text("error_code"),
    providerResponseId: text("provider_response_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("messages_owner_idx").on(table.ownerId),
    index("messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
      table.id,
    ),
    index("messages_owner_conversation_created_idx").on(
      table.ownerId,
      table.conversationId,
      table.createdAt,
      table.id,
    ),
    uniqueIndex("messages_conversation_turn_role_unique").on(
      table.conversationId,
      table.clientTurnId,
      table.role,
    ),
    check(
      "messages_status_check",
      sql`${table.status} in ('pending', 'streaming', 'completed', 'interrupted', 'failed')`,
    ),
  ],
);

/** Context scope only; this is deliberately not a project-management system. */
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    active: boolean("active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("projects_owner_slug_unique").on(table.ownerId, table.slug),
    index("projects_owner_active_idx").on(table.ownerId, table.active),
  ],
);

export const canonDocuments = pgTable(
  "canon_documents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    canonicalId: text("canonical_id").notNull(),
    title: text("title").notNull(),
    version: text("version"),
    status: text("status").$type<"active" | "draft" | "retired">().notNull(),
    effectiveDate: date("effective_date"),
    authority: text("authority").notNull(),
    source: text("source").notNull(),
    sourceReference: text("source_reference").notNull(),
    sourceChecksum: text("source_checksum").notNull(),
    normalizedChecksum: text("normalized_checksum").notNull(),
    sensitivity: text("sensitivity").notNull(),
    provenance: text("provenance").notNull(),
    ingestedAt: timestamp("ingested_at", { withTimezone: true }).notNull(),
    supersedesCanonicalId: text("supersedes_canonical_id"),
    supersededByCanonicalId: text("superseded_by_canonical_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("canon_documents_revision_unique").on(
      table.canonicalId,
      table.normalizedChecksum,
    ),
    index("canon_documents_active_idx").on(table.canonicalId, table.status),
    check(
      "canon_documents_status_check",
      sql`${table.status} in ('active', 'draft', 'retired')`,
    ),
    check(
      "canon_documents_sensitivity_check",
      sql`${table.sensitivity} in ('PUBLIC', 'INTERNAL', 'PRIVATE', 'SENSITIVE', 'HIGHLY_SENSITIVE')`,
    ),
  ],
);

export const canonSections = pgTable(
  "canon_sections",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => canonDocuments.id, { onDelete: "cascade" }),
    canonicalSectionId: text("canonical_section_id").notNull(),
    ordinal: integer("ordinal").notNull(),
    title: text("title").notNull(),
    normalizedText: text("normalized_text").notNull(),
    checksum: text("checksum").notNull(),
    informationState: text("information_state").default("CANONICAL").notNull(),
    trustClass: text("trust_class")
      .default("SYSTEM_CONSTITUTIONAL_INSTRUCTION")
      .notNull(),
    authorityClass: text("authority_class")
      .default("PROTECTED_CONSTITUTION")
      .notNull(),
    sensitivity: text("sensitivity").notNull(),
    tokenEstimate: integer("token_estimate").notNull(),
  },
  (table) => [
    uniqueIndex("canon_sections_document_section_unique").on(
      table.documentId,
      table.canonicalSectionId,
    ),
    index("canon_sections_document_ordinal_idx").on(
      table.documentId,
      table.ordinal,
    ),
    index("canon_sections_search_idx").using(
      "gin",
      sql`to_tsvector('english', coalesce(${table.title}, '') || ' ' || coalesce(${table.normalizedText}, ''))`,
    ),
    check(
      "canon_sections_governance_check",
      sql`${table.informationState} = 'CANONICAL' and ${table.trustClass} = 'SYSTEM_CONSTITUTIONAL_INSTRUCTION' and ${table.authorityClass} = 'PROTECTED_CONSTITUTION'`,
    ),
    check(
      "canon_sections_sensitivity_check",
      sql`${table.sensitivity} in ('PUBLIC', 'INTERNAL', 'PRIVATE', 'SENSITIVE', 'HIGHLY_SENSITIVE')`,
    ),
    check(
      "canon_sections_token_estimate_check",
      sql`${table.tokenEstimate} > 0`,
    ),
  ],
);

export const knowledgeRecords = pgTable(
  "knowledge_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    key: text("key").notNull(),
    title: text("title").notNull(),
    content: text("content").notNull(),
    informationState: text("information_state").notNull(),
    trustClass: text("trust_class").notNull(),
    authorityClass: text("authority_class").notNull(),
    sensitivity: text("sensitivity").notNull(),
    confidence: integer("confidence"),
    sourceType: text("source_type").notNull(),
    sourceReference: text("source_reference").notNull(),
    provenance: text("provenance").notNull(),
    validFrom: timestamp("valid_from", { withTimezone: true }),
    validTo: timestamp("valid_to", { withTimezone: true }),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    supersededBy: uuid("superseded_by"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("knowledge_records_owner_project_key_unique").on(
      table.ownerId,
      table.projectId,
      table.key,
    ),
    index("knowledge_records_owner_project_state_idx").on(
      table.ownerId,
      table.projectId,
      table.informationState,
    ),
    index("knowledge_records_search_idx").using(
      "gin",
      sql`to_tsvector('english', coalesce(${table.title}, '') || ' ' || coalesce(${table.content}, ''))`,
    ),
    check(
      "knowledge_records_information_state_check",
      sql`${table.informationState} in ('CURRENT_FACT', 'HISTORICAL_FACT', 'DECISION', 'PREFERENCE', 'PROPOSAL', 'HYPOTHESIS', 'BRAINSTORM', 'SUPERSEDED', 'DISPUTED', 'UNKNOWN')`,
    ),
    check(
      "knowledge_records_trust_class_check",
      sql`${table.trustClass} in ('AUTHORIZED_FOUNDER_INSTRUCTION', 'AUTHORIZED_OPERATIONAL_POLICY', 'TRUSTED_FACT_SOURCE', 'UNTRUSTED_CONTENT')`,
    ),
    check(
      "knowledge_records_authority_class_check",
      sql`${table.authorityClass} in ('CURRENT_FOUNDER_DIRECTION', 'CURRENT_VERIFIED_STATE', 'EXPLICIT_DECISION', 'DOMAIN_CANON', 'VALIDATED_KNOWLEDGE', 'PREFERENCE', 'INFERENCE', 'UNTRUSTED_CONTENT')`,
    ),
    check(
      "knowledge_records_sensitivity_check",
      sql`${table.sensitivity} in ('PUBLIC', 'INTERNAL', 'PRIVATE', 'SENSITIVE', 'HIGHLY_SENSITIVE')`,
    ),
    check(
      "knowledge_records_confidence_check",
      sql`${table.confidence} is null or (${table.confidence} >= 0 and ${table.confidence} <= 100)`,
    ),
  ],
);

export const conflictRecords = pgTable(
  "conflict_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    summary: text("summary").notNull(),
    sourceIds: jsonb("source_ids").$type<readonly string[]>().notNull(),
    relevantPassages: jsonb("relevant_passages")
      .$type<readonly string[]>()
      .notNull(),
    authorityLevels: jsonb("authority_levels")
      .$type<readonly string[]>()
      .notNull(),
    reason: text("reason").notNull(),
    blocksTask: boolean("blocks_task").default(true).notNull(),
    recommendedResolution: text("recommended_resolution").notNull(),
    status: text("status")
      .$type<"open" | "resolved" | "dismissed">()
      .default("open")
      .notNull(),
    resolution: text("resolution"),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("conflict_records_owner_status_idx").on(table.ownerId, table.status),
    check(
      "conflict_records_status_check",
      sql`${table.status} in ('open', 'resolved', 'dismissed')`,
    ),
  ],
);

export const contextTraces = pgTable(
  "context_traces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(() => conversations.id, {
      onDelete: "cascade",
    }),
    messageId: uuid("message_id").references(() => messages.id, {
      onDelete: "set null",
    }),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "set null",
    }),
    taskCategory: text("task_category").notNull(),
    kernelId: text("kernel_id").notNull(),
    kernelVersion: text("kernel_version").notNull(),
    kernelChecksum: text("kernel_checksum").notNull(),
    modelProvider: text("model_provider").notNull(),
    model: text("model").notNull(),
    estimatedInputTokens: integer("estimated_input_tokens").notNull(),
    retrievedItemCount: integer("retrieved_item_count").notNull(),
    excludedItemCount: integer("excluded_item_count").notNull(),
    status: text("status").$type<"compiled" | "used" | "failed">().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("context_traces_owner_created_idx").on(
      table.ownerId,
      table.createdAt,
    ),
    index("context_traces_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
  ],
);

export const contextTraceItems = pgTable(
  "context_trace_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    traceId: uuid("trace_id")
      .notNull()
      .references(() => contextTraces.id, { onDelete: "cascade" }),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    sourceVersion: text("source_version"),
    title: text("title").notNull(),
    informationState: text("information_state").notNull(),
    trustClass: text("trust_class").notNull(),
    authorityClass: text("authority_class").notNull(),
    sensitivity: text("sensitivity").notNull(),
    included: boolean("included").notNull(),
    reason: text("reason").notNull(),
    tokenEstimate: integer("token_estimate").notNull(),
    rank: integer("rank"),
    sourceReference: text("source_reference").notNull(),
    provenance: text("provenance").notNull(),
  },
  (table) => [
    index("context_trace_items_trace_idx").on(table.traceId),
    check(
      "context_trace_items_sensitivity_check",
      sql`${table.sensitivity} in ('PUBLIC', 'INTERNAL', 'PRIVATE', 'SENSITIVE', 'HIGHLY_SENSITIVE')`,
    ),
    check(
      "context_trace_items_token_estimate_check",
      sql`${table.tokenEstimate} >= 0`,
    ),
  ],
);

export const constitutionalAmendments = pgTable(
  "constitutional_amendments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    oldDocumentId: uuid("old_document_id")
      .notNull()
      .references(() => canonDocuments.id, { onDelete: "restrict" }),
    proposedTitle: text("proposed_title").notNull(),
    proposedVersion: text("proposed_version").notNull(),
    proposedNormalizedText: text("proposed_normalized_text").notNull(),
    proposedSections: jsonb("proposed_sections")
      .$type<
        readonly {
          readonly id: string;
          readonly ordinal: number;
          readonly title: string;
          readonly text: string;
          readonly checksum: string;
        }[]
      >()
      .notNull(),
    rationale: text("rationale").notNull(),
    diff: text("diff").notNull(),
    impactAnalysis: text("impact_analysis").notNull(),
    status: text("status")
      .$type<"proposed" | "approved" | "rejected" | "activated">()
      .default("proposed")
      .notNull(),
    approvalPhraseHash: text("approval_phrase_hash"),
    evaluationEvidence: text("evaluation_evidence"),
    approvedByOwnerId: uuid("approved_by_owner_id").references(
      () => owners.id,
      {
        onDelete: "restrict",
      },
    ),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    effectiveDate: date("effective_date"),
    activatedDocumentId: uuid("activated_document_id").references(
      () => canonDocuments.id,
      { onDelete: "restrict" },
    ),
    ...timestamps,
  },
  (table) => [
    index("constitutional_amendments_owner_status_idx").on(
      table.ownerId,
      table.status,
    ),
    check(
      "constitutional_amendments_status_check",
      sql`${table.status} in ('proposed', 'approved', 'rejected', 'activated')`,
    ),
  ],
);

export const modelUsage = pgTable(
  "model_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    conversationId: uuid("conversation_id").references(() => conversations.id, {
      onDelete: "cascade",
    }),
    messageId: uuid("message_id").references(() => messages.id, {
      onDelete: "set null",
    }),
    contextTraceId: uuid("context_trace_id").references(
      () => contextTraces.id,
      { onDelete: "set null" },
    ),
    purpose: text("purpose")
      .$type<"conversation_turn" | "conversation_title">()
      .notNull(),
    role: text("role").$type<"conversation" | "background">().notNull(),
    provider: text("provider").notNull(),
    model: text("model").notNull(),
    status: text("status")
      .$type<"started" | "completed" | "cancelled" | "failed">()
      .default("started")
      .notNull(),
    requestId: text("request_id"),
    responseId: text("response_id"),
    inputTokens: bigint("input_tokens", { mode: "number" }),
    cachedInputTokens: bigint("cached_input_tokens", { mode: "number" }),
    cacheWriteInputTokens: bigint("cache_write_input_tokens", {
      mode: "number",
    }),
    outputTokens: bigint("output_tokens", { mode: "number" }),
    reasoningTokens: bigint("reasoning_tokens", { mode: "number" }),
    totalTokens: bigint("total_tokens", { mode: "number" }),
    finishReason: text("finish_reason"),
    errorCode: text("error_code"),
    latencyMs: integer("latency_ms"),
    timeToFirstTokenMs: integer("time_to_first_token_ms"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("model_usage_owner_started_idx").on(table.ownerId, table.startedAt),
    index("model_usage_conversation_started_idx").on(
      table.conversationId,
      table.startedAt,
    ),
    index("model_usage_message_idx").on(table.messageId),
    index("model_usage_context_trace_idx").on(table.contextTraceId),
    check(
      "model_usage_purpose_check",
      sql`${table.purpose} in ('conversation_turn', 'conversation_title')`,
    ),
    check(
      "model_usage_role_check",
      sql`${table.role} in ('conversation', 'background')`,
    ),
    check(
      "model_usage_status_check",
      sql`${table.status} in ('started', 'completed', 'cancelled', 'failed')`,
    ),
  ],
);

export const systemEvents = pgTable(
  "system_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => owners.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    authorityLevel: text("authority_level").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    outcome: jsonb("outcome").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("system_events_owner_created_idx").on(table.ownerId, table.createdAt),
  ],
);
