import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import {
  ScreenContainer,
  AppHeader,
  Card,
  StatusBadge,
  Button,
  Input,
  EmptyState,
} from '../../components/common';
import { ExpenseClaim, ExpenseStatus } from '../../types';
import { formatDate } from '../../utils/date';
import {
  Receipt,
  Search,
  Plus,
  IndianRupee,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Paperclip,
  Eye,
  X,
  FileText,
  Clock,
  Briefcase,
  AlertTriangle,
  MapPin,
  Check,
  ChevronRight,
} from 'lucide-react-native';

const getInitials = (name?: string) => {
  if (!name) return 'EM';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export const ExpensesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { expenses, queries, refreshHrms } = useHrms();
  const { session, hasRole } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState<ExpenseClaim | null>(null);

  const statuses: ('All' | ExpenseStatus)[] = [
    'All',
    'Pending',
    'Approved',
    'Partially Approved',
    'Queried',
    'Settled',
    'Rejected',
  ];

  const isHr = hasRole(['Admin', 'HR']);
  const isAccountant = hasRole(['Admin', 'Accountant']);
  const isPrivileged = isHr || isAccountant;
  const activeEmpId = session?.accountType === 'team' ? (session as any).employeeId : 'BGS-2021-001';

  const baseExpenses = useMemo(() => {
    if (isPrivileged) {
      return expenses;
    }
    return expenses.filter((e) => e.employeeId === activeEmpId);
  }, [expenses, isPrivileged, activeEmpId]);

  const relevantQueries = useMemo(() => {
    if (isPrivileged) {
      return queries.filter((q) => q.status === 'Open');
    }
    return queries.filter((q) => q.employeeId === activeEmpId && q.status === 'Open');
  }, [queries, isPrivileged, activeEmpId]);

  const openQueryCount = relevantQueries.length;

  const stats = useMemo(() => {
    const totalClaimed = baseExpenses.reduce((acc, curr) => acc + (Number(curr.requestedAmount || curr.amount) || 0), 0);
    const totalApproved = baseExpenses.reduce((acc, curr) => acc + (Number(curr.approvedAmount) || 0), 0);
    const totalSettled = baseExpenses.reduce((acc, curr) => acc + (Number(curr.settledAmount) || 0), 0);
    const underQuery = baseExpenses.filter((e) => e.status === 'Queried').length;
    return { totalClaimed, totalApproved, totalSettled, underQuery };
  }, [baseExpenses]);

  const filteredExpenses = useMemo(() => {
    return baseExpenses.filter((e) => {
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (e.expenseNumber && e.expenseNumber.toLowerCase().includes(q)) ||
        e.employeeName.toLowerCase().includes(q) ||
        e.project.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q);

      const matchesStatus = selectedStatus === 'All' || e.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [baseExpenses, search, selectedStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshHrms();
    } finally {
      setRefreshing(false);
    }
  }, [refreshHrms]);

  const renderExpenseCard = ({ item }: { item: ExpenseClaim }) => {
    const canReview = isHr && (item.status === 'Pending' || item.status === 'Queried');
    const canSettle = isAccountant && (item.status === 'Approved' || item.status === 'Partially Approved');
    const isQueried = item.status === 'Queried';
    const isSettled = item.status === 'Settled';
    const isApproved = item.status === 'Approved';

    const accentColor = isSettled
      ? '#0D9488'
      : isApproved
      ? '#16A34A'
      : isQueried
      ? '#DC2626'
      : item.status === 'Partially Approved'
      ? '#D97706'
      : '#3B82F6';

    const initials = getInitials(item.employeeName);

    return (
      <View style={[styles.card, { borderLeftColor: accentColor }]}>
        {/* Top Line: Expense ID, Status Badge & Date */}
        <View style={styles.cardHeader}>
          <View style={styles.tagWrap}>
            <View style={styles.claimNumberBadge}>
              <Text style={styles.claimNumberText}>{item.expenseNumber || item.id}</Text>
            </View>
            <StatusBadge status={item.status} size="sm" />
          </View>
          <View style={styles.dateWrap}>
            <Clock size={11} color="#64748B" style={{ marginRight: 3 }} />
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          </View>
        </View>

        {/* Employee Row */}
        {isPrivileged && (
          <View style={styles.empRow}>
            <View style={styles.empAvatar}>
              <Text style={styles.empAvatarText}>{initials}</Text>
            </View>
            <Text style={styles.empName}>{item.employeeName}</Text>
            <View style={styles.deptBadge}>
              <Text style={styles.deptBadgeText}>{item.department || 'Operations'}</Text>
            </View>
          </View>
        )}

        {/* Project Block */}
        <View style={styles.projectRow}>
          <MapPin size={12} color="#0D9488" style={{ marginRight: 4 }} />
          <Text style={styles.projectText} numberOfLines={1}>
            {item.project}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.descText} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Amount Grid Strip */}
        <View style={styles.amountContainer}>
          <View style={styles.amountCol}>
            <Text style={styles.amountLabel}>CLAIMED</Text>
            <Text style={styles.amountVal}>
              ₹{Number(item.requestedAmount || item.amount || 0).toLocaleString('en-IN')}
            </Text>
          </View>

          {item.approvedAmount !== undefined && item.status !== 'Pending' && (
            <View style={styles.amountCol}>
              <Text style={styles.amountLabel}>APPROVED</Text>
              <Text style={[styles.amountVal, { color: '#16A34A' }]}>
                ₹{Number(item.approvedAmount).toLocaleString('en-IN')}
              </Text>
            </View>
          )}

          {item.settledAmount !== undefined && (item.status === 'Settled' || item.settledAmount > 0) && (
            <View style={styles.amountCol}>
              <Text style={styles.amountLabel}>SETTLED</Text>
              <Text style={[styles.amountVal, { color: '#0D9488' }]}>
                ₹{Number(item.settledAmount).toLocaleString('en-IN')}
              </Text>
            </View>
          )}
        </View>

        {/* Queried Notice Banner */}
        {isQueried && (
          <TouchableOpacity
            style={styles.queriedBanner}
            onPress={() => navigation.navigate('ExpenseQueries', { expenseId: item.id })}
            activeOpacity={0.8}
          >
            <AlertTriangle size={14} color="#D97706" />
            <Text style={styles.queriedBannerText} numberOfLines={1}>
              Audit query raised. Click to view & respond.
            </Text>
            <ChevronRight size={13} color="#D97706" />
          </TouchableOpacity>
        )}

        {/* Actions Row */}
        <View style={styles.cardActionsRow}>
          {(item as any).hasReceipt || item.receiptFileName ? (
            <TouchableOpacity
              style={styles.receiptBtn}
              onPress={() => setPreviewReceipt(item)}
            >
              <Paperclip size={13} color="#0D9488" />
              <Text style={styles.receiptBtnText}>Proof</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.noReceiptText}>No receipt</Text>
          )}

          {canReview && (
            <Button
              title="Audit / Approve"
              variant="outline"
              size="small"
              onPress={() => navigation.navigate('ExpenseReview', { expenseId: item.id })}
              style={{ flex: 1 }}
            />
          )}

          {canSettle && (
            <Button
              title="Disburse / Settle"
              variant="primary"
              size="small"
              onPress={() => navigation.navigate('ExpenseSettlement', { expenseId: item.id })}
              style={{ flex: 1 }}
            />
          )}

          {isSettled && (
            <View style={styles.settledCompletePill}>
              <CheckCircle2 size={13} color="#0D9488" />
              <Text style={styles.settledCompleteText}>Disbursed & Settled</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeaderWrap}>
      {/* 1. Interactive KPI Metrics Strip */}
      <View style={styles.metricsStrip}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.metricItem, selectedStatus === 'All' && styles.metricItemActive]}
          onPress={() => setSelectedStatus('All')}
        >
          <Text style={[styles.metricVal, { color: '#0D9488' }]}>{`₹${(stats.totalClaimed / 1000).toFixed(1)}k`}</Text>
          <Text style={styles.metricLbl}>Claimed</Text>
        </TouchableOpacity>

        <View style={styles.metricDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.metricItem, selectedStatus === 'Approved' && styles.metricItemActive]}
          onPress={() => setSelectedStatus('Approved')}
        >
          <Text style={[styles.metricVal, { color: '#16A34A' }]}>{`₹${(stats.totalApproved / 1000).toFixed(1)}k`}</Text>
          <Text style={styles.metricLbl}>Approved</Text>
        </TouchableOpacity>

        <View style={styles.metricDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.metricItem, selectedStatus === 'Settled' && styles.metricItemActive]}
          onPress={() => setSelectedStatus('Settled')}
        >
          <Text style={[styles.metricVal, { color: '#2563EB' }]}>{`₹${(stats.totalSettled / 1000).toFixed(1)}k`}</Text>
          <Text style={styles.metricLbl}>Settled</Text>
        </TouchableOpacity>

        <View style={styles.metricDivider} />

        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.metricItem, selectedStatus === 'Queried' && styles.metricItemActive]}
          onPress={() => setSelectedStatus('Queried')}
        >
          <Text style={[styles.metricVal, { color: stats.underQuery > 0 ? '#D97706' : '#16A34A' }]}>{stats.underQuery}</Text>
          <Text style={styles.metricLbl}>Queries</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Compact Quick Actions Bar */}
      <View style={styles.launchpadSection}>
        <Text style={styles.sectionHeader}>QUICK CLAIM ACTIONS</Text>
        <View style={styles.compactActionRow}>
          <TouchableOpacity
            style={styles.compactActionTile}
            onPress={() => navigation.navigate('ExpenseClaim')}
            activeOpacity={0.8}
          >
            <View style={[styles.compactSquircle, { backgroundColor: '#F0FDFA' }]}>
              <Plus size={18} color="#0D9488" strokeWidth={2.5} />
            </View>
            <Text style={styles.compactActionTitle}>New Claim</Text>
            <Text style={styles.compactActionSub}>Submit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.compactActionTile}
            onPress={() => navigation.navigate('ExpenseQueries')}
            activeOpacity={0.8}
          >
            <View style={[styles.compactSquircle, { backgroundColor: '#FFFBEB' }]}>
              <MessageSquare size={17} color="#D97706" />
            </View>
            <Text style={styles.compactActionTitle}>Queries ({openQueryCount})</Text>
            <Text style={styles.compactActionSub}>Clarification</Text>
          </TouchableOpacity>

          {isPrivileged && (
            <TouchableOpacity
              style={styles.compactActionTile}
              onPress={() => navigation.navigate('ExpenseReview')}
              activeOpacity={0.8}
            >
              <View style={[styles.compactSquircle, { backgroundColor: '#EFF6FF' }]}>
                <ShieldCheck size={17} color="#2563EB" />
              </View>
              <Text style={styles.compactActionTitle}>Audit Queue</Text>
              <Text style={styles.compactActionSub}>HR</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.compactActionTile}
            onPress={() => navigation.navigate('Reimbursement')}
            activeOpacity={0.8}
          >
            <View style={[styles.compactSquircle, { backgroundColor: '#FAF5FF' }]}>
              <FileText size={17} color="#9333EA" />
            </View>
            <Text style={styles.compactActionTitle}>Policy SOP</Text>
            <Text style={styles.compactActionSub}>Per-Diem</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Search Bar */}
      <View style={styles.searchContainer}>
        <Input
          placeholder={isPrivileged ? 'Search staff, project, category, claim ID...' : 'Search my claims, project, category...'}
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={17} color={colors.text.secondary} />}
        />
      </View>

      {/* 4. Filter Chips with right padding */}
      <View style={styles.filterScroll}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={statuses}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, selectedStatus === item && styles.filterChipActive]}
              onPress={() => setSelectedStatus(item)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStatus === item && styles.filterChipTextActive,
                ]}
              >
                {item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );

  return (
    <ScreenContainer
      scrollable={false}
      noPadding
      edges={['bottom']}
      header={
        <AppHeader
          title={isPrivileged ? 'Expense Workspace' : 'My Expenses'}
          subtitle={
            isPrivileged
              ? 'Organization expense audit & disbursement'
              : 'Field travel, lodging & exploration vouchers'
          }
          scenicBanner
          badge="Expenses & Claims"
          badgeIcon={<Receipt size={12} color="#0D9488" />}
          showBack
          onBack={() => navigation.goBack()}
          onNotificationPress={() => navigation.navigate('Notifications')}
          rightAction={
            <TouchableOpacity
              style={styles.addClaimHeaderBtn}
              onPress={() => navigation.navigate('ExpenseClaim')}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.addClaimText}>Claim</Text>
            </TouchableOpacity>
          }
        />
      }
    >
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseCard}
        contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom + 60, 96) }]}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            title={selectedStatus === 'All' ? 'No Expense Claims' : `No ${selectedStatus} Claims`}
            message={
              selectedStatus === 'All'
                ? 'Submit your first travel, fuel, or field food reimbursement voucher.'
                : `There are currently zero vouchers in "${selectedStatus}" status.`
            }
            actionLabel="Create Expense Claim"
            onAction={() => navigation.navigate('ExpenseClaim')}
          />
        }
      />

      {/* Receipt Proof Modal */}
      <Modal
        visible={!!previewReceipt}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setPreviewReceipt(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receipt Verification</Text>
              <TouchableOpacity onPress={() => setPreviewReceipt(null)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptDetails}>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>File Name:</Text>
                <Text style={styles.receiptMetaVal}>{previewReceipt?.receiptFileName || 'voucher_receipt.pdf'}</Text>
              </View>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>Category:</Text>
                <Text style={styles.receiptMetaVal}>{previewReceipt?.category}</Text>
              </View>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>Claim Amount:</Text>
                <Text style={[styles.receiptMetaVal, { fontWeight: '700', color: '#0D9488' }]}>
                  ₹{Number(previewReceipt?.requestedAmount || previewReceipt?.amount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>Date Incurred:</Text>
                <Text style={styles.receiptMetaVal}>{previewReceipt?.date}</Text>
              </View>
            </View>

            <View style={styles.receiptPreviewBox}>
              <Receipt size={44} color="#0D9488" />
              <Text style={styles.previewBoxTitle}>Verified Proof of Purchase</Text>
              <Text style={styles.previewBoxSub}>
                Digital voucher copy verified against corporate GST policy.
              </Text>
            </View>

            <Button
              title="Close Preview"
              variant="secondary"
              onPress={() => setPreviewReceipt(null)}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  addClaimHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: '#0D9488',
  },
  addClaimText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#FFFFFF',
  },
  listHeaderWrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  sectionHeader: {
    fontSize: 10.5,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.secondary,
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 2,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: spacing.xs + 2,
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    ...shadows.xs,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  metricItemActive: {
    backgroundColor: '#F0FDFA',
  },
  metricVal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricDivider: {
    width: 1.2,
    height: 38,
    backgroundColor: '#E2E8F0',
  },

  /* Compact Action Tiles */
  launchpadSection: {
    marginBottom: spacing.xs + 2,
  },
  compactActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  compactActionTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.xs,
  },
  compactSquircle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  compactActionTitle: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  compactActionSub: {
    fontSize: 8.5,
    color: colors.text.tertiary,
    marginTop: 1,
    textAlign: 'center',
  },

  searchContainer: {
    marginBottom: 4,
  },
  filterScroll: {
    marginBottom: spacing.xs + 2,
  },
  filterList: {
    gap: 6,
    paddingVertical: 2,
    paddingRight: spacing.xl,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  list: {
    paddingBottom: 96,
  },
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: 13,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4.5,
    ...shadows.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  claimNumberBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.xs,
  },
  claimNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    fontFamily: 'monospace',
  },
  dateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  empRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  empAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  empAvatarText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#0369A1',
  },
  empName: {
    fontSize: 13,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  deptBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: radius.xs,
  },
  deptBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#0369A1',
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  projectText: {
    fontSize: 11.5,
    color: colors.text.secondary,
    fontWeight: '600',
    flex: 1,
  },
  descText: {
    fontSize: 12,
    color: colors.text.primary,
    lineHeight: 17,
    marginBottom: 8,
  },
  amountContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: 8,
    gap: spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  amountCol: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 8.5,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  amountVal: {
    fontSize: 13,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: 1,
  },
  queriedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    padding: 7,
    borderRadius: radius.sm,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  queriedBannerText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.semibold,
    color: '#92400E',
    flex: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  receiptBtnText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
    color: '#0D9488',
  },
  noReceiptText: {
    fontSize: 10.5,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
  settledCompletePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  settledCompleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
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
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  receiptDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  receiptMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptMetaLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
  },
  receiptMetaVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.primary,
  },
  receiptPreviewBox: {
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: '#F0FDFA',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: spacing.xs,
  },
  previewBoxTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: '#0D9488',
  },
  previewBoxSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});
