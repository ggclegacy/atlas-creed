import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type {
  Response,
  ResponseUsage,
} from "openai/resources/responses/responses";

import { contentText } from "@/lib/conversation/content";
import {
  AtlasModelError,
  type AtlasEvent,
  type AtlasFinishReason,
  type AtlasModel,
  type AtlasRequest,
  type AtlasStructuredRequest,
  type AtlasStructuredResult,
  type AtlasUsage,
} from "@/lib/model/types";

function usageOf(usage: ResponseUsage | null | undefined): AtlasUsage {
  return {
    inputTokens: usage?.input_tokens ?? null,
    outputTokens: usage?.output_tokens ?? null,
    cachedInputTokens: usage?.input_tokens_details.cached_tokens ?? null,
    cacheWriteInputTokens:
      usage?.input_tokens_details.cache_write_tokens ?? null,
    reasoningTokens: usage?.output_tokens_details.reasoning_tokens ?? null,
    totalTokens: usage?.total_tokens ?? null,
  };
}

function finishReasonOf(response: Response): AtlasFinishReason {
  if (response.status === "completed") return "completed";
  if (response.status === "failed") return "failed";
  if (response.status === "incomplete") {
    const reason = response.incomplete_details?.reason;
    if (reason === "max_output_tokens" || reason === "content_filter") {
      return reason;
    }
  }
  return "unknown";
}

function normalizeError(error: unknown): AtlasModelError {
  if (error instanceof AtlasModelError) return error;
  if (error instanceof OpenAI.AuthenticationError) {
    return new AtlasModelError(
      "authentication",
      "Model authentication failed.",
      false,
      { cause: error },
    );
  }
  if (error instanceof OpenAI.PermissionDeniedError) {
    return new AtlasModelError(
      "permission",
      "The configured model is not available to this project.",
      false,
      { cause: error },
    );
  }
  if (error instanceof OpenAI.RateLimitError) {
    return new AtlasModelError(
      "rate_limit",
      "The model provider is temporarily rate limited.",
      true,
      { cause: error },
    );
  }
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new AtlasModelError(
      "timeout",
      "The model request timed out.",
      true,
      { cause: error },
    );
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return new AtlasModelError(
      "connection",
      "The model provider could not be reached.",
      true,
      { cause: error },
    );
  }
  if (error instanceof OpenAI.APIUserAbortError) {
    return new AtlasModelError(
      "cancelled",
      "Generation was cancelled.",
      false,
      { cause: error },
    );
  }
  if (error instanceof OpenAI.BadRequestError) {
    return new AtlasModelError(
      "invalid_request",
      "The model rejected the request.",
      false,
      { cause: error },
    );
  }
  if (error instanceof OpenAI.APIError) {
    const diagnosticCode =
      typeof error.code === "string" && /^[a-z0-9_.-]{1,80}$/i.test(error.code)
        ? error.code
        : error.status
          ? `http_${error.status}`
          : "openai_api_error";
    return new AtlasModelError(
      "provider_error",
      "The model provider returned an error.",
      (error.status ?? 0) >= 500,
      { cause: error, diagnosticCode },
    );
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return new AtlasModelError(
      "cancelled",
      "Generation was cancelled.",
      false,
      { cause: error },
    );
  }
  const diagnosticCode = (() => {
    if (!error || typeof error !== "object") return typeof error;
    const candidate = "code" in error ? error.code : undefined;
    if (
      typeof candidate === "string" &&
      /^[a-z0-9_.-]{1,80}$/i.test(candidate)
    ) {
      return candidate;
    }
    return error instanceof Error ? error.name : "unknown_error";
  })();
  return new AtlasModelError(
    "provider_error",
    "The model request failed.",
    false,
    { cause: error, diagnosticCode },
  );
}

function failedResponseError(code: string | null | undefined): AtlasModelError {
  if (code === "rate_limit_exceeded") {
    return new AtlasModelError(
      "rate_limit",
      "The model provider is temporarily rate limited.",
      true,
      { diagnosticCode: code },
    );
  }
  if (code === "invalid_prompt") {
    return new AtlasModelError(
      "invalid_request",
      "The model rejected the request.",
      false,
      { diagnosticCode: code },
    );
  }
  return new AtlasModelError(
    "provider_error",
    "The model response failed.",
    code === "server_error",
    { diagnosticCode: code ?? "response_failed" },
  );
}

function inputOf(request: AtlasRequest) {
  return request.messages.map((message) => ({
    role: message.role,
    content: contentText(message.content),
  }));
}

export class OpenAIAtlasModel implements AtlasModel {
  readonly provider = "openai";
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    readonly modelId: string,
    client?: OpenAI,
  ) {
    this.client =
      client ??
      new OpenAI({
        apiKey,
        maxRetries: 0,
        timeout: 240_000,
      });
  }

  async *stream(
    request: AtlasRequest,
    signal: AbortSignal,
  ): AsyncIterable<AtlasEvent> {
    try {
      const result = await this.client.responses
        .create(
          {
            model: this.modelId,
            instructions: request.instructions.join("\n\n"),
            input: inputOf(request),
            max_output_tokens: request.maxOutputTokens,
            reasoning: { effort: request.reasoning },
            store: false,
            stream: true,
          },
          { signal },
        )
        .withResponse();

      let started = false;
      let terminal = false;
      for await (const event of result.data) {
        if (event.type === "response.created") {
          started = true;
          yield {
            type: "generation_started",
            requestId: result.request_id,
            responseId: event.response.id,
          };
        } else if (event.type === "response.output_text.delta") {
          yield { type: "text_delta", text: event.delta };
        } else if (event.type === "response.refusal.delta") {
          yield { type: "refusal_delta", text: event.delta };
        } else if (
          event.type === "response.completed" ||
          event.type === "response.incomplete"
        ) {
          terminal = true;
          yield { type: "usage", usage: usageOf(event.response.usage) };
          yield {
            type: "completed",
            finishReason: finishReasonOf(event.response),
            responseId: event.response.id,
          };
        } else if (event.type === "response.failed") {
          throw failedResponseError(event.response.error?.code);
        } else if (event.type === "error") {
          throw new AtlasModelError(
            "provider_error",
            "The model stream returned an error.",
            true,
            { diagnosticCode: event.code ?? "stream_error" },
          );
        }
      }
      if (!started) {
        throw new AtlasModelError(
          "invalid_response",
          "The model stream did not start.",
          true,
        );
      }
      if (signal.aborted) {
        throw new AtlasModelError(
          "cancelled",
          "Generation was cancelled.",
          false,
          { diagnosticCode: "stream_cancelled" },
        );
      }
      if (!terminal) {
        throw new AtlasModelError(
          "invalid_response",
          "The model stream ended without a terminal event.",
          true,
          { diagnosticCode: "stream_ended_without_terminal" },
        );
      }
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async structured<T>(
    request: AtlasStructuredRequest<T>,
    signal: AbortSignal,
  ): Promise<AtlasStructuredResult<T>> {
    try {
      const result = await this.client.responses
        .parse(
          {
            model: this.modelId,
            instructions: request.instructions.join("\n\n"),
            input: inputOf(request),
            max_output_tokens: request.maxOutputTokens,
            reasoning: { effort: request.reasoning },
            store: false,
            text: { format: zodTextFormat(request.schema, request.schemaName) },
          },
          { signal },
        )
        .withResponse();

      if (result.data.output_parsed === null) {
        throw new AtlasModelError(
          "invalid_response",
          "The model did not return the required structure.",
          true,
        );
      }
      return {
        value: result.data.output_parsed,
        requestId: result.request_id,
        responseId: result.data.id,
        finishReason: finishReasonOf(result.data),
        usage: usageOf(result.data.usage),
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }
}
