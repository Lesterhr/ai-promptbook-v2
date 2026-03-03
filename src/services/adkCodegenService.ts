/**
 * ADK Code Generation Service – generates TypeScript project files
 * for Google ADK-JS from an AgentProject configuration.
 *
 * Output is a complete, VS-Code-ready project structure that can be
 * executed with `npx @google/adk web`.
 */

import {
  exists,
  mkdir,
  writeTextFile,
} from '@tauri-apps/plugin-fs';
import { join } from '@tauri-apps/api/path';
import type { AgentProject, AgentNodeConfig, AgentToolConfig, ModelCredential } from '../domain';
import { AVAILABLE_MODELS } from '../domain';

/* ───── Code Generation ───── */

/** Generate the main agent.ts file */
export function generateAgentTs(project: AgentProject): string {
  const lines: string[] = [];

  // Imports
  lines.push("import 'dotenv/config';");

  const agentTypes = new Set(project.agents.map((a) => a.type));
  const adkImports: string[] = [];
  if (agentTypes.has('llm')) adkImports.push('LlmAgent');
  if (agentTypes.has('sequential')) adkImports.push('SequentialAgent');
  if (agentTypes.has('parallel')) adkImports.push('ParallelAgent');
  if (agentTypes.has('loop')) adkImports.push('LoopAgent');

  // Check for built-in tools
  const builtInTools = new Set<string>();
  let hasPromptbookLookup = false;
  for (const agent of project.agents) {
    for (const tool of agent.tools) {
      if (tool.isBuiltIn) {
        if (tool.name === 'promptbookLookup') {
          hasPromptbookLookup = true;
        } else {
          builtInTools.add(tool.name);
        }
      }
    }
  }
  for (const tool of project.sharedTools) {
    if (tool.isBuiltIn) builtInTools.add(tool.name);
  }

  const allImports = [...adkImports, ...builtInTools];
  if (allImports.length > 0) {
    lines.push(`import { ${allImports.join(', ')} } from '@google/adk';`);
  }

  lines.push('');

  // Promptbook Lookup tool (file-based template retrieval)
  if (hasPromptbookLookup) {
    lines.push("import * as fs from 'node:fs';");
    lines.push("import * as path from 'node:path';");
    lines.push('');
    lines.push('/**');
    lines.push(' * Promptbook Lookup – retrieves prompt templates from a local templates/ directory.');
    lines.push(' * Place .md or .txt files in a templates/ folder next to this file.');
    lines.push(' * The agent can call this tool to retrieve instructions/prompts by keyword.');
    lines.push(' */');
    lines.push('function promptbookLookup(query: string): Record<string, unknown> {');
    lines.push("  const templatesDir = path.join(import.meta.dirname, 'templates');");
    lines.push('  if (!fs.existsSync(templatesDir)) {');
    lines.push("    return { status: 'error', message: 'No templates/ directory found. Create one and add .md or .txt files.' };");
    lines.push('  }');
    lines.push('  const files = fs.readdirSync(templatesDir).filter((f: string) => /\\.(md|txt)$/i.test(f));');
    lines.push('  const q = query.toLowerCase();');
    lines.push('  const matches = files.filter((f: string) => f.toLowerCase().includes(q));');
    lines.push('  if (matches.length === 0) {');
    lines.push("    return { status: 'not_found', query, available: files };");
    lines.push('  }');
    lines.push('  const results = matches.map((f: string) => ({');
    lines.push('    name: f,');
    lines.push("    content: fs.readFileSync(path.join(templatesDir, f), 'utf-8'),");
    lines.push('  }));');
    lines.push("  return { status: 'found', count: results.length, templates: results };");
    lines.push('}');
    lines.push('');
  }

  // Custom tool functions
  const customTools = [
    ...project.sharedTools.filter((t) => !t.isBuiltIn),
    ...project.agents.flatMap((a) => a.tools.filter((t) => !t.isBuiltIn)),
  ];

  // Deduplicate by name
  const seenTools = new Set<string>();
  for (const tool of customTools) {
    if (seenTools.has(tool.name)) continue;
    seenTools.add(tool.name);
    lines.push(generateToolFunction(tool));
    lines.push('');
  }

  // Agent definitions (topological order: leaf agents first, root last)
  const ordered = topologicalSort(project.agents, project.rootAgentId);
  for (const agent of ordered) {
    lines.push(generateAgentDefinition(agent, project));
    lines.push('');
  }

  // Export root agent
  const rootAgent = project.agents.find((a) => a.id === project.rootAgentId);
  if (rootAgent) {
    const varName = toVariableName(rootAgent.name);
    lines.push(`export { ${varName} };`);
  }

  return lines.join('\n');
}

/** Generate the .env file with decrypted API keys */
export function generateEnvFile(
  project: AgentProject,
  credentials: ModelCredential[],
  decryptedKeys: Map<string, string>,
): string {
  const lines: string[] = [];

  // Determine primary provider from first LLM agent
  const firstLlm = project.agents.find((a) => a.type === 'llm' && a.modelCredentialId);
  const primaryCredId = firstLlm?.modelCredentialId;
  const primaryCred = primaryCredId ? credentials.find((c) => c.id === primaryCredId) : undefined;

  if (primaryCred) {
    const isVertex = primaryCred.provider === 'vertex-ai';
    lines.push(`GOOGLE_GENAI_USE_VERTEXAI=${isVertex ? 'TRUE' : 'FALSE'}`);

    const apiKey = decryptedKeys.get(primaryCred.id) ?? 'YOUR_API_KEY_HERE';
    if (isVertex) {
      lines.push(`GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID`);
      lines.push(`GOOGLE_CLOUD_LOCATION=us-central1`);
    } else {
      lines.push(`GOOGLE_GENAI_API_KEY=${apiKey}`);
    }
  } else {
    lines.push('GOOGLE_GENAI_USE_VERTEXAI=FALSE');
    lines.push('GOOGLE_GENAI_API_KEY=YOUR_API_KEY_HERE');
  }

  // Additional provider keys
  for (const [credId, key] of decryptedKeys) {
    const cred = credentials.find((c) => c.id === credId);
    if (!cred || cred.id === primaryCred?.id) continue;

    if (cred.provider === 'anthropic') {
      lines.push(`ANTHROPIC_API_KEY=${key}`);
    } else if (cred.provider === 'openai') {
      lines.push(`OPENAI_API_KEY=${key}`);
    }
  }

  return lines.join('\n');
}

/** Generate .env.example with placeholder values */
export function generateEnvExample(project: AgentProject, credentials: ModelCredential[]): string {
  const lines: string[] = [];
  const providers = new Set<string>();

  for (const agent of project.agents) {
    if (agent.modelCredentialId) {
      const cred = credentials.find((c) => c.id === agent.modelCredentialId);
      if (cred) providers.add(cred.provider);
    }
  }

  lines.push('# Copy this file to .env and fill in your API keys');
  lines.push('GOOGLE_GENAI_USE_VERTEXAI=FALSE');
  lines.push('GOOGLE_GENAI_API_KEY=YOUR_API_KEY_HERE');

  if (providers.has('anthropic')) {
    lines.push('ANTHROPIC_API_KEY=YOUR_ANTHROPIC_KEY_HERE');
  }
  if (providers.has('openai')) {
    lines.push('OPENAI_API_KEY=YOUR_OPENAI_KEY_HERE');
  }

  return lines.join('\n');
}

/** Generate package.json */
export function generatePackageJson(projectName: string): string {
  const pkg = {
    name: projectName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    version: '1.0.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'npx @google/adk web',
      start: 'npx @google/adk web',
    },
    dependencies: {
      '@google/adk': '^0.4.0',
      'dotenv': '^16.4.0',
    },
  };
  return JSON.stringify(pkg, null, 2);
}

/** Generate tsconfig.json */
export function generateTsConfig(): string {
  const config = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      declaration: true,
      outDir: './dist',
    },
    include: ['*.ts'],
  };
  return JSON.stringify(config, null, 2);
}

/** Generate README.md */
export function generateReadme(project: AgentProject): string {
  const lines: string[] = [];
  lines.push(`# ${project.name}`);
  lines.push('');
  if (project.description) {
    lines.push(project.description);
    lines.push('');
  }
  lines.push('## Agents');
  lines.push('');

  for (const agent of project.agents) {
    const typeLabel = agent.type.charAt(0).toUpperCase() + agent.type.slice(1);
    const modelInfo = agent.model ? ` (${agent.model})` : '';
    lines.push(`- **${agent.name}** – ${typeLabel} Agent${modelInfo}`);
    if (agent.description) lines.push(`  ${agent.description}`);
  }

  lines.push('');
  lines.push('## Models Used');
  lines.push('');
  const models = [...new Set(project.agents.filter((a) => a.model).map((a) => a.model))];
  for (const model of models) {
    const info = AVAILABLE_MODELS.find((m) => m.modelString === model);
    lines.push(`- ${info?.label ?? model}`);
  }

  lines.push('');
  lines.push('## Getting Started');
  lines.push('');
  lines.push('```bash');
  lines.push('# Install dependencies');
  lines.push('npm install');
  lines.push('');
  lines.push('# Copy .env.example to .env and fill in your API keys');
  lines.push('cp .env.example .env');
  lines.push('');
  lines.push('# Start the ADK development server');
  lines.push('npx @google/adk web');
  lines.push('```');
  lines.push('');
  lines.push('Then open http://localhost:8000 in your browser.');
  lines.push('');
  lines.push('## Built with');
  lines.push('');
  lines.push('- [Google Agent Development Kit (ADK)](https://google.github.io/adk-docs/)');
  lines.push('- [AI Promptbook](https://github.com/your-repo) – Agent Developer Mode');
  lines.push('');

  return lines.join('\n');
}

/** Generate .gitignore */
export function generateGitignore(): string {
  return [
    'node_modules/',
    'dist/',
    '.env',
    '*.js',
    '*.d.ts',
    '*.js.map',
    '',
  ].join('\n');
}

/** Generate .vscode/settings.json */
export function generateVsCodeSettings(): string {
  return JSON.stringify({
    'typescript.tsdk': 'node_modules/typescript/lib',
    'editor.formatOnSave': true,
    'editor.defaultFormatter': 'esbenp.prettier-vscode',
  }, null, 2);
}

/* ───── Export to Directory ───── */

/** Write all generated files to a target directory */
export async function exportToDirectory(
  project: AgentProject,
  targetPath: string,
  credentials: ModelCredential[],
  decryptedKeys: Map<string, string>,
): Promise<void> {
  // Ensure target exists
  if (!(await exists(targetPath))) await mkdir(targetPath, { recursive: true });

  // Write all files
  await writeTextFile(await join(targetPath, 'agent.ts'), generateAgentTs(project));
  await writeTextFile(await join(targetPath, '.env'), generateEnvFile(project, credentials, decryptedKeys));
  await writeTextFile(await join(targetPath, '.env.example'), generateEnvExample(project, credentials));
  await writeTextFile(await join(targetPath, 'package.json'), generatePackageJson(project.name));
  await writeTextFile(await join(targetPath, 'tsconfig.json'), generateTsConfig());
  await writeTextFile(await join(targetPath, 'README.md'), generateReadme(project));
  await writeTextFile(await join(targetPath, '.gitignore'), generateGitignore());

  // .vscode directory
  const vscodePath = await join(targetPath, '.vscode');
  if (!(await exists(vscodePath))) await mkdir(vscodePath, { recursive: true });
  await writeTextFile(await join(vscodePath, 'settings.json'), generateVsCodeSettings());

  // templates/ directory (for promptbookLookup tool)
  const hasLookupTool = project.agents.some((a) => a.tools.some((t) => t.name === 'promptbookLookup'));
  if (hasLookupTool) {
    const templatesPath = await join(targetPath, 'templates');
    if (!(await exists(templatesPath))) await mkdir(templatesPath, { recursive: true });
    await writeTextFile(
      await join(templatesPath, 'README.md'),
      [
        '# Promptbook Templates',
        '',
        'Place your `.md` or `.txt` prompt template files in this directory.',
        'The `promptbookLookup` tool will search these files by name/keyword.',
        '',
        'Example: `research-instructions.md`, `code-review-checklist.txt`',
      ].join('\n'),
    );
  }
}

/* ───── Internal Helpers ───── */

/** Generate a TypeScript function for a custom tool */
function generateToolFunction(tool: AgentToolConfig): string {
  const params = tool.parameters
    .map((p) => {
      const opt = p.required ? '' : '?';
      return `${p.name}${opt}: ${p.type}`;
    })
    .join(', ');

  const paramDocs = tool.parameters
    .map((p) => ` *   ${p.name} - ${p.description}`)
    .join('\n');

  const lines: string[] = [];
  lines.push('/**');
  lines.push(` * ${tool.description}`);
  if (paramDocs) {
    lines.push(' *');
    lines.push(paramDocs);
  }
  lines.push(' */');
  lines.push(`function ${tool.name}(${params}): ${tool.returnType} {`);

  if (tool.functionBody.trim()) {
    for (const line of tool.functionBody.split('\n')) {
      lines.push(`  ${line}`);
    }
  } else {
    lines.push(`  return { status: 'success', result: 'Not implemented' };`);
  }

  lines.push('}');
  return lines.join('\n');
}

/** Generate an agent definition (const declaration) */
function generateAgentDefinition(agent: AgentNodeConfig, project: AgentProject): string {
  const varName = toVariableName(agent.name);

  if (agent.type === 'llm') {
    return generateLlmAgent(agent, varName);
  }
  return generateWorkflowAgent(agent, varName, project);
}

/** Generate an LlmAgent definition */
function generateLlmAgent(agent: AgentNodeConfig, varName: string): string {
  const lines: string[] = [];
  lines.push(`const ${varName} = new LlmAgent({`);
  lines.push(`  name: '${escapeSingleQuote(agent.name)}',`);
  lines.push(`  model: '${escapeSingleQuote(agent.model)}',`);

  if (agent.description) {
    lines.push(`  description: '${escapeSingleQuote(agent.description)}',`);
  }

  // Instruction — use template literal for multiline
  if (agent.instruction) {
    const escaped = agent.instruction.replace(/`/g, '\\`').replace(/\${/g, '\\${');
    lines.push(`  instruction: \`${escaped}\`,`);
  }

  // Tools
  const toolNames = agent.tools.map((t) => t.name);
  if (toolNames.length > 0) {
    lines.push(`  tools: [${toolNames.join(', ')}],`);
  }

  // Sub-agents (LLM agents can also have sub-agents for delegation)
  if (agent.subAgentIds.length > 0) {
    const subVars = agent.subAgentIds
      .map((id) => toVariableName(findAgentName(id, [agent]) || id))
      .join(', ');
    lines.push(`  subAgents: [${subVars}],`);
  }

  if (agent.outputKey) {
    lines.push(`  outputKey: '${escapeSingleQuote(agent.outputKey)}',`);
  }

  if (agent.includeContents === 'none') {
    lines.push(`  includeContents: 'none',`);
  }

  if (agent.temperature !== undefined && agent.temperature !== null) {
    lines.push(`  generateContentConfig: { temperature: ${agent.temperature} },`);
  }

  lines.push('});');
  return lines.join('\n');
}

/** Generate a workflow agent definition */
function generateWorkflowAgent(
  agent: AgentNodeConfig,
  varName: string,
  project: AgentProject,
): string {
  const typeMap: Record<string, string> = {
    sequential: 'SequentialAgent',
    parallel: 'ParallelAgent',
    loop: 'LoopAgent',
  };
  const className = typeMap[agent.type] ?? 'SequentialAgent';

  const subVars = agent.subAgentIds
    .map((id) => {
      const sub = project.agents.find((a) => a.id === id);
      return sub ? toVariableName(sub.name) : id;
    })
    .join(', ');

  const lines: string[] = [];
  lines.push(`const ${varName} = new ${className}({`);
  lines.push(`  name: '${escapeSingleQuote(agent.name)}',`);

  if (agent.description) {
    lines.push(`  description: '${escapeSingleQuote(agent.description)}',`);
  }

  lines.push(`  subAgents: [${subVars}],`);

  if (agent.type === 'loop' && agent.maxIterations) {
    lines.push(`  maxIterations: ${agent.maxIterations},`);
  }

  lines.push('});');
  return lines.join('\n');
}

/** Convert an agent name to a valid JS variable name (camelCase) */
function toVariableName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .map((word, i) =>
      i === 0
        ? word.charAt(0).toLowerCase() + word.slice(1)
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join('');
}

/** Escape single quotes in strings */
function escapeSingleQuote(str: string): string {
  return str.replace(/'/g, "\\'");
}

/** Find an agent name by ID (for sub-agent references) */
function findAgentName(id: string, agents: AgentNodeConfig[]): string | undefined {
  return agents.find((a) => a.id === id)?.name;
}

/** Topological sort: leaf agents first, root agent last */
function topologicalSort(
  agents: AgentNodeConfig[],
  rootId: string,
): AgentNodeConfig[] {
  const visited = new Set<string>();
  const result: AgentNodeConfig[] = [];
  const agentMap = new Map(agents.map((a) => [a.id, a]));

  function visit(id: string) {
    if (visited.has(id)) return;
    visited.add(id);
    const agent = agentMap.get(id);
    if (!agent) return;

    for (const subId of agent.subAgentIds) {
      visit(subId);
    }
    result.push(agent);
  }

  // Start from root if it exists, then add any remaining unvisited agents
  if (rootId) visit(rootId);
  for (const agent of agents) {
    if (!visited.has(agent.id)) {
      visit(agent.id);
    }
  }

  return result;
}
