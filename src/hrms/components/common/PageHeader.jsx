import React from 'react';

/*
 * The CRM's page header: serif title, actions on the right. A short description (an ID, a count) shows under the
 * title; the long explanatory ones and the breadcrumbs don't (the sidebar already says where you are).
 */
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
