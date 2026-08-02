import { Folder, Credential } from '@/types/vault';
import { deriveKeyFromPassword } from '@/crypto/pbkdf2';
import { encryptData, decryptData } from '@/crypto/cipher';
import { EncryptedPayload } from '@/types/crypto';

// Não teremos mais pastas fixas obrigatórias no sistema
export const DEFAULT_FOLDERS: Folder[] = [];

export interface FolderTreeNode {
  folder: Folder;
  children: FolderTreeNode[];
}

/**
 * Constrói a árvore de hierarquia de pastas e subpastas.
 */
export function buildFolderTree(folders: Folder[]): FolderTreeNode[] {
  const map = new Map<string, FolderTreeNode>();
  const roots: FolderTreeNode[] = [];

  folders.forEach((f) => {
    map.set(f.id, { folder: f, children: [] });
  });

  folders.forEach((f) => {
    const node = map.get(f.id)!;
    if (f.parentId && map.has(f.parentId)) {
      map.get(f.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

/**
 * Retorna o ID da pasta e todos os IDs de suas subpastas descendentes.
 */
export function getFolderAndSubfolderIds(folders: Folder[], folderId: string): string[] {
  const result: string[] = [folderId];

  const addChildren = (pId: string) => {
    const children = folders.filter((f) => f.parentId === pId);
    children.forEach((c) => {
      result.push(c.id);
      addChildren(c.id);
    });
  };

  addChildren(folderId);
  return result;
}

/**
 * Retorna o caminho completo formatado da pasta (ex: "Trabalho / Projetos / Cliente").
 */
export function getFolderFullPath(folders: Folder[], folderId: string): string {
  const folder = folders.find((f) => f.id === folderId);
  if (!folder) return '';

  const path: string[] = [folder.name];
  let current = folder;

  while (current.parentId) {
    const parent = folders.find((f) => f.id === current.parentId);
    if (!parent) break;
    path.unshift(parent.name);
    current = parent;
  }

  return path.join(' / ');
}

/**
 * Encripta o conteúdo de uma credencial sensível com o PIN secundário da pasta (Camada 2).
 */
export async function encryptCredentialForFolder(
  credential: Credential,
  folderPin: string
): Promise<EncryptedPayload> {
  const { key, salt } = await deriveKeyFromPassword(folderPin);
  return encryptData(credential, key, salt);
}

/**
 * Decripta o conteúdo de uma credencial protegida com o PIN da pasta (Camada 2).
 */
export async function decryptCredentialFromFolder(
  encryptedPayload: EncryptedPayload,
  folderPin: string
): Promise<Credential> {
  const { key } = await deriveKeyFromPassword(folderPin, encryptedPayload.salt);
  return decryptData<Credential>(encryptedPayload, key);
}

/**
 * Verifica se uma pasta ou qualquer uma de suas pastas pai na hierarquia está protegida por PIN e trancada.
 */
export function isFolderOrAncestorLocked(
  folders: Folder[],
  folderId: string | undefined,
  unlockedFolderPins: Record<string, boolean>
): boolean {
  if (!folderId) return false;

  let current = folders.find((f) => f.id === folderId);
  while (current) {
    if (current.isProtected && !unlockedFolderPins[current.id]) {
      return true;
    }
    if (!current.parentId) break;
    const pId: string = current.parentId;
    current = folders.find((f) => f.id === pId);
  }

  return false;
}

/**
 * Filtra credenciais por pasta e subpastas.
 */
export function getCredentialsByFolder(
  credentials: Credential[],
  folders: Folder[],
  folderId: string
): Credential[] {
  if (folderId === 'all') return credentials;
  if (folderId === 'favorites') return credentials.filter((c) => c.isFavorite);

  const targetFolderIds = getFolderAndSubfolderIds(folders, folderId);
  return credentials.filter((c) => targetFolderIds.includes(c.folderId));
}
