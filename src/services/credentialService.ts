/**
 * Credential service – manages encrypted LLM provider API keys.
 *
 * Credentials are stored in ~/.ai-promptbook/config.json alongside
 * GitHub tokens. Encryption uses the same AES-256-GCM mechanism via
 * the Rust cryptoService backend.
 */

import type { ModelCredential, ModelProvider } from '../domain';
import { uuid, now } from '../domain';
import { loadConfig, saveConfig } from './storageService';
import { encryptToken, decryptToken } from './cryptoService';

/* ───── CRUD ───── */

/** Load all stored model credentials from config */
export async function loadCredentials(): Promise<ModelCredential[]> {
  const config = await loadConfig();
  return (config.modelCredentials as ModelCredential[] | undefined) ?? [];
}

/** Save a new credential (encrypts the API key before storing) */
export async function saveCredential(
  label: string,
  provider: ModelProvider,
  apiKey: string,
): Promise<ModelCredential> {
  const encrypted = await encryptToken(apiKey);
  const credential: ModelCredential = {
    id: uuid(),
    label,
    provider,
    encrypted,
    createdAt: now(),
  };

  const config = await loadConfig();
  const existing = (config.modelCredentials as ModelCredential[] | undefined) ?? [];
  config.modelCredentials = [...existing, credential];
  await saveConfig(config);

  return credential;
}

/** Delete a credential by ID */
export async function deleteCredential(id: string): Promise<void> {
  const config = await loadConfig();
  const existing = (config.modelCredentials as ModelCredential[] | undefined) ?? [];
  config.modelCredentials = existing.filter((c) => c.id !== id);
  await saveConfig(config);
}

/** Decrypt a single credential's encrypted value */
export async function decryptCredential(encrypted: string): Promise<string> {
  return decryptToken(encrypted);
}

/** Resolve all credentials used by a project (returns credentialId → plaintext map) */
export async function resolveProjectCredentials(
  credentialIds: string[],
): Promise<Map<string, string>> {
  const allCreds = await loadCredentials();
  const result = new Map<string, string>();

  for (const id of credentialIds) {
    const cred = allCreds.find((c) => c.id === id);
    if (cred) {
      const plain = await decryptToken(cred.encrypted);
      result.set(id, plain);
    }
  }

  return result;
}

/* ───── Provider Display Helpers ───── */

/** Human-readable labels for providers */
export const PROVIDER_LABELS: Record<ModelProvider, string> = {
  'google-ai-studio': 'Google AI Studio',
  'vertex-ai': 'Vertex AI',
  'anthropic': 'Anthropic',
  'openai': 'OpenAI',
  'ollama': 'Ollama (Local)',
};

/** Accent colors for provider badges */
export const PROVIDER_COLORS: Record<ModelProvider, string> = {
  'google-ai-studio': '#4285f4',
  'vertex-ai': '#34a853',
  'anthropic': '#d97706',
  'openai': '#10b981',
  'ollama': '#8b5cf6',
};
