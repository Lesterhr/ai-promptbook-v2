/**
 * Path service – resolves canonical paths for the app data directory,
 * collection folders, and template files.
 *
 * Uses Tauri's path API on desktop and falls back to hardcoded paths
 * during development in the browser.
 */

import { homeDir, join } from '@tauri-apps/api/path';

/** Root folder under user home: ~/.ai-promptbook */
const APP_DIR_NAME = '.ai-promptbook';

export async function getAppDataDir(): Promise<string> {
  const home = await homeDir();
  return join(home, APP_DIR_NAME);
}

export async function getCollectionsDir(): Promise<string> {
  const appDir = await getAppDataDir();
  return join(appDir, 'collections');
}

export async function getCollectionPath(collectionId: string): Promise<string> {
  const colDir = await getCollectionsDir();
  return join(colDir, collectionId);
}

export async function getConfigPath(): Promise<string> {
  const appDir = await getAppDataDir();
  return join(appDir, 'config.json');
}

export async function getCacheDir(): Promise<string> {
  const appDir = await getAppDataDir();
  return join(appDir, 'cache');
}
