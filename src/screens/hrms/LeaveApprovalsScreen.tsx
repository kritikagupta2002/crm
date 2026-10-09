import React, { useState, useMemo } from 'react';
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
  CheckCircle2,
  XCircle,
  ShieldCheck,
  User,
  Search,
  Filter,
  AlertTriangle,
  RotateCcw,
  Clock,
  Calendar,
  Phone,
  Check,
  X,
  FileCheck2,
  ChevronDown,
} from 'lucide-react-native';
import { formatDate } from '../../utils/workingDays';

export const LeaveApprovalsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { leaves, reviewLeave, leaveBalances, refreshHrms } = useHrms();
  const { session, hasRole } = useAuth();

  const isHrOrAdmin = hasRole(['Admin', 'HR']);
  const activeEmpId = session?.accountType === 'team' ? (session as any).employeeId : 'BGS-2021-001';
  const activeEmpName = session?.accountType === 'team' ? (session as any).name : 'HR Manager';

  const [selectedStatus, setSelectedStatus] = useState<string>('Pending');
  const [selectedType, setSelectedType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [selectedReq, setSelectedReq] = useState<LeaveRequest | null>(null);
  const [reviewMode, setReviewMode] = useState<'Full' | 'Partial' | 'Reject'>('Full');
  const [approvedDaysInput, setApprovedDaysInput] = useState<number>(1);
  const [approverComment, setApproverComment] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const filteredRequests = useMemo(() => {
    return leaves.filter((r) => {
      if (selectedStatus !== 'All' && r.status !== selectedStatus) {
        return false;
      }
      if (selectedType !== 'All' && !r.leaveType.toLowerCase().includes(selectedType.toLowerCase())) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          r.employeeName?.toLowerCase().includes(q) ||
          r.employeeId?.toLowerCase().includes(q) ||
          r.leaveType?.toLowerCase().includes(q) ||
          r.department?.toLowerCase().includes(q) ||
          r.reason?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [leaves, selectedStatus, selectedType, searchQuery]);

  const handleOpenReview = (req: LeaveRequest, initialMode: 'Full' | 'Partial' | 'Reject') => {
    if (req.employeeId === activeEmpId) {
      Alert.alert(
        '4-Eyes Principle Guard',
        'Company governance policy prohibits self-adjudication. Another authorized manager or HR administrator must review this application.'
      );
      return;
    }

    const reqDays = Number(req.requestedDays || req.days) || 1;
    setSelectedReq(req);
    setReviewMode(initialMode);
    setApprovedDaysInput(initialMode === 'Partial' ? Math.max(1, Math.floor(reqDays / 2)) : reqDays);
    setApproverComment(
      initialMode === 'Full'
        ? 'Approved in full. Project muster coverage confirmed.'
        : initialMode === 'Partial'
        ? 'Partially approved due to ongoing exploration sprint commitments.'
        : ''
    );
    setIsModalOpen(true);
  };

  const handleConfirmDecision = async () => {
    if (!selectedReq) return;

    if (selectedReq.employeeId === activeEmpId) {
      Alert.alert('Policy Violation', 'You cannot adjudicate your own leave application.');
      return;
    }

    if (reviewMode === 'Reject' && (!approverComment || !approverComment.trim())) {
      Alert.alert('Reason Required', 'A formal rejection reason is mandatory when declining leave.');
      return;
    }

    const requested = Number(selectedReq.requestedDays || selectedReq.days) || 1;
    let decision: 'Approved' | 'Partially Approved' | 'Rejected' = 'Approved';
    let daysToApprove = requested;

    if (reviewMode === 'Full') {
      decision = 'Approved';
      daysToApprove = requested;
    } else if (reviewMode === 'Reject') {
      decision = 'Rejected';
      daysToApprove = 0;
    } else if (reviewMode === 'Partial') {
      const parsedDays = Number(approvedDaysInput);
      if (isNaN(parsedDays) || parsedDays <= 0) {
        decision = 'Rejected';
        daysToApprove = 0;
      } else if (parsedDays >= requested) {
        decision = 'Approved';
        daysToApprove = requested;
      } else {
        decision = 'Partially Approved';
        daysToApprove = parsedDays;
      }
    }

    try {
      setIsProcessing(true);
      await reviewLeave(
        selectedReq.id,
        decision,
        approverComment.trim() || (decision === 'Approved' ? 'Approved in full' : 'Adjudicated'),
        daysToApprove
      );

      setIsModalOpen(false);
      setSelectedReq(null);

      const statusMsg =
        decision === 'Partially Approved'
          ? `partially approved (${daysToApprove} of ${requested} days approved, ${requested - daysToApprove} days rejected)`
          : decision.toLowerCase();

      Alert.alert(
        'Adjudication Confirmed',
        `Leave application for ${selectedReq.employeeName} has been ${statusMsg}. Attendance records updated accordingly.`
      );
    } catch (e: any) {
      Alert.alert('Adjudication Error', e.message || 'Failed to adjudicate leave request.');
    } finally {
      setIsProcessing(false);
    }
  };

  const balanceImpact = useMemo(() => {
    if (!selectedReq) return null;
    const currentBal = leaveBalances.find((b) => b.leaveType === selectedReq.leaveType);
    const available = currentBal ? currentBal.available : 10;
    const requested = Number(selectedReq.requestedDays || selectedReq.days) || 1;
    const deduction =
      reviewMode === 'Full' ? requested : reviewMode === 'Partial' ? approvedDaysInput : 0;
    const projectedAfter = available - deduction;
    const isDeficit = projectedAfter < 0;

    return {
      available,
      deduction,
      projectedAfter,
      isDeficit,
    };
  }, [selectedReq, reviewMode, approvedDaysInput, leaveBalances]);

  if (!isHrOrAdmin) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="Access Restricted"
          subtitle="HR & Executive authorization required"
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.restrictedBox}>
          <ShieldCheck size={48} color={colors.text.tertiary} />
          <Text style={styles.restrictedTitle}>Authorized Personnel Only</Text>
          <Text style={styles.restrictedText}>
            Leave approvals and company muster adjustments are restricted to HR Administrators and Executive Directors.
          </Text>
          <Button
            title="Return to My Leaves"
            variant="primary"
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </View>
    );
  }

  const renderApprovalCard = ({ item }: { item: LeaveRequest }) => {
    const isOwnRequest = item.employeeId === activeEmpId;
    const reqDays = Number(item.requestedDays || item.days) || 1;

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.applicantInfo}>
            <View style={styles.avatarMini}>
              <User size={20} color={colors.primary} strokeWidth={2.3} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.applicantName}>{item.employeeName}</Text>
              <Text style={styles.applicantMeta}>
                {item.employeeId} • {item.department || 'Geology & Mineral Exploration'}
              </Text>
            </View>
          </View>

          <StatusBadge status={item.status as any} size="medium" />
        </View>

        {isOwnRequest && (
          <View style={styles.selfReviewNotice}>
            <AlertTriangle size={16} color={colors.semantic.warning} />
            <Text style={styles.selfReviewText}>
              4-Eyes Rule: You cannot adjudicate your own application.
            </Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <View style={styles.leaveTypePill}>
            <Text style={styles.leaveTypePillText}>{item.leaveType}</Text>
          </View>
          <View style={styles.durationBadge}>
            <Text style={styles.durationBadgeText}>
              {reqDays} Working {reqDays === 1 ? 'Day' : 'Days'}
            </Text>
          </View>
        </View>

        <View style={styles.dateSpanRow}>
          <Calendar size={17} color="#475569" strokeWidth={2.2} />
          <Text style={styles.dateSpanText}>
            {formatDate(item.startDate)} → {formatDate(item.endDate)}
          </Text>
        </View>

        {item.status === 'Partially Approved' && (
          <View style={styles.partialBadgeBox}>
            <Text style={styles.partialBadgeText}>
              Approved: {item.approvedDays}d • Rejected: {item.rejectedDays}d
            </Text>
          </View>
        )}

        <Text style={styles.reasonText}>
          <Text style={{ fontWeight: '800', color: '#0f172a' }}>Reason: </Text>
          "{item.reason}"
        </Text>

        {item.contactDuringLeave && (
          <View style={styles.contactRow}>
            <Phone size={14} color="#64748b" strokeWidth={2} />
            <Text style={styles.contactText}>Emergency Contact: {item.contactDuringLeave}</Text>
          </View>
        )}

        {item.status === 'Rejected' && item.rejectionReason && (
          <View style={styles.adjudicatedRejectionBox}>
            <Text style={styles.adjudicatedRejectionText}>
              Rejection Reason: {item.rejectionReason}
            </Text>
          </View>
        )}

        {item.status === 'Approved' && item.approverComment && (
          <View style={styles.adjudicatedApprovalBox}>
            <Text style={styles.adjudicatedApprovalText}>
              Remarks: {item.approverComment} ({item.approverName || 'HR'})
            </Text>
          </View>
        )}

        {item.status === 'Pending' && (
          <View style={styles.syncNotice}>
            <CheckCircle2 size={16} color={colors.semantic.success} />
            <Text style={styles.syncNoticeText}>
              Approval automatically backfills Attendance records to 'On-Leave'.
            </Text>
          </View>
        )}

        {item.status === 'Pending' && (
          <View style={styles.actionsRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isOwnRequest}
              onPress={() => handleOpenReview(item, 'Reject')}
              style={[
                styles.actionBtn,
                styles.actionBtnDecline,
                isOwnRequest && styles.actionBtnDisabled,
              ]}
            >
              <X size={17} color={isOwnRequest ? '#94a3b8' : '#dc2626'} strokeWidth={2.5} />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isOwnRequest ? '#94a3b8' : '#dc2626' },
                ]}
              >
                Decline
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isOwnRequest}
              onPress={() => handleOpenReview(item, 'Partial')}
              style={[
                styles.actionBtn,
                styles.actionBtnPartial,
                isOwnRequest && styles.actionBtnDisabled,
              ]}
            >
              <Clock size={17} color={isOwnRequest ? '#94a3b8' : '#d97706'} strokeWidth={2.3} />
              <Text
                style={[
                  styles.actionBtnText,
                  { color: isOwnRequest ? '#94a3b8' : '#d97706' },
                ]}
              >
                Partial
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              disabled={isOwnRequest}
              onPress={() => handleOpenReview(item, 'Full')}
              style={[
                styles.actionBtn,
                styles.actionBtnApprove,
                isOwnRequest && styles.actionBtnDisabled,
              ]}
            >
              <Check size={18} color="#ffffff" strokeWidth={2.8} />
              <Text style={[styles.actionBtnText, { color: '#ffffff', fontWeight: '800' }]}>
                Approve
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Leave Approvals Queue"
        subtitle="Adjudication & attendance synchronization"
        showBack
        onBack={() => navigation.goBack()}
      />

      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Search size={15} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search applicant, department, reason..."
            placeholderTextColor={colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={15} color={colors.text.tertiary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipsRow}>
          {[
            { key: 'Pending', label: 'Pending Queue' },
            { key: 'Approved', label: 'Approved' },
            { key: 'Partially Approved', label: 'Partially Approved' },
            { key: 'Rejected', label: 'Rejected' },
            { key: 'All', label: 'All Requests' },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.statusChip, selectedStatus === item.key && styles.statusChipActive]}
              onPress={() => setSelectedStatus(item.key)}
            >
              <Text style={[styles.statusChipText, selectedStatus === item.key && styles.statusChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderApprovalCard}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="Queue Clear"
            message={
              selectedStatus === 'Pending'
                ? 'No pending employee leave applications awaiting adjudication.'
                : 'No leave applications match the selected status filter.'
            }
            icon={<CheckCircle2 size={44} color={colors.semantic.success} />}
          />
        }
      />

      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.adjudicateModalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Adjudicate Leave Request</Text>
                <Text style={styles.modalSubtitle}>
                  Decision review for {selectedReq?.employeeName} ({selectedReq?.employeeId})
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsModalOpen(false)}>
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {selectedReq && (
              <ScrollView contentContainerStyle={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.summaryBanner}>
                  <Text style={styles.summaryLine}>
                    <Text style={{ fontWeight: '700' }}>Applicant: </Text>
                    {selectedReq.employeeName} ({selectedReq.department})
                  </Text>
                  <Text style={styles.summaryLine}>
                    <Text style={{ fontWeight: '700' }}>Leave Type: </Text>
                    {selectedReq.leaveType}
                  </Text>
                  <Text style={styles.summaryLine}>
                    <Text style={{ fontWeight: '700' }}>Duration: </Text>
                    {formatDate(selectedReq.startDate)} to {formatDate(selectedReq.endDate)} (
                    <Text style={{ fontWeight: '700', color: colors.primary }}>
                      {selectedReq.requestedDays || selectedReq.days} Working Days
                    </Text>
                    )
                  </Text>
                  <Text style={styles.summaryLine}>
                    <Text style={{ fontWeight: '700' }}>Applicant Reason: </Text>"{selectedReq.reason}"
                  </Text>
                </View>

                <Text style={styles.inputLabel}>Adjudication Decision</Text>
                <View style={styles.decisionTabsRow}>
                  <TouchableOpacity
                    style={[styles.decisionTab, reviewMode === 'Full' && styles.decisionTabFullActive]}
                    onPress={() => {
                      setReviewMode('Full');
                      setApprovedDaysInput(selectedReq.requestedDays || selectedReq.days || 1);
                      if (!approverComment) {
                        setApproverComment('Approved in full. Project muster coverage confirmed.');
                      }
                    }}
                  >
                    <CheckCircle2
                      size={15}
                      color={reviewMode === 'Full' ? colors.semantic.success : colors.text.tertiary}
                    />
                    <Text style={[styles.decisionTabText, reviewMode === 'Full' && styles.decisionTabTextFull]}>
                      Full Approval
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.decisionTab, reviewMode === 'Partial' && styles.decisionTabPartialActive]}
                    onPress={() => {
                      setReviewMode('Partial');
                      const total = selectedReq.requestedDays || selectedReq.days || 1;
                      setApprovedDaysInput(Math.max(1, Math.floor(total / 2)));
                      setApproverComment('Partially approved due to project sprint commitments.');
                    }}
                  >
                    <Clock
                      size={15}
                      color={reviewMode === 'Partial' ? colors.semantic.warning : colors.text.tertiary}
                    />
                    <Text style={[styles.decisionTabText, reviewMode === 'Partial' && styles.decisionTabTextPartial]}>
                      Partial Approval
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.decisionTab, reviewMode === 'Reject' && styles.decisionTabRejectActive]}
                    onPress={() => {
                      setReviewMode('Reject');
                      setApprovedDaysInput(0);
                      setApproverComment('');
                    }}
                  >
                    <XCircle
                      size={15}
                      color={reviewMode === 'Reject' ? colors.semantic.danger : colors.text.tertiary}
                    />
                    <Text style={[styles.decisionTabText, reviewMode === 'Reject' && styles.decisionTabTextReject]}>
                      Rejection
                    </Text>
                  </TouchableOpacity>
                </View>

                {reviewMode === 'Partial' && (
                  <View style={styles.partialStepperBox}>
                    <View style={styles.partialStepperHeader}>
                      <Text style={styles.partialStepperTitle}>Approved Days to Grant:</Text>
                      <Text style={styles.partialDaysHighlight}>
                        {approvedDaysInput} of {selectedReq.requestedDays || selectedReq.days} Days
                      </Text>
                    </View>

                    <View style={styles.stepperControls}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => setApprovedDaysInput((prev) => Math.max(1, prev - 1))}
                      >
                        <Text style={styles.stepperBtnText}>-</Text>
                      </TouchableOpacity>

                      <View style={styles.stepperValueBox}>
                        <Text style={styles.stepperValueText}>{approvedDaysInput}</Text>
                        <Text style={styles.stepperValueSub}>Days Approved</Text>
                      </View>

                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() =>
                          setApprovedDaysInput((prev) =>
                            Math.min(
                              Math.max(1, (selectedReq.requestedDays || selectedReq.days || 2) - 1),
                              prev + 1
                            )
                          )
                        }
                      >
                        <Text style={styles.stepperBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.partialStatsRow}>
                      <View style={styles.partialStatItem}>
                        <Text style={styles.partialStatLabel}>Requested</Text>
                        <Text style={styles.partialStatNum}>
                          {selectedReq.requestedDays || selectedReq.days}d
                        </Text>
                      </View>
                      <View style={styles.partialStatItem}>
                        <Text style={[styles.partialStatLabel, { color: colors.semantic.success }]}>
                          Approved
                        </Text>
                        <Text style={[styles.partialStatNum, { color: colors.semantic.success }]}>
                          {approvedDaysInput}d
                        </Text>
                      </View>
                      <View style={styles.partialStatItem}>
                        <Text style={[styles.partialStatLabel, { color: colors.semantic.danger }]}>
                          Declined
                        </Text>
                        <Text style={[styles.partialStatNum, { color: colors.semantic.danger }]}>
                          {(selectedReq.requestedDays || selectedReq.days || 1) - approvedDaysInput}d
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {balanceImpact && (
                  <View style={styles.quotaImpactBox}>
                    <Text style={styles.quotaImpactTitle}>Quota Ledger Impact</Text>
                    <View style={styles.impactRow}>
                      <Text style={styles.impactLabel}>Current Available Quota:</Text>
                      <Text style={styles.impactVal}>{balanceImpact.available} days</Text>
                    </View>
                    <View style={styles.impactRow}>
                      <Text style={styles.impactLabel}>Deducted on Approval:</Text>
                      <Text style={[styles.impactVal, { color: colors.primary }]}>
                        {balanceImpact.deduction} days
                      </Text>
                    </View>
                    <View style={[styles.impactRow, styles.impactRowBorder]}>
                      <Text style={styles.impactLabel}>Projected Balance After Decision:</Text>
                      <Text
                        style={[
                          styles.impactVal,
                          {
                            color: balanceImpact.isDeficit
                              ? colors.semantic.danger
                              : colors.semantic.success,
                            fontWeight: '800',
                          },
                        ]}
                      >
                        {balanceImpact.projectedAfter} days
                      </Text>
                    </View>

                    {balanceImpact.isDeficit && (
                      <View style={styles.deficitWarning}>
                        <AlertTriangle size={13} color={colors.semantic.danger} />
                        <Text style={styles.deficitWarningText}>
                          Policy Alert: Approved duration exceeds available balance quota.
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <Input
                  label={
                    reviewMode === 'Reject'
                      ? 'Formal Rejection Reason (Mandatory *)'
                      : 'Approver Remarks / Instructions'
                  }
                  value={approverComment}
                  onChangeText={setApproverComment}
                  placeholder={
                    reviewMode === 'Reject'
                      ? 'e.g. Critical site mobilization audit scheduled during this period'
                      : 'e.g. Approved. Project team coverage confirmed'
                  }
                  multiline
                  numberOfLines={3}
                />

                {reviewMode === 'Reject' && (
                  <Text style={styles.rejectionNotice}>
                    * Company HR policy requires a clear explanation for all declined applications.
                  </Text>
                )}

                <View style={styles.modalActionButtons}>
                  <Button
                    title="Cancel"
                    variant="outline"
                    onPress={() => setIsModalOpen(false)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title={
                      reviewMode === 'Full'
                        ? 'Confirm Full Approval'
                        : reviewMode === 'Partial'
                        ? `Confirm Partial (${approvedDaysInput}d)`
                        : 'Confirm Rejection'
                    }
                    variant={reviewMode === 'Reject' ? 'danger' : 'primary'}
                    loading={isProcessing}
                    onPress={handleConfirmDecision}
                    style={{ flex: 1.5 }}
                  />
                </View>
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
  restrictedBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  restrictedTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  restrictedText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  filterSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.default,
    gap: spacing.xs,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.text.primary,
    paddingVertical: 0,
  },
  statusChipsRow: {
    gap: 8,
    paddingVertical: 6,
    paddingRight: 16,
  },
  statusChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  statusChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: 60,
    gap: 14,
  },
  card: {
    padding: 16,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarMini: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: `${colors.primary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicantName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: -0.2,
  },
  applicantMeta: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 2,
    fontWeight: '500',
  },
  selfReviewNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${colors.semantic.warning}15`,
    padding: 9,
    borderRadius: borderRadius.md,
  },
  selfReviewText: {
    fontSize: 12.5,
    color: colors.semantic.warning,
    fontWeight: '700',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  leaveTypePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  leaveTypePillText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  durationBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  durationBadgeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  dateSpanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  dateSpanText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text.primary,
  },
  partialBadgeBox: {
    backgroundColor: `${colors.semantic.warning}15`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
  },
  partialBadgeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.semantic.warning,
  },
  reasonText: {
    fontSize: 13.5,
    color: colors.text.secondary,
    lineHeight: 19,
    marginTop: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 2,
  },
  contactText: {
    fontSize: 12.5,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  adjudicatedRejectionBox: {
    backgroundColor: `${colors.semantic.danger}12`,
    padding: 10,
    borderRadius: borderRadius.md,
  },
  adjudicatedRejectionText: {
    fontSize: 12.5,
    color: colors.semantic.danger,
    fontWeight: '600',
  },
  adjudicatedApprovalBox: {
    backgroundColor: `${colors.semantic.success}12`,
    padding: 10,
    borderRadius: borderRadius.md,
  },
  adjudicatedApprovalText: {
    fontSize: 12.5,
    color: colors.semantic.success,
    fontWeight: '600',
  },
  syncNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${colors.semantic.success}12`,
    padding: 9,
    borderRadius: borderRadius.md,
    marginTop: 2,
  },
  syncNoticeText: {
    fontSize: 12,
    color: colors.semantic.success,
    fontWeight: '600',
    flex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnDecline: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
  },
  actionBtnPartial: {
    backgroundColor: '#fffbeb',
    borderWidth: 1.5,
    borderColor: '#fde68a',
  },
  actionBtnApprove: {
    flex: 1.3,
    backgroundColor: '#059669',
    borderWidth: 0,
  },
  actionBtnDisabled: {
    opacity: 0.45,
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  actionBtnText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  adjudicateModalBox: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
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
  modalBodyScroll: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  summaryBanner: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  summaryLine: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  inputLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    marginTop: 4,
  },
  decisionTabsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  decisionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  decisionTabFullActive: {
    backgroundColor: `${colors.semantic.success}18`,
    borderColor: colors.semantic.success,
  },
  decisionTabPartialActive: {
    backgroundColor: `${colors.semantic.warning}18`,
    borderColor: colors.semantic.warning,
  },
  decisionTabRejectActive: {
    backgroundColor: `${colors.semantic.danger}18`,
    borderColor: colors.semantic.danger,
  },
  decisionTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  decisionTabTextFull: {
    color: colors.semantic.success,
    fontWeight: '800',
  },
  decisionTabTextPartial: {
    color: colors.semantic.warning,
    fontWeight: '800',
  },
  decisionTabTextReject: {
    color: colors.semantic.danger,
    fontWeight: '800',
  },
  partialStepperBox: {
    backgroundColor: `${colors.semantic.warning}12`,
    borderWidth: 1,
    borderColor: `${colors.semantic.warning}35`,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  partialStepperHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  partialStepperTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.primary,
  },
  partialDaysHighlight: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.semantic.warning,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  stepperBtn: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  stepperBtnText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
  },
  stepperValueBox: {
    alignItems: 'center',
    minWidth: 80,
  },
  stepperValueText: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text.primary,
  },
  stepperValueSub: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  partialStatsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  partialStatItem: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    padding: 6,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  partialStatLabel: {
    fontSize: 9,
    color: colors.text.tertiary,
    fontWeight: '600',
  },
  partialStatNum: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 2,
  },
  quotaImpactBox: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  quotaImpactTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text.secondary,
    marginBottom: 2,
  },
  impactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  impactRowBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 4,
    marginTop: 2,
  },
  impactLabel: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  impactVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.primary,
  },
  deficitWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.semantic.danger}15`,
    padding: 4,
    borderRadius: borderRadius.sm,
    marginTop: 2,
  },
  deficitWarningText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.semantic.danger,
    flex: 1,
  },
  rejectionNotice: {
    fontSize: 10,
    color: colors.semantic.danger,
    fontStyle: 'italic',
    marginTop: -4,
  },
  modalActionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
