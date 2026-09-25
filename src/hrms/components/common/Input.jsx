import React, { forwardRef } from 'react';
export const Input = forwardRef(({ label, error, helperText, leftIcon, rightIcon, isRequired, className = '', id, disabled, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
    return (<div className="w-full flex flex-col space-y-1">
      {label && (<label htmlFor={inputId} className="text-xs font-semibold text-[#3D2D1E] dark:text-slate-300 flex items-center gap-1">
          {label}
          {isRequired && <span className="text-rose-500 font-bold">*</span>}
        </label>)}
      <div className="relative rounded-lg">
        {leftIcon && (<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {leftIcon}
          </div>)}
        <input ref={ref} id={inputId} disabled={disabled} className={`w-full h-[38px] rounded-lg text-[13px] font-inter bg-white dark:bg-[#111821] border transition-all duration-150 placeholder:text-slate-400 dark:placeholder:text-slate-500
            ${leftIcon ? 'pl-9' : 'pl-3.5'}
            ${rightIcon ? 'pr-9' : 'pr-3.5'}
            py-1.5
            ${disabled ? 'opacity-50 cursor-not-allowed border-[#E2E8F0] dark:border-[#253344]' : 'text-[#0F172A] dark:text-slate-100'}
            ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200' : 'border-[#E2E8F0] dark:border-[#253344] hover:border-slate-300 dark:hover:border-slate-600 focus:border-teal-600 focus:ring-3 focus:ring-teal-500/20'}
            focus:outline-none ${className}`} {...props}/>
        {rightIcon && (<div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
            {rightIcon}
          </div>)}
      </div>
      {error ? (<span className="text-xs text-rose-600 font-medium">{error}</span>) : helperText ? (<span className="text-xs text-[#5A5A5A] dark:text-slate-400">{helperText}</span>) : null}
    </div>);
});
Input.displayName = 'Input';
