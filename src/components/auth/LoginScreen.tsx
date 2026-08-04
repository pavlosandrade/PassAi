'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, KeyRound, Mail, UserPlus, Upload, AlertCircle, RefreshCw, Check, Cloud, Fingerprint, Users, Trash2, ChevronRight, LogIn } from 'lucide-react';
import { UserProfile, VaultData } from '@/types/vault';
import { authenticateGoogleDrive, downloadVaultFromDrive } from '@/services/googleDriveService';
import { deriveKeyFromPassword } from '@/crypto/pbkdf2';
import { decryptData } from '@/crypto/cipher';
import { saveEncryptedVaultForUser, getRegisteredAccountsList, AccountIndexItem, deleteUserVault } from '@/services/storageService';
import { isBiometricVaultAvailable, unlockVaultWithBiometrics, isWebAuthnSupported } from '@/services/webAuthnService';
import GoogleInitialSetupModal from '@/components/auth/GoogleInitialSetupModal';

interface LoginScreenProps {
  userProfile?: UserProfile;
  onLogin: (email: string, masterPassword: string) => Promise<boolean>;
  onNavigateToRegister: () => void;
  onNavigateToRecovery: () => void;
  onRestoreBackup: (file: File) => Promise<{ success: boolean; email?: string; message?: string } | void>;
}

export default function LoginScreen({
  userProfile,
  onLogin,
  onNavigateToRegister,
  onNavigateToRecovery,
  onRestoreBackup,
}: LoginScreenProps) {
  const [accounts, setAccounts] = useState<AccountIndexItem[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<{ email: string; name: string } | null>(null);
  const [viewMode, setViewMode] = useState<'locked_profile' | 'account_select' | 'custom_email'>('locked_profile');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({});

  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [googleSetupData, setGoogleSetupData] = useState<{ email: string; name: string; token: string } | null>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const list = await getRegisteredAccountsList();
    setAccounts(list);

    if (userProfile?.email) {
      setSelectedAccount({ email: userProfile.email, name: userProfile.name || userProfile.email });
      setEmail(userProfile.email);
      setViewMode('locked_profile');
    } else if (list.length > 0) {
      setSelectedAccount({ email: list[list.length - 1].email, name: list[list.length - 1].name });
      setEmail(list[list.length - 1].email);
      setViewMode('locked_profile');
    } else {
      setViewMode('custom_email');
    }
  };

  useEffect(() => {
    const targetEmail = selectedAccount?.email || email;
    if (targetEmail && isWebAuthnSupported()) {
      setHasBiometrics(isBiometricVaultAvailable(targetEmail));
    } else {
      setHasBiometrics(false);
    }
  }, [selectedAccount, email]);

  const handleSelectAccount = (acc: AccountIndexItem) => {
    setSelectedAccount({ email: acc.email, name: acc.name });
    setEmail(acc.email);
    setPassword('');
    setError('');
    setSuccess('');
    setViewMode('locked_profile');
  };

  const handleRemoveAccount = async (accEmail: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Deseja remover a conta "${accEmail}" deste dispositivo?`)) {
      await deleteUserVault(accEmail);
      const updated = await getRegisteredAccountsList();
      setAccounts(updated);
      if (selectedAccount?.email.toLowerCase() === accEmail.toLowerCase()) {
        if (updated.length > 0) {
          handleSelectAccount(updated[0]);
        } else {
          setSelectedAccount(null);
          setEmail('');
          setViewMode('custom_email');
        }
      }
    }
  };

  const handleBiometricLogin = async () => {
    const targetEmail = selectedAccount?.email || email;
    if (!targetEmail.trim()) {
      setError('Informe seu e-mail para desbloquear com a biometria.');
      return;
    }
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const unlockedPassword = await unlockVaultWithBiometrics(targetEmail.trim());
      setPassword(unlockedPassword);
      const isOk = await onLogin(targetEmail.trim(), unlockedPassword);
      if (!isOk) {
        setError('Não foi possível desbloquear o cofre com as credenciais salvas.');
      }
    } catch (err: any) {
      setError(err.message || 'Falha na autenticação por biometria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    try {
      const token = await authenticateGoogleDrive();
      const remote = await downloadVaultFromDrive(token);

      if (remote && remote.payload) {
        const profileEmail = selectedAccount?.email || email;

        if (password && remote.payload.ciphertext) {
          const { key } = await deriveKeyFromPassword(password, remote.payload.salt);
          const vault = await decryptData<VaultData>(remote.payload, key);
          if (vault.userProfile?.email) {
            await saveEncryptedVaultForUser(vault.userProfile.email, remote.payload, vault.userProfile.name);
            await onLogin(vault.userProfile.email, password);
            return;
          }
        }

        if (profileEmail) {
          await saveEncryptedVaultForUser(profileEmail, remote.payload, profileEmail);
          setSelectedAccount({ email: profileEmail, name: profileEmail });
          setEmail(profileEmail);
          setViewMode('locked_profile');
        }

        setSuccess('Conectado ao Google Drive! Digite sua Senha Mestra para abrir seu cofre.');
      } else {
        let userGoogleEmail = selectedAccount?.email || email || '';
        let userGoogleName = selectedAccount?.name || '';

        try {
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (userInfoRes.ok) {
            const info = await userInfoRes.json();
            if (info.email) userGoogleEmail = info.email;
            if (info.name) userGoogleName = info.name;
          }
        } catch {
          /* ignore */
        }

        if (!userGoogleEmail) {
          userGoogleEmail = prompt('Digite seu e-mail do Google para vincular ao novo cofre:') || '';
        }

        if (userGoogleEmail) {
          setGoogleSetupData({
            email: userGoogleEmail,
            name: userGoogleName || userGoogleEmail.split('@')[0],
            token,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login com o Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInvalidFields({});

    const targetEmail = selectedAccount?.email || email;

    const newInvalid: Record<string, boolean> = {};
    if (!targetEmail.trim()) newInvalid.email = true;
    if (!password) newInvalid.password = true;

    if (Object.keys(newInvalid).length > 0) {
      setInvalidFields(newInvalid);
      setError('Por favor, preencha as credenciais.');
      return;
    }

    setIsSubmitting(true);

    try {
      const isOk = await onLogin(targetEmail.trim(), password);
      if (!isOk) {
        setError('E-mail ou Senha Mestra incorretos.');
        setInvalidFields({ password: true });
      }
    } catch {
      setError('Erro ao descriptografar o cofre. Verifique suas credenciais.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');
    setPassword('');
    setInvalidFields({});

    try {
      const res = await onRestoreBackup(file);
      if (res?.message) {
        setSuccess(res.message);
      }
      if (res?.email) {
        setEmail(res.email);
        setSelectedAccount({ email: res.email, name: res.email });
        setViewMode('locked_profile');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao importar arquivo de backup.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '420px', width: '100%', padding: '2.25rem' }}>
        
        {/* Sleek Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.85rem', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: 'var(--radius-full)', marginBottom: '0.65rem' }}>
            <Shield style={{ width: '32px', height: '32px', color: 'var(--accent-cyan)' }} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            PassAi <span className="gradient-text">Vault</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.35rem', lineHeight: 1.4 }}>
            Gerenciador de senhas pessoal com criptografia de ponta a ponta (AES-256).
          </p>
          <div style={{ marginTop: '0.5rem', padding: '0.45rem 0.65rem', borderRadius: 'var(--radius-sm)', background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.15)', fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
            A integração com a conta do Google é utilizada exclusivamente para backup e sincronização do cofre no seu próprio Google Drive.
          </div>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div className="animate-fade-in" style={{ marginBottom: '1.25rem', padding: '0.65rem 0.9rem', background: 'rgba(255, 42, 109, 0.12)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle style={{ width: '16px', height: '16px', color: 'var(--color-danger)', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="animate-fade-in" style={{ marginBottom: '1.25rem', padding: '0.65rem 0.9rem', background: 'rgba(0, 245, 160, 0.12)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-emerald)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check style={{ width: '16px', height: '16px', color: 'var(--accent-emerald)', flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* --- MODO 1: PERFIL TRANCADO --- */}
        {viewMode === 'locked_profile' && selectedAccount && (
          <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            
            {/* User Profile Pill */}
            <div className="glass-card" style={{ padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 242, 254, 0.25)', background: 'rgba(0, 242, 254, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#05070f', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>
                  {(selectedAccount.name || selectedAccount.email)[0].toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {selectedAccount.name || 'Usuário'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {selectedAccount.email}
                  </div>
                </div>
              </div>

              <span style={{ padding: '0.2rem 0.45rem', borderRadius: 'var(--radius-full)', background: 'rgba(255, 42, 109, 0.12)', border: '1px solid rgba(255, 42, 109, 0.3)', color: 'var(--color-danger)', fontSize: '0.68rem', fontWeight: 600, flexShrink: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <Lock size={11} />
                Trancado
              </span>
            </div>

            {/* Master Password Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label htmlFor="login-password" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Senha Mestra
                </label>
                <button
                  type="button"
                  onClick={onNavigateToRecovery}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Esqueceu a senha?
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field font-mono"
                  placeholder="Digite sua senha mestra..."
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (invalidFields.password) setInvalidFields((prev) => ({ ...prev, password: false }));
                  }}
                  style={{
                    paddingLeft: '2.2rem',
                    paddingRight: '2.5rem',
                    borderColor: invalidFields.password ? 'var(--color-danger)' : undefined,
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Main Action Buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isSubmitting}
                style={{ flex: 1, padding: '0.75rem' }}
              >
                {isSubmitting ? (
                  <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                ) : (
                  <>
                    <KeyRound size={16} />
                    Entrar no Cofre
                  </>
                )}
              </button>

              {hasBiometrics && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleBiometricLogin}
                  disabled={isSubmitting}
                  title="Desbloquear com Biometria"
                  style={{ padding: '0.75rem', borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)', background: 'rgba(0, 245, 160, 0.08)' }}
                >
                  <Fingerprint size={20} />
                </button>
              )}
            </div>

            {/* Google Sign In Option */}
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.82rem', border: '1px solid rgba(0, 242, 254, 0.3)', background: 'rgba(0, 242, 254, 0.04)', color: 'var(--text-primary)', fontWeight: 600 }}
            >
              <Cloud size={16} style={{ color: 'var(--accent-cyan)' }} />
              Entrar / Sincronizar com Google
            </button>

            {/* Account Management Links */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.2rem', fontSize: '0.78rem' }}>
              {accounts.length > 1 && (
                <button
                  type="button"
                  onClick={() => setViewMode('account_select')}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Users size={14} /> Mudar Conta ({accounts.length})
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedAccount(null);
                  setEmail('');
                  setPassword('');
                  setViewMode('custom_email');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                <LogIn size={14} /> Outro e-mail
              </button>
            </div>
          </form>
        )}

        {/* --- MODO 2: SELEÇÃO DE CONTAS --- */}
        {viewMode === 'account_select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-primary)' }}>
              <Users size={16} style={{ color: 'var(--accent-cyan)' }} />
              Contas no Dispositivo
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '220px', overflowY: 'auto' }}>
              {accounts.map((acc) => (
                <div
                  key={acc.email}
                  onClick={() => handleSelectAccount(acc)}
                  className="glass-card"
                  style={{
                    padding: '0.75rem 0.85rem',
                    borderRadius: 'var(--radius-sm)',
                    border: selectedAccount?.email === acc.email ? '1px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', overflow: 'hidden' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#05070f', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>
                      {(acc.name || acc.email)[0].toUpperCase()}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {acc.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {acc.email}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleRemoveAccount(acc.email, e)}
                    title="Remover conta"
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedAccount(null);
                  setEmail('');
                  setViewMode('custom_email');
                }}
                style={{ flex: 1, fontSize: '0.78rem', padding: '0.6rem' }}
              >
                Entrar por E-mail
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={onNavigateToRegister}
                style={{ flex: 1, fontSize: '0.78rem', padding: '0.6rem' }}
              >
                Criar Nova Conta
              </button>
            </div>
          </div>
        )}

        {/* --- MODO 3: FORMULÁRIO DE E-MAIL LIMPO --- */}
        {viewMode === 'custom_email' && (
          <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="login-email" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                E-mail
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-email"
                  type="email"
                  className="input-field"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.2rem' }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label htmlFor="login-password" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Senha Mestra
                </label>
                <button
                  type="button"
                  onClick={onNavigateToRecovery}
                  style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.75rem', cursor: 'pointer' }}
                >
                  Esqueceu a senha?
                </button>
              </div>

              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input-field font-mono"
                  placeholder="Digite sua senha mestra..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.2rem', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%', padding: '0.75rem', marginTop: '0.2rem' }}
            >
              {isSubmitting ? (
                <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
              ) : (
                <>
                  <KeyRound size={16} />
                  Entrar no Cofre
                </>
              )}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              style={{ width: '100%', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.82rem', border: '1px solid rgba(0, 242, 254, 0.3)', background: 'rgba(0, 242, 254, 0.04)', color: 'var(--text-primary)', fontWeight: 600 }}
            >
              <Cloud size={16} style={{ color: 'var(--accent-cyan)' }} />
              Entrar com o Google
            </button>

            {accounts.length > 0 && (
              <button
                type="button"
                onClick={() => setViewMode('account_select')}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'center', marginTop: '0.2rem' }}
              >
                ← Voltar para as contas salvas
              </button>
            )}
          </form>
        )}

        {/* Minimal Footer */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'center', fontSize: '0.78rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <button
              type="button"
              onClick={onNavigateToRegister}
              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
            >
              <UserPlus size={14} />
              Criar Conta
            </button>

            <label style={{ cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Upload size={13} />
              Restaurar Backup
              <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-muted)', fontSize: '0.73rem' }}>
            <a href="https://pavlosandrade.github.io/PassAi/privacy" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="hover:underline">
              Política de Privacidade
            </a>
            <span>•</span>
            <a href="https://pavlosandrade.github.io/PassAi/terms" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-muted)', textDecoration: 'none' }} className="hover:underline">
              Termos de Uso
            </a>
          </div>
        </div>

      </div>

      {/* Modal de Primeiro Acesso do Google */}
      {googleSetupData && (
        <GoogleInitialSetupModal
          googleEmail={googleSetupData.email}
          googleName={googleSetupData.name}
          authToken={googleSetupData.token}
          onComplete={async (userEmail, masterPassword) => {
            setGoogleSetupData(null);
            await onLogin(userEmail, masterPassword);
          }}
          onCancel={() => setGoogleSetupData(null)}
        />
      )}
    </div>
  );
}
