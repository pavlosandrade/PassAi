import { useState, useEffect } from 'react';
import { UserProfile, VaultData } from '@/types/vault';
import { X, User, Mail, KeyRound, HelpCircle, Shield, Copy, Check, Folder, Star, Key, RefreshCw, Fingerprint, Lock, Trash2 } from 'lucide-react';
import { copyToClipboard } from '@/utils/clipboard';
import { isBiometricVaultAvailable, registerBiometricVault, removeBiometricVault, isWebAuthnSupported } from '@/services/webAuthnService';

interface AccountProfileModalProps {
  userProfile: UserProfile;
  vaultData: VaultData;
  onClose: () => void;
  onOpenSyncModal?: () => void;
}

export default function AccountProfileModal({
  userProfile,
  vaultData,
  onClose,
  onOpenSyncModal,
}: AccountProfileModalProps) {
  const [copiedKey, setCopiedKey] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [bioMessage, setBioMessage] = useState('');
  const [bioError, setBioError] = useState('');

  useEffect(() => {
    if (isWebAuthnSupported()) {
      setHasBiometrics(isBiometricVaultAvailable(userProfile.email));
    }
  }, [userProfile.email]);

  const handleEnableBiometrics = async () => {
    if (!passwordInput) {
      setBioError('Digite sua Senha Mestra para vincular à biometria.');
      return;
    }
    setBioError('');
    setBioMessage('');
    try {
      await registerBiometricVault(userProfile.email, passwordInput);
      setHasBiometrics(true);
      setShowPasswordForm(false);
      setPasswordInput('');
      setBioMessage('Biometria / Digital vinculada com sucesso neste dispositivo!');
    } catch (err: any) {
      setBioError(err.message || 'Erro ao registrar biometria.');
    }
  };

  const handleRemoveBiometrics = () => {
    removeBiometricVault(userProfile.email);
    setHasBiometrics(false);
    setBioMessage('Biometria removida deste aparelho.');
  };

  const totalCredentials = vaultData.credentials.length;
  const totalFolders = vaultData.folders.length;
  const totalFavorites = vaultData.credentials.filter((c) => c.isFavorite).length;

  const handleCopyRecoveryKey = async () => {
    if (!userProfile.recoveryKey) return;
    const success = await copyToClipboard(userProfile.recoveryKey, { autoClearSeconds: 0 });
    if (success) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }}>
      <div className="glass-panel animate-fade-in modal-box" style={{ maxWidth: '480px', padding: 0 }}>
        
        {/* STICKY HEADER */}
        <div className="modal-header" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(0, 242, 254, 0.12)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: 'var(--radius-sm)' }}>
              <User size={20} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Minha Conta</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Perfil local do cofre de senhas</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Profile Basic Info */}
          <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem', border: '1px solid var(--border-glow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 700, color: '#050811' }}>
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {userProfile.name}
                </h3>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                  <Mail size={14} style={{ color: 'var(--accent-cyan)' }} />
                  {userProfile.email}
                </span>
              </div>
            </div>
          </div>

          {/* Emergency Recovery Key */}
          {userProfile.recoveryKey && (
            <div className="glass-card" style={{ padding: '1.1rem', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <KeyRound size={14} /> Chave de Recuperação de Emergência
                </span>
                <button
                  type="button"
                  className="btn"
                  onClick={handleCopyRecoveryKey}
                  style={{ padding: '0.25rem 0.55rem', fontSize: '0.72rem', background: 'rgba(255, 255, 255, 0.1)' }}
                >
                  {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                  {copiedKey ? 'Copiada' : 'Copiar'}
                </button>
              </div>
              <span className="font-mono" style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em', display: 'block' }}>
                {userProfile.recoveryKey}
              </span>
            </div>
          )}

          {/* Password Hint */}
          {userProfile.passwordHint && (
            <div className="glass-card" style={{ padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                <HelpCircle size={14} style={{ color: 'var(--accent-amber)' }} /> Dica da Senha Mestra
              </span>
              <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                "{userProfile.passwordHint}"
              </span>
            </div>
          )}

          {/* Biometrics Settings Card */}
          <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(0, 245, 160, 0.3)', background: 'rgba(0, 245, 160, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Fingerprint size={20} style={{ color: 'var(--accent-emerald)' }} />
                <div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                    Desbloqueio por Biometria / Passkey
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {hasBiometrics ? 'Ativo neste dispositivo (Touch ID / Face ID / Windows Hello)' : 'Desativado neste dispositivo'}
                  </span>
                </div>
              </div>

              {hasBiometrics ? (
                <button
                  type="button"
                  className="btn"
                  onClick={handleRemoveBiometrics}
                  style={{ background: 'rgba(255, 42, 109, 0.15)', color: 'var(--color-danger)', border: '1px solid var(--color-danger)', fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  <Trash2 size={13} /> Desativar
                </button>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                >
                  Ativar Biometria
                </button>
              )}
            </div>

            {bioMessage && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--accent-emerald)', fontWeight: 600 }}>
                {bioMessage}
              </div>
            )}

            {bioError && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                {bioError}
              </div>
            )}

            {showPasswordForm && !hasBiometrics && (
              <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Confirme sua Senha Mestra para cadastrar a biometria:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="password"
                    className="input-field font-mono"
                    placeholder="Sua senha mestra..."
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                  <button type="button" className="btn btn-primary" onClick={handleEnableBiometrics} style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                    Vincular
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Vault Statistics */}
          <div>
            <h4 style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Estatísticas do Cofre
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
              <div className="glass-card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                <Key size={18} style={{ color: 'var(--accent-cyan)', marginBottom: '0.2rem' }} />
                <span style={{ fontSize: '1.2rem', fontWeight: 700, display: 'block', color: 'var(--text-primary)' }}>{totalCredentials}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Senhas</span>
              </div>

              <div className="glass-card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                <Folder size={18} style={{ color: 'var(--accent-blue)', marginBottom: '0.2rem' }} />
                <span style={{ fontSize: '1.2rem', fontWeight: 700, display: 'block', color: 'var(--text-primary)' }}>{totalFolders}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Pastas</span>
              </div>

              <div className="glass-card" style={{ padding: '0.85rem', textAlign: 'center' }}>
                <Star size={18} style={{ color: 'var(--accent-amber)', marginBottom: '0.2rem' }} />
                <span style={{ fontSize: '1.2rem', fontWeight: 700, display: 'block', color: 'var(--text-primary)' }}>{totalFavorites}</span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Favoritos</span>
              </div>
            </div>
          </div>

          {/* Legal Document Links */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}
            >
              Política de Privacidade
            </a>
            <span>•</span>
            <a
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}
            >
              Termos de Uso
            </a>
          </div>

        </div>

        {/* STICKY FOOTER */}
        <div className="modal-footer" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
          {onOpenSyncModal ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                onClose();
                onOpenSyncModal();
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)' }}
            >
              <RefreshCw size={14} /> Sincronização
            </button>
          ) : <div />}

          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
}
