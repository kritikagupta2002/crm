import React, { forwardRef } from 'react';
import { Calendar } from 'lucide-react';
export const DatePicker = forwardRef(({ label, error, helperText, isRequired, className = '', id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (<div className="w-full flex flex-col space-y-1">
      {label && (<label htmlFor={inputId} className="text-xs font-semibold text-[#3D2D1E] dark:text-slate-300 flex items-center gap-1">
          {label}
          {isRequired && <span className="text-rose-500 font-bold">*</span>}
        </label>)}
      <div className="relative rounded-lg shadow-xs">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Calendar className="w-4 h-4"/>
        </div>
        <input type="date" ref={ref} id={inputId} disabled={disabled} className={`w-full rounded-lg text-sm bg-white dark:bg-[#111821] border pl-9 pr-3.5 py-2 transition-all duration-150
            ${disabled ? 'bg-[#F8F4EE] dark:bg-[#0c1219] text-[#A09080] dark:text-slate-500 cursor-not-allowed border-[#E8E4DC] dark:border-[#253344]' : 'text-[#2D3748] dark:text-slate-200'}
            ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200' : 'border-[#E8E4DC] dark:border-[#374B63] focus:border-[#D5860B] focus:ring-2 focus:ring-[#FEC13D]/25'}
            focus:outline-none ${className}`} {...props}/>
      </div>
      {error ? (<span className="text-xs text-rose-600 font-medium">{error}</span>) : helperText ? (<span className="text-xs text-[#5A5A5A] dark:text-slate-400">{helperText}</span>) : null}
    </div>);
});
DatePicker.displayName = 'DatePicker';
