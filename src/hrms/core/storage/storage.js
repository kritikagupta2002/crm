import { INITIAL_EMPLOYEES, INITIAL_DEPARTMENTS, INITIAL_DESIGNATIONS, INITIAL_ATTENDANCE, INITIAL_CORRECTIONS, INITIAL_LEAVE_BALANCES, INITIAL_LEAVE_REQUESTS, INITIAL_LEAVE_TYPES, INITIAL_SHIFTS, INITIAL_SHIFT_ASSIGNMENTS, INITIAL_DOCUMENTS, INITIAL_SALARY_STRUCTURES, INITIAL_PAYSLIPS, INITIAL_PAYROLL_RUNS, INITIAL_EXPENSES, INITIAL_REIMBURSEMENTS, INITIAL_NOTIFICATIONS, INITIAL_COMPANY_SETTINGS, INITIAL_ATTENDANCE_SETTINGS, INITIAL_LEAVE_SETTINGS, INITIAL_PAYROLL_SETTINGS, INITIAL_ROLES, } from '../../data/index.js';
const STORAGE_KEYS = {
    EMPLOYEES: 'bgspl_employees',
    DEPARTMENTS: 'bgspl_departments',
    DESIGNATIONS: 'bgspl_designations',
    ATTENDANCE: 'bgspl_attendance',
    CORRECTIONS: 'bgspl_corrections',
    LEAVE_BALANCES: 'bgspl_leave_balances',
    LEAVE_REQUESTS: 'bgspl_leave_requests',
    LEAVE_TYPES: 'bgspl_leave_types',
    SHIFTS: 'bgspl_shifts',
    SHIFT_ASSIGNMENTS: 'bgspl_shift_assignments',
    DOCUMENTS: 'bgspl_documents',
    SALARY_STRUCTURES: 'bgspl_salary_structures',
    PAYSLIPS: 'bgspl_payslips',
    PAYROLL_RUNS: 'bgspl_payroll_runs',
    EXPENSES: 'bgspl_expenses',
    REIMBURSEMENTS: 'bgspl_reimbursements',
    NOTIFICATIONS: 'bgspl_notifications',
    COMPANY_SETTINGS: 'bgspl_company_settings',
    ATTENDANCE_SETTINGS: 'bgspl_attendance_settings',
    LEAVE_SETTINGS: 'bgspl_leave_settings',
    PAYROLL_SETTINGS: 'bgspl_payroll_settings',
    ROLES: 'bgspl_roles',
    ACTIVE_USER: 'bgspl_active_user',
    ACTIVE_ROLE: 'bgspl_active_role',
    EMPLOYEE_LEAVE_BALANCES: 'bgspl_emp_leave_balances',
    EMPLOYEE_DOCUMENTS: 'bgspl_employee_documents',
};
function getItem(key, defaultValue) {
    try {
        const item = localStorage.getItem(key);
        if (!item) {
            localStorage.setItem(key, JSON.stringify(defaultValue));
            return defaultValue;
        }
        return JSON.parse(item);
    }
    catch {
        return defaultValue;
    }
}
function setItem(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    }
    catch (err) {
        console.error(`Failed saving to localStorage key "${key}":`, err);
    }
}
export const storage = {
    getEmployees: () => getItem(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES),
    setEmployees: (val) => setItem(STORAGE_KEYS.EMPLOYEES, val),
    getDepartments: () => getItem(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS),
    setDepartments: (val) => setItem(STORAGE_KEYS.DEPARTMENTS, val),
    getDesignations: () => getItem(STORAGE_KEYS.DESIGNATIONS, INITIAL_DESIGNATIONS),
    setDesignations: (val) => setItem(STORAGE_KEYS.DESIGNATIONS, val),
    getAttendance: () => getItem(STORAGE_KEYS.ATTENDANCE, INITIAL_ATTENDANCE),
    setAttendance: (val) => setItem(STORAGE_KEYS.ATTENDANCE, val),
    getCorrections: () => getItem(STORAGE_KEYS.CORRECTIONS, INITIAL_CORRECTIONS),
    setCorrections: (val) => setItem(STORAGE_KEYS.CORRECTIONS, val),
    getLeaveBalances: () => getItem(STORAGE_KEYS.LEAVE_BALANCES, INITIAL_LEAVE_BALANCES),
    setLeaveBalances: (val) => setItem(STORAGE_KEYS.LEAVE_BALANCES, val),
    getLeaveSettings: () => getItem(STORAGE_KEYS.LEAVE_SETTINGS, INITIAL_LEAVE_SETTINGS),
    setLeaveSettings: (val) => {
        setItem(STORAGE_KEYS.LEAVE_SETTINGS, val);
        // Keep leave types in sync with newly saved settings
        try {
            const types = getItem(STORAGE_KEYS.LEAVE_TYPES, INITIAL_LEAVE_TYPES);
            const updatedTypes = types.map((t) => {
                if (t.name?.includes('Casual'))
                    return { ...t, annualQuota: val.annualCasualLeave ?? t.annualQuota };
                if (t.name?.includes('Sick'))
                    return { ...t, annualQuota: val.annualSickLeave ?? t.annualQuota };
                if (t.name?.includes('Earned'))
                    return { ...t, annualQuota: val.annualEarnedLeave ?? t.annualQuota };
                if (t.name?.includes('Compensatory'))
                    return { ...t, annualQuota: val.annualCompOffLeave ?? t.annualQuota };
                if (t.name?.includes('Field'))
                    return { ...t, annualQuota: val.annualFieldDutyLeave ?? t.annualQuota };
                return t;
            });
            setItem(STORAGE_KEYS.LEAVE_TYPES, updatedTypes);
        }
        catch {
            // fallback
        }
    },
    getBalancesForEmployee: (employeeId, employeeName) => {
        const settings = getItem(STORAGE_KEYS.LEAVE_SETTINGS, INITIAL_LEAVE_SETTINGS);
        const requests = storage.getLeaveRequests();
        const quotas = [
            { leaveType: 'Casual Leave (CL)', totalAllocated: settings.annualCasualLeave ?? 12, color: '#3B82F6' },
            { leaveType: 'Sick Leave (SL)', totalAllocated: settings.annualSickLeave ?? 10, color: '#10B981' },
            { leaveType: 'Earned / Privilege Leave (EL)', totalAllocated: settings.annualEarnedLeave ?? 18, color: '#F59E0B' },
            { leaveType: 'Compensatory Off (CO)', totalAllocated: settings.annualCompOffLeave ?? 8, color: '#8B5CF6' },
            { leaveType: 'Field Duty Leave (FDL)', totalAllocated: settings.annualFieldDutyLeave ?? 15, color: '#06B6D4' },
            { leaveType: 'Maternity / Paternity Leave', totalAllocated: 180, color: '#EC4899' },
        ];
        const empRequests = requests.filter((r) => r.employeeId === employeeId);
        const balances = quotas.map((q) => {
            // Approved used days: from Approved or Partially Approved requests
            const used = empRequests
                .filter((r) => (r.status === 'Approved' || r.status === 'Partially Approved') && r.leaveType === q.leaveType)
                .reduce((sum, r) => sum + (Number(r.approvedDays ?? r.days) || 0), 0);
            // Pending committed days: from Pending requests
            const pending = empRequests
                .filter((r) => r.status === 'Pending' && r.leaveType === q.leaveType)
                .reduce((sum, r) => sum + (Number(r.requestedDays ?? r.days) || 0), 0);
            const available = Math.max(0, q.totalAllocated - used);
            return {
                id: `bal-${employeeId}-${q.leaveType}`,
                employeeId,
                employeeName: employeeName || '',
                leaveType: q.leaveType,
                totalAllocated: q.totalAllocated,
                used,
                pending,
                available,
                color: q.color,
            };
        });
        const all = getItem(STORAGE_KEYS.EMPLOYEE_LEAVE_BALANCES, {});
        all[employeeId] = balances;
        setItem(STORAGE_KEYS.EMPLOYEE_LEAVE_BALANCES, all);
        return balances;
    },
    setBalancesForEmployee: (employeeId, balances) => {
        const all = getItem(STORAGE_KEYS.EMPLOYEE_LEAVE_BALANCES, {});
        all[employeeId] = balances;
        setItem(STORAGE_KEYS.EMPLOYEE_LEAVE_BALANCES, all);
    },
    getAllEmployeeBalances: () => {
        const employees = storage.getEmployees();
        const result = {};
        for (const emp of employees) {
            result[emp.employeeId] = storage.getBalancesForEmployee(emp.employeeId, emp.name);
        }
        return result;
    },
    getLeaveRequests: () => {
        const raw = getItem(STORAGE_KEYS.LEAVE_REQUESTS, INITIAL_LEAVE_REQUESTS);
        let migrated = false;
        const requests = raw.map((r) => {
            if (r.requestedDays === undefined) {
                migrated = true;
                const total = Number(r.days) || 1;
                if (r.status === 'Approved') {
                    return { ...r, requestedDays: total, approvedDays: total, rejectedDays: 0, days: total };
                }
                else if (r.status === 'Partially Approved') {
                    const appr = Number(r.approvedDays) || Math.ceil(total / 2);
                    return { ...r, requestedDays: total, approvedDays: appr, rejectedDays: total - appr, days: total };
                }
                else if (r.status === 'Rejected' || r.status === 'Cancelled') {
                    return { ...r, requestedDays: total, approvedDays: 0, rejectedDays: total, days: total };
                }
                else {
                    // Pending
                    return { ...r, requestedDays: total, approvedDays: 0, rejectedDays: 0, days: total };
                }
            }
            return r;
        });
        if (migrated) {
            setItem(STORAGE_KEYS.LEAVE_REQUESTS, requests);
        }
        return requests;
    },
    setLeaveRequests: (val) => setItem(STORAGE_KEYS.LEAVE_REQUESTS, val),
    getLeaveTypes: () => {
        const settings = getItem(STORAGE_KEYS.LEAVE_SETTINGS, INITIAL_LEAVE_SETTINGS);
        const types = getItem(STORAGE_KEYS.LEAVE_TYPES, INITIAL_LEAVE_TYPES);
        return types.map((t) => {
            if (t.name?.includes('Casual'))
                return { ...t, annualQuota: settings.annualCasualLeave ?? t.annualQuota };
            if (t.name?.includes('Sick'))
                return { ...t, annualQuota: settings.annualSickLeave ?? t.annualQuota };
            if (t.name?.includes('Earned'))
                return { ...t, annualQuota: settings.annualEarnedLeave ?? t.annualQuota };
            if (t.name?.includes('Compensatory'))
                return { ...t, annualQuota: settings.annualCompOffLeave ?? 8 };
            if (t.name?.includes('Field'))
                return { ...t, annualQuota: settings.annualFieldDutyLeave ?? 15 };
            return t;
        });
    },
    setLeaveTypes: (val) => setItem(STORAGE_KEYS.LEAVE_TYPES, val),
    getShifts: () => getItem(STORAGE_KEYS.SHIFTS, INITIAL_SHIFTS),
    setShifts: (val) => setItem(STORAGE_KEYS.SHIFTS, val),
    getShiftAssignments: () => getItem(STORAGE_KEYS.SHIFT_ASSIGNMENTS, INITIAL_SHIFT_ASSIGNMENTS),
    setShiftAssignments: (val) => setItem(STORAGE_KEYS.SHIFT_ASSIGNMENTS, val),
    getEmployeeLeaveBalances: (employeeId, employeeName) => {
        return storage.getBalancesForEmployee(employeeId, employeeName);
    },
    setEmployeeLeaveBalances: (employeeId, balances) => {
        storage.setBalancesForEmployee(employeeId, balances);
    },
    getEmployeeDocuments: () => {
        return getItem(STORAGE_KEYS.EMPLOYEE_DOCUMENTS, [
            {
                id: 'doc-rec-rohan-1',
                employeeId: 'BGS-006',
                employeeName: 'Rohan Deshmukh',
                department: 'Geology & Mineral Exploration',
                documentType: 'Degree / Diploma',
                fileName: 'M.Sc_Applied_Geology_Rajasthan_University.pdf',
                fileSize: '3.4 MB',
                uploadedOn: '2023-04-18',
                status: 'Verified',
            },
            {
                id: 'doc-rec-rohan-2',
                employeeId: 'BGS-006',
                employeeName: 'Rohan Deshmukh',
                department: 'Geology & Mineral Exploration',
                documentType: 'Aadhaar Card',
                fileName: 'Aadhaar_Card_Rohan_Deshmukh.pdf',
                fileSize: '1.2 MB',
                uploadedOn: '2023-04-18',
                status: 'Verified',
            },
            {
                id: 'doc-rec-rohan-3',
                employeeId: 'BGS-006',
                employeeName: 'Rohan Deshmukh',
                department: 'Geology & Mineral Exploration',
                documentType: 'DGMS Mining Competency',
                fileName: 'DGMS_Gas_Testing_Safety_Badge.pdf',
                fileSize: '2.1 MB',
                uploadedOn: '2023-07-22',
                status: 'Verified',
                expiryDate: '2028-07-21',
            },
            {
                id: 'doc-rec-1',
                employeeId: 'BGS-001',
                employeeName: 'Dr. Amit Kumar Bansal',
                department: 'Geology & Mineral Exploration',
                documentType: 'Degree / Diploma',
                fileName: 'Ph.D_Geology_IIT_Roorkee.pdf',
                fileSize: '4.2 MB',
                uploadedOn: '2022-04-10',
                status: 'Verified',
            },
            {
                id: 'doc-rec-2',
                employeeId: 'BGS-003',
                employeeName: 'Rajesh Sharma',
                department: 'Mining & Mine Planning',
                documentType: 'DGMS Mining Competency',
                fileName: 'DGMS_First_Class_Manager_Cert.pdf',
                fileSize: '2.8 MB',
                uploadedOn: '2023-01-15',
                status: 'Verified',
                expiryDate: '2028-01-14',
            },
            {
                id: 'doc-rec-3',
                employeeId: 'BGS-004',
                employeeName: 'Priya Meena',
                department: 'GIS & Remote Sensing',
                documentType: 'UAV Remote Pilot License',
                fileName: 'DGCA_Small_Category_Drone_Pilot.pdf',
                fileSize: '1.9 MB',
                uploadedOn: '2023-06-20',
                status: 'Verified',
                expiryDate: '2029-06-19',
            },
            {
                id: 'doc-rec-4',
                employeeId: 'BGS-005',
                employeeName: 'Vikram Singh Shekhawat',
                department: 'Mining Operations',
                documentType: 'DGMS Mining Competency',
                fileName: 'Overman_Competency_Certificate.pdf',
                fileSize: '3.1 MB',
                uploadedOn: '2023-11-05',
                status: 'Pending Review',
                expiryDate: '2027-11-04',
            },
            {
                id: 'doc-rec-5',
                employeeId: 'BGS-007',
                employeeName: 'Sunita Choudhary',
                department: 'Human Resources & Admin',
                documentType: 'PAN Card',
                fileName: 'PAN_Card_Sunita_Choudhary.pdf',
                fileSize: '1.1 MB',
                uploadedOn: '2024-02-01',
                status: 'Verified',
            },
            {
                id: 'doc-rec-6',
                employeeId: 'BGS-008',
                employeeName: 'Kavita Joshi',
                department: 'Finance & Accounts',
                documentType: 'Degree / Diploma',
                fileName: 'ICAI_Chartered_Accountant_Cert.pdf',
                fileSize: '2.4 MB',
                uploadedOn: '2023-08-12',
                status: 'Verified',
            }
        ]);
    },
    setEmployeeDocuments: (val) => setItem(STORAGE_KEYS.EMPLOYEE_DOCUMENTS, val),
    getDocuments: () => getItem(STORAGE_KEYS.DOCUMENTS, INITIAL_DOCUMENTS),
    setDocuments: (val) => setItem(STORAGE_KEYS.DOCUMENTS, val),
    getSalaryStructures: () => getItem(STORAGE_KEYS.SALARY_STRUCTURES, INITIAL_SALARY_STRUCTURES),
    setSalaryStructures: (val) => setItem(STORAGE_KEYS.SALARY_STRUCTURES, val),
    getPayslips: () => getItem(STORAGE_KEYS.PAYSLIPS, INITIAL_PAYSLIPS),
    setPayslips: (val) => setItem(STORAGE_KEYS.PAYSLIPS, val),
    getPayrollRuns: () => getItem(STORAGE_KEYS.PAYROLL_RUNS, INITIAL_PAYROLL_RUNS),
    setPayrollRuns: (val) => setItem(STORAGE_KEYS.PAYROLL_RUNS, val),
    getExpenses: () => {
        const list = getItem(STORAGE_KEYS.EXPENSES, INITIAL_EXPENSES);
        let changed = false;
        const normalized = list.map((item) => {
            const copy = { ...item };
            let itemChanged = false;
            const req = copy.requestedAmount !== undefined 
                ? Number(copy.requestedAmount) 
                : (copy.amount !== undefined ? Number(copy.amount) : 0);
            
            if (copy.requestedAmount === undefined) {
                copy.requestedAmount = req;
                itemChanged = true;
            }
            if (copy.amount === undefined) {
                copy.amount = req;
                itemChanged = true;
            }

            if (copy.status === 'Approved' || copy.status === 'Settled' || copy.status === 'Paid') {
                const appr = copy.approvedAmount !== undefined ? Number(copy.approvedAmount) : req;
                if (copy.approvedAmount === undefined) {
                    copy.approvedAmount = appr;
                    itemChanged = true;
                }
                if (copy.rejectedAmount === undefined) {
                    copy.rejectedAmount = Math.max(0, req - appr);
                    itemChanged = true;
                }
                if (appr < req && appr > 0 && copy.status === 'Approved') {
                    copy.status = 'Partially Approved';
                    itemChanged = true;
                }
            } else if (copy.status === 'Partially Approved') {
                const appr = copy.approvedAmount !== undefined ? Number(copy.approvedAmount) : Math.round(req / 2);
                if (copy.approvedAmount === undefined) {
                    copy.approvedAmount = appr;
                    itemChanged = true;
                }
                if (copy.rejectedAmount === undefined) {
                    copy.rejectedAmount = Math.max(0, req - appr);
                    itemChanged = true;
                }
            } else if (copy.status === 'Rejected') {
                if (copy.approvedAmount === undefined || copy.approvedAmount !== 0) {
                    copy.approvedAmount = 0;
                    itemChanged = true;
                }
                if (copy.rejectedAmount === undefined || copy.rejectedAmount !== req) {
                    copy.rejectedAmount = req;
                    itemChanged = true;
                }
            } else {
                // Pending
                if (copy.approvedAmount === undefined) {
                    copy.approvedAmount = 0;
                    itemChanged = true;
                }
                if (copy.rejectedAmount === undefined) {
                    copy.rejectedAmount = 0;
                    itemChanged = true;
                }
            }

            // Canonical Multi-Stage Lifecycle Fields
            if (!copy.hrStatus) {
                if (copy.status === 'Settled' || copy.status === 'Paid') {
                    copy.hrStatus = copy.approvedAmount < req ? 'Partially Approved' : 'Approved';
                } else if (copy.status === 'Approved' || copy.status === 'Partially Approved' || copy.status === 'Rejected') {
                    copy.hrStatus = copy.status;
                } else {
                    copy.hrStatus = 'Pending';
                }
                itemChanged = true;
            }
            if (copy.hrApprovedAmount === undefined) {
                copy.hrApprovedAmount = Number(copy.approvedAmount || 0);
                itemChanged = true;
            }
            if (copy.hrRejectedAmount === undefined) {
                copy.hrRejectedAmount = Number(copy.rejectedAmount || 0);
                itemChanged = true;
            }
            if (!copy.hrReviewer && copy.approvedBy) {
                copy.hrReviewer = copy.approvedBy;
                itemChanged = true;
            }
            if (!copy.hrReviewedOn && copy.reviewedOn) {
                copy.hrReviewedOn = copy.reviewedOn;
                itemChanged = true;
            }
            if (copy.hrRemarks === undefined) {
                copy.hrRemarks = copy.remarks || '';
                itemChanged = true;
            }

            if (!copy.financeStatus) {
                if (copy.status === 'Settled' || copy.status === 'Paid') {
                    copy.financeStatus = 'Approved';
                } else if (copy.hrStatus === 'Approved' || copy.hrStatus === 'Partially Approved') {
                    copy.financeStatus = 'Pending Review';
                } else {
                    copy.financeStatus = 'None';
                }
                itemChanged = true;
            }
            if (copy.financeReviewer === undefined) {
                copy.financeReviewer = (copy.status === 'Settled' || copy.status === 'Paid') ? 'Finance & Accounts' : null;
                itemChanged = true;
            }
            if (copy.financeReviewedOn === undefined) {
                copy.financeReviewedOn = (copy.status === 'Settled' || copy.status === 'Paid') ? (copy.settledOn || copy.reviewedOn) : null;
                itemChanged = true;
            }
            if (copy.financeRemarks === undefined) {
                copy.financeRemarks = (copy.status === 'Settled' || copy.status === 'Paid') ? 'Audited and cleared for disbursement' : null;
                itemChanged = true;
            }

            if (!copy.queryStatus) {
                copy.queryStatus = 'No Query';
                itemChanged = true;
            }
            if (copy.queryId === undefined) copy.queryId = null;
            if (copy.queryRaisedBy === undefined) copy.queryRaisedBy = null;
            if (copy.queryRaisedOn === undefined) copy.queryRaisedOn = null;
            if (copy.queryMessage === undefined) copy.queryMessage = null;
            if (copy.queryResponse === undefined) copy.queryResponse = null;
            if (copy.queryRespondedOn === undefined) copy.queryRespondedOn = null;
            if (copy.queryResolvedOn === undefined) copy.queryResolvedOn = null;

            if (!copy.settlementStatus) {
                if (copy.status === 'Settled' || copy.status === 'Paid') {
                    copy.settlementStatus = 'Settled';
                } else if (copy.hrStatus === 'Approved' || copy.hrStatus === 'Partially Approved') {
                    copy.settlementStatus = 'Pending';
                } else {
                    copy.settlementStatus = 'None';
                }
                itemChanged = true;
            }
            if (copy.settledAmount === undefined) {
                copy.settledAmount = (copy.status === 'Settled' || copy.status === 'Paid') ? Number(copy.approvedAmount || 0) : 0;
                itemChanged = true;
            }
            if (copy.settlementDate === undefined) {
                copy.settlementDate = copy.settledOn || null;
                itemChanged = true;
            }
            if (copy.settledBy === undefined) {
                copy.settledBy = (copy.status === 'Settled' || copy.status === 'Paid') ? 'Finance & Accounts' : null;
                itemChanged = true;
            }
            if (copy.settlementReference === undefined) {
                copy.settlementReference = (copy.status === 'Settled' || copy.status === 'Paid') ? `STL-EXP-${copy.expenseNumber?.slice(-3) || '001'}` : null;
                itemChanged = true;
            }

            // Lifecycle Audit History
            if (!Array.isArray(copy.auditHistory) || copy.auditHistory.length === 0) {
                const history = [
                    {
                        id: `aud-${copy.id}-sub`,
                        stage: 'Submission',
                        action: 'Claim Submitted',
                        actor: copy.employeeName || 'Staff Member',
                        timestamp: copy.submittedOn ? `${copy.submittedOn}T09:00:00Z` : new Date().toISOString(),
                        details: `Expense claim for ₹${req.toLocaleString('en-IN')} submitted under ${copy.category} (${copy.project}).`
                    }
                ];
                if (copy.hrStatus === 'Approved' || copy.hrStatus === 'Partially Approved' || copy.hrStatus === 'Rejected') {
                    history.push({
                        id: `aud-${copy.id}-hr`,
                        stage: 'HR Verification',
                        action: `HR ${copy.hrStatus}`,
                        actor: copy.hrReviewer || copy.approvedBy || 'HR Reviewer',
                        timestamp: copy.hrReviewedOn ? `${copy.hrReviewedOn}T14:30:00Z` : new Date().toISOString(),
                        remarks: copy.hrRemarks || copy.remarks || '',
                        details: `HR approved ₹${Number(copy.hrApprovedAmount || 0).toLocaleString('en-IN')}, rejected ₹${Number(copy.hrRejectedAmount || 0).toLocaleString('en-IN')}.`
                    });
                }
                if (copy.financeStatus === 'Approved') {
                    history.push({
                        id: `aud-${copy.id}-fin`,
                        stage: 'Finance Review',
                        action: 'Finance Approved',
                        actor: copy.financeReviewer || 'Finance & Accounts',
                        timestamp: copy.financeReviewedOn ? `${copy.financeReviewedOn}T16:00:00Z` : new Date().toISOString(),
                        remarks: copy.financeRemarks || '',
                        details: `Finance verified approved amount ₹${Number(copy.hrApprovedAmount || 0).toLocaleString('en-IN')}.`
                    });
                }
                if (copy.settlementStatus === 'Settled') {
                    history.push({
                        id: `aud-${copy.id}-stl`,
                        stage: 'Settlement',
                        action: 'Claim Settled',
                        actor: copy.settledBy || 'Finance & Accounts',
                        timestamp: copy.settlementDate ? `${copy.settlementDate}T17:00:00Z` : new Date().toISOString(),
                        details: `Settled and disbursed ₹${Number(copy.settledAmount || 0).toLocaleString('en-IN')} via ${copy.settlementReference || 'Bank Transfer'}.`
                    });
                }
                copy.auditHistory = history;
                itemChanged = true;
            }

            if (itemChanged) changed = true;
            return copy;
        });

        if (changed) {
            setItem(STORAGE_KEYS.EXPENSES, normalized);
        }
        return normalized;
    },
    setExpenses: (val) => setItem(STORAGE_KEYS.EXPENSES, val),
    getReimbursements: () => {
        const list = getItem(STORAGE_KEYS.REIMBURSEMENTS, INITIAL_REIMBURSEMENTS);
        let changed = false;

        const getProjectFallback = (empId) => {
            if (empId === 'BGS-001' || empId === 'BGS-002' || empId === 'BGS-004' || empId === 'BGS-010') {
                return 'Corporate Operations & Governance';
            }
            if (empId === 'BGS-003' || empId === 'BGS-006' || empId === 'BGS-062') {
                return 'Bhilwara Lead-Zinc Core Drilling';
            }
            if (empId === 'BGS-005' || empId === 'BGS-007') {
                return 'Jaipur Ring Road Drone Photogrammetry';
            }
            if (empId === 'BGS-008') {
                return 'Udaipur Rock Phosphate Assessment';
            }
            if (empId === 'BGS-009') {
                return 'Khetri Copper Belt Reconnaissance';
            }
            return 'Corporate Operations & Governance';
        };

        const normalized = list.map((item) => {
            const copy = { ...item };
            let itemChanged = false;
            const claim = copy.claimAmount !== undefined ? Number(copy.claimAmount) : 0;

            if (copy.status === 'Approved' || copy.status === 'Settled') {
                const appr = copy.approvedAmount !== undefined ? Number(copy.approvedAmount) : claim;
                if (copy.approvedAmount === undefined) {
                    copy.approvedAmount = appr;
                    itemChanged = true;
                }
                if (copy.rejectedAmount === undefined) {
                    copy.rejectedAmount = Math.max(0, claim - appr);
                    itemChanged = true;
                }
                if (appr < claim && appr > 0 && copy.status === 'Approved') {
                    copy.status = 'Partially Approved';
                    itemChanged = true;
                }
            } else if (copy.status === 'Partially Approved') {
                const appr = copy.approvedAmount !== undefined ? Number(copy.approvedAmount) : Math.round(claim / 2);
                if (copy.approvedAmount === undefined) {
                    copy.approvedAmount = appr;
                    itemChanged = true;
                }
                if (copy.rejectedAmount === undefined) {
                    copy.rejectedAmount = Math.max(0, claim - appr);
                    itemChanged = true;
                }
            } else if (copy.status === 'Rejected') {
                if (copy.approvedAmount === undefined || copy.approvedAmount !== 0) {
                    copy.approvedAmount = 0;
                    itemChanged = true;
                }
                if (copy.rejectedAmount === undefined || copy.rejectedAmount !== claim) {
                    copy.rejectedAmount = claim;
                    itemChanged = true;
                }
            } else {
                // Pending
                if (copy.approvedAmount === undefined) {
                    copy.approvedAmount = 0;
                    itemChanged = true;
                }
                if (copy.rejectedAmount === undefined) {
                    copy.rejectedAmount = 0;
                    itemChanged = true;
                }
            }

            // Ensure Project Traceability for Reimbursements
            if (!copy.project) {
                copy.project = getProjectFallback(copy.employeeId);
                itemChanged = true;
            }

            // Canonical Multi-Stage Lifecycle Fields
            if (!copy.hrStatus) {
                if (copy.status === 'Settled' || copy.status === 'Paid') {
                    copy.hrStatus = copy.approvedAmount < claim ? 'Partially Approved' : 'Approved';
                } else if (copy.status === 'Approved' || copy.status === 'Partially Approved' || copy.status === 'Rejected') {
                    copy.hrStatus = copy.status;
                } else {
                    copy.hrStatus = 'Pending';
                }
                itemChanged = true;
            }
            if (copy.hrApprovedAmount === undefined) {
                copy.hrApprovedAmount = Number(copy.approvedAmount || 0);
                itemChanged = true;
            }
            if (copy.hrRejectedAmount === undefined) {
                copy.hrRejectedAmount = Number(copy.rejectedAmount || 0);
                itemChanged = true;
            }
            if (!copy.hrReviewer && copy.approvedBy) {
                copy.hrReviewer = copy.approvedBy;
                itemChanged = true;
            }
            if (!copy.hrReviewedOn && copy.reviewedOn) {
                copy.hrReviewedOn = copy.reviewedOn;
                itemChanged = true;
            }
            if (copy.hrRemarks === undefined) {
                copy.hrRemarks = copy.reviewRemarks || copy.remarks || '';
                itemChanged = true;
            }

            if (!copy.financeStatus) {
                if (copy.status === 'Settled' || copy.status === 'Paid') {
                    copy.financeStatus = 'Approved';
                } else if (copy.hrStatus === 'Approved' || copy.hrStatus === 'Partially Approved') {
                    copy.financeStatus = 'Pending Review';
                } else {
                    copy.financeStatus = 'None';
                }
                itemChanged = true;
            }
            if (copy.financeReviewer === undefined) {
                copy.financeReviewer = (copy.status === 'Settled' || copy.status === 'Paid') ? 'Finance & Accounts' : null;
                itemChanged = true;
            }
            if (copy.financeReviewedOn === undefined) {
                copy.financeReviewedOn = (copy.status === 'Settled' || copy.status === 'Paid') ? (copy.settlementDate || copy.reviewedOn) : null;
                itemChanged = true;
            }
            if (copy.financeRemarks === undefined) {
                copy.financeRemarks = (copy.status === 'Settled' || copy.status === 'Paid') ? 'Audited and cleared for disbursement' : null;
                itemChanged = true;
            }

            if (!copy.queryStatus) {
                copy.queryStatus = 'No Query';
                itemChanged = true;
            }
            if (copy.queryId === undefined) copy.queryId = null;
            if (copy.queryRaisedBy === undefined) copy.queryRaisedBy = null;
            if (copy.queryRaisedOn === undefined) copy.queryRaisedOn = null;
            if (copy.queryMessage === undefined) copy.queryMessage = null;
            if (copy.queryResponse === undefined) copy.queryResponse = null;
            if (copy.queryRespondedOn === undefined) copy.queryRespondedOn = null;
            if (copy.queryResolvedOn === undefined) copy.queryResolvedOn = null;

            if (!copy.settlementStatus) {
                if (copy.status === 'Settled' || copy.status === 'Paid') {
                    copy.settlementStatus = 'Settled';
                } else if (copy.hrStatus === 'Approved' || copy.hrStatus === 'Partially Approved') {
                    copy.settlementStatus = 'Pending';
                } else {
                    copy.settlementStatus = 'None';
                }
                itemChanged = true;
            }
            if (copy.settledAmount === undefined) {
                copy.settledAmount = (copy.status === 'Settled' || copy.status === 'Paid') ? Number(copy.approvedAmount || 0) : 0;
                itemChanged = true;
            }
            if (copy.settlementDate === undefined) {
                copy.settlementDate = copy.disbursementDate || null;
                itemChanged = true;
            }
            if (copy.settledBy === undefined) {
                copy.settledBy = (copy.status === 'Settled' || copy.status === 'Paid') ? 'Finance & Accounts' : null;
                itemChanged = true;
            }
            if (copy.settlementReference === undefined) {
                copy.settlementReference = (copy.status === 'Settled' || copy.status === 'Paid') ? `STL-RMB-${copy.claimId?.slice(-3) || '001'}` : null;
                itemChanged = true;
            }

            // Lifecycle Audit History
            if (!Array.isArray(copy.auditHistory) || copy.auditHistory.length === 0) {
                const history = [
                    {
                        id: `aud-${copy.id}-sub`,
                        stage: 'Submission',
                        action: 'Claim Submitted',
                        actor: copy.employeeName || 'Staff Member',
                        timestamp: copy.submittedOn ? `${copy.submittedOn}T09:00:00Z` : new Date().toISOString(),
                        details: `Allowance claim for ₹${claim.toLocaleString('en-IN')} submitted under ${copy.category} (${copy.project}).`
                    }
                ];
                if (copy.hrStatus === 'Approved' || copy.hrStatus === 'Partially Approved' || copy.hrStatus === 'Rejected') {
                    history.push({
                        id: `aud-${copy.id}-hr`,
                        stage: 'HR Verification',
                        action: `HR ${copy.hrStatus}`,
                        actor: copy.hrReviewer || copy.approvedBy || 'HR Reviewer',
                        timestamp: copy.hrReviewedOn ? `${copy.hrReviewedOn}T14:30:00Z` : new Date().toISOString(),
                        remarks: copy.hrRemarks || copy.reviewRemarks || '',
                        details: `HR approved ₹${Number(copy.hrApprovedAmount || 0).toLocaleString('en-IN')}, rejected ₹${Number(copy.hrRejectedAmount || 0).toLocaleString('en-IN')}.`
                    });
                }
                if (copy.financeStatus === 'Approved') {
                    history.push({
                        id: `aud-${copy.id}-fin`,
                        stage: 'Finance Review',
                        action: 'Finance Approved',
                        actor: copy.financeReviewer || 'Finance & Accounts',
                        timestamp: copy.financeReviewedOn ? `${copy.financeReviewedOn}T16:00:00Z` : new Date().toISOString(),
                        remarks: copy.financeRemarks || '',
                        details: `Finance verified approved amount ₹${Number(copy.hrApprovedAmount || 0).toLocaleString('en-IN')}.`
                    });
                }
                if (copy.settlementStatus === 'Settled') {
                    history.push({
                        id: `aud-${copy.id}-stl`,
                        stage: 'Settlement',
                        action: 'Claim Settled',
                        actor: copy.settledBy || 'Finance & Accounts',
                        timestamp: copy.settlementDate ? `${copy.settlementDate}T17:00:00Z` : new Date().toISOString(),
                        details: `Settled and disbursed ₹${Number(copy.settledAmount || 0).toLocaleString('en-IN')} via ${copy.settlementReference || 'Bank Transfer'}.`
                    });
                }
                copy.auditHistory = history;
                itemChanged = true;
            }

            if (itemChanged) changed = true;
            return copy;
        });

        if (changed) {
            setItem(STORAGE_KEYS.REIMBURSEMENTS, normalized);
        }
        return normalized;
    },
    setReimbursements: (val) => setItem(STORAGE_KEYS.REIMBURSEMENTS, val),
    getNotifications: () => getItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS),
    setNotifications: (val) => setItem(STORAGE_KEYS.NOTIFICATIONS, val),
    getCompanySettings: () => getItem(STORAGE_KEYS.COMPANY_SETTINGS, INITIAL_COMPANY_SETTINGS),
    setCompanySettings: (val) => setItem(STORAGE_KEYS.COMPANY_SETTINGS, val),
    getAttendanceSettings: () => getItem(STORAGE_KEYS.ATTENDANCE_SETTINGS, INITIAL_ATTENDANCE_SETTINGS),
    setAttendanceSettings: (val) => setItem(STORAGE_KEYS.ATTENDANCE_SETTINGS, val),
    getPayrollSettings: () => getItem(STORAGE_KEYS.PAYROLL_SETTINGS, INITIAL_PAYROLL_SETTINGS),
    setPayrollSettings: (val) => setItem(STORAGE_KEYS.PAYROLL_SETTINGS, val),
    getRoles: () => getItem(STORAGE_KEYS.ROLES, INITIAL_ROLES),
    setRoles: (val) => setItem(STORAGE_KEYS.ROLES, val),
    getActiveUser: () => getItem(STORAGE_KEYS.ACTIVE_USER, {
        id: 'emp-004',
        name: 'Kritika Gupta',
        email: 'kritika.gupta@bansalgeo.com',
        role: 'hr',
        employeeId: 'BGS-004',
        department: 'Human Resources & Admin',
        designation: 'Head - HR & Administration',
    }),
    setActiveUser: (val) => setItem(STORAGE_KEYS.ACTIVE_USER, val),
    // Only the HRMS's own saved data: the CRM keeps its demo data in the same browser.
    resetAll: () => {
        Object.keys(localStorage).filter((k) => k.startsWith('bgspl_') || k.startsWith('hrms_')).forEach((k) => localStorage.removeItem(k));
        window.location.reload();
    }
};
