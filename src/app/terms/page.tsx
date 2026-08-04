import Link from 'next/link';
import { FileCheck, ShieldAlert, KeyRound, AlertTriangle, Scale, ArrowLeft, Shield } from 'lucide-react';

export const metadata = {
  title: 'Termos de Serviço | PassAi Vault',
  description: 'Termos de serviço e condições de uso do PassAi Vault — Gerenciador de Senhas Criptografado.',
};

export default function TermsPage() {
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
              <FileCheck size={28} style={{ color: 'var(--accent-cyan)' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Termos de Serviço
              </h1>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Condições de Uso e Responsabilidade do Usuário — Última atualização: 2026
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', lineHeight: 1.7, color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            
            <div className="glass-card" style={{ padding: '1.25rem', border: '1px solid rgba(255, 183, 3, 0.3)', background: 'rgba(255, 183, 3, 0.05)', borderRadius: 'var(--radius-md)' }}>
              <span style={{ color: 'var(--accent-amber)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', marginBottom: '0.4rem' }}>
                <AlertTriangle size={18} /> Responsabilidade e Custódia da Senha Mestra
              </span>
              <span>
                Ao utilizar o <strong>PassAi</strong>, você compreende e concorda que a custódia da sua <strong>Senha Mestra</strong> e da sua <strong>Chave de Recuperação de Emergência</strong> é de sua inteira responsabilidade. Devido ao modelo de criptografia ponta a ponta sem servidores centrais, se você perder a Senha Mestra e a Chave de Emergência, seus dados não poderão ser recuperados por ninguém.
              </span>
            </div>

            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <KeyRound size={20} style={{ color: 'var(--accent-cyan)' }} /> 1. Autonomia e Impossibilidade de Recuperação Externa
              </h2>
              <p>
                O PassAi opera de forma isolada no seu navegador. Nenhuma chave secreta ou senha é enviada para os desenvolvedores. Por este motivo, não existe opção de "Esqueci minha senha" por e-mail enviada por nós. Certifique-se de salvar sua Chave de Recuperação em um local físico seguro ou gerenciador secundário de confiança.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} style={{ color: 'var(--accent-blue)' }} /> 2. Responsabilidade por Backups e Limpeza do Navegador
              </h2>
              <p>
                Como os dados são gravados nas estruturas de armazenamento local (IndexedDB), limpezas profundas de cache ou restaurações de fábrica do sistema operacional podem apagar os dados do navegador. Recomenda-se fortemente manter a sincronização com o Google Drive ativa ou exportar backups criptografados (`.json`) periodicamente.
              </p>
            </div>

            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Scale size={20} style={{ color: 'var(--accent-emerald)' }} /> 3. Licença de Uso e Isenção de Garantias
              </h2>
              <p>
                O PassAi é disponibilizado "como está" (*as is*), isento de qualquer garantia implícita ou expressa. Os criadores do software não se responsabilizam por perdas de dados decorrentes de falhas de hardware, vírus no dispositivo do usuário ou perda de credenciais por descuido no manuseio da senha mestra.
              </p>
            </div>

            <div style={{ marginTop: '1rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Ao continuar utilizando o PassAi Vault, você declara ter lido e concordado com todos os termos e diretrizes de segurança aqui expostos.
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
