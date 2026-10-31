import React from 'react';
import { Card } from './Card';

/* The CRM's card with a header: optional icon, serif title, actions on the right. */
export const ChartCard = ({ title, subtitle, icon, action, children, className = '', goldTopBorder = false, }) => {
    return (<Card goldTopBorder={goldTopBorder} className={`flex flex-col ${className}`}>
      <div className="card-header">
        {icon && <span className="card-icon">{icon}</span>}
        <div className="card-title-block">
          <h2>{title}</h2>
          {subtitle && <p className="card-sub">{subtitle}</p>}
        </div>
        {action && <div className="card-actions">{action}</div>}
      </div>
      <div className="card-body">
        {children}
      </div>
    </Card>);
};
