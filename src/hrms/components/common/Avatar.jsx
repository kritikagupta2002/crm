import React from 'react';

/* Initials in a teal circle, as everywhere in the CRM (no photos: the demo has none of the real staff). */
const SIZES = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 };

const initialsOf = (name = '') => name
    .replace(/^Dr\.\s*/, '')
    .replace(/\./g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const Avatar = ({ name = 'User', size = 'md', status, className = '' }) => {
    const px = SIZES[size] ?? SIZES.md;
    return (
      <span className={`relative inline-flex shrink-0 ${className}`}>
        <span style={{ width: px, height: px, fontSize: Math.round(px * 0.36), background: 'var(--teal-700)', color: '#fff', borderRadius: '50%', display: 'grid', placeItems: 'center', fontWeight: 600 }}>
          {initialsOf(name)}
        </span>
        {status && <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ring-2 ring-white ${status === 'online' ? 'bg-emerald-500' : status === 'busy' ? 'bg-rose-500' : status === 'away' ? 'bg-amber-500' : 'bg-slate-400'}`}/>}
      </span>
    );
};
