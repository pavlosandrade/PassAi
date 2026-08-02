'use client';

export default function FolderCardSkeleton() {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 'var(--radius-md)',
        background: 'rgba(13, 18, 29, 0.65)',
        border: '1px solid var(--border-light)',
        padding: '1.25rem',
      }}
    >
      {/* Folder Tab Shape Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div className="skeleton" style={{ width: '110px', height: '15px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '60px', height: '11px', borderRadius: '4px' }} />
          </div>
        </div>
        <div className="skeleton" style={{ width: '65px', height: '22px', borderRadius: 'var(--radius-full)' }} />
      </div>

      {/* Subfolder Chips Skeleton */}
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.75rem' }}>
        <div className="skeleton" style={{ width: '70px', height: '20px', borderRadius: 'var(--radius-full)' }} />
        <div className="skeleton" style={{ width: '85px', height: '20px', borderRadius: 'var(--radius-full)' }} />
      </div>
    </div>
  );
}
