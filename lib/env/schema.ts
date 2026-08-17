import { z } from "zod";

/**
 * Environment schemas — pure, side-effect free, and therefore testable.
 *
 * The runtime guard lives in `server.ts`, which imports `server-only`. Keeping
 * the schema here means tests can exercise validation without tripping that
 * guard or reading the real process environment.
 *
 * Build Plan §14. Variables are added only when their approved phase arrives.
 * Direct-access Phase 1 requires only the database values below. Authentication
 * must be reintroduced before the shell stores or exposes private owner data.
 */

/** Server-only configuration. Never sent to the browser. */
export const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  DATABASE_URL: z
    .url()
    .refine(
      (value) =>
        value.startsWith("postgres://") || value.startsWith("postgresql://"),
      "Must be a PostgreSQL connection URL",
    ),
  DATABASE_ENVIRONMENT: z.enum(["development", "preview", "production"]),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),

  // Phase 2 adds: ANTHROPIC_API_KEY
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

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
