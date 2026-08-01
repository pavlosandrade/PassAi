import { Folder, Credential, VaultData } from '@/types/vault';
import { deriveKeyFromPassword } from '@/crypto/pbkdf2';
import { encryptData, decryptData } from '@/crypto/cipher';
import { EncryptedPayload } from '@/types/crypto';

export const DEFAULT_FOLDERS: Folder[] = [
  {
    id: 'default',
    name: 'Geral',
    icon: 'Folder',
    color: '#00f2fe',
    isProtected: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'work',
    name: 'Trabalho',
    icon: 'Briefcase',
    color: '#4facfe',
    isProtected: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'finance',
    name: 'Finanças',
    icon: 'Landmark',
    color: '#00f5a0',
    isProtected: true, // Por padrão marcada como sensível
    createdAt: new Date().toISOString(),
  },
  {
    id: 'social',
    name: 'Redes Sociais',
    icon: 'Share2',
    color: '#e100ff',
    isProtected: false,
    createdAt: new Date().toISOString(),
  },
];

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
 * Filtra credenciais por pasta.
 */
export function getCredentialsByFolder(
  credentials: Credential[],
  folderId: string
): Credential[] {
  if (folderId === 'all') return credentials;
  if (folderId === 'favorites') return credentials.filter((c) => c.isFavorite);
  return credentials.filter((c) => c.folderId === folderId);
}
