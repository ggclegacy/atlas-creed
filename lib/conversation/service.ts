import "server-only";

import { randomUUID } from "node:crypto";

import {
  and,
  asc,
  desc,
  eq,
  gt,
  inArray,
  isNull,
  lt,
  ne,
  or,
  sql,
} from "drizzle-orm";

import { parseMessageContent, textContent } from "@/lib/conversation/content";
import { deterministicTitle } from "@/lib/conversation/title";
import { getDatabase } from "@/lib/db/client";
import { conversations, messages, modelUsage } from "@/lib/db/schema";
import { getServerEnv } from "@/lib/env/server";
import { estimateUsageCostUsd, hasPriceBasis } from "@/lib/model/pricing";
import type {
  AtlasErrorCode,
  AtlasFinishReason,
  AtlasUsage,
  ModelRole,
} from "@/lib/model/types";

const OWNER_RATE_WINDOW_MS = 10 * 60 * 1_000;
const OWNER_RATE_MAX_STARTS = 12;
const STALE_GENERATION_MS = 5 * 60 * 1_000;

export class ConversationError extends Error {
  constructor(
    public readonly code:
      | "not_found"
      | "archived"
      | "turn_in_progress"
      | "rate_limited"
      | "monthly_limit"
      | "unsupported_cost_model",
    message: string,
  ) {
    super(message);
    this.name = "ConversationError";
  }
}

export interface ConversationSummary {
  readonly id: string;
  readonly title: string;
  readonly lastMessageAt: Date;
}

export interface ConversationCursor {
  readonly id: string;
  readonly lastMessageAt: Date;
}

export interface PublicMessage {
  readonly id: string;
  readonly role: "user" | "assistant";
  readonly content: ReturnType<typeof parseMessageContent>;
  readonly status:
    "pending" | "streaming" | "completed" | "interrupted" | "failed";
  readonly createdAt: Date;
  readonly finishReason: string | null;
  readonly errorCode: string | null;
}

export interface SpendState {
  readonly dailyUsd: number;
  readonly monthlyUsd: number;
  readonly dailyWarning: boolean;
  readonly monthlyBlocked: boolean;
}

function startOfUtcDay(now: Date): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

function startOfUtcMonth(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function readSpendState(
  ownerId: string,
  now = new Date(),
): Promise<SpendState> {
  const db = getDatabase();
  const monthStart = startOfUtcMonth(now);
  const dayStart = startOfUtcDay(now);
  const rows = await db
    .select({
      model: modelUsage.model,
      startedAt: modelUsage.startedAt,
      inputTokens: modelUsage.inputTokens,
      cachedInputTokens: modelUsage.cachedInputTokens,
      cacheWriteInputTokens: modelUsage.cacheWriteInputTokens,
      outputTokens: modelUsage.outputTokens,
      reasoningTokens: modelUsage.reasoningTokens,
      totalTokens: modelUsage.totalTokens,
    })
    .from(modelUsage)
    .where(
      and(
        eq(modelUsage.ownerId, ownerId),
        eq(modelUsage.status, "completed"),
        gt(modelUsage.startedAt, monthStart),
      ),
    );

  let dailyUsd = 0;
  let monthlyUsd = 0;
  for (const row of rows) {
    const cost = estimateUsageCostUsd(row.model, row);
    if (cost === null) continue;
    monthlyUsd += cost;
    if (row.startedAt >= dayStart) dailyUsd += cost;
  }
  const env = getServerEnv();
  return {
    dailyUsd,
    monthlyUsd,
    dailyWarning: dailyUsd >= env.ATLAS_DAILY_SOFT_LIMIT_USD,
    monthlyBlocked: monthlyUsd >= env.ATLAS_MONTHLY_HARD_LIMIT_USD,
  };
}

export async function assertGenerationAllowed(
  ownerId: string,
  model: string,
  now = new Date(),
): Promise<SpendState> {
  if (!hasPriceBasis(model)) {
    throw new ConversationError(
      "unsupported_cost_model",
      "The configured model has no approved cost basis.",
    );
  }
  const db = getDatabase();
  const [{ count = 0 } = {}] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(modelUsage)
    .where(
      and(
        eq(modelUsage.ownerId, ownerId),
        eq(modelUsage.purpose, "conversation_turn"),
        gt(
          modelUsage.startedAt,
          new Date(now.getTime() - OWNER_RATE_WINDOW_MS),
        ),
      ),
    );
  if (count >= OWNER_RATE_MAX_STARTS) {
    throw new ConversationError(
      "rate_limited",
      "Atlas has reached the short-term generation limit. Try again in a few minutes.",
    );
  }
  const spend = await readSpendState(ownerId, now);
  if (spend.monthlyBlocked) {
    throw new ConversationError(
      "monthly_limit",
      "The configured monthly Atlas usage ceiling has been reached.",
    );
  }
  return spend;
}

export async function reconcileStaleGenerations(
  ownerId: string,
): Promise<void> {
  const db = getDatabase();
  const staleBefore = new Date(Date.now() - STALE_GENERATION_MS);
  await db.transaction(async (tx) => {
    await tx
      .update(messages)
      .set({
        status: "interrupted",
        errorCode: "stale_generation",
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(messages.ownerId, ownerId),
          inArray(messages.status, ["pending", "streaming"]),
          lt(messages.updatedAt, staleBefore),
        ),
      );
    await tx
      .update(modelUsage)
      .set({
        status: "failed",
        errorCode: "stale_generation",
        completedAt: new Date(),
      })
      .where(
        and(
          eq(modelUsage.ownerId, ownerId),
          eq(modelUsage.status, "started"),
          lt(modelUsage.startedAt, staleBefore),
        ),
      );
  });
}

export async function listConversations(
  ownerId: string,
  options: {
    readonly before?: ConversationCursor;
    readonly limit?: number;
  } = {},
): Promise<ConversationSummary[]> {
  await reconcileStaleGenerations(ownerId);
  const limit = Math.min(Math.max(options.limit ?? 30, 1), 100);
  const before = options.before;
  const rows = await getDatabase()
    .select({
      id: conversations.id,
      title: conversations.title,
      lastMessageAt: conversations.lastMessageAt,
    })
    .from(conversations)
    .where(
      and(
        eq(conversations.ownerId, ownerId),
        isNull(conversations.archivedAt),
        ...(before
          ? [
              or(
                lt(conversations.lastMessageAt, before.lastMessageAt),
                and(
                  eq(conversations.lastMessageAt, before.lastMessageAt),
                  lt(conversations.id, before.id),
                ),
              ),
            ]
          : []),
      ),
    )
    .orderBy(desc(conversations.lastMessageAt), desc(conversations.id))
    .limit(limit);
  return rows.map((row) => ({
    ...row,
    title: row.title ?? "Untitled conversation",
  }));
}

export async function archiveConversation(
  ownerId: string,
  conversationId: string,
): Promise<void> {
  const [archived] = await getDatabase()
    .update(conversations)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.ownerId, ownerId),
        isNull(conversations.archivedAt),
      ),
    )
    .returning({ id: conversations.id });
  if (!archived) {
    throw new ConversationError("not_found", "Conversation not found.");
  }
}

export async function getConversation(ownerId: string, conversationId: string) {
  await reconcileStaleGenerations(ownerId);
  const [conversation] = await getDatabase()
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.ownerId, ownerId),
      ),
    )
    .limit(1);
  if (!conversation || conversation.archivedAt) return null;
  const rows = await getDatabase()
    .select({
      id: messages.id,
      role: messages.role,
      content: messages.content,
      status: messages.status,
      createdAt: messages.createdAt,
      finishReason: messages.finishReason,
      errorCode: messages.errorCode,
    })
    .from(messages)
    .where(
      and(
        eq(messages.ownerId, ownerId),
        eq(messages.conversationId, conversationId),
      ),
    )
    .orderBy(
      asc(messages.createdAt),
      sql`case when ${messages.role} = 'user' then 0 else 1 end`,
      asc(messages.id),
    )
    .limit(200);
  return {
    id: conversation.id,
    title: conversation.title ?? "Untitled conversation",
    messages: rows
      .filter(
        (row): row is typeof row & { role: "user" | "assistant" } =>
          row.role === "user" || row.role === "assistant",
      )
      .map((row): PublicMessage => ({
        ...row,
        content: parseMessageContent(row.content),
      })),
  };
}

export interface BeginTurnInput {
  readonly conversationId?: string;
  readonly clientTurnId: string;
  readonly text: string;
  readonly provider: string;
  readonly model: string;
}

export async function beginTurn(ownerId: string, input: BeginTurnInput) {
  const db = getDatabase();
  const conversationId = input.conversationId ?? randomUUID();
  return db.transaction(async (tx) => {
    if (input.conversationId) {
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtext(${conversationId}))`,
      );
    }
    let [conversation] = await tx
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.ownerId, ownerId),
        ),
      )
      .limit(1);
    if (!conversation) {
      if (input.conversationId) {
        throw new ConversationError("not_found", "Conversation not found.");
      }
      [conversation] = await tx
        .insert(conversations)
        .values({
          id: conversationId,
          ownerId,
          title: deterministicTitle(input.text),
        })
        .returning();
    }
    if (!conversation) throw new Error("Conversation creation failed");
    if (conversation.archivedAt) {
      throw new ConversationError("archived", "This conversation is archived.");
    }

    const duplicateRows = await tx
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.ownerId, ownerId),
          eq(messages.conversationId, conversationId),
          eq(messages.clientTurnId, input.clientTurnId),
        ),
      );
    const duplicateAssistant = duplicateRows.find(
      (row) => row.role === "assistant",
    );
    if (duplicateAssistant) {
      return {
        duplicate: true as const,
        conversationId,
        assistantId: duplicateAssistant.id,
        assistantStatus: duplicateAssistant.status,
        assistantContent: parseMessageContent(duplicateAssistant.content),
        usageId: null,
        isFirstTurn: false,
      };
    }

    const [active] = await tx
      .select({ id: messages.id })
      .from(messages)
      .where(
        and(
          eq(messages.ownerId, ownerId),
          eq(messages.conversationId, conversationId),
          eq(messages.role, "assistant"),
          inArray(messages.status, ["pending", "streaming"]),
        ),
      )
      .limit(1);
    if (active) {
      throw new ConversationError(
        "turn_in_progress",
        "This conversation already has an active response.",
      );
    }
    const [{ count: priorUserCount = 0 } = {}] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(messages)
      .where(
        and(
          eq(messages.ownerId, ownerId),
          eq(messages.conversationId, conversationId),
          eq(messages.role, "user"),
        ),
      );
    const now = new Date();
    await tx.insert(messages).values({
      ownerId,
      conversationId,
      role: "user",
      content: textContent(input.text),
      status: "completed",
      clientTurnId: input.clientTurnId,
      completedAt: now,
    });
    const [assistant] = await tx
      .insert(messages)
      .values({
        ownerId,
        conversationId,
        role: "assistant",
        content: textContent(""),
        provider: input.provider,
        model: input.model,
        status: "pending",
        clientTurnId: input.clientTurnId,
      })
      .returning({ id: messages.id });
    if (!assistant) throw new Error("Assistant placeholder creation failed");
    const [usage] = await tx
      .insert(modelUsage)
      .values({
        ownerId,
        conversationId,
        messageId: assistant.id,
        purpose: "conversation_turn",
        role: "conversation",
        provider: input.provider,
        model: input.model,
      })
      .returning({ id: modelUsage.id });
    if (!usage) throw new Error("Usage ledger creation failed");
    await tx
      .update(conversations)
      .set({ lastMessageAt: now, updatedAt: now })
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.ownerId, ownerId),
        ),
      );
    return {
      duplicate: false as const,
      conversationId,
      assistantId: assistant.id,
      assistantStatus: "pending" as const,
      assistantContent: textContent(""),
      usageId: usage.id,
      isFirstTurn: priorUserCount === 0,
    };
  });
}

export async function loadEligibleHistory(
  ownerId: string,
  conversationId: string,
  currentAssistantId: string,
  currentTurnId: string,
) {
  const rows = await getDatabase()
    .select({
      role: messages.role,
      content: messages.content,
      status: messages.status,
    })
    .from(messages)
    .where(
      and(
        eq(messages.ownerId, ownerId),
        eq(messages.conversationId, conversationId),
        ne(messages.id, currentAssistantId),
        or(
          isNull(messages.clientTurnId),
          ne(messages.clientTurnId, currentTurnId),
        ),
        inArray(messages.role, ["user", "assistant"]),
      ),
    )
    .orderBy(
      asc(messages.createdAt),
      sql`case when ${messages.role} = 'user' then 0 else 1 end`,
      asc(messages.id),
    );
  return rows.map((row) => ({
    role: row.role as "user" | "assistant",
    content: parseMessageContent(row.content),
    status: row.status,
  }));
}

export async function markTurnStreaming(
  ownerId: string,
  assistantId: string,
): Promise<void> {
  const now = new Date();
  await getDatabase()
    .update(messages)
    .set({ status: "streaming", startedAt: now, updatedAt: now })
    .where(and(eq(messages.id, assistantId), eq(messages.ownerId, ownerId)));
}

export async function checkpointAssistant(
  ownerId: string,
  assistantId: string,
  text: string,
  providerResponseId: string | null,
): Promise<void> {
  await getDatabase()
    .update(messages)
    .set({
      content: textContent(text),
      providerResponseId,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(messages.id, assistantId),
        eq(messages.ownerId, ownerId),
        inArray(messages.status, ["pending", "streaming"]),
      ),
    );
}

export interface FinalizeTurnInput {
  readonly ownerId: string;
  readonly conversationId: string;
  readonly assistantId: string;
  readonly usageId: string;
  readonly text: string;
  readonly status: "completed" | "interrupted" | "failed";
  readonly finishReason: AtlasFinishReason;
  readonly errorCode: AtlasErrorCode | "empty_response" | null;
  readonly requestId: string | null;
  readonly responseId: string | null;
  readonly usage: AtlasUsage | null;
  readonly latencyMs: number;
  readonly timeToFirstTokenMs: number | null;
}

export async function finalizeTurn(input: FinalizeTurnInput): Promise<void> {
  const now = new Date();
  await getDatabase().transaction(async (tx) => {
    await tx
      .update(messages)
      .set({
        content: textContent(input.text),
        status: input.status,
        completedAt: now,
        finishReason: input.finishReason,
        errorCode: input.errorCode,
        providerResponseId: input.responseId,
        updatedAt: now,
      })
      .where(
        and(
          eq(messages.id, input.assistantId),
          eq(messages.ownerId, input.ownerId),
        ),
      );
    await tx
      .update(modelUsage)
      .set({
        status:
          input.status === "completed"
            ? "completed"
            : input.status === "interrupted"
              ? "cancelled"
              : "failed",
        requestId: input.requestId,
        responseId: input.responseId,
        inputTokens: input.usage?.inputTokens ?? null,
        cachedInputTokens: input.usage?.cachedInputTokens ?? null,
        cacheWriteInputTokens: input.usage?.cacheWriteInputTokens ?? null,
        outputTokens: input.usage?.outputTokens ?? null,
        reasoningTokens: input.usage?.reasoningTokens ?? null,
        totalTokens: input.usage?.totalTokens ?? null,
        finishReason: input.finishReason,
        errorCode: input.errorCode,
        latencyMs: input.latencyMs,
        timeToFirstTokenMs: input.timeToFirstTokenMs,
        completedAt: now,
      })
      .where(
        and(
          eq(modelUsage.id, input.usageId),
          eq(modelUsage.ownerId, input.ownerId),
        ),
      );
    await tx
      .update(conversations)
      .set({ lastMessageAt: now, updatedAt: now })
      .where(
        and(
          eq(conversations.id, input.conversationId),
          eq(conversations.ownerId, input.ownerId),
        ),
      );
  });
}

export async function createUsageOperation(input: {
  ownerId: string;
  conversationId: string;
  purpose: "conversation_title";
  role: ModelRole;
  provider: string;
  model: string;
}) {
  const [row] = await getDatabase()
    .insert(modelUsage)
    .values(input)
    .returning({ id: modelUsage.id });
  if (!row) throw new Error("Usage ledger creation failed");
  return row.id;
}

export async function finalizeUsageOperation(input: {
  ownerId: string;
  usageId: string;
  status: "completed" | "failed";
  requestId: string | null;
  responseId: string | null;
  usage: AtlasUsage | null;
  finishReason: AtlasFinishReason;
  errorCode: AtlasErrorCode | null;
  latencyMs: number;
}) {
  await getDatabase()
    .update(modelUsage)
    .set({
      status: input.status,
      requestId: input.requestId,
      responseId: input.responseId,
      inputTokens: input.usage?.inputTokens ?? null,
      cachedInputTokens: input.usage?.cachedInputTokens ?? null,
      cacheWriteInputTokens: input.usage?.cacheWriteInputTokens ?? null,
      outputTokens: input.usage?.outputTokens ?? null,
      reasoningTokens: input.usage?.reasoningTokens ?? null,
      totalTokens: input.usage?.totalTokens ?? null,
      finishReason: input.finishReason,
      errorCode: input.errorCode,
      latencyMs: input.latencyMs,
      completedAt: new Date(),
    })
    .where(
      and(
        eq(modelUsage.id, input.usageId),
        eq(modelUsage.ownerId, input.ownerId),
      ),
    );
}

export async function updateGeneratedTitle(
  ownerId: string,
  conversationId: string,
  title: string,
): Promise<void> {
  await getDatabase()
    .update(conversations)
    .set({ title, updatedAt: new Date() })
    .where(
      and(
        eq(conversations.id, conversationId),
        eq(conversations.ownerId, ownerId),
      ),
    );
}
