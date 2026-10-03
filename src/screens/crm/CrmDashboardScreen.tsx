import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import {
  Inbox,
  CalendarClock,
  FileText,
  UserCheck,
  TrendingUp,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, StatCard, Card, StatusBadge, Button, SegmentedControl } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { LeadStage } from '../../types';

interface CrmDashboardScreenProps {
  navigation: any;
}

type PeriodType = 'month' | 'quarter' | 'year' | 'all';

export const CrmDashboardScreen: React.FC<CrmDashboardScreenProps> = ({ navigation }) => {
  const { leads, followUps, quotes } = useCrm();
  const { can, role } = useAuth();

  const [periodIndex, setPeriodIndex] = useState<number>(0);
  const periodOptions: string[] = ['This Month', 'This Quarter', 'This FY', 'All Time'];
  const periodKeys: PeriodType[] = ['month', 'quarter', 'year', 'all'];
  const currentPeriod = periodKeys[periodIndex];

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  // Dynamic calculations matching web dashboardStats.js
  const summary = useMemo(() => {
    const totalLeads = leads.length;
    const wonLeads = leads.filter((l) => l.stage === 'Won');
    const wonCount = wonLeads.length;
    const wonAmount = wonLeads.reduce((sum, l) => sum + (l.quoteValue || l.estimatedValue || 0), 0);

    const todayISO = new Date().toISOString().split('T')[0];
    const dueFollowUps = followUps.filter((f) => f.status === 'Pending' && f.date <= todayISO);
    const overdueFollowUps = followUps.filter((f) => f.status === 'Pending' && f.date < todayISO);
    const dueTodayCount = dueFollowUps.length - overdueFollowUps.length;

    // Awaiting client reply
    const awaitingQuotes = quotes.filter((q) => q.status === 'Sent' || q.status === 'Revised' || q.status === 'Pending Approval');
    const awaitingValue = awaitingQuotes.reduce((sum, q) => sum + q.total, 0);

    // Conversion rate
    const conversionRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;
    const proposalsSent = leads.filter((l) => ['Proposal Sent', 'Negotiation', 'Won'].includes(l.stage)).length;

    // Pipeline stage distribution
    const stageCounts: Record<string, number> = {
      'New Enquiry': leads.filter((l) => l.stage === 'New' || l.stage === 'New Enquiry').length,
      Contacted: leads.filter((l) => l.stage === 'Contacted').length,
      Qualified: leads.filter((l) => l.stage === 'Qualified').length,
      'Proposal Sent': leads.filter((l) => l.stage === 'Proposal Sent').length,
      Negotiation: leads.filter((l) => l.stage === 'Negotiation').length,
      Won: wonCount,
      Lost: leads.filter((l) => l.stage === 'Lost').length,
    };

    // Approvals at a glance (accepted quotes awaiting PO/advance/agreement)
    const approvalsPending = leads.filter(
      (l) => l.quoteStatus === 'Accepted' && l.stage !== 'Won' && l.stage !== 'Lost'
    );

    return {
      totalLeads,
      wonCount,
      wonAmount,
      dueFollowUpsCount: dueFollowUps.length,
      overdueFollowUpsCount: overdueFollowUps.length,
      dueTodayCount,
      awaitingQuotesCount: awaitingQuotes.length,
      awaitingValue,
      conversionRate,
      proposalsSent,
      stageCounts,
      approvalsPending,
    };
  }, [leads, followUps, quotes]);

  const STAGES_LIST = [
    { key: 'New Enquiry', color: '#38bdf8' },
    { key: 'Contacted', color: '#818cf8' },
    { key: 'Qualified', color: '#fbbf24' },
    { key: 'Proposal Sent', color: '#f59e0b' },
    { key: 'Negotiation', color: '#ec4899' },
    { key: 'Won', color: '#10b981' },
    { key: 'Lost', color: '#ef4444' },
  ];

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title="CRM Dashboard"
          subtitle="Commercial Pipeline & Enquiries Analytics"
          showBack
          onBack={() => navigation.goBack()}
          rightAction={
            can('manage', 'crm') ? (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => navigation.navigate('Leads')}
              >
                <Plus size={18} color={colors.textInverse} />
              </TouchableOpacity>
            ) : null
          }
        />
      }
    >
      {/* 1. Period Switcher */}
      <SegmentedControl
        options={periodOptions}
        selectedIndex={periodIndex}
        onSelect={setPeriodIndex}
        style={styles.periodSwitcher}
      />

      {/* 2. Primary KPI Stat Cards */}
      <View style={styles.statGrid}>
        <StatCard
          title="Enquiries Received"
          value={summary.totalLeads}
          subtitle={`Total leads in ${periodOptions[periodIndex]}`}
          icon={<Inbox size={18} color={colors.info} />}
          color={colors.info}
        />
        <StatCard
          title="Follow-ups Due"
          value={summary.dueFollowUpsCount}
          subtitle={
            summary.overdueFollowUpsCount > 0
              ? `${summary.overdueFollowUpsCount} overdue priority`
              : 'All up to date'
          }
          icon={<CalendarClock size={18} color={summary.overdueFollowUpsCount > 0 ? colors.danger : colors.warning} />}
          color={summary.overdueFollowUpsCount > 0 ? colors.danger : colors.warning}
        />
      </View>

      <View style={styles.statGrid}>
        <StatCard
          title="Awaiting Client Reply"
          value={summary.awaitingQuotesCount}
          subtitle={`Quotations: ${formatCurrency(summary.awaitingValue)}`}
          icon={<FileText size={18} color={colors.warning} />}
          color={colors.warning}
        />
        <StatCard
          title="Clients Won"
          value={summary.wonCount}
          subtitle={`${formatCurrency(summary.wonAmount)} closed`}
          icon={<UserCheck size={18} color={colors.primary} />}
          color={colors.primary}
        />
      </View>

      {/* 3. Conversion Overview Card */}
      <Card style={styles.conversionCard}>
        <View style={styles.conversionHeader}>
          <View>
            <Text style={styles.conversionLabel}>Lead-to-Client Win Rate</Text>
            <Text style={styles.conversionRate}>{summary.conversionRate}%</Text>
          </View>
          <View style={styles.conversionMeta}>
            <Text style={styles.metaText}>Proposals Sent: <Text style={styles.metaBold}>{summary.proposalsSent}</Text></Text>
            <Text style={styles.metaText}>Deals Won: <Text style={styles.metaBold}>{summary.wonCount}</Text></Text>
          </View>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${Math.min(summary.conversionRate, 100)}%` }]} />
        </View>
      </Card>

      {/* 4. Lead Pipeline Distribution */}
      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Lead Funnel Pipeline</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Leads')}>
          <Text style={styles.sectionLink}>View Funnel &rarr;</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.pipelineCard}>
        {STAGES_LIST.map(({ key, color }) => {
          const count = summary.stageCounts[key] || 0;
          const percentage = summary.totalLeads > 0 ? Math.round((count / summary.totalLeads) * 100) : 0;

          return (
            <View key={key} style={styles.pipelineRow}>
              <View style={styles.stageLabelRow}>
                <View style={[styles.stageDot, { backgroundColor: color }]} />
                <Text style={styles.stageName}>{key}</Text>
                <Text style={styles.stageCountText}>
                  {count} <Text style={styles.stagePctText}>({percentage}%)</Text>
                </Text>
              </View>
              <View style={styles.stageTrack}>
                <View style={[styles.stageFill, { width: `${percentage}%`, backgroundColor: color }]} />
              </View>
            </View>
          );
        })}
      </Card>

      {/* 5. Approvals At A Glance */}
      {summary.approvalsPending.length > 0 && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Client Approvals at a Glance</Text>
            <TouchableOpacity onPress={() => navigation.navigate('QuoteApprovals')}>
              <Text style={styles.sectionLink}>Review All &rarr;</Text>
            </TouchableOpacity>
          </View>

          {summary.approvalsPending.slice(0, 2).map((l) => (
            <Card key={l.id} style={styles.approvalCard} onPress={() => navigation.navigate('QuoteApprovals')}>
              <View style={styles.approvalHeader}>
                <Text style={styles.approvalCompany}>{l.company}</Text>
                <StatusBadge status="Accepted Quote" size="sm" />
              </View>
              <Text style={styles.approvalService}>{l.title}</Text>
              <Text style={styles.approvalValue}>Contract Value: {formatCurrency(l.quoteValue || l.estimatedValue)}</Text>
            </Card>
          ))}
        </>
      )}

      {/* 6. Quick Action Navigation */}
      <Text style={styles.sectionTitle}>Quick Commercial Actions</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity style={styles.qaCard} onPress={() => navigation.navigate('Leads')}>
          <View style={[styles.qaIcon, { backgroundColor: colors.primaryBg }]}>
            <Inbox size={22} color={colors.primary} />
          </View>
          <Text style={styles.qaTitle}>Leads Funnel</Text>
          <Text style={styles.qaSub}>Inspect all prospect leads</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.qaCard} onPress={() => navigation.navigate('FollowUps')}>
          <View style={[styles.qaIcon, { backgroundColor: colors.warningBg }]}>
            <CalendarClock size={22} color={colors.warning} />
          </View>
          <Text style={styles.qaTitle}>Follow-ups</Text>
          <Text style={styles.qaSub}>Scheduled interactions</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.qaCard} onPress={() => navigation.navigate('Quotes')}>
          <View style={[styles.qaIcon, { backgroundColor: colors.infoBg }]}>
            <FileText size={22} color={colors.info} />
          </View>
          <Text style={styles.qaTitle}>Quotations</Text>
          <Text style={styles.qaSub}>Builder & approvals</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.qaCard} onPress={() => navigation.navigate('Clients')}>
          <View style={[styles.qaIcon, { backgroundColor: colors.successBg }]}>
            <UserCheck size={22} color={colors.success} />
          </View>
          <Text style={styles.qaTitle}>Client Master</Text>
          <Text style={styles.qaSub}>360° client directories</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  periodSwitcher: {
    marginBottom: spacing.md,
  },
  addBtn: {
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  conversionCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  conversionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  conversionLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  conversionRate: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.heavy,
    color: colors.primary,
    marginTop: 2,
  },
  conversionMeta: {
    alignItems: 'flex-end',
    gap: 2,
  },
  metaText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
  },
  metaBold: {
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.border.default,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionLink: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  pipelineCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  pipelineRow: {
    marginBottom: spacing.sm + 2,
  },
  stageLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
  },
  stageName: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.medium,
    flex: 1,
  },
  stageCountText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textPrimary,
    fontWeight: typography.fontWeights.bold,
  },
  stagePctText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    fontWeight: typography.fontWeights.normal,
  },
  stageTrack: {
    height: 4,
    backgroundColor: colors.border.default,
    borderRadius: 2,
    overflow: 'hidden',
  },
  stageFill: {
    height: '100%',
    borderRadius: 2,
  },
  approvalCard: {
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  approvalCompany: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  approvalService: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  approvalValue: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.huge,
  },
  qaCard: {
    width: '48%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  qaIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  qaTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  qaSub: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
});
