import type { AtlasFinishReason, AtlasUsage } from "@/lib/model/types";

interface EventBase {
  readonly version: 1;
  readonly operationId: string;
  readonly sequence: number;
}

export type AtlasStreamEvent =
  | (EventBase & {
      readonly type: "turn.started";
      readonly conversationId: string;
      readonly assistantMessageId: string;
      readonly dailyUsageWarning: boolean;
    })
  | (EventBase & {
      readonly type: "assistant.status";
      readonly status: "receiving" | "thinking" | "responding";
    })
  | (EventBase & {
      readonly type: "assistant.text.delta";
      readonly text: string;
    })
  | (EventBase & {
      readonly type: "assistant.checkpoint";
      readonly characters: number;
    })
  | (EventBase & {
      readonly type: "assistant.completed";
      readonly finishReason: AtlasFinishReason;
      readonly usage: AtlasUsage | null;
    })
  | (EventBase & {
      readonly type: "assistant.interrupted";
      readonly characters: number;
    })
  | (EventBase & {
      readonly type: "turn.error";
      readonly code: string;
      readonly message: string;
      readonly retryable: boolean;
      readonly partial: boolean;
    })
  | (EventBase & { readonly type: "stream.keepalive" });

export type AtlasStreamEventInput = AtlasStreamEvent extends infer Event
  ? Event extends AtlasStreamEvent
    ? Omit<Event, "version" | "operationId" | "sequence">
    : never
  : never;

const encoder = new TextEncoder();

export function encodeStreamEvent(event: AtlasStreamEvent): Uint8Array {
  return encoder.encode(
    `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`,
  );
}
