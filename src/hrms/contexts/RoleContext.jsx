import React, { createContext, useContext, useMemo, useCallback } from 'react';
import { useCrm } from '../../context/crm';
import { INITIAL_ROLES } from '@/data/roles/roles';
import { hrRoleOf } from '../bridge';

/* The HRMS role follows the CRM role (see bridge.js); it is changed from the CRM's profile menu, not here. */
const RoleContext = createContext(undefined);

export const RoleProvider = ({ children }) => {
    const { role } = useCrm();
    const currentRole = hrRoleOf(role);
    const roleDefinition = useMemo(() => INITIAL_ROLES.find((r) => r.role === currentRole) || INITIAL_ROLES[0], [currentRole]);
    const hasPermission = useCallback((module, action) => {
        if (currentRole === 'hr')
            return true;
        return !!roleDefinition?.permissions?.[module]?.[action];
    }, [currentRole, roleDefinition]);
    const value = useMemo(() => ({ currentRole, roleDefinition, rolesList: INITIAL_ROLES, setRole: () => { }, hasPermission }), [currentRole, roleDefinition, hasPermission]);
    return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
};

export const useRole = () => {
    const context = useContext(RoleContext);
    if (!context) throw new Error('useRole must be used inside the HRMS pages');
    return context;
};

export const usePermission = (module, action) => useRole().hasPermission(module, action);
