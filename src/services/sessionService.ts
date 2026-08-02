/**
 * sessionService.ts
 *
 * Persiste a sessão ativa do usuário no sessionStorage com Criptografia de Sessão (AES-256-GCM).
 * - A senha mestra NUNCA é gravada em texto plano no sessionStorage.
 * - É utilizada uma chave efêmera de sessão com IV aleatório por gravação.
 * - Sobrevive a recargas de página (F5) na mesma aba.
 * - É limpo automaticamente ao fechar a aba/janela ou fazer logout.
 */

const SESSION_EMAIL_KEY = 'passai_session_email';
const SESSION_VAULT_KEY = 'passai_session_vault';
const SESSION_SEC_KEY = 'passai_session_sec';
const LEGACY_PASSWORD_KEY = 'passai_session_password';

// Helper para conversão de ArrayBuffer / Uint8Array <-> Hex
function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Gera ou recupera a chave criptográfica efêmera de sessão do sessionStorage.
 */
async function getOrCreateSessionKey(): Promise<CryptoKey> {
  let rawKeyHex = sessionStorage.getItem(SESSION_SEC_KEY);

  if (!rawKeyHex) {
    const rawKey = window.crypto.getRandomValues(new Uint8Array(32));
    rawKeyHex = bufferToHex(rawKey);
    sessionStorage.setItem(SESSION_SEC_KEY, rawKeyHex);
  }

  const rawKeyBytes = hexToBuffer(rawKeyHex);

  return window.crypto.subtle.importKey(
    'raw',
    rawKeyBytes.buffer as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Salva a sessão ativa de forma criptografada (AES-256-GCM) no sessionStorage.
 */
export async function saveSession(email: string, masterPassword: string): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const sessionKey = await getOrCreateSessionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(masterPassword);

    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      sessionKey,
      dataBytes
    );

    const payload = JSON.stringify({
      iv: bufferToHex(iv),
      cipher: bufferToHex(cipherBuffer),
    });

    sessionStorage.setItem(SESSION_EMAIL_KEY, email);
    sessionStorage.setItem(SESSION_VAULT_KEY, payload);

    // Garante remoção de chave legado em texto plano caso exista
    sessionStorage.removeItem(LEGACY_PASSWORD_KEY);
  } catch (err) {
    console.warn('Erro ao salvar sessão criptografada:', err);
  }
}

/**
 * Recupera e descriptografa a sessão ativa (se existir).
 */
export async function loadSession(): Promise<{ email: string; masterPassword: string } | null> {
  if (typeof window === 'undefined') return null;

  const email = sessionStorage.getItem(SESSION_EMAIL_KEY);
  const vaultPayload = sessionStorage.getItem(SESSION_VAULT_KEY);
  const legacyPassword = sessionStorage.getItem(LEGACY_PASSWORD_KEY);

  // Fallback / Migração automática se existir sessão legado em texto plano
  if (email && legacyPassword && !vaultPayload) {
    const masterPassword = legacyPassword;
    await saveSession(email, masterPassword);
    sessionStorage.removeItem(LEGACY_PASSWORD_KEY);
    return { email, masterPassword };
  }

  if (!email || !vaultPayload) return null;

  try {
    const sessionKey = await getOrCreateSessionKey();
    const { iv: ivHex, cipher: cipherHex } = JSON.parse(vaultPayload);

    if (!ivHex || !cipherHex) return null;

    const iv = hexToBuffer(ivHex);
    const cipherBuffer = hexToBuffer(cipherHex);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
      sessionKey,
      cipherBuffer.buffer as ArrayBuffer
    );

    const decoder = new TextDecoder();
    const masterPassword = decoder.decode(decryptedBuffer);

    return { email, masterPassword };
  } catch (err) {
    console.warn('Falha ao restaurar sessão criptografada (sessão inválida/expirada):', err);
    clearSession();
    return null;
  }
}

/**
 * Remove a sessão completamente (logout / trancamento).
 */
export function clearSession(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_EMAIL_KEY);
  sessionStorage.removeItem(SESSION_VAULT_KEY);
  sessionStorage.removeItem(SESSION_SEC_KEY);
  sessionStorage.removeItem(LEGACY_PASSWORD_KEY);
}
