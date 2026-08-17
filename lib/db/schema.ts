import {
  bigint,
  check,
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
