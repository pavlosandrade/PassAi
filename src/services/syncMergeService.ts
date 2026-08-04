import { VaultData, Credential, Folder } from '@/types/vault';

/**
 * Realiza a fusão inteligente (smart merge) de dois cofres descriptografados.
 * Utiliza timestamps (updatedAt / createdAt) para garantir que as credenciais
 * mais recentes prevaleçam, sem perder itens adicionados apenas em um dos lados.
 */
export function mergeVaultData(localVault: VaultData, remoteVault: VaultData): VaultData {
  // 1. Fusão de Pastas
  const folderMap = new Map<string, Folder>();

  // Adiciona pastas locais
  for (const folder of localVault.folders || []) {
    folderMap.set(folder.id, { ...folder });
  }

  // Mescla pastas remotas (preserva locais ou substitui se for mais nova)
  for (const remoteFolder of remoteVault.folders || []) {
    if (!folderMap.has(remoteFolder.id)) {
      folderMap.set(remoteFolder.id, { ...remoteFolder });
    } else {
      const localFolder = folderMap.get(remoteFolder.id)!;
      // Se tiver timestamp de atualização ou criação mais recente
      const localTime = new Date(localFolder.createdAt || 0).getTime();
      const remoteTime = new Date(remoteFolder.createdAt || 0).getTime();

      if (remoteTime > localTime) {
        folderMap.set(remoteFolder.id, { ...remoteFolder });
      }
    }
  }

  // 2. Fusão de Credenciais
  const credentialMap = new Map<string, Credential>();

  for (const cred of localVault.credentials || []) {
    credentialMap.set(cred.id, { ...cred });
  }

  for (const remoteCred of remoteVault.credentials || []) {
    if (!credentialMap.has(remoteCred.id)) {
      credentialMap.set(remoteCred.id, { ...remoteCred });
    } else {
      const localCred = credentialMap.get(remoteCred.id)!;
      const localTime = new Date(localCred.updatedAt || localCred.createdAt || 0).getTime();
      const remoteTime = new Date(remoteCred.updatedAt || remoteCred.createdAt || 0).getTime();

      if (remoteTime > localTime) {
        credentialMap.set(remoteCred.id, { ...remoteCred });
      }
    }
  }

  return {
    version: localVault.version || remoteVault.version || '1.0.0',
    userProfile: localVault.userProfile || remoteVault.userProfile,
    folders: Array.from(folderMap.values()),
    credentials: Array.from(credentialMap.values()),
  };
}
