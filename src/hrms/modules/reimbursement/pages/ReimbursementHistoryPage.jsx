import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Filter } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { useToast } from '@/contexts/ToastContext';
import { reimbursementService } from '@/modules/reimbursement/services/reimbursement.service';

export const ReimbursementHistoryPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { currentRole } = useRole();
    const toast = useToast();

    const [claims, setClaims] = useState([]);
    const [viewMode, setViewMode] = useState('all'); // 'all' | 'settled'
    const isEmp = currentRole === 'employee' || user?.role === 'employee';

    useEffect(() => {
        const load = async () => {
            const data = await reimbursementService.getClaims();
            if (isEmp) {
                if (!user?.employeeId) {
                    setClaims([]);
                    return;
                }
                setClaims(data.filter((c) => c.employeeId === user.employeeId));
            } else {
                setClaims(data);
            }
        };
        load();
    }, [currentRole, user?.employeeId]);

    const displayClaims = claims.filter((c) => {
        if (viewMode === 'settled') {
            return c.status === 'Settled';
        }
        return true;
    });

    const handleExportCSV = () => {
        if (displayClaims.length === 0) {
            toast.error('No reimbursement records available to export.', 'Export Empty');
            return;
        }

        const headers = [
            'Claim ID',
            'Employee ID',
            'Employee Name',
            'Department',
            'Category',
            'Claimed Amount (INR)',
            'Approved Amount (INR)',
            'Rejected Amount (INR)',
            'Claim Date',
            'Status',
            'Settlement Date',
            'Settlement Reference',
            'Disbursed By',
            'Remarks',
        ];

        const rows = displayClaims.map((c) => [
            `"${c.claimId || ''}"`,
            `"${c.employeeId || ''}"`,
            `"${c.employeeName || ''}"`,
            `"${c.department || ''}"`,
            `"${c.category || ''}"`,
            Number(c.claimAmount || 0),
            Number(c.approvedAmount || 0),
            Number(c.rejectedAmount || (c.claimAmount - c.approvedAmount) || 0),
            `"${c.date || ''}"`,
            `"${c.status || ''}"`,
            `"${c.settlementDate || c.disbursementDate || 'Pending Disbursal'}"`,
            `"${c.settlementReference || 'N/A'}"`,
            `"${c.settledBy || 'Finance & Accounts'}"`,
            `"${(c.remarks || c.reviewRemarks || '').replace(/"/g, '""')}"`,
        ]);

        const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const today = new Date().toLocaleDateString('en-CA');
        link.setAttribute('href', url);
        link.setAttribute('download', isEmp ? `My_Reimbursement_Statement_${today}.csv` : `Company_Reimbursement_Report_${today}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.success(isEmp ? 'Your personal reimbursement statement downloaded.' : 'Reimbursement audit report exported.', 'Export Complete');
    };

    const columns = [
        {
            key: 'claimId',
            header: 'Claim ID',
            sortable: true,
            className: 'w-32 whitespace-nowrap',
            render: (c) => (
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 tabular-nums">
                    {c.claimId}
                </span>
            ),
        },
        ...(!isEmp ? [
            {
                key: 'employeeName',
                header: 'Staff Member',
                sortable: true,
                className: 'min-w-[170px] whitespace-nowrap',
                render: (c) => (
                    <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{c.employeeName}</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{c.employeeId}</p>
                    </div>
                ),
            },
        ] : []),
        {
            key: 'category',
            header: 'Allowance Category',
            sortable: true,
            className: 'whitespace-nowrap',
        },
        {
            key: 'claimAmount',
            header: 'Claimed (₹)',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (c) => (
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                    ₹{Number(c.claimAmount || 0).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'approvedAmount',
            header: 'Approved (₹)',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (c) => (
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    ₹{Number(c.approvedAmount || 0).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'rejectedAmount',
            header: 'Rejected (₹)',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (c) => (
                <span className={`text-xs font-bold tabular-nums ${Number(c.rejectedAmount) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                    ₹{Number(c.rejectedAmount || 0).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'date',
            header: 'Claim Date',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (c) => <span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">{c.date}</span>,
        },
        {
            key: 'disbursementDate',
            header: 'Disbursal Date',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (c) => (
                <span className="text-xs text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
                    {c.settlementDate || c.disbursementDate || (c.status === 'Settled' ? 'Disbursed' : 'Pending Disbursal')}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (c) => <StatusBadge status={c.status} size="sm"/>,
        },
    ];

    return (
        <div className="space-y-3">
            <PageHeader 
                title={isEmp ? 'My Reimbursement History' : 'Reimbursement Audit & History'} 
                description={isEmp 
                    ? 'Historical ledger of your filed, reviewed, and disbursed corporate allowances.' 
                    : 'Historical ledger of corporate allowance requests, approvals, and accounts settlements.'} 
                breadcrumbs={[
                    { label: 'Dashboard', path: '/hr' },
                    { label: 'Reimbursement', path: '/hr/reimbursement' },
                    { label: 'History' },
                ]} 
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate('/hr/reimbursement')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
                            Back to Claims
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleExportCSV} leftIcon={<Download className="w-4 h-4"/>}>
                            {isEmp ? 'Download Statement (CSV)' : 'Export Audit Log (CSV)'}
                        </Button>
                    </div>
                }
            />

            {/* View Mode Filters */}
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-[#1A2430] rounded-xl border border-slate-200 dark:border-[#253344] shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 mr-2">
                    <Filter className="w-3.5 h-3.5 text-amber-500"/>
                    <span>Filter View:</span>
                </div>
                <div className="w-48">
                    <Select 
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        options={[
                            { value: 'all', label: 'All Claim History' },
                            { value: 'settled', label: 'Disbursed / Settled Only' },
                        ]}
                    />
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto pr-2">
                    Showing <strong>{displayClaims.length}</strong> records
                </span>
            </div>

            <DataTable 
                compact={true} 
                columns={columns} 
                data={displayClaims} 
                keyField="id" 
                searchPlaceholder={isEmp ? 'Search my settlement records...' : 'Search historical records...'} 
                searchFields={isEmp ? ['claimId', 'category', 'remarks'] : ['claimId', 'employeeName', 'category', 'remarks']}
            />
        </div>
    );
};
