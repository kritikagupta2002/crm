import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Users,
  CalendarClock,
  FileSpreadsheet,
  CheckCircle2,
  UserCheck,
  Building,
  HelpCircle,
  BarChart3,
} from 'lucide-react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import { useCrm } from '../../context/CrmContext';

interface CrmWorkspaceHomeScreenProps {
  navigation: any;
}

export const CrmWorkspaceHomeScreen: React.FC<CrmWorkspaceHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { leads, followUps, quotes, clients } = useCrm();

  const activeFollowUpsCount = followUps.filter((f) => f.status !== 'Completed').length;
  const pendingApprovalsCount = leads.filter((l) => l.quoteStatus === 'Accepted' && l.stage !== 'Won').length;

  const crmModules = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Overview & pipeline telemetry',
      icon: <LayoutDashboard size={20} color="#2563eb" />,
      route: 'CrmDashboard',
    },
    {
      id: 'leads',
      title: 'Leads & Enquiries',
      subtitle: `${leads.length} total active enquiries`,
      icon: <Users size={20} color="#2563eb" />,
      route: 'Leads',
    },
    {
      id: 'followups',
      title: 'Follow-ups',
      subtitle: 'Client site visits, calls & meetings',
      badge: `${activeFollowUpsCount}`,
      badgeColor: '#2563eb',
      icon: <CalendarClock size={20} color="#2563eb" />,
      route: 'FollowUps',
    },
    {
      id: 'quotes',
      title: 'Quotations & Proposals',
      subtitle: `${quotes.length} exploration rate proposals`,
      icon: <FileSpreadsheet size={20} color="#2563eb" />,
      route: 'Quotes',
    },
    {
      id: 'approvals',
      title: 'Client Approval',
      subtitle: '4-stage PO & advance approval pipeline',
      badge: `${pendingApprovalsCount}`,
      badgeColor: '#dc2626',
      icon: <CheckCircle2 size={20} color="#2563eb" />,
      route: 'ClientApprovals',
    },
    {
      id: 'onboarding',
      title: 'Client Onboarding',
      subtitle: 'KYC, agreement signing & site access',
      icon: <UserCheck size={20} color="#2563eb" />,
      route: 'ClientOnboarding',
    },
    {
      id: 'master',
      title: 'Client Master',
      subtitle: `${clients.length} verified enterprise accounts`,
      icon: <Building size={20} color="#2563eb" />,
      route: 'Clients',
    },
    {
      id: 'questions',
      title: 'Client Questions',
      subtitle: 'Public enquiries & tender requests',
      icon: <HelpCircle size={20} color="#2563eb" />,
      route: 'PublicEnquiry',
    },
    {
      id: 'mis',
      title: 'MIS Reports',
      subtitle: 'Commercial conversion & pipeline analytics',
      icon: <BarChart3 size={20} color="#2563eb" />,
      route: 'MisReports',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color="#0f172a" strokeWidth={2.2} />
          <Text style={styles.headerTitle}>CRM Workspace</Text>
        </TouchableOpacity>
        <View style={styles.clientTag}>
          <Text style={styles.clientTagText}>CLIENT PIPELINE</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Executive Telemetry KPI Hero Card */}
        <View style={styles.kpiHeroCard}>
          <View style={styles.kpiTopRow}>
            <Text style={styles.kpiHeroTitle}>Commercial Pipeline Overview</Text>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>FY 2026</Text>
            </View>
          </View>
          <View style={styles.kpiMetricsGrid}>
            <View style={styles.kpiMetricBox}>
              <Text style={styles.kpiMetricLabel}>Total Enquiries</Text>
              <Text style={styles.kpiMetricVal}>{leads.length || 3}</Text>
              <Text style={styles.kpiMetricTrend}>↑ 14% vs Q2</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiMetricBox}>
              <Text style={styles.kpiMetricLabel}>Rate Proposals</Text>
              <Text style={styles.kpiMetricVal}>{quotes.length || 4}</Text>
              <Text style={styles.kpiMetricTrend}>₹1.85 Cr Pipeline</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiMetricBox}>
              <Text style={styles.kpiMetricLabel}>Active Accounts</Text>
              <Text style={styles.kpiMetricVal}>{clients.length || 5}</Text>
              <Text style={styles.kpiMetricTrend}>68% Win Rate</Text>
            </View>
          </View>
        </View>

        {/* 2. Quick Actions Bar */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Leads')}
            style={[styles.quickActionBtn, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
          >
            <Text style={[styles.quickActionText, { color: '#1d4ed8' }]}>+ New Lead</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Quotes')}
            style={[styles.quickActionBtn, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}
          >
            <Text style={[styles.quickActionText, { color: '#15803d' }]}>Draft Proposal</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ClientApprovals')}
            style={[styles.quickActionBtn, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}
          >
            <Text style={[styles.quickActionText, { color: '#b45309' }]}>Approvals ({pendingApprovalsCount})</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Section Title */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Client Lifecycle Modules</Text>
          <Text style={styles.sectionCount}>{crmModules.length} Modules</Text>
        </View>

        {/* 4. Expansive Submodule Cards */}
        <View style={styles.modulesList}>
          {crmModules.map((item) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              onPress={() => navigation.navigate(item.route)}
              style={styles.moduleCard}
            >
              <View style={styles.moduleIconBox}>{item.icon}</View>

              <View style={styles.moduleInfoCol}>
                <View style={styles.moduleTitleLine}>
                  <Text style={styles.moduleItemTitle}>{item.title}</Text>
                  {item.badge && (
                    <View style={[styles.moduleBadgePill, { backgroundColor: item.badgeColor }]}>
                      <Text style={styles.moduleBadgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.moduleItemSubtitle}>{item.subtitle}</Text>
              </View>

              <View style={styles.moduleArrowCircle}>
                <ChevronRight size={15} color="#2563eb" strokeWidth={2.4} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.xs,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  clientTag: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  clientTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 40,
  },

  /* 1. KPI Hero Card */
  kpiHeroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    ...shadows.xs,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  kpiHeroTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  liveBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
  },
  kpiMetricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiMetricBox: {
    flex: 1,
  },
  kpiMetricLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  kpiMetricVal: {
    fontSize: 25,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 3,
    letterSpacing: -0.5,
  },
  kpiMetricTrend: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '700',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1.2,
    height: 42,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 10,
  },

  /* 2. Quick Actions */
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  quickActionBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 11.5,
    fontWeight: '800',
  },

  /* 3. Section Title */
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },

  /* 4. Expansive Modules List */
  modulesList: {
    gap: 10,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.2,
    borderColor: '#e2e8f0',
    ...shadows.xs,
  },
  moduleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  moduleInfoCol: {
    flex: 1,
    paddingRight: 6,
  },
  moduleTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  moduleItemTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  moduleItemSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
    lineHeight: 16,
  },
  moduleBadgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  moduleBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  moduleArrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
