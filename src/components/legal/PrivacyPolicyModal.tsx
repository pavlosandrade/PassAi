'use client';

import { X, ShieldCheck, Lock, EyeOff, ServerOff, Database, FileText } from 'lucide-react';

interface PrivacyPolicyModalProps {
  onClose: () => void;
}

export default function PrivacyPolicyModal({ onClose }: PrivacyPolicyModalProps) {
  return (
    <div className="modal-overlay" style={{ zIndex: 110 }}>
      <div className="glass-panel animate-fade-in modal-box" style={{ maxWidth: '640px', padding: 0 }}>
        
        {/* STICKY HEADER */}
        <div className="modal-header" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(0, 242, 254, 0.12)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: 'var(--radius-sm)' }}>
              <ShieldCheck size={20} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Política de Privacidade</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Modelo Zero-Knowledge & Zero-Server (LGPD / GDPR)</span>
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
          
          <div className="glass-card" style={{ padding: '1rem', border: '1px solid rgba(0, 242, 254, 0.3)', background: 'rgba(0, 242, 254, 0.05)' }}>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.92rem', marginBottom: '0.3rem' }}>
              <Lock size={16} /> Resumo Fundamental de Privacidade
            </span>
            <span>
              O <strong>PassAi</strong> não coleta, não rastreia, não armazena e não transmite nenhuma informação pessoal ou senha do usuário para nenhum servidor externo ou terceiro. Toda a encriptação e processamento ocorrem estritamente no seu dispositivo.
            </span>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ServerOff size={16} style={{ color: 'var(--accent-cyan)' }} /> 1. Arquitetura Zero-Server & Zero-Knowledge
            </h3>
            <p>
              O PassAi foi desenvolvido sob a filosofia de <strong>Conhecimento Zero (Zero-Knowledge)</strong>. A sua Senha Mestra é utilizada exclusivamente na memória RAM do seu navegador para derivar chaves criptográficas locais (PBKDF2 SHA-256 + AES-GCM 256 bits via Web Crypto API nativa). Nós, como desenvolvedores da aplicação, nunca temos acesso à sua Senha Mestra, aos seus hashes de chave ou ao conteúdo do seu cofre.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Database size={16} style={{ color: 'var(--accent-blue)' }} /> 2. Armazenamento de Dados Locais
            </h3>
            <p>
              Todos os dados do cofre (pastas, credenciais, notas e perfil) são armazenados localmente no seu dispositivo através do IndexedDB e LocalStorage do navegador. Você possui controle absoluto para exportar backups criptografados ou excluir seu cofre a qualquer momento.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <EyeOff size={16} style={{ color: 'var(--accent-emerald)' }} /> 3. Integração com Google Drive (OAuth 2.0)
            </h3>
            <p>
              Se você optar por ativar a sincronização na nuvem via Google Drive:
            </p>
            <ul style={{ paddingLeft: '1.2rem', marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <li>O PassAi utiliza a autenticação direta client-side do navegador via Google Identity Services (GIS).</li>
              <li>A solicitação é restrita ao escopo privado <code>https://www.googleapis.com/auth/drive.appdata</code>.</li>
              <li>O aplicativo grava apenas o arquivo <code>passai_vault.enc.json</code> na pasta oculta do app no seu próprio Google Drive.</li>
              <li>O PassAi <strong>não tem acesso</strong> a nenhum outro arquivo, pasta ou dado do seu Google Drive.</li>
              <li>A conformidade do PassAi respeita rigorosamente a <em>Google API Services User Data Policy</em>.</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={16} style={{ color: 'var(--accent-amber)' }} /> 4. Cookies e Telemetria
            </h3>
            <p>
              O PassAi <strong>não utiliza cookies de rastreamento, pixels de terceiros, Google Analytics ou ferramentas de telemetria</strong>. O aplicativo funciona 100% de forma autônoma e pode ser executado sem qualquer conexão com a internet.
            </p>
          </div>

        </div>

        {/* STICKY FOOTER */}
        <div className="modal-footer" style={{ background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', zIndex: 10 }}>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Entendi e Concordo
          </button>
        </div>

      </div>
    </div>
  );
}
