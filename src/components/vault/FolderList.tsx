'use client';

import { Folder, Credential } from '@/types/vault';
import { Folder as FolderIcon, Briefcase, Landmark, Share2, Star, Plus, Lock } from 'lucide-react';

interface FolderListProps {
  folders: Folder[];
  credentials: Credential[];
  activeFolderId: string;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder?: () => void;
}

const FOLDER_ICONS: Record<string, any> = {
  Folder: FolderIcon,
  Briefcase: Briefcase,
  Landmark: Landmark,
  Share2: Share2,
};

export default function FolderList({
  folders,
  credentials,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
}: FolderListProps) {
  const getCredentialCount = (folderId: string) => {
    if (folderId === 'all') return credentials.length;
    if (folderId === 'favorites') return credentials.filter((c) => c.isFavorite).length;
    return credentials.filter((c) => c.folderId === folderId).length;
  };

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
      <div style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Navegação</span>
        {onCreateFolder && (
          <button
            onClick={onCreateFolder}
            style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Nova Pasta"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      {/* Item: Todas */}
      <button
        onClick={() => onSelectFolder('all')}
        className="btn"
        style={{
          justifyContent: 'space-between',
          background: activeFolderId === 'all' ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
          border: activeFolderId === 'all' ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
          color: activeFolderId === 'all' ? 'var(--accent-cyan)' : 'var(--text-secondary)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem 0.85rem',
          fontSize: '0.9rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <FolderIcon size={18} />
          <span>Todas as Senhas</span>
        </div>
        <span className="font-mono" style={{ fontSize: '0.75rem', opacity: 0.8 }}>{getCredentialCount('all')}</span>
      </button>

      {/* Item: Favoritos */}
      <button
        onClick={() => onSelectFolder('favorites')}
        className="btn"
        style={{
          justifyContent: 'space-between',
          background: activeFolderId === 'favorites' ? 'rgba(255, 183, 3, 0.15)' : 'transparent',
          border: activeFolderId === 'favorites' ? '1px solid rgba(255, 183, 3, 0.3)' : '1px solid transparent',
          color: activeFolderId === 'favorites' ? 'var(--accent-amber)' : 'var(--text-secondary)',
          borderRadius: 'var(--radius-sm)',
          padding: '0.65rem 0.85rem',
          fontSize: '0.9rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <Star size={18} fill={activeFolderId === 'favorites' ? 'currentColor' : 'none'} />
          <span>Favoritos</span>
        </div>
        <span className="font-mono" style={{ fontSize: '0.75rem', opacity: 0.8 }}>{getCredentialCount('favorites')}</span>
      </button>

      <div style={{ height: '1px', background: 'var(--border-light)', margin: '0.4rem 0' }} />

      <div style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Pastas ({folders.length})
      </div>

      {/* User & Default Folders */}
      {folders.map((folder) => {
        const IconComponent = FOLDER_ICONS[folder.icon] || FolderIcon;
        const isActive = activeFolderId === folder.id;

        return (
          <button
            key={folder.id}
            onClick={() => onSelectFolder(folder.id)}
            className="btn"
            style={{
              justifyContent: 'space-between',
              background: isActive ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              border: isActive ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.65rem 0.85rem',
              fontSize: '0.9rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <IconComponent size={18} style={{ color: folder.color || 'var(--accent-cyan)' }} />
              <span>{folder.name}</span>
              {folder.isProtected && (
                <span title="Protegida por PIN (2ª Camada)" style={{ display: 'inline-flex', marginLeft: '0.2rem' }}>
                  <Lock size={13} style={{ color: 'var(--accent-amber)' }} />
                </span>
              )}
            </div>
            <span className="font-mono" style={{ fontSize: '0.75rem', opacity: 0.8 }}>{getCredentialCount(folder.id)}</span>
          </button>
        );
      })}
    </aside>
  );
}
