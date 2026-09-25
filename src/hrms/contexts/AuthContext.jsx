import React, { createContext, useContext, useMemo } from 'react';
import { useCrm } from '../../context/crm';
import { storage } from '@/core/storage/storage';
import { hrRoleOf } from '../bridge';

/*
 * The HRMS runs inside the CRM, so there is no separate HRMS login: the person signed in to the CRM (and the
 * role picked in the profile menu) is the HRMS user. Their HR record is found by name in the employee master.
 */
const AuthContext = createContext(undefined);

function hrUserOf(crmUser, role) {
    const employee = storage.getEmployees().find((e) => e.name === crmUser.name);
    return {
        id: employee?.id ?? null,
        name: crmUser.name,
        email: employee?.contact?.workEmail ?? '',
        role: hrRoleOf(role),
        employeeId: employee?.employeeId ?? null,
        avatarUrl: '',
        department: employee?.employment?.department ?? '',
        designation: employee?.employment?.designation ?? crmUser.title,
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
        // Roles are switched from the CRM's profile menu.
        switchRole: () => { },
    }), [user, signOut]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used inside the HRMS pages');
    return context;
};
