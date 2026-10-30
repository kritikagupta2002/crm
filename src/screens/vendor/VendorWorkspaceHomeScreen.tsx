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
          subtitle="Vendors, tenders and work orders"
          scenicBanner
          showBack
          onBack={() => navigation.goBack()}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
      contentContainerStyle={styles.content}
    >
        <View style={styles.roleBanner}>
          <ShieldCheck size={18} color="#1f6f78" />
          <View style={styles.roleBannerTextContainer}>
            <Text style={styles.roleBannerTitle}>
              Your role: <Text style={styles.roleBannerHighlight}>{String(role).replace(/_/g, ' ')}</Text>
            </Text>
            <Text style={styles.roleBannerSub}>
              {isDirector
                ? 'You open the bids and award tenders'
                : isTenderManager
                ? 'You publish tenders and manage notices'
                : isAccountant
                ? 'You check vendor bills and release payments'
                : 'You follow the work orders'}
            </Text>
          </View>
        </View>

        <View style={styles.metricsStrip}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#1f6f78' }]}>{metrics.totalVendors}</Text>
            <Text style={styles.metricLbl}>Empanelled</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: metrics.pendingApps > 0 ? '#c27a12' : '#2e9e6b' }]}>{metrics.pendingApps}</Text>
            <Text style={styles.metricLbl}>Applications</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#2f6fb3' }]}>{metrics.openTendersCount}</Text>
            <Text style={styles.metricLbl}>Tenders</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#3d5a6c' }]}>{metrics.totalSealedBids}</Text>
            <Text style={styles.metricLbl}>Sealed Bids</Text>
          </View>
        </View>

        <View style={styles.launchpadSection}>
          <Text style={styles.sectionHeader}>QUICK ACTIONS</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Tenders')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#eef7f7' }]}>
                <Layers size={22} color="#1f6f78" />
              </View>
              <Text style={styles.actionTileTitle}>Tenders</Text>
              <Text style={styles.actionTileSub}>Notices</Text>
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
              <View style={[styles.actionSquircle, { backgroundColor: '#f1f5f7' }]}>
                <Lock size={22} color="#3d5a6c" />
              </View>
              <Text style={styles.actionTileTitle}>Open bids</Text>
              <Text style={styles.actionTileSub}>After bidding closes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('WorkOrders')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#e6effa' }]}>
                <Briefcase size={22} color="#2f6fb3" />
              </View>
              <Text style={styles.actionTileTitle}>Work Orders</Text>
              <Text style={styles.actionTileSub}>Subcontracts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Vendors')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#e3f4ec' }]}>
                <Building2 size={22} color="#2e9e6b" />
              </View>
              <Text style={styles.actionTileTitle}>Vendors</Text>
              <Text style={styles.actionTileSub}>All vendors</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('VendorApplications')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#fcf0dc' }]}>
                <FileCheck2 size={22} color="#c27a12" />
              </View>
              <Text style={styles.actionTileTitle}>Applications</Text>
              <Text style={styles.actionTileSub}>New vendors</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('MisReports')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#f1f5f7' }]}>
                <TrendingUp size={22} color="#3d5a6c" />
              </View>
              <Text style={styles.actionTileTitle}>Reports</Text>
              <Text style={styles.actionTileSub}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Card style={styles.funnelCard}>
          <View style={styles.funnelHeader}>
            <View>
              <Text style={styles.funnelTitle}>Work orders by stage</Text>
              <Text style={styles.funnelSubtitle}>From issue to payment</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('WorkOrders')}>
              <Text style={styles.sectionLink}>View All ({workOrders.length})</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.funnelRow}>
            <View style={styles.funnelStep}>
              <Text style={styles.funnelCount}>{metrics.stageCounts.Issued}</Text>
              <View style={[styles.funnelBadge, { backgroundColor: '#fcf0dc' }]}>
                <Text style={[styles.funnelBadgeText, { color: '#9a5f0c' }]}>Issued</Text>
              </View>
            </View>
            <Text style={styles.funnelArrow}>→</Text>

            <View style={styles.funnelStep}>
              <Text style={styles.funnelCount}>{metrics.stageCounts.Started}</Text>
              <View style={[styles.funnelBadge, { backgroundColor: '#e6effa' }]}>
                <Text style={[styles.funnelBadgeText, { color: '#245a93' }]}>Started</Text>
              </View>
            </View>
            <Text style={styles.funnelArrow}>→</Text>

            <View style={styles.funnelStep}>
              <Text style={styles.funnelCount}>{metrics.stageCounts.Delivered}</Text>
              <View style={[styles.funnelBadge, { backgroundColor: '#e8eef1' }]}>
                <Text style={[styles.funnelBadgeText, { color: '#34495a' }]}>Delivered</Text>
              </View>
            </View>
            <Text style={styles.funnelArrow}>→</Text>

            <View style={styles.funnelStep}>
              <Text style={styles.funnelCount}>{metrics.stageCounts.Billed}</Text>
              <View style={[styles.funnelBadge, { backgroundColor: '#fbe5e4' }]}>
                <Text style={[styles.funnelBadgeText, { color: '#a83a36' }]}>Billed</Text>
              </View>
            </View>
            <Text style={styles.funnelArrow}>→</Text>

            <View style={styles.funnelStep}>
              <Text style={styles.funnelCount}>{metrics.stageCounts.Verified}</Text>
              <View style={[styles.funnelBadge, { backgroundColor: '#edf1f3' }]}>
                <Text style={[styles.funnelBadgeText, { color: '#4a5b68' }]}>Verified</Text>
              </View>
            </View>
            <Text style={styles.funnelArrow}>→</Text>

            <View style={styles.funnelStep}>
              <Text style={styles.funnelCount}>{metrics.stageCounts.Paid}</Text>
              <View style={[styles.funnelBadge, { backgroundColor: '#e3f4ec' }]}>
                <Text style={[styles.funnelBadgeText, { color: '#237a53' }]}>Paid</Text>
              </View>
            </View>
          </View>

          <View style={styles.financialSummary}>
            <View style={styles.financialCol}>
              <Text style={styles.financialLabel}>Order value</Text>
              <Text style={styles.financialValue}>{formatCurrency(metrics.totalContractValue)}</Text>
            </View>
            <View style={styles.financialDivider} />
            <View style={styles.financialCol}>
              <Text style={styles.financialLabel}>Billed</Text>
              <Text style={styles.financialValue}>{formatCurrency(metrics.totalBilledValue)}</Text>
            </View>
            <View style={styles.financialDivider} />
            <View style={styles.financialCol}>
              <Text style={styles.financialLabel}>Paid</Text>
              <Text style={[styles.financialValue, { color: '#2e9e6b' }]}>
                {formatCurrency(metrics.totalPaidValue)}
              </Text>
            </View>
          </View>
        </Card>

        <View style={styles.radarSection}>
          <Text style={styles.sectionHeader}>NEEDS ATTENTION</Text>

          {metrics.billsToCheck.length > 0 && (
            <Card style={styles.alertCard}>
              <View style={styles.alertCardHeader}>
                <AlertCircle size={20} color="#d24c47" />
                <Text style={styles.alertCardTitle}>
                  {metrics.billsToCheck.length} bill(s) to check
                </Text>
              </View>
              <Text style={styles.alertCardDesc}>
                Check each bill against the work order and the site record before it goes for payment.
              </Text>
              <Button
                title="Check bills"
                variant="outline"
                size="small"
                style={styles.alertCardBtn}
                onPress={() => navigation.navigate('WorkOrders')}
              />
            </Card>
          )}

          {metrics.billsToPay.length > 0 && (
            <Card style={styles.alertCard}>
              <View style={styles.alertCardHeader}>
                <DollarSign size={20} color="#2e9e6b" />
                <Text style={styles.alertCardTitle}>
                  {metrics.billsToPay.length} checked bill(s) ready to pay
                </Text>
              </View>
              <Text style={styles.alertCardDesc}>
                Deduct TDS and pay.
              </Text>
              <Button
                title="Pay"
                variant="primary"
                size="small"
                style={styles.alertCardBtn}
                onPress={() => navigation.navigate('WorkOrders')}
              />
            </Card>
          )}

          {metrics.pendingApps > 0 && (
            <Card style={styles.alertCard}>
              <View style={styles.alertCardHeader}>
                <UserCheck size={20} color="#c27a12" />
                <Text style={styles.alertCardTitle}>
                  {metrics.pendingApps} vendor application(s) to review
                </Text>
              </View>
              <Text style={styles.alertCardDesc}>
                Check GSTIN, PAN, bank details and documents before the vendor can bid.
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
    backgroundColor: '#eef7f7',
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#ddefef',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  roleBannerTextContainer: {
    flex: 1,
  },
  roleBannerTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: '#0f2a3d',
  },
  roleBannerHighlight: {
    color: '#1f6f78',
    fontWeight: typography.fontWeights.heavy,
  },
  roleBannerSub: {
    fontSize: typography.fontSizes.xs,
    color: '#4a5b68',
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
    borderColor: '#e1e8eb',
    ...shadows.xs,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 24,
    color: '#0f2a3d',
    letterSpacing: -0.5,
  },
  metricLbl: {
    fontSize: 11,
    fontWeight: '700',
    color: '#627079',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metricDivider: {
    width: 1.2,
    height: 38,
    backgroundColor: '#e1e8eb',
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
    borderColor: '#e1e8eb',
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
    borderColor: '#e1e8eb',
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
    color: '#1f6f78',
  },
  funnelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f4f7f8',
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#e1e8eb',
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
    borderTopColor: '#edf1f3',
  },
  financialCol: {
    flex: 1,
    alignItems: 'center',
  },
  financialDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e1e8eb',
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
    borderColor: '#e1e8eb',
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
