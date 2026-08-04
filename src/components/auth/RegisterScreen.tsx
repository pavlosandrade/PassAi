'use client';

import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, User, Mail, HelpCircle, ArrowRight, KeyRound, Copy, Check, LogIn, AlertCircle } from 'lucide-react';
import { evaluatePasswordStrength, generatePassword } from '@/utils/passwordGen';
import { copyToClipboard } from '@/utils/clipboard';
import { userVaultExists } from '@/services/storageService';
import { UserProfile } from '@/types/vault';
import { SyncMode } from '@/types/sync';

interface RegisterScreenProps {
  initialProfile?: UserProfile;
  onRegisterComplete: (name: string, email: string, masterPassword: string, passwordHint?: string, recoveryKey?: string, syncMode?: SyncMode) => void;
  onNavigateToLogin: () => void;
}

export default function RegisterScreen({ initialProfile, onRegisterComplete, onNavigateToLogin }: RegisterScreenProps) {
  const [name, setName] = useState(initialProfile?.name || '');
  const [email, setEmail] = useState(initialProfile?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState(initialProfile?.passwordHint || '');
  const [syncMode, setSyncMode] = useState<SyncMode>(initialProfile?.syncMode || 'offline');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({});

  // Chave de recuperação de emergência gerada no cadastro
  const [generatedRecoveryKey] = useState(() => {
    if (initialProfile?.recoveryKey) {
      return initialProfile.recoveryKey;
    }
    const raw = generatePassword({ length: 16, useUppercase: true, useLowercase: false, useNumbers: true, useSymbols: false });
    return `PASS-${raw.substring(0, 4)}-${raw.substring(4, 8)}-${raw.substring(8, 12)}-${raw.substring(12, 16)}`;
  });

  const [copiedKey, setCopiedKey] = useState(false);

  const strength = evaluatePasswordStrength(password);

  const handleCopyRecoveryKey = async () => {
    const success = await copyToClipboard(generatedRecoveryKey, { autoClearSeconds: 0 });
    if (success) {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInvalidFields({});

    const newInvalid: Record<string, boolean> = {};

    if (!name.trim()) {
      newInvalid.name = true;
      setError('Por favor, informe seu nome.');
      setInvalidFields(newInvalid);
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      newInvalid.email = true;
      setError('Por favor, informe um e-mail válido.');
      setInvalidFields(newInvalid);
      return;
    }

    if (password.length < 8) {
      newInvalid.password = true;
      setError('A Senha Mestra deve possuir no mínimo 8 caracteres.');
      setInvalidFields(newInvalid);
      return;
    }

    if (password !== confirmPassword) {
      newInvalid.confirmPassword = true;
      setError('As senhas não coincidem. Digite novamente.');
      setInvalidFields(newInvalid);
      return;
    }

    setIsSubmitting(true);

    try {
      // Verifica se o e-mail já existe nesta máquina
      const exists = await userVaultExists(email.trim());
      if (exists) {
        setInvalidFields({ email: true });
        setError('Já existe um cofre cadastrado para este e-mail neste dispositivo. Faça login ou use outro e-mail.');
        setIsSubmitting(false);
        return;
      }

      onRegisterComplete(name.trim(), email.trim(), password, passwordHint.trim() || undefined, generatedRecoveryKey, syncMode);
    } catch {
      setError('Erro ao criar a conta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '520px', width: '100%', padding: '2.5rem' }}>
        
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: 'var(--radius-full)', marginBottom: '0.75rem' }}>
            <Shield style={{ width: '36px', height: '36px', color: 'var(--accent-cyan)' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Criar Conta <span className="gradient-text">PassAi</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }}>
            Cadastre seu perfil e crie seu cofre 100% criptografado no dispositivo.
          </p>
        </div>

        {/* Form with noValidate to disable native browser tooltips */}
        <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {error && (
            <div className="animate-fade-in" style={{ padding: '0.75rem 1rem', background: 'rgba(255, 42, 109, 0.15)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle style={{ width: '18px', height: '18px', color: 'var(--color-danger)', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Nome e E-mail Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Seu Nome *
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  placeholder="ex: Carlos Silva"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (invalidFields.name) setInvalidFields((prev) => ({ ...prev, name: false }));
                  }}
                  style={{
                    paddingLeft: '2.2rem',
                    borderColor: invalidFields.name ? 'var(--color-danger)' : undefined,
                    boxShadow: invalidFields.name ? '0 0 10px rgba(255, 42, 109, 0.3)' : undefined,
                  }}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                E-mail Principal *
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input-field"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (invalidFields.email) setInvalidFields((prev) => ({ ...prev, email: false }));
                  }}
                  style={{
                    paddingLeft: '2.2rem',
                    borderColor: invalidFields.email ? 'var(--color-danger)' : undefined,
                    boxShadow: invalidFields.email ? '0 0 10px rgba(255, 42, 109, 0.3)' : undefined,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Master Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Senha Mestra *
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field font-mono"
                placeholder="No mínimo 8 caracteres..."
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (invalidFields.password) setInvalidFields((prev) => ({ ...prev, password: false }));
                }}
                style={{
                  paddingLeft: '2.2rem',
                  paddingRight: '2.5rem',
                  borderColor: invalidFields.password ? 'var(--color-danger)' : undefined,
                  boxShadow: invalidFields.password ? '0 0 10px rgba(255, 42, 109, 0.3)' : undefined,
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

          {/* Confirm Password */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Confirmar Senha Mestra *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field font-mono"
              placeholder="Repita a senha mestra..."
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (invalidFields.confirmPassword) setInvalidFields((prev) => ({ ...prev, confirmPassword: false }));
              }}
              style={{
                borderColor: invalidFields.confirmPassword ? 'var(--color-danger)' : undefined,
                boxShadow: invalidFields.confirmPassword ? '0 0 10px rgba(255, 42, 109, 0.3)' : undefined,
              }}
            />
          </div>

          {/* Password Hint */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Dica da Senha (Opcional)
            </label>
            <div style={{ position: 'relative' }}>
              <HelpCircle size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="ex: Nome do primeiro pet + ano"
                value={passwordHint}
                onChange={(e) => setPasswordHint(e.target.value)}
                style={{ paddingLeft: '2.2rem' }}
              />
            </div>
          </div>

          {/* Sync Mode Selection */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Modo de Sincronização Desejado
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSyncMode('offline')}
                style={{
                  padding: '0.6rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  border: syncMode === 'offline' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                  background: syncMode === 'offline' ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Local / Offline
              </button>
              <button
                type="button"
                onClick={() => setSyncMode('gdrive')}
                style={{
                  padding: '0.6rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  border: syncMode === 'gdrive' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                  background: syncMode === 'gdrive' ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Google Drive
              </button>
              <button
                type="button"
                onClick={() => setSyncMode('webrtc')}
                style={{
                  padding: '0.6rem 0.4rem',
                  borderRadius: 'var(--radius-sm)',
                  border: syncMode === 'webrtc' ? '2px solid var(--accent-cyan)' : '1px solid var(--border-light)',
                  background: syncMode === 'webrtc' ? 'rgba(0, 242, 254, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                }}
              >
                Direto P2P
              </button>
            </div>
          </div>

          {/* Recovery Key Banner */}
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
            <span className="font-mono" style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em', display: 'block' }}>
              {generatedRecoveryKey}
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.85rem', marginTop: '0.4rem' }}
          >
            {isSubmitting ? 'Criando Conta...' : (
              <>
                Criar Conta e Cofre Seguro
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', textAlign: 'center', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={onNavigateToLogin}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
          >
            <LogIn size={15} style={{ color: 'var(--accent-cyan)' }} />
            Já possui uma conta? <strong style={{ color: 'var(--accent-cyan)' }}>Fazer Login</strong>
          </button>

          {/* Legal Links */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.2rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
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

      </div>
    </div>
  );
}
