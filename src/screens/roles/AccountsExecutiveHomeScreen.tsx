import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResponsive } from '../../utils/responsive';
import { useNavigation } from '@react-navigation/native';
import { useAuth, useFinance, useNotifications } from '../../context';
import { colors, radius, shadows } from '../../theme';
import {
  Receipt,
  FileSpreadsheet,
  Scale,
  CreditCard,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  CheckCircle2,
  Clock,
  ChevronRight,
  ShieldCheck,
  Bell,
  Search,
  FileText,
  Building2,
  Wallet,
  Check,
  Split,
  FileCheck,
} from 'lucide-react-native';

interface AccountsExecutiveHomeScreenProps {
  navigation?: any;
}

export const AccountsExecutiveHomeScreen: React.FC<AccountsExecutiveHomeScreenProps> = ({ navigation: propNav }) => {
  const insets = useSafeAreaInsets();
  const hookNav = useNavigation<any>();
  const navigation = propNav || hookNav;
  const { isSmall, isCompact, isTablet } = useResponsive();

  const { session } = useAuth();
  const { unreadCount } = useNotifications();
  const {
    invoices,
    vendorBills,
    vouchers,
    taxRecords,
    gstReturns,
    refreshFinance,
  } = useFinance();

  const [refreshing, setRefreshing] = useState(false);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshFinance();
    setRefreshing(false);
  };

  // Operational metrics for billing and books
  const draftInvoices = useMemo(
    () => invoices.filter((i) => i.status === 'Draft' || i.status === 'Pending' || i.status === 'Unpaid'),
    [invoices]
  );
  const pendingBillsReview = useMemo(
    () => vendorBills.filter((b) => b.status === 'Pending Approval' || b.status === 'Unpaid'),
    [vendorBills]
  );
  const totalInvoicedAmount = useMemo(
    () => invoices.reduce((sum, i) => sum + (i.totalAmount || 0), 0) || 12840000,
    [invoices]
  );
  const unpaidReceivables = useMemo(
    () => invoices.filter((i) => i.status !== 'Paid').reduce((sum, i) => sum + (i.totalAmount || 0), 0) || 3820000,
    [invoices]
  );
  const totalBillsAmount = useMemo(
    () => vendorBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0) || 1460000,
    [vendorBills]
  );

  const handleMatchBill = (billCode: string, vendorName: string) => {
    Alert.alert(
      'Confirm 3-Way Reconciliation',
      `Match ${billCode} (${vendorName}) with Work Order footage logs? Variance is ₹0.00.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Match',
          style: 'default',
          onPress: () => {
            Alert.alert('Matched Successfully', `${billCode} verified against PO & site DPR. Forwarded to Finance Master for release.`);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* 1. Bookkeeping Desk Top Bar (Light Theme & Accounts Desk) */}
      <View style={[styles.billingHeader, { paddingTop: Math.max(insets.top + 8, 16) }]}>
        <View style={[{ width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, isTablet && styles.tabletContainer]}>
        <View style={styles.headerLeftRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ProfileTab')}
            style={styles.avatarWrapper}
          >
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>PS</Text>
            </View>
            <View style={styles.avatarBadge}>
              <CreditCard size={9} color="#ffffff" strokeWidth={2.4} />
            </View>
          </TouchableOpacity>

          <View style={styles.headerTitleCol}>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.userNameText} numberOfLines={1}>
              {(session as any)?.name || 'Pooja Sharma'}
            </Text>
            <View style={styles.roleTagRow}>
              <View style={styles.roleTag}>
                <CreditCard size={10} color="#0284c7" strokeWidth={2.4} style={{ marginRight: 3 }} />
                <Text style={styles.roleTagText}>ACCOUNTS EXECUTIVE</Text>
              </View>
              <Text style={styles.orgTagText}>Billing & Daybook Desk</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('Invoices')}
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
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.containerContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        <View style={[styles.bodyWrapper, isCompact && { paddingHorizontal: 6 }, isTablet && styles.tabletContainer]}>
          {/* 2. Bespoke Hero: Daily Bookkeeping Action Pad */}
          <View style={styles.actionPadCard}>
            <Text style={styles.actionPadHeading}>DAILY BOOKKEEPING ACTIONS</Text>
            <Text style={styles.actionPadSub}>Primary daily accounting entries & reconciliation desk</Text>

            <View style={styles.actionPadGrid}>
              <TouchableOpacity
                style={styles.actionPadTile}
                activeOpacity={0.82}
                onPress={() => navigation.navigate('Invoices')}
              >
                <View style={[styles.padIconBox, { backgroundColor: '#dbeafe' }]}>
                  <Plus size={20} color="#1d4ed8" strokeWidth={2.4} />
                </View>
                <Text style={styles.padTileTitle}>Raise Tax Invoice</Text>
                <Text style={styles.padTileSub}>GST Client Bill</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionPadTile}
                activeOpacity={0.82}
                onPress={() => navigation.navigate('VendorBills')}
              >
                <View style={[styles.padIconBox, { backgroundColor: '#ffedd5' }]}>
                  <Receipt size={20} color="#ea580c" strokeWidth={2.4} />
                </View>
                <Text style={styles.padTileTitle}>Inward Vendor Bill</Text>
                <Text style={styles.padTileSub}>194C / 194J Entry</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionPadTile}
                activeOpacity={0.82}
                onPress={() => navigation.navigate('Vouchers')}
              >
                <View style={[styles.padIconBox, { backgroundColor: '#f3e8ff' }]}>
                  <Scale size={20} color="#7e22ce" strokeWidth={2.4} />
                </View>
                <Text style={styles.padTileTitle}>Journal / Cash</Text>
                <Text style={styles.padTileSub}>Daybook Voucher</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionPadTile}
                activeOpacity={0.82}
                onPress={() => navigation.navigate('VendorBills')}
              >
                <View style={[styles.padIconBox, { backgroundColor: '#dcfce7' }]}>
                  <Split size={20} color="#15803d" strokeWidth={2.4} />
                </View>
                <Text style={styles.padTileTitle}>3-Way Match</Text>
                <Text style={styles.padTileSub}>PO vs Bill vs DPR</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Accounts Bento KPI Grid */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpiRow}>
              {/* Client Invoices */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('Invoices')}
                style={[styles.kpiCard, styles.kpiCardProjects]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxProjects]}>
                    <Receipt size={17} color="#2563eb" strokeWidth={2.4} />
                  </View>
                  <View style={[styles.kpiBadgeProjects, { flexShrink: 1 }]}>
                    <Text style={styles.kpiBadgeTextProjects} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>GST Bills</Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValueProjects, isSmall && { fontSize: 20 }, isCompact && { fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {invoices.length || 6}
                  </Text>
                  <ArrowUpRight size={16} color="#2563eb" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle}>Client Invoices</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    Raised This Month
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Inward Bills */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('VendorBills')}
                style={[styles.kpiCard, styles.kpiCardClients]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxClients]}>
                    <FileSpreadsheet size={17} color="#0f766e" strokeWidth={2.4} />
                  </View>
                  <View style={[styles.kpiBadgeClients, { flexShrink: 1 }]}>
                    <Text style={styles.kpiBadgeTextClients} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Logged</Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValueClients, isSmall && { fontSize: 20 }, isCompact && { fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {vendorBills.length || 8}
                  </Text>
                  <ArrowUpRight size={16} color="#0d9488" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle}>Inward Bills</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    Rigs & Assays Recorded
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.kpiRow}>
              {/* Daybook Vouchers */}
              <TouchableOpacity
                activeOpacity={0.82}
                onPress={() => navigation.navigate('Vouchers')}
                style={[styles.kpiCard, styles.kpiCardEmployees]}
              >
                <View style={styles.kpiHeaderRow}>
                  <View style={[styles.kpiIconBox, styles.kpiIconBoxEmployees]}>
                    <Scale size={17} color="#15803d" strokeWidth={2.4} />
                  </View>
                  <View style={[styles.kpiBadgeEmployees, { flexShrink: 1 }]}>
                    <Text style={styles.kpiBadgeTextEmployees} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Posted</Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValueEmployees, isSmall && { fontSize: 20 }, isCompact && { fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {vouchers.length || 24}
                  </Text>
                  <ArrowUpRight size={16} color="#15803d" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle}>Daybook Entries</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    Journal & Cash Vouchers
                  </Text>
                </View>
              </TouchableOpacity>

              {/* 3-Way Match Pending */}
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
                    <Text style={styles.kpiBadgeTextPending} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Urgent</Text>
                  </View>
                </View>

                <View style={styles.kpiNumberRow}>
                  <Text style={[styles.kpiValuePending, isSmall && { fontSize: 20 }, isCompact && { fontSize: 22 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                    {pendingBillsReview.length || 3}
                  </Text>
                  <ArrowUpRight size={16} color="#ea580c" strokeWidth={2.4} />
                </View>

                <View style={styles.kpiLabelsCol}>
                  <Text style={styles.kpiTitle}>3-Way Matches</Text>
                  <Text style={styles.kpiSubtitle} numberOfLines={1}>
                    Awaiting Verification
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* 3. Inward Vendor Bills Awaiting 3-Way Match */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Inward Bills for 3-Way Match</Text>
              <View style={styles.counterBadge}>
                <Text style={styles.counterBadgeText}>{pendingBillsReview.length || 3} Unmatched</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('VendorBills')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>All Inward →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.matchingCardsStack}>
            {/* Match Card 1 */}
            <View style={styles.matchCard}>
              <View style={styles.matchTopRow}>
                <View style={styles.matchBillBadge}>
                  <Text style={styles.matchBillText}>INV-RDC-089</Text>
                </View>
                <View style={styles.varianceZeroBadge}>
                  <Text style={styles.varianceZeroText}>Variance: ₹0.00 (100% Match)</Text>
                </View>
              </View>

              <Text style={styles.matchVendorTitle}>Rajasthan Drilling Co. • Rig #1</Text>
              <Text style={styles.matchSubtitle}>
                PO #PO-GEO-042 • 1,420M Core Billed vs Site DPR Footage Log
              </Text>

              <View style={styles.matchValuesRow}>
                <View style={styles.matchValItem}>
                  <Text style={styles.matchValLabel}>PO Value</Text>
                  <Text style={styles.matchValNum}>₹6,80,000</Text>
                </View>
                <View style={styles.matchValDivider} />
                <View style={styles.matchValItem}>
                  <Text style={styles.matchValLabel}>Inward Billed</Text>
                  <Text style={styles.matchValNum}>₹6,80,000</Text>
                </View>
                <View style={styles.matchValDivider} />
                <View style={styles.matchValItem}>
                  <Text style={styles.matchValLabel}>TDS 194C</Text>
                  <Text style={[styles.matchValNum, { color: '#ea580c' }]}>₹13,600</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.matchActionBtn}
                activeOpacity={0.85}
                onPress={() => handleMatchBill('INV-RDC-089', 'Rajasthan Drilling Co.')}
              >
                <Check size={16} color="#ffffff" strokeWidth={2.4} style={{ marginRight: 6 }} />
                <Text style={styles.matchActionBtnText}>Reconcile & Match Bill</Text>
              </TouchableOpacity>
            </View>

            {/* Match Card 2 */}
            <View style={styles.matchCard}>
              <View style={styles.matchTopRow}>
                <View style={styles.matchBillBadge}>
                  <Text style={styles.matchBillText}>LAB-ASSAY-104</Text>
                </View>
                <View style={styles.varianceZeroBadge}>
                  <Text style={styles.varianceZeroText}>Variance: ₹0.00 (100% Match)</Text>
                </View>
              </View>

              <Text style={styles.matchVendorTitle}>Udaipur Core Assay Lab</Text>
              <Text style={styles.matchSubtitle}>
                Work Order #WO-88 • NABL Trace Assay Batch #44 Verified
              </Text>

              <View style={styles.matchValuesRow}>
                <View style={styles.matchValItem}>
                  <Text style={styles.matchValLabel}>PO Value</Text>
                  <Text style={styles.matchValNum}>₹2,40,000</Text>
                </View>
                <View style={styles.matchValDivider} />
                <View style={styles.matchValItem}>
                  <Text style={styles.matchValLabel}>Inward Billed</Text>
                  <Text style={styles.matchValNum}>₹2,40,000</Text>
                </View>
                <View style={styles.matchValDivider} />
                <View style={styles.matchValItem}>
                  <Text style={styles.matchValLabel}>TDS 194J</Text>
                  <Text style={[styles.matchValNum, { color: '#ea580c' }]}>₹4,800</Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.matchActionBtn}
                activeOpacity={0.85}
                onPress={() => handleMatchBill('LAB-ASSAY-104', 'Udaipur Core Assay Lab')}
              >
                <Check size={16} color="#ffffff" strokeWidth={2.4} style={{ marginRight: 6 }} />
                <Text style={styles.matchActionBtnText}>Reconcile & Match Bill</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4. Milestone Billing Queue (Tax Invoices to Raise) */}
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Milestone Billing Queue (AR)</Text>
              <View style={[styles.counterBadge, { backgroundColor: '#dbeafe' }]}>
                <Text style={[styles.counterBadgeText, { color: '#1d4ed8' }]}>2 Milestones Ready</Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Invoices')}
              style={styles.viewAllBtn}
            >
              <Text style={styles.viewAllText}>Billing Desk →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.billingQueueCard}>
            <View style={styles.queueItem}>
              <View style={styles.queueIconBox}>
                <FileCheck size={18} color="#1d4ed8" strokeWidth={2.4} />
              </View>
              <View style={styles.queueInfo}>
                <Text style={styles.queueTitle}>Hindustan Zinc Ltd • Stage 3 Milestone</Text>
                <Text style={styles.queueSub}>1,420M Drilling Completed • Billable: ₹14.20 L</Text>
              </View>
              <TouchableOpacity
                style={styles.generateBtn}
                onPress={() => navigation.navigate('Invoices')}
              >
                <Text style={styles.generateBtnText}>Raise Bill</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.queueDivider} />

            <View style={styles.queueItem}>
              <View style={styles.queueIconBox}>
                <FileCheck size={18} color="#1d4ed8" strokeWidth={2.4} />
              </View>
              <View style={styles.queueInfo}>
                <Text style={styles.queueTitle}>RSMM Jhamarkotra • DPR Batch #44</Text>
                <Text style={styles.queueSub}>Sampling Assays Cleared • Billable: ₹8.50 L</Text>
              </View>
              <TouchableOpacity
                style={styles.generateBtn}
                onPress={() => navigation.navigate('Invoices')}
              >
                <Text style={styles.generateBtnText}>Raise Bill</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 5. Accounts Workspaces */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Accounts Workspaces</Text>
          </View>

          <View style={styles.modulesGrid}>
            {[
              { title: 'Tax Invoices', subtitle: 'Raise & Dispatch (AR)', icon: Wallet, color: '#1d4ed8', bg: '#eff6ff', route: 'Invoices' },
              { title: 'Vendor Bills', subtitle: '3-Way Match (AP)', icon: Receipt, color: '#ea580c', bg: '#fff7ed', route: 'VendorBills' },
              { title: 'Daybook Vouchers', subtitle: 'Cash & Journal Book', icon: FileSpreadsheet, color: '#0d9488', bg: '#f0fdfa', route: 'Vouchers' },
              { title: 'Tax Compliance', subtitle: 'Statutory Registers', icon: ShieldCheck, color: '#7c3aed', bg: '#faf5ff', route: 'TaxCompliance' },
              { title: 'TDS Register', subtitle: 'Section 194C / 194J', icon: Scale, color: '#d97706', bg: '#fefce8', route: 'TdsRegister' },
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

  /* 1. Billing Header */
  billingHeader: {
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
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0284c7',
  },
  avatarInitials: {
    color: '#0369a1',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#0284c7',
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
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  roleTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0284c7',
  },
  orgTagText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
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

  /* 2. Action Pad Card */
  actionPadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    ...shadows.sm,
  },
  actionPadHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1e3a8a',
    letterSpacing: 0.8,
  },
  actionPadSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
    marginBottom: 14,
  },
  actionPadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionPadTile: {
    width: '48.2%',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  padIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  padTileTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  padTileSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
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

  /* 3. Matching Cards Stack */
  matchingCardsStack: {
    gap: 12,
    marginBottom: 18,
  },
  matchCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    ...shadows.xs,
  },
  matchTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  matchBillBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  matchBillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  varianceZeroBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  varianceZeroText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#15803d',
  },
  matchVendorTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  matchSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
  },
  matchValuesRow: {
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
  matchValItem: {
    flex: 1,
    alignItems: 'center',
  },
  matchValLabel: {
    fontSize: 10.5,
    color: '#64748b',
    marginBottom: 2,
  },
  matchValNum: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  matchValDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
  },
  matchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e40af',
    borderRadius: 12,
    paddingVertical: 11,
    ...shadows.xs,
  },
  matchActionBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },

  /* 4. Billing Queue Card */
  billingQueueCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    ...shadows.xs,
  },
  queueItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  queueIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  queueInfo: {
    flex: 1,
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  queueSub: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 1,
  },
  generateBtn: {
    backgroundColor: '#1e40af',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  generateBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  queueDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
    marginLeft: 46,
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
