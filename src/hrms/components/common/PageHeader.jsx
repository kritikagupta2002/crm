import React from 'react';

export const PageHeader = ({ title, description, actions, badge, className = '' }) => {
    const note = typeof description === 'string' ? (description.length <= 70 ? description : null) : description;
    return (
      <header className={`page-header ${className}`}>
        <div className="page-title">
          <h1>
            {title}
            {badge && <span className="page-title-badge">{badge}</span>}
          </h1>
          {note && <p>{note}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </header>
    );
};
