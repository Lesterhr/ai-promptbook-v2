/**
 * Collection – a group of templates stored as a local git repo.
 *
 * Each collection maps 1:1 to a folder under the app data directory
 * and optionally to a remote GitHub repository for manual push/pull.
 */

export interface CollectionRemote {
  /** GitHub repo in "owner/name" format */
  repo: string;
  /** Last successful sync timestamp (ISO-8601) */
  lastSyncedAt: string | null;
}

export interface Collection {
  /** Unique id (uuid-v4) */
  id: string;
  /** Display name */
  name: string;
  /** Short description */
  description: string;
  /** Absolute path on disk */
  path: string;
  /** Number of templates in this collection */
  templateCount: number;
  /** Optional remote config for push/pull */
  remote: CollectionRemote | null;
  /** ISO-8601 creation date */
  createdAt: string;
  /** ISO-8601 modification date */
  updatedAt: string;
}
