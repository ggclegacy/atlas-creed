import "server-only";

import { z } from "zod";

import { textContent } from "@/lib/conversation/content";
import { sanitizeGeneratedTitle } from "@/lib/conversation/title";
import {
  assertGenerationAllowed,
  createUsageOperation,
  finalizeUsageOperation,
  updateGeneratedTitle,
} from "@/lib/conversation/service";
import { modelFor } from "@/lib/model/registry";
import { AtlasModelError } from "@/lib/model/types";

const titleSchema = z.object({ title: z.string().min(3).max(72) });

export async function generateConversationTitle(input: {
  ownerId: string;
  conversationId: string;
  userText: string;
  assistantText: string;
}): Promise<void> {
  const model = modelFor("background");
  try {
    await assertGenerationAllowed(input.ownerId, model.modelId);
  } catch {
    return;
  }
  let usageId: string;
  try {
    usageId = await createUsageOperation({
      ownerId: input.ownerId,
      conversationId: input.conversationId,
      purpose: "conversation_title",
      role: "background",
      provider: model.provider,
      model: model.modelId,
    });
  } catch {
    return;
  }
  const startedAt = Date.now();
  try {
    const result = await model.structured(
      {
        instructions: [
          "Create a specific, useful conversation title from the supplied public exchange.",
          "Return 3–7 words, no quotation marks, no trailing punctuation, and no generic labels such as New Conversation.",
        ],
        messages: [
          {
            role: "user",
            content: textContent(
              `Owner: ${input.userText.slice(0, 2_000)}\n\nAtlas: ${input.assistantText.slice(0, 3_000)}`,
            ),
          },
        ],
        maxOutputTokens: 64,
        reasoning: "none",
        schema: titleSchema,
        schemaName: "atlas_conversation_title",
      },
      AbortSignal.timeout(30_000),
    );
    const title = sanitizeGeneratedTitle(result.value.title);
    if (title) {
      await updateGeneratedTitle(input.ownerId, input.conversationId, title);
    }
    await finalizeUsageOperation({
      ownerId: input.ownerId,
      usageId,
      status: "completed",
      requestId: result.requestId,
      responseId: result.responseId,
      usage: result.usage,
      finishReason: result.finishReason,
      errorCode: null,
      latencyMs: Date.now() - startedAt,
    });
  } catch (error) {
    await finalizeUsageOperation({
      ownerId: input.ownerId,
      usageId,
      status: "failed",
      requestId: null,
      responseId: null,
      usage: null,
      finishReason: "failed",
      errorCode:
        error instanceof AtlasModelError ? error.code : "provider_error",
      latencyMs: Date.now() - startedAt,
    }).catch(() => undefined);
  }
}
