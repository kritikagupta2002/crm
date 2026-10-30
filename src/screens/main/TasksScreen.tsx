import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  CheckCircle2,
  Circle,
  Clock,
  CheckSquare,
  AlertTriangle,
  Layers,
  Calendar,
  UserCheck,
  Search,
  X,
  ChevronRight,
  Check,
  Flame,
  Zap,
  MapPin,
  Filter,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer, AppHeader, EmptyState } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useAuth } from '../../context/AuthContext';
import { Task } from '../../types';
import { INITIAL_PROJECTS } from '../../constants/seeds/erm';

interface TasksScreenProps {
  navigation: any;
}

type FilterTab = 'all' | 'pending' | 'overdue' | 'completed';
type PriorityFilter = 'All' | 'Urgent' | 'High' | 'Medium' | 'Low';

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(parts[1], 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${months[monthIndex]} ${parseInt(parts[2], 10)}, ${parts[0]}`;
    }
  }
  return dateStr;
};

const getInitials = (name?: string) => {
  if (!name) return 'FT';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  if (['dr.', 'mr.', 'ms.', 'mrs.', 'er.'].includes(parts[0].toLowerCase()) && parts.length > 2) {
    return (parts[1][0] + parts[2][0]).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getAvatarTheme = (name?: string) => {
  const themes = [
    { bg: '#e6effa', text: '#245a93' },
    { bg: '#e8eef1', text: '#34495a' },
    { bg: '#e3f4ec', text: '#237a53' },
    { bg: '#fcf0dc', text: '#9a5f0c' },
    { bg: '#e8eef1', text: '#BE185D' },
    { bg: '#ddefef', text: '#0e4a52' },
  ];
  if (!name) return themes[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return themes[Math.abs(hash) % themes.length];
};

export const TasksScreen: React.FC<TasksScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { session, canonicalRole } = useAuth();
  const { projects, updateProjectTask } = useCrm();

  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [selectedPriority, setSelectedPriority] = useState<PriorityFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeMode, setScopeMode] = useState<'all' | 'my'>('all');

  const projectTasks = useMemo(() => {
    const list: (Task & { projectTitle: string; projectCode: string })[] = [];
    const sourceProjects = (projects && projects.length > 0) ? projects : INITIAL_PROJECTS;
    sourceProjects.forEach((p) => {
      const pTasks = (p.tasks && p.tasks.length > 0)
        ? p.tasks
        : (INITIAL_PROJECTS.find((ip) => ip.id === p.id)?.tasks || []);

      pTasks.forEach((t) => {
        list.push({
          ...t,
          projectTitle: p.title || p.name || 'Project Block',
          projectCode: p.projectCode || `PRJ-${p.id.slice(-4).toUpperCase()}`,
        });
      });
    });
    return list;
  }, [projects]);

  const myTasks = useMemo(() => {
    if (!session) return [];
    const myName = ((session as any).name || '').toLowerCase();
    const myFirstName = myName.split(' ')[0] || '';
    return projectTasks.filter((t) => {
      const assigned = (t.assigneeName || t.assignee || '').toLowerCase();
      return (
        (myName && assigned.includes(myName)) ||
        (myFirstName && assigned.includes(myFirstName))
      );
    });
  }, [projectTasks, session]);

  const allTasks = useMemo(() => {
    if (scopeMode === 'my' && myTasks.length > 0) {
      return myTasks;
    }
    return projectTasks;
  }, [scopeMode, myTasks, projectTasks]);

  const stats = useMemo(() => {
    const total = allTasks.length;
    const completedCount = allTasks.filter((t) => t.status === 'Completed').length;
    const pendingCount = total - completedCount;
    const overdueCount = allTasks.filter((t) => t.overdue && t.status !== 'Completed').length;
    const completionPercentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    return { total, completedCount, pendingCount, overdueCount, completionPercentage };
  }, [allTasks]);

  const { completedCount, pendingCount, overdueCount, completionPercentage } = stats;

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      const isDone = t.status === 'Completed';
      const isOverdue = t.overdue && !isDone;

      if (filterTab === 'pending' && isDone) return false;
      if (filterTab === 'completed' && !isDone) return false;
      if (filterTab === 'overdue' && !isOverdue) return false;

      if (selectedPriority !== 'All' && t.priority !== selectedPriority) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (t.title || '').toLowerCase().includes(q);
        const assigneeMatch = (t.assigneeName || t.assignee || '').toLowerCase().includes(q);
        const projectMatch = (t.projectTitle || '').toLowerCase().includes(q);
        const codeMatch = (t.projectCode || '').toLowerCase().includes(q);
        if (!titleMatch && !assigneeMatch && !projectMatch && !codeMatch) return false;
      }

      return true;
    });
  }, [allTasks, filterTab, selectedPriority, searchQuery]);

  const toggleTaskDone = useCallback(async (task: Task) => {
    try {
      const nextStatus = task.status === 'Completed' ? 'Todo' : 'Completed';
      await updateProjectTask(task.projectId, task.id || task.key!, { status: nextStatus });
    } catch (e: any) {
      console.error('Failed to toggle task status:', e);
    }
  }, [updateProjectTask]);

  return (
    <ScreenContainer
      scrollable={false}
      noPadding
      header={
        <AppHeader
          title="Field & Project Tasks"
          subtitle={`${pendingCount} pending • ${overdueCount > 0 ? `${overdueCount} overdue` : 'All on track'}`}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
    >
      <View style={styles.heroCard}>
        <View style={styles.scopeSwitcherRow}>
          <TouchableOpacity
            style={[styles.scopeBtn, scopeMode === 'all' && styles.scopeBtnActive]}
            onPress={() => setScopeMode('all')}
            activeOpacity={0.75}
          >
            <Text style={[styles.scopeBtnText, scopeMode === 'all' && styles.scopeBtnTextActive]}>
              All Project Tasks ({projectTasks.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.scopeBtn, scopeMode === 'my' && styles.scopeBtnActive]}
            onPress={() => setScopeMode('my')}
            activeOpacity={0.75}
          >
            <Text style={[styles.scopeBtnText, scopeMode === 'my' && styles.scopeBtnTextActive]}>
              Assigned to Me ({myTasks.length})
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.heroHeader}>
          <View style={styles.heroTitleCol}>
            <Text style={styles.heroEyebrow}>PROJECT EXECUTION PROGRESS</Text>
            <Text style={styles.heroSubtitle}>
              {completedCount} of {allTasks.length} tasks completed
            </Text>
          </View>
          <View style={styles.progressPercentPill}>
            <Text style={styles.progressPercentVal}>{completionPercentage}%</Text>
            <Text style={styles.progressPercentLabel}>DONE</Text>
          </View>
        </View>

        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(Math.max(completionPercentage, 4), 100)}%` },
            ]}
          />
        </View>

        <View style={styles.kpiRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.kpiPill, filterTab === 'all' && styles.kpiPillActive]}
            onPress={() => setFilterTab('all')}
          >
            <Text style={[styles.kpiCount, filterTab === 'all' && styles.kpiCountActive]}>
              {allTasks.length}
            </Text>
            <Text style={[styles.kpiLabel, filterTab === 'all' && styles.kpiLabelActive]}>
              All Tasks
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.kpiPill, filterTab === 'pending' && styles.kpiPillActive]}
            onPress={() => setFilterTab('pending')}
          >
            <Text
              style={[
                styles.kpiCount,
                { color: '#0e4a52' },
                filterTab === 'pending' && styles.kpiCountActive,
              ]}
            >
              {pendingCount}
            </Text>
            <Text style={[styles.kpiLabel, filterTab === 'pending' && styles.kpiLabelActive]}>
              Pending
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.kpiPill,
              overdueCount > 0 && styles.kpiPillOverdueBorder,
              filterTab === 'overdue' && styles.kpiPillOverdueActive,
            ]}
            onPress={() => setFilterTab('overdue')}
          >
            <View style={styles.kpiOverdueRow}>
              {overdueCount > 0 && <AlertTriangle size={12} color="#d24c47" />}
              <Text
                style={[
                  styles.kpiCount,
                  { color: overdueCount > 0 ? '#d24c47' : colors.textSecondary },
                  filterTab === 'overdue' && styles.kpiCountActive,
                ]}
              >
                {overdueCount}
              </Text>
            </View>
            <Text
              style={[
                styles.kpiLabel,
                overdueCount > 0 && { color: '#a83a36' },
                filterTab === 'overdue' && styles.kpiLabelActive,
              ]}
            >
              Overdue
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={[styles.kpiPill, filterTab === 'completed' && styles.kpiPillActive]}
            onPress={() => setFilterTab('completed')}
          >
            <View style={styles.kpiOverdueRow}>
              <Check size={12} color="#2e9e6b" strokeWidth={2.8} />
              <Text
                style={[
                  styles.kpiCount,
                  { color: '#2e9e6b' },
                  filterTab === 'completed' && styles.kpiCountActive,
                ]}
              >
                {completedCount}
              </Text>
            </View>
            <Text style={[styles.kpiLabel, filterTab === 'completed' && styles.kpiLabelActive]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.controlsSection}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textTertiary} />
          <TextInput
            placeholder="Search task, assignee, or project block..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            clearButtonMode="while-editing"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.priorityScroll}
        >
          <Text style={styles.priorityFilterLabel}>Priority:</Text>
          {(['All', 'Urgent', 'High', 'Medium', 'Low'] as PriorityFilter[]).map((p) => {
            const isActive = selectedPriority === p;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setSelectedPriority(p)}
                style={[
                  styles.priorityChip,
                  isActive && styles.priorityChipActive,
                  p === 'Urgent' && !isActive && styles.priorityChipUrgent,
                  p === 'High' && !isActive && styles.priorityChipHigh,
                ]}
              >
                <Text
                  style={[
                    styles.priorityChipText,
                    isActive && styles.priorityChipTextActive,
                    p === 'Urgent' && !isActive && { color: '#d24c47' },
                    p === 'High' && !isActive && { color: '#c27a12' },
                  ]}
                >
                  {p === 'All' ? 'All Priority' : p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id || `${item.projectId}-${item.key}`}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        style={styles.taskList}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom + 50, 84) },
        ]}
        ListEmptyComponent={
          <EmptyState
            title="No Tasks Found"
            message={
              searchQuery
                ? `No tasks match "${searchQuery}". Try clearing your search.`
                : filterTab === 'overdue'
                ? 'Great job! Zero overdue tasks currently in the pipeline.'
                : filterTab === 'completed'
                ? 'No completed tasks found in this view.'
                : 'All caught up! No active tasks matching your filter.'
            }
            icon={<CheckSquare size={38} color={colors.textTertiary} />}
          />
        }
        renderItem={({ item }) => {
          const isDone = item.status === 'Completed';
          const isOverdue = item.overdue && !isDone;
          const avatarTheme = getAvatarTheme(item.assigneeName || item.assignee);
          const initials = getInitials(item.assigneeName || item.assignee);

          return (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() =>
                navigation.navigate('ProjectDetail', {
                  projectId: item.projectId,
                  initialTab: 'tasks',
                })
              }
              style={[
                styles.taskCard,
                isDone && styles.taskCardDone,
                isOverdue && styles.taskCardOverdue,
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.projectTagGroup}>
                  <View style={styles.projectCodeBadge}>
                    <Text style={styles.projectCodeBadgeText}>{item.projectCode}</Text>
                  </View>
                  <View style={styles.projectBlockWrap}>
                    <MapPin size={11} color={colors.textTertiary} style={{ marginRight: 2 }} />
                    <Text style={styles.projectBlockText} numberOfLines={1}>
                      {item.projectTitle}
                    </Text>
                  </View>
                </View>

                {isOverdue ? (
                  <View style={styles.overdueBadge}>
                    <AlertTriangle size={11} color="#d24c47" />
                    <Text style={styles.overdueBadgeText}>OVERDUE</Text>
                  </View>
                ) : isDone ? (
                  <View style={styles.completedBadge}>
                    <Check size={11} color="#2e9e6b" strokeWidth={2.8} />
                    <Text style={styles.completedBadgeText}>COMPLETED</Text>
                  </View>
                ) : item.priority === 'Urgent' ? (
                  <View style={styles.urgentBadge}>
                    <Flame size={11} color="#d24c47" />
                    <Text style={styles.urgentBadgeText}>URGENT</Text>
                  </View>
                ) : item.priority === 'High' ? (
                  <View style={styles.highBadge}>
                    <Zap size={11} color="#c27a12" />
                    <Text style={styles.highBadgeText}>HIGH</Text>
                  </View>
                ) : (
                  <View style={styles.mediumBadge}>
                    <Text style={styles.mediumBadgeText}>{item.priority}</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardBodyRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleTaskDone(item)}
                  style={styles.checkboxArea}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {isDone ? (
                    <View style={styles.checkboxDone}>
                      <Check size={13} color="#FFFFFF" strokeWidth={3} />
                    </View>
                  ) : isOverdue ? (
                    <View style={styles.checkboxOverdue}>
                      <View style={styles.checkboxOverdueInner} />
                    </View>
                  ) : (
                    <View style={styles.checkboxPending} />
                  )}
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                  <Text
                    style={[
                      styles.taskTitleText,
                      isDone && styles.taskTitleTextDone,
                    ]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                </View>

                <ChevronRight size={16} color={colors.borderDark} style={{ marginLeft: 6 }} />
              </View>

              <View style={styles.cardFooterRow}>
                <View style={styles.assigneeChip}>
                  <View style={[styles.avatarCircle, { backgroundColor: avatarTheme.bg }]}>
                    <Text style={[styles.avatarText, { color: avatarTheme.text }]}>
                      {initials}
                    </Text>
                  </View>
                  <Text style={styles.assigneeName} numberOfLines={1}>
                    {item.assigneeName || item.assignee || 'Field Team Member'}
                  </Text>
                </View>

                <View style={styles.dueDateWrap}>
                  <Clock
                    size={12}
                    color={isOverdue ? '#d24c47' : isDone ? '#2e9e6b' : colors.textTertiary}
                  />
                  <Text
                    style={[
                      styles.dueDateText,
                      isOverdue && styles.dueDateTextOverdue,
                      isDone && styles.dueDateTextDone,
                    ]}
                  >
                    {isOverdue
                      ? `Overdue (${formatDate(item.dueDate || item.due)})`
                      : isDone
                      ? `Done (${formatDate(item.dueDate || item.due)})`
                      : `Due ${formatDate(item.dueDate || item.due)}`}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scopeSwitcherRow: {
    flexDirection: 'row',
    backgroundColor: '#edf1f3',
    borderRadius: radius.md,
    padding: 3,
    marginBottom: spacing.xs + 4,
    gap: 4,
  },
  scopeBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeBtnActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.xs,
  },
  scopeBtnText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  scopeBtnTextActive: {
    color: colors.textPrimary,
    fontWeight: '700',
  },

  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#e1e8eb',
    ...shadows.sm,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs + 2,
  },
  heroTitleCol: {
    flex: 1,
  },
  heroEyebrow: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: '#1f6f78',
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  progressPercentPill: {
    backgroundColor: '#eef7f7',
    borderWidth: 1,
    borderColor: '#b7dadb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  progressPercentVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0e4a52',
  },
  progressPercentLabel: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#1f6f78',
    letterSpacing: 0.4,
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#edf1f3',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm + 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1f6f78',
    borderRadius: radius.full,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 6,
  },
  kpiPill: {
    flex: 1,
    backgroundColor: '#f4f7f8',
    borderRadius: radius.md,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e1e8eb',
  },
  kpiPillActive: {
    backgroundColor: '#1f6f78',
    borderColor: '#1f6f78',
  },
  kpiPillOverdueBorder: {
    borderColor: '#f2c4c2',
    backgroundColor: '#fbe5e4',
  },
  kpiPillOverdueActive: {
    backgroundColor: '#d24c47',
    borderColor: '#d24c47',
  },
  kpiOverdueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  kpiCount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
  },
  kpiCountActive: {
    color: '#FFFFFF',
  },
  kpiLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 1,
  },
  kpiLabelActive: {
    color: '#FFFFFF',
  },

  controlsSection: {
    paddingHorizontal: 16,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    gap: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.2,
    borderColor: '#e1e8eb',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  priorityScroll: {
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
  },
  priorityFilterLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textTertiary,
    marginRight: 2,
  },
  priorityChip: {
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#e1e8eb',
  },
  priorityChipActive: {
    backgroundColor: '#0f2a3d',
    borderColor: '#0f2a3d',
  },
  priorityChipUrgent: {
    backgroundColor: '#fbe5e4',
    borderColor: '#f2c4c2',
  },
  priorityChipHigh: {
    backgroundColor: '#fcf0dc',
    borderColor: '#ecd6ae',
  },
  priorityChipText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  priorityChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  taskList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 10,
    paddingTop: 4,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#e1e8eb',
    ...shadows.xs,
  },
  taskCardDone: {
    backgroundColor: '#f4f7f8',
    borderColor: '#e1e8eb',
    opacity: 0.92,
  },
  taskCardOverdue: {
    backgroundColor: '#FFFBFB',
    borderColor: '#f2c4c2',
  },

  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
    marginRight: 8,
  },
  projectCodeBadge: {
    backgroundColor: '#eef7f7',
    borderWidth: 1,
    borderColor: '#ddefef',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.sm,
  },
  projectCodeBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#0e4a52',
    fontFamily: 'monospace',
  },
  projectBlockWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  projectBlockText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fbe5e4',
    borderWidth: 1,
    borderColor: '#f2c4c2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  overdueBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#d24c47',
    letterSpacing: 0.2,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#e3f4ec',
    borderWidth: 1,
    borderColor: '#bfe3d0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  completedBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2e9e6b',
    letterSpacing: 0.2,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fbe5e4',
    borderWidth: 1,
    borderColor: '#f2c4c2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  urgentBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#d24c47',
    letterSpacing: 0.2,
  },
  highBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fcf0dc',
    borderWidth: 1,
    borderColor: '#ecd6ae',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  highBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#c27a12',
    letterSpacing: 0.2,
  },
  mediumBadge: {
    backgroundColor: '#e6effa',
    borderWidth: 1,
    borderColor: '#c9dcf1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  mediumBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#2f6fb3',
    textTransform: 'uppercase',
  },

  cardBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxArea: {
    paddingRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxPending: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: '#d3dce1',
    backgroundColor: '#FFFFFF',
  },
  checkboxOverdue: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: '#d24c47',
    backgroundColor: '#fbe5e4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxOverdueInner: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: '#d24c47',
  },
  checkboxDone: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: '#2e9e6b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  taskTitleText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0f2a3d',
    lineHeight: 19,
  },
  taskTitleTextDone: {
    color: '#627079',
    textDecorationLine: 'line-through',
    textDecorationColor: '#7c8b96',
  },

  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#edf1f3',
  },
  assigneeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
    marginRight: 6,
  },
  avatarCircle: {
    width: 20,
    height: 20,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 9,
    fontWeight: '700',
  },
  assigneeName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    flex: 1,
  },
  dueDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dueDateTextOverdue: {
    color: '#d24c47',
    fontWeight: '700',
  },
  dueDateTextDone: {
    color: '#2e9e6b',
    fontWeight: '600',
  },
});
