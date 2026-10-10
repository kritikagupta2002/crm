import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, EmptyState } from '../../components/common';
import { AttendanceCorrection } from '../../types';
import {
  FileEdit,
  Plus,
  Search,
  Check,
  X,
  AlertCircle,
  Calendar,
  RotateCcw,
  CheckCircle2,
  Clock,
  UserCheck,
  Building,
} from 'lucide-react-native';
import {
  STANDARD_DEPARTMENTS,
  STANDARD_PROJECTS,
  getEmployeeProjectById,
} from '../../constants/attendance';

export const AttendanceCorrectionsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { corrections, reviewCorrection } = useHrms();
  const { session, hasRole } = useAuth();

  const isHrOrAdmin = hasRole(['Admin', 'HR']);
  const activeEmpId = (session as any)?.employeeId || (isHrOrAdmin ? 'BGS-2021-001' : 'BGS-2023-044');

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedReq, setSelectedReq] = useState<AttendanceCorrection | null>(null);
  const [reviewAction, setReviewAction] = useState<'Approved' | 'Rejected'>('Approved');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const filteredRequests = useMemo(() => {
    return corrections.filter((req) => {
      if (!isHrOrAdmin && req.employeeId !== activeEmpId) return false;

      if (selectedStatus !== 'all' && req.status !== selectedStatus) return false;

      if (isHrOrAdmin && selectedDept !== 'all' && req.department !== selectedDept) return false;

      if (isHrOrAdmin && selectedProject !== 'all') {
        const proj = getEmployeeProjectById(req.employeeId);
        if (proj !== selectedProject) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = req.employeeName.toLowerCase().includes(q);
        const matchId = req.employeeId.toLowerCase().includes(q);
        const matchReason = req.reason.toLowerCase().includes(q);
        const matchDate = req.date.includes(q);
        if (!matchName && !matchId && !matchReason && !matchDate) return false;
      }

      return true;
    });
  }, [corrections, isHrOrAdmin, activeEmpId, selectedStatus, selectedDept, selectedProject, searchQuery]);

  const handleOpenReview = (req: AttendanceCorrection, action: 'Approved' | 'Rejected') => {
    setSelectedReq(req);
    setReviewAction(action);
    setReviewComment(
      action === 'Approved'
        ? 'Verified with shift supervisor field log.'
        : 'Rejected due to insufficient justification.'
    );
    setReviewModalOpen(true);
  };

  const handleConfirmReview = async () => {
    if (!selectedReq) return;
    try {
      setIsSubmittingReview(true);
      await reviewCorrection(selectedReq.id, reviewAction, reviewComment.trim());
      setReviewModalOpen(false);
      Alert.alert(
        'Review Submitted',
        `Correction request for ${selectedReq.employeeName} has been ${reviewAction}. Attendance register updated.`
      );
    } catch (err: any) {
      Alert.alert('Review Error', err.message || 'Failed to submit review.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const renderCorrectionItem = ({ item }: { item: AttendanceCorrection }) => {
    const isPending = item.status === 'Pending';
    const isOwnCorrection = item.employeeId === activeEmpId;
    const proj = getEmployeeProjectById(item.employeeId);

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <Text style={styles.staffName}>{item.employeeName}</Text>
            <Text style={styles.staffMeta}>
              {item.employeeId} • Applied: {item.appliedDate || item.appliedAt || 'Recent'}
            </Text>
          </View>
          <StatusBadge status={item.status} size="sm" />
        </View>

        <View style={styles.projectTag}>
          <Text style={styles.projectText}>
            {proj} • {item.department || 'Operations'}
          </Text>
        </View>

        <View style={styles.detailsBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Target Date:</Text>
            <Text style={styles.detailValue}>{item.date}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Logged Punch:</Text>
            <Text style={styles.detailValue}>
              {item.currentCheckIn || '-'} — {item.currentCheckOut || '-'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.primary, fontWeight: '700' }]}>
              Requested Punch:
            </Text>
            <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '700' }]}>
              {item.requestedCheckIn || item.requestedIn} — {item.requestedCheckOut || item.requestedOut}
            </Text>
          </View>
        </View>

        <Text style={styles.reasonLabel}>Reason & Justification:</Text>
        <Text style={styles.reasonText}>{item.reason}</Text>

        {item.reviewedBy && (
          <View style={styles.reviewedBox}>
            <Text style={styles.reviewedText}>
              <Text style={{ fontWeight: '700' }}>Reviewed by {item.reviewedBy}:</Text>{' '}
              {item.reviewComment || item.hrRemarks || 'Sign-off complete.'}
            </Text>
          </View>
        )}

        {isHrOrAdmin && isPending && (
          <View style={styles.actionFooter}>
            {isOwnCorrection ? (
              <View style={styles.selfReviewNotice}>
                <AlertCircle size={14} color={colors.semantic.warning} />
                <Text style={styles.selfReviewText}>
                  4-Eyes Rule: You cannot approve your own regularization request.
                </Text>
              </View>
            ) : (
              <View style={styles.btnRow}>
                <Button
                  title="Reject"
                  variant="outline"
                  size="small"
                  style={styles.rejectBtn}
                  leftIcon={<X size={14} color={colors.semantic.danger} />}
                  onPress={() => handleOpenReview(item, 'Rejected')}
                />
                <Button
                  title="Approve"
                  variant="primary"
                  size="small"
                  style={styles.approveBtn}
                  leftIcon={<Check size={14} color="#fff" />}
                  onPress={() => handleOpenReview(item, 'Approved')}
                />
              </View>
            )}
          </View>
        )}
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title={isHrOrAdmin ? 'Attendance Corrections' : 'My Regularizations'}
        subtitle={
          isHrOrAdmin
            ? 'Sign off on missed punches, site extensions & GPS sync delays'
            : 'Track status of your biometric attendance regularization requests'
        }
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('NewCorrectionRequest')}
          >
            <Plus size={16} color={colors.primary} />
            <Text style={styles.addBtnText}>Request</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <Search size={16} color={colors.text.tertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder={isHrOrAdmin ? 'Search by staff, ID or reason...' : 'Search by reason or date...'}
              placeholderTextColor={colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearch}>×</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.statusTabs}>
          {['all', 'Pending', 'Approved', 'Rejected'].map((st) => (
            <TouchableOpacity
              key={st}
              style={[styles.statusTab, selectedStatus === st && styles.statusTabActive]}
              onPress={() => setSelectedStatus(st)}
            >
              <Text
                style={[
                  styles.statusTabText,
                  selectedStatus === st && styles.statusTabTextActive,
                ]}
              >
                {st === 'all' ? 'All' : st}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={renderCorrectionItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          ListEmptyComponent={
            <EmptyState
              icon={<FileEdit size={48} color={colors.text.tertiary} />}
              title="No Corrections Found"
              description="No attendance regularization requests match the current filters."
              actionTitle="Request Correction"
              onAction={() => navigation.navigate('NewCorrectionRequest')}
            />
          }
        />
      </View>

      <Modal statusBarTranslucent
        visible={reviewModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {reviewAction === 'Approved' ? 'Approve Regularization' : 'Reject Request'}
              </Text>
              <TouchableOpacity onPress={() => setReviewModalOpen(false)}>
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalStaffSummary}>
              <Text style={styles.modalStaffName}>{selectedReq?.employeeName}</Text>
              <Text style={styles.modalStaffMeta}>
                Target Date: {selectedReq?.date} • {selectedReq?.employeeId}
              </Text>
              <Text style={styles.modalReqTimes}>
                Requested: {selectedReq?.requestedCheckIn || selectedReq?.requestedIn} to{' '}
                {selectedReq?.requestedCheckOut || selectedReq?.requestedOut}
              </Text>
            </View>

            <Text style={styles.modalInputLabel}>Reviewer Comments & Decision Note:</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={3}
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="e.g. Verified with shift supervisor field log..."
              placeholderTextColor={colors.text.tertiary}
            />

            <View style={styles.modalBtnRow}>
              <Button
                title="Cancel"
                variant="outline"
                size="medium"
                style={{ flex: 1 }}
                onPress={() => setReviewModalOpen(false)}
              />
              <Button
                title={`Confirm ${reviewAction}`}
                variant={reviewAction === 'Approved' ? 'primary' : 'danger'}
                size="medium"
                style={{ flex: 1.5 }}
                onPress={handleConfirmReview}
                disabled={isSubmittingReview}
              />
            </View>
          </Card>
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
  content: {
    flex: 1,
    padding: spacing.md,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#EFF6FF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  addBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  searchRow: {
    marginBottom: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    height: 42,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.text.primary,
  },
  clearSearch: {
    fontSize: 18,
    color: colors.text.tertiary,
    paddingHorizontal: 4,
  },
  statusTabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  statusTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  statusTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusTabText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.secondary,
  },
  statusTabTextActive: {
    color: '#fff',
    fontWeight: typography.fontWeights.bold,
  },
  listContainer: {
    paddingBottom: spacing.xxxl,
  },
  card: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  headerLeft: {
    flex: 1,
  },
  staffName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  staffMeta: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  projectTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.xs,
    marginBottom: spacing.sm,
  },
  projectText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeights.semibold,
  },
  detailsBox: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: 4,
    marginBottom: spacing.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
  },
  detailValue: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  reasonLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  reasonText: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.primary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  reviewedBox: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  reviewedText: {
    fontSize: typography.fontSizes.xs,
    color: '#15803D',
  },
  actionFooter: {
    marginTop: spacing.xs,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rejectBtn: {
    flex: 1,
    borderColor: colors.semantic.danger,
  },
  approveBtn: {
    flex: 1.5,
  },
  selfReviewNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: '#FFFBEB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  selfReviewText: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: '#92400E',
    fontWeight: typography.fontWeights.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  modalStaffSummary: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  modalStaffName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  modalStaffMeta: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  modalReqTimes: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
    marginTop: 4,
  },
  modalInputLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  modalInput: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: typography.fontSizes.sm,
    color: colors.text.primary,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
