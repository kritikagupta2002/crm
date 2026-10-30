import React, { useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import {
  ListChecks,
  CalendarDays,
  Receipt,
  FileText,
  Clock,
  LogIn,
  LogOut,
  Circle,
  CheckCircle2,
  MapPin,
  Mountain,
} from 'lucide-react-native';
import { HomeHeader, Button } from '../../components/common';
import { StatGrid, ActionList, SectionTitle, Panel, homeStyles, inr } from '../../components/home/HomeBlocks';
import { colors, fonts, radius } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';
import { useHrms } from '../../context/HrmsContext';

interface EmployeeHomeScreenProps {
  navigation: any;
}

const LEAVE_TYPES = ['Casual Leave (CL)', 'Sick Leave (SL)', 'Earned / Privilege Leave (EL)'];
/* 'Casual Leave (CL)' -> 'CL' */
const shortType = (t: string) => t.match(/\(([^)]+)\)/)?.[1] || t.replace(' Leave', '');
const shortDate = (d?: string) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '');
const addDays = (iso: string, n: number) => {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

/* Employee: today's attendance, my tasks, my leave and my claims. */
export const EmployeeHomeScreen: React.FC<EmployeeHomeScreenProps> = ({ navigation }) => {
  const { session } = useAuth();
  const { projects, updateProjectTask } = useCrm();
  const { todayAttendance, punchIn, punchOut, leaves, leaveBalances, expenses, applyLeave } = useHrms();

  const me = session as any;
  const name: string = me?.name || '';
  const isMine = (r: any) => r.employeeId === me?.id || r.employeeId === me?.employeeId || (r.employeeName || '').toLowerCase() === name.toLowerCase();

  const today = new Date().toISOString().slice(0, 10);
  const myTasks = useMemo(
    () =>
      projects
        .flatMap((p) => (p.tasks || []).map((t) => ({ ...t, projectTitle: p.title || p.name || p.projectCode })))
        .filter((t) => (t.assigneeName || t.assignee) === name)
        .sort((a, b) => Number(a.status === 'Completed') - Number(b.status === 'Completed') || (a.dueDate || '').localeCompare(b.dueDate || '')),
    [projects, name],
  );
  const openTasks = myTasks.filter((t) => t.status !== 'Completed');
  const myBalances = (leaveBalances || []).filter(isMine);
  const leaveLeft = myBalances.reduce((s, b) => s + (b.available || 0), 0);
  const myLeaves = (leaves || []).filter(isMine);
  const myClaims = (expenses || []).filter(isMine);
  const claimsOpen = myClaims.filter((e) => e.status !== 'Settled' && e.status !== 'Rejected');

  const punchedIn = !!todayAttendance && !!(todayAttendance.punchIn || todayAttendance.checkIn) && !(todayAttendance.punchOut || todayAttendance.checkOut);
  const punchedOut = !!todayAttendance && !!(todayAttendance.punchOut || todayAttendance.checkOut);

  const togglePunch = async () => {
    try {
      if (punchedIn) await punchOut();
      else await punchIn('Field site', undefined, 'Mobile app');
    } catch (e: any) {
      Alert.alert('Attendance', e?.message || 'Could not record attendance.');
    }
  };

  const toggleTask = (t: any) =>
    updateProjectTask(t.projectId, t.id, t.status === 'Completed' ? { status: 'In Progress', doneOn: null } : { status: 'Completed', doneOn: today });

  const [leaveOpen, setLeaveOpen] = useState(false);
  const leaveTypes = myBalances.length ? myBalances.map((b) => b.leaveType) : LEAVE_TYPES;
  const [leaveType, setLeaveType] = useState(leaveTypes[0]);
  const [leaveFrom, setLeaveFrom] = useState(today);
  const [leaveDays, setLeaveDays] = useState('1');
  const [leaveReason, setLeaveReason] = useState('');

  const submitLeave = async () => {
    const days = Math.max(1, parseInt(leaveDays, 10) || 1);
    if (!leaveReason.trim()) return Alert.alert('Leave', 'Please write a reason.');
    try {
      await applyLeave(leaveType, leaveFrom, addDays(leaveFrom, days - 1), leaveReason.trim());
      setLeaveOpen(false);
      setLeaveReason('');
      setLeaveDays('1');
    } catch (e: any) {
      Alert.alert('Leave', e?.message || 'Could not apply for leave.');
    }
  };

  return (
    <View style={homeStyles.root}>
      <HomeHeader navigation={navigation} searchTo="Tasks" />
      <ScrollView contentContainerStyle={homeStyles.body} showsVerticalScrollIndicator={false}>
        <Panel style={styles.punch}>
          <View style={{ flex: 1 }}>
            <Text style={styles.punchLabel}>Today · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</Text>
            <Text style={styles.punchState}>{punchedOut ? 'Day closed' : punchedIn ? 'Checked in' : 'Not checked in'}</Text>
            {todayAttendance ? (
              <Text style={styles.punchMeta}>
                {todayAttendance.punchIn || todayAttendance.checkIn ? `In ${todayAttendance.punchIn || todayAttendance.checkIn}` : ''}
                {todayAttendance.punchOut || todayAttendance.checkOut ? `  ·  Out ${todayAttendance.punchOut || todayAttendance.checkOut}` : ''}
              </Text>
            ) : null}
            {todayAttendance?.workLocation ? (
              <View style={styles.place}>
                <MapPin size={12} color={colors.textMuted} />
                <Text style={styles.punchMeta}>{todayAttendance.workLocation}</Text>
              </View>
            ) : null}
          </View>
          {!punchedOut ? (
            <TouchableOpacity style={[styles.punchBtn, punchedIn && styles.punchOut]} onPress={togglePunch} activeOpacity={0.85}>
              {punchedIn ? <LogOut size={18} color={colors.textInverse} /> : <LogIn size={18} color={colors.textInverse} />}
              <Text style={styles.punchBtnText}>{punchedIn ? 'Check out' : 'Check in'}</Text>
            </TouchableOpacity>
          ) : null}
        </Panel>

        <View style={{ height: 12 }} />
        <StatGrid
          items={[
            { label: 'My tasks', value: openTasks.length, sub: `${myTasks.length - openTasks.length} done`, Icon: ListChecks, tone: 'blue', onPress: () => navigation.navigate('Tasks') },
            { label: 'Leave left', value: leaveLeft, sub: `${myLeaves.filter((l) => l.status === 'Pending').length} request(s) pending`, Icon: CalendarDays, tone: 'green', onPress: () => navigation.navigate('Leave') },
            { label: 'Open claims', value: claimsOpen.length, sub: inr(claimsOpen.reduce((s, e) => s + (e.requestedAmount || e.amount || 0), 0)), Icon: Receipt, tone: 'amber', onPress: () => navigation.navigate('Expenses') },
            { label: 'Attendance', value: 'Log', sub: 'This month', Icon: Clock, tone: 'teal', onPress: () => navigation.navigate('Attendance') },
          ]}
        />

        <SectionTitle title="My tasks" count={openTasks.length} action="All" onAction={() => navigation.navigate('Tasks')} />
        <ActionList
          empty="No tasks assigned to you."
          items={myTasks.slice(0, 6).map((t) => {
            const done = t.status === 'Completed';
            const due = t.dueDate || t.due || '';
            const late = !done && due && due < today;
            return {
              key: `${t.projectId}-${t.id}`,
              title: t.title,
              sub: t.projectTitle,
              Icon: done ? CheckCircle2 : Circle,
              tone: done ? 'green' : late ? 'red' : 'blue',
              tag: done ? 'Done' : due ? (late ? `Late · ${shortDate(due)}` : shortDate(due)) : undefined,
              onPress: () => toggleTask(t),
            };
          })}
        />

        <SectionTitle title="Self-service" />
        <ActionList
          items={[
            { key: 'leave', title: 'Apply for leave', sub: myBalances.map((b) => `${shortType(b.leaveType)} ${b.available}`).join(' · ') || undefined, Icon: CalendarDays, tone: 'green', onPress: () => setLeaveOpen(true) },
            { key: 'claim', title: 'New expense claim', sub: 'Travel, stay and site expenses', Icon: Receipt, tone: 'amber', onPress: () => navigation.navigate('ExpenseClaim') },
            { key: 'field', title: 'Field Database', sub: 'Mapping, sampling and logging in the client formats', Icon: Mountain, tone: 'gold', onPress: () => navigation.navigate('FieldDatabaseHome') },
            { key: 'slip', title: 'My payslips', Icon: FileText, tone: 'teal', onPress: () => navigation.navigate('Payslips') },
          ]}
        />
      </ScrollView>

      <Modal visible={leaveOpen} transparent animationType="slide" onRequestClose={() => setLeaveOpen(false)}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Apply for leave</Text>
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.chips}>
              {leaveTypes.map((t) => (
                <TouchableOpacity key={t} onPress={() => setLeaveType(t)} style={[styles.chip, leaveType === t && styles.chipOn]}>
                  <Text style={[styles.chipText, leaveType === t && styles.chipTextOn]}>{shortType(t)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.twoCol}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>From (YYYY-MM-DD)</Text>
                <TextInput style={styles.input} value={leaveFrom} onChangeText={setLeaveFrom} />
              </View>
              <View style={{ width: 90 }}>
                <Text style={styles.fieldLabel}>Days</Text>
                <TextInput style={styles.input} value={leaveDays} onChangeText={setLeaveDays} keyboardType="number-pad" />
              </View>
            </View>
            <Text style={styles.fieldLabel}>Reason</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={leaveReason} onChangeText={setLeaveReason} multiline />
            <View style={styles.sheetActions}>
              <Button title="Cancel" variant="outline" onPress={() => setLeaveOpen(false)} style={{ flex: 1 }} />
              <Button title="Send request" onPress={submitLeave} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  punch: { flexDirection: 'row', alignItems: 'center', gap: 12, borderLeftWidth: 4, borderLeftColor: colors.gold },
  punchLabel: { fontSize: 12, color: colors.textMuted },
  punchState: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary, marginTop: 2 },
  punchMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  place: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  punchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: radius.md,
  },
  punchOut: { backgroundColor: colors.textPrimary },
  punchBtnText: { color: colors.textInverse, fontWeight: '700', fontSize: 14 },

  backdrop: { flex: 1, backgroundColor: colors.backdrop, justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, paddingBottom: 28 },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 20, color: colors.textPrimary, marginBottom: 8 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginTop: 12, marginBottom: 6 },
  chips: { flexDirection: 'row', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1, borderColor: colors.borderMedium },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, color: colors.textSecondary, fontWeight: '600' },
  chipTextOn: { color: colors.textInverse },
  twoCol: { flexDirection: 'row', gap: 10 },
  input: {
    borderWidth: 1,
    borderColor: colors.borderMedium,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surfaceMuted,
  },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 18 },
});
