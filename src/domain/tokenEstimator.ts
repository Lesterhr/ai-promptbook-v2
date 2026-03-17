/**
 * Token estimator – estimates Anthropic (Claude) token count from plain text.
 *
 * Uses the simplified character-based formula optimised for mixed
 * German / English / Markdown / Code content:
 *   tokens ≈ characters ÷ 2.7   (±10 % accuracy)
 */

/** Characters per token for Anthropic's BPE tokenizer (mixed content average) */
const CHARS_PER_TOKEN = 2.7;

/** Claude context window size used as 100 % reference for the token bar */
export const MAX_CONTEXT_TOKENS = 200_000;

/** Estimate Anthropic token count from raw text */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/** Estimate Anthropic token count from a known character count */
export function estimateTokensFromCharCount(charCount: number): number {
  if (charCount <= 0) return 0;
  return Math.ceil(charCount / CHARS_PER_TOKEN);
}

/** Ratio 0..1 of estimated tokens relative to MAX_CONTEXT_TOKENS */
export function tokenRatio(tokens: number): number {
  return Math.min(tokens / MAX_CONTEXT_TOKENS, 1);
}
