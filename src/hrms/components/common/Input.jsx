import React, { forwardRef } from 'react';

export const Input = forwardRef(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isRequired,
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
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full flex flex-col space-y-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-slate-700 flex items-center gap-1">
            {label}
            {isRequired && <span className="text-rose-500 font-bold">*</span>}
          </label>
        )}
        <div className="relative rounded-lg">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className={`input w-full ${isSm ? 'h-[34px] text-xs' : ''} ${
              leftIcon ? 'input-has-left-icon' : ''
            } ${rightIcon ? 'input-has-right-icon' : ''} ${
              error ? 'border-rose-400 focus:border-rose-500' : ''
            } ${className}`}
            style={{
              ...(leftIcon ? { paddingLeft: '38px' } : {}),
              ...(rightIcon ? { paddingRight: '36px' } : {}),
              ...(props.style || {}),
            }}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}
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

Input.displayName = 'Input';
