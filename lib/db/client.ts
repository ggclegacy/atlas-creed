import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { getServerEnv } from "@/lib/env/server";

import { assertDatabaseEnvironment } from "./environment";
import * as schema from "./schema";

function createDatabase() {
  const env = getServerEnv();

  assertDatabaseEnvironment({
    databaseEnvironment: env.DATABASE_ENVIRONMENT,
    ...(env.VERCEL_ENV ? { vercelEnvironment: env.VERCEL_ENV } : {}),
  });

  const sql = neon(env.DATABASE_URL);
  return drizzle({ client: sql, schema });
}

let database: ReturnType<typeof createDatabase> | undefined;

/** Lazily creates the Neon HTTP client; it opens no persistent pool in Vercel functions. */
export function getDatabase(): ReturnType<typeof createDatabase> {
  database ??= createDatabase();
  return database;
}
