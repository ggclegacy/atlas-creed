import { after, NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedOwner } from "@/lib/auth/guards";
import {
  executeTurn,
  type ExecuteTurnResult,
} from "@/lib/conversation/execute-turn";
import {
  assertGenerationAllowed,
  ConversationError,
} from "@/lib/conversation/service";
import { generateConversationTitle } from "@/lib/conversation/title-generation";
import { encodeStreamEvent } from "@/lib/conversation/stream";
import { modelFor } from "@/lib/model/registry";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_REQUEST_BYTES = 40_000;
const requestSchema = z.object({
  conversationId: z.uuid().optional(),
  clientTurnId: z.uuid(),
  text: z.string().trim().min(1).max(32_000),
});

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const originUrl = new URL(origin);
    const requestUrl = new URL(request.url);
    const forwardedHost = request.headers
      .get("x-forwarded-host")
      ?.split(",")[0]
      ?.trim();
    const forwardedProtocol = request.headers
      .get("x-forwarded-proto")
      ?.split(",")[0]
      ?.trim();
    const host =
      forwardedHost ?? request.headers.get("host") ?? requestUrl.host;
    const protocol = forwardedProtocol ?? requestUrl.protocol.slice(0, -1);
    return originUrl.host === host && originUrl.protocol === `${protocol}:`;
  } catch {
    return false;
  }
}

function clientError(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: Request) {
  const owner = await getAuthenticatedOwner();
  if (!owner) return clientError("unauthorized", "Sign in to use Atlas.", 401);
  if (!sameOrigin(request)) {
    return clientError(
      "invalid_origin",
      "The request origin was not accepted.",
      403,
    );
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return clientError("request_too_large", "The message is too large.", 413);
  }
  let bodyText: string;
  try {
    bodyText = await request.text();
  } catch {
    return clientError(
      "invalid_request",
      "The request body could not be read.",
      400,
    );
  }
  if (new TextEncoder().encode(bodyText).byteLength > MAX_REQUEST_BYTES) {
    return clientError("request_too_large", "The message is too large.", 413);
  }
  let body: z.infer<typeof requestSchema>;
  try {
    body = requestSchema.parse(JSON.parse(bodyText));
  } catch {
    return clientError(
      "invalid_request",
      "Send a valid message and turn identifier.",
      400,
    );
  }

  const model = modelFor("conversation");
  let spend;
  try {
    spend = await assertGenerationAllowed(owner.id, model.modelId);
  } catch (error) {
    if (error instanceof ConversationError) {
      const status = error.code === "rate_limited" ? 429 : 403;
      return clientError(error.code, error.message, status);
    }
    return clientError(
      "database_unavailable",
      "Atlas could not verify usage limits.",
      503,
    );
  }

  let resolveResult: (result: ExecuteTurnResult) => void = () => undefined;
  const resultPromise = new Promise<ExecuteTurnResult>((resolve) => {
    resolveResult = resolve;
  });
  after(async () => {
    const result = await resultPromise;
    if (result.completed && result.firstTurn) {
      await generateConversationTitle({
        ownerId: result.ownerId,
        conversationId: result.conversationId,
        userText: result.userText,
        assistantText: result.assistantText,
      });
    }
  });

  const executionController = new AbortController();
  if (request.signal.aborted) {
    executionController.abort(request.signal.reason);
  } else {
    request.signal.addEventListener(
      "abort",
      () => executionController.abort(request.signal.reason),
      { once: true },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      void executeTurn(
        {
          ownerId: owner.id,
          ...(body.conversationId
            ? { conversationId: body.conversationId }
            : {}),
          clientTurnId: body.clientTurnId,
          text: body.text,
          model,
          signal: executionController.signal,
          spend,
        },
        controller,
      )
        .then(resolveResult)
        .catch((error: unknown) => {
          const known = error instanceof ConversationError;
          try {
            controller.enqueue(
              encodeStreamEvent({
                version: 1,
                operationId: body.clientTurnId,
                sequence: 1,
                type: "turn.error",
                code: known ? error.code : "database_unavailable",
                message: known
                  ? error.message
                  : "Atlas could not safely start this turn. Your draft is unchanged.",
                retryable: !known,
                partial: false,
              }),
            );
            controller.close();
          } catch {
            // The browser may have disconnected before the turn could start.
          }
          resolveResult({
            completed: false,
            ownerId: owner.id,
            conversationId: body.conversationId ?? "",
            firstTurn: false,
            userText: body.text,
            assistantText: "",
          });
        });
    },
    cancel() {
      executionController.abort("response_stream_cancelled");
    },
  });
  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-store, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
