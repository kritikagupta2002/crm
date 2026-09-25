const allModules = [
    'dashboard', 'employees', 'organization', 'attendance', 'leave',
    'shifts', 'documents', 'payroll', 'expenses', 'reimbursement',
    'reports', 'roles_permissions', 'notifications', 'settings', 'finance'
];
const fullPermissions = () => {
    const result = {};
    allModules.forEach(m => {
        result[m] = { view: true, create: true, edit: true, delete: true, approve: true, export: true };
    });
    return result;
};
const hrPermissions = () => {
    const perms = fullPermissions();
    perms.roles_permissions = { view: false, create: false, edit: false, delete: false, approve: false, export: false };
    perms.payroll.delete = false;
    return perms;
};
const employeePermissions = () => {
    const result = {};
    allModules.forEach(m => {
        result[m] = { view: false, create: false, edit: false, delete: false, approve: false, export: false };
    });
    // Employee can only access personal self-service modules:
    // dashboard, own attendance, own leaves, personal documents, own payslips, personal expenses/reimbursement, notifications, and profile settings
    result.dashboard = { view: true, create: false, edit: false, delete: false, approve: false, export: false };
    result.employees = { view: false, create: false, edit: false, delete: false, approve: false, export: false };
    result.organization = { view: false, create: false, edit: false, delete: false, approve: false, export: false };
    result.attendance = { view: true, create: true, edit: false, delete: false, approve: false, export: false };
    result.leave = { view: true, create: true, edit: false, delete: false, approve: false, export: false };
    result.shifts = { view: true, create: false, edit: false, delete: false, approve: false, export: false };
    result.documents = { view: true, create: true, edit: false, delete: false, approve: false, export: false };
    result.payroll = { view: true, create: false, edit: false, delete: false, approve: false, export: false };
    result.expenses = { view: true, create: true, edit: false, delete: false, approve: false, export: false };
    result.reimbursement = { view: true, create: true, edit: false, delete: false, approve: false, export: false };
    result.notifications = { view: true, create: false, edit: true, delete: true, approve: false, export: false };
    result.settings = { view: true, create: false, edit: true, delete: false, approve: false, export: false };
    result.finance = { view: false, create: false, edit: false, delete: false, approve: false, export: false };
    result.reports = { view: false, create: false, edit: false, delete: false, approve: false, export: false };
    result.roles_permissions = { view: false, create: false, edit: false, delete: false, approve: false, export: false };
    return result;
};
export const INITIAL_ROLES = [
    {
        role: 'hr',
        title: 'HR & System Admin',
        description: 'Complete workforce management, attendance monitoring, leave approvals, payroll processing, and organizational governance.',
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
        permissions: hrPermissions(),
    },
    {
        role: 'employee',
        title: 'Employee (Self-Service)',
        description: 'Personal self-service portal for clock-ins, leave applications, expense filing, and payslip downloads.',
        badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
        permissions: employeePermissions(),
    }
];
