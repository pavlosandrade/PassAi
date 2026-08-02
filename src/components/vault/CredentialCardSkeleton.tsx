'use client';

export default function CredentialCardSkeleton() {
  return (
    <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--border-light)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            <div className="skeleton" style={{ width: '120px', height: '14px', borderRadius: '4px' }} />
            <div className="skeleton" style={{ width: '70px', height: '10px', borderRadius: '4px' }} />
          </div>
        </div>
        <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: '50%' }} />
      </div>

      {/* Dynamic Fields Skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: 'var(--radius-sm)' }} />
        <div className="skeleton" style={{ width: '100%', height: '36px', borderRadius: 'var(--radius-sm)' }} />
      </div>

      {/* Footer Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="skeleton" style={{ width: '80px', height: '12px', borderRadius: '4px' }} />
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)' }} />
          <div className="skeleton" style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)' }} />
        </div>
      </div>
    </div>
  );
}
