'use client';

import { useState } from 'react';
import { Folder, Credential } from '@/types/vault';
import {
  Folder as FolderIcon,
  Briefcase,
  Landmark,
  Share2,
  Shield,
  Heart,
  Cpu,
  Globe,
  Star,
  Plus,
  Lock,
  ChevronDown,
  ChevronRight,
  FolderPlus,
  Pencil,
  Trash2,
} from 'lucide-react';
import {
  buildFolderTree,
  FolderTreeNode,
  getFolderAndSubfolderIds,
  isFolderOrAncestorLocked,
} from '@/services/folderService';

interface FolderListProps {
  folders: Folder[];
  credentials: Credential[];
  activeFolderId: string;
  unlockedFolderPins: Record<string, boolean>;
  onSelectFolder: (folderId: string) => void;
  onCreateFolder: () => void;
  onCreateSubfolder: (parentFolderId: string) => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folderId: string) => void;
  onRequestPinUnlock?: (folder: Folder) => void;
}

const FOLDER_ICONS: Record<string, any> = {
  Folder: FolderIcon,
  Briefcase: Briefcase,
  Landmark: Landmark,
  Share2: Share2,
  Shield: Shield,
  Heart: Heart,
  Cpu: Cpu,
  Globe: Globe,
};

export default function FolderList({
  folders,
  credentials,
  activeFolderId,
  unlockedFolderPins,
  onSelectFolder,
  onCreateFolder,
  onCreateSubfolder,
  onEditFolder,
  onDeleteFolder,
  onRequestPinUnlock,
}: FolderListProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsed((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  const getCredentialCount = (folderId: string) => {
    if (folderId === 'all') {
      return credentials.filter((c) => !isFolderOrAncestorLocked(folders, c.folderId, unlockedFolderPins)).length;
    }
    if (folderId === 'favorites') {
      return credentials.filter(
        (c) => c.isFavorite && !isFolderOrAncestorLocked(folders, c.folderId, unlockedFolderPins)
      ).length;
    }

    const targetIds = getFolderAndSubfolderIds(folders, folderId);
    return credentials.filter((c) => targetIds.includes(c.folderId)).length;
  };

  const handleFolderClick = (folder: Folder) => {
    onSelectFolder(folder.id);
    const isLocked = isFolderOrAncestorLocked(folders, folder.id, unlockedFolderPins);
    if (isLocked && onRequestPinUnlock) {
      onRequestPinUnlock(folder);
    }
  };

  const treeRoots = buildFolderTree(folders);

  const renderTreeNode = (node: FolderTreeNode, depth: number = 0) => {
    const { folder, children } = node;
    const IconComponent = FOLDER_ICONS[folder.icon || 'Folder'] || FolderIcon;
    const isActive = activeFolderId === folder.id;
    const isCollapsed = collapsed[folder.id];
    const hasChildren = children.length > 0;
    const count = getCredentialCount(folder.id);
    const isLocked = isFolderOrAncestorLocked(folders, folder.id, unlockedFolderPins);

    return (
      <div key={folder.id} style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          onClick={() => handleFolderClick(folder)}
          className="btn"
          style={{
            justifyContent: 'space-between',
            background: isActive ? 'rgba(0, 242, 254, 0.15)' : 'transparent',
            border: isActive ? '1px solid rgba(0, 242, 254, 0.3)' : '1px solid transparent',
            color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.5rem 0.65rem',
            paddingLeft: `${0.65 + depth * 0.85}rem`,
            fontSize: '0.85rem',
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 0, flex: 1 }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={(e) => toggleCollapse(folder.id, e)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', padding: 0 }}
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
            ) : (
              <div style={{ width: '14px' }} />
            )}

            <IconComponent size={16} style={{ color: folder.color || 'var(--accent-cyan)', flexShrink: 0 }} />

            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isActive ? 600 : 400 }}>
              {folder.name}
            </span>

            {isLocked && (
              <span title="Protegida por PIN (Trancada)" style={{ display: 'inline-flex', marginLeft: '0.15rem' }}>
                <Lock size={12} style={{ color: 'var(--accent-amber)', flexShrink: 0 }} />
              </span>
            )}
          </div>

          {/* Quick Actions & Count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexShrink: 0 }}>
            <span className="font-mono" style={{ fontSize: '0.72rem', opacity: 0.75, marginRight: '0.2rem' }}>
              {count}
            </span>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCreateSubfolder(folder.id); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.15rem', display: 'flex' }}
              title="Criar Subpasta"
            >
              <FolderPlus size={13} style={{ color: 'var(--accent-cyan)' }} />
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.15rem', display: 'flex' }}
              title="Editar Pasta"
            >
              <Pencil size={12} />
            </button>

            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.15rem', display: 'flex' }}
              title="Excluir Pasta"
            >
              <Trash2 size={12} style={{ color: 'var(--color-danger)' }} />
            </button>
          </div>
        </div>

        {/* Children Render */}
        {hasChildren && !isCollapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', marginTop: '0.15rem' }}>
            {children.map((childNode) => renderTreeNode(childNode, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', width: '100%' }}>
      <div style={{ padding: '0.4rem 0.65rem', fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Navegação</span>
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
          padding: '0.6rem 0.75rem',
          fontSize: '0.88rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <FolderIcon size={17} />
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
          padding: '0.6rem 0.75rem',
          fontSize: '0.88rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Star size={17} fill={activeFolderId === 'favorites' ? 'currentColor' : 'none'} />
          <span>Favoritos</span>
        </div>
        <span className="font-mono" style={{ fontSize: '0.75rem', opacity: 0.8 }}>{getCredentialCount('favorites')}</span>
      </button>

      <div style={{ height: '1px', background: 'var(--border-light)', margin: '0.4rem 0' }} />

      {/* Section Header: Pastas + Dynamic Nova Pasta Button */}
      <div style={{ padding: '0.2rem 0.65rem', fontSize: '0.73rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Pastas ({folders.length})</span>
        <button
          onClick={onCreateFolder}
          style={{ background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem' }}
          title="Nova Pasta Raiz"
        >
          <Plus size={15} />
          Nova Pasta
        </button>
      </div>

      {/* Folder Tree */}
      {treeRoots.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
          {treeRoots.map((rootNode) => renderTreeNode(rootNode, 0))}
        </div>
      ) : (
        <div style={{ padding: '1rem 0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-light)' }}>
          Nenhuma pasta criada. Clique em <strong>+ Nova Pasta</strong> para começar.
        </div>
      )}
    </aside>
  );
}
