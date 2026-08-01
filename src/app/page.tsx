'use client';

import { useEffect, useState } from 'react';
import LoginScreen from '@/components/auth/LoginScreen';
import RegisterScreen from '@/components/auth/RegisterScreen';
import RecoveryScreen from '@/components/auth/RecoveryScreen';
import InactivityGuard from '@/components/auth/InactivityGuard';
import VaultLayout from '@/components/vault/VaultLayout';
import {
  saveEncryptedVaultForUser,
  loadEncryptedVaultForUser,
  getRegisteredAccountsList,
} from '@/services/storageService';
import { deriveKeyFromPassword } from '@/crypto/pbkdf2';
import { encryptData, decryptData } from '@/crypto/cipher';
import { VaultData, UserProfile } from '@/types/vault';
import { DEFAULT_FOLDERS } from '@/services/folderService';
import { importBackupFile } from '@/services/backupService';
import { Sparkles } from 'lucide-react';

type AuthStage = 'loading' | 'auth' | 'unlocked';
type AuthView = 'login' | 'register' | 'recovery';

export default function Home() {
  const [authStage, setAuthStage] = useState<AuthStage>('loading');
  const [authView, setAuthView] = useState<AuthView>('login');
  
  const [activeMasterPassword, setActiveMasterPassword] = useState<string | null>(null);
  const [vaultData, setVaultData] = useState<VaultData | null>(null);
  const [cachedUserProfile, setCachedUserProfile] = useState<UserProfile | undefined>(undefined);

  useEffect(() => {
    checkVaultState();
  }, []);

  const checkVaultState = async () => {
    setAuthView('login');
    setAuthStage('auth');
  };

  // 1. Cadastro de Novo Cofre e Perfil Isolado por E-mail
  const handleRegisterComplete = async (
    name: string,
    email: string,
    masterPassword: string,
    passwordHint?: string,
    recoveryKey?: string
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    const userProfile: UserProfile = {
      name,
      email: cleanEmail,
      passwordHint,
      recoveryKey,
      createdAt: new Date().toISOString(),
    };

    const initialVault: VaultData = {
      version: '1.0.0',
      userProfile,
      folders: DEFAULT_FOLDERS,
      credentials: [],
    };

    const { key, salt } = await deriveKeyFromPassword(masterPassword);
    const encrypted = await encryptData(initialVault, key, salt);
    
    // Salva o cofre de forma isolada usando o e-mail do usuário como chave
    await saveEncryptedVaultForUser(cleanEmail, encrypted, name);

    setActiveMasterPassword(masterPassword);
    setVaultData(initialVault);
    setCachedUserProfile(userProfile);
    setAuthStage('unlocked');
  };

  // 2. Login no Cofre Isolado do Usuário (por E-mail + Senha Mestra)
  const handleLogin = async (email: string, masterPassword: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    const encrypted = await loadEncryptedVaultForUser(cleanEmail);
    if (!encrypted) return false; // Nenhuma conta com esse e-mail na máquina

    try {
      const { key } = await deriveKeyFromPassword(masterPassword, encrypted.salt);
      const data = await decryptData<VaultData>(encrypted, key);

      setActiveMasterPassword(masterPassword);
      setVaultData(data);
      if (data.userProfile) {
        setCachedUserProfile(data.userProfile);
      }
      setAuthStage('unlocked');
      return true;
    } catch {
      return false; // Senha Mestra incorreta
    }
  };

  // 3. Redefinição de Senha Mestra via Chave de Recuperação
  const handleResetWithNewMasterPassword = async (newMasterPassword: string) => {
    const currentVault = vaultData || {
      version: '1.0.0',
      userProfile: cachedUserProfile,
      folders: DEFAULT_FOLDERS,
      credentials: [],
    };

    if (!currentVault.userProfile?.email) return;

    const { key, salt } = await deriveKeyFromPassword(newMasterPassword);
    const encrypted = await encryptData(currentVault, key, salt);
    await saveEncryptedVaultForUser(currentVault.userProfile.email, encrypted, currentVault.userProfile.name);

    setActiveMasterPassword(newMasterPassword);
    setVaultData(currentVault);
  };

  // 4. Atualização do Cofre em tempo real (isolar por e-mail)
  const handleUpdateVault = async (updatedVault: VaultData) => {
    setVaultData(updatedVault);
    if (updatedVault.userProfile) {
      setCachedUserProfile(updatedVault.userProfile);
    }
    if (activeMasterPassword && updatedVault.userProfile?.email) {
      const { key, salt } = await deriveKeyFromPassword(activeMasterPassword);
      const encrypted = await encryptData(updatedVault, key, salt);
      await saveEncryptedVaultForUser(updatedVault.userProfile.email, encrypted, updatedVault.userProfile.name);
    }
  };

  // 5. Logout / Trancamento
  const handleLock = () => {
    setActiveMasterPassword(null);
    setVaultData(null);
    setAuthView('login');
    setAuthStage('auth');
  };

  // 6. Restauração de Backup (Suporte a Arquivo de Conta e Arquivo de Cofre)
  const handleRestoreBackup = async (file: File) => {
    const result = await importBackupFile(file, activeMasterPassword || undefined);

    if (result.type === 'account_profile' && result.userProfile) {
      setCachedUserProfile(result.userProfile);
    } else if (result.vaultData) {
      setVaultData(result.vaultData);
      if (result.vaultData.userProfile) {
        setCachedUserProfile(result.vaultData.userProfile);
      }
      if (activeMasterPassword && result.vaultData.userProfile?.email) {
        const { key, salt } = await deriveKeyFromPassword(activeMasterPassword);
        const encrypted = await encryptData(result.vaultData, key, salt);
        await saveEncryptedVaultForUser(result.vaultData.userProfile.email, encrypted, result.vaultData.userProfile.name);
      }
    }
  };

  if (authStage === 'loading') {
    return (
      <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--accent-cyan)', fontSize: '1.1rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Sparkles style={{ width: '24px', height: '24px', animation: 'spin 2s linear infinite' }} />
          Carregando PassAi...
        </div>
      </main>
    );
  }

  if (authStage === 'auth') {
    if (authView === 'register') {
      return (
        <RegisterScreen
          onRegisterComplete={handleRegisterComplete}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }

    if (authView === 'recovery') {
      return (
        <RecoveryScreen
          userProfile={cachedUserProfile || vaultData?.userProfile}
          onResetWithNewMasterPassword={handleResetWithNewMasterPassword}
          onRestoreBackup={handleRestoreBackup}
          onNavigateToLogin={() => setAuthView('login')}
        />
      );
    }

    return (
      <LoginScreen
        userProfile={cachedUserProfile || vaultData?.userProfile}
        onLogin={handleLogin}
        onNavigateToRegister={() => setAuthView('register')}
        onNavigateToRecovery={() => setAuthView('recovery')}
        onRestoreBackup={handleRestoreBackup}
      />
    );
  }

  return (
    <InactivityGuard onLock={handleLock}>
      {vaultData && (
        <VaultLayout
          vaultData={vaultData}
          masterPassword={activeMasterPassword}
          onUpdateVault={handleUpdateVault}
          onLock={handleLock}
        />
      )}
    </InactivityGuard>
  );
}
