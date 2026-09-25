import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';

/* The CRM's stat card (KpiCard): the tone colours the icon and the top edge. The tone comes from the colour the page gave the icon. */
const toneOf = (colours = '') => {
    if (/emerald|green/.test(colours))
        return 'tone-good';
    if (/rose|red/.test(colours))
        return 'tone-urgent';
    if (/amber|orange|yellow|gold/.test(colours))
        return 'tone-attention';
    if (/blue|sky|indigo|teal|cyan|purple|violet/.test(colours))
        return 'tone-info';
    return 'tone-neutral';
};

export const StatCard = ({ title, value, icon, iconBgColor, tone, change, changeType = 'neutral', caption, onClick, className = '' }) => (
    <article onClick={onClick} className={`card stat-card ${tone ?? toneOf(iconBgColor)} ${onClick ? 'is-link lift cursor-pointer' : ''} ${className}`}>
      <div className="stat-top">
        {icon && <span className="stat-icon [&>svg]:w-5 [&>svg]:h-5">{icon}</span>}
        <h3>{title}</h3>
      </div>
      <strong className="stat-value">{value}</strong>
      {(change || caption) && (<div className="stat-meta">
          <span className="muted">
            {change && (<b className={changeType === 'increase' ? 'text-green' : changeType === 'decrease' ? 'text-red' : undefined}>
                {changeType === 'increase' && <TrendingUp size={12}/>}
                {changeType === 'decrease' && <TrendingDown size={12}/>} {change}
              </b>)}
            {change && caption ? ' · ' : ''}
            {caption}
          </span>
        </div>)}
    </article>
);
