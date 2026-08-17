import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { getServerEnv } from "@/lib/env/server";

import { assertDatabaseEnvironment } from "./environment";
import * as schema from "./schema";

function createDatabase() {
  const env = getServerEnv();

  assertDatabaseEnvironment({
    databaseEnvironment: env.DATABASE_ENVIRONMENT,
    ...(env.VERCEL_ENV ? { vercelEnvironment: env.VERCEL_ENV } : {}),
  });

  const client = postgres(env.DATABASE_URL, {
    connect_timeout: 10,
    idle_timeout: 10,
    max: 4,
    prepare: false,
  });
  return drizzle(client, { schema });
}

let database: ReturnType<typeof createDatabase> | undefined;

/** Lazily creates the transaction-capable Postgres pool. */
export function getDatabase(): ReturnType<typeof createDatabase> {
  database ??= createDatabase();
  return database;
}
