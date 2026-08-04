import { useState, useEffect } from 'react';
import { Shield, Lock, Eye, EyeOff, KeyRound, Mail, UserPlus, Upload, AlertCircle, RefreshCw, Check, ShieldCheck, FileCheck, Cloud } from 'lucide-react';
import { UserProfile, VaultData } from '@/types/vault';
import { authenticateGoogleDrive, downloadVaultFromDrive } from '@/services/googleDriveService';
import { deriveKeyFromPassword } from '@/crypto/pbkdf2';
import { decryptData } from '@/crypto/cipher';
import { saveEncryptedVaultForUser } from '@/services/storageService';
import PrivacyPolicyModal from '@/components/legal/PrivacyPolicyModal';
import TermsOfServiceModal from '@/components/legal/TermsOfServiceModal';

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
  const [email, setEmail] = useState(userProfile?.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({});
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    if (userProfile?.email && !email) {
      setEmail(userProfile.email);
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setInvalidFields({});

    const newInvalid: Record<string, boolean> = {};
    if (!email.trim()) newInvalid.email = true;
    if (!password) newInvalid.password = true;

    if (Object.keys(newInvalid).length > 0) {
      setInvalidFields(newInvalid);
      setError('Por favor, preencha o E-mail e a Senha Mestra.');
      return;
    }

    setIsSubmitting(true);

    try {
      const isOk = await onLogin(email.trim(), password);
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
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao importar arquivo de backup.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem' }}>
        
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(0, 242, 254, 0.1)', border: '1px solid rgba(0, 242, 254, 0.25)', borderRadius: 'var(--radius-full)', marginBottom: '1rem' }}>
            <Shield style={{ width: '36px', height: '36px', color: 'var(--accent-cyan)' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Entrar no <span className="gradient-text">PassAi</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Informe seu e-mail e senha mestra para acessar seu cofre.
          </p>
        </div>

        {/* Form with noValidate to disable native browser tooltips */}
        <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div className="animate-fade-in" style={{ padding: '0.75rem 1rem', background: 'rgba(255, 42, 109, 0.15)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle style={{ width: '18px', height: '18px', color: 'var(--color-danger)', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="animate-fade-in" style={{ padding: '0.75rem 1rem', background: 'rgba(0, 245, 160, 0.15)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-emerald)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check style={{ width: '18px', height: '18px', color: 'var(--accent-emerald)', flexShrink: 0 }} />
              <span>{success}</span>
            </div>
          )}

          {/* E-mail Input */}
          <div>
            <label htmlFor="login-email" style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              E-mail do Usuário
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-email"
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
                autoFocus={!email}
              />
            </div>
          </div>

          {/* Master Password Input */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <label htmlFor="login-password" style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                Senha Mestra
              </label>

              <button
                type="button"
                onClick={onNavigateToRecovery}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', fontSize: '0.78rem', cursor: 'pointer' }}
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
                  boxShadow: invalidFields.password ? '0 0 10px rgba(255, 42, 109, 0.3)' : undefined,
                }}
                autoFocus={!!email}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
            style={{ width: '100%', padding: '0.85rem' }}
          >
            {isSubmitting ? (
              <>
                <RefreshCw style={{ width: '18px', height: '18px', animation: 'spin 1s linear infinite' }} />
                Autenticando...
              </>
            ) : (
              <>
                <KeyRound size={18} />
                Entrar no Cofre
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'center', fontSize: '0.82rem' }}>
          
          <button
            type="button"
            onClick={onNavigateToRegister}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
          >
            <UserPlus size={15} style={{ color: 'var(--accent-cyan)' }} />
            Não possui um cofre? <strong style={{ color: 'var(--accent-cyan)' }}>Criar Conta</strong>
          </button>

          <button
            type="button"
            onClick={async () => {
              setError('');
              setSuccess('');
              try {
                const token = await authenticateGoogleDrive();
                const remote = await downloadVaultFromDrive(token);
                if (remote && remote.payload) {
                  if (remote.payload.ciphertext && password) {
                    const { key } = await deriveKeyFromPassword(password, remote.payload.salt);
                    const vault = await decryptData<VaultData>(remote.payload, key);
                    if (vault.userProfile?.email) {
                      await saveEncryptedVaultForUser(vault.userProfile.email, remote.payload, vault.userProfile.name);
                      await onLogin(vault.userProfile.email, password);
                      return;
                    }
                  }
                  setSuccess('Cofre localizado no Google Drive! Digite sua Senha Mestra e clique em "Entrar no Cofre".');
                } else {
                  setError('Nenhum cofre do PassAi foi encontrado no seu Google Drive.');
                }
              } catch (err: any) {
                setError(err.message || 'Erro ao carregar do Google Drive.');
              }
            }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
          >
            <Cloud size={15} />
            Baixar / Restaurar do Google Drive
          </button>

          <label style={{ cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
            <Upload size={14} />
            Restaurar de arquivo de backup (.json)
            <input type="file" accept=".json" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>

          {/* Legal Links */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <button
              type="button"
              onClick={() => setShowPrivacyModal(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Política de Privacidade
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setShowTermsModal(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Termos de Uso
            </button>
          </div>
        </div>

      </div>

      {showPrivacyModal && <PrivacyPolicyModal onClose={() => setShowPrivacyModal(false)} />}
      {showTermsModal && <TermsOfServiceModal onClose={() => setShowTermsModal(false)} />}
    </div>
  );
}
