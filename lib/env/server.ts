import "server-only";

import { parseServerEnv } from "./schema";

/**
 * Lazily validated server configuration.
 *
 * `server-only` makes importing this from a Client Component a BUILD failure,
 * not a runtime surprise — the strongest available guarantee that server
 * configuration never reaches the browser (Build Plan §14).
 *
 * Validation happens on the first server execution path that needs Phase 1
 * services, rather than when Next.js imports modules to inspect routes during
 * a build. Runtime configuration is immutable for a deployed process, so the
 * parsed result is cached after that first successful read.
 *
 * This module is the single permitted reader of server-side `process.env`; an
 * ESLint rule blocks direct access everywhere else.
 */
let cachedServerEnv: ReturnType<typeof parseServerEnv> | undefined;

export function getServerEnv(): ReturnType<typeof parseServerEnv> {
  cachedServerEnv ??= parseServerEnv(process.env);
  return cachedServerEnv;
}
