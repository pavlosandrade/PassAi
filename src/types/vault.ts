/**
 * Perfil de identificação do usuário do cofre.
 */
export interface UserProfile {
  name: string;
  email: string;
  passwordHint?: string;
  recoveryKey?: string;
  createdAt: string;
}

/**
 * Estrutura de uma credencial/senha individual no cofre.
 */
export interface Credential {
  id: string;
  title: string;
  username: string;
  password: string; // Descriptografado em memória durante sessão ativa
  url?: string;
  folderId: string; // ID da pasta ou 'default'
  notes?: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Estrutura de uma pasta organizadora de credenciais.
 */
export interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
  isProtected: boolean; // Se true, credenciais nesta pasta exigem PIN secundário (2ª camada)
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
