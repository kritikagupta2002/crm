import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { ToastProvider } from '@/contexts/ToastContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { RoleProvider } from '@/contexts/RoleContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import './hrms.css';
import './hrms-overrides.css';

/*
 * Every HRMS and Finance page renders inside the CRM's layout (sidebar, top bar, sign-in) through this shell. The
 * .hrms wrapper is what the module's stylesheet is scoped to, so its styles never reach the CRM's own pages.
 */
const Loading = () => <p className="muted" style={{ padding: 24 }}>Loading…</p>;

export default function HrmsShell() {
    return (
      <div className="hrms">
        <ToastProvider>
          <AuthProvider>
            <RoleProvider>
              <ErrorBoundary>
                <Suspense fallback={<Loading />}>
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            </RoleProvider>
          </AuthProvider>
        </ToastProvider>
      </div>
    );
}
