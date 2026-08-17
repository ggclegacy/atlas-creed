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

const databaseUrlSchema = z
  .url()
  .refine(
    (value) =>
      value.startsWith("postgres://") || value.startsWith("postgresql://"),
    "Must be a PostgreSQL connection URL",
  );
const databaseEnvironmentSchema = z.enum([
  "development",
  "preview",
  "production",
]);

export const databaseRuntimeEnvSchema = z.object({
  DATABASE_URL: databaseUrlSchema,
  DATABASE_ENVIRONMENT: databaseEnvironmentSchema,
  VERCEL_ENV: databaseEnvironmentSchema.optional(),
});

/** Server-only configuration. Never sent to the browser. */
export const serverEnvSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),

    DATABASE_URL: databaseUrlSchema,
    DATABASE_ENVIRONMENT: databaseEnvironmentSchema,
    AUTH_SECRET: z.string().min(32, "Must contain at least 32 characters"),
    AUTH_RESEND_KEY: z
      .string()
      .startsWith("re_")
      .min(10, "Must contain a complete Resend API key"),
    AUTH_EMAIL_FROM: emailFromSchema,
    OWNER_EMAIL: z.email(),
    AUTH_URL: z.url().optional(),
    OPENAI_API_KEY: z.string().min(20),
    OPENAI_BASE_URL: z.url().optional(),
    ATLAS_CONVERSATION_MODEL: z.string().min(1).default("gpt-5.6-sol"),
    ATLAS_BACKGROUND_MODEL: z.string().min(1).default("gpt-5.6-terra"),
    ATLAS_DAILY_SOFT_LIMIT_USD: z.coerce.number().positive().default(10),
    ATLAS_MONTHLY_HARD_LIMIT_USD: z.coerce.number().positive().default(150),
    VERCEL_ENV: databaseEnvironmentSchema.optional(),
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
export type DatabaseRuntimeEnv = z.infer<typeof databaseRuntimeEnvSchema>;

const productionPlaceholderPattern =
  /(replace[-_ ]?me|test[-_ ]?only|not[-_ ]?a[-_ ]?real|example\.com)/i;

/**
 * Checks the stricter contract for a real production deployment without ever
 * returning or logging secret values.
 */
export function assertProductionDeploymentEnv(env: ServerEnv): void {
  const issues: string[] = [];
  if (env.NODE_ENV !== "production") issues.push("NODE_ENV must be production");
  if (env.DATABASE_ENVIRONMENT !== "production") {
    issues.push("DATABASE_ENVIRONMENT must be production");
  }
  if (env.VERCEL_ENV && env.VERCEL_ENV !== "production") {
    issues.push("VERCEL_ENV must be production when present");
  }

  const databaseUrl = new URL(env.DATABASE_URL);
  if (!databaseUrl.hostname.endsWith(".neon.tech")) {
    issues.push("DATABASE_URL must target the intended Neon database");
  }
  if (!databaseUrl.hostname.includes("-pooler.")) {
    issues.push("DATABASE_URL must use Neon's pooled serverless endpoint");
  }
  if (
    !["require", "verify-full"].includes(
      databaseUrl.searchParams.get("sslmode") ?? "",
    )
  ) {
    issues.push("DATABASE_URL must require TLS with sslmode");
  }

  const placeholderFields = [
    ["DATABASE_URL", env.DATABASE_URL],
    ["AUTH_SECRET", env.AUTH_SECRET],
    ["AUTH_RESEND_KEY", env.AUTH_RESEND_KEY],
    ["AUTH_EMAIL_FROM", env.AUTH_EMAIL_FROM],
    ["OWNER_EMAIL", env.OWNER_EMAIL],
    ["OPENAI_API_KEY", env.OPENAI_API_KEY],
  ] as const;
  for (const [name, value] of placeholderFields) {
    if (productionPlaceholderPattern.test(value)) {
      issues.push(`${name} still contains an example or test value`);
    }
  }

  if (env.AUTH_URL && new URL(env.AUTH_URL).protocol !== "https:") {
    issues.push("AUTH_URL must use HTTPS in production when set");
  }
  if (
    env.OPENAI_BASE_URL &&
    new URL(env.OPENAI_BASE_URL).origin !== "https://api.openai.com"
  ) {
    issues.push(
      "OPENAI_BASE_URL must be omitted or use the official OpenAI API in production",
    );
  }

  if (issues.length) {
    throw new Error(
      `Production deployment environment is not ready:\n${issues
        .map((issue) => `  · ${issue}`)
        .join("\n")}`,
    );
  }
}

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

export function parseDatabaseRuntimeEnv(
  source: Record<string, unknown>,
): DatabaseRuntimeEnv {
  const result = databaseRuntimeEnvSchema.safeParse(source);
  if (!result.success) {
    throw new Error(formatEnvError(result.error, "database"));
  }
  return result.data;
}
