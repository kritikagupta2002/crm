import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAccess } from '../context/crm';
import { useRole } from '@/contexts/RoleContext';

/* HR-team pages (employee master, approvals, payroll runs): others land on their own HR home. */
export const HrOnly = () => (useRole().currentRole === 'hr' ? <Outlet /> : <Navigate to="/hr" replace />);

/* Finance pages open by the CRM's access table, like every other page. */
export const FinanceOnly = () => {
    const { can } = useAccess();
    const { pathname } = useLocation();
    return can(pathname) ? <Outlet /> : <Navigate to="/" replace />;
};
