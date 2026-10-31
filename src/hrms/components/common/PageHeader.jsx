import React from 'react';

/*
 * The CRM's page header: serif title, actions on the right, descriptive subtitle.
 */
export const PageHeader = ({ title, description, actions, badge, className = '' }) => {
  return (
    <header className={`page-header ${className}`}>
      <div className="page-title">
        <h1>
          {title}
          {badge && <span className="page-title-badge">{badge}</span>}
        </h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
};
