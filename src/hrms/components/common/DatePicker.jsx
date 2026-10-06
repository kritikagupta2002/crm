import React, { forwardRef } from 'react';
import { Calendar } from 'lucide-react';
export const DatePicker = forwardRef(({ label, error, helperText, isRequired, className = '', id, disabled, size, value, onClick, ...props }, ref) => {
    const innerRef = React.useRef(null);
    const isSm = size === 'sm' || className.includes('h-[34px]') || className.includes('h-8') || className.includes('text-xs');
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const safeValue = React.useMemo(() => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value;
        if (value instanceof Date && !isNaN(value.getTime())) {
            return value.toISOString().split('T')[0];
        }
        if (typeof value === 'object' && 'target' in value) {
            return value.target?.value || '';
        }
        return String(value);
    }, [value]);

    const setCombinedRef = (node) => {
        innerRef.current = node;
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref && 'current' in ref) {
            ref.current = node;
        }
    };

    const handleClick = (e) => {
        if (!disabled && innerRef.current && typeof innerRef.current.showPicker === 'function') {
            try {
                innerRef.current.showPicker();
            } catch (_) {}
        }
        if (onClick) onClick(e);
    };

    return (<div className="w-full flex flex-col space-y-1">
      {label && (<label htmlFor={inputId} className="text-xs font-semibold text-[#3D2D1E] dark:text-slate-300 flex items-center gap-1">
          {label}
          {isRequired && <span className="text-rose-500 font-bold">*</span>}
        </label>)}
      <div className="relative rounded-lg shadow-xs cursor-pointer" onClick={() => {
          if (!disabled && innerRef.current && typeof innerRef.current.showPicker === 'function') {
              try { innerRef.current.showPicker(); } catch (_) {}
          }
      }}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
          <Calendar className="w-3.5 h-3.5"/>
        </div>
        <input type="date" ref={setCombinedRef} id={inputId} disabled={disabled} value={safeValue} onClick={handleClick} className={`w-full rounded-lg cursor-pointer ${isSm ? 'h-[34px] text-xs py-1 pl-8 pr-2.5' : 'h-[38px] text-sm py-2 pl-9 pr-3.5'} bg-white dark:bg-[#111821] border transition-all duration-150
            ${disabled ? 'bg-[#F8F4EE] dark:bg-[#0c1219] text-[#A09080] dark:text-slate-500 cursor-not-allowed border-[#E8E4DC] dark:border-[#253344]' : 'text-[#2D3748] dark:text-slate-200'}
            ${error ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200' : 'border-[#E8E4DC] dark:border-[#374B63] focus:border-[#D5860B] focus:ring-2 focus:ring-[#FEC13D]/25'}
            focus:outline-none ${className}`} {...props}/>
      </div>
      {error ? (<span className="text-xs text-rose-600 font-medium">{error}</span>) : helperText ? (<span className="text-xs text-[#5A5A5A] dark:text-slate-400">{helperText}</span>) : null}
    </div>);
});
DatePicker.displayName = 'DatePicker';
