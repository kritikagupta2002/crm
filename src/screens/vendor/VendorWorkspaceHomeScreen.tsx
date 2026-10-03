import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import {
  Building2,
  FileCheck2,
  Layers,
  Lock,
  ArrowRight,
  ShieldCheck,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  UserCheck,
  Send,
  Eye,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, Button } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { tenderPhase, closingOf, daysFrom } from '../../constants/vendor';

interface VendorWorkspaceHomeScreenProps {
  navigation: any;
}

export const VendorWorkspaceHomeScreen: React.FC<VendorWorkspaceHomeScreenProps> = ({ navigation }) => {
  const { vendors, vendorApplications, tenders, workOrders } = useCrm();
  const { role, can } = useAuth();

  const isDirector = (role as any) === 'director' || (role as any) === 'admin';
  const isTenderManager = (role as any) === 'tender_manager' || (role as any) === 'director' || (role as any) === 'admin';
  const isAccountant = (role as any) === 'accountant' || (role as any) === 'director' || (role as any) === 'admin';

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  const metrics = useMemo(() => {
    const totalVendors = vendors.length;
    const pendingApps = vendorApplications.filter((a) => a.status === 'New' || a.status === 'Changes requested').length;
    
    // Tenders metrics
    const openTenders = tenders.filter((t) => tenderPhase(t) === 'Open');
    const evaluationTenders = tenders.filter((t) => tenderPhase(t) === 'Evaluation');
    const awardedTenders = tenders.filter((t) => tenderPhase(t) === 'Allotted');

    // Sealed bids
    const totalSealedBids = tenders.reduce(
      (sum, t) => sum + t.sealedBids.filter((b) => b.isSealed && b.status !== 'Withdrawn').length,
      0
    );

    // Work orders lifecycle metrics
    const stageCounts = {
      Issued: workOrders.filter((w) => w.currentStage === 'Issued').length,
      Started: workOrders.filter((w) => w.currentStage === 'Started').length,
      Delivered: workOrders.filter((w) => w.currentStage === 'Delivered').length,
      Billed: workOrders.filter((w) => w.currentStage === 'Billed').length,
      Verified: workOrders.filter((w) => w.currentStage === 'Verified').length,
      Paid: workOrders.filter((w) => w.currentStage === 'Paid').length,
    };

    const totalContractValue = workOrders.reduce((sum, w) => sum + (w.contractValue || w.amount || 0), 0);
    const totalBilledValue = workOrders.reduce((sum, w) => sum + (w.billedAmount || (w.bill?.amount ?? 0)), 0);
    const totalPaidValue = workOrders.reduce((sum, w) => sum + (w.paidAmount || (w.payment?.gross ?? 0)), 0);

    // Attention queues
    const billsToCheck = workOrders.filter((w) => w.currentStage === 'Billed');
    const billsToPay = workOrders.filter((w) => w.currentStage === 'Verified');
    const tendersClosingSoon = openTenders.filter((t) => {
      try {
        const diff = (new Date(closingOf(t)).getTime() - Date.now()) / 86400000;
        return diff >= 0 && diff <= 3;
      } catch {
        return false;
      }
    });

    return {
      totalVendors,
      pendingApps,
      openTendersCount: openTenders.length,
      evaluationTendersCount: evaluationTenders.length,
      awardedTendersCount: awardedTenders.length,
      totalSealedBids,
      stageCounts,
      totalContractValue,
      totalBilledValue,
      totalPaidValue,
      billsToCheck,
      billsToPay,
      tendersClosingSoon,
    };
  }, [vendors, vendorApplications, tenders, workOrders]);

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title="Vendor Workspace"
          subtitle="Procurement, Tenders, Sealed Bids & Subcontracts"
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
    >
      {/* Role Access Banner */}
      <View style={styles.roleBanner}>
        <ShieldCheck size={18} color={colors.primary} />
        <View style={styles.roleBannerTextContainer}>
          <Text style={styles.roleBannerTitle}>
            Active Role: <Text style={styles.roleBannerHighlight}>{role.toUpperCase().replace('_', ' ')}</Text>
          </Text>
          <Text style={styles.roleBannerSub}>
            {isDirector
              ? 'Authorized for Dual-Key Unsealing Ceremony & Tender Allotment'
              : isTenderManager
              ? 'Authorized for Tender Management & Dual-Key Bidding Participation'
              : isAccountant
              ? 'Authorized for 3-Way Reconciliation & Subcontract Disbursements'
              : 'Authorized for Operational Work Order Oversight'}
          </Text>
        </View>
      </View>

      {/* Main KPI Matrix */}
      <View style={styles.kpiGrid}>
        <TouchableOpacity
          style={[styles.kpiCard, { borderLeftColor: colors.primary }]}
          onPress={() => navigation.navigate('Vendors')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiHeader}>
            <Building2 size={20} color={colors.primary} />
            <Text style={styles.kpiTag}>Master</Text>
          </View>
          <Text style={styles.kpiValue}>{metrics.totalVendors}</Text>
          <Text style={styles.kpiLabel}>Empanelled Vendors</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, { borderLeftColor: colors.warning }]}
          onPress={() => navigation.navigate('VendorApplications')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiHeader}>
            <FileCheck2 size={20} color={colors.warning} />
            {metrics.pendingApps > 0 && <View style={styles.alertDot} />}
          </View>
          <Text style={styles.kpiValue}>{metrics.pendingApps}</Text>
          <Text style={styles.kpiLabel}>Pending Registrations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, { borderLeftColor: colors.info }]}
          onPress={() => navigation.navigate('Tenders')}
          activeOpacity={0.8}
        >
          <View style={styles.kpiHeader}>
            <Layers size={20} color={colors.info} />
            <Text style={styles.kpiTag}>Live</Text>
          </View>
          <Text style={styles.kpiValue}>{metrics.openTendersCount}</Text>
          <Text style={styles.kpiLabel}>Active Tenders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, { borderLeftColor: colors.accent }]}
          onPress={() => {
            const closingTender = tenders.find((t) => t.status === 'Under Evaluation' || tenderPhase(t) === 'Evaluation') || tenders[0];
            if (closingTender) {
              navigation.navigate('SealedBidding', { tenderId: closingTender.id });
            } else {
              navigation.navigate('Tenders');
            }
          }}
          activeOpacity={0.8}
        >
          <View style={styles.kpiHeader}>
            <Lock size={20} color={colors.accent} />
            <Text style={styles.kpiTag}>Encrypted</Text>
          </View>
          <Text style={styles.kpiValue}>{metrics.totalSealedBids}</Text>
          <Text style={styles.kpiLabel}>Sealed Bids Held</Text>
        </TouchableOpacity>
      </View>

      {/* Subcontract Work Orders Lifecycle Funnel */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Subcontract Lifecycle Funnel</Text>
        <TouchableOpacity onPress={() => navigation.navigate('WorkOrders')}>
          <Text style={styles.sectionLink}>View All ({workOrders.length})</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.funnelCard}>
        <View style={styles.funnelRow}>
          <TouchableOpacity
            style={styles.funnelStep}
            onPress={() => navigation.navigate('WorkOrders')}
          >
            <Text style={styles.funnelCount}>{metrics.stageCounts.Issued}</Text>
            <View style={[styles.funnelBadge, { backgroundColor: colors.warningBg }]}>
              <Text style={[styles.funnelBadgeText, { color: colors.warningText }]}>Issued</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.funnelArrow}>→</Text>

          <TouchableOpacity
            style={styles.funnelStep}
            onPress={() => navigation.navigate('WorkOrders')}
          >
            <Text style={styles.funnelCount}>{metrics.stageCounts.Started}</Text>
            <View style={[styles.funnelBadge, { backgroundColor: colors.infoBg }]}>
              <Text style={[styles.funnelBadgeText, { color: colors.infoText }]}>Started</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.funnelArrow}>→</Text>

          <TouchableOpacity
            style={styles.funnelStep}
            onPress={() => navigation.navigate('WorkOrders')}
          >
            <Text style={styles.funnelCount}>{metrics.stageCounts.Delivered}</Text>
            <View style={[styles.funnelBadge, { backgroundColor: colors.accentBg }]}>
              <Text style={[styles.funnelBadgeText, { color: colors.accent }]}>Delivered</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.funnelArrow}>→</Text>

          <TouchableOpacity
            style={styles.funnelStep}
            onPress={() => navigation.navigate('WorkOrders')}
          >
            <Text style={styles.funnelCount}>{metrics.stageCounts.Billed}</Text>
            <View style={[styles.funnelBadge, { backgroundColor: colors.dangerBg }]}>
              <Text style={[styles.funnelBadgeText, { color: colors.dangerText }]}>Billed</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.funnelArrow}>→</Text>

          <TouchableOpacity
            style={styles.funnelStep}
            onPress={() => navigation.navigate('WorkOrders')}
          >
            <Text style={styles.funnelCount}>{metrics.stageCounts.Verified}</Text>
            <View style={[styles.funnelBadge, { backgroundColor: colors.background.tertiary }]}>
              <Text style={[styles.funnelBadgeText, { color: colors.text.secondary }]}>Verified</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.funnelArrow}>→</Text>

          <TouchableOpacity
            style={styles.funnelStep}
            onPress={() => navigation.navigate('WorkOrders')}
          >
            <Text style={styles.funnelCount}>{metrics.stageCounts.Paid}</Text>
            <View style={[styles.funnelBadge, { backgroundColor: colors.successBg }]}>
              <Text style={[styles.funnelBadgeText, { color: colors.successText }]}>Paid</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.financialSummary}>
          <View style={styles.financialCol}>
            <Text style={styles.financialLabel}>Contract Ceiling</Text>
            <Text style={styles.financialValue}>{formatCurrency(metrics.totalContractValue)}</Text>
          </View>
          <View style={styles.financialDivider} />
          <View style={styles.financialCol}>
            <Text style={styles.financialLabel}>Total Invoiced</Text>
            <Text style={styles.financialValue}>{formatCurrency(metrics.totalBilledValue)}</Text>
          </View>
          <View style={styles.financialDivider} />
          <View style={styles.financialCol}>
            <Text style={styles.financialLabel}>Total Disbursed</Text>
            <Text style={[styles.financialValue, { color: colors.success }]}>
              {formatCurrency(metrics.totalPaidValue)}
            </Text>
          </View>
        </View>
      </Card>

      {/* Operational Queues Requiring Attention */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Operational Radar</Text>
        <Text style={styles.sectionSubtitle}>Pending Officer Actions</Text>
      </View>

      {metrics.billsToCheck.length > 0 && (
        <Card style={[styles.alertCard, { borderLeftColor: colors.danger }]}>
          <View style={styles.alertCardHeader}>
            <AlertCircle size={20} color={colors.danger} />
            <Text style={styles.alertCardTitle}>
              {metrics.billsToCheck.length} Bill(s) Awaiting 3-Way Reconciliation
            </Text>
          </View>
          <Text style={styles.alertCardDesc}>
            Vendor completion reports and field delivery sheets must be cross-checked against contract specifications before payment authorization.
          </Text>
          <Button
            title="Inspect & Check Bills"
            variant="outline"
            size="small"
            style={styles.alertCardBtn}
            onPress={() => navigation.navigate('WorkOrders')}
          />
        </Card>
      )}

      {metrics.billsToPay.length > 0 && (
        <Card style={[styles.alertCard, { borderLeftColor: colors.success }]}>
          <View style={styles.alertCardHeader}>
            <DollarSign size={20} color={colors.success} />
            <Text style={styles.alertCardTitle}>
              {metrics.billsToPay.length} Verified Subcontract Bill(s) Ready for Payment
            </Text>
          </View>
          <Text style={styles.alertCardDesc}>
            Reconciliation complete. Ready for TDS calculation (194C / 194J) and UTR remittance.
          </Text>
          <Button
            title="Disburse Payments"
            variant="primary"
            size="small"
            style={styles.alertCardBtn}
            onPress={() => navigation.navigate('WorkOrders')}
          />
        </Card>
      )}

      {metrics.pendingApps > 0 && (
        <Card style={[styles.alertCard, { borderLeftColor: colors.warning }]}>
          <View style={styles.alertCardHeader}>
            <UserCheck size={20} color={colors.warning} />
            <Text style={styles.alertCardTitle}>
              {metrics.pendingApps} Vendor Registration(s) Needing Empanellment
            </Text>
          </View>
          <Text style={styles.alertCardDesc}>
            Verify GSTIN, PAN, Bank Details, and Statutory Compliance documents before admitting to bidding.
          </Text>
          <Button
            title="Review Applications"
            variant="outline"
            size="small"
            style={styles.alertCardBtn}
            onPress={() => navigation.navigate('VendorApplications')}
          />
        </Card>
      )}

      {/* Quick Action Navigation Grid */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Workspace Modules</Text>
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Tenders')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.primaryBg }]}>
            <Layers size={24} color={colors.primary} />
          </View>
          <Text style={styles.actionTitle}>Tender Notice Board</Text>
          <Text style={styles.actionDesc}>
            Publish tenders, review EMD, inspect specifications, and manage clarifications.
          </Text>
          <View style={styles.actionFooter}>
            <Text style={styles.actionActionText}>Open Board</Text>
            <ChevronRight size={16} color={colors.primary} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => {
            const targetTender = tenders.find((t) => t.status === 'Under Evaluation' || t.status === 'Open') || tenders[0];
            if (targetTender) {
              navigation.navigate('SealedBidding', { tenderId: targetTender.id });
            } else {
              navigation.navigate('Tenders');
            }
          }}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.accentBg }]}>
            <Lock size={24} color={colors.accent} />
          </View>
          <Text style={styles.actionTitle}>Dual-Key Sealed Chamber</Text>
          <Text style={styles.actionDesc}>
            Execute cryptographic unsealing ceremony with Director + Tender Manager keys.
          </Text>
          <View style={styles.actionFooter}>
            <Text style={[styles.actionActionText, { color: colors.accent }]}>Unseal Bids</Text>
            <ChevronRight size={16} color={colors.accent} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('WorkOrders')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.infoBg }]}>
            <Briefcase size={24} color={colors.info} />
          </View>
          <Text style={styles.actionTitle}>Subcontracts (Work Orders)</Text>
          <Text style={styles.actionDesc}>
            Track 6-state milestone progress, field survey submissions, billing & reconciliation.
          </Text>
          <View style={styles.actionFooter}>
            <Text style={[styles.actionActionText, { color: colors.info }]}>Manage Orders</Text>
            <ChevronRight size={16} color={colors.info} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Vendors')}
          activeOpacity={0.8}
        >
          <View style={[styles.actionIconContainer, { backgroundColor: colors.surfaceMuted }]}>
            <Building2 size={24} color={colors.textPrimary} />
          </View>
          <Text style={styles.actionTitle}>Vendor Master Register</Text>
          <Text style={styles.actionDesc}>
            Directory of empanelled contractors, bank details, PAN/GSTIN, and performance history.
          </Text>
          <View style={styles.actionFooter}>
            <Text style={[styles.actionActionText, { color: colors.textPrimary }]}>Open Directory</Text>
            <ChevronRight size={16} color={colors.textPrimary} />
          </View>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryBg,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    marginBottom: spacing.md,
  },
  roleBannerTextContainer: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  roleBannerTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.primaryDark,
  },
  roleBannerHighlight: {
    color: colors.primary,
  },
  roleBannerSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  kpiCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  kpiTag: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    textTransform: 'uppercase',
    color: colors.textMuted,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },
  kpiValue: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
  },
  kpiLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  sectionLink: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary,
  },
  funnelCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  funnelStep: {
    alignItems: 'center',
    flex: 1,
  },
  funnelCount: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.heavy,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  funnelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  funnelBadgeText: {
    fontSize: 9,
    fontWeight: typography.fontWeights.bold,
    textTransform: 'uppercase',
  },
  funnelArrow: {
    fontSize: 12,
    color: colors.textMuted,
    marginHorizontal: 1,
  },
  financialSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  financialCol: {
    flex: 1,
    alignItems: 'center',
  },
  financialDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.default,
  },
  financialLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  financialValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  alertCard: {
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    padding: spacing.md,
  },
  alertCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: spacing.xs,
  },
  alertCardTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    flex: 1,
  },
  alertCardDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  alertCardBtn: {
    alignSelf: 'flex-start',
  },
  actionGrid: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  actionDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  actionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceMuted,
  },
  actionActionText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
});
