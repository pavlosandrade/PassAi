import { EncryptedPayload } from '@/types/crypto';

const DRIVE_FILE_NAME = 'passai_vault.enc.json';
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile';
const TOKEN_KEY = 'passai_gdrive_token';
const CLIENT_ID_KEY = 'passai_gdrive_client_id';

// ID de Cliente padrão (configurável pelo usuário nas configurações se desejar)
const DEFAULT_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

declare global {
  interface Window {
    google?: any;
  }
}

/**
 * Carrega dinamicamente a biblioteca do Google Identity Services (GIS).
 */
export function loadGisScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Execução apenas no navegador.'));
      return;
    }

    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existingScript = document.getElementById('google-gis-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Falha ao carregar Google Script.')));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gis-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Falha ao carregar Google Identity Services.'));
    document.head.appendChild(script);
  });
}

/**
 * Obtém o Client ID configurado (local ou variável de ambiente).
 */
export function getSavedClientId(): string {
  if (typeof window === 'undefined') return DEFAULT_CLIENT_ID;
  return localStorage.getItem(CLIENT_ID_KEY) || DEFAULT_CLIENT_ID;
}

/**
 * Salva um Client ID personalizado.
 */
export function saveClientId(clientId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CLIENT_ID_KEY, clientId.trim());
}

/**
 * Obtém o token de acesso salvo da sessão.
 */
export function getStoredDriveToken(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

/**
 * Salva o token de acesso na sessão.
 */
export function setStoredDriveToken(token: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(TOKEN_KEY, token);
}

/**
 * Limpa o token do Google Drive.
 */
export function disconnectGoogleDrive(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TOKEN_KEY);
}

/**
 * Solicita autenticação OAuth2 ao usuário via Popup nativo do Google.
 */
export async function authenticateGoogleDrive(customClientId?: string): Promise<string> {
  await loadGisScript();

  const clientId = customClientId || getSavedClientId();
  if (!clientId) {
    throw new Error('Google Client ID não configurado. Por favor, insira o seu Google Client ID nas configurações de sincronização.');
  }

  return new Promise((resolve, reject) => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: (response: any) => {
          if (response.error) {
            reject(new Error(response.error_description || response.error));
            return;
          }
          if (response.access_token) {
            setStoredDriveToken(response.access_token);
            resolve(response.access_token);
          } else {
            reject(new Error('Nenhum token de acesso retornado pelo Google.'));
          }
        },
      });

      client.requestAccessToken({ prompt: 'consent' });
    } catch (err: any) {
      reject(new Error(err.message || 'Erro ao inicializar autenticação com o Google.'));
    }
  });
}

/**
 * Busca o arquivo de cofre na pasta de dados do aplicativo (`appDataFolder`) no Google Drive.
 */
async function findDriveFile(token: string): Promise<string | null> {
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${DRIVE_FILE_NAME}' and trashed=false&fields=files(id,name,modifiedTime)`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      disconnectGoogleDrive();
      throw new Error('Sessão do Google expirada. Faça login novamente.');
    }
    throw new Error(`Falha ao buscar arquivo no Google Drive: ${res.statusText}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Baixa o cofre encriptado salvo no Google Drive.
 */
export async function downloadVaultFromDrive(token?: string): Promise<{ payload: EncryptedPayload; fileId: string } | null> {
  const accessToken = token || getStoredDriveToken();
  if (!accessToken) {
    throw new Error('Não autenticado no Google Drive.');
  }

  const fileId = await findDriveFile(accessToken);
  if (!fileId) return null;

  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Erro ao baixar cofre do Google Drive.');
  }

  const payload = await res.json();
  return { payload, fileId };
}

/**
 * Envia ou atualiza o cofre encriptado na pasta reservada do aplicativo no Google Drive.
 */
export async function uploadVaultToDrive(
  payload: EncryptedPayload,
  token?: string
): Promise<string> {
  const accessToken = token || getStoredDriveToken();
  if (!accessToken) {
    throw new Error('Não autenticado no Google Drive.');
  }

  const existingFileId = await findDriveFile(accessToken);
  const fileContent = JSON.stringify(payload);

  if (existingFileId) {
    // Atualização (PATCH)
    const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`;
    const res = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: fileContent,
    });

    if (!res.ok) {
      throw new Error('Erro ao atualizar cofre no Google Drive.');
    }

    return existingFileId;
  } else {
    // Criação de novo arquivo (Multipart Upload) na appDataFolder
    const metadata = {
      name: DRIVE_FILE_NAME,
      parents: ['appDataFolder'],
      mimeType: 'application/json',
    };

    const boundary = 'foo_bar_baz';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      fileContent +
      closeDelimiter;

    const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const res = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      throw new Error('Erro ao criar arquivo no Google Drive.');
    }

    const data = await res.json();
    return data.id;
  }
}
