'use client';

import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, KeyRound, Mail, UserPlus, Upload, AlertCircle, RefreshCw, Check, Cloud, Fingerprint, Users, Trash2, ArrowLeft, Sparkles } from 'lucide-react';
import { UserProfile, VaultData } from '@/types/vault';
import { authenticateGoogleDrive, downloadVaultFromDrive } from '@/services/googleDriveService';
import { deriveKeyFromPassword } from '@/crypto/pbkdf2';
import { decryptData } from '@/crypto/cipher';
import { saveEncryptedVaultForUser, getRegisteredAccountsList, AccountIndexItem, deleteUserVault } from '@/services/storageService';
import { isBiometricVaultAvailable, unlockVaultWithBiometrics, isWebAuthnSupported } from '@/services/webAuthnService';
import GoogleInitialSetupModal from '@/components/auth/GoogleInitialSetupModal';
import ConfirmModal from '@/components/ui/ConfirmModal';

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
  const [isCustomEmailMode, setIsCustomEmailMode] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

  const [emailInput, setEmailInput] = useState('');
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
    // A tela inicial SEMPRE começa na seleção de cofre/ações principais
    setSelectedAccount(null);
    setIsCustomEmailMode(false);
  };

  // Verifica disponibilidade da biometria para a conta selecionada ou e-mail digitado
  useEffect(() => {
    const targetEmail = selectedAccount?.email || emailInput;
    if (targetEmail && isWebAuthnSupported()) {
      setHasBiometrics(isBiometricVaultAvailable(targetEmail));
    } else {
      setHasBiometrics(false);
    }
  }, [selectedAccount, emailInput]);

  const handleSelectAccount = (acc: AccountIndexItem) => {
    setSelectedAccount({ email: acc.email, name: acc.name });
    setPassword('');
    setError('');
    setSuccess('');
    setIsCustomEmailMode(false);
  };

  const handleRemoveAccount = (accEmail: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAccountToDelete(accEmail);
  };

  const executeAccountDeletion = async () => {
    if (!accountToDelete) return;
    const targetEmail = accountToDelete;
    setAccountToDelete(null);
    await deleteUserVault(targetEmail);
    const updated = await getRegisteredAccountsList();
    setAccounts(updated);
    if (selectedAccount?.email.toLowerCase() === targetEmail.toLowerCase()) {
      setSelectedAccount(null);
      setPassword('');
    }
  };

  const handleBiometricLogin = async () => {
    const targetEmail = selectedAccount?.email || emailInput;
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

      let userGoogleEmail = '';
      let userGoogleName = '';

      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (userInfoRes.ok) {
          const info = await userInfoRes.json();
          if (info.email) userGoogleEmail = info.email.trim().toLowerCase();
          if (info.name) userGoogleName = info.name.trim();
        }
      } catch (uErr) {
        console.warn('Não foi possível obter dados do perfil do Google:', uErr);
      }

      const remote = await downloadVaultFromDrive(token);

      if (remote && remote.payload) {
        const targetEmail = userGoogleEmail || selectedAccount?.email || emailInput;

        if (targetEmail) {
          await saveEncryptedVaultForUser(targetEmail, remote.payload, userGoogleName || targetEmail);
          setSelectedAccount({ email: targetEmail, name: userGoogleName || targetEmail });
          setIsCustomEmailMode(false);

          if (password) {
            const isOk = await onLogin(targetEmail, password);
            if (isOk) return;
          }

          if (isWebAuthnSupported() && isBiometricVaultAvailable(targetEmail)) {
            try {
              const unlockedPassword = await unlockVaultWithBiometrics(targetEmail);
              const isOk = await onLogin(targetEmail, unlockedPassword);
              if (isOk) return;
            } catch {
              /* ignore biometrics cancel */
            }
          }
        }

        setSuccess('Cofre do Google Drive localizado! Digite sua Senha Mestra para abrir.');
      } else {
        const finalEmail = userGoogleEmail || selectedAccount?.email || emailInput;

        if (finalEmail) {
          setGoogleSetupData({
            email: finalEmail,
            name: userGoogleName || finalEmail.split('@')[0],
            token,
          });
        } else {
          setError('Não foi possível identificar o e-mail da sua conta do Google. Por favor, tente novamente.');
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

    const targetEmail = selectedAccount?.email || emailInput;

    const newInvalid: Record<string, boolean> = {};
    if (!targetEmail.trim()) newInvalid.email = true;
    if (!password) newInvalid.password = true;

    if (Object.keys(newInvalid).length > 0) {
      setInvalidFields(newInvalid);
      setError('Por favor, preencha a Senha Mestra.');
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
        setSelectedAccount({ email: res.email, name: res.email });
        setIsCustomEmailMode(false);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao importar arquivo de backup.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '420px', width: '100%', padding: '2.25rem' }}>
        
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.85rem', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: 'var(--radius-full)', marginBottom: '0.65rem' }}>
            <Shield style={{ width: '32px', height: '32px', color: 'var(--accent-cyan)' }} />
          </div>
          <h1 style={{ fontSize: '1.65rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
            PassAi <span className="gradient-text">Vault</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: '0.35rem' }}>
            Gerenciador de senhas pessoal
          </p>
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

        {/* --- VISÃO A: TELA INICIAL PRINCIPAL (ESCOLHER COFRE + BOTÕES SEPARADOS) --- */}
        {!selectedAccount && !isCustomEmailMode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Lista de Cofres / Contas no Dispositivo (se houver) */}
            {accounts.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <h2 style={{ fontSize: '0.88rem', fontWeight: 600, margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  <Users size={15} style={{ color: 'var(--accent-cyan)' }} />
                  Escolha seu Cofre
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '220px', overflowY: 'auto' }}>
                  {accounts.map((acc) => (
                    <div
                      key={acc.email}
                      onClick={() => handleSelectAccount(acc)}
                      className="glass-card hover:border-cyan-400"
                      style={{
                        padding: '0.75rem 0.9rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-light)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-full)', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#05070f', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                          {(acc.name || acc.email)[0].toUpperCase()}
                        </div>
                        <div style={{ overflow: 'hidden', textAlign: 'left' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {acc.name}
                          </div>
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {acc.email}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleRemoveAccount(acc.email, e)}
                        title="Remover conta do dispositivo"
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Seção de Botões de Ação Padronizados */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              
              {/* 1. Botão Entrar por E-mail */}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setSelectedAccount(null);
                  setEmailInput('');
                  setIsCustomEmailMode(true);
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <Mail size={18} style={{ color: 'var(--text-muted)' }} />
                Entrar com E-mail
              </button>

              {/* 2. Botão Google */}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleGoogleLogin}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                  border: '1px solid rgba(0, 242, 254, 0.35)',
                  background: 'rgba(0, 242, 254, 0.05)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                }}
              >
                <Cloud size={18} style={{ color: 'var(--accent-cyan)' }} />
                Entrar com o Google
              </button>

              {/* Divisor / Separador OU */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '0.25rem 0', color: 'var(--text-muted)', fontSize: '0.73rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
                <span>OU</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-light)' }} />
              </div>

              {/* 3. Botão Em Gradiente para Criar Nova Conta (Após o separador) */}
              <button
                type="button"
                onClick={onNavigateToRegister}
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.6rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  background: 'linear-gradient(135deg, var(--accent-cyan), #0077ff)',
                  color: '#05070f',
                  cursor: 'pointer',
                  boxShadow: '0 0 16px rgba(0, 242, 254, 0.35)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Sparkles size={18} />
                Criar Nova Conta
              </button>

            </div>

          </div>
        )}

        {/* --- VISÃO B: FORMULÁRIO DE DESBLOQUEIO DE CONTA SELECIONADA --- */}
        {selectedAccount && !isCustomEmailMode && (
          <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            
            <button
              type="button"
              onClick={() => {
                setSelectedAccount(null);
                setPassword('');
                setError('');
              }}
              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '-0.2rem' }}
            >
              <ArrowLeft size={14} /> Voltar para opções de conta
            </button>

            {/* Profile Card */}
            <div className="glass-card" style={{ padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(0, 242, 254, 0.25)', background: 'rgba(0, 242, 254, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

            {/* Password Input */}
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

            {/* Action Buttons */}
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
                  title="Desbloquear com Biometria / Digital"
                  style={{ padding: '0.75rem', borderColor: 'var(--accent-emerald)', color: 'var(--accent-emerald)', background: 'rgba(0, 245, 160, 0.08)' }}
                >
                  <Fingerprint size={20} />
                </button>
              )}
            </div>
          </form>
        )}

        {/* --- VISÃO C: FORMULÁRIO DE E-MAIL E SENHA MANUAL --- */}
        {isCustomEmailMode && (
          <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <button
              type="button"
              onClick={() => setIsCustomEmailMode(false)}
              style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.78rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', marginBottom: '-0.2rem' }}
            >
              <ArrowLeft size={14} /> Voltar para opções de conta
            </button>

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
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
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
          </form>
        )}

        {/* Minimal Footer */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.6rem', textAlign: 'center', fontSize: '0.78rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <label style={{ cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
              <Upload size={13} />
              Restaurar Backup (.json)
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

      {/* Modal de Confirmação de Exclusão de Conta */}
      <ConfirmModal
        isOpen={!!accountToDelete}
        title="Remover Conta do Dispositivo"
        description={`Tem certeza que deseja remover a conta "${accountToDelete}" deste dispositivo?`}
        warningText="O cofre encriptado continuará salvo em seus backups ou Google Drive, mas deixará de aparecer nesta máquina."
        confirmText="Remover Conta"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={executeAccountDeletion}
        onClose={() => setAccountToDelete(null)}
      />

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
