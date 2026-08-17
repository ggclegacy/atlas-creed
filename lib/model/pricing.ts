import type { AtlasUsage } from "@/lib/model/types";

interface TokenRates {
  readonly inputPerMillion: number;
  readonly cachedInputPerMillion: number;
  readonly outputPerMillion: number;
  readonly cacheWriteMultiplier: number;
}

/** Standard API prices verified against the official model pages on 2026-08-17. */
const STANDARD_RATES: Readonly<Record<string, TokenRates>> = {
  "gpt-5.6-sol": {
    inputPerMillion: 5,
    cachedInputPerMillion: 0.5,
    outputPerMillion: 30,
    cacheWriteMultiplier: 1.25,
  },
  "gpt-5.6-terra": {
    inputPerMillion: 2.5,
    cachedInputPerMillion: 0.25,
    outputPerMillion: 15,
    cacheWriteMultiplier: 1.25,
  },
};

export function estimateUsageCostUsd(
  model: string,
  usage: AtlasUsage,
): number | null {
  const rates = STANDARD_RATES[model];
  if (!rates || usage.inputTokens === null || usage.outputTokens === null) {
    return null;
  }
  const cached = usage.cachedInputTokens ?? 0;
  const cacheWrite = usage.cacheWriteInputTokens ?? 0;
  const ordinaryInput = Math.max(0, usage.inputTokens - cached - cacheWrite);
  return (
    (ordinaryInput * rates.inputPerMillion +
      cached * rates.cachedInputPerMillion +
      cacheWrite * rates.inputPerMillion * rates.cacheWriteMultiplier +
      usage.outputTokens * rates.outputPerMillion) /
    1_000_000
  );
}

export function hasPriceBasis(model: string): boolean {
  return model in STANDARD_RATES;
}
