import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, History, RotateCcw, Check, X, Paperclip, ShieldAlert, Eye, MessageSquare, HelpCircle } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { DatePicker } from '@/components/common/DatePicker';
import { Textarea } from '@/components/common/Textarea';
import { FileUpload } from '@/components/common/FileUpload';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { useToast } from '@/contexts/ToastContext';
import { reimbursementService } from '@/modules/reimbursement/services/reimbursement.service';
import { getEmployeeProjectById, STANDARD_PROJECTS } from '@/core/constants/projects';
import { AttachmentPreviewModal } from '@/components/common/AttachmentPreviewModal';
import { attachmentStorage } from '@/core/storage/attachmentStorage';

export const ReimbursementListPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { currentRole } = useRole();
    const toast = useToast();

    const isEmp = currentRole === 'employee' || user?.role === 'employee';

    const [claims, setClaims] = useState([]);
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [previewAttachment, setPreviewAttachment] = useState(null);

    // Filters
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');

    // Claim Form State (Employee)
    const [category, setCategory] = useState('Mobile & Internet');
    const [claimProject, setClaimProject] = useState(() => getEmployeeProjectById(user?.employeeId));
    const [claimAmount, setClaimAmount] = useState('2500');
    const [claimDate, setClaimDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [remarks, setRemarks] = useState('');
    const [uploadedFile, setUploadedFile] = useState(null);
    const [formError, setFormError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Review Modal State (HR)
    const [selectedClaimForReview, setSelectedClaimForReview] = useState(null);
    const [approvedAmountInput, setApprovedAmountInput] = useState('');
    const [reviewRemarksInput, setReviewRemarksInput] = useState('');
    const [reviewError, setReviewError] = useState('');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    // Employee Query Response State
    const [isQueryResponseModalOpen, setIsQueryResponseModalOpen] = useState(false);
    const [selectedClaimForQuery, setSelectedClaimForQuery] = useState(null);
    const [queryResponseInput, setQueryResponseInput] = useState('');
    const [queryResponseError, setQueryResponseError] = useState('');
    const [isSubmittingQueryResponse, setIsSubmittingQueryResponse] = useState(false);

    // Details & Audit Modal State
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedClaimDetails, setSelectedClaimDetails] = useState(null);

    const loadClaims = async () => {
        const data = await reimbursementService.getClaims();
        if (isEmp) {
            if (!user?.employeeId) {
                setClaims([]);
                return;
            }
            // Strict authoritative isolation by employeeId only
            setClaims(data.filter((c) => c.employeeId === user.employeeId));
        } else {
            setClaims(data);
        }
    };

    useEffect(() => {
        loadClaims();
    }, [currentRole, user?.employeeId]);

    const filteredClaims = claims.filter((c) => {
        if (selectedStatus !== 'all' && c.status !== selectedStatus)
            return false;
        if (selectedCategory !== 'all' && c.category !== selectedCategory)
            return false;
        if (!isEmp && selectedDept !== 'all' && c.department !== selectedDept)
            return false;
        if (!isEmp && selectedProject !== 'all' && getEmployeeProjectById(c.employeeId) !== selectedProject)
            return false;
        return true;
    });

    const handleOpenSubmitModal = () => {
        setCategory('Mobile & Internet');
        setClaimProject(getEmployeeProjectById(user?.employeeId));
        setClaimAmount('2500');
        setClaimDate(new Date().toLocaleDateString('en-CA'));
        setRemarks('');
        setUploadedFile(null);
        setFormError('');
        setIsClaimModalOpen(true);
    };

    const handleSubmitClaim = async () => {
        if (!user?.employeeId) {
            setFormError('Authentication session invalid. Please log in again.');
            return;
        }

        const amt = Number(claimAmount);
        if (isNaN(amt) || amt <= 0) {
            setFormError('Valid claim amount greater than ₹0 is required.');
            return;
        }

        const today = new Date().toLocaleDateString('en-CA');
        if (!claimDate || claimDate > today) {
            setFormError('Claim date is required and cannot be in the future.');
            return;
        }

        if (!remarks || remarks.trim().length < 5) {
            setFormError('Please enter at least 5 characters of justification/remarks.');
            return;
        }

        setIsSubmitting(true);
        try {
            let receiptPreviewUrl = null;
            if (uploadedFile) {
                const stored = await attachmentStorage.saveFile(uploadedFile.name, uploadedFile);
                if (stored) {
                    receiptPreviewUrl = stored.previewDataUrl;
                }
            }

            const submitted = await reimbursementService.submitClaim({
                employeeId: user.employeeId,
                employeeName: user.name || 'Staff Member',
                department: user.department || 'Operations',
                project: claimProject || getEmployeeProjectById(user.employeeId),
                category,
                claimAmount: amt,
                date: claimDate,
                remarks: remarks.trim(),
                receiptFileName: uploadedFile ? uploadedFile.name : null,
                receiptFileSize: uploadedFile ? uploadedFile.size : null,
                receiptFileType: uploadedFile ? uploadedFile.type : null,
                receiptUrl: receiptPreviewUrl,
                receiptDataUrl: receiptPreviewUrl,
            });

            if (uploadedFile && submitted?.claimId) {
                await attachmentStorage.saveFile(submitted.claimId, uploadedFile);
            }

            toast.success(`Reimbursement claim for ₹${amt.toLocaleString('en-IN')} submitted.`, 'Claim Submitted');
            setIsClaimModalOpen(false);
            loadClaims();
        } catch (err) {
            setFormError(err.message || 'Failed to submit reimbursement claim');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenReview = (claim, preset = 'Full') => {
        setSelectedClaimForReview(claim);
        const req = Number(claim.claimAmount || 0);
        setReviewError('');

        if (preset === 'Reject') {
            setApprovedAmountInput('0');
            setReviewRemarksInput('Rejected due to policy limit or missing required bills.');
        } else if (preset === 'Partial') {
            const half = Math.round(req / 2);
            setApprovedAmountInput(String(half));
            setReviewRemarksInput('Partially approved based on permissible allowance schedule.');
        } else {
            setApprovedAmountInput(String(req));
            setReviewRemarksInput('Verified against monthly corporate policy and approved.');
        }
        setIsReviewModalOpen(true);
    };

    const handleConfirmReview = async () => {
        if (!selectedClaimForReview) return;
        const req = Number(selectedClaimForReview.claimAmount || 0);
        const appr = Number(approvedAmountInput);

        if (isNaN(appr) || appr < 0) {
            setReviewError('Approved amount cannot be negative.');
            return;
        }
        if (appr > req) {
            setReviewError(`Approved amount (₹${appr.toLocaleString('en-IN')}) cannot exceed claimed amount (₹${req.toLocaleString('en-IN')}).`);
            return;
        }

        try {
            const updated = await reimbursementService.reviewClaim(selectedClaimForReview.id, {
                approvedAmount: appr,
                reviewerName: user?.name || 'Kritika Gupta (Head HR)',
                remarks: reviewRemarksInput.trim() || 'Reviewed by HR',
            });
            toast.success(`Claim ${selectedClaimForReview.claimId} recorded as '${updated.status}' and forwarded to Finance.`, 'Claim Adjudicated');
            setIsReviewModalOpen(false);
            setSelectedClaimForReview(null);
            loadClaims();
        } catch (err) {
            setReviewError(err.message || 'Failed to review claim');
        }
    };

    const handleOpenQueryResponse = (claim) => {
        setSelectedClaimForQuery(claim);
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
            await reimbursementService.respondQuery(selectedClaimForQuery.id, {
                response: queryResponseInput.trim(),
                respondedBy: user?.name || 'Employee',
            });
            toast.success(`Response to Finance query submitted on claim ${selectedClaimForQuery.claimId}.`, 'Response Dispatched');
            setIsQueryResponseModalOpen(false);
            setSelectedClaimForQuery(null);
            loadClaims();
        } catch (err) {
            setQueryResponseError(err.message || 'Failed to submit response');
        } finally {
            setIsSubmittingQueryResponse(false);
        }
    };

    const handleOpenDetails = (claim) => {
        setSelectedClaimDetails(claim);
        setIsDetailsModalOpen(true);
    };

    // Auto-calculate dynamic status & rejected amount in Review Modal
    const modalClaimedNum = selectedClaimForReview ? Number(selectedClaimForReview.claimAmount || 0) : 0;
    const modalApprovedNum = Number(approvedAmountInput) || 0;
    const modalRejectedNum = Math.max(0, modalClaimedNum - modalApprovedNum);
    const modalComputedStatus = modalApprovedNum === modalClaimedNum 
        ? 'Approved' 
        : modalApprovedNum === 0 
            ? 'Rejected' 
            : 'Partially Approved';

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
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{c.employeeId} • {c.department}</p>
                    </div>
                ),
            },
            {
                key: 'project',
                header: 'Project / Site',
                sortable: true,
                className: 'whitespace-nowrap',
                render: (c) => {
                    const proj = getEmployeeProjectById(c.employeeId);
                    return (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#D5860B]"/>
                            {proj}
                        </span>
                    );
                },
            },
        ] : []),
        {
            key: 'category',
            header: 'Reimbursement Type',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (c) => <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{c.category}</span>,
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
                <span className={`text-xs font-bold tabular-nums ${
                    Number(c.approvedAmount) > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-400'
                }`}>
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
                <span className={`text-xs font-bold tabular-nums ${
                    Number(c.rejectedAmount) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400'
                }`}>
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
            key: 'receipt',
            header: 'Attachment',
            className: 'whitespace-nowrap',
            render: (c) => c.receiptFileName ? (
                <button
                    type="button"
                    onClick={(ev) => {
                        ev.stopPropagation();
                        setPreviewAttachment(c);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-all cursor-pointer group shadow-2xs max-w-[150px] truncate"
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
            key: 'hrStatus',
            header: 'HR Decision',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (c) => <StatusBadge status={c.hrStatus || c.status} size="sm"/>,
        },
        {
            key: 'financeStatus',
            header: 'Finance Audit',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (c) => (
                <div className="flex flex-col gap-0.5">
                    <StatusBadge status={c.financeStatus === 'None' ? (c.hrStatus === 'Rejected' ? 'None' : 'Pending HR') : c.financeStatus} size="sm"/>
                    {c.queryStatus && c.queryStatus !== 'No Query' && (
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
            render: (c) => <StatusBadge status={c.settlementStatus === 'None' ? 'Not Payable' : (c.settlementStatus || 'Pending')} size="sm"/>,
        },
        {
            key: 'actions',
            header: isEmp ? 'Query & Status' : 'Actions',
            className: 'text-right whitespace-nowrap min-w-[160px]',
            render: (c) => {
                const isClaimant = isEmp || (user?.employeeId && c.employeeId === user.employeeId);

                if (isClaimant && c.queryStatus === 'Query Raised') {
                    return (
                        <div className="flex items-center justify-end gap-1.5">
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={() => handleOpenQueryResponse(c)}
                                className="bg-amber-600 hover:bg-amber-700 text-white text-xs h-7 px-2 font-bold animate-pulse"
                                leftIcon={<MessageSquare className="w-3.5 h-3.5"/>}
                            >
                                Respond to Query
                            </Button>
                            <button 
                                onClick={() => handleOpenDetails(c)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="View Details"
                            >
                                <Eye className="w-4 h-4"/>
                            </button>
                        </div>
                    );
                }

                if (c.status === 'Pending') {
                    if (isEmp) {
                        return (
                            <div className="flex items-center justify-end gap-1.5">
                                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/40">
                                    Under HR Review
                                </span>
                                <button 
                                    onClick={() => handleOpenDetails(c)}
                                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                    title="View Details"
                                >
                                    <Eye className="w-4 h-4"/>
                                </button>
                            </div>
                        );
                    }
                    return (
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleOpenReview(c, 'Partial')}
                                className="text-xs h-7 px-2"
                            >
                                Partial
                            </Button>
                            <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={() => handleOpenReview(c, 'Full')}
                                className="text-xs h-7 px-2.5"
                                leftIcon={<Check className="w-3.5 h-3.5"/>}
                            >
                                Verify
                            </Button>
                            <button 
                                type="button" 
                                onClick={() => handleOpenReview(c, 'Reject')} 
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 dark:hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
                                title="Reject"
                            >
                                <X className="w-4 h-4"/>
                            </button>
                            <button 
                                onClick={() => handleOpenDetails(c)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="View Details"
                            >
                                <Eye className="w-4 h-4"/>
                            </button>
                        </div>
                    );
                }

                if (!isEmp && (c.status === 'Approved' || c.status === 'Partially Approved')) {
                    return (
                        <div className="flex items-center justify-end gap-1.5">
                            {c.settlementStatus === 'Settled' ? (
                                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                                    Disbursed ({c.settlementReference})
                                </span>
                            ) : (
                                <span className="text-[11px] text-slate-500 font-medium">
                                    {c.financeStatus === 'Approved' ? 'Ready for Finance Disbursement' : c.queryStatus === 'Query Raised' ? 'Finance Query Active' : 'Forwarded to Finance'}
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
                            <button 
                                onClick={() => handleOpenDetails(c)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                                title="View Details"
                            >
                                <Eye className="w-4 h-4"/>
                            </button>
                        </div>
                    );
                }

                return (
                    <div className="flex items-center justify-end gap-1.5">
                        <span className="text-[11px] text-slate-400 italic whitespace-nowrap">
                            {c.settlementStatus === 'Settled' ? `Disbursed (${c.settlementReference || 'Settled'})` : c.status === 'Rejected' ? 'Disallowed' : 'Completed'}
                        </span>
                        <button 
                            onClick={() => handleOpenDetails(c)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="View Details"
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
                title={isEmp ? 'My Reimbursements' : 'Reimbursements'} 
                description={isEmp 
                    ? 'Your filed corporate allowances, DA, mobile recharge, and medical claims.' 
                    : 'Per diem DA, mobile bills, safety uniform gear, and field hardship allowances.'} 
                breadcrumbs={[
                    { label: 'Dashboard', path: '/hr' },
                    { label: 'Reimbursement' },
                ]} 
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate('/hr/reimbursement/history')} leftIcon={<History className="w-4 h-4 text-slate-600"/>}>
                            {isEmp ? 'My Disbursal History' : 'Disbursal History'}
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleOpenSubmitModal} leftIcon={<Plus className="w-4 h-4"/>}>
                            File Reimbursement
                        </Button>
                    </div>
                }
            />

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 bg-white dark:bg-[#1A2430] p-2.5 sm:p-3 rounded-xl border border-slate-200 dark:border-[#253344] shadow-xs">
                <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[130px]">
                    <Select 
                        value={selectedStatus} 
                        onChange={(e) => setSelectedStatus(e.target.value)} 
                        options={[
                            { label: 'All Statuses', value: 'all' },
                            { label: 'Pending Queue', value: 'Pending' },
                            { label: 'Approved', value: 'Approved' },
                            { label: 'Partially Approved', value: 'Partially Approved' },
                            { label: 'Settled', value: 'Settled' },
                            { label: 'Rejected', value: 'Rejected' },
                        ]}
                    />
                </div>

                <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[150px]">
                    <Select 
                        value={selectedCategory} 
                        onChange={(e) => setSelectedCategory(e.target.value)} 
                        options={[
                            { label: 'All Categories', value: 'all' },
                            { label: 'Mobile & Internet', value: 'Mobile & Internet' },
                            { label: 'Travel Daily Allowance (DA)', value: 'Travel Daily Allowance (DA)' },
                            { label: 'Field Hardship', value: 'Field Hardship' },
                            { label: 'Uniform & Safety Gear', value: 'Uniform & Safety Gear' },
                            { label: 'Medical Claim', value: 'Medical' },
                        ]}
                    />
                </div>

                {!isEmp && (
                    <>
                        <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[150px]">
                            <Select 
                                value={selectedDept} 
                                onChange={(e) => setSelectedDept(e.target.value)} 
                                options={[
                                    { label: 'All Departments', value: 'all' },
                                    { label: 'Geology & Exploration', value: 'Geology & Mineral Exploration' },
                                    { label: 'Mining & Planning', value: 'Mining & Mine Planning' },
                                    { label: 'GIS & Remote Sensing', value: 'GIS, Remote Sensing & UAV' },
                                    { label: 'Hydrogeology', value: 'Hydrogeology & Groundwater' },
                                    { label: 'Finance & Economics', value: 'Finance & Mineral Economics' },
                                    { label: 'HR & Admin', value: 'Human Resources & Admin' },
                                ]}
                            />
                        </div>

                        <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[170px]">
                            <Select 
                                value={selectedProject} 
                                onChange={(e) => setSelectedProject(e.target.value)} 
                                options={[
                                    { label: 'All Projects / Sites', value: 'all' },
                                    ...STANDARD_PROJECTS.map((p) => ({ label: p, value: p })),
                                ]}
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
                        className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs shrink-0 font-semibold w-full xs:w-auto flex items-center justify-center gap-1"
                    >
                        <RotateCcw className="w-3 h-3"/>
                        <span>Reset</span>
                    </Button>
                )}

                <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto hidden md:inline">
                    Showing <strong>{filteredClaims.length}</strong> of <strong>{claims.length}</strong> claims
                </span>
            </div>

            <DataTable 
                compact={true} 
                columns={columns} 
                data={filteredClaims} 
                keyField="id" 
                searchPlaceholder={isEmp ? 'Search my reimbursement claims...' : 'Search reimbursement claims...'} 
                searchFields={isEmp ? ['claimId', 'category', 'remarks'] : ['claimId', 'employeeName', 'category', 'remarks']}
            />

            {/* Claim Submission Modal (Employee) */}
            <Modal 
                isOpen={isClaimModalOpen} 
                onClose={() => setIsClaimModalOpen(false)} 
                title="File Reimbursement Claim" 
                description="Submit medical, mobile, daily allowance, or field hardship claims." 
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={() => setIsClaimModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="primary" size="sm" onClick={handleSubmitClaim} disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Submit Claim'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4 text-xs">
                    {formError && (
                        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0"/>
                            <span>{formError}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Select 
                            label="Claim Category" 
                            isRequired 
                            value={category} 
                            onChange={(e) => setCategory(e.target.value)} 
                            options={[
                                { label: 'Mobile & Internet Allowance', value: 'Mobile & Internet' },
                                { label: 'Travel Daily Allowance (DA)', value: 'Travel Daily Allowance (DA)' },
                                { label: 'Field Hardship Allowance', value: 'Field Hardship' },
                                { label: 'Uniform & Safety Gear (Boots, Helmet, Vest)', value: 'Uniform & Safety Gear' },
                                { label: 'Medical Claim', value: 'Medical' },
                            ]}
                        />

                        <Select 
                            label="Associated Project / Site" 
                            isRequired 
                            value={claimProject} 
                            onChange={(e) => setClaimProject(e.target.value)} 
                            options={STANDARD_PROJECTS.map((p) => ({ label: p, value: p }))}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input 
                            label="Claim Amount (INR ₹)" 
                            type="number" 
                            isRequired 
                            value={claimAmount} 
                            onChange={(e) => setClaimAmount(e.target.value)} 
                            placeholder="2500"
                        />

                        <DatePicker 
                            label="Expense / Incurred Date" 
                            isRequired 
                            value={claimDate} 
                            onChange={(e) => setClaimDate(e.target.value)}
                        />
                    </div>

                    <Textarea 
                        label="Remarks & Policy Justification" 
                        isRequired 
                        value={remarks} 
                        onChange={(e) => setRemarks(e.target.value)} 
                        placeholder="e.g. Monthly 5G field hotspot recharge for Bhilwara site orthophoto transfers" 
                        rows={2}
                    />

                    <FileUpload 
                        label="Attach Proof / Supporting Bill (Optional)" 
                        onFileSelect={async (f) => {
                            setUploadedFile(f);
                            if (f) {
                                await attachmentStorage.saveFile(f.name, f);
                            }
                        }} 
                        helperText="Upload official bill, recharge receipt, or prescription bill"
                    />
                </div>
            </Modal>

            {/* Adjudication Modal with Partial Approval (HR) */}
            <Modal 
                isOpen={isReviewModalOpen} 
                onClose={() => setIsReviewModalOpen(false)} 
                title={`Adjudicate Reimbursement Claim #${selectedClaimForReview?.claimId}`} 
                description="Review allowance claim, modify authorized amount, and confirm decision." 
                footer={
                    <>
                        <Button variant="outline" size="sm" onClick={() => setIsReviewModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button 
                            variant={modalComputedStatus === 'Rejected' ? 'danger' : 'primary'} 
                            size="sm" 
                            onClick={handleConfirmReview}
                        >
                            Confirm {modalComputedStatus}
                        </Button>
                    </>
                }
            >
                {selectedClaimForReview && (
                    <div className="space-y-4 text-xs">
                        {reviewError && (
                            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0"/>
                                <span>{reviewError}</span>
                            </div>
                        )}

                        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Staff Member:</span>
                                <span className="font-bold text-slate-900 dark:text-white">{selectedClaimForReview.employeeName} ({selectedClaimForReview.employeeId})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Department:</span>
                                <span>{selectedClaimForReview.department}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Project / Site:</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedClaimForReview.project || getEmployeeProjectById(selectedClaimForReview.employeeId)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Category:</span>
                                <span>{selectedClaimForReview.category}</span>
                            </div>
                            <div className="flex justify-between items-center py-0.5">
                                <span className="text-slate-500">Attachment:</span>
                                {selectedClaimForReview.receiptFileName ? (
                                    <button
                                        type="button"
                                        onClick={() => setPreviewAttachment(selectedClaimForReview)}
                                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                                    >
                                        <Paperclip className="w-3.5 h-3.5 text-blue-600"/>
                                        <span className="truncate max-w-[150px]">{selectedClaimForReview.receiptFileName}</span>
                                        <Eye className="w-3.5 h-3.5 text-blue-600"/>
                                    </button>
                                ) : (
                                    <span>No document attached</span>
                                )}
                            </div>
                            <div className="pt-1.5 border-t border-slate-200 dark:border-slate-700 italic text-slate-600 dark:text-slate-300">
                                "{selectedClaimForReview.remarks}"
                            </div>
                        </div>

                        {/* Amount Adjudication Card */}
                        <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/40 dark:bg-blue-950/30 space-y-3">
                            <div className="flex items-center justify-between">
                                <label className="font-bold text-slate-800 dark:text-slate-200">
                                    Approved Amount to Authorize (₹)
                                </label>
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400">
                                    Result: {modalComputedStatus}
                                </span>
                            </div>

                            <Input 
                                type="number" 
                                min="0"
                                max={modalClaimedNum}
                                value={approvedAmountInput} 
                                onChange={(e) => {
                                    setApprovedAmountInput(e.target.value);
                                    setReviewError('');
                                }}
                                helperText={`Claimed total: ₹${modalClaimedNum.toLocaleString('en-IN')}`}
                                className="font-mono text-base font-bold"
                            />

                            {/* Live Reconciliation Ledger */}
                            <div className="grid grid-cols-3 gap-2 text-center pt-1">
                                <div className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Claimed</span>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">₹{modalClaimedNum.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
                                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 block">Approved</span>
                                    <p className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">₹{modalApprovedNum.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800">
                                    <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block">Rejected</span>
                                    <p className="text-xs font-extrabold text-rose-700 dark:text-rose-400 mt-0.5">₹{modalRejectedNum.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                        </div>

                        <Textarea 
                            label="Approver / HR Remarks" 
                            value={reviewRemarksInput} 
                            onChange={(e) => setReviewRemarksInput(e.target.value)} 
                            placeholder="Specify reason for allowance authorization or partial deduction..."
                            rows={2}
                        />
                    </div>
                )}
            </Modal>

            {/* Employee Query Response Modal (Requirement 6) */}
            <Modal
                isOpen={isQueryResponseModalOpen}
                onClose={() => setIsQueryResponseModalOpen(false)}
                title={`Respond to Finance Query — Claim #${selectedClaimForQuery?.claimId}`}
                description="Finance has requested clarification on your allowance claim."
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
                                placeholder="Explain charges, reference invoice dates, or provide requested billing details..."
                            />
                        </div>
                    </div>
                )}
            </Modal>

            {/* Details & Audit Trail Modal */}
            <Modal
                isOpen={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                title={`Claim Details & Lifecycle History — #${selectedClaimDetails?.claimId}`}
                size="lg"
            >
                {selectedClaimDetails && (
                    <div className="space-y-4 text-xs">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div>
                                <span className="text-slate-500 block">Claimant</span>
                                <span className="font-bold text-slate-900 dark:text-white">{selectedClaimDetails.employeeName}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Claim Amount</span>
                                <span className="font-mono font-bold text-slate-900 dark:text-white">₹{Number(selectedClaimDetails.claimAmount).toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">HR Approved</span>
                                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">₹{Number(selectedClaimDetails.approvedAmount || 0).toLocaleString('en-IN')}</span>
                            </div>
                            <div>
                                <span className="text-slate-500 block">Settlement Status</span>
                                <StatusBadge status={selectedClaimDetails.settlementStatus || (selectedClaimDetails.status === 'Settled' ? 'Settled' : 'Pending')} size="sm"/>
                            </div>
                        </div>

                        {/* Supporting Attachment */}
                        <div className="space-y-1">
                            <span className="font-bold text-slate-700 dark:text-slate-300">Supporting Attachment</span>
                            {selectedClaimDetails.receiptFileName ? (
                                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-2 truncate mr-2">
                                        <Paperclip className="w-4 h-4 text-blue-600 shrink-0"/>
                                        <span className="font-medium truncate">{selectedClaimDetails.receiptFileName}</span>
                                        {selectedClaimDetails.receiptFileSize && (
                                            <span className="text-slate-400 shrink-0">({(selectedClaimDetails.receiptFileSize / (1024 * 1024)).toFixed(2)} MB)</span>
                                        )}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPreviewAttachment(selectedClaimDetails)}
                                        className="text-xs h-7 px-2.5 font-semibold text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/50 shrink-0"
                                        leftIcon={<Eye className="w-3.5 h-3.5"/>}
                                    >
                                        View Document
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-slate-400 italic">No receipt attached to this claim.</p>
                            )}
                        </div>

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

                        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-700">
                            <Button variant="outline" size="sm" onClick={() => setIsDetailsModalOpen(false)}>
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
                    loadClaims();
                }}
            />
        </div>
    );
};
