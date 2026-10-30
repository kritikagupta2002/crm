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
          subtitle="Scans, verification and dispatch"
          scenicBanner
          showBack
          onBack={() => navigation.goBack()}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
      contentContainerStyle={styles.content}
    >
        <View style={styles.complianceCard}>
          <View style={styles.complianceIconWrap}>
            <ShieldCheck size={22} color="#1f6f78" />
          </View>
          <View style={styles.complianceBody}>
            <Text style={styles.complianceTitle}>A scan is verified by someone other than who filed it</Text>
            <Text style={styles.complianceDesc}>
              Every government letter is checked by a second person against the paper original.
            </Text>
          </View>
        </View>

        <View style={styles.metricsStrip}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#1f6f78' }]}>{totalGovt}</Text>
            <Text style={styles.metricLbl}>All letters</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: scanInbox.length > 0 ? '#c27a12' : '#2e9e6b' }]}>{scanInbox.length}</Text>
            <Text style={styles.metricLbl}>Scan Inbox</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: toVerify.length > 0 ? '#d24c47' : '#2e9e6b' }]}>{toVerify.length}</Text>
            <Text style={styles.metricLbl}>To Verify</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metricItem}>
            <Text style={[styles.metricVal, { color: '#2f6fb3' }]}>{toDispatch.length + pendingDispatches.length}</Text>
            <Text style={styles.metricLbl}>Dispatches</Text>
          </View>
        </View>

        <View style={styles.launchpadSection}>
          <Text style={styles.sectionHeader}>QUICK ACTIONS</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Documents')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#eef7f7' }]}>
                <FileText size={22} color="#1f6f78" />
              </View>
              <Text style={styles.actionTileTitle}>All Documents</Text>
              <Text style={styles.actionTileSub}>Govt Letters</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('ScanInbox')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#fcf0dc' }]}>
                <FileScan size={22} color="#c27a12" />
              </View>
              <Text style={styles.actionTileTitle}>Scan Inbox</Text>
              <Text style={styles.actionTileSub}>To file</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Documents', { step: 'To verify' })}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#fbe5e4' }]}>
                <ShieldCheck size={22} color="#d24c47" />
              </View>
              <Text style={styles.actionTileTitle}>To Verify</Text>
              <Text style={styles.actionTileSub}>Not your own filing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('DispatchRegister')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#e6effa' }]}>
                <Truck size={22} color="#2f6fb3" />
              </View>
              <Text style={styles.actionTileTitle}>Dispatches</Text>
              <Text style={styles.actionTileSub}>Speed Post</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Documents', { step: 'To authorize' })}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#f1f5f7' }]}>
                <FolderLock size={22} color="#3d5a6c" />
              </View>
              <Text style={styles.actionTileTitle}>Set access</Text>
              <Text style={styles.actionTileSub}>Permissions</Text>
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

        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionHeader}>STEPS</Text>
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
            <View style={[styles.stepIconWrap, { backgroundColor: '#fcf0dc' }]}>
              <Inbox size={18} color="#c27a12" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>1. File the scan</Text>
              <Text style={styles.stepDesc}>Scans waiting to be linked to a project</Text>
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
            <View style={[styles.stepIconWrap, { backgroundColor: '#fbe5e4' }]}>
              <ShieldCheck size={18} color="#d24c47" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>2. Verify the scan</Text>
              <Text style={styles.stepDesc}>Someone other than the filer checks it against the paper</Text>
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
            <View style={[styles.stepIconWrap, { backgroundColor: '#eef7f7' }]}>
              <FolderLock size={18} color="#1f6f78" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>3. Set access</Text>
              <Text style={styles.stepDesc}>Choose if the client or vendor can see it</Text>
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
            <View style={[styles.stepIconWrap, { backgroundColor: '#e6effa' }]}>
              <Share2 size={18} color="#2f6fb3" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>4. Share</Text>
              <Text style={styles.stepDesc}>Send by WhatsApp or email</Text>
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
            <View style={[styles.stepIconWrap, { backgroundColor: '#e3f4ec' }]}>
              <Truck size={18} color="#2e9e6b" />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>5. Send the original</Text>
              <Text style={styles.stepDesc}>Speed Post or courier, and who received it</Text>
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
              <AlertTriangle size={16} color="#c27a12" />
              <Text style={styles.attentionTitle}>NEEDS ATTENTION</Text>
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
                  <Text style={styles.actionBtnText}>Rescan</Text>
                  <ChevronRight size={14} color="#1f6f78" />
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
                      <ShieldAlert size={12} color="#d24c47" />
                      <Text style={styles.selfFiledText}>You filed this; someone else verifies it</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('DocumentDetail', { docId: d.id })}
                  >
                    <Text style={styles.actionBtnText}>Open</Text>
                    <ChevronRight size={14} color="#1f6f78" />
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
    backgroundColor: '#eef7f7',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#ddefef',
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
    borderColor: '#ddefef',
  },
  complianceBody: {
    flex: 1,
  },
  complianceTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: '#0f2a3d',
  },
  complianceDesc: {
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
    color: '#1f6f78',
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
    fontWeight: '700',
    color: '#0f2a3d',
    letterSpacing: -0.3,
  },
  metricLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: '#627079',
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
  pipelineCard: {
    padding: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e1e8eb',
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
    backgroundColor: '#edf1f3',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.bold,
    color: '#0f2a3d',
  },
  pipeDivider: {
    height: 1,
    backgroundColor: '#edf1f3',
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
    color: '#c27a12',
    letterSpacing: 0.8,
  },
  urgentCard: {
    padding: spacing.md,
    backgroundColor: '#fcf0dc',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#ecd6ae',
  },
  urgentHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  urgentTag: {
    backgroundColor: '#fcf0dc',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  urgentTagText: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    color: '#9a5f0c',
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
    color: '#9a5f0c',
    marginBottom: spacing.sm,
  },
  verifyItemCard: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#e1e8eb',
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
    backgroundColor: '#fbe5e4',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    marginBottom: spacing.xs,
  },
  selfFiledText: {
    fontSize: 11,
    fontWeight: typography.fontWeights.semibold,
    color: '#a83a36',
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
    color: '#1f6f78',
  },
});
