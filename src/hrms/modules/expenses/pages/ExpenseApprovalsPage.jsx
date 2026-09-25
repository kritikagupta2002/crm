import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ArrowLeft, Filter, RotateCcw, Paperclip, ShieldAlert, Eye } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Textarea } from '@/components/common/Textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { expenseService } from '@/modules/expenses/services/expense.service';
import { STANDARD_PROJECTS } from '@/core/constants/projects';
import { AttachmentPreviewModal } from '@/components/common/AttachmentPreviewModal';

export const ExpenseApprovalsPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const toast = useToast();

    const [expenses, setExpenses] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('Pending');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');

    // Review Modal State
    const [selectedExp, setSelectedExp] = useState(null);
    const [approvedAmountInput, setApprovedAmountInput] = useState('');
    const [remarks, setRemarks] = useState('');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [reviewError, setReviewError] = useState('');
    const [previewAttachment, setPreviewAttachment] = useState(null);

    const loadExpenses = async () => {
        const data = await expenseService.getExpenses();
        setExpenses(data);
    };

    useEffect(() => {
        loadExpenses();
    }, []);

    const filteredExpenses = expenses.filter((e) => {
        if (selectedStatus !== 'all' && e.status !== selectedStatus)
            return false;
        if (selectedCategory !== 'all' && !e.category.toLowerCase().includes(selectedCategory.toLowerCase()))
            return false;
        if (selectedDept !== 'all' && e.department !== selectedDept)
            return false;
        if (selectedProject !== 'all' && e.project !== selectedProject)
            return false;
        return true;
    });

    const handleOpenReview = (exp, presetAction = 'Full') => {
        setSelectedExp(exp);
        const req = Number(exp.requestedAmount !== undefined ? exp.requestedAmount : exp.amount || 0);
        setReviewError('');
        
        if (presetAction === 'Reject') {
            setApprovedAmountInput('0');
            setRemarks('Rejected due to missing original GST voucher or outside project budget.');
        } else if (presetAction === 'Partial') {
            const half = Math.round(req / 2);
            setApprovedAmountInput(String(half));
            setRemarks('Partially approved based on permissible project per diem and site allowance limits.');
        } else {
            setApprovedAmountInput(String(req));
            setRemarks('Verified against exploration project field log and tax invoice.');
        }
        setIsReviewModalOpen(true);
    };

    const handleConfirmReview = async () => {
        if (!selectedExp) return;
        const req = Number(selectedExp.requestedAmount !== undefined ? selectedExp.requestedAmount : selectedExp.amount || 0);
        const appr = Number(approvedAmountInput);

        if (isNaN(appr) || appr < 0) {
            setReviewError('Approved amount cannot be negative.');
            return;
        }
        if (appr > req) {
            setReviewError(`Approved amount (₹${appr.toLocaleString('en-IN')}) cannot exceed requested amount (₹${req.toLocaleString('en-IN')}).`);
            return;
        }

        try {
            const updated = await expenseService.reviewExpense(selectedExp.id, {
                approvedAmount: appr,
                reviewerName: user?.name || 'Dr. Amit Kumar Bansal',
                remarks: remarks.trim() || 'Reviewed by Management',
            });
            toast.success(`Claim ${selectedExp.expenseNumber} verified as '${updated.status}' and forwarded to Finance.`, `Claim Adjudicated`);
            setIsReviewModalOpen(false);
            loadExpenses();
        } catch (err) {
            setReviewError(err.message || 'Failed to update claim review');
        }
    };

    // Auto-calculate dynamic status & rejected amount in Review Modal
    const reqAmount = selectedExp ? Number(selectedExp.requestedAmount !== undefined ? selectedExp.requestedAmount : selectedExp.amount || 0) : 0;
    const currentApprovedNum = Number(approvedAmountInput) || 0;
    const calculatedRejected = Math.max(0, reqAmount - currentApprovedNum);
    const computedStatus = currentApprovedNum === reqAmount 
        ? 'Approved' 
        : currentApprovedNum === 0 
            ? 'Rejected' 
            : 'Partially Approved';

    const columns = [
        {
            key: 'submittedOn',
            header: 'Filed Date',
            sortable: true,
            className: 'font-mono text-xs whitespace-nowrap w-24 tabular-nums',
        },
        {
            key: 'employeeName',
            header: 'Claimant',
            sortable: true,
            className: 'min-w-[170px] whitespace-nowrap',
            render: (e) => (
                <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">{e.employeeName}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{e.employeeId} • {e.department}</p>
                </div>
            ),
        },
        {
            key: 'project',
            header: 'Project Block',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (e) => <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{e.project}</span>,
        },
        {
            key: 'category',
            header: 'Category',
            className: 'whitespace-nowrap',
            render: (e) => <span className="text-slate-600 dark:text-slate-400 text-xs">{e.category}</span>,
        },
        {
            key: 'requestedAmount',
            header: 'Requested (₹)',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (e) => (
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums">
                    ₹{Number(e.requestedAmount !== undefined ? e.requestedAmount : e.amount).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'approvedAmount',
            header: 'Approved (₹)',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (e) => (
                <span className={`text-xs font-bold tabular-nums ${
                    Number(e.approvedAmount) > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                }`}>
                    ₹{Number(e.approvedAmount || 0).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'rejectedAmount',
            header: 'Rejected (₹)',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (e) => (
                <span className={`text-xs font-bold tabular-nums ${
                    Number(e.rejectedAmount) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                }`}>
                    ₹{Number(e.rejectedAmount || 0).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'receipt',
            header: 'Attachment',
            className: 'whitespace-nowrap',
            render: (e) => e.receiptFileName ? (
                <button
                    type="button"
                    onClick={(ev) => {
                        ev.stopPropagation();
                        setPreviewAttachment(e);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer group shadow-2xs max-w-[140px] truncate"
                    title={`Click to view photo: ${e.receiptFileName}`}
                >
                    <Paperclip className="w-3.5 h-3.5 shrink-0 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform"/>
                    <span className="truncate">{e.receiptFileName}</span>
                    <Eye className="w-3 h-3 shrink-0 ml-0.5 opacity-60 group-hover:opacity-100 text-blue-600 dark:text-blue-400"/>
                </button>
            ) : (
                <span className="text-[11px] text-slate-400 italic">None</span>
            ),
        },
        {
            key: 'hrStatus',
            header: 'HR Decision',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (e) => <StatusBadge status={e.hrStatus || e.status} size="sm"/>,
        },
        {
            key: 'financeStatus',
            header: 'Finance Audit',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (e) => (
                <div className="flex flex-col gap-0.5">
                    <StatusBadge status={e.financeStatus === 'None' ? (e.hrStatus === 'Rejected' ? 'None' : 'Pending HR') : e.financeStatus} size="sm"/>
                    {e.queryStatus && e.queryStatus !== 'No Query' && (
                        <StatusBadge status={e.queryStatus} size="sm"/>
                    )}
                </div>
            ),
        },
        {
            key: 'settlementStatus',
            header: 'Settlement',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (e) => <StatusBadge status={e.settlementStatus === 'None' ? 'Not Payable' : (e.settlementStatus || 'Pending')} size="sm"/>,
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right whitespace-nowrap min-w-[150px]',
            render: (e) => {
                if (e.status === 'Pending') {
                    return (
                        <div className="flex items-center justify-end gap-1.5">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleOpenReview(e, 'Partial')}
                                className="text-xs h-7 px-2"
                            >
                                Partial
                            </Button>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={() => handleOpenReview(e, 'Full')} 
                                className="text-xs h-7 px-2.5"
                                leftIcon={<Check className="w-3.5 h-3.5"/>}
                            >
                                Verify
                            </Button>
                            <button 
                                onClick={() => handleOpenReview(e, 'Reject')} 
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 rounded-lg transition-colors cursor-pointer" 
                                title="Quick Reject"
                            >
                                <X className="w-4 h-4"/>
                            </button>
                        </div>
                    );
                }

                if (e.status === 'Approved' || e.status === 'Partially Approved') {
                    return (
                        <div className="flex items-center justify-end gap-1.5">
                            {e.settlementStatus === 'Settled' ? (
                                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                                    Disbursed ({e.settlementReference})
                                </span>
                            ) : (
                                <span className="text-[11px] text-slate-500 font-medium">
                                    {e.financeStatus === 'Approved' ? 'Ready for Finance Disbursement' : e.queryStatus === 'Query Raised' ? 'Finance Query Active' : 'Forwarded to Finance'}
                                </span>
                            )}
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => navigate('/finance/claims')}
                                className="text-[11px] h-6 px-1.5 text-teal-700 hover:text-teal-800"
                            >
                                View Finance
                            </Button>
                        </div>
                    );
                }

                return (
                    <span className="text-[11px] text-slate-400 italic whitespace-nowrap">
                        {e.approvedBy ? `Reviewed: ${e.approvedBy}` : 'Completed'}
                    </span>
                );
            },
        },
    ];

    return (
        <div className="space-y-3">
            <PageHeader 
                title="Expense Claim Approvals" 
                description="Managerial review, partial approval adjudication, and accounts settlement on field claims." 
                breadcrumbs={[
                    { label: 'Dashboard', path: '/hr' },
                    { label: 'Expenses', path: '/hr/expenses' },
                    { label: 'Approvals' },
                ]} 
                actions={
                    <Button variant="outline" size="sm" onClick={() => navigate('/hr/expenses')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
                        Back to Expenses
                    </Button>
                }
            />

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 bg-white dark:bg-[#1A2430] p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-[#253344] shadow-xs">
                <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300 mr-1">
                    <Filter className="w-3.5 h-3.5 text-amber-500"/>
                    <span>Filters:</span>
                </div>

                <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[130px]">
                    <Select 
                        options={[
                            { value: 'all', label: 'All Statuses' },
                            { value: 'Pending', label: 'Pending Queue' },
                            { value: 'Approved', label: 'Approved' },
                            { value: 'Partially Approved', label: 'Partially Approved' },
                            { value: 'Rejected', label: 'Rejected' },
                            { value: 'Settled', label: 'Settled' },
                        ]} 
                        value={selectedStatus} 
                        onChange={(e) => setSelectedStatus(e.target.value)}
                    />
                </div>

                <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[140px]">
                    <Select 
                        options={[
                            { value: 'all', label: 'All Categories' },
                            { value: 'Travel', label: 'Travel & Transit' },
                            { value: 'Equipment', label: 'Survey Equipment' },
                            { value: 'Accommodation', label: 'Accommodation' },
                            { value: 'Fuel', label: 'Fuel & Transportation' },
                            { value: 'Client', label: 'Client Meeting & Meals' },
                            { value: 'Software', label: 'Software & Licenses' },
                        ]} 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)}
                    />
                </div>

                <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[140px]">
                    <Select 
                        options={[
                            { value: 'all', label: 'All Departments' },
                            { value: 'Geology & Mineral Exploration', label: 'Geology & Exploration' },
                            { value: 'Mining & Mine Planning', label: 'Mining & Planning' },
                            { value: 'GIS, Remote Sensing & UAV', label: 'GIS & Remote Sensing' },
                            { value: 'Hydrogeology & Groundwater', label: 'Hydrogeology' },
                            { value: 'Finance & Mineral Economics', label: 'Finance & Economics' },
                            { value: 'Human Resources & Admin', label: 'HR & Admin' },
                        ]} 
                        value={selectedDept} 
                        onChange={(e) => setSelectedDept(e.target.value)}
                    />
                </div>

                <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[170px]">
                    <Select 
                        options={[
                            { value: 'all', label: 'All Projects / Sites' },
                            ...STANDARD_PROJECTS.map((p) => ({ value: p, label: p })),
                        ]} 
                        value={selectedProject} 
                        onChange={(e) => setSelectedProject(e.target.value)}
                    />
                </div>

                {(selectedStatus !== 'Pending' || selectedCategory !== 'all' || selectedDept !== 'all' || selectedProject !== 'all') && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                            setSelectedStatus('Pending');
                            setSelectedCategory('all');
                            setSelectedDept('all');
                            setSelectedProject('all');
                        }} 
                        className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs flex items-center justify-center gap-1 w-full xs:w-auto"
                    >
                        <RotateCcw className="w-3 h-3"/>
                        <span>Reset</span>
                    </Button>
                )}

                <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto hidden md:inline">
                    Showing <strong>{filteredExpenses.length}</strong> of <strong>{expenses.length}</strong> claims
                </span>
            </div>

            <DataTable 
                compact={true} 
                columns={columns} 
                data={filteredExpenses} 
                keyField="id" 
                searchPlaceholder="Search claims by staff, reference, or project..." 
                searchFields={['employeeName', 'expenseNumber', 'project', 'category']}
            />

            {/* Adjudication Modal with Partial Approval & Reconciliation */}
            <Modal 
                isOpen={isReviewModalOpen} 
                onClose={() => setIsReviewModalOpen(false)} 
                title={`Adjudicate Expense Claim #${selectedExp?.expenseNumber}`} 
                description={`Review and authorize payment for ${selectedExp?.employeeName}.`} 
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={() => setIsReviewModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            variant={computedStatus === 'Rejected' ? 'danger' : 'primary'} 
                            size="sm" 
                            onClick={handleConfirmReview}
                        >
                            Confirm {computedStatus}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 text-xs">
                    {reviewError && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0"/>
                            <span>{reviewError}</span>
                        </div>
                    )}

                    {/* Claim Details Summary */}
                    <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
                        <div className="flex justify-between">
                            <span className="text-slate-500">Claimant:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{selectedExp?.employeeName} ({selectedExp?.employeeId})</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Project Block:</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedExp?.project}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500">Category:</span>
                            <span>{selectedExp?.category}</span>
                        </div>
                        <div className="flex justify-between items-center py-0.5">
                            <span className="text-slate-500">Attachment:</span>
                            {selectedExp?.receiptFileName ? (
                                <button
                                    type="button"
                                    onClick={() => setPreviewAttachment(selectedExp)}
                                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                                >
                                    <Paperclip className="w-3.5 h-3.5 text-blue-600"/>
                                    <span className="truncate max-w-[150px]">{selectedExp.receiptFileName}</span>
                                    <Eye className="w-3.5 h-3.5 text-blue-600"/>
                                </button>
                            ) : (
                                <span>No attachment provided</span>
                            )}
                        </div>
                        <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 italic text-slate-600 dark:text-slate-300">
                            "{selectedExp?.description}"
                        </div>
                    </div>

                    {/* Amount Adjudication Card */}
                    <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/30 space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="font-bold text-slate-800 dark:text-slate-200">
                                Approved Amount to Authorize (₹)
                            </label>
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400">
                                Result: {computedStatus}
                            </span>
                        </div>

                        <Input 
                            type="number" 
                            min="0"
                            max={reqAmount}
                            value={approvedAmountInput} 
                            onChange={(e) => {
                                setApprovedAmountInput(e.target.value);
                                setReviewError('');
                            }}
                            helperText={`Requested total: ₹${reqAmount.toLocaleString('en-IN')}`}
                            className="font-mono text-base font-bold"
                        />

                        {/* Live Reconciliation Ledger */}
                        <div className="grid grid-cols-3 gap-2 text-center pt-1">
                            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Requested</span>
                                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">₹{reqAmount.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Payable</span>
                                <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">₹{currentApprovedNum.toLocaleString('en-IN')}</p>
                            </div>
                            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800">
                                <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block">Rejected</span>
                                <p className="text-xs font-extrabold text-rose-700 dark:text-rose-400 mt-0.5">₹{calculatedRejected.toLocaleString('en-IN')}</p>
                            </div>
                        </div>
                    </div>

                    <Textarea 
                        label="Approver / Auditor Remarks" 
                        value={remarks} 
                        onChange={(e) => setRemarks(e.target.value)} 
                        placeholder="State technical justification, invoice voucher numbers, or policy rejection grounds..."
                        rows={2}
                    />
                </div>
            </Modal>

            {/* Photo / Attachment Preview Modal */}
            <AttachmentPreviewModal 
                isOpen={!!previewAttachment} 
                onClose={() => setPreviewAttachment(null)} 
                attachment={previewAttachment} 
                onAttachmentUpdated={(updated) => {
                    setPreviewAttachment(updated);
                    loadExpenses();
                }}
            />
        </div>
    );
};
