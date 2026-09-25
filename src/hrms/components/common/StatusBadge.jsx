import React from 'react';
import { Badge } from './Badge';
export const StatusBadge = ({ status, size = 'md', className = '' }) => {
    if (!status) return null;
    const norm = String(status).toLowerCase().trim();
    let variant = 'neutral';
    if (['present', 'approved', 'active', 'settled', 'paid', 'completed', 'verified', 'won', 'done', 'on track', 'resolved', 'finance approved'].includes(norm)) {
        variant = 'good';
    }
    else if (['late', 'half day', 'pending', 'partially approved', 'upcoming', 'notice period', 'draft', 'qualified', 'proposal sent', 'negotiation', 'in progress', 'waiting', 'pending review'].includes(norm)) {
        variant = 'attention';
    }
    else if (['absent', 'rejected', 'terminated', 'cancelled', 'lost', 'overdue', 'query raised', 'finance rejected'].includes(norm)) {
        variant = 'urgent';
    }
    else if (['on leave', 'processing', 'consultant', 'full-time', 'contract', 'new enquiry', 'contacted', 'new', 'information', 'employee responded'].includes(norm)) {
        variant = 'info';
    }
    else if (['inactive', 'holiday', 'weekly off', 'neutral', 'no query', 'none'].includes(norm)) {
        variant = 'neutral';
    }
    return (<Badge variant={variant} size={size} dot className={className}>
      {status}
    </Badge>);
};
