const normalizeEmail = (email: string): string => email.trim().toLowerCase();

/** Exact, case-insensitive mailbox comparison. Aliases and domain patterns are rejected. */
export function isAllowedOwnerEmail(
  candidate: string | null | undefined,
  configuredOwner: string,
): boolean {
  return candidate !== null && candidate !== undefined
    ? normalizeEmail(candidate) === normalizeEmail(configuredOwner)
    : false;
}

export function normalizedOwnerEmail(email: string): string {
  return normalizeEmail(email);
}
