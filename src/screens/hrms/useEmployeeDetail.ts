import { useState, useMemo } from 'react';
import { Alert, Linking } from 'react-native';
import { useHrms, useAuth } from '../../context';

export type TabKey =
  | 'overview'
  | 'personal'
  | 'job'
  | 'documents'
  | 'attendance'
  | 'leave'
  | 'salary'
  | 'expenses'
  | 'performance'
  | 'exit';

export const useEmployeeDetail = (employeeId: string) => {
  const {
    employees,
    attendance,
    leaveBalances,
    leaves,
    salaryStructures,
    payslips,
    expenses,
    reimbursements,
    appraisals,
    exits,
    employeeDocuments,
  } = useHrms();
  const { hasRole, session } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId);

  const activeEmployeeId =
    session?.accountType === 'team' ? (session as any).employeeId : 'BGS-2021-001';
  const isOwnProfile =
    emp && (emp.id === activeEmployeeId || emp.employeeId === activeEmployeeId);

  const isHrOrAdmin = hasRole(['Admin', 'HR']);
  const canAccessThisProfile = isHrOrAdmin || isOwnProfile;

  const canViewSalary = hasRole(['Admin', 'HR', 'Accountant']) || isOwnProfile;

  const empLeaveBalances = useMemo(
    () => leaveBalances.filter(b => b.employeeId === emp?.employeeId),
    [leaveBalances, emp]
  );
  const empLeaves = useMemo(
    () => leaves.filter(l => l.employeeId === emp?.employeeId),
    [leaves, emp]
  );
  const empAttendance = useMemo(
    () => attendance.filter(a => a.employeeId === emp?.employeeId),
    [attendance, emp]
  );
  const salaryStructure = useMemo(
    () => salaryStructures.find(s => s.employeeId === emp?.employeeId),
    [salaryStructures, emp]
  );
  const empPayslips = useMemo(
    () => payslips.filter(p => p.employeeId === emp?.employeeId),
    [payslips, emp]
  );
  const empExpenses = useMemo(
    () => expenses.filter(e => e.employeeId === emp?.employeeId),
    [expenses, emp]
  );
  const empReimbursements = useMemo(
    () => reimbursements.filter(r => r.employeeId === emp?.employeeId),
    [reimbursements, emp]
  );
  const empAppraisals = useMemo(
    () => appraisals.filter(a => a.employeeId === emp?.employeeId),
    [appraisals, emp]
  );
  const empExit = useMemo(
    () => exits.find(e => e.employeeId === emp?.employeeId),
    [exits, emp]
  );
  const empDocuments = useMemo(
    () => employeeDocuments.filter(d => d.employeeId === emp?.employeeId),
    [employeeDocuments, emp]
  );

  const tenureYears = useMemo(() => {
    if (!emp?.employment?.joiningDate) return '1.0';
    const joinTime = new Date(emp.employment.joiningDate).getTime();
    const now = Date.now();
    const diffYears = (now - joinTime) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0.1, diffYears).toFixed(1);
  }, [emp?.employment?.joiningDate]);

  const totalAvailableLeaves = empLeaveBalances.reduce(
    (acc, b) => acc + (b.available || 0),
    0
  );

  const handleCall = (phone?: string) => {
    if (!phone) {
      Alert.alert('No Phone', 'No contact number registered.');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      Alert.alert('Error', 'Unable to initiate call.');
    });
  };

  const handleEmail = (email?: string) => {
    if (!email) {
      Alert.alert('No Email', 'No email address registered.');
      return;
    }
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Unable to open mail client.');
    });
  };

  const initials = emp
    ? emp.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '';

  const tabs: { key: TabKey; label: string; count?: number }[] = useMemo(() => [
    { key: 'overview', label: 'Overview' },
    { key: 'personal', label: 'KYC & Personal' },
    { key: 'documents', label: 'Documents / KYC', count: empDocuments.length },
    { key: 'job', label: 'Job & Org' },
    { key: 'attendance', label: 'Attendance', count: empAttendance.length },
    { key: 'leave', label: 'Leave', count: empLeaves.length },
    ...(canViewSalary ? [{ key: 'salary' as TabKey, label: 'Salary & Payroll' }] : []),
    { key: 'expenses', label: 'Claims', count: empExpenses.length + empReimbursements.length },
    { key: 'performance', label: 'Performance', count: empAppraisals.length },
    ...(empExit ? [{ key: 'exit' as TabKey, label: 'Exit & FnF' }] : []),
  ], [empDocuments.length, empAttendance.length, empLeaves.length, canViewSalary, empExpenses.length, empReimbursements.length, empAppraisals.length, empExit]);

  return {
    emp,
    activeEmployeeId,
    isOwnProfile,
    isHrOrAdmin,
    canAccessThisProfile,
    canViewSalary,
    activeTab,
    setActiveTab,
    tabs,
    initials,
    tenureYears,
    totalAvailableLeaves,
    empLeaveBalances,
    empLeaves,
    empAttendance,
    salaryStructure,
    empPayslips,
    empExpenses,
    empReimbursements,
    empAppraisals,
    empExit,
    empDocuments,
    handleCall,
    handleEmail,
  };
};
