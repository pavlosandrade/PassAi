import { EncryptedPayload } from '@/types/crypto';

const INDEX_KEY = 'passai_accounts_index';
const DB_NAME = 'PassAiDB';
const DB_VERSION = 1;
const STORE_NAME = 'vaultStore';

export interface AccountIndexItem {
  email: string;
  name: string;
  createdAt: string;
}

/**
 * Sanitiza o e-mail para ser usado com segurança como chave de armazenamento.
 */
function sanitizeEmailKey(email: string): string {
  return `passai_vault_${email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
}

/**
 * Abre a conexão com o IndexedDB do navegador.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado neste ambiente.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retorna a lista de contas/usuários cadastrados neste dispositivo.
 */
export async function getRegisteredAccountsList(): Promise<AccountIndexItem[]> {
  if (typeof window === 'undefined') return [];

  try {
    const db = await openDB();
    const list = await new Promise<AccountIndexItem[] | null>((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(INDEX_KEY);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });

    if (list) return list;
  } catch {
    /* fallback abaixo */
  }

  // Fallback LocalStorage
  const localData = localStorage.getItem(INDEX_KEY);
  if (localData) {
    try {
      return JSON.parse(localData) as AccountIndexItem[];
    } catch {
      return [];
    }
  }

  return [];
}

/**
 * Salva a lista atualizada de contas no índice local.
 */
async function updateAccountsList(email: string, name: string): Promise<void> {
  const currentList = await getRegisteredAccountsList();
  const cleanEmail = email.trim().toLowerCase();
  
  const existingIndex = currentList.findIndex((item) => item.email.toLowerCase() === cleanEmail);
  const updatedList = [...currentList];

  if (existingIndex >= 0) {
    updatedList[existingIndex] = {
      ...updatedList[existingIndex],
      name,
    };
  } else {
    updatedList.push({
      email: cleanEmail,
      name,
      createdAt: new Date().toISOString(),
    });
  }

  const jsonString = JSON.stringify(updatedList);
  localStorage.setItem(INDEX_KEY, jsonString);

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(updatedList, INDEX_KEY);
  } catch (err) {
    console.warn('Erro ao atualizar índice no IndexedDB:', err);
  }
}

/**
 * Verifica se já existe um cofre cadastrado para um e-mail específico neste dispositivo.
 */
export async function userVaultExists(email: string): Promise<boolean> {
  if (typeof window === 'undefined' || !email) return false;

  const key = sanitizeEmailKey(email);

  try {
    const db = await openDB();
    const result = await new Promise<boolean>((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(!!request.result);
      request.onerror = () => resolve(false);
    });

    if (result) return true;
  } catch {
    /* fallback abaixo */
  }

  return !!localStorage.getItem(key);
}

/**
 * Salva o cofre criptografado isolado para um e-mail específico.
 */
export async function saveEncryptedVaultForUser(
  email: string,
  payload: EncryptedPayload,
  name: string
): Promise<void> {
  if (typeof window === 'undefined') return;

  const key = sanitizeEmailKey(email);
  const jsonString = JSON.stringify(payload);

  // 1. Salva no LocalStorage
  localStorage.setItem(key, jsonString);

  // 2. Atualiza o índice de contas
  await updateAccountsList(email, name);

  // 3. Salva no IndexedDB
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.put(payload, key);
  } catch (err) {
    console.warn('Erro ao salvar cofre no IndexedDB, mantido no LocalStorage:', err);
  }
}

/**
 * Carrega o cofre criptografado isolado para um e-mail específico.
 */
export async function loadEncryptedVaultForUser(email: string): Promise<EncryptedPayload | null> {
  if (typeof window === 'undefined' || !email) return null;

  const key = sanitizeEmailKey(email);

  try {
    const db = await openDB();
    const payload = await new Promise<EncryptedPayload | null>((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });

    if (payload) return payload;
  } catch {
    /* fallback abaixo */
  }

  // Fallback LocalStorage
  const localData = localStorage.getItem(key);
  if (localData) {
    try {
      return JSON.parse(localData) as EncryptedPayload;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Exclui o cofre de um e-mail específico.
 */
export async function deleteUserVault(email: string): Promise<void> {
  if (typeof window === 'undefined' || !email) return;

  const key = sanitizeEmailKey(email);
  const cleanEmail = email.trim().toLowerCase();

  localStorage.removeItem(key);

  // Remove do índice
  const currentList = await getRegisteredAccountsList();
  const updatedList = currentList.filter((item) => item.email.toLowerCase() !== cleanEmail);
  localStorage.setItem(INDEX_KEY, JSON.stringify(updatedList));

  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(key);
    store.put(updatedList, INDEX_KEY);
  } catch {
    /* ignore */
  }
}

// Manter funções retrocompatíveis se necessário
export async function hasExistingVault(): Promise<boolean> {
  const list = await getRegisteredAccountsList();
  return list.length > 0;
}

export async function clearVault(): Promise<void> {
  if (typeof window === 'undefined') return;
  localStorage.clear();
}
