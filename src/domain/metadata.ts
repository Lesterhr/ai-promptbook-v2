/**
 * Shared metadata helpers and constants.
 */

/** Default semver for newly created templates */
export const DEFAULT_VERSION = '1.0.0';

/** Recognised filename suffixes for auto-categorisation */
export const TEMPLATE_SUFFIXES = [
  '.instructions.md',
  '.prompt.md',
  '.system.md',
  '.md',
] as const;

/** Generate a v4-style UUID (browser-safe) */
export function uuid(): string {
  return crypto.randomUUID();
}

/** Current timestamp in ISO-8601 */
export function now(): string {
  return new Date().toISOString();
}

/** Derive a default category from a filename */
export function inferCategory(filename: string): import('./template').TemplateCategory {
  const lower = filename.toLowerCase();
  if (lower.includes('instruction') || lower.includes('copilot')) return 'instruction';
  if (lower.includes('prompt') || lower.includes('system')) return 'system-prompt';
  if (lower.includes('readme')) return 'readme';
  if (lower.includes('workflow') || lower.includes('ci')) return 'workflow';
  if (lower.includes('snippet')) return 'snippet';
  return 'other';
}
