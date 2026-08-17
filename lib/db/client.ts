import "server-only";

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import { serverEnv } from "@/lib/env/server";

import { assertDatabaseEnvironment } from "./environment";
import * as schema from "./schema";

assertDatabaseEnvironment({
  databaseEnvironment: serverEnv.DATABASE_ENVIRONMENT,
  ...(serverEnv.VERCEL_ENV ? { vercelEnvironment: serverEnv.VERCEL_ENV } : {}),
});

const sql = neon(serverEnv.DATABASE_URL);

/** Server-only Neon HTTP client. It opens no persistent pool in Vercel functions. */
export const db = drizzle({ client: sql, schema });
