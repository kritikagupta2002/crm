import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { FolderKanban, ListChecks, Users, CalendarDays, Check, X, Drill, ClipboardList, ClipboardCheck, MessageCircleQuestion, Boxes } from 'lucide-react-native';
import { HomeHeader } from '../../components/common';
import { StatGrid, ActionList, SectionTitle, homeStyles } from '../../components/home/HomeBlocks';
import { colors, radius } from '../../theme';
import { useCrm } from '../../context/CrmContext';
import { useHrms } from '../../context/HrmsContext';
import { misService } from '../../services';
import { questionsFor } from '../../utils/questions';

interface ManagerHomeScreenProps {
  navigation: any;
}

const shortDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');

/* Manager: projects, the team's tasks and the team's leave. */
export const ManagerHomeScreen: React.FC<ManagerHomeScreenProps> = ({ navigation }) => {
  const { projects, leads } = useCrm();
  const openQuestions = questionsFor('manager', leads).filter((q) => q.status === 'Open').length;
  const { employees, leaves, approveLeave, rejectLeave } = useHrms();
  const [presentToday, setPresentToday] = useState<number | null>(null);

  useEffect(() => {
    let live = true;
    misService
      .getZeroFakeAttendanceMetrics()
      .then((m: any) => live && setPresentToday(m?.presentToday ?? null))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  const running = projects.filter((p) => p.status !== 'Completed');
  const today = new Date().toISOString().slice(0, 10);
  const openTasks = useMemo(
    () =>
      running
        .flatMap((p) => (p.tasks || []).map((t) => ({ ...t, projectTitle: p.title || p.name || p.projectCode })))
        .filter((t) => t.status !== 'Completed')
        .sort((a, b) => (a.dueDate || a.due || '').localeCompare(b.dueDate || b.due || '')),
    [running],
  );
  const overdue = openTasks.filter((t) => (t.dueDate || t.due || '9999') < today).length;
  const pendingLeaves = (leaves || []).filter((l) => l.status === 'Pending');

  const decide = (id: string, who: string, approve: boolean) =>
    Alert.alert(approve ? 'Approve leave' : 'Reject leave', `${approve ? 'Approve' : 'Reject'} the leave for ${who}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: approve ? 'Approve' : 'Reject',
        style: approve ? 'default' : 'destructive',
        onPress: () => (approve ? approveLeave(id, 'Approved by manager') : rejectLeave(id, 'Rejected by manager')),
      },
    ]);

  return (
    <View style={homeStyles.root}>
      <HomeHeader navigation={navigation} searchTo="Tasks" />
      <ScrollView contentContainerStyle={homeStyles.body} showsVerticalScrollIndicator={false}>
        <StatGrid
          items={[
            { label: 'Active projects', value: running.length, sub: `${projects.length} in all`, Icon: FolderKanban, tone: 'teal', onPress: () => navigation.navigate('Projects') },
            { label: 'Open tasks', value: openTasks.length, sub: overdue ? `${overdue} overdue` : 'None overdue', Icon: ListChecks, tone: overdue ? 'red' : 'blue', onPress: () => navigation.navigate('Tasks') },
            { label: 'Team', value: employees.length, sub: presentToday != null ? `${presentToday} present today` : undefined, Icon: Users, tone: 'green', onPress: () => navigation.navigate('Attendance') },
            { label: 'Leave requests', value: pendingLeaves.length, sub: 'To approve', Icon: CalendarDays, tone: pendingLeaves.length ? 'amber' : 'green', onPress: () => navigation.navigate('LeaveApprovals') },
          ]}
        />

        <SectionTitle title="Leave to approve" count={pendingLeaves.length} action="All" onAction={() => navigation.navigate('LeaveApprovals')} />
        <ActionList
          empty="No leave waiting."
          items={pendingLeaves.slice(0, 4).map((l) => ({
            key: l.id,
            title: l.employeeName,
            sub: `${l.leaveType} · ${l.days || l.daysCount || 1} day(s) · ${shortDate(l.startDate)} – ${shortDate(l.endDate)}`,
            Icon: CalendarDays,
            tone: 'amber',
            right: (
              <View style={styles.decide}>
                <TouchableOpacity style={[styles.btn, styles.reject]} onPress={() => decide(l.id, l.employeeName, false)} hitSlop={6}>
                  <X size={16} color={colors.danger} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btn, styles.approve]} onPress={() => decide(l.id, l.employeeName, true)} hitSlop={6}>
                  <Check size={16} color={colors.textInverse} />
                </TouchableOpacity>
              </View>
            ),
          }))}
        />

        <SectionTitle title="Tasks due" count={openTasks.length} action="All" onAction={() => navigation.navigate('Tasks')} />
        <ActionList
          empty="No open tasks."
          items={openTasks.slice(0, 5).map((t) => {
            const due = t.dueDate || t.due || '';
            const late = due && due < today;
            return {
              key: `${t.projectId}-${t.id}`,
              title: t.title,
              sub: `${t.projectTitle} · ${t.assigneeName || t.assignee || 'Unassigned'}`,
              Icon: ClipboardList,
              tone: late ? 'red' : t.status === 'In Progress' ? 'amber' : 'blue',
              tag: due ? (late ? `Late · ${shortDate(due)}` : shortDate(due)) : t.status,
              onPress: () => navigation.navigate('ProjectDetail', { projectId: t.projectId }),
            };
          })}
        />

        <SectionTitle title="Field work" />
        <ActionList
          items={[
            { key: 'cq', title: 'Client questions', sub: 'About your projects and their documents', Icon: MessageCircleQuestion, tone: openQuestions ? 'amber' : 'green', tag: openQuestions ? `${openQuestions} waiting` : 'Clear', onPress: () => navigation.navigate('ClientQuestions') },
            { key: 'dpr', title: 'Drilling DPR', sub: 'Daily progress from the rigs', Icon: Drill, tone: 'teal', onPress: () => navigation.navigate('FieldSection', { sectionKey: 'core-drilling-dpr' }) },
            { key: 'inv', title: 'Inventory / Stock', sub: 'Equipment with the team and in stock', Icon: Boxes, tone: 'slate', onPress: () => navigation.navigate('Inventory') },
            { key: 'fd', title: 'Field Database', sub: 'Mapping, sampling, logging and dispatch', Icon: ClipboardList, tone: 'gold', onPress: () => navigation.navigate('FieldDatabaseHome') },
            { key: 'qa', title: 'QAQC', sub: 'Lab results against blanks, duplicates and CRMs', Icon: ClipboardCheck, tone: 'blue', onPress: () => navigation.navigate('Qaqc') },
          ]}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  decide: { flexDirection: 'row', gap: 6 },
  btn: { width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  reject: { backgroundColor: colors.dangerBg },
  approve: { backgroundColor: colors.success },
});
