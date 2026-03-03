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
  /** Encrypted LLM provider credentials (n8n-style) */
  modelCredentials?: import('../domain').ModelCredential[];
  [key: string]: unknown;
}

export async function loadConfig(): Promise<AppConfig> {
  const configPath = await getConfigPath();
  if (!(await exists(configPath))) return {};
  const raw = await readTextFile(configPath);
  return JSON.parse(raw) as AppConfig;
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await ensureAppDirs();
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
    const col = JSON.parse(raw) as Collection;

    // Compute actual template count from index
    const ip = await join(col.path, '_index.json');
    if (await exists(ip)) {
      const idxRaw = await readTextFile(ip);
      const tpls = JSON.parse(idxRaw) as unknown[];
      col.templateCount = tpls.length;
    } else {
      col.templateCount = 0;
    }

    collections.push(col);
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

/**
 * Update only metadata fields of an existing template in the index.
 * Does NOT touch the template content file — ideal for lightweight updates like rating.
 */
export async function patchTemplateMetadata(
  collectionPath: string,
  templateId: string,
  patch: Partial<Omit<TemplateMetadata, 'id' | 'filename'>>,
): Promise<TemplateMetadata> {
  const templates = await listTemplates(collectionPath);
  const idx = templates.findIndex((t) => t.id === templateId);
  if (idx < 0) throw new Error(`Template "${templateId}" not found in index`);
  const updated: TemplateMetadata = { ...templates[idx], ...patch };
  templates[idx] = updated;
  await saveIndex(collectionPath, templates);
  return updated;
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
  // Archive old version if version changed
  const templates = await listTemplates(collectionPath);
  const existing = templates.find((t) => t.id === template.id);
  if (existing && existing.version !== template.version) {
    await archiveTemplateVersion(collectionPath, existing);
  }

  const filePath = await join(collectionPath, template.filename);
  await writeTextFile(filePath, template.content);

  // Update index
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

/* ────────── Version History ────────── */

export interface ArchivedVersion {
  version: string;
  archivedAt: string;
  filename: string;
  meta: TemplateMetadata;
}

/** Get the history directory for a specific template */
async function historyDir(collectionPath: string, templateId: string): Promise<string> {
  return join(collectionPath, '_history', templateId);
}

/** Archive the current version of a template before saving a new version */
async function archiveTemplateVersion(
  collectionPath: string,
  existingMeta: TemplateMetadata,
): Promise<void> {
  const dir = await historyDir(collectionPath, existingMeta.id);
  if (!(await exists(dir))) await mkdir(dir, { recursive: true });

  // Read old content
  const oldFilePath = await join(collectionPath, existingMeta.filename);
  let oldContent = '';
  if (await exists(oldFilePath)) {
    oldContent = await readTextFile(oldFilePath);
  }

  const ts = now();
  const safeVersion = existingMeta.version.replace(/[^a-zA-Z0-9._-]/g, '_');
  const archiveFilename = `v${safeVersion}.md`;

  // Save archived content
  const archivePath = await join(dir, archiveFilename);
  await writeTextFile(archivePath, oldContent);

  // Update history index
  const indexPath = await join(dir, '_history.json');
  let history: ArchivedVersion[] = [];
  if (await exists(indexPath)) {
    history = JSON.parse(await readTextFile(indexPath)) as ArchivedVersion[];
  }
  history.push({
    version: existingMeta.version,
    archivedAt: ts,
    filename: archiveFilename,
    meta: existingMeta,
  });
  await writeTextFile(indexPath, JSON.stringify(history, null, 2));
}

/** List all archived versions for a template */
export async function listTemplateHistory(
  collectionPath: string,
  templateId: string,
): Promise<ArchivedVersion[]> {
  const dir = await historyDir(collectionPath, templateId);
  const indexPath = await join(dir, '_history.json');
  if (!(await exists(indexPath))) return [];
  const raw = await readTextFile(indexPath);
  return (JSON.parse(raw) as ArchivedVersion[]).sort(
    (a, b) => b.archivedAt.localeCompare(a.archivedAt),
  );
}

/** Read the content of an archived template version */
export async function readArchivedVersion(
  collectionPath: string,
  templateId: string,
  archiveFilename: string,
): Promise<string> {
  const dir = await historyDir(collectionPath, templateId);
  const filePath = await join(dir, archiveFilename);
  return readTextFile(filePath);
}

/** Delete specific archived versions for a template */
export async function deleteArchivedVersions(
  collectionPath: string,
  templateId: string,
  archiveFilenames: string[],
): Promise<void> {
  const dir = await historyDir(collectionPath, templateId);
  const idxPath = await join(dir, '_history.json');
  if (!(await exists(idxPath))) return;

  let history = JSON.parse(await readTextFile(idxPath)) as ArchivedVersion[];
  for (const fn of archiveFilenames) {
    const fp = await join(dir, fn);
    if (await exists(fp)) await remove(fp);
    history = history.filter((h) => h.filename !== fn);
  }

  if (history.length === 0) {
    // Remove entire history dir if empty
    await remove(dir, { recursive: true });
  } else {
    await writeTextFile(idxPath, JSON.stringify(history, null, 2));
  }
}

/** Delete all archived versions for a template */
export async function deleteAllTemplateHistory(
  collectionPath: string,
  templateId: string,
): Promise<void> {
  const dir = await historyDir(collectionPath, templateId);
  if (await exists(dir)) await remove(dir, { recursive: true });
}

/** Restore an archived version – replaces the current template content & version */
export async function restoreArchivedVersion(
  collectionPath: string,
  templateId: string,
  archived: ArchivedVersion,
): Promise<void> {
  const content = await readArchivedVersion(collectionPath, templateId, archived.filename);
  const templates = await listTemplates(collectionPath);
  const current = templates.find((t) => t.id === templateId);
  if (!current) throw new Error('Template not found');

  // Archive current version before restoring
  await archiveTemplateVersion(collectionPath, current);

  // Build restored template
  const restored: Template = {
    ...current,
    version: archived.version,
    content,
    updatedAt: now(),
  };
  const filePath = await join(collectionPath, restored.filename);
  await writeTextFile(filePath, content);

  const idx = templates.findIndex((t) => t.id === templateId);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { content: _c, ...metaOnly } = restored as Template;
  templates[idx] = metaOnly;
  await saveIndex(collectionPath, templates);
}

/** List all histories across all templates in a collection */
export async function listAllHistories(
  collectionPath: string,
): Promise<{ templateId: string; templateName: string; versions: ArchivedVersion[] }[]> {
  const historyRoot = await join(collectionPath, '_history');
  if (!(await exists(historyRoot))) return [];

  const entries = await readDir(historyRoot);
  const templates = await listTemplates(collectionPath);
  const results: { templateId: string; templateName: string; versions: ArchivedVersion[] }[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory) continue;
    const templateId = entry.name;
    const tpl = templates.find((t) => t.id === templateId);
    const idxPath = await join(historyRoot, templateId, '_history.json');
    if (!(await exists(idxPath))) continue;
    const history = JSON.parse(await readTextFile(idxPath)) as ArchivedVersion[];
    results.push({
      templateId,
      templateName: tpl?.name ?? archived_name_from_history(history),
      versions: history.sort((a, b) => b.archivedAt.localeCompare(a.archivedAt)),
    });
  }

  return results.sort((a, b) => a.templateName.localeCompare(b.templateName));
}

function archived_name_from_history(history: ArchivedVersion[]): string {
  return history[0]?.meta?.name ?? 'Unknown Template';
}

/** Duplicate a template under a new name */
export async function duplicateTemplate(
  collectionPath: string,
  sourceTemplate: Template,
  newName: string,
): Promise<Template> {
  const id = uuid();
  const filename = `${newName.toLowerCase().replace(/\s+/g, '-')}.instructions.md`;

  const duplicate: Template = {
    ...sourceTemplate,
    id,
    name: newName,
    filename,
    createdAt: now(),
    updatedAt: now(),
    lastUsedAt: null,
    useCount: 0,
    source: { type: 'created' },
    version: DEFAULT_VERSION,
  };

  await saveTemplate(collectionPath, duplicate);
  return duplicate;
}

export async function createTemplate(
  collectionPath: string,
  name: string,
  category: import('../domain').TemplateCategory,
  content: string,
  customFilename?: string,
): Promise<Template> {
  const id = uuid();
  const filename = customFilename || `${name.toLowerCase().replace(/\s+/g, '-')}.instructions.md`;

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

export async function moveTemplate(
  sourceCollectionPath: string,
  targetCollectionPath: string,
  templateId: string,
): Promise<void> {
  const srcTemplates = await listTemplates(sourceCollectionPath);
  const meta = srcTemplates.find((t) => t.id === templateId);
  if (!meta) throw new Error('Template not found in source collection');

  // Read the template content
  const srcFilePath = await join(sourceCollectionPath, meta.filename);
  const content = await readTextFile(srcFilePath);

  // Save to target collection
  const destFilePath = await join(targetCollectionPath, meta.filename);
  await writeTextFile(destFilePath, content);

  // Add to target index
  const tgtTemplates = await listTemplates(targetCollectionPath);
  tgtTemplates.push({ ...meta, updatedAt: now() });
  await saveIndex(targetCollectionPath, tgtTemplates);

  // Remove from source
  if (await exists(srcFilePath)) await remove(srcFilePath);
  const remaining = srcTemplates.filter((t) => t.id !== templateId);
  await saveIndex(sourceCollectionPath, remaining);
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

/* ────────── Export helpers ────────── */

/**
 * Export a template to a file. Returns the exported file path.
 * @param template The template to export
 * @param destinationPath The destination file path
 */
export async function exportTemplateToFile(
  template: Template,
  destinationPath: string,
): Promise<void> {
  await writeTextFile(destinationPath, template.content);
}
