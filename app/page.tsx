/**
 * Phase 0 placeholder.
 *
 * Deliberately not a product surface. The home screen — Atlas, a composer, and
 * recent conversations — is Phase 1/2 work. This page exists to prove the
 * foundation renders and that the semantic token layer resolves end to end.
 */
export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6">
      <p
        className="font-mono text-[length:var(--text-size-label)] tracking-[var(--text-tracking-label)] text-text-tertiary uppercase"
        data-testid="phase-marker"
      >
        Phase 0 · Foundation
      </p>

      <h1 className="font-display text-[length:var(--text-size-title)] leading-[var(--text-leading-display)] tracking-[var(--text-tracking-display)] text-balance">
        Atlas <span className="text-accent-authority">Creed</span>
      </h1>

      <p className="max-w-[var(--measure-prose)] text-text-secondary">
        The engineering foundation is in place. Strict TypeScript, enforced
        architecture boundaries, validated configuration, and a two-layer token
        system awaiting visual ratification.
      </p>

      <p className="max-w-[var(--measure-prose)] text-text-tertiary text-[length:var(--text-size-compact)]">
        No product features are implemented. Conversation, canon, memory, and
        retrieval begin in later phases.
      </p>
    </main>
  );
}
