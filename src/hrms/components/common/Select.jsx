import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
export const Select = forwardRef(({ label, options = [], error, helperText, isRequired, placeholder, className = '', id, disabled, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (<div className="w-full flex flex-col space-y-1">
      {label && (<label htmlFor={selectId} className="text-xs font-semibold text-[#3D2D1E] dark:text-slate-300 flex items-center gap-1">
          {label}
          {isRequired && <span className="text-rose-500 font-bold">*</span>}
        </label>)}
      <div className="relative rounded-lg">
        <select ref={ref} id={selectId} disabled={disabled} className={`w-full h-[38px] appearance-none rounded-lg text-[13px] font-inter bg-white dark:bg-[#111821] border pl-3 pr-8 py-1.5 transition-all duration-150
            ${disabled ? 'opacity-50 cursor-not-allowed border-[#E2E8F0] dark:border-[#253344]' : 'text-[#0F172A] dark:text-slate-100 cursor-pointer'}
            ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200' : 'border-[#E2E8F0] dark:border-[#253344] hover:border-slate-300 dark:hover:border-slate-600 focus:border-teal-600 focus:ring-3 focus:ring-teal-500/20'}
            focus:outline-none ${className}`} {...props}>
          {placeholder && (<option value="" disabled>
              {placeholder}
            </option>)}
          {options.map((opt) => (<option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
          <ChevronDown className="w-3.5 h-3.5"/>
        </div>
      </div>
      {error ? (<span className="text-xs text-rose-600 font-medium">{error}</span>) : helperText ? (<span className="text-xs text-[#5A5A5A] dark:text-slate-400">{helperText}</span>) : null}
    </div>);
});
Select.displayName = 'Select';
