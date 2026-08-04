'use client';

import { X, FileCheck, ShieldAlert, KeyRound, AlertTriangle, Scale } from 'lucide-react';

interface TermsOfServiceModalProps {
  onClose: () => void;
}

export default function TermsOfServiceModal({ onClose }: TermsOfServiceModalProps) {
  return (
    <div className="modal-overlay" style={{ zIndex: 110 }}>
      <div className="glass-panel animate-fade-in modal-box" style={{ maxWidth: '640px', padding: 0 }}>
        
        {/* STICKY HEADER */}
        <div className="modal-header" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(0, 242, 254, 0.12)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: 'var(--radius-sm)' }}>
              <FileCheck size={20} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Termos de Serviço</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Condições de Uso e Responsabilidade do Usuário</span>
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
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', lineHeight: 1.6, color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
          
          <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(255, 183, 3, 0.3)', background: 'rgba(255, 183, 3, 0.05)' }}>
            <span style={{ color: 'var(--accent-amber)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.92rem', marginBottom: '0.3rem' }}>
              <AlertTriangle size={16} /> Aviso Importante sobre Responsabilidade de Senhas
            </span>
            <span>
              Ao utilizar o <strong>PassAi</strong>, você reconhece que a responsabilidade pelo armazenamento e guarda da sua <strong>Senha Mestra</strong> e da sua <strong>Chave de Recuperação de Emergência</strong> é 100% sua. Devido à criptografia local sem servidores, se você esquecer sua Senha Mestra e perder a Chave de Recuperação, os dados não poderão ser recuperados por ninguém.
            </span>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <KeyRound size={16} style={{ color: 'var(--accent-cyan)' }} /> 1. Guarda da Senha Mestra e Chave de Emergência
            </h3>
            <p>
              O PassAi opera sem bancos de dados centrais. As chaves de decriptação são geradas em tempo de execução no seu dispositivo. Portanto, a equipe do PassAi <strong>não possui meios técnicos nem acesso para redefinir senhas esquecidas</strong>. Recomendamos anotar e guardar sua Chave de Recuperação em local físico e seguro.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={16} style={{ color: 'var(--accent-blue)' }} /> 2. Backups e Redundância
            </h3>
            <p>
              Embora o PassAi ofereça persistência local confiável no navegador (IndexedDB) e sincronização opcional com o Google Drive / P2P, o usuário é incentivado a exportar backups criptografados em formato JSON periodicamente para garantir a redundância de suas credenciais.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Scale size={16} style={{ color: 'var(--accent-emerald)' }} /> 3. Licença de Uso e Isenção de Garantias
            </h3>
            <p>
              O PassAi é fornecido "como está" (*as is*), sem garantias expressas ou implícitas quanto à disponibilidade contínua em navegadores específicos ou perda de dados decorrente de limpeza de cache pelo sistema operacional do dispositivo do usuário sem backup prévio.
            </p>
          </div>

        </div>

        {/* STICKY FOOTER */}
        <div className="modal-footer" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 10 }}>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Concordo com os Termos
          </button>
        </div>

      </div>
    </div>
  );
}
