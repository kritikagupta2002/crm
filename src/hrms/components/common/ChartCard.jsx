import React from 'react';
import { Card } from './Card';
export const ChartCard = ({ title, subtitle, action, children, className = '', goldTopBorder = false, }) => {
    return (<Card goldTopBorder={goldTopBorder} className={`p-5 flex flex-col rounded-xl border border-slate-200/80 dark:border-[#253344] shadow-xs ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#253344] mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="flex-1 w-full min-h-[260px]">
        {children}
      </div>
    </Card>);
};
