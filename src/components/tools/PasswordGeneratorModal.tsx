'use client';

import { useState } from 'react';
import { X, Sparkles, Copy, Check, RefreshCw, Sliders, Shield } from 'lucide-react';
import { generatePassword, evaluatePasswordStrength } from '@/utils/passwordGen';
import { copyToClipboard } from '@/utils/clipboard';

interface PasswordGeneratorModalProps {
  onClose: () => void;
}

export default function PasswordGeneratorModal({ onClose }: PasswordGeneratorModalProps) {
  const [length, setLength] = useState(18);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [avoidSimilar, setAvoidSimilar] = useState(false);
  const [copied, setCopied] = useState(false);

  const [password, setPassword] = useState(() =>
    generatePassword({ length: 18, useUppercase: true, useLowercase: true, useNumbers: true, useSymbols: true })
  );

  const handleRegenerate = () => {
    const newPass = generatePassword({
      length,
      useUppercase,
      useLowercase,
      useNumbers,
      useSymbols,
      avoidSimilar,
    });
    setPassword(newPass);
    setCopied(false);
  };

  const handleCopy = async () => {
    const success = await copyToClipboard(password, { autoClearSeconds: 15 });
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const strength = evaluatePasswordStrength(password);

  return (
    <div className="modal-overlay" style={{ zIndex: 100 }}>
      <div className="glass-panel animate-fade-in modal-box" style={{ maxWidth: '480px', padding: 0 }}>
        
        {/* STICKY HEADER */}
        <div className="modal-header" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(0, 242, 254, 0.12)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: 'var(--radius-sm)' }}>
              <Sparkles size={20} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Gerador de Senhas Seguras</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Criação com alta entropia criptográfica</span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Password Display Box */}
          <div className="glass-card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', border: '1px solid var(--border-glow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
              <span className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--accent-cyan)', wordBreak: 'break-all', letterSpacing: '0.05em' }}>
                {password}
              </span>
              
              <div style={{ display: 'flex', gap: '0.35rem', flexShrink: 0 }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleRegenerate}
                  style={{ padding: '0.45rem' }}
                  title="Gerar outra senha"
                >
                  <RefreshCw size={16} />
                </button>
                
                <button
                  className="btn btn-primary"
                  onClick={handleCopy}
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.82rem' }}
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            {/* Strength bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.2rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Diagnóstico de Força:</span>
                <span style={{ color: strength.color, fontWeight: 600 }}>{strength.label}</span>
              </div>
              <div style={{ height: '4px', width: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${strength.score}%`, background: strength.color, transition: 'all 0.3s ease' }} />
              </div>
            </div>
          </div>

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Length Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                <span>Tamanho da Senha:</span>
                <span className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{length} caracteres</span>
              </div>
              <input
                type="range"
                min={8}
                max={64}
                value={length}
                onChange={(e) => { setLength(Number(e.target.value)); handleRegenerate(); }}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
            </div>

            {/* Character Toggles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.82rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={useUppercase} onChange={(e) => { setUseUppercase(e.target.checked); handleRegenerate(); }} style={{ accentColor: 'var(--accent-cyan)' }} />
                Maiúsculas (A-Z)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={useLowercase} onChange={(e) => { setUseLowercase(e.target.checked); handleRegenerate(); }} style={{ accentColor: 'var(--accent-cyan)' }} />
                Minúsculas (a-z)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={useNumbers} onChange={(e) => { setUseNumbers(e.target.checked); handleRegenerate(); }} style={{ accentColor: 'var(--accent-cyan)' }} />
                Números (0-9)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <input type="checkbox" checked={useSymbols} onChange={(e) => { setUseSymbols(e.target.checked); handleRegenerate(); }} style={{ accentColor: 'var(--accent-cyan)' }} />
                Símbolos (!@#$)
              </label>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <input type="checkbox" checked={avoidSimilar} onChange={(e) => { setAvoidSimilar(e.target.checked); handleRegenerate(); }} style={{ accentColor: 'var(--accent-cyan)' }} />
              Evitar caracteres ambíguos (I, l, 1, O, 0)
            </label>
          </div>
        </div>

        {/* STICKY FOOTER */}
        <div className="modal-footer" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 10 }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
