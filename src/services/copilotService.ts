/**
 * Copilot service – wraps Tauri shell commands that invoke the Copilot CLI.
 *
 * All functions are async, stateless, and export as Named Exports.
 * The service is modelled after `gitService.ts`:
 *   • Uses `Command.create('copilot', args)` from the shell plugin
 *   • Throws on errors so callers can catch + show toasts
 *   • Never stores state – the Zustand store and config.json are the sources of truth
 *
 * The Copilot CLI must be installed separately by the user.
 * When using GitHub Copilot auth the active PAT is passed via
 * the COPILOT_GITHUB_TOKEN environment variable.
 * BYOK mode passes provider flags directly as CLI arguments.
 */

import { Command } from '@tauri-apps/plugin-shell';
import type { CopilotStatus, CopilotConfig, GenerateRequest, GenerateResult, QualityScore } from '../domain';

/* ────────── Helpers ────────── */

/** Build the environment variables for a CLI invocation */
function buildEnv(token: string | null): Record<string, string> {
  const env: Record<string, string> = {};
  if (token) env['COPILOT_GITHUB_TOKEN'] = token;
  return env;
}

/** Build BYOK provider arguments if configured */
function byokArgs(config: CopilotConfig, decryptedApiKey: string | null): string[] {
  if (!config.byok || !decryptedApiKey) return [];
  const args: string[] = [
    '--provider', config.byok.type,
    '--provider-base-url', config.byok.baseUrl,
    '--provider-api-key', decryptedApiKey,
  ];
  return args;
}

/* ────────── CLI Availability ────────── */

/**
 * Check whether the Copilot CLI is available on this machine.
 * Returns status info including version and resolved path.
 */
export async function checkCopilotCli(customPath?: string | null): Promise<CopilotStatus> {
  const cmdName = customPath ?? 'copilot';
  try {
    const cmd = Command.create('copilot', ['--version']);
    const output = await cmd.execute();
    if ((output.code ?? 0) !== 0) {
      return { available: false, version: null, cliPath: null };
    }
    const version = output.stdout.trim().replace(/^copilot\s+/i, '');
    return { available: true, version, cliPath: cmdName };
  } catch {
    return { available: false, version: null, cliPath: null };
  }
}

/* ────────── Content Generation ────────── */

/**
 * Generate content using the Copilot CLI.
 *
 * Sends a system message + user prompt to the CLI and returns the
 * generated text. Uses the model configured in `config` unless
 * overridden in the request.
 *
 * @param request  - system message, prompt, optional model override
 * @param config   - current Copilot configuration (model, BYOK, etc.)
 * @param token    - decrypted GitHub PAT (null when using BYOK)
 * @param decryptedByokKey - decrypted BYOK API key (null when using PAT)
 */
export async function generateContent(
  request: GenerateRequest,
  config: CopilotConfig,
  token: string | null,
  decryptedByokKey: string | null = null,
): Promise<GenerateResult> {
  const model = request.model ?? config.model;

  const args = [
    'chat',
    '--model', model,
    '--system', request.systemMessage,
    '--no-interactive',
    ...byokArgs(config, decryptedByokKey),
    request.prompt,
  ];

  const cmd = Command.create('copilot', args, { env: buildEnv(token) });
  const output = await cmd.execute();

  if ((output.code ?? 0) !== 0) {
    const errMsg = output.stderr.trim() || 'Copilot CLI returned a non-zero exit code';
    throw new Error(errMsg);
  }

  const content = output.stdout.trim();
  if (!content) {
    throw new Error('Copilot CLI returned empty output');
  }

  return { content, model };
}

/* ────────── Quality Scoring ────────── */

/**
 * Analyse a template and return structured quality scores.
 *
 * The CLI is asked to return JSON matching the QualityScore interface.
 * If the response cannot be parsed, the raw text is thrown as an error.
 */
export async function scoreTemplate(
  templateContent: string,
  referenceGuide: string,
  config: CopilotConfig,
  token: string | null,
  decryptedByokKey: string | null = null,
): Promise<QualityScore> {
  const systemMessage = `You are an expert at evaluating AI agent instruction files.
Analyse the template against these quality criteria and reference material.

Reference guide:
${referenceGuide}

Return ONLY valid JSON matching this exact shape (no markdown fences, no extra text):
{
  "overall": <1-10>,
  "completeness": <1-10>,
  "clarity": <1-10>,
  "specificity": <1-10>,
  "bestPractices": <1-10>,
  "structure": <1-10>,
  "suggestions": ["suggestion 1", "suggestion 2", ...]
}`;

  const result = await generateContent(
    { systemMessage, prompt: templateContent },
    config,
    token,
    decryptedByokKey,
  );

  // Try to extract JSON from the response (may contain code fences)
  let jsonStr = result.content;
  const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) jsonStr = fenceMatch[1];

  try {
    return JSON.parse(jsonStr.trim()) as QualityScore;
  } catch {
    throw new Error(`Failed to parse quality score response: ${result.content.slice(0, 200)}`);
  }
}

/* ────────── Model Listing ────────── */

/**
 * List available models from the Copilot CLI.
 * Returns an array of model identifier strings.
 */
export async function listModels(
  _config: CopilotConfig,
  token: string | null,
): Promise<string[]> {
  try {
    const args = ['model', 'list'];
    const cmd = Command.create('copilot', args, { env: buildEnv(token) });
    const output = await cmd.execute();

    if ((output.code ?? 0) !== 0) return [];

    return output.stdout
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('-'));
  } catch {
    return [];
  }
}
