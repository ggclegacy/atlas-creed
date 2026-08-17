import type { AtlasMessageContent } from "@/lib/conversation/content";
import { contentText, textContent } from "@/lib/conversation/content";
import type { AtlasRequest } from "@/lib/model/types";

export interface ContextHistoryMessage {
  readonly role: "user" | "assistant";
  readonly content: AtlasMessageContent;
  readonly status:
    "completed" | "interrupted" | "failed" | "pending" | "streaming";
}

export interface ContextBudget {
  readonly maxInputTokens: number;
  readonly expectedOutputTokens: number;
}

export interface AssembleContextInput {
  readonly identity: readonly string[];
  readonly behavioralStandards: readonly string[];
  readonly ownerProfile?: readonly string[];
  readonly coreCanon?: readonly string[];
  readonly projectContext?: readonly string[];
  readonly conversationHistory: readonly ContextHistoryMessage[];
  readonly retrievedContext?: readonly string[];
  readonly currentUserMessage: string;
  readonly availableTools: readonly never[];
  readonly contextBudget: ContextBudget;
}

export interface AssembledContext extends AtlasRequest {
  readonly omittedHistory: boolean;
  readonly estimatedInputTokens: number;
}

/** Conservative, provider-neutral estimate used only for deterministic windowing. */
export function estimateTextTokensConservatively(text: string): number {
  return Math.max(1, Math.ceil(text.length / 3));
}

function estimateInstructionTokens(parts: readonly string[]): number {
  return parts.reduce(
    (total, part) => total + estimateTextTokensConservatively(part) + 2,
    0,
  );
}

export function assembleContext(input: AssembleContextInput): AssembledContext {
  const futureLayers = [
    ...(input.ownerProfile ?? []),
    ...(input.coreCanon ?? []),
    ...(input.projectContext ?? []),
    ...(input.retrievedContext ?? []),
  ];
  const baseInstructions = [
    ...input.identity,
    ...input.behavioralStandards,
    ...futureLayers,
  ];
  const currentMessage = textContent(input.currentUserMessage);
  const usableHistory = input.conversationHistory.filter(
    (message) =>
      (message.status === "completed" || message.status === "interrupted") &&
      contentText(message.content).trim().length > 0,
  );

  const fixedTokens =
    estimateInstructionTokens(baseInstructions) +
    estimateTextTokensConservatively(input.currentUserMessage) +
    input.contextBudget.expectedOutputTokens;
  let remaining = Math.max(0, input.contextBudget.maxInputTokens - fixedTokens);
  const selected: ContextHistoryMessage[] = [];

  for (let index = usableHistory.length - 1; index >= 0; index -= 1) {
    const message = usableHistory[index];
    if (!message) continue;
    const cost =
      estimateTextTokensConservatively(contentText(message.content)) + 4;
    if (cost > remaining) break;
    selected.push(message);
    remaining -= cost;
  }
  selected.reverse();

  const omittedHistory = selected.length < usableHistory.length;
  const instructions = omittedHistory
    ? [
        ...baseInstructions,
        "Some earlier conversation turns exist outside the supplied context window. Do not claim to remember their contents; ask the owner for any missing detail that matters.",
      ]
    : baseInstructions;
  const messages = [
    ...selected.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    { role: "user" as const, content: currentMessage },
  ];
  const estimatedInputTokens =
    estimateInstructionTokens(instructions) +
    messages.reduce(
      (total, message) =>
        total +
        estimateTextTokensConservatively(contentText(message.content)) +
        4,
      0,
    );

  return {
    instructions,
    messages,
    maxOutputTokens: input.contextBudget.expectedOutputTokens,
    reasoning: "low",
    omittedHistory,
    estimatedInputTokens,
  };
}
