import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { AtlasMark } from "@/components/brand/atlas-mark";

import { requestMagicLink } from "./actions";
import { SubmitButton } from "./submit-button";

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <main className="auth-ground flex min-h-dvh items-center justify-center px-5 py-12 [padding-bottom:max(3rem,env(safe-area-inset-bottom))] [padding-top:max(3rem,env(safe-area-inset-top))]">
      <section className="w-full max-w-[27rem]" aria-labelledby="sign-in-title">
        <div className="mb-10 flex items-center gap-3 text-text-secondary">
          <AtlasMark className="size-8 text-accent-authority" />
          <span className="font-mono text-[length:var(--text-size-label)] tracking-[var(--text-tracking-label)] uppercase">
            Atlas Creed
          </span>
        </div>

        <p className="mb-3 font-mono text-[length:var(--text-size-label)] tracking-[var(--text-tracking-label)] text-text-tertiary uppercase">
          Private access
        </p>
        <h1
          id="sign-in-title"
          className="font-display text-[length:var(--text-size-title)] leading-[var(--text-leading-display)] tracking-[var(--text-tracking-display)]"
        >
          Enter the environment.
        </h1>
        <p className="mt-4 max-w-[var(--measure-ui)] text-text-secondary">
          Atlas Creed is a private system. A short-lived sign-in link will be
          sent to the authorized address.
        </p>

        <form action={requestMagicLink} className="mt-8 space-y-4">
          <label
            htmlFor="email"
            className="block font-mono text-[length:var(--text-size-label)] tracking-[var(--text-tracking-label)] text-text-tertiary uppercase"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            className="min-h-12 w-full rounded-control border border-border-default bg-surface-raised px-4 text-text-primary transition-[border-color,background-color] duration-[var(--motion-transition)] outline-none placeholder:text-text-disabled hover:border-border-interactive focus:border-border-emphasis"
            placeholder="you@example.com"
          />
          <SubmitButton />
        </form>

        <p className="mt-6 text-[length:var(--text-size-caption)] leading-relaxed text-text-tertiary">
          Links expire after 15 minutes and can be used once. No password is
          stored.
        </p>
      </section>
    </main>
  );
}
