'use client';

import { useState } from 'react';
import { Lock, KeyRound, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { Folder } from '@/types/vault';

interface ProtectedFolderModalProps {
  folder: Folder;
  onUnlockPin: (pin: string) => Promise<boolean>;
  onClose: () => void;
}

export default function ProtectedFolderModal({
  folder,
  onUnlockPin,
  onClose,
}: ProtectedFolderModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!pin) return;

    setIsVerifying(true);
    try {
      const isValid = await onUnlockPin(pin);
      if (!isValid) {
        setError('PIN/Senha de pasta incorreto.');
      }
    } catch {
      setError('Erro ao validar o PIN da pasta.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '420px', width: '100%', padding: '2rem', position: 'relative' }}>
        
        {/* Close */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', padding: '0.85rem', background: 'rgba(255, 183, 3, 0.15)', border: '1px solid rgba(255, 183, 3, 0.3)', borderRadius: 'var(--radius-full)', marginBottom: '0.75rem' }}>
            <Lock style={{ width: '32px', height: '32px', color: 'var(--accent-amber)' }} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '0.25rem' }}>
            Pasta Protegida: {folder.name}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Esta pasta requer uma **segunda camada de proteção (PIN/Senha)**.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && (
            <div style={{ padding: '0.65rem 0.85rem', background: 'rgba(255, 42, 109, 0.15)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              PIN / Senha da Pasta
            </label>
            <input
              type="password"
              className="input-field font-mono"
              placeholder="Digite o PIN da pasta..."
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isVerifying}>
              <KeyRound size={16} />
              {isVerifying ? 'Verificando...' : 'Liberar Acesso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
