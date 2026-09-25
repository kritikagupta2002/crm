import React, { useState, useEffect, useMemo } from 'react';
import { 
    Clock, CheckCircle2, XCircle, HelpCircle, ShieldCheck, 
    Paperclip, MessageSquare, Eye, 
    RotateCcw, Receipt, Wallet, AlertCircle, History
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { expenseService } from '@/modules/expenses/services/expense.service';
import { reimbursementService } from '@/modules/reimbursement/services/reimbursement.service';
import { STANDARD_PROJECTS } from '@/core/constants/projects';
import { AttachmentPreviewModal } from '@/components/common/AttachmentPreviewModal';

export const FinanceExpenseClaimsPage = () => {
    const { user } = useAuth();
    const toast = useToast();

    const [expenses, setExpenses] = useState([]);
    const [reimbursements, setReimbursements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Filters
    const [typeFilter, setTypeFilter] = useState('all'); // all | expense | reimbursement
    const [financeStatusFilter, setFinanceStatusFilter] = useState('all'); // all | 'Pending Review' | 'Approved' | 'Rejected' | 'Query Raised' | 'Settled'
    const [deptFilter, setDeptFilter] = useState('all');
    const [projectFilter, setProjectFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [employeeFilter, setEmployeeFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal States
    const [selectedClaim, setSelectedClaim] = useState(null);
    const [previewAttachment, setPreviewAttachment] = useState(null);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [approveRemarks, setApproveRemarks] = useState('');

    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectRemarks, setRejectRemarks] = useState('');

    const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);
    const [queryMessage, setQueryMessage] = useState('');

    const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
    const [resolveRemarks, setResolveRemarks] = useState('');

    const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
    const [paymentMode, setPaymentMode] = useState('Direct Bank Transfer (NEFT)');
    const [bankAccount, setBankAccount] = useState('HDFC Corporate Current A/c - 5020001892');
    const [settlementRef, setSettlementRef] = useState('');
    const [isSettling, setIsSettling] = useState(false);

    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);

    const loadAllClaims = async () => {
        setIsLoading(true);
        try {
            const [expData, rmbData] = await Promise.all([
                expenseService.getExpenses(),
                reimbursementService.getClaims()
            ]);
            setExpenses(expData || []);
            setReimbursements(rmbData || []);
        } catch (err) {
            toast.error('Failed to load expense and reimbursement claims', 'Error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAllClaims();
    }, []);

    // Combine all claims into a unified schema for finance review
    const unifiedClaims = useMemo(() => {
        const exp = (expenses || []).map((e) => ({
            ...e,
            claimType: 'Expense',
            refNumber: e.expenseNumber,
            requested: Number(e.requestedAmount !== undefined ? e.requestedAmount : e.amount || 0),
            hrApproved: Number(e.hrApprovedAmount !== undefined ? e.hrApprovedAmount : e.approvedAmount || 0),
            hrRejected: Number(e.hrRejectedAmount !== undefined ? e.hrRejectedAmount : e.rejectedAmount || 0),
            service: expenseService,
        }));

        const rmb = (reimbursements || []).map((r) => ({
            ...r,
            claimType: 'Reimbursement',
            refNumber: r.claimId,
            requested: Number(r.claimAmount !== undefined ? r.claimAmount : r.requestedAmount || 0),
            hrApproved: Number(r.hrApprovedAmount !== undefined ? r.hrApprovedAmount : r.approvedAmount || 0),
            hrRejected: Number(r.hrRejectedAmount !== undefined ? r.hrRejectedAmount : r.rejectedAmount || 0),
            service: reimbursementService,
        }));

        return [...exp, ...rmb];
    }, [expenses, reimbursements]);

    // Live Metrics (Requirement 20: NO FAKE NUMBERS)
    const metrics = useMemo(() => {
        // Finance only reviews claims that have passed HR Verification (Approved or Partially Approved)
        const hrQualified = unifiedClaims.filter(c => c.hrStatus === 'Approved' || c.hrStatus === 'Partially Approved');

        const pendingReview = hrQualified.filter(c => c.financeStatus === 'Pending Review' && c.queryStatus !== 'Query Raised').length;
        const queriesOutstanding = hrQualified.filter(c => c.queryStatus === 'Query Raised').length;
        const queriesResponded = hrQualified.filter(c => c.queryStatus === 'Employee Responded').length;
        const financeApproved = hrQualified.filter(c => c.financeStatus === 'Approved').length;
        const financeRejected = hrQualified.filter(c => c.financeStatus === 'Rejected').length;
        const readyForSettlement = hrQualified.filter(c => c.financeStatus === 'Approved' && c.settlementStatus !== 'Settled' && c.queryStatus !== 'Query Raised').length;
        const settledClaims = unifiedClaims.filter(c => c.settlementStatus === 'Settled' || c.status === 'Settled');
        const totalSettledAmount = settledClaims.reduce((sum, c) => sum + Number(c.settledAmount || c.approvedAmount || 0), 0);

        return {
            pendingReview,
            queriesOutstanding,
            queriesResponded,
            financeApproved,
            financeRejected,
            readyForSettlement,
            totalSettledAmount,
            settledCount: settledClaims.length
        };
    }, [unifiedClaims]);

    // Distinct filter options
    const departments = useMemo(() => {
        const set = new Set();
        unifiedClaims.forEach(c => { if (c.department) set.add(c.department); });
        return Array.from(set).sort();
    }, [unifiedClaims]);

    const categories = useMemo(() => {
        const set = new Set();
        unifiedClaims.forEach(c => { if (c.category) set.add(c.category); });
        return Array.from(set).sort();
    }, [unifiedClaims]);

    const employees = useMemo(() => {
        const map = new Map();
        unifiedClaims.forEach(c => {
            if (c.employeeId && !map.has(c.employeeId)) {
                map.set(c.employeeId, `${c.employeeName} (${c.employeeId})`);
            }
        });
        return Array.from(map.entries()).map(([id, label]) => ({ value: id, label }));
    }, [unifiedClaims]);

    // Filtered Claims
    const filteredClaims = useMemo(() => {
        return unifiedClaims.filter((c) => {
            // Type Filter
            if (typeFilter !== 'all' && c.claimType.toLowerCase() !== typeFilter.toLowerCase()) {
                return false;
            }

            // Finance Status Filter
            if (financeStatusFilter === 'pending') {
                if (c.financeStatus !== 'Pending Review' || c.queryStatus === 'Query Raised') return false;
            } else if (financeStatusFilter === 'queries') {
                if (c.queryStatus !== 'Query Raised' && c.queryStatus !== 'Employee Responded') return false;
            } else if (financeStatusFilter === 'approved') {
                if (c.financeStatus !== 'Approved') return false;
            } else if (financeStatusFilter === 'rejected') {
                if (c.financeStatus !== 'Rejected') return false;
            } else if (financeStatusFilter === 'ready_settle') {
                if (c.financeStatus !== 'Approved' || c.settlementStatus === 'Settled' || c.queryStatus === 'Query Raised') return false;
            } else if (financeStatusFilter === 'settled') {
                if (c.settlementStatus !== 'Settled' && c.status !== 'Settled') return false;
            }

            // Department
            if (deptFilter !== 'all' && c.department !== deptFilter) return false;

            // Project
            if (projectFilter !== 'all' && c.project !== projectFilter) return false;

            // Category
            if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;

            // Employee
            if (employeeFilter !== 'all' && c.employeeId !== employeeFilter) return false;

            // Search
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const match = (c.employeeName && c.employeeName.toLowerCase().includes(q)) ||
                              (c.employeeId && c.employeeId.toLowerCase().includes(q)) ||
                              (c.refNumber && c.refNumber.toLowerCase().includes(q)) ||
                              (c.category && c.category.toLowerCase().includes(q)) ||
                              (c.project && c.project.toLowerCase().includes(q));
                if (!match) return false;
            }

            return true;
        });
    }, [unifiedClaims, typeFilter, financeStatusFilter, deptFilter, projectFilter, categoryFilter, employeeFilter, searchQuery]);

    // Action Handlers
    const handleOpenApprove = (claim) => {
        setSelectedClaim(claim);
        setApproveRemarks('Verified supporting tax invoices and field exploration ledger. Approved for disbursement.');
        setIsApproveModalOpen(true);
    };

    const handleConfirmApprove = async () => {
        if (!selectedClaim) return;
        try {
            const svc = selectedClaim.claimType === 'Expense' ? expenseService : reimbursementService;
            await svc.financeApprove(selectedClaim.id, {
                reviewerName: user?.name || 'Chhavi Bansal (Finance Head)',
                remarks: approveRemarks.trim() || 'Verified and approved by Finance',
            });
            toast.success(`Claim ${selectedClaim.refNumber} verified and approved for settlement.`, 'Finance Approved');
            setIsApproveModalOpen(false);
            setSelectedClaim(null);
            loadAllClaims();
        } catch (err) {
            toast.error(err.message || 'Failed to approve claim', 'Approval Error');
        }
    };

    const handleOpenReject = (claim) => {
        setSelectedClaim(claim);
        setRejectRemarks('Rejected due to duplicate billing or ineligible GST invoice.');
        setIsRejectModalOpen(true);
    };

    const handleConfirmReject = async () => {
        if (!selectedClaim) return;
        try {
            const svc = selectedClaim.claimType === 'Expense' ? expenseService : reimbursementService;
            await svc.financeReject(selectedClaim.id, {
                reviewerName: user?.name || 'Chhavi Bansal (Finance Head)',
                remarks: rejectRemarks.trim() || 'Rejected during Finance audit',
            });
            toast.success(`Claim ${selectedClaim.refNumber} rejected by Finance.`, 'Finance Rejected');
            setIsRejectModalOpen(false);
            setSelectedClaim(null);
            loadAllClaims();
        } catch (err) {
            toast.error(err.message || 'Failed to reject claim', 'Rejection Error');
        }
    };

    const handleOpenQuery = (claim) => {
        setSelectedClaim(claim);
        setQueryMessage('Please provide the original tax invoice and clarify the additional site allowance charge.');
        setIsQueryModalOpen(true);
    };

    const handleConfirmQuery = async () => {
        if (!selectedClaim) return;
        try {
            const svc = selectedClaim.claimType === 'Expense' ? expenseService : reimbursementService;
            await svc.raiseQuery(selectedClaim.id, {
                raisedBy: user?.name || 'Chhavi Bansal (Finance Head)',
                message: queryMessage.trim(),
            });
            toast.success(`Clarification query raised on claim ${selectedClaim.refNumber}. Settlement blocked until resolved.`, 'Query Dispatched');
            setIsQueryModalOpen(false);
            setSelectedClaim(null);
            loadAllClaims();
        } catch (err) {
            toast.error(err.message || 'Failed to raise query', 'Query Error');
        }
    };

    const handleOpenResolve = (claim) => {
        setSelectedClaim(claim);
        setResolveRemarks('Clarification response accepted. Supporting document verified.');
        setIsResolveModalOpen(true);
    };

    const handleConfirmResolve = async () => {
        if (!selectedClaim) return;
        try {
            const svc = selectedClaim.claimType === 'Expense' ? expenseService : reimbursementService;
            await svc.resolveQuery(selectedClaim.id, {
                resolvedBy: user?.name || 'Chhavi Bansal (Finance Head)',
                remarks: resolveRemarks.trim(),
            });
            toast.success(`Query on claim ${selectedClaim.refNumber} marked resolved.`, 'Query Resolved');
            setIsResolveModalOpen(false);
            setSelectedClaim(null);
            loadAllClaims();
        } catch (err) {
            toast.error(err.message || 'Failed to resolve query', 'Error');
        }
    };

    const handleOpenSettle = (claim) => {
        setSelectedClaim(claim);
        setSettlementRef(`PAY-${claim.claimType === 'Expense' ? 'EXP' : 'RMB'}-${Date.now().toString().slice(-6)}`);
        setPaymentMode('Direct Bank Transfer (NEFT)');
        setBankAccount('HDFC Corporate Current A/c - 5020001892');
        setIsSettleModalOpen(true);
    };

    const handleConfirmSettle = async () => {
        if (!selectedClaim) return;
        setIsSettling(true);
        try {
            const svc = selectedClaim.claimType === 'Expense' ? expenseService : reimbursementService;
            if (selectedClaim.claimType === 'Expense') {
                await svc.settleExpense(selectedClaim.id, {
                    settledBy: user?.name || 'Chhavi Bansal (Finance Head)',
                    settlementReference: settlementRef.trim(),
                    paymentMode,
                    bankAccount,
                    settlementDate: new Date().toLocaleDateString('en-CA'),
                });
            } else {
                await svc.settleClaim(selectedClaim.id, {
                    settledBy: user?.name || 'Chhavi Bansal (Finance Head)',
                    settlementReference: settlementRef.trim(),
                    paymentMode,
                    bankAccount,
                    settlementDate: new Date().toLocaleDateString('en-CA'),
                });
            }
            toast.success(`Disbursed ₹${selectedClaim.hrApproved.toLocaleString('en-IN')} for claim ${selectedClaim.refNumber}. Journal entries posted to books.`, 'Claim Settled');
            setIsSettleModalOpen(false);
            setSelectedClaim(null);
            loadAllClaims();
        } catch (err) {
            toast.error(err.message || 'Settlement failed', 'Settlement Failure');
        } finally {
            setIsSettling(false);
        }
    };

    const handleOpenAudit = (claim) => {
        setSelectedClaim(claim);
        setIsAuditModalOpen(true);
    };

    const columns = [
        {
            key: 'refNumber',
            header: 'Claim Ref #',
            sortable: true,
            className: 'w-32 whitespace-nowrap',
            render: (c) => (
                <div className="flex flex-col">
                    <button 
                        onClick={() => handleOpenAudit(c)}
                        className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 hover:underline text-left cursor-pointer"
                    >
                        {c.refNumber}
                    </button>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        {c.date || c.submittedOn}
                    </span>
                </div>
            ),
        },
        {
            key: 'claimType',
            header: 'Type',
            sortable: true,
            className: 'w-24 whitespace-nowrap',
            render: (c) => (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    c.claimType === 'Expense' 
                        ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40' 
                        : 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/40'
                }`}>
                    {c.claimType === 'Expense' ? <Receipt className="w-3 h-3"/> : <RotateCcw className="w-3 h-3"/>}
                    {c.claimType}
                </span>
            ),
        },
        {
            key: 'employeeName',
            header: 'Claimant',
            sortable: true,
            className: 'min-w-[170px] whitespace-nowrap',
            render: (c) => (
                <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{c.employeeName}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{c.employeeId} • {c.department}</p>
                </div>
            ),
        },
        {
            key: 'project',
            header: 'Project / Block',
            sortable: true,
            className: 'whitespace-nowrap max-w-[160px] truncate',
            render: (c) => (
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs truncate" title={c.project}>
                    {c.project}
                </span>
            ),
        },
        {
            key: 'category',
            header: 'Category',
            className: 'whitespace-nowrap',
            render: (c) => <span className="text-slate-600 dark:text-slate-400 text-xs">{c.category}</span>,
        },
        {
            key: 'requested',
            header: 'Requested (₹)',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (c) => (
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                    ₹{c.requested.toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'hrApproved',
            header: 'HR Approved (₹)',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (c) => (
                <div>
                    <span className={`text-xs font-bold tabular-nums ${
                        c.hrApproved > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                    }`}>
                        ₹{c.hrApproved.toLocaleString('en-IN')}
                    </span>
                    {c.hrRejected > 0 && (
                        <p className="text-[10px] text-rose-600 dark:text-rose-400 tabular-nums">
                            -₹{c.hrRejected.toLocaleString('en-IN')} rej
                        </p>
                    )}
                </div>
            ),
        },
        {
            key: 'attachment',
            header: 'Attachment',
            className: 'whitespace-nowrap',
            render: (c) => c.receiptFileName ? (
                <button
                    type="button"
                    onClick={(ev) => {
                        ev.stopPropagation();
                        setPreviewAttachment(c);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer group shadow-2xs max-w-[140px] truncate"
                    title={`Click to view photo: ${c.receiptFileName}`}
                >
                    <Paperclip className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform"/>
                    <span className="truncate">{c.receiptFileName}</span>
                    <Eye className="w-3 h-3 shrink-0 ml-0.5 opacity-60 group-hover:opacity-100 text-blue-600 dark:text-blue-400"/>
                </button>
            ) : (
                <span className="text-[11px] text-slate-400 italic">None</span>
            ),
        },
        {
            key: 'financeStatus',
            header: 'Finance Status',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (c) => (
                <div className="flex flex-col gap-0.5">
                    <StatusBadge status={c.financeStatus === 'None' ? (c.hrStatus === 'Rejected' ? 'HR Rejected' : 'Pending HR') : c.financeStatus} size="sm"/>
                    {c.queryStatus !== 'No Query' && (
                        <StatusBadge status={c.queryStatus} size="sm"/>
                    )}
                </div>
            ),
        },
        {
            key: 'settlementStatus',
            header: 'Settlement',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (c) => (
                <StatusBadge status={c.settlementStatus === 'None' ? 'Not Payable' : c.settlementStatus} size="sm"/>
            ),
        },
        {
            key: 'actions',
            header: 'Finance Actions',
            className: 'text-right whitespace-nowrap min-w-[180px]',
            render: (c) => {
                const canApproveReject = (c.hrStatus === 'Approved' || c.hrStatus === 'Partially Approved') && 
                                          c.financeStatus === 'Pending Review' && 
                                          c.queryStatus !== 'Query Raised';

                const hasOutstandingQuery = c.queryStatus === 'Query Raised';
                const hasEmployeeResponse = c.queryStatus === 'Employee Responded';
                const canSettle = c.financeStatus === 'Approved' && 
                                  c.settlementStatus !== 'Settled' && 
                                  c.queryStatus !== 'Query Raised';

                return (
                    <div className="flex items-center justify-end gap-1.5">
                        {canApproveReject && (
                            <>
                                <Button 
                                    variant="primary" 
                                    size="sm" 
                                    onClick={() => handleOpenApprove(c)}
                                    className="text-xs h-7 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white"
                                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5"/>}
                                    title="Verify and Approve Payable Amount"
                                >
                                    Approve
                                </Button>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleOpenQuery(c)}
                                    className="text-xs h-7 px-2 border-amber-400 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                    leftIcon={<HelpCircle className="w-3.5 h-3.5"/>}
                                    title="Raise Clarification Query"
                                >
                                    Query
                                </Button>
                                <button 
                                    onClick={() => handleOpenReject(c)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                                    title="Reject Claim"
                                >
                                    <XCircle className="w-4 h-4"/>
                                </button>
                            </>
                        )}

                        {hasOutstandingQuery && (
                            <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200">
                                Query Pending
                            </span>
                        )}

                        {hasEmployeeResponse && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleOpenResolve(c)}
                                className="text-xs h-7 px-2 border-blue-400 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                leftIcon={<MessageSquare className="w-3.5 h-3.5"/>}
                            >
                                Review Response
                            </Button>
                        )}

                        {canSettle && (
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={() => handleOpenSettle(c)}
                                className="text-xs h-7 px-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold"
                                leftIcon={<Wallet className="w-3.5 h-3.5"/>}
                            >
                                Settle Claim
                            </Button>
                        )}

                        {c.settlementStatus === 'Settled' && (
                            <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200">
                                {c.settlementReference || 'Settled'}
                            </span>
                        )}

                        <button 
                            onClick={() => handleOpenAudit(c)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Audit Trail"
                        >
                            <History className="w-4 h-4"/>
                        </button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader 
                title="Expense & Reimbursement Audit" 
                description="Finance verification, clarification queries, and payment disbursement for HR-approved employee claims." 
                breadcrumbs={[
                    { label: 'Dashboard', path: '/hr' },
                    { label: 'Finance & Accounting', path: '/finance' },
                    { label: 'Claims Verification & Settlement' },
                ]} 
                actions={
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={loadAllClaims}
                            leftIcon={<RotateCcw className="w-4 h-4"/>}
                        >
                            Refresh Queue
                        </Button>
                    </div>
                }
            />

            {/* Live Metrics Grid (Requirement 20) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
                <StatCard 
                    title="Pending Finance" 
                    value={String(metrics.pendingReview)} 
                    caption="Awaiting audit" 
                    icon={<Clock className="w-4 h-4 text-amber-700 dark:text-amber-300"/>} 
                    iconBgColor="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300"
                    onClick={() => setFinanceStatusFilter('pending')}
                />
                <StatCard 
                    title="Queries Active" 
                    value={String(metrics.queriesOutstanding)} 
                    caption={`${metrics.queriesResponded} responded`} 
                    icon={<HelpCircle className="w-4 h-4 text-purple-700 dark:text-purple-300"/>} 
                    iconBgColor="bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300"
                    onClick={() => setFinanceStatusFilter('queries')}
                />
                <StatCard 
                    title="Finance Approved" 
                    value={String(metrics.financeApproved)} 
                    caption="Audit cleared" 
                    icon={<CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-300"/>} 
                    iconBgColor="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                    onClick={() => setFinanceStatusFilter('approved')}
                />
                <StatCard 
                    title="Ready for Payment" 
                    value={String(metrics.readyForSettlement)} 
                    caption="Can disburse" 
                    icon={<Wallet className="w-4 h-4 text-teal-700 dark:text-teal-300"/>} 
                    iconBgColor="bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300"
                    onClick={() => setFinanceStatusFilter('ready_settle')}
                />
                <StatCard 
                    title="Finance Rejected" 
                    value={String(metrics.financeRejected)} 
                    caption="Declined by books" 
                    icon={<XCircle className="w-4 h-4 text-rose-700 dark:text-rose-300"/>} 
                    iconBgColor="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300"
                    onClick={() => setFinanceStatusFilter('rejected')}
                />
                <StatCard 
                    title="Total Disbursed" 
                    value={`₹${(metrics.totalSettledAmount / 1000).toFixed(1)}k`} 
                    caption={`${metrics.settledCount} claims settled`} 
                    icon={<ShieldCheck className="w-4 h-4 text-blue-700 dark:text-blue-300"/>} 
                    iconBgColor="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                    onClick={() => setFinanceStatusFilter('settled')}
                />
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-[#142028] p-4 rounded-xl border border-slate-200/80 dark:border-[#253344] shadow-xs space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="w-48">
                        <Select 
                            value={typeFilter} 
                            onChange={(e) => setTypeFilter(e.target.value)}
                            options={[
                                { value: 'all', label: 'All Claim Types' },
                                { value: 'expense', label: 'Expenses Only' },
                                { value: 'reimbursement', label: 'Reimbursements Only' },
                            ]}
                        />
                    </div>
                    <div className="w-52">
                        <Select 
                            value={financeStatusFilter} 
                            onChange={(e) => setFinanceStatusFilter(e.target.value)}
                            options={[
                                { value: 'all', label: 'All Review States' },
                                { value: 'pending', label: 'Pending Finance Review' },
                                { value: 'queries', label: 'Queries Raised / Responded' },
                                { value: 'approved', label: 'Finance Approved' },
                                { value: 'ready_settle', label: 'Ready for Settlement' },
                                { value: 'rejected', label: 'Finance Rejected' },
                                { value: 'settled', label: 'Settled & Disbursed' },
                            ]}
                        />
                    </div>
                    <div className="w-48">
                        <Select 
                            value={deptFilter} 
                            onChange={(e) => setDeptFilter(e.target.value)}
                            options={[
                                { value: 'all', label: 'All Departments' },
                                ...departments.map(d => ({ value: d, label: d }))
                            ]}
                        />
                    </div>
                    <div className="w-52">
                        <Select 
                            value={projectFilter} 
                            onChange={(e) => setProjectFilter(e.target.value)}
                            options={[
                                { value: 'all', label: 'All Project Sites' },
                                ...STANDARD_PROJECTS.map(p => ({ value: p, label: p }))
                            ]}
                        />
                    </div>
                    <div className="w-48">
                        <Select 
                            value={categoryFilter} 
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            options={[
                                { value: 'all', label: 'All Categories' },
                                ...categories.map(c => ({ value: c, label: c }))
                            ]}
                        />
                    </div>
                    <div className="w-56">
                        <Select 
                            value={employeeFilter} 
                            onChange={(e) => setEmployeeFilter(e.target.value)}
                            options={[
                                { value: 'all', label: 'All Claimants' },
                                ...employees
                            ]}
                        />
                    </div>
                    <div className="flex-1 min-w-[200px]">
                        <Input 
                            placeholder="Search by ref #, employee, project..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {(typeFilter !== 'all' || financeStatusFilter !== 'all' || deptFilter !== 'all' || projectFilter !== 'all' || categoryFilter !== 'all' || employeeFilter !== 'all' || searchQuery) && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                                setTypeFilter('all');
                                setFinanceStatusFilter('all');
                                setDeptFilter('all');
                                setProjectFilter('all');
                                setCategoryFilter('all');
                                setEmployeeFilter('all');
                                setSearchQuery('');
                            }}
                            className="text-xs text-slate-500"
                        >
                            Reset Filters
                        </Button>
                    )}
                </div>
            </div>

            {/* Claims DataTable */}
            <DataTable 
                columns={columns} 
                data={filteredClaims} 
                keyField={(c) => `${c.claimType}-${c.id}`}
                loading={isLoading} 
                emptyMessage="No expense or reimbursement claims found matching the filter criteria." 
            />

            {/* 1. Finance Approval Modal */}
            <Modal 
                isOpen={isApproveModalOpen} 
                onClose={() => setIsApproveModalOpen(false)}
                title="Finance Review Verification & Clearance"
                size="md"
            >
                {selectedClaim && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-slate-500">Claim Reference:</span>
                                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{selectedClaim.refNumber} ({selectedClaim.claimType})</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-slate-500">Employee:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedClaim.employeeName} ({selectedClaim.employeeId})</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-slate-500">Project / Site:</span>
                                <span className="text-slate-700 dark:text-slate-300">{selectedClaim.project}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="font-semibold text-slate-500">Employee Requested:</span>
                                <span className="font-mono tabular-nums text-slate-600">₹{selectedClaim.requested.toLocaleString('en-IN')}</span>
                            </div>
                            {selectedClaim.receiptFileName && (
                                <div className="flex justify-between items-center py-0.5">
                                    <span className="font-semibold text-slate-500">Supporting Bill:</span>
                                    <button
                                        type="button"
                                        onClick={() => setPreviewAttachment(selectedClaim)}
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                                    >
                                        <Paperclip className="w-3.5 h-3.5 text-blue-600"/>
                                        <span className="truncate max-w-[150px]">{selectedClaim.receiptFileName}</span>
                                        <Eye className="w-3.5 h-3.5 text-blue-600"/>
                                    </button>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700">
                                <span className="font-bold text-emerald-800 dark:text-emerald-400">HR Approved Payable Amount:</span>
                                <span className="font-mono font-bold text-base text-emerald-700 dark:text-emerald-400 tabular-nums">
                                    ₹{selectedClaim.hrApproved.toLocaleString('en-IN')}
                                </span>
                            </div>
                            {selectedClaim.hrRejected > 0 && (
                                <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                                    <span>HR Rejected Portion:</span>
                                    <span className="font-mono font-semibold tabular-nums">-₹{selectedClaim.hrRejected.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {selectedClaim.hrRemarks && (
                                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                    <span className="font-semibold text-slate-500 block mb-1">HR Reviewer Notes:</span>
                                    <p className="italic text-slate-700 dark:text-slate-300">"{selectedClaim.hrRemarks}"</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-lg border border-amber-200 dark:border-amber-800/40 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>
                            <span>
                                Finance verification validates supporting tax bills against project budgets. 
                                <strong> Payable amount is strictly locked to ₹{selectedClaim.hrApproved.toLocaleString('en-IN')}</strong> (cannot exceed HR approved ceiling).
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Finance Verification Remarks:
                            </label>
                            <Textarea 
                                rows={2}
                                value={approveRemarks}
                                onChange={(e) => setApproveRemarks(e.target.value)}
                                placeholder="Audit notes, GST verification status..."
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => setIsApproveModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={handleConfirmApprove}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white"
                                leftIcon={<CheckCircle2 className="w-4 h-4"/>}
                            >
                                Confirm Finance Approval
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* 2. Raise Clarification Query Modal */}
            <Modal 
                isOpen={isQueryModalOpen} 
                onClose={() => setIsQueryModalOpen(false)}
                title="Raise Finance Clarification Query"
                size="md"
            >
                {selectedClaim && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Claimant:</span>
                                <span className="font-bold">{selectedClaim.employeeName} ({selectedClaim.employeeId})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Claim:</span>
                                <span className="font-mono font-bold">{selectedClaim.refNumber} • ₹{selectedClaim.hrApproved.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        <div className="bg-purple-50 dark:bg-purple-950/40 p-3 rounded-lg border border-purple-200 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-300 flex items-start gap-2">
                            <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-purple-600"/>
                            <span>
                                Raising a query <strong>blocks claim settlement</strong> until the employee reviews and submits a clarification response.
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Query Message for Employee: <span className="text-rose-500">*</span>
                            </label>
                            <Textarea 
                                rows={3}
                                value={queryMessage}
                                onChange={(e) => setQueryMessage(e.target.value)}
                                placeholder="State clearly what information, receipt, or invoice is missing..."
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => setIsQueryModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={handleConfirmQuery}
                                className="bg-purple-700 hover:bg-purple-800 text-white"
                                leftIcon={<HelpCircle className="w-4 h-4"/>}
                            >
                                Dispatch Query
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* 3. Review Response & Resolve Query Modal */}
            <Modal 
                isOpen={isResolveModalOpen} 
                onClose={() => setIsResolveModalOpen(false)}
                title="Review Employee Query Response"
                size="md"
            >
                {selectedClaim && (
                    <div className="space-y-4">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
                            <div>
                                <span className="font-semibold text-slate-500 block mb-1">Original Finance Query:</span>
                                <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200">
                                    "{selectedClaim.queryMessage}"
                                    <p className="text-[10px] text-slate-400 mt-1">Raised on: {new Date(selectedClaim.queryRaisedOn).toLocaleString()}</p>
                                </div>
                            </div>

                            <div>
                                <span className="font-semibold text-slate-500 block mb-1">Employee Clarification:</span>
                                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded border border-blue-200 dark:border-blue-800/40 text-blue-900 dark:text-blue-200 font-medium">
                                    "{selectedClaim.queryResponse || 'No response recorded yet'}"
                                    {selectedClaim.queryRespondedOn && (
                                        <p className="text-[10px] text-slate-400 mt-1">Responded on: {new Date(selectedClaim.queryRespondedOn).toLocaleString()}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Resolution Notes:
                            </label>
                            <Textarea 
                                rows={2}
                                value={resolveRemarks}
                                onChange={(e) => setResolveRemarks(e.target.value)}
                                placeholder="Verification remarks upon accepting response..."
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => setIsResolveModalOpen(false)}>
                                Close
                            </Button>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={handleConfirmResolve}
                                className="bg-blue-700 hover:bg-blue-800 text-white"
                                leftIcon={<CheckCircle2 className="w-4 h-4"/>}
                            >
                                Accept & Mark Query Resolved
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* 4. Finance Rejection Modal */}
            <Modal 
                isOpen={isRejectModalOpen} 
                onClose={() => setIsRejectModalOpen(false)}
                title="Reject Claim in Finance Audit"
                size="md"
            >
                {selectedClaim && (
                    <div className="space-y-4">
                        <div className="bg-rose-50 dark:bg-rose-950/40 p-3 rounded-lg border border-rose-200 dark:border-rose-800/40 text-xs text-rose-900 dark:text-rose-300 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600"/>
                            <span>
                                Rejecting this claim in Finance marks it as permanently rejected. It will <strong>never become payable or settled</strong>.
                            </span>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                Rejection Justification: <span className="text-rose-500">*</span>
                            </label>
                            <Textarea 
                                rows={3}
                                value={rejectRemarks}
                                onChange={(e) => setRejectRemarks(e.target.value)}
                                placeholder="State regulatory or policy violation reason..."
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => setIsRejectModalOpen(false)}>
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={handleConfirmReject}
                                className="bg-rose-700 hover:bg-rose-800 text-white"
                                leftIcon={<XCircle className="w-4 h-4"/>}
                            >
                                Confirm Permanent Rejection
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* 5. Settlement / Payment Disbursement Modal */}
            <Modal 
                isOpen={isSettleModalOpen} 
                onClose={() => setIsSettleModalOpen(false)}
                title="Execute Payment Disbursement & Accounting Entry"
                size="md"
            >
                {selectedClaim && (
                    <div className="space-y-4">
                        <div className="bg-teal-50 dark:bg-teal-950/40 p-4 rounded-xl border border-teal-200 dark:border-teal-800/40 text-xs space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-teal-800 dark:text-teal-300 font-semibold">Beneficiary:</span>
                                <span className="font-bold text-slate-900 dark:text-white text-sm">{selectedClaim.employeeName}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-teal-800 dark:text-teal-300 font-semibold">Claim Number:</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedClaim.refNumber}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-teal-200 dark:border-teal-800/40">
                                <span className="text-teal-900 dark:text-teal-200 font-bold text-sm">Disbursement Amount:</span>
                                <span className="font-mono font-black text-xl text-teal-800 dark:text-teal-200 tabular-nums">
                                    ₹{selectedClaim.hrApproved.toLocaleString('en-IN')}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Payment Method:
                                </label>
                                <Select 
                                    value={paymentMode}
                                    onChange={(e) => setPaymentMode(e.target.value)}
                                    options={[
                                        { value: 'Direct Bank Transfer (NEFT)', label: 'Direct Bank Transfer (NEFT)' },
                                        { value: 'Immediate Payment (IMPS)', label: 'Immediate Payment (IMPS)' },
                                        { value: 'Real Time Gross Settlement (RTGS)', label: 'Real Time Gross Settlement (RTGS)' },
                                        { value: 'Corporate Debit Card Reimbursement', label: 'Corporate Debit Card Reimbursement' },
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Disbursing Bank Account:
                                </label>
                                <Select 
                                    value={bankAccount}
                                    onChange={(e) => setBankAccount(e.target.value)}
                                    options={[
                                        { value: 'HDFC Corporate Current A/c - 5020001892', label: 'HDFC Corporate Current A/c (Jaipur HQ)' },
                                        { value: 'SBI Project Operations A/c - 3901124801', label: 'SBI Project Operations A/c (Bhilwara Site)' },
                                        { value: 'ICICI Remote Exploration Imprest - 10098412', label: 'ICICI Remote Exploration Imprest' },
                                    ]}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Disbursement / UTR Reference #:
                                </label>
                                <Input 
                                    value={settlementRef}
                                    onChange={(e) => setSettlementRef(e.target.value)}
                                    placeholder="UTR / Transaction Ref"
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] text-slate-600 dark:text-slate-400">
                            Upon confirmation, this action automatically posts a <strong>Payment Voucher</strong> to the General Ledger and records a financial cash outflow in the Finance module.
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2">
                            <Button variant="outline" size="sm" onClick={() => setIsSettleModalOpen(false)} disabled={isSettling}>
                                Cancel
                            </Button>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={handleConfirmSettle}
                                loading={isSettling}
                                className="bg-teal-700 hover:bg-teal-800 text-white font-bold"
                                leftIcon={<CheckCircle2 className="w-4 h-4"/>}
                            >
                                Disburse & Settle
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* 6. Complete Audit Trail / History Modal */}
            <Modal 
                isOpen={isAuditModalOpen} 
                onClose={() => setIsAuditModalOpen(false)}
                title="Claim Full Lifecycle & Audit History"
                size="lg"
            >
                {selectedClaim && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                            <div>
                                <span className="text-slate-500 block">Claim ID</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">{selectedClaim.refNumber}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Claimant</span>
                                <span className="font-semibold text-slate-900 dark:text-white">{selectedClaim.employeeName}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">HR Approved</span>
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">₹{selectedClaim.hrApproved.toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Finance Status</span>
                                <StatusBadge status={selectedClaim.financeStatus} size="sm"/>
                            </div>
                        </div>

                        {/* Supporting Attachment */}
                        {selectedClaim.receiptFileName && (
                            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs">
                                <div className="flex items-center gap-2.5 truncate mr-3">
                                    <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400">
                                        <Paperclip className="w-4 h-4"/>
                                    </div>
                                    <div className="truncate">
                                        <span className="font-semibold truncate block">{selectedClaim.receiptFileName}</span>
                                        <span className="text-[10px] text-slate-500 dark:text-slate-400">Attached Document</span>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPreviewAttachment(selectedClaim)}
                                    className="text-xs h-7 px-2.5 font-semibold text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 shrink-0"
                                    leftIcon={<Eye className="w-3.5 h-3.5"/>}
                                >
                                    View Document
                                </Button>
                            </div>
                        )}

                        <div>
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                                Chronological Lifecycle Audit Trail
                            </h4>
                            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                                {(selectedClaim.auditHistory || []).map((step, idx) => (
                                    <div key={step.id || idx} className="relative">
                                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white dark:ring-[#142028]"/>
                                        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                                    [{step.stage}] {step.action}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {new Date(step.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600 dark:text-slate-300">
                                                {step.details}
                                            </p>
                                            {step.remarks && (
                                                <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded">
                                                    Notes: "{step.remarks}"
                                                </p>
                                            )}
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Actor: <span className="font-semibold text-slate-600 dark:text-slate-300">{step.actor}</span>
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                            <Button variant="outline" size="sm" onClick={() => setIsAuditModalOpen(false)}>
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Photo / Attachment Preview Modal */}
            <AttachmentPreviewModal 
                isOpen={!!previewAttachment} 
                onClose={() => setPreviewAttachment(null)} 
                attachment={previewAttachment} 
                onAttachmentUpdated={(updated) => {
                    setPreviewAttachment(updated);
                    loadAllClaims();
                }}
            />
        </div>
    );
};
