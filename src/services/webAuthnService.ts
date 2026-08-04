import { arrayBufferToBase64, base64ToArrayBuffer } from '@/crypto/pbkdf2';

const WEBAUTHN_CREDENTIAL_KEY_PREFIX = 'passai_webauthn_cred_';
const WEBAUTHN_SECRET_KEY_PREFIX = 'passai_webauthn_secret_';

/**
 * Verifica se o navegador e o aparelho possuem suporte a WebAuthn / Passkeys / Biometria.
 */
export function isWebAuthnSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  );
}

/**
 * Verifica se o usuário atual já possui o desbloqueio biométrico cadastrado neste aparelho.
 */
export function isBiometricVaultAvailable(email: string): boolean {
  if (typeof window === 'undefined') return false;
  const credId = localStorage.getItem(`${WEBAUTHN_CREDENTIAL_KEY_PREFIX}${email.toLowerCase().trim()}`);
  return !!credId;
}

/**
 * Registra as credenciais biométricas (Windows Hello, TouchID, FaceID, PIN) para trancar/destrancar a Senha Mestra.
 */
export async function registerBiometricVault(email: string, masterPasswordText: string): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    throw new Error('Biometria ou Passkey não são suportadas neste navegador/dispositivo.');
  }

  const cleanEmail = email.toLowerCase().trim();
  const challenge = window.crypto.getRandomValues(new Uint8Array(32));
  const userId = new TextEncoder().encode(cleanEmail);

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'PassAi Password Manager',
      id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
    },
    user: {
      id: userId,
      name: cleanEmail,
      displayName: cleanEmail,
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' }, // ES256
      { alg: -257, type: 'public-key' }, // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
    },
    timeout: 60000,
  };

  try {
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Cadastro biométrico cancelado.');
    }

    // Salva o ID da credencial biométrica
    const credIdBase64 = arrayBufferToBase64(credential.rawId);
    localStorage.setItem(`${WEBAUTHN_CREDENTIAL_KEY_PREFIX}${cleanEmail}`, credIdBase64);

    // Criptografa a Senha Mestra localmente com uma chave local derivada do ID da credencial
    const encSecret = await encryptMasterPasswordForBiometrics(masterPasswordText, credential.rawId);
    localStorage.setItem(`${WEBAUTHN_SECRET_KEY_PREFIX}${cleanEmail}`, JSON.stringify(encSecret));

    return true;
  } catch (err: any) {
    console.error('Erro ao registrar biometria:', err);
    throw new Error(err.message || 'Falha ao registrar biometria no dispositivo.');
  }
}

/**
 * Destranca a Senha Mestra utilizando a Biometria / Passkey do dispositivo.
 */
export async function unlockVaultWithBiometrics(email: string): Promise<string> {
  if (!isWebAuthnSupported()) {
    throw new Error('Biometria não suportada neste aparelho.');
  }

  const cleanEmail = email.toLowerCase().trim();
  const credIdBase64 = localStorage.getItem(`${WEBAUTHN_CREDENTIAL_KEY_PREFIX}${cleanEmail}`);
  const encSecretStr = localStorage.getItem(`${WEBAUTHN_SECRET_KEY_PREFIX}${cleanEmail}`);

  if (!credIdBase64 || !encSecretStr) {
    throw new Error('Nenhuma biometria cadastrada para esta conta neste aparelho.');
  }

  const rawCredId = base64ToArrayBuffer(credIdBase64);
  const challenge = window.crypto.getRandomValues(new Uint8Array(32));

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    allowCredentials: [
      {
        id: rawCredId as unknown as BufferSource,
        type: 'public-key',
      },
    ],
    userVerification: 'required',
    timeout: 60000,
  };

  try {
    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential;

    if (!assertion) {
      throw new Error('Autenticação biométrica cancelada.');
    }

    const encSecret = JSON.parse(encSecretStr);
    const masterPasswordText = await decryptMasterPasswordForBiometrics(encSecret, assertion.rawId);

    return masterPasswordText;
  } catch (err: any) {
    console.error('Erro ao autenticar com biometria:', err);
    throw new Error(err.message || 'Autenticação biométrica falhou ou foi cancelada.');
  }
}

/**
 * Remove os dados biométricos cadastrados para a conta neste aparelho.
 */
export function removeBiometricVault(email: string): void {
  if (typeof window === 'undefined') return;
  const cleanEmail = email.toLowerCase().trim();
  localStorage.removeItem(`${WEBAUTHN_CREDENTIAL_KEY_PREFIX}${cleanEmail}`);
  localStorage.removeItem(`${WEBAUTHN_SECRET_KEY_PREFIX}${cleanEmail}`);
}

// --- UTILS INTERNOS DE CRIPTOGRAFIA DA BIOMETRIA ---

async function deriveBiometricKey(rawCredId: ArrayBuffer): Promise<CryptoKey> {
  const hash = await window.crypto.subtle.digest('SHA-256', rawCredId);
  return window.crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptMasterPasswordForBiometrics(password: string, rawCredId: ArrayBuffer) {
  const key = await deriveBiometricKey(rawCredId);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedPassword = new TextEncoder().encode(password);

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    encodedPassword as unknown as BufferSource
  );

  return {
    iv: arrayBufferToBase64(iv.buffer),
    ciphertext: arrayBufferToBase64(ciphertextBuffer),
  };
}

async function decryptMasterPasswordForBiometrics(encSecret: { iv: string; ciphertext: string }, rawCredId: ArrayBuffer): Promise<string> {
  const key = await deriveBiometricKey(rawCredId);
  const iv = base64ToArrayBuffer(encSecret.iv);
  const ciphertext = base64ToArrayBuffer(encSecret.ciphertext);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    key,
    ciphertext as unknown as BufferSource
  );

  return new TextDecoder().decode(decryptedBuffer);
}
