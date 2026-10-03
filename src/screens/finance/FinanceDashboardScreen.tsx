import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatCard, StatusBadge, EmptyState } from '../../components';
import {
  IndianRupee,
  FileSpreadsheet,
  Receipt,
  Scale,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Lock,
} from 'lucide-react-native';
import { FinanceOverviewMetrics } from '../../types';

export const FinanceDashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { session, hasRole } = useAuth();
  const {
    invoices,
    vendorBills,
    vouchers,
    taxRecords,
    getOverviewMetrics,
    refreshHrms,
    isLoading,
  } = useHrms();

  const [metrics, setMetrics] = useState<FinanceOverviewMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Role Security Guard: ONLY Accountant and Admin have access
  const isAuthorized = hasRole(['Admin', 'Accountant', 'admin', 'accountant']);

  const loadMetrics = async () => {
    try {
      const data = await getOverviewMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load finance overview metrics:', err);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadMetrics();
    }
  }, [invoices, vendorBills, vouchers, taxRecords, isAuthorized]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHrms();
    await loadMetrics();
    setRefreshing(false);
  };

  // If user is unauthorized (e.g. employee or HR), block access
  if (!isAuthorized) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="Finance & Accounting"
          subtitle="Commercial Ledger & Statutory Compliance"
          showBack
          onBack={() => navigation.goBack()}
        />
        <View style={styles.unauthorizedContainer}>
          <View style={styles.lockIconCircle}>
            <Lock size={36} color={colors.semantic.danger} />
          </View>
          <Text style={styles.unauthorizedTitle}>Access Restricted</Text>
          <Text style={styles.unauthorizedMessage}>
            The Finance Workspace contains confidential client tax invoices, vendor bills, and general
            ledger accounts. Access is restricted to Admin and Accountant personnel.
          </Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Return to Workspaces</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Derive metrics strictly from real stored data (NO fake numbers)
  const totalInvoiced = metrics?.totalInvoicesAmount || 0;
  const receivables = metrics?.outstandingReceivables || 0;
  const overdueInvoicesCount = metrics?.overdueReceivablesCount || 0;
  const totalPayables = metrics?.vendorBillsAmount || 0;
  const netCashFlow = metrics?.netCashFlow || 0;
  const netGstPayable = metrics?.netGstPayable || 0;
  const outputGst = metrics?.outputGst || 0;
  const inputTaxCredit = metrics?.inputTaxCredit || 0;
  const tdsPayable = metrics?.tdsPayable || 0;

  // Pending Actions
  const pendingBillsCount = vendorBills.filter((b) => b.status === 'Pending Approval').length;
  const pendingTdsCount = taxRecords.filter((t) => t.status === 'Pending Deposit').length;
  const unpaidInvoicesCount = invoices.filter((i) => i.status !== 'Paid').length;

  const modules = [
    {
      title: 'Client Tax Invoices (AR)',
      desc: `${invoices.length} invoices issued • GST & TDS withholding`,
      icon: <Receipt size={22} color={colors.primary} />,
      route: 'Invoices',
      badge: receivables > 0 ? `₹${(receivables / 100000).toFixed(1)}L Due` : 'All Settled',
      badgeTone: receivables > 0 ? 'warning' : 'success',
    },
    {
      title: 'Inward Vendor Bills (AP)',
      desc: `${vendorBills.length} contractor bills • ITC & Sec 194C/194J`,
      icon: <FileSpreadsheet size={22} color="#F59E0B" />,
      route: 'VendorBills',
      badge: pendingBillsCount > 0 ? `${pendingBillsCount} Pending Approval` : undefined,
      badgeTone: 'attention',
    },
    {
      title: 'Double-Entry Vouchers',
      desc: `${vouchers.length} balanced journal, payment & receipt vouchers`,
      icon: <Scale size={22} color="#3B82F6" />,
      route: 'Vouchers',
      badge: 'Balanced',
      badgeTone: 'success',
    },
    {
      title: 'Statutory TDS Register',
      desc: 'Sections 194C, 194J, 194I & 192 challan deposits',
      icon: <FileText size={22} color="#8B5CF6" />,
      route: 'TdsRegister',
      badge: tdsPayable > 0 ? `₹${(tdsPayable / 1000).toFixed(1)}k Due` : 'Deposited',
      badgeTone: tdsPayable > 0 ? 'warning' : 'success',
    },
    {
      title: 'GST Overview & Compliance',
      desc: 'Output GST minus ITC claimed = Net GST Liability',
      icon: <ShieldCheck size={22} color="#0D9488" />,
      route: 'GstOverview',
      badge: `₹${(netGstPayable / 100000).toFixed(1)}L Net`,
      badgeTone: 'neutral',
    },
  ];

  // Recent vouchers (latest 5)
  const recentVouchers = vouchers.slice(0, 5);

  return (
    <View style={styles.container}>
      <AppHeader
        title="Finance & Accounting"
        subtitle="Double-entry books, statutory GST & commercial ledger"
        showBack
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Core Financial Stat Cards (Real Stored Data Only) */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCol}>
            <StatCard
              title="GROSS INVOICED"
              value={`₹${(totalInvoiced / 100000).toFixed(2)} L`}
              caption={`${invoices.length} invoices issued`}
              icon={<TrendingUp size={18} color={colors.primary} />}
            />
          </View>
          <View style={styles.kpiCol}>
            <StatCard
              title="OUTSTANDING AR"
              value={`₹${(receivables / 100000).toFixed(2)} L`}
              caption={overdueInvoicesCount > 0 ? `${overdueInvoicesCount} overdue bills` : 'On track'}
              icon={<IndianRupee size={18} color={receivables > 0 ? colors.semantic.warning : colors.semantic.success} />}
            />
          </View>
        </View>

        <View style={styles.kpiRow}>
          <View style={styles.kpiCol}>
            <StatCard
              title="VENDOR BILLS (AP)"
              value={`₹${(totalPayables / 100000).toFixed(2)} L`}
              caption={`${vendorBills.length} contractor bills`}
              icon={<TrendingDown size={18} color="#F59E0B" />}
            />
          </View>
          <View style={styles.kpiCol}>
            <StatCard
              title="NET CASH FLOW"
              value={`${netCashFlow >= 0 ? '+' : ''}₹${(netCashFlow / 100000).toFixed(2)} L`}
              caption={netCashFlow >= 0 ? 'Operating Surplus' : 'Operating Deficit'}
              icon={<TrendingUp size={18} color={netCashFlow >= 0 ? colors.semantic.success : colors.semantic.danger} />}
            />
          </View>
        </View>

        {/* Statutory Tax Summary Banner */}
        <Card style={styles.taxSummaryCard} onPress={() => navigation.navigate('GstOverview')}>
          <View style={styles.taxCardHeader}>
            <View style={styles.taxCardTitleWrap}>
              <ShieldCheck size={20} color={colors.primary} />
              <Text style={styles.taxCardTitle}>Statutory GST & TDS Summary</Text>
            </View>
            <ChevronRight size={18} color={colors.text.secondary} />
          </View>

          <View style={styles.taxMetricsRow}>
            <View style={styles.taxMetric}>
              <Text style={styles.taxMetricLabel}>Output GST</Text>
              <Text style={styles.taxMetricValue}>₹{(outputGst / 100000).toFixed(2)}L</Text>
              <Text style={styles.taxMetricSub}>From invoices</Text>
            </View>
            <View style={styles.taxDivider} />
            <View style={styles.taxMetric}>
              <Text style={styles.taxMetricLabel}>Input Credit (ITC)</Text>
              <Text style={[styles.taxMetricValue, { color: colors.semantic.success }]}>
                ₹{(inputTaxCredit / 100000).toFixed(2)}L
              </Text>
              <Text style={styles.taxMetricSub}>From bills & claims</Text>
            </View>
            <View style={styles.taxDivider} />
            <View style={styles.taxMetric}>
              <Text style={styles.taxMetricLabel}>Net GST Payable</Text>
              <Text style={[styles.taxMetricValue, { color: colors.primary }]}>
                ₹{(netGstPayable / 100000).toFixed(2)}L
              </Text>
              <Text style={styles.taxMetricSub}>GSTR-3B Liability</Text>
            </View>
          </View>
        </Card>

        {/* Actionable Alerts (Pending Approvals & Filings) */}
        {(pendingBillsCount > 0 || pendingTdsCount > 0 || overdueInvoicesCount > 0) && (
          <View style={styles.alertsContainer}>
            <Text style={styles.sectionHeader}>PENDING COMMERCIAL ACTIONS</Text>

            {pendingBillsCount > 0 && (
              <TouchableOpacity
                style={styles.alertRow}
                onPress={() => navigation.navigate('VendorBills')}
                activeOpacity={0.7}
              >
                <AlertCircle size={16} color="#F59E0B" />
                <Text style={styles.alertText}>
                  <Text style={{ fontWeight: '700' }}>{pendingBillsCount} Vendor Bill(s)</Text> awaiting finance verification & approval.
                </Text>
                <ChevronRight size={16} color="#F59E0B" />
              </TouchableOpacity>
            )}

            {pendingTdsCount > 0 && (
              <TouchableOpacity
                style={styles.alertRow}
                onPress={() => navigation.navigate('TdsRegister')}
                activeOpacity={0.7}
              >
                <Clock size={16} color="#8B5CF6" />
                <Text style={styles.alertText}>
                  <Text style={{ fontWeight: '700' }}>{pendingTdsCount} TDS Deduction(s)</Text> pending statutory challan deposit (₹{(tdsPayable / 1000).toFixed(1)}k).
                </Text>
                <ChevronRight size={16} color="#8B5CF6" />
              </TouchableOpacity>
            )}

            {overdueInvoicesCount > 0 && (
              <TouchableOpacity
                style={styles.alertRow}
                onPress={() => navigation.navigate('Invoices')}
                activeOpacity={0.7}
              >
                <AlertCircle size={16} color={colors.semantic.danger} />
                <Text style={styles.alertText}>
                  <Text style={{ fontWeight: '700' }}>{overdueInvoicesCount} Client Invoice(s)</Text> overdue for collection.
                </Text>
                <ChevronRight size={16} color={colors.semantic.danger} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Commercial Workspaces Navigation Hub */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionHeader}>FINANCE & ACCOUNTING WORKSPACES</Text>

          {modules.map((item) => (
            <Card
              key={item.route}
              style={styles.menuCard}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={styles.iconCircle}>{item.icon}</View>
              <View style={styles.itemContent}>
                <View style={styles.itemTitleRow}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  {item.badge && (
                    <View
                      style={[
                        styles.badge,
                        item.badgeTone === 'warning' && styles.badgeWarning,
                        item.badgeTone === 'success' && styles.badgeSuccess,
                        item.badgeTone === 'attention' && styles.badgeAttention,
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          item.badgeTone === 'warning' && styles.badgeTextWarning,
                          item.badgeTone === 'success' && styles.badgeTextSuccess,
                          item.badgeTone === 'attention' && styles.badgeTextAttention,
                        ]}
                      >
                        {item.badge}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.itemDesc}>{item.desc}</Text>
              </View>
              <ChevronRight size={18} color={colors.text.tertiary} />
            </Card>
          ))}
        </View>

        {/* Recent Ledger Vouchers */}
        <View style={styles.vouchersSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>RECENT AUDITED VOUCHERS</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Vouchers')}>
              <Text style={styles.viewAllText}>View All ({vouchers.length})</Text>
            </TouchableOpacity>
          </View>

          {recentVouchers.length === 0 ? (
            <EmptyState
              title="No Vouchers Found"
              message="No double-entry vouchers have been recorded yet."
              icon={<Scale size={32} color={colors.text.tertiary} />}
            />
          ) : (
            recentVouchers.map((v) => (
              <Card key={v.id} style={styles.voucherItem} onPress={() => navigation.navigate('Vouchers')}>
                <View style={styles.voucherTop}>
                  <View style={styles.vNumWrap}>
                    <Text style={styles.voucherNo}>{v.voucherNumber}</Text>
                    <Text style={styles.voucherType}>{v.type}</Text>
                  </View>
                  <Text style={styles.voucherAmount}>₹{(v.amount || 0).toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.voucherNarration} numberOfLines={1}>
                  {v.narration}
                </Text>
                <View style={styles.voucherFooter}>
                  <Text style={styles.voucherDrCr}>
                    <Text style={{ color: colors.semantic.success, fontWeight: '700' }}>Dr:</Text> {v.debitAccount.split(' - ')[0]} • <Text style={{ color: colors.primary, fontWeight: '700' }}>Cr:</Text> {v.creditAccount.split(' - ')[0]}
                  </Text>
                  <Text style={styles.voucherDate}>{v.date}</Text>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  lockIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  unauthorizedTitle: {
    ...typography.titleLarge,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  unauthorizedMessage: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  backButtonText: {
    ...typography.labelLarge,
    color: '#ffffff',
    fontWeight: '700',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  kpiCol: {
    flex: 1,
  },
  taxSummaryCard: {
    padding: spacing.md,
    backgroundColor: '#F0FDFA',
    borderColor: '#99F6E4',
  },
  taxCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  taxCardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  taxCardTitle: {
    ...typography.titleSmall,
    fontWeight: '700',
    color: colors.primary,
  },
  taxMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taxMetric: {
    flex: 1,
    alignItems: 'center',
  },
  taxDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#CCFBF1',
  },
  taxMetricLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  taxMetricValue: {
    ...typography.titleSmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  taxMetricSub: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  alertsContainer: {
    gap: spacing.xs,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#FFFBEB',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertText: {
    ...typography.bodySmall,
    color: '#92400E',
    flex: 1,
  },
  menuContainer: {
    gap: spacing.sm,
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.tertiary,
    letterSpacing: 0.8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  viewAllText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  itemTitle: {
    ...typography.bodyLarge,
    fontWeight: '600',
    color: colors.text.primary,
  },
  itemDesc: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
  },
  badgeAttention: {
    backgroundColor: '#EDE9FE',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  badgeTextWarning: {
    color: '#B45309',
  },
  badgeTextSuccess: {
    color: '#15803D',
  },
  badgeTextAttention: {
    color: '#6D28D9',
  },
  vouchersSection: {
    gap: spacing.xs,
  },
  voucherItem: {
    padding: spacing.md,
    gap: 4,
    marginBottom: spacing.xs,
  },
  voucherTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vNumWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  voucherNo: {
    ...typography.labelMedium,
    fontWeight: '700',
    color: colors.primary,
  },
  voucherType: {
    fontSize: 10,
    fontWeight: '700',
    backgroundColor: colors.background.tertiary,
    color: colors.text.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  voucherAmount: {
    ...typography.labelLarge,
    fontWeight: '700',
    color: colors.text.primary,
  },
  voucherNarration: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  voucherFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  voucherDrCr: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
  voucherDate: {
    fontSize: 11,
    color: colors.text.tertiary,
  },
});
