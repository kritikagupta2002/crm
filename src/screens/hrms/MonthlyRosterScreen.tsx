import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Modal,
  Alert,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, Button, Input, EmptyState, StatusBadge } from '../../components';
import { RosterEntry, Shift, Employee } from '../../types';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Search,
  Plus,
  Filter,
  Check,
  AlertCircle,
  MapPin,
  CalendarCheck,
  CalendarOff,
  Briefcase,
  Layers,
  RotateCcw,
} from 'lucide-react-native';

export const MonthlyRosterScreen: React.FC<{ navigation: any; route?: any }> = ({
  navigation,
  route,
}) => {
  const {
    roster,
    shifts,
    shiftAssignments,
    employees,
    leaves,
    saveRosterEntry,
    refreshHrms,
  } = useHrms();

  const { hasRole, session } = useAuth();
  const isHRAdmin = hasRole(['Admin', 'HR']);

  const currentEmpId =
    session?.accountType === 'team'
      ? (session as any).employeeId || 'BGS-2021-001'
      : 'BGS-2021-001';

  // Month & Year state
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(10); // 10 = October
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-03');
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters & Search
  const [search, setSearch] = useState<string>('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('All');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'calendar' | 'employees'>('calendar');

  // Modal State for Roster Entry (Add / Edit)
  const [showRosterModal, setShowRosterModal] = useState<boolean>(false);
  const [modalEmpId, setModalEmpId] = useState<string>('');
  const [modalShiftId, setModalShiftId] = useState<string>('');
  const [modalDate, setModalDate] = useState<string>(selectedDate);
  const [modalStatus, setModalStatus] = useState<RosterEntry['status']>('Scheduled');
  const [modalNotes, setModalNotes] = useState<string>('');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Month string format: 'YYYY-MM'
  const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth, 0).getDate();
  }, [currentYear, currentMonth]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHrms();
    setRefreshing(false);
  };

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Roster entries for the selected month
  const monthRoster = useMemo(() => {
    return roster.filter((r) => r.date.startsWith(monthKey));
  }, [roster, monthKey]);

  // Roster entries for the selected date
  const selectedDateRoster = useMemo(() => {
    return monthRoster.filter((r) => {
      if (r.date !== selectedDate) return false;
      if (!isHRAdmin && r.employeeId !== currentEmpId) return false;
      if (selectedDeptFilter !== 'All' && r.department !== selectedDeptFilter) return false;
      if (selectedShiftFilter !== 'All' && r.shiftName !== selectedShiftFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const matchesName = r.employeeName.toLowerCase().includes(q);
        const matchesId = r.employeeId.toLowerCase().includes(q);
        const matchesDept = (r.department || '').toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesDept) return false;
      }
      return true;
    });
  }, [
    monthRoster,
    selectedDate,
    isHRAdmin,
    currentEmpId,
    selectedDeptFilter,
    selectedShiftFilter,
    search,
  ]);

  // Check if an employee is on approved leave for a given date
  const isEmployeeOnLeave = (empId: string, dateStr: string): boolean => {
    return leaves.some((l) => {
      if (l.employeeId !== empId && !l.employeeId.includes(empId.replace('BGS-', ''))) {
        return false;
      }
      return (
        l.status === 'Approved' &&
        dateStr >= l.startDate &&
        dateStr <= l.endDate
      );
    });
  };

  // Available departments
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    monthRoster.forEach((r) => {
      if (r.department) set.add(r.department);
    });
    return ['All', ...Array.from(set)];
  }, [monthRoster]);

  // Open modal to assign/override shift on selected date
  const handleOpenRosterModal = (entry?: RosterEntry) => {
    if (entry) {
      setModalEmpId(entry.employeeId);
      setModalShiftId(entry.shiftId);
      setModalDate(entry.date);
      setModalStatus(entry.status);
      setModalNotes(entry.notes || '');
    } else {
      setModalEmpId(employees[0]?.employeeId || '');
      setModalShiftId(shifts[0]?.id || '');
      setModalDate(selectedDate);
      setModalStatus('Scheduled');
      setModalNotes('');
    }
    setShowRosterModal(true);
  };

  // Save Roster Entry
  const handleSaveRoster = async () => {
    if (!modalEmpId || !modalShiftId || !modalDate) {
      Alert.alert('Validation Error', 'Employee, Shift, and Date are required.');
      return;
    }

    const emp = employees.find((e) => e.employeeId === modalEmpId);
    const sh = shifts.find((s) => s.id === modalShiftId);

    if (!emp || !sh) {
      Alert.alert('Error', 'Invalid employee or shift selection.');
      return;
    }

    // Leave boundary safety check
    let resolvedStatus = modalStatus;
    if (isEmployeeOnLeave(emp.employeeId, modalDate)) {
      resolvedStatus = 'On Leave';
    }

    try {
      await saveRosterEntry({
        employeeId: emp.employeeId,
        employeeName: emp.name,
        department: emp.employment?.department || 'Operations',
        shiftId: sh.id,
        shiftName: sh.name,
        date: modalDate,
        status: resolvedStatus,
        notes: modalNotes.trim() || `${sh.name} roster assignment`,
      });

      setShowRosterModal(false);
      Alert.alert('Roster Updated', `Shift saved for ${emp.name} on ${modalDate}.`);
    } catch (e: any) {
      Alert.alert('Save Failed', e.message || 'Could not update roster schedule.');
    }
  };

  // Grouped employee view: summarized month schedule for each staff member
  const employeeSummaries = useMemo(() => {
    const list = isHRAdmin
      ? employees
      : employees.filter((e) => e.employeeId === currentEmpId);

    return list.map((emp) => {
      const staffEntries = monthRoster.filter((r) => r.employeeId === emp.employeeId);
      const workingDays = staffEntries.filter(
        (r) => r.status === 'Completed' || r.status === 'Active Today' || r.status === 'Scheduled'
      ).length;
      const weeklyOffs = staffEntries.filter((r) => r.status === 'Weekly Off').length;
      const leaveDays = staffEntries.filter((r) => r.status === 'On Leave').length;

      const assignment = shiftAssignments.find((a) => a.employeeId === emp.employeeId);
      const assignedShiftName = assignment?.shiftName || 'General Corporate Shift (HQ)';

      return {
        emp,
        workingDays,
        weeklyOffs,
        leaveDays,
        assignedShiftName,
        totalDays: staffEntries.length,
      };
    });
  }, [employees, monthRoster, shiftAssignments, isHRAdmin, currentEmpId]);

  return (
    <View style={styles.container}>
      <AppHeader
        title="Monthly Employee Roster"
        subtitle="Operational shift planner & daily rotation calendar"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          isHRAdmin ? (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => handleOpenRosterModal()}
            >
              <Plus size={18} color="#FFFFFF" />
              <Text style={styles.headerBtnText}>Add Entry</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Month Navigator Header */}
      <View style={styles.monthNavigator}>
        <TouchableOpacity style={styles.navArrowBtn} onPress={handlePrevMonth}>
          <ChevronLeft size={20} color={colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.monthDisplayWrap}>
          <Calendar size={18} color={colors.primary} />
          <Text style={styles.monthDisplayText}>
            {monthNames[currentMonth - 1]} {currentYear}
          </Text>
        </View>

        <TouchableOpacity style={styles.navArrowBtn} onPress={handleNextMonth}>
          <ChevronRight size={20} color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      {/* Mode Toggle (HR / Admin only) */}
      {isHRAdmin && (
        <View style={styles.viewToggleBar}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'calendar' && styles.toggleBtnActive]}
            onPress={() => setViewMode('calendar')}
          >
            <Calendar size={15} color={viewMode === 'calendar' ? colors.primary : colors.text.tertiary} />
            <Text style={[styles.toggleBtnText, viewMode === 'calendar' && styles.toggleBtnTextActive]}>
              Daily Calendar View
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'employees' && styles.toggleBtnActive]}
            onPress={() => setViewMode('employees')}
          >
            <Users size={15} color={viewMode === 'employees' ? colors.primary : colors.text.tertiary} />
            <Text style={[styles.toggleBtnText, viewMode === 'employees' && styles.toggleBtnTextActive]}>
              Staff Summary ({employees.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Search & Department Filters */}
      <View style={styles.searchBarWrap}>
        <View style={styles.searchInputBox}>
          <Search size={16} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search employee, ID, or department..."
            placeholderTextColor={colors.text.tertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <RotateCcw size={14} color={colors.text.tertiary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {departmentsList.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.deptScroll}
        >
          {departmentsList.map((dept) => (
            <TouchableOpacity
              key={dept}
              style={[
                styles.deptChip,
                selectedDeptFilter === dept && styles.deptChipActive,
              ]}
              onPress={() => setSelectedDeptFilter(dept)}
            >
              <Text
                style={[
                  styles.deptChipText,
                  selectedDeptFilter === dept && styles.deptChipTextActive,
                ]}
              >
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {viewMode === 'calendar' ? (
        <ScrollView
          contentContainerStyle={styles.calendarContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Horizontal Day Selector */}
          <Text style={styles.sectionHeading}>
            Days of {monthNames[currentMonth - 1]} ({daysInMonth} Days)
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysScroll}
          >
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const dayStr = String(day).padStart(2, '0');
              const dateStr = `${monthKey}-${dayStr}`;
              const isSelected = selectedDate === dateStr;
              const dateObj = new Date(currentYear, currentMonth - 1, day);
              const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()];
              const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

              return (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayPill,
                    isSelected && styles.dayPillSelected,
                    isWeekend && styles.dayPillWeekend,
                  ]}
                  onPress={() => setSelectedDate(dateStr)}
                >
                  <Text style={[styles.dayPillWeek, isSelected && styles.textWhite]}>
                    {dayOfWeek}
                  </Text>
                  <Text style={[styles.dayPillNum, isSelected && styles.textWhite]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Date Schedule Breakdown Header */}
          <View style={styles.breakdownHeader}>
            <View>
              <Text style={styles.breakdownDateTitle}>
                Schedule for {selectedDate}
              </Text>
              <Text style={styles.breakdownSubtitle}>
                {selectedDateRoster.length} staff assignments scheduled
              </Text>
            </View>

            {isHRAdmin && (
              <TouchableOpacity
                style={styles.overrideBtn}
                onPress={() => handleOpenRosterModal()}
              >
                <Plus size={14} color={colors.primary} />
                <Text style={styles.overrideBtnText}>Override</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Roster Cards for Selected Date */}
          {selectedDateRoster.length === 0 ? (
            <EmptyState
              title="No Staff Scheduled"
              description={`No employee shifts scheduled on ${selectedDate}.`}
              actionLabel={isHRAdmin ? 'Assign Shift for This Date' : undefined}
              onAction={isHRAdmin ? () => handleOpenRosterModal() : undefined}
            />
          ) : (
            selectedDateRoster.map((item) => {
              const isOnLeave = item.status === 'On Leave' || isEmployeeOnLeave(item.employeeId, item.date);
              const isWeeklyOff = item.status === 'Weekly Off';

              return (
                <Card key={item.id} style={styles.entryCard}>
                  <View style={styles.entryCardHeader}>
                    <View style={styles.entryEmpCol}>
                      <Text style={styles.entryEmpId}>{item.employeeId}</Text>
                      <Text style={styles.entryEmpName}>{item.employeeName}</Text>
                      <Text style={styles.entryDept}>{item.department}</Text>
                    </View>

                    <StatusBadge
                      status={
                        isOnLeave
                          ? 'On Leave'
                          : isWeeklyOff
                          ? 'Inactive'
                          : item.status === 'Completed'
                          ? 'Completed'
                          : item.status === 'Active Today'
                          ? 'Active'
                          : 'Pending'
                      }
                      size="sm"
                    />
                  </View>

                  <View style={styles.entryBody}>
                    <View style={styles.entryShiftRow}>
                      <Clock size={14} color={colors.primary} />
                      <Text style={styles.entryShiftTitle}>{item.shiftName}</Text>
                    </View>

                    {item.notes ? (
                      <Text style={styles.entryNotes}>{item.notes}</Text>
                    ) : null}
                  </View>

                  {isHRAdmin && (
                    <TouchableOpacity
                      style={styles.entryEditAction}
                      onPress={() => handleOpenRosterModal(item)}
                    >
                      <Text style={styles.entryEditText}>Change Shift for {item.date}</Text>
                    </TouchableOpacity>
                  )}
                </Card>
              );
            })
          )}
        </ScrollView>
      ) : (
        /* Employee Summary View */
        <FlatList
          data={employeeSummaries}
          keyExtractor={(item) => item.emp.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <Card style={styles.empSummaryCard}>
              <View style={styles.empSummaryHeader}>
                <View>
                  <Text style={styles.empSummaryId}>{item.emp.employeeId}</Text>
                  <Text style={styles.empSummaryName}>{item.emp.name}</Text>
                  <Text style={styles.empSummaryDept}>
                    {item.emp.employment?.department || 'Operations'} · {item.emp.employment?.designation}
                  </Text>
                </View>
              </View>

              <View style={styles.assignedShiftBanner}>
                <Clock size={13} color={colors.primary} />
                <Text style={styles.assignedShiftText}>
                  Default: <Text style={{ fontWeight: '700' }}>{item.assignedShiftName}</Text>
                </Text>
              </View>

              {/* Month KPI Metrics */}
              <View style={styles.monthMetricGrid}>
                <View style={styles.monthMetricItem}>
                  <Text style={[styles.monthMetricVal, { color: colors.primary }]}>
                    {item.workingDays}
                  </Text>
                  <Text style={styles.monthMetricLabel}>Working Days</Text>
                </View>

                <View style={styles.monthMetricItem}>
                  <Text style={[styles.monthMetricVal, { color: colors.warning }]}>
                    {item.weeklyOffs}
                  </Text>
                  <Text style={styles.monthMetricLabel}>Weekly Offs</Text>
                </View>

                <View style={styles.monthMetricItem}>
                  <Text style={[styles.monthMetricVal, { color: colors.danger }]}>
                    {item.leaveDays}
                  </Text>
                  <Text style={styles.monthMetricLabel}>Approved Leaves</Text>
                </View>
              </View>
            </Card>
          )}
        />
      )}

      {/* ADD / EDIT ROSTER ENTRY MODAL */}
      <Modal
        visible={showRosterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRosterModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Roster Shift Assignment</Text>
              <TouchableOpacity onPress={() => setShowRosterModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.fieldLabel}>Staff Member *</Text>
              <ScrollView style={styles.selectionBox} nestedScrollEnabled>
                {employees.map((e) => {
                  const isSelected = modalEmpId === e.employeeId;
                  return (
                    <TouchableOpacity
                      key={e.id}
                      style={[styles.selectionRow, isSelected && styles.selectionRowActive]}
                      onPress={() => setModalEmpId(e.employeeId)}
                    >
                      <View>
                        <Text style={[styles.selectionTitle, isSelected && styles.textHighlight]}>
                          {e.name}
                        </Text>
                        <Text style={styles.selectionSub}>
                          {e.employeeId} · {e.employment?.department || 'Operations'}
                        </Text>
                      </View>
                      {isSelected ? <Check size={16} color={colors.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Target Shift *</Text>
              <ScrollView style={styles.selectionBox} nestedScrollEnabled>
                {shifts.map((s) => {
                  const isSelected = modalShiftId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.selectionRow, isSelected && styles.selectionRowActive]}
                      onPress={() => setModalShiftId(s.id)}
                    >
                      <View>
                        <Text style={[styles.selectionTitle, isSelected && styles.textHighlight]}>
                          {s.name}
                        </Text>
                        <Text style={styles.selectionSub}>
                          {s.code} ({s.startTime} – {s.endTime})
                        </Text>
                      </View>
                      {isSelected ? <Check size={16} color={colors.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={{ marginTop: spacing.md }}>
                <Input
                  label="Roster Date (YYYY-MM-DD) *"
                  placeholder="2026-10-03"
                  value={modalDate}
                  onChangeText={setModalDate}
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Roster Status</Text>
              <View style={styles.optionGrid}>
                {(['Scheduled', 'Active Today', 'Completed', 'Weekly Off', 'On Leave'] as const).map(
                  (st) => (
                    <TouchableOpacity
                      key={st}
                      style={[styles.optionChip, modalStatus === st && styles.optionChipActive]}
                      onPress={() => setModalStatus(st)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          modalStatus === st && styles.optionChipTextActive,
                        ]}
                      >
                        {st}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>

              <View style={{ marginTop: spacing.md }}>
                <Input
                  label="Operational Notes"
                  placeholder="Special observation, night haulage, field survey team lead..."
                  value={modalNotes}
                  onChangeText={setModalNotes}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Save Roster Entry" onPress={handleSaveRoster} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  headerBtnText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  monthNavigator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  monthDisplayWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  monthDisplayText: {
    ...typography.h3,
    color: colors.text.primary,
    fontSize: 16,
  },
  viewToggleBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    gap: spacing.sm,
    backgroundColor: colors.background.secondary,
  },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  toggleBtnActive: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  toggleBtnText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  toggleBtnTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  searchBarWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.sm,
    height: 38,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  deptScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  deptChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  deptChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  deptChipText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.secondary,
  },
  deptChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  calendarContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionHeading: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  daysScroll: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  dayPill: {
    width: 48,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPillSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayPillWeekend: {
    backgroundColor: colors.background.tertiary,
  },
  dayPillWeek: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  dayPillNum: {
    ...typography.bodyLarge,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: 2,
  },
  textWhite: {
    color: '#FFFFFF',
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
  },
  breakdownDateTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  breakdownSubtitle: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 1,
  },
  overrideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}15`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
  },
  overrideBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  entryCard: {
    padding: spacing.md,
  },
  entryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  entryEmpCol: {
    flex: 1,
  },
  entryEmpId: {
    ...typography.caption,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: colors.primary,
    fontSize: 11,
  },
  entryEmpName: {
    ...typography.h4,
    fontSize: 15,
    color: colors.text.primary,
    marginTop: 1,
  },
  entryDept: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },
  entryBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  entryShiftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  entryShiftTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  entryNotes: {
    ...typography.caption,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  entryEditAction: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 6,
    marginTop: 6,
    alignItems: 'flex-end',
  },
  entryEditText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  listContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  empSummaryCard: {
    padding: spacing.md,
  },
  empSummaryHeader: {
    marginBottom: spacing.xs,
  },
  empSummaryId: {
    ...typography.caption,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: colors.primary,
  },
  empSummaryName: {
    ...typography.h4,
    color: colors.text.primary,
  },
  empSummaryDept: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  assignedShiftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.background.tertiary,
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginVertical: spacing.xs,
  },
  assignedShiftText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 11,
  },
  monthMetricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
  },
  monthMetricItem: {
    flex: 1,
    alignItems: 'center',
  },
  monthMetricVal: {
    ...typography.h4,
    fontWeight: '800',
  },
  monthMetricLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.text.primary,
  },
  modalCloseText: {
    ...typography.body,
    color: colors.danger,
    fontWeight: '600',
  },
  modalScroll: {
    padding: spacing.md,
  },
  modalFooter: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  selectionBox: {
    maxHeight: 120,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  selectionRowActive: {
    backgroundColor: `${colors.primary}15`,
  },
  selectionTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  selectionSub: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
    marginTop: 1,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  optionChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  optionChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionChipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  optionChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textHighlight: {
    color: colors.primary,
    fontWeight: '800',
  },
});
