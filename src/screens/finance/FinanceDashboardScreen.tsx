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
      icon: <Receipt size={22} color="#0D9488" />,
      bg: '#F0FDFA',
      route: 'Invoices',
      badge: receivables > 0 ? `₹${(receivables / 100000).toFixed(1)}L Due` : 'All Settled',
    },
    {
      title: 'Inward Vendor Bills (AP)',
      desc: `${vendorBills.length} contractor bills • ITC & Sec 194C/194J`,
      icon: <FileSpreadsheet size={22} color="#D97706" />,
      bg: '#FFFBEB',
      route: 'VendorBills',
      badge: pendingBillsCount > 0 ? `${pendingBillsCount} Pending` : undefined,
    },
    {
      title: 'Double-Entry Vouchers',
      desc: `${vouchers.length} balanced journal, payment & receipt vouchers`,
      icon: <Scale size={22} color="#2563EB" />,
      bg: '#EFF6FF',
      route: 'Vouchers',
      badge: 'Balanced',
    },
    {
      title: 'Statutory TDS Register',
      desc: 'Sections 194C, 194J, 194I & 192 challan deposits',
      icon: <FileText size={22} color="#9333EA" />,
      bg: '#FAF5FF',
      route: 'TdsRegister',
      badge: tdsPayable > 0 ? `₹${(tdsPayable / 1000).toFixed(1)}k Due` : 'Deposited',
    },
    {
      title: 'GST Overview & Compliance',
      desc: 'Output GST minus ITC claimed = Net GST Liability',
      icon: <ShieldCheck size={22} color="#16A34A" />,
      bg: '#F0FDF4',
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
          subtitle="Commercial Ledger & Statutory Compliance"
          scenicBanner
          badge="Finance & Treasury"
          badgeIcon={<IndianRupee size={12} color="#0d9488" />}
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
                <TrendingUp size={14} color="#0D9488" />
              </View>
              <Text style={styles.metricValue}>₹{(totalInvoiced / 100000).toFixed(1)}L</Text>
              <Text style={styles.metricLabel}>GROSS INVOICED</Text>
              <Text style={styles.metricSub}>{invoices.length} invoices issued</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <IndianRupee size={14} color={receivables > 0 ? "#D97706" : "#16A34A"} />
              </View>
              <Text style={styles.metricValue}>₹{(receivables / 100000).toFixed(1)}L</Text>
              <Text style={styles.metricLabel}>OUTSTANDING AR</Text>
              <Text style={styles.metricSub}>{overdueInvoicesCount > 0 ? `${overdueInvoicesCount} overdue bills` : 'Healthy collection'}</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <TrendingDown size={14} color="#D97706" />
              </View>
              <Text style={styles.metricValue}>₹{(totalPayables / 100000).toFixed(1)}L</Text>
              <Text style={styles.metricLabel}>VENDOR BILLS (AP)</Text>
              <Text style={styles.metricSub}>{vendorBills.length} contractor bills</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricIconWrap}>
                <TrendingUp size={14} color={netCashFlow >= 0 ? "#16A34A" : "#EF4444"} />
              </View>
              <Text style={[styles.metricValue, { color: netCashFlow >= 0 ? '#16A34A' : '#EF4444' }]}>
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
              <View style={[styles.actionSquircle, { backgroundColor: '#F0FDFA' }]}>
                <Receipt size={22} color="#0D9488" />
              </View>
              <Text style={styles.actionTileTitle}>Invoices</Text>
              <Text style={styles.actionTileSub}>AR Billing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('VendorBills')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#FFFBEB' }]}>
                <FileSpreadsheet size={22} color="#D97706" />
              </View>
              <Text style={styles.actionTileTitle}>Vendor Bills</Text>
              <Text style={styles.actionTileSub}>AP Expenses</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Vouchers')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#EFF6FF' }]}>
                <Scale size={22} color="#2563EB" />
              </View>
              <Text style={styles.actionTileTitle}>Vouchers</Text>
              <Text style={styles.actionTileSub}>Double Entry</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('GstOverview')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#F0FDF4' }]}>
                <ShieldCheck size={22} color="#16A34A" />
              </View>
              <Text style={styles.actionTileTitle}>GST Portal</Text>
              <Text style={styles.actionTileSub}>ITC & Net Tax</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('TdsRegister')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#FAF5FF' }]}>
                <FileText size={22} color="#9333EA" />
              </View>
              <Text style={styles.actionTileTitle}>TDS Register</Text>
              <Text style={styles.actionTileSub}>Challans & 194C</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('MisReports')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#FDF2F8' }]}>
                <BarChart3 size={22} color="#DB2777" />
              </View>
              <Text style={styles.actionTileTitle}>Financial MIS</Text>
              <Text style={styles.actionTileSub}>Board Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Card style={styles.taxSummaryCard} onPress={() => navigation.navigate('GstOverview')}>
          <View style={styles.taxCardHeader}>
            <View style={styles.taxCardTitleWrap}>
              <ShieldCheck size={20} color="#0D9488" />
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
              <Text style={[styles.taxMetricValue, { color: '#16A34A' }]}>
                ₹{(inputTaxCredit / 100000).toFixed(2)}L
              </Text>
              <Text style={styles.taxMetricSub}>From bills & claims</Text>
            </View>
            <View style={styles.taxDivider} />
            <View style={styles.taxMetric}>
              <Text style={styles.taxMetricLabel}>Net GST Payable</Text>
              <Text style={[styles.taxMetricValue, { color: '#0D9488' }]}>
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
                <AlertCircle size={16} color="#D97706" />
                <Text style={styles.alertText}>
                  <Text style={{ fontWeight: '700' }}>{pendingBillsCount} Vendor Bill(s)</Text> awaiting finance verification & approval.
                </Text>
                <ChevronRight size={16} color="#D97706" />
              </TouchableOpacity>
            )}

            {pendingTdsCount > 0 && (
              <TouchableOpacity
                style={styles.alertRow}
                onPress={() => navigation.navigate('TdsRegister')}
                activeOpacity={0.7}
              >
                <Clock size={16} color="#9333EA" />
                <Text style={styles.alertText}>
                  <Text style={{ fontWeight: '700' }}>{pendingTdsCount} TDS Deduction(s)</Text> pending statutory challan deposit (₹{(tdsPayable / 1000).toFixed(1)}k).
                </Text>
                <ChevronRight size={16} color="#9333EA" />
              </TouchableOpacity>
            )}

            {overdueInvoicesCount > 0 && (
              <TouchableOpacity
                style={styles.alertRow}
                onPress={() => navigation.navigate('Invoices')}
                activeOpacity={0.7}
              >
                <AlertCircle size={16} color="#EF4444" />
                <Text style={styles.alertText}>
                  <Text style={{ fontWeight: '700' }}>{overdueInvoicesCount} Client Invoice(s)</Text> overdue for collection.
                </Text>
                <ChevronRight size={16} color="#EF4444" />
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
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.sm,
    minWidth: 130,
    ...shadows.xs,
  },
  metricIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.sm,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.tertiary,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  metricSub: {
    fontSize: 10,
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
  taxSummaryCard: {
    padding: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  taxCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  taxCardTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  taxCardTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
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
    backgroundColor: '#E2E8F0',
  },
  taxMetricLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  taxMetricValue: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
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
    padding: spacing.sm + 2,
    backgroundColor: '#FFFBEB',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  alertText: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: '#92400E',
  },
  menuContainer: {
    gap: spacing.sm,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.md,
    ...shadows.sm,
  },
  menuIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
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
    marginBottom: 2,
  },
  menuTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  moduleBadge: {
    backgroundColor: '#F0FDFA',
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  moduleBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    color: '#0D9488',
  },
  menuDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
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
    backgroundColor: '#FEE2E2',
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
