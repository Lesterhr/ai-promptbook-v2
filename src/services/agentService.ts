/**
 * Agent service – CRUD operations for agent projects on disk.
 *
 * Projects are stored as JSON files under ~/.ai-promptbook/agents/{id}/project.json.
 * Also provides bridge functions between agent instructions and the template system.
 */

import {
  exists,
  mkdir,
  readDir,
  readTextFile,
  writeTextFile,
  remove,
} from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import type { AgentProject, AgentProjectMeta, AgentNodeConfig, TemplateMetadata } from '../domain';
import { uuid, now, createLlmAgent } from '../domain';
import { getAgentsDir, getAgentProjectDir } from './pathService';
import * as storageService from './storageService';

/* ───── Bootstrap ───── */

/** Ensure the agents directory exists */
async function ensureAgentsDir(): Promise<void> {
  const dir = await getAgentsDir();
  if (!(await exists(dir))) await mkdir(dir, { recursive: true });
}

/* ───── Project CRUD ───── */

/** List all agent project metadata */
export async function listProjects(): Promise<AgentProjectMeta[]> {
  await ensureAgentsDir();
  const agentsDir = await getAgentsDir();
  const entries = await readDir(agentsDir);
  const metas: AgentProjectMeta[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory) continue;
    const projectFile = await join(agentsDir, entry.name, 'project.json');
    if (!(await exists(projectFile))) continue;

    try {
      const raw = await readTextFile(projectFile);
      const project = JSON.parse(raw) as AgentProject;
      metas.push(projectToMeta(project));
    } catch {
      // Skip corrupt project files
    }
  }

  return metas.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

/** Load a full agent project by ID */
export async function loadProject(id: string): Promise<AgentProject> {
  const dir = await getAgentProjectDir(id);
  const projectFile = await join(dir, 'project.json');
  const raw = await readTextFile(projectFile);
  return JSON.parse(raw) as AgentProject;
}

/** Save (create or update) an agent project */
export async function saveProject(project: AgentProject): Promise<void> {
  const dir = await getAgentProjectDir(project.id);
  if (!(await exists(dir))) await mkdir(dir, { recursive: true });
  const projectFile = await join(dir, 'project.json');
  await writeTextFile(projectFile, JSON.stringify(project, null, 2));
}

/** Delete an agent project */
export async function deleteProject(id: string): Promise<void> {
  const dir = await getAgentProjectDir(id);
  if (await exists(dir)) {
    await remove(dir, { recursive: true });
  }
}

/** Duplicate an agent project with a new ID */
export async function duplicateProject(id: string): Promise<AgentProject> {
  const original = await loadProject(id);
  const newId = uuid();
  const timestamp = now();

  // Re-map all agent IDs
  const idMap = new Map<string, string>();
  for (const agent of original.agents) {
    idMap.set(agent.id, uuid());
  }

  const newAgents: AgentNodeConfig[] = original.agents.map((agent) => ({
    ...agent,
    id: idMap.get(agent.id) ?? uuid(),
    subAgentIds: agent.subAgentIds.map((subId) => idMap.get(subId) ?? subId),
  }));

  const newProject: AgentProject = {
    ...original,
    id: newId,
    name: `${original.name} (Copy)`,
    rootAgentId: idMap.get(original.rootAgentId) ?? original.rootAgentId,
    agents: newAgents,
    sharedTools: original.sharedTools.map((t) => ({ ...t, id: uuid() })),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await saveProject(newProject);
  return newProject;
}

/* ───── Factory ───── */

/** Create a new empty agent project with a default root LLM agent */
export function createEmptyProject(name: string, description: string): AgentProject {
  const id = uuid();
  const timestamp = now();
  const rootAgent = createLlmAgent(name, uuid());
  return {
    id,
    name,
    description,
    rootAgentId: rootAgent.id,
    agents: [rootAgent],
    sharedTools: [],
    credentialIds: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/* ───── Template ↔ Instruction Bridge ───── */

/** Save an agent's instruction as a template in a collection */
export async function saveInstructionAsTemplate(
  agent: AgentNodeConfig,
  collectionPath: string,
): Promise<TemplateMetadata> {
  const filename = `${agent.name.toLowerCase().replace(/\s+/g, '-')}.agent.md`;
  const content = agent.instruction;
  const name = `${agent.name} Instruction`;

  const template = await storageService.createTemplate(
    collectionPath,
    name,
    'agent-instruction',
    content,
    filename,
  );

  return template;
}

/** Load a template's content to use as an agent instruction */
export async function loadInstructionFromTemplate(
  collectionPath: string,
  meta: TemplateMetadata,
): Promise<string> {
  const template = await storageService.readTemplate(collectionPath, meta);
  return template.content;
}

/* ───── Helpers ───── */

/** Convert a full project to lightweight metadata */
function projectToMeta(project: AgentProject): AgentProjectMeta {
  const models = [...new Set(
    project.agents
      .filter((a) => a.type === 'llm' && a.model)
      .map((a) => a.model),
  )];

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    agentCount: project.agents.length,
    models,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}
