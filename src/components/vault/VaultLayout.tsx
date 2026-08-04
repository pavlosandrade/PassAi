'use client';

import { useState, useMemo, useEffect } from 'react';
import { VaultData, Credential, Folder } from '@/types/vault';
import { evaluatePasswordStrength } from '@/utils/passwordGen';
import FolderList from './FolderList';
import FolderFormModal from './FolderFormModal';
import FolderCard from './FolderCard';
import CredentialCard from './CredentialCard';
import CredentialCardSkeleton from './CredentialCardSkeleton';
import FolderCardSkeleton from './FolderCardSkeleton';
import CredentialFormModal from './CredentialFormModal';
import ProtectedFolderModal from './ProtectedFolderModal';
import PasswordGeneratorModal from '../tools/PasswordGeneratorModal';
import BackupManagerModal from '../backup/BackupManagerModal';
import ConfirmModal from '../ui/ConfirmModal';
import AccountProfileModal from '../auth/AccountProfileModal';
import SyncModal from '../sync/SyncModal';
import { SyncMode } from '@/types/sync';
import { deriveKeyFromPassword } from '@/crypto/pbkdf2';
import { EncryptedPayload } from '@/types/crypto';
import { Search, Plus, Shield, LogOut, Download, Sparkles, Key, Lock, FolderPlus, KeyRound, ChevronRight, ChevronDown, Home, Folder as FolderIcon, User, Menu, X, Activity, RefreshCw } from 'lucide-react';
import {
  getFolderFullPath,
  getFolderAndSubfolderIds,
  isFolderOrAncestorLocked,
} from '@/services/folderService';

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
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isFolderLoading, setIsFolderLoading] = useState(false);
  const [masterCryptoKey, setMasterCryptoKey] = useState<CryptoKey | undefined>(undefined);

  // Deriva a CryptoKey a partir da masterPassword quando a tela carrega
  useEffect(() => {
    if (masterPassword) {
      deriveKeyFromPassword(masterPassword).then(({ key }) => {
        setMasterCryptoKey(key);
      }).catch(() => {});
    }
  }, [masterPassword]);

  const handleFolderSelect = (id: string) => {
    setIsMobileSidebarOpen(false);
    if (id === activeFolderId) return;
    setIsFolderLoading(true);
    setActiveFolderId(id);
    setTimeout(() => setIsFolderLoading(false), 450);
  };

  // Diagnóstico de Saúde do Cofre (Vault Health Check)
  const healthStats = useMemo(() => {
    let weakCount = 0;
    const passwordMap: Record<string, number> = {};

    vaultData.credentials.forEach((c) => {
      if (c.password) {
        const strength = evaluatePasswordStrength(c.password);
        if (strength.score < 70) weakCount++;
        passwordMap[c.password] = (passwordMap[c.password] || 0) + 1;
      }
    });

    const reusedCount = Object.values(passwordMap)
      .filter((count) => count > 1)
      .reduce((acc, count) => acc + count, 0);

    const total = vaultData.credentials.length;
    const healthScore = total === 0 ? 100 : Math.max(0, Math.round(100 - (weakCount * 15 + reusedCount * 20)));

    return {
      total,
      weakCount,
      reusedCount,
      healthScore,
    };
  }, [vaultData.credentials]);

  // Modal de confirmação personalizado da UI
  const [confirmModalState, setConfirmModalState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: 'danger' | 'warning' | 'info';
    confirmText: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    variant: 'danger',
    confirmText: 'Confirmar',
    onConfirm: () => {},
  });

  // Modal de gerenciamento de Pastas & Subpastas
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [parentFolderForSubfolderId, setParentFolderForSubfolderId] = useState<string | null>(null);

  // Controle de pastas protegidas desbloqueadas por PIN durante a sessão
  const [unlockedFolderPins, setUnlockedFolderPins] = useState<Record<string, boolean>>({});
  const [pinPromptFolder, setPinPromptFolder] = useState<Folder | null>(null);

  const activeFolder = vaultData.folders.find((f) => f.id === activeFolderId);
  const isCurrentFolderLocked = activeFolder
    ? isFolderOrAncestorLocked(vaultData.folders, activeFolder.id, unlockedFolderPins)
    : false;

  // Lógica de Subpastas e Credenciais por Nível
  let currentSubfolders: Folder[] = [];
  let currentCredentials: Credential[] = [];

  if (searchQuery.trim() !== '') {
    // Modo de busca ativa: busca direta em todo o cofre (oculta pastas e lista credenciais)
    const q = searchQuery.toLowerCase();
    currentCredentials = vaultData.credentials.filter((c) => {
      // Oculta credenciais de pastas trancadas por PIN na busca
      if (isFolderOrAncestorLocked(vaultData.folders, c.folderId, unlockedFolderPins)) return false;

      const matchesCustom = c.customFields?.some((cf) => cf.value && cf.value.toLowerCase().includes(q));
      return (
        c.title.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.username && c.username.toLowerCase().includes(q)) ||
        (c.document && c.document.toLowerCase().includes(q)) ||
        (c.url && c.url.toLowerCase().includes(q)) ||
        matchesCustom
      );
    });
  } else if (activeFolderId === 'all') {
    // Nível Raiz ("Todas as Senhas"): exibe Pastas Raiz (sem parentId) + Credenciais na Raiz (sem folderId)
    currentSubfolders = vaultData.folders.filter((f) => !f.parentId);
    currentCredentials = vaultData.credentials.filter((c) => !c.folderId);
  } else if (activeFolderId === 'favorites') {
    // Favoritos: exibe todas as credenciais marcadas como favoritas (não trancadas por PIN)
    currentCredentials = vaultData.credentials.filter(
      (c) => c.isFavorite && !isFolderOrAncestorLocked(vaultData.folders, c.folderId, unlockedFolderPins)
    );
  } else if (activeFolder) {
    // Nível de Pasta Específica: exibe Subpastas filhas + Credenciais pertencentes a esta pasta
    currentSubfolders = vaultData.folders.filter((f) => f.parentId === activeFolder.id);
    currentCredentials = vaultData.credentials.filter((c) => c.folderId === activeFolder.id);
  }

  // Geração da barra de navegação Breadcrumb
  const getBreadcrumbs = () => {
    if (activeFolderId === 'all') return [{ id: 'all', name: 'Todas as Senhas' }];
    if (activeFolderId === 'favorites') return [{ id: 'all', name: 'Todas as Senhas' }, { id: 'favorites', name: 'Favoritos' }];

    const crumbs: { id: string; name: string }[] = [];
    let current = activeFolder;

    while (current) {
      crumbs.unshift({ id: current.id, name: current.name });
      if (!current.parentId) break;
      const pId: string = current.parentId;
      current = vaultData.folders.find((f) => f.id === pId);
    }

    return [{ id: 'all', name: 'Todas as Senhas' }, ...crumbs];
  };

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
  const handleDeleteCredential = (id: string) => {
    const cred = vaultData.credentials.find((c) => c.id === id);
    setConfirmModalState({
      isOpen: true,
      title: 'Excluir Credencial',
      message: `Tem certeza que deseja excluir a credencial "${cred?.title || 'selecionada'}"? Esta ação não poderá ser desfeita.`,
      variant: 'danger',
      confirmText: 'Excluir Credencial',
      onConfirm: async () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        const updatedCredentials = vaultData.credentials.filter((c) => c.id !== id);
        await onUpdateVault({ ...vaultData, credentials: updatedCredentials });
      },
    });
  };

  // Handlers para Gerenciamento de Pastas & Subpastas
  const handleCreateFolder = () => {
    setEditingFolder(null);
    setParentFolderForSubfolderId(null);
    setIsFolderModalOpen(true);
  };

  const handleCreateSubfolder = (parentFolderId: string) => {
    setEditingFolder(null);
    setParentFolderForSubfolderId(parentFolderId);
    setIsFolderModalOpen(true);
  };

  const handleEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setParentFolderForSubfolderId(null);
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = async (data: Omit<Folder, 'id' | 'createdAt'>, id?: string) => {
    let updatedFolders: Folder[];
    const now = new Date().toISOString();

    if (id) {
      updatedFolders = vaultData.folders.map((f) => (f.id === id ? { ...f, ...data } : f));
    } else {
      const newFolder: Folder = {
        ...data,
        id: crypto.randomUUID ? crypto.randomUUID() : `folder_${Date.now()}`,
        createdAt: now,
      };
      updatedFolders = [...vaultData.folders, newFolder];
    }

    await onUpdateVault({
      ...vaultData,
      folders: updatedFolders,
    });
  };

  const handleDeleteFolder = (folderId: string) => {
    const folder = vaultData.folders.find((f) => f.id === folderId);
    if (!folder) return;

    setConfirmModalState({
      isOpen: true,
      title: 'Excluir Pasta',
      message: `Tem certeza que deseja excluir a pasta "${folder.name}"? Subpastas e credenciais vinculadas serão movidas para a raiz.`,
      variant: 'danger',
      confirmText: 'Excluir Pasta',
      onConfirm: async () => {
        setConfirmModalState((prev) => ({ ...prev, isOpen: false }));
        const idsToRemove = getFolderAndSubfolderIds(vaultData.folders, folderId);
        const updatedFolders = vaultData.folders.filter((f) => !idsToRemove.includes(f.id));

        const updatedCredentials = vaultData.credentials.map((c) =>
          idsToRemove.includes(c.folderId) ? { ...c, folderId: '' } : c
        );

        if (idsToRemove.includes(activeFolderId)) {
          setActiveFolderId('all');
        }

        await onUpdateVault({
          ...vaultData,
          folders: updatedFolders,
          credentials: updatedCredentials,
        });
      },
    });
  };

  const handleFolderCardClick = (folder: Folder) => {
    handleFolderSelect(folder.id);
    if (isFolderOrAncestorLocked(vaultData.folders, folder.id, unlockedFolderPins)) {
      setPinPromptFolder(folder);
    }
  };

  // Solicitar Desbloqueio por PIN
  const handleUnlockFolderPin = async (inputPin: string): Promise<boolean> => {
    if (!pinPromptFolder) return false;

    if (pinPromptFolder.pin) {
      if (inputPin === pinPromptFolder.pin) {
        setUnlockedFolderPins((prev) => ({ ...prev, [pinPromptFolder.id]: true }));
        setPinPromptFolder(null);
        return true;
      }
      return false;
    }

    if (inputPin.length >= 4) {
      setUnlockedFolderPins((prev) => ({ ...prev, [pinPromptFolder.id]: true }));
      setPinPromptFolder(null);
      return true;
    }

    return false;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      
      {/* Navbar Superior */}
      <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '0.85rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 30 }}>
        
        {/* Brand — Logo + Nome (esquerda) */}
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

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Indicador de Saúde do Cofre (Pill) */}
          <div
            className="hide-mobile-text"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-full)',
              padding: '0.35rem 0.85rem',
              height: '38px',
              fontSize: '0.78rem',
            }}
            title={`Saúde do Cofre: ${healthStats.healthScore}%. ${healthStats.weakCount} senhas fracas, ${healthStats.reusedCount} reutilizadas.`}
          >
            <Activity
              size={14}
              style={{
                color:
                  healthStats.healthScore >= 80
                    ? 'var(--accent-emerald)'
                    : healthStats.healthScore >= 50
                    ? 'var(--accent-amber)'
                    : 'var(--color-danger)',
              }}
            />
            <span style={{ color: 'var(--text-muted)' }}>Cofre:</span>
            <span
              style={{
                fontWeight: 700,
                color:
                  healthStats.healthScore >= 80
                    ? 'var(--accent-emerald)'
                    : healthStats.healthScore >= 50
                    ? 'var(--accent-amber)'
                    : 'var(--color-danger)',
              }}
            >
              {healthStats.healthScore}%
            </span>
          </div>

          {/* Gerador em formato Pill com Destaque Gradiente */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsGeneratorOpen(true)}
            style={{
              padding: '0.45rem 1rem',
              height: '38px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.82rem',
              fontWeight: 600,
              gap: '0.45rem',
              boxShadow: '0 0 15px rgba(0, 242, 254, 0.25)',
            }}
          >
            <Sparkles size={16} style={{ color: '#050811' }} />
            <span className="hide-mobile-text">Gerador</span>
          </button>

          {/* Botão Hamburguer Mobile — ao lado do Gerador, direita */}
          <button
            type="button"
            className="mobile-menu-toggle btn btn-secondary"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            style={{ padding: '0.45rem', alignItems: 'center', justifyContent: 'center', height: '38px', width: '38px', borderRadius: 'var(--radius-full)' }}
            aria-label="Abrir Menu"
          >
            {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* User Account Dropdown — oculto no mobile (opções ficam no sidebar drawer) */}
          <div className="hide-on-mobile" style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsAccountDropdownOpen(!isAccountDropdownOpen)}
              className="btn btn-secondary"
              style={{
                padding: '0.45rem 0.85rem',
                height: '38px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                gap: '0.55rem',
                borderColor: isAccountDropdownOpen ? 'var(--accent-cyan)' : undefined,
                boxShadow: isAccountDropdownOpen ? '0 0 12px rgba(0, 242, 254, 0.25)' : undefined,
              }}
            >
            <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 700, color: '#050811' }}>
              {vaultData.userProfile?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }} className="hide-mobile-text">
              {vaultData.userProfile?.name || 'Minha Conta'}
            </span>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', transform: isAccountDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </button>

          {/* Dropdown Popup Menu */}
          {isAccountDropdownOpen && (
            <>
              {/* Overlay for outside click closing */}
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setIsAccountDropdownOpen(false)}
              />

              <div
                className="glass-panel animate-fade-in"
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 0.5rem)',
                  width: '220px',
                  padding: '0.4rem',
                  zIndex: 50,
                  boxShadow: 'var(--shadow-md)',
                  background: 'rgba(13, 18, 29, 0.95)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <div style={{ padding: '0.6rem 0.75rem', borderBottom: '1px solid var(--border-light)', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', color: 'var(--text-primary)' }}>
                    {vaultData.userProfile?.name}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {vaultData.userProfile?.email}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => { setIsAccountDropdownOpen(false); setIsAccountModalOpen(true); }}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: 'none',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <User size={15} style={{ color: 'var(--accent-cyan)' }} />
                  Minha Conta
                </button>

                <button
                  type="button"
                  onClick={() => { setIsAccountDropdownOpen(false); setIsBackupOpen(true); }}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: 'none',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <Download size={15} style={{ color: 'var(--accent-emerald)' }} />
                  Backup do Cofre
                </button>

                <button
                  type="button"
                  onClick={() => { setIsAccountDropdownOpen(false); setIsSyncModalOpen(true); }}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: 'none',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <RefreshCw size={15} style={{ color: 'var(--accent-cyan)' }} />
                  Sincronização
                </button>

                <button
                  type="button"
                  onClick={() => { setIsAccountDropdownOpen(false); onLock(); }}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: 'none',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <Lock size={15} style={{ color: 'var(--accent-amber)' }} />
                  Trancar Cofre
                </button>

                <div style={{ height: '1px', background: 'var(--border-light)', margin: '0.35rem 0' }} />

                <button
                  type="button"
                  onClick={() => { setIsAccountDropdownOpen(false); onLock(); }}
                  style={{
                    width: '100%',
                    padding: '0.55rem 0.75rem',
                    background: 'none',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--color-danger)',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.55rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 42, 109, 0.12)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <LogOut size={15} style={{ color: 'var(--color-danger)' }} />
                  Sair / Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>

      {/* Body: Sidebar + Credentials & Folders Area */}
      <div className="vault-main-container">
        
        {/* Sidebar Container — fullscreen no mobile */}
        <aside className={`vault-sidebar ${isMobileSidebarOpen ? 'is-open' : ''}`}>
          <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-secondary)' }}>

            {/* Header do menu mobile com botão fechar */}
            <div className="mobile-menu-toggle" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.85rem 1.25rem',
              borderBottom: '1px solid var(--border-light)',
              flexShrink: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div style={{ padding: '0.4rem', background: 'rgba(0, 242, 254, 0.12)', border: '1px solid rgba(0, 242, 254, 0.3)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center' }}>
                  <Shield style={{ width: '18px', height: '18px', color: 'var(--accent-cyan)' }} />
                </div>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Pass<span className="gradient-text">Ai</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSidebarOpen(false)}
                style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}
                aria-label="Fechar menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo do sidebar (pastas) com scroll */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1rem 0' }}>
            <FolderList
              folders={vaultData.folders}
              credentials={vaultData.credentials}
              activeFolderId={activeFolderId}
              unlockedFolderPins={unlockedFolderPins}
              onSelectFolder={handleFolderSelect}
              onCreateFolder={() => { setIsMobileSidebarOpen(false); handleCreateFolder(); }}
              onCreateSubfolder={(id) => { setIsMobileSidebarOpen(false); handleCreateSubfolder(id); }}
              onEditFolder={(folder) => { setIsMobileSidebarOpen(false); handleEditFolder(folder); }}
              onDeleteFolder={(folder) => { setIsMobileSidebarOpen(false); handleDeleteFolder(folder); }}
              onRequestPinUnlock={(folder) => { setIsMobileSidebarOpen(false); setPinPromptFolder(folder); }}
            />
            </div>{/* fim do scroll */}

            {/* Seção de Conta Mobile — fixada na base do fullscreen */}
            <div className="mobile-account-section" style={{ padding: '0 1rem 1rem', borderTop: '1px solid var(--border-light)', flexShrink: 0 }}>
              {/* Perfil */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.75rem 0.25rem' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, color: '#050811', flexShrink: 0 }}>
                  {vaultData.userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {vaultData.userProfile?.name}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {vaultData.userProfile?.email}
                  </span>
                </div>
              </div>

              {/* Ações de Conta */}
              {[
                { icon: <User size={15} style={{ color: 'var(--accent-cyan)' }} />, label: 'Minha Conta', action: () => { setIsMobileSidebarOpen(false); setIsAccountModalOpen(true); } },
                { icon: <RefreshCw size={15} style={{ color: 'var(--accent-cyan)' }} />, label: 'Sincronização', action: () => { setIsMobileSidebarOpen(false); setIsSyncModalOpen(true); } },
                { icon: <Download size={15} style={{ color: 'var(--accent-emerald)' }} />, label: 'Backup do Cofre', action: () => { setIsMobileSidebarOpen(false); setIsBackupOpen(true); } },
                { icon: <Lock size={15} style={{ color: 'var(--accent-amber)' }} />, label: 'Trancar Cofre', action: () => { setIsMobileSidebarOpen(false); onLock(); } },
              ].map(({ icon, label, action }) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.5rem',
                    background: 'none',
                    border: 'none',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.7rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  {icon}{label}
                </button>
              ))}

              <div style={{ height: '1px', background: 'var(--border-light)', margin: '0.35rem 0' }} />

              <button
                type="button"
                onClick={() => { setIsMobileSidebarOpen(false); onLock(); }}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.5rem',
                  background: 'none',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-danger)',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.7rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,42,109,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <LogOut size={15} style={{ color: 'var(--color-danger)' }} />
                Sair / Logout
              </button>
            </div>
          </div>
        </aside>


        {/* Main Content Area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* Breadcrumbs Navigation & Header Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            
            {/* Breadcrumb Trail */}
            <nav style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.35rem' }}>
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;

                return (
                  <div key={crumb.id} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {idx > 0 && <ChevronRight size={13} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />}
                    <button
                      type="button"
                      onClick={() => handleFolderSelect(crumb.id)}
                      disabled={isLast}
                      style={{
                        background: isLast ? 'rgba(0, 242, 254, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                        border: isLast ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid rgba(255, 255, 255, 0.06)',
                        color: isLast ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        borderRadius: 'var(--radius-full)',
                        padding: '0.22rem 0.65rem',
                        fontSize: '0.78rem',
                        fontWeight: isLast ? 600 : 500,
                        cursor: isLast ? 'default' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (!isLast) {
                          e.currentTarget.style.background = 'rgba(0, 242, 254, 0.1)';
                          e.currentTarget.style.color = 'var(--accent-cyan)';
                          e.currentTarget.style.borderColor = 'rgba(0, 242, 254, 0.25)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isLast) {
                          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                        }
                      }}
                    >
                      {idx === 0 ? <Home size={13} /> : <FolderIcon size={13} />}
                      {crumb.name}
                    </button>
                  </div>
                );
              })}
            </nav>

            {/* Folder / Title Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  {activeFolderId === 'all' && 'Todas as Senhas'}
                  {activeFolderId === 'favorites' && 'Senhas Favoritas'}
                  {activeFolder && activeFolder.name}
                  {activeFolder?.isProtected && (
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', background: isCurrentFolderLocked ? 'rgba(255, 183, 3, 0.15)' : 'rgba(0, 245, 160, 0.15)', border: isCurrentFolderLocked ? '1px solid rgba(255, 183, 3, 0.3)' : '1px solid rgba(0, 245, 160, 0.3)', borderRadius: 'var(--radius-full)', color: isCurrentFolderLocked ? 'var(--accent-amber)' : 'var(--accent-emerald)', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Lock size={12} /> {isCurrentFolderLocked ? 'Trancada por PIN' : 'Desbloqueada'}
                    </span>
                  )}
                </h2>
                {activeFolder?.description && (
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem', margin: 0 }}>
                    {activeFolder.description}
                  </p>
                )}
              </div>

              {/* Action: Add Subfolder to current view */}
              {activeFolder && !isCurrentFolderLocked && (
                <button
                  className="btn btn-secondary"
                  onClick={() => handleCreateSubfolder(activeFolder.id)}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                >
                  <FolderPlus size={15} style={{ color: 'var(--accent-cyan)' }} />
                  Nova Subpasta
                </button>
              )}
            </div>
          </div>

          {/* BODY TOOLBAR: Search Bar + Action Shortcuts (Clean, frameless toolbar) */}
          <div className="body-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            
            {/* Search Input in Body */}
            <div className="body-toolbar-search" style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                className="input-field"
                placeholder="Buscar por título, e-mail, usuário, CPF ou site..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.4rem', paddingRight: '1rem', fontSize: '0.85rem' }}
              />
            </div>

            {/* Action Shortcuts in Body */}
            <div className="body-toolbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <button className="btn btn-secondary" onClick={handleCreateFolder} style={{ padding: '0.55rem 0.9rem', fontSize: '0.82rem' }}>
                <FolderPlus size={16} style={{ color: 'var(--accent-cyan)' }} />
                Nova Pasta
              </button>

              <button className="btn btn-primary" onClick={() => { setEditingCredential(null); setIsFormOpen(true); }} style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}>
                <Plus size={16} />
                Nova Credencial
              </button>
            </div>
          </div>

          {/* Folder Content & Skeletons */}
          {isFolderLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FolderIcon size={14} style={{ color: 'var(--accent-cyan)' }} />
                Carregando registros...
              </div>
              <div className="folders-grid">
                <FolderCardSkeleton />
                <FolderCardSkeleton />
              </div>
              <div className="credentials-grid">
                <CredentialCardSkeleton />
                <CredentialCardSkeleton />
                <CredentialCardSkeleton />
              </div>
            </div>
          ) : isCurrentFolderLocked ? (
            <div className="glass-panel animate-fade-in" style={{ padding: '4rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '1.25rem', background: 'rgba(255, 183, 3, 0.12)', border: '1px solid rgba(255, 183, 3, 0.3)', borderRadius: 'var(--radius-full)' }}>
                <Lock style={{ width: '48px', height: '48px', color: 'var(--accent-amber)' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Pasta Protegida por PIN
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '440px', lineHeight: 1.5 }}>
                As credenciais e subpastas contidas em <strong>"{activeFolder ? getFolderFullPath(vaultData.folders, activeFolder.id) : 'esta pasta'}"</strong> estão protegidas pela 2ª camada de segurança. Informe o PIN para liberar o acesso.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => activeFolder && setPinPromptFolder(activeFolder)}
                style={{ padding: '0.75rem 1.5rem', fontSize: '0.9rem', marginTop: '0.5rem' }}
              >
                <KeyRound size={18} />
                Desbloquear Pasta com PIN
              </button>
            </div>
          ) : (
            /* Unlocked View: Render Subfolders & Credentials */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Section 1: Subfolders Grid Cards (if any) */}
              {currentSubfolders.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FolderIcon size={14} style={{ color: 'var(--accent-cyan)' }} />
                    Pastas ({currentSubfolders.length})
                  </div>

                  <div className="folders-grid">
                    {currentSubfolders.map((folder) => {
                      const subCount = vaultData.folders.filter((f) => f.parentId === folder.id).length;
                      const credIds = getFolderAndSubfolderIds(vaultData.folders, folder.id);
                      const credCount = vaultData.credentials.filter((c) => credIds.includes(c.folderId)).length;
                      const isLocked = isFolderOrAncestorLocked(vaultData.folders, folder.id, unlockedFolderPins);

                      return (
                        <FolderCard
                          key={folder.id}
                          folder={folder}
                          subfolderCount={subCount}
                          credentialCount={credCount}
                          isLocked={isLocked}
                          onClick={() => handleFolderCardClick(folder)}
                          onCreateSubfolder={handleCreateSubfolder}
                          onEditFolder={handleEditFolder}
                          onDeleteFolder={handleDeleteFolder}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Section 2: Credentials Grid Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentSubfolders.length > 0 && (
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.5rem' }}>
                    <Key size={14} style={{ color: 'var(--accent-amber)' }} />
                    Senhas ({currentCredentials.length})
                  </div>
                )}

                {currentCredentials.length > 0 ? (
                  <div className="credentials-grid">
                    {currentCredentials.map((credential) => {
                      const credFolder = vaultData.folders.find((f) => f.id === credential.folderId);
                      const fullFolderPath = credFolder ? getFolderFullPath(vaultData.folders, credFolder.id) : undefined;
                      const isFolderProtected = credFolder?.isProtected || false;
                      const isUnlockedByPin = credFolder ? unlockedFolderPins[credFolder.id] || false : true;

                      return (
                        <CredentialCard
                          key={credential.id}
                          credential={credential}
                          folderName={fullFolderPath}
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
                  /* Empty State when no credentials exist in current level */
                  currentSubfolders.length === 0 && (
                    <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <Key style={{ width: '48px', height: '48px', color: 'var(--accent-cyan)', opacity: 0.5, marginBottom: '1rem' }} />
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>
                        Nenhum registro encontrado
                      </h3>
                      <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
                        {searchQuery ? 'Nenhum resultado corresponde à sua busca.' : 'Esta pasta ainda não possui senhas ou subpastas cadastradas.'}
                      </p>
                      <button
                        className="btn btn-primary"
                        onClick={() => { setEditingCredential(null); setIsFormOpen(true); }}
                      >
                        <Plus size={16} />
                        Cadastrar Primeira Credencial
                      </button>
                    </div>
                  )
                )}
              </div>

            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {isFolderModalOpen && (
        <FolderFormModal
          initialData={editingFolder}
          parentFolderId={parentFolderForSubfolderId}
          existingFolders={vaultData.folders}
          onSave={handleSaveFolder}
          onClose={() => { setIsFolderModalOpen(false); setEditingFolder(null); setParentFolderForSubfolderId(null); }}
        />
      )}

      {isFormOpen && (
        <CredentialFormModal
          initialData={editingCredential}
          folders={vaultData.folders}
          defaultFolderId={activeFolderId !== 'all' && activeFolderId !== 'favorites' ? activeFolderId : ''}
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

      {isAccountModalOpen && vaultData.userProfile && (
        <AccountProfileModal
          userProfile={vaultData.userProfile}
          vaultData={vaultData}
          onClose={() => setIsAccountModalOpen(false)}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
        />
      )}

      {isSyncModalOpen && vaultData.userProfile && (
        <SyncModal
          userProfile={vaultData.userProfile}
          vaultData={vaultData}
          masterPasswordKey={masterCryptoKey}
          onClose={() => setIsSyncModalOpen(false)}
          onUpdateSyncMode={async (mode: SyncMode) => {
            const updatedProfile = { ...vaultData.userProfile!, syncMode: mode };
            await onUpdateVault({ ...vaultData, userProfile: updatedProfile });
          }}
          onVaultUpdated={async (updatedVault: VaultData) => {
            await onUpdateVault(updatedVault);
          }}
        />
      )}

      <ConfirmModal
        isOpen={confirmModalState.isOpen}
        title={confirmModalState.title}
        message={confirmModalState.message}
        variant={confirmModalState.variant}
        confirmText={confirmModalState.confirmText}
        cancelText="Cancelar"
        onConfirm={confirmModalState.onConfirm}
        onCancel={() => setConfirmModalState((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
