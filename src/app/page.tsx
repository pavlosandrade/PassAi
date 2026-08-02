'use client';

import { useEffect, useState } from 'react';
import LoginScreen from '@/components/auth/LoginScreen';
import RegisterScreen from '@/components/auth/RegisterScreen';
import RecoveryScreen from '@/components/auth/RecoveryScreen';
import InactivityGuard from '@/components/auth/InactivityGuard';
import VaultLayout from '@/components/vault/VaultLayout';
import VaultSkeletonLoader from '@/components/vault/VaultSkeletonLoader';
import {
  saveEncryptedVaultForUser,
  loadEncryptedVaultForUser,
  getRegisteredAccountsList,
  registerAccountProfile,
  getAccountProfile,
} from '@/services/storageService';
import { deriveKeyFromPassword } from '@/crypto/pbkdf2';
import { encryptData, decryptData } from '@/crypto/cipher';
import { VaultData, UserProfile } from '@/types/vault';
import { DEFAULT_FOLDERS } from '@/services/folderService';
import { importBackupFile } from '@/services/backupService';
import { saveSession, loadSession, clearSession } from '@/services/sessionService';
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
    // Tenta restaurar sessão ativa do sessionStorage (persiste F5, limpa ao fechar aba)
    const session = loadSession();
    if (session) {
      try {
        const encrypted = await loadEncryptedVaultForUser(session.email);
        if (encrypted) {
          const { key } = await deriveKeyFromPassword(session.masterPassword, encrypted.salt);
          const data = await decryptData<VaultData>(encrypted, key);
          setActiveMasterPassword(session.masterPassword);
          setVaultData(data);
          if (data.userProfile) setCachedUserProfile(data.userProfile);
          setAuthStage('unlocked');
          return;
        }
      } catch {
        // Sessão inválida ou corrompida — limpa e pede login
        clearSession();
      }
    }
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
    await registerAccountProfile(userProfile);

    setActiveMasterPassword(masterPassword);
    setVaultData(initialVault);
    setCachedUserProfile(userProfile);
    saveSession(cleanEmail, masterPassword);
    setAuthStage('unlocked');
  };

  // 2. Login no Cofre Isolado do Usuário (por E-mail + Senha Mestra)
  const handleLogin = async (email: string, masterPassword: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();
    let encrypted = await loadEncryptedVaultForUser(cleanEmail);

    // Se ainda não existir um payload criptografado, verifica se a conta foi restaurada via Arquivo de Conta
    if (!encrypted) {
      const savedProfile = (await getAccountProfile(cleanEmail)) || cachedUserProfile;
      if (savedProfile && savedProfile.email.toLowerCase() === cleanEmail) {
        // Inicializa o cofre com o perfil existente e criptografa com a senha fornecida
        const initialVault: VaultData = {
          version: '1.0.0',
          userProfile: savedProfile,
          folders: DEFAULT_FOLDERS,
          credentials: [],
        };
        const { key, salt } = await deriveKeyFromPassword(masterPassword);
        encrypted = await encryptData(initialVault, key, salt);
        await saveEncryptedVaultForUser(cleanEmail, encrypted, savedProfile.name);

        setActiveMasterPassword(masterPassword);
        setVaultData(initialVault);
        setCachedUserProfile(savedProfile);
        setAuthStage('unlocked');
        return true;
      }
      return false; // Nenhuma conta com esse e-mail na máquina
    }

    try {
      const { key } = await deriveKeyFromPassword(masterPassword, encrypted.salt);
      const data = await decryptData<VaultData>(encrypted, key);

      setActiveMasterPassword(masterPassword);
      setVaultData(data);
      if (data.userProfile) {
        setCachedUserProfile(data.userProfile);
      }
      saveSession(cleanEmail, masterPassword);
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
    clearSession();
    setActiveMasterPassword(null);
    setVaultData(null);
    setAuthView('login');
    setAuthStage('auth');
  };

  // 6. Restauração de Backup (Suporte a Arquivo de Conta e Arquivo de Cofre)
  const handleRestoreBackup = async (
    file: File,
    providedMasterPassword?: string
  ): Promise<{ success: boolean; email?: string; message?: string }> => {
    const passwordToUse = providedMasterPassword || activeMasterPassword || undefined;
    const result = await importBackupFile(file, passwordToUse);

    // Caso A: Arquivo de Perfil de Conta -> Registra/Cria a conta imediatamente no dispositivo
    if (result.type === 'account_profile' && result.userProfile) {
      await registerAccountProfile(result.userProfile);
      setCachedUserProfile(result.userProfile);

      if (passwordToUse) {
        const initialVault: VaultData = {
          version: '1.0.0',
          userProfile: result.userProfile,
          folders: DEFAULT_FOLDERS,
          credentials: [],
        };
        const { key, salt } = await deriveKeyFromPassword(passwordToUse);
        const encrypted = await encryptData(initialVault, key, salt);
        await saveEncryptedVaultForUser(result.userProfile.email, encrypted, result.userProfile.name);

        setActiveMasterPassword(passwordToUse);
        setVaultData(initialVault);
        setAuthStage('unlocked');
        return {
          success: true,
          email: result.userProfile.email,
          message: `Conta de ${result.userProfile.name} restaurada e cofre desbloqueado com sucesso!`,
        };
      }

      setAuthView('login');
      return {
        success: true,
        email: result.userProfile.email,
        message: `Conta de ${result.userProfile.name} (${result.userProfile.email}) restaurada no dispositivo com sucesso! Digite sua Senha Mestra para entrar.`,
      };
    }

    if (result.type === 'vault_backup') {
      // 1. Backup Criptografado
      if (result.isEncrypted && result.encryptedPayload && result.userProfile?.email) {
        await saveEncryptedVaultForUser(
          result.userProfile.email,
          result.encryptedPayload,
          result.userProfile.name || 'Usuário'
        );
        await registerAccountProfile(result.userProfile);
        setCachedUserProfile(result.userProfile);

        if (result.vaultData && passwordToUse) {
          setActiveMasterPassword(passwordToUse);
          setVaultData(result.vaultData);
          setAuthStage('unlocked');
          return {
            success: true,
            email: result.userProfile.email,
            message: 'Cofre restaurado e desbloqueado com sucesso!',
          };
        } else {
          setAuthView('login');
          return {
            success: true,
            email: result.userProfile.email,
            message: `Cofre de ${result.userProfile.name} (${result.userProfile.email}) restaurado no dispositivo com sucesso! Digite sua Senha Mestra para entrar.`,
          };
        }
      }
      // 2. Backup em Texto Plano
      else if (!result.isEncrypted && result.vaultData) {
        const profile = result.vaultData.userProfile;
        if (!profile?.email) {
          throw new Error('O backup em texto plano não possui um e-mail válido de perfil.');
        }

        if (passwordToUse) {
          const { key, salt } = await deriveKeyFromPassword(passwordToUse);
          const encrypted = await encryptData(result.vaultData, key, salt);
          await saveEncryptedVaultForUser(profile.email, encrypted, profile.name || 'Usuário');
          await registerAccountProfile(profile);

          setActiveMasterPassword(passwordToUse);
          setVaultData(result.vaultData);
          setCachedUserProfile(profile);
          setAuthStage('unlocked');
          return {
            success: true,
            email: profile.email,
            message: 'Cofre em texto plano importado, criptografado e salvo com sucesso!',
          };
        } else {
          setVaultData(result.vaultData);
          setCachedUserProfile(profile);
          throw new Error('Para importar um backup em texto plano no dispositivo, digite sua Senha Mestra no campo antes de restaurar.');
        }
      }
    }

    throw new Error('Não foi possível processar o arquivo de backup.');
  };

  if (authStage === 'loading') {
    return <VaultSkeletonLoader />;
  }

  if (authStage === 'auth') {
    if (authView === 'register') {
      return (
        <RegisterScreen
          initialProfile={cachedUserProfile}
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
