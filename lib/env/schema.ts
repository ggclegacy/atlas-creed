import { z } from "zod";

/**
 * Environment schemas — pure, side-effect free, and therefore testable.
 *
 * The runtime guard lives in `server.ts`, which imports `server-only`. Keeping
 * the schema here means tests can exercise validation without tripping that
 * guard or reading the real process environment.
 *
 * Build Plan §14. Variables are added only when their approved phase arrives.
 * Phase 2 requires database-backed owner authentication and server-only model
 * configuration. Validation remains lazy so static compilation never requires
 * runtime secrets merely to inspect the route tree.
 */

const emailFromSchema = z.string().refine((value) => {
  const bracketedAddress = value.match(/<([^<>]+)>$/)?.[1];
  return z.email().safeParse(bracketedAddress ?? value).success;
}, "Must be an email address or a display name followed by <email@example.com>");

/** Server-only configuration. Never sent to the browser. */
export const serverEnvSchema = z
  .object({
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
    AUTH_SECRET: z.string().min(32, "Must contain at least 32 characters"),
    AUTH_RESEND_KEY: z.string().startsWith("re_"),
    AUTH_EMAIL_FROM: emailFromSchema,
    OWNER_EMAIL: z.email(),
    AUTH_URL: z.url().optional(),
    OPENAI_API_KEY: z.string().min(20),
    ATLAS_CONVERSATION_MODEL: z.string().min(1).default("gpt-5.6-sol"),
    ATLAS_BACKGROUND_MODEL: z.string().min(1).default("gpt-5.6-terra"),
    ATLAS_DAILY_SOFT_LIMIT_USD: z.coerce.number().positive().default(10),
    ATLAS_MONTHLY_HARD_LIMIT_USD: z.coerce.number().positive().default(150),
    VERCEL_ENV: z.enum(["development", "preview", "production"]).optional(),
  })
  .refine(
    (env) => env.ATLAS_MONTHLY_HARD_LIMIT_USD >= env.ATLAS_DAILY_SOFT_LIMIT_USD,
    {
      message:
        "Monthly hard limit must be greater than or equal to daily soft limit",
      path: ["ATLAS_MONTHLY_HARD_LIMIT_USD"],
    },
  );

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
