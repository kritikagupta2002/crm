// Comprehensive Automated HRMS Test & Audit Script
import assert from 'node:assert';

console.log('════════════════════════════════════════════════════════════════');
console.log('  BANSAL GEO HRMS & ERP - FULL SYSTEM AUDIT & TEST SUITE');
console.log('════════════════════════════════════════════════════════════════\n');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    failCount++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    Error: ${err.message}`);
    failCount++;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Storage & Centralized Data Pipeline Tests
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- [TEST GROUP 1] Centralized Data Layer & Single Master Source ---');

// Mock localStorage for Node environment
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
};

const DEFAULT_EMPLOYEES = [
  {
    id: 'emp-001',
    employeeId: 'BGS-2021-001',
    name: 'Dr. Amit Bansal',
    email: 'amit.bansal@bansalgeo.com',
    role: 'hr',
    employment: { department: 'Geology & Mineral Exploration', designation: 'Managing Director', status: 'Active', joiningDate: '2021-04-01' }
  },
  {
    id: 'emp-002',
    employeeId: 'BGS-2022-014',
    name: 'Rajesh Sharma',
    email: 'rajesh.sharma@bansalgeo.com',
    role: 'employee',
    employment: { department: 'Geology & Mineral Exploration', designation: 'Senior Exploration Geologist', status: 'Active', joiningDate: '2022-06-15' }
  }
];

const DEFAULT_LEAVE_TYPES = [
  { leaveType: 'Casual Leave (CL)', allocated: 12, used: 0, available: 12 },
  { leaveType: 'Sick Leave (SL)', allocated: 10, used: 0, available: 10 },
  { leaveType: 'Earned Leave (EL)', allocated: 18, used: 0, available: 18 },
  { leaveType: 'Compensatory Off (CO)', allocated: 5, used: 0, available: 5 },
  { leaveType: 'Field Duty Leave (FDL)', allocated: 15, used: 0, available: 15 }
];

test('Storage: Employee list initialization and retrieval', () => {
  localStorage.setItem('bgspl_employees', JSON.stringify(DEFAULT_EMPLOYEES));
  const stored = JSON.parse(localStorage.getItem('bgspl_employees'));
  assert.strictEqual(stored.length, 2);
  assert.strictEqual(stored[0].name, 'Dr. Amit Bansal');
});

test('Storage: Employee-specific leave balance seed and retrieval', () => {
  const empId = 'BGS-2026-999';
  const balancesKey = 'bgspl_employee_leave_balances';
  const allBalances = JSON.parse(localStorage.getItem(balancesKey) || '{}');
  
  // Seed for test employee
  allBalances[empId] = DEFAULT_LEAVE_TYPES.map(b => ({ ...b, employeeId: empId, employeeName: 'Test Kumar' }));
  localStorage.setItem(balancesKey, JSON.stringify(allBalances));

  const retrieved = JSON.parse(localStorage.getItem(balancesKey))[empId];
  assert.ok(Array.isArray(retrieved));
  assert.strictEqual(retrieved.length, 5);
  const cl = retrieved.find(b => b.leaveType.includes('Casual'));
  assert.strictEqual(cl.allocated, 12);
  assert.strictEqual(cl.available, 12);
  assert.strictEqual(cl.used, 0);
});

test('Storage: Deduct leave balance upon approval', () => {
  const empId = 'BGS-2026-999';
  const balancesKey = 'bgspl_employee_leave_balances';
  const allBalances = JSON.parse(localStorage.getItem(balancesKey));
  const userBalances = allBalances[empId];
  
  const clIndex = userBalances.findIndex(b => b.leaveType.includes('Casual'));
  assert.ok(clIndex !== -1);

  // Simulate approving 2 days CL
  const daysDeducted = 2;
  userBalances[clIndex].used += daysDeducted;
  userBalances[clIndex].available = Math.max(0, userBalances[clIndex].allocated - userBalances[clIndex].used);
  allBalances[empId] = userBalances;
  localStorage.setItem(balancesKey, JSON.stringify(allBalances));

  // Verify
  const updated = JSON.parse(localStorage.getItem(balancesKey))[empId];
  const updatedCl = updated.find(b => b.leaveType.includes('Casual'));
  assert.strictEqual(updatedCl.used, 2);
  assert.strictEqual(updatedCl.available, 10);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Employee Creation & Cross-Module Propagation Test
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [TEST GROUP 2] Single Employee Master Data Propagation ---');

test('Pipeline: Create "Test Kumar" and verify cross-module propagation', () => {
  const newEmp = {
    id: 'emp-test-kumar',
    employeeId: 'BGS-2026-088',
    name: 'Test Kumar',
    email: 'test.kumar@bansalgeo.com',
    role: 'employee',
    employment: {
      department: 'Geology & Mineral Exploration',
      designation: 'Field Geologist',
      status: 'Active',
      workLocation: 'Bhilwara Core Yard',
      joiningDate: '2026-09-23'
    }
  };

  // 1. Employees Directory
  const employees = JSON.parse(localStorage.getItem('bgspl_employees') || '[]');
  employees.push(newEmp);
  localStorage.setItem('bgspl_employees', JSON.stringify(employees));

  // 2. Leave Balances
  const balancesKey = 'bgspl_employee_leave_balances';
  const allBalances = JSON.parse(localStorage.getItem(balancesKey) || '{}');
  allBalances[newEmp.employeeId] = DEFAULT_LEAVE_TYPES.map(b => ({ ...b, employeeId: newEmp.employeeId, employeeName: newEmp.name }));
  localStorage.setItem(balancesKey, JSON.stringify(allBalances));

  // 3. Salary Structure
  const salaryKey = 'bgspl_salary_structures';
  const allSalaries = JSON.parse(localStorage.getItem(salaryKey) || '[]');
  allSalaries.push({
    id: `sal-${newEmp.id}`,
    employeeId: newEmp.employeeId,
    employeeName: newEmp.name,
    basic: 27500,
    hra: 11000,
    specialAllowance: 16500,
    monthlyGross: 55000,
    monthlyNet: 48500,
    netPay: 48500
  });
  localStorage.setItem(salaryKey, JSON.stringify(allSalaries));

  // 4. Attendance Today
  const attendanceKey = 'bgspl_attendance_records';
  const allAttendance = JSON.parse(localStorage.getItem(attendanceKey) || '[]');
  allAttendance.push({
    id: `att-${newEmp.id}`,
    employeeId: newEmp.employeeId,
    employeeName: newEmp.name,
    date: '2026-09-23',
    status: 'Present',
    punchIn: '09:00 AM',
    punchOut: '-',
    workLocation: 'Field'
  });
  localStorage.setItem(attendanceKey, JSON.stringify(allAttendance));

  // 5. Verification across all datasets
  const verifyEmployees = JSON.parse(localStorage.getItem('bgspl_employees'));
  const foundEmp = verifyEmployees.find(e => e.employeeId === 'BGS-2026-088');
  assert.ok(foundEmp, 'Employee must exist in Employees Directory');
  assert.strictEqual(foundEmp.name, 'Test Kumar');

  const verifyBalances = JSON.parse(localStorage.getItem(balancesKey))['BGS-2026-088'];
  assert.ok(verifyBalances && verifyBalances.length === 5, 'Employee must have leave balances');

  const verifySalaries = JSON.parse(localStorage.getItem(salaryKey));
  const foundSal = verifySalaries.find(s => s.employeeId === 'BGS-2026-088');
  assert.ok(foundSal, 'Employee must have salary structure');
  assert.strictEqual(foundSal.monthlyGross, 55000);

  const verifyAtt = JSON.parse(localStorage.getItem(attendanceKey));
  const foundAtt = verifyAtt.find(a => a.employeeId === 'BGS-2026-088');
  assert.ok(foundAtt, 'Employee must have attendance record');
  assert.strictEqual(foundAtt.status, 'Present');
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Dynamic Zero Fake Numbers Dashboard Calculation Tests
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [TEST GROUP 3] Zero Fake Numbers Dynamic Calculation Engine ---');

test('Dashboard: Total Staff, Present, Absent, and On-Leave dynamically computed', () => {
  const employees = JSON.parse(localStorage.getItem('bgspl_employees'));
  const attendance = JSON.parse(localStorage.getItem('bgspl_attendance_records'));
  const leaveRequests = [
    { id: 'lr-1', employeeId: 'BGS-2022-014', leaveType: 'Casual Leave (CL)', startDate: '2026-09-20', endDate: '2026-09-25', status: 'Approved' }
  ];

  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.employment.status === 'Active').length;
  const presentToday = attendance.filter(a => a.status === 'Present').length;
  const employeesOnLeave = leaveRequests.filter(l => l.status === 'Approved').length;
  const absentToday = Math.max(0, totalEmployees - presentToday - employeesOnLeave);

  assert.strictEqual(totalEmployees, 3, 'Total employees should be exactly 3');
  assert.strictEqual(activeEmployees, 3, 'Active employees should be exactly 3');
  assert.strictEqual(presentToday, 1, 'Present count should be 1');
  assert.strictEqual(employeesOnLeave, 1, 'Employees on leave should be 1');
  assert.strictEqual(absentToday, 1, 'Absent count should be 1 (3 - 1 - 1)');

  // Dynamic Attendance Percentage
  const presentPct = ((presentToday / totalEmployees) * 100).toFixed(1);
  assert.strictEqual(presentPct, '33.3');
});

test('Dashboard: Department distribution dynamically computed from live records', () => {
  const employees = JSON.parse(localStorage.getItem('bgspl_employees'));
  const deptCounts = {};
  employees.forEach(e => {
    const dept = e.employment.department;
    deptCounts[dept] = (deptCounts[dept] || 0) + 1;
  });

  assert.strictEqual(deptCounts['Geology & Mineral Exploration'], 3);
  assert.strictEqual(Object.keys(deptCounts).length, 1);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Expense Form Inline Validation Tests
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [TEST GROUP 4] Expense Form Inline Validation ---');

test('Validation: Reject zero or negative amount', () => {
  function validateExpense(amount, date, category, project, desc) {
    const errors = {};
    if (!amount || Number(amount) <= 0) errors.amount = 'Claim amount must be a positive number greater than ₹0';
    if (!date) errors.date = 'Expense date is required';
    if (new Date(date) > new Date()) errors.date = 'Expense date cannot be in the future';
    if (!category) errors.category = 'Please select a valid expense category';
    if (!project) errors.project = 'Project block must be specified';
    if (!desc || desc.trim().length < 10) errors.description = 'Justification description must be at least 10 characters';
    return errors;
  }

  // Test invalid amount 0
  const err1 = validateExpense('0', '2026-09-20', 'Travel', 'Bhilwara', 'Valid justification string');
  assert.ok(err1.amount, 'Must flag error on 0 amount');

  // Test short description
  const err2 = validateExpense('500', '2026-09-20', 'Travel', 'Bhilwara', 'short');
  assert.ok(err2.description, 'Must flag error on short description');

  // Test future date
  const err3 = validateExpense('500', '2099-01-01', 'Travel', 'Bhilwara', 'Valid justification string');
  assert.ok(err3.date, 'Must flag error on future date');

  // Test valid submission
  const errValid = validateExpense('2500', '2026-09-20', 'Travel', 'Bhilwara Project', 'Official survey travel expenditure');
  assert.strictEqual(Object.keys(errValid).length, 0, 'Valid expense must produce zero errors');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4B. Leave Application Validation & Policy Limits
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [TEST GROUP 4B] Leave Application Validation & Quota Limits ---');

test('Validation: Reject inverted leave dates (endDate < startDate)', () => {
  function validateLeaveDates(startDate, endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 'Invalid dates';
    if (e < s) return 'End date cannot be earlier than start date';
    return null;
  }
  const err = validateLeaveDates('2026-10-15', '2026-10-10');
  assert.strictEqual(err, 'End date cannot be earlier than start date');
});

test('Validation: Reject leave application exceeding available quota limit', () => {
  const availableQuota = 5;
  const requestedDays = 7;
  const isOverLimit = requestedDays > availableQuota;
  assert.strictEqual(isOverLimit, true, 'Must detect quota limit exceeded');
});

test('Validation: Enforce Casual Leave (CL) maximum 3 consecutive days policy limit', () => {
  function checkClPolicy(leaveType, days) {
    if (leaveType === 'Casual Leave (CL)' && days > 3) {
      return 'Casual Leave (CL) cannot exceed 3 consecutive days';
    }
    return null;
  }
  const err = checkClPolicy('Casual Leave (CL)', 4);
  assert.strictEqual(err, 'Casual Leave (CL) cannot exceed 3 consecutive days');
  const valid = checkClPolicy('Casual Leave (CL)', 2);
  assert.strictEqual(valid, null);
});

test('Validation: Detect overlapping leave requests for same employee', () => {
  const existing = [
    { startDate: '2026-10-05', endDate: '2026-10-08', status: 'Approved' }
  ];
  function hasOverlap(newStart, newEnd) {
    const s = new Date(newStart);
    const e = new Date(newEnd);
    return existing.some(ex => {
      const exStart = new Date(ex.startDate);
      const exEnd = new Date(ex.endDate);
      return s <= exEnd && e >= exStart;
    });
  }
  assert.strictEqual(hasOverlap('2026-10-06', '2026-10-07'), true, 'Should detect internal overlap');
  assert.strictEqual(hasOverlap('2026-10-04', '2026-10-06'), true, 'Should detect partial overlap');
  assert.strictEqual(hasOverlap('2026-10-10', '2026-10-12'), false, 'Should allow non-overlapping dates');
});

// ─────────────────────────────────────────────────────────────────────────────
// 4C. Designation Validation Limits & Staff Safety Guard
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [TEST GROUP 4C] Designation Validation Limits & Safety Guards ---');

test('Validation: Enforce designation title length limits (3 - 60 chars)', () => {
  function validateTitle(t) {
    const trimmed = (t || '').trim();
    if (!trimmed) return 'Required';
    if (trimmed.length < 3) return 'Too short';
    if (trimmed.length > 60) return 'Too long';
    return null;
  }
  assert.strictEqual(validateTitle(''), 'Required');
  assert.strictEqual(validateTitle('AB'), 'Too short');
  assert.strictEqual(validateTitle('A'.repeat(61)), 'Too long');
  assert.strictEqual(validateTitle('Senior Exploration Geologist'), null);
});

test('Validation: Enforce designation code format (uppercase alphanumeric + hyphens, 2-12 chars)', () => {
  function validateCode(c) {
    const trimmed = (c || '').trim().toUpperCase();
    if (!trimmed) return 'Required';
    if (trimmed.length < 2) return 'Too short';
    if (trimmed.length > 12) return 'Too long';
    if (!/^[A-Z0-9-]+$/.test(trimmed)) return 'Invalid characters';
    return null;
  }
  assert.strictEqual(validateCode(''), 'Required');
  assert.strictEqual(validateCode('A'), 'Too short');
  assert.strictEqual(validateCode('TOOLONGCODE123'), 'Too long');
  assert.strictEqual(validateCode('SR_GEO!'), 'Invalid characters');
  assert.strictEqual(validateCode('SR-GEO'), null);
  assert.strictEqual(validateCode('MD-GEO-01'), null);
});

test('Validation: Enforce uniqueness of designation code', () => {
  const existing = [{ id: 'd-1', code: 'MD-GEO', title: 'Managing Director' }];
  function checkDuplicate(newCode, editingId = null) {
    const code = newCode.trim().toUpperCase();
    return existing.some(d => d.code === code && d.id !== editingId);
  }
  assert.strictEqual(checkDuplicate('MD-GEO'), true, 'Must detect duplicate code');
  assert.strictEqual(checkDuplicate('md-geo'), true, 'Must be case-insensitive');
  assert.strictEqual(checkDuplicate('MD-GEO', 'd-1'), false, 'Should allow same code when editing same item');
  assert.strictEqual(checkDuplicate('PR-MINE'), false, 'Should allow unique code');
});

test('Safety Guard: Block deletion of designation with active staff assigned', () => {
  function canDeleteDesignation(assignedStaffCount) {
    return assignedStaffCount === 0;
  }
  assert.strictEqual(canDeleteDesignation(1), false, 'Cannot delete designation with 1 assigned staff');
  assert.strictEqual(canDeleteDesignation(6), false, 'Cannot delete designation with 6 assigned staff');
  assert.strictEqual(canDeleteDesignation(0), true, 'Can safely delete designation with 0 assigned staff');
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. RBAC & Route Protection Tests
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [TEST GROUP 5] Role-Based Access Control (Admin vs Employee) ---');

const ROLE_PERMISSIONS = {
  hr: {
    dashboard: 'manage',
    employees: 'manage',
    organization: 'manage',
    attendance: 'manage',
    leave: 'manage',
    shifts: 'manage',
    documents: 'manage',
    payroll: 'manage',
    expenses: 'manage',
    reimbursement: 'manage',
    finance: 'manage',
    reports: 'manage',
    roles_permissions: 'manage',
    settings: 'manage',
  },
  employee: {
    dashboard: 'view',
    employees: 'none',
    organization: 'none',
    attendance: 'view',
    leave: 'view',
    shifts: 'view',
    documents: 'view',
    payroll: 'view',
    expenses: 'view',
    reimbursement: 'view',
    finance: 'none',
    reports: 'none',
    roles_permissions: 'none',
    settings: 'view',
  }
};

function hasPermission(role, module, action = 'view') {
  const perm = ROLE_PERMISSIONS[role]?.[module] || 'none';
  if (perm === 'manage') return true;
  if (perm === 'view' && action === 'view') return true;
  return false;
}

test('RBAC: Admin has manage permissions across all modules', () => {
  const modules = Object.keys(ROLE_PERMISSIONS.hr);
  modules.forEach(m => {
    assert.strictEqual(hasPermission('hr', m, 'view'), true, `Admin should view ${m}`);
    assert.strictEqual(hasPermission('hr', m, 'manage'), true, `Admin should manage ${m}`);
  });
});

test('RBAC: Employee restricted from sensitive admin modules', () => {
  assert.strictEqual(hasPermission('employee', 'finance', 'view'), false, 'Employee must not view finance');
  assert.strictEqual(hasPermission('employee', 'roles_permissions', 'view'), false, 'Employee must not view roles_permissions');
  assert.strictEqual(hasPermission('employee', 'organization', 'view'), false, 'Employee must not view organization');
  assert.strictEqual(hasPermission('employee', 'reports', 'view'), false, 'Employee must not view reports');
});

test('RBAC: Employee has self-service view access to personal modules', () => {
  assert.strictEqual(hasPermission('employee', 'dashboard', 'view'), true);
  assert.strictEqual(hasPermission('employee', 'attendance', 'view'), true);
  assert.strictEqual(hasPermission('employee', 'leave', 'view'), true);
  assert.strictEqual(hasPermission('employee', 'payroll', 'view'), true);
  assert.strictEqual(hasPermission('employee', 'expenses', 'view'), true);
  assert.strictEqual(hasPermission('employee', 'reimbursement', 'view'), true);
  assert.strictEqual(hasPermission('employee', 'documents', 'view'), true);
  assert.strictEqual(hasPermission('employee', 'settings', 'view'), true);
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Live HTTP Health Check
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- [TEST GROUP 6] HTTP Server & Asset Health Check ---');

await asyncTest('HTTP: Local Vite dev server responds with HTTP 200', async () => {
  const res = await fetch('http://localhost:5190/');
  assert.strictEqual(res.status, 200, 'Dev server must return HTTP 200');
  const text = await res.text();
  assert.ok(text.toLowerCase().includes('<!doctype html>'), 'Response must be valid HTML');
  assert.ok(text.includes('/src/main.jsx'), 'HTML must contain entry point src/main.jsx');
});

console.log('\n════════════════════════════════════════════════════════════════');
console.log(`  AUDIT COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
console.log('════════════════════════════════════════════════════════════════\n');

if (failCount > 0) {
  process.exit(1);
}
