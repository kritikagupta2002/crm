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
import { useHrms } from '../../context/HrmsContext';
import { useFieldDatabase } from '../../context/FieldDatabaseContext';
import { recordStat } from '../../fieldDatabase/data/fieldFormats';

interface ErmWorkspaceHomeScreenProps {
  navigation: any;
}

export const ErmWorkspaceHomeScreen: React.FC<ErmWorkspaceHomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { projects } = useCrm();
  const { employees } = useHrms();
  const { fieldRecords } = useFieldDatabase();
  const running = projects.filter((p) => p.status !== 'Completed').length;
  const tasks = projects.flatMap((p) => p.tasks || []);
  const openTasks = tasks.filter((t) => t.status !== 'Completed');
  const today = new Date().toISOString().slice(0, 10);
  const lateTasks = openTasks.filter((t) => (t.dueDate || t.due || '9999') < today).length;
  // Metres drilled, from the daily drilling reports in the Field Database.
  const dprs = fieldRecords.filter((r: any) => r.section === 'core-drilling-dpr');
  const metres = dprs.reduce((s: number, r: any) => s + (Number(recordStat('core-drilling-dpr', r, 'metres')) || 0), 0);

  const totalTasks = projects.reduce((sum, p) => sum + (p.tasks?.length || 0), 0);
  const activeProjectsCount = projects.filter((p) => p.status === 'In progress').length;

  const ermModules = [
    {
      id: 'dashboard',
      title: 'ERM Dashboard',
      subtitle: 'Projects by stage, tasks and team',
      icon: <LayoutDashboard size={20} color="#1f6f78" />,
      route: 'ErmDashboard',
    },
    {
      id: 'projects',
      title: 'Projects',
      subtitle: `${projects.length} projects`,
      badge: `${activeProjectsCount}`,
      badgeColor: '#1f6f78',
      icon: <FolderKanban size={20} color="#1f6f78" />,
      route: 'Projects',
    },
    {
      id: 'tasks',
      title: 'Tasks',
      subtitle: 'Every task across projects',
      badge: `${totalTasks}`,
      badgeColor: '#2f6fb3',
      icon: <CheckSquare size={20} color="#1f6f78" />,
      route: 'Tasks',
    },
    {
      id: 'my_tasks',
      title: 'My Tasks',
      subtitle: 'Tasks given to you',
      icon: <UserCheck size={20} color="#1f6f78" />,
      route: 'Tasks',
    },
    {
      id: 'team',
      title: 'Team',
      subtitle: 'Who works on which project',
      icon: <Users size={20} color="#1f6f78" />,
      route: 'EmployeeDirectory',
    },
    {
      id: 'inventory',
      title: 'Inventory / Stock',
      subtitle: 'Equipment, tools and consumables',
      icon: <Boxes size={20} color="#1f6f78" />,
      route: 'Inventory',
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
          <Text style={styles.headerTitle}>ERM Workspace</Text>
        </TouchableOpacity>
        <View style={styles.tag}>
          <Text style={styles.tagText}>PROJECTS</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.kpiHeroCard}>
          <View style={styles.kpiTopRow}>
            <Text style={styles.kpiHeroTitle}>Projects</Text>

          </View>
          <View style={styles.kpiMetricsGrid}>
            <View style={styles.kpiMetricBox}>
              <Text style={styles.kpiMetricLabel}>Running</Text>
              <Text style={styles.kpiMetricVal}>{running}</Text>
              <Text style={styles.kpiMetricTrend}>{projects.length} in all</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiMetricBox}>
              <Text style={styles.kpiMetricLabel}>Open tasks</Text>
              <Text style={styles.kpiMetricVal}>{openTasks.length}</Text>
              <Text style={styles.kpiMetricTrend}>{lateTasks ? `${lateTasks} late` : 'None late'}</Text>
            </View>
            <View style={styles.kpiDivider} />
            <View style={styles.kpiMetricBox}>
              <Text style={styles.kpiMetricLabel}>Core drilled</Text>
              <Text style={styles.kpiMetricVal}>{Number(metres.toFixed(1))} m</Text>
              <Text style={styles.kpiMetricTrend}>{dprs.length} daily reports · {employees.length} staff</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Projects')}
            style={[styles.quickActionBtn, { backgroundColor: '#eef7f7', borderColor: '#ddefef' }]}
          >
            <Text style={[styles.quickActionText, { color: '#0e4a52' }]}>All Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Tasks')}
            style={[styles.quickActionBtn, { backgroundColor: '#e6effa', borderColor: '#c9dcf1' }]}
          >
            <Text style={[styles.quickActionText, { color: '#245a93' }]}>Tasks Board ({totalTasks})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('EmployeeDirectory')}
            style={[styles.quickActionBtn, { backgroundColor: '#fcf0dc', borderColor: '#ecd6ae' }]}
          >
            <Text style={[styles.quickActionText, { color: '#9a5f0c' }]}>Field Roster</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Modules</Text>
          <Text style={styles.sectionCount}>{ermModules.length} Modules</Text>
        </View>

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
                <ChevronRight size={15} color="#1f6f78" strokeWidth={2.4} />
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
  tag: {
    backgroundColor: '#eef7f7',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1f6f78',
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
    backgroundColor: '#eef7f7',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1f6f78',
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
    color: '#0e4a52',
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
    backgroundColor: '#eef7f7',
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
