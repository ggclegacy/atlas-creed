import type { z } from "zod";

import type { AtlasMessageContent } from "@/lib/conversation/content";

export type ModelRole = "conversation" | "background";
export type ReasoningEffort = "none" | "low" | "medium" | "high";

export interface AtlasInputMessage {
  readonly role: "user" | "assistant";
  readonly content: AtlasMessageContent;
}

export interface AtlasRequest {
  readonly instructions: readonly string[];
  readonly messages: readonly AtlasInputMessage[];
  readonly maxOutputTokens: number;
  readonly reasoning: ReasoningEffort;
}

export interface AtlasStructuredRequest<T> extends AtlasRequest {
  readonly schema: z.ZodType<T>;
  readonly schemaName: string;
}

export interface AtlasUsage {
  readonly inputTokens: number | null;
  readonly outputTokens: number | null;
  readonly cachedInputTokens: number | null;
  readonly cacheWriteInputTokens: number | null;
  readonly reasoningTokens: number | null;
  readonly totalTokens: number | null;
}

export type AtlasFinishReason =
  | "completed"
  | "refusal"
  | "max_output_tokens"
  | "content_filter"
  | "cancelled"
  | "failed"
  | "unknown";

export type AtlasErrorCode =
  | "authentication"
  | "permission"
  | "rate_limit"
  | "timeout"
  | "connection"
  | "invalid_request"
  | "provider_error"
  | "cancelled"
  | "invalid_response";

export class AtlasModelError extends Error {
  readonly diagnosticCode: string | null;

  constructor(
    public readonly code: AtlasErrorCode,
    message: string,
    public readonly retryable: boolean,
    options?: ErrorOptions & { readonly diagnosticCode?: string },
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = "AtlasModelError";
    this.diagnosticCode = options?.diagnosticCode ?? null;
  }
}

export type AtlasEvent =
  | {
      readonly type: "generation_started";
      readonly requestId: string | null;
      readonly responseId: string | null;
    }
  | { readonly type: "text_delta"; readonly text: string }
  | { readonly type: "refusal_delta"; readonly text: string }
  | { readonly type: "usage"; readonly usage: AtlasUsage }
  | {
      readonly type: "completed";
      readonly finishReason: AtlasFinishReason;
      readonly responseId: string | null;
    };

export interface AtlasStructuredResult<T> {
  readonly value: T;
  readonly requestId: string | null;
  readonly responseId: string | null;
  readonly finishReason: AtlasFinishReason;
  readonly usage: AtlasUsage;
}

export interface AtlasModel {
  readonly provider: string;
  readonly modelId: string;
  stream(request: AtlasRequest, signal: AbortSignal): AsyncIterable<AtlasEvent>;
  structured<T>(
    request: AtlasStructuredRequest<T>,
    signal: AbortSignal,
  ): Promise<AtlasStructuredResult<T>>;
}
