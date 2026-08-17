"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-[#09090d] text-[#f3f0ea]">
        <main className="mx-auto flex min-h-dvh max-w-2xl items-center px-6 py-16">
          <section aria-labelledby="global-error-title">
            <p className="font-mono text-xs tracking-widest text-[#9b9995] uppercase">
              Atlas unavailable
            </p>
            <h1 id="global-error-title" className="mt-3 text-3xl">
              The environment could not start safely.
            </h1>
            <p className="mt-4 max-w-xl text-[#b7b4af]">
              Retry once. If this continues, check the deployment environment,
              database readiness, and Vercel runtime logs.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-7 min-h-11 border border-[#8b7343] px-4 text-[#d8b975]"
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
