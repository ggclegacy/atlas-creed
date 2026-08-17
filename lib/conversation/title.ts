const MAX_TITLE_CHARACTERS = 72;

export function deterministicTitle(source: string): string {
  const cleaned = source
    .replace(/[`*_#>~[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "Untitled conversation";
  if (cleaned.length <= MAX_TITLE_CHARACTERS) return cleaned;
  const shortened = cleaned.slice(0, MAX_TITLE_CHARACTERS + 1);
  const boundary = shortened.lastIndexOf(" ");
  return `${shortened.slice(0, boundary > 40 ? boundary : MAX_TITLE_CHARACTERS).trim()}…`;
}

export function sanitizeGeneratedTitle(source: string): string | null {
  const cleaned = source
    .replace(/[\r\n\t]+/g, " ")
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (cleaned.length < 3 || cleaned.length > MAX_TITLE_CHARACTERS) return null;
  return cleaned;
}
