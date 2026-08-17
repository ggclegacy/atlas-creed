import { parseClientEnv } from "./schema";

/**
 * Validated client configuration.
 *
 * Every value here is inlined into the browser bundle at build time and is
 * PUBLIC. Never add a secret (Build Plan §14).
 *
 * Variables must be referenced as complete literals — `process.env.NEXT_PUBLIC_X`
 * — because Next.js performs a static text substitution at build time. Dynamic
 * access such as `process.env[name]` is NOT inlined and resolves to undefined
 * in the browser.
 */
export const clientEnv = parseClientEnv({
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
});
