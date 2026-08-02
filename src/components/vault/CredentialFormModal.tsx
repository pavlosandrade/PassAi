'use client';

import { useState } from 'react';
import { Credential, Folder, CustomField, CustomFieldType } from '@/types/vault';
import { X, KeyRound, Eye, EyeOff, Save, Wand2, Plus, Mail, User, FileText, Phone, MapPin, Trash2, Star } from 'lucide-react';
import { generatePassword, evaluatePasswordStrength } from '@/utils/passwordGen';
import { getFolderFullPath } from '@/services/folderService';

interface CredentialFormModalProps {
  initialData?: Credential | null;
  folders: Folder[];
  defaultFolderId?: string;
  onSave: (credentialData: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>, id?: string) => void;
  onClose: () => void;
}

const FIELD_TYPE_CONFIG: Record<CustomFieldType, { label: string; icon: any; placeholder: string }> = {
  email: { label: 'E-mail', icon: Mail, placeholder: 'seu@email.com' },
  username: { label: 'Nome de Usuário', icon: User, placeholder: 'ex: @carlos_dev' },
  document: { label: 'CPF / CNPJ', icon: FileText, placeholder: 'ex: 123.456.789-00 ou 12.345.678/0001-90' },
  phone: { label: 'Telefone', icon: Phone, placeholder: 'ex: (11) 98765-4321' },
  address: { label: 'Endereço', icon: MapPin, placeholder: 'ex: Rua Exemplo, 123 - São Paulo/SP' },
};

const MAX_PER_TYPE = 5;

export default function CredentialFormModal({
  initialData,
  folders,
  defaultFolderId = 'default',
  onSave,
  onClose,
}: CredentialFormModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  
  // Inicialização dinâmica dos campos (suporta retrocompatibilidade)
  const [fields, setFields] = useState<CustomField[]>(() => {
    const list: CustomField[] = [];

    if (initialData?.customFields && initialData.customFields.length > 0) {
      return [...initialData.customFields];
    }

    if (initialData?.email) {
      list.push({ id: `field_${Date.now()}_1`, type: 'email', label: 'E-mail', value: initialData.email });
    }
    if (initialData?.username) {
      const isEmail = initialData.username.includes('@');
      if (isEmail && !initialData.email) {
        list.push({ id: `field_${Date.now()}_1`, type: 'email', label: 'E-mail', value: initialData.username });
      } else if (!isEmail) {
        list.push({ id: `field_${Date.now()}_2`, type: 'username', label: 'Nome de Usuário', value: initialData.username });
      }
    }
    if (initialData?.document) {
      list.push({ id: `field_${Date.now()}_3`, type: 'document', label: 'CPF / CNPJ', value: initialData.document });
    }

    // Se nenhum campo foi encontrado, inicia com 1 campo de E-mail padrão
    if (list.length === 0) {
      list.push({ id: `field_${Date.now()}_init`, type: 'email', label: 'E-mail', value: '' });
    }

    return list;
  });

  const [password, setPassword] = useState(initialData?.password || '');
  const [url, setUrl] = useState(initialData?.url || '');
  const [folderId, setFolderId] = useState(
    initialData?.folderId || (folders.length > 0 ? (folders.find((f) => f.id === defaultFolderId)?.id || folders[0].id) : '')
  );
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isFavorite, setIsFavorite] = useState(initialData?.isFavorite || false);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [invalidFields, setInvalidFields] = useState<Record<string, boolean>>({});

  const strength = evaluatePasswordStrength(password);

  const handleGeneratePassword = () => {
    const generated = generatePassword({ length: 18, useUppercase: true, useLowercase: true, useNumbers: true, useSymbols: true });
    setPassword(generated);
    setShowPassword(true);
  };

  const getCountByType = (type: CustomFieldType) => {
    return fields.filter((f) => f.type === type).length;
  };

  const handleAddField = (type: CustomFieldType) => {
    if (getCountByType(type) >= MAX_PER_TYPE) return;

    const newField: CustomField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      label: FIELD_TYPE_CONFIG[type].label,
      value: '',
    };
    setFields((prev) => [...prev, newField]);
  };

  const handleUpdateFieldValue = (id: string, val: string) => {
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, value: val } : f)));
  };

  const handleRemoveField = (id: string) => {
    setFields((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInvalidFields({});

    const newInvalid: Record<string, boolean> = {};

    if (!title.trim()) {
      newInvalid.title = true;
      setError('Por favor, informe o Título / Serviço.');
      setInvalidFields(newInvalid);
      return;
    }

    if (!password) {
      newInvalid.password = true;
      setError('Por favor, informe a Senha.');
      setInvalidFields(newInvalid);
      return;
    }

    const validFields = fields.filter((f) => f.value.trim() !== '');

    const firstEmail = validFields.find((f) => f.type === 'email')?.value;
    const firstUser = validFields.find((f) => f.type === 'username')?.value;
    const firstDoc = validFields.find((f) => f.type === 'document')?.value;

    onSave(
      {
        title: title.trim(),
        email: firstEmail,
        username: firstUser,
        document: firstDoc,
        customFields: validFields,
        password,
        url: url.trim() || undefined,
        folderId,
        notes: notes.trim() || undefined,
        isFavorite,
      },
      initialData?.id
    );
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }}>
      <div className="glass-panel animate-fade-in modal-box" style={{ maxWidth: '540px', padding: 0 }}>
        
        <form noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* STICKY HEADER */}
          <div className="modal-header" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
              <KeyRound style={{ color: 'var(--accent-cyan)' }} size={22} />
              {initialData ? 'Editar Credencial' : 'Nova Credencial'}
            </h2>
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
            
            {/* Title / Service */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                Título / Serviço *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="ex: Google, Nubank, Banco do Brasil, Netflix"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (invalidFields.title) setInvalidFields((prev) => ({ ...prev, title: false }));
                }}
                style={{
                  borderColor: invalidFields.title ? 'var(--color-danger)' : undefined,
                  boxShadow: invalidFields.title ? '0 0 10px rgba(255, 42, 109, 0.3)' : undefined,
                }}
                autoFocus
              />
            </div>

            {/* Dynamic Fields List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {fields.map((field, idx) => {
                const config = FIELD_TYPE_CONFIG[field.type];
                const IconComponent = config.icon;
                const typeCount = fields.filter((f) => f.type === field.type).length;
                const sameTypeIdx = fields.filter((f, i) => f.type === field.type && i <= idx).length;

                return (
                  <div key={field.id} className="animate-fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <IconComponent size={14} style={{ color: field.type === 'document' ? 'var(--accent-amber)' : field.type === 'phone' ? 'var(--accent-emerald)' : 'var(--accent-cyan)' }} />
                        {config.label} {typeCount > 1 ? `#${sameTypeIdx}` : ''}
                      </label>
                      
                      <button
                        type="button"
                        onClick={() => handleRemoveField(field.id)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem', opacity: 0.8 }}
                        title="Remover campo"
                      >
                        <Trash2 size={12} /> Remover
                      </button>
                    </div>

                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        className="input-field font-mono"
                        placeholder={config.placeholder}
                        value={field.value}
                        onChange={(e) => handleUpdateFieldValue(field.id, e.target.value)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Buttons to Add More Fields */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.2rem' }}>
              {getCountByType('email') < MAX_PER_TYPE && (
                <button
                  type="button"
                  onClick={() => handleAddField('email')}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.73rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={12} style={{ color: 'var(--accent-cyan)' }} />
                  + E-mail ({getCountByType('email')}/5)
                </button>
              )}

              {getCountByType('username') < MAX_PER_TYPE && (
                <button
                  type="button"
                  onClick={() => handleAddField('username')}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.73rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={12} style={{ color: 'var(--accent-cyan)' }} />
                  + Usuário ({getCountByType('username')}/5)
                </button>
              )}

              {getCountByType('document') < MAX_PER_TYPE && (
                <button
                  type="button"
                  onClick={() => handleAddField('document')}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.73rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={12} style={{ color: 'var(--accent-amber)' }} />
                  + CPF / CNPJ ({getCountByType('document')}/5)
                </button>
              )}

              {getCountByType('phone') < MAX_PER_TYPE && (
                <button
                  type="button"
                  onClick={() => handleAddField('phone')}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.73rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={12} style={{ color: 'var(--accent-emerald)' }} />
                  + Telefone ({getCountByType('phone')}/5)
                </button>
              )}

              {getCountByType('address') < MAX_PER_TYPE && (
                <button
                  type="button"
                  onClick={() => handleAddField('address')}
                  className="btn btn-secondary"
                  style={{ padding: '0.3rem 0.55rem', fontSize: '0.73rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                >
                  <Plus size={12} style={{ color: 'var(--accent-blue)' }} />
                  + Endereço ({getCountByType('address')}/5)
                </button>
              )}
            </div>

            {/* Password with Generator Button */}
            <div style={{ marginTop: '0.4rem' }}>
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (invalidFields.password) setInvalidFields((prev) => ({ ...prev, password: false }));
                  }}
                  style={{
                    borderColor: invalidFields.password ? 'var(--color-danger)' : undefined,
                    boxShadow: invalidFields.password ? '0 0 10px rgba(255, 42, 109, 0.3)' : undefined,
                  }}
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
                  <option value="">
                    Sem pasta (Raiz)
                  </option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {getFolderFullPath(folders, f.id)}{f.isProtected ? ' (Protegida por PIN)' : ''}
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
                Notas / Observações
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Anotações adicionais, perguntas de segurança, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ resize: 'vertical' }}
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                Marcar como Favorito <Star size={15} style={{ color: 'var(--accent-amber)', fill: isFavorite ? 'var(--accent-amber)' : 'none' }} />
              </span>
            </label>
          </div>

          {/* STICKY FOOTER */}
          <div className="modal-footer" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', zIndex: 10 }}>
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
