import React from 'react';
import { Loader2 } from 'lucide-react';
export const LoadingState = ({ message = 'Loading data...', className = '', }) => {
    return (<div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3"/>
      <span className="text-xs font-medium text-slate-500">{message}</span>
    </div>);
};
