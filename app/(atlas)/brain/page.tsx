import {
  activateAmendmentAction,
  approveAmendmentAction,
  initializeConstitutionAction,
} from "@/app/(atlas)/brain/actions";
import { requireOwner } from "@/lib/auth/guards";
import { getBrainSnapshot } from "@/lib/brain/service";
import {
  amendmentActivationPhrase,
  amendmentApprovalPhrase,
} from "@/lib/constitutional/amendments";
import { ATLAS_CAPABILITIES } from "@/lib/constitutional/capabilities";
import { CONSTITUTION_INITIALIZATION_PHRASE } from "@/lib/constitutional/confirmations";
import {
  CONSTITUTIONAL_KERNEL,
  CONSTITUTIONAL_KERNEL_TOKEN_BUDGET,
  kernelChecksum,
  kernelEstimatedTokens,
} from "@/lib/constitutional/kernel";

export default async function BrainPage({
  searchParams,
}: {
  searchParams: Promise<{ amendment?: string; initialized?: string }>;
}) {
  const owner = await requireOwner();
  const snapshot = await getBrainSnapshot(owner.id);
  const initialized = (await searchParams).initialized === "1";

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-14 sm:px-10 lg:py-20">
      <p className="font-mono text-[length:var(--text-size-label)] tracking-[var(--text-tracking-label)] text-text-tertiary uppercase">
        Observability
      </p>
      <h1 className="mt-3 font-display text-[length:var(--text-size-title)] leading-[var(--text-leading-display)] tracking-[var(--text-tracking-display)]">
        Brain
      </h1>
      <p className="mt-4 max-w-[60ch] text-text-secondary">
        Inspect Atlas&apos;s active constitution, scoped knowledge, conflicts,
        compiled context, model use, and genuine capability boundary. Brain is
        read-first and never displays credentials or hidden reasoning.
      </p>

      {initialized ? (
        <p role="status" className="mt-6 text-signal-positive">
          Constitutional foundation initialized or already current.
        </p>
      ) : null}

      <section className="mt-12 border-t border-border-hairline py-7">
        <h2 className="text-[length:var(--text-size-subheading)] font-medium">
          Constitutional Kernel
        </h2>
        <dl className="mt-5 grid gap-2 text-[length:var(--text-size-compact)] sm:grid-cols-[10rem_1fr]">
          <dt className="text-text-tertiary">Version</dt>
          <dd>{CONSTITUTIONAL_KERNEL.version}</dd>
          <dt className="text-text-tertiary">Budget</dt>
          <dd>
            {kernelEstimatedTokens()} / {CONSTITUTIONAL_KERNEL_TOKEN_BUDGET}
            estimated tokens
          </dd>
          <dt className="text-text-tertiary">Checksum</dt>
          <dd className="truncate font-mono text-text-secondary">
            {kernelChecksum()}
          </dd>
        </dl>
        <ol className="mt-6 space-y-3">
          {CONSTITUTIONAL_KERNEL.principles.map((principle) => (
            <li
              key={principle.id}
              className="border-l border-border-subtle pl-4"
            >
              <p className="font-mono text-[.68rem] text-text-tertiary">
                {principle.id}
              </p>
              <p className="mt-1 text-[length:var(--text-size-compact)] text-text-secondary">
                {principle.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-border-hairline py-7">
        <h2 className="text-[length:var(--text-size-subheading)] font-medium">
          Canon Registry
        </h2>
        {snapshot.canon.length ? (
          <div className="mt-5 space-y-3">
            {snapshot.canon.map((document) => (
              <article
                key={document.id}
                className="border border-border-subtle p-4"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-medium">
                    {document.canonicalId}: {document.title}
                  </h3>
                  <span className="font-mono text-[.68rem] text-text-tertiary uppercase">
                    {document.status}
                  </span>
                </div>
                <p className="mt-2 text-[.75rem] text-text-tertiary">
                  Version {document.version ?? "unstated in source"} ·{" "}
                  {document.sectionCount} sections · {document.sourceReference}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <form
            action={initializeConstitutionAction}
            className="mt-5 border border-border-emphasis p-5"
          >
            <p className="text-[length:var(--text-size-compact)] text-text-secondary">
              The schema is ready, but the protected canon has not been loaded
              for this database. Type the exact phrase to import the fixed,
              checksummed F1 registry and minimal company fixtures.
            </p>
            <label
              className="mt-4 block text-[.75rem] text-text-tertiary"
              htmlFor="confirmation"
            >
              {CONSTITUTION_INITIALIZATION_PHRASE}
            </label>
            <input
              id="confirmation"
              name="confirmation"
              required
              autoComplete="off"
              className="mt-2 min-h-11 w-full border border-border-default bg-surface-void px-3 text-[length:var(--text-size-compact)]"
            />
            <button
              type="submit"
              className="mt-4 min-h-11 border border-border-emphasis px-4 text-[length:var(--text-size-compact)] text-text-accent"
            >
              Initialize constitutional foundation
            </button>
          </form>
        )}
      </section>

      <section className="border-t border-border-hairline py-7">
        <h2 className="text-[length:var(--text-size-subheading)] font-medium">
          Scoped living knowledge
        </h2>
        <ul className="mt-5 space-y-2 text-[length:var(--text-size-compact)]">
          {snapshot.projects.map((project) => (
            <li
              key={project.id}
              className="flex justify-between border-b border-border-hairline py-2"
            >
              <span>{project.name}</span>
              <span className="text-text-tertiary">
                {project.knowledgeCount} records
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-border-hairline py-7">
        <h2 className="text-[length:var(--text-size-subheading)] font-medium">
          Open conflicts
        </h2>
        {snapshot.conflicts.length ? (
          <div className="mt-5 space-y-3">
            {snapshot.conflicts.map((conflict) => (
              <article
                key={conflict.id}
                className="border border-border-subtle p-4"
              >
                <h3 className="font-medium">{conflict.summary}</h3>
                <p className="mt-2 text-[length:var(--text-size-compact)] text-text-secondary">
                  {conflict.reason}
                </p>
                <p className="mt-2 text-[.75rem] text-text-tertiary">
                  Resolution: {conflict.recommendedResolution}
                </p>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-text-tertiary">No recorded conflicts.</p>
        )}
      </section>

      <section className="border-t border-border-hairline py-7">
        <h2 className="text-[length:var(--text-size-subheading)] font-medium">
          Recent context traces
        </h2>
        {snapshot.traces.length ? (
          <div className="mt-5 space-y-5">
            {snapshot.traces.map((trace) => (
              <article
                key={trace.id}
                className="border border-border-subtle p-4"
              >
                <p className="font-mono text-[.68rem] text-text-tertiary">
                  {trace.createdAt.toISOString()}
                </p>
                <h3 className="mt-2 font-medium">
                  {trace.modelProvider} / {trace.model}
                </h3>
                <p className="mt-1 text-[.75rem] text-text-tertiary">
                  {trace.taskCategory} · {trace.estimatedInputTokens} estimated
                  tokens · {trace.retrievedItemCount} retrieved ·{" "}
                  {trace.excludedItemCount} excluded
                </p>
                <ul className="mt-4 space-y-2">
                  {trace.items.map((item) => (
                    <li
                      key={`${trace.id}-${item.sourceType}-${item.sourceId}`}
                      className="text-[.75rem] text-text-secondary"
                    >
                      <span
                        className={
                          item.included
                            ? "text-signal-positive"
                            : "text-text-tertiary"
                        }
                      >
                        {item.included ? "Included" : "Excluded"}
                      </span>{" "}
                      · {item.title} · {item.informationState} — {item.reason}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-text-tertiary">No compiled requests yet.</p>
        )}
      </section>

      <section className="border-t border-border-hairline py-7">
        <h2 className="text-[length:var(--text-size-subheading)] font-medium">
          Protected amendments
        </h2>
        {snapshot.amendments.length ? (
          <div className="mt-5 space-y-5">
            {snapshot.amendments.map((amendment) => (
              <article
                key={amendment.id}
                className="border border-border-emphasis p-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-medium">
                    {amendment.proposedTitle} v{amendment.proposedVersion}
                  </h3>
                  <span className="font-mono text-[.68rem] text-text-tertiary uppercase">
                    {amendment.status}
                  </span>
                </div>
                <p className="mt-3 text-[length:var(--text-size-compact)] text-text-secondary">
                  {amendment.rationale}
                </p>
                <details className="mt-4 text-[.75rem] text-text-tertiary">
                  <summary className="cursor-pointer text-text-secondary">
                    Review diff and impact
                  </summary>
                  <pre className="mt-3 overflow-x-auto whitespace-pre-wrap border-l border-border-subtle pl-4 font-mono">
                    {amendment.diff}
                  </pre>
                  <p className="mt-3">{amendment.impactAnalysis}</p>
                </details>
                {amendment.status === "proposed" ? (
                  <form action={approveAmendmentAction} className="mt-5">
                    <input
                      type="hidden"
                      name="amendmentId"
                      value={amendment.id}
                    />
                    <label
                      htmlFor={`approve-${amendment.id}`}
                      className="block text-[.7rem] text-text-tertiary"
                    >
                      {amendmentApprovalPhrase(amendment.id)}
                    </label>
                    <input
                      id={`approve-${amendment.id}`}
                      name="confirmation"
                      required
                      autoComplete="off"
                      className="mt-2 min-h-11 w-full border border-border-default bg-surface-void px-3"
                    />
                    <button
                      type="submit"
                      className="mt-3 min-h-11 border border-border-emphasis px-4 text-text-accent"
                    >
                      Approve amendment
                    </button>
                  </form>
                ) : null}
                {amendment.status === "approved" ? (
                  <form action={activateAmendmentAction} className="mt-5">
                    <input
                      type="hidden"
                      name="amendmentId"
                      value={amendment.id}
                    />
                    <label
                      htmlFor={`evidence-${amendment.id}`}
                      className="block text-[.7rem] text-text-tertiary"
                    >
                      Evaluation evidence
                    </label>
                    <input
                      id={`evidence-${amendment.id}`}
                      name="evaluationEvidence"
                      required
                      autoComplete="off"
                      className="mt-2 min-h-11 w-full border border-border-default bg-surface-void px-3"
                    />
                    <label
                      htmlFor={`activate-${amendment.id}`}
                      className="mt-3 block text-[.7rem] text-text-tertiary"
                    >
                      {amendmentActivationPhrase(amendment.id)}
                    </label>
                    <input
                      id={`activate-${amendment.id}`}
                      name="confirmation"
                      required
                      autoComplete="off"
                      className="mt-2 min-h-11 w-full border border-border-default bg-surface-void px-3"
                    />
                    <button
                      type="submit"
                      className="mt-3 min-h-11 border border-border-emphasis px-4 text-text-accent"
                    >
                      Activate approved amendment
                    </button>
                  </form>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-text-tertiary">
            No amendment proposals. Ordinary conversation cannot create or
            approve protected constitutional changes.
          </p>
        )}
      </section>

      <section className="border-t border-border-hairline py-7">
        <h2 className="text-[length:var(--text-size-subheading)] font-medium">
          Capability truth
        </h2>
        <ul className="mt-5 space-y-2 text-[length:var(--text-size-compact)]">
          {ATLAS_CAPABILITIES.map((capability) => (
            <li
              key={capability.id}
              className="flex gap-4 border-b border-border-hairline py-2"
            >
              <span
                className={
                  capability.status === "available"
                    ? "text-signal-positive"
                    : "text-text-tertiary"
                }
              >
                {capability.status === "available" ? "Available" : "Planned"}
              </span>
              <span>{capability.label}</span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-[.75rem] text-text-tertiary">
          F1 evaluations are automated in the repository. Brain does not invent
          a pass result; the latest CI or local verification output is the
          authoritative result.
        </p>
      </section>
    </main>
  );
}
