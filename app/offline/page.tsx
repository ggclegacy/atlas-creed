import { AtlasMark } from "@/components/brand/atlas-mark";

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface-void px-6 py-12">
      <section className="max-w-md" aria-labelledby="offline-title">
        <AtlasMark className="mb-10 size-8 text-accent-authority" />
        <p className="mb-3 font-mono text-[length:var(--text-size-label)] tracking-[var(--text-tracking-label)] text-text-tertiary uppercase">
          Connection unavailable
        </p>
        <h1 id="offline-title" className="text-[length:var(--text-size-title)]">
          Atlas is offline.
        </h1>
        <p className="mt-4 text-text-secondary">
          Reconnect to enter the private environment. Authenticated pages and
          personal data are never stored in the offline cache.
        </p>
      </section>
    </main>
  );
}
