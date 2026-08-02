'use client';

import { Folder } from '@/types/vault';
import {
  Folder as FolderIcon,
  Briefcase,
  Landmark,
  Share2,
  Shield,
  Heart,
  Cpu,
  Globe,
  Lock,
  FolderPlus,
  Pencil,
  Trash2,
  ChevronRight,
  KeyRound,
} from 'lucide-react';

interface FolderCardProps {
  folder: Folder;
  subfolderCount: number;
  credentialCount: number;
  isLocked?: boolean;
  onClick: () => void;
  onCreateSubfolder: (folderId: string) => void;
  onEditFolder: (folder: Folder) => void;
  onDeleteFolder: (folderId: string) => void;
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

export default function FolderCard({
  folder,
  subfolderCount,
  credentialCount,
  isLocked = false,
  onClick,
  onCreateSubfolder,
  onEditFolder,
  onDeleteFolder,
}: FolderCardProps) {
  const IconComponent = FOLDER_ICONS[folder.icon || 'Folder'] || FolderIcon;
  const accentColor = folder.color || 'var(--accent-cyan)';

  return (
    <div
      onClick={onClick}
      className="glass-card animate-fade-in"
      style={{
        padding: '1.25rem',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        border: `1px solid ${accentColor}33`,
        background: `linear-gradient(135deg, rgba(255, 255, 255, 0.03) 0%, ${accentColor}0D 100%)`,
        borderRadius: 'var(--radius-md)',
        minHeight: '135px',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.borderColor = `${accentColor}88`;
        e.currentTarget.style.boxShadow = `0 8px 24px ${accentColor}20`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = `${accentColor}33`;
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Header: Icon, Tab Accent, Name & Lock */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
          <div
            style={{
              padding: '0.65rem',
              background: `${accentColor}1A`,
              border: `1px solid ${accentColor}40`,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <IconComponent size={24} style={{ color: accentColor }} />
          </div>

          <div style={{ minWidth: 0 }}>
            <h3
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                margin: 0,
              }}
            >
              {folder.name}
            </h3>

            {folder.isProtected && (
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '0.1rem 0.45rem',
                  background: isLocked ? 'rgba(255, 183, 3, 0.15)' : 'rgba(0, 245, 160, 0.15)',
                  border: isLocked ? '1px solid rgba(255, 183, 3, 0.3)' : '1px solid rgba(0, 245, 160, 0.3)',
                  borderRadius: 'var(--radius-full)',
                  color: isLocked ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  marginTop: '0.25rem',
                  fontWeight: 600,
                }}
              >
                <Lock size={10} /> {isLocked ? 'Trancada' : 'PIN OK'}
              </span>
            )}
          </div>
        </div>

        {/* Quick Actions (Prevent card click propagation) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onCreateSubfolder(folder.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
            }}
            title="Criar Subpasta"
          >
            <FolderPlus size={15} style={{ color: 'var(--accent-cyan)' }} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEditFolder(folder);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
            }}
            title="Editar Pasta"
          >
            <Pencil size={14} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(folder.id);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-danger)',
              cursor: 'pointer',
              padding: '0.25rem',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              opacity: 0.8,
            }}
            title="Excluir Pasta"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Description if present */}
      {folder.description && (
        <p
          style={{
            fontSize: '0.78rem',
            color: 'var(--text-secondary)',
            margin: '0.5rem 0',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {folder.description}
        </p>
      )}

      {/* Footer Info Badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.75rem',
          paddingTop: '0.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
            <KeyRound size={12} style={{ color: accentColor }} />
            {credentialCount} {credentialCount === 1 ? 'senha' : 'senhas'}
          </span>

          {subfolderCount > 0 && (
            <>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <FolderIcon size={12} />
                {subfolderCount} {subfolderCount === 1 ? 'subpasta' : 'subpastas'}
              </span>
            </>
          )}
        </div>

        <span style={{ color: accentColor, display: 'flex', alignItems: 'center' }}>
          <ChevronRight size={16} />
        </span>
      </div>
    </div>
  );
}
