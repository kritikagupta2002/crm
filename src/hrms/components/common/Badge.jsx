import React from 'react';

const TONES = {
    info: 'tone-info',
    attention: 'tone-attention',
    urgent: 'tone-urgent',
    good: 'tone-good',
    neutral: 'tone-neutral',
    blue: 'tone-info',
    emerald: 'tone-good',
    amber: 'tone-attention',
    rose: 'tone-urgent',
    slate: 'tone-neutral',
    purple: 'tone-info',
    cyan: 'tone-info',
    gold: 'tone-attention',
    ochre: 'tone-attention',
    navy: 'tone-neutral',
};

export const Badge = ({ children, variant = 'neutral', className = '' }) => (
    <span className={`pill status-pill ${TONES[variant] ?? 'tone-neutral'} ${className}`}>{children}</span>
);
