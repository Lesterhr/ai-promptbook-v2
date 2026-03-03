/**
 * Agent – domain types for the Agent Developer Mode.
 *
 * Covers ADK agent configurations, tool definitions, workflow projects,
 * and credential references. These types map to Google ADK-JS constructs
 * (LlmAgent, SequentialAgent, ParallelAgent, LoopAgent).
 */

/* ───── Agent Type Enum ───── */

/** Supported ADK agent types */
export type AgentType = 'llm' | 'sequential' | 'parallel' | 'loop';

/* ───── Model & Credential Types ───── */

/** Supported LLM providers */
export type ModelProvider =
  | 'google-ai-studio'
  | 'vertex-ai'
  | 'anthropic'
  | 'openai'
  | 'ollama';

/** A model that can be assigned to an LLM agent */
export interface ModelOption {
  /** Unique identifier, e.g. 'gemini-2.5-flash' */
  id: string;
  /** Display label, e.g. 'Gemini 2.5 Flash' */
  label: string;
  /** Provider that serves this model */
  provider: ModelProvider;
  /** Model string passed to ADK, e.g. 'gemini-2.5-flash' */
  modelString: string;
}

/** Encrypted credential stored in config.json */
export interface ModelCredential {
  /** Unique identifier */
  id: string;
  /** User-friendly label, e.g. 'My Gemini Key' */
  label: string;
  /** LLM provider this key belongs to */
  provider: ModelProvider;
  /** AES-256-GCM encrypted API key (base64) */
  encrypted: string;
  /** ISO-8601 creation timestamp */
  createdAt: string;
}

/* ───── Tool Types ───── */

/** Parameter definition for a custom tool function */
export interface ToolParam {
  /** Parameter name */
  name: string;
  /** TypeScript type string, e.g. 'string', 'number', 'boolean' */
  type: string;
  /** Human-readable description */
  description: string;
  /** Whether this parameter is required */
  required: boolean;
  /** Default value expression (optional) */
  defaultValue?: string;
}

/** Tool configuration – either built-in (ADK) or custom function */
export interface AgentToolConfig {
  /** Unique identifier */
  id: string;
  /** Tool name (used as function name in generated code) */
  name: string;
  /** Tool description (used as JSDoc in generated code) */
  description: string;
  /** Function parameters */
  parameters: ToolParam[];
  /** Return type string, e.g. 'Record<string, unknown>' */
  returnType: string;
  /** Function body (TypeScript code) – empty for built-in tools */
  functionBody: string;
  /** Whether this is an ADK built-in tool (e.g. GOOGLE_SEARCH) */
  isBuiltIn: boolean;
}

/* ───── Agent Node Configuration ───── */

/** Configuration for a single agent within a project */
export interface AgentNodeConfig {
  /** Unique identifier */
  id: string;
  /** Agent name (used in code generation) */
  name: string;
  /** Agent description (used for LLM delegation decisions) */
  description: string;
  /** Agent type */
  type: AgentType;
  /** Reference to ModelCredential.id – only for LLM agents */
  modelCredentialId: string;
  /** Model string, e.g. 'gemini-2.5-flash' – only for LLM agents */
  model: string;
  /** Instruction text (can contain {variable} references to state) */
  instruction: string;
  /** Reference to the template this instruction was loaded from */
  instructionSourceTemplateId?: string;
  /** Tools available to this agent – only for LLM agents */
  tools: AgentToolConfig[];
  /** IDs of sub-agents – only for workflow agents */
  subAgentIds: string[];
  /** State key to store the agent's output */
  outputKey?: string;
  /** Whether to include conversation history */
  includeContents?: 'default' | 'none';
  /** LLM temperature (0.0–2.0) */
  temperature?: number;
  /** Maximum output tokens */
  maxOutputTokens?: number;
  /** Maximum loop iterations – only for loop agents */
  maxIterations?: number;
}

/* ───── Agent Project ───── */

/** Full agent project with all agents and configuration */
export interface AgentProject {
  /** Unique identifier */
  id: string;
  /** Project name */
  name: string;
  /** Project description */
  description: string;
  /** ID of the root (entry-point) agent */
  rootAgentId: string;
  /** All agents in this project */
  agents: AgentNodeConfig[];
  /** Shared tools available to all agents */
  sharedTools: AgentToolConfig[];
  /** IDs of credentials used by this project */
  credentialIds: string[];
  /** ISO-8601 creation timestamp */
  createdAt: string;
  /** ISO-8601 last modification timestamp */
  updatedAt: string;
}

/** Lightweight metadata for project list views */
export interface AgentProjectMeta {
  /** Unique identifier */
  id: string;
  /** Project name */
  name: string;
  /** Project description */
  description: string;
  /** Number of agents in the project */
  agentCount: number;
  /** List of model strings used, e.g. ['gemini-2.5-flash', 'gemini-2.5-pro'] */
  models: string[];
  /** ISO-8601 creation timestamp */
  createdAt: string;
  /** ISO-8601 last modification timestamp */
  updatedAt: string;
}

/* ───── Built-in Tool Constants ───── */

/** ADK built-in tool identifiers */
export const BUILTIN_TOOLS: AgentToolConfig[] = [
  {
    id: 'google-search',
    name: 'GOOGLE_SEARCH',
    description: 'Google Search – retrieves real-time web results for a query.',
    parameters: [],
    returnType: 'Record<string, unknown>',
    functionBody: '',
    isBuiltIn: true,
  },
  {
    id: 'code-execution',
    name: 'CODE_EXECUTION',
    description: 'Code Execution – executes Python code in a sandboxed environment.',
    parameters: [],
    returnType: 'Record<string, unknown>',
    functionBody: '',
    isBuiltIn: true,
  },
  {
    id: 'promptbook-lookup',
    name: 'promptbookLookup',
    description: 'Promptbook Lookup – retrieves prompt templates from a local library by name or keyword. Returns the template content as context.',
    parameters: [
      { name: 'query', type: 'string', description: 'Search term or template name to look up', required: true },
    ],
    returnType: 'Record<string, unknown>',
    functionBody: '',
    isBuiltIn: true,
  },
];

/* ───── Available Models ───── */

/** Statically defined list of supported models per provider */
export const AVAILABLE_MODELS: ModelOption[] = [
  // Google AI Studio
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'google-ai-studio', modelString: 'gemini-2.5-flash' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'google-ai-studio', modelString: 'gemini-2.5-pro' },
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', provider: 'google-ai-studio', modelString: 'gemini-2.0-flash' },
  { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite', provider: 'google-ai-studio', modelString: 'gemini-2.0-flash-lite' },
  // Vertex AI (same models, different provider context)
  { id: 'vertex-gemini-2.5-flash', label: 'Gemini 2.5 Flash (Vertex)', provider: 'vertex-ai', modelString: 'gemini-2.5-flash' },
  { id: 'vertex-gemini-2.5-pro', label: 'Gemini 2.5 Pro (Vertex)', provider: 'vertex-ai', modelString: 'gemini-2.5-pro' },
  // Anthropic
  { id: 'claude-sonnet-4', label: 'Claude Sonnet 4', provider: 'anthropic', modelString: 'claude-sonnet-4-20250514' },
  { id: 'claude-haiku-3.5', label: 'Claude 3.5 Haiku', provider: 'anthropic', modelString: 'claude-3-5-haiku-20241022' },
  // OpenAI
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', modelString: 'gpt-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai', modelString: 'gpt-4o-mini' },
  // Ollama (local)
  { id: 'ollama-llama3', label: 'Llama 3 (Ollama)', provider: 'ollama', modelString: 'llama3' },
  { id: 'ollama-mistral', label: 'Mistral (Ollama)', provider: 'ollama', modelString: 'mistral' },
];

/* ───── Factory Helpers ───── */

/** Create a new empty LLM agent config */
export function createLlmAgent(name: string, id: string): AgentNodeConfig {
  return {
    id, name, description: '', type: 'llm',
    modelCredentialId: '', model: 'gemini-2.5-flash',
    instruction: '', tools: [], subAgentIds: [],
    outputKey: '', includeContents: 'default',
    temperature: undefined, maxOutputTokens: undefined,
  };
}

/** Create a new empty workflow agent config */
export function createWorkflowAgent(
  name: string, id: string, type: 'sequential' | 'parallel' | 'loop',
): AgentNodeConfig {
  return {
    id, name, description: '', type,
    modelCredentialId: '', model: '',
    instruction: '', tools: [], subAgentIds: [],
    maxIterations: type === 'loop' ? 5 : undefined,
  };
}
