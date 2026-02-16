use aes_gcm::{
    aead::{Aead, KeyInit, OsRng},
    Aes256Gcm, Nonce,
};
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use pbkdf2::pbkdf2_hmac;
use rand::RngCore;
use sha2::Sha256;

/// Derive a 256-bit key from a machine-specific secret.
/// The key is unique per machine so encrypted tokens cannot be
/// decrypted on a different computer.
fn derive_key() -> [u8; 32] {
    let machine_id = machine_uid::get().unwrap_or_else(|_| "fallback-id".into());
    let salt = format!("ai-promptbook::{}", machine_id);
    let mut key = [0u8; 32];
    pbkdf2_hmac::<Sha256>(salt.as_bytes(), b"promptbook-salt-v1", 100_000, &mut key);
    key
}

/// Encrypt a plaintext string → base64 (nonce‖ciphertext).
#[tauri::command]
fn encrypt_token(plaintext: String) -> Result<String, String> {
    let key = derive_key();
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())?;

    let mut nonce_bytes = [0u8; 12];
    OsRng.fill_bytes(&mut nonce_bytes);
    let nonce = Nonce::from_slice(&nonce_bytes);

    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| e.to_string())?;

    // Prepend 12-byte nonce to ciphertext
    let mut combined = nonce_bytes.to_vec();
    combined.extend_from_slice(&ciphertext);
    Ok(B64.encode(combined))
}

/// Decrypt a base64 blob (nonce‖ciphertext) → plaintext.
#[tauri::command]
fn decrypt_token(encrypted: String) -> Result<String, String> {
    let key = derive_key();
    let cipher = Aes256Gcm::new_from_slice(&key).map_err(|e| e.to_string())?;

    let combined = B64.decode(&encrypted).map_err(|e| e.to_string())?;
    if combined.len() < 13 {
        return Err("Invalid encrypted data".into());
    }

    let (nonce_bytes, ciphertext) = combined.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);

    let plaintext = cipher
        .decrypt(nonce, ciphertext)
        .map_err(|_| "Decryption failed – token may be corrupted or from another machine".to_string())?;

    String::from_utf8(plaintext).map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![encrypt_token, decrypt_token])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
