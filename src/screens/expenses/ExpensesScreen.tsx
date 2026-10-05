import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Image,
  ScrollView,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { ScreenContainer, AppHeader, Card, StatCard, StatusBadge, Button, Input, EmptyState } from '../../components/common';
import { DonutChart, MiniBarChart } from '../../components/common/NativeCharts';
import { ExpenseClaim, ExpenseStatus } from '../../types';
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
  TrendingUp,
} from 'lucide-react-native';

export const ExpensesScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
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

  const approvalPct = stats.totalClaimed > 0 ? Math.round((stats.totalApproved / stats.totalClaimed) * 100) : 100;

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

    return (
      <Card style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.tagWrap}>
            <Text style={styles.claimNumber}>{item.expenseNumber || item.id}</Text>
            <StatusBadge status={item.status} size="sm" />
          </View>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>

        {isPrivileged && (
          <View style={styles.empRow}>
            <Text style={styles.empName}>{item.employeeName}</Text>
            <Text style={styles.deptBadge}>{item.department || 'Operations'}</Text>
          </View>
        )}

        <View style={styles.projectRow}>
          <Briefcase size={12} color={colors.text.secondary} />
          <Text style={styles.projectText}>{item.project}</Text>
        </View>

        <Text style={styles.descText} numberOfLines={2}>
          {item.description}
        </Text>

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

        {isQueried && (
          <TouchableOpacity
            style={styles.queriedBanner}
            onPress={() => navigation.navigate('ExpenseQueries', { expenseId: item.id })}
          >
            <AlertTriangle size={14} color="#D97706" />
            <Text style={styles.queriedBannerText} numberOfLines={1}>
              Audit query raised. Click to view & respond.
            </Text>
          </TouchableOpacity>
        )}

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
        </View>
      </Card>
    );
  };

  const renderHeader = () => (
    <View style={styles.listHeaderWrap}>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCol}>
          <StatCard
            title="TOTAL CLAIMED"
            value={`₹${(stats.totalClaimed / 1000).toFixed(1)}k`}
            caption={`${baseExpenses.length} Total Vouchers`}
            icon={<Receipt size={18} color="#0D9488" />}
            chart={<MiniBarChart values={[15, 30, 45, Math.min(60, Math.round(stats.totalClaimed / 1000))]} color="#0D9488" height={26} barWidth={5} />}
          />
        </View>

        <View style={styles.kpiCol}>
          <StatCard
            title="APPROVED"
            value={`₹${(stats.totalApproved / 1000).toFixed(1)}k`}
            caption={`${approvalPct}% Approval Rate`}
            icon={<ShieldCheck size={18} color="#16A34A" />}
            chart={<DonutChart percentage={approvalPct} color="#10B981" size={38} strokeWidth={5} />}
          />
        </View>

        <View style={styles.kpiCol}>
          <StatCard
            title="SETTLED"
            value={`₹${(stats.totalSettled / 1000).toFixed(1)}k`}
            caption="Disbursed To Account"
            icon={<IndianRupee size={18} color="#2563EB" />}
            chart={<MiniBarChart values={[10, 25, 40, Math.min(55, Math.round(stats.totalSettled / 1000))]} color="#2563EB" height={26} barWidth={5} />}
          />
        </View>

        <View style={styles.kpiCol}>
          <StatCard
            title="UNDER QUERY"
            value={String(stats.underQuery)}
            caption={stats.underQuery > 0 ? 'Clarifications Req' : 'Zero Queries'}
            icon={<MessageSquare size={18} color={stats.underQuery > 0 ? "#D97706" : "#16A34A"} />}
            trend={{ value: stats.underQuery > 0 ? 'Action Req' : 'Clear', isPositive: stats.underQuery === 0 }}
          />
        </View>
      </View>

      <View style={styles.launchpadSection}>
        <Text style={styles.sectionHeader}>QUICK CLAIM ACTIONS</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => navigation.navigate('ExpenseClaim')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionSquircle, { backgroundColor: '#F0FDFA' }]}>
              <Plus size={22} color="#0D9488" />
            </View>
            <Text style={styles.actionTileTitle}>New Claim</Text>
            <Text style={styles.actionTileSub}>Submit Voucher</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => navigation.navigate('ExpenseQueries')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionSquircle, { backgroundColor: '#FFFBEB' }]}>
              <MessageSquare size={22} color="#D97706" />
            </View>
            <Text style={styles.actionTileTitle}>Queries ({openQueryCount})</Text>
            <Text style={styles.actionTileSub}>Clarifications</Text>
          </TouchableOpacity>

          {isPrivileged && (
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('ExpenseReview')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#EFF6FF' }]}>
                <ShieldCheck size={22} color="#2563EB" />
              </View>
              <Text style={styles.actionTileTitle}>Audit Queue</Text>
              <Text style={styles.actionTileSub}>HR Review</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.actionTile}
            onPress={() => navigation.navigate('Reimbursement')}
            activeOpacity={0.8}
          >
            <View style={[styles.actionSquircle, { backgroundColor: '#FAF5FF' }]}>
              <FileText size={22} color="#9333EA" />
            </View>
            <Text style={styles.actionTileTitle}>Policy SOP</Text>
            <Text style={styles.actionTileSub}>Per-Diem Limits</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder={isPrivileged ? 'Search staff, project, category, claim ID...' : 'Search my claims, project, category...'}
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.text.secondary} />}
        />
      </View>

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
    <ScreenContainer edges={['bottom']}>
      <AppHeader
        title={isPrivileged ? 'Expense Workspace' : 'My Expenses'}
        subtitle={
          isPrivileged
            ? 'Organization expense audit & disbursement'
            : 'Field travel, lodging & exploration vouchers'
        }
        scenicBanner
        badge="Expenses & Claims"
        badgeIcon={<Receipt size={12} color="#0d9488" />}
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

      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseCard}
        contentContainerStyle={styles.list}
        ListHeaderComponent={renderHeader}
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

      <Modal
        visible={!!previewReceipt}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewReceipt(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Receipt Verification</Text>
              <TouchableOpacity onPress={() => setPreviewReceipt(null)}>
                <X size={20} color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptDetails}>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>File Name:</Text>
                <Text style={styles.receiptMetaVal}>{previewReceipt?.receiptFileName}</Text>
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
              <Receipt size={48} color="#0D9488" />
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
    paddingTop: spacing.md,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.secondary,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
    marginBottom: spacing.md,
  },
  kpiCol: {
    width: '50%',
    padding: spacing.xs,
  },
  launchpadSection: {
    marginBottom: spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionTile: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  actionSquircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actionTileTitle: {
    fontSize: 12,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  actionTileSub: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 1,
    textAlign: 'center',
  },
  searchContainer: {
    marginBottom: spacing.xs,
  },
  filterScroll: {
    marginBottom: spacing.sm,
  },
  filterList: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
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
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  list: {
    paddingBottom: spacing.xxxl,
  },
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  tagWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  claimNumber: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  dateText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.tertiary,
  },
  empRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  empName: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  deptBadge: {
    fontSize: 10,
    color: colors.text.secondary,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  projectText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    fontWeight: typography.fontWeights.medium,
  },
  descText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  amountContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  amountCol: {
    flex: 1,
  },
  amountLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  amountVal: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  queriedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFBEB',
    padding: spacing.xs + 2,
    borderRadius: radius.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  queriedBannerText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: '#92400E',
    flex: 1,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  receiptBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#0D9488',
  },
  noReceiptText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
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
    fontWeight: typography.fontWeights.medium,
    color: colors.text.primary,
  },
  receiptPreviewBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    borderRadius: radius.md,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderStyle: 'dashed',
  },
  previewBoxTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  previewBoxSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
});
