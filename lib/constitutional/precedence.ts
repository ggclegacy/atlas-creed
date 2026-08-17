import {
  authorityRank,
  type GovernedSourceReference,
} from "@/lib/constitutional/types";

export interface PrecedenceCandidate {
  readonly source: GovernedSourceReference;
  readonly claim: string;
}

export type PrecedenceDecision =
  | {
      readonly kind: "resolved";
      readonly winner: PrecedenceCandidate;
      readonly reason: string;
    }
  | {
      readonly kind: "conflict";
      readonly candidates: readonly PrecedenceCandidate[];
      readonly reason: string;
      readonly blocksTask: boolean;
    };

/** Resolves only when deterministic authority and currency metadata justify it. */
export function resolvePrecedence(
  candidates: readonly PrecedenceCandidate[],
): PrecedenceDecision {
  if (candidates.length === 0) {
    return {
      kind: "conflict",
      candidates,
      reason: "No source establishes the claim.",
      blocksTask: true,
    };
  }
  const ranked = [...candidates].sort((left, right) => {
    const authorityDifference =
      authorityRank(right.source.authority) -
      authorityRank(left.source.authority);
    if (authorityDifference !== 0) return authorityDifference;
    return (
      (right.source.lastVerifiedAt?.valueOf() ?? 0) -
      (left.source.lastVerifiedAt?.valueOf() ?? 0)
    );
  });
  const winner = ranked[0];
  if (!winner) {
    throw new Error("Precedence candidates disappeared during ranking.");
  }
  const runnerUp = ranked[1];
  if (!runnerUp) {
    return {
      kind: "resolved",
      winner,
      reason: "Only one eligible source establishes the claim.",
    };
  }
  const winnerRank = authorityRank(winner.source.authority);
  const runnerUpRank = authorityRank(runnerUp.source.authority);
  if (winnerRank > runnerUpRank) {
    return {
      kind: "resolved",
      winner,
      reason: `${winner.source.authority} deterministically outranks ${runnerUp.source.authority}.`,
    };
  }
  if (
    winner.source.lastVerifiedAt &&
    runnerUp.source.lastVerifiedAt &&
    winner.source.lastVerifiedAt > runnerUp.source.lastVerifiedAt &&
    winner.source.informationState === "CURRENT_FACT" &&
    runnerUp.source.informationState === "HISTORICAL_FACT"
  ) {
    return {
      kind: "resolved",
      winner,
      reason:
        "A newer verified current fact outranks historical fact at equal authority.",
    };
  }
  if (ranked.every((candidate) => candidate.claim === winner.claim)) {
    return {
      kind: "resolved",
      winner,
      reason: "Equal-authority sources agree on the material claim.",
    };
  }
  return {
    kind: "conflict",
    candidates: ranked,
    reason:
      "These sources conflict, and Atlas lacks deterministic authority or evidence to silently resolve them.",
    blocksTask: true,
  };
}
