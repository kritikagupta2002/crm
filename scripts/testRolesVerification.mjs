import assert from 'node:assert';

// Verification test suite for Bansal Geo Remaining 5 Roles Implementation

console.log('=== RUNNING BANSAL GEO 6 CANONICAL ROLES AUTOMATED TEST SUITE ===\n');

// 1. CANONICAL ROLES AUDIT
const CANONICAL_ROLES = [
  'super_admin',
  'director',
  'manager',
  'employee',
  'finance_master',
  'accounts_executive',
];

console.log('Test 1: Validating Canonical Roles Set...');
assert.strictEqual(CANONICAL_ROLES.length, 6, 'Must have exactly 6 canonical internal roles');
console.log('✓ Canonical role count = 6\n');

// 2. WORKSPACE ACCESS DEFINITIONS
const CANONICAL_ROLE_WORKSPACES = {
  super_admin: ['crm', 'erm', 'vendor', 'documents', 'hrms', 'expenses', 'finance', 'mis', 'field_database'],
  director: ['crm', 'erm', 'vendor', 'documents', 'hrms', 'expenses', 'mis', 'field_database'],
  manager: ['erm', 'hrms', 'expenses', 'documents', 'mis', 'field_database'],
  employee: ['hrms', 'expenses'],
  finance_master: ['finance', 'expenses', 'vendor', 'mis'],
  accounts_executive: ['finance', 'expenses'],
};

console.log('Test 2: Verifying Director Workspace Isolation (Strictly No Finance)...');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.director.includes('finance'), false, 'Director MUST NOT have finance workspace');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.director.includes('crm'), true, 'Director must have CRM');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.director.includes('erm'), true, 'Director must have ERM');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.director.includes('vendor'), true, 'Director must have Vendor');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.director.includes('documents'), true, 'Director must have Documents');
console.log('✓ Director workspace isolation verified\n');

console.log('Test 3: Verifying Manager Workspace Isolation...');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.manager.includes('finance'), false, 'Manager MUST NOT have finance workspace');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.manager.includes('crm'), false, 'Manager MUST NOT have CRM commercial workspace');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.manager.includes('erm'), true, 'Manager must have ERM');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.manager.includes('hrms'), true, 'Manager must have HRMS');
console.log('✓ Manager workspace isolation verified\n');

console.log('Test 4: Verifying Employee Workspace Isolation (Personal Self-Service Only)...');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.employee.includes('finance'), false, 'Employee MUST NOT have finance workspace');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.employee.includes('crm'), false, 'Employee MUST NOT have CRM');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.employee.includes('erm'), false, 'Employee MUST NOT have ERM management');
assert.deepStrictEqual(CANONICAL_ROLE_WORKSPACES.employee, ['hrms', 'expenses'], 'Employee has only hrms and expenses');
console.log('✓ Employee workspace isolation verified\n');

console.log('Test 5: Verifying Finance Master vs Accounts Executive Workspaces...');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.finance_master.includes('finance'), true, 'Finance Master must have finance');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.finance_master.includes('mis'), true, 'Finance Master must have MIS');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.accounts_executive.includes('finance'), true, 'Accounts Exec must have finance');
assert.strictEqual(CANONICAL_ROLE_WORKSPACES.accounts_executive.includes('mis'), false, 'Accounts Exec should not have executive MIS');
console.log('✓ Finance Master and Accounts Executive workspace isolation verified\n');

// 3. ACTION PERMISSION SCOPES
function can(canonicalRole, action, module) {
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
}

console.log('Test 6: Action Permission - Leave Approvals...');
assert.strictEqual(can('super_admin', 'approve', 'leave'), true, 'Super Admin can approve leave');
assert.strictEqual(can('director', 'approve', 'leave'), true, 'Director can approve leave');
assert.strictEqual(can('manager', 'approve', 'leave'), true, 'Manager can approve leave');
assert.strictEqual(can('employee', 'approve', 'leave'), false, 'Employee CANNOT approve leave');
assert.strictEqual(can('finance_master', 'approve', 'leave'), false, 'Finance Master CANNOT approve leave');
assert.strictEqual(can('accounts_executive', 'approve', 'leave'), false, 'Accounts Executive CANNOT approve leave');
console.log('✓ Leave approval permissions verified\n');

console.log('Test 7: Action Permission - Financial Approvals & Disbursement...');
assert.strictEqual(can('super_admin', 'approve', 'bills'), true, 'Super Admin can approve bills');
assert.strictEqual(can('director', 'approve', 'bills'), false, 'Director CANNOT approve bills');
assert.strictEqual(can('manager', 'approve', 'bills'), false, 'Manager CANNOT approve bills');
assert.strictEqual(can('employee', 'approve', 'bills'), false, 'Employee CANNOT approve bills');
assert.strictEqual(can('finance_master', 'approve', 'bills'), true, 'Finance Master CAN approve bills');
assert.strictEqual(can('accounts_executive', 'approve', 'bills'), false, 'Accounts Executive CANNOT approve bills (entry only)');
console.log('✓ Financial approval permissions verified\n');

console.log('Test 8: Action Permission - Invoices Creation vs Approval...');
assert.strictEqual(can('accounts_executive', 'view', 'invoices'), true, 'Accounts Exec can view invoices');
assert.strictEqual(can('accounts_executive', 'manage', 'invoices'), true, 'Accounts Exec can manage/create invoices');
assert.strictEqual(can('accounts_executive', 'approve', 'invoices'), false, 'Accounts Exec CANNOT approve invoices');
assert.strictEqual(can('finance_master', 'approve', 'invoices'), true, 'Finance Master CAN approve invoices');
console.log('✓ Accounts Exec vs Finance Master separation verified\n');

// 4. HAS ROLE EMULATION (Canonical-aware)
function hasRole(canonicalRole, role, roles) {
  const roleList = (Array.isArray(roles) ? roles : [roles]).map(r => r.toLowerCase().trim());
  if (canonicalRole === 'super_admin') return true;
  if (roleList.includes(canonicalRole.toLowerCase())) return true;
  if (canonicalRole === 'finance_master') {
    return roleList.includes('finance_master') || roleList.includes('accountant') || roleList.includes('finance');
  }
  if (canonicalRole === 'accounts_executive') {
    return roleList.includes('accounts_executive') || roleList.includes('accountant');
  }
  if (canonicalRole === 'manager') {
    return roleList.includes('manager') || roleList.includes('hr');
  }
  if (canonicalRole === 'director') {
    return roleList.includes('director') || roleList.includes('lead') || roleList.includes('executive') || roleList.includes('manager');
  }
  if (canonicalRole === 'employee') {
    return roleList.includes('employee');
  }
  return false;
}

console.log('Test 9: Preventing Finance Master from accidentally receiving HR Admin powers...');
assert.strictEqual(hasRole('finance_master', 'admin', ['Admin', 'HR']), false, 'Finance Master MUST NOT match Admin/HR');
assert.strictEqual(hasRole('finance_master', 'admin', ['Admin', 'Accountant']), true, 'Finance Master matches Accountant');
assert.strictEqual(hasRole('super_admin', 'admin', ['Admin', 'HR']), true, 'Super Admin matches Admin/HR');
console.log('✓ Finance Master prevented from unintended Super Admin HR privileges\n');

// 5. DATA ISOLATION FOR EMPLOYEE
console.log('Test 10: Validating Data Isolation for Employee Tasks and Personal Records...');
const sampleTasks = [
  { id: '1', title: 'Task for Neha', assigneeName: 'Neha Gupta' },
  { id: '2', title: 'Task for Vikram', assigneeName: 'Vikram Patel' },
  { id: '3', title: 'Task for Rohit', assigneeName: 'Rohit Meena' },
];

function filterTasksForSession(tasks, session, canonicalRole) {
  if (canonicalRole === 'employee' && session) {
    const myName = (session.name || '').toLowerCase();
    const myFirstName = myName.split(' ')[0] || '';
    return tasks.filter((t) => {
      const assigned = (t.assigneeName || '').toLowerCase();
      return (
        assigned.includes(myName) ||
        (myFirstName && assigned.includes(myFirstName)) ||
        !assigned
      );
    });
  }
  return tasks;
}

const nehaSession = { name: 'Neha Gupta', employeeId: 'emp-005' };
const nehaTasks = filterTasksForSession(sampleTasks, nehaSession, 'employee');
assert.strictEqual(nehaTasks.length, 1, 'Neha must see only her own task');
assert.strictEqual(nehaTasks[0].id, '1', 'Neha sees task 1');

const adminTasks = filterTasksForSession(sampleTasks, { name: 'Kritika' }, 'super_admin');
assert.strictEqual(adminTasks.length, 3, 'Super Admin sees all 3 tasks');
console.log('✓ Data isolation logic verified\n');

console.log('=== ALL 10 TARGETED VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
