"use client";

export default function AtlasError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-2xl items-center px-6 py-16">
      <section aria-labelledby="atlas-error-title">
        <p className="font-mono text-[length:var(--text-size-label)] tracking-[var(--text-tracking-label)] text-text-tertiary uppercase">
          Request interrupted
        </p>
        <h1
          id="atlas-error-title"
          className="mt-3 font-display text-[length:var(--text-size-title)]"
        >
          Atlas could not load this view.
        </h1>
        <p className="mt-4 max-w-[54ch] text-text-secondary">
          No private diagnostic details were shown. Retry once; if the problem
          continues, inspect the corresponding Vercel runtime logs.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-7 min-h-11 border border-border-emphasis px-4 text-text-accent"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
