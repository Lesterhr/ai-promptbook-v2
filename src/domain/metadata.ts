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

/**
 * Parse a semver-style version string into [major, minor, patch].
 * Falls back to [1, 0, 0] on invalid input.
 */
export function parseSemver(version: string): [number, number, number] {
  const clean = version.replace(/^v/i, '');
  const parts = clean.split('.').map(Number);
  const major = Number.isFinite(parts[0]) ? parts[0] : 1;
  const minor = Number.isFinite(parts[1]) ? parts[1] : 0;
  const patch = Number.isFinite(parts[2]) ? parts[2] : 0;
  return [major, minor, patch];
}

/**
 * Suggest the next patch, minor, and major versions for a given semver string.
 * Returns an array of three version strings, e.g. for "1.2.3":
 *   ["1.2.4", "1.3.0", "2.0.0"]
 */
export function suggestNextVersions(currentVersion: string): string[] {
  const [major, minor, patch] = parseSemver(currentVersion);
  return [
    `${major}.${minor}.${patch + 1}`,   // patch bump
    `${major}.${minor + 1}.0`,           // minor bump
    `${major + 1}.0.0`,                  // major bump
  ];
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
