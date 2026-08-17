import { z } from "zod";

/**
 * Environment schemas — pure, side-effect free, and therefore testable.
 *
 * The runtime guards live in the consuming modules (`server.ts` imports
 * `server-only`; `client.ts` reads inlined literals). Keeping the schemas here
 * means tests can exercise validation without tripping those guards.
 *
 * Build Plan §14. Variables are added only when their approved phase arrives.
 * Phase 1 now requires the database and authentication values below.
 */

const emailFromSchema = z.string().refine((value) => {
  const bracketedAddress = value.match(/<([^<>]+)>$/)?.[1];
  return z.email().safeParse(bracketedAddress ?? value).success;
}, "Must be an email address or a display name followed by <email@example.com>");

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
  DATABASE_ENVIRONMENT: z
    .enum(["development", "preview", "production"])
    .default("development"),
  AUTH_SECRET: z.string().min(32, "Must contain at least 32 characters"),
  AUTH_RESEND_KEY: z.string().startsWith("re_"),
  AUTH_EMAIL_FROM: emailFromSchema,
  OWNER_EMAIL: z.email(),
  AUTH_URL: z.url().optional(),
  VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),

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
