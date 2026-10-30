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
  const open = leads.filter((l) => !['Won', 'Lost'].includes(l.stage)).length;
  const pipeline = leads.filter((l) => !['Won', 'Lost'].includes(l.stage)).reduce((s, l) => s + (l.quoteValue || l.estimatedValue || 0), 0);
  const decided = leads.filter((l) => l.stage === 'Won' || l.stage === 'Lost');
  const winRate = decided.length ? `${Math.round((decided.filter((l) => l.stage === 'Won').length / decided.length) * 100)}% won` : 'None decided yet';

  const activeFollowUpsCount = followUps.filter((f) => f.status !== 'Completed').length;
  const pendingApprovalsCount = leads.filter((l) => l.quoteStatus === 'Accepted' && l.stage !== 'Won').length;

  const crmModules = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Pipeline and this month at a glance',
      icon: <LayoutDashboard size={20} color="#2f6fb3" />,
      route: 'CrmDashboard',
    },
    {
      id: 'leads',
      title: 'Leads & Enquiries',
      subtitle: `${leads.length} enquiries`,
      icon: <Users size={20} color="#2f6fb3" />,
      route: 'Leads',
    },
    {
      id: 'followups',
      title: 'Follow-ups',
      subtitle: 'Calls, visits and meetings',
      badge: `${activeFollowUpsCount}`,
      badgeColor: '#2f6fb3',
      icon: <CalendarClock size={20} color="#2f6fb3" />,
      route: 'FollowUps',
    },
    {
      id: 'quotes',
      title: 'Quotations & Proposals',
      subtitle: `${quotes.length} quotations`,
      icon: <FileSpreadsheet size={20} color="#2f6fb3" />,
      route: 'Quotes',
    },
    {
      id: 'approvals',
      title: 'Client Approval',
      subtitle: 'PO, advance and agreement after a quote is accepted',
      badge: `${pendingApprovalsCount}`,
      badgeColor: '#d24c47',
      icon: <CheckCircle2 size={20} color="#2f6fb3" />,
      route: 'ClientApprovals',
    },
    {
      id: 'onboarding',
      title: 'Client Onboarding',
      subtitle: 'Won deals that become projects',
      icon: <UserCheck size={20} color="#2f6fb3" />,
      route: 'ClientOnboarding',
    },
    {
      id: 'master',
      title: 'Client Master',
      subtitle: `${clients.length} clients`,
      icon: <Building size={20} color="#2f6fb3" />,
      route: 'Clients',
    },
    {
      id: 'questions',
      title: 'Client Questions',
      subtitle: 'Asked by clients on the portal',
      icon: <HelpCircle size={20} color="#2f6fb3" />,
      route: 'ClientQuestions',
    },
    {
      id: 'mis',
      title: 'MIS Reports',
      subtitle: 'Sales, projects, HR and finance figures',
      icon: <BarChart3 size={20} color="#2f6fb3" />,
      route: 'MisReports',
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('MainTabs'))}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <ChevronLeft size={22} color="#0f2a3d" strokeWidth={2.2} />
          <Text style={styles.headerTitle}>CRM Workspace</Text>
        </TouchableOpacity>
        <View style={styles.clientTag}>
          <Text style={styles.clientTagText}>SALES</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.kpiHeroCard}>
          <View style={styles.kpiTopRow}>
            <Text style={styles.kpiHeroTitle}>Sales pipeline</Text>
          </View>
          <View style={styles.kpiMetricsGrid}>
            <View style={styles.kpiMetricBox}>
              <Text style={styles.kpiMetricLabel}>Total Enquiries</Text>
              <Text style={styles.kpiMetricVal}>{leads.length}</Text>
              <Text style={styles.kpiMetricTrend}>{open} open</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiMetricBox}>
              <Text style={styles.kpiMetricLabel}>Quotations</Text>
              <Text style={styles.kpiMetricVal}>{quotes.length}</Text>
              <Text style={styles.kpiMetricTrend}>₹{(pipeline / 1e5).toFixed(1)} L open</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiMetricBox}>
              <Text style={styles.kpiMetricLabel}>Clients</Text>
              <Text style={styles.kpiMetricVal}>{clients.length}</Text>
              <Text style={styles.kpiMetricTrend}>{winRate}</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Leads')}
            style={[styles.quickActionBtn, { backgroundColor: '#e6effa', borderColor: '#c9dcf1' }]}
          >
            <Text style={[styles.quickActionText, { color: '#245a93' }]}>+ New Lead</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Quotes')}
            style={[styles.quickActionBtn, { backgroundColor: '#e3f4ec', borderColor: '#bfe3d0' }]}
          >
            <Text style={[styles.quickActionText, { color: '#237a53' }]}>New quotation</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ClientApprovals')}
            style={[styles.quickActionBtn, { backgroundColor: '#fcf0dc', borderColor: '#ecd6ae' }]}
          >
            <Text style={[styles.quickActionText, { color: '#9a5f0c' }]}>Approvals ({pendingApprovalsCount})</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Modules</Text>
          <Text style={styles.sectionCount}>{crmModules.length} Modules</Text>
        </View>

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
                <ChevronRight size={15} color="#2f6fb3" strokeWidth={2.4} />
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
    backgroundColor: '#f4f7f8',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f3',
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
    fontWeight: '700',
    color: '#0f2a3d',
    letterSpacing: -0.3,
  },
  clientTag: {
    backgroundColor: '#e6effa',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  clientTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2f6fb3',
    letterSpacing: 0.5,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 40,
  },

  kpiHeroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.2,
    borderColor: '#e1e8eb',
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
    fontWeight: '700',
    color: '#0f2a3d',
  },
  liveBadge: {
    backgroundColor: '#e6effa',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2f6fb3',
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
    color: '#627079',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  kpiMetricVal: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 25,
    color: '#0f2a3d',
    marginTop: 3,
    letterSpacing: -0.5,
  },
  kpiMetricTrend: {
    fontSize: 11,
    color: '#237a53',
    fontWeight: '700',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1.2,
    height: 42,
    backgroundColor: '#e1e8eb',
    marginHorizontal: 10,
  },

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
    fontWeight: '700',
  },

  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f2a3d',
    letterSpacing: -0.2,
  },
  sectionCount: {
    fontSize: 11.5,
    color: '#627079',
    fontWeight: '600',
  },

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
    borderColor: '#e1e8eb',
    ...shadows.xs,
  },
  moduleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: '#e6effa',
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
    fontWeight: '700',
    color: '#0f2a3d',
    letterSpacing: -0.2,
  },
  moduleItemSubtitle: {
    fontSize: 12,
    color: '#627079',
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
    fontWeight: '700',
  },
  moduleArrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#edf1f3',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
