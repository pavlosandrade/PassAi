'use client';

import { useEffect } from 'react';
import { Trash2, ShieldAlert, Info, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: Trash2,
          color: 'var(--color-danger)',
          bgIcon: 'rgba(255, 42, 109, 0.12)',
          borderIcon: 'rgba(255, 42, 109, 0.3)',
          btnBg: 'var(--color-danger)',
          btnColor: '#ffffff',
        };
      case 'warning':
        return {
          icon: ShieldAlert,
          color: 'var(--accent-amber)',
          bgIcon: 'rgba(255, 183, 3, 0.12)',
          borderIcon: 'rgba(255, 183, 3, 0.3)',
          btnBg: 'var(--accent-amber)',
          btnColor: '#0d1117',
        };
      case 'info':
      default:
        return {
          icon: Info,
          color: 'var(--accent-cyan)',
          bgIcon: 'rgba(0, 242, 254, 0.12)',
          borderIcon: 'rgba(0, 242, 254, 0.3)',
          btnBg: 'var(--accent-cyan)',
          btnColor: '#0d1117',
        };
    }
  };

  const styleConfig = getVariantStyles();
  const IconComponent = styleConfig.icon;

  return (
    <div className="modal-overlay" style={{ zIndex: 150 }}>
      <div className="glass-panel animate-fade-in modal-box" style={{ maxWidth: '440px', padding: 0 }}>
        
        {/* STICKY HEADER */}
        <div className="modal-header" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                padding: '0.45rem',
                background: styleConfig.bgIcon,
                border: `1px solid ${styleConfig.borderIcon}`,
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconComponent size={18} style={{ color: styleConfig.color }} />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onCancel}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="modal-body">
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {message}
          </p>
        </div>

        {/* STICKY FOOTER */}
        <div className="modal-footer" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', zIndex: 10 }}>
          <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}>
            {cancelText}
          </button>
          
          <button
            type="button"
            className="btn"
            onClick={onConfirm}
            style={{
              padding: '0.55rem 1.25rem',
              fontSize: '0.85rem',
              background: styleConfig.btnBg,
              color: styleConfig.btnColor,
              fontWeight: 600,
              border: 'none',
            }}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
}
