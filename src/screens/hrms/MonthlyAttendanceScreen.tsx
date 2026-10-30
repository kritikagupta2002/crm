import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, EmptyState } from '../../components/common';
import { Employee, AttendanceRecord } from '../../types';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  UserCheck,
  Clock,
  CalendarOff,
  Building2,
  Filter,
  CheckCircle2,
  Calendar,
} from 'lucide-react-native';
import {
  STANDARD_DEPARTMENTS,
  STANDARD_PROJECTS,
  getEmployeeProjectById,
} from '../../constants/attendance';

export const MonthlyAttendanceScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { employees, attendance } = useHrms();
  const { session, hasRole } = useAuth();

  const isHrOrAdmin = hasRole(['Admin', 'HR']);
  const isEmployee = !isHrOrAdmin;
  const activeEmpId = (session as any)?.employeeId || (isHrOrAdmin ? 'BGS-2021-001' : 'BGS-2023-044');

  const [currentMonth, setCurrentMonth] = useState('September 2026');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [expandedEmpId, setExpandedEmpId] = useState<string | null>(null);

  const months = ['August 2026', 'September 2026', 'October 2026'];
  const handleMonthStep = (dir: number) => {
    const idx = months.indexOf(currentMonth);
    const nextIdx = idx + dir;
    if (nextIdx >= 0 && nextIdx < months.length) {
      setCurrentMonth(months[nextIdx]);
    } else {
      Alert.alert('Calendar Range', 'Displaying pay period within Q3-Q4 2026.');
    }
  };

  const visibleEmployees = useMemo(() => {
    if (isEmployee) {
      const self = employees.filter((e) => e.employeeId === activeEmpId);
      return self.length > 0 ? self : employees.slice(0, 1);
    }
    return employees;
  }, [isEmployee, activeEmpId, employees]);

  const filteredEmployees = useMemo(() => {
    return visibleEmployees.filter((emp) => {
      if (isHrOrAdmin) {
        if (selectedDept !== 'all' && emp.employment.department !== selectedDept) return false;
        const proj = getEmployeeProjectById(emp.employeeId);
        if (selectedProject !== 'all' && proj !== selectedProject) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = emp.name.toLowerCase().includes(q);
        const matchId = emp.employeeId.toLowerCase().includes(q);
        if (!matchName && !matchId) return false;
      }
      return true;
    });
  }, [visibleEmployees, isHrOrAdmin, selectedDept, selectedProject, searchQuery]);

  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  const getDayStatus = (empIndex: number, day: number) => {
    if (day % 7 === 6) {
      return { code: 'WO', label: 'Weekly Off', bg: '#edf1f3', text: '#627079' };
    }
    if (empIndex === 1 && (day === 18 || day === 19)) {
      return { code: 'LV', label: 'Approved Leave', bg: '#e8eef1', text: '#34495a' };
    }
    if (empIndex === 2 && day === 18) {
      return { code: 'A', label: 'Absent', bg: '#fbe5e4', text: '#a83a36' };
    }
    if (empIndex === 0 && day === 18) {
      return { code: 'L', label: 'Late', bg: '#fcf0dc', text: '#9a5f0c' };
    }
    if (day > 18 && currentMonth.includes('September')) {
      return { code: '-', label: 'Unrecorded', bg: '#f4f7f8', text: '#d3dce1' };
    }
    return { code: 'P', label: 'Present', bg: '#e3f4ec', text: '#237a53' };
  };

  const handleExport = () => {
    Alert.alert(
      'Export Complete',
      isEmployee
        ? 'Your monthly attendance statement has been exported to Excel (.xlsx).'
        : `Attendance for ${currentMonth} exported to Excel.`
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title={isEmployee ? 'My monthly attendance' : 'Monthly attendance'}
        subtitle={
          isEmployee
            ? `Your personal monthly presence & shifts for ${currentMonth}`
            : `Everyone's attendance for the month`
        }
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <Download size={15} color={colors.primary} />
            <Text style={styles.exportBtnText}>{isEmployee ? 'Export Log' : 'Export .xlsx'}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isEmployee && (
          <View style={styles.summaryGrid}>
            <Card style={styles.summaryCard}>
              <View style={[styles.summaryIconWrap, { backgroundColor: '#e3f4ec' }]}>
                <UserCheck size={18} color="#2e9e6b" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>PRESENT DAYS</Text>
                <Text style={styles.summaryValue}>21 / 24 Days</Text>
              </View>
            </Card>

            <Card style={styles.summaryCard}>
              <View style={[styles.summaryIconWrap, { backgroundColor: '#fcf0dc' }]}>
                <Clock size={18} color="#c27a12" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>LATE MARKS</Text>
                <Text style={styles.summaryValue}>1 (Within Grace)</Text>
              </View>
            </Card>

            <Card style={styles.summaryCard}>
              <View style={[styles.summaryIconWrap, { backgroundColor: '#f1f5f7' }]}>
                <CalendarOff size={18} color="#3d5a6c" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>LEAVES TAKEN</Text>
                <Text style={styles.summaryValue}>2 Days (Approved)</Text>
              </View>
            </Card>

            <Card style={styles.summaryCard}>
              <View style={[styles.summaryIconWrap, { backgroundColor: '#edf1f3' }]}>
                <Building2 size={18} color="#4a5b68" />
              </View>
              <View>
                <Text style={styles.summaryLabel}>WEEKLY OFFS</Text>
                <Text style={styles.summaryValue}>4 Sundays</Text>
              </View>
            </Card>
          </View>
        )}

        <Card style={styles.navigatorCard}>
          <View style={styles.monthNavRow}>
            <TouchableOpacity
              style={styles.navStepBtn}
              onPress={() => handleMonthStep(-1)}
            >
              <ChevronLeft size={20} color={colors.text.primary} />
            </TouchableOpacity>

            <View style={styles.monthTitleWrap}>
              <CalendarDays size={18} color={colors.primary} />
              <Text style={styles.monthTitleText}>{currentMonth}</Text>
            </View>

            <TouchableOpacity
              style={styles.navStepBtn}
              onPress={() => handleMonthStep(1)}
            >
              <ChevronRight size={20} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#e3f4ec' }]}>
                <Text style={[styles.legendCode, { color: '#237a53' }]}>P</Text>
              </View>
              <Text style={styles.legendLabel}>Present</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#fcf0dc' }]}>
                <Text style={[styles.legendCode, { color: '#9a5f0c' }]}>L</Text>
              </View>
              <Text style={styles.legendLabel}>Late</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#fbe5e4' }]}>
                <Text style={[styles.legendCode, { color: '#a83a36' }]}>A</Text>
              </View>
              <Text style={styles.legendLabel}>Absent</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#e8eef1' }]}>
                <Text style={[styles.legendCode, { color: '#34495a' }]}>LV</Text>
              </View>
              <Text style={styles.legendLabel}>Leave</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendBox, { backgroundColor: '#edf1f3' }]}>
                <Text style={[styles.legendCode, { color: '#627079' }]}>WO</Text>
              </View>
              <Text style={styles.legendLabel}>Off</Text>
            </View>
          </View>
        </Card>

        {isHrOrAdmin && (
          <Card style={styles.filterCard}>
            <View style={styles.searchRow}>
              <Search size={16} color={colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search staff by name or code..."
                placeholderTextColor={colors.text.tertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={styles.clearSearch}>×</Text>
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {['all', ...STANDARD_DEPARTMENTS].map((dept) => (
                <TouchableOpacity
                  key={dept}
                  style={[styles.pill, selectedDept === dept && styles.pillActive]}
                  onPress={() => setSelectedDept(dept)}
                >
                  <Text style={[styles.pillText, selectedDept === dept && styles.pillTextActive]}>
                    {dept === 'all' ? 'All Depts' : dept.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card>
        )}

        <View style={styles.musterSection}>
          <Text style={styles.sectionHeader}>
            {isEmployee ? 'DAILY SHIFT BREAKDOWN (DAY 1 - 30)' : `STAFF MUSTER (${filteredEmployees.length} EMPLOYEES)`}
          </Text>

          {filteredEmployees.length === 0 ? (
            <EmptyState
              icon={<CalendarDays size={48} color={colors.text.tertiary} />}
              title="No Staff Found"
              description="No personnel match the selected department or search filter."
            />
          ) : (
            filteredEmployees.map((emp, empIdx) => {
              const proj = getEmployeeProjectById(emp.employeeId);
              const isExpanded = isEmployee || expandedEmpId === emp.id;

              return (
                <Card key={emp.id} style={styles.empMusterCard}>
                  <TouchableOpacity
                    style={styles.empHeaderRow}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (!isEmployee) {
                        setExpandedEmpId(isExpanded ? null : emp.id);
                      }
                    }}
                  >
                    <View style={styles.empInfoCol}>
                      <Text style={styles.empNameText}>{emp.name}</Text>
                      <Text style={styles.empSubText}>
                        {emp.employeeId} • {proj}
                      </Text>
                    </View>

                    <View style={styles.totalsRow}>
                      <View style={[styles.totalPill, { backgroundColor: '#e3f4ec' }]}>
                        <Text style={[styles.totalPillText, { color: '#237a53' }]}>P: 21</Text>
                      </View>
                      <View style={[styles.totalPill, { backgroundColor: '#fbe5e4' }]}>
                        <Text style={[styles.totalPillText, { color: '#a83a36' }]}>A: 1</Text>
                      </View>
                      <View style={[styles.totalPill, { backgroundColor: '#e8eef1' }]}>
                        <Text style={[styles.totalPillText, { color: '#34495a' }]}>LV: 2</Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.matrixContainer}>
                    <Text style={styles.matrixLabel}>30-Day Presence Strip:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayStrip}>
                      {days.map((day) => {
                        const cell = getDayStatus(empIdx, day);
                        return (
                          <View key={day} style={styles.dayCol}>
                            <Text style={styles.dayNum}>{day}</Text>
                            <View style={[styles.dayCell, { backgroundColor: cell.bg }]}>
                              <Text style={[styles.dayCode, { color: cell.text }]}>{cell.code}</Text>
                            </View>
                          </View>
                        );
                      })}
                    </ScrollView>
                  </View>
                </Card>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#e6effa',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#c9dcf1',
  },
  exportBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  summaryCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm + 2,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.xs,
  },
  summaryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.heavy,
    color: colors.text.primary,
    marginTop: 2,
  },
  navigatorCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  navStepBtn: {
    padding: spacing.xs,
  },
  monthTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  monthTitleText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendBox: {
    width: 20,
    height: 20,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendCode: {
    fontSize: 10,
    fontWeight: '700',
  },
  legendLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.text.secondary,
  },
  filterCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.md,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 38,
    marginBottom: spacing.xs,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.xs,
    color: colors.text.primary,
  },
  clearSearch: {
    fontSize: 16,
    color: colors.text.tertiary,
  },
  pillRow: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginRight: spacing.xs,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.text.secondary,
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: typography.fontWeights.bold,
  },
  musterSection: {
    marginTop: spacing.xs,
  },
  sectionHeader: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.secondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  empMusterCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.sm,
  },
  empHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  empInfoCol: {
    flex: 1,
  },
  empNameText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  empSubText: {
    fontSize: typography.fontSizes.xxs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  totalsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  totalPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.xs,
  },
  totalPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  matrixContainer: {
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    padding: spacing.xs,
  },
  matrixLabel: {
    fontSize: typography.fontSizes.xxs,
    color: colors.text.tertiary,
    marginBottom: 4,
    paddingLeft: 4,
  },
  dayStrip: {
    flexDirection: 'row',
  },
  dayCol: {
    alignItems: 'center',
    marginRight: 4,
  },
  dayNum: {
    fontSize: 9,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  dayCell: {
    width: 24,
    height: 24,
    borderRadius: radius.xs,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCode: {
    fontSize: 10,
    fontWeight: '700',
  },
});
