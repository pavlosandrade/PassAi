'use client';

import { useState } from 'react';
import { VaultData, Credential, Folder } from '@/types/vault';
import FolderList from './FolderList';
import CredentialCard from './CredentialCard';
import CredentialFormModal from './CredentialFormModal';
import ProtectedFolderModal from './ProtectedFolderModal';
import PasswordGeneratorModal from '../tools/PasswordGeneratorModal';
import BackupManagerModal from '../backup/BackupManagerModal';
import { Search, Plus, Shield, LogOut, Download, Sparkles, Key, Lock } from 'lucide-react';

interface VaultLayoutProps {
  vaultData: VaultData;
  masterPassword?: string | null;
  onUpdateVault: (updatedData: VaultData) => Promise<void>;
  onLock: () => void;
}

export default function VaultLayout({
  vaultData,
  masterPassword,
  onUpdateVault,
  onLock,
}: VaultLayoutProps) {
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  // Controle de pastas protegidas desbloqueadas por PIN durante a sessão
  const [unlockedFolderPins, setUnlockedFolderPins] = useState<Record<string, boolean>>({});
  const [pinPromptFolder, setPinPromptFolder] = useState<Folder | null>(null);

  // Filtragem de credenciais
  const filteredCredentials = vaultData.credentials.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.url && c.url.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFolderId === 'all') return true;
    if (activeFolderId === 'favorites') return c.isFavorite;
    return c.folderId === activeFolderId;
  });

  const activeFolder = vaultData.folders.find((f) => f.id === activeFolderId);

  // Salvar/Adicionar Credencial
  const handleSaveCredential = async (
    data: Omit<Credential, 'id' | 'createdAt' | 'updatedAt'>,
    id?: string
  ) => {
    let updatedCredentials: Credential[];
    const now = new Date().toISOString();

    if (id) {
      updatedCredentials = vaultData.credentials.map((c) =>
        c.id === id ? { ...c, ...data, updatedAt: now } : c
      );
    } else {
      const newCred: Credential = {
        ...data,
        id: crypto.randomUUID ? crypto.randomUUID() : `cred_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      updatedCredentials = [newCred, ...vaultData.credentials];
    }

    await onUpdateVault({
      ...vaultData,
      credentials: updatedCredentials,
    });

    setIsFormOpen(false);
    setEditingCredential(null);
  };

  // Alternar Favorito
  const handleToggleFavorite = async (id: string) => {
    const updatedCredentials = vaultData.credentials.map((c) =>
      c.id === id ? { ...c, isFavorite: !c.isFavorite, updatedAt: new Date().toISOString() } : c
    );
    await onUpdateVault({ ...vaultData, credentials: updatedCredentials });
  };

  // Excluir Credencial
  const handleDeleteCredential = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta credencial?')) {
      const updatedCredentials = vaultData.credentials.filter((c) => c.id !== id);
      await onUpdateVault({ ...vaultData, credentials: updatedCredentials });
    }
  };

  // Solicitar Desbloqueio por PIN
  const handleUnlockFolderPin = async (pin: string): Promise<boolean> => {
    if (!pinPromptFolder) return false;
    if (pin.length >= 4) {
      setUnlockedFolderPins((prev) => ({ ...prev, [pinPromptFolder.id]: true }));
      setPinPromptFolder(null);
      return true;
    }
    return false;
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      
      {/* Navbar Superior */}
      <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ padding: '0.5rem', background: 'rgba(0, 242, 254, 0.12)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}>
            <Shield style={{ width: '22px', height: '22px', color: 'var(--accent-cyan)' }} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', margin: 0 }}>
              Pass<span className="gradient-text">Ai</span>
            </h1>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>Zero-Server Vault</span>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ maxWidth: '360px', width: '100%', position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            placeholder="Buscar por título, usuário ou site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.4rem', paddingRight: '1rem', fontSize: '0.85rem' }}
          />
        </div>

        {/* User Profile Badge & Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {vaultData.userProfile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
              <span style={{ fontWeight: 600 }}>👤 {vaultData.userProfile.name}</span>
            </div>
          )}
          <button className="btn btn-secondary" onClick={() => setIsGeneratorOpen(true)} style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}>
            <Sparkles size={16} style={{ color: 'var(--accent-cyan)' }} />
            Gerador
          </button>
          
          <button className="btn btn-secondary" onClick={() => setIsBackupOpen(true)} style={{ padding: '0.5rem 0.85rem', fontSize: '0.82rem' }}>
            <Download size={16} style={{ color: 'var(--accent-emerald)' }} />
            Backup
          </button>

          <button className="btn btn-primary" onClick={() => { setEditingCredential(null); setIsFormOpen(true); }} style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}>
            <Plus size={16} />
            Nova Credencial
          </button>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-light)', margin: '0 0.2rem' }} />

          <button className="btn btn-secondary" onClick={onLock} style={{ padding: '0.5rem 0.75rem' }} title="Trancar Cofre">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Body: Sidebar + Credentials Area */}
      <div style={{ flex: 1, display: 'flex', maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '1.5rem', gap: '1.5rem' }}>
        
        {/* Sidebar */}
        <div style={{ width: '260px', flexShrink: 0 }}>
          <div className="glass-panel" style={{ padding: '1rem' }}>
            <FolderList
              folders={vaultData.folders}
              credentials={vaultData.credentials}
              activeFolderId={activeFolderId}
              onSelectFolder={setActiveFolderId}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Header Area */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {activeFolderId === 'all' && 'Todas as Senhas'}
                {activeFolderId === 'favorites' && 'Senhas Favoritas'}
                {activeFolder && activeFolder.name}
                {activeFolder?.isProtected && (
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: 'rgba(255, 183, 3, 0.15)', border: '1px solid rgba(255, 183, 3, 0.3)', borderRadius: 'var(--radius-full)', color: 'var(--accent-amber)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Lock size={12} /> Protegida por PIN
                  </span>
                )}
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Exibindo {filteredCredentials.length} {filteredCredentials.length === 1 ? 'registro' : 'registros'}
              </p>
            </div>
          </div>

          {/* Credentials Grid */}
          {filteredCredentials.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
              {filteredCredentials.map((credential) => {
                const credFolder = vaultData.folders.find((f) => f.id === credential.folderId);
                const isFolderProtected = credFolder?.isProtected || false;
                const isUnlockedByPin = credFolder ? unlockedFolderPins[credFolder.id] || false : true;

                return (
                  <CredentialCard
                    key={credential.id}
                    credential={credential}
                    folderName={credFolder?.name}
                    isFolderProtected={isFolderProtected}
                    isUnlockedByPin={isUnlockedByPin}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={(cred) => { setEditingCredential(cred); setIsFormOpen(true); }}
                    onDelete={handleDeleteCredential}
                    onRequestPinUnlock={() => credFolder && setPinPromptFolder(credFolder)}
                  />
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Key style={{ width: '48px', height: '48px', color: 'var(--accent-cyan)', opacity: 0.5, marginBottom: '1rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                Nenhuma credencial encontrada
              </h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                {searchQuery ? 'Nenhum resultado corresponde à sua busca.' : 'Você ainda não possui senhas cadastradas nesta categoria.'}
              </p>
              <button
                className="btn btn-primary"
                onClick={() => { setEditingCredential(null); setIsFormOpen(true); }}
              >
                <Plus size={16} />
                Cadastrar Primeira Credencial
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {isFormOpen && (
        <CredentialFormModal
          initialData={editingCredential}
          folders={vaultData.folders}
          defaultFolderId={activeFolderId !== 'all' && activeFolderId !== 'favorites' ? activeFolderId : 'default'}
          onSave={handleSaveCredential}
          onClose={() => { setIsFormOpen(false); setEditingCredential(null); }}
        />
      )}

      {pinPromptFolder && (
        <ProtectedFolderModal
          folder={pinPromptFolder}
          onUnlockPin={handleUnlockFolderPin}
          onClose={() => setPinPromptFolder(null)}
        />
      )}

      {isGeneratorOpen && (
        <PasswordGeneratorModal onClose={() => setIsGeneratorOpen(false)} />
      )}

      {isBackupOpen && (
        <BackupManagerModal
          vaultData={vaultData}
          masterPassword={masterPassword}
          onRestoreComplete={onUpdateVault}
          onClose={() => setIsBackupOpen(false)}
        />
      )}
    </div>
  );
}
