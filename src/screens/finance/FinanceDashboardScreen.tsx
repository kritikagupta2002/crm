import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useFinance, useAuth } from '../../context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { ScreenContainer, AppHeader, Card, StatCard, StatusBadge, EmptyState } from '../../components/common';
import { DonutChart, MiniBarChart } from '../../components/common/NativeCharts';
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
  BarChart3,
  Building2,
  Wallet,
  ArrowLeftRight,
  PiggyBank,
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
    refreshFinance,
    isLoading,
  } = useFinance();

  const [metrics, setMetrics] = useState<FinanceOverviewMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
    await refreshFinance();
    await loadMetrics();
    setRefreshing(false);
  };

  if (!isAuthorized) {
    return (
      <ScreenContainer>
        <AppHeader
          title="Finance & Accounting"
          subtitle="Money in, money out and tax"
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
            onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('WorkspacesTab'))}
          >
            <Text style={styles.backButtonText}>Return to Workspaces</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  const totalInvoiced = metrics?.totalInvoicesAmount || 0;
  const receivables = metrics?.outstandingReceivables || 0;
  const overdueInvoicesCount = metrics?.overdueReceivablesCount || 0;
  const totalPayables = metrics?.vendorBillsAmount || 0;
  const netCashFlow = metrics?.netCashFlow || 0;
  const netGstPayable = metrics?.netGstPayable || 0;
  const outputGst = metrics?.outputGst || 0;
  const inputTaxCredit = metrics?.inputTaxCredit || 0;
  const tdsPayable = metrics?.tdsPayable || 0;

  const collectionPct = totalInvoiced > 0 ? Math.round(((totalInvoiced - receivables) / totalInvoiced) * 100) : 100;

  const pendingBillsCount = vendorBills.filter((b) => b.status === 'Pending Approval').length;
  const pendingTdsCount = taxRecords.filter((t) => t.status === 'Pending Deposit').length;
  const unpaidInvoicesCount = invoices.filter((i) => i.status !== 'Paid').length;

  const modules = [
    {
      title: 'Client Tax Invoices (AR)',
      desc: `${invoices.length} invoices issued • GST & TDS withholding`,
      icon: <Receipt size={22} color="#1f6f78" />,
      bg: '#eef7f7',
      route: 'Invoices',
      badge: receivables > 0 ? `₹${(receivables / 100000).toFixed(1)}L Due` : 'All Settled',
    },
    {
      title: 'Inward Vendor Bills (AP)',
      desc: `${vendorBills.length} contractor bills • ITC & Sec 194C/194J`,
      icon: <FileSpreadsheet size={22} color="#c27a12" />,
      bg: '#fcf0dc',
      route: 'VendorBills',
      badge: pendingBillsCount > 0 ? `${pendingBillsCount} Pending` : undefined,
    },
    {
      title: 'Double-Entry Vouchers',
      desc: `${vouchers.length} balanced journal, payment & receipt vouchers`,
      icon: <Scale size={22} color="#2f6fb3" />,
      bg: '#e6effa',
      route: 'Vouchers',
      badge: 'Balanced',
    },
    {
      title: 'Statutory TDS Register',
      desc: 'Sections 194C, 194J, 194I & 192 challan deposits',
      icon: <FileText size={22} color="#3d5a6c" />,
      bg: '#f1f5f7',
      route: 'TdsRegister',
      badge: tdsPayable > 0 ? `₹${(tdsPayable / 1000).toFixed(1)}k Due` : 'Deposited',
    },
    {
      title: 'GST Overview & Compliance',
      desc: 'Output GST minus ITC claimed = Net GST Liability',
      icon: <ShieldCheck size={22} color="#2e9e6b" />,
      bg: '#e3f4ec',
      route: 'GstOverview',
      badge: `₹${(netGstPayable / 100000).toFixed(1)}L Net`,
    },
  ];

  return (
    <ScreenContainer
      scrollable
      refreshing={refreshing}
      onRefresh={onRefresh}
      header={
        <AppHeader
          title="Finance & Accounting"
          subtitle="Money in, money out and tax"
          scenicBanner
          showBack
          onBack={() => navigation.goBack()}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
      contentContainerStyle={styles.content}
    >
        <View style={styles.kpiSection}>
          <Text style={styles.sectionHeader}>FINANCIAL LEDGER SNAPSHOT</Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsStrip}>
            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <TrendingUp size={14} color="#1f6f78" />
              </View>
              <Text style={styles.metricValue}>₹{(totalInvoiced / 100000).toFixed(1)}L</Text>
              <Text style={styles.metricLabel}>GROSS INVOICED</Text>
              <Text style={styles.metricSub}>{invoices.length} invoices issued</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <IndianRupee size={14} color={receivables > 0 ? "#c27a12" : "#2e9e6b"} />
              </View>
              <Text style={styles.metricValue}>₹{(receivables / 100000).toFixed(1)}L</Text>
              <Text style={styles.metricLabel}>OUTSTANDING AR</Text>
              <Text style={styles.metricSub}>{overdueInvoicesCount > 0 ? `${overdueInvoicesCount} overdue bills` : 'Healthy collection'}</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <TrendingDown size={14} color="#c27a12" />
              </View>
              <Text style={styles.metricValue}>₹{(totalPayables / 100000).toFixed(1)}L</Text>
              <Text style={styles.metricLabel}>VENDOR BILLS (AP)</Text>
              <Text style={styles.metricSub}>{vendorBills.length} contractor bills</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <TrendingUp size={14} color={netCashFlow >= 0 ? "#2e9e6b" : "#d24c47"} />
              </View>
              <Text style={[styles.metricValue, { color: netCashFlow >= 0 ? '#2e9e6b' : '#d24c47' }]}>
                {netCashFlow >= 0 ? '+' : ''}₹{(netCashFlow / 100000).toFixed(1)}L
              </Text>
              <Text style={styles.metricLabel}>NET CASH FLOW</Text>
              <Text style={styles.metricSub}>{netCashFlow >= 0 ? 'Surplus' : 'Deficit'}</Text>
            </View>
          </ScrollView>
        </View>

        <View style={styles.launchpadSection}>
          <Text style={styles.sectionHeader}>QUICK FINANCE ACTIONS</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Invoices')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#eef7f7' }]}>
                <Receipt size={22} color="#1f6f78" />
              </View>
              <Text style={styles.actionTileTitle}>Invoices</Text>
              <Text style={styles.actionTileSub}>AR Billing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('VendorBills')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#fcf0dc' }]}>
                <FileSpreadsheet size={22} color="#c27a12" />
              </View>
              <Text style={styles.actionTileTitle}>Vendor Bills</Text>
              <Text style={styles.actionTileSub}>AP Expenses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Vouchers')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#e6effa' }]}>
                <Scale size={22} color="#2f6fb3" />
              </View>
              <Text style={styles.actionTileTitle}>Vouchers</Text>
              <Text style={styles.actionTileSub}>Double Entry</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Receivables')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#e3f4ec' }]}>
                <Wallet size={22} color="#2e9e6b" />
              </View>
              <Text style={styles.actionTileTitle}>Receivables</Text>
              <Text style={styles.actionTileSub}>Aging & collections</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('PaymentsReceipts')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#e6effa' }]}>
                <ArrowLeftRight size={22} color="#2f6fb3" />
              </View>
              <Text style={styles.actionTileTitle}>Payments</Text>
              <Text style={styles.actionTileSub}>Cash in & out</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('FinancialReports')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#eef7f7' }]}>
                <BarChart3 size={22} color="#1f6f78" />
              </View>
              <Text style={styles.actionTileTitle}>Reports</Text>
              <Text style={styles.actionTileSub}>P&L, GST, TDS</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('BudgetCost')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#f7ebd5' }]}>
                <PiggyBank size={22} color="#b07d27" />
              </View>
              <Text style={styles.actionTileTitle}>Budget & Cost</Text>
              <Text style={styles.actionTileSub}>By project</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('GstOverview')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#e3f4ec' }]}>
                <ShieldCheck size={22} color="#2e9e6b" />
              </View>
              <Text style={styles.actionTileTitle}>GST Portal</Text>
              <Text style={styles.actionTileSub}>ITC & Net Tax</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('TdsRegister')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#f1f5f7' }]}>
                <FileText size={22} color="#3d5a6c" />
              </View>
              <Text style={styles.actionTileTitle}>TDS Register</Text>
              <Text style={styles.actionTileSub}>Challans & 194C</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('MisReports')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#f1f5f7' }]}>
                <BarChart3 size={22} color="#3d5a6c" />
              </View>
              <Text style={styles.actionTileTitle}>Financial MIS</Text>
              <Text style={styles.actionTileSub}>Board Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Card style={styles.taxSummaryCard} onPress={() => navigation.navigate('GstOverview')}>
          <View style={styles.taxCardHeader}>
            <View style={styles.taxCardTitleWrap}>
              <ShieldCheck size={20} color="#1f6f78" />
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
              <Text style={[styles.taxMetricValue, { color: '#2e9e6b' }]}>
                ₹{(inputTaxCredit / 100000).toFixed(2)}L
              </Text>
              <Text style={styles.taxMetricSub}>From bills & claims</Text>
            </View>
            <View style={styles.taxDivider} />
            <View style={styles.taxMetric}>
              <Text style={styles.taxMetricLabel}>Net GST Payable</Text>
              <Text style={[styles.taxMetricValue, { color: '#1f6f78' }]}>
                ₹{(netGstPayable / 100000).toFixed(2)}L
              </Text>
              <Text style={styles.taxMetricSub}>GSTR-3B Liability</Text>
            </View>
          </View>
        </Card>

        {(pendingBillsCount > 0 || pendingTdsCount > 0 || overdueInvoicesCount > 0) && (
          <View style={styles.alertsContainer}>
            <Text style={styles.sectionHeader}>PENDING COMMERCIAL ACTIONS</Text>

            {pendingBillsCount > 0 && (
              <TouchableOpacity
                style={styles.alertRow}
                onPress={() => navigation.navigate('VendorBills')}
                activeOpacity={0.7}
              >
                <AlertCircle size={16} color="#c27a12" />
                <Text style={styles.alertText}>
                  <Text style={{ fontWeight: '700' }}>{pendingBillsCount} Vendor Bill(s)</Text> awaiting finance verification & approval.
                </Text>
                <ChevronRight size={16} color="#c27a12" />
              </TouchableOpacity>
            )}

            {pendingTdsCount > 0 && (
              <TouchableOpacity
                style={styles.alertRow}
                onPress={() => navigation.navigate('TdsRegister')}
                activeOpacity={0.7}
              >
                <Clock size={16} color="#3d5a6c" />
                <Text style={styles.alertText}>
                  <Text style={{ fontWeight: '700' }}>{pendingTdsCount} TDS Deduction(s)</Text> pending statutory challan deposit (₹{(tdsPayable / 1000).toFixed(1)}k).
                </Text>
                <ChevronRight size={16} color="#3d5a6c" />
              </TouchableOpacity>
            )}

            {overdueInvoicesCount > 0 && (
              <TouchableOpacity
                style={styles.alertRow}
                onPress={() => navigation.navigate('Invoices')}
                activeOpacity={0.7}
              >
                <AlertCircle size={16} color="#d24c47" />
                <Text style={styles.alertText}>
                  <Text style={{ fontWeight: '700' }}>{overdueInvoicesCount} Client Invoice(s)</Text> overdue for collection.
                </Text>
                <ChevronRight size={16} color="#d24c47" />
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.menuContainer}>
          <Text style={styles.sectionHeader}>FINANCE & ACCOUNTING WORKSPACES</Text>

          {modules.map((item) => (
            <Card
              key={item.route}
              style={styles.menuCard}
              onPress={() => navigation.navigate(item.route)}
            >
              <View style={[styles.menuIconWrap, { backgroundColor: item.bg }]}>
                {item.icon}
              </View>
              <View style={styles.menuContent}>
                <View style={styles.menuTitleRow}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  {item.badge ? (
                    <View style={styles.moduleBadge}>
                      <Text style={styles.moduleBadgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
              <ChevronRight size={18} color={colors.text.tertiary} />
            </Card>
          ))}
        </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.secondary,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  kpiSection: {
    marginBottom: spacing.md,
  },
  metricsStrip: {
    paddingRight: spacing.sm,
    gap: spacing.sm,
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#e1e8eb',
    padding: 12,
    minWidth: 140,
    ...shadows.xs,
  },
  metricIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: '#edf1f3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  metricLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.text.tertiary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  metricSub: {
    fontSize: 10.5,
    color: colors.text.secondary,
    marginTop: 1,
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
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e1e8eb',
    ...shadows.xs,
  },
  actionSquircle: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actionTileTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.text.primary,
    textAlign: 'center',
  },
  actionTileSub: {
    fontSize: 10.5,
    color: colors.text.tertiary,
    marginTop: 1,
    textAlign: 'center',
  },
  taxSummaryCard: {
    padding: spacing.md + 2,
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e1e8eb',
    marginBottom: spacing.md,
    ...shadows.xs,
  },
  taxCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f3',
  },
  taxCardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  taxCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: colors.text.primary,
  },
  taxMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taxMetric: {
    flex: 1,
    alignItems: 'center',
  },
  taxDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#e1e8eb',
  },
  taxMetricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  taxMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: 2,
  },
  taxMetricSub: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 1,
  },
  alertsContainer: {
    marginBottom: spacing.md,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#fcf0dc',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#ecd6ae',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  alertText: {
    flex: 1,
    fontSize: 12.5,
    color: '#9a5f0c',
  },
  menuContainer: {
    gap: 10,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md + 2,
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e1e8eb',
    gap: spacing.md,
    ...shadows.xs,
  },
  menuIconWrap: {
    width: 46,
    height: 46,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text.primary,
  },
  moduleBadge: {
    backgroundColor: '#eef7f7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#ddefef',
  },
  moduleBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1f6f78',
  },
  menuDesc: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  unauthorizedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  lockIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fbe5e4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  unauthorizedTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  unauthorizedMessage: {
    fontSize: typography.fontSizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  backButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  backButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: '#FFFFFF',
  },
});
