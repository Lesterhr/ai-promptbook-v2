/**
 * Crypto service – encrypt / decrypt GitHub tokens via the Tauri Rust backend.
 *
 * Tokens are encrypted with AES-256-GCM using a key derived from the
 * machine's unique ID.  This means:
 *  • The encrypted blob stored in config.json is useless on another computer.
 *  • Only this app can decrypt the tokens (the key derivation is internal).
 */

import { invoke } from '@tauri-apps/api/core';

/** Encrypt a plaintext token → base64 blob */
export async function encryptToken(plaintext: string): Promise<string> {
  return invoke<string>('encrypt_token', { plaintext });
}

/** Decrypt a base64 blob → plaintext token */
export async function decryptToken(encrypted: string): Promise<string> {
  return invoke<string>('decrypt_token', { encrypted });
}
