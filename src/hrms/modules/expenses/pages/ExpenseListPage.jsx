import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, CheckSquare, Filter, RotateCcw, Eye, Paperclip, CheckCircle2, MessageSquare, HelpCircle, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { useToast } from '@/contexts/ToastContext';
import { expenseService } from '@/modules/expenses/services/expense.service';
import { STANDARD_PROJECTS } from '@/core/constants/projects';
import { AttachmentPreviewModal } from '@/components/common/AttachmentPreviewModal';

export const ExpenseListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { currentRole } = useRole();
    const toast = useToast();

    const [expenses, setExpenses] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');
    const [selectedClaimDetails, setSelectedClaimDetails] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState(null);

    // Employee Query Response State
    const [isQueryResponseModalOpen, setIsQueryResponseModalOpen] = useState(false);
    const [selectedClaimForQuery, setSelectedClaimForQuery] = useState(null);
    const [queryResponseInput, setQueryResponseInput] = useState('');
    const [queryResponseError, setQueryResponseError] = useState('');
    const [isSubmittingQueryResponse, setIsSubmittingQueryResponse] = useState(false);

    const isEmp = currentRole === 'employee' || user?.role === 'employee';

    const loadExpenses = async () => {
        const data = await expenseService.getExpenses();
        if (isEmp) {
            if (!user?.employeeId) {
                setExpenses([]);
                return;
            }
            // Strict authoritative isolation by employeeId only
            setExpenses(data.filter((e) => e.employeeId === user.employeeId));
        } else {
            setExpenses(data);
        }
    };

    useEffect(() => {
        loadExpenses();
    }, [currentRole, user?.employeeId]);

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

    const handleOpenDetails = (exp) => {
        setSelectedClaimDetails(exp);
        setIsDetailsModalOpen(true);
    };

    const handleOpenQueryResponse = (exp) => {
        setSelectedClaimForQuery(exp);
        setQueryResponseInput('');
        setQueryResponseError('');
        setIsQueryResponseModalOpen(true);
    };

    const handleConfirmQueryResponse = async () => {
        if (!selectedClaimForQuery) return;
        if (!queryResponseInput.trim() || queryResponseInput.trim().length < 3) {
            setQueryResponseError('Please provide a clarification response.');
            return;
        }

        setIsSubmittingQueryResponse(true);
        try {
            await expenseService.respondQuery(selectedClaimForQuery.id, {
                response: queryResponseInput.trim(),
                respondedBy: user?.name || 'Employee',
            });
            toast.success(`Response to Finance query submitted on claim ${selectedClaimForQuery.expenseNumber}.`, 'Clarification Dispatched');
            setIsQueryResponseModalOpen(false);
            setSelectedClaimForQuery(null);
            loadExpenses();
        } catch (err) {
            setQueryResponseError(err.message || 'Failed to submit response');
        } finally {
            setIsSubmittingQueryResponse(false);
        }
    };

    const columns = [
        {
            key: 'expenseNumber',
            header: 'Claim Ref #',
            sortable: true,
            className: 'w-36 font-mono font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap',
            render: (e) => (
                <button 
                    onClick={() => handleOpenDetails(e)}
                    className="hover:underline font-mono text-xs font-bold text-blue-700 dark:text-blue-400 text-left cursor-pointer"
                >
                    {e.expenseNumber}
                </button>
            ),
        },
        ...(!isEmp ? [
            {
                key: 'employeeName',
                header: 'Claimant',
                sortable: true,
                className: 'min-w-[180px] whitespace-nowrap',
                render: (e) => (
                    <div>
                        <span className="font-bold text-slate-900 dark:text-white text-xs">{e.employeeName}</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{e.employeeId} • {e.department}</p>
                    </div>
                ),
            },
        ] : []),
        {
            key: 'category',
            header: 'Category',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (e) => <span className="font-medium text-slate-800 dark:text-slate-200 text-xs">{e.category}</span>,
        },
        {
            key: 'project',
            header: 'Project / Block',
            className: 'whitespace-nowrap',
            render: (e) => <span className="text-slate-700 dark:text-slate-300 text-xs font-semibold">{e.project}</span>,
        },
        {
            key: 'requestedAmount',
            header: 'Requested (₹)',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (e) => (
                <span className="text-xs font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
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
                <span className={`text-xs font-bold tabular-nums whitespace-nowrap ${
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
                <span className={`text-xs font-bold tabular-nums whitespace-nowrap ${
                    Number(e.rejectedAmount) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                }`}>
                    ₹{Number(e.rejectedAmount || 0).toLocaleString('en-IN')}
                </span>
            ),
        },
        {
            key: 'date',
            header: 'Expense Date',
            className: 'whitespace-nowrap',
            render: (e) => <span className="font-mono text-xs text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">{e.date}</span>,
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer group shadow-2xs max-w-[150px] truncate"
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
            className: 'text-right whitespace-nowrap',
            render: (e) => {
                const isClaimant = isEmp || (user?.employeeId && e.employeeId === user.employeeId);
                return (
                    <div className="flex items-center justify-end gap-1.5">
                        {isClaimant && e.queryStatus === 'Query Raised' && (
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={() => handleOpenQueryResponse(e)}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 px-2 font-bold animate-pulse"
                                leftIcon={<MessageSquare className="w-3.5 h-3.5"/>}
                            >
                                Respond to Query
                            </Button>
                        )}
                        <button 
                            onClick={() => handleOpenDetails(e)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-colors cursor-pointer"
                            title="View Full Details"
                        >
                            <Eye className="w-4 h-4"/>
                        </button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="space-y-3">
            <PageHeader 
                title={isEmp ? 'My Expense Claims' : 'Expense Claims'} 
                description={isEmp 
                    ? 'Your filed site inspection travel, equipment, and field operational claims.' 
                    : 'Site inspection travel, drone equipment purchases, and client engagement reimbursements.'} 
                breadcrumbs={[
                    { label: 'Dashboard', path: '/hr' },
                    { label: 'Expenses' },
                ]} 
                actions={
                    <div className="flex items-center gap-2">
                        {!isEmp && (
                            <Button variant="outline" size="sm" onClick={() => navigate('/hr/expenses/approvals')} leftIcon={<CheckSquare className="w-4 h-4 text-blue-600"/>}>
                                Approvals Queue
                            </Button>
                        )}
                        <Button variant="primary" size="sm" onClick={() => navigate('/hr/expenses/new')} leftIcon={<Plus className="w-4 h-4"/>}>
                            Submit Expense
                        </Button>
                    </div>
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
                            { value: 'Pending', label: 'Pending HR Review' },
                            { value: 'Approved', label: 'HR Approved' },
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

                {!isEmp && (
                    <>
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
                    </>
                )}

                {(selectedStatus !== 'all' || selectedCategory !== 'all' || (!isEmp && (selectedDept !== 'all' || selectedProject !== 'all'))) && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                            setSelectedStatus('all');
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
                searchPlaceholder={isEmp ? 'Search my expense claims...' : 'Search expense claims...'} 
                searchFields={isEmp ? ['expenseNumber', 'category', 'project', 'description'] : ['expenseNumber', 'employeeName', 'category', 'project', 'description']}
            />

            {/* Employee Query Response Modal (Requirement 6) */}
            <Modal
                isOpen={isQueryResponseModalOpen}
                onClose={() => setIsQueryResponseModalOpen(false)}
                title={`Respond to Finance Query — Claim #${selectedClaimForQuery?.expenseNumber}`}
                description="Finance has requested clarification on your expense claim."
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={() => setIsQueryResponseModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={handleConfirmQueryResponse}
                            disabled={isSubmittingQueryResponse}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                        >
                            {isSubmittingQueryResponse ? 'Submitting...' : 'Submit Clarification'}
                        </Button>
                    </>
                }
            >
                {selectedClaimForQuery && (
                    <div className="space-y-4 text-xs">
                        {queryResponseError && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0"/>
                                <span>{queryResponseError}</span>
                            </div>
                        )}

                        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-2 text-amber-900 dark:text-amber-200">
                            <div className="flex items-center gap-2 font-bold text-xs text-amber-800 dark:text-amber-300">
                                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0"/>
                                <span>Query from Finance ({selectedClaimForQuery.queryRaisedBy || 'Finance & Accounts'}):</span>
                            </div>
                            <p className="italic text-xs pl-6">
                                "{selectedClaimForQuery.queryMessage}"
                            </p>
                            {selectedClaimForQuery.queryRaisedOn && (
                                <p className="text-[10px] text-amber-700/80 dark:text-amber-400 pl-6">
                                    Raised on: {new Date(selectedClaimForQuery.queryRaisedOn).toLocaleString()}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                                Your Clarification / Explanation: <span className="text-rose-500">*</span>
                            </label>
                            <Textarea 
                                rows={3}
                                value={queryResponseInput}
                                onChange={(e) => {
                                    setQueryResponseInput(e.target.value);
                                    setQueryResponseError('');
                                }}
                                placeholder="Explain field equipment charges, missing invoice details, or itinerary breakdown..."
                            />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Claim Details Modal with Complete Lifecycle Audit */}
            <Modal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                title="Expense Claim Details & Lifecycle Audit"
                description={`Audit record for reference #${selectedClaimDetails?.expenseNumber}`}
                size="lg"
                footer={
                    <Button variant="outline" size="sm" onClick={() => setIsDetailsModalOpen(false)}>
                        Close
                    </Button>
                }
            >
                {selectedClaimDetails && (
                    <div className="space-y-4 text-xs">
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Claimant:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{selectedClaimDetails.employeeName} ({selectedClaimDetails.employeeId})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Department:</span>
                                <span>{selectedClaimDetails.department}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Project Block:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedClaimDetails.project}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Category:</span>
                                <span>{selectedClaimDetails.category}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Date Incurred:</span>
                                <span className="font-mono">{selectedClaimDetails.date}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Submitted On:</span>
                                <span className="font-mono">{selectedClaimDetails.submittedOn || 'N/A'}</span>
                            </div>
                        </div>

                        {/* Amount Reconciliation Card */}
                        <div className="p-3.5 bg-white dark:bg-[#16202C] border border-slate-200 dark:border-[#253344] rounded-xl grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Requested</span>
                                <p className="text-sm font-extrabold text-slate-900 dark:text-white mt-0.5">
                                    ₹{Number(selectedClaimDetails.requestedAmount || selectedClaimDetails.amount || 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                                <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">HR Approved</span>
                                <p className="text-sm font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">
                                    ₹{Number(selectedClaimDetails.approvedAmount || 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40">
                                <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block">HR Rejected</span>
                                <p className="text-sm font-extrabold text-rose-700 dark:text-rose-400 mt-0.5">
                                    ₹{Number(selectedClaimDetails.rejectedAmount || 0).toLocaleString('en-IN')}
                                </p>
                            </div>
                        </div>

                        {/* Justification & Receipt */}
                        <div className="space-y-2">
                            <label className="font-bold text-slate-700 dark:text-slate-300">Justification & Technical Scope</label>
                            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 italic">
                                "{selectedClaimDetails.description}"
                            </div>
                        </div>

                        {/* Attachment info */}
                        <div className="space-y-1.5">
                            <label className="font-bold text-slate-700 dark:text-slate-300">Supporting Attachment</label>
                            {selectedClaimDetails.receiptFileName ? (
                                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2.5 truncate mr-3">
                                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-400 shrink-0">
                                            <Paperclip className="w-4 h-4"/>
                                        </div>
                                        <div className="truncate">
                                            <p className="font-semibold text-xs truncate">{selectedClaimDetails.receiptFileName}</p>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                                                {selectedClaimDetails.receiptFileSize ? `${(selectedClaimDetails.receiptFileSize / (1024 * 1024)).toFixed(2)} MB • ` : ''}Verified receipt document
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPreviewAttachment(selectedClaimDetails)}
                                        className="text-xs h-8 px-3 font-semibold text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 shrink-0"
                                        leftIcon={<Eye className="w-3.5 h-3.5"/>}
                                    >
                                        View Document
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-slate-400 italic">No receipt attached to this claim.</p>
                            )}
                        </div>

                        {/* Query & Clarification Thread */}
                        {selectedClaimDetails.queryMessage && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg space-y-1.5">
                                <span className="font-bold text-amber-800 dark:text-amber-300 block">Finance Query History:</span>
                                <p className="italic text-amber-900 dark:text-amber-200">"{selectedClaimDetails.queryMessage}"</p>
                                {selectedClaimDetails.queryResponse && (
                                    <div className="pt-1.5 border-t border-amber-200/60 text-slate-700 dark:text-slate-300">
                                        <span className="font-semibold block text-slate-500">Employee Clarification:</span>
                                        <p className="italic">"{selectedClaimDetails.queryResponse}"</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Chronological Lifecycle Audit Trail */}
                        <div>
                            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
                                Chronological Lifecycle Audit Trail
                            </h4>
                            <div className="relative pl-6 space-y-3 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-700">
                                {(selectedClaimDetails.auditHistory || []).map((step, idx) => (
                                    <div key={step.id || idx} className="relative">
                                        <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-teal-600 ring-4 ring-white dark:ring-[#142028]"/>
                                        <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                                <span className="font-bold text-xs text-slate-900 dark:text-white">
                                                    [{step.stage}] {step.action}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {new Date(step.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-300">
                                                {step.details}
                                            </p>
                                            {step.remarks && (
                                                <p className="text-[11px] text-slate-500 italic mt-0.5">
                                                    Notes: "{step.remarks}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Settlement Summary if Disbursed */}
                        {selectedClaimDetails.settlementStatus === 'Settled' && (
                            <div className="p-2.5 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 text-teal-800 dark:text-teal-300 space-y-0.5 text-[11px]">
                                <p className="font-bold flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5"/> Disbursed & Settled
                                </p>
                                <p>Settlement Date: {selectedClaimDetails.settlementDate || selectedClaimDetails.settledOn || 'N/A'} • Ref: {selectedClaimDetails.settlementReference || 'Internal Accounts'}</p>
                                <p>Disbursed by: {selectedClaimDetails.settledBy || 'Finance & Accounts'} • Amount: ₹{Number(selectedClaimDetails.settledAmount || selectedClaimDetails.approvedAmount || 0).toLocaleString('en-IN')}</p>
                            </div>
                        )}
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
                    loadExpenses();
                }}
            />
        </div>
    );
};
