import React from 'react';

/* The CRM's card; `hoverable` lifts it like the CRM's clickable cards, `goldTopBorder` adds the gold edge. */
export const Card = ({ children, className = '', onClick, hoverable = false, goldTopBorder = false }) => (
    <div onClick={onClick} className={`card relative overflow-hidden ${goldTopBorder ? 'card-gold-edge' : ''} ${hoverable ? 'lift cursor-pointer' : ''} ${className}`}>
      {children}
    </div>
);
