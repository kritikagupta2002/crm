import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import Svg, { Circle, Rect, Text as SvgText } from 'react-native-svg';
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
  Sparkles,
  PhoneCall,
  DollarSign,
  Users,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, Button, SegmentedControl } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { formatCurrency } from '../../utils';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { LeadStage } from '../../types';

interface CrmDashboardScreenProps {
  navigation: any;
}

type PeriodType = 'month' | 'quarter' | 'year' | 'all';

const DonutMini: React.FC<{ percentage: number; color?: string }> = ({
  percentage,
  color = '#059669',
}) => {
  const size = 48;
  const strokeWidth = 4.5;
  const radiusVal = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusVal;
  const strokeDashoffset = circumference - (circumference * Math.min(100, Math.max(0, percentage))) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={radiusVal} stroke="#e2e8f0" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radiusVal}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <SvgText x={size / 2} y={size / 2 + 4} fontSize="10" fontWeight="bold" fill="#0f172a" textAnchor="middle">
          {`${Math.round(percentage)}%`}
        </SvgText>
      </Svg>
    </View>
  );
};

const MiniBarsChart: React.FC<{ color?: string; heights?: number[] }> = ({
  color = '#38bdf8',
  heights = [10, 16, 22, 28],
}) => {
  const width = 38;
  const height = 30;
  const barWidth = 5;
  const gap = 3;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {heights.map((h, i) => {
        const x = 3 + i * (barWidth + gap);
        const y = height - h;
        const opacity = 0.35 + (i / (heights.length - 1)) * 0.65;
        return (
          <Rect key={i} x={x} y={y} width={barWidth} height={h} rx={2} fill={color} opacity={opacity} />
        );
      })}
    </Svg>
  );
};

export const CrmDashboardScreen: React.FC<CrmDashboardScreenProps> = ({ navigation }) => {
  const { leads, followUps, quotes } = useCrm();
  const { can, role } = useAuth();

  const [periodIndex, setPeriodIndex] = useState<number>(0);
  const periodOptions: string[] = ['This Month', 'This Quarter', 'This FY', 'All Time'];
  const periodKeys: PeriodType[] = ['month', 'quarter', 'year', 'all'];

  const summary = useMemo(() => {
    const totalLeads = leads.length;
    const wonLeads = leads.filter((l) => l.stage === 'Won');
    const wonCount = wonLeads.length;
    const wonAmount = wonLeads.reduce((sum, l) => sum + (l.quoteValue || l.estimatedValue || 0), 0);

    const todayISO = new Date().toISOString().split('T')[0];
    const dueFollowUps = followUps.filter((f) => f.status === 'Pending' && f.date <= todayISO);
    const overdueFollowUps = followUps.filter((f) => f.status === 'Pending' && f.date < todayISO);
    const dueTodayCount = dueFollowUps.length - overdueFollowUps.length;

    const awaitingQuotes = quotes.filter((q) => q.status === 'Sent' || q.status === 'Revised' || q.status === 'Pending Approval');
    const awaitingValue = awaitingQuotes.reduce((sum, q) => sum + q.total, 0);

    const conversionRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;
    const proposalsSent = leads.filter((l) => ['Proposal Sent', 'Negotiation', 'Won'].includes(l.stage)).length;

    const stageCounts: Record<string, number> = {
      'New Enquiry': leads.filter((l) => l.stage === 'New' || l.stage === 'New Enquiry').length,
      Contacted: leads.filter((l) => l.stage === 'Contacted').length,
      Qualified: leads.filter((l) => l.stage === 'Qualified').length,
      'Proposal Sent': leads.filter((l) => l.stage === 'Proposal Sent').length,
      Negotiation: leads.filter((l) => l.stage === 'Negotiation').length,
      Won: wonCount,
      Lost: leads.filter((l) => l.stage === 'Lost').length,
    };

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
    { key: 'New Enquiry', color: '#0284c7' },
    { key: 'Contacted', color: '#6366f1' },
    { key: 'Qualified', color: '#f59e0b' },
    { key: 'Proposal Sent', color: '#d97706' },
    { key: 'Negotiation', color: '#ec4899' },
    { key: 'Won', color: '#059669' },
    { key: 'Lost', color: '#dc2626' },
  ];

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title="Commercial CRM"
          subtitle="Exploration Enquiries & Pipeline Oversight"
          showBack
          badge="Commercial Workspace"
          onBack={() => navigation.goBack()}
          rightAction={
            can('manage', 'crm') ? (
              <TouchableOpacity
                activeOpacity={0.75}
                style={styles.addBtn}
                onPress={() => navigation.navigate('Leads')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Plus size={18} color="#ffffff" strokeWidth={2.4} />
              </TouchableOpacity>
            ) : null
          }
        />
      }
    >
      <SegmentedControl
        options={periodOptions}
        selectedIndex={periodIndex}
        onSelect={setPeriodIndex}
      />

      <View style={styles.statGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricCardLeft}>
            <View style={[styles.metricIconBox, { backgroundColor: '#f0f9ff' }]}>
              <Inbox size={17} color="#0284c7" strokeWidth={2.2} />
            </View>
            <Text style={styles.metricLabel}>ENQUIRIES</Text>
            <Text style={[styles.metricValue, { color: '#0284c7' }]}>{summary.totalLeads}</Text>
            <Text style={styles.metricSubtext}>Total incoming leads</Text>
          </View>
          <View style={styles.metricChartCol}>
            <MiniBarsChart color="#38bdf8" heights={[10, 16, 22, 28]} />
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricCardLeft}>
            <View
              style={[
                styles.metricIconBox,
                { backgroundColor: summary.overdueFollowUpsCount > 0 ? '#fef2f2' : '#fffbeb' },
              ]}
            >
              <CalendarClock
                size={17}
                color={summary.overdueFollowUpsCount > 0 ? '#dc2626' : '#d97706'}
                strokeWidth={2.2}
              />
            </View>
            <Text style={styles.metricLabel}>FOLLOW-UPS</Text>
            <Text
              style={[
                styles.metricValue,
                { color: summary.overdueFollowUpsCount > 0 ? '#dc2626' : '#d97706' },
              ]}
            >
              {summary.dueFollowUpsCount}
            </Text>
            <Text style={styles.metricSubtext}>
              {summary.overdueFollowUpsCount > 0 ? `${summary.overdueFollowUpsCount} overdue priority` : 'On schedule'}
            </Text>
          </View>
          <View style={styles.metricChartCol}>
            <MiniBarsChart
              color={summary.overdueFollowUpsCount > 0 ? '#f87171' : '#f59e0b'}
              heights={[14, 18, 24, 26]}
            />
          </View>
        </View>
      </View>

      <View style={styles.statGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricCardLeft}>
            <View style={[styles.metricIconBox, { backgroundColor: '#fffbeb' }]}>
              <FileText size={17} color="#d97706" strokeWidth={2.2} />
            </View>
            <Text style={styles.metricLabel}>QUOTES PENDING</Text>
            <Text style={[styles.metricValue, { color: '#d97706' }]}>{summary.awaitingQuotesCount}</Text>
            <Text style={styles.metricSubtext}>{formatCurrency(summary.awaitingValue)} value</Text>
          </View>
          <View style={styles.metricChartCol}>
            <MiniBarsChart color="#f59e0b" heights={[8, 14, 20, 26]} />
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricCardLeft}>
            <View style={[styles.metricIconBox, { backgroundColor: '#ecfdf5' }]}>
              <UserCheck size={17} color="#059669" strokeWidth={2.2} />
            </View>
            <Text style={styles.metricLabel}>CLIENTS WON</Text>
            <Text style={[styles.metricValue, { color: '#059669' }]}>{summary.wonCount}</Text>
            <Text style={styles.metricSubtext}>{formatCurrency(summary.wonAmount)} closed</Text>
          </View>
          <View style={styles.metricChartCol}>
            <DonutMini percentage={summary.conversionRate || 0} color="#059669" />
          </View>
        </View>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Commercial Actions</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.qaScroll}>
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Leads')}
          style={styles.qaItem}
        >
          <View style={[styles.qaIconWrap, { backgroundColor: '#ecfdf5' }]}>
            <Users size={22} color="#059669" strokeWidth={2} />
          </View>
          <Text style={styles.qaLabel}>Leads</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('FollowUps')}
          style={styles.qaItem}
        >
          <View style={[styles.qaIconWrap, { backgroundColor: '#fffbeb' }]}>
            <CalendarClock size={22} color="#d97706" strokeWidth={2} />
          </View>
          <Text style={styles.qaLabel}>Follow-ups</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Quotes')}
          style={styles.qaItem}
        >
          <View style={[styles.qaIconWrap, { backgroundColor: '#f0f9ff' }]}>
            <FileText size={22} color="#0284c7" strokeWidth={2} />
          </View>
          <Text style={styles.qaLabel}>Quotations</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('QuoteApprovals')}
          style={styles.qaItem}
        >
          <View style={[styles.qaIconWrap, { backgroundColor: '#fef2f2' }]}>
            <ShieldCheck size={22} color="#dc2626" strokeWidth={2} />
          </View>
          <Text style={styles.qaLabel}>Approvals</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('Clients')}
          style={styles.qaItem}
        >
          <View style={[styles.qaIconWrap, { backgroundColor: '#f5f3ff' }]}>
            <Building size={22} color="#7c3aed" strokeWidth={2} />
          </View>
          <Text style={styles.qaLabel}>Clients</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.conversionCard}>
        <View style={styles.conversionHeader}>
          <View>
            <Text style={styles.conversionLabel}>LEAD-TO-CLIENT WIN RATE</Text>
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
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>Lead Funnel Pipeline</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Leads')}>
          <Text style={styles.sectionLink}>View Funnel &rarr;</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.pipelineCard}>
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
      </View>

      {summary.approvalsPending.length > 0 && (
        <>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Client Approvals at a Glance</Text>
            <TouchableOpacity onPress={() => navigation.navigate('QuoteApprovals')}>
              <Text style={styles.sectionLink}>Review All &rarr;</Text>
            </TouchableOpacity>
          </View>

          {summary.approvalsPending.slice(0, 2).map((l) => (
            <TouchableOpacity
              key={l.id}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('QuoteApprovals')}
              style={styles.approvalCard}
            >
              <View style={styles.approvalHeader}>
                <Text style={styles.approvalCompany}>{l.company}</Text>
                <StatusBadge status="Accepted Quote" size="sm" />
              </View>
              <Text style={styles.approvalService}>{l.title}</Text>
              <Text style={styles.approvalValue}>Contract Value: {formatCurrency(l.quoteValue || l.estimatedValue)}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(13, 148, 136, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 13,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricCardLeft: {
    flex: 1,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  metricSubtext: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  metricChartCol: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0d9488',
  },
  qaScroll: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  qaItem: {
    alignItems: 'center',
    width: 58,
  },
  qaIconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    ...shadows.xs,
  },
  qaLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
  },
  conversionCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.md,
    ...shadows.xs,
  },
  conversionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  conversionLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.4,
  },
  conversionRate: {
    fontSize: 22,
    fontWeight: '800',
    color: '#059669',
    marginTop: 2,
  },
  conversionMeta: {
    alignItems: 'flex-end',
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  metaBold: {
    fontWeight: '700',
    color: '#0f172a',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  pipelineCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginBottom: spacing.md,
    ...shadows.xs,
  },
  pipelineRow: {
    marginBottom: spacing.sm,
  },
  stageLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stageDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: spacing.xs,
  },
  stageName: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '600',
    flex: 1,
  },
  stageCountText: {
    fontSize: 12,
    color: '#0f172a',
    fontWeight: '700',
  },
  stagePctText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '500',
  },
  stageTrack: {
    height: 5,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  stageFill: {
    height: '100%',
    borderRadius: 3,
  },
  approvalCard: {
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.xs,
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  approvalCompany: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  approvalService: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  approvalValue: {
    fontSize: 12,
    color: '#0d9488',
    fontWeight: '700',
  },
});
