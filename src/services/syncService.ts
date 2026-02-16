/**
 * Sync service – orchestrates manual push/pull for a collection.
 * Combines gitService + storageService to keep metadata in sync.
 */

import * as gitSvc from './gitService';
import * as storage from './storageService';
import type { Collection } from '../domain';
import { now } from '../domain';

/**
 * Initialise a collection folder as a git repo and optionally
 * set a GitHub remote.
 */
export async function setupSync(
  collection: Collection,
  token: string,
  remoteRepo?: string, // "owner/name"
): Promise<void> {
  const isRepo = await gitSvc.isGitRepo(collection.path);
  if (!isRepo) {
    await gitSvc.initRepo(collection.path);
    await gitSvc.commitAll(collection.path, 'initial commit');
  }

  if (remoteRepo) {
    await gitSvc.setRemote(collection.path, token, remoteRepo);
    collection.remote = { repo: remoteRepo, lastSyncedAt: null };
    await storage.updateCollection(collection);
  }
}

/**
 * Push local changes to the remote.
 * Auto-commits any uncommitted changes first.
 */
export async function pushCollection(
  collection: Collection,
  token: string,
): Promise<void> {
  if (!collection.remote) throw new Error('No remote configured');

  // ensure remote URL has the latest token
  await gitSvc.setRemote(collection.path, token, collection.remote.repo);

  if (await gitSvc.hasUncommitted(collection.path)) {
    await gitSvc.commitAll(collection.path);
  }

  await gitSvc.push(collection.path);

  collection.remote.lastSyncedAt = now();
  await storage.updateCollection(collection);
}

/**
 * Pull remote changes into the local collection.
 */
export async function pullCollection(
  collection: Collection,
  token: string,
): Promise<void> {
  if (!collection.remote) throw new Error('No remote configured');

  await gitSvc.setRemote(collection.path, token, collection.remote.repo);
  await gitSvc.pull(collection.path);

  collection.remote.lastSyncedAt = now();
  await storage.updateCollection(collection);
}
