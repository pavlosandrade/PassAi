'use client';

import { useState } from 'react';
import { Lock, KeyRound, AlertCircle, X } from 'lucide-react';
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

    if (!pin) {
      setError('Por favor, digite o PIN da pasta.');
      return;
    }

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
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '420px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* STICKY HEADER */}
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', flexShrink: 0, zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={18} style={{ color: 'var(--accent-amber)' }} />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Pasta Protegida: {folder.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* SCROLLABLE BODY */}
          <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
              Esta pasta requer a confirmação da **sua 2ª camada de segurança (PIN/Senha)** para liberar a visualização das credenciais.
            </p>

            {error && (
              <div className="animate-fade-in" style={{ padding: '0.65rem 0.85rem', background: 'rgba(255, 42, 109, 0.15)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <AlertCircle size={16} style={{ color: 'var(--color-danger)', flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                PIN / Senha da Pasta
              </label>
              <input
                type="password"
                className="input-field font-mono"
                placeholder="Digite o PIN da pasta..."
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError('');
                }}
                style={{
                  borderColor: error ? 'var(--color-danger)' : undefined,
                  boxShadow: error ? '0 0 10px rgba(255, 42, 109, 0.3)' : undefined,
                }}
                autoFocus
              />
            </div>
          </div>

          {/* STICKY FOOTER */}
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border-light)', background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', flexShrink: 0, zIndex: 10 }}>
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
