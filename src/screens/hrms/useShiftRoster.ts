import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useHrms, useAuth } from '../../context';
import { Shift } from '../../types';

export const useShiftRoster = () => {
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

  const currentEmpId =
    session?.accountType === 'team'
      ? (session as any).employeeId || 'BGS-2021-001'
      : 'BGS-2021-001';

  const [activeTab, setActiveTab] = useState<'shifts' | 'assignments'>('shifts');
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');
  const [selectedShiftFilter, setSelectedShiftFilter] = useState('All');

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

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignEmpId, setAssignEmpId] = useState('');
  const [assignShiftId, setAssignShiftId] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('2026-10-01');
  const [assignWeeklyOff, setAssignWeeklyOff] = useState('Sunday');
  const [assignErrors, setAssignErrors] = useState<Record<string, string>>({});

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshHrms();
    setRefreshing(false);
  };

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

  const weeklyRoster = useMemo(
    () => [
      {
        day: 'Mon',
        date: '22 Sep',
        shift: myShift?.name || 'General Corporate Shift (HQ)',
        timing: `${myShift?.startTime || '09:30 AM'} – ${myShift?.endTime || '06:00 PM'}`,
        status: 'Completed',
      },
      {
        day: 'Tue',
        date: '23 Sep',
        shift: myShift?.name || 'General Corporate Shift (HQ)',
        timing: `${myShift?.startTime || '09:30 AM'} – ${myShift?.endTime || '06:00 PM'}`,
        status: 'Completed',
      },
      {
        day: 'Wed',
        date: '24 Sep',
        shift: myShift?.name || 'General Corporate Shift (HQ)',
        timing: `${myShift?.startTime || '09:30 AM'} – ${myShift?.endTime || '06:00 PM'}`,
        status: 'Completed',
      },
      {
        day: 'Thu',
        date: '25 Sep',
        shift: myShift?.name || 'General Corporate Shift (HQ)',
        timing: `${myShift?.startTime || '09:30 AM'} – ${myShift?.endTime || '06:00 PM'}`,
        status: 'Completed',
      },
      {
        day: 'Fri',
        date: '26 Sep',
        shift: myShift?.name || 'General Corporate Shift (HQ)',
        timing: `${myShift?.startTime || '09:30 AM'} – ${myShift?.endTime || '06:00 PM'}`,
        status: 'Active Today',
      },
      {
        day: 'Sat',
        date: '27 Sep',
        shift: 'Weekly Off',
        timing: '—',
        status: 'Weekly Off',
      },
      {
        day: 'Sun',
        date: '28 Sep',
        shift: 'Weekly Off',
        timing: '—',
        status: 'Weekly Off',
      },
    ],
    [myShift]
  );

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

  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    shiftAssignments.forEach((a) => {
      if (a.department) set.add(a.department);
    });
    return ['All', ...Array.from(set)];
  }, [shiftAssignments]);

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
        Alert.alert(
          'Shift Created',
          `New shift "${shiftName}" was created successfully.`
        );
      }
      setShowShiftModal(false);
    } catch (e: any) {
      Alert.alert('Validation Error', e.message || 'Failed to save shift.');
    }
  };

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
              Alert.alert(
                'Referential Integrity Guard',
                err.message || 'Cannot delete shift.'
              );
            }
          },
        },
      ]
    );
  };

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

  return {
    isHRAdmin,
    myShift,
    weeklyRoster,
    shifts,
    shiftAssignments,
    employees,
    activeTab,
    setActiveTab,
    refreshing,
    onRefresh,
    search,
    setSearch,
    selectedDeptFilter,
    setSelectedDeptFilter,
    departmentsList,
    filteredShifts,
    filteredAssignments,
    showShiftModal,
    setShowShiftModal,
    editingShift,
    shiftName,
    setShiftName,
    shiftCode,
    setShiftCode,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    breakDuration,
    setBreakDuration,
    gracePeriod,
    setGracePeriod,
    weeklyOff,
    setWeeklyOff,
    location,
    setLocation,
    shiftStatus,
    setShiftStatus,
    description,
    setDescription,
    shiftErrors,
    handleSaveShift,
    handleOpenCreateShift,
    handleOpenEditShift,
    handleDeleteShift,
    showAssignModal,
    setShowAssignModal,
    assignEmpId,
    setAssignEmpId,
    assignShiftId,
    setAssignShiftId,
    effectiveFrom,
    setEffectiveFrom,
    assignWeeklyOff,
    setAssignWeeklyOff,
    handleOpenAssignModal,
    handleSaveAssignment,
  };
};
