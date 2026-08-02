'use client';

import { useState } from 'react';
import { X, Folder, Lock, Check, FolderPlus, FileText, ChevronRight } from 'lucide-react';
import { Folder as FolderType } from '@/types/vault';

interface FolderFormModalProps {
  initialData?: FolderType | null;
  parentFolderId?: string | null;
  existingFolders: FolderType[];
  onSave: (data: Omit<FolderType, 'id' | 'createdAt'>, id?: string) => Promise<void>;
  onClose: () => void;
}

const AVAILABLE_COLORS = [
  '#00f2fe', // Cyan
  '#4facfe', // Blue
  '#00f5a0', // Emerald
  '#ffb703', // Amber
  '#e100ff', // Purple
  '#ff2a6d', // Red/Pink
  '#00d2ff', // Sky
  '#9d4edd', // Violet
];

export default function FolderFormModal({
  initialData,
  parentFolderId,
  existingFolders,
  onSave,
  onClose,
}: FolderFormModalProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [parentId, setParentId] = useState<string | null>(
    initialData ? (initialData.parentId || null) : (parentFolderId || null)
  );
  const [color, setColor] = useState(initialData?.color || '#00f2fe');
  const [icon, setIcon] = useState(initialData?.icon || 'Folder');

  // Proteção por PIN
  const [isProtected, setIsProtected] = useState(initialData?.isProtected || false);
  const [pin, setPin] = useState(initialData?.pin || '');
  const [confirmPin, setConfirmPin] = useState(initialData?.pin || '');

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({});

  // Evita selecionar a própria pasta ou subpastas dela como pasta pai
  const validParentFolders = existingFolders.filter((f) => {
    if (!initialData) return true;
    if (f.id === initialData.id) return false;
    if (f.parentId === initialData.id) return false;
    return true;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInvalidFields({});

    const newInvalid: Record<string, boolean> = {};

    if (!name.trim()) {
      newInvalid.name = true;
      setError('Por favor, informe o nome da pasta.');
      setInvalidFields(newInvalid);
      return;
    }

    if (isProtected) {
      if (!pin) {
        newInvalid.pin = true;
        setError('Por favor, defina o PIN para proteger esta pasta.');
        setInvalidFields(newInvalid);
        return;
      }
      if (pin.length < 4) {
        newInvalid.pin = true;
        setError('O PIN da pasta deve ter no mínimo 4 caracteres.');
        setInvalidFields(newInvalid);
        return;
      }
      if (pin !== confirmPin) {
        newInvalid.confirmPin = true;
        setError('Os PINs digitados não coincidem.');
        setInvalidFields(newInvalid);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await onSave(
        {
          name: name.trim(),
          description: description.trim() || undefined,
          parentId: parentId || null,
          color,
          icon,
          isProtected,
          pin: isProtected ? pin : undefined,
        },
        initialData?.id
      );
      onClose();
    } catch {
      setError('Erro ao salvar a pasta. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }}>
      <div className="glass-panel animate-fade-in modal-box" style={{ maxWidth: '500px', padding: 0 }}>
        
        <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* STICKY HEADER */}
          <div className="modal-header" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ padding: '0.5rem', background: `${color}20`, border: `1px solid ${color}50`, borderRadius: 'var(--radius-sm)' }}>
                <FolderPlus size={20} style={{ color }} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {initialData ? 'Editar Pasta' : parentId ? 'Criar Subpasta' : 'Nova Pasta'}
                </h2>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Organize suas credenciais com estrutura personalizada
                </span>
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
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            {error && (
              <div className="animate-fade-in" style={{ padding: '0.75rem 1rem', background: 'rgba(255, 42, 109, 0.15)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {/* Nome da Pasta */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Nome da Pasta / Subpasta *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="ex: Projetos Pessoais, Banco, etc."
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (invalidFields.name) setInvalidFields((prev) => ({ ...prev, name: false }));
                }}
                style={{
                  borderColor: invalidFields.name ? 'var(--color-danger)' : undefined,
                  boxShadow: invalidFields.name ? '0 0 10px rgba(255, 42, 109, 0.3)' : undefined,
                }}
                autoFocus
              />
            </div>

            {/* Descrição */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Descrição (Opcional)
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="ex: Senhas de sistemas corporativos e VPNs"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* Seleção de Pasta Pai (Hierarquia) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Localização (Pasta Pai)
              </label>
              <select
                className="input-field"
                value={parentId || ''}
                onChange={(e) => setParentId(e.target.value || null)}
              >
                <option value="">Nenhuma (Pasta Raiz Principal)</option>
                {validParentFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.parentId ? `└─ ${f.name}` : f.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Seletor de Cores */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Cor de Identificação
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {AVAILABLE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: c,
                      border: color === c ? '2px solid #fff' : '2px solid transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: color === c ? `0 0 10px ${c}` : 'none',
                    }}
                  >
                    {color === c && <Check size={14} style={{ color: '#000' }} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Opção de Proteção por PIN (2ª Camada) */}
            <div className="glass-card" style={{ padding: '1rem', border: isProtected ? '1px solid var(--accent-amber)' : '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', transition: 'all 0.2s ease' }}>
              <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lock size={18} style={{ color: isProtected ? 'var(--accent-amber)' : 'var(--text-muted)' }} />
                  <div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                      Proteção por PIN Secundário
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Exige PIN para visualizar e copiar senhas desta pasta
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isProtected}
                  onChange={(e) => setIsProtected(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-amber)' }}
                />
              </label>

              {isProtected && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255, 183, 3, 0.2)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                        PIN / Senha da Pasta *
                      </label>
                      <input
                        type="password"
                        className="input-field font-mono"
                        placeholder="Mínimo 4 digítos..."
                        value={pin}
                        onChange={(e) => {
                          setPin(e.target.value);
                          if (invalidFields.pin) setInvalidFields((prev) => ({ ...prev, pin: false }));
                        }}
                        style={{
                          borderColor: invalidFields.pin ? 'var(--color-danger)' : undefined,
                          boxShadow: invalidFields.pin ? '0 0 10px rgba(255, 42, 109, 0.3)' : undefined,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                        Confirmar PIN *
                      </label>
                      <input
                        type="password"
                        className="input-field font-mono"
                        placeholder="Repita o PIN..."
                        value={confirmPin}
                        onChange={(e) => {
                          setConfirmPin(e.target.value);
                          if (invalidFields.confirmPin) setInvalidFields((prev) => ({ ...prev, confirmPin: false }));
                        }}
                        style={{
                          borderColor: invalidFields.confirmPin ? 'var(--color-danger)' : undefined,
                          boxShadow: invalidFields.confirmPin ? '0 0 10px rgba(255, 42, 109, 0.3)' : undefined,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* STICKY FOOTER */}
          <div className="modal-footer" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', zIndex: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : initialData ? 'Salvar Alterações' : 'Criar Pasta'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
