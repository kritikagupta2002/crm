import { TeamRole, WorkspaceId, UserSession, ClientSession, VendorSession } from '../types';

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
];

// Preserves the exact role-to-workspace mapping from prompt
export const WORKSPACE_ACCESS: Record<TeamRole, WorkspaceId[]> = {
  admin: ['crm', 'erm', 'vendor', 'documents', 'hrms', 'expenses', 'finance', 'mis'],
  hr: ['hrms', 'expenses', 'mis'],
  accountant: ['crm', 'vendor', 'hrms', 'expenses', 'finance'],
  lead: ['crm', 'erm', 'vendor', 'documents', 'hrms', 'expenses'],
  employee: ['crm', 'vendor', 'hrms', 'expenses'],
};


export const TEAM_PERSONAS: Record<TeamRole, UserSession> = {
  admin: {
    id: 'emp-001',
    employeeId: 'BGS-2021-001',
    name: 'Dr. Rajesh Bansal',
    email: 'rajesh.bansal@bansalgeo.com',
    accountType: 'team',
    role: 'admin',
    hrmsRole: 'hr',
    designation: 'Managing Director & Chief Geoscientist',
    department: 'Executive Board',
    workspaces: WORKSPACE_ACCESS.admin,
  },
  hr: {
    id: 'emp-002',
    employeeId: 'BGS-2021-009',
    name: 'Pooja Joshi',
    email: 'pooja.joshi@bansalgeo.com',
    accountType: 'team',
    role: 'hr',
    hrmsRole: 'hr',
    designation: 'Head of Human Resources',
    department: 'Human Resources',
    workspaces: WORKSPACE_ACCESS.hr,
  },
  accountant: {
    id: 'emp-003',
    employeeId: 'BGS-2022-011',
    name: 'Ramesh Iyer',
    email: 'ramesh.iyer@bansalgeo.com',
    accountType: 'team',
    role: 'accountant',
    hrmsRole: 'employee',
    designation: 'Chief Financial Controller',
    department: 'Finance & Accounts',
    workspaces: WORKSPACE_ACCESS.accountant,
  },
  lead: {
    id: 'emp-004',
    employeeId: 'BGS-2022-018',
    name: 'Vikram Patel',
    email: 'vikram.patel@bansalgeo.com',
    accountType: 'team',
    role: 'lead',
    hrmsRole: 'employee',
    designation: 'Chief Geophysical Project Manager',
    department: 'Geology & Mineral Exploration',
    workspaces: WORKSPACE_ACCESS.lead,
  },
  employee: {
    id: 'emp-005',
    employeeId: 'BGS-2023-044',
    name: 'Neha Gupta',
    email: 'neha.gupta@bansalgeo.com',
    accountType: 'team',
    role: 'employee',
    hrmsRole: 'employee',
    designation: 'Field Exploration Geologist',
    department: 'Geology & Mineral Exploration',
    workspaces: WORKSPACE_ACCESS.employee,
  },
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
