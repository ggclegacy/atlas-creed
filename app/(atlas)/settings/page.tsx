export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 sm:px-10 lg:py-20">
      <p className="font-mono text-[length:var(--text-size-label)] tracking-[var(--text-tracking-label)] text-text-tertiary uppercase">
        Environment
      </p>
      <h1 className="mt-3 font-display text-[length:var(--text-size-title)] leading-[var(--text-leading-display)] tracking-[var(--text-tracking-display)]">
        Settings
      </h1>

      <section
        className="mt-12 border-t border-border-hairline py-6"
        aria-labelledby="account-title"
      >
        <h2
          id="account-title"
          className="text-[length:var(--text-size-subheading)] font-medium"
        >
          Access
        </h2>
        <dl className="mt-5 grid gap-2 text-[length:var(--text-size-compact)] sm:grid-cols-[8rem_1fr]">
          <dt className="text-text-tertiary">Mode</dt>
          <dd className="text-text-secondary">Direct access</dd>
          <dt className="text-text-tertiary">Authentication</dt>
          <dd className="text-text-secondary">Not configured</dd>
        </dl>
        <p className="mt-5 max-w-[54ch] text-[length:var(--text-size-compact)] text-text-tertiary">
          This Phase 1 shell contains no conversations, memory, or private data.
          Access control must be added before those capabilities are enabled.
        </p>
      </section>
    </main>
  );
}
