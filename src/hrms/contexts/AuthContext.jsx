import React, { createContext, useContext, useMemo } from 'react';
import { useCrm } from '../../context/crm';
import { storage } from '@/core/storage/storage';
import { hrRoleOf } from '../bridge';

/*
 * The HRMS user is the person signed in to the portal; their role comes from the server and their HR record is
 * matched by employee ID.
 */
const AuthContext = createContext(undefined);

function hrUserOf(crmUser, role) {
    const employees = storage.getEmployees?.() || [];
    const employee = employees.find((e) => crmUser?.employeeId && e?.employeeId === crmUser.employeeId);
    return {
        id: employee?.id ?? null,
        name: employee?.name || crmUser?.name || '',
        email: employee?.contact?.workEmail ?? crmUser?.email ?? '',
        role: hrRoleOf(crmUser?.permissions),
        employeeId: crmUser?.employeeId ?? null,
        avatarUrl: employee?.avatarUrl || '',
        department: employee?.employment?.department ?? '',
        designation: employee?.employment?.designation ?? crmUser?.title ?? '',
    };
}

export const AuthProvider = ({ children }) => {
    const { user: crmUser, role, signOut } = useCrm();
    // The services read the active user from storage (whose balances, who approved a leave), and pages load their
    // data in effects that run before a provider's own effect, so it is stored here, as soon as it is known.
    const user = useMemo(() => {
        const next = hrUserOf(crmUser, role);
        storage.setActiveUser(next);
        return next;
    }, [crmUser, role]);
    const value = useMemo(() => ({
        user,
        isAuthenticated: true,
        login: async () => true,
        logout: signOut,
        updateUser: () => { },
        switchRole: () => { },
    }), [user, signOut]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside the HRMS pages');
    return context;
};
