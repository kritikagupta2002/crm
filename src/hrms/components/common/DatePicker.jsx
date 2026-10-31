import React, { forwardRef } from 'react';
import { Calendar } from 'lucide-react';

export const DatePicker = forwardRef(
  (
    {
      label,
      error,
      helperText,
      isRequired,
      className = '',
      id,
      disabled,
      size,
      value,
      onClick,
      ...props
    },
    ref
  ) => {
    const innerRef = React.useRef(null);
    const isSm =
      size === 'sm' ||
      className.includes('h-[34px]') ||
      className.includes('h-8') ||
      className.includes('text-xs');
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    const safeValue = React.useMemo(() => {
      if (value === null || value === undefined) return undefined;
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

    const valueProp = safeValue !== undefined ? { value: safeValue } : {};

    return (
      <div className="w-full flex flex-col space-y-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            {label}
            {isRequired && <span className="text-rose-500 font-bold">*</span>}
          </label>
        )}
        <div
          className="relative rounded-lg cursor-pointer"
          onClick={(e) => {
            if (
              e.target !== innerRef.current &&
              !disabled &&
              innerRef.current &&
              typeof innerRef.current.showPicker === 'function'
            ) {
              try {
                innerRef.current.showPicker();
              } catch (_) {}
            }
          }}
        >
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="date"
            ref={setCombinedRef}
            id={inputId}
            disabled={disabled}
            onClick={handleClick}
            className={`input w-full cursor-pointer ${
              isSm ? 'h-[34px] text-xs' : ''
            } pl-9 pr-3 ${error ? 'border-rose-400 focus:border-rose-500' : ''} ${className}`}
            style={{ paddingLeft: '38px', ...(props.style || {}) }}
            {...valueProp}
            {...props}
          />
        </div>
        {error ? (
          <span className="text-xs text-rose-600 font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-slate-500">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
