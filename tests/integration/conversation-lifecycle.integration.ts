import { randomUUID } from "node:crypto";

import { eq, sql } from "drizzle-orm";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { contentText } from "@/lib/conversation/content";
import {
  executeTurn,
  type ExecuteTurnResult,
} from "@/lib/conversation/execute-turn";
import {
  archiveConversation,
  assertGenerationAllowed,
  beginTurn,
  getConversation,
  listConversations,
} from "@/lib/conversation/service";
import { getDatabase } from "@/lib/db/client";
import { conversations, messages, modelUsage, owners } from "@/lib/db/schema";
import {
  AtlasModelError,
  type AtlasEvent,
  type AtlasModel,
  type AtlasRequest,
  type AtlasStructuredRequest,
  type AtlasStructuredResult,
} from "@/lib/model/types";

const usage = {
  inputTokens: 40,
  outputTokens: 12,
  cachedInputTokens: null,
  cacheWriteInputTokens: null,
  reasoningTokens: 3,
  totalTokens: 52,
} as const;

class FakeModel implements AtlasModel {
  readonly provider = "fixture";
  readonly modelId = "gpt-5.6-sol";
  calls = 0;
  requests: AtlasRequest[] = [];

  constructor(
    private readonly mode: "complete" | "cancel" | "fail" = "complete",
  ) {}

  async *stream(request: AtlasRequest): AsyncIterable<AtlasEvent> {
    await Promise.resolve();
    this.calls += 1;
    this.requests.push(request);
    yield {
      type: "generation_started",
      requestId: `req-${this.calls}`,
      responseId: `resp-${this.calls}`,
    };
    if (this.mode === "fail") {
      throw new AtlasModelError("connection", "fixture failure", true);
    }
    yield { type: "text_delta", text: "Atlas fixture response." };
    if (this.mode === "cancel") {
      throw new AtlasModelError("cancelled", "fixture cancellation", false);
    }
    yield { type: "usage", usage };
    yield {
      type: "completed",
      finishReason: "completed",
      responseId: `resp-${this.calls}`,
    };
  }

  structured<T>(
    _request: AtlasStructuredRequest<T>,
    _signal: AbortSignal,
  ): Promise<AtlasStructuredResult<T>> {
    return Promise.reject(
      new Error("Structured generation is outside this fixture."),
    );
  }
}

async function createOwner(email: string): Promise<string> {
  const [owner] = await getDatabase()
    .insert(owners)
    .values({ email, emailVerified: new Date() })
    .returning({ id: owners.id });
  if (!owner) throw new Error("Owner fixture was not created");
  return owner.id;
}

async function runTurn(input: {
  ownerId: string;
  conversationId?: string;
  clientTurnId?: string;
  text: string;
  model: AtlasModel;
}): Promise<{ result: ExecuteTurnResult; frames: string }> {
  let resultPromise!: Promise<ExecuteTurnResult>;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      resultPromise = executeTurn(
        {
          ownerId: input.ownerId,
          ...(input.conversationId
            ? { conversationId: input.conversationId }
            : {}),
          clientTurnId: input.clientTurnId ?? randomUUID(),
          text: input.text,
          model: input.model,
          signal: new AbortController().signal,
          spend: {
            dailyUsd: 0,
            monthlyUsd: 0,
            dailyWarning: false,
            monthlyBlocked: false,
          },
        },
        controller,
      );
    },
  });
  const frames = await new Response(stream).text();
  return { result: await resultPromise, frames };
}

beforeEach(async () => {
  await getDatabase().execute(
    sql`truncate table model_usage, messages, conversations, owners cascade`,
  );
});

afterAll(async () => {
  await getDatabase().execute(
    sql`truncate table model_usage, messages, conversations, owners cascade`,
  );
});

describe("conversation persistence", () => {
  it("scopes open/list/archive reads to the owner and supports cursor pages", async () => {
    const ownerId = await createOwner("owner-a@example.com");
    const otherOwnerId = await createOwner("owner-b@example.com");
    const first = await beginTurn(ownerId, {
      clientTurnId: randomUUID(),
      text: "First durable thread",
      provider: "fixture",
      model: "gpt-5.6-sol",
    });
    const second = await beginTurn(ownerId, {
      clientTurnId: randomUUID(),
      text: "Second durable thread",
      provider: "fixture",
      model: "gpt-5.6-sol",
    });
    await getDatabase()
      .update(conversations)
      .set({ lastMessageAt: new Date("2026-08-17T12:00:00Z") })
      .where(eq(conversations.id, first.conversationId));
    await getDatabase()
      .update(conversations)
      .set({ lastMessageAt: new Date("2026-08-17T13:00:00Z") })
      .where(eq(conversations.id, second.conversationId));

    const newest = await listConversations(ownerId, { limit: 1 });
    expect(newest.map((row) => row.id)).toEqual([second.conversationId]);
    const cursor = newest[0];
    if (!cursor) throw new Error("Newest conversation cursor is missing");
    const older = await listConversations(ownerId, {
      limit: 1,
      before: cursor,
    });
    expect(older.map((row) => row.id)).toEqual([first.conversationId]);
    expect(
      await getConversation(otherOwnerId, first.conversationId),
    ).toBeNull();

    await archiveConversation(ownerId, first.conversationId);
    expect(await getConversation(ownerId, first.conversationId)).toBeNull();
    await expect(
      beginTurn(ownerId, {
        conversationId: first.conversationId,
        clientTurnId: randomUUID(),
        text: "Cannot continue an archive",
        provider: "fixture",
        model: "gpt-5.6-sol",
      }),
    ).rejects.toMatchObject({ code: "archived" });
  });

  it("deduplicates the same client turn into one user/assistant/usage set", async () => {
    const ownerId = await createOwner("owner@example.com");
    const clientTurnId = randomUUID();
    const first = await beginTurn(ownerId, {
      clientTurnId,
      text: "Only once",
      provider: "fixture",
      model: "gpt-5.6-sol",
    });
    const duplicate = await beginTurn(ownerId, {
      conversationId: first.conversationId,
      clientTurnId,
      text: "Only once",
      provider: "fixture",
      model: "gpt-5.6-sol",
    });
    expect(duplicate.duplicate).toBe(true);

    const [counts] = await getDatabase()
      .select({
        messageCount: sql<number>`count(distinct ${messages.id})::int`,
        usageCount: sql<number>`count(distinct ${modelUsage.id})::int`,
      })
      .from(messages)
      .leftJoin(
        modelUsage,
        eq(modelUsage.conversationId, messages.conversationId),
      )
      .where(eq(messages.conversationId, first.conversationId));
    expect(counts).toEqual({
      messageCount: 2,
      usageCount: 1,
    });
  });

  it("streams, finalizes usage, reloads, and supplies prior public history", async () => {
    const ownerId = await createOwner("owner@example.com");
    const model = new FakeModel();
    const first = await runTurn({
      ownerId,
      text: "Remember this public turn.",
      model,
    });
    expect(first.frames).toContain("assistant.text.delta");
    expect(first.frames).toContain("assistant.completed");
    expect(first.result.completed).toBe(true);

    const reloaded = await getConversation(
      ownerId,
      first.result.conversationId,
    );
    expect(reloaded?.messages.map((message) => message.role)).toEqual([
      "user",
      "assistant",
    ]);
    expect(reloaded?.messages.map((message) => message.status)).toEqual([
      "completed",
      "completed",
    ]);
    expect(contentText(reloaded!.messages[1]!.content)).toBe(
      "Atlas fixture response.",
    );
    const [ledger] = await getDatabase()
      .select()
      .from(modelUsage)
      .where(eq(modelUsage.conversationId, first.result.conversationId));
    expect(ledger).toMatchObject({
      status: "completed",
      inputTokens: 40,
      outputTokens: 12,
      reasoningTokens: 3,
    });

    await runTurn({
      ownerId,
      conversationId: first.result.conversationId,
      text: "Continue from that turn.",
      model,
    });
    expect(model.requests[1]?.messages.map((message) => message.role)).toEqual([
      "user",
      "assistant",
      "user",
    ]);
    expect(
      model.requests[1]?.messages.map((message) =>
        contentText(message.content),
      ),
    ).toEqual([
      "Remember this public turn.",
      "Atlas fixture response.",
      "Continue from that turn.",
    ]);
  });

  it("persists visible partial text and cancellation metrics", async () => {
    const ownerId = await createOwner("owner@example.com");
    const outcome = await runTurn({
      ownerId,
      text: "Stop safely",
      model: new FakeModel("cancel"),
    });
    expect(outcome.result.completed).toBe(false);
    expect(outcome.frames).toContain("assistant.interrupted");
    const reloaded = await getConversation(
      ownerId,
      outcome.result.conversationId,
    );
    expect(reloaded?.messages[1]?.status).toBe("interrupted");
    expect(contentText(reloaded!.messages[1]!.content)).toBe(
      "Atlas fixture response.",
    );
    const [ledger] = await getDatabase()
      .select()
      .from(modelUsage)
      .where(eq(modelUsage.conversationId, outcome.result.conversationId));
    expect(ledger).toMatchObject({
      status: "cancelled",
      errorCode: "cancelled",
    });
  });

  it("normalizes provider failure without inventing public assistant text", async () => {
    const ownerId = await createOwner("owner@example.com");
    const outcome = await runTurn({
      ownerId,
      text: "Fail safely",
      model: new FakeModel("fail"),
    });
    expect(outcome.frames).toContain("turn.error");
    expect(outcome.frames).not.toContain("fixture failure");
    const reloaded = await getConversation(
      ownerId,
      outcome.result.conversationId,
    );
    expect(reloaded?.messages[1]).toMatchObject({
      status: "failed",
      errorCode: "connection",
    });
    expect(contentText(reloaded!.messages[1]!.content)).toBe("");
  });

  it("enforces the owner start-rate bound before a provider can run", async () => {
    const ownerId = await createOwner("owner@example.com");
    await getDatabase()
      .insert(modelUsage)
      .values(
        Array.from({ length: 12 }, () => ({
          ownerId,
          purpose: "conversation_turn" as const,
          role: "conversation" as const,
          provider: "fixture",
          model: "gpt-5.6-sol",
        })),
      );
    await expect(
      assertGenerationAllowed(ownerId, "gpt-5.6-sol"),
    ).rejects.toEqual(expect.objectContaining({ code: "rate_limited" }));
  });
});
