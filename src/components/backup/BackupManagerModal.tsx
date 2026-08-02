'use client';

import { useState } from 'react';
import { X, Download, Upload, ShieldCheck, FileText, Check, UserCheck, ShieldAlert } from 'lucide-react';
import { VaultData } from '@/types/vault';
import { exportAccountProfileBackup, exportVaultBackup, importBackupFile } from '@/services/backupService';
import ConfirmModal from '@/components/ui/ConfirmModal';

interface BackupManagerModalProps {
  vaultData: VaultData;
  masterPassword?: string | null;
  onRestoreComplete: (data: VaultData) => void;
  onClose: () => void;
}

export default function BackupManagerModal({
  vaultData,
  masterPassword,
  onRestoreComplete,
  onClose,
}: BackupManagerModalProps) {
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isConfirmPlainOpen, setIsConfirmPlainOpen] = useState(false);

  // 1. Exportar Backup da Conta / Perfil
  const handleExportAccountProfile = () => {
    if (!vaultData.userProfile) {
      setError('Nenhum perfil de conta encontrado no cofre ativo.');
      return;
    }

    try {
      exportAccountProfileBackup(vaultData.userProfile);
      setSuccessMessage('Backup de Conta (Perfil & Chave) baixado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch {
      setError('Erro ao exportar o perfil da conta.');
    }
  };

  // 2. Exportar Backup do Cofre Criptografado
  const handleExportEncryptedVault = async () => {
    setIsExporting(true);
    setError('');
    try {
      await exportVaultBackup(vaultData, masterPassword || undefined);
      setSuccessMessage('Backup do Cofre Criptografado baixado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch {
      setError('Erro ao exportar o cofre criptografado.');
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Exportar Backup do Cofre em Texto Plano
  const executeExportPlainVault = async () => {
    setIsConfirmPlainOpen(false);
    setIsExporting(true);
    setError('');
    try {
      await exportVaultBackup(vaultData);
      setSuccessMessage('Backup em texto plano baixado com sucesso!');
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch {
      setError('Erro ao exportar backup em texto plano.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPlainVault = () => {
    setIsConfirmPlainOpen(true);
  };

  // 4. Importar Arquivo (Detecta se é Perfil de Conta ou Cofre)
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    try {
      const result = await importBackupFile(file, masterPassword || undefined);

      if (result.type === 'account_profile') {
        setSuccessMessage(`Perfil de conta de ${result.userProfile?.name} (${result.userProfile?.email}) reconhecido!`);
        setTimeout(() => setSuccessMessage(''), 4000);
      } else if (result.vaultData) {
        onRestoreComplete(result.vaultData);
        setSuccessMessage('Cofre completo restaurado com sucesso!');
        setTimeout(() => onClose(), 1200);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao importar arquivo.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 100 }}>
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '540px', width: '100%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        
        {/* STICKY HEADER */}
        <div style={{ padding: '1.25rem 1.75rem', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', flexShrink: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(0, 245, 160, 0.12)', border: '1px solid rgba(0, 245, 160, 0.3)', borderRadius: 'var(--radius-sm)' }}>
              <Download size={20} style={{ color: 'var(--accent-emerald)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Gerenciador de Duplo Backup</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Backups isolados por conta e conformidade com LGPD</span>
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
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div className="animate-fade-in" style={{ padding: '0.75rem 1rem', background: 'rgba(255, 42, 109, 0.15)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          {successMessage && (
            <div className="animate-fade-in" style={{ padding: '0.75rem 1rem', background: 'rgba(0, 245, 160, 0.15)', border: '1px solid var(--color-success)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-emerald)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check size={18} />
              {successMessage}
            </div>
          )}

          {/* SECTION 1: Backup da Conta */}
          <div style={{ padding: '1rem', background: 'rgba(0, 242, 254, 0.05)', border: '1px solid rgba(0, 242, 254, 0.2)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserCheck size={16} />
              1. Backup de Registro da Conta (LGPD)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
              Exporta apenas a identificação do seu perfil e a chave de emergência. Use este arquivo para re-cadastrar sua conta em um navegador limpo sem expor suas senhas.
            </p>

            <button
              className="btn btn-secondary"
              onClick={handleExportAccountProfile}
              style={{ width: '100%', fontSize: '0.85rem', justifyContent: 'center' }}
            >
              <UserCheck size={16} style={{ color: 'var(--accent-cyan)' }} />
              Exportar Arquivo de Conta (.json)
            </button>
          </div>

          {/* SECTION 2: Backup do Cofre */}
          <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)' }}>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} style={{ color: 'var(--accent-emerald)' }} />
              2. Backup do Cofre de Senhas
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '0.75rem' }}>
              Exporta todas as pastas e senhas cadastradas exclusivamente para esta conta.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleExportEncryptedVault}
                disabled={isExporting}
                style={{ fontSize: '0.82rem', padding: '0.65rem' }}
              >
                <ShieldCheck size={16} />
                Exportar Criptografado
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleExportPlainVault}
                disabled={isExporting}
                style={{ fontSize: '0.82rem', padding: '0.65rem' }}
              >
                <FileText size={16} style={{ color: 'var(--accent-amber)' }} />
                Exportar Texto Plano
              </button>
            </div>
          </div>

          {/* SECTION 3: Import / Restore */}
          <div>
            <h3 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
              3. Importar / Restaurar Arquivo
            </h3>

            <label className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '1rem', border: '1px dashed var(--border-glow)', cursor: 'pointer', textAlign: 'center' }}>
              <Upload size={18} style={{ color: 'var(--accent-cyan)' }} />
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', color: 'var(--text-primary)' }}>Selecionar Arquivo JSON</span>
                <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>Detecta automaticamente se é Arquivo de Conta ou de Cofre</span>
              </div>
              <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
            </label>
          </div>
        </div>

        {/* STICKY FOOTER */}
        <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid var(--border-light)', background: 'rgba(13, 18, 29, 0.95)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0, zIndex: 10 }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Fechar
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={isConfirmPlainOpen}
        title="Aviso de Segurança (Texto Plano)"
        message="O arquivo em texto plano conterá suas senhas sem criptografia. Recomendamos utilizar o backup criptografado. Deseja continuar mesmo assim?"
        variant="warning"
        confirmText="Baixar Sem Criptografia"
        cancelText="Cancelar"
        onConfirm={executeExportPlainVault}
        onCancel={() => setIsConfirmPlainOpen(false)}
      />
    </div>
  );
}
