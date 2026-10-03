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
import { Shift, ShiftAssignment, Employee } from '../../types';
import {
  Clock,
  Sun,
  Moon,
  Sunrise,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  MapPin,
  Building,
  Coffee,
  Check,
  ChevronRight,
  SlidersHorizontal,
} from 'lucide-react-native';

export const ShiftsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    shifts,
    shiftAssignments,
    employees,
    createShift,
    updateShift,
    deleteShift,
    toggleShiftStatus,
    assignShift,
    refreshHrms,
  } = useHrms();

  const { hasRole, session } = useAuth();
  const isHRAdmin = hasRole(['Admin', 'HR']);

  // Employee ID for self-service view
  const currentEmpId =
    session?.accountType === 'team'
      ? (session as any).employeeId || 'BGS-2021-001'
      : 'BGS-2021-001';

  // State
  const [activeTab, setActiveTab] = useState<'shifts' | 'assignments'>('shifts');
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('All');

  // Modal State for Shift Master (Create / Edit)
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [editingShift, setEditingShift] = useState<Shift | null>(null);
  const [shiftName, setShiftName] = useState('');
  const [shiftCode, setShiftCode] = useState('');
  const [startTime, setStartTime] = useState('09:30 AM');
  const [endTime, setEndTime] = useState('06:00 PM');
  const [breakDuration, setBreakDuration] = useState('45 mins');
  const [gracePeriod, setGracePeriod] = useState('15 mins');
  const [weeklyOff, setWeeklyOff] = useState('Saturday & Sunday');
  const [location, setLocation] = useState('Jaipur Corporate HQ');
  const [shiftStatus, setShiftStatus] = useState<'Active' | 'Inactive'>('Active');
  const [description, setDescription] = useState('');
  const [shiftErrors, setShiftErrors] = useState<Record<string, string>>({});

  // Modal State for Shift Assignment
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignEmpId, setAssignEmpId] = useState('');
  const [assignShiftId, setAssignShiftId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('2026-10-01');
  const [assignWeeklyOff, setAssignWeeklyOff] = useState('Sunday');
  const [assignErrors, setAssignErrors] = useState<Record<string, string>>({});

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHrms();
    setRefreshing(false);
  };

  // Find current employee's assigned shift
  const myAssignment = useMemo(() => {
    return (
      shiftAssignments.find(
        (a) =>
          a.employeeId === currentEmpId ||
          a.employeeId.includes(currentEmpId.replace('BGS-', ''))
      ) || shiftAssignments[0]
    );
  }, [shiftAssignments, currentEmpId]);

  const myShift = useMemo(() => {
    if (!myAssignment) return shifts[0];
    return shifts.find((s) => s.id === myAssignment.shiftId) || shifts[0];
  }, [myAssignment, shifts]);

  // Static 7-Day Weekly Roster from Web Source Parity
  const weeklyRoster = useMemo(() => [
    { day: 'Mon', date: '22 Sep', shift: myShift?.name || 'General Corporate Shift (HQ)', timing: `${myShift?.startTime || '09:30 AM'} – ${myShift?.endTime || '06:00 PM'}`, status: 'Completed' },
    { day: 'Tue', date: '23 Sep', shift: myShift?.name || 'General Corporate Shift (HQ)', timing: `${myShift?.startTime || '09:30 AM'} – ${myShift?.endTime || '06:00 PM'}`, status: 'Completed' },
    { day: 'Wed', date: '24 Sep', shift: myShift?.name || 'General Corporate Shift (HQ)', timing: `${myShift?.startTime || '09:30 AM'} – ${myShift?.endTime || '06:00 PM'}`, status: 'Completed' },
    { day: 'Thu', date: '25 Sep', shift: myShift?.name || 'General Corporate Shift (HQ)', timing: `${myShift?.startTime || '09:30 AM'} – ${myShift?.endTime || '06:00 PM'}`, status: 'Completed' },
    { day: 'Fri', date: '26 Sep', shift: myShift?.name || 'General Corporate Shift (HQ)', timing: `${myShift?.startTime || '09:30 AM'} – ${myShift?.endTime || '06:00 PM'}`, status: 'Active Today' },
    { day: 'Sat', date: '27 Sep', shift: 'Weekly Off', timing: '—', status: 'Weekly Off' },
    { day: 'Sun', date: '28 Sep', shift: 'Weekly Off', timing: '—', status: 'Weekly Off' },
  ], [myShift]);

  // Filtered shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.location && s.location.toLowerCase().includes(q))
      );
    });
  }, [shifts, search]);

  // Filtered assignments
  const filteredAssignments = useMemo(() => {
    return shiftAssignments.filter((a) => {
      if (selectedDeptFilter !== 'All' && a.department !== selectedDeptFilter) {
        return false;
      }
      if (selectedShiftFilter !== 'All' && a.shiftName !== selectedShiftFilter) {
        return false;
      }
      const q = search.trim().toLowerCase();
      if (q) {
        const matchesName = a.employeeName.toLowerCase().includes(q);
        const matchesId = a.employeeId.toLowerCase().includes(q);
        const matchesDept = (a.department || '').toLowerCase().includes(q);
        const matchesShift = a.shiftName.toLowerCase().includes(q);
        if (!matchesName && !matchesId && !matchesDept && !matchesShift) {
          return false;
        }
      }
      return true;
    });
  }, [shiftAssignments, selectedDeptFilter, selectedShiftFilter, search]);

  // Available departments for filter
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    shiftAssignments.forEach((a) => {
      if (a.department) set.add(a.department);
    });
    return ['All', ...Array.from(set)];
  }, [shiftAssignments]);

  // Open Create Shift Modal
  const handleOpenCreateShift = () => {
    setEditingShift(null);
    setShiftName('');
    setShiftCode('');
    setStartTime('09:30 AM');
    setEndTime('06:00 PM');
    setBreakDuration('45 mins');
    setGracePeriod('15 mins');
    setWeeklyOff('Saturday & Sunday');
    setLocation('Jaipur Corporate HQ');
    setShiftStatus('Active');
    setDescription('');
    setShiftErrors({});
    setShowShiftModal(true);
  };

  // Open Edit Shift Modal
  const handleOpenEditShift = (shift: Shift) => {
    setEditingShift(shift);
    setShiftName(shift.name);
    setShiftCode(shift.code);
    setStartTime(shift.startTime);
    setEndTime(shift.endTime);
    setBreakDuration(shift.breakDuration || '45 mins');
    setGracePeriod(shift.gracePeriod || '15 mins');
    setWeeklyOff(shift.weeklyOff || 'Saturday & Sunday');
    setLocation(shift.location || 'Jaipur Corporate HQ');
    setShiftStatus(shift.status);
    setDescription(shift.description || '');
    setShiftErrors({});
    setShowShiftModal(true);
  };

  // Save Shift Master Form
  const handleSaveShift = async () => {
    const errs: Record<string, string> = {};
    if (!shiftName.trim()) {
      errs.name = 'Shift name is required.';
    }
    if (!shiftCode.trim()) {
      errs.code = 'Shift code is required.';
    }
    if (!startTime.trim()) {
      errs.startTime = 'Start time is required.';
    }
    if (!endTime.trim()) {
      errs.endTime = 'End time is required.';
    }

    if (Object.keys(errs).length > 0) {
      setShiftErrors(errs);
      return;
    }

    try {
      if (editingShift) {
        await updateShift(editingShift.id, {
          name: shiftName,
          code: shiftCode,
          startTime,
          endTime,
          breakDuration,
          gracePeriod,
          weeklyOff,
          location,
          status: shiftStatus,
          description,
        });
        Alert.alert('Shift Updated', `Shift "${shiftName}" has been updated.`);
      } else {
        await createShift({
          name: shiftName,
          code: shiftCode,
          startTime,
          endTime,
          breakDuration,
          gracePeriod,
          weeklyOff,
          location,
          status: shiftStatus,
          description,
        });
        Alert.alert('Shift Created', `New shift "${shiftName}" was created successfully.`);
      }
      setShowShiftModal(false);
    } catch (e: any) {
      Alert.alert('Validation Error', e.message || 'Failed to save shift.');
    }
  };

  // Handle Shift Deletion with Safety Checks
  const handleDeleteShift = (shift: Shift) => {
    Alert.alert(
      'Delete Shift',
      `Are you sure you want to delete "${shift.name}" (${shift.code})?\n\nIf active staff or upcoming rosters are mapped to this shift, deletion will be blocked to safeguard data integrity.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteShift(shift.id);
              Alert.alert('Shift Deleted', `Shift "${shift.name}" removed.`);
            } catch (err: any) {
              Alert.alert('Referential Integrity Guard', err.message || 'Cannot delete shift.');
            }
          },
        },
      ]
    );
  };

  // Open Assign Shift Modal
  const handleOpenAssignModal = () => {
    const defaultEmp = employees[0]?.employeeId || '';
    const defaultShift = shifts[0]?.id || '';
    setAssignEmpId(defaultEmp);
    setAssignShiftId(defaultShift);
    setEffectiveFrom('2026-10-01');
    setAssignWeeklyOff('Sunday');
    setAssignErrors({});
    setShowAssignModal(true);
  };

  // Save Shift Assignment
  const handleSaveAssignment = async () => {
    const errs: Record<string, string> = {};
    if (!assignEmpId) errs.employeeId = 'Select an employee.';
    if (!assignShiftId) errs.shiftId = 'Select a shift.';

    if (Object.keys(errs).length > 0) {
      setAssignErrors(errs);
      return;
    }

    const emp = employees.find((e) => e.employeeId === assignEmpId);
    const sh = shifts.find((s) => s.id === assignShiftId);

    if (!emp || !sh) {
      Alert.alert('Error', 'Invalid employee or shift selection.');
      return;
    }

    try {
      await assignShift({
        employeeId: emp.employeeId,
        employeeName: emp.name,
        department: emp.employment?.department || 'Operations',
        shiftId: sh.id,
        shiftName: sh.name,
        effectiveFrom,
        weeklyOff: assignWeeklyOff,
        status: 'Active',
      });
      setShowAssignModal(false);
      Alert.alert('Shift Assigned', `Assigned ${emp.name} to ${sh.name}.`);
    } catch (e: any) {
      Alert.alert('Assignment Error', e.message || 'Failed to assign shift.');
    }
  };

  // Helper for Shift Icon
  const getShiftIcon = (code: string) => {
    if (code.includes('MORN') || code.includes('AM')) return <Sunrise size={18} color="#D97706" />;
    if (code.includes('EVE') || code.includes('PM')) return <Sun size={18} color="#2563EB" />;
    if (code.includes('FLIGHT') || code.includes('UAV')) return <Clock size={18} color="#059669" />;
    return <Clock size={18} color={colors.primary} />;
  };

  // ============================================================
  // RENDER EMPLOYEE SELF-SERVICE VIEW
  // ============================================================
  if (!isHRAdmin) {
    return (
      <View style={styles.container}>
        <AppHeader
          title="My Shift Schedule & Roster"
          subtitle="Your active assigned shift, timing rules, and weekly roster"
          showBack
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          contentContainerStyle={styles.contentContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Current Assigned Shift Hero Card */}
          <Card style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View style={styles.heroBadge}>
                <Clock size={14} color={colors.primary} />
                <Text style={styles.heroBadgeText}>CURRENT ACTIVE ASSIGNMENT</Text>
              </View>
              <StatusBadge status={myShift?.status || 'Active'} size="sm" />
            </View>

            <Text style={styles.heroShiftTitle}>{myShift?.name || 'General Corporate Shift (HQ)'}</Text>
            <Text style={styles.heroShiftCode}>{myShift?.code || 'HQ-GEN'}</Text>

            <View style={styles.heroTimeRow}>
              <View style={styles.heroTimeBox}>
                <Text style={styles.heroTimeLabel}>START TIME</Text>
                <Text style={styles.heroTimeValue}>{myShift?.startTime || '09:30 AM'}</Text>
              </View>
              <ArrowRight size={18} color={colors.text.tertiary} />
              <View style={styles.heroTimeBox}>
                <Text style={styles.heroTimeLabel}>END TIME</Text>
                <Text style={styles.heroTimeValue}>{myShift?.endTime || '06:00 PM'}</Text>
              </View>
              <View style={styles.heroTimeBox}>
                <Text style={styles.heroTimeLabel}>DURATION</Text>
                <Text style={styles.heroTimeValue}>8.5 Hours</Text>
              </View>
            </View>

            <View style={styles.heroDetailsGrid}>
              <View style={styles.heroDetailItem}>
                <Coffee size={14} color={colors.text.tertiary} />
                <Text style={styles.heroDetailText}>Break: {myShift?.breakDuration || '45 mins'}</Text>
              </View>
              <View style={styles.heroDetailItem}>
                <Clock size={14} color={colors.text.tertiary} />
                <Text style={styles.heroDetailText}>Grace: {myShift?.gracePeriod || '15 mins'}</Text>
              </View>
              <View style={styles.heroDetailItem}>
                <Calendar size={14} color={colors.text.tertiary} />
                <Text style={styles.heroDetailText}>Off: {myShift?.weeklyOff || 'Saturday & Sunday'}</Text>
              </View>
              <View style={styles.heroDetailItem}>
                <MapPin size={14} color={colors.text.tertiary} />
                <Text style={styles.heroDetailText}>{myShift?.location || 'Jaipur Corporate HQ'}</Text>
              </View>
            </View>

            {myShift?.description ? (
              <Text style={styles.heroDesc}>{myShift.description}</Text>
            ) : null}
          </Card>

          {/* Quick Action to Monthly Roster */}
          <TouchableOpacity
            style={styles.monthlyRosterBanner}
            onPress={() => navigation.navigate('MonthlyRoster')}
            activeOpacity={0.8}
          >
            <View style={styles.bannerLeft}>
              <View style={styles.bannerIcon}>
                <Calendar size={20} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.bannerTitle}>Monthly Employee Roster Planner</Text>
                <Text style={styles.bannerSubtitle}>View complete calendar schedule & rotations</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* 7-Day Weekly Roster Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Current Week Roster (22 Sep – 28 Sep 2026)</Text>
          </View>

          <Card style={styles.weeklyTableCard}>
            {weeklyRoster.map((item, index) => {
              const isActiveToday = item.status === 'Active Today';
              const isWeeklyOff = item.status === 'Weekly Off';

              return (
                <View
                  key={index}
                  style={[
                    styles.rosterRow,
                    isActiveToday && styles.rosterRowActive,
                    index === weeklyRoster.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <View style={styles.rosterDayCol}>
                    <Text style={[styles.rosterDayText, isActiveToday && styles.textHighlight]}>
                      {item.day}
                    </Text>
                    <Text style={styles.rosterDateText}>{item.date}</Text>
                  </View>

                  <View style={styles.rosterShiftCol}>
                    <Text style={[styles.rosterShiftName, isWeeklyOff && styles.textMuted]}>
                      {item.shift}
                    </Text>
                    <Text style={styles.rosterTimingText}>{item.timing}</Text>
                  </View>

                  <View style={styles.rosterStatusCol}>
                    <StatusBadge
                      status={
                        item.status === 'Completed'
                          ? 'Completed'
                          : item.status === 'Active Today'
                          ? 'Active'
                          : 'Pending'
                      }
                      size="sm"
                    />
                  </View>
                </View>
              );
            })}
          </Card>
        </ScrollView>
      </View>
    );
  }

  // ============================================================
  // RENDER HR / ADMIN MANAGEMENT VIEW
  // ============================================================
  return (
    <View style={styles.container}>
      <AppHeader
        title="Shift Management"
        subtitle="Shift rosters for Jaipur HQ, Bhilwara mine, & drone field campaigns"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.headerActionBtn}
            onPress={activeTab === 'shifts' ? handleOpenCreateShift : handleOpenAssignModal}
          >
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.headerActionText}>
              {activeTab === 'shifts' ? 'New Shift' : 'Assign'}
            </Text>
          </TouchableOpacity>
        }
      />

      {/* KPI Stats Bar */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiValue}>{shifts.length}</Text>
          <Text style={styles.kpiLabel}>Total Shifts</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: colors.success }]}>
            {shifts.filter((s) => s.status === 'Active').length}
          </Text>
          <Text style={styles.kpiLabel}>Active Masters</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: colors.primary }]}>
            {shiftAssignments.length}
          </Text>
          <Text style={styles.kpiLabel}>Staff Assigned</Text>
        </View>
        <TouchableOpacity
          style={[styles.kpiCard, styles.kpiActionCard]}
          onPress={() => navigation.navigate('MonthlyRoster')}
        >
          <Calendar size={18} color={colors.primary} />
          <Text style={styles.kpiActionLabel}>Monthly Roster</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Segment Control */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'shifts' && styles.tabButtonActive]}
          onPress={() => setActiveTab('shifts')}
        >
          <Clock size={16} color={activeTab === 'shifts' ? colors.primary : colors.text.tertiary} />
          <Text style={[styles.tabButtonText, activeTab === 'shifts' && styles.tabButtonTextActive]}>
            Shift Masters ({shifts.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'assignments' && styles.tabButtonActive]}
          onPress={() => setActiveTab('assignments')}
        >
          <Users size={16} color={activeTab === 'assignments' ? colors.primary : colors.text.tertiary} />
          <Text style={[styles.tabButtonText, activeTab === 'assignments' && styles.tabButtonTextActive]}>
            Staff Assignments ({shiftAssignments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrap}>
          <Search size={16} color={colors.text.tertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              activeTab === 'shifts'
                ? 'Search shift name, code, or location...'
                : 'Search staff, employee ID, or department...'
            }
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

      {/* Assignments Filter Bar */}
      {activeTab === 'assignments' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {departmentsList.map((dept) => (
            <TouchableOpacity
              key={dept}
              style={[
                styles.filterChip,
                selectedDeptFilter === dept && styles.filterChipActive,
              ]}
              onPress={() => setSelectedDeptFilter(dept)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedDeptFilter === dept && styles.filterChipTextActive,
                ]}
              >
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Main List */}
      {activeTab === 'shifts' ? (
        <FlatList
          data={filteredShifts}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <EmptyState
              title="No Shifts Found"
              description="No shift master schedules match your query."
              actionLabel="Create Shift"
              onAction={handleOpenCreateShift}
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.shiftCard}>
              <View style={styles.shiftCardHeader}>
                <View style={styles.shiftCardLeft}>
                  {getShiftIcon(item.code)}
                  <View>
                    <Text style={styles.shiftCardCode}>{item.code}</Text>
                    <Text style={styles.shiftCardName}>{item.name}</Text>
                  </View>
                </View>
                <StatusBadge status={item.status} size="sm" />
              </View>

              {/* Timing Display */}
              <View style={styles.shiftTimingBox}>
                <View style={styles.shiftTimeCol}>
                  <Text style={styles.shiftTimeLabel}>TIMINGS</Text>
                  <Text style={styles.shiftTimeVal}>{item.startTime} – {item.endTime}</Text>
                </View>
                <View style={styles.shiftHoursBadge}>
                  <Text style={styles.shiftHoursText}>8.5h Shift</Text>
                </View>
              </View>

              {/* Badges Row */}
              <View style={styles.metaRow}>
                <View style={styles.metaBadge}>
                  <Coffee size={12} color={colors.text.tertiary} />
                  <Text style={styles.metaBadgeText}>Break: {item.breakDuration || '45m'}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Clock size={12} color={colors.text.tertiary} />
                  <Text style={styles.metaBadgeText}>Grace: {item.gracePeriod || '15m'}</Text>
                </View>
                <View style={styles.metaBadge}>
                  <Calendar size={12} color={colors.text.tertiary} />
                  <Text style={styles.metaBadgeText}>Off: {item.weeklyOff || 'Sun'}</Text>
                </View>
              </View>

              {/* Location & Assigned Staff */}
              <View style={styles.footerRow}>
                <View style={styles.locationWrap}>
                  <MapPin size={12} color={colors.text.tertiary} />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {item.location || 'Jaipur Corporate HQ'}
                  </Text>
                </View>
                <View style={styles.staffCountWrap}>
                  <Users size={12} color={colors.primary} />
                  <Text style={styles.staffCountText}>
                    {item.assignedEmployeesCount || 0} Staff Assigned
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.actionBtnSecondary}
                  onPress={() => handleOpenEditShift(item)}
                >
                  <Edit2 size={14} color={colors.text.secondary} />
                  <Text style={styles.actionBtnTextSecondary}>Edit Shift</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnDanger}
                  onPress={() => handleDeleteShift(item)}
                >
                  <Trash2 size={14} color={colors.danger} />
                  <Text style={styles.actionBtnTextDanger}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        />
      ) : (
        <FlatList
          data={filteredAssignments}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <EmptyState
              title="No Assignments Found"
              description="No staff shift assignments match your criteria."
              actionLabel="Assign Shift"
              onAction={handleOpenAssignModal}
            />
          }
          renderItem={({ item }) => (
            <Card style={styles.assignmentCard}>
              <View style={styles.asgnHeader}>
                <View style={styles.asgnEmpWrap}>
                  <Text style={styles.asgnEmpId}>{item.employeeId}</Text>
                  <Text style={styles.asgnEmpName}>{item.employeeName}</Text>
                  <Text style={styles.asgnDept}>{item.department}</Text>
                </View>
                <StatusBadge status={item.status} size="sm" />
              </View>

              <View style={styles.asgnBody}>
                <View style={styles.asgnItem}>
                  <Text style={styles.asgnItemLabel}>ASSIGNED SHIFT</Text>
                  <Text style={styles.asgnItemValue}>{item.shiftName}</Text>
                </View>

                <View style={styles.asgnGrid}>
                  <View style={styles.asgnSubItem}>
                    <Text style={styles.asgnItemLabel}>WEEKLY REST DAY</Text>
                    <Text style={styles.asgnSubVal}>{item.weeklyOff}</Text>
                  </View>
                  <View style={styles.asgnSubItem}>
                    <Text style={styles.asgnItemLabel}>EFFECTIVE FROM</Text>
                    <Text style={styles.asgnSubVal}>{item.effectiveFrom}</Text>
                  </View>
                </View>
              </View>
            </Card>
          )}
        />
      )}

      {/* CREATE / EDIT SHIFT MODAL */}
      <Modal
        visible={showShiftModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowShiftModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingShift ? 'Edit Shift Master' : 'Create New Shift'}
              </Text>
              <TouchableOpacity onPress={() => setShowShiftModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Input
                label="Shift Name *"
                placeholder="e.g. Night Borehole Drilling Shift"
                value={shiftName}
                onChangeText={setShiftName}
                error={shiftErrors.name}
              />

              <Input
                label="Shift Code *"
                placeholder="e.g. NIGHT-DRILL"
                value={shiftCode}
                onChangeText={setShiftCode}
                autoCapitalize="characters"
                error={shiftErrors.code}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Start Time *"
                    placeholder="09:30 AM"
                    value={startTime}
                    onChangeText={setStartTime}
                    error={shiftErrors.startTime}
                  />
                </View>
                <View style={{ width: spacing.md }} />
                <View style={{ flex: 1 }}>
                  <Input
                    label="End Time *"
                    placeholder="06:00 PM"
                    value={endTime}
                    onChangeText={setEndTime}
                    error={shiftErrors.endTime}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    label="Break Duration"
                    placeholder="45 mins"
                    value={breakDuration}
                    onChangeText={setBreakDuration}
                  />
                </View>
                <View style={{ width: spacing.md }} />
                <View style={{ flex: 1 }}>
                  <Input
                    label="Grace Period"
                    placeholder="15 mins"
                    value={gracePeriod}
                    onChangeText={setGracePeriod}
                  />
                </View>
              </View>

              {/* Weekly Off Picker */}
              <Text style={styles.fieldLabel}>Designated Weekly Off</Text>
              <View style={styles.optionRow}>
                {['Saturday & Sunday', 'Sunday', 'Rotational (1 day / week)'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionBtn, weeklyOff === opt && styles.optionBtnActive]}
                    onPress={() => setWeeklyOff(opt)}
                  >
                    <Text
                      style={[
                        styles.optionBtnText,
                        weeklyOff === opt && styles.optionBtnTextActive,
                      ]}
                    >
                      {opt === 'Rotational (1 day / week)' ? 'Rotational' : opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Location Applicability */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>
                Location Applicability
              </Text>
              <View style={styles.optionRow}>
                {[
                  'Jaipur Corporate HQ',
                  'Bhilwara & Udaipur Mine Sites',
                  'Exploration Blocks / Field',
                ].map((loc) => (
                  <TouchableOpacity
                    key={loc}
                    style={[styles.optionBtn, location === loc && styles.optionBtnActive]}
                    onPress={() => setLocation(loc)}
                  >
                    <Text
                      style={[
                        styles.optionBtnText,
                        location === loc && styles.optionBtnTextActive,
                      ]}
                    >
                      {loc.includes('HQ') ? 'Jaipur HQ' : loc.includes('Mine') ? 'Mine Sites' : 'Field'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Status Toggle */}
              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Status</Text>
              <View style={styles.optionRow}>
                {(['Active', 'Inactive'] as const).map((st) => (
                  <TouchableOpacity
                    key={st}
                    style={[styles.optionBtn, shiftStatus === st && styles.optionBtnActive]}
                    onPress={() => setShiftStatus(st)}
                  >
                    <Text
                      style={[
                        styles.optionBtnText,
                        shiftStatus === st && styles.optionBtnTextActive,
                      ]}
                    >
                      {st}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ marginTop: spacing.md }}>
                <Input
                  label="Description / Scope"
                  placeholder="Operating guidelines, shift handover, vehicle log requirements..."
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title={editingShift ? 'Save Changes' : 'Create Shift Schedule'}
                onPress={handleSaveShift}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ASSIGN SHIFT MODAL */}
      <Modal
        visible={showAssignModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAssignModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign Shift to Staff Member</Text>
              <TouchableOpacity onPress={() => setShowAssignModal(false)}>
                <Text style={styles.modalCloseText}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              <Text style={styles.fieldLabel}>Select Employee *</Text>
              <ScrollView style={styles.selectionList} nestedScrollEnabled>
                {employees.map((e) => {
                  const isSelected = assignEmpId === e.employeeId;
                  return (
                    <TouchableOpacity
                      key={e.id}
                      style={[styles.selectionItem, isSelected && styles.selectionItemActive]}
                      onPress={() => setAssignEmpId(e.employeeId)}
                    >
                      <View>
                        <Text style={[styles.selectionItemTitle, isSelected && styles.textHighlight]}>
                          {e.name}
                        </Text>
                        <Text style={styles.selectionItemSub}>
                          {e.employeeId} · {e.employment?.department || 'Operations'}
                        </Text>
                      </View>
                      {isSelected ? <Check size={16} color={colors.primary} /> : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Target Shift Schedule *</Text>
              <ScrollView style={styles.selectionList} nestedScrollEnabled>
                {shifts.map((s) => {
                  const isSelected = assignShiftId === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.selectionItem, isSelected && styles.selectionItemActive]}
                      onPress={() => setAssignShiftId(s.id)}
                    >
                      <View>
                        <Text style={[styles.selectionItemTitle, isSelected && styles.textHighlight]}>
                          {s.name}
                        </Text>
                        <Text style={styles.selectionItemSub}>
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
                  label="Effective From Date (YYYY-MM-DD)"
                  placeholder="2026-10-01"
                  value={effectiveFrom}
                  onChangeText={setEffectiveFrom}
                />
              </View>

              <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Designated Weekly Off</Text>
              <View style={styles.optionRow}>
                {['Saturday & Sunday', 'Sunday', 'Rotational (1 day / week)'].map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionBtn, assignWeeklyOff === opt && styles.optionBtnActive]}
                    onPress={() => setAssignWeeklyOff(opt)}
                  >
                    <Text
                      style={[
                        styles.optionBtnText,
                        assignWeeklyOff === opt && styles.optionBtnTextActive,
                      ]}
                    >
                      {opt === 'Rotational (1 day / week)' ? 'Rotational' : opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button title="Save Assignment" onPress={handleSaveAssignment} />
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
  contentContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    gap: 4,
  },
  headerActionText: {
    ...typography.caption,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  kpiContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: colors.surfaceCard,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  kpiActionCard: {
    backgroundColor: `${colors.primary}10`,
    borderColor: `${colors.primary}30`,
    justifyContent: 'center',
  },
  kpiValue: {
    ...typography.h4,
    color: colors.text.primary,
    fontWeight: '800',
  },
  kpiLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 2,
    textAlign: 'center',
  },
  kpiActionLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.background.secondary,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  tabButtonActive: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  tabButtonText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.tertiary,
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  searchRow: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.sm,
    height: 40,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    paddingVertical: 0,
  },
  filterScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContainer: {
    padding: spacing.md,
    gap: spacing.md,
  },
  shiftCard: {
    padding: spacing.md,
  },
  shiftCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  shiftCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  shiftCardCode: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
    fontSize: 11,
  },
  shiftCardName: {
    ...typography.h4,
    fontSize: 15,
    color: colors.text.primary,
  },
  shiftTimingBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  shiftTimeCol: {
    flex: 1,
  },
  shiftTimeLabel: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  shiftTimeVal: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  shiftHoursBadge: {
    backgroundColor: `${colors.primary}15`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  shiftHoursText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  metaBadgeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.secondary,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  locationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.tertiary,
  },
  staffCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  staffCountText: {
    ...typography.caption,
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
  },
  actionBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
  },
  actionBtnTextSecondary: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  actionBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: `${colors.danger}30`,
    backgroundColor: `${colors.danger}10`,
  },
  actionBtnTextDanger: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.danger,
  },
  assignmentCard: {
    padding: spacing.md,
  },
  asgnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  asgnEmpWrap: {
    flex: 1,
  },
  asgnEmpId: {
    ...typography.caption,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontWeight: '700',
    color: colors.primary,
  },
  asgnEmpName: {
    ...typography.h4,
    fontSize: 15,
    color: colors.text.primary,
    marginTop: 2,
  },
  asgnDept: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 1,
  },
  asgnBody: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  asgnItem: {
    marginBottom: 4,
  },
  asgnItemLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.tertiary,
    fontWeight: '700',
  },
  asgnItemValue: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  asgnGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  asgnSubItem: {
    flex: 1,
  },
  asgnSubVal: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    marginTop: 1,
  },

  // Employee Hero View Styles
  heroCard: {
    padding: spacing.lg,
    backgroundColor: colors.surfaceCard,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroBadgeText: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  heroShiftTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.xs,
  },
  heroShiftCode: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.tertiary,
    marginBottom: spacing.md,
  },
  heroTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.tertiary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  heroTimeBox: {
    alignItems: 'center',
  },
  heroTimeLabel: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  heroTimeValue: {
    ...typography.bodyLarge,
    fontWeight: '800',
    color: colors.text.primary,
  },
  heroDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  heroDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '48%',
  },
  heroDetailText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  heroDesc: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
  },
  monthlyRosterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  bannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  bannerIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    ...typography.bodyLarge,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bannerSubtitle: {
    ...typography.caption,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  sectionHeader: {
    marginTop: spacing.sm,
  },
  sectionTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  weeklyTableCard: {
    padding: 0,
    overflow: 'hidden',
  },
  rosterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  rosterRowActive: {
    backgroundColor: `${colors.primary}10`,
  },
  rosterDayCol: {
    width: 60,
  },
  rosterDayText: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  rosterDateText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  rosterShiftCol: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  rosterShiftName: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  rosterTimingText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },
  rosterStatusCol: {
    alignItems: 'flex-end',
  },
  textHighlight: {
    color: colors.primary,
    fontWeight: '800',
  },
  textMuted: {
    color: colors.text.tertiary,
    fontStyle: 'italic',
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
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  optionBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  optionBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionBtnText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  optionBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  selectionList: {
    maxHeight: 140,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  selectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  selectionItemActive: {
    backgroundColor: `${colors.primary}15`,
  },
  selectionItemTitle: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  selectionItemSub: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
    marginTop: 1,
  },
});
