import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Building2,
  FileCheck2,
  Layers,
  Lock,
  ShieldCheck,
  AlertCircle,
  DollarSign,
  Briefcase,
  UserCheck,
  TrendingUp,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, Button } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { formatCurrency } from '../../utils';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { tenderPhase, closingOf } from '../../constants/vendor';

interface VendorWorkspaceHomeScreenProps {
  navigation: any;
}

export const VendorWorkspaceHomeScreen: React.FC<VendorWorkspaceHomeScreenProps> = ({ navigation }) => {
  const { vendors, vendorApplications, tenders, workOrders } = useCrm();
  const { role } = useAuth();

  const isDirector = (role as any) === 'director' || (role as any) === 'admin';
  const isTenderManager = (role as any) === 'tender_manager' || (role as any) === 'director' || (role as any) === 'admin';
  const isAccountant = (role as any) === 'accountant' || (role as any) === 'director' || (role as any) === 'admin';

  const metrics = useMemo(() => {
    const totalVendors = vendors.length;
    const pendingApps = vendorApplications.filter((a) => a.status === 'New' || a.status === 'Changes requested').length;

    const openTenders = tenders.filter((t) => tenderPhase(t) === 'Open');
    const evaluationTenders = tenders.filter((t) => tenderPhase(t) === 'Evaluation');
    const awardedTenders = tenders.filter((t) => tenderPhase(t) === 'Allotted');

    const totalSealedBids = tenders.reduce(
      (sum, t) => sum + t.sealedBids.filter((b) => b.isSealed && b.status !== 'Withdrawn').length,
      0
    );

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
          scenicBanner
          badge="Vendor & Subcontract Gate"
          badgeIcon={<Building2 size={12} color="#0d9488" />}
          showBack
          onBack={() => navigation.goBack()}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
      contentContainerStyle={styles.content}
    >
        <View style={styles.roleBanner}>
          <ShieldCheck size={18} color="#0D9488" />
          <View style={styles.roleBannerTextContainer}>
            <Text style={styles.roleBannerTitle}>
              Active Clearance: <Text style={styles.roleBannerHighlight}>{String(role).toUpperCase().replace('_', ' ')}</Text>
            </Text>
            <Text style={styles.roleBannerSub}>
              {isDirector
                ? 'Authorized for Dual-Key Cryptographic Unsealing Ceremony & Tender Allotment'
                : isTenderManager
                ? 'Authorized for Notice Management & Dual-Key Bidding Participation'
                : isAccountant
                ? 'Authorized for 3-Way Reconciliation & Subcontract Disbursements'
                : 'Authorized for Operational Work Order Oversight'}
            </Text>
          </View>
        </View>

        <View style={styles.metricsStrip}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#0d9488' }]}>{metrics.totalVendors}</Text>
            <Text style={styles.metricLbl}>Empanelled</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: metrics.pendingApps > 0 ? '#d97706' : '#16a34a' }]}>{metrics.pendingApps}</Text>
            <Text style={styles.metricLbl}>KYC Apps</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#2563eb' }]}>{metrics.openTendersCount}</Text>
            <Text style={styles.metricLbl}>Tenders</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#9333ea' }]}>{metrics.totalSealedBids}</Text>
            <Text style={styles.metricLbl}>Sealed Bids</Text>
          </View>
        </View>

        <View style={styles.launchpadSection}>
          <Text style={styles.sectionHeader}>QUICK VENDOR ACTIONS</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Tenders')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#F0FDFA' }]}>
                <Layers size={22} color="#0D9488" />
              </View>
              <Text style={styles.actionTileTitle}>Tenders</Text>
              <Text style={styles.actionTileSub}>Notice Board</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
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
              <View style={[styles.actionSquircle, { backgroundColor: '#FAF5FF' }]}>
                <Lock size={22} color="#9333EA" />
              </View>
              <Text style={styles.actionTileTitle}>Dual-Key Vault</Text>
              <Text style={styles.actionTileSub}>Unseal Ceremony</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('WorkOrders')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#EFF6FF' }]}>
                <Briefcase size={22} color="#2563EB" />
              </View>
              <Text style={styles.actionTileTitle}>Work Orders</Text>
              <Text style={styles.actionTileSub}>Subcontracts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Vendors')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#F0FDF4' }]}>
                <Building2 size={22} color="#16A34A" />
              </View>
              <Text style={styles.actionTileTitle}>Vendors Master</Text>
              <Text style={styles.actionTileSub}>Contractor KYC</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('VendorApplications')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#FFFBEB' }]}>
                <FileCheck2 size={22} color="#D97706" />
              </View>
              <Text style={styles.actionTileTitle}>Applications</Text>
              <Text style={styles.actionTileSub}>New Regs</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('MisReports')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#FDF2F8' }]}>
                <TrendingUp size={22} color="#DB2777" />
              </View>
              <Text style={styles.actionTileTitle}>Vendor BI</Text>
              <Text style={styles.actionTileSub}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Card style={styles.funnelCard}>
          <View style={styles.funnelHeader}>
            <View>
              <Text style={styles.funnelTitle}>Subcontract Lifecycle Funnel</Text>
              <Text style={styles.funnelSubtitle}>Field verification through final disbursement</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('WorkOrders')}>
              <Text style={styles.sectionLink}>View All ({workOrders.length})</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.funnelRow}>
            <View style={styles.funnelStep}>
              <Text style={styles.funnelCount}>{metrics.stageCounts.Issued}</Text>
              <View style={[styles.funnelBadge, { backgroundColor: '#FEF3C7' }]}>
                <Text style={[styles.funnelBadgeText, { color: '#B45309' }]}>Issued</Text>
              </View>
            </View>
            <Text style={styles.funnelArrow}>→</Text>

            <View style={styles.funnelStep}>
              <Text style={styles.funnelCount}>{metrics.stageCounts.Started}</Text>
              <View style={[styles.funnelBadge, { backgroundColor: '#EFF6FF' }]}>
                <Text style={[styles.funnelBadgeText, { color: '#1D4ED8' }]}>Started</Text>
              </View>
            </View>
            <Text style={styles.funnelArrow}>→</Text>

            <View style={styles.funnelStep}>
              <Text style={styles.funnelCount}>{metrics.stageCounts.Delivered}</Text>
              <View style={[styles.funnelBadge, { backgroundColor: '#F3E8FF' }]}>
                <Text style={[styles.funnelBadgeText, { color: '#7E22CE' }]}>Delivered</Text>
              </View>
            </View>
            <Text style={styles.funnelArrow}>→</Text>

            <View style={styles.funnelStep}>
              <Text style={styles.funnelCount}>{metrics.stageCounts.Billed}</Text>
              <View style={[styles.funnelBadge, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.funnelBadgeText, { color: '#B91C1C' }]}>Billed</Text>
              </View>
            </View>
            <Text style={styles.funnelArrow}>→</Text>

            <View style={styles.funnelStep}>
              <Text style={styles.funnelCount}>{metrics.stageCounts.Verified}</Text>
              <View style={[styles.funnelBadge, { backgroundColor: '#F1F5F9' }]}>
                <Text style={[styles.funnelBadgeText, { color: '#475569' }]}>Verified</Text>
              </View>
            </View>
            <Text style={styles.funnelArrow}>→</Text>

            <View style={styles.funnelStep}>
              <Text style={styles.funnelCount}>{metrics.stageCounts.Paid}</Text>
              <View style={[styles.funnelBadge, { backgroundColor: '#DCFCE7' }]}>
                <Text style={[styles.funnelBadgeText, { color: '#15803D' }]}>Paid</Text>
              </View>
            </View>
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
              <Text style={[styles.financialValue, { color: '#16A34A' }]}>
                {formatCurrency(metrics.totalPaidValue)}
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.radarSection}>
          <Text style={styles.sectionHeader}>OPERATIONAL RADAR</Text>

          {metrics.billsToCheck.length > 0 && (
            <Card style={[styles.alertCard, { borderLeftColor: '#EF4444' }]}>
              <View style={styles.alertCardHeader}>
                <AlertCircle size={20} color="#EF4444" />
                <Text style={styles.alertCardTitle}>
                  {metrics.billsToCheck.length} Bill(s) Awaiting 3-Way Reconciliation
                </Text>
              </View>
              <Text style={styles.alertCardDesc}>
                Contractor completion logs and field sheets must be cross-verified before finance clearance.
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
            <Card style={[styles.alertCard, { borderLeftColor: '#16A34A' }]}>
              <View style={styles.alertCardHeader}>
                <DollarSign size={20} color="#16A34A" />
                <Text style={styles.alertCardTitle}>
                  {metrics.billsToPay.length} Verified Subcontract Bill(s) Ready for Payment
                </Text>
              </View>
              <Text style={styles.alertCardDesc}>
                Reconciliation verified. Ready for TDS calculation (194C / 194J) and bank disbursement.
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
            <Card style={[styles.alertCard, { borderLeftColor: '#D97706' }]}>
              <View style={styles.alertCardHeader}>
                <UserCheck size={20} color="#D97706" />
                <Text style={styles.alertCardTitle}>
                  {metrics.pendingApps} Vendor Registration(s) Needing Empanelment
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
        </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  roleBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F0FDFA',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  roleBannerTextContainer: {
    flex: 1,
  },
  roleBannerTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: '#0F172A',
  },
  roleBannerHighlight: {
    color: '#0D9488',
    fontWeight: typography.fontWeights.heavy,
  },
  roleBannerSub: {
    fontSize: typography.fontSizes.xs,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.secondary,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: spacing.md,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    ...shadows.xs,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricDivider: {
    width: 1.2,
    height: 38,
    backgroundColor: '#e2e8f0',
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
  funnelCard: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  funnelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  funnelTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  funnelSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 1,
  },
  sectionLink: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#0D9488',
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
  },
  funnelStep: {
    alignItems: 'center',
  },
  funnelCount: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: 4,
  },
  funnelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  funnelBadgeText: {
    fontSize: 9,
    fontWeight: typography.fontWeights.bold,
  },
  funnelArrow: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  financialSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  financialCol: {
    flex: 1,
    alignItems: 'center',
  },
  financialDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  financialLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  financialValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  radarSection: {
    gap: spacing.sm,
  },
  alertCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  alertCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  alertCardTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    flex: 1,
  },
  alertCardDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  alertCardBtn: {
    alignSelf: 'flex-start',
  },
});
