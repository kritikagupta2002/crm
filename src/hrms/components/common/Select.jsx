import React, { forwardRef } from 'react';

export const Select = forwardRef(
  (
    {
      label,
      options = [],
      error,
      helperText,
      isRequired,
      placeholder,
      className = '',
      id,
      disabled,
      size,
      ...props
    },
    ref
  ) => {
    const isSm =
      size === 'sm' ||
      className.includes('h-[34px]') ||
      className.includes('h-8') ||
      className.includes('text-xs');
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col space-y-1">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            {label}
            {isRequired && <span className="text-rose-500 font-bold">*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`select w-full ${isSm ? 'select-sm' : ''} ${
            error ? 'border-rose-400 focus:border-rose-500' : ''
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <span className="text-xs text-rose-600 font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-slate-500">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
