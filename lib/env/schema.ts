import { z } from "zod";

/**
 * Environment schemas — pure, side-effect free, and therefore testable.
 *
 * The runtime guards live in the consuming modules (`server.ts` imports
 * `server-only`; `client.ts` reads inlined literals). Keeping the schemas here
 * means tests can exercise validation without tripping those guards.
 *
 * Build Plan §14. Variables are added as the phases that need them arrive —
 * an env schema demanding DATABASE_URL before Phase 1 would block every
 * developer for no benefit.
 */

/** Server-only configuration. Never sent to the browser. */
export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Phase 1 adds: DATABASE_URL, AUTH_SECRET, AUTH_URL, RESEND_API_KEY
  // Phase 2 adds: ANTHROPIC_API_KEY
});

/**
 * Client-exposed configuration.
 *
 * Everything here is inlined into the browser bundle at build time and is
 * therefore PUBLIC. Never add a secret. `tests/arch/env-boundary.test.ts`
 * enforces this against the secret-name pattern.
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_NAME: z.string().min(1).default("Atlas Creed"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type ClientEnv = z.infer<typeof clientEnvSchema>;

/**
 * Formats a Zod failure into an actionable message. A missing variable should
 * name itself at startup, not surface as `undefined` deep inside a request.
 */
export function formatEnvError(error: z.ZodError, scope: string): string {
  const issues = error.issues
    .map((i) => `  · ${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("\n");
  return `Invalid ${scope} environment configuration:\n${issues}\n\nSee .env.example.`;
}

export function parseServerEnv(source: Record<string, unknown>): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(formatEnvError(result.error, "server"));
  }
  return result.data;
}

export function parseClientEnv(source: Record<string, unknown>): ClientEnv {
  const result = clientEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(formatEnvError(result.error, "client"));
  }
  return result.data;
}
