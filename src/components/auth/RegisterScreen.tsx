'use client';

import { useState } from 'react';
import { Shield, Lock, Eye, EyeOff, User, Mail, HelpCircle, ArrowRight, KeyRound, Copy, Check, LogIn } from 'lucide-react';
import { evaluatePasswordStrength, generatePassword } from '@/utils/passwordGen';
import { copyToClipboard } from '@/utils/clipboard';
import { userVaultExists } from '@/services/storageService';

interface RegisterScreenProps {
  onRegisterComplete: (name: string, email: string, masterPassword: string, passwordHint?: string, recoveryKey?: string) => void;
  onNavigateToLogin: () => void;
}

export default function RegisterScreen({ onRegisterComplete, onNavigateToLogin }: RegisterScreenProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chave de recuperação de emergência gerada no cadastro
  const [generatedRecoveryKey] = useState(() => {
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

    if (!name.trim()) {
      setError('Por favor, informe seu nome.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setError('Por favor, informe um e-mail válido.');
      return;
    }

    if (password.length < 8) {
      setError('A Senha Mestra deve possuir no mínimo 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Digite novamente.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Verifica se o e-mail já existe nesta máquina
      const exists = await userVaultExists(email.trim());
      if (exists) {
        setError('Já existe um cofre cadastrado para este e-mail neste dispositivo. Faça login ou use outro e-mail.');
        setIsSubmitting(false);
        return;
      }

      onRegisterComplete(name.trim(), email.trim(), password, passwordHint.trim() || undefined, generatedRecoveryKey);
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

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {error && (
            <div style={{ padding: '0.75rem 1rem', background: 'rgba(255, 42, 109, 0.15)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
              {error}
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
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '2.2rem' }}
                  required
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
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ paddingLeft: '2.2rem' }}
                  required
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
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.2rem', paddingRight: '2.5rem' }}
                required
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
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
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
        <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', textAlign: 'center', fontSize: '0.82rem' }}>
          <button
            type="button"
            onClick={onNavigateToLogin}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
          >
            <LogIn size={15} style={{ color: 'var(--accent-cyan)' }} />
            Já possui uma conta? <strong style={{ color: 'var(--accent-cyan)' }}>Fazer Login</strong>
          </button>
        </div>

      </div>
    </div>
  );
}
