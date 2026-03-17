/**
 * Copilot integration – domain types for the optional AI features.
 *
 * All AI functionality is opt-in: the app works fully without the Copilot CLI.
 * When enabled, these types govern configuration, status checks, and
 * request/response shapes for AI-powered template operations.
 */

/* ────────── Status ────────── */

/** Result of probing the local Copilot CLI installation */
export interface CopilotStatus {
  /** Whether the CLI binary was found and responded */
  available: boolean;
  /** Reported CLI version string, e.g. "1.2.3" */
  version: string | null;
  /** Resolved path to the CLI binary (if found) */
  cliPath: string | null;
}

/* ────────── Configuration ────────── */

/** Supported BYOK provider types */
export type ByokProviderType = 'openai' | 'anthropic' | 'azure';

/** Bring-Your-Own-Key configuration for custom LLM providers */
export interface ByokConfig {
  /** Provider type */
  type: ByokProviderType;
  /** API endpoint URL */
  baseUrl: string;
  /** Encrypted API key (AES-256-GCM, same scheme as GitHub tokens) */
  apiKeyEncrypted: string;
}

/** Persisted Copilot configuration (stored in config.json) */
export interface CopilotConfig {
  /** Master toggle for all AI features */
  enabled: boolean;
  /** Override path to the CLI binary (null = use PATH) */
  cliPath: string | null;
  /** Model identifier (e.g. "gpt-4o", "claude-sonnet-4") */
  model: string;
  /** Optional BYOK provider (replaces GitHub Copilot auth) */
  byok: ByokConfig | null;
}

/** Default config when Copilot has never been configured */
export const DEFAULT_COPILOT_CONFIG: CopilotConfig = {
  enabled: false,
  cliPath: null,
  model: 'gpt-4o',
  byok: null,
};

/* ────────── Request / Response ────────── */

/** Payload for an AI content generation call */
export interface GenerateRequest {
  /** System message defining the AI's role and constraints */
  systemMessage: string;
  /** User prompt describing the desired output */
  prompt: string;
  /** Override model for this request (falls back to config.model) */
  model?: string;
}

/** Result returned from a content generation call */
export interface GenerateResult {
  /** Generated text content */
  content: string;
  /** Model that produced the response */
  model: string;
}

/* ────────── Quality Scoring ────────── */

/** Dimension scores returned by the AI quality analysis */
export interface QualityScore {
  /** Overall score (1–10) */
  overall: number;
  /** Completeness of sections and coverage */
  completeness: number;
  /** Clarity and precision of instructions */
  clarity: number;
  /** How specific vs. vague the instructions are */
  specificity: number;
  /** Adherence to format-specific best practices */
  bestPractices: number;
  /** Structural consistency and formatting */
  structure: number;
  /** Concrete improvement suggestions */
  suggestions: string[];
}
