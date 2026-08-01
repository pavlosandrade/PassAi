import { DerivedKeyResult } from '@/types/crypto';

export const DEFAULT_ITERATIONS = 100000;
export const SALT_BYTE_LENGTH = 16; // 128 bits

/**
 * Converte um Uint8Array para uma string em formato Base64.
 */
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return typeof window !== 'undefined' ? btoa(binary) : Buffer.from(bytes).toString('base64');
}

/**
 * Converte uma string Base64 de volta para Uint8Array.
 */
export function base64ToArrayBuffer(base64: string): Uint8Array {
  if (typeof window !== 'undefined') {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  return new Uint8Array(Buffer.from(base64, 'base64'));
}

/**
 * Gera um Salt aleatório em bytes usando window.crypto.getRandomValues.
 */
export function generateSalt(length: number = SALT_BYTE_LENGTH): Uint8Array {
  const salt = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(salt);
  } else {
    // Fallback Node environment (durante SSR/Build)
    require('crypto').randomFillSync(salt);
  }
  return salt;
}

/**
 * Deriva uma CryptoKey AES-GCM (256 bits) a partir de uma senha mestra/PIN usando PBKDF2 + SHA-256.
 *
 * @param password A senha mestra ou PIN em texto plano
 * @param existingSaltBase64 Salt existente em Base64 (se omitido, um novo será gerado)
 * @param iterations Número de iterações do PBKDF2 (padrão: 100.000)
 */
export async function deriveKeyFromPassword(
  password: string,
  existingSaltBase64?: string,
  iterations: number = DEFAULT_ITERATIONS
): Promise<DerivedKeyResult> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);

  const saltBytes = existingSaltBase64
    ? base64ToArrayBuffer(existingSaltBase64)
    : generateSalt();

  const saltBase64 = existingSaltBase64 || arrayBufferToBase64(saltBytes);

  // Importa a senha crua como chave base PBKDF2
  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBytes as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Deriva a chave simétrica AES-GCM de 256 bits
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false, // Não exportável por motivos de segurança
    ['encrypt', 'decrypt']
  );

  return {
    key: derivedKey,
    salt: saltBase64,
  };
}
