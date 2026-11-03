import React from 'react';

/*
 * Skeleton placeholders: shown in the exact spot where content will appear while the page's data loads (cards,
 * table rows, calendar grids). Use <Spinner> (Loader) instead for actions in progress: saving, submitting, a
 * button waiting on the server.
 */
export const Skeleton = ({ width, height = 12, radius = 6, className = '', style }) => (
  <span
    aria-hidden="true"
    className={`skeleton ${className}`}
    style={{ width: width ?? '100%', height, borderRadius: radius, ...style }}
  />
);

/* A text block of a few lines; the last one shorter, like a real paragraph. */
export const SkeletonText = ({ lines = 2, className = '' }) => (
  <span className={`skeleton-stack ${className}`} aria-hidden="true">
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton key={i} width={i === lines - 1 && lines > 1 ? '60%' : '100%'} height={10} />
    ))}
  </span>
);

/* Placeholder for a stat card (icon, label, figure). */
export const SkeletonStatCard = () => (
  <div className="card skeleton-card" aria-hidden="true">
    <div className="skeleton-row">
      <Skeleton width={36} height={36} radius={10} />
      <Skeleton width="45%" height={11} />
    </div>
    <Skeleton width="55%" height={22} style={{ marginTop: 14 }} />
    <Skeleton width="70%" height={9} style={{ marginTop: 10 }} />
  </div>
);

export const SkeletonStatGrid = ({ count = 4 }) => (
  <section className="stat-grid" aria-busy="true" aria-label="Loading">
    {Array.from({ length: count }, (_, i) => <SkeletonStatCard key={i} />)}
  </section>
);

/* Table body rows: put inside an existing <tbody> so the real header stays visible. */
export const SkeletonTableRows = ({ rows = 5, columns = 6 }) => (
  <>
    {Array.from({ length: rows }, (_, r) => (
      <tr key={r} aria-hidden="true" className="skeleton-tr">
        {Array.from({ length: columns }, (_, c) => (
          <td key={c} style={{ padding: '12px 10px' }}>
            <Skeleton width={c === 0 ? '80%' : `${50 + ((r * 7 + c * 13) % 40)}%`} height={10} />
          </td>
        ))}
      </tr>
    ))}
  </>
);

/* A grid of square cells, for calendars. */
export const SkeletonGrid = ({ cells = 35, columns = 7, cellHeight = 44 }) => (
  <div className="skeleton-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }} aria-hidden="true">
    {Array.from({ length: cells }, (_, i) => <Skeleton key={i} height={cellHeight} radius={8} />)}
  </div>
);

/* Small inline spinner for actions in progress. */
export const Spinner = ({ size = 16, className = '', label }) => (
  <span className={`inline-spinner ${className}`} role="status" aria-label={label || 'Loading'}>
    <span className="inline-spinner-ring" style={{ width: size, height: size }} />
    {label && <span className="inline-spinner-label">{label}</span>}
  </span>
);

/* Whole-page placeholder while a page's code loads: title, stat cards and a table. */
export const PageSkeleton = () => (
  <div className="space-y-4" aria-busy="true" aria-label="Loading page">
    <div className="skeleton-row" style={{ justifyContent: 'space-between' }}>
      <span className="skeleton-stack" style={{ maxWidth: 360 }}>
        <Skeleton width="70%" height={20} />
        <Skeleton width="100%" height={10} />
      </span>
      <Skeleton width={140} height={34} radius={8} />
    </div>
    <SkeletonStatGrid count={4} />
    <div className="card" style={{ padding: 16 }}>
      <Skeleton width="30%" height={14} />
      <table style={{ width: '100%', marginTop: 12 }}><tbody><SkeletonTableRows rows={6} columns={6} /></tbody></table>
    </div>
  </div>
);
