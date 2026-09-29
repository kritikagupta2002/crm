import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAccess } from '../context/crm';
import { useRole } from '@/contexts/RoleContext';

export const HrOnly = () => (useRole().currentRole === 'hr' ? <Outlet /> : <Navigate to="/hr" replace />);

export const FinanceOnly = () => {
    const { can } = useAccess();
    const { pathname } = useLocation();
    return can(pathname) ? <Outlet /> : <Navigate to="/" replace />;
};
