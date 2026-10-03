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
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button } from '../../components';
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
} from 'lucide-react-native';
import { STAGE_TONE } from '../../constants';

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

  // Metrics derived from actual document datasets
  const totalGovt = govtDocuments.length;
  const waitingDocs = govtDocuments.filter((d) => d.stage !== 'Done');
  const rescans = govtDocuments.filter((d) => d.rescan);
  const toVerify = govtDocuments.filter((d) => d.stage === 'To verify');
  const toAuthorize = govtDocuments.filter((d) => d.stage === 'To authorize');
  const toShare = govtDocuments.filter((d) => d.stage === 'To share');
  const toDispatch = govtDocuments.filter((d) => d.stage === 'To dispatch');
  const doneDocs = govtDocuments.filter((d) => d.stage === 'Done');

  const pendingDispatches = dispatches.filter((d) => d.status === 'In Transit' || d.status === 'Dispatched');
  const completedDispatches = dispatches.filter((d) => d.status === 'Delivered' || d.status === 'Received');

  return (
    <View style={styles.container}>
      <AppHeader
        title="Document Management"
        subtitle="EDMS • Verification & Chain of Custody"
        showBack
        onBack={() => navigation.goBack()}
      />


      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing || isLoading} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Compliance Banner */}
        <View style={styles.complianceCard}>
          <View style={styles.complianceIconWrap}>
            <ShieldCheck size={22} color={colors.primary} />
          </View>
          <View style={styles.complianceBody}>
            <Text style={styles.complianceTitle}>Enterprise 4-Eyes Verification</Text>
            <Text style={styles.complianceDesc}>
              Document filers are strictly prohibited from verifying their own scans. Every government letter requires secondary review.
            </Text>
          </View>
        </View>

        {/* Quick KPI Grid */}
        <View style={styles.kpiGrid}>
          <TouchableOpacity
            style={[styles.kpiCard, { borderLeftColor: colors.primary }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Documents')}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiValue}>{totalGovt}</Text>
              <FileText size={18} color={colors.primary} />
            </View>
            <Text style={styles.kpiLabel}>Total Records</Text>
            <Text style={styles.kpiSub}>{waitingDocs.length} in pipeline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, { borderLeftColor: colors.semantic.warning }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ScanInbox')}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiValue}>{scanInbox.length}</Text>
              <FileScan size={18} color={colors.semantic.warning} />
            </View>
            <Text style={styles.kpiLabel}>Scan Inbox</Text>
            <Text style={styles.kpiSub}>NAS folder queue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, { borderLeftColor: colors.semantic.danger }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Documents', { step: 'To verify' })}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiValue}>{toVerify.length}</Text>
              <ShieldAlert size={18} color={colors.semantic.danger} />
            </View>
            <Text style={styles.kpiLabel}>To Verify</Text>
            <Text style={styles.kpiSub}>{rescans.length} rescan requested</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.kpiCard, { borderLeftColor: colors.semantic.info }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('DispatchRegister')}
          >
            <View style={styles.kpiHeader}>
              <Text style={styles.kpiValue}>{toDispatch.length + pendingDispatches.length}</Text>
              <Truck size={18} color={colors.semantic.info} />
            </View>
            <Text style={styles.kpiLabel}>Dispatches</Text>
            <Text style={styles.kpiSub}>Physical originals</Text>
          </TouchableOpacity>
        </View>

        {/* 5-Stage EDMS Lifecycle Track */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Document Pipeline</Text>
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
            <View style={[styles.stepIconWrap, { backgroundColor: `${colors.semantic.warning}15` }]}>
              <Inbox size={18} color={colors.semantic.warning} />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>1. Scan Inbox (To file)</Text>
              <Text style={styles.stepDesc}>Raw scans in NAS folder waiting to be linked</Text>
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
            <View style={[styles.stepIconWrap, { backgroundColor: `${colors.semantic.danger}15` }]}>
              <ShieldCheck size={18} color={colors.semantic.danger} />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>2. Physical Verification</Text>
              <Text style={styles.stepDesc}>4-Eyes compliance check against paper</Text>
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
            <View style={[styles.stepIconWrap, { backgroundColor: `${colors.primary}15` }]}>
              <FolderLock size={18} color={colors.primary} />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>3. Authorization & Access</Text>
              <Text style={styles.stepDesc}>Client & vendor portal access controls</Text>
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
            <View style={[styles.stepIconWrap, { backgroundColor: `${colors.semantic.info}15` }]}>
              <Share2 size={18} color={colors.semantic.info} />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>4. Client Sharing</Text>
              <Text style={styles.stepDesc}>Portal notification and WhatsApp broadcast</Text>
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
            <View style={[styles.stepIconWrap, { backgroundColor: `${colors.semantic.success}15` }]}>
              <Truck size={18} color={colors.semantic.success} />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitle}>5. Original Dispatch</Text>
              <Text style={styles.stepDesc}>Speed Post, courier waybill & acknowledgement</Text>
            </View>
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>{toDispatch.length}</Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        </Card>

        {/* Priority Attention Queue */}
        {(rescans.length > 0 || toVerify.length > 0) && (
          <View style={styles.attentionSection}>
            <View style={styles.attentionHeader}>
              <AlertTriangle size={18} color={colors.semantic.warning} />
              <Text style={styles.attentionTitle}>Attention Queue</Text>
            </View>

            {rescans.map((d) => (
              <Card key={`rescan-${d.id}`} style={styles.urgentCard}>
                <View style={styles.urgentHead}>
                  <Text style={styles.urgentTag}>Rescan Required</Text>
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
                  <ChevronRight size={14} color={colors.primary} />
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
                      <ShieldAlert size={12} color={colors.semantic.danger} />
                      <Text style={styles.selfFiledText}>4-Eyes Guard: You filed this scan</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => navigation.navigate('DocumentDetail', { docId: d.id })}
                  >
                    <Text style={styles.actionBtnText}>Inspect Document</Text>
                    <ChevronRight size={14} color={colors.primary} />
                  </TouchableOpacity>
                </Card>
              );
            })}
          </View>
        )}

        {/* Quick Launch Buttons */}
        <View style={styles.quickLaunchSection}>
          <Button
            title="Browse Document Register"
            variant="primary"
            onPress={() => navigation.navigate('Documents')}
            icon={<FileText size={18} color={colors.text.inverse} />}
          />
          <View style={{ height: spacing.sm }} />
          <Button
            title={`Scan Ingestion Inbox (${scanInbox.length})`}
            variant="outline"
            onPress={() => navigation.navigate('ScanInbox')}
            icon={<FileScan size={18} color={colors.primary} />}
          />
          <View style={{ height: spacing.sm }} />
          <Button
            title="Dispatch & Waybill Tracking"
            variant="secondary"
            onPress={() => navigation.navigate('DispatchRegister')}
            icon={<Truck size={18} color={colors.text.primary} />}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  complianceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.primary}12`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  complianceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  complianceBody: {
    flex: 1,
  },
  complianceTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 2,
  },
  complianceDesc: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  kpiCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  kpiValue: {
    ...typography.h2,
    color: colors.text.primary,
  },
  kpiLabel: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.primary,
  },
  kpiSub: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  seeAllText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.primary,
  },
  pipelineCard: {
    padding: 0,
    overflow: 'hidden',
  },
  pipelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  stepIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  stepDesc: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 1,
  },
  badgeWrap: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    marginRight: spacing.xs,
  },

  badgeText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  pipeDivider: {
    height: 1,
    backgroundColor: colors.border.subtle,
    marginLeft: 56,
  },
  attentionSection: {
    gap: spacing.sm,
  },
  attentionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  attentionTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  urgentCard: {
    borderColor: `${colors.semantic.danger}40`,
    borderWidth: 1,
    backgroundColor: `${colors.semantic.danger}06`,
  },
  urgentHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  urgentTag: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.semantic.danger,
    textTransform: 'uppercase',
  },
  urgentDate: {
    ...typography.caption,
    color: colors.text.tertiary,
  },
  urgentTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  urgentReason: {
    ...typography.caption,
    color: colors.semantic.danger,
    marginBottom: spacing.sm,
  },
  verifyItemCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  verifySub: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  selfFiledNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.semantic.danger}12`,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  selfFiledText: {
    ...typography.caption,
    color: colors.semantic.danger,
    fontSize: 10,
    fontWeight: '600',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  actionBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  quickLaunchSection: {
    marginTop: spacing.sm,
  },
});
