import "server-only";

import { parseServerEnv } from "./schema";

/**
 * Validated server configuration.
 *
 * `server-only` makes importing this from a Client Component a BUILD failure,
 * not a runtime surprise — the strongest available guarantee that server
 * configuration never reaches the browser (Build Plan §14).
 *
 * This module is the single permitted reader of server-side `process.env`;
 * an ESLint rule blocks direct access everywhere else.
 */
export const serverEnv = parseServerEnv(process.env);
