import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useCrm } from '../../context/crm';
import { INITIAL_ROLES } from '@/data/roles/roles';
import { hrRoleOf } from '../bridge';

/* The HRMS role follows the account role assigned on the server (see bridge.js). */
const RoleContext = createContext(undefined);

export const RoleProvider = ({ children }) => {
    const { user } = useCrm();
    const currentRole = hrRoleOf(user?.permissions);
    const roleDefinition = useMemo(() => INITIAL_ROLES.find((r) => r.role === currentRole) || INITIAL_ROLES[0], [currentRole]);
    const hasPermission = useCallback((module, action) => {
        if (user?.permissions?.includes('employees.manage'))
            return true;
        return !!roleDefinition?.permissions?.[module]?.[action];
    }, [user?.permissions, roleDefinition]);
    const value = useMemo(() => ({ currentRole, roleDefinition, rolesList: INITIAL_ROLES, setRole: () => { }, hasPermission }), [currentRole, roleDefinition, hasPermission]);
    return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = () => {
    const context = useContext(RoleContext);
    if (!context) throw new Error('useRole must be used inside the HRMS pages');
    return context;
};

export const usePermission = (module, action) => useRole().hasPermission(module, action);
