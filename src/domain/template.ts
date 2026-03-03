/**
 * Template – core domain entity for an agent resource file.
 *
 * Covers instruction files, system prompts, README templates, etc.
 * Metadata fields support versioning, last-used tracking, and search.
 */

/** Recognised resource categories */
export type TemplateCategory =
  | 'instruction'     // copilot-instructions / agent instructions
  | 'system-prompt'   // reusable system prompts
  | 'readme'          // readme templates
  | 'workflow'        // CI / automation templates
  | 'snippet'         // generic reusable prompt snippets
  | 'other';

/** Source from which a template was imported */
export type TemplateSource =
  | { type: 'local'; path: string }
  | { type: 'github'; repo: string; path: string; sha?: string }
  | { type: 'created' };

export interface TemplateMetadata {
  /** Unique id (uuid-v4) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Short description */
  description: string;
  /** Category tag */
  category: TemplateCategory;
  /** Free-form tags for search / filtering */
  tags: string[];
  /** ISO-8601 date of creation */
  createdAt: string;
  /** ISO-8601 date of last modification */
  updatedAt: string;
  /** ISO-8601 date the template was last used / applied */
  lastUsedAt: string | null;
  /** How many times the template has been used */
  useCount: number;
  /** Import provenance */
  source: TemplateSource;
  /** Semver-style version label */
  version: string;
  /** Filename on disk (relative to collection root) */
  filename: string;
  /** User-assigned quality rating 1–10. null/undefined means unrated. */
  rating?: number | null;
}

export interface Template extends TemplateMetadata {
  /** Full markdown/text content */
  content: string;
}
