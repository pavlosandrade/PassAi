'use client';

import { useState } from 'react';
import { Credential, Folder } from '@/types/vault';
import { X, KeyRound, Sparkles, Eye, EyeOff, Save, Wand2 } from 'lucide-react';
import { generatePassword, evaluatePasswordStrength } from '@/utils/passwordGen';

interface CredentialFormModalProps {
  initialData?: Credential | null;
  folders: Folder[];
  defaultFolderId?: string;
  onSave: (credentialData: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  onClose: () => void;
}

export default function CredentialFormModal({
  initialData,
  folders,
  defaultFolderId = 'default',
  onSave,
  onClose,
}: CredentialFormModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [username, setUsername] = useState(initialData?.username || '');
  const [password, setPassword] = useState(initialData?.password || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [folderId, setFolderId] = useState(initialData?.folderId || defaultFolderId);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isFavorite, setIsFavorite] = useState(initialData?.isFavorite || false);
  const [showPassword, setShowPassword] = useState(false);

  const strength = evaluatePasswordStrength(password);

  const handleGeneratePassword = () => {
    const generated = generatePassword({ length: 18, useUppercase: true, useLowercase: true, useNumbers: true, useSymbols: true });
    setPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !password) return;

    onSave(
      {
        title,
        username,
        password,
        url,
        folderId,
        notes,
        isFavorite,
      },
      initialData?.id
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '520px', width: '100%', padding: '2rem', position: 'relative' }}>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{ position: 'absolute', right: '1.25rem', top: '1.25rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <KeyRound style={{ color: 'var(--accent-cyan)' }} size={22} />
          {initialData ? 'Editar Credencial' : 'Nova Credencial'}
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Title */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              Título / Serviço *
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="ex: Google, Banco do Brasil, Netflix"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Username */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              Usuário / E-mail
            </label>
            <input
              type="text"
              className="input-field font-mono"
              placeholder="usuario@email.com"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Password with Generator Button */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Senha *
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
              >
                <Wand2 size={13} />
                Gerar Senha Forte
              </button>
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field font-mono"
                placeholder="Sua senha secreta..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Strength Meter */}
            {password && (
              <div style={{ marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Força:</span>
                <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
              </div>
            )}
          </div>

          {/* Folder Select & URL Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                Pasta
              </label>
              <select
                className="input-field"
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
              >
                {folders.map((f) => (
                  <option key={f.id} value={f.id} style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {f.name} {f.isProtected ? '🔒' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                URL / Site
              </label>
              <input
                type="text"
                className="input-field font-mono"
                placeholder="https://..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
              Notas Adicionais
            </label>
            <textarea
              className="input-field"
              rows={2}
              placeholder="Perguntas de segurança, observações..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: 'none' }}
            />
          </div>

          {/* Favorite Checkbox */}
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            <input
              type="checkbox"
              checked={isFavorite}
              onChange={(e) => setIsFavorite(e.target.checked)}
              style={{ accentColor: 'var(--accent-amber)' }}
            />
            <span>Marcar como Favorito ⭐</span>
          </label>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              Salvar Credencial
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
