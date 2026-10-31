import React from 'react';

/* The CRM's card header: icon, serif title, optional count and actions on the right.
   `inset` is for cards that already pad their content. */
export const CardHeader = ({ icon, title, count, inset = false, children }) => (
    <div className={`card-header${inset ? ' is-inset' : ''}`}>
      {icon && <span className="card-icon">{icon}</span>}
      <h2>{title}</h2>
      {count != null && <span className="pill tone-neutral">{count}</span>}
      {children && <div className="card-actions">{children}</div>}
    </div>
);
