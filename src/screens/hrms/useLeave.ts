import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useHrms, useAuth } from '../../context';
import { LeaveRequest, LeaveBalance } from '../../types';
import { countWorkingDays, getNonWorkingDates } from '../../utils/workingDays';
import { isValidIndianMobile } from '../../utils';
import { checkDateConflict } from '../../services/leave.service';

export const useLeave = () => {
  const { leaveBalances, leaves, applyLeave, cancelLeave, refreshHrms } = useHrms();
  const { session, hasRole } = useAuth();

  const isHrOrAdmin = hasRole(['Admin', 'HR']);
  const activeEmpId = session?.accountType === 'team' ? (session as any).employeeId : 'BGS-2021-001';
  const activeEmpName = session?.accountType === 'team' ? (session as any).name : 'Active Staff';
  const activeEmpDept = (session as any)?.department || 'Geology & Mineral Exploration';

  const [activeTab, setActiveTab] = useState<'my' | 'company'>('my');

  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('Casual Leave (CL)');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>(
    session && (session as any).phone ? `+91 ${(session as any).phone}` : '+91 98290 10044'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayedRequests = useMemo(() => {
    let list = leaves;
    if (activeTab === 'my' || !isHrOrAdmin) {
      list = list.filter((r) => r.employeeId === activeEmpId);
    }

    if (statusFilter !== 'All') {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.employeeName?.toLowerCase().includes(q) ||
          r.employeeId?.toLowerCase().includes(q) ||
          r.leaveType?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q) ||
          r.department?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [leaves, activeTab, isHrOrAdmin, activeEmpId, statusFilter, searchQuery]);

  const pendingApprovalsCount = useMemo(() => {
    return leaves.filter((l) => l.status === 'Pending').length;
  }, [leaves]);

  const activeQuotaBalance = useMemo(() => {
    return (
      leaveBalances.find((b) => b.leaveType === selectedType) || {
        leaveType: selectedType,
        totalAllocated: 12,
        allocated: 12,
        used: 0,
        pending: 0,
        available: 12,
        color: '#3B82F6',
      }
    );
  }, [leaveBalances, selectedType]);

  const myEmployeeRequests = useMemo(() => {
    return leaves.filter((r) => r.employeeId === activeEmpId);
  }, [leaves, activeEmpId]);

  const pendingDaysForType = useMemo(() => {
    return myEmployeeRequests
      .filter((r) => r.status === 'Pending' && r.leaveType === selectedType)
      .reduce((sum, r) => sum + (Number(r.requestedDays || r.days) || 0), 0);
  }, [myEmployeeRequests, selectedType]);

  const availableToApply = useMemo(() => {
    return Math.max(0, activeQuotaBalance.totalAllocated - activeQuotaBalance.used - pendingDaysForType);
  }, [activeQuotaBalance.totalAllocated, activeQuotaBalance.used, pendingDaysForType]);

  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return countWorkingDays(startDate, endDate);
  }, [startDate, endDate]);

  const skippedDates = useMemo(() => {
    if (!startDate || !endDate) return [];
    return getNonWorkingDates(startDate, endDate);
  }, [startDate, endDate]);

  const projectedRemaining = useMemo(() => {
    if (calculatedDays <= 0) return availableToApply;
    return availableToApply - calculatedDays;
  }, [availableToApply, calculatedDays]);

  const isInvertedDate = calculatedDays === -1;
  const isOverQuota = calculatedDays > 0 && calculatedDays > availableToApply;
  const isClLimitExceeded = (selectedType.includes('Casual') || selectedType === 'CL') && calculatedDays > 3;
  const isMaxDurationExceeded = !selectedType.includes('Maternity') && calculatedDays > 30;

  const overlappingRequest = useMemo(() => {
    if (calculatedDays <= 0) return null;
    return checkDateConflict(myEmployeeRequests, activeEmpId, startDate, endDate);
  }, [startDate, endDate, calculatedDays, myEmployeeRequests, activeEmpId]);

  const handleAutoAdjustDates = () => {
    if (!overlappingRequest) return;
    const reqStart = new Date(overlappingRequest.startDate);
    const start = new Date(startDate);
    if (start < reqStart) {
      const dayBefore = new Date(reqStart);
      dayBefore.setDate(dayBefore.getDate() - 1);
      const formatted = dayBefore.toISOString().split('T')[0];
      setEndDate(formatted);
      Alert.alert('Dates Adjusted', `End date adjusted to ${formatted} to avoid conflicting leave.`);
    } else {
      const reqEnd = new Date(overlappingRequest.endDate);
      const dayAfter = new Date(reqEnd);
      dayAfter.setDate(dayAfter.getDate() + 1);
      const formatted = dayAfter.toISOString().split('T')[0];
      setStartDate(formatted);
      Alert.alert('Dates Adjusted', `Start date adjusted to ${formatted} to avoid conflicting leave.`);
    }
  };

  const isBlockedByValidation =
    isInvertedDate ||
    isOverQuota ||
    isClLimitExceeded ||
    isMaxDurationExceeded ||
    !!overlappingRequest ||
    calculatedDays <= 0;

  const handleApply = async () => {
    if (isBlockedByValidation) {
      let errMsg = 'Cannot submit leave application due to policy constraints:';
      if (isInvertedDate) errMsg = 'End date cannot be earlier than start date.';
      else if (calculatedDays <= 0) errMsg = 'Selected date range contains 0 working days.';
      else if (isClLimitExceeded) errMsg = 'Casual Leave (CL) cannot exceed 3 consecutive working days.';
      else if (isOverQuota) errMsg = `Insufficient quota. Requested ${calculatedDays} days but only ${availableToApply} days available.`;
      else if (overlappingRequest) errMsg = `Dates overlap with an existing ${overlappingRequest.status} ${overlappingRequest.leaveType} request.`;
      Alert.alert('Validation Error', errMsg);
      return;
    }

    if (!reason.trim() || reason.trim().length < 10) {
      Alert.alert('Reason Required', 'Please provide a substantive justification (minimum 10 characters).');
      return;
    }

    if (reason.trim().length > 500) {
      Alert.alert('Reason Too Long', 'Reason cannot exceed 500 characters.');
      return;
    }

    if (contactPhone && !isValidIndianMobile(contactPhone, true)) {
      Alert.alert('Invalid Contact', 'Please provide a valid 10-digit Indian emergency phone number.');
      return;
    }

    try {
      setIsSubmitting(true);
      await applyLeave(
        selectedType,
        startDate.trim(),
        endDate.trim(),
        reason.trim(),
        contactPhone.trim()
      );
      setShowApplyModal(false);
      setReason('');
      Alert.alert(
        'Leave Application Submitted',
        `Your application for ${calculatedDays} working day(s) of ${selectedType} has been submitted for supervisor approval.`
      );
    } catch (err: any) {
      Alert.alert('Submission Failed', err.message || 'Failed to submit leave.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async (reqId: string) => {
    Alert.alert(
      'Withdraw Leave Application',
      'Are you sure you want to withdraw this leave request? Any reserved quota will be restored.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Withdrawal',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);
              await cancelLeave(reqId);
              setIsDetailModalOpen(false);
              setSelectedRequest(null);
              Alert.alert('Application Withdrawn', 'Your leave request has been successfully cancelled.');
            } catch (e: any) {
              Alert.alert('Cancellation Error', e.message || 'Failed to withdraw request.');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenDetail = (req: LeaveRequest) => {
    setSelectedRequest(req);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedRequest(null);
  };

  return {
    isHrOrAdmin,
    activeEmpId,
    activeEmpName,
    activeEmpDept,
    activeTab,
    setActiveTab,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    selectedRequest,
    isDetailModalOpen,
    isCancelling,
    showApplyModal,
    setShowApplyModal,
    selectedType,
    setSelectedType,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    reason,
    setReason,
    contactPhone,
    setContactPhone,
    isSubmitting,
    displayedRequests,
    pendingApprovalsCount,
    leaveBalances,
    myEmployeeRequests,
    calculatedDays,
    skippedDates,
    projectedRemaining,
    availableToApply,
    isInvertedDate,
    isOverQuota,
    isClLimitExceeded,
    isMaxDurationExceeded,
    overlappingRequest,
    isBlockedByValidation,
    handleAutoAdjustDates,
    handleApply,
    handleCancelRequest,
    handleOpenDetail,
    handleCloseDetail,
    leaves,
  };
};
