/**
 * Storage service – CRUD operations for collections and templates on disk.
 *
 * Uses the Tauri FS plugin to read/write files in the app data directory.
 * Each collection is a folder containing template files + a `meta.json` index.
 */

import {
  exists,
  mkdir,
  readDir,
  readTextFile,
  writeTextFile,
  remove,
  rename,
  type DirEntry,
} from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import type { Collection, Template, TemplateMetadata } from '../domain';
import { uuid, now, inferCategory, DEFAULT_VERSION } from '../domain';
import { getCollectionsDir, getCollectionPath, getConfigPath, getAppDataDir } from './pathService';

/* ────────── Bootstrap ────────── */

/** Ensure the root app directory and collections dir exist */
export async function ensureAppDirs(): Promise<void> {
  const appDir = await getAppDataDir();
  if (!(await exists(appDir))) await mkdir(appDir, { recursive: true });

  const colDir = await getCollectionsDir();
  if (!(await exists(colDir))) await mkdir(colDir, { recursive: true });
}

/* ────────── Config (tokens, settings) ────────── */

export interface SavedToken {
  id: string;           // unique identifier
  label: string;        // user-friendly name, e.g. "Work" or "Personal"
  encrypted: string;    // AES-256-GCM encrypted blob (base64)
  createdAt: string;    // ISO timestamp
}

export interface AppConfig {
  /** @deprecated kept for migration – use savedTokens instead */
  githubToken?: string | null;
  savedTokens?: SavedToken[];
  [key: string]: unknown;
}

export async function loadConfig(): Promise<AppConfig> {
  const configPath = await getConfigPath();
  if (!(await exists(configPath))) return {};
  const raw = await readTextFile(configPath);
  return JSON.parse(raw) as AppConfig;
}

export async function saveConfig(config: AppConfig): Promise<void> {
  const configPath = await getConfigPath();
  await writeTextFile(configPath, JSON.stringify(config, null, 2));
}

/* ────────── Collections ────────── */

export async function listCollections(): Promise<Collection[]> {
  const colDir = await getCollectionsDir();
  if (!(await exists(colDir))) return [];

  const entries: DirEntry[] = await readDir(colDir);
  const collections: Collection[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory) continue;
    const metaPath = await join(colDir, entry.name, 'meta.json');
    if (!(await exists(metaPath))) continue;
    const raw = await readTextFile(metaPath);
    collections.push(JSON.parse(raw) as Collection);
  }

  return collections.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function createCollection(name: string, description: string): Promise<Collection> {
  const id = uuid();
  const colPath = await getCollectionPath(id);
  await mkdir(colPath, { recursive: true });

  const collection: Collection = {
    id,
    name,
    description,
    path: colPath,
    templateCount: 0,
    remote: null,
    createdAt: now(),
    updatedAt: now(),
  };

  const metaPath = await join(colPath, 'meta.json');
  await writeTextFile(metaPath, JSON.stringify(collection, null, 2));
  return collection;
}

export async function updateCollection(col: Collection): Promise<void> {
  const metaPath = await join(col.path, 'meta.json');
  col.updatedAt = now();
  await writeTextFile(metaPath, JSON.stringify(col, null, 2));
}

export async function deleteCollection(col: Collection): Promise<void> {
  await remove(col.path, { recursive: true });
}

/* ────────── Templates within a Collection ────────── */

/** Index file inside every collection stores template metadata */
async function indexPath(collectionPath: string): Promise<string> {
  return join(collectionPath, '_index.json');
}

export async function listTemplates(collectionPath: string): Promise<TemplateMetadata[]> {
  const ip = await indexPath(collectionPath);
  if (!(await exists(ip))) return [];
  const raw = await readTextFile(ip);
  return JSON.parse(raw) as TemplateMetadata[];
}

async function saveIndex(collectionPath: string, templates: TemplateMetadata[]): Promise<void> {
  const ip = await indexPath(collectionPath);
  await writeTextFile(ip, JSON.stringify(templates, null, 2));
}

export async function readTemplate(collectionPath: string, meta: TemplateMetadata): Promise<Template> {
  const filePath = await join(collectionPath, meta.filename);
  const content = await readTextFile(filePath);
  return { ...meta, content };
}

export async function saveTemplate(
  collectionPath: string,
  template: Template,
): Promise<TemplateMetadata> {
  const filePath = await join(collectionPath, template.filename);
  await writeTextFile(filePath, template.content);

  // Update index
  const templates = await listTemplates(collectionPath);
  const idx = templates.findIndex((t) => t.id === template.id);
  const meta: TemplateMetadata = { ...template, updatedAt: now() };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { content: _content, ...metaOnly } = { ...meta } as Template;
  if (idx >= 0) {
    templates[idx] = metaOnly;
  } else {
    templates.push(metaOnly);
  }
  await saveIndex(collectionPath, templates);
  return metaOnly;
}

export async function createTemplate(
  collectionPath: string,
  name: string,
  category: import('../domain').TemplateCategory,
  content: string,
): Promise<Template> {
  const id = uuid();
  const filename = `${name.toLowerCase().replace(/\s+/g, '-')}.instructions.md`;

  const template: Template = {
    id,
    name,
    description: '',
    category,
    tags: [],
    createdAt: now(),
    updatedAt: now(),
    lastUsedAt: null,
    useCount: 0,
    source: { type: 'created' },
    version: DEFAULT_VERSION,
    filename,
    content,
  };

  await saveTemplate(collectionPath, template);
  return template;
}

export async function deleteTemplate(collectionPath: string, templateId: string): Promise<void> {
  const templates = await listTemplates(collectionPath);
  const tpl = templates.find((t) => t.id === templateId);
  if (tpl) {
    const filePath = await join(collectionPath, tpl.filename);
    if (await exists(filePath)) await remove(filePath);
  }
  const remaining = templates.filter((t) => t.id !== templateId);
  await saveIndex(collectionPath, remaining);
}

export async function renameTemplateFile(
  collectionPath: string,
  oldFilename: string,
  newFilename: string,
): Promise<void> {
  const oldPath = await join(collectionPath, oldFilename);
  const newPath = await join(collectionPath, newFilename);
  if (await exists(oldPath)) await rename(oldPath, newPath);
}

/* ────────── Import helpers ────────── */

export async function importTemplateFromFile(
  collectionPath: string,
  sourcePath: string,
  sourceFileName: string,
): Promise<Template> {
  const content = await readTextFile(sourcePath);
  const name = sourceFileName.replace(/\.instructions\.md$|\.md$/, '').replace(/[-_]/g, ' ');
  const category = inferCategory(sourceFileName);
  return createTemplate(collectionPath, name, category, content);
}
