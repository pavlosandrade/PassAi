/**
 * Representa os parâmetros utilizados na derivação de chave via PBKDF2.
 */
export interface PBKDF2Params {
  salt: string; // Base64
  iterations: number;
}

/**
 * Payload completo criptografado com AES-GCM 256-bit.
 */
export interface EncryptedPayload {
  salt: string;       // Base64
  iv: string;         // Base64 (Vetor de Inicialização de 96 bits)
  ciphertext: string; // Base64
}

/**
 * Resultado da criação ou validação de uma chave criptográfica derivada.
 */
export interface DerivedKeyResult {
  key: CryptoKey;
  salt: string; // Base64
}
