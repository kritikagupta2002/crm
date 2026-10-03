import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { CheckCircle2, Circle, Clock, AlertTriangle } from 'lucide-react-native';
import { ScreenContainer, AppHeader, Card, StatusBadge, SegmentedControl } from '../../components/common';
import { colors, spacing, typography, radius } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { Task } from '../../types';

interface TasksScreenProps {
  navigation: any;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({ navigation }) => {
  const { projects, updateProjectTask } = useCrm();
  const [filterIndex, setFilterIndex] = useState(0);
  const filterOptions = ['All Tasks', 'Pending', 'Completed'];

  // Aggregate all tasks across projects
  const allTasks: (Task & { projectTitle: string; projectCode: string })[] = [];
  projects.forEach((p) => {
    (p.tasks || []).forEach((t) => {
      allTasks.push({ ...t, projectTitle: p.title || p.name || 'Project Block', projectCode: p.projectCode });
    });
  });

  const filteredTasks = allTasks.filter((t) => {
    if (filterIndex === 1) return t.status !== 'Completed';
    if (filterIndex === 2) return t.status === 'Completed';
    return true;
  });

  const getPriorityColor = (p: Task['priority']) => {
    switch (p) {
      case 'Urgent':
        return colors.danger;
      case 'High':
        return colors.warning;
      case 'Medium':
        return colors.info;
      default:
        return colors.textMuted;
    }
  };

  const toggleTaskDone = async (task: Task) => {
    try {
      const nextStatus = task.status === 'Completed' ? 'Todo' : 'Completed';
      await updateProjectTask(task.projectId, task.id || task.key!, { status: nextStatus });
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <ScreenContainer
      scrollable={false}
      header={
        <AppHeader
          title="Field & Project Tasks"
          subtitle={`${allTasks.length} work assignments across active blocks`}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
    >
      <SegmentedControl
        options={filterOptions}
        selectedIndex={filterIndex}
        onSelect={setFilterIndex}
      />

      <FlatList
        data={filteredTasks}
        keyExtractor={(item) => item.id || `${item.projectId}-${item.key}`}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isDone = item.status === 'Completed';
          return (
            <Card
              style={[styles.taskCard, isDone && styles.taskCardDone]}
              onPress={() =>
                navigation.navigate('ProjectDetail', {
                  projectId: item.projectId,
                  initialTab: 'tasks',
                })
              }
            >
              <View style={styles.taskHeader}>
                <View style={styles.badgeRow}>
                  <View style={[styles.priorityPill, { borderColor: getPriorityColor(item.priority) }]}>
                    <Text style={[styles.priorityText, { color: getPriorityColor(item.priority) }]}>
                      {item.priority}
                    </Text>
                  </View>
                  <Text style={styles.projectCode}>{item.projectCode}</Text>
                </View>
                <TouchableOpacity onPress={() => toggleTaskDone(item)}>
                  <StatusBadge status={item.status} size="sm" />
                </TouchableOpacity>
              </View>

              <Text style={[styles.taskTitle, isDone && styles.taskTitleDone]}>
                {item.title}
              </Text>
              <Text style={styles.projectTitle} numberOfLines={1}>
                {item.projectTitle}
              </Text>

              <View style={styles.taskFooter}>
                <Text style={styles.assignee}>Assigned: {item.assigneeName || item.assignee}</Text>
                <View style={styles.dueDateRow}>
                  <Clock size={12} color={item.overdue && !isDone ? colors.danger : colors.textMuted} />
                  <Text
                    style={[
                      styles.dueDate,
                      item.overdue && !isDone && { color: colors.danger, fontWeight: typography.fontWeights.bold },
                    ]}
                  >
                    Due {item.dueDate || item.due}
                    {item.overdue && !isDone ? ' (OVERDUE)' : ''}
                  </Text>
                </View>
              </View>
            </Card>
          );
        }}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing.huge,
  },
  taskCard: {
    marginBottom: spacing.sm,
  },
  taskCardDone: {
    opacity: 0.7,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  priorityPill: {
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 1,
    borderRadius: radius.xs,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    textTransform: 'uppercase',
  },
  projectCode: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.primary,
  },
  taskTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  taskTitleDone: {
    color: colors.textMuted,
    textDecorationLine: 'line-through',
  },
  projectTitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  taskFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  assignee: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  dueDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dueDate: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
});
