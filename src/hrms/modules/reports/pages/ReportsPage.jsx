import React, { useState } from 'react';
import {
    BarChart3, Download, Calendar, Building2, Users, CreditCard,
    FileCheck2, TrendingUp, Award, UserMinus, CheckCircle2, Sliders,
    Layers, Sparkles, FileSpreadsheet, Check, RotateCcw, Receipt,
    Clock, XCircle, Search, Wallet
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
import { STANDARD_PROJECTS } from '@/core/constants/projects';

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

    // Date Range Matching Helper
    const matchesDateRange = (dateStr, range) => {
        if (!dateStr) return true;
        if (range === 'this_month') return dateStr >= '2026-09-01' && dateStr <= '2026-09-30';
        if (range === 'last_month') return dateStr >= '2026-08-01' && dateStr <= '2026-08-31';
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
    // Report Datasets
    const attendanceReportData = [
        { department: 'Geology', onTime: 82, late: 8, absent: 4 },
        { department: 'Mining', onTime: 79, late: 10, absent: 5 },
        { department: 'GIS & UAV', onTime: 88, late: 5, absent: 3 },
        { department: 'Hydrogeology', onTime: 80, late: 8, absent: 4 },
        { department: 'Finance', onTime: 92, late: 4, absent: 2 },
        { department: 'HR & IT', onTime: 90, late: 5, absent: 2 },
    ];
    const payrollCostData = [
        { month: 'Apr', gross: 11.2, net: 9.6, tax: 1.6 },
        { month: 'May', gross: 11.4, net: 9.8, tax: 1.6 },
        { month: 'Jun', gross: 11.8, net: 10.1, tax: 1.7 },
        { month: 'Jul', gross: 12.2, net: 10.5, tax: 1.7 },
        { month: 'Aug', gross: 12.3, net: 10.5, tax: 1.8 },
    ];
    const handleExportReport = () => {
        try {
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
      <Card className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="w-full sm:w-48">
            <Select label="Fiscal Period" value={dateRange} onChange={(e) => setDateRange(e.target.value)} options={[
            { label: 'Current Month (Sep 2026)', value: 'this_month' },
            { label: 'Last Month (Aug 2026)', value: 'last_month' },
            { label: 'Q2 FY 2026-27 (Jul - Sep)', value: 'this_quarter' },
            { label: 'Full Financial Year 2026-27', value: 'this_financial_year' },
        ]}/>
          </div>

          <div className="w-full sm:w-60">
            <Select label="Filter Department" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} options={[
            { label: 'All Company Divisions', value: 'all' },
            { label: 'Geology & Mineral Exploration', value: 'Geology & Mineral Exploration' },
            { label: 'Mining & Mine Planning', value: 'Mining & Mine Planning' },
            { label: 'GIS, Remote Sensing & UAV', value: 'GIS, Remote Sensing & UAV' },
            { label: 'Hydrogeology & Groundwater', value: 'Hydrogeology & Groundwater' },
            { label: 'Finance & Economics', value: 'Finance & Mineral Economics' },
            { label: 'Human Resources & Admin', value: 'Human Resources & Admin' },
        ]}/>
          </div>

          <div className="w-full sm:w-64">
            <Select label="Project / Site Location" value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} options={[
            { label: 'All Projects / Sites', value: 'all' },
            ...STANDARD_PROJECTS.map((p) => ({ label: p, value: p })),
        ]}/>
          </div>

          {(selectedDept !== 'all' || selectedProject !== 'all' || dateRange !== 'this_month') && (<div className="pt-4">
              <Button variant="ghost" size="sm" onClick={() => {
                setSelectedDept('all');
                setSelectedProject('all');
                setDateRange('this_month');
            }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs flex items-center gap-1">
                <RotateCcw className="w-3 h-3"/>
                <span>Reset</span>
              </Button>
            </div>)}
        </div>

        <div className="text-right text-xs text-slate-500 hidden lg:block">
          Data source: Bansal Geo HQ Biometric Core & Payroll Master
        </div>
      </Card>

      {/* Report Module Tabs */}
      <Tabs tabs={reportTabs} activeTab={activeReportTab} onChange={setActiveReportTab}/>

      {/* Report Content Panels */}
      {activeReportTab === 'attendance' && (<div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Overall Attendance Rate" value="93.8%" icon={<Users className="w-5 h-5"/>} iconBgColor="bg-blue-50 text-blue-600" change="+1.2%" changeType="increase" caption="vs previous quarter"/>
            <StatCard title="Average Late Arrival Rate" value="4.6%" icon={<Calendar className="w-5 h-5"/>} iconBgColor="bg-amber-50 text-amber-600" caption="Within 15-min grace"/>
            <StatCard title="Average Working Hours" value="8.8 hrs" icon={<BarChart3 className="w-5 h-5"/>} iconBgColor="bg-emerald-50 text-emerald-600" caption="Compliant with DGMS rules"/>
          </div>

          <ChartCard title="Department-wise Attendance & Punctuality (%)" subtitle="Comparison of on-time biometric arrivals vs late occurrences across branches" action={<div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#4F6B92]"/>
                  <span>On Time</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#F87171]"/>
                  <span>Absent</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#FBBF24]"/>
                  <span>Late</span>
                </div>
              </div>}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={attendanceReportData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9"/>
                <XAxis dataKey="department" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false}/>
                <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false}/>
                <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.6)' }} content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                    const onTime = payload.find((p) => p.dataKey === 'onTime')?.value || 0;
                    const absent = payload.find((p) => p.dataKey === 'absent')?.value || 0;
                    const late = payload.find((p) => p.dataKey === 'late')?.value || 0;
                    return (<div className="bg-slate-900/95 backdrop-blur-xs text-white p-3 rounded-lg shadow-xl border border-slate-800 text-xs min-w-[150px]">
                          <p className="font-bold text-slate-200 border-b border-slate-700/60 pb-1.5 mb-2">{label}</p>
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2.5 h-2.5 rounded-xs bg-[#4F6B92]"/>
                                On Time:
                              </span>
                              <span className="font-semibold text-white">{onTime}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2.5 h-2.5 rounded-xs bg-[#F87171]"/>
                                Absent:
                              </span>
                              <span className="font-semibold text-rose-300">{absent}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 text-slate-300">
                                <span className="w-2.5 h-2.5 rounded-xs bg-[#FBBF24]"/>
                                Late:
                              </span>
                              <span className="font-semibold text-amber-300">{late}%</span>
                            </div>
                          </div>
                        </div>);
                }
                return null;
            }}/>
                <Bar dataKey="onTime" stackId="a" fill="#4F6B92" radius={[0, 0, 0, 0]} barSize={20}/>
                <Bar dataKey="absent" stackId="a" fill="#F87171" radius={[0, 0, 0, 0]} barSize={20}/>
                <Bar dataKey="late" stackId="a" fill="#FBBF24" radius={[3, 3, 0, 0]} barSize={20}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>)}

      {activeReportTab === 'payroll' && (<div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="YTD Total Disbursed" value="₹61.2 Lakhs" icon={<CreditCard className="w-5 h-5"/>} iconBgColor="bg-emerald-50 text-emerald-600" caption="5 months FY 2026-27"/>
            <StatCard title="YTD Statutory Remittances" value="₹8.7 Lakhs" icon={<Building2 className="w-5 h-5"/>} iconBgColor="bg-blue-50 text-blue-600" caption="PF & Tax Deposited"/>
            <StatCard title="Avg Employee CTC" value="₹14.2 LPA" icon={<Users className="w-5 h-5"/>} iconBgColor="bg-purple-50 text-purple-600" caption="Technical consultancy benchmark"/>
          </div>

          <ChartCard title="Monthly Payroll Trend (₹ in Lakhs)" subtitle="Gross earnings vs net disbursements vs statutory tax withholding">
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={payrollCostData} margin={{ top: 10, right: 15, left: -15, bottom: 0 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9"/>
                <XAxis dataKey="month" stroke="#94A3B8" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={{ stroke: '#E2E8F0' }}/>
                <YAxis stroke="#94A3B8" tick={{ fontSize: 11, fill: '#64748B' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}L`}/>
                <Tooltip formatter={(val) => [`₹${val} Lakhs`, '']} contentStyle={{
                backgroundColor: '#0F172A',
                borderRadius: '8px',
                border: 'none',
                color: '#fff',
                fontSize: '12px',
            }}/>
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} formatter={(value) => <span className="text-slate-600 font-medium">{value}</span>}/>
                <Bar dataKey="gross" name="Gross Payroll" fill="#2B5B84" radius={[3, 3, 0, 0]} barSize={16}/>
                <Bar dataKey="net" name="Net Disbursed" fill="#10B981" radius={[3, 3, 0, 0]} barSize={16}/>
                <Bar dataKey="tax" name="Taxes & PF" fill="#FBBF24" radius={[3, 3, 0, 0]} barSize={16}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>)}

      {activeReportTab === 'leave' && (<div className="space-y-6">
          {/* Executive Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <StatCard title="Total Applications" value={`${misSummary.totalRequests}`} icon={<FileCheck2 className="w-5 h-5"/>} iconBgColor="bg-blue-50 text-blue-600" caption="Submissions logged"/>
            <StatCard title="Total Requested Days" value={`${misSummary.totalRequestedDays}d`} icon={<Calendar className="w-5 h-5"/>} iconBgColor="bg-purple-50 text-purple-600" caption="Across all categories"/>
            <StatCard title="Total Approved Days" value={`${misSummary.totalApprovedDays}d`} icon={<CheckCircle2 className="w-5 h-5"/>} iconBgColor="bg-emerald-50 text-emerald-600" caption="Quota deducted"/>
            <StatCard title="Partially Approved" value={`${misSummary.partiallyApprovedCount}`} icon={<Sliders className="w-5 h-5"/>} iconBgColor="bg-amber-50 text-amber-600" caption="Split decisions"/>
            <StatCard title="Rejected / Cancelled" value={`${misSummary.totalRejectedDays}d`} icon={<UserMinus className="w-5 h-5"/>} iconBgColor="bg-rose-50 text-rose-600" caption={`${misSummary.cancelledCount} cancelled`}/>
          </div>

          {/* Departmental Leave Distribution Chart */}
          <ChartCard title="Departmental Leave Utilization & Commitments (Working Days)" subtitle="Real-time breakdown of approved leave days, pending requests, and rejected durations by operating division" action={<div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981]"/>
                  <span>Approved Days</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B]"/>
                  <span>Pending Days</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#EF4444]"/>
                  <span>Rejected Days</span>
                </div>
              </div>}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={misDeptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9"/>
                <XAxis dataKey="department" stroke="#94A3B8" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={{ stroke: '#E2E8F0' }}/>
                <YAxis stroke="#94A3B8" tick={{ fontSize: 10, fill: '#64748B' }} tickLine={false} axisLine={false}/>
                <Tooltip content={({ active, payload }) => {
                if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (<div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                          <p className="font-bold border-b border-slate-700 pb-1">{data.department}</p>
                          <p className="text-emerald-300">Approved: <strong>{data.approved}d</strong></p>
                          <p className="text-amber-300">Pending: <strong>{data.pending}d</strong></p>
                          <p className="text-rose-300">Rejected: <strong>{data.rejected}d</strong></p>
                        </div>);
                }
                return null;
            }}/>
                <Bar dataKey="approved" fill="#10B981" radius={[2, 2, 0, 0]} barSize={18}/>
                <Bar dataKey="pending" fill="#F59E0B" radius={[2, 2, 0, 0]} barSize={18}/>
                <Bar dataKey="rejected" fill="#EF4444" radius={[2, 2, 0, 0]} barSize={18}/>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

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
          <ChartCard
            title="Expenditure & Claims by Category (₹ INR)"
            subtitle="Comparison of requested claim amounts vs authorized approved values and disbursed settlements"
            action={
              <div className="flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#4F6B92]" />
                  <span>Requested</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981]" />
                  <span>Approved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#0EA5E9]" />
                  <span>Settled</span>
                </div>
              </div>
            }
          >
            {expenseCategoryChartData.length === 0 ? (
              <div className="h-56 flex items-center justify-center text-slate-400 text-xs">
                No expense data available for the current filter selection.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={expenseCategoryChartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="category"
                    stroke="#94A3B8"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={{ stroke: '#E2E8F0' }}
                  />
                  <YAxis
                    stroke="#94A3B8"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const req = payload.find((p) => p.dataKey === 'requested')?.value || 0;
                        const app = payload.find((p) => p.dataKey === 'approved')?.value || 0;
                        const set = payload.find((p) => p.dataKey === 'settled')?.value || 0;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                            <p className="font-bold border-b border-slate-700 pb-1">{label}</p>
                            <p className="text-slate-300">Requested: <strong>₹{req.toLocaleString('en-IN')}</strong></p>
                            <p className="text-emerald-300">Approved: <strong>₹{app.toLocaleString('en-IN')}</strong></p>
                            <p className="text-sky-300">Settled: <strong>₹{set.toLocaleString('en-IN')}</strong></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="requested" fill="#4F6B92" radius={[2, 2, 0, 0]} barSize={16} />
                  <Bar dataKey="approved" fill="#10B981" radius={[2, 2, 0, 0]} barSize={16} />
                  <Bar dataKey="settled" fill="#0EA5E9" radius={[2, 2, 0, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

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
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search ref, employee, project..."
                    value={expenseSearch}
                    onChange={(e) => setExpenseSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-[#253344] bg-white dark:bg-[#16202C] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                        No expense or reimbursement records matched the filter criteria.
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

      {activeReportTab === 'department' && (<Card className="p-6">
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
        </Card>)}

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
            <ChartCard title="Division KPI vs Headcount Ratio" subtitle="Performance index correlation with team size">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={[
                { division: 'Geology', kpi: 4.6, headcount: 18 },
                { division: 'Mining', kpi: 4.8, headcount: 14 },
                { division: 'GIS & UAV', kpi: 4.5, headcount: 12 },
                { division: 'Hydrogeology', kpi: 4.1, headcount: 8 },
                { division: 'Finance', kpi: 4.7, headcount: 6 },
                { division: 'HR & IT', kpi: 4.4, headcount: 5 },
            ]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0"/>
                  <XAxis dataKey="division" tick={{ fontSize: 11, fill: '#64748B' }}/>
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }}/>
                  <Tooltip contentStyle={{
                backgroundColor: '#1E293B',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
            }}/>
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}/>
                  <Bar dataKey="kpi" name="Average KPI (out of 5)" fill="#1F6F78" radius={[4, 4, 0, 0]} barSize={16}/>
                  <Bar dataKey="headcount" name="Total Headcount" fill="#C8943A" radius={[4, 4, 0, 0]} barSize={16}/>
                </BarChart>
              </ResponsiveContainer>
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
