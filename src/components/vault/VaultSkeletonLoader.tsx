'use client';

import CredentialCardSkeleton from './CredentialCardSkeleton';
import FolderCardSkeleton from './FolderCardSkeleton';

export default function VaultSkeletonLoader() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      {/* Header Skeleton */}
      <header className="glass-panel" style={{ borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0, padding: '0.85rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="skeleton" style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div className="skeleton" style={{ width: '90px', height: '16px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '120px', height: '10px', borderRadius: '4px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="skeleton" style={{ width: '130px', height: '38px', borderRadius: 'var(--radius-full)' }} />
          <div className="skeleton" style={{ width: '150px', height: '38px', borderRadius: 'var(--radius-full)' }} />
        </div>
      </header>

      {/* Main Body Skeleton */}
      <div style={{ flex: 1, display: 'flex', maxWidth: '1400px', width: '100%', margin: '0 auto', padding: '1.5rem', gap: '1.5rem' }}>
        
        {/* Sidebar Skeleton */}
        <div style={{ width: '270px', flexShrink: 0 }}>
          <div className="glass-panel" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="skeleton" style={{ width: '100%', height: '24px', borderRadius: '4px', marginBottom: '0.5rem' }} />
            <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: 'var(--radius-sm)' }} />
            <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: 'var(--radius-sm)' }} />
          </div>
        </div>

        {/* Content Area Skeleton */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Breadcrumb & Title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div className="skeleton" style={{ width: '180px', height: '24px', borderRadius: 'var(--radius-full)' }} />
            <div className="skeleton" style={{ width: '240px', height: '28px', borderRadius: '6px' }} />
          </div>

          {/* Search Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
            <div className="skeleton" style={{ flex: 1, height: '42px', borderRadius: 'var(--radius-md)' }} />
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <div className="skeleton" style={{ width: '120px', height: '42px', borderRadius: 'var(--radius-md)' }} />
              <div className="skeleton" style={{ width: '150px', height: '42px', borderRadius: 'var(--radius-md)' }} />
            </div>
          </div>

          {/* Folders Skeleton Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            <FolderCardSkeleton />
            <FolderCardSkeleton />
          </div>

          {/* Credentials Skeleton Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem', marginTop: '0.5rem' }}>
            <CredentialCardSkeleton />
            <CredentialCardSkeleton />
            <CredentialCardSkeleton />
          </div>
        </main>
      </div>
    </div>
  );
}
