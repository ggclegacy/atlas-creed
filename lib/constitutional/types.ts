export const INFORMATION_STATES = [
  "CANONICAL",
  "CURRENT_FACT",
  "HISTORICAL_FACT",
  "DECISION",
  "PREFERENCE",
  "PROPOSAL",
  "HYPOTHESIS",
  "BRAINSTORM",
  "SUPERSEDED",
  "DISPUTED",
  "UNKNOWN",
] as const;

export type InformationState = (typeof INFORMATION_STATES)[number];

export const SECURITY_CLASSIFICATIONS = [
  "PUBLIC",
  "INTERNAL",
  "PRIVATE",
  "SENSITIVE",
  "HIGHLY_SENSITIVE",
  "SECRETS",
] as const;

export type SecurityClassification = (typeof SECURITY_CLASSIFICATIONS)[number];

export const TRUST_CLASSES = [
  "SYSTEM_CONSTITUTIONAL_INSTRUCTION",
  "AUTHORIZED_FOUNDER_INSTRUCTION",
  "AUTHORIZED_OPERATIONAL_POLICY",
  "TRUSTED_FACT_SOURCE",
  "UNTRUSTED_CONTENT",
] as const;

export type TrustClass = (typeof TRUST_CLASSES)[number];

export const AUTHORITY_RANK = {
  RUNTIME_SECURITY: 100,
  CURRENT_FOUNDER_DIRECTION: 90,
  PROTECTED_CONSTITUTION: 80,
  CURRENT_VERIFIED_STATE: 70,
  EXPLICIT_DECISION: 65,
  DOMAIN_CANON: 60,
  VALIDATED_KNOWLEDGE: 45,
  PREFERENCE: 30,
  INFERENCE: 20,
  UNTRUSTED_CONTENT: 10,
} as const;

export type AuthorityClass = keyof typeof AUTHORITY_RANK;

export interface GovernedSourceReference {
  readonly id: string;
  readonly title: string;
  readonly sourceType: "kernel" | "canon" | "knowledge" | "task";
  readonly version: string | null;
  readonly informationState: InformationState;
  readonly trustClass: TrustClass;
  readonly authority: AuthorityClass;
  readonly sensitivity: SecurityClassification;
  readonly projectId: string | null;
  readonly sourceReference: string;
  readonly validFrom: Date | null;
  readonly validTo: Date | null;
  readonly lastVerifiedAt: Date | null;
  readonly supersededBy: string | null;
  readonly provenance: string;
}

export function isModelContextEligible(
  classification: SecurityClassification,
): boolean {
  return classification !== "SECRETS";
}

export function authorityRank(authority: AuthorityClass): number {
  return AUTHORITY_RANK[authority];
}
