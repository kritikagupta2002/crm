import React from 'react';
import { AlertOctagon } from 'lucide-react';
import { Button } from './Button';
export const ErrorState = ({ title = 'Something went wrong', message = 'An unexpected error occurred while loading this section. Please try again.', onRetry, className = '', }) => {
    return (<div className={`flex flex-col items-center justify-center p-8 text-center bg-rose-50/50 border border-rose-200 rounded-xl ${className}`}>
      <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-3">
        <AlertOctagon className="w-6 h-6"/>
      </div>
      <h4 className="text-sm font-bold text-rose-900 mb-1">{title}</h4>
      <p className="text-xs text-rose-700 max-w-md mb-4">{message}</p>
      {onRetry && (<Button size="sm" variant="danger" onClick={onRetry}>
          Try Again
        </Button>)}
    </div>);
};
