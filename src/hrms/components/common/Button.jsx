import React from 'react';
import { Loader2 } from 'lucide-react';

/* The CRM's buttons (.btn and its variants), so HR and Finance pages look like the rest of the app. */
const VARIANTS = {
    primary: 'btn-primary',
    secondary: '',
    outline: 'btn-outline',
    ghost: 'btn-quiet',
    danger: 'btn-danger',
    success: 'btn-success',
    navy: 'btn-primary',
};

export const Button = ({ children, variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, className = '', disabled, ...props }) => (
    <button className={`btn ${VARIANTS[variant] ?? ''} ${size === 'sm' ? 'btn-small' : ''} ${className}`} disabled={disabled || isLoading} {...props}>
      {isLoading ? <Loader2 size={15} className="animate-spin"/> : leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
);
