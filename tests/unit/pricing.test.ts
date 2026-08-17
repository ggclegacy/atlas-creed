import { describe, expect, it } from "vitest";

import { estimateUsageCostUsd, hasPriceBasis } from "../../lib/model/pricing";

describe("versioned usage price basis", () => {
  it("prices ordinary, cached, cache-write, and output tokens", () => {
    expect(
      estimateUsageCostUsd("gpt-5.6-sol", {
        inputTokens: 1_000_000,
        cachedInputTokens: 100_000,
        cacheWriteInputTokens: 100_000,
        outputTokens: 100_000,
        reasoningTokens: 20_000,
        totalTokens: 1_100_000,
      }),
    ).toBeCloseTo(7.675, 6);
  });

  it("refuses to invent cost for unknown models or missing counters", () => {
    expect(hasPriceBasis("gpt-5.6-terra")).toBe(true);
    expect(
      estimateUsageCostUsd("unknown", {
        inputTokens: 1,
        cachedInputTokens: 0,
        cacheWriteInputTokens: 0,
        outputTokens: 1,
        reasoningTokens: 0,
        totalTokens: 2,
      }),
    ).toBeNull();
  });
});
