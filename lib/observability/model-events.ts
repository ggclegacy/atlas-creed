import "server-only";

type ModelEvent = {
  readonly event:
    | "model.turn.started"
    | "model.turn.completed"
    | "model.turn.interrupted"
    | "model.turn.failed"
    | "model.turn.persistence_failed";
  readonly ownerId: string;
  readonly conversationId: string;
  readonly messageId: string;
  readonly usageId: string | null;
  readonly provider: string;
  readonly model: string;
  readonly requestId?: string | null;
  readonly responseId?: string | null;
  readonly latencyMs?: number;
  readonly timeToFirstTokenMs?: number | null;
  readonly inputTokens?: number | null;
  readonly cachedInputTokens?: number | null;
  readonly outputTokens?: number | null;
  readonly reasoningTokens?: number | null;
  readonly contextTraceId?: string | null;
  readonly contextSize?: number | null;
  readonly retrievedItemCount?: number | null;
  readonly taskCategory?: string | null;
  readonly errorCode?: string | null;
  readonly diagnosticCode?: string | null;
  readonly persisted?: boolean;
};

/** Emits identifiers and counters only; private prompt/response text is excluded. */
export function logModelEvent(event: ModelEvent): void {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...event,
  });
  if (
    event.event === "model.turn.failed" ||
    event.event === "model.turn.persistence_failed"
  ) {
    console.error(payload);
  } else {
    // eslint-disable-next-line no-console -- Vercel captures structured stdout.
    console.info(payload);
  }
}
