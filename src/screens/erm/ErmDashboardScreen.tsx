import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import {
  FolderKanban,
  AlertTriangle,
  CalendarClock,
  Landmark,
  ArrowRight,
  UserCheck,
  Users,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, Button } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { ERM_STAGES, TEAM_LEADS } from '../../constants';

interface ErmDashboardScreenProps {
  navigation: any;
}

export const ErmDashboardScreen: React.FC<ErmDashboardScreenProps> = ({ navigation }) => {
  const { projects } = useCrm();
  const { role } = useAuth();

  const todayISO = new Date().toISOString().split('T')[0];
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  const activeProjects = projects.filter((p) => (p.currentStage || 1) < 7);
  const completedProjects = projects.filter((p) => (p.currentStage || 1) >= 7);

  // Open tasks across active projects
  const openTasks = activeProjects.flatMap((p) =>
    (p.tasks || [])
      .filter((t) => t.status !== 'Completed')
      .map((t) => ({ task: t, project: p }))
  );

  const overdueTasks = openTasks.filter(
    ({ task }) => task.overdue || (task.dueDate && task.dueDate < todayISO)
  );

  const dueThisWeekTasks = openTasks.filter(
    ({ task }) => task.dueDate && task.dueDate >= todayISO && task.dueDate <= nextWeek
  );

  const withAuthorityProjects = activeProjects.filter(
    (p) => p.currentStage === 5 || p.status === 'Awaiting approval'
  );

  // Attention Queue: Overdue tasks & hand-overs waiting for action
  const waitingHandOvers = activeProjects
    .filter((p) => [1, 2, 3, 7].includes(p.currentStage))
    .map((p) => {
      const stageCfg = ERM_STAGES[Math.min(6, (p.currentStage || 1) - 1)];
      return {
        id: `wait-${p.id}`,
        project: p,
        title: `${p.clientName} · ${p.title}`,
        subtitle: stageCfg?.todo || 'Action required',
        owner: stageCfg?.owner || 'Team',
        isOverdue: false,
        tab: (p.currentStage === 3 ? 'tasks' : 'overview') as string,
      };
    });

  const lateTaskAlerts = overdueTasks.map(({ task, project }) => ({
    id: `late-${project.id}-${task.id || task.key}`,
    project,
    title: `${project.clientName} · ${task.title}`,
    subtitle: `Due ${task.dueDate || 'past deadline'}`,
    owner: task.assigneeName || 'Unassigned',
    isOverdue: true,
    tab: 'tasks' as string,
  }));

  const attentionList = [...lateTaskAlerts, ...waitingHandOvers].slice(0, 6);

  // Team Leads Workload
  const teamLeadsStats = TEAM_LEADS.map((tl) => {
    const mine = activeProjects.filter((p) => p.team?.teamLead === tl.name);
    const tasks = mine.flatMap((p) => (p.tasks || []).filter((t) => t.status !== 'Completed'));
    const overdue = tasks.filter(
      (t) => t.overdue || (t.dueDate && t.dueDate < todayISO)
    ).length;
    return {
      ...tl,
      activeProjectsCount: mine.length,
      openTasksCount: tasks.length,
      overdueTasksCount: overdue,
    };
  });

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title="ERM Workspace"
          subtitle={`${activeProjects.length} active field blocks • Geological Project Delivery`}
          showBack
          onBack={() => navigation.goBack()}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
    >
      {/* 4 Executive KPIs */}
      <View style={styles.kpiGrid}>
        <TouchableOpacity
          style={[styles.kpiCard, { borderColor: colors.info }]}
          onPress={() => navigation.navigate('Projects')}
          activeOpacity={0.7}
        >
          <View style={[styles.kpiIconWrap, { backgroundColor: colors.info + '18' }]}>
            <FolderKanban size={20} color={colors.info} />
          </View>
          <Text style={styles.kpiVal}>{activeProjects.length}</Text>
          <Text style={styles.kpiLabel}>Active Projects</Text>
          <Text style={styles.kpiSub}>{completedProjects.length} completed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.kpiCard,
            { borderColor: overdueTasks.length > 0 ? colors.danger : colors.success },
          ]}
          onPress={() => navigation.navigate('MainTabs', { screen: 'TasksTab' })}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.kpiIconWrap,
              {
                backgroundColor:
                  (overdueTasks.length > 0 ? colors.danger : colors.success) + '18',
              },
            ]}
          >
            <AlertTriangle
              size={20}
              color={overdueTasks.length > 0 ? colors.danger : colors.success}
            />
          </View>
          <Text
            style={[
              styles.kpiVal,
              { color: overdueTasks.length > 0 ? colors.danger : colors.success },
            ]}
          >
            {overdueTasks.length}
          </Text>
          <Text style={styles.kpiLabel}>Overdue Tasks</Text>
          <Text style={styles.kpiSub}>
            {overdueTasks.length > 0 ? 'Past deadline' : 'All on schedule'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, { borderColor: colors.warning }]}
          onPress={() => navigation.navigate('MainTabs', { screen: 'TasksTab' })}
          activeOpacity={0.7}
        >
          <View style={[styles.kpiIconWrap, { backgroundColor: colors.warning + '18' }]}>
            <CalendarClock size={20} color={colors.warning} />
          </View>
          <Text style={styles.kpiVal}>{dueThisWeekTasks.length}</Text>
          <Text style={styles.kpiLabel}>Due This Week</Text>
          <Text style={styles.kpiSub}>Next 7 days work</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.kpiCard, { borderColor: colors.accent }]}
          onPress={() => navigation.navigate('Projects', { stageKey: 'approval' })}
          activeOpacity={0.7}
        >
          <View style={[styles.kpiIconWrap, { backgroundColor: colors.accent + '18' }]}>
            <Landmark size={20} color={colors.accent} />
          </View>
          <Text style={styles.kpiVal}>{withAuthorityProjects.length}</Text>
          <Text style={styles.kpiLabel}>With Authority</Text>
          <Text style={styles.kpiSub}>Govt approvals</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Action Navigation Buttons */}
      <View style={styles.quickActionsRow}>
        <Button
          title="All Projects & Approvals"
          icon={<FolderKanban size={16} color={colors.white} />}
          onPress={() => navigation.navigate('Projects')}
          size="sm"
          style={styles.actionBtn}
        />
        {(role === 'admin' || role === 'lead') && (
          <Button
            title="New Project"
            icon={<Plus size={16} color={colors.primary} />}
            variant="outline"
            onPress={() => navigation.navigate('Projects', { openCreate: true })}
            size="sm"
            style={styles.actionBtnSecondary}
          />
        )}
      </View>

      {/* 7-Stage Interactive Pipeline */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <FolderKanban size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Projects by 7-Stage Pipeline</Text>
          </View>
          <Text style={styles.sectionBadgeText}>{activeProjects.length} running</Text>
        </View>
        <Text style={styles.sectionHelper}>
          Tap any stage to view and filter active exploration projects
        </Text>

        <View style={styles.stagesContainer}>
          {ERM_STAGES.map((st, i) => {
            const count = activeProjects.filter((p) => (p.stageIndex ?? p.currentStage - 1) === i).length;
            return (
              <TouchableOpacity
                key={st.key}
                style={[
                  styles.stageRow,
                  count > 0 && styles.stageRowActive,
                ]}
                onPress={() => navigation.navigate('Projects', { stageKey: st.key })}
                activeOpacity={0.7}
              >
                <View style={styles.stageNumBadge}>
                  <Text style={styles.stageNumText}>{i + 1}</Text>
                </View>

                <View style={styles.stageInfoCol}>
                  <View style={styles.stageTitleRow}>
                    <Text style={styles.stageLabel}>{st.label}</Text>
                    <View style={[styles.countPill, count > 0 && styles.countPillActive]}>
                      <Text style={[styles.countText, count > 0 && styles.countTextActive]}>
                        {count} {count === 1 ? 'project' : 'projects'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.stageWaiting} numberOfLines={1}>
                    {count > 0 ? st.waiting : 'None at this step'}
                  </Text>
                  <Text style={styles.stageOwner}>Owner: {st.owner}</Text>
                </View>

                <ChevronRight size={16} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* Needs Attention Queue */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <AlertTriangle size={18} color={attentionList.length > 0 ? colors.danger : colors.success} />
            <Text style={styles.sectionTitle}>Needs Attention</Text>
          </View>
          <Text style={[styles.sectionBadgeText, { color: attentionList.length > 0 ? colors.danger : colors.success }]}>
            {attentionList.length} items
          </Text>
        </View>

        {attentionList.length === 0 ? (
          <View style={styles.emptyAttention}>
            <CheckCircle2 size={24} color={colors.success} />
            <Text style={styles.emptyAttentionText}>
              Every project is moving smoothly. Nothing overdue or waiting on hand-over.
            </Text>
          </View>
        ) : (
          attentionList.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.attentionItem,
                item.isOverdue ? styles.attentionItemOverdue : styles.attentionItemWaiting,
              ]}
              onPress={() =>
                navigation.navigate('ProjectDetail', {
                  projectId: item.project.id,
                  initialTab: item.tab,
                })
              }
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.attentionIndicator,
                  { backgroundColor: item.isOverdue ? colors.danger : colors.warning },
                ]}
              />
              <View style={styles.attentionContent}>
                <Text style={styles.attentionTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text
                  style={[
                    styles.attentionSub,
                    item.isOverdue && { color: colors.danger, fontWeight: typography.fontWeights.medium },
                  ]}
                  numberOfLines={1}
                >
                  {item.subtitle}
                </Text>
              </View>
              <View style={styles.attentionWhoPill}>
                <Text style={styles.attentionWhoText} numberOfLines={1}>
                  {item.owner}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </Card>

      {/* Team Leads Workload Summary */}
      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Users size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Team Leads Workload</Text>
          </View>
          <Text style={styles.sectionBadgeText}>Technical Staffing</Text>
        </View>

        {teamLeadsStats.map((tl) => (
          <View key={tl.name} style={styles.leadRow}>
            <View style={styles.leadAvatarCol}>
              <View style={styles.leadAvatar}>
                <Text style={styles.leadAvatarText}>
                  {tl.name
                    .replace(/^Dr\.\s*/, '')
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </Text>
              </View>
            </View>

            <View style={styles.leadInfoCol}>
              <Text style={styles.leadName}>{tl.name}</Text>
              <Text style={styles.leadTitle}>{tl.title}</Text>
            </View>

            <View style={styles.leadStatsCol}>
              <View style={styles.leadStatBox}>
                <Text style={styles.leadStatNum}>{tl.activeProjectsCount}</Text>
                <Text style={styles.leadStatLbl}>Blocks</Text>
              </View>
              <View style={styles.leadStatBox}>
                <Text style={styles.leadStatNum}>{tl.openTasksCount}</Text>
                <Text style={styles.leadStatLbl}>Tasks</Text>
              </View>
              <View style={styles.leadStatBox}>
                <Text
                  style={[
                    styles.leadStatNum,
                    tl.overdueTasksCount > 0 && { color: colors.danger },
                  ]}
                >
                  {tl.overdueTasksCount}
                </Text>
                <Text style={styles.leadStatLbl}>Late</Text>
              </View>
            </View>
          </View>
        ))}
      </Card>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    ...shadows.sm,
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  kpiVal: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  kpiLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textSecondary,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginTop: 1,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  actionBtn: {
    flex: 1,
  },
  actionBtnSecondary: {
    flex: 1,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  sectionBadgeText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
  },
  sectionHelper: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  stagesContainer: {
    gap: spacing.xs,
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  stageRowActive: {
    backgroundColor: colors.surface,
    borderColor: colors.primary + '40',
  },
  stageNumBadge: {
    width: 26,
    height: 26,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  stageNumText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.white,
  },
  stageInfoCol: {
    flex: 1,
  },
  stageTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  stageLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  countPill: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  countPillActive: {
    backgroundColor: colors.primary + '18',
  },
  countText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textMuted,
  },
  countTextActive: {
    color: colors.primary,
    fontWeight: typography.fontWeights.bold,
  },
  stageWaiting: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
  },
  stageOwner: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginTop: 1,
  },
  attentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  attentionItemOverdue: {
    backgroundColor: colors.danger + '06',
  },
  attentionItemWaiting: {
    backgroundColor: colors.surface,
  },
  attentionIndicator: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    marginRight: spacing.sm,
  },
  attentionContent: {
    flex: 1,
    marginRight: spacing.xs,
  },
  attentionTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  attentionSub: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
    marginTop: 1,
  },
  attentionWhoPill: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceMuted,
    maxWidth: 90,
  },
  attentionWhoText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  emptyAttention: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  emptyAttentionText: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  leadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  leadAvatarCol: {
    marginRight: spacing.sm,
  },
  leadAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadAvatarText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  leadInfoCol: {
    flex: 1,
  },
  leadName: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  leadTitle: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
  leadStatsCol: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  leadStatBox: {
    alignItems: 'center',
    minWidth: 40,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderRadius: radius.xs,
    backgroundColor: colors.surfaceMuted,
  },
  leadStatNum: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
  },
  leadStatLbl: {
    fontSize: typography.fontSizes.xxs - 2,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
});
