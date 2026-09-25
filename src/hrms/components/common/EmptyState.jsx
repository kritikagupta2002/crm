import React from 'react';
import { FolderSearch } from 'lucide-react';
import { Button } from './Button';
export const EmptyState = ({ title = 'No records found', description = 'There are no items matching your criteria or currently available in this view.', icon, actionLabel, onAction, className = '', }) => {
    return (<div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl bg-white dark:bg-[#1A2430] border border-dashed border-slate-300 dark:border-[#253344] ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-[#111821] border border-slate-200 dark:border-[#253344] flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 shadow-xs">
        {icon || <FolderSearch className="w-7 h-7"/>}
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && onAction && (<Button onClick={onAction} size="sm" variant="primary">
          {actionLabel}
        </Button>)}
    </div>);
};
