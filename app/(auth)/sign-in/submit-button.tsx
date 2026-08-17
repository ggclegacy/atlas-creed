"use client";

import { ArrowRight } from "lucide-react";
import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex min-h-12 w-full items-center justify-between rounded-control bg-accent-authority px-4 font-medium text-text-on-accent transition-[background-color,opacity] duration-[var(--motion-hover)] hover:bg-accent-authority-strong disabled:cursor-wait disabled:opacity-60"
    >
      <span>{pending ? "Requesting secure link…" : "Send secure link"}</span>
      <ArrowRight aria-hidden="true" className="size-4" strokeWidth={1.75} />
    </button>
  );
}
