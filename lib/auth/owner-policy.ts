const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/** Exact, case-insensitive mailbox comparison. Domains, patterns, and aliases are not accepted. */
export function isAllowedOwnerEmail(
  candidate: string | null | undefined,
  configuredOwner: string,
): boolean {
  return candidate !== null && candidate !== undefined
    ? normalizeEmail(candidate) === normalizeEmail(configuredOwner)
    : false;
}
