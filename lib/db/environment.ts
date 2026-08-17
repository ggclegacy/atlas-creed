export type DatabaseEnvironment = "development" | "preview" | "production";

/**
 * Fail closed when a Vercel deployment is paired with a database connection
 * labelled for a different scope. Neon branch assignment still happens in
 * Vercel, but this catches the common production-URL-in-preview mistake.
 */
export function assertDatabaseEnvironment(input: {
  databaseEnvironment: DatabaseEnvironment;
  vercelEnvironment?: DatabaseEnvironment;
}): void {
  const { databaseEnvironment, vercelEnvironment } = input;

  if (vercelEnvironment && databaseEnvironment !== vercelEnvironment) {
    throw new Error(
      `Database environment mismatch: deployment is ${vercelEnvironment}, connection is labelled ${databaseEnvironment}.`,
    );
  }
}
