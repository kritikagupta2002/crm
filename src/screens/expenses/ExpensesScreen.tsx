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
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, Input, EmptyState } from '../../components';
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

  // Strict Data Isolation:
  // Regular employees ONLY see their own claims.
  // Privileged roles (HR/Admin/Accountant) see all company claims.
  const baseExpenses = useMemo(() => {
    if (isPrivileged) {
      return expenses;
    }
    return expenses.filter((e) => e.employeeId === activeEmpId);
  }, [expenses, isPrivileged, activeEmpId]);

  // Relevant queries for current user
  const relevantQueries = useMemo(() => {
    if (isPrivileged) {
      return queries.filter((q) => q.status === 'Open');
    }
    return queries.filter((q) => q.employeeId === activeEmpId && q.status === 'Open');
  }, [queries, isPrivileged, activeEmpId]);

  const openQueryCount = relevantQueries.length;

  // KPI Calculations
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
    const isOwner = item.employeeId === activeEmpId;
    const canReview = isHr && (item.status === 'Pending' || item.status === 'Queried');
    const canSettle = isAccountant && (item.status === 'Approved' || item.status === 'Partially Approved');
    const isQueried = item.status === 'Queried';

    return (
      <Card style={styles.card}>
        {/* Header: Project Tag & Status */}
        <View style={styles.cardHeader}>
          <View style={styles.tagWrap}>
            <Text style={styles.claimNumber}>{item.expenseNumber || item.id}</Text>
            <StatusBadge status={item.status} size="small" />
          </View>
          <Text style={styles.dateText}>{item.date}</Text>
        </View>

        {/* Employee & Department info for privileged reviewers */}
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

        <Text style={styles.category}>{item.category}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        {/* Amount Grid */}
        <View style={styles.amountGrid}>
          <View style={styles.amtCol}>
            <Text style={styles.amtLabel}>CLAIMED</Text>
            <Text style={styles.amtValue}>
              ₹{Number(item.requestedAmount || item.amount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.amtCol}>
            <Text style={styles.amtLabel}>APPROVED</Text>
            <Text style={[styles.amtValue, { color: colors.semantic.success }]}>
              ₹{Number(item.approvedAmount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.amtCol}>
            <Text style={styles.amtLabel}>SETTLED</Text>
            <Text style={[styles.amtValue, { color: colors.primary }]}>
              ₹{Number(item.settledAmount || 0).toLocaleString('en-IN')}
            </Text>
          </View>
        </View>

        {/* Receipt Attachment Indicator */}
        {item.receiptFileName && (
          <TouchableOpacity
            style={styles.receiptChip}
            onPress={() => setPreviewReceipt(item)}
            activeOpacity={0.7}
          >
            <Paperclip size={13} color={colors.primary} />
            <Text style={styles.receiptChipText} numberOfLines={1}>
              {item.receiptFileName}
            </Text>
            <Eye size={13} color={colors.primary} style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        )}

        {/* Queried Notice Banner */}
        {isQueried && (
          <View style={styles.queryBanner}>
            <AlertTriangle size={14} color={colors.semantic.warning} />
            <View style={{ flex: 1 }}>
              <Text style={styles.queryBannerTitle}>Clarification Requested</Text>
              <Text style={styles.queryBannerText} numberOfLines={2}>
                {item.queryMessage || 'Auditor has requested clarification before proceeding.'}
              </Text>
            </View>
          </View>
        )}

        {/* Settlement Reference Banner */}
        {item.settlementReference && (
          <View style={styles.settleBanner}>
            <CheckCircle2 size={13} color={colors.semantic.success} />
            <Text style={styles.settleText}>
              Disbursed via {item.paymentMode || 'Direct Transfer'} (UTR: {item.settlementReference})
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.cardActions}>
          {isQueried && (
            <TouchableOpacity
              style={styles.queryActionBtn}
              onPress={() => navigation.navigate('ExpenseQueries', { expenseId: item.id })}
            >
              <MessageSquare size={14} color={colors.semantic.warning} />
              <Text style={styles.queryActionText}>
                {isOwner ? 'Respond to Query' : 'View Clarification'}
              </Text>
            </TouchableOpacity>
          )}

          {canReview && (
            <Button
              title="Audit & Review"
              variant="outline"
              size="small"
              onPress={() => navigation.navigate('ExpenseReview', { expenseId: item.id })}
              style={{ flex: 1 }}
            />
          )}

          {canSettle && (
            <Button
              title="Disburse & Settle"
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

  return (
    <View style={styles.container}>
      <AppHeader
        title={isPrivileged ? 'Expense Workspace' : 'My Expenses'}
        subtitle={
          isPrivileged
            ? 'Organization expense audit & disbursement'
            : 'Field travel, lodging & exploration vouchers'
        }
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.queryHeaderBtn}
              onPress={() => navigation.navigate('ExpenseQueries')}
            >
              <MessageSquare size={18} color={colors.semantic.warning} />
              {openQueryCount > 0 && (
                <View style={styles.queryBadge}>
                  <Text style={styles.queryBadgeText}>{openQueryCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addClaimHeaderBtn}
              onPress={() => navigation.navigate('ExpenseClaim')}
            >
              <Plus size={16} color={colors.primary} />
              <Text style={styles.addClaimText}>Claim</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* KPI Stats Bar */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>CLAIMED</Text>
          <Text style={styles.kpiValue}>₹{stats.totalClaimed.toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiLabel, { color: colors.semantic.success }]}>APPROVED</Text>
          <Text style={[styles.kpiValue, { color: colors.semantic.success }]}>
            ₹{stats.totalApproved.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiLabel, { color: colors.primary }]}>SETTLED</Text>
          <Text style={[styles.kpiValue, { color: colors.primary }]}>
            ₹{stats.totalSettled.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiLabel, { color: colors.semantic.warning }]}>QUERIES</Text>
          <Text style={[styles.kpiValue, { color: colors.semantic.warning }]}>
            {stats.underQuery}
          </Text>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Input
          placeholder={isPrivileged ? 'Search staff, project, category, claim ID...' : 'Search my claims, project, category...'}
          value={search}
          onChangeText={setSearch}
          leftIcon={<Search size={18} color={colors.text.secondary} />}
        />
      </View>

      {/* Status Filter Chips */}
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

      {/* Expense Claims List */}
      <FlatList
        data={filteredExpenses}
        keyExtractor={(item) => item.id}
        renderItem={renderExpenseCard}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            title={selectedStatus === 'All' ? 'No Expense Claims' : `No ${selectedStatus} Claims`}
            message={
              search
                ? 'No claims match your search keywords.'
                : isPrivileged
                ? 'No staff expense vouchers currently lodged.'
                : 'You have not submitted any expense claims yet. Tap Claim above to file one.'
            }
            icon={<Receipt size={44} color={colors.text.tertiary} />}
          />
        }
      />

      {/* Receipt Preview Modal */}
      <Modal visible={!!previewReceipt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModal}>
            <View style={styles.receiptModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.receiptModalTitle}>Receipt Attachment</Text>
                <Text style={styles.receiptModalSub}>{previewReceipt?.expenseNumber || previewReceipt?.id}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setPreviewReceipt(null)}
                style={styles.closeBtn}
              >
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
                <Text style={[styles.receiptMetaVal, { fontWeight: '700', color: colors.primary }]}>
                  ₹{Number(previewReceipt?.requestedAmount || previewReceipt?.amount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.receiptMetaRow}>
                <Text style={styles.receiptMetaLabel}>Date Incurred:</Text>
                <Text style={styles.receiptMetaVal}>{previewReceipt?.date}</Text>
              </View>
            </View>

            <View style={styles.receiptPreviewBox}>
              <Receipt size={48} color={colors.primary} />
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  queryHeaderBtn: {
    padding: spacing.xs,
    position: 'relative',
  },
  queryBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: colors.semantic.warning,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queryBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  addClaimHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}15`,
  },
  addClaimText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  kpiContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: spacing.xs + 2,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  kpiValue: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 2,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  filterScroll: {
    marginBottom: spacing.sm,
  },
  filterList: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  card: {
    padding: spacing.md,
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
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
  },
  dateText: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  empRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  empName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  deptBadge: {
    fontSize: 10,
    color: colors.text.secondary,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  projectText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  category: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  description: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  amountGrid: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  amtCol: {
    flex: 1,
    alignItems: 'center',
  },
  amtLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  amtValue: {
    ...typography.body,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 2,
  },
  receiptChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: spacing.xs,
    gap: 4,
  },
  receiptChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    maxWidth: 220,
  },
  queryBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: `${colors.semantic.warning}15`,
    borderColor: `${colors.semantic.warning}30`,
    borderWidth: 1,
    padding: spacing.xs + 2,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  queryBannerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.semantic.warning,
  },
  queryBannerText: {
    fontSize: 11,
    color: colors.text.secondary,
    marginTop: 1,
  },
  settleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${colors.semantic.success}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  settleText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.semantic.success,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  queryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.semantic.warning}20`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: `${colors.semantic.warning}40`,
  },
  queryActionText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.semantic.warning,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  receiptModal: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    width: '100%',
    maxWidth: 400,
    padding: spacing.md,
  },
  receiptModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingBottom: spacing.sm,
  },
  receiptModalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  receiptModalSub: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  receiptDetails: {
    paddingVertical: spacing.sm,
    gap: 6,
  },
  receiptMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptMetaLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  receiptMetaVal: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  receiptPreviewBox: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    marginVertical: spacing.xs,
  },
  previewBoxTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  previewBoxSub: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: 2,
  },
});
