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
  FolderKanban,
  CheckSquare,
  UserCheck,
  Users,
  Boxes,
} from 'lucide-react-native';
import { colors, spacing, radius, shadows } from '../../theme';
import { useCrm } from '../../context/CrmContext';

interface ErmWorkspaceHomeScreenProps {
  navigation: any;
}

export const ErmWorkspaceHomeScreen: React.FC<ErmWorkspaceHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { projects } = useCrm();

  const totalTasks = projects.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
  const activeProjectsCount = projects.filter((p) => p.status === 'In progress').length;

  const ermModules = [
    {
      id: 'dashboard',
      title: 'ERM Dashboard',
      subtitle: '7-Stage exploration milestones & telemetry',
      icon: <LayoutDashboard size={20} color="#0d9488" />,
      route: 'ErmDashboard',
    },
    {
      id: 'projects',
      title: 'Projects',
      subtitle: `${projects.length} total mining & drilling blocks`,
      badge: `${activeProjectsCount}`,
      badgeColor: '#0d9488',
      icon: <FolderKanban size={20} color="#0d9488" />,
      route: 'Projects',
    },
    {
      id: 'tasks',
      title: 'Tasks',
      subtitle: 'Universal WBS & operational tasks',
      badge: `${totalTasks}`,
      badgeColor: '#0284c7',
      icon: <CheckSquare size={20} color="#0d9488" />,
      route: 'Tasks',
    },
    {
      id: 'my_tasks',
      title: 'My Tasks',
      subtitle: 'Personal field assignments & reviews',
      icon: <UserCheck size={20} color="#0d9488" />,
      route: 'Tasks',
    },
    {
      id: 'team',
      title: 'Team',
      subtitle: 'Geoscientists, coordinators & field drillers',
      icon: <Users size={20} color="#0d9488" />,
      route: 'EmployeeDirectory',
    },
    {
      id: 'inventory',
      title: 'Inventory / Stock',
      subtitle: 'Drill rigs, core boxes & sampling consumables',
      icon: <Boxes size={20} color="#0d9488" />,
      route: 'Projects',
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
          <Text style={styles.headerTitle}>ERM Workspace</Text>
        </TouchableOpacity>
        <View style={styles.tag}>
          <Text style={styles.tagText}>FIELD OPERATIONS</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Mining Operations Telemetry KPI Hero Card */}
        <View style={styles.kpiHeroCard}>
          <View style={styles.kpiTopRow}>
            <Text style={styles.kpiHeroTitle}>Exploration & Mining Blocks Telemetry</Text>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>68% EXECUTION</Text>
            </View>
          </View>
          <View style={styles.kpiMetricsGrid}>
            <View style={styles.kpiMetricBox}>
              <Text style={styles.kpiMetricLabel}>Active Blocks</Text>
              <Text style={styles.kpiMetricVal}>{projects.length || 5}</Text>
              <Text style={styles.kpiMetricTrend}>5 Live Sites</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiMetricBox}>
              <Text style={styles.kpiMetricLabel}>Core Drilled</Text>
              <Text style={styles.kpiMetricVal}>1,420 M</Text>
              <Text style={styles.kpiMetricTrend}>Target 2,000 M</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiMetricBox}>
              <Text style={styles.kpiMetricLabel}>Field Team</Text>
              <Text style={styles.kpiMetricVal}>12 Staff</Text>
              <Text style={styles.kpiMetricTrend}>6 Geologists</Text>
            </View>
          </View>
        </View>

        {/* 2. Quick Actions Bar */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Projects')}
            style={[styles.quickActionBtn, { backgroundColor: '#f0fdfa', borderColor: '#ccfbf1' }]}
          >
            <Text style={[styles.quickActionText, { color: '#0f766e' }]}>All Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Tasks')}
            style={[styles.quickActionBtn, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}
          >
            <Text style={[styles.quickActionText, { color: '#1d4ed8' }]}>Tasks Board ({totalTasks})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EmployeeDirectory')}
            style={[styles.quickActionBtn, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}
          >
            <Text style={[styles.quickActionText, { color: '#b45309' }]}>Field Roster</Text>
          </TouchableOpacity>
        </View>

        {/* 3. Section Title */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Project & Operations Submodules</Text>
          <Text style={styles.sectionCount}>{ermModules.length} Modules</Text>
        </View>

        {/* 4. Expansive Submodule Cards */}
        <View style={styles.modulesList}>
          {ermModules.map((item) => (
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
                <ChevronRight size={15} color="#0d9488" strokeWidth={2.4} />
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
  tag: {
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0d9488',
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
    backgroundColor: '#f0fdfa',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0d9488',
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
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
  },
  kpiMetricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  kpiMetricTrend: {
    fontSize: 10,
    color: '#0f766e',
    fontWeight: '700',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#f1f5f9',
    marginHorizontal: 8,
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
    backgroundColor: '#f0fdfa',
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
