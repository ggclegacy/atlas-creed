import { requireOwnerSession } from "@/lib/auth/guards";

export default async function SettingsPage() {
  const session = await requireOwnerSession();

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
          Private account
        </h2>
        <dl className="mt-5 grid gap-2 text-[length:var(--text-size-compact)] sm:grid-cols-[8rem_1fr]">
          <dt className="text-text-tertiary">Signed in as</dt>
          <dd className="break-all text-text-secondary">
            {session.user?.email}
          </dd>
          <dt className="text-text-tertiary">Session</dt>
          <dd className="text-text-secondary">
            Database-backed · secure cookie
          </dd>
        </dl>
      </section>
    </main>
  );
}
