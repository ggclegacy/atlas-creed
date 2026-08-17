import "server-only";

import {
  beginTurn,
  checkpointAssistant,
  finalizeTurn,
  loadEligibleHistory,
  markTurnStreaming,
  type SpendState,
} from "@/lib/conversation/service";
import {
  encodeStreamEvent,
  type AtlasStreamEventInput,
} from "@/lib/conversation/stream";
import {
  compileConstitutionalContext,
  markContextTraceUsed,
  type CompiledConstitutionalContext,
} from "@/lib/context/compiler";
import type {
  AtlasFinishReason,
  AtlasModel,
  AtlasUsage,
} from "@/lib/model/types";
import { AtlasModelError } from "@/lib/model/types";
import { logModelEvent } from "@/lib/observability/model-events";

const CHECKPOINT_CHARACTERS = 1_024;
const CHECKPOINT_INTERVAL_MS = 1_500;
const KEEPALIVE_INTERVAL_MS = 15_000;

export interface ExecuteTurnInput {
  readonly ownerId: string;
  readonly conversationId?: string;
  readonly clientTurnId: string;
  readonly text: string;
  readonly model: AtlasModel;
  readonly signal: AbortSignal;
  readonly spend: SpendState;
}

export interface ExecuteTurnResult {
  readonly completed: boolean;
  readonly ownerId: string;
  readonly conversationId: string;
  readonly firstTurn: boolean;
  readonly userText: string;
  readonly assistantText: string;
}

async function finalizeWithOneRetry(
  input: Parameters<typeof finalizeTurn>[0],
): Promise<void> {
  try {
    await finalizeTurn(input);
  } catch {
    await finalizeTurn(input);
  }
}

function safeClientMessage(error: AtlasModelError): string {
  switch (error.code) {
    case "rate_limit":
      return "The model is temporarily rate limited. Your message is saved; try again shortly.";
    case "timeout":
      return "The model took too long to respond. Any visible partial response was saved.";
    case "connection":
      return "The model could not be reached. Your message is saved.";
    case "authentication":
    case "permission":
      return "Atlas's model connection needs attention before another response can run.";
    case "cancelled":
      return "Generation stopped. The visible partial response was saved.";
    default:
      return "The response could not be completed. Your message is saved.";
  }
}

export async function executeTurn(
  input: ExecuteTurnInput,
  controller: ReadableStreamDefaultController<Uint8Array>,
): Promise<ExecuteTurnResult> {
  const turn = await beginTurn(input.ownerId, {
    ...(input.conversationId ? { conversationId: input.conversationId } : {}),
    clientTurnId: input.clientTurnId,
    text: input.text,
    provider: input.model.provider,
    model: input.model.modelId,
  });
  let sequence = 0;
  let controllerOpen = true;
  const emit = (event: AtlasStreamEventInput) => {
    if (!controllerOpen) return;
    try {
      sequence += 1;
      controller.enqueue(
        encodeStreamEvent({
          ...event,
          version: 1,
          operationId: turn.usageId ?? turn.assistantId,
          sequence,
        }),
      );
    } catch {
      controllerOpen = false;
    }
  };
  const close = () => {
    if (!controllerOpen) return;
    try {
      controller.close();
    } catch {
      // The browser may already have disconnected.
    }
    controllerOpen = false;
  };

  emit({
    type: "turn.started",
    conversationId: turn.conversationId,
    assistantMessageId: turn.assistantId,
    dailyUsageWarning: input.spend.dailyWarning,
  });

  if (turn.duplicate) {
    const text = turn.assistantContent.blocks
      .map((block) => block.text)
      .join("");
    if (text) emit({ type: "assistant.text.delta", text });
    if (turn.assistantStatus === "completed") {
      emit({
        type: "assistant.completed",
        finishReason: "completed",
        usage: null,
      });
    } else if (turn.assistantStatus === "interrupted") {
      emit({ type: "assistant.interrupted", characters: text.length });
    } else {
      emit({
        type: "turn.error",
        code: "duplicate_turn",
        message:
          "This turn is already in progress or has already been recorded.",
        retryable: false,
        partial: text.length > 0,
      });
    }
    close();
    return {
      completed: turn.assistantStatus === "completed",
      ownerId: input.ownerId,
      conversationId: turn.conversationId,
      firstTurn: false,
      userText: input.text,
      assistantText: text,
    };
  }

  const operationId = turn.usageId;
  if (!operationId) throw new Error("Turn usage operation is missing");
  logModelEvent({
    event: "model.turn.started",
    ownerId: input.ownerId,
    conversationId: turn.conversationId,
    messageId: turn.assistantId,
    usageId: operationId,
    provider: input.model.provider,
    model: input.model.modelId,
  });
  const startedAt = Date.now();
  let firstTokenAt: number | null = null;
  let requestId: string | null = null;
  let responseId: string | null = null;
  let usage: AtlasUsage | null = null;
  let finishReason: AtlasFinishReason = "unknown";
  let text = "";
  let refusal = false;
  let lastCheckpointAt = startedAt;
  let lastCheckpointLength = 0;
  let keepalive: ReturnType<typeof setInterval> | undefined;
  let compiledContext: CompiledConstitutionalContext | null = null;

  try {
    await markTurnStreaming(input.ownerId, turn.assistantId);
    emit({ type: "assistant.status", status: "receiving" });
    const history = await loadEligibleHistory(
      input.ownerId,
      turn.conversationId,
      turn.assistantId,
      input.clientTurnId,
    );
    compiledContext = await compileConstitutionalContext({
      ownerId: input.ownerId,
      conversationId: turn.conversationId,
      assistantMessageId: turn.assistantId,
      usageId: operationId,
      userText: input.text,
      conversationHistory: history,
      modelProvider: input.model.provider,
      model: input.model.modelId,
      maxInputTokens: 30_000,
      expectedOutputTokens: 4_096,
    });
    if (compiledContext.request.estimatedInputTokens > 30_000) {
      throw new AtlasModelError(
        "invalid_request",
        "The current message exceeds the context policy.",
        false,
      );
    }
    emit({ type: "assistant.status", status: "thinking" });
    await markContextTraceUsed(input.ownerId, compiledContext.traceId);
    keepalive = setInterval(
      () => emit({ type: "stream.keepalive" }),
      KEEPALIVE_INTERVAL_MS,
    );
    for await (const event of input.model.stream(
      compiledContext.request,
      input.signal,
    )) {
      if (event.type === "generation_started") {
        requestId = event.requestId;
        responseId = event.responseId;
      } else if (
        event.type === "text_delta" ||
        event.type === "refusal_delta"
      ) {
        if (event.type === "refusal_delta") refusal = true;
        if (firstTokenAt === null) {
          firstTokenAt = Date.now();
          emit({ type: "assistant.status", status: "responding" });
        }
        text += event.text;
        emit({ type: "assistant.text.delta", text: event.text });
        const checkpointDue =
          text.length - lastCheckpointLength >= CHECKPOINT_CHARACTERS ||
          Date.now() - lastCheckpointAt >= CHECKPOINT_INTERVAL_MS;
        if (checkpointDue) {
          await checkpointAssistant(
            input.ownerId,
            turn.assistantId,
            text,
            responseId,
          );
          lastCheckpointAt = Date.now();
          lastCheckpointLength = text.length;
          emit({ type: "assistant.checkpoint", characters: text.length });
        }
      } else if (event.type === "usage") {
        usage = event.usage;
      } else if (event.type === "completed") {
        responseId = event.responseId;
        finishReason = refusal ? "refusal" : event.finishReason;
      }
    }
    if (!text.trim()) {
      throw new AtlasModelError(
        "invalid_response",
        "The model returned no public response.",
        true,
      );
    }
    await finalizeWithOneRetry({
      ownerId: input.ownerId,
      conversationId: turn.conversationId,
      assistantId: turn.assistantId,
      usageId: operationId,
      text,
      status: "completed",
      finishReason,
      errorCode: null,
      requestId,
      responseId,
      usage,
      latencyMs: Date.now() - startedAt,
      timeToFirstTokenMs:
        firstTokenAt === null ? null : firstTokenAt - startedAt,
    });
    logModelEvent({
      event: "model.turn.completed",
      ownerId: input.ownerId,
      conversationId: turn.conversationId,
      messageId: turn.assistantId,
      usageId: operationId,
      provider: input.model.provider,
      model: input.model.modelId,
      requestId,
      responseId,
      latencyMs: Date.now() - startedAt,
      timeToFirstTokenMs:
        firstTokenAt === null ? null : firstTokenAt - startedAt,
      inputTokens: usage?.inputTokens ?? null,
      cachedInputTokens: usage?.cachedInputTokens ?? null,
      outputTokens: usage?.outputTokens ?? null,
      reasoningTokens: usage?.reasoningTokens ?? null,
      contextTraceId: compiledContext.traceId,
      contextSize: compiledContext.request.estimatedInputTokens,
      retrievedItemCount: compiledContext.selections.filter(
        (selection) => selection.included,
      ).length,
      taskCategory: compiledContext.taskCategory,
      persisted: true,
    });
    emit({ type: "assistant.completed", finishReason, usage });
    return {
      completed: true,
      ownerId: input.ownerId,
      conversationId: turn.conversationId,
      firstTurn: turn.isFirstTurn,
      userText: input.text,
      assistantText: text,
    };
  } catch (unknownError) {
    const error =
      unknownError instanceof AtlasModelError
        ? unknownError
        : new AtlasModelError(
            "provider_error",
            "Turn execution failed.",
            false,
            {
              cause: unknownError,
            },
          );
    const interrupted = error.code === "cancelled" || input.signal.aborted;
    try {
      await finalizeWithOneRetry({
        ownerId: input.ownerId,
        conversationId: turn.conversationId,
        assistantId: turn.assistantId,
        usageId: operationId,
        text,
        status: interrupted ? "interrupted" : "failed",
        finishReason: interrupted ? "cancelled" : "failed",
        errorCode: error.code,
        requestId,
        responseId,
        usage,
        latencyMs: Date.now() - startedAt,
        timeToFirstTokenMs:
          firstTokenAt === null ? null : firstTokenAt - startedAt,
      });
      logModelEvent({
        event: interrupted ? "model.turn.interrupted" : "model.turn.failed",
        ownerId: input.ownerId,
        conversationId: turn.conversationId,
        messageId: turn.assistantId,
        usageId: operationId,
        provider: input.model.provider,
        model: input.model.modelId,
        requestId,
        responseId,
        latencyMs: Date.now() - startedAt,
        timeToFirstTokenMs:
          firstTokenAt === null ? null : firstTokenAt - startedAt,
        inputTokens: usage?.inputTokens ?? null,
        cachedInputTokens: usage?.cachedInputTokens ?? null,
        outputTokens: usage?.outputTokens ?? null,
        reasoningTokens: usage?.reasoningTokens ?? null,
        contextTraceId: compiledContext?.traceId ?? null,
        contextSize: compiledContext?.request.estimatedInputTokens ?? null,
        retrievedItemCount:
          compiledContext?.selections.filter((selection) => selection.included)
            .length ?? null,
        taskCategory: compiledContext?.taskCategory ?? null,
        errorCode: error.code,
        diagnosticCode: error.diagnosticCode,
        persisted: true,
      });
      if (interrupted) {
        emit({ type: "assistant.interrupted", characters: text.length });
      } else {
        emit({
          type: "turn.error",
          code: error.code,
          message: safeClientMessage(error),
          retryable: error.retryable,
          partial: text.length > 0,
        });
      }
    } catch {
      logModelEvent({
        event: "model.turn.persistence_failed",
        ownerId: input.ownerId,
        conversationId: turn.conversationId,
        messageId: turn.assistantId,
        usageId: operationId,
        provider: input.model.provider,
        model: input.model.modelId,
        requestId,
        responseId,
        latencyMs: Date.now() - startedAt,
        timeToFirstTokenMs:
          firstTokenAt === null ? null : firstTokenAt - startedAt,
        errorCode: error.code,
        diagnosticCode: error.diagnosticCode,
        persisted: false,
      });
      emit({
        type: "turn.error",
        code: "persistence_failed",
        message:
          "The response could not be safely saved. Copy any visible text before leaving.",
        retryable: false,
        partial: text.length > 0,
      });
    }
    return {
      completed: false,
      ownerId: input.ownerId,
      conversationId: turn.conversationId,
      firstTurn: turn.isFirstTurn,
      userText: input.text,
      assistantText: text,
    };
  } finally {
    if (keepalive) clearInterval(keepalive);
    close();
  }
}
