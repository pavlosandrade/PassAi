'use client';

import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, KeyRound, Copy, Check, AlertCircle, ArrowRight, Cloud } from 'lucide-react';
import { evaluatePasswordStrength, generatePassword } from '@/utils/passwordGen';
import { copyToClipboard } from '@/utils/clipboard';
import { UserProfile, VaultData } from '@/types/vault';
import { DEFAULT_FOLDERS } from '@/services/folderService';
import { deriveKeyFromPassword } from '@/crypto/pbkdf2';
import { encryptData } from '@/crypto/cipher';
import { saveEncryptedVaultForUser, registerAccountProfile } from '@/services/storageService';
import { uploadVaultToDrive } from '@/services/googleDriveService';
import { registerBiometricVault, isWebAuthnSupported } from '@/services/webAuthnService';

interface GoogleInitialSetupModalProps {
  googleEmail: string;
  googleName: string;
  authToken: string;
  onComplete: (email: string, masterPassword: string) => Promise<void>;
  onCancel: () => void;
}

export default function GoogleInitialSetupModal({
  googleEmail,
  googleName,
  authToken,
  onComplete,
  onCancel,
}: GoogleInitialSetupModalProps) {
  const [name, setName] = useState(googleName || googleEmail.split('@')[0]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [enableBiometrics, setEnableBiometrics] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Chave de recuperação gerada
  const [recoveryKey] = useState(() => {
    const raw = generatePassword({ length: 16, useUppercase: true, useLowercase: false, useNumbers: true, useSymbols: false });
    return `PASS-${raw.substring(0, 4)}-${raw.substring(4, 8)}-${raw.substring(8, 12)}-${raw.substring(12, 16)}`;
  });

  const strength = evaluatePasswordStrength(password);
  const webAuthnAvailable = isWebAuthnSupported();

  const handleCopyRecoveryKey = async () => {
    const success = await copyToClipboard(recoveryKey, { autoClearSeconds: 0 });
    if (success) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor, informe seu nome.');
      return;
    }

    if (password.length < 8) {
      setError('A Senha Mestra deve ter no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Digite novamente.');
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanEmail = googleEmail.trim().toLowerCase();
      const userProfile: UserProfile = {
        name: name.trim(),
        email: cleanEmail,
        passwordHint: passwordHint.trim() || undefined,
        recoveryKey,
        syncMode: 'gdrive',
        createdAt: new Date().toISOString(),
      };

      const initialVault: VaultData = {
        version: '1.0.0',
        userProfile,
        folders: DEFAULT_FOLDERS,
        credentials: [],
      };

      // Deriva chave e criptografa o cofre
      const { key, salt } = await deriveKeyFromPassword(password);
      const encrypted = await encryptData(initialVault, key, salt);

      // Salva localmente e no índice de contas
      await saveEncryptedVaultForUser(cleanEmail, encrypted, userProfile.name);
      await registerAccountProfile(userProfile);

      // Sincroniza o cofre inicial com o Google Drive
      if (authToken) {
        await uploadVaultToDrive(encrypted, authToken).catch((gErr) => {
          console.warn('Aviso ao sincronizar primeiro cofre no Google Drive:', gErr);
        });
      }

      // Se biometria ativada, tenta registrar
      if (enableBiometrics && webAuthnAvailable) {
        try {
          await registerBiometricVault(cleanEmail, password);
        } catch (bErr) {
          console.warn('Registro biométrico ignorado/cancelado:', bErr);
        }
      }

      await onComplete(cleanEmail, password);
    } catch (err: any) {
      setError(err.message || 'Erro ao criar o cofre seguro com o Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5, 7, 15, 0.85)', backdropFilter: 'blur(8px)', padding: '1.5rem' }}>
      <div className="glass-panel animate-scale-up" style={{ maxWidth: '500px', width: '100%', padding: '2.25rem', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.85rem', background: 'rgba(0, 242, 254, 0.12)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: 'var(--radius-full)', marginBottom: '0.75rem' }}>
            <Cloud style={{ width: '32px', height: '32px', color: 'var(--accent-cyan)' }} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Primeiro Acesso com o <span className="gradient-text">Google</span>
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.4 }}>
            Conectado como <strong style={{ color: 'var(--accent-cyan)' }}>{googleEmail}</strong>.<br />
            Defina sua Senha Mestra para trancar e proteger seu cofre 100% criptografado.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {error && (
            <div className="animate-fade-in" style={{ padding: '0.75rem 1rem', background: 'rgba(255, 42, 109, 0.15)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle style={{ width: '18px', height: '18px', color: 'var(--color-danger)', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Nome de Exibição */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Seu Nome de Exibição
            </label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome completo"
              required
            />
          </div>

          {/* Senha Mestra */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Crie sua Senha Mestra *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field font-mono"
                placeholder="No mínimo 8 caracteres..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.2rem', paddingRight: '2.5rem' }}
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

            {password && (
              <div style={{ marginTop: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Força da Senha:</span>
                  <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                </div>
                <div style={{ height: '4px', width: '100%', background: 'rgba(255, 255, 255, 0.1)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${strength.score}%`, background: strength.color, transition: 'all 0.3s ease' }} />
                </div>
              </div>
            )}
          </div>

          {/* Confirmar Senha */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Confirmar Senha Mestra *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field font-mono"
              placeholder="Repita sua senha mestra..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {/* Dica da Senha (Opcional) */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Dica da Senha (Opcional)
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="ex: Minha frase favorita..."
              value={passwordHint}
              onChange={(e) => setPasswordHint(e.target.value)}
            />
          </div>

          {/* Opção Biometria se disponível */}
          {webAuthnAvailable && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer', padding: '0.5rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
              <input
                type="checkbox"
                checked={enableBiometrics}
                onChange={(e) => setEnableBiometrics(e.target.checked)}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              <span>Ativar desbloqueio rápido por Biometria / Windows Hello / Digital neste aparelho</span>
            </label>
          )}

          {/* Chave de Recuperação */}
          <div className="glass-card" style={{ padding: '0.85rem', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <KeyRound size={14} /> Chave de Recuperação de Emergência:
              </span>
              <button
                type="button"
                className="btn"
                onClick={handleCopyRecoveryKey}
                style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.1)' }}
              >
                {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                {copiedKey ? 'Copiada' : 'Copiar'}
              </button>
            </div>
            <span className="font-mono" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em', display: 'block' }}>
              {recoveryKey}
            </span>
          </div>

          {/* Botões de Ação */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{ flex: 1, padding: '0.85rem' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ flex: 2, padding: '0.85rem' }}
            >
              {isSubmitting ? 'Criando Cofre...' : (
                <>
                  Criar Cofre Seguro
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
