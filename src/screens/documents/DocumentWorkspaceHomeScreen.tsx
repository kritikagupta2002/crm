import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useCrm, useAuth } from '../../context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { ScreenContainer, AppHeader, Card, StatCard, StatusBadge, Button } from '../../components/common';
import { DonutChart, MiniBarChart } from '../../components/common/NativeCharts';
import {
  FileText,
  FileScan,
  ShieldCheck,
  ShieldAlert,
  Send,
  Truck,
  PackageCheck,
  FolderLock,
  ArrowRight,
  CheckCircle2,
  Inbox,
  Share2,
  Clock,
  Layers,
  ChevronRight,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react-native';

export const DocumentWorkspaceHomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { govtDocuments, scanInbox, dispatches, refreshGovtDocuments, isLoading } = useCrm();
  const { session } = useAuth();
  const currentUserName = (session as any)?.name || (session as any)?.contactPerson || 'Active User';

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshGovtDocuments();
    setRefreshing(false);
  };

  const totalGovt = govtDocuments.length;
  const waitingDocs = govtDocuments.filter((d) => d.stage !== 'Done');
  const rescans = govtDocuments.filter((d) => d.rescan);
  const toVerify = govtDocuments.filter((d) => d.stage === 'To verify');
  const toAuthorize = govtDocuments.filter((d) => d.stage === 'To authorize');
  const toShare = govtDocuments.filter((d) => d.stage === 'To share');
  const toDispatch = govtDocuments.filter((d) => d.stage === 'To dispatch');
  const doneDocs = govtDocuments.filter((d) => d.stage === 'Done');

  const pendingDispatches = dispatches.filter((d) => d.status === 'In Transit' || d.status === 'Dispatched');
  const verifiedPct = totalGovt > 0 ? Math.round(((totalGovt - toVerify.length) / totalGovt) * 100) : 100;

  return (
    <ScreenContainer
      scrollable
      refreshing={refreshing || isLoading}
      onRefresh={onRefresh}
      header={
        <AppHeader
          title="Document Management"
          subtitle="EDMS • Verification & Chain of Custody"
          scenicBanner
          badge="EDMS & Chain of Custody"
          badgeIcon={<FileText size={12} color="#0d9488" />}
          showBack
          onBack={() => navigation.goBack()}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
      contentContainerStyle={styles.content}
    >
        <View style={styles.complianceCard}>
          <View style={styles.complianceIconWrap}>
            <ShieldCheck size={22} color="#0D9488" />
          </View>
          <View style={styles.complianceBody}>
            <Text style={styles.complianceTitle}>Enterprise 4-Eyes Verification Guard</Text>
            <Text style={styles.complianceDesc}>
              Document filers are strictly restricted from verifying their own scans. Every incoming government letter requires independent secondary sign-off.
            </Text>
          </View>
        </View>

        <View style={styles.metricsStrip}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#0d9488' }]}>{totalGovt}</Text>
            <Text style={styles.metricLbl}>Total Records</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: scanInbox.length > 0 ? '#d97706' : '#16a34a' }]}>{scanInbox.length}</Text>
            <Text style={styles.metricLbl}>Scan Inbox</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: toVerify.length > 0 ? '#dc2626' : '#16a34a' }]}>{toVerify.length}</Text>
            <Text style={styles.metricLbl}>To Verify</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#2563eb' }]}>{toDispatch.length + pendingDispatches.length}</Text>
            <Text style={styles.metricLbl}>Dispatches</Text>
          </View>
        </View>

        <View style={styles.launchpadSection}>
          <Text style={styles.sectionHeader}>QUICK DOCUMENT ACTIONS</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Documents')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#F0FDFA' }]}>
                <FileText size={22} color="#0D9488" />
              </View>
              <Text style={styles.actionTileTitle}>All Documents</Text>
              <Text style={styles.actionTileSub}>Govt Letters</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('ScanInbox')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#FFFBEB' }]}>
                <FileScan size={22} color="#D97706" />
              </View>
              <Text style={styles.actionTileTitle}>Scan Inbox</Text>
              <Text style={styles.actionTileSub}>Ingestion</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Documents', { step: 'To verify' })}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#FEE2E2' }]}>
                <ShieldCheck size={22} color="#DC2626" />
              </View>
              <Text style={styles.actionTileTitle}>To Verify</Text>
              <Text style={styles.actionTileSub}>4-Eyes Guard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('DispatchRegister')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#EFF6FF' }]}>
                <Truck size={22} color="#2563EB" />
              </View>
              <Text style={styles.actionTileTitle}>Dispatches</Text>
              <Text style={styles.actionTileSub}>Speed Post</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Documents', { step: 'To authorize' })}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#FAF5FF' }]}>
                <FolderLock size={22} color="#9333EA" />
              </View>
              <Text style={styles.actionTileTitle}>Access Auth</Text>
              <Text style={styles.actionTileSub}>Permissions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('MisReports')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#FDF2F8' }]}>
                <TrendingUp size={22} color="#DB2777" />
              </View>
              <Text style={styles.actionTileTitle}>EDMS BI</Text>
              <Text style={styles.actionTileSub}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionHeader}>EDMS CUSTODY PIPELINE</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Documents')}>
            <Text style={styles.seeAllText}>View All ({totalGovt})</Text>
          </TouchableOpacity>
        </View>

        <Card style={styles.pipelineCard}>
          <TouchableOpacity
            style={styles.pipelineRow}
            onPress={() => navigation.navigate('ScanInbox')}
            activeOpacity={0.7}
          >
            <View style={[styles.stepIconWrap, { backgroundColor: '#FFFBEB' }]}>
              <Inbox size={18} color="#D97706" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>1. Scan Ingestion (To File)</Text>
              <Text style={styles.stepDesc}>Raw scans in NAS folder awaiting project linkage</Text>
            </View>
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>{scanInbox.length}</Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.pipeDivider} />

          <TouchableOpacity
            style={styles.pipelineRow}
            onPress={() => navigation.navigate('Documents', { step: 'To verify' })}
            activeOpacity={0.7}
          >
            <View style={[styles.stepIconWrap, { backgroundColor: '#FEE2E2' }]}>
              <ShieldCheck size={18} color="#DC2626" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>2. 4-Eyes Physical Verification</Text>
              <Text style={styles.stepDesc}>Secondary checker signs off scan authenticity</Text>
            </View>
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>{toVerify.length}</Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.pipeDivider} />

          <TouchableOpacity
            style={styles.pipelineRow}
            onPress={() => navigation.navigate('Documents', { step: 'To authorize' })}
            activeOpacity={0.7}
          >
            <View style={[styles.stepIconWrap, { backgroundColor: '#F0FDFA' }]}>
              <FolderLock size={18} color="#0D9488" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>3. Authorization & Classification</Text>
              <Text style={styles.stepDesc}>Client & contractor portal visibility flags</Text>
            </View>
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>{toAuthorize.length}</Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.pipeDivider} />

          <TouchableOpacity
            style={styles.pipelineRow}
            onPress={() => navigation.navigate('Documents', { step: 'To share' })}
            activeOpacity={0.7}
          >
            <View style={[styles.stepIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Share2 size={18} color="#2563EB" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>4. Client & Stakeholder Sharing</Text>
              <Text style={styles.stepDesc}>WhatsApp broadcast & registered email push</Text>
            </View>
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>{toShare.length}</Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </TouchableOpacity>

          <View style={styles.pipeDivider} />

          <TouchableOpacity
            style={styles.pipelineRow}
            onPress={() => navigation.navigate('DispatchRegister')}
            activeOpacity={0.7}
          >
            <View style={[styles.stepIconWrap, { backgroundColor: '#F0FDF4' }]}>
              <Truck size={18} color="#16A34A" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>5. Physical Original Dispatch</Text>
              <Text style={styles.stepDesc}>Speed Post consignment & receipt tracking</Text>
            </View>
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>{toDispatch.length}</Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        </Card>

        {(rescans.length > 0 || toVerify.length > 0) && (
          <View style={styles.attentionSection}>
            <View style={styles.attentionHeader}>
              <AlertTriangle size={16} color="#D97706" />
              <Text style={styles.attentionTitle}>CUSTODY ATTENTION QUEUE</Text>
            </View>

            {rescans.map((d) => (
              <Card key={`rescan-${d.id}`} style={styles.urgentCard}>
                <View style={styles.urgentHead}>
                  <View style={styles.urgentTag}>
                    <Text style={styles.urgentTagText}>Rescan Required</Text>
                  </View>
                  <Text style={styles.urgentDate}>{d.letter.date}</Text>
                </View>
                <Text style={styles.urgentTitle}>{d.letter.title}</Text>
                <Text style={styles.urgentReason}>
                  Reason: {d.record.verify?.reason} {d.record.verify?.note ? `(${d.record.verify.note})` : ''}
                </Text>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('DocumentDetail', { docId: d.id })}
                >
                  <Text style={styles.actionBtnText}>Resolve Rescan</Text>
                  <ChevronRight size={14} color="#0D9488" />
                </TouchableOpacity>
              </Card>
            ))}

            {toVerify.slice(0, 2).map((d) => {
              const isSelfFiler = d.record.filedBy?.toLowerCase() === currentUserName.toLowerCase();
              return (
                <Card key={`verify-${d.id}`} style={styles.verifyItemCard}>
                  <View style={styles.urgentHead}>
                    <StatusBadge status="To verify" size="small" />
                    <Text style={styles.urgentDate}>{d.project.id}</Text>
                  </View>
                  <Text style={styles.urgentTitle}>{d.letter.title}</Text>
                  <Text style={styles.verifySub}>
                    Filed by {d.record.filedBy} • Ref: {d.letter.ref}
                  </Text>
                  {isSelfFiler && (
                    <View style={styles.selfFiledNotice}>
                      <ShieldAlert size={12} color="#EF4444" />
                      <Text style={styles.selfFiledText}>4-Eyes Rule: You filed this scan (Secondary verifier needed)</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('DocumentDetail', { docId: d.id })}
                  >
                    <Text style={styles.actionBtnText}>Inspect Document</Text>
                    <ChevronRight size={14} color="#0D9488" />
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>
        )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  complianceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#F0FDFA',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginBottom: spacing.md,
    gap: spacing.sm,
    ...shadows.sm,
  },
  complianceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  complianceBody: {
    flex: 1,
  },
  complianceTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: '#0F172A',
  },
  complianceDesc: {
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
  },
  sectionHeaderWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  seeAllText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#0D9488',
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 8,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  metricLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.default,
  },
  launchpadSection: {
    marginBottom: spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
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
  pipelineCard: {
    padding: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    gap: spacing.sm,
  },
  stepIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  stepDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 1,
  },
  badgeWrap: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    backgroundColor: '#F1F5F9',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
    color: '#0F172A',
  },
  pipeDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: spacing.sm,
  },
  attentionSection: {
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  attentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  attentionTitle: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
    color: '#D97706',
    letterSpacing: 0.8,
  },
  urgentCard: {
    padding: spacing.md,
    backgroundColor: '#FFFBEB',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderLeftWidth: 4,
    borderLeftColor: '#D97706',
  },
  urgentHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  urgentTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  urgentTagText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    color: '#B45309',
  },
  urgentDate: {
    fontSize: 10,
    color: colors.text.tertiary,
  },
  urgentTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  urgentReason: {
    fontSize: typography.fontSizes.xs,
    color: '#B45309',
    marginBottom: spacing.sm,
  },
  verifyItemCard: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  verifySub: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  selfFiledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  selfFiledText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.semibold,
    color: '#B91C1C',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: 2,
  },
  actionBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#0D9488',
  },
});
