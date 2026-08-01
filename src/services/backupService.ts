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

  const cleanEmail = userProfile.email.replace(/[^a-z0-9]/gi, '_');
  const dateStr = new Date().toISOString().split('T')[0];

  const a = document.createElement('a');
  a.href = url;
  a.download = `PassAi_AccountProfile_${cleanEmail}_${dateStr}.json`;
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

  const cleanEmail = vaultData.userProfile?.email ? vaultData.userProfile.email.replace(/[^a-z0-9]/gi, '_') : 'user';
  const dateStr = new Date().toISOString().split('T')[0];

  const a = document.createElement('a');
  a.href = url;
  a.download = `PassAi_VaultBackup_${backupContent.isEncrypted ? 'Encrypted' : 'Plain'}_${cleanEmail}_${dateStr}.json`;
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
  const json = JSON.parse(text);

  // Caso A: Arquivo de Perfil de Conta
  if (json.type === 'account_profile' && json.userProfile) {
    return {
      type: 'account_profile',
      userProfile: json.userProfile,
    };
  }

  // Caso B: Arquivo de Cofre de Senhas
  if (json.vault) {
    const backup: VaultBackup = json;
    if (backup.isEncrypted) {
      if (!masterPassword) {
        throw new Error('Este backup de cofre está criptografado e requer a Senha Mestra.');
      }

      const { salt, iv, ciphertext } = backup.vault;
      if (!salt || !iv || !ciphertext) {
        throw new Error('Dados criptografados ausentes no backup.');
      }

      const encryptedPayload: EncryptedPayload = { salt, iv, ciphertext };
      const { key } = await deriveKeyFromPassword(masterPassword, salt);
      const data = await decryptData<VaultData>(encryptedPayload, key);

      if (backup.userProfile && !data.userProfile) {
        data.userProfile = backup.userProfile;
      }

      return {
        type: 'vault_backup',
        userProfile: data.userProfile || backup.userProfile,
        vaultData: data,
      };
    } else {
      if (!backup.vault.data) {
        throw new Error('Dados do cofre em formato texto plano ausentes no arquivo.');
      }
      const data = backup.vault.data;
      if (backup.userProfile && !data.userProfile) {
        data.userProfile = backup.userProfile;
      }
      return {
        type: 'vault_backup',
        userProfile: data.userProfile || backup.userProfile,
        vaultData: data,
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
