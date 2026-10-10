import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  HardHat,
  Gavel,
  ShieldCheck,
  FileSpreadsheet,
  IndianRupee,
  CheckCircle2,
  Clock,
  Briefcase,
  ChevronRight,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react-native';
import { Tender, WorkOrder, SealedBid, TenderClarification } from '../../../types';
import { closingOf, daysFrom } from '../../../constants/vendor';
import { vendorTheme } from './vendorTheme';
import { VendorNavTab } from './VendorBottomNav';
import { useResponsive } from '../../../utils/responsive';

interface VendorHomeTabProps {
  vendorName: string;
  vendorCode: string;
  currentVendor: any;
  freshTenders: Tender[];
  myBids: { tender: Tender; bid: SealedBid }[];
  waitingOrders: WorkOrder[];
  myWorkOrders: WorkOrder[];
  clarifications: TenderClarification[];
  totalPaid: number;
  totalContract: number;
  onNavigateTab: (tab: VendorNavTab) => void;
  handleStartWork: (wo: WorkOrder) => void;
  handleOpenDelivery: (wo: WorkOrder) => void;
  handleOpenBilling: (wo: WorkOrder) => void;
  navigation: any;
}

export const VendorHomeTab: React.FC<VendorHomeTabProps> = ({
  vendorName,
  vendorCode,
  currentVendor,
  freshTenders,
  myBids,
  waitingOrders,
  myWorkOrders,
  clarifications,
  totalPaid,
  totalContract,
  onNavigateTab,
  handleStartWork,
  handleOpenDelivery,
  handleOpenBilling,
  navigation,
}) => {
  // Pending billing count: work orders delivered but not billed or billed & verifying
  const pendingBillsCount = myWorkOrders.filter(
    (w) => w.currentStage === 'Delivered' || w.currentStage === 'Billed'
  ).length;

  // Tenders closing in next 4 days
  const closingSoonTenders = freshTenders.filter((t) => {
    const closingTime = closingOf(t);
    const diffDays = (new Date(closingTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 4;
  });

  // Financial summary
  const totalBilled = myWorkOrders.reduce((sum, w) => sum + (w.billedAmount || 0), 0);
  const estimatedTdsDeducted = Math.round(totalPaid * 0.02);

  const { isSmall, isCompact, isTablet } = useResponsive();

  return (
    <View style={[styles.container, isTablet && styles.tabletContainer]}>
      {/* 1. WELCOME & STATUS BANNER (BIG & IMPACTFUL) */}
      <View style={styles.welcomeCard}>
        <View style={styles.welcomeRow}>
          <View style={styles.vendorAvatar}>
            <HardHat size={28} color={vendorTheme.colors.navy} strokeWidth={2.4} />
          </View>
          <View style={styles.welcomeInfo}>
            <Text style={styles.vendorTitle} numberOfLines={1}>
              {vendorName}
            </Text>
            <Text style={styles.vendorMeta}>
              Code: <Text style={styles.metaBold}>{vendorCode}</Text> • GSTIN:{' '}
              <Text style={styles.metaBold}>
                {currentVendor?.gstin ? currentVendor.gstin.slice(0, 10) + '•••' : 'Registered'}
              </Text>
            </Text>
            <View style={styles.statusPillRow}>
              <View style={styles.empanelledBadge}>
                <ShieldCheck size={14} color={vendorTheme.colors.tealDark} strokeWidth={2.5} />
                <Text style={styles.empanelledText}>
                  {currentVendor?.empanelledStatus || 'Empanelled Grade-A'}
                </Text>
              </View>
              <View style={styles.kycBadge}>
                <CheckCircle2 size={14} color={vendorTheme.colors.emerald} strokeWidth={2.5} />
                <Text style={styles.kycText}>Verified KYC</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 2. QUICK STATUS 4-TILE MATRIX (BIG NUMBERS & ICONS - 2x2 EXECUTIVE GRID) */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeaderTitle}>QUICK OVERVIEW</Text>
        <View style={styles.quickGrid}>
          {/* Row 1: Tenders & Bids */}
          <View style={styles.gridRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigateTab('tenders')}
              style={styles.quickTile}
            >
              <View style={styles.tileTopRow}>
                <View style={[styles.tileIconWrap, { backgroundColor: '#e0f2fe' }]}>
                  <Gavel size={19} color="#0284c7" strokeWidth={2.4} />
                </View>
                <View style={[styles.tileMiniPill, { backgroundColor: '#e0f2fe' }]}>
                  <Text style={[styles.tileMiniPillText, { color: '#0284c7' }]}>Live</Text>
                </View>
              </View>
              <Text style={styles.tileCount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{freshTenders.length}</Text>
              <Text style={styles.tileLabel}>Open Tenders</Text>
              <Text style={styles.tileSub}>Available to bid</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigateTab('work')}
              style={styles.quickTile}
            >
              <View style={styles.tileTopRow}>
                <View style={[styles.tileIconWrap, { backgroundColor: '#fef3c7' }]}>
                  <ShieldCheck size={19} color="#d97706" strokeWidth={2.4} />
                </View>
                <View style={[styles.tileMiniPill, { backgroundColor: '#fef3c7' }]}>
                  <Text style={[styles.tileMiniPillText, { color: '#d97706' }]}>Bids</Text>
                </View>
              </View>
              <Text style={styles.tileCount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{myBids.length}</Text>
              <Text style={styles.tileLabel}>Active Bids</Text>
              <Text style={styles.tileSub}>Submitted quotes</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Orders & Bills */}
          <View style={styles.gridRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigateTab('work')}
              style={styles.quickTile}
            >
              <View style={styles.tileTopRow}>
                <View style={[styles.tileIconWrap, { backgroundColor: '#ccfbf1' }]}>
                  <Briefcase size={19} color="#0d9488" strokeWidth={2.4} />
                </View>
                <View style={[styles.tileMiniPill, { backgroundColor: '#ccfbf1' }]}>
                  <Text style={[styles.tileMiniPillText, { color: '#0d9488' }]}>Orders</Text>
                </View>
              </View>
              <Text style={styles.tileCount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{waitingOrders.length}</Text>
              <Text style={styles.tileLabel}>Active Orders</Text>
              <Text style={styles.tileSub}>Field execution</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => onNavigateTab('work')}
              style={styles.quickTile}
            >
              <View style={styles.tileTopRow}>
                <View style={[styles.tileIconWrap, { backgroundColor: '#ecfdf5' }]}>
                  <FileSpreadsheet size={19} color="#059669" strokeWidth={2.4} />
                </View>
                <View style={[styles.tileMiniPill, { backgroundColor: '#ecfdf5' }]}>
                  <Text style={[styles.tileMiniPillText, { color: '#059669' }]}>Billing</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.tileCount,
                  pendingBillsCount > 0 && { color: vendorTheme.colors.emerald },
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {pendingBillsCount}
              </Text>
              <Text style={styles.tileLabel}>Pending Bills</Text>
              <Text style={styles.tileSub}>
                {pendingBillsCount > 0 ? 'Claims pending' : 'All clear'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3. ACTION REQUIRED SECTION (LARGE, ACTIONABLE CARDS) */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionHeaderTitle}>ACTION REQUIRED</Text>
          <View style={styles.actionCountBadge}>
            <Text style={styles.actionCountText}>
              {waitingOrders.length + closingSoonTenders.length}
            </Text>
          </View>
        </View>

        {waitingOrders.length === 0 && closingSoonTenders.length === 0 ? (
          <View style={styles.emptyActionCard}>
            <CheckCircle2 size={24} color={vendorTheme.colors.emerald} strokeWidth={2.4} />
            <Text style={styles.emptyActionTitle}>All Contractor Actions Up to Date</Text>
            <Text style={styles.emptyActionSubtitle}>
              No pending mobilization starts, field deliverables, or milestone invoices required at this time.
            </Text>
          </View>
        ) : (
          <View style={styles.actionList}>
            {/* Work orders requiring action */}
            {waitingOrders.map((wo) => (
              <View key={wo.id} style={styles.actionRowCard}>
                <View style={styles.actionRowTop}>
                  <View style={styles.actionBadgeRow}>
                    <View style={styles.actionTypePill}>
                      <Text style={styles.actionTypeText}>Work Order Action</Text>
                    </View>
                    <Text style={styles.actionWoCode}>{wo.woNumber || wo.id}</Text>
                  </View>
                  <View
                    style={[
                      styles.stageBadge,
                      wo.currentStage === 'Issued'
                        ? styles.stageIssued
                        : wo.currentStage === 'Started'
                        ? styles.stageStarted
                        : styles.stageDelivered,
                    ]}
                  >
                    <Text style={styles.stageBadgeText}>{wo.currentStage}</Text>
                  </View>
                </View>

                <Text style={styles.actionTitle} numberOfLines={1}>
                  {wo.projectTitle}
                </Text>
                <Text style={styles.actionScope} numberOfLines={2}>
                  {wo.work || wo.scopeOfWork || 'Field exploration & sampling subcontract execution'}
                </Text>

                <View style={styles.actionButtonsRow}>
                  {wo.currentStage === 'Issued' && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleStartWork(wo)}
                      style={[styles.primaryActionBtn, { backgroundColor: vendorTheme.colors.navy }]}
                    >
                      <Text style={styles.primaryActionBtnText}>Confirm Mobilization / Start</Text>
                    </TouchableOpacity>
                  )}
                  {wo.currentStage === 'Started' && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleOpenDelivery(wo)}
                      style={[styles.primaryActionBtn, { backgroundColor: vendorTheme.colors.teal }]}
                    >
                      <Text style={styles.primaryActionBtnText}>Submit Field Delivery Report</Text>
                    </TouchableOpacity>
                  )}
                  {wo.currentStage === 'Delivered' && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => handleOpenBilling(wo)}
                      style={[styles.primaryActionBtn, { backgroundColor: vendorTheme.colors.emerald }]}
                    >
                      <Text style={styles.primaryActionBtnText}>Submit Milestone Invoice</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('WorkOrderDetail', { woId: wo.id })}
                    style={styles.detailsBtn}
                  >
                    <Text style={styles.detailsBtnText}>Details</Text>
                    <ChevronRight size={16} color={vendorTheme.colors.navy} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Closing soon tender reminders */}
            {closingSoonTenders.slice(0, 2).map((t) => {
              const closingTime = closingOf(t);
              const label = daysFrom(closingTime);
              return (
                <TouchableOpacity
                  key={t.id}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('TenderDetail', { tenderId: t.id })}
                  style={styles.deadlineActionRow}
                >
                  <View style={styles.deadlineIconBox}>
                    <Clock size={20} color={vendorTheme.colors.amberDark} strokeWidth={2.4} />
                  </View>
                  <View style={styles.deadlineInfo}>
                    <Text style={styles.deadlineTitle} numberOfLines={1}>
                      {t.title}
                    </Text>
                    <Text style={styles.deadlineSub}>
                      Tender: {t.tenderNo || t.id} • Est. Value: ₹{(t.estimatedValue / 100000).toFixed(1)}L
                    </Text>
                  </View>
                  <View style={styles.countdownBadge}>
                    <Text style={styles.countdownText}>{label}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* 4. MY WORK - RECENT ACTIVE ORDERS */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionHeaderTitle}>MY WORK ORDERS</Text>
          <TouchableOpacity onPress={() => onNavigateTab('work')} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>View All ({myWorkOrders.length})</Text>
            <ChevronRight size={16} color={vendorTheme.colors.teal} />
          </TouchableOpacity>
        </View>

        {myWorkOrders.length === 0 ? (
          <View style={styles.emptyCard}>
            <Briefcase size={28} color={vendorTheme.colors.textTertiary} />
            <Text style={styles.emptyCardText}>No Work Orders Allotted Yet</Text>
            <Text style={styles.emptyCardSub}>
              Active contracts will appear here once your bid is evaluated and awarded.
            </Text>
          </View>
        ) : (
          <View style={styles.compactList}>
            {myWorkOrders.slice(0, 3).map((wo) => {
              return (
                <TouchableOpacity
                  key={wo.id}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('WorkOrderDetail', { woId: wo.id })}
                  style={styles.woCompactCard}
                >
                  <View style={styles.woTopBar}>
                    <View style={styles.woIdBox}>
                      <Text style={styles.woIdText}>{wo.woNumber || wo.id}</Text>
                    </View>
                    <View style={styles.woStagePill}>
                      <Text style={styles.woStagePillText}>{wo.currentStage}</Text>
                    </View>
                  </View>

                  <Text style={styles.woProjectTitle} numberOfLines={1}>
                    {wo.projectTitle}
                  </Text>

                  <View style={styles.woFinancialBar}>
                    <View style={styles.finCol}>
                      <Text style={styles.finLabel}>Contract Value</Text>
                      <Text style={styles.finVal}>
                        ₹{((wo.contractValue || 0) / 100000).toFixed(2)}L
                      </Text>
                    </View>
                    <View style={styles.finDivider} />
                    <View style={styles.finCol}>
                      <Text style={styles.finLabel}>Paid Amount</Text>
                      <Text style={[styles.finVal, { color: vendorTheme.colors.emerald }]}>
                        ₹{((wo.paidAmount || 0) / 100000).toFixed(2)}L
                      </Text>
                    </View>
                    <View style={styles.finDivider} />
                    <View style={styles.finCol}>
                      <Text style={styles.finLabel}>Target Date</Text>
                      <Text style={styles.finVal}>{wo.dueOn || 'Active'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* 5. TENDER DEADLINES */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionHeaderTitle}>TENDER DEADLINES</Text>
          <TouchableOpacity onPress={() => onNavigateTab('tenders')} style={styles.seeAllBtn}>
            <Text style={styles.seeAllText}>Explore ({freshTenders.length})</Text>
            <ChevronRight size={16} color={vendorTheme.colors.teal} />
          </TouchableOpacity>
        </View>

        <View style={styles.compactList}>
          {freshTenders.slice(0, 3).map((t) => {
            const closingTime = closingOf(t);
            const daysLabel = daysFrom(closingTime);
            return (
              <TouchableOpacity
                key={t.id}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('TenderDetail', { tenderId: t.id })}
                style={styles.tenderCompactCard}
              >
                <View style={styles.tenderTopRow}>
                  <Text style={styles.tenderNoText}>{t.tenderNo || t.id}</Text>
                  <View style={styles.tenderDeadlinePill}>
                    <Clock size={13} color={vendorTheme.colors.amberDark} />
                    <Text style={styles.tenderDeadlineText}>{daysLabel}</Text>
                  </View>
                </View>

                <Text style={styles.tenderTitleText} numberOfLines={1}>
                  {t.title}
                </Text>

                <View style={styles.tenderMetaFooter}>
                  <Text style={styles.tenderMetaText}>
                    Est. Value: ₹{(t.estimatedValue / 100000).toFixed(1)}L • EMD: ₹
                    {t.emdAmount.toLocaleString('en-IN')}
                  </Text>
                  <View style={styles.bidActionChip}>
                    <Text style={styles.bidActionChipText}>Submit Bid</Text>
                    <ArrowUpRight size={14} color={vendorTheme.colors.navy} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 6. PAYMENT STATUS BREAKDOWN (BIG NUMBERS & CLEAN BREAKDOWN) */}
      <View style={styles.sectionWrap}>
        <Text style={styles.sectionHeaderTitle}>PAYMENT STATUS & TDS SUMMARY</Text>
        <View style={styles.paymentSummaryCard}>
          <View style={styles.paySummaryRow}>
            <View style={styles.paySummaryCol}>
              <Text style={styles.paySummaryLabel}>TOTAL ALLOTTED</Text>
              <Text style={styles.paySummaryValue}>₹{(totalContract / 100000).toFixed(2)}L</Text>
            </View>
            <View style={styles.paySummaryCol}>
              <Text style={styles.paySummaryLabel}>TOTAL BILLED</Text>
              <Text style={styles.paySummaryValue}>₹{(totalBilled / 100000).toFixed(2)}L</Text>
            </View>
            <View style={styles.paySummaryCol}>
              <Text style={styles.paySummaryLabel}>DISBURSED</Text>
              <Text style={[styles.paySummaryValue, { color: vendorTheme.colors.emerald }]}>
                ₹{(totalPaid / 100000).toFixed(2)}L
              </Text>
            </View>
          </View>

          <View style={styles.tdsDivider} />

          <View style={styles.tdsNoticeRow}>
            <View style={styles.tdsInfoCol}>
              <Text style={styles.tdsTitle}>Statutory TDS (Section 194C @ 2%)</Text>
              <Text style={styles.tdsSubtitle}>
                Deducted on gross bills & deposited with IT Department. Form 16A issued quarterly.
              </Text>
            </View>
            <View style={styles.tdsAmountBox}>
              <Text style={styles.tdsAmountLabel}>Est. TDS Withheld</Text>
              <Text style={styles.tdsAmountVal}>₹{estimatedTdsDeducted.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 28,
  },
  tabletContainer: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  welcomeCard: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    ...vendorTheme.shadows.md,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorAvatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  welcomeInfo: {
    flex: 1,
  },
  vendorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
    letterSpacing: -0.3,
  },
  vendorMeta: {
    fontSize: 13,
    color: vendorTheme.colors.textSecondary,
    marginTop: 3,
  },
  metaBold: {
    fontWeight: '700',
    color: vendorTheme.colors.graphite,
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
    flexWrap: 'wrap',
  },
  empanelledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vendorTheme.colors.tealSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#99f6e4',
    gap: 5,
  },
  empanelledText: {
    fontSize: 12,
    fontWeight: '700',
    color: vendorTheme.colors.tealDark,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vendorTheme.colors.emeraldSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 5,
  },
  kycText: {
    fontSize: 12,
    fontWeight: '700',
    color: vendorTheme.colors.emerald,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  actionCountBadge: {
    backgroundColor: vendorTheme.colors.amberLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  actionCountText: {
    fontSize: 12,
    fontWeight: '800',
    color: vendorTheme.colors.amberDark,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: vendorTheme.colors.teal,
  },
  quickGrid: {
    gap: 10,
    marginTop: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickTile: {
    flex: 1,
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 14,
    borderWidth: 1.2,
    borderColor: vendorTheme.colors.sandstoneBorder,
    ...vendorTheme.shadows.sm,
  },
  tileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tileIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileMiniPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: vendorTheme.radius.full,
  },
  tileMiniPillText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  tileCount: {
    fontSize: 24,
    fontWeight: '900',
    color: vendorTheme.colors.navy,
    letterSpacing: -0.5,
    marginBottom: 3,
  },
  tileLabel: {
    fontSize: 13.5,
    fontWeight: '700',
    color: vendorTheme.colors.graphite,
    letterSpacing: -0.2,
  },
  tileSub: {
    fontSize: 11,
    fontWeight: '500',
    color: vendorTheme.colors.textMuted,
    marginTop: 2,
  },
  emptyActionCard: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    gap: 6,
  },
  emptyActionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
  },
  emptyActionSubtitle: {
    fontSize: 12,
    color: vendorTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionList: {
    gap: 12,
  },
  actionRowCard: {
    backgroundColor: '#fffdfa',
    borderRadius: vendorTheme.radius.lg,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    ...vendorTheme.shadows.md,
  },
  actionRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  actionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionTypePill: {
    backgroundColor: vendorTheme.colors.amberLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  actionTypeText: {
    fontSize: 11,
    fontWeight: '800',
    color: vendorTheme.colors.amberDark,
  },
  actionWoCode: {
    fontSize: 13,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
  },
  stageBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  stageIssued: {
    backgroundColor: '#e0e7ff',
  },
  stageStarted: {
    backgroundColor: '#ccfbf1',
  },
  stageDelivered: {
    backgroundColor: '#fef3c7',
  },
  stageBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginBottom: 4,
  },
  actionScope: {
    fontSize: 12.5,
    color: vendorTheme.colors.textSecondary,
    lineHeight: 18,
    marginBottom: 12,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: vendorTheme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: vendorTheme.radius.sm,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorderDark,
    gap: 3,
  },
  detailsBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: vendorTheme.colors.navy,
  },
  deadlineActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
  },
  deadlineIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: vendorTheme.colors.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deadlineInfo: {
    flex: 1,
  },
  deadlineTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: vendorTheme.colors.graphite,
  },
  deadlineSub: {
    fontSize: 11.5,
    color: vendorTheme.colors.textMuted,
    marginTop: 2,
  },
  countdownBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countdownText: {
    fontSize: 11,
    fontWeight: '800',
    color: vendorTheme.colors.crimson,
  },
  compactList: {
    gap: 10,
  },
  emptyCard: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
  },
  emptyCardText: {
    fontSize: 14,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginTop: 6,
  },
  emptyCardSub: {
    fontSize: 12,
    color: vendorTheme.colors.textMuted,
    textAlign: 'center',
    marginTop: 3,
  },
  woCompactCard: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    ...vendorTheme.shadows.sm,
  },
  woTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  woIdBox: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  woIdText: {
    fontSize: 12,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
  },
  woStagePill: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  woStagePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369a1',
  },
  woProjectTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginBottom: 10,
  },
  woFinancialBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vendorTheme.colors.sandstone,
    padding: 10,
    borderRadius: 8,
  },
  finCol: {
    flex: 1,
    alignItems: 'center',
  },
  finDivider: {
    width: 1,
    height: 24,
    backgroundColor: vendorTheme.colors.sandstoneBorder,
  },
  finLabel: {
    fontSize: 10,
    color: vendorTheme.colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  finVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginTop: 2,
  },
  tenderCompactCard: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    ...vendorTheme.shadows.sm,
  },
  tenderTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tenderNoText: {
    fontSize: 12,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
  },
  tenderDeadlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: vendorTheme.colors.amberLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  tenderDeadlineText: {
    fontSize: 11,
    fontWeight: '800',
    color: vendorTheme.colors.amberDark,
  },
  tenderTitleText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginBottom: 8,
  },
  tenderMetaFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tenderMetaText: {
    fontSize: 12,
    color: vendorTheme.colors.textSecondary,
    fontWeight: '500',
  },
  bidActionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 3,
  },
  bidActionChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
  },
  paymentSummaryCard: {
    backgroundColor: vendorTheme.colors.surface,
    borderRadius: vendorTheme.radius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
    ...vendorTheme.shadows.md,
  },
  paySummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paySummaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  paySummaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: vendorTheme.colors.textMuted,
    letterSpacing: 0.5,
  },
  paySummaryValue: {
    fontSize: 16,
    fontWeight: '900',
    color: vendorTheme.colors.graphite,
    marginTop: 3,
  },
  tdsDivider: {
    height: 1,
    backgroundColor: vendorTheme.colors.sandstoneBorder,
    marginVertical: 12,
  },
  tdsNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tdsInfoCol: {
    flex: 1,
    paddingRight: 14,
  },
  tdsTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: vendorTheme.colors.navy,
  },
  tdsSubtitle: {
    fontSize: 11,
    color: vendorTheme.colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  tdsAmountBox: {
    backgroundColor: vendorTheme.colors.sandstone,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: vendorTheme.colors.sandstoneBorder,
  },
  tdsAmountLabel: {
    fontSize: 10,
    color: vendorTheme.colors.textMuted,
    fontWeight: '700',
  },
  tdsAmountVal: {
    fontSize: 13.5,
    fontWeight: '800',
    color: vendorTheme.colors.graphite,
    marginTop: 1,
  },
});
