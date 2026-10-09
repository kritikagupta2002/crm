import { TeamRole, CanonicalRole, WorkspaceId, UserSession, ClientSession, VendorSession } from '../types';

export interface WorkspaceConfig {
  id: WorkspaceId;
  title: string;
  subtitle: string;
  iconName: string;
  badge?: string;
  color: string;
}

export const ALL_WORKSPACES: WorkspaceConfig[] = [
  {
    id: 'crm',
    title: 'CRM Workspace',
    subtitle: 'Leads, Follow-ups, Quotations & Clients',
    iconName: 'Users',
    color: '#2563eb',
  },
  {
    id: 'erm',
    title: 'ERM Workspace',
    subtitle: '7-Stage Geological Projects, WBS & Tasks',
    iconName: 'FolderKanban',
    color: '#0d9488',
  },
  {
    id: 'vendor',
    title: 'Vendor Workspace',
    subtitle: 'Tenders, Sealed Bids, Work Orders & Bills',
    iconName: 'Building2',
    color: '#d97706',
  },
  {
    id: 'documents',
    title: 'Document Management',
    subtitle: '4-Eyes NAS Custody, Access Grants & Dispatch',
    iconName: 'FileText',
    color: '#7c3aed',
  },
  {
    id: 'hrms',
    title: 'HRMS & Attendance',
    subtitle: 'Daily Geolocation Punch, Muster & Leave Quotas',
    iconName: 'Clock',
    color: '#059669',
  },
  {
    id: 'expenses',
    title: 'Expense & Reimbursement',
    subtitle: 'Multi-Stage Review, Queries & Disbursements',
    iconName: 'Receipt',
    color: '#ea580c',
  },
  {
    id: 'finance',
    title: 'Finance & Accounting',
    subtitle: 'Double-Entry Ledger, Invoices, Vouchers & Taxes',
    iconName: 'Landmark',
    color: '#475569',
  },
  {
    id: 'mis',
    title: 'MIS & Reports',
    subtitle: 'Dynamic KPIs, Exploration Progress & Analytics',
    iconName: 'BarChart3',
    color: '#db2777',
  },
  {
    id: 'field_database',
    title: 'Field Database',
    subtitle: 'Geological Field Data, Logging & Samples',
    iconName: 'Compass',
    color: '#9a3412',
  },
];

export interface CanonicalRoleItem {
  key: CanonicalRole;
  title: string;
  subtitle: string;
  description: string;
  personName: string;
  teamRole: TeamRole;
  email: string;
  iconName?: string;
  isEmployeeDropdown?: boolean;
}

export const CANONICAL_ROLE_LIST: CanonicalRoleItem[] = [
  {
    key: 'super_admin',
    title: 'Super Admin',
    subtitle: 'Everything',
    description: 'Everything',
    personName: 'Kritika Gupta',
    teamRole: 'admin',
    email: 'kritika.gupta@bansalgeo.com',
    iconName: 'Crown',
  },
  {
    key: 'director',
    title: 'Director',
    subtitle: 'All except Finance',
    description: 'All except Finance',
    personName: 'Dr. Sunita Meena',
    teamRole: 'lead',
    email: 'sunita.meena@bansalgeo.com',
    iconName: 'Briefcase',
  },
  {
    key: 'manager',
    title: 'Manager',
    subtitle: 'ERM, HRMS & projects',
    description: 'ERM, HRMS & projects',
    personName: 'Kavita Rawat',
    teamRole: 'hr',
    email: 'kavita.rawat@bansalgeo.com',
    iconName: 'Users',
  },
  {
    key: 'employee',
    title: 'Employee',
    subtitle: 'My tasks & HR self-service',
    description: 'My tasks & HR self-service',
    personName: '6 people',
    teamRole: 'employee',
    email: 'neha.gupta@bansalgeo.com',
    iconName: 'UserCheck',
    isEmployeeDropdown: true,
  },
  {
    key: 'finance_master',
    title: 'Finance Master',
    subtitle: 'Full access & Finance',
    description: 'Full access & Finance',
    personName: 'N. Jain',
    teamRole: 'admin',
    email: 'n.jain@bansalgeo.com',
    iconName: 'Landmark',
  },
  {
    key: 'accounts_executive',
    title: 'Accounts Executive',
    subtitle: 'Billing, accounts & books',
    description: 'Billing, accounts & books',
    personName: 'Pooja Sharma',
    teamRole: 'accountant',
    email: 'pooja.sharma@bansalgeo.com',
    iconName: 'CreditCard',
  },
];

export interface EmployeeTeamMember {
  id: string;
  name: string;
  designation: string;
  email: string;
  department: string;
}

export const EMPLOYEE_MEMBERS: EmployeeTeamMember[] = [
  {
    id: 'emp-005',
    name: 'Neha Gupta',
    designation: 'Field Exploration Geologist',
    email: 'neha.gupta@bansalgeo.com',
    department: 'Geology & Mineral Exploration',
  },
  {
    id: 'emp-007',
    name: 'Vikram Patel',
    designation: 'Geophysical Project Lead',
    email: 'vikram.patel@bansalgeo.com',
    department: 'Geology & Mineral Exploration',
  },
  {
    id: 'emp-008',
    name: 'Rohit Meena',
    designation: 'Senior Field Surveyor',
    email: 'rohit.meena@bansalgeo.com',
    department: 'Geology & Surveying',
  },
  {
    id: 'emp-009',
    name: 'Suresh Verma',
    designation: 'Core Drilling Specialist',
    email: 'suresh.verma@bansalgeo.com',
    department: 'Drilling & Field Operations',
  },
  {
    id: 'emp-010',
    name: 'Ankit Sharma',
    designation: 'GIS Remote Sensing Analyst',
    email: 'ankit.sharma@bansalgeo.com',
    department: 'GIS & Remote Sensing',
  },
  {
    id: 'emp-011',
    name: 'Rahul Soni',
    designation: 'Site Operations Coordinator',
    email: 'rahul.soni@bansalgeo.com',
    department: 'Field Logistics',
  },
];

export const CANONICAL_ROLES = CANONICAL_ROLE_LIST;

export const WORKSPACE_ACCESS: Record<TeamRole, WorkspaceId[]> = {
  admin: ['crm', 'erm', 'vendor', 'documents', 'hrms', 'expenses', 'finance', 'mis', 'field_database'],
  hr: ['crm', 'erm', 'hrms', 'expenses', 'mis'],
  accountant: ['crm', 'vendor', 'hrms', 'expenses', 'finance'],
  lead: ['crm', 'erm', 'vendor', 'documents', 'hrms', 'expenses', 'field_database'],
  employee: ['crm', 'vendor', 'hrms', 'expenses'],
};

export const CANONICAL_ROLE_WORKSPACES: Record<CanonicalRole, WorkspaceId[]> = {
  super_admin: ['crm', 'erm', 'vendor', 'documents', 'hrms', 'expenses', 'finance', 'mis', 'field_database'],
  director: ['crm', 'erm', 'vendor', 'documents', 'hrms', 'expenses', 'mis', 'field_database'],
  manager: ['erm', 'hrms', 'expenses', 'documents', 'mis', 'field_database'],
  employee: ['hrms', 'expenses'],
  finance_master: ['finance', 'expenses', 'vendor', 'mis'],
  accounts_executive: ['finance', 'expenses'],
};

export interface RolePermissionScope {
  canViewAllEmployees: boolean;
  canManageHR: boolean;
  canApproveLeave: boolean;
  canViewFinance: boolean;
  canApproveFinance: boolean;
  canCreateInvoices: boolean;
  canApproveVouchers: boolean;
  canViewPayroll: boolean;
  canManageProjects: boolean;
  canApproveQuotes: boolean;
  canApproveTenders: boolean;
  canApproveExpenses: boolean;
  isPersonalScopeOnly: boolean;
}

export const CANONICAL_ROLE_PERMISSIONS: Record<CanonicalRole, RolePermissionScope> = {
  super_admin: {
    canViewAllEmployees: true,
    canManageHR: true,
    canApproveLeave: true,
    canViewFinance: true,
    canApproveFinance: true,
    canCreateInvoices: true,
    canApproveVouchers: true,
    canViewPayroll: true,
    canManageProjects: true,
    canApproveQuotes: true,
    canApproveTenders: true,
    canApproveExpenses: true,
    isPersonalScopeOnly: false,
  },
  director: {
    canViewAllEmployees: true,
    canManageHR: true,
    canApproveLeave: true,
    canViewFinance: false,
    canApproveFinance: false,
    canCreateInvoices: false,
    canApproveVouchers: false,
    canViewPayroll: false,
    canManageProjects: true,
    canApproveQuotes: true,
    canApproveTenders: true,
    canApproveExpenses: true,
    isPersonalScopeOnly: false,
  },
  manager: {
    canViewAllEmployees: false,
    canManageHR: true,
    canApproveLeave: true,
    canViewFinance: false,
    canApproveFinance: false,
    canCreateInvoices: false,
    canApproveVouchers: false,
    canViewPayroll: false,
    canManageProjects: true,
    canApproveQuotes: false,
    canApproveTenders: false,
    canApproveExpenses: true,
    isPersonalScopeOnly: false,
  },
  employee: {
    canViewAllEmployees: false,
    canManageHR: false,
    canApproveLeave: false,
    canViewFinance: false,
    canApproveFinance: false,
    canCreateInvoices: false,
    canApproveVouchers: false,
    canViewPayroll: false,
    canManageProjects: false,
    canApproveQuotes: false,
    canApproveTenders: false,
    canApproveExpenses: false,
    isPersonalScopeOnly: true,
  },
  finance_master: {
    canViewAllEmployees: false,
    canManageHR: false,
    canApproveLeave: false,
    canViewFinance: true,
    canApproveFinance: true,
    canCreateInvoices: true,
    canApproveVouchers: true,
    canViewPayroll: true,
    canManageProjects: false,
    canApproveQuotes: false,
    canApproveTenders: false,
    canApproveExpenses: true,
    isPersonalScopeOnly: false,
  },
  accounts_executive: {
    canViewAllEmployees: false,
    canManageHR: false,
    canApproveLeave: false,
    canViewFinance: true,
    canApproveFinance: false,
    canCreateInvoices: true,
    canApproveVouchers: false,
    canViewPayroll: false,
    canManageProjects: false,
    canApproveQuotes: false,
    canApproveTenders: false,
    canApproveExpenses: false,
    isPersonalScopeOnly: false,
  },
};

export const CANONICAL_PERSONAS: Record<CanonicalRole, UserSession> = {
  super_admin: {
    id: 'emp-001',
    employeeId: 'BGS-2021-001',
    name: 'Kritika Gupta',
    email: 'kritika.gupta@bansalgeo.com',
    accountType: 'team',
    role: 'admin',
    canonicalRole: 'super_admin',
    hrmsRole: 'hr',
    designation: 'Super Administrator & Board Director',
    department: 'Executive Board',
    workspaces: CANONICAL_ROLE_WORKSPACES.super_admin,
  },
  director: {
    id: 'emp-004',
    employeeId: 'BGS-2022-018',
    name: 'Dr. Sunita Meena',
    email: 'sunita.meena@bansalgeo.com',
    accountType: 'team',
    role: 'lead',
    canonicalRole: 'director',
    hrmsRole: 'employee',
    designation: 'Director (Operations & Exploration)',
    department: 'Executive Board',
    workspaces: CANONICAL_ROLE_WORKSPACES.director,
  },
  manager: {
    id: 'emp-002',
    employeeId: 'BGS-2021-009',
    name: 'Kavita Rawat',
    email: 'kavita.rawat@bansalgeo.com',
    accountType: 'team',
    role: 'hr',
    canonicalRole: 'manager',
    hrmsRole: 'hr',
    designation: 'Manager (ERM, HRMS & projects)',
    department: 'Human Resources & Operations',
    workspaces: CANONICAL_ROLE_WORKSPACES.manager,
  },
  employee: {
    id: 'emp-005',
    employeeId: 'BGS-2023-044',
    name: 'Neha Gupta',
    email: 'neha.gupta@bansalgeo.com',
    accountType: 'team',
    role: 'employee',
    canonicalRole: 'employee',
    hrmsRole: 'employee',
    designation: 'Field Exploration Geologist',
    department: 'Geology & Mineral Exploration',
    workspaces: CANONICAL_ROLE_WORKSPACES.employee,
  },
  finance_master: {
    id: 'emp-006',
    employeeId: 'BGS-2021-005',
    name: 'N. Jain',
    email: 'n.jain@bansalgeo.com',
    accountType: 'team',
    role: 'admin',
    canonicalRole: 'finance_master',
    hrmsRole: 'employee',
    designation: 'Finance Master (Full Access & Finance)',
    department: 'Finance & Treasury',
    workspaces: CANONICAL_ROLE_WORKSPACES.finance_master,
  },
  accounts_executive: {
    id: 'emp-003',
    employeeId: 'BGS-2022-011',
    name: 'Pooja Sharma',
    email: 'pooja.sharma@bansalgeo.com',
    accountType: 'team',
    role: 'accountant',
    canonicalRole: 'accounts_executive',
    hrmsRole: 'employee',
    designation: 'Accounts Executive (Billing, accounts & books)',
    department: 'Finance & Accounts',
    workspaces: CANONICAL_ROLE_WORKSPACES.accounts_executive,
  },
};

export const TEAM_PERSONAS: Record<TeamRole, UserSession> = {
  admin: CANONICAL_PERSONAS.super_admin,
  hr: CANONICAL_PERSONAS.manager,
  accountant: CANONICAL_PERSONAS.accounts_executive,
  lead: CANONICAL_PERSONAS.director,
  employee: CANONICAL_PERSONAS.employee,
};

export const CLIENT_PERSONAS: ClientSession[] = [
  {
    id: 'cli-001',
    enquiryId: 'ENQ-2026-088',
    companyName: 'Tata Steel Mining Corp',
    contactPerson: 'Sandeep Mukherjee',
    mobile: '9820112233',
    email: 'sandeep.m@tatasteel.com',
    accountType: 'client',
  },
  {
    id: 'cli-002',
    enquiryId: 'ENQ-2026-092',
    companyName: 'Hindustan Zinc Ltd',
    contactPerson: 'Kavita Chawla',
    mobile: '9845012345',
    email: 'kavita.c@hzl.com',
    accountType: 'client',
  },
];

export const VENDOR_PERSONAS: VendorSession[] = [
  {
    id: 'ven-001',
    vendorId: 'VND-2026-014',
    vendorName: 'Apex Drilling & Coring Pvt Ltd',
    contactPerson: 'Harish Mehta',
    mobile: '9811223344',
    category: 'Drilling Contractor',
    accountType: 'vendor',
  },
  {
    id: 'ven-002',
    vendorId: 'VND-2026-022',
    vendorName: 'Geotech Assay Labs',
    contactPerson: 'Sunil Nair',
    mobile: '9899112233',
    category: 'Assay Laboratory',
    accountType: 'vendor',
  },
];
