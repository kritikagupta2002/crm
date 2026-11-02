import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAccess } from '../core/permissions/crm';

/* Defence in depth for role-restricted pages: the same rule as the sidebar (core/permissions/crm.js). */
export const HrOnly = () => {
    const { can } = useAccess();
    const { pathname } = useLocation();
    return can(pathname) ? <Outlet /> : <Navigate to="/" replace />;
};
