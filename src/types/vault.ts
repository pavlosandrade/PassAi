import { SyncMode } from './sync';

/**
 * Perfil de identificação do usuário do cofre.
 */
export interface UserProfile {
  name: string;
  email: string;
  passwordHint?: string;
  recoveryKey?: string;
  syncMode?: SyncMode;
  createdAt: string;
}

/**
 * Campo adicional dinâmico de identificação da credencial.
 */
export type CustomFieldType = 'email' | 'username' | 'document' | 'phone' | 'address';

export interface CustomField {
  id: string;
  type: CustomFieldType;
  label: string;
  value: string;
}

/**
 * Estrutura de uma credencial/senha individual no cofre.
 */
export interface Credential {
  id: string;
  title: string;
  username?: string;        // Mantido para retrocompatibilidade
  email?: string;           // Mantido para retrocompatibilidade
  document?: string;        // Mantido para retrocompatibilidade
  customFields?: CustomField[]; // Lista de campos dinâmicos (até 5 de cada tipo)
  password: string;         // Descriptografado em memória durante sessão ativa
  url?: string;
  folderId: string;         // ID da pasta
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Estrutura de uma pasta organizadora de credenciais (suporta hierarquia e subpastas).
 */
export interface Folder {
  id: string;
  name: string;
  description?: string;
  parentId?: string | null; // ID da pasta pai se for uma subpasta
  icon?: string;
  color?: string;
  isProtected: boolean; // Se true, credenciais nesta pasta exigem PIN secundário (2ª camada)
  pin?: string; // PIN da pasta para verificação da 2ª camada
  createdAt: string;
}

/**
 * Dados completos do cofre em memória (descriptografados).
 */
export interface VaultData {
  version: string;
  userProfile?: UserProfile;
  folders: Folder[];
  credentials: Credential[];
}

/**
 * Estrutura serializável do arquivo de backup JSON exportável.
 */
export interface VaultBackup {
  version: string;
  exportedAt: string;
  isEncrypted: boolean;
  userProfile?: UserProfile;
  vault: {
    salt?: string;
    iv?: string;
    ciphertext?: string;
    data?: VaultData;
  };
}
