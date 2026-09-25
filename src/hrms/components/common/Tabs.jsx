import React from 'react';
export const Tabs = ({ tabs, activeTab, onChange, className = '', variant = 'underline', }) => {
    if (variant === 'pills') {
        return (<div className={`flex items-center gap-1.5 p-1 bg-white dark:bg-[#142028] rounded-xl overflow-x-auto custom-sidebar-scroll border border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] shadow-2xs w-fit ${className}`}>
        {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (<button key={tab.id} onClick={() => onChange(tab.id)} className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer ${isActive
                        ? 'bg-[var(--teal-700,#1f6f78)] text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
              {tab.icon && <span className="w-3.5 h-3.5 shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-[#1e2c37] text-slate-600 dark:text-slate-300'}`}>
                  {tab.count}
                </span>)}
            </button>);
            })}
      </div>);
    }
    return (<div className={`border-b border-[var(--line,#e1e8eb)] dark:border-[#1e2c37] overflow-x-auto custom-sidebar-scroll ${className}`}>
      <nav className="flex space-x-4 sm:space-x-6 min-w-max pb-0.5" aria-label="Tabs">
        {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (<button key={tab.id} onClick={() => onChange(tab.id)} className={`flex items-center gap-2 py-3 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap transition-all duration-200 cursor-pointer ${isActive
                    ? 'border-[var(--teal-700,#1f6f78)] text-[var(--teal-700,#1f6f78)] dark:text-teal-400 font-bold'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600'}`}>
              {tab.icon && <span className="w-4 h-4 shrink-0">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (<span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${isActive
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300'
                        : 'bg-slate-100 dark:bg-[#1e2c37] text-slate-600 dark:text-slate-400'}`}>
                  {tab.count}
                </span>)}
            </button>);
        })}
      </nav>
    </div>);
};
