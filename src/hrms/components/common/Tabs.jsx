import React from 'react';

/* The CRM's tabs: underline tabs as on the leads list, or the segmented switch (Month / Quarter / FY). */
export const Tabs = ({ tabs, activeTab, onChange, className = '', variant = 'underline', }) => {
    if (variant === 'pills') {
        return (<div className={`segmented ${className}`}>
        {tabs.map((tab) => (<button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={activeTab === tab.id ? 'is-selected' : ''}>
            {tab.icon && <span className="tab-icon">{tab.icon}</span>}
            {tab.label}
            {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
          </button>))}
      </div>);
    }
    return (<nav className={`page-tabs ${className}`} aria-label="Tabs">
      {tabs.map((tab) => (<button key={tab.id} type="button" onClick={() => onChange(tab.id)} className={`page-tab ${activeTab === tab.id ? 'is-active' : ''}`}>
          {tab.icon && <span className="tab-icon">{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
        </button>))}
    </nav>);
};
