import Metadata from 'next';
import Link from 'next/link';
import { ShieldCheck, Lock, ServerOff, Database, EyeOff, FileText, ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidade | PassAi Vault',
  description: 'Política de privacidade do PassAi Vault — Gerenciador de Senhas Zero-Knowledge & Zero-Server.',
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ maxWidth: '800px', width: '100%' }}>
        
        {/* Header / Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: 'var(--accent-cyan)',
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0, 242, 254, 0.08)',
              border: '1px solid rgba(0, 242, 254, 0.2)',
            }}
          >
            <ArrowLeft size={18} />
            Voltar para o PassAi
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={22} style={{ color: 'var(--accent-cyan)' }} />
            <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
              PassAi <span className="gradient-text">Vault</span>
            </span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="glass-panel animate-fade-in" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem' }}>
            <div style={{ padding: '0.75rem', background: 'rgba(0, 242, 254, 0.12)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: 'var(--radius-md)' }}>
              <ShieldCheck size={28} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Política de Privacidade
              </h1>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Modelo Zero-Knowledge & Zero-Server (Conformidade LGPD & GDPR) — Última atualização: 2026
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            
            <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(0, 242, 254, 0.3)', background: 'rgba(0, 242, 254, 0.05)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '0.4rem' }}>
                <Lock size={18} /> Resumo Fundamental de Privacidade
              </span>
              <span>
                O <strong>PassAi</strong> foi projetado de forma que nós não coletamos, não rastreamos, não armazenamos e não transmitimos nenhuma informação pessoal ou senha do usuário para servidores próprios ou de terceiros. Toda a encriptação e processamento ocorrem exclusivamente no seu dispositivo.
              </span>
            </div>

            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ServerOff size={20} style={{ color: 'var(--accent-cyan)' }} /> 1. Arquitetura Zero-Server & Zero-Knowledge
              </h2>
              <p>
                O PassAi opera sob a filosofia de <strong>Conhecimento Zero (Zero-Knowledge)</strong>. A sua Senha Mestra é utilizada apenas temporariamente na memória local do seu navegador para derivar chaves de criptografia forte via algoritmo PBKDF2 (SHA-256) + AES-GCM de 256 bits, utilizando a Web Crypto API nativa do seu dispositivo. Os desenvolvedores do PassAi nunca possuem acesso à sua senha mestra, aos seus hashes criptográficos ou às suas credenciais salvas.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Database size={20} style={{ color: 'var(--accent-blue)' }} /> 2. Armazenamento de Dados no Dispositivo
              </h2>
              <p>
                Todas as suas informações (senhas, nomes de usuário, notas secretas, categorias e configurações de conta) permanecem salvas localmente e criptografadas nas tecnologias de armazenamento isolado do seu próprio navegador (IndexedDB e LocalStorage). Você possui autonomia total para exportar cópias de segurança (backups) criptografadas ou apagar todos os dados da máquina a qualquer instante.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <EyeOff size={20} style={{ color: 'var(--accent-emerald)' }} /> 3. Sincronização e Integração com o Google Drive (OAuth 2.0)
              </h2>
              <p>
                Se você optar por ativar o recurso de backup ou sincronização na nuvem com sua conta do Google Drive:
              </p>
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <li>A autenticação ocorre diretamente entre o seu navegador e a API do Google via Google Identity Services (GIS) oficial.</li>
                <li>A permissão solicitada é estritamente limitada ao escopo restrito <code>https://www.googleapis.com/auth/drive.appdata</code> (pasta de dados isolada do aplicativo).</li>
                <li>O aplicativo grava exclusivamente um arquivo criptografado (<code>passai_vault.enc.json</code>) nesta pasta oculta do seu próprio Google Drive.</li>
                <li>O PassAi <strong>não possui acesso</strong> aos seus arquivos pessoais, documentos, fotos ou qualquer outro item salvo fora dessa pasta reservada.</li>
                <li>O aplicativo cumpre integralmente a <em>Google API Services User Data Policy</em>, incluindo os requisitos de Limitação de Uso (Limited Use Requirements).</li>
              </ul>
            </div>

            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={20} style={{ color: 'var(--accent-amber)' }} /> 4. Ausência de Rastreadores, Telemetria e Cookies
              </h2>
              <p>
                O PassAi <strong>não utiliza cookies de rastreamento de publicidade, scripts de análise de terceiros (como Google Analytics) ou ferramentas de telemetria de uso</strong>. A aplicação funciona 100% offline no seu dispositivo após o carregamento inicial.
              </p>
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Se tiver dúvidas sobre esta Política de Privacidade ou sobre o funcionamento criptográfico do PassAi, você pode inspecionar o código-fonte aberto ou contatar a equipe responsável pelo projeto.
            </div>

          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} PassAi Vault. Todos os direitos reservados.
        </div>

      </div>
    </div>
  );
}
