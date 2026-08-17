import { signOutOwner } from "@/app/(atlas)/actions";
import { requireOwner } from "@/lib/auth/guards";
import { getServerEnv } from "@/lib/env/server";

export default async function SettingsPage() {
  const owner = await requireOwner();
  const env = getServerEnv();
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
          <dd className="text-text-secondary">Single owner</dd>
          <dt className="text-text-tertiary">Authentication</dt>
          <dd className="text-text-secondary">Email magic link</dd>
          <dt className="text-text-tertiary">Owner</dt>
          <dd className="text-text-secondary">{owner.email}</dd>
        </dl>
        <p className="mt-5 max-w-[54ch] text-[length:var(--text-size-compact)] text-text-tertiary">
          Secure database sessions protect conversations and every model
          request.
        </p>
        <form action={signOutOwner} className="mt-6">
          <button
            type="submit"
            className="min-h-11 border border-border-subtle px-4 text-[length:var(--text-size-compact)] text-text-secondary hover:border-border-emphasis hover:text-text-primary"
          >
            Sign out
          </button>
        </form>
      </section>

      <section
        className="border-t border-border-hairline py-6"
        aria-labelledby="model-title"
      >
        <h2
          id="model-title"
          className="text-[length:var(--text-size-subheading)] font-medium"
        >
          Models and limits
        </h2>
        <dl className="mt-5 grid gap-2 text-[length:var(--text-size-compact)] sm:grid-cols-[8rem_1fr]">
          <dt className="text-text-tertiary">Conversation</dt>
          <dd className="text-text-secondary">
            {env.ATLAS_CONVERSATION_MODEL}
          </dd>
          <dt className="text-text-tertiary">Titles</dt>
          <dd className="text-text-secondary">{env.ATLAS_BACKGROUND_MODEL}</dd>
          <dt className="text-text-tertiary">Daily warning</dt>
          <dd className="text-text-secondary">
            ${env.ATLAS_DAILY_SOFT_LIMIT_USD}
          </dd>
          <dt className="text-text-tertiary">Monthly ceiling</dt>
          <dd className="text-text-secondary">
            ${env.ATLAS_MONTHLY_HARD_LIMIT_USD}
          </dd>
        </dl>
      </section>
    </main>
  );
}
