import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import {
  Hourglass,
  FileSignature,
  CircleDollarSign,
  BadgeCheck,
  Trophy,
  Phone,
  MessageCircle,
  CheckSquare,
  Square,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import {
  ScreenContainer,
  AppHeader,
  Card,
  StatusBadge,
  StatCard,
  EmptyState,
} from '../../components/common';
import { colors, spacing, typography, radius } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { Lead } from '../../types';

interface ClientApprovalsScreenProps {
  navigation: any;
}

const APPROVAL_STEPS = [
  { key: 'quoteAccepted', label: 'Quotation accepted', by: 'sales' },
  { key: 'poReceived', label: 'Work order / PO received', by: 'sales' },
  { key: 'advanceReceived', label: 'Advance payment received (50%)', by: 'payments' },
  { key: 'agreementSigned', label: 'Agreement signed', by: 'sales' },
] as const;

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'po', label: 'Waiting for PO' },
  { id: 'advance', label: 'Waiting for advance' },
  { id: 'ready', label: 'Ready to close' },
] as const;

type FilterId = typeof FILTERS[number]['id'];

const formatINR = (n: number) => {
  if (!n) return '₹0';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
};

export const ClientApprovalsScreen: React.FC<ClientApprovalsScreenProps> = ({ navigation }) => {
  const { leads, updateApprovalStep, updateLeadStage, convertLead } = useCrm();
  const { role } = useAuth();

  const [activeFilter, setActiveFilter] = useState<FilterId>('all');
  const [loadingStepKey, setLoadingStepKey] = useState<string | null>(null);

  const canSales = ['admin', 'operations_manager', 'project_manager', 'tender_manager'].includes(role || '');
  const canPayments = ['admin', 'accountant'].includes(role || '');

  const isStepLocked = (by: string) => {
    if (by === 'sales') return !canSales ? 'Marked by the sales team' : null;
    if (by === 'payments') return !canPayments ? 'Marked by Accounts' : null;
    return null;
  };

  const pendingLeads = leads
    .filter((l) => l.quoteStatus === 'Accepted' && l.stage !== 'Won' && l.stage !== 'Lost')
    .sort((a, b) => {
      const aDone = APPROVAL_STEPS.filter((s) => a.approval?.[s.key as keyof typeof a.approval]).length;
      const bDone = APPROVAL_STEPS.filter((s) => b.approval?.[s.key as keyof typeof b.approval]).length;
      return bDone - aDone;
    });

  const countStep = (key: string) =>
    pendingLeads.filter((l) => (l.approval as any)?.[key]).length;

  const readyLeads = pendingLeads.filter(
    (l) => APPROVAL_STEPS.every((s) => (l.approval as any)?.[s.key])
  );

  const totalValueBeingFinalised = pendingLeads.reduce(
    (sum, l) => sum + (l.quoteValue || l.estimatedValue || 0),
    0
  );

  const visibleLeads = pendingLeads.filter((l) => {
    const a = l.approval || {};
    if (activeFilter === 'po') return !a.poReceived;
    if (activeFilter === 'advance') return a.poReceived && !a.advanceReceived;
    if (activeFilter === 'ready') return APPROVAL_STEPS.every((s) => (a as any)[s.key]);
    return true;
  });

  const handleToggle = async (lead: Lead, stepKey: string, currentVal: boolean, by: string) => {
    const lockMsg = isStepLocked(by);
    if (lockMsg) {
      Alert.alert('Restricted Step', lockMsg);
      return;
    }

    setLoadingStepKey(`${lead.id}-${stepKey}`);
    try {
      await updateApprovalStep(lead.id, stepKey, !currentVal);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoadingStepKey(null);
    }
  };

  const handleMarkAsWon = async (lead: Lead) => {
    if (!canSales) {
      Alert.alert('Permission Denied', 'Only Sales or Administrators can close deals as Won.');
      return;
    }

    Alert.alert(
      'Close Deal as Won',
      `All 4 approval gates verified for ${lead.company}. Mark as Won and start Client Onboarding?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Win',
          onPress: async () => {
            try {
              await convertLead(lead.id);
              Alert.alert(
                'Deal Won & Client Created!',
                `${lead.company} has been converted into an Active Client and an ERM Geological Project draft has been initialized.`,
                [
                  {
                    text: 'Go to Onboarding',
                    onPress: () => navigation.navigate('ClientOnboarding'),
                  },
                  { text: 'Done', style: 'cancel' },
                ]
              );
            } catch (e: any) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer
      scrollable={false}
      header={
        <AppHeader
          title="Client Approval Gates"
          subtitle={`${pendingLeads.length} accepted quotes · ${formatINR(totalValueBeingFinalised)} being finalised`}
          showBack
          onBack={() => navigation.goBack()}
        />
      }
    >
      <View style={styles.kpiGrid}>
        <StatCard
          label="Awaiting Approval"
          value={pendingLeads.length}
          subtext="Accepted, not yet won"
          icon={<Hourglass size={20} color={colors.warning} />}
          tone="attention"
        />
        <StatCard
          label="PO Received"
          value={countStep('poReceived')}
          subtext={`of ${pendingLeads.length} leads`}
          icon={<FileSignature size={20} color={colors.info} />}
          tone="info"
        />
        <StatCard
          label="Advance Paid"
          value={countStep('advanceReceived')}
          subtext={`of ${pendingLeads.length} leads`}
          icon={<CircleDollarSign size={20} color={colors.info} />}
          tone="info"
        />
        <StatCard
          label="Ready to Close"
          value={readyLeads.length}
          subtext="All 4 gates passed"
          icon={<BadgeCheck size={20} color={colors.success} />}
          tone="good"
        />
      </View>

      <View style={styles.filterTabsRow}>
        {FILTERS.map((f) => {
          const isSel = activeFilter === f.id;
          const count =
            f.id === 'all'
              ? pendingLeads.length
              : f.id === 'po'
              ? pendingLeads.filter((l) => !l.approval?.poReceived).length
              : f.id === 'advance'
              ? pendingLeads.filter((l) => l.approval?.poReceived && !l.approval?.advanceReceived).length
              : readyLeads.length;

          return (
            <TouchableOpacity
              key={f.id}
              style={[styles.filterTab, isSel && styles.filterTabActive]}
              onPress={() => setActiveFilter(f.id)}
            >
              <Text style={[styles.filterTabText, isSel && styles.filterTabTextActive]}>
                {f.label}
              </Text>
              <View style={[styles.tabBadge, isSel && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, isSel && styles.tabBadgeTextActive]}>
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {visibleLeads.length === 0 ? (
        <EmptyState
          title="No Leads in This Approval Gate"
          description={
            pendingLeads.length === 0
              ? 'When a client accepts a quotation, it will automatically enter this approval queue.'
              : 'No quotations match the active filter.'
          }
          icon={<BadgeCheck size={48} color={colors.textMuted} />}
          actionLabel="View Quotations"
          onAction={() => navigation.navigate('Quotes')}
        />
      ) : (
        <FlatList
          data={visibleLeads}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const stepsDone = APPROVAL_STEPS.filter((s) => (item.approval as any)?.[s.key]).length;
            const isAllComplete = stepsDone === APPROVAL_STEPS.length;
            const quoteVal = item.quoteValue || item.estimatedValue || 0;

            return (
              <Card style={styles.leadCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleCol}>
                    <Text style={styles.companyName}>{item.company}</Text>
                    <Text style={styles.leadMeta}>
                      {item.id} · {item.serviceDetail || item.title}
                    </Text>
                  </View>
                  <View style={styles.valCol}>
                    <Text style={styles.valText}>{formatINR(quoteVal)}</Text>
                    <StatusBadge status="Accepted" size="sm" />
                  </View>
                </View>

                <View style={styles.contactBar}>
                  <Text style={styles.contactText}>
                    {item.contactPerson} ({item.phone})
                  </Text>
                  <View style={styles.dialerIcons}>
                    {item.phone && (
                      <TouchableOpacity
                        style={styles.dialerBtn}
                        onPress={() => Linking.openURL(`tel:${item.phone}`)}
                      >
                        <Phone size={14} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                    {item.phone && (
                      <TouchableOpacity
                        style={styles.dialerBtn}
                        onPress={() => Linking.openURL(`whatsapp://send?phone=91${item.phone.replace(/\D/g, '')}`)}
                      >
                        <MessageCircle size={14} color="#25D366" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <View style={styles.paymentNotice}>
                  <CircleDollarSign size={16} color={colors.info} />
                  <Text style={styles.paymentNoticeText}>
                    Advance Required: 50% ({formatINR(quoteVal * 0.5)}) with work order before fieldwork.
                  </Text>
                </View>

                <View style={styles.checklist}>
                  {APPROVAL_STEPS.map((step) => {
                    const isChecked = Boolean((item.approval as any)?.[step.key]);
                    const lockReason = isStepLocked(step.by);
                    const isLoading = loadingStepKey === `${item.id}-${step.key}`;

                    return (
                      <TouchableOpacity
                        key={step.key}
                        style={[styles.checkItem, isChecked && styles.checkItemDone]}
                        activeOpacity={0.7}
                        onPress={() => handleToggle(item, step.key, isChecked, step.by)}
                      >
                        {isChecked ? (
                          <CheckSquare size={18} color={colors.success} />
                        ) : lockReason ? (
                          <Lock size={18} color={colors.textMuted} />
                        ) : (
                          <Square size={18} color={colors.textMuted} />
                        )}

                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.checkLabel,
                              isChecked && styles.checkLabelDone,
                            ]}
                          >
                            {step.label}
                          </Text>
                          {lockReason && !isChecked && (
                            <Text style={styles.lockHint}>{lockReason}</Text>
                          )}
                        </View>

                        <Text style={styles.stepByPill}>
                          {step.by === 'payments' ? 'Accounts' : 'Sales'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.progressText}>
                    Gate Progress: {stepsDone}/4 steps verified
                  </Text>

                  <TouchableOpacity
                    style={[
                      styles.markWonBtn,
                      !isAllComplete && styles.markWonBtnDisabled,
                    ]}
                    disabled={!isAllComplete}
                    onPress={() => handleMarkAsWon(item)}
                  >
                    <Trophy size={16} color={isAllComplete ? '#fff' : colors.textMuted} />
                    <Text
                      style={[
                        styles.markWonBtnText,
                        !isAllComplete && styles.markWonBtnTextDisabled,
                      ]}
                    >
                      Mark as Won
                    </Text>
                  </TouchableOpacity>
                </View>
              </Card>
            );
          }}
        />
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: spacing.xs,
    paddingVertical: 2,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
    gap: 4,
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: colors.textInverse,
    fontWeight: typography.fontWeights.bold,
  },
  tabBadge: {
    backgroundColor: colors.borderMedium,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  tabBadgeText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.bold,
  },
  tabBadgeTextActive: {
    color: colors.textInverse,
  },
  listContent: {
    paddingBottom: spacing.huge,
  },
  leadCard: {
    marginBottom: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  titleCol: {
    flex: 1,
    marginRight: spacing.sm,
  },
  companyName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  leadMeta: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  valCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  valText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  contactBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  contactText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  dialerIcons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  dialerBtn: {
    padding: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
  },
  paymentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.infoBg,
    padding: spacing.xs,
    borderRadius: radius.sm,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  paymentNoticeText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.infoText,
    flex: 1,
  },
  checklist: {
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: spacing.sm,
  },
  checkItemDone: {
    backgroundColor: colors.successBg,
  },
  checkLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
  },
  checkLabelDone: {
    color: colors.successText,
    fontWeight: typography.fontWeights.semibold,
  },
  lockHint: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginTop: 2,
  },
  stepByPill: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  progressText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  markWonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    gap: 6,
  },
  markWonBtnDisabled: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  markWonBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#fff',
  },
  markWonBtnTextDisabled: {
    color: colors.textMuted,
  },
});
