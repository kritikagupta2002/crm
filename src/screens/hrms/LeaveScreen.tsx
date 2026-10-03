import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, Input, EmptyState } from '../../components';
import { LeaveRequest, LeaveBalance } from '../../types';
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Clock,
  User,
  Phone,
  Search,
  ChevronRight,
  Info,
  X,
  FileText,
  Filter,
  Check,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react-native';
import {
  countWorkingDays,
  getWorkingDates,
  getNonWorkingDates,
  formatDate,
  SkippedDateItem,
} from '../../utils/workingDays';
import { checkDateConflict } from '../../services/leave.service';
import { LEAVE_POLICIES } from '../../constants';

export const LeaveScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { leaveBalances, leaves, applyLeave, cancelLeave, refreshHrms } = useHrms();
  const { session, hasRole } = useAuth();

  const isHrOrAdmin = hasRole(['Admin', 'HR']);
  const activeEmpId = session?.accountType === 'team' ? (session as any).employeeId : 'BGS-2021-001';
  const activeEmpName = session?.accountType === 'team' ? (session as any).name : 'Active Staff';
  const activeEmpDept = (session as any)?.department || 'Geology & Mineral Exploration';

  // Tabs for HR/Admin vs Regular Employee
  const [activeTab, setActiveTab] = useState<'my' | 'company'>('my');

  // Status Filter & Search
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Request for Detail Modal
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Apply Leave Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('Casual Leave (CL)');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [reason, setReason] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>(
    session && (session as any).phone ? `+91 ${(session as any).phone}` : '+91 98290 10044'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter requests based on self-service data isolation
  const displayedRequests = useMemo(() => {
    let list = leaves;
    if (activeTab === 'my' || !isHrOrAdmin) {
      // Regular employees MUST only see their own leave records
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

  // Pending count for HR approvals badge
  const pendingApprovalsCount = useMemo(() => {
    return leaves.filter((l) => l.status === 'Pending').length;
  }, [leaves]);

  // Current balance for the selected category in the apply form
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

  // Existing requests for active employee
  const myEmployeeRequests = useMemo(() => {
    return leaves.filter((r) => r.employeeId === activeEmpId);
  }, [leaves, activeEmpId]);

  // Pending days for the selected leave type
  const pendingDaysForType = useMemo(() => {
    return myEmployeeRequests
      .filter((r) => r.status === 'Pending' && r.leaveType === selectedType)
      .reduce((sum, r) => sum + (Number(r.requestedDays || r.days) || 0), 0);
  }, [myEmployeeRequests, selectedType]);

  // Available quota that can be applied for right now (after subtracting pending commitments)
  const availableToApply = useMemo(() => {
    return Math.max(0, activeQuotaBalance.totalAllocated - activeQuotaBalance.used - pendingDaysForType);
  }, [activeQuotaBalance.totalAllocated, activeQuotaBalance.used, pendingDaysForType]);

  // Real-time calculation of working days (excluding weekends & holidays)
  const calculatedDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return countWorkingDays(startDate, endDate);
  }, [startDate, endDate]);

  // Skipped non-working dates list
  const skippedDates = useMemo(() => {
    if (!startDate || !endDate) return [];
    return getNonWorkingDates(startDate, endDate);
  }, [startDate, endDate]);

  // Projected remaining balance
  const projectedRemaining = useMemo(() => {
    if (calculatedDays <= 0) return availableToApply;
    return availableToApply - calculatedDays;
  }, [availableToApply, calculatedDays]);

  // Policy validation flags
  const isInvertedDate = calculatedDays === -1;
  const isOverQuota = calculatedDays > 0 && calculatedDays > availableToApply;
  const isClLimitExceeded = (selectedType.includes('Casual') || selectedType === 'CL') && calculatedDays > 3;
  const isMaxDurationExceeded = !selectedType.includes('Maternity') && calculatedDays > 30;

  // Overlapping request verification
  const overlappingRequest = useMemo(() => {
    if (calculatedDays <= 0) return null;
    return checkDateConflict(myEmployeeRequests, activeEmpId, startDate, endDate);
  }, [startDate, endDate, calculatedDays, myEmployeeRequests, activeEmpId]);

  // 1-Click Auto-Adjust Dates to resolve overlap
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

    if (contactPhone && !/^(\+91[-\s]?)?[6-9]\d{9}$/.test(contactPhone.trim())) {
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

  const renderLeaveCard = ({ item }: { item: LeaveRequest }) => {
    const isOwned = item.employeeId === activeEmpId;
    const reqDays = item.requestedDays || item.days || 1;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => {
          setSelectedRequest(item);
          setIsDetailModalOpen(true);
        }}
      >
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.typePill,
                  {
                    backgroundColor: item.leaveType.includes('Casual')
                      ? '#3B82F618'
                      : item.leaveType.includes('Sick')
                      ? '#10B98118'
                      : item.leaveType.includes('Earned')
                      ? '#F59E0B18'
                      : item.leaveType.includes('Compensatory')
                      ? '#8B5CF618'
                      : item.leaveType.includes('Field')
                      ? '#06B6D418'
                      : '#EC489918',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.typePillText,
                    {
                      color: item.leaveType.includes('Casual')
                        ? '#2563EB'
                        : item.leaveType.includes('Sick')
                        ? '#059669'
                        : item.leaveType.includes('Earned')
                        ? '#D97706'
                        : item.leaveType.includes('Compensatory')
                        ? '#7C3AED'
                        : item.leaveType.includes('Field')
                        ? '#0891B2'
                        : '#DB2777',
                    },
                  ]}
                >
                  {item.leaveType.split('(')[0].trim()}
                </Text>
              </View>

              {(!isOwned || activeTab === 'company') && (
                <Text style={styles.applicantBadge}>
                  {item.employeeName} ({item.employeeId})
                </Text>
              )}
            </View>

            <StatusBadge status={item.status as any} size="small" />
          </View>

          <View style={styles.dateRow}>
            <Calendar size={14} color={colors.text.secondary} />
            <Text style={styles.dateSpan}>
              {formatDate(item.startDate)} → {formatDate(item.endDate)}
            </Text>
            <View style={styles.daysBadge}>
              <Text style={styles.daysBadgeText}>
                {reqDays} {reqDays === 1 ? 'day' : 'days'}
              </Text>
            </View>
          </View>

          {item.status === 'Partially Approved' && (
            <View style={styles.partialBanner}>
              <Text style={styles.partialText}>
                Approved: {item.approvedDays}d • Rejected: {item.rejectedDays}d
              </Text>
            </View>
          )}

          <Text style={styles.reasonText} numberOfLines={2}>
            {item.reason}
          </Text>

          {item.status === 'Rejected' && item.rejectionReason && (
            <View style={styles.rejectionBox}>
              <AlertCircle size={13} color={colors.semantic.danger} />
              <Text style={styles.rejectionText} numberOfLines={2}>
                Reason: {item.rejectionReason}
              </Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <Text style={styles.submittedOnText}>
              Applied {formatDate(item.appliedOn || item.appliedAt)}
            </Text>
            <View style={styles.viewDetailLink}>
              <Text style={styles.viewDetailText}>View Details</Text>
              <ChevronRight size={13} color={colors.primary} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Leave Management"
        subtitle="Quotas, working day engine & history"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          isHrOrAdmin ? (
            <TouchableOpacity
              style={styles.approvalsHeaderBtn}
              onPress={() => navigation.navigate('LeaveApprovals')}
            >
              <ShieldCheck size={16} color="#FFFFFF" />
              <Text style={styles.approvalsHeaderText}>Queue</Text>
              {pendingApprovalsCount > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{pendingApprovalsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Role Navigation Toggle for HR / Admin */}
      {isHrOrAdmin && (
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'my' && styles.tabButtonActive]}
            onPress={() => setActiveTab('my')}
          >
            <User size={14} color={activeTab === 'my' ? colors.primary : colors.text.tertiary} />
            <Text style={[styles.tabButtonText, activeTab === 'my' && styles.tabButtonTextActive]}>
              My Balance & Requests
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'company' && styles.tabButtonActive]}
            onPress={() => setActiveTab('company')}
          >
            <FileText size={14} color={activeTab === 'company' ? colors.primary : colors.text.tertiary} />
            <Text style={[styles.tabButtonText, activeTab === 'company' && styles.tabButtonTextActive]}>
              All Staff Requests ({leaves.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Personal Leave Quota Ledger */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'company' ? 'ORGANIZATION POLICY QUOTAS' : 'MY LEAVE BALANCES'}
          </Text>
          <Text style={styles.sectionSubtitle}>FY 2026</Text>
        </View>

        <View style={styles.balanceGrid}>
          {leaveBalances.map((bal) => {
            const avail = bal.available ?? Math.max(0, bal.totalAllocated - bal.used);
            const total = bal.totalAllocated ?? bal.allocated ?? 12;
            const pct = Math.min(100, Math.round((bal.used / total) * 100));

            return (
              <Card key={bal.leaveType} style={styles.balanceCard}>
                <View style={styles.balCardHeader}>
                  <Text style={styles.balTitle} numberOfLines={1}>
                    {bal.leaveType.split('(')[0].trim()}
                  </Text>
                  <View style={[styles.colorDot, { backgroundColor: bal.color || colors.primary }]} />
                </View>

                <View style={styles.balNumbersRow}>
                  <Text style={styles.balAvailableNum}>{avail}</Text>
                  <Text style={styles.balTotalNum}>/ {total}d</Text>
                </View>

                {/* Progress bar */}
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${pct}%`,
                        backgroundColor: bal.color || colors.primary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.balCardFooter}>
                  <Text style={styles.balFooterText}>{bal.used}d used</Text>
                  {bal.pending > 0 && (
                    <Text style={styles.balPendingText}>({bal.pending}d pend)</Text>
                  )}
                </View>
              </Card>
            );
          })}
        </View>

        {/* Primary Action Button */}
        <Button
          title="Apply for Leave"
          variant="primary"
          leftIcon={<Plus size={18} color="#FFFFFF" />}
          onPress={() => setShowApplyModal(true)}
          style={styles.applyBtn}
        />

        {/* Filter & Search Bar */}
        <View style={styles.filterSection}>
          <View style={styles.searchBar}>
            <Search size={16} color={colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search leaves, reason, applicant..."
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color={colors.text.tertiary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Status Filter Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipsRow}>
            {['All', 'Pending', 'Approved', 'Partially Approved', 'Rejected'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.statusChip, statusFilter === st && styles.statusChipActive]}
                onPress={() => setStatusFilter(st)}
              >
                <Text style={[styles.statusChipText, statusFilter === st && styles.statusChipTextActive]}>
                  {st}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Applications List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>
            {activeTab === 'company' ? 'STAFF LEAVE APPLICATIONS' : 'MY RECENT APPLICATIONS'}
          </Text>
          <Text style={styles.recordsCount}>{displayedRequests.length} records</Text>
        </View>

        {displayedRequests.length === 0 ? (
          <EmptyState
            title="No Leave Applications"
            message={
              searchQuery || statusFilter !== 'All'
                ? 'No leave requests match the selected filters.'
                : 'No leave applications submitted yet.'
            }
            icon={<CalendarCheck size={44} color={colors.text.tertiary} />}
          />
        ) : (
          displayedRequests.map((item) => <View key={item.id}>{renderLeaveCard({ item })}</View>)
        )}
      </ScrollView>

      {/* ============================================================ */}
      {/* APPLY LEAVE MODAL                                           */}
      {/* ============================================================ */}
      <Modal visible={showApplyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.applyModalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Apply for Leave</Text>
                <Text style={styles.modalSubtitle}>Statutory working-day engine & quota validation</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowApplyModal(false)}
              >
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.applyFormScroll} showsVerticalScrollIndicator={false}>
              {/* Applicant Info Banner */}
              <View style={styles.applicantInfoBanner}>
                <User size={15} color={colors.primary} />
                <Text style={styles.applicantInfoText}>
                  Applicant: <Text style={{ fontWeight: '700' }}>{activeEmpName}</Text> ({activeEmpId})
                </Text>
              </View>

              {/* Leave Type Selector Chips */}
              <Text style={styles.inputLabel}>Leave Type & Statutory Category</Text>
              <View style={styles.typeSelectorWrap}>
                {[
                  'Casual Leave (CL)',
                  'Sick Leave (SL)',
                  'Earned / Privilege Leave (EL)',
                  'Compensatory Off (CO)',
                  'Field Duty Leave (FDL)',
                  'Maternity / Paternity Leave',
                ].map((lt) => {
                  const b = leaveBalances.find((bal) => bal.leaveType === lt);
                  const ltPending = myEmployeeRequests
                    .filter((r) => r.status === 'Pending' && r.leaveType === lt)
                    .reduce((sum, r) => sum + (Number(r.requestedDays || r.days) || 0), 0);
                  const total = b ? b.totalAllocated : lt.includes('Maternity') ? 180 : 12;
                  const used = b ? b.used : 0;
                  const avail = Math.max(0, total - used - ltPending);
                  const isSelected = selectedType === lt;

                  return (
                    <TouchableOpacity
                      key={lt}
                      style={[styles.typeSelectCard, isSelected && styles.typeSelectCardActive]}
                      onPress={() => setSelectedType(lt)}
                    >
                      <View style={styles.typeCardHeader}>
                        <Text style={[styles.typeSelectTitle, isSelected && styles.typeSelectTitleActive]}>
                          {lt.split('(')[0].trim()}
                        </Text>
                        <Text style={[styles.typeAvailBadge, isSelected && styles.typeAvailBadgeActive]}>
                          {avail}d avail
                        </Text>
                      </View>
                      <Text style={styles.typeCodeSub}>
                        {lt.includes('CL')
                          ? 'Max 3 consecutive days'
                          : lt.includes('EL')
                          ? 'Min 7 days advance notice'
                          : lt.includes('SL')
                          ? 'Physician rest & recovery'
                          : lt.includes('FDL')
                          ? 'R&R post field tour'
                          : lt.includes('CO')
                          ? 'Weekend/Holiday credit'
                          : 'Statutory 26 weeks'}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Date Inputs */}
              <View style={styles.dateInputsRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Start Date (YYYY-MM-DD)"
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="2026-10-12"
                    leftIcon={<Calendar size={16} color={colors.text.secondary} />}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Input
                    label="End Date (YYYY-MM-DD)"
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="2026-10-14"
                    leftIcon={<Calendar size={16} color={colors.text.secondary} />}
                  />
                </View>
              </View>

              {/* Working Day Engine Live Output Banner */}
              <View
                style={[
                  styles.engineBanner,
                  isBlockedByValidation ? styles.engineBannerError : styles.engineBannerSuccess,
                ]}
              >
                <View style={styles.engineHeader}>
                  <View style={styles.engineTitleRow}>
                    <Clock size={16} color={isBlockedByValidation ? colors.semantic.danger : colors.semantic.success} />
                    <Text
                      style={[
                        styles.engineTitle,
                        { color: isBlockedByValidation ? colors.semantic.danger : colors.semantic.success },
                      ]}
                    >
                      {isInvertedDate
                        ? 'Invalid Date Chronology'
                        : `${calculatedDays} Working Day${calculatedDays === 1 ? '' : 's'} Computed`}
                    </Text>
                  </View>
                  <Text style={styles.projectedBalText}>
                    Projected Quota: {projectedRemaining}d
                  </Text>
                </View>

                {/* Display skipped weekend/holiday days */}
                {skippedDates.length > 0 && (
                  <View style={styles.skippedWrap}>
                    <Text style={styles.skippedTitle}>
                      Excluded (Does NOT consume leave quota):
                    </Text>
                    <View style={styles.skippedChipsRow}>
                      {skippedDates.map((item, idx) => (
                        <View key={idx} style={styles.skippedChip}>
                          <Text style={styles.skippedChipText}>
                            {item.date} ({item.reason})
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Policy Violations Warnings */}
                {isInvertedDate && (
                  <Text style={styles.errorAlertText}>
                    End date cannot be earlier than start date.
                  </Text>
                )}

                {calculatedDays === 0 && !isInvertedDate && (
                  <Text style={styles.warningAlertText}>
                    Selected date range contains 0 working days. Weekends and national holidays do not consume leave balance.
                  </Text>
                )}

                {isClLimitExceeded && (
                  <Text style={styles.errorAlertText}>
                    Casual Leave (CL) cannot exceed 3 consecutive working days per BGSPL policy. Please apply for Earned Leave (EL) for extended durations.
                  </Text>
                )}

                {isMaxDurationExceeded && (
                  <Text style={styles.errorAlertText}>
                    Single leave application cannot exceed 30 working days. Please submit in separate phases.
                  </Text>
                )}

                {isOverQuota && (
                  <Text style={styles.errorAlertText}>
                    Insufficient balance: You have {availableToApply} day(s) available to apply, but requested {calculatedDays} day(s).
                  </Text>
                )}

                {overlappingRequest && (
                  <View style={styles.overlapBox}>
                    <Text style={styles.errorAlertText}>
                      Overlapping Request: You already have a {overlappingRequest.status} {overlappingRequest.leaveType} application ({overlappingRequest.startDate} to {overlappingRequest.endDate}).
                    </Text>
                    <TouchableOpacity style={styles.autoAdjustBtn} onPress={handleAutoAdjustDates}>
                      <RotateCcw size={12} color="#FFFFFF" />
                      <Text style={styles.autoAdjustBtnText}>Auto-Adjust Dates</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Reason Input */}
              <Input
                label="Reason / Purpose of Leave (Min 10 characters)"
                value={reason}
                onChangeText={setReason}
                placeholder="e.g. Attending family function and personal work in hometown"
                multiline
                numberOfLines={3}
              />
              <Text style={styles.charCountText}>
                {reason.trim().length} / 500 characters
              </Text>

              {/* Emergency Contact Phone */}
              <Input
                label="Emergency Contact Phone During Absence"
                value={contactPhone}
                onChangeText={setContactPhone}
                placeholder="+91 98290 10044"
                leftIcon={<Phone size={16} color={colors.text.secondary} />}
              />

              <View style={styles.formActionButtons}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowApplyModal(false)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Submit Application"
                  variant="primary"
                  loading={isSubmitting}
                  disabled={isBlockedByValidation}
                  onPress={handleApply}
                  style={{ flex: 1.5 }}
                />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* LEAVE DETAIL MODAL                                           */}
      {/* ============================================================ */}
      <Modal visible={isDetailModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Leave Application Details</Text>
                <Text style={styles.modalSubtitle}>Reference: {selectedRequest?.id}</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => {
                  setIsDetailModalOpen(false);
                  setSelectedRequest(null);
                }}
              >
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
                {/* Status & Category Hero */}
                <View style={styles.detailHero}>
                  <View>
                    <Text style={styles.detailHeroType}>{selectedRequest.leaveType}</Text>
                    <Text style={styles.detailHeroDept}>
                      {selectedRequest.employeeName} • {selectedRequest.department || activeEmpDept}
                    </Text>
                  </View>
                  <StatusBadge status={selectedRequest.status as any} size="medium" />
                </View>

                {/* Duration breakdown card */}
                <View style={styles.detailMetaGrid}>
                  <View style={styles.detailMetaItem}>
                    <Text style={styles.detailMetaLabel}>Start Date</Text>
                    <Text style={styles.detailMetaVal}>{formatDate(selectedRequest.startDate)}</Text>
                  </View>
                  <View style={styles.detailMetaItem}>
                    <Text style={styles.detailMetaLabel}>End Date</Text>
                    <Text style={styles.detailMetaVal}>{formatDate(selectedRequest.endDate)}</Text>
                  </View>
                  <View style={styles.detailMetaItem}>
                    <Text style={styles.detailMetaLabel}>Requested Duration</Text>
                    <Text style={styles.detailMetaVal}>
                      {selectedRequest.requestedDays || selectedRequest.days} Working Days
                    </Text>
                  </View>
                  <View style={styles.detailMetaItem}>
                    <Text style={styles.detailMetaLabel}>Submitted Date</Text>
                    <Text style={styles.detailMetaVal}>
                      {formatDate(selectedRequest.appliedOn || selectedRequest.appliedAt)}
                    </Text>
                  </View>
                </View>

                {/* Partial approval breakdown */}
                {selectedRequest.status === 'Partially Approved' && (
                  <View style={styles.partialCard}>
                    <View style={styles.partialCardCol}>
                      <Text style={styles.partialCardLabel}>Days Approved</Text>
                      <Text style={styles.partialCardValGreen}>{selectedRequest.approvedDays} Days</Text>
                    </View>
                    <View style={styles.partialCardDivider} />
                    <View style={styles.partialCardCol}>
                      <Text style={styles.partialCardLabel}>Days Declined</Text>
                      <Text style={styles.partialCardValRed}>{selectedRequest.rejectedDays} Days</Text>
                    </View>
                  </View>
                )}

                {/* Applicant Reason */}
                <View style={styles.sectionBlock}>
                  <Text style={styles.sectionBlockTitle}>Applicant Justification</Text>
                  <View style={styles.reasonCard}>
                    <Text style={styles.reasonCardText}>"{selectedRequest.reason}"</Text>
                  </View>
                </View>

                {/* Emergency Contact */}
                {selectedRequest.contactDuringLeave && (
                  <View style={styles.sectionBlock}>
                    <Text style={styles.sectionBlockTitle}>Emergency Contact Phone</Text>
                    <View style={styles.contactRow}>
                      <Phone size={14} color={colors.primary} />
                      <Text style={styles.contactText}>{selectedRequest.contactDuringLeave}</Text>
                    </View>
                  </View>
                )}

                {/* Rejection Remarks (Mandatory Rejection Reason Display) */}
                {selectedRequest.status === 'Rejected' && selectedRequest.rejectionReason && (
                  <View style={styles.rejectionDetailBox}>
                    <View style={styles.rejectionHeader}>
                      <AlertTriangle size={16} color={colors.semantic.danger} />
                      <Text style={styles.rejectionHeaderTitle}>Formal Rejection Reason</Text>
                    </View>
                    <Text style={styles.rejectionDetailBody}>
                      {selectedRequest.rejectionReason}
                    </Text>
                    {selectedRequest.approverName && (
                      <Text style={styles.adjudicatorSign}>
                        Adjudicated by: {selectedRequest.approverName}
                      </Text>
                    )}
                  </View>
                )}

                {/* Approval Sign-off info */}
                {selectedRequest.status === 'Approved' && (
                  <View style={styles.approvalDetailBox}>
                    <View style={styles.approvalHeader}>
                      <CheckCircle2 size={16} color={colors.semantic.success} />
                      <Text style={styles.approvalHeaderTitle}>Supervisor Approval Confirmed</Text>
                    </View>
                    <Text style={styles.approvalDetailBody}>
                      {selectedRequest.approverComment || 'Approved in full. Attendance muster synchronized to On-Leave.'}
                    </Text>
                    <Text style={styles.adjudicatorSign}>
                      Approved by: {selectedRequest.approverName || 'HR Administration'}
                    </Text>
                  </View>
                )}

                {/* Actions: Cancel if Pending and Owned */}
                {selectedRequest.status === 'Pending' && selectedRequest.employeeId === activeEmpId && (
                  <View style={styles.cancelActionWrap}>
                    <Button
                      title="Withdraw / Cancel Application"
                      variant="danger"
                      loading={isCancelling}
                      onPress={() => handleCancelRequest(selectedRequest.id)}
                    />
                  </View>
                )}

                {/* If HR and Pending: Direct link to approvals */}
                {selectedRequest.status === 'Pending' && isHrOrAdmin && (
                  <View style={styles.hrAdjudicateWrap}>
                    <Button
                      title="Open in Approvals Queue"
                      variant="primary"
                      leftIcon={<ShieldCheck size={16} color="#FFFFFF" />}
                      onPress={() => {
                        setIsDetailModalOpen(false);
                        navigation.navigate('LeaveApprovals');
                      }}
                    />
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  approvalsHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
  },
  approvalsHeaderText: {
    ...typography.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pendingBadge: {
    backgroundColor: colors.semantic.danger,
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    gap: spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
  },
  tabButtonActive: {
    backgroundColor: `${colors.primary}18`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tabButtonText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 40,
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  recordsCount: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  balanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    justifyContent: 'space-between',
  },
  balanceCard: {
    width: '48.5%',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  balCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  balTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    flex: 1,
    fontSize: 11,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 4,
  },
  balNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginVertical: 2,
  },
  balAvailableNum: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
  },
  balTotalNum: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: colors.background.tertiary,
    borderRadius: 2,
    marginVertical: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  balCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balFooterText: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  balPendingText: {
    fontSize: 10,
    color: colors.semantic.warning,
    fontWeight: '600',
  },
  applyBtn: {
    marginVertical: spacing.xs,
  },
  filterSection: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    height: 38,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  statusChipsRow: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  statusChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  statusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    flexWrap: 'wrap',
  },
  typePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  typePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  applicantBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dateSpan: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  daysBadge: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    marginLeft: 'auto',
  },
  daysBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  partialBanner: {
    backgroundColor: `${colors.semantic.warning}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginBottom: 4,
  },
  partialText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.semantic.warning,
  },
  reasonText: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 16,
    marginBottom: 6,
  },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.semantic.danger}12`,
    padding: 6,
    borderRadius: borderRadius.sm,
    marginBottom: 6,
  },
  rejectionText: {
    ...typography.caption,
    color: colors.semantic.danger,
    fontWeight: '600',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 6,
    marginTop: 2,
  },
  submittedOnText: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  viewDetailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  applyModalBox: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  detailModalBox: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  applyFormScroll: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  detailScroll: {
    padding: spacing.md,
    gap: spacing.md,
  },
  applicantInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  applicantInfoText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  typeSelectorWrap: {
    gap: 6,
  },
  typeSelectCard: {
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  typeSelectCardActive: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}10`,
  },
  typeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeSelectTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  typeSelectTitleActive: {
    color: colors.primary,
  },
  typeAvailBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  typeAvailBadgeActive: {
    color: colors.primary,
  },
  typeCodeSub: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  engineBanner: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: 6,
  },
  engineBannerSuccess: {
    backgroundColor: `${colors.semantic.success}10`,
    borderColor: `${colors.semantic.success}40`,
  },
  engineBannerError: {
    backgroundColor: `${colors.semantic.danger}10`,
    borderColor: `${colors.semantic.danger}40`,
  },
  engineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  engineTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engineTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
  },
  projectedBalText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  skippedWrap: {
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  skippedTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  skippedChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  skippedChip: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  skippedChipText: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  errorAlertText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.semantic.danger,
    marginTop: 2,
  },
  warningAlertText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.semantic.warning,
    marginTop: 2,
  },
  overlapBox: {
    gap: 6,
    marginTop: 4,
  },
  autoAdjustBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  autoAdjustBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  charCountText: {
    fontSize: 10,
    color: colors.text.tertiary,
    textAlign: 'right',
    marginTop: -4,
  },
  formActionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  detailHero: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
  },
  detailHeroType: {
    ...typography.h3,
    color: colors.text.primary,
  },
  detailHeroDept: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 2,
  },
  detailMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  detailMetaItem: {
    width: '47%',
  },
  detailMetaLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  detailMetaVal: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },
  partialCard: {
    flexDirection: 'row',
    backgroundColor: `${colors.semantic.warning}15`,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  partialCardCol: {
    flex: 1,
    alignItems: 'center',
  },
  partialCardDivider: {
    width: 1,
    backgroundColor: `${colors.semantic.warning}40`,
  },
  partialCardLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  partialCardValGreen: {
    ...typography.body,
    fontWeight: '800',
    color: colors.semantic.success,
    marginTop: 2,
  },
  partialCardValRed: {
    ...typography.body,
    fontWeight: '800',
    color: colors.semantic.danger,
    marginTop: 2,
  },
  sectionBlock: {
    gap: 4,
  },
  sectionBlockTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  reasonCard: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  reasonCardText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  contactText: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  rejectionDetailBox: {
    backgroundColor: `${colors.semantic.danger}12`,
    borderWidth: 1,
    borderColor: `${colors.semantic.danger}30`,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 6,
  },
  rejectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rejectionHeaderTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.semantic.danger,
  },
  rejectionDetailBody: {
    ...typography.bodySmall,
    color: colors.text.primary,
    lineHeight: 18,
  },
  adjudicatorSign: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  approvalDetailBox: {
    backgroundColor: `${colors.semantic.success}12`,
    borderWidth: 1,
    borderColor: `${colors.semantic.success}30`,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 6,
  },
  approvalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  approvalHeaderTitle: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.semantic.success,
  },
  approvalDetailBody: {
    ...typography.bodySmall,
    color: colors.text.primary,
    lineHeight: 18,
  },
  cancelActionWrap: {
    marginTop: spacing.xs,
  },
  hrAdjudicateWrap: {
    marginTop: spacing.xs,
  },
});
