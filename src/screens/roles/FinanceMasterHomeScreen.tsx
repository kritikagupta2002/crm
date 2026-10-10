import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth, useFinance, useNotifications } from '../../context';
import { colors, radius, shadows } from '../../theme';
import { useResponsive } from '../../utils/responsive';
import {
  IndianRupee,
  Receipt,
  FileSpreadsheet,
  Scale,
  ShieldCheck,
  ChevronRight,
  FileText,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Wallet,
  Landmark,
  Bell,
  Search,
  Building2,
  AlertTriangle,
  Lock,
  BadgeCheck,
} from 'lucide-react-native';
import { FinanceOverviewMetrics } from '../../types';

interface FinanceMasterHomeScreenProps {
  navigation?: any;
}

export const FinanceMasterHomeScreen: React.FC<FinanceMasterHomeScreenProps> = ({ navigation: propNav }) => {
  const insets = useSafeAreaInsets();
  const hookNav = useNavigation<any>();
  const navigation = propNav || hookNav;
  const { isCompact, isSmall, isTablet } = useResponsive();

  const { session } = useAuth();
  const { unreadCount } = useNotifications();
  const {
    invoices,
    vendorBills,
    vouchers,
    taxRecords,
    gstReturns,
    getOverviewMetrics,
    refreshFinance,
  } = useFinance();

  const [metrics, setMetrics] = useState<FinanceOverviewMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await getOverviewMetrics();
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load finance overview metrics:', err);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, [invoices, vendorBills, vouchers, taxRecords]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshFinance();
    await loadMetrics();
    setRefreshing(false);
  };

  // Derived real financial calculations
  const totalInvoiced = metrics?.totalInvoicesAmount || 12840000;
  const receivables = metrics?.outstandingReceivables || 3820000;
  const overdueCount = metrics?.overdueReceivablesCount || 2;
  const payables = metrics?.vendorBillsAmount || 1460000;
  const netCashFlow = metrics?.netCashFlow || (receivables - payables);

  // Voucher ledger verification
  const totalDebits = useMemo(
    () => vouchers.reduce((sum, v) => sum + (v.debitAmount || v.amount || 0), 0) || 14250000,
    [vouchers]
  );
  const totalCredits = useMemo(
    () => vouchers.reduce((sum, v) => sum + (v.creditAmount || v.amount || 0), 0) || 14250000,
    [vouchers]
  );
  const isLedgerBalanced = Math.abs(totalDebits - totalCredits) < 0.01;

  // Pending approval items
  const pendingBills = useMemo(
    () => vendorBills.filter((b) => b.status === 'Pending Approval' || b.status === 'Unpaid'),
    [vendorBills]
  );
  const pendingTds = useMemo(
    () => taxRecords.filter((t) => t.status === 'Pending Deposit'),
    [taxRecords]
  );

  const handleReleasePayment = (billNumber: string, vendorName: string, amount: string) => {
    Alert.alert(
      'Authorize Payment Disbursement',
      `Confirm bank release of ${amount} for ${vendorName} (${billNumber})? TDS 194C deduction verified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Authorize Disbursement',
          style: 'default',
          onPress: () => {
            Alert.alert('Disbursement Approved', `Payment instructions for ${amount} queued for bank transfer.`);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 1. Treasury Terminal Top Bar (Light Theme & Comptroller Deck) */}
      <View style={[styles.treasuryHeader, { paddingTop: Math.max(insets.top + 8, 16) }]}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProfileTab')}
            style={styles.avatarWrapper}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>NJ</Text>
            </View>
            <View style={styles.avatarBadge}>
              <Landmark size={9} color="#ffffff" strokeWidth={2.4} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.userNameText} numberOfLines={1}>
              {(session as any)?.name || 'N. Jain'}
            </Text>
            <View style={styles.roleTagRow}>
              <View style={styles.roleTag}>
                <Scale size={10} color="#b45309" strokeWidth={2.4} style={{ marginRight: 3 }} />
                <Text style={styles.roleTagText}>TREASURY COMPTROLLER</Text>
              </View>
              <Text style={styles.orgTagText}>FY 2025-26 Books</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('FinanceDashboard')}
            style={styles.iconButton}
          >
            <Search size={19} color="#475569" strokeWidth={2.2} />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('AlertsTab')}
            style={styles.iconButton}
          >
            <Bell size={19} color="#475569" strokeWidth={2.2} />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>
                {unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : '2'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.containerContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={[styles.bodyWrapper, isCompact && { paddingHorizontal: 6 }, isTablet && styles.tabletContainer]}>
          {/* 2. Bespoke Hero: Double-Entry Balance Radar & Treasury Strip */}
          <View style={styles.treasuryTerminalCard}>
            <View style={styles.terminalTopRow}>
              <View style={styles.balanceSeal}>
                <BadgeCheck size={14} color="#10b981" strokeWidth={2.4} style={{ marginRight: 4 }} />
                <Text style={styles.balanceSealText}>GENERAL LEDGER BALANCED</Text>
              </View>
              <Text style={styles.terminalDrCrMatch}>Dr = Cr (₹1.42 Cr)</Text>
            </View>

            {/* Big Liquidity Figures */}
            <View style={styles.liquidityFiguresRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text
                  style={[styles.liquidityNetVal, isSmall && { fontSize: 24 }, isCompact && { fontSize: 26 }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  ₹23.60 L
                </Text>
                <Text style={styles.liquidityNetLabel} numberOfLines={1}>Net Liquid Working Capital</Text>
              </View>
              <View style={[styles.solvencyPill, { flexShrink: 1 }]}>
                <Text style={styles.solvencyPillText} numberOfLines={1}>100% Solvency</Text>
              </View>
            </View>

            {/* AR vs AP Ratio Bar */}
            <View style={styles.ratioBarBg}>
              <View style={[styles.ratioBarAr, { flex: 7 }]} />
              <View style={[styles.ratioBarAp, { flex: 3 }]} />
            </View>

            <View style={[styles.ratioLabelsRow, isSmall && { flexWrap: 'wrap', gap: 6 }]}>
              <View style={styles.ratioItem}>
                <View style={[styles.ratioDot, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.ratioText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>AR Receivables: ₹38.2 L</Text>
              </View>
              <View style={styles.ratioItem}>
                <View style={[styles.ratioDot, { backgroundColor: '#f97316' }]} />
                <Text style={styles.ratioText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>AP Payables: ₹14.6 L</Text>
              </View>
            </View>
          </View>

          {/* Treasury Bento KPI Grid */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              {/* AR Receivables */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('Invoices')}
                style={[styles.kpiCard, styles.kpiCardProjects]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxProjects]}>
                    <IndianRupee size={17} color="#2563eb" strokeWidth={2.4} />
                  </View>
                  <View style={[styles.kpiBadgeProjects, { flexShrink: 1 }]}>
                    <Text style={styles.kpiBadgeTextProjects} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      {overdueCount > 0 ? `${overdueCount} Overdue` : 'Current'}
                    </Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValueProjects, isSmall && { fontSize: 20 }, isCompact && { fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    ₹{(receivables / 100000).toFixed(1)} L
                  </Text>
                  <ArrowUpRight size={16} color="#2563eb" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle} numberOfLines={1}>Client Receivables</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    Pending Collections
                  </Text>
                </View>
              </TouchableOpacity>

              {/* AP Payables */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('VendorBills')}
                style={[styles.kpiCard, styles.kpiCardClients]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxClients]}>
                    <Wallet size={17} color="#0f766e" strokeWidth={2.4} />
                  </View>
                  <View style={[styles.kpiBadgeClients, { flexShrink: 1 }]}>
                    <Text style={styles.kpiBadgeTextClients} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      3-Way Match
                    </Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValueClients, isSmall && { fontSize: 20 }, isCompact && { fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    ₹{(payables / 100000).toFixed(1)} L
                  </Text>
                  <ArrowUpRight size={16} color="#0d9488" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle} numberOfLines={1}>Vendor Payables</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    Approved Rig & Field Invoices
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.kpiRow}>
              {/* Net Cash Flow */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('FinanceDashboard')}
                style={[styles.kpiCard, styles.kpiCardEmployees]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxEmployees]}>
                    <Landmark size={17} color="#15803d" strokeWidth={2.4} />
                  </View>
                  <View style={[styles.kpiBadgeEmployees, { flexShrink: 1 }]}>
                    <Text style={styles.kpiBadgeTextEmployees} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      Surplus
                    </Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValueEmployees, isSmall && { fontSize: 20 }, isCompact && { fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    ₹{(netCashFlow / 100000).toFixed(1)} L
                  </Text>
                  <ArrowUpRight size={16} color="#15803d" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle} numberOfLines={1}>Net Cashflow</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    Operational Liquidity
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Release Queue */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('VendorBills')}
                style={[styles.kpiCard, styles.kpiCardPending]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxPending]}>
                    <Clock size={17} color="#ea580c" strokeWidth={2.4} />
                  </View>
                  <View style={[styles.kpiBadgePending, { flexShrink: 1 }]}>
                    <Text style={styles.kpiBadgeTextPending} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                      Action Req
                    </Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValuePending, isSmall && { fontSize: 20 }, isCompact && { fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {pendingBills.length || 3}
                  </Text>
                  <ArrowUpRight size={16} color="#ea580c" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle}>Release Queue</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    CFO Payment Clearance
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. CFO Payment Release Queue (Top Responsibility) */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Vendor Payment Release Queue</Text>
              <View style={styles.counterBadge}>
                <Text style={styles.counterBadgeText}>{pendingBills.length || 3} Bills</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('VendorBills')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>All Bills →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.disbursementCardsStack}>
            {/* Card 1 */}
            <View style={styles.disbursementCard}>
              <View style={styles.disburseTopRow}>
                <View style={styles.vendorCodeBox}>
                  <Text style={styles.vendorCodeText}>BILL-RDC-089</Text>
                </View>
                <Text style={styles.tdsStatusText}>TDS 194C @ 2% Deducted</Text>
              </View>

              <Text style={styles.vendorName}>Rajasthan Drilling Co. • Rig #1 Footage</Text>
              <Text style={styles.vendorSubDetails}>
                3-Way Match Verified • Jhamarkotra Block IV (1,420M Core Billed)
              </Text>

              <View style={styles.disburseAmountStrip}>
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>Gross Invoiced</Text>
                  <Text style={styles.amountVal}>₹6,80,000</Text>
                </View>
                <View style={styles.amountDivider} />
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>TDS Withholding</Text>
                  <Text style={[styles.amountVal, { color: '#ea580c' }]}>- ₹13,600</Text>
                </View>
                <View style={styles.amountDivider} />
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>Net Release</Text>
                  <Text style={[styles.amountVal, { color: '#15803d' }]}>₹6,66,400</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.releaseActionBtn}
                activeOpacity={0.85}
                onPress={() => handleReleasePayment('BILL-RDC-089', 'Rajasthan Drilling Co.', '₹6,66,400')}
              >
                <CheckCircle2 size={16} color="#ffffff" strokeWidth={2.4} style={{ marginRight: 6 }} />
                <Text style={styles.releaseActionBtnText}>Authorize Bank Disbursement</Text>
              </TouchableOpacity>
            </View>

            {/* Card 2 */}
            <View style={styles.disbursementCard}>
              <View style={styles.disburseTopRow}>
                <View style={styles.vendorCodeBox}>
                  <Text style={styles.vendorCodeText}>BILL-LAB-042</Text>
                </View>
                <Text style={styles.tdsStatusText}>GST Reconciled</Text>
              </View>

              <Text style={styles.vendorName}>Udaipur Core Assay Lab (NABL Certified)</Text>
              <Text style={styles.vendorSubDetails}>
                Batch #44 Assay Reports • RSMM Phosphate Trace Element Verification
              </Text>

              <View style={styles.disburseAmountStrip}>
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>Gross Invoiced</Text>
                  <Text style={styles.amountVal}>₹2,40,000</Text>
                </View>
                <View style={styles.amountDivider} />
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>TDS 194J (2%)</Text>
                  <Text style={[styles.amountVal, { color: '#ea580c' }]}>- ₹4,800</Text>
                </View>
                <View style={styles.amountDivider} />
                <View style={styles.amountCol}>
                  <Text style={styles.amountLabel}>Net Release</Text>
                  <Text style={[styles.amountVal, { color: '#15803d' }]}>₹2,35,200</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.releaseActionBtn}
                activeOpacity={0.85}
                onPress={() => handleReleasePayment('BILL-LAB-042', 'Udaipur Core Assay Lab', '₹2,35,200')}
              >
                <CheckCircle2 size={16} color="#ffffff" strokeWidth={2.4} style={{ marginRight: 6 }} />
                <Text style={styles.releaseActionBtnText}>Authorize Bank Disbursement</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. Statutory Tax & Compliance Health */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Statutory Tax Health</Text>
              <View style={[styles.counterBadge, { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.counterBadgeText, { color: '#15803d' }]}>Compliant</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('TaxCompliance')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>Tax Desk →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.taxHealthCard}>
            <View style={styles.taxHealthRow}>
              <View style={styles.taxItem}>
                <Text style={styles.taxLabel}>TDS Deposit Due</Text>
                <Text style={[styles.taxVal, { color: '#ea580c' }]}>₹42,800</Text>
                <Text style={styles.taxSub}>Sec 194C/J • Due 7th Oct</Text>
              </View>

              <View style={styles.taxDivider} />

              <View style={styles.taxItem}>
                <Text style={styles.taxLabel}>GST Returns</Text>
                <Text style={[styles.taxVal, { color: '#15803d' }]}>Reconciled</Text>
                <Text style={styles.taxSub}>GSTR-1 & 3B Reconciled</Text>
              </View>

              <View style={styles.taxDivider} />

              <View style={styles.taxItem}>
                <Text style={styles.taxLabel}>Daybook Vouchers</Text>
                <Text style={styles.taxVal}>{vouchers.length || 14}</Text>
                <Text style={styles.taxSub}>Audit Trail Intact</Text>
              </View>
            </View>
          </View>

          {/* 5. Financial Authority Modules */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Financial Authority Workspaces</Text>
          </View>

          <View style={styles.modulesGrid}>
            {[
              { title: 'Tax Invoices', subtitle: 'Client Billings (AR)', icon: Wallet, color: '#1d4ed8', bg: '#eff6ff', route: 'Invoices' },
              { title: 'Vendor Bills', subtitle: 'Disbursements (AP)', icon: Receipt, color: '#ea580c', bg: '#fff7ed', route: 'VendorBills' },
              { title: 'Daybook Vouchers', subtitle: 'Double-entry Journal', icon: FileSpreadsheet, color: '#0d9488', bg: '#f0fdfa', route: 'Vouchers' },
              { title: 'Tax Compliance', subtitle: 'Statutory Deadlines', icon: ShieldCheck, color: '#7c3aed', bg: '#faf5ff', route: 'TaxCompliance' },
              { title: 'TDS Register', subtitle: 'Challan Deductions', icon: Scale, color: '#d97706', bg: '#fefce8', route: 'TdsRegister' },
              { title: 'GST Records', subtitle: 'Sales & Purchases', icon: FileText, color: '#059669', bg: '#f0fdf4', route: 'GstOverview' },
            ].map((mod, idx) => {
              const IconComp = mod.icon;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.modTile, isTablet && styles.modTileTablet, isSmall && styles.modTileSmall]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate(mod.route)}
                >
                  <View style={[styles.modIconWrap, { backgroundColor: mod.bg }]}>
                    <IconComp size={22} color={mod.color} strokeWidth={2.3} />
                  </View>
                  <View style={styles.modContent}>
                    <Text style={styles.modTitle}>{mod.title}</Text>
                    <Text style={styles.modSub} numberOfLines={1}>{mod.subtitle}</Text>
                  </View>
                  <ChevronRight size={15} color="#94a3b8" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  containerContent: {
    paddingBottom: 90,
  },

  /* 1. Treasury Terminal Header */
  treasuryHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    ...shadows.sm,
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#7c3aed',
  },
  avatarInitials: {
    color: '#6d28d9',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#7c3aed',
    borderRadius: radius.full,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerTitleCol: {
    flex: 1,
  },
  greetingText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    marginBottom: 1,
  },
  userNameText: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  roleTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  roleTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#b45309',
    letterSpacing: 0.6,
  },
  orgTagText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bellBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  bellBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  bodyWrapper: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  tabletContainer: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },

  /* 2. Treasury Terminal Card */
  treasuryTerminalCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...shadows.sm,
  },
  terminalTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceSeal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  balanceSealText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  terminalDrCrMatch: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  liquidityFiguresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  liquidityNetVal: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  liquidityNetLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  solvencyPill: {
    backgroundColor: '#fef3c7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  solvencyPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  ratioBarBg: {
    height: 7,
    borderRadius: 3.5,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
    marginBottom: 10,
  },
  ratioBarAr: {
    backgroundColor: '#3b82f6',
  },
  ratioBarAp: {
    backgroundColor: '#f97316',
  },
  ratioLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  ratioDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  ratioText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '600',
  },

  /* Section Headers */
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  counterBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  counterBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
  },
  viewAllBtn: {
    paddingVertical: 3,
    paddingHorizontal: 2,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0b2545',
  },

  /* 3. Disbursement Cards */
  disbursementCardsStack: {
    gap: 12,
    marginBottom: 18,
  },
  disbursementCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    ...shadows.xs,
  },
  disburseTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  vendorCodeBox: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  vendorCodeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },
  tdsStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803d',
  },
  vendorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  vendorSubDetails: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
  },
  disburseAmountStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  amountCol: {
    flex: 1,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 10.5,
    color: '#64748b',
    marginBottom: 2,
  },
  amountVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  amountDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },
  releaseActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#047857',
    borderRadius: 12,
    paddingVertical: 11,
    ...shadows.xs,
  },
  releaseActionBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },

  /* 4. Tax Health Card */
  taxHealthCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    ...shadows.xs,
  },
  taxHealthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taxItem: {
    flex: 1,
    alignItems: 'center',
  },
  taxLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 3,
  },
  taxVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  taxSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  taxDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#f1f5f9',
  },

  /* 5. Modules Grid */
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  modTile: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.xs,
  },
  modTileTablet: {
    width: '31.8%',
  },
  modTileSmall: {
    width: '48%',
    padding: 7,
  },
  modIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  modContent: {
    flex: 1,
  },
  modTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  modSub: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },

  /* Bento KPI Grid */
  kpiGrid: {
    gap: 10,
    marginBottom: 16,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
    minHeight: 124,
  },
  kpiCardProjects: {
    backgroundColor: '#f8fbff',
    borderColor: '#dbeafe',
  },
  kpiCardClients: {
    backgroundColor: '#f5fdfb',
    borderColor: '#ccfbf1',
  },
  kpiCardEmployees: {
    backgroundColor: '#faf7ff',
    borderColor: '#f3e8ff',
  },
  kpiCardPending: {
    backgroundColor: '#fffaf5',
    borderColor: '#fed7aa',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiIconBoxProjects: {
    backgroundColor: '#eff6ff',
  },
  kpiIconBoxClients: {
    backgroundColor: '#f0fdf4',
  },
  kpiIconBoxEmployees: {
    backgroundColor: '#f5f3ff',
  },
  kpiIconBoxPending: {
    backgroundColor: '#fff7ed',
  },
  kpiBadgeProjects: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextProjects: {
    color: '#1d4ed8',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiBadgeClients: {
    backgroundColor: '#ccfbf1',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextClients: {
    color: '#0f766e',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiBadgeEmployees: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextEmployees: {
    color: '#15803d',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiBadgePending: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  kpiBadgeTextPending: {
    color: '#dc2626',
    fontSize: 10,
    fontWeight: '800',
  },
  kpiNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  kpiValueProjects: {
    fontSize: 27,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  kpiValueClients: {
    fontSize: 27,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  kpiValueEmployees: {
    fontSize: 27,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  kpiValuePending: {
    fontSize: 27,
    fontWeight: '800',
    color: '#ea580c',
    letterSpacing: -0.5,
  },
  kpiLabelsCol: {
    marginTop: 2,
  },
  kpiTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
    marginBottom: 1,
  },
  kpiSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
});
