import { readFile } from "node:fs/promises";
import path from "node:path";

import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  canonDocuments,
  canonSections,
  conflictRecords,
  constitutionalAmendments,
  contextTraceItems,
  contextTraces,
  conversations,
  knowledgeRecords,
  messages,
  modelUsage,
  owners,
  projects,
  systemEvents,
} from "../../lib/db/schema";

const ROOT = path.resolve(import.meta.dirname, "../..");

describe("Phase 2 database schema", () => {
  it("contains the approved conversation and usage domain", () => {
    expect(
      [owners, conversations, messages, modelUsage, systemEvents].map(
        (table) => getTableConfig(table).name,
      ),
    ).toEqual([
      "owners",
      "conversations",
      "messages",
      "model_usage",
      "system_events",
    ]);
  });

  it.each([conversations, messages, modelUsage, systemEvents])(
    "$name carries owner_id from the first migration",
    (table) => {
      expect(
        getTableConfig(table).columns.some(
          (column) => column.name === "owner_id",
        ),
      ).toBe(true);
    },
  );

  it("stores message content as JSONB and sessions in the database", async () => {
    const migration = await readFile(
      path.join(ROOT, "lib/db/migrations/0000_lucky_iceman.sql"),
      "utf8",
    );

    expect(migration).toContain('"content" jsonb NOT NULL');
    expect(migration).toContain('CREATE TABLE "auth_sessions"');
    expect(migration).toContain('CREATE TABLE "auth_verification_tokens"');
  });

  it("adds lifecycle, idempotency, and raw usage constraints additively", async () => {
    const migration = await readFile(
      path.join(ROOT, "lib/db/migrations/0001_dear_iron_monger.sql"),
      "utf8",
    );
    expect(migration).toContain('CREATE TABLE "model_usage"');
    expect(migration).toContain('"client_turn_id" uuid');
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "messages_conversation_turn_role_unique"',
    );
    expect(migration).toContain(
      "Phase 2 migration found an unsupported messages.content shape",
    );
    expect(migration).toContain(
      'UPDATE "conversations" SET "last_message_at" = "updated_at"',
    );
  });
});

describe("F1 constitutional schema", () => {
  it("contains only the bounded constitutional, scope, conflict, and trace primitives", () => {
    expect(
      [
        canonDocuments,
        canonSections,
        projects,
        knowledgeRecords,
        conflictRecords,
        contextTraces,
        contextTraceItems,
        constitutionalAmendments,
      ].map((table) => getTableConfig(table).name),
    ).toEqual([
      "canon_documents",
      "canon_sections",
      "projects",
      "knowledge_records",
      "conflict_records",
      "context_traces",
      "context_trace_items",
      "constitutional_amendments",
    ]);
  });

  it("adds Postgres full-text indexes and protected amendment evidence", async () => {
    const migration = await readFile(
      path.join(ROOT, "lib/db/migrations/0002_lucky_thundra.sql"),
      "utf8",
    );
    const followup = await readFile(
      path.join(ROOT, "lib/db/migrations/0003_sparkling_mister_sinister.sql"),
      "utf8",
    );
    expect(migration).toContain("USING gin (to_tsvector('english'");
    expect(migration).toContain('CREATE TABLE "context_traces"');
    expect(migration).toContain('CREATE TABLE "conflict_records"');
    expect(followup).toContain('ADD COLUMN "proposed_sections" jsonb NOT NULL');
    expect(followup).toContain('ADD COLUMN "evaluation_evidence" text');
  });

  it("enforces constitutional taxonomy and keeps secrets out of ordinary records", async () => {
    const enforcement = await readFile(
      path.join(ROOT, "lib/db/migrations/0004_numerous_shadowcat.sql"),
      "utf8",
    );
    expect(enforcement).toContain(
      'CONSTRAINT "knowledge_records_sensitivity_check"',
    );
    expect(enforcement).toContain(
      'CONSTRAINT "canon_sections_governance_check"',
    );
    expect(enforcement).toContain(
      'CONSTRAINT "context_trace_items_sensitivity_check"',
    );
    expect(enforcement).not.toContain("'SECRETS'");
  });
});
