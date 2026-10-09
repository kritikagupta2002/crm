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
    { bg: '#E0F2FE', text: '#0369A1' }, // Sky
    { bg: '#EDE9FE', text: '#6D28D9' }, // Purple
    { bg: '#DCFCE7', text: '#15803D' }, // Emerald
    { bg: '#FEF3C7', text: '#B45309' }, // Amber
    { bg: '#FCE7F3', text: '#BE185D' }, // Rose/Pink
    { bg: '#CCFBF1', text: '#0F766E' }, // Teal
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

  // Extract flat list of all project tasks with parent project context
  const allTasks = useMemo(() => {
    const list: (Task & { projectTitle: string; projectCode: string })[] = [];
    projects.forEach((p) => {
      (p.tasks || []).forEach((t) => {
        list.push({
          ...t,
          projectTitle: p.title || p.name || 'Project Block',
          projectCode: p.projectCode || `PRJ-${p.id.slice(-4).toUpperCase()}`,
        });
      });
    });

    if (canonicalRole === 'employee' && session) {
      const myName = ((session as any).name || '').toLowerCase();
      const myFirstName = myName.split(' ')[0] || '';
      return list.filter((t) => {
        const assigned = (t.assigneeName || t.assignee || '').toLowerCase();
        return (
          assigned.includes(myName) ||
          (myFirstName && assigned.includes(myFirstName)) ||
          !assigned
        );
      });
    }
    return list;
  }, [projects, canonicalRole, session]);

  // Aggregate completion and overdue metrics
  const stats = useMemo(() => {
    const total = allTasks.length;
    const completedCount = allTasks.filter((t) => t.status === 'Completed').length;
    const pendingCount = total - completedCount;
    const overdueCount = allTasks.filter((t) => t.overdue && t.status !== 'Completed').length;
    const completionPercentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    return { total, completedCount, pendingCount, overdueCount, completionPercentage };
  }, [allTasks]);

  const { completedCount, pendingCount, overdueCount, completionPercentage } = stats;

  // Filter tasks based on status tab, priority chip, and search query
  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      const isDone = t.status === 'Completed';
      const isOverdue = t.overdue && !isDone;

      // Status Tab filter
      if (filterTab === 'pending' && isDone) return false;
      if (filterTab === 'completed' && !isDone) return false;
      if (filterTab === 'overdue' && !isOverdue) return false;

      // Priority filter
      if (selectedPriority !== 'All' && t.priority !== selectedPriority) return false;

      // Text search query
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
      header={
        <AppHeader
          title="Field & Project Tasks"
          subtitle={`${pendingCount} pending • ${overdueCount > 0 ? `${overdueCount} overdue` : 'All on track'}`}
          badge="Task Tracker"
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
    >
      {/* 1. Hero Progress & Interactive KPI Header */}
      <View style={styles.heroCard}>
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

        {/* Smooth Linear Progress Bar */}
        <View style={styles.progressBarTrack}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.min(Math.max(completionPercentage, 4), 100)}%` },
            ]}
          />
        </View>

        {/* 4 Interactive Filter Cards */}
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
                { color: '#0F766E' },
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
              {overdueCount > 0 && <AlertTriangle size={12} color="#DC2626" />}
              <Text
                style={[
                  styles.kpiCount,
                  { color: overdueCount > 0 ? '#DC2626' : colors.textSecondary },
                  filterTab === 'overdue' && styles.kpiCountActive,
                ]}
              >
                {overdueCount}
              </Text>
            </View>
            <Text
              style={[
                styles.kpiLabel,
                overdueCount > 0 && { color: '#B91C1C' },
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
              <Check size={12} color="#059669" strokeWidth={2.8} />
              <Text
                style={[
                  styles.kpiCount,
                  { color: '#059669' },
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

      {/* 2. Search & Priority Quick Filter Strip */}
      <View style={styles.controlsSection}>
        {/* Search Bar */}
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

        {/* Priority Filter Pills */}
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
                    p === 'Urgent' && !isActive && { color: '#E11D48' },
                    p === 'High' && !isActive && { color: '#D97706' },
                  ]}
                >
                  {p === 'All' ? 'All Priority' : p}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. Task Cards List */}
      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id || `${item.projectId}-${item.key}`}
        showsVerticalScrollIndicator={false}
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

          // Determine card left accent color
          const leftStripeColor = isOverdue
            ? '#EF4444' // Vibrant Red
            : item.priority === 'Urgent'
            ? '#F43F5E' // Rose
            : item.priority === 'High'
            ? '#F59E0B' // Amber
            : isDone
            ? '#10B981' // Emerald
            : '#0D9488'; // Teal

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
                { borderLeftColor: leftStripeColor },
                isDone && styles.taskCardDone,
                isOverdue && styles.taskCardOverdue,
              ]}
            >
              {/* Header: Project Tag & Status/Priority Badge */}
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

                {/* Status / Priority Pill */}
                {isOverdue ? (
                  <View style={styles.overdueBadge}>
                    <AlertTriangle size={11} color="#DC2626" />
                    <Text style={styles.overdueBadgeText}>OVERDUE</Text>
                  </View>
                ) : isDone ? (
                  <View style={styles.completedBadge}>
                    <Check size={11} color="#059669" strokeWidth={2.8} />
                    <Text style={styles.completedBadgeText}>COMPLETED</Text>
                  </View>
                ) : item.priority === 'Urgent' ? (
                  <View style={styles.urgentBadge}>
                    <Flame size={11} color="#E11D48" />
                    <Text style={styles.urgentBadgeText}>URGENT</Text>
                  </View>
                ) : item.priority === 'High' ? (
                  <View style={styles.highBadge}>
                    <Zap size={11} color="#D97706" />
                    <Text style={styles.highBadgeText}>HIGH</Text>
                  </View>
                ) : (
                  <View style={styles.mediumBadge}>
                    <Text style={styles.mediumBadgeText}>{item.priority}</Text>
                  </View>
                )}
              </View>

              {/* Middle Body: Checkbox, Title & Action Chevron */}
              <View style={styles.cardBodyRow}>
                {/* Touch Checkbox */}
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

                {/* Title & Navigation Cue */}
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

              {/* Footer: Assignee Avatar Chip & Due Date */}
              <View style={styles.cardFooterRow}>
                {/* Assignee Avatar Chip */}
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

                {/* Due Date Indicator */}
                <View style={styles.dueDateWrap}>
                  <Clock
                    size={12}
                    color={isOverdue ? '#DC2626' : isDone ? '#059669' : colors.textTertiary}
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
  // 1. Hero Progress Header
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    fontWeight: '800',
    letterSpacing: 0.6,
    color: '#0D9488',
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 12.5,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  progressPercentPill: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  progressPercentVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
  },
  progressPercentLabel: {
    fontSize: 7.5,
    fontWeight: '700',
    color: '#0D9488',
    letterSpacing: 0.4,
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm + 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0D9488',
    borderRadius: radius.full,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 6,
  },
  kpiPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    paddingVertical: 7,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiPillActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  kpiPillOverdueBorder: {
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  kpiPillOverdueActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  kpiOverdueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  kpiCount: {
    fontSize: 14,
    fontWeight: '800',
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

  // 2. Search & Priority Controls
  controlsSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    gap: 6,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm + 2,
    height: 38,
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
    gap: 5,
    paddingRight: spacing.lg,
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
    borderColor: '#E2E8F0',
  },
  priorityChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  priorityChipUrgent: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  priorityChipHigh: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
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

  // 3. Task Card Styling
  taskList: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    gap: 9,
    paddingTop: 2,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4.5,
    ...shadows.xs,
  },
  taskCardDone: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.92,
  },
  taskCardOverdue: {
    backgroundColor: '#FFFBFB',
    borderColor: '#FCA5A5',
  },

  // Card Header Row
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
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: radius.sm,
  },
  projectCodeBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0F766E',
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

  // Badges
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  overdueBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.2,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  completedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.2,
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FECDD3',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  urgentBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#E11D48',
    letterSpacing: 0.2,
  },
  highBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  highBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.2,
  },
  mediumBadge: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  mediumBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#0284C7',
    textTransform: 'uppercase',
  },

  // Card Body Row
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
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  checkboxOverdue: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 2,
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxOverdueInner: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: '#EF4444',
  },
  checkboxDone: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  taskTitleText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
    lineHeight: 19,
  },
  taskTitleTextDone: {
    color: '#64748B',
    textDecorationLine: 'line-through',
    textDecorationColor: '#94A3B8',
  },

  // Card Footer Row
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
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
    fontWeight: '800',
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
    color: '#DC2626',
    fontWeight: '700',
  },
  dueDateTextDone: {
    color: '#059669',
    fontWeight: '600',
  },
});
