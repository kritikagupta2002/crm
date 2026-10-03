export type AccountType = 'team' | 'client' | 'vendor';

export type TeamRole = 'admin' | 'hr' | 'accountant' | 'lead' | 'employee';

export type HrmsRole = 'hr' | 'employee';

export type WorkspaceId =
  | 'crm'
  | 'erm'
  | 'vendor'
  | 'documents'
  | 'hrms'
  | 'expenses'
  | 'finance'
  | 'mis';

export interface UserSession {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  accountType: 'team';
  role: TeamRole;
  hrmsRole: HrmsRole;
  designation: string;
  department: string;
  avatar?: string;
  workspaces: WorkspaceId[];
}

export interface ClientSession {
  id: string;
  enquiryId: string;
  companyName: string;
  contactPerson: string;
  mobile: string;
  email: string;
  accountType: 'client';
}

export interface VendorSession {
  id: string;
  vendorId: string;
  vendorName: string;
  contactPerson: string;
  mobile: string;
  category: string;
  accountType: 'vendor';
}

export type ActiveSession = UserSession | ClientSession | VendorSession | null;
