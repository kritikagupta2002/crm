import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { CheckCircle2, Circle, Clock, CheckSquare, AlertTriangle, Layers, Calendar, UserCheck } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, SegmentedControl, EmptyState } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { Task } from '../../types';

interface TasksScreenProps {
  navigation: any;
}

const keyExtractor = (item: Task & { projectTitle: string; projectCode: string }) =>
  item.id || `${item.projectId}-${item.key}`;

export const TasksScreen: React.FC<TasksScreenProps> = ({ navigation }) => {
  const { projects, updateProjectTask } = useCrm();
  const [filterIndex, setFilterIndex] = useState(0);
  const filterOptions = ['All Tasks', 'Pending', 'Completed'];

  const allTasks = useMemo(() => {
    const list: (Task & { projectTitle: string; projectCode: string })[] = [];
    projects.forEach((p) => {
      (p.tasks || []).forEach((t) => {
        list.push({ ...t, projectTitle: p.title || p.name || 'Project Block', projectCode: p.projectCode });
      });
    });
    return list;
  }, [projects]);

  const stats = useMemo(() => {
    const completedCount = allTasks.filter((t) => t.status === 'Completed').length;
    const pendingCount = allTasks.length - completedCount;
    const overdueCount = allTasks.filter((t) => t.overdue && t.status !== 'Completed').length;
    const completionPercentage = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;
    return { completedCount, pendingCount, overdueCount, completionPercentage };
  }, [allTasks]);

  const { completedCount, pendingCount, overdueCount, completionPercentage } = stats;

  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      if (filterIndex === 1) return t.status !== 'Completed';
      if (filterIndex === 2) return t.status === 'Completed';
      return true;
    });
  }, [allTasks, filterIndex]);

  const getPriorityStyle = (p: Task['priority']) => {
    switch (p) {
      case 'Urgent':
        return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' };
      case 'High':
        return { bg: '#fffbeb', text: '#d97706', border: '#fde68a' };
      case 'Medium':
        return { bg: '#f0f9ff', text: '#0284c7', border: '#bae6fd' };
      default:
        return { bg: colors.surfaceSubtle, text: colors.textSecondary, border: colors.border.default };
    }
  };

  const toggleTaskDone = useCallback(async (task: Task) => {
    try {
      const nextStatus = task.status === 'Completed' ? 'Todo' : 'Completed';
      await updateProjectTask(task.projectId, task.id || task.key!, { status: nextStatus });
    } catch (e: any) {
      console.error(e);
    }
  }, [updateProjectTask]);

  return (
    <ScreenContainer
      scrollable={false}
      header={
        <AppHeader
          title="Field & Project Tasks"
          subtitle={`${allTasks.length} assignments across active blocks`}
          scenicBanner
          badge="Task Execution Gate"
          badgeIcon={<CheckSquare size={11} color="#ffffff" strokeWidth={2.4} />}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
    >
      <View style={styles.kpiCard}>
        <View style={styles.kpiTopRow}>
          <View style={styles.kpiStat}>
            <Text style={styles.kpiLabel}>TOTAL TASKS</Text>
            <Text style={styles.kpiValue}>{allTasks.length}</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiStat}>
            <Text style={styles.kpiLabel}>PENDING</Text>
            <Text style={[styles.kpiValue, { color: '#0284c7' }]}>{pendingCount}</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiStat}>
            <Text style={styles.kpiLabel}>COMPLETED</Text>
            <Text style={[styles.kpiValue, { color: '#059669' }]}>{completedCount}</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiStat}>
            <Text style={styles.kpiLabel}>OVERDUE</Text>
            <Text style={[styles.kpiValue, { color: '#dc2626' }]}>{overdueCount}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text style={styles.progressText}>Overall Execution Progress</Text>
            <Text style={styles.progressPctText}>{completionPercentage}%</Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${completionPercentage}%` }]} />
          </View>
        </View>
      </View>

      <SegmentedControl
        options={filterOptions}
        selectedIndex={filterIndex}
        onSelect={setFilterIndex}
      />

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id || `${item.projectId}-${item.key}`}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            title="No Tasks Found"
            description={
              filterIndex === 2
                ? 'No completed tasks yet. Finish pending tasks from the field.'
                : 'All caught up! No active tasks matching your filter.'
            }
            icon={<CheckSquare size={36} color={colors.textMuted} />}
          />
        }
        renderItem={({ item }) => {
          const isDone = item.status === 'Completed';
          const pStyle = getPriorityStyle(item.priority);
          return (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate('ProjectDetail', {
                  projectId: item.projectId,
                  initialTab: 'tasks',
                })
              }
              style={[styles.taskCard, isDone && styles.taskCardDone]}
            >
              <View style={styles.taskHeader}>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.priorityPill,
                      { backgroundColor: pStyle.bg, borderColor: pStyle.border },
                    ]}
                  >
                    <Text style={[styles.priorityText, { color: pStyle.text }]}>
                      {item.priority}
                    </Text>
                  </View>
                  <View style={styles.projectCodeBadge}>
                    <Text style={styles.projectCodeText}>{item.projectCode}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => toggleTaskDone(item)}
                  style={styles.checkTouchTarget}
                >
                  {isDone ? (
                    <CheckCircle2 size={22} color="#059669" strokeWidth={2.4} />
                  ) : (
                    <Circle size={22} color="#94a3b8" strokeWidth={1.8} />
                  )}
                </TouchableOpacity>
              </View>

              <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>
                {item.title}
              </Text>
              <Text style={styles.projectTitle} numberOfLines={1}>
                {item.projectTitle}
              </Text>

              <View style={styles.taskFooter}>
                <View style={styles.assigneeRow}>
                  <UserCheck size={12} color="#64748b" style={{ marginRight: 4 }} />
                  <Text style={styles.assignee}>
                    {item.assigneeName || item.assignee || 'Field Team'}
                  </Text>
                </View>

                <View style={styles.dueDateRow}>
                  <Clock size={12} color={item.overdue && !isDone ? '#dc2626' : '#64748b'} />
                  <Text
                    style={[
                      styles.dueDate,
                      item.overdue && !isDone && styles.dueDateOverdue,
                    ]}
                  >
                    Due {item.dueDate || item.due}
                    {item.overdue && !isDone ? ' (OVERDUE)' : ''}
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
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
  },
  kpiStat: {
    alignItems: 'center',
    flex: 1,
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  kpiDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border.default,
  },
  progressContainer: {
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  progressPctText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0d9488',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0d9488',
    borderRadius: 3,
  },
  listContent: {
    paddingBottom: spacing.huge + 24,
  },
  taskCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.sm,
  },
  taskCardDone: {
    opacity: 0.65,
    backgroundColor: colors.surfaceSubtle,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  projectCodeBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  projectCodeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0f766e',
  },
  checkTouchTarget: {
    padding: 2,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
    lineHeight: 18,
  },
  taskTitleDone: {
    color: '#64748b',
    textDecorationLine: 'line-through',
  },
  projectTitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: spacing.sm,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignee: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDate: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  dueDateOverdue: {
    color: '#dc2626',
    fontWeight: '800',
  },
});
