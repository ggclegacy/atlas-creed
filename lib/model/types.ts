/**
 * Atlas Creed — model layer contract.
 *
 * Build Plan §7 / Bible §22: Atlas must not be architecturally confused with
 * the model currently powering him. Provider SDKs are importable ONLY inside
 * this directory (enforced by ESLint; proved by tests/arch/model-boundary).
 *
 * `AtlasEvent` is deliberately OUR union, not a re-export of any provider's
 * event types. The provider's wire format stops at the adapter boundary — that
 * is what makes swapping providers an added file rather than a refactor.
 *
 * Phase 0 defines the contract only. No adapter is implemented, no SDK is
 * installed, and no model is called until Phase 2.
 */

/**
 * Which class of work a call belongs to.
 *
 * Both resolve to the same model in V1 — by configuration, not by assumption.
 * Background work (titling, extraction, classification, summarization) may
 * later move to a cheaper model through this same interface. The distinction
 * costs nothing now and preserves the option.
 */
export type ModelRole = "conversation" | "background";

export interface AtlasMessage {
  readonly role: "user" | "assistant";
  /**
   * The full content-block array, never flattened to a string.
   * Reasoning blocks must round-trip unmodified when continuing on the same
   * model; flattening is very expensive to undo later (Build Plan §9).
   */
  readonly content: readonly unknown[];
}

export interface AtlasRequest {
  readonly role: ModelRole;
  readonly system: readonly string[];
  readonly messages: readonly AtlasMessage[];
  readonly maxTokens: number;
}

export interface AtlasUsage {
  readonly inputTokens: number;
  readonly outputTokens: number;
  /**
   * The health metric for the whole context architecture. Zero across
   * consecutive turns within a session means the cached prefix is broken
   * (Build Plan §18).
   */
  readonly cacheReadInputTokens: number;
  readonly cacheCreationInputTokens: number;
}

export type AtlasEvent =
  | { readonly type: "text_delta"; readonly text: string }
  | { readonly type: "thinking_start" }
  | { readonly type: "usage"; readonly usage: AtlasUsage }
  | { readonly type: "done"; readonly stopReason: string }
  | { readonly type: "error"; readonly message: string };

export interface AtlasModel {
  readonly id: string;
  stream(request: AtlasRequest, signal: AbortSignal): AsyncIterable<AtlasEvent>;
}
