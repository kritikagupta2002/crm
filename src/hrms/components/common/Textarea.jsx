import React, { forwardRef } from 'react';
export const Textarea = forwardRef(({ label, error, helperText, isRequired, className = '', id, rows = 3, disabled, ...props }, ref) => {
    const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (<div className="w-full flex flex-col space-y-1">
      {label && (<label htmlFor={textareaId} className="text-xs font-semibold text-[#3D2D1E] dark:text-slate-300 flex items-center gap-1">
          {label}
          {isRequired && <span className="text-rose-500 font-bold">*</span>}
        </label>)}
      <textarea ref={ref} id={textareaId} rows={rows} disabled={disabled} className={`w-full rounded-lg text-sm bg-white dark:bg-[#111821] border transition-all duration-150 p-3 placeholder:text-slate-400 dark:placeholder:text-slate-500
          ${disabled ? 'bg-[#F8F4EE] dark:bg-[#0c1219] text-[#A09080] dark:text-slate-500 cursor-not-allowed border-[#E8E4DC] dark:border-[#253344]' : 'text-[#2D3748] dark:text-slate-200'}
          ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200' : 'border-[#E8E4DC] dark:border-[#374B63] focus:border-[#D5860B] focus:ring-2 focus:ring-[#FEC13D]/25'}
          focus:outline-none shadow-xs ${className}`} {...props}/>
      {error ? (<span className="text-xs text-rose-600 font-medium">{error}</span>) : helperText ? (<span className="text-xs text-[#5A5A5A] dark:text-slate-400">{helperText}</span>) : null}
    </div>);
});
Textarea.displayName = 'Textarea';
