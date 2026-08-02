'use client';

import { useState } from 'react';
import { Shield, KeyRound, HelpCircle, Upload, ArrowLeft, Check, AlertCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { UserProfile } from '@/types/vault';

interface RecoveryScreenProps {
  userProfile?: UserProfile;
  onResetWithNewMasterPassword: (newMasterPassword: string) => Promise<void>;
  onRestoreBackup: (file: File, masterPassword?: string) => Promise<{ success: boolean; email?: string; message?: string } | void>;
  onNavigateToLogin: () => void;
}

export default function RecoveryScreen({
  userProfile,
  onResetWithNewMasterPassword,
  onRestoreBackup,
  onNavigateToLogin,
}: RecoveryScreenProps) {
  const [activeTab, setActiveTab] = useState<'key' | 'hint' | 'backup'>('key');
  
  // Tab 1: Chave de Recuperação
  const [inputRecoveryKey, setInputRecoveryKey] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingKey, setIsSubmittingKey] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({});

  // Status e Erros
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRecoveryKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInvalidFields({});

    const newInvalid: Record<string, boolean> = {};

    // Se o perfil tiver recoveryKey salva, valida contra ela
    if (userProfile?.recoveryKey) {
      const cleanInput = inputRecoveryKey.trim().toUpperCase();
      const cleanStored = userProfile.recoveryKey.trim().toUpperCase();

      if (cleanInput !== cleanStored) {
        newInvalid.recoveryKey = true;
        setError('Chave de Recuperação incorreta. Verifique os caracteres.');
        setInvalidFields(newInvalid);
        return;
      }
    } else if (inputRecoveryKey.trim().length < 8) {
      newInvalid.recoveryKey = true;
      setError('Formato de Chave de Recuperação inválido.');
      setInvalidFields(newInvalid);
      return;
    }

    if (newPassword.length < 8) {
      newInvalid.newPassword = true;
      setError('A nova Senha Mestra deve possuir no mínimo 8 caracteres.');
      setInvalidFields(newInvalid);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      newInvalid.confirmNewPassword = true;
      setError('As senhas não coincidem.');
      setInvalidFields(newInvalid);
      return;
    }

    setIsSubmittingKey(true);

    try {
      await onResetWithNewMasterPassword(newPassword);
      setSuccess('Senha Mestra redefinida com sucesso! Redirecionando...');
      setTimeout(() => {
        onNavigateToLogin();
      }, 1200);
    } catch {
      setError('Erro ao redefinir a Senha Mestra.');
    } finally {
      setIsSubmittingKey(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setSuccess('');

    try {
      const res = await onRestoreBackup(file);
      setSuccess(res?.message || 'Cofre restaurado a partir do backup! Redirecionando...');
      setTimeout(() => {
        onNavigateToLogin();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Erro ao importar arquivo de backup.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem' }}>
        
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(255, 183, 3, 0.12)', border: '1px solid rgba(255, 183, 3, 0.3)', borderRadius: 'var(--radius-full)', marginBottom: '0.75rem' }}>
            <KeyRound style={{ width: '36px', height: '36px', color: 'var(--accent-amber)' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Recuperação de <span className="gradient-text">Acesso</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Escolha o método para recuperar ou redefinir seu cofre PassAi.
          </p>
        </div>

        {/* Method Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.3)', padding: '0.3rem', borderRadius: 'var(--radius-sm)' }}>
          <button
            onClick={() => { setActiveTab('key'); setError(''); setSuccess(''); }}
            className="btn"
            style={{
              padding: '0.45rem',
              fontSize: '0.75rem',
              background: activeTab === 'key' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
              color: activeTab === 'key' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Chave
          </button>

          <button
            onClick={() => { setActiveTab('hint'); setError(''); setSuccess(''); }}
            className="btn"
            style={{
              padding: '0.45rem',
              fontSize: '0.75rem',
              background: activeTab === 'hint' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
              color: activeTab === 'hint' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Dica
          </button>

          <button
            onClick={() => { setActiveTab('backup'); setError(''); setSuccess(''); }}
            className="btn"
            style={{
              padding: '0.45rem',
              fontSize: '0.75rem',
              background: activeTab === 'backup' ? 'rgba(0, 242, 254, 0.2)' : 'transparent',
              color: activeTab === 'backup' ? 'var(--accent-cyan)' : 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
            }}
          >
            Backup JSON
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div className="animate-fade-in" style={{ padding: '0.75rem 1rem', background: 'rgba(255, 42, 109, 0.15)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <AlertCircle size={18} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="animate-fade-in" style={{ padding: '0.75rem 1rem', background: 'rgba(0, 245, 160, 0.15)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-emerald)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Check size={18} />
            <span>{success}</span>
          </div>
        )}

        {/* TAB 1: Chave de Recuperação with noValidate */}
        {activeTab === 'key' && (
          <form noValidate onSubmit={handleRecoveryKeySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Chave de Recuperação de Emergência
              </label>
              <input
                type="text"
                className="input-field font-mono"
                placeholder="PASS-XXXX-XXXX-XXXX-XXXX"
                value={inputRecoveryKey}
                onChange={(e) => {
                  setInputRecoveryKey(e.target.value);
                  if (invalidFields.recoveryKey) setInvalidFields((prev) => ({ ...prev, recoveryKey: false }));
                }}
                style={{
                  borderColor: invalidFields.recoveryKey ? 'var(--color-danger)' : undefined,
                  boxShadow: invalidFields.recoveryKey ? '0 0 10px rgba(255, 42, 109, 0.3)' : undefined,
                }}
                autoFocus
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Nova Senha Mestra
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input-field font-mono"
                  placeholder="Mínimo 8 caracteres..."
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (invalidFields.newPassword) setInvalidFields((prev) => ({ ...prev, newPassword: false }));
                  }}
                  style={{
                    borderColor: invalidFields.newPassword ? 'var(--color-danger)' : undefined,
                    boxShadow: invalidFields.newPassword ? '0 0 10px rgba(255, 42, 109, 0.3)' : undefined,
                  }}
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Confirmar Nova Senha Mestra
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field font-mono"
                placeholder="Repita a nova senha..."
                value={confirmNewPassword}
                onChange={(e) => {
                  setConfirmNewPassword(e.target.value);
                  if (invalidFields.confirmNewPassword) setInvalidFields((prev) => ({ ...prev, confirmNewPassword: false }));
                }}
                style={{
                  borderColor: invalidFields.confirmNewPassword ? 'var(--color-danger)' : undefined,
                  boxShadow: invalidFields.confirmNewPassword ? '0 0 10px rgba(255, 42, 109, 0.3)' : undefined,
                }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={isSubmittingKey} style={{ padding: '0.85rem', marginTop: '0.3rem' }}>
              {isSubmittingKey ? 'Redefinindo Senha...' : 'Redefinir Senha Mestra'}
            </button>
          </form>
        )}

        {/* TAB 2: Dica de Senha */}
        {activeTab === 'hint' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <HelpCircle size={40} style={{ color: 'var(--accent-cyan)', marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Dica de Senha Cadastrada
            </h3>

            {userProfile?.passwordHint ? (
              <div className="glass-card" style={{ padding: '1.25rem', marginTop: '1rem', border: '1px solid var(--border-glow)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  Lembrete configurado por {userProfile.name}:
                </span>
                <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                  "{userProfile.passwordHint}"
                </span>
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Nenhuma dica de senha foi cadastrada para este perfil. Utilize a Chave de Recuperação ou um arquivo de Backup JSON.
              </p>
            )}
          </div>
        )}

        {/* TAB 3: Restaurar Backup */}
        {activeTab === 'backup' && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <label className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', padding: '1.75rem', border: '1px dashed var(--border-glow)', cursor: 'pointer' }}>
              <Upload size={32} style={{ color: 'var(--accent-cyan)' }} />
              <div>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, display: 'block', color: 'var(--text-primary)' }}>
                  Carregar Arquivo JSON de Backup
                </span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Restaure seu cofre e perfil instantaneamente
                </span>
              </div>
              <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
            </label>
          </div>
        )}

        {/* Footer Navigation */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onNavigateToLogin}
            style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem' }}
          >
            <ArrowLeft size={16} />
            Voltar para o Login
          </button>
        </div>

      </div>
    </div>
  );
}
