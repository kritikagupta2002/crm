import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ActiveSession, UserSession, ClientSession, VendorSession, TeamRole, WorkspaceId, AccountType } from '../types';
import { mobileStorage } from '../storage';
import { TEAM_PERSONAS, CLIENT_PERSONAS, VENDOR_PERSONAS, WORKSPACE_ACCESS } from '../constants';

interface AuthContextType {
  session: ActiveSession;
  accountType: AccountType;
  role: TeamRole;
  userRole: TeamRole;
  isLoading: boolean;
  loginTeam: (role: TeamRole) => Promise<void>;
  loginClient: (enquiryId: string, mobile: string) => Promise<boolean>;
  loginVendor: (vendorId: string, mobile: string) => Promise<boolean>;
  switchTeamRole: (role: TeamRole) => Promise<void>;
  logout: () => Promise<void>;
  hasWorkspace: (workspace: WorkspaceId) => boolean;
  hasRole: (roles: string[] | string) => boolean;
  can: (action: 'view' | 'manage' | 'approve', module: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
          // No auto-login: show LoginScreen after Splash
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

  const loginTeam = async (targetRole: TeamRole) => {
    const persona = TEAM_PERSONAS[targetRole];
    if (persona) {
      const activeUser = { ...persona, isExplicitLogin: true };
      setSession(activeUser);
      await mobileStorage.setActiveSession(activeUser);
    }
  };

  const loginClient = async (enquiryId: string, mobile: string): Promise<boolean> => {
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
    // Fallback client session if not found in demo list
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
  };

  const loginVendor = async (vendorId: string, mobile: string): Promise<boolean> => {
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
  };

  const switchTeamRole = async (targetRole: TeamRole) => {
    const persona = TEAM_PERSONAS[targetRole];
    if (persona) {
      const activeUser = { ...persona, isExplicitLogin: true };
      setSession(activeUser);
      await mobileStorage.setActiveSession(activeUser);
    }
  };

  const logout = async () => {
    setSession(null);
    await mobileStorage.setActiveSession(null);
  };

  const accountType: AccountType = session?.accountType || 'team';
  const role: TeamRole = session?.accountType === 'team' ? (session as UserSession).role : 'employee';

  const hasWorkspace = (workspace: WorkspaceId): boolean => {
    if (!session) return false;
    if (session.accountType !== 'team') return false;
    const allowed = WORKSPACE_ACCESS[role] || [];
    return allowed.includes(workspace);
  };

  const can = (action: 'view' | 'manage' | 'approve', module: string): boolean => {
    if (!session) return false;
    if (session.accountType !== 'team') return false;
    if (role === 'admin') return true;

    if (action === 'approve') {
      if (module === 'quotes') return false;
      if (module === 'leave') return role === 'hr';
      if (module === 'expenses') return role === 'hr' || role === 'accountant';
    }

    if (role === 'hr') {
      return ['hrms', 'expenses', 'mis', 'leave', 'attendance', 'employees', 'organization', 'shifts', 'payroll'].includes(module);
    }
    if (role === 'accountant') {
      return ['crm', 'vendor', 'hrms', 'expenses', 'finance', 'invoices', 'bills', 'vouchers', 'tds', 'gst'].includes(module);
    }
    if (role === 'lead') {
      return ['crm', 'erm', 'vendor', 'documents', 'hrms', 'expenses', 'projects', 'tasks', 'tenders'].includes(module);
    }
    // employee
    return ['crm', 'vendor', 'hrms', 'expenses', 'finance', 'attendance', 'leave', 'payslips'].includes(module);
  };

  const hasRole = (roles: string[] | string): boolean => {
    if (!session || session.accountType !== 'team') return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    const roleNameMap: Record<string, TeamRole> = {
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
    return roleList.some(r => roleNameMap[r] === role);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        accountType,
        role,
        userRole: role,
        isLoading,
        loginTeam,
        loginClient,
        loginVendor,
        switchTeamRole,
        logout,
        hasWorkspace,
        hasRole,
        can,
      }}
    >
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
