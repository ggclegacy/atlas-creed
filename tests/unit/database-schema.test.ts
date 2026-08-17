import { readFile } from "node:fs/promises";
import path from "node:path";

import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import {
  conversations,
  messages,
  owners,
  systemEvents,
} from "../../lib/db/schema";

const ROOT = path.resolve(import.meta.dirname, "../..");

describe("Phase 1 database schema", () => {
  it("contains only the approved domain tables plus Auth.js adapter storage", () => {
    expect(
      [owners, conversations, messages, systemEvents].map(
        (table) => getTableConfig(table).name,
      ),
    ).toEqual(["owners", "conversations", "messages", "system_events"]);
  });

  it.each([conversations, messages, systemEvents])(
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
});
