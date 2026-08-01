'use client';

import { useState } from 'react';
import { Credential } from '@/types/vault';
import { Eye, EyeOff, Copy, Check, Star, ExternalLink, Edit3, Trash2, ShieldCheck, Lock } from 'lucide-react';
import { copyToClipboard } from '@/utils/clipboard';

interface CredentialCardProps {
  credential: Credential;
  folderName?: string;
  isFolderProtected?: boolean;
  isUnlockedByPin?: boolean;
  onToggleFavorite: (id: string) => void;
  onEdit: (credential: Credential) => void;
  onDelete: (id: string) => void;
  onRequestPinUnlock?: () => void;
}

export default function CredentialCard({
  credential,
  folderName,
  isFolderProtected = false,
  isUnlockedByPin = false,
  onToggleFavorite,
  onEdit,
  onDelete,
  onRequestPinUnlock,
}: CredentialCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);
  const [clearTimerSeconds, setClearTimerSeconds] = useState<number | null>(null);

  const handleCopyPassword = async () => {
    if (isFolderProtected && !isUnlockedByPin && onRequestPinUnlock) {
      onRequestPinUnlock();
      return;
    }

    const success = await copyToClipboard(credential.password, {
      autoClearSeconds: 15,
      onCleared: () => setClearTimerSeconds(null),
    });

    if (success) {
      setCopiedField('password');
      setClearTimerSeconds(15);

      // Regressão simples para feedback visual do timer
      const interval = setInterval(() => {
        setClearTimerSeconds((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(interval);
            return null;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handleCopyUsername = async () => {
    const success = await copyToClipboard(credential.username, { autoClearSeconds: 0 });
    if (success) {
      setCopiedField('username');
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const isMaskedByPin = isFolderProtected && !isUnlockedByPin;

  return (
    <div className="glass-card animate-fade-in" style={{ padding: '1.25rem', position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      {/* Header Card: Title, Folder & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {credential.title}
            </h3>
            {credential.url && (
              <a
                href={credential.url.startsWith('http') ? credential.url : `https://${credential.url}`}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--accent-blue)', display: 'inline-flex', alignItems: 'center' }}
                title="Abrir site"
              >
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          {folderName && (
            <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--radius-full)', color: 'var(--text-muted)' }}>
              {folderName}
            </span>
          )}
        </div>

        {/* Favorite & Options */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            onClick={() => onToggleFavorite(credential.id)}
            style={{ background: 'none', border: 'none', color: credential.isFavorite ? 'var(--accent-amber)' : 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
            title={credential.isFavorite ? 'Remover dos Favoritos' : 'Adicionar aos Favoritos'}
          >
            <Star size={18} fill={credential.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button
            onClick={() => onEdit(credential)}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
            title="Editar credencial"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => onDelete(credential.id)}
            style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', padding: '0.25rem', opacity: 0.8 }}
            title="Excluir credencial"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Fields: Username & Password */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        
        {/* Username Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Usuário / E-mail</span>
            <span className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{credential.username}</span>
          </div>
          <button
            onClick={handleCopyUsername}
            className="btn"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)' }}
            title="Copiar usuário"
          >
            {copiedField === 'username' ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
          </button>
        </div>

        {/* Password Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)' }}>
          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '0.5rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Senha
              {clearTimerSeconds !== null && (
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
                  ⏱️ Limpa em {clearTimerSeconds}s
                </span>
              )}
            </span>

            <span className="font-mono" style={{ fontSize: '0.85rem', color: isMaskedByPin ? 'var(--accent-amber)' : 'var(--text-primary)' }}>
              {isMaskedByPin ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.78rem' }}>
                  <Lock size={12} /> Bloqueada por PIN
                </span>
              ) : showPassword ? (
                credential.password
              ) : (
                '••••••••••••••••'
              )}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.35rem' }}>
            {!isMaskedByPin && (
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="btn"
                style={{ padding: '0.35rem 0.5rem', fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)' }}
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}

            <button
              onClick={handleCopyPassword}
              className="btn btn-primary"
              style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
              title="Copiar senha (auto-limpeza em 15s)"
            >
              {copiedField === 'password' ? (
                <Check size={14} />
              ) : (
                <>
                  <Copy size={14} />
                  Copiar
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Notes if present */}
      {credential.notes && (
        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: 'var(--radius-sm)', lineHeight: 1.4 }}>
          {credential.notes}
        </p>
      )}
    </div>
  );
}
