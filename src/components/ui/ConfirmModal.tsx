'use client';

import { AlertTriangle, Trash2, X, AlertCircle, Check } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  message?: string;
  warningText?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onClose?: () => void;
  onCancel?: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  message,
  warningText,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onClose,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const handleDismiss = onClose || onCancel || (() => {});
  const modalText = description || message || '';
  const isDanger = variant === 'danger';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5, 7, 15, 0.85)', backdropFilter: 'blur(8px)', padding: '1.5rem' }}>
      <div className="glass-panel animate-scale-up" style={{ maxWidth: '440px', width: '100%', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-full)',
                background: isDanger ? 'rgba(255, 42, 109, 0.15)' : 'rgba(0, 242, 254, 0.15)',
                border: isDanger ? '1px solid rgba(255, 42, 109, 0.35)' : '1px solid rgba(0, 242, 254, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isDanger ? (
                <Trash2 size={24} style={{ color: 'var(--color-danger)' }} />
              ) : (
                <AlertCircle size={24} style={{ color: 'var(--accent-cyan)' }} />
              )}
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, marginBottom: warningText ? '0.75rem' : 0 }}>{modalText}</p>

          {warningText && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: isDanger ? 'rgba(255, 42, 109, 0.08)' : 'rgba(255, 183, 3, 0.08)',
                border: isDanger ? '1px solid rgba(255, 42, 109, 0.25)' : '1px solid rgba(255, 183, 3, 0.25)',
                color: isDanger ? 'var(--color-danger)' : 'var(--accent-amber)',
                fontSize: '0.78rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.4rem',
              }}
            >
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span>{warningText}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDismiss}
            style={{ flex: 1, padding: '0.7rem' }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: '0.7rem',
              background: isDanger ? 'var(--color-danger)' : 'var(--accent-cyan)',
              color: isDanger ? '#ffffff' : '#05070f',
              fontWeight: 700,
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              boxShadow: isDanger ? '0 0 12px rgba(255, 42, 109, 0.4)' : '0 0 12px rgba(0, 242, 254, 0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
            }}
          >
            {isDanger && <Trash2 size={16} />}
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
