/**
 * Migration service – import templates from the legacy Flet app's
 * Copilot-Templates folder or from any local directory.
 */

import { readDir, readTextFile, exists } from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import type { Template } from '../domain';
import { uuid, now, inferCategory, DEFAULT_VERSION } from '../domain';

/**
 * Scan a directory for `.instructions.md` (and `.md`) files
 * and return Template objects ready for import.
 */
export async function scanDirectory(dirPath: string): Promise<Template[]> {
  if (!(await exists(dirPath))) return [];

  const entries = await readDir(dirPath);
  const templates: Template[] = [];

  for (const entry of entries) {
    if (entry.isDirectory) continue;
    const name = entry.name;
    if (!name.endsWith('.md')) continue;

    const filePath = await join(dirPath, name);
    const content = await readTextFile(filePath);
    const displayName = name
      .replace(/\.instructions\.md$/, '')
      .replace(/\.md$/, '')
      .replace(/[-_]/g, ' ');

    templates.push({
      id: uuid(),
      name: displayName,
      description: '',
      category: inferCategory(name),
      tags: [],
      createdAt: now(),
      updatedAt: now(),
      lastUsedAt: null,
      useCount: 0,
      source: { type: 'local', path: filePath },
      version: DEFAULT_VERSION,
      filename: name,
      content,
    });
  }

  return templates;
}

/**
 * Import all templates from a scanned directory into a collection.
 * Returns the number of imported templates.
 */
export async function importAllFromDirectory(
  dirPath: string,
  collectionPath: string,
): Promise<number> {
  const { saveTemplate } = await import('./storageService');
  const templates = await scanDirectory(dirPath);

  for (const tpl of templates) {
    await saveTemplate(collectionPath, tpl);
  }

  return templates.length;
}
