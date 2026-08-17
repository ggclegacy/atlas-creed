import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import postgres from "postgres";

import { parseDatabaseRuntimeEnv } from "../lib/env/schema.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MIGRATIONS = path.join(ROOT, "lib/db/migrations");

const EXPECTED_TABLES = [
  "auth_accounts",
  "auth_sessions",
  "auth_verification_tokens",
  "canon_documents",
  "canon_sections",
  "conflict_records",
  "constitutional_amendments",
  "context_trace_items",
  "context_traces",
  "conversations",
  "knowledge_records",
  "messages",
  "model_usage",
  "owners",
  "projects",
  "system_events",
];

const EXPECTED_CONSTRAINTS = [
  "canon_sections_governance_check",
  "constitutional_amendments_status_check",
  "context_trace_items_sensitivity_check",
  "knowledge_records_information_state_check",
  "knowledge_records_sensitivity_check",
  "messages_status_check",
  "model_usage_status_check",
];

class ReadinessError extends Error {}

function sha256(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

async function expectedMigrations() {
  const journal = JSON.parse(
    await readFile(path.join(MIGRATIONS, "meta/_journal.json"), "utf8"),
  );
  return Promise.all(
    journal.entries.map(async (entry) => {
      const contents = await readFile(
        path.join(MIGRATIONS, `${entry.tag}.sql`),
        "utf8",
      );
      return {
        tag: entry.tag,
        hash: sha256(contents),
        createdAt: String(entry.when),
      };
    }),
  );
}

async function verify() {
  const env = parseDatabaseRuntimeEnv(process.env);
  if (env.VERCEL_ENV && env.VERCEL_ENV !== env.DATABASE_ENVIRONMENT) {
    throw new ReadinessError(
      "DATABASE_ENVIRONMENT does not match the current Vercel environment.",
    );
  }

  const client = postgres(env.DATABASE_URL, {
    connect_timeout: 10,
    idle_timeout: 5,
    max: 1,
    prepare: false,
  });
  try {
    const expected = await expectedMigrations();
    let applied;
    try {
      applied = await client`
        select hash, created_at
        from drizzle.__drizzle_migrations
        order by created_at, id
      `;
    } catch {
      throw new ReadinessError(
        "The Drizzle migration ledger is missing or unreadable. Use a fresh database and run db:migrate; never backfill an existing shared schema without review.",
      );
    }
    if (applied.length !== expected.length) {
      throw new ReadinessError(
        `Migration ledger has ${applied.length} entries; ${expected.length} are required.`,
      );
    }
    for (const [index, migration] of expected.entries()) {
      const row = applied[index];
      if (
        !row ||
        row.hash !== migration.hash ||
        String(row.created_at) !== migration.createdAt
      ) {
        throw new ReadinessError(
          `Migration ledger diverges at ${migration.tag}; stop and reconcile the target database.`,
        );
      }
    }

    const tableRows = await client`
      select table_name
      from information_schema.tables
      where table_schema = 'public' and table_type = 'BASE TABLE'
    `;
    const tables = new Set(tableRows.map((row) => row.table_name));
    const missingTables = EXPECTED_TABLES.filter((table) => !tables.has(table));
    if (missingTables.length) {
      throw new ReadinessError(
        `Database is missing required tables: ${missingTables.join(", ")}.`,
      );
    }

    const constraintRows = await client`
      select constraint_name
      from information_schema.table_constraints
      where constraint_schema = 'public'
    `;
    const constraints = new Set(
      constraintRows.map((row) => row.constraint_name),
    );
    const missingConstraints = EXPECTED_CONSTRAINTS.filter(
      (constraint) => !constraints.has(constraint),
    );
    if (missingConstraints.length) {
      throw new ReadinessError(
        `Database is missing required constraints: ${missingConstraints.join(", ")}.`,
      );
    }

    process.stdout.write(
      `Database readiness passed: ${expected.length} migrations, ${EXPECTED_TABLES.length} required tables, and ${EXPECTED_CONSTRAINTS.length} security constraints verified.\n`,
    );
  } finally {
    await client.end({ timeout: 5 });
  }
}

try {
  await verify();
} catch (error) {
  if (error instanceof ReadinessError) {
    process.stderr.write(`${error.message}\n`);
  } else if (
    error instanceof Error &&
    error.message.startsWith("Invalid database")
  ) {
    process.stderr.write(`${error.message}\n`);
  } else {
    process.stderr.write(
      "Database readiness verification failed. Confirm the target, credentials, network access, and Neon compute state.\n",
    );
  }
  process.exitCode = 1;
}
