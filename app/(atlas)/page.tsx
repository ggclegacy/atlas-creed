export default function AtlasHomePage() {
  return (
    <main className="flex min-h-full items-center justify-center px-6 py-16 sm:px-10 lg:px-16">
      <section className="w-full max-w-3xl" aria-labelledby="atlas-home-title">
        <div className="mb-10 flex items-center gap-3" aria-hidden="true">
          <span className="h-px w-8 bg-border-emphasis" />
          <span className="font-mono text-[length:var(--text-size-label)] tracking-[var(--text-tracking-label)] text-text-tertiary uppercase">
            System ready
          </span>
        </div>

        <h1
          id="atlas-home-title"
          className="max-w-2xl font-display text-[clamp(2.125rem,7vw,4.5rem)] leading-[1.02] tracking-[var(--text-tracking-display)] text-balance"
        >
          Atlas is here.
        </h1>
        <p className="mt-6 max-w-[52ch] text-[length:var(--text-size-lead)] leading-[var(--text-leading-body)] text-text-secondary">
          The environment is established. Conversation, memory, and intelligence
          are intentionally quiet until the next phase.
        </p>

        <div className="mt-16 border-t border-border-hairline pt-5 sm:mt-24">
          <p className="max-w-[var(--measure-ui)] text-[length:var(--text-size-compact)] text-text-tertiary">
            A place to think is now ready. Intelligence comes next.
          </p>
        </div>
      </section>
    </main>
  );
}
