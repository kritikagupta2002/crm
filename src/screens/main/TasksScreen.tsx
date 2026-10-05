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

  const { completedCount, pendingCount, overdueCount } = stats;

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

  const filterOptions = useMemo(() => [
    `All (${allTasks.length})`,
    `Pending (${pendingCount})`,
    `Completed (${completedCount})`,
  ], [allTasks.length, pendingCount, completedCount]);

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
          subtitle={`${pendingCount} pending • ${overdueCount > 0 ? `${overdueCount} overdue` : 'On track'}`}
          badge="Task Tracker"
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
    >
      {/* Segmented Filter Control */}
      <View style={styles.filterContainer}>
        <SegmentedControl
          options={filterOptions}
          selectedIndex={filterIndex}
          onSelect={setFilterIndex}
          style={styles.segmentedControl}
        />
      </View>

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id || `${item.projectId}-${item.key}`}
        showsVerticalScrollIndicator={false}
        style={styles.taskList}
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
          const isOverdue = item.overdue && !isDone;
          const pStyle = getPriorityStyle(item.priority);

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() =>
                navigation.navigate('ProjectDetail', {
                  projectId: item.projectId,
                  initialTab: 'tasks',
                })
              }
              style={[styles.taskItem, isDone && styles.taskItemDone]}
            >
              <View style={styles.taskMainRow}>
                {/* Touch-friendly Checkbox */}
                <TouchableOpacity
                  activeOpacity={0.65}
                  onPress={() => toggleTaskDone(item)}
                  style={styles.checkboxTouchTarget}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  {isDone ? (
                    <CheckCircle2 size={20} color={colors.success} strokeWidth={2.4} />
                  ) : (
                    <Circle size={20} color={colors.borderDark} strokeWidth={1.8} />
                  )}
                </TouchableOpacity>

                {/* Content */}
                <View style={styles.taskContentCol}>
                  <View style={styles.taskTopBadges}>
                    <Text style={styles.projectCodeText}>{item.projectCode}</Text>
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
                  </View>

                  <Text
                    style={[styles.taskTitle, isDone && styles.taskTitleDone]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>

                  <Text style={styles.projectTitle} numberOfLines={1}>
                    {item.projectTitle}
                  </Text>

                  <View style={styles.taskMetaRow}>
                    <View style={styles.metaItem}>
                      <UserCheck size={11} color={colors.textMuted} style={{ marginRight: 3 }} />
                      <Text style={styles.metaText} numberOfLines={1}>
                        {item.assigneeName || item.assignee || 'Field Team'}
                      </Text>
                    </View>

                    <View style={styles.metaItem}>
                      <Clock
                        size={11}
                        color={isOverdue ? colors.danger : colors.textMuted}
                        style={{ marginRight: 3 }}
                      />
                      <Text
                        style={[
                          styles.metaText,
                          isOverdue && styles.overdueText,
                        ]}
                      >
                        {isOverdue ? 'Overdue' : 'Due'} {item.dueDate || item.due}
                      </Text>
                    </View>
                  </View>
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
  filterContainer: {
    paddingTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  segmentedControl: {
    marginBottom: spacing.xs,
  },
  taskList: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacing.huge + 32,
    gap: spacing.sm,
  },
  taskItem: {
    backgroundColor: '#ffffff',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    ...shadows.xs,
  },
  taskItemDone: {
    opacity: 0.6,
    backgroundColor: colors.surfaceSubtle,
    borderColor: colors.borderLight,
  },
  taskMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkboxTouchTarget: {
    paddingRight: spacing.sm + 2,
    paddingTop: 2,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
  },
  taskContentCol: {
    flex: 1,
  },
  taskTopBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  projectCodeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.primaryDark,
    backgroundColor: colors.primaryBg,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  priorityPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 8.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 18,
    marginBottom: 2,
  },
  taskTitleDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  projectTitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.xs + 3,
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  metaText: {
    fontSize: 10.5,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  overdueText: {
    color: colors.danger,
    fontWeight: '700',
  },
});
