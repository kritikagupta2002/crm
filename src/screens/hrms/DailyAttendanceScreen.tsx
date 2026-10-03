import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, EmptyState } from '../../components/common';
import { AttendanceRecord } from '../../types';
import {
  Calendar,
  Search,
  Filter,
  Download,
  Fingerprint,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  MapPin,
  Clock,
} from 'lucide-react-native';
import {
  STANDARD_DEPARTMENTS,
  STANDARD_PROJECTS,
  getEmployeeProjectById,
} from '../../constants/attendance';

export const DailyAttendanceScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { attendance, employees } = useHrms();
  const { userRole, hasRole } = useAuth();

  const isHrOrAdmin = hasRole(['Admin', 'HR']);

  // Selected date state (defaults to passed date or today)
  const todayIso = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(route?.params?.date || todayIso);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // Navigate dates
  const handleDateStep = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const pad = (n: number) => String(n).padStart(2, '0');
    const newIso = `${current.getFullYear()}-${pad(current.getMonth() + 1)}-${pad(current.getDate())}`;
    setSelectedDate(newIso);
  };

  const dayRecords = useMemo(() => {
    return attendance.filter((r) => r.date === selectedDate);
  }, [attendance, selectedDate]);

  const filteredRecords = useMemo(() => {
    return dayRecords.filter((r) => {
      if (selectedDept !== 'all' && r.department !== selectedDept) return false;
      const proj = getEmployeeProjectById(r.employeeId);
      if (selectedProject !== 'all' && proj !== selectedProject) return false;
      if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
      if (
        selectedSource !== 'all' &&
        !r.punchSource?.toLowerCase().includes(selectedSource.toLowerCase())
      ) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.employeeName.toLowerCase().includes(q);
        const matchId = r.employeeId.toLowerCase().includes(q);
        const matchDept = (r.department || '').toLowerCase().includes(q);
        if (!matchName && !matchId && !matchDept) return false;
      }
      return true;
    });
  }, [dayRecords, selectedDept, selectedProject, selectedStatus, selectedSource, searchQuery]);

  const hasActiveFilters =
    selectedDept !== 'all' ||
    selectedProject !== 'all' ||
    selectedStatus !== 'all' ||
    selectedSource !== 'all' ||
    searchQuery.trim().length > 0;

  const resetFilters = () => {
    setSelectedDept('all');
    setSelectedProject('all');
    setSelectedStatus('all');
    setSelectedSource('all');
    setSearchQuery('');
  };

  const handleExport = () => {
    Alert.alert(
      'Export Complete',
      `Daily shift punch records for ${selectedDate} have been exported successfully to Excel.`
    );
  };

  const renderAttendanceItem = ({ item }: { item: AttendanceRecord }) => {
    const proj = getEmployeeProjectById(item.employeeId);

    return (
      <Card style={styles.recordCard}>
        <View style={styles.topRow}>
          <View style={styles.staffInfo}>
            <Text style={styles.staffName}>{item.employeeName}</Text>
            <Text style={styles.staffSub}>
              {item.employeeId} • {item.department || 'Operations'}
            </Text>
          </View>
          <StatusBadge status={item.status} size="sm" />
        </View>

        {/* Project Pill */}
        <View style={styles.projectPill}>
          <View style={styles.projectDot} />
          <Text style={styles.projectText} numberOfLines={1}>
            {proj}
          </Text>
        </View>

        {/* Punch In / Out / Duration Grid */}
        <View style={styles.timesContainer}>
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>CHECK IN</Text>
            <Text style={styles.timeValue}>{item.punchIn || item.checkIn || '--:--'}</Text>
          </View>
          <View style={styles.timeDivider} />
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>CHECK OUT</Text>
            <Text style={styles.timeValue}>{item.punchOut || item.checkOut || '--:--'}</Text>
          </View>
          <View style={styles.timeDivider} />
          <View style={styles.timeBlock}>
            <Text style={styles.timeLabel}>DURATION</Text>
            <Text style={[styles.timeValue, { color: colors.primary }]}>
              {item.workingHours || (item.durationHours ? `${item.durationHours}h` : '--')}
            </Text>
          </View>
        </View>

        {/* Footer with Punch Source & Late mark */}
        <View style={styles.cardFooter}>
          <View style={styles.sourceTag}>
            <Fingerprint size={12} color="#2563EB" />
            <Text style={styles.sourceText}>{item.punchSource || 'Biometric - Jaipur HQ'}</Text>
          </View>
          {item.lateBy && item.lateBy !== '-' && (
            <View style={styles.lateTag}>
              <Clock size={11} color="#B45309" />
              <Text style={styles.lateText}>Late: {item.lateBy}</Text>
            </View>
          )}
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Daily Attendance Register"
        subtitle="Day-specific biometric punch ledger & shift compliance"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
            <Download size={15} color={colors.primary} />
            <Text style={styles.exportBtnText}>Export</Text>
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {/* Date Stepper Bar */}
        <Card style={styles.dateBar}>
          <TouchableOpacity
            style={styles.dateStepBtn}
            onPress={() => handleDateStep(-1)}
          >
            <ChevronLeft size={20} color={colors.text.primary} />
          </TouchableOpacity>

          <View style={styles.dateDisplay}>
            <Calendar size={16} color={colors.primary} />
            <Text style={styles.dateText}>{selectedDate}</Text>
          </View>

          <TouchableOpacity
            style={styles.dateStepBtn}
            onPress={() => handleDateStep(1)}
          >
            <ChevronRight size={20} color={colors.text.primary} />
          </TouchableOpacity>
        </Card>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
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

          <TouchableOpacity
            style={[styles.filterToggleBtn, hasActiveFilters && styles.filterToggleBtnActive]}
            onPress={() => setShowFilterSheet(!showFilterSheet)}
          >
            <Filter size={16} color={hasActiveFilters ? '#fff' : colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Collapsible Filter Bar */}
        {showFilterSheet && (
          <Card style={styles.filterSheet}>
            <View style={styles.filterSheetHeader}>
              <Text style={styles.filterSheetTitle}>FILTER ATTENDANCE</Text>
              {hasActiveFilters && (
                <TouchableOpacity style={styles.resetFiltersBtn} onPress={resetFilters}>
                  <RotateCcw size={12} color={colors.semantic.danger} />
                  <Text style={styles.resetFiltersText}>Reset</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Status Filter */}
            <Text style={styles.filterGroupTitle}>Status:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {['all', 'Present', 'Field Duty', 'Late', 'Absent', 'On Leave'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.pill, selectedStatus === st && styles.pillActive]}
                  onPress={() => setSelectedStatus(st)}
                >
                  <Text style={[styles.pillText, selectedStatus === st && styles.pillTextActive]}>
                    {st === 'all' ? 'All Statuses' : st}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Department Filter */}
            <Text style={styles.filterGroupTitle}>Department:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {['all', ...STANDARD_DEPARTMENTS].map((dept) => (
                <TouchableOpacity
                  key={dept}
                  style={[styles.pill, selectedDept === dept && styles.pillActive]}
                  onPress={() => setSelectedDept(dept)}
                >
                  <Text style={[styles.pillText, selectedDept === dept && styles.pillTextActive]}>
                    {dept === 'all' ? 'All Departments' : dept.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Project Filter */}
            <Text style={styles.filterGroupTitle}>Project / Site:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {['all', ...STANDARD_PROJECTS].map((proj) => (
                <TouchableOpacity
                  key={proj}
                  style={[styles.pill, selectedProject === proj && styles.pillActive]}
                  onPress={() => setSelectedProject(proj)}
                >
                  <Text style={[styles.pillText, selectedProject === proj && styles.pillTextActive]}>
                    {proj === 'all' ? 'All Sites' : proj.split(' ')[0]}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Card>
        )}

        {/* Count Bar */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            Showing <Text style={{ fontWeight: '700' }}>{filteredRecords.length}</Text> of{' '}
            <Text style={{ fontWeight: '700' }}>{dayRecords.length}</Text> logs for {selectedDate}
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.clearText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Records FlatList */}
        <FlatList
          data={filteredRecords}
          keyExtractor={(item) => item.id}
          renderItem={renderAttendanceItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon={<Calendar size={48} color={colors.text.tertiary} />}
              title="No Logs Found"
              description={`No attendance punches recorded for ${selectedDate} matching your filters.`}
              actionTitle={hasActiveFilters ? 'Clear Filters' : undefined}
              onAction={hasActiveFilters ? resetFilters : undefined}
            />
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: '#EFF6FF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  exportBtnText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  dateBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.sm,
  },
  dateStepBtn: {
    padding: spacing.xs,
  },
  dateDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  dateText: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  searchRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
    height: 42,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSizes.sm,
    color: colors.text.primary,
  },
  clearSearch: {
    fontSize: 18,
    color: colors.text.tertiary,
    paddingHorizontal: 4,
  },
  filterToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterToggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterSheet: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.sm,
  },
  filterSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  filterSheetTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.secondary,
    letterSpacing: 0.5,
  },
  resetFiltersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resetFiltersText: {
    fontSize: typography.fontSizes.xs,
    color: colors.semantic.danger,
    fontWeight: typography.fontWeights.semibold,
  },
  filterGroupTitle: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.tertiary,
    marginTop: spacing.xs,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  pillRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
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
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
  },
  pillTextActive: {
    color: '#fff',
    fontWeight: typography.fontWeights.bold,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingHorizontal: 2,
  },
  countText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
  },
  clearText: {
    fontSize: typography.fontSizes.xs,
    color: colors.semantic.danger,
    fontWeight: typography.fontWeights.semibold,
  },
  listContainer: {
    paddingBottom: spacing.xxl,
  },
  recordCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    marginBottom: spacing.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  staffInfo: {
    flex: 1,
  },
  staffName: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  staffSub: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  projectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: radius.md,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  projectDot: {
    width: 6,
    height: 6,
    borderRadius: radius.full,
    backgroundColor: '#D97706',
  },
  projectText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: '#92400E',
  },
  timesContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  timeBlock: {
    flex: 1,
    alignItems: 'center',
  },
  timeDivider: {
    width: 1,
    backgroundColor: colors.border.subtle,
  },
  timeLabel: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.secondary,
  },
  timeValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sourceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sourceText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
  },
  lateTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.xs + 2,
    paddingVertical: 2,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.xs,
  },
  lateText: {
    fontSize: typography.fontSizes.xxs,
    fontWeight: typography.fontWeights.bold,
    color: '#B45309',
  },
});
