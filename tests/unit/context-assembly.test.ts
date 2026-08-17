import { describe, expect, it } from "vitest";

import {
  ATLAS_BEHAVIORAL_STANDARDS,
  ATLAS_IDENTITY,
} from "../../lib/atlas/identity";
import { textContent } from "../../lib/conversation/content";
import {
  assembleContext,
  estimateTextTokensConservatively,
} from "../../lib/context/assemble";

describe("pure context assembly", () => {
  it("keeps the exact stable layer order and appends the current owner turn", () => {
    const result = assembleContext({
      identity: ATLAS_IDENTITY,
      behavioralStandards: ATLAS_BEHAVIORAL_STANDARDS,
      conversationHistory: [
        {
          role: "user",
          content: textContent("Earlier owner"),
          status: "completed",
        },
        {
          role: "assistant",
          content: textContent("Earlier Atlas"),
          status: "completed",
        },
      ],
      currentUserMessage: "Current owner",
      availableTools: [],
      contextBudget: { maxInputTokens: 20_000, expectedOutputTokens: 1_000 },
    });
    expect(result.instructions).toEqual([
      ...ATLAS_IDENTITY,
      ...ATLAS_BEHAVIORAL_STANDARDS,
    ]);
    expect(result.messages).toEqual([
      { role: "user", content: textContent("Earlier owner") },
      { role: "assistant", content: textContent("Earlier Atlas") },
      { role: "user", content: textContent("Current owner") },
    ]);
    expect(result).toMatchSnapshot();
  });

  it("selects whole recent messages and marks omitted history truthfully", () => {
    const result = assembleContext({
      identity: ["Identity"],
      behavioralStandards: ["Behavior"],
      conversationHistory: [
        {
          role: "user",
          content: textContent("old ".repeat(100)),
          status: "completed",
        },
        {
          role: "assistant",
          content: textContent("recent"),
          status: "interrupted",
        },
        { role: "assistant", content: textContent("failed"), status: "failed" },
      ],
      currentUserMessage: "now",
      availableTools: [],
      contextBudget: { maxInputTokens: 50, expectedOutputTokens: 10 },
    });
    expect(result.omittedHistory).toBe(true);
    expect(result.messages).toEqual([
      { role: "assistant", content: textContent("recent") },
      { role: "user", content: textContent("now") },
    ]);
    expect(result.instructions.at(-1)).toMatch(/Do not claim to remember/);
  });

  it("uses a deterministic conservative estimate", () => {
    expect(estimateTextTokensConservatively("")).toBe(1);
    expect(estimateTextTokensConservatively("1234567")).toBe(3);
  });
});
