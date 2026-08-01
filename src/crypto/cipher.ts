import { EncryptedPayload } from '@/types/crypto';
import { arrayBufferToBase64, base64ToArrayBuffer } from './pbkdf2';

export const IV_BYTE_LENGTH = 12; // 96 bits recomendado para AES-GCM

/**
 * Gera um Vetor de Inicialização (IV) aleatório de 96 bits.
 */
export function generateIV(length: number = IV_BYTE_LENGTH): Uint8Array {
  const iv = new Uint8Array(length);
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(iv);
  } else {
    require('crypto').randomFillSync(iv);
  }
  return iv;
}

/**
 * Encripta qualquer objeto ou string serializável com AES-GCM (256 bits).
 *
 * @param data O objeto/string a ser encriptado
 * @param key A CryptoKey derivada (AES-GCM)
 * @param saltBase64 O salt associado em formato Base64
 */
export async function encryptData<T>(
  data: T,
  key: CryptoKey,
  saltBase64: string
): Promise<EncryptedPayload> {
  const encoder = new TextEncoder();
  const jsonString = JSON.stringify(data);
  const dataBytes = encoder.encode(jsonString);

  const ivBytes = generateIV();
  const ivBase64 = arrayBufferToBase64(ivBytes);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes as unknown as BufferSource,
    },
    key,
    dataBytes as unknown as BufferSource
  );

  const ciphertextBase64 = arrayBufferToBase64(ciphertextBuffer);

  return {
    salt: saltBase64,
    iv: ivBase64,
    ciphertext: ciphertextBase64,
  };
}

/**
 * Decripta um payload AES-GCM e retorna o objeto tipado.
 *
 * @param encryptedPayload Objeto contendo iv, salt e ciphertext em Base64
 * @param key A CryptoKey derivada correspondente
 * @throws Error se a chave for inválida ou os dados estiverem corrompidos
 */
export async function decryptData<T>(
  encryptedPayload: EncryptedPayload,
  key: CryptoKey
): Promise<T> {
  const ivBytes = base64ToArrayBuffer(encryptedPayload.iv);
  const ciphertextBytes = base64ToArrayBuffer(encryptedPayload.ciphertext);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: ivBytes as unknown as BufferSource,
    },
    key,
    ciphertextBytes as unknown as BufferSource
  );

  const decoder = new TextDecoder();
  const jsonString = decoder.decode(decryptedBuffer);

  return JSON.parse(jsonString) as T;
}
