import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Building2, User, Clock, CalendarCheck, Bell, ShieldCheck, Users, ScrollText, Wallet, KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { useAccess } from '../../../../core/permissions/crm';

export const SettingsLayout = () => {
    const { can } = useAccess();
    const location = useLocation();
    const isProfilePage = location.pathname === '/hr/settings/profile';

    const allNavItems = [
        { title: 'My Profile', path: '/hr/settings/profile', icon: <User className="w-4 h-4"/> },
        { title: 'Password & Security', path: '/hr/settings/security', icon: <ShieldCheck className="w-4 h-4"/> },
        { title: 'Notifications', path: '/hr/settings/notifications', icon: <Bell className="w-4 h-4"/> },
        { title: 'Company Profile', path: '/hr/settings/company', icon: <Building2 className="w-4 h-4"/> },
        { title: 'Attendance Rules', path: '/hr/settings/attendance', icon: <Clock className="w-4 h-4"/> },
        { title: 'Leave Policy', path: '/hr/settings/leave', icon: <CalendarCheck className="w-4 h-4"/> },
        { title: 'Payroll Settings', path: '/hr/settings/payroll', icon: <Wallet className="w-4 h-4"/> },
        { title: 'User Accounts', path: '/hr/settings/accounts', icon: <Users className="w-4 h-4"/> },
        { title: 'Roles & Permissions', path: '/hr/settings/permissions', icon: <KeyRound className="w-4 h-4"/> },
        { title: 'Audit Log', path: '/hr/settings/audit', icon: <ScrollText className="w-4 h-4"/> },
    ];

    const navItems = allNavItems.filter((item) => can(item.path));

    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title={isProfilePage ? 'My Profile' : 'Settings'}
          description={
            isProfilePage
              ? 'Your personal details, emergency contact and verification documents.'
              : 'Company profile, attendance and leave rules, payroll settings and user access.'
          }
        />

        {navItems.length > 1 && (<nav className="tab-bar" aria-label="Settings sections">
            {navItems.map((item) => (<NavLink key={item.path} to={item.path} className={({ isActive }) => `tab-bar-item ${isActive ? 'is-active' : ''}`}>
                {item.icon}
                <span>{item.title}</span>
              </NavLink>))}
          </nav>)}

        <Outlet />
      </div>
    );
};
