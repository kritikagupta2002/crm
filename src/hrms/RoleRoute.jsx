import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useRole } from '@/contexts/RoleContext';

/* HR-team pages (employee master, approvals, daily attendance): others land on their HR dashboard. */
export const HrOnly = () => (useRole().currentRole === 'hr' ? <Outlet /> : <Navigate to="/hr" replace />);
