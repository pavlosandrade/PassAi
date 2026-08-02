import { VaultData, VaultBackup, UserProfile } from '@/types/vault';
import { EncryptedPayload } from '@/types/crypto';
import { encryptData, decryptData } from '@/crypto/cipher';
import { deriveKeyFromPassword } from '@/crypto/pbkdf2';

export interface AccountBackupFile {
  type: 'account_profile';
  version: string;
  exportedAt: string;
  userProfile: UserProfile;
}

export interface BackupImportResult {
  type: 'account_profile' | 'vault_backup';
  userProfile?: UserProfile;
  vaultData?: VaultData;
  encryptedPayload?: EncryptedPayload;
  isEncrypted?: boolean;
}

/**
 * 1. Exporta apenas o Perfil e Dados de Acesso da Conta Ativa (em conformidade com LGPD).
 */
export function exportAccountProfileBackup(userProfile: UserProfile): void {
  const backupContent: AccountBackupFile = {
    type: 'account_profile',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    userProfile,
  };

  const jsonString = JSON.stringify(backupContent, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];

  const a = document.createElement('a');
  a.href = url;
  a.download = `PassAi_AccountBackup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 2. Exporta o Cofre Completo de Senhas da Conta Ativa.
 */
export async function exportVaultBackup(
  vaultData: VaultData,
  masterPassword?: string
): Promise<void> {
  let backupContent: VaultBackup;

  if (masterPassword) {
    const { key, salt } = await deriveKeyFromPassword(masterPassword);
    const encryptedVault = await encryptData(vaultData, key, salt);

    backupContent = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      isEncrypted: true,
      userProfile: vaultData.userProfile,
      vault: {
        salt: encryptedVault.salt,
        iv: encryptedVault.iv,
        ciphertext: encryptedVault.ciphertext,
      },
    };
  } else {
    backupContent = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      isEncrypted: false,
      userProfile: vaultData.userProfile,
      vault: {
        data: vaultData,
      },
    };
  }

  const jsonString = JSON.stringify(backupContent, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const dateStr = new Date().toISOString().split('T')[0];

  const a = document.createElement('a');
  a.href = url;
  a.download = `PassAi_VaultBackup_${backupContent.isEncrypted ? 'Encrypted' : 'Plain'}_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 3. Lê e identifica inteligentemente se o arquivo importado é de Perfil de Conta ou de Cofre de Senhas.
 */
export async function importBackupFile(
  file: File,
  masterPassword?: string
): Promise<BackupImportResult> {
  const text = await file.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error('Arquivo de backup inválido (conteúdo não é um JSON válido).');
  }

  // Valida se o conteúdo lido é um objeto válido
  if (typeof json !== 'object' || json === null || Array.isArray(json)) {
    throw new Error('Arquivo de backup inválido (estrutura não é um objeto JSON válido).');
  }

  // Caso A: Arquivo de Perfil de Conta
  if (json.type === 'account_profile') {
    if (!json.userProfile || typeof json.userProfile.email !== 'string' || !json.userProfile.email.trim()) {
      throw new Error('Arquivo de perfil de conta corrompido ou sem e-mail válido.');
    }
    return {
      type: 'account_profile',
      userProfile: json.userProfile,
    };
  }

  // Caso B: Arquivo de Cofre de Senhas
  if (json.vault) {
    const backup: VaultBackup = json;
    if (backup.isEncrypted) {
      const { salt, iv, ciphertext } = backup.vault;
      if (!salt || !iv || !ciphertext) {
        throw new Error('Dados criptografados ausentes no arquivo de backup.');
      }

      const encryptedPayload: EncryptedPayload = { salt, iv, ciphertext };

      if (masterPassword) {
        try {
          const { key } = await deriveKeyFromPassword(masterPassword, salt);
          const data = await decryptData<VaultData>(encryptedPayload, key);

          if (backup.userProfile && !data.userProfile) {
            data.userProfile = backup.userProfile;
          }

          return {
            type: 'vault_backup',
            userProfile: data.userProfile || backup.userProfile,
            vaultData: data,
            encryptedPayload,
            isEncrypted: true,
          };
        } catch {
          throw new Error('Senha Mestra incorreta para este arquivo de backup.');
        }
      } else {
        // Nenhuma senha fornecida. Retorna a carga criptografada e o perfil para persistência local.
        return {
          type: 'vault_backup',
          userProfile: backup.userProfile,
          encryptedPayload,
          isEncrypted: true,
        };
      }
    } else {
      if (!backup.vault.data || !Array.isArray(backup.vault.data.credentials) || !Array.isArray(backup.vault.data.folders)) {
        throw new Error('Dados do cofre em formato texto plano inválidos ou corrompidos.');
      }
      const data = backup.vault.data;
      if (backup.userProfile && !data.userProfile) {
        data.userProfile = backup.userProfile;
      }
      return {
        type: 'vault_backup',
        userProfile: data.userProfile || backup.userProfile,
        vaultData: data,
        isEncrypted: false,
      };
    }
  }

  throw new Error('Formato de arquivo JSON não reconhecido pelo PassAi.');
}

// Manter função legada para compatibilidade
export async function importVaultBackup(file: File, masterPassword?: string): Promise<VaultData> {
  const result = await importBackupFile(file, masterPassword);
  if (result.vaultData) return result.vaultData;
  throw new Error('O arquivo selecionado é um backup de conta, não de cofre.');
}
