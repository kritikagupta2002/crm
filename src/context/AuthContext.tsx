import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { ActiveSession, UserSession, ClientSession, VendorSession, TeamRole, CanonicalRole, WorkspaceId, AccountType } from '../types';
import { mobileStorage } from '../storage';
import { TEAM_PERSONAS, CANONICAL_PERSONAS, CLIENT_PERSONAS, VENDOR_PERSONAS, WORKSPACE_ACCESS } from '../constants';

interface AuthContextType {
  session: ActiveSession;
  accountType: AccountType;
  role: TeamRole;
  canonicalRole: CanonicalRole;
  userRole: TeamRole;
  isLoading: boolean;
  loginTeam: (role: TeamRole, customUser?: UserSession) => Promise<void>;
  loginCanonical: (canonicalRole: CanonicalRole, customUser?: UserSession) => Promise<void>;
  loginClient: (enquiryId: string, mobile: string) => Promise<boolean>;
  loginVendor: (vendorId: string, mobile: string) => Promise<boolean>;
  switchTeamRole: (role: TeamRole) => Promise<void>;
  switchCanonicalRole: (canonicalRole: CanonicalRole) => Promise<void>;
  logout: () => Promise<void>;
  resetAppData: () => Promise<void>;
  hasWorkspace: (workspace: WorkspaceId) => boolean;
  hasRole: (roles: string[] | string) => boolean;
  can: (action: 'view' | 'manage' | 'approve', module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_NAME_MAP: Record<string, TeamRole> = {
  Admin: 'admin',
  admin: 'admin',
  HR: 'hr',
  hr: 'hr',
  Accountant: 'accountant',
  accountant: 'accountant',
  'Team Lead': 'lead',
  lead: 'lead',
  Employee: 'employee',
  employee: 'employee',
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<ActiveSession>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        await mobileStorage.initStorage();
        const savedSession = await mobileStorage.getActiveSession();
        if (savedSession && (savedSession as any).isExplicitLogin) {
          setSession(savedSession);
        } else {
          setSession(null);
          await mobileStorage.setActiveSession(null);
        }
      } catch (e) {
        console.error('Auth bootstrap failed:', e);
      } finally {
        setIsLoading(false);
      }
    };
    bootstrap();
  }, []);

  const loginTeam = useCallback(async (targetRole: TeamRole, customUser?: UserSession) => {
    const persona = customUser || TEAM_PERSONAS[targetRole];
    if (persona) {
      const activeUser = { ...persona, isExplicitLogin: true };
      setSession(activeUser);
      await mobileStorage.setActiveSession(activeUser);
    }
  }, []);

  const loginCanonical = useCallback(async (canonicalRole: CanonicalRole, customUser?: UserSession) => {
    const persona = customUser || CANONICAL_PERSONAS[canonicalRole];
    if (persona) {
      const activeUser = { ...persona, canonicalRole, isExplicitLogin: true };
      setSession(activeUser);
      await mobileStorage.setActiveSession(activeUser);
    }
  }, []);

  const loginClient = useCallback(async (enquiryId: string, mobile: string): Promise<boolean> => {
    const trimmedEnq = enquiryId.trim();
    const trimmedMob = mobile.trim();
    const found = CLIENT_PERSONAS.find(
      (c) => c.enquiryId.toLowerCase() === trimmedEnq.toLowerCase() || c.mobile === trimmedMob
    );
    if (found) {
      const activeClient = { ...found, isExplicitLogin: true };
      setSession(activeClient);
      await mobileStorage.setActiveSession(activeClient);
      return true;
    }
    const clientSession: ClientSession = {
      id: 'cli-' + Date.now(),
      enquiryId: trimmedEnq || 'ENQ-DEMO-001',
      companyName: 'Client Representative Corp',
      contactPerson: 'Authorized Signatory',
      mobile: trimmedMob || '9876543210',
      email: 'client@partner.com',
      accountType: 'client',
    };
    const activeClient = { ...clientSession, isExplicitLogin: true };
    setSession(activeClient);
    await mobileStorage.setActiveSession(activeClient);
    return true;
  }, []);

  const loginVendor = useCallback(async (vendorId: string, mobile: string): Promise<boolean> => {
    const trimmedId = vendorId.trim();
    const trimmedMob = mobile.trim();
    const found = VENDOR_PERSONAS.find(
      (v) => v.vendorId.toLowerCase() === trimmedId.toLowerCase() || v.mobile === trimmedMob
    );
    if (found) {
      const activeVendor = { ...found, isExplicitLogin: true };
      setSession(activeVendor);
      await mobileStorage.setActiveSession(activeVendor);
      return true;
    }
    const vendorSession: VendorSession = {
      id: 'ven-' + Date.now(),
      vendorId: trimmedId || 'VND-DEMO-001',
      vendorName: 'Contractor Partner Services',
      contactPerson: 'Bid Representative',
      mobile: trimmedMob || '9876543210',
      category: 'Drilling Contractor',
      accountType: 'vendor',
    };
    const activeVendor = { ...vendorSession, isExplicitLogin: true };
    setSession(activeVendor);
    await mobileStorage.setActiveSession(activeVendor);
    return true;
  }, []);

  const switchTeamRole = useCallback(async (targetRole: TeamRole) => {
    const persona = TEAM_PERSONAS[targetRole];
    if (persona) {
      const activeUser = { ...persona, isExplicitLogin: true };
      setSession(activeUser);
      await mobileStorage.setActiveSession(activeUser);
    }
  }, []);

  const switchCanonicalRole = useCallback(async (canonicalRole: CanonicalRole) => {
    const persona = CANONICAL_PERSONAS[canonicalRole];
    if (persona) {
      const activeUser = { ...persona, canonicalRole, isExplicitLogin: true };
      setSession(activeUser);
      await mobileStorage.setActiveSession(activeUser);
    }
  }, []);

  const logout = useCallback(async () => {
    setSession(null);
    await mobileStorage.setActiveSession(null);
  }, []);

  const resetAppData = useCallback(async () => {
    await mobileStorage.resetAllToDefaults();
    setSession(null);
  }, []);

  const accountType: AccountType = session?.accountType || 'team';
  const role: TeamRole = session?.accountType === 'team' ? (session as UserSession).role : 'employee';

  const canonicalRole: CanonicalRole = useMemo(() => {
    if (!session || session.accountType !== 'team') return 'employee';
    const user = session as UserSession;
    if (user.canonicalRole) return user.canonicalRole;
    if (user.role === 'admin') return 'super_admin';
    if (user.role === 'lead') return 'director';
    if (user.role === 'hr') return 'manager';
    if (user.role === 'accountant') return 'accounts_executive';
    return 'employee';
  }, [session]);

  const hasWorkspace = useCallback((workspace: WorkspaceId): boolean => {
    if (!session) return false;
    if (session.accountType !== 'team') return false;
    const user = session as UserSession;

    // Explicit director restriction: strictly no finance
    if (canonicalRole === 'director' && workspace === 'finance') {
      return false;
    }

    const allowed = user.workspaces || WORKSPACE_ACCESS[role] || [];
    return allowed.includes(workspace);
  }, [session, canonicalRole, role]);

  const can = useCallback((action: 'view' | 'manage' | 'approve', module: string): boolean => {
    if (!session) return false;
    if (session.accountType !== 'team') return false;

    // Super Admin: Full authority
    if (canonicalRole === 'super_admin') return true;

    // Director: All except Finance
    if (canonicalRole === 'director') {
      if (['finance', 'invoices', 'bills', 'vouchers', 'tds', 'gst'].includes(module)) {
        return false;
      }
      return true;
    }

    // Manager: ERM, HRMS & projects
    if (canonicalRole === 'manager') {
      if (['finance', 'invoices', 'bills', 'vouchers', 'tds', 'gst'].includes(module)) return false;
      if (action === 'approve') {
        return ['leave', 'tasks', 'expenses'].includes(module);
      }
      return ['erm', 'hrms', 'projects', 'tasks', 'team', 'leave', 'attendance', 'shifts', 'expenses', 'documents', 'mis', 'field_database'].includes(module);
    }

    // Employee: Personal tasks and HR self-service only
    if (canonicalRole === 'employee') {
      if (action === 'approve') return false;
      if (action === 'manage') {
        return ['tasks', 'attendance', 'leave_request', 'expense_claim'].includes(module);
      }
      return ['tasks', 'attendance', 'leave', 'expenses', 'payslips', 'documents'].includes(module);
    }

    // Finance Master: Complete Finance & Accounting Authority
    if (canonicalRole === 'finance_master') {
      if (action === 'approve') {
        return ['invoices', 'bills', 'vouchers', 'expenses', 'settlement', 'tax'].includes(module);
      }
      return ['finance', 'expenses', 'vendor', 'mis', 'invoices', 'bills', 'vouchers', 'tds', 'gst', 'budget', 'claims_audit'].includes(module);
    }

    // Accounts Executive: Billing, accounts & books (entry and view)
    if (canonicalRole === 'accounts_executive') {
      if (action === 'approve') return false;
      return ['finance', 'invoices', 'bills', 'vouchers', 'tds', 'gst', 'expenses'].includes(module);
    }

    return false;
  }, [session, canonicalRole]);

  const hasRole = useCallback((roles: string[] | string): boolean => {
    if (!session || session.accountType !== 'team') return false;
    const roleList = (Array.isArray(roles) ? roles : [roles]).map(r => r.toLowerCase().trim());

    // Super Admin matches all roles
    if (canonicalRole === 'super_admin') return true;

    // Check direct canonical match
    if (roleList.includes(canonicalRole.toLowerCase())) return true;

    // Finance Master has full finance and accounting authority, but NOT Super Admin HR/Operations
    if (canonicalRole === 'finance_master') {
      return roleList.includes('finance_master') || roleList.includes('accountant') || roleList.includes('finance');
    }

    // Accounts Executive has accounting and billing authority
    if (canonicalRole === 'accounts_executive') {
      return roleList.includes('accounts_executive') || roleList.includes('accountant');
    }

    // Manager has HR and project management authority
    if (canonicalRole === 'manager') {
      return roleList.includes('manager') || roleList.includes('hr');
    }

    // Director has leadership and management oversight (all except finance)
    if (canonicalRole === 'director') {
      return roleList.includes('director') || roleList.includes('lead') || roleList.includes('executive') || roleList.includes('manager');
    }

    // Employee has employee-only authority
    if (canonicalRole === 'employee') {
      return roleList.includes('employee');
    }

    return roleList.some(r =>
      r === role.toLowerCase() ||
      ROLE_NAME_MAP[r] === role
    );
  }, [session, canonicalRole, role]);

  const value = useMemo<AuthContextType>(() => ({
    session,
    accountType,
    role,
    canonicalRole,
    userRole: role,
    isLoading,
    loginTeam,
    loginCanonical,
    loginClient,
    loginVendor,
    switchTeamRole,
    switchCanonicalRole,
    logout,
    resetAppData,
    hasWorkspace,
    hasRole,
    can,
  }), [
    session,
    accountType,
    role,
    canonicalRole,
    isLoading,
    loginTeam,
    loginCanonical,
    loginClient,
    loginVendor,
    switchTeamRole,
    switchCanonicalRole,
    logout,
    resetAppData,
    hasWorkspace,
    hasRole,
    can,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
