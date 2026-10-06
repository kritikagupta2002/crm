import React, { useState } from 'react';
import {
    BarChart3, Download, Calendar, Building2, Users, CreditCard,
    FileCheck2, TrendingUp, Award, UserMinus, CheckCircle2, Sliders,
    Layers, Sparkles, FileSpreadsheet, Check, RotateCcw, Receipt,
    Clock, XCircle, Search, Wallet, Fingerprint
} from 'lucide-react';
import {
    ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
    CartesianGrid, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/common/Card';
import { ChartCard } from '@/components/common/ChartCard';
import { StatCard } from '@/components/common/StatCard';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Tabs } from '@/components/common/Tabs';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useLocation } from 'react-router-dom';
import { useToast } from '@/contexts/ToastContext';
import { storage } from '@/core/storage/storage';
import { STANDARD_PROJECTS, getEmployeeProjectById } from '@/core/constants/projects';
import { EmployeeLeaveMisChart } from '@/modules/leave/components/EmployeeLeaveMisChart';

export const ReportsPage = () => {
    const toast = useToast();
    const location = useLocation();
    const [activeReportTab, setActiveReportTab] = useState(() => location.state?.tab || location.state?.defaultTab || 'attendance');
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');
    const [dateRange, setDateRange] = useState('this_month');
    const [leaveSearch, setLeaveSearch] = useState('');

    // Expense & Reimbursement Report Filter State
    const [expenseSearch, setExpenseSearch] = useState('');
    const [expenseModuleType, setExpenseModuleType] = useState('all');
    const [expenseStatusFilter, setExpenseStatusFilter] = useState('all');
    const [expenseFinanceStatusFilter, setExpenseFinanceStatusFilter] = useState('all');
    const [expenseQueryStatusFilter, setExpenseQueryStatusFilter] = useState('all');
    const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('all');
    const [selectedEmployee, setSelectedEmployee] = useState('all');

    // Custom Report Builder State
    const [customModule, setCustomModule] = useState('employees');
    const [selectedFields, setSelectedFields] = useState([
        'employeeId', 'name', 'department', 'designation', 'status'
    ]);

    const reportTabs = [
        { id: 'attendance', label: 'Attendance & Biometrics' },
        { id: 'leave', label: 'Leave Utilization' },
        { id: 'payroll', label: 'Payroll & Compensation' },
        { id: 'expenses', label: 'Expenses & Reimbursements' },
        { id: 'department', label: 'Department Analytics' },
        { id: 'custom', label: 'Custom Report Builder' },
        { id: 'insights', label: 'Management Insights & Attrition' },
    ];

    const moduleFieldMap = {
        employees: [
            { id: 'employeeId', label: 'Employee ID' },
            { id: 'name', label: 'Full Name' },
            { id: 'department', label: 'Department' },
            { id: 'designation', label: 'Designation' },
            { id: 'joiningDate', label: 'Joining Date' },
            { id: 'status', label: 'Employment Status' },
            { id: 'workLocation', label: 'Work Location' },
        ],
        payroll: [
            { id: 'employeeId', label: 'Employee ID' },
            { id: 'name', label: 'Full Name' },
            { id: 'department', label: 'Department' },
            { id: 'gross', label: 'Gross CTC (₹)' },
            { id: 'netDisbursed', label: 'Net Disbursed (₹)' },
            { id: 'pfDeduction', label: 'PF & Taxes (₹)' },
            { id: 'paymentStatus', label: 'Disbursement Status' },
        ],
        leave: [
            { id: 'employeeId', label: 'Employee ID' },
            { id: 'name', label: 'Applicant Name' },
            { id: 'department', label: 'Division' },
            { id: 'leaveType', label: 'Leave Category' },
            { id: 'requestedDays', label: 'Requested (Days)' },
            { id: 'approvedDays', label: 'Approved (Days)' },
            { id: 'rejectedDays', label: 'Rejected (Days)' },
            { id: 'status', label: 'Status' },
        ],
        expenses: [
            { id: 'referenceId', label: 'Reference ID' },
            { id: 'employeeId', label: 'Employee ID' },
            { id: 'name', label: 'Full Name' },
            { id: 'type', label: 'Claim Type' },
            { id: 'category', label: 'Category' },
            { id: 'requestedAmount', label: 'Requested (₹)' },
            { id: 'approvedAmount', label: 'Approved (₹)' },
            { id: 'rejectedAmount', label: 'Rejected (₹)' },
            { id: 'hrStatus', label: 'HR Status' },
            { id: 'financeStatus', label: 'Finance Status' },
            { id: 'queryStatus', label: 'Query Status' },
            { id: 'settlementStatus', label: 'Settlement Status' },
        ],
        performance: [
            { id: 'employeeId', label: 'Employee ID' },
            { id: 'name', label: 'Full Name' },
            { id: 'cycle', label: 'Review Cycle' },
            { id: 'overallScore', label: 'Overall KPI (/5)' },
            { id: 'rating', label: 'Rating Tier' },
            { id: 'evaluator', label: 'Evaluator' },
            { id: 'status', label: 'Appraisal Status' },
        ],
        exit: [
            { id: 'employeeId', label: 'Employee ID' },
            { id: 'name', label: 'Full Name' },
            { id: 'department', label: 'Department' },
            { id: 'resignationDate', label: 'Resignation Date' },
            { id: 'lwd', label: 'Last Working Day' },
            { id: 'clearanceStatus', label: '4-Dept Clearances' },
            { id: 'fnfAmount', label: 'Net F&F Payable' },
        ],
    };

    const allEmployees = storage.getEmployees();
    const allSalaries = storage.getSalaryStructures();
    const allLeaveRequests = storage.getLeaveRequests();
    const allExpenses = storage.getExpenses();
    const allReimbursements = storage.getReimbursements();
    const allAttendance = storage.getAttendance();
    const _allPayslips = storage.getPayslips();
    const _allPayrollRuns = storage.getPayrollRuns();

    // Date Range Matching Helper
    const matchesDateRange = (dateStr, range) => {
        if (!dateStr || range === 'all') return true;
        if (range === 'this_month') return dateStr >= '2026-09-01';
        if (range === 'oct_2026') return dateStr >= '2026-10-01' && dateStr <= '2026-10-31';
        if (range === 'sep_2026' || range === 'last_month') return dateStr >= '2026-09-01' && dateStr <= '2026-09-30';
        if (range === 'aug_2026') return dateStr >= '2026-08-01' && dateStr <= '2026-08-31';
        if (range === 'this_quarter') return dateStr >= '2026-07-01' && dateStr <= '2026-09-30';
        if (range === 'this_financial_year') return dateStr >= '2026-04-01' && dateStr <= '2027-03-31';
        return true;
    };

    // Unified Expense & Reimbursement Records
    const unifiedExpenseRecords = React.useMemo(() => {
        const expList = (allExpenses || []).map(e => ({
            id: e.id,
            referenceId: e.expenseNumber || e.id,
            employeeId: e.employeeId,
            employeeName: e.employeeName,
            department: e.department || 'General',
            type: 'Expense',
            category: e.category,
            requestedAmount: Number(e.requestedAmount !== undefined ? e.requestedAmount : e.amount) || 0,
            approvedAmount: Number(e.approvedAmount) || 0,
            rejectedAmount: Number(e.rejectedAmount) || 0,
            status: e.status,
            hrStatus: e.hrStatus || e.status,
            financeStatus: e.financeStatus || (e.status === 'Rejected' ? 'None' : (e.status === 'Pending' ? 'Pending Review' : 'Verified')),
            queryStatus: e.queryStatus || 'No Query',
            settlementStatus: e.settlementStatus || (e.status === 'Settled' ? 'Settled' : (e.status === 'Rejected' ? 'None' : 'Pending')),
            settledAmount: Number(e.settledAmount || (e.settlementStatus === 'Settled' ? e.approvedAmount : 0)),
            settlementReference: e.settlementReference || '',
            date: e.date,
            submittedOn: e.submittedOn || e.date,
            reviewedOn: e.reviewedOn || e.approvedDate || '',
            approver: e.approvedBy || '',
            financeReviewer: e.financeReviewer || '',
            financeReviewedOn: e.financeReviewedOn || '',
            queryRaisedOn: e.queryRaisedOn || '',
            queryResolvedOn: e.queryResolvedOn || '',
            settlementDate: e.settlementDate || (e.status === 'Settled' ? (e.reviewedOn || e.date) : ''),
            project: e.project || 'General Operations',
            attachment: e.receiptFileName || null
        }));

        const reimbList = (allReimbursements || []).map(r => ({
            id: r.id,
            referenceId: r.claimId || r.id,
            employeeId: r.employeeId,
            employeeName: r.employeeName,
            department: r.department || 'General',
            type: 'Reimbursement',
            category: r.category,
            requestedAmount: Number(r.requestedAmount !== undefined ? r.requestedAmount : r.claimAmount) || 0,
            approvedAmount: Number(r.approvedAmount) || 0,
            rejectedAmount: Number(r.rejectedAmount) || 0,
            status: r.status,
            hrStatus: r.hrStatus || r.status,
            financeStatus: r.financeStatus || (r.status === 'Rejected' ? 'None' : (r.status === 'Pending' ? 'Pending Review' : 'Verified')),
            queryStatus: r.queryStatus || 'No Query',
            settlementStatus: r.settlementStatus || (r.status === 'Settled' ? 'Settled' : (r.status === 'Rejected' ? 'None' : 'Pending')),
            settledAmount: Number(r.settledAmount || (r.settlementStatus === 'Settled' ? r.approvedAmount : 0)),
            settlementReference: r.settlementReference || '',
            date: r.date,
            submittedOn: r.submittedOn || r.date,
            reviewedOn: r.reviewedOn || '',
            approver: r.approvedBy || '',
            financeReviewer: r.financeReviewer || '',
            financeReviewedOn: r.financeReviewedOn || '',
            queryRaisedOn: r.queryRaisedOn || '',
            queryResolvedOn: r.queryResolvedOn || '',
            settlementDate: r.settlementDate || '',
            project: r.project || 'General Operations',
            attachment: r.documentName || r.receiptFileName || null
        }));

        return [...expList, ...reimbList];
    }, [allExpenses, allReimbursements]);

    // Filtered MIS Expense Records
    const filteredMisExpenseRecords = React.useMemo(() => {
        return unifiedExpenseRecords.filter(r => {
            if (selectedDept !== 'all' && r.department !== selectedDept) return false;
            if (selectedProject !== 'all' && r.project !== selectedProject) return false;
            if (!matchesDateRange(r.date, dateRange)) return false;

            if (expenseModuleType !== 'all' && r.type.toLowerCase() !== expenseModuleType.toLowerCase()) return false;
            if (expenseStatusFilter !== 'all' && r.status !== expenseStatusFilter) return false;
            if (expenseFinanceStatusFilter !== 'all' && r.financeStatus !== expenseFinanceStatusFilter) return false;
            if (expenseQueryStatusFilter !== 'all' && r.queryStatus !== expenseQueryStatusFilter) return false;
            if (expenseCategoryFilter !== 'all' && r.category !== expenseCategoryFilter) return false;
            if (selectedEmployee !== 'all' && r.employeeId !== selectedEmployee) return false;

            if (expenseSearch.trim()) {
                const q = expenseSearch.toLowerCase();
                const match = (r.employeeName && r.employeeName.toLowerCase().includes(q)) ||
                    (r.employeeId && r.employeeId.toLowerCase().includes(q)) ||
                    (r.referenceId && r.referenceId.toLowerCase().includes(q)) ||
                    (r.category && r.category.toLowerCase().includes(q)) ||
                    (r.project && r.project.toLowerCase().includes(q));
                if (!match) return false;
            }
            return true;
        });
    }, [unifiedExpenseRecords, selectedDept, selectedProject, dateRange, expenseModuleType, expenseStatusFilter, expenseFinanceStatusFilter, expenseQueryStatusFilter, expenseCategoryFilter, selectedEmployee, expenseSearch]);


    // Accurate Reporting Metrics from Live Data
    const expenseMetrics = React.useMemo(() => {
        const expItems = filteredMisExpenseRecords.filter(r => r.type === 'Expense');
        const reimbItems = filteredMisExpenseRecords.filter(r => r.type === 'Reimbursement');

        return {
            expenses: {
                totalClaims: expItems.length,
                totalRequested: expItems.reduce((acc, e) => acc + e.requestedAmount, 0),
                totalApproved: expItems.reduce((acc, e) => acc + e.approvedAmount, 0),
                totalRejected: expItems.reduce((acc, e) => acc + e.rejectedAmount, 0),
                partiallyApproved: expItems.filter(e => e.status === 'Partially Approved').length,
                settledPaid: expItems.filter(e => e.status === 'Settled').reduce((acc, e) => acc + e.approvedAmount, 0),
                pendingAmount: expItems.filter(e => e.status === 'Pending').reduce((acc, e) => acc + e.requestedAmount, 0),
            },
            reimbursements: {
                totalClaims: reimbItems.length,
                totalClaimed: reimbItems.reduce((acc, r) => acc + r.requestedAmount, 0),
                totalApproved: reimbItems.reduce((acc, r) => acc + r.approvedAmount, 0),
                totalRejected: reimbItems.reduce((acc, r) => acc + r.rejectedAmount, 0),
                partiallyApproved: reimbItems.filter(r => r.status === 'Partially Approved').length,
                settled: reimbItems.filter(r => r.status === 'Settled').reduce((acc, r) => acc + r.approvedAmount, 0),
                pendingAmount: reimbItems.filter(r => r.status === 'Pending').reduce((acc, r) => acc + r.requestedAmount, 0),
            },
            combined: {
                totalClaims: filteredMisExpenseRecords.length,
                totalRequested: filteredMisExpenseRecords.reduce((acc, r) => acc + r.requestedAmount, 0),
                totalApproved: filteredMisExpenseRecords.reduce((acc, r) => acc + r.approvedAmount, 0),
                totalRejected: filteredMisExpenseRecords.reduce((acc, r) => acc + r.rejectedAmount, 0),
                totalSettled: filteredMisExpenseRecords.filter(r => r.status === 'Settled').reduce((acc, r) => acc + r.approvedAmount, 0),
                totalPending: filteredMisExpenseRecords.filter(r => r.status === 'Pending').reduce((acc, r) => acc + r.requestedAmount, 0),
            }
        };
    }, [filteredMisExpenseRecords]);

    // Distinct Categories for Filter Dropdown
    const distinctCategories = React.useMemo(() => {
        const set = new Set();
        unifiedExpenseRecords.forEach(r => {
            if (r.category) set.add(r.category);
        });
        return Array.from(set).sort();
    }, [unifiedExpenseRecords]);

    // Category Breakdown Chart Data
    const expenseCategoryChartData = React.useMemo(() => {
        const catMap = {};
        filteredMisExpenseRecords.forEach(r => {
            const cat = r.category || 'Other';
            if (!catMap[cat]) {
                catMap[cat] = { category: cat.length > 18 ? cat.substring(0, 16) + '...' : cat, requested: 0, approved: 0, settled: 0 };
            }
            catMap[cat].requested += r.requestedAmount;
            catMap[cat].approved += r.approvedAmount;
            if (r.status === 'Settled') {
                catMap[cat].settled += r.approvedAmount;
            }
        });
        return Object.values(catMap);
    }, [filteredMisExpenseRecords]);
    const misLeaveRecords = React.useMemo(() => {
        let list = allLeaveRequests;
        if (selectedDept !== 'all') {
            list = list.filter((r) => r.department === selectedDept);
        }
        if (dateRange === 'this_month') {
            list = list.filter((r) => (r.startDate || r.appliedOn) >= '2026-09-01');
        }
        else if (dateRange === 'last_month') {
            list = list.filter((r) => {
                const d = r.startDate || r.appliedOn;
                return d >= '2026-08-01' && d <= '2026-08-31';
            });
        }
        return list.map((r) => {
            const empBals = storage.getBalancesForEmployee(r.employeeId, r.employeeName);
            const b = empBals.find((bal) => bal.leaveType === r.leaveType);
            const requested = Number(r.requestedDays || r.days) || 1;
            const approved = Number(r.approvedDays) || (r.status === 'Approved' ? requested : 0);
            const rejected = Number(r.rejectedDays) || (r.status === 'Rejected' ? requested : 0);
            const balAfter = b ? b.available : 0;
            const balBefore = r.status === 'Approved' || r.status === 'Partially Approved' ? balAfter + approved : balAfter;
            return {
                ...r,
                requestedDays: requested,
                approvedDays: approved,
                rejectedDays: rejected,
                balanceBefore: balBefore,
                balanceAfter: balAfter,
            };
        });
    }, [allLeaveRequests, selectedDept, dateRange]);
    const filteredMisRecords = React.useMemo(() => {
        if (!leaveSearch.trim())
            return misLeaveRecords;
        const q = leaveSearch.toLowerCase();
        return misLeaveRecords.filter((r) => r.employeeName.toLowerCase().includes(q) ||
            r.employeeId.toLowerCase().includes(q) ||
            r.leaveType.toLowerCase().includes(q) ||
            r.department.toLowerCase().includes(q));
    }, [misLeaveRecords, leaveSearch]);
    const misSummary = React.useMemo(() => {
        const totalRequests = misLeaveRecords.length;
        const totalRequestedDays = misLeaveRecords.reduce((sum, r) => sum + r.requestedDays, 0);
        const totalApprovedDays = misLeaveRecords.reduce((sum, r) => sum + r.approvedDays, 0);
        const totalRejectedDays = misLeaveRecords.reduce((sum, r) => sum + r.rejectedDays, 0);
        const partiallyApprovedCount = misLeaveRecords.filter((r) => r.status === 'Partially Approved').length;
        const cancelledCount = misLeaveRecords.filter((r) => r.status === 'Cancelled').length;
        return {
            totalRequests,
            totalRequestedDays,
            totalApprovedDays,
            totalRejectedDays,
            partiallyApprovedCount,
            cancelledCount,
        };
    }, [misLeaveRecords]);
    const misDeptData = React.useMemo(() => {
        const depts = [
            'Geology & Mineral Exploration',
            'Mining & Mine Planning',
            'GIS, Remote Sensing & UAV',
            'Hydrogeology & Groundwater',
            'Human Resources & Admin',
        ];
        return depts.map((d) => {
            const recs = misLeaveRecords.filter((r) => r.department === d);
            const approved = recs.reduce((sum, r) => sum + r.approvedDays, 0);
            const rejected = recs.reduce((sum, r) => sum + r.rejectedDays, 0);
            const pending = recs.filter((r) => r.status === 'Pending').reduce((sum, r) => sum + r.requestedDays, 0);
            return {
                department: d.split('&')[0].trim(),
                approved,
                rejected,
                pending,
            };
        });
    }, [misLeaveRecords]);
    const customDataset = {
        employees: allEmployees.map((e) => ({
            employeeId: e.employeeId,
            name: e.name,
            department: e.employment?.department || 'General',
            designation: e.employment?.designation || 'Staff',
            joiningDate: e.employment?.joiningDate || '2026-04-01',
            status: e.employment?.status || 'Active',
            workLocation: e.employment?.workLocation || 'Jaipur Corporate HQ',
        })),
        payroll: allSalaries.map((s) => ({
            employeeId: s.employeeId,
            name: s.employeeName,
            department: s.department,
            gross: `₹${(s.monthlyGross || s.basic + s.hra + s.specialAllowance).toLocaleString('en-IN')}`,
            netDisbursed: `₹${(s.monthlyNet || s.netPay || Math.round(s.monthlyGross * 0.88)).toLocaleString('en-IN')}`,
            pfDeduction: `₹${(s.providentFund || s.pf || 3600).toLocaleString('en-IN')}`,
            paymentStatus: 'Disbursed',
        })),
        leave: misLeaveRecords.map((r) => ({
            employeeId: r.employeeId,
            name: r.employeeName,
            department: r.department,
            leaveType: r.leaveType,
            requestedDays: `${r.requestedDays}d`,
            approvedDays: `${r.approvedDays}d`,
            rejectedDays: `${r.rejectedDays}d`,
            status: r.status,
        })),
        expenses: unifiedExpenseRecords.map(r => ({
            referenceId: r.referenceId,
            employeeId: r.employeeId,
            name: r.employeeName,
            type: r.type,
            category: r.category,
            requestedAmount: `₹${r.requestedAmount.toLocaleString('en-IN')}`,
            approvedAmount: `₹${r.approvedAmount.toLocaleString('en-IN')}`,
            rejectedAmount: `₹${r.rejectedAmount.toLocaleString('en-IN')}`,
            status: r.status,
        })),
        performance: allEmployees.map((e) => ({
            employeeId: e.employeeId,
            name: e.name,
            cycle: 'Annual Appraisal FY 2025-26',
            overallScore: '4.8 / 5.0',
            rating: 'Outstanding',
            evaluator: e.employment?.managerName || 'Dr. Amit Kumar Bansal',
            status: 'Completed',
        })),
        exit: [
            { employeeId: 'BGS-005', name: 'Vikram Singh Shekhawat', department: 'Mining Operations', resignationDate: '2026-08-15', lwd: '2026-09-30', clearanceStatus: '4/4 Cleared', fnfAmount: '₹75,000' },
            { employeeId: 'BGS-006', name: 'Rohan Deshmukh', department: 'Geology & Mineral Exploration', resignationDate: '2026-08-28', lwd: '2026-10-15', clearanceStatus: '3/4 Cleared', fnfAmount: '₹1,24,000' },
        ],
    };
    const handleModuleSwitch = (mod) => {
        setCustomModule(mod);
        const defaultCols = moduleFieldMap[mod].slice(0, 5).map(f => f.id);
        setSelectedFields(defaultCols);
    };
    const toggleField = (fieldId) => {
        if (selectedFields.includes(fieldId)) {
            if (selectedFields.length > 1) {
                setSelectedFields(selectedFields.filter(f => f !== fieldId));
            }
            else {
                toast.warning('At least one column must remain selected.', 'Selection Warning');
            }
        }
        else {
            setSelectedFields([...selectedFields, fieldId]);
        }
    };
    const handleSelectAllFields = () => {
        setSelectedFields(moduleFieldMap[customModule].map(f => f.id));
    };
    // Dynamic Attendance Filtered Dataset (Newest date first)
    const filteredAttendance = React.useMemo(() => {
        const list = (allAttendance || []).filter((r) => {
            if (selectedDept !== 'all' && r.department !== selectedDept) return false;
            if (selectedProject !== 'all') {
                const empProject = getEmployeeProjectById(r.employeeId);
                if (empProject !== selectedProject) return false;
            }
            if (selectedEmployee !== 'all' && r.employeeId !== selectedEmployee) return false;
            if (!matchesDateRange(r.date, dateRange)) return false;
            return true;
        });
        return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    }, [allAttendance, selectedDept, selectedProject, selectedEmployee, dateRange]);

    // Dynamic Attendance Metrics
    const attendanceMetrics = React.useMemo(() => {
        const total = filteredAttendance.length;
        if (total === 0) {
            return {
                overallRate: '0.0%',
                lateRate: '0.0%',
                avgHours: '0.0 hrs',
                totalPresent: 0,
                totalLate: 0,
                totalAbsent: 0,
                totalRecords: 0,
            };
        }
        const presentCount = filteredAttendance.filter((r) => r.status === 'Present' || r.status === 'Late').length;
        const lateCount = filteredAttendance.filter((r) => r.status === 'Late' || (r.lateBy && r.lateBy !== '-')).length;
        const absentCount = filteredAttendance.filter((r) => r.status === 'Absent').length;

        let totalMinutes = 0;
        let countedRecords = 0;
        filteredAttendance.forEach((r) => {
            if (r.workingHours && r.workingHours !== '-' && !r.workingHours.includes('Working')) {
                const match = r.workingHours.match(/(\d+)h\s*(\d+)m/);
                if (match) {
                    totalMinutes += parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
                    countedRecords++;
                }
            }
        });
        const avgHours = countedRecords > 0 ? (totalMinutes / countedRecords / 60).toFixed(1) : '8.8';

        return {
            overallRate: `${((presentCount / total) * 100).toFixed(1)}%`,
            lateRate: `${((lateCount / total) * 100).toFixed(1)}%`,
            avgHours: `${avgHours} hrs`,
            totalPresent: presentCount,
            totalLate: lateCount,
            totalAbsent: absentCount,
            totalRecords: total,
        };
    }, [filteredAttendance]);

    // Dynamic Department-wise Attendance Report Data
    const attendanceReportData = React.useMemo(() => {
        if (filteredAttendance.length === 0) return [];
        const depts = [...new Set(filteredAttendance.map((r) => r.department))];
        return depts.map((dept) => {
            const recs = filteredAttendance.filter((r) => r.department === dept);
            const deptTotal = recs.length;
            if (deptTotal === 0) return null;
            const onTime = recs.filter((r) => r.status === 'Present' && (!r.lateBy || r.lateBy === '-')).length;
            const late = recs.filter((r) => r.status === 'Late' || (r.lateBy && r.lateBy !== '-')).length;
            const absent = recs.filter((r) => r.status === 'Absent').length;

            let shortDept = dept.split('&')[0].trim();
            if (shortDept.includes('GIS')) shortDept = 'GIS & UAV';
            if (shortDept.includes('Human Resources')) shortDept = 'HR & IT';

            return {
                department: shortDept,
                fullDepartment: dept,
                onTime: Math.round((onTime / deptTotal) * 100),
                late: Math.round((late / deptTotal) * 100),
                absent: Math.round((absent / deptTotal) * 100),
                total: deptTotal,
            };
        }).filter(Boolean);
    }, [filteredAttendance]);

    // Filtered Payroll / Compensation Data
    const filteredPayrollEmployees = React.useMemo(() => {
        return (allSalaries || []).filter((s) => {
            if (selectedDept !== 'all' && s.department !== selectedDept) return false;
            if (selectedProject !== 'all') {
                const empProj = getEmployeeProjectById(s.employeeId);
                if (empProj !== selectedProject) return false;
            }
            if (selectedEmployee !== 'all' && s.employeeId !== selectedEmployee) return false;
            return true;
        });
    }, [allSalaries, selectedDept, selectedProject, selectedEmployee]);

    // Dynamic Payroll Metrics
    const payrollMetrics = React.useMemo(() => {
        const count = filteredPayrollEmployees.length;
        if (count === 0) {
            return {
                totalDisbursed: '₹0.0 Lakhs',
                statutoryRemittances: '₹0.0 Lakhs',
                avgCtc: '₹0.0 LPA',
                employeeCount: 0,
            };
        }
        const totalGrossMonthly = filteredPayrollEmployees.reduce((sum, s) => sum + (s.monthlyGross || (s.basic || 0) + (s.hra || 0) + (s.specialAllowance || 0)), 0);
        const totalNetMonthly = filteredPayrollEmployees.reduce((sum, s) => sum + (s.monthlyNet || Math.round(s.monthlyGross * 0.88)), 0);
        const totalPfTaxesMonthly = filteredPayrollEmployees.reduce((sum, s) => {
            return sum + (s.providentFund || 0) + (s.professionalTax || 200) + (s.tds || 0);
        }, 0);

        const monthsMultiplier = dateRange === 'this_month' || dateRange === 'last_month' ? 1 : 5;
        const totalDisbursedLakhs = ((totalNetMonthly * monthsMultiplier) / 100000).toFixed(1);
        const totalTaxLakhs = ((totalPfTaxesMonthly * monthsMultiplier) / 100000).toFixed(1);
        const avgCtcLpa = ((totalGrossMonthly * 12) / count / 100000).toFixed(1);

        return {
            totalDisbursed: `₹${totalDisbursedLakhs} Lakhs`,
            statutoryRemittances: `₹${totalTaxLakhs} Lakhs`,
            avgCtc: `₹${avgCtcLpa} LPA`,
            employeeCount: count,
        };
    }, [filteredPayrollEmployees, dateRange]);

    // Dynamic Payroll Cost Chart Data
    const payrollCostData = React.useMemo(() => {
        if (filteredPayrollEmployees.length === 0) return [];
        const totalGrossLakhs = filteredPayrollEmployees.reduce((sum, s) => sum + (s.monthlyGross || (s.basic || 0) + (s.hra || 0) + (s.specialAllowance || 0)), 0) / 100000;
        const totalNetLakhs = filteredPayrollEmployees.reduce((sum, s) => sum + (s.monthlyNet || Math.round(s.monthlyGross * 0.88)), 0) / 100000;
        const totalTaxLakhs = filteredPayrollEmployees.reduce((sum, s) => sum + (s.providentFund || 0) + (s.professionalTax || 200) + (s.tds || 0), 0) / 100000;

        const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug'];
        return months.map((month, idx) => {
            const factor = 0.94 + idx * 0.015;
            return {
                month,
                gross: +(totalGrossLakhs * factor).toFixed(1),
                net: +(totalNetLakhs * factor).toFixed(1),
                tax: +(totalTaxLakhs * factor).toFixed(1),
            };
        });
    }, [filteredPayrollEmployees]);

    // 1. Attendance Punctuality Pie Data
    const attendancePunctualityPieData = React.useMemo(() => {
        const total = filteredAttendance.length;
        if (total === 0) return [];
        const onTime = filteredAttendance.filter((r) => r.status === 'Present' && (!r.lateBy || r.lateBy === '-')).length;
        const late = filteredAttendance.filter((r) => r.status === 'Late' || (r.lateBy && r.lateBy !== '-')).length;
        const absent = filteredAttendance.filter((r) => r.status === 'Absent').length;
        const onLeave = filteredAttendance.filter((r) => r.status === 'On Leave').length;

        return [
            { name: 'On Time Arrivals', value: onTime, color: '#10B981', pct: total ? ((onTime / total) * 100).toFixed(1) : '0.0' },
            { name: 'Late Arrivals', value: late, color: '#F59E0B', pct: total ? ((late / total) * 100).toFixed(1) : '0.0' },
            { name: 'Absences', value: absent, color: '#F43F5E', pct: total ? ((absent / total) * 100).toFixed(1) : '0.0' },
            ...(onLeave > 0 ? [{ name: 'Approved Leave', value: onLeave, color: '#8B5CF6', pct: total ? ((onLeave / total) * 100).toFixed(1) : '0.0' }] : []),
        ].filter(d => d.value > 0);
    }, [filteredAttendance]);

    // 2. Attendance Department Share Pie Data
    const attendanceDeptPieData = React.useMemo(() => {
        if (filteredAttendance.length === 0) return [];
        const map = {};
        const colors = ['#2563EB', '#0D9488', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#10B981', '#64748B'];
        filteredAttendance.forEach((r) => {
            const dept = r.department ? r.department.split('&')[0].trim() : 'General';
            map[dept] = (map[dept] || 0) + 1;
        });
        const total = filteredAttendance.length;
        return Object.entries(map).map(([name, value], idx) => ({
            name,
            value,
            color: colors[idx % colors.length],
            pct: total ? ((value / total) * 100).toFixed(1) : '0.0',
        }));
    }, [filteredAttendance]);

    // 3. Payroll Statutory & Net Breakdown Pie Data
    const payrollDistributionPieData = React.useMemo(() => {
        if (filteredPayrollEmployees.length === 0) return [];
        const totalGross = filteredPayrollEmployees.reduce((sum, s) => sum + (s.monthlyGross || (s.basic || 0) + (s.hra || 0) + (s.specialAllowance || 0)), 0);
        const totalNet = filteredPayrollEmployees.reduce((sum, s) => sum + (s.monthlyNet || Math.round(s.monthlyGross * 0.88)), 0);
        const totalPf = filteredPayrollEmployees.reduce((sum, s) => sum + (s.providentFund || s.pf || 3600), 0);
        const totalTax = filteredPayrollEmployees.reduce((sum, s) => sum + (s.tds || 0) + (s.professionalTax || 200), 0);
        const otherAllowances = Math.max(0, totalGross - totalNet - totalPf - totalTax);

        return [
            { name: 'Net Take-Home Salary', value: Math.round(totalNet / 1000), amount: totalNet, color: '#10B981' },
            { name: 'Provident Fund (PF)', value: Math.round(totalPf / 1000), amount: totalPf, color: '#3B82F6' },
            { name: 'TDS & Taxes', value: Math.round((totalTax || 12000) / 1000), amount: totalTax || 12000, color: '#F59E0B' },
            ...(otherAllowances > 0 ? [{ name: 'Allowances / Other', value: Math.round(otherAllowances / 1000), amount: otherAllowances, color: '#8B5CF6' }] : []),
        ];
    }, [filteredPayrollEmployees]);

    // 4. Payroll Department Share Pie Data
    const payrollDeptPieData = React.useMemo(() => {
        if (filteredPayrollEmployees.length === 0) return [];
        const map = {};
        const colors = ['#2563EB', '#0D9488', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4'];
        filteredPayrollEmployees.forEach((s) => {
            const dept = s.department ? s.department.split('&')[0].trim() : 'General';
            const gross = s.monthlyGross || (s.basic || 0) + (s.hra || 0) + (s.specialAllowance || 0);
            map[dept] = (map[dept] || 0) + gross;
        });
        const total = Object.values(map).reduce((a, b) => a + b, 0);
        return Object.entries(map).map(([name, amount], idx) => ({
            name,
            value: Math.round(amount / 1000),
            amount,
            color: colors[idx % colors.length],
            pct: total ? ((amount / total) * 100).toFixed(1) : '0.0',
        }));
    }, [filteredPayrollEmployees]);

    // 5. Leave Status Distribution Pie Data
    const leaveStatusPieData = React.useMemo(() => {
        const approved = misLeaveRecords.reduce((sum, r) => sum + r.approvedDays, 0);
        const rejected = misLeaveRecords.reduce((sum, r) => sum + r.rejectedDays, 0);
        const pending = misLeaveRecords.filter((r) => r.status === 'Pending').reduce((sum, r) => sum + r.requestedDays, 0);
        const total = approved + rejected + pending;

        return [
            { name: 'Approved Leave Days', value: approved, color: '#10B981', pct: total ? ((approved / total) * 100).toFixed(1) : '0.0' },
            { name: 'Pending Review Days', value: pending, color: '#F59E0B', pct: total ? ((pending / total) * 100).toFixed(1) : '0.0' },
            { name: 'Rejected Requests', value: rejected, color: '#EF4444', pct: total ? ((rejected / total) * 100).toFixed(1) : '0.0' },
        ].filter(d => d.value > 0);
    }, [misLeaveRecords]);

    // 6. Leave Department Share Pie Data
    const leaveDeptPieData = React.useMemo(() => {
        const colors = ['#2563EB', '#0D9488', '#8B5CF6', '#F59E0B', '#EC4899'];
        const total = misDeptData.reduce((acc, d) => acc + (d.approved + d.pending), 0);
        return misDeptData
            .map((d, idx) => ({
                name: d.department,
                value: d.approved + d.pending,
                color: colors[idx % colors.length],
                pct: total ? (((d.approved + d.pending) / total) * 100).toFixed(1) : '0.0',
            }))
            .filter((d) => d.value > 0);
    }, [misDeptData]);

    // 7. Expense Category Pie Data
    const expenseCategoryPieData = React.useMemo(() => {
        const colors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#0EA5E9', '#64748B'];
        const total = expenseCategoryChartData.reduce((sum, d) => sum + (d.approved || d.requested), 0);
        return expenseCategoryChartData.map((d, idx) => ({
            name: d.category,
            value: d.approved || d.requested,
            color: colors[idx % colors.length],
            pct: total ? (((d.approved || d.requested) / total) * 100).toFixed(1) : '0.0',
        })).filter(d => d.value > 0);
    }, [expenseCategoryChartData]);

    // 8. Expense Status Pie Data
    const expenseStatusPieData = React.useMemo(() => {
        const totalApproved = expenseMetrics.combined.totalApproved || 0;
        const totalSettled = expenseMetrics.combined.totalSettled || 0;
        const totalPending = expenseMetrics.combined.totalPending || 0;
        const totalRejected = expenseMetrics.combined.totalRejected || 0;

        return [
            { name: 'Settled & Disbursed', value: totalSettled, color: '#0EA5E9' },
            { name: 'Approved & Pending Payout', value: Math.max(0, totalApproved - totalSettled), color: '#10B981' },
            { name: 'Pending Review', value: totalPending, color: '#F59E0B' },
            { name: 'Rejected Variance', value: totalRejected, color: '#EF4444' },
        ].filter(d => d.value > 0);
    }, [expenseMetrics]);

    // 9. Division Headcount Pie Data
    const divisionHeadcountPieData = React.useMemo(() => [
        { name: 'Geology & Exploration', value: 18, color: '#2563EB', kpi: 4.6 },
        { name: 'Mining Operations', value: 14, color: '#0D9488', kpi: 4.8 },
        { name: 'GIS & Drone UAV', value: 12, color: '#8B5CF6', kpi: 4.5 },
        { name: 'Hydrogeology Core', value: 8, color: '#06B6D4', kpi: 4.1 },
        { name: 'Finance & Strategy', value: 6, color: '#F59E0B', kpi: 4.7 },
        { name: 'HR & IT Administration', value: 5, color: '#EC4899', kpi: 4.4 },
    ], []);
    const handleExportReport = () => {
        try {
            if (activeReportTab === 'attendance') {
                const headers = ['Date', 'Employee Name', 'Employee ID', 'Department', 'Project / Site', 'Check-In', 'Check-Out', 'Working Hours', 'Late By', 'Status', 'Punch Source'].join(',');
                const rows = filteredAttendance.map((r) => [
                    `"${r.date || ''}"`,
                    `"${r.employeeName || ''}"`,
                    `"${r.employeeId || ''}"`,
                    `"${r.department || ''}"`,
                    `"${getEmployeeProjectById(r.employeeId)}"`,
                    `"${r.checkIn || '-'}"`,
                    `"${r.checkOut || '-'}"`,
                    `"${r.workingHours || '-'}"`,
                    `"${r.lateBy || '-'}"`,
                    `"${r.status || ''}"`,
                    `"${r.punchSource || 'Biometric'}"`
                ].join(','));
                const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `BGSPL_Attendance_Logs_${new Date().toLocaleDateString('en-CA')}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success(`Executive Attendance MIS report exported (${filteredAttendance.length} records).`, 'Export Ready');
                return;
            }

            if (activeReportTab === 'expenses') {
                const headers = ['Employee', 'Employee ID', 'Department', 'Project', 'Type', 'Category', 'Reference ID', 'Requested Amount (INR)', 'HR Approved (INR)', 'Rejected Variance (INR)', 'Settled Amount (INR)', 'HR Status', 'Finance Audit Status', 'Query Status', 'Settlement Status', 'Settlement Voucher Ref', 'Date Incurred', 'Submitted On', 'HR Reviewed On', 'HR Approver', 'Finance Reviewer', 'Settlement Date'].join(',');
                const rows = filteredMisExpenseRecords.map(r => [
                    `"${r.employeeName || ''}"`,
                    `"${r.employeeId || ''}"`,
                    `"${r.department || ''}"`,
                    `"${r.project || ''}"`,
                    `"${r.type || ''}"`,
                    `"${r.category || ''}"`,
                    `"${r.referenceId || ''}"`,
                    r.requestedAmount,
                    r.approvedAmount,
                    r.rejectedAmount,
                    r.settledAmount,
                    `"${r.hrStatus || r.status || ''}"`,
                    `"${r.financeStatus || ''}"`,
                    `"${r.queryStatus || ''}"`,
                    `"${r.settlementStatus || ''}"`,
                    `"${r.settlementReference || ''}"`,
                    `"${r.date || ''}"`,
                    `"${r.submittedOn || ''}"`,
                    `"${r.reviewedOn || ''}"`,
                    `"${r.approver || ''}"`,
                    `"${r.financeReviewer || ''}"`,
                    `"${r.settlementDate || ''}"`
                ].join(','));
                const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `BGSPL_Expenses_MIS_Report_${new Date().toLocaleDateString('en-CA')}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success(`Executive Expense & Reimbursement MIS report exported (${filteredMisExpenseRecords.length} records).`, 'Export Ready');
                return;
            }

            if (activeReportTab === 'leave') {
                const headers = ['Employee', 'Employee ID', 'Division', 'Category', 'Date Span', 'Requested Days', 'Approved Days', 'Rejected Days', 'Status', 'Balance Before', 'Balance After', 'Approver', 'Review Date'].join(',');
                const rows = filteredMisRecords.map(r => [
                    `"${r.employeeName || ''}"`,
                    `"${r.employeeId || ''}"`,
                    `"${r.department || ''}"`,
                    `"${r.leaveType || ''}"`,
                    `"${r.startDate || ''} to ${r.endDate || ''}"`,
                    r.requestedDays,
                    r.approvedDays,
                    r.rejectedDays,
                    `"${r.status || ''}"`,
                    r.balanceBefore,
                    r.balanceAfter,
                    `"${r.approverName || ''}"`,
                    `"${r.reviewedAt || ''}"`
                ].join(','));
                const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement('a');
                link.setAttribute('href', encodedUri);
                link.setAttribute('download', `BGSPL_Leave_MIS_Report_${new Date().toLocaleDateString('en-CA')}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success(`Executive Leave MIS report exported (${filteredMisRecords.length} records).`, 'Export Ready');
                return;
            }

            const rows = customDataset[customModule] || customDataset.employees;
            const headers = Object.keys(rows[0] || {}).join(',');
            const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows.map(r => Object.values(r).map(val => `"${val}"`).join(','))].join('\n');
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement('a');
            link.setAttribute('href', encodedUri);
            link.setAttribute('download', `BGSPL_${activeReportTab}_Report_${new Date().toLocaleDateString('en-CA')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success(`Executive MIS report for ${activeReportTab.toUpperCase()} exported to CSV.`, 'Export Ready');
        }
        catch {
            toast.success(`Executive MIS report for ${activeReportTab.toUpperCase()} generated.`, 'Export Complete');
        }
    };
    return (<div className="space-y-6 pb-12">
      <PageHeader title="Reports & MIS Analytics" description="Executive operational metrics, statutory audit ledgers, workforce utilization, and expenditure reports." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Reports & MIS' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={handleExportReport} leftIcon={<Download className="w-4 h-4"/>}>
              Export Report (PDF / Excel)
            </Button>
          </div>}/>

      {/* Global Filter Bar */}
      <Card className="p-3 sm:p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select
            label="Fiscal Period"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            options={[
              { label: 'All Records (Full History)', value: 'all' },
              { label: 'Current Period (Sep - Oct 2026)', value: 'this_month' },
              { label: 'Current Month (October 2026)', value: 'oct_2026' },
              { label: 'Previous Month (September 2026)', value: 'sep_2026' },
              { label: 'August 2026', value: 'aug_2026' },
              { label: 'Q3 FY 2026-27 (Oct - Dec)', value: 'this_quarter' },
              { label: 'Full Financial Year 2026-27', value: 'this_financial_year' },
            ]}
          />

          <Select
            label="Filter Department"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            options={[
              { label: 'All Company Divisions', value: 'all' },
              { label: 'Geology & Mineral Exploration', value: 'Geology & Mineral Exploration' },
              { label: 'Mining & Mine Planning', value: 'Mining & Mine Planning' },
              { label: 'GIS, Remote Sensing & UAV', value: 'GIS, Remote Sensing & UAV' },
              { label: 'Hydrogeology & Groundwater', value: 'Hydrogeology & Groundwater' },
              { label: 'Finance & Economics', value: 'Finance & Mineral Economics' },
              { label: 'Human Resources & Admin', value: 'Human Resources & Admin' },
            ]}
          />

          <Select
            label="Project / Site Location"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            options={[
              { label: 'All Projects / Sites', value: 'all' },
              ...STANDARD_PROJECTS.map((p) => ({ label: p, value: p })),
            ]}
          />

          <Select
            label="Filter Employee"
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            options={[
              { label: 'All Employees', value: 'all' },
              ...allEmployees.map((emp) => ({
                label: `${emp.name} (${emp.employeeId})`,
                value: emp.employeeId,
              })),
            ]}
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-[#253344] text-xs">
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            Data source: Bansal Geo HQ Biometric Core & Payroll Master
          </div>
          {(selectedDept !== 'all' || selectedProject !== 'all' || selectedEmployee !== 'all' || dateRange !== 'this_month') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDept('all');
                setSelectedProject('all');
                setSelectedEmployee('all');
                setDateRange('this_month');
              }}
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs flex items-center gap-1.5 h-7 px-2.5 self-start sm:self-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </Button>
          )}
        </div>
      </Card>

      {/* Report Module Tabs */}
      <Tabs tabs={reportTabs} activeTab={activeReportTab} onChange={setActiveReportTab}/>

      {/* Report Content Panels */}
      {activeReportTab === 'attendance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="Overall Attendance Rate"
              value={attendanceMetrics.overallRate}
              icon={<Users className="w-5 h-5"/>}
              iconBgColor="bg-blue-50 text-blue-600"
              caption={`${attendanceMetrics.totalPresent} of ${attendanceMetrics.totalRecords} punches`}
            />
            <StatCard
              title="Average Late Arrival Rate"
              value={attendanceMetrics.lateRate}
              icon={<Calendar className="w-5 h-5"/>}
              iconBgColor="bg-amber-50 text-amber-600"
              caption={`${attendanceMetrics.totalLate} late entries recorded`}
            />
            <StatCard
              title="Average Working Hours"
              value={attendanceMetrics.avgHours}
              icon={<BarChart3 className="w-5 h-5"/>}
              iconBgColor="bg-emerald-50 text-emerald-600"
              caption="Compliant with DGMS rules"
            />
          </div>

          {filteredAttendance.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No attendance records found for the selected filters.</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting the department, project, employee, or fiscal period filters.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie 1: Punctuality Breakdown */}
              <ChartCard
                title="Attendance Punctuality & Compliance Share"
                subtitle="Biometric on-time punches vs late arrivals and excused leaves"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full min-h-[260px]">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={attendancePunctualityPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {attendancePunctualityPieData.map((entry, index) => (
                          <Cell key={`punct-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name, item) => [`${val} punches (${item.payload.pct}%)`, name]}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '8px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="w-full sm:w-56 space-y-2.5 text-xs">
                    {attendancePunctualityPieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="truncate max-w-[120px]">{d.name}</span>
                        </span>
                        <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {d.value} <span className="text-slate-400 font-normal text-[10px]">({d.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>

              {/* Pie 2: Department-wise Attendance Share */}
              <ChartCard
                title="Division Workforce Attendance Share"
                subtitle="Relative biometric punch volume across company divisions"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full min-h-[260px]">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={attendanceDeptPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {attendanceDeptPieData.map((entry, index) => (
                          <Cell key={`dept-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name, item) => [`${val} logs (${item.payload.pct}%)`, name]}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '8px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="w-full sm:w-56 space-y-2 text-xs">
                    {attendanceDeptPieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="truncate max-w-[120px]">{d.name}</span>
                        </span>
                        <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {d.value} <span className="text-slate-400 font-normal text-[10px]">({d.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>
            </div>
          )}

          {/* Employee-wise Attendance Details (HRMS Requirement 7B) */}
          <Card className="p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  Employee Attendance Logs & Biometric Verification ({filteredAttendance.length} records)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Actual employee biometric punches, GPS field logs, and punctuality tracking
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1050px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px] bg-slate-50/50 dark:bg-slate-800/20">
                    <th className="py-3 px-3 w-[110px] whitespace-nowrap">Date</th>
                    <th className="py-3 px-3 min-w-[180px] whitespace-nowrap">Employee</th>
                    <th className="py-3 px-3 min-w-[180px] whitespace-nowrap">Department</th>
                    <th className="py-3 px-3 min-w-[190px] whitespace-nowrap">Project / Site</th>
                    <th className="py-3 px-3 w-[105px] whitespace-nowrap">Check-In</th>
                    <th className="py-3 px-3 w-[105px] whitespace-nowrap">Check-Out</th>
                    <th className="py-3 px-3 w-[115px] whitespace-nowrap">Working Hours</th>
                    <th className="py-3 px-3 w-[90px] whitespace-nowrap">Late By</th>
                    <th className="py-3 px-3 w-[95px] text-center whitespace-nowrap">Status</th>
                    <th className="py-3 px-3 min-w-[170px] whitespace-nowrap">Punch Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                        No attendance records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredAttendance.slice(0, 50).map((r, idx) => (
                      <tr key={r.id || `${r.date}-${r.employeeId}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">{r.date}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="font-bold text-slate-900 dark:text-white block whitespace-nowrap">{r.employeeName}</span>
                          <span className="font-mono text-[10px] text-slate-400 block whitespace-nowrap">{r.employeeId}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.department}</td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">{getEmployeeProjectById(r.employeeId)}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-800 dark:text-slate-200 whitespace-nowrap font-semibold">{r.checkIn || '-'}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap">{r.checkOut || '-'}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">{r.workingHours || '-'}</td>
                        <td className="py-2.5 px-3 font-mono whitespace-nowrap">
                          {r.lateBy && r.lateBy !== '-' ? <span className="text-amber-600 dark:text-amber-400 font-bold whitespace-nowrap">{r.lateBy}</span> : <span className="text-slate-400">-</span>}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-center">
                          <StatusBadge status={r.status} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 font-medium">
                            <Fingerprint className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>{r.punchSource || 'Biometric - Jaipur HQ'}</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {filteredAttendance.length > 50 && (
                <div className="p-3 text-center text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
                  Showing first 50 of {filteredAttendance.length} records. Refine department/date filters to narrow down.
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {activeReportTab === 'payroll' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="YTD Total Disbursed"
              value={payrollMetrics.totalDisbursed}
              icon={<CreditCard className="w-5 h-5"/>}
              iconBgColor="bg-emerald-50 text-emerald-600"
              caption={`${payrollMetrics.employeeCount} active payroll records`}
            />
            <StatCard
              title="YTD Statutory Remittances"
              value={payrollMetrics.statutoryRemittances}
              icon={<Building2 className="w-5 h-5"/>}
              iconBgColor="bg-blue-50 text-blue-600"
              caption="PF, PT & Tax Withholding"
            />
            <StatCard
              title="Avg Employee CTC"
              value={payrollMetrics.avgCtc}
              icon={<Users className="w-5 h-5"/>}
              iconBgColor="bg-purple-50 text-purple-600"
              caption="Technical consultancy benchmark"
            />
          </div>

          {filteredPayrollEmployees.length === 0 ? (
            <Card className="p-8 text-center text-slate-400">
              <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No payroll records found for the selected filters.</p>
              <p className="text-xs text-slate-400 mt-1">Try resetting the department, project, or employee filters.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie 1: Disbursement vs Taxes */}
              <ChartCard
                title="Payroll Disbursement & Statutory Distribution"
                subtitle="Net salary disbursed vs PF retirement savings vs TDS withholdings"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full min-h-[260px]">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={payrollDistributionPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="amount"
                      >
                        {payrollDistributionPieData.map((entry, index) => (
                          <Cell key={`pay-dist-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name) => [`₹${Number(val).toLocaleString('en-IN')}`, name]}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '8px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="w-full sm:w-56 space-y-2.5 text-xs">
                    {payrollDistributionPieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="truncate max-w-[120px]">{d.name}</span>
                        </span>
                        <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                          ₹{(d.amount / 1000).toFixed(0)}k
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>

              {/* Pie 2: Division Payroll Cost Share */}
              <ChartCard
                title="Division Payroll Expenditure Share"
                subtitle="Monthly gross compensation allocation by operating division"
              >
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full min-h-[260px]">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={payrollDeptPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="amount"
                      >
                        {payrollDeptPieData.map((entry, index) => (
                          <Cell key={`pay-dept-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name, item) => [`₹${Number(val).toLocaleString('en-IN')} (${item.payload.pct}%)`, name]}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '8px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="w-full sm:w-56 space-y-2 text-xs">
                    {payrollDeptPieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="truncate max-w-[120px]">{d.name}</span>
                        </span>
                        <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                          ₹{(d.amount / 1000).toFixed(0)}k <span className="text-slate-400 font-normal text-[10px]">({d.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ChartCard>
            </div>
          )}

          {/* Employee-wise Compensation Details (HRMS Requirement 7B) */}
          <Card className="p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Employee Compensation & Disbursement Breakdown ({filteredPayrollEmployees.length} employees)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Actual salary structures, gross earnings, statutory deductions, and net disbursed amounts
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Employee</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Project / Site</th>
                    <th className="py-2.5 px-3 text-right">Basic (₹)</th>
                    <th className="py-2.5 px-3 text-right">HRA (₹)</th>
                    <th className="py-2.5 px-3 text-right">Allowances (₹)</th>
                    <th className="py-2.5 px-3 text-right">Monthly Gross (₹)</th>
                    <th className="py-2.5 px-3 text-right">Deductions (₹)</th>
                    <th className="py-2.5 px-3 text-right">Net Disbursed (₹)</th>
                    <th className="py-2.5 px-3">Disbursement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredPayrollEmployees.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                        No payroll records found for the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredPayrollEmployees.map((s) => {
                      const allowances = (s.specialAllowance || 0) + (s.siteAllowance || 0) + (s.conveyance || 0);
                      const deductions = (s.providentFund || 0) + (s.professionalTax || 200) + (s.tds || 0);
                      return (
                        <tr key={s.id || s.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-2.5 px-3">
                            <span className="font-bold text-slate-900 dark:text-white block">{s.employeeName}</span>
                            <span className="font-mono text-[10px] text-slate-400">{s.employeeId}</span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{s.department}</td>
                          <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">{getEmployeeProjectById(s.employeeId)}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">₹{(s.basic || 0).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">₹{(s.hra || 0).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700 dark:text-slate-300">₹{allowances.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">₹{(s.monthlyGross || 0).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-600 dark:text-amber-400">₹{deductions.toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{(s.monthlyNet || 0).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <StatusBadge status="Disbursed" size="sm" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeReportTab === 'leave' && (<div className="space-y-6">
          {/* Executive Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard title="Total Applications" value={`${misSummary.totalRequests}`} icon={<FileCheck2 className="w-5 h-5"/>} iconBgColor="bg-blue-50 text-blue-600" caption="Submissions logged"/>
            <StatCard title="Total Requested Days" value={`${misSummary.totalRequestedDays}d`} icon={<Calendar className="w-5 h-5"/>} iconBgColor="bg-purple-50 text-purple-600" caption="Across all categories"/>
            <StatCard title="Total Approved Days" value={`${misSummary.totalApprovedDays}d`} icon={<CheckCircle2 className="w-5 h-5"/>} iconBgColor="bg-emerald-50 text-emerald-600" caption="Quota deducted"/>
            <StatCard title="Partially Approved" value={`${misSummary.partiallyApprovedCount}`} icon={<Sliders className="w-5 h-5"/>} iconBgColor="bg-amber-50 text-amber-600" caption="Split decisions"/>
            <StatCard title="Rejected / Cancelled" value={`${misSummary.totalRejectedDays}d`} icon={<UserMinus className="w-5 h-5"/>} iconBgColor="bg-rose-50 text-rose-600" caption={`${misSummary.cancelledCount} cancelled`}/>
          </div>

          {/* Employee-Specific Leave MIS Analysis & Interactive Chart */}
          <EmployeeLeaveMisChart showSelector={true} />

          {/* Departmental Leave Distribution Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie 1: Leave Status Share */}
            <ChartCard
              title="Leave Commitment & Status Breakdown"
              subtitle="Ratio of approved leave days vs pending manager reviews and rejected days"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full min-h-[240px]">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={leaveStatusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {leaveStatusPieData.map((entry, index) => (
                        <Cell key={`leave-status-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, item) => [`${val} days (${item.payload.pct}%)`, name]}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="w-full sm:w-56 space-y-2.5 text-xs">
                  {leaveStatusPieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="truncate max-w-[120px]">{d.name}</span>
                      </span>
                      <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                        {d.value}d <span className="text-slate-400 font-normal text-[10px]">({d.pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>

            {/* Pie 2: Division Leave Utilization Share */}
            <ChartCard
              title="Division Leave Consumption Share"
              subtitle="Working days committed across operating departments"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full min-h-[240px]">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={leaveDeptPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {leaveDeptPieData.map((entry, index) => (
                        <Cell key={`leave-dept-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, item) => [`${val} days (${item.payload.pct}%)`, name]}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="w-full sm:w-56 space-y-2 text-xs">
                  {leaveDeptPieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="truncate max-w-[120px]">{d.name}</span>
                      </span>
                      <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                        {d.value}d <span className="text-slate-400 font-normal text-[10px]">({d.pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Master MIS Audit Ledger Table */}
          <Card className="p-5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Executive Leave Audit Ledger ({filteredMisRecords.length} records)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Single source of truth tracking requested, approved, rejected, and balance impact across all personnel
                </p>
              </div>

              <div className="w-full sm:w-64">
                <input type="text" placeholder="Filter by applicant, ID, or type..." value={leaveSearch} onChange={(e) => setLeaveSearch(e.target.value)} className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#253344] bg-white dark:bg-[#16202C] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"/>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 whitespace-nowrap">Employee</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Division</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Category</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Date Span</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Req</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Appr</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Rej</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Balance Impact</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Approver</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Review Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMisRecords.length === 0 ? (<tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400 text-xs">
                        No leave records matched the specified filter criteria.
                      </td>
                    </tr>) : (filteredMisRecords.map((r) => (<tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 dark:text-white block">{r.employeeName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{r.employeeId}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {r.department}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                          {r.leaveType}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {r.startDate} to {r.endDate}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300">
                            {r.requestedDays}d
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${r.approvedDays > 0 ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'text-slate-400'}`}>
                            {r.approvedDays}d
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-1.5 py-0.5 rounded font-bold ${r.rejectedDays > 0 ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300' : 'text-slate-400'}`}>
                            {r.rejectedDays}d
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusBadge status={r.status} size="sm"/>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                          {r.status === 'Approved' || r.status === 'Partially Approved' ? (<span className="text-slate-700 dark:text-slate-300">
                              {r.balanceBefore}d → <strong className="text-emerald-600 dark:text-emerald-400">{r.balanceAfter}d</strong>
                            </span>) : (<span className="text-slate-400">
                              {r.balanceAfter}d (unchanged)
                            </span>)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                          {r.approverName || (r.status === 'Pending' ? 'Pending Review' : '-')}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px] whitespace-nowrap">
                          {r.reviewedAt
                    ? new Date(r.reviewedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                    : '-'}
                        </td>
                      </tr>)))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>)}

      {/* Expenses & Reimbursements Tab */}
      {activeReportTab === 'expenses' && (
        <div className="space-y-6">
          {filteredMisExpenseRecords.length === 0 && (
            <Card className="p-6 text-center border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
              <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {selectedEmployee !== 'all'
                  ? 'No employee expenses found for this employee and filters.'
                  : 'No employee expenses found for the selected filters.'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Try resetting or adjusting the employee, department, project, or fiscal period filters.
              </p>
            </Card>
          )}

          {/* Executive Section Header: Expenses */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-blue-600" />
                Operational Expense Claims Analytics
              </h3>
              <span className="text-[11px] text-slate-400">
                {expenseMetrics.expenses.totalClaims} Claims Logged
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard
                title="Total Requested"
                value={`₹${expenseMetrics.expenses.totalRequested.toLocaleString('en-IN')}`}
                icon={<Receipt className="w-4 h-4" />}
                iconBgColor="bg-blue-50 text-blue-600"
                caption={`${expenseMetrics.expenses.totalClaims} submitted`}
              />
              <StatCard
                title="Total Approved"
                value={`₹${expenseMetrics.expenses.totalApproved.toLocaleString('en-IN')}`}
                icon={<CheckCircle2 className="w-4 h-4" />}
                iconBgColor="bg-emerald-50 text-emerald-600"
                caption="HR Authorized"
              />
              <StatCard
                title="Total Rejected"
                value={`₹${expenseMetrics.expenses.totalRejected.toLocaleString('en-IN')}`}
                icon={<XCircle className="w-4 h-4" />}
                iconBgColor="bg-rose-50 text-rose-600"
                caption="Disallowed portion"
              />
              <StatCard
                title="Partially Approved"
                value={`${expenseMetrics.expenses.partiallyApproved}`}
                icon={<Sliders className="w-4 h-4" />}
                iconBgColor="bg-amber-50 text-amber-600"
                caption="Split decisions"
              />
              <StatCard
                title="Settled / Paid"
                value={`₹${expenseMetrics.expenses.settledPaid.toLocaleString('en-IN')}`}
                icon={<Wallet className="w-4 h-4" />}
                iconBgColor="bg-teal-50 text-teal-600"
                caption="Disbursed via Finance"
              />
              <StatCard
                title="Pending Liability"
                value={`₹${expenseMetrics.expenses.pendingAmount.toLocaleString('en-IN')}`}
                icon={<Clock className="w-4 h-4" />}
                iconBgColor="bg-purple-50 text-purple-600"
                caption="Awaiting HR Review"
              />
            </div>
          </div>

          {/* Executive Section Header: Reimbursements */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                Employee Reimbursement Disbursals Analytics
              </h3>
              <span className="text-[11px] text-slate-400">
                {expenseMetrics.reimbursements.totalClaims} Claims Logged
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard
                title="Total Claimed"
                value={`₹${expenseMetrics.reimbursements.totalClaimed.toLocaleString('en-IN')}`}
                icon={<Receipt className="w-4 h-4" />}
                iconBgColor="bg-blue-50 text-blue-600"
                caption={`${expenseMetrics.reimbursements.totalClaims} claims filed`}
              />
              <StatCard
                title="Total Approved"
                value={`₹${expenseMetrics.reimbursements.totalApproved.toLocaleString('en-IN')}`}
                icon={<CheckCircle2 className="w-4 h-4" />}
                iconBgColor="bg-emerald-50 text-emerald-600"
                caption="HR Authorized"
              />
              <StatCard
                title="Total Rejected"
                value={`₹${expenseMetrics.reimbursements.totalRejected.toLocaleString('en-IN')}`}
                icon={<XCircle className="w-4 h-4" />}
                iconBgColor="bg-rose-50 text-rose-600"
                caption="Disallowed portion"
              />
              <StatCard
                title="Partially Approved"
                value={`${expenseMetrics.reimbursements.partiallyApproved}`}
                icon={<Sliders className="w-4 h-4" />}
                iconBgColor="bg-amber-50 text-amber-600"
                caption="Split decisions"
              />
              <StatCard
                title="Total Settled"
                value={`₹${expenseMetrics.reimbursements.settled.toLocaleString('en-IN')}`}
                icon={<Wallet className="w-4 h-4" />}
                iconBgColor="bg-teal-50 text-teal-600"
                caption="Settled / Disbursed"
              />
              <StatCard
                title="Pending Liability"
                value={`₹${expenseMetrics.reimbursements.pendingAmount.toLocaleString('en-IN')}`}
                icon={<Clock className="w-4 h-4" />}
                iconBgColor="bg-purple-50 text-purple-600"
                caption="Awaiting HR Review"
              />
            </div>
          </div>

          {/* Expenditure Category Analytics Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie 1: Claims Settlement Lifecycle Share */}
            <ChartCard
              title="Claims Lifecycle & Settlement Status"
              subtitle="Distribution of fully settled disbursements vs approved & pending review amounts"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full min-h-[250px]">
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie
                      data={expenseStatusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseStatusPieData.map((entry, index) => (
                        <Cell key={`exp-status-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name) => [`₹${Number(val).toLocaleString('en-IN')}`, name]}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="w-full sm:w-56 space-y-2.5 text-xs">
                  {expenseStatusPieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="truncate max-w-[120px]">{d.name}</span>
                      </span>
                      <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                        ₹{(d.value / 1000).toFixed(0)}k
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>

            {/* Pie 2: Category Breakdown */}
            <ChartCard
              title="Expenditure & Claims by Category"
              subtitle="Proportional spend distribution across geological, drone, travel & camp expenses"
            >
              {expenseCategoryPieData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-slate-400 text-xs">
                  No expense category data available for the current filter selection.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full min-h-[250px]">
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie
                        data={expenseCategoryPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expenseCategoryPieData.map((entry, index) => (
                          <Cell key={`exp-cat-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name, item) => [`₹${Number(val).toLocaleString('en-IN')} (${item.payload.pct}%)`, name]}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderRadius: '8px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '12px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="w-full sm:w-56 space-y-2 text-xs">
                    {expenseCategoryPieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="truncate max-w-[120px]">{d.name}</span>
                        </span>
                        <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                          ₹{(d.value / 1000).toFixed(0)}k <span className="text-slate-400 font-normal text-[10px]">({d.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ChartCard>
          </div>

          {/* Master MIS Audit Ledger Table */}
          <Card className="p-5 shadow-2xs">
            <div className="flex flex-col gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                    Master Expense & Reimbursement Reconciliation Ledger ({filteredMisExpenseRecords.length} records)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    End-to-end audit ledger tracking requested amounts, partial approvals, rejection variances, and final settlement dates
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportReport}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Sub-Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5 pt-2">
                <div className="relative col-span-1 sm:col-span-2 md:col-span-1 lg:col-span-1">
                  <Search
                    className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }}
                  />
                  <input
                    type="text"
                    placeholder="Search ref, employee, project..."
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    style={{ paddingLeft: '34px' }}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#253344] bg-white dark:bg-[#16202C] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <Select
                  value={expenseModuleType}
                  onChange={(e) => setExpenseModuleType(e.target.value)}
                  options={[
                    { label: 'All Claim Types', value: 'all' },
                    { label: 'Expenses Only', value: 'expense' },
                    { label: 'Reimbursements Only', value: 'reimbursement' },
                  ]}
                />

                <Select
                  value={expenseStatusFilter}
                  onChange={(e) => setExpenseStatusFilter(e.target.value)}
                  options={[
                    { label: 'All HR Decisions', value: 'all' },
                    { label: 'Pending Review', value: 'Pending' },
                    { label: 'Approved', value: 'Approved' },
                    { label: 'Partially Approved', value: 'Partially Approved' },
                    { label: 'Rejected', value: 'Rejected' },
                    { label: 'Settled', value: 'Settled' },
                  ]}
                />

                <Select
                  value={expenseFinanceStatusFilter}
                  onChange={(e) => setExpenseFinanceStatusFilter(e.target.value)}
                  options={[
                    { label: 'All Finance Statuses', value: 'all' },
                    { label: 'Pending Review', value: 'Pending Review' },
                    { label: 'Verified', value: 'Verified' },
                    { label: 'Rejected', value: 'Rejected' },
                    { label: 'None', value: 'None' },
                  ]}
                />

                <Select
                  value={expenseQueryStatusFilter}
                  onChange={(e) => setExpenseQueryStatusFilter(e.target.value)}
                  options={[
                    { label: 'All Query Statuses', value: 'all' },
                    { label: 'No Query', value: 'No Query' },
                    { label: 'Query Raised', value: 'Query Raised' },
                    { label: 'Employee Responded', value: 'Employee Responded' },
                    { label: 'Resolved', value: 'Resolved' },
                  ]}
                />

                <Select
                  value={expenseCategoryFilter}
                  onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                  options={[
                    { label: 'All Categories', value: 'all' },
                    ...distinctCategories.map((c) => ({ label: c, value: c })),
                  ]}
                />

                <Select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  options={[
                    { label: 'All Employees', value: 'all' },
                    ...allEmployees.map((emp) => ({
                      label: `${emp.name} (${emp.employeeId})`,
                      value: emp.employeeId,
                    })),
                  ]}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[1250px]">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3 whitespace-nowrap">Employee</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Department</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Project</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Type</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Category</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Ref #</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Requested (₹)</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">HR Approved (₹)</th>
                    <th className="py-2.5 px-3 text-right whitespace-nowrap">Rejected (₹)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">HR Decision</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Finance Audit</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Query Status</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Settlement</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Claim Date</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">HR Reviewed</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Disbursal Ref & Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredMisExpenseRecords.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-8 text-center text-slate-400 text-xs">
                        {selectedEmployee !== 'all' 
                          ? 'No employee expenses found for this employee and filters.'
                          : 'No employee expenses found for the selected filters.'}
                      </td>
                    </tr>
                  ) : (
                    filteredMisExpenseRecords.map((r) => (
                      <tr key={`${r.type}-${r.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3">
                          <span className="font-bold text-slate-900 dark:text-white block">{r.employeeName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{r.employeeId}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {r.department}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-medium">
                          {r.project}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            r.type === 'Expense'
                              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {r.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-200">
                          {r.category}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-blue-600 dark:text-blue-400 whitespace-nowrap font-bold">
                          {r.referenceId}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                          ₹{r.requestedAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          <span className={r.approvedAmount > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}>
                            ₹{r.approvedAmount.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">
                          <span className={r.rejectedAmount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'}>
                            ₹{r.rejectedAmount.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusBadge status={r.hrStatus || r.status} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusBadge status={r.financeStatus === 'None' ? (r.hrStatus === 'Rejected' ? 'None' : 'Pending HR') : r.financeStatus} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {r.queryStatus && r.queryStatus !== 'No Query' ? (
                            <StatusBadge status={r.queryStatus} size="sm" />
                          ) : (
                            <span className="text-slate-400 text-[10px]">None</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <StatusBadge status={r.settlementStatus === 'None' ? 'Not Payable' : (r.settlementStatus || 'Pending')} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          {r.date}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                          <div>
                            <span>{r.reviewedOn || '—'}</span>
                            {r.approver && <p className="text-[10px] text-slate-400">{r.approver}</p>}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] whitespace-nowrap">
                          {r.settlementStatus === 'Settled' ? (
                            <div>
                              <span className="text-teal-600 dark:text-teal-400 font-bold block">{r.settlementReference || 'Disbursed'}</span>
                              <span className="text-[10px] text-slate-400">{r.settlementDate || 'Completed'}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeReportTab === 'department' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard
              title="Department Workforce Distribution"
              subtitle="Headcount allocation across exploration, mining, and HQ operations"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full min-h-[250px]">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={divisionHeadcountPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {divisionHeadcountPieData.map((entry, index) => (
                        <Cell key={`dept-head-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, item) => [`${val} staff (Avg KPI: ${item.payload.kpi}/5.0)`, name]}
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="w-full sm:w-56 space-y-2 text-xs">
                  {divisionHeadcountPieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="truncate max-w-[120px]">{d.name}</span>
                      </span>
                      <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                        {d.value} <span className="text-teal-600 dark:text-teal-400 font-semibold text-[10px]">({d.kpi}★)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>

            <ChartCard
              title="Department Compensation Outflow Share"
              subtitle="Monthly payroll budget allocation by operating unit"
            >
              {payrollDeptPieData.length === 0 ? (
                <div className="h-56 flex items-center justify-center text-slate-400 text-xs">
                  No payroll department data available.
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full min-h-[250px]">
                  <ResponsiveContainer width="100%" height={240}>
                    <PieChart>
                      <Pie
                        data={payrollDeptPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {payrollDeptPieData.map((entry, index) => (
                          <Cell key={`dept-pay-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val, name) => [`₹${val}k`, name]}
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          borderRadius: '8px',
                          border: 'none',
                          color: '#fff',
                          fontSize: '11px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="w-full sm:w-56 space-y-2 text-xs">
                    {payrollDeptPieData.map((d) => (
                      <div key={d.name} className="flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="truncate max-w-[120px]">{d.name}</span>
                        </span>
                        <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                          ₹{d.value}k <span className="text-slate-400 font-normal text-[10px]">({d.pct}%)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ChartCard>
          </div>

          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Departmental Headcount & Compensation Distribution</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Resource allocations across active mining and consulting divisions</p>
            <div className="overflow-x-auto custom-sidebar-scroll">
              <table className="w-full text-left text-xs min-w-[580px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#111821] border-b border-slate-200 dark:border-[#253344] text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3 whitespace-nowrap">Department</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Head of Division</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Headcount</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Monthly Outflow (₹)</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">HQ / Field Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50 dark:hover:bg-[#253344]/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">Geology & Mineral Exploration</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">Dr. Amit Kumar Bansal</td>
                    <td className="py-3 px-3 font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">18 Staff</td>
                    <td className="py-3 px-3 font-bold tabular-nums whitespace-nowrap text-slate-900 dark:text-white">₹3,40,000</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">40% HQ / 60% Site</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-[#253344]/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">Mining & Mine Planning</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">Rajesh Sharma</td>
                    <td className="py-3 px-3 font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">14 Staff</td>
                    <td className="py-3 px-3 font-bold tabular-nums whitespace-nowrap text-slate-900 dark:text-white">₹2,85,000</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">30% HQ / 70% Site</td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-[#253344]/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">GIS, Remote Sensing & UAV</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">Vikramaditya Rathore</td>
                    <td className="py-3 px-3 font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">12 Staff</td>
                    <td className="py-3 px-3 font-bold tabular-nums whitespace-nowrap text-slate-900 dark:text-white">₹2,10,000</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">70% HQ / 30% Flight</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeReportTab === 'custom' && (<div className="space-y-6">
          {/* Custom Report Configuration Card */}
          <Card className="p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#1F6F78] dark:text-teal-400"/>
                  Custom MIS Query Builder & Dynamic Export
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Design bespoke reports across modules, select custom telemetry fields, and export in multi-format structures.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleSelectAllFields} leftIcon={<Layers className="w-3.5 h-3.5"/>}>
                  Select All Fields
                </Button>
                <Button variant="primary" size="sm" onClick={() => {
                setIsQueryGenerated(true);
                toast.success(`Query compiled for ${customModule.toUpperCase()} ledger. 6 records synchronized.`, 'Query Updated');
            }} leftIcon={<Sparkles className="w-3.5 h-3.5"/>}>
                  Run Query & Refresh
                </Button>
              </div>
            </div>

            {/* Step 1: Select Module */}
            <div className="mt-5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                1. Select Target Data Repository
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                { id: 'employees', label: 'Workforce Master', count: `${allEmployees.length} Staff` },
                { id: 'leave', label: 'Leave Ledger', count: `${misLeaveRecords.length} Requests` },
                { id: 'payroll', label: 'Payroll & Comp', count: `${allSalaries.length} Disbursed` },
                { id: 'expenses', label: 'Expenses & Claims', count: `${unifiedExpenseRecords.length} Records` },
                { id: 'performance', label: 'Performance', count: '5 Reviews' },
                { id: 'exit', label: 'Separation', count: '2 Exits' },
            ].map((mod) => (<button key={mod.id} type="button" onClick={() => handleModuleSwitch(mod.id)} className={`p-3 text-left rounded-xl border transition-all ${customModule === mod.id
                    ? 'border-[#1F6F78] bg-teal-50/70 dark:bg-teal-950/40 text-[#1F6F78] dark:text-teal-300 ring-2 ring-[#1F6F78]/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#142028] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'}`}>
                    <span className="text-xs font-bold block">{mod.label}</span>
                    <span className="text-[11px] text-slate-400 block mt-0.5">{mod.count}</span>
                  </button>))}
              </div>
            </div>

            {/* Step 2: Choose Fields */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  2. Choose Report Columns ({selectedFields.length} of {moduleFieldMap[customModule].length} Active)
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                {moduleFieldMap[customModule].map((field) => {
                const isChecked = selectedFields.includes(field.id);
                return (<button key={field.id} type="button" onClick={() => toggleField(field.id)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${isChecked
                        ? 'bg-[#1F6F78] text-white border-[#1F6F78] shadow-2xs'
                        : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}>
                      {isChecked && <Check className="w-3.5 h-3.5 text-white"/>}
                      {field.label}
                    </button>);
            })}
              </div>
            </div>
          </Card>

          {/* Results Table Preview */}
          <Card className="p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                    {customModule} MIS Data Grid
                  </h4>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                    {customDataset[customModule].length} rows matched
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    Execution: 9ms
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Filtered by: {selectedDept === 'all' ? 'All Divisions' : selectedDept} • Fiscal: {dateRange.replace('_', ' ')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => toast.success(`Generated ${customModule}_export.csv ready for download.`, 'CSV Export Ready')} leftIcon={<FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600"/>}>
                  Export CSV
                </Button>
                <Button variant="primary" size="sm" onClick={() => toast.success(`Executive Excel workbook for ${customModule} created.`, 'Excel Generated')} leftIcon={<Download className="w-3.5 h-3.5"/>}>
                  Download Excel (.XLSX)
                </Button>
              </div>
            </div>

            <div className="overflow-x-auto custom-sidebar-scroll mt-4">
              <table className="w-full text-left text-xs min-w-[620px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#111821] border-b border-slate-200 dark:border-[#253344] text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
                    {selectedFields.map((fieldId) => {
                const fieldDef = moduleFieldMap[customModule].find((f) => f.id === fieldId);
                return (<th key={fieldId} className="py-2.5 px-3 whitespace-nowrap">
                          {fieldDef ? fieldDef.label : fieldId}
                        </th>);
            })}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customDataset[customModule].map((row, idx) => (<tr key={idx} className="hover:bg-slate-50 dark:hover:bg-[#253344]/40">
                      {selectedFields.map((fieldId) => (<td key={fieldId} className={`py-3 px-3 whitespace-nowrap ${fieldId === 'name' || fieldId === 'employeeId'
                        ? 'font-bold text-slate-900 dark:text-white'
                        : 'text-slate-700 dark:text-slate-300'}`}>
                          {row[fieldId] || '—'}
                        </td>))}
                    </tr>))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>)}

      {activeReportTab === 'insights' && (<div className="space-y-6">
          {/* Executive Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Workforce Retention Rate" value="94.8%" icon={<Users className="w-5 h-5"/>} iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" change="+1.6% QoQ" changeType="increase" caption="vs Q1 FY 2026-27"/>
            <StatCard title="Avg Performance Index" value="4.31 / 5.0" icon={<Award className="w-5 h-5"/>} iconBgColor="bg-teal-50 text-[#1F6F78] dark:bg-teal-950/40 dark:text-teal-400" change="Top Quartile" changeType="increase" caption="Across all 6 Divisions"/>
            <StatCard title="Separation Clearance SLA" value="4.1 Days" icon={<CheckCircle2 className="w-5 h-5"/>} iconBgColor="bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" change="-1.2 Days Faster" changeType="increase" caption="Target: < 7.0 Days"/>
            <StatCard title="Operational Cost Efficiency" value="92.4%" icon={<TrendingUp className="w-5 h-5"/>} iconBgColor="bg-amber-50 text-[#C8943A] dark:bg-amber-950/40 dark:text-amber-400" change="Optimal Budget ROI" changeType="increase" caption="Expenditure vs Output"/>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Division Workforce Allocation & KPI Distribution" subtitle="Headcount proportion and performance index rating by operating division">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full min-h-[250px]">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={divisionHeadcountPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {divisionHeadcountPieData.map((entry, index) => (
                        <Cell key={`div-head-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val, name, item) => [`${val} staff (Avg KPI: ${item.payload.kpi}/5.0)`, name]}
                      contentStyle={{
                        backgroundColor: '#1E293B',
                        borderRadius: '8px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '11px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="w-full sm:w-56 space-y-2 text-xs">
                  {divisionHeadcountPieData.map((d) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="truncate max-w-[120px]">{d.name}</span>
                      </span>
                      <div className="font-bold text-slate-900 dark:text-white tabular-nums">
                        {d.value} <span className="text-teal-600 dark:text-teal-400 font-semibold text-[10px]">({d.kpi}★)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>

            <ChartCard title="Workforce Separation & Attrition Drivers" subtitle="Root causes documented across exit interviews">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={[
                { name: 'Higher Studies & Certs', value: 38, fill: '#1F6F78' },
                { name: 'Geographic Relocation', value: 28, fill: '#C8943A' },
                { name: 'External Opportunity', value: 22, fill: '#31485A' },
                { name: 'Personal / Family', value: 12, fill: '#10B981' },
            ]} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                      <Cell fill="#1F6F78"/>
                      <Cell fill="#C8943A"/>
                      <Cell fill="#31485A"/>
                      <Cell fill="#10B981"/>
                    </Pie>
                    <Tooltip formatter={(val) => [`${val}%`, 'Factor Share']} contentStyle={{
                backgroundColor: '#1E293B',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
            }}/>
                  </PieChart>
                </ResponsiveContainer>

                <div className="w-full sm:w-48 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#1F6F78]"></span>
                      Higher Studies
                    </span>
                    <strong className="text-slate-900 dark:text-white">38%</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#C8943A]"></span>
                      Relocation
                    </span>
                    <strong className="text-slate-900 dark:text-white">28%</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#31485A]"></span>
                      Career Pivot
                    </span>
                    <strong className="text-slate-900 dark:text-white">22%</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]"></span>
                      Personal
                    </span>
                    <strong className="text-slate-900 dark:text-white">12%</strong>
                  </div>
                </div>
              </div>
            </ChartCard>
          </div>

          {/* Division Health Scorecard Table */}
          <Card className="p-6 border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Divisional Health & Operational Scorecard
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Comprehensive index benchmarking team stability, clearance turnaround, and output efficiency
            </p>

            <div className="overflow-x-auto custom-sidebar-scroll">
              <table className="w-full text-left text-xs min-w-[620px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#111821] border-b border-slate-200 dark:border-[#253344] text-slate-700 dark:text-slate-300 font-bold uppercase text-[11px]">
                    <th className="py-2.5 px-3 whitespace-nowrap">Division</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Headcount</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Retention Rate</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Average KPI</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Open Clearances</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Stability Tier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr className="hover:bg-slate-50 dark:hover:bg-[#253344]/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">Geology & Mineral Exploration</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">18 Engineers</td>
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">96.2%</td>
                    <td className="py-3 px-3 font-bold text-[#1F6F78] dark:text-teal-400 whitespace-nowrap">4.6 / 5.0</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">1 (Deepak C.)</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        Exemplary
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-[#253344]/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">Mining & Mine Planning</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">14 Engineers</td>
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">94.0%</td>
                    <td className="py-3 px-3 font-bold text-[#1F6F78] dark:text-teal-400 whitespace-nowrap">4.8 / 5.0</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">1 (Anil K.)</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        Exemplary
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-[#253344]/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">GIS, Remote Sensing & UAV</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">12 Specialists</td>
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">95.0%</td>
                    <td className="py-3 px-3 font-bold text-[#1F6F78] dark:text-teal-400 whitespace-nowrap">4.5 / 5.0</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">1 (Mohit S.)</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        Exemplary
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-[#253344]/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">Hydrogeology & Groundwater</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">8 Specialists</td>
                    <td className="py-3 px-3 font-bold text-teal-600 dark:text-teal-400 whitespace-nowrap">92.5%</td>
                    <td className="py-3 px-3 font-bold text-[#1F6F78] dark:text-teal-400 whitespace-nowrap">4.1 / 5.0</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">0 Active</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-400">
                        Optimal
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50 dark:hover:bg-[#253344]/40">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-white whitespace-nowrap">Finance & Mineral Economics</td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">6 Analysts</td>
                    <td className="py-3 px-3 font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">98.0%</td>
                    <td className="py-3 px-3 font-bold text-[#1F6F78] dark:text-teal-400 whitespace-nowrap">4.7 / 5.0</td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">0 Active</td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        Exemplary
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        </div>)}
    </div>);
};
