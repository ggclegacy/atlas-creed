import Link from "next/link";

import { AtlasMark } from "@/components/brand/atlas-mark";

export default function CheckEmailPage() {
  return (
    <main className="auth-ground flex min-h-dvh items-center justify-center px-5 py-12 [padding-bottom:max(3rem,env(safe-area-inset-bottom))] [padding-top:max(3rem,env(safe-area-inset-top))]">
      <section
        className="w-full max-w-[27rem]"
        aria-labelledby="check-email-title"
      >
        <AtlasMark className="mb-10 size-8 text-accent-authority" />
        <p className="mb-3 font-mono text-[length:var(--text-size-label)] tracking-[var(--text-tracking-label)] text-text-tertiary uppercase">
          Request received
        </p>
        <h1
          id="check-email-title"
          className="font-display text-[length:var(--text-size-title)] leading-[var(--text-leading-display)] tracking-[var(--text-tracking-display)]"
        >
          Check your email.
        </h1>
        <p className="mt-4 text-text-secondary">
          If the address is authorized, a single-use Atlas link is on its way.
          It expires in 15 minutes.
        </p>
        <Link
          href="/sign-in"
          className="mt-8 inline-flex min-h-11 items-center text-text-accent underline-offset-4 hover:underline"
        >
          Return to sign in
        </Link>
      </section>
    </main>
  );
}
