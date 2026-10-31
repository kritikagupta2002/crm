import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Building2, User, Clock, CalendarCheck, Bell, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { useRole } from '@/contexts/RoleContext';

export const SettingsLayout = () => {
    const { currentRole } = useRole();
    const location = useLocation();
    const isProfilePage = location.pathname === '/hr/settings/profile';

    const allNavItems = [
        { title: 'Company Profile', path: '/hr/settings/company', icon: <Building2 className="w-4 h-4"/> },
        { title: 'My Profile', path: '/hr/settings/profile', icon: <User className="w-4 h-4"/> },
        { title: 'Attendance Rules', path: '/hr/settings/attendance', icon: <Clock className="w-4 h-4"/> },
        { title: 'Leave Policies', path: '/hr/settings/leave', icon: <CalendarCheck className="w-4 h-4"/> },
        { title: 'Notification Channels', path: '/hr/settings/notifications', icon: <Bell className="w-4 h-4"/> },
        { title: 'Security & 2FA', path: '/hr/settings/security', icon: <ShieldCheck className="w-4 h-4"/> },
    ];

    const navItems = allNavItems.filter((item) => {
        if (currentRole === 'employee') {
            return item.path === '/hr/settings/profile' || item.path === '/hr/settings/notifications';
        }
        return true;
    });

    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title={isProfilePage ? 'My Profile & Verification' : 'Corporate & System Settings'}
          description={
            isProfilePage
              ? 'Personal employee records, verified emergency contacts, profile photo, and statutory verification documents.'
              : 'Configuration of corporate identity, attendance grace periods, leave rules, and security policies.'
          }
          breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: isProfilePage ? 'My Profile' : 'Settings' },
          ]}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Settings Navigation Sidebar */}
          <div className="md:col-span-1">
            <Card className="p-1.5 sm:p-2 flex md:flex-col overflow-x-auto custom-sidebar-scroll gap-1 md:space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? 'bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-bold border-b-2 md:border-b-0 md:border-l-[3px] border-teal-600'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.title}</span>
                </NavLink>
              ))}
            </Card>
          </div>

          {/* Subpage Container */}
          <div className="md:col-span-3">
            <Outlet />
          </div>
        </div>
      </div>
    );
};
