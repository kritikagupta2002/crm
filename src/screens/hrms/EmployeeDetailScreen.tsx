import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  FlatList,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import { AppHeader, Card, StatusBadge, Button, EmptyState } from '../../components';
import {
  User,
  Briefcase,
  CreditCard,
  ShieldCheck,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  CalendarDays,
  FileText,
  Award,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Building2,
  ChevronRight,
  ShieldAlert,
  DollarSign,
  TrendingUp,
  Upload,
  Eye,
  FolderLock,
} from 'lucide-react-native';

type TabKey =
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

export const EmployeeDetailScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { employeeId } = route.params;
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
  const { userRole, hasRole, session } = useAuth();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const emp = employees.find(e => e.id === employeeId || e.employeeId === employeeId);

  // Active user identification
  const activeEmployeeId =
    session?.accountType === 'team' ? (session as any).employeeId : 'BGS-2021-001';
  const isOwnProfile =
    emp && (emp.id === activeEmployeeId || emp.employeeId === activeEmployeeId);

  // RBAC Rules:
  // Directory & Detail: HR & Admin have full access.
  // Regular employee can only view their own profile.
  const isHrOrAdmin = hasRole(['Admin', 'HR']);
  const canAccessThisProfile = isHrOrAdmin || isOwnProfile;

  // Salary visibility: HR, Admin, Accountant, or own profile
  const canViewSalary = hasRole(['Admin', 'HR', 'Accountant']) || isOwnProfile;

  // Cross-module data queries
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

  // Tenure calculation
  const tenureYears = useMemo(() => {
    if (!emp?.employment?.joiningDate) return '1.0';
    const joinTime = new Date(emp.employment.joiningDate).getTime();
    const now = Date.now();
    const diffYears = (now - joinTime) / (1000 * 60 * 60 * 24 * 365.25);
    return Math.max(0.1, diffYears).toFixed(1);
  }, [emp?.employment?.joiningDate]);

  // Total available leaves
  const totalAvailableLeaves = empLeaveBalances.reduce(
    (acc, b) => acc + (b.available || 0),
    0
  );

  // Phone and Email dialers
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

  if (!emp) {
    return (
      <View style={styles.container}>
        <AppHeader title="Employee Profile" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <AlertCircle size={48} color={colors.text.tertiary} />
          <Text style={styles.errorTitle}>Employee Not Found</Text>
          <Text style={styles.errorMessage}>
            No staff record matches identifier "{employeeId}".
          </Text>
          <Button
            title="Return to Directory"
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={{ marginTop: spacing.lg }}
          />
        </View>
      </View>
    );
  }

  // Privacy Protection Notice
  if (!canAccessThisProfile) {
    return (
      <View style={styles.container}>
        <AppHeader title="Staff Profile" showBack onBack={() => navigation.goBack()} />
        <View style={styles.centerContainer}>
          <ShieldAlert size={56} color={colors.warning} />
          <Text style={styles.errorTitle}>Privacy Protected Record</Text>
          <Text style={styles.errorMessage}>
            You do not have administrative authorization to inspect other employees' private records,
            salaries, or statutory KYC documents.
          </Text>
          <Button
            title="Open My Own Profile"
            variant="primary"
            onPress={() =>
              navigation.replace('EmployeeDetail', { employeeId: activeEmployeeId })
            }
            style={{ marginTop: spacing.xl, width: '100%' }}
          />
        </View>
      </View>
    );
  }

  const initials = emp.name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const tabs: { key: TabKey; label: string; count?: number }[] = [
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
  ];

  return (
    <View style={styles.container}>
      <AppHeader
        title={emp.name}
        subtitle={`${emp.employeeId} • ${emp.employment?.designation || 'Specialist'}`}
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          isHrOrAdmin ? (
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('EditEmployee', { employeeId: emp.id })}
            >
              <Edit2 size={16} color="#FFFFFF" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Hero Profile Banner */}
      <View style={styles.heroBanner}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.heroInfo}>
          <View style={styles.heroNameRow}>
            <Text style={styles.heroName}>{emp.name}</Text>
            {emp.kyc?.status === 'Verified' && (
              <View style={styles.kycVerifiedBadge}>
                <CheckCircle2 size={12} color={colors.success} />
                <Text style={styles.kycVerifiedText}>KYC</Text>
              </View>
            )}
          </View>

          <Text style={styles.heroDesig}>{emp.employment?.designation || 'Staff'}</Text>
          <Text style={styles.heroDept}>{emp.employment?.department || 'Exploration'}</Text>

          <View style={styles.heroBadges}>
            <View style={styles.empIdPill}>
              <Text style={styles.empIdPillText}>{emp.employeeId}</Text>
            </View>
            <StatusBadge status={emp.employment?.status || 'Active'} size="small" />
            <Text style={styles.roleText}>{(emp.role || 'employee').toUpperCase()}</Text>
          </View>
        </View>

        {/* Quick Contact Buttons */}
        <View style={styles.heroContactStrip}>
          {emp.phone ? (
            <TouchableOpacity style={styles.contactCircle} onPress={() => handleCall(emp.phone)}>
              <Phone size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
          {emp.email ? (
            <TouchableOpacity style={styles.contactCircle} onPress={() => handleEmail(emp.email)}>
              <Mail size={16} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Horizontal Tabs Scroll */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
          {tabs.map(t => {
            const isActive = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.tabChip, isActive && styles.tabChipActive]}
                onPress={() => setActiveTab(t.key)}
              >
                <Text style={[styles.tabChipText, isActive && styles.tabChipTextActive]}>
                  {t.label}
                  {t.count !== undefined && t.count > 0 ? ` (${t.count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Tab Content */}
      <ScrollView contentContainerStyle={styles.content}>
        {/* ============================================================ */}
        {/* TAB 1: OVERVIEW */}
        {/* ============================================================ */}
        {activeTab === 'overview' && (
          <View style={styles.tabSection}>
            {/* Quick Metrics Cards */}
            <View style={styles.kpiRow}>
              <Card style={styles.kpiCard}>
                <Calendar size={18} color={colors.primary} />
                <Text style={styles.kpiValue}>{tenureYears} yrs</Text>
                <Text style={styles.kpiLabel}>Tenure</Text>
              </Card>

              <Card style={styles.kpiCard}>
                <CalendarDays size={18} color={colors.success} />
                <Text style={[styles.kpiValue, { color: colors.success }]}>
                  {totalAvailableLeaves}
                </Text>
                <Text style={styles.kpiLabel}>Leave Balance</Text>
              </Card>

              <Card style={styles.kpiCard}>
                <Clock size={18} color={colors.warning} />
                <Text style={[styles.kpiValue, { color: colors.warning }]}>
                  {empAttendance.length}
                </Text>
                <Text style={styles.kpiLabel}>Punches</Text>
              </Card>
            </View>

            {/* Employment Quick Snapshot */}
            <Card style={styles.card}>
              <Text style={styles.sectionHeading}>Employment Snapshot</Text>
              <View style={styles.dataGrid}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Reporting Manager</Text>
                  <Text style={styles.dataValue}>
                    {emp.employment?.reportingManager || emp.employment?.managerName || 'Dr. Amit Kumar Bansal'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Joining Date</Text>
                  <Text style={styles.dataValue}>{emp.employment?.joiningDate || '2022-01-10'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Employment Type</Text>
                  <Text style={styles.dataValue}>{emp.employment?.employmentType || 'Full-Time'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Work Location</Text>
                  <Text style={styles.dataValue}>{emp.employment?.workLocation || 'Jaipur HQ'}</Text>
                </View>
                {emp.employment?.project ? (
                  <View style={[styles.dataItem, { width: '100%' }]}>
                    <Text style={styles.dataLabel}>Current Project</Text>
                    <Text style={[styles.dataValue, { color: colors.primary, fontWeight: '700' }]}>
                      {emp.employment.project}
                    </Text>
                  </View>
                ) : null}
              </View>
            </Card>

            {/* Emergency Contact Quick Card */}
            {emp.emergency?.name ? (
              <Card style={styles.card}>
                <View style={styles.emergencyHeader}>
                  <ShieldCheck size={18} color={colors.danger} />
                  <Text style={[styles.sectionHeading, { marginBottom: 0 }]}>Emergency Contact</Text>
                </View>
                <View style={styles.emergencyBody}>
                  <View>
                    <Text style={styles.emergencyName}>{emp.emergency.name}</Text>
                    <Text style={styles.emergencyRel}>{emp.emergency.relationship}</Text>
                  </View>
                  {emp.emergency?.phone ? (
                    <TouchableOpacity
                      style={styles.emergencyCallBtn}
                      onPress={() => handleCall(emp.emergency?.phone)}
                    >
                      <Phone size={14} color="#FFFFFF" />
                      <Text style={styles.emergencyCallBtnText}>{emp.emergency.phone}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </Card>
            ) : null}
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 2: PERSONAL & STATUTORY KYC */}
        {/* ============================================================ */}
        {activeTab === 'personal' && (
          <View style={styles.tabSection}>
            {/* Personal Details */}
            <Card style={styles.card}>
              <Text style={styles.sectionHeading}>Personal Information</Text>
              <View style={styles.dataGrid}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Gender</Text>
                  <Text style={styles.dataValue}>{emp.personal?.gender || 'Not specified'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Date of Birth</Text>
                  <Text style={styles.dataValue}>{emp.personal?.dob || '1995-06-15'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Blood Group</Text>
                  <Text style={styles.dataValue}>{emp.personal?.bloodGroup || 'B+'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Work Email</Text>
                  <Text style={styles.dataValue} numberOfLines={1}>{emp.email}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Personal Email</Text>
                  <Text style={styles.dataValue} numberOfLines={1}>
                    {emp.personal?.personalEmail || 'Not recorded'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Mobile Phone</Text>
                  <Text style={styles.dataValue}>{emp.phone}</Text>
                </View>
                <View style={[styles.dataItem, { width: '100%' }]}>
                  <Text style={styles.dataLabel}>Residential Address</Text>
                  <Text style={styles.dataValue}>
                    {emp.personal?.currentAddress || 'Malviya Nagar'}, {emp.personal?.city || 'Jaipur'},{' '}
                    {emp.personal?.state || 'Rajasthan'} - {emp.personal?.pincode || '302017'}
                  </Text>
                </View>
              </View>
            </Card>

            {/* Statutory KYC & Banking Master */}
            <Card style={styles.card}>
              <View style={styles.cardTitleWithBadge}>
                <Text style={styles.sectionHeading}>Statutory KYC & Banking</Text>
                <View style={styles.kycVerifiedBadge}>
                  <CheckCircle2 size={12} color={colors.success} />
                  <Text style={styles.kycVerifiedText}>VERIFIED</Text>
                </View>
              </View>

              <View style={styles.dataGrid}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Income Tax PAN</Text>
                  <Text style={[styles.dataValue, styles.monoValue]}>
                    {emp.kyc?.panNumber || 'ABCDE1234F'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>EPFO UAN</Text>
                  <Text style={[styles.dataValue, styles.monoValue]}>
                    {emp.kyc?.uanNumber || '100987654321'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Bank Name</Text>
                  <Text style={styles.dataValue}>
                    {emp.bank?.bankName || emp.kyc?.bankName || 'HDFC Bank'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Account Number</Text>
                  <Text style={[styles.dataValue, styles.monoValue]}>
                    {emp.bank?.accountNumber || emp.kyc?.bankAccount || '50100234567890'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>IFSC Code</Text>
                  <Text style={[styles.dataValue, styles.monoValue]}>
                    {emp.bank?.ifscCode || emp.kyc?.ifscCode || 'HDFC0001234'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Account Holder</Text>
                  <Text style={styles.dataValue}>
                    {emp.bank?.accountHolderName || emp.name}
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 3: JOB & ORGANIZATION */}
        {/* ============================================================ */}
        {activeTab === 'job' && (
          <View style={styles.tabSection}>
            <Card style={styles.card}>
              <Text style={styles.sectionHeading}>Organizational Placement</Text>
              <View style={styles.dataGrid}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Corporate Department</Text>
                  <Text style={[styles.dataValue, { color: colors.primary, fontWeight: '700' }]}>
                    {emp.employment?.department || 'Geology & Mineral Exploration'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Designation Title</Text>
                  <Text style={styles.dataValue}>
                    {emp.employment?.designation || 'Field Geologist'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Designation Code</Text>
                  <Text style={[styles.dataValue, styles.monoValue]}>
                    {emp.employment?.designationCode || 'SR-GEO'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>System Access Role</Text>
                  <Text style={styles.dataValue}>{(emp.role || 'employee').toUpperCase()}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Reporting Manager</Text>
                  <Text style={styles.dataValue}>
                    {emp.employment?.reportingManager || emp.employment?.managerName || 'Dr. Amit Kumar Bansal'}
                  </Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Joining Date</Text>
                  <Text style={styles.dataValue}>{emp.employment?.joiningDate || '2022-01-10'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Work Location</Text>
                  <Text style={styles.dataValue}>{emp.employment?.workLocation || 'Jaipur HQ'}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Employment Status</Text>
                  <Text style={styles.dataValue}>{emp.employment?.status || 'Active'}</Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 4: ATTENDANCE LOGS REFERENCE */}
        {/* ============================================================ */}
        {activeTab === 'attendance' && (
          <View style={styles.tabSection}>
            <Card style={styles.card}>
              <Text style={styles.sectionHeading}>Recent Attendance Punches</Text>
              {empAttendance.length === 0 ? (
                <EmptyState
                  title="No Attendance Logs"
                  message="No attendance punch records found for this employee."
                  icon={<Clock size={36} color={colors.text.tertiary} />}
                />
              ) : (
                empAttendance.slice(0, 10).map((att, i) => (
                  <View key={att.id || i} style={styles.logRow}>
                    <View style={styles.logDateBlock}>
                      <Text style={styles.logDate}>{att.date}</Text>
                      <Text style={styles.logLocation}>{att.location || 'Jaipur HQ'}</Text>
                    </View>
                    <View style={styles.logTimes}>
                      <Text style={styles.logTimeText}>In: {att.punchIn || '--:--'}</Text>
                      <Text style={styles.logTimeText}>Out: {att.punchOut || '--:--'}</Text>
                    </View>
                    <StatusBadge status={att.status} size="small" />
                  </View>
                ))
              )}
            </Card>
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 5: LEAVE BALANCES & REQUESTS */}
        {/* ============================================================ */}
        {activeTab === 'leave' && (
          <View style={styles.tabSection}>
            {/* Balances */}
            <Card style={styles.card}>
              <Text style={styles.sectionHeading}>Leave Quotas & Balances</Text>
              <View style={styles.balanceGrid}>
                {empLeaveBalances.length === 0 ? (
                  <Text style={styles.emptyNote}>Leave balances initialized automatically upon creation.</Text>
                ) : (
                  empLeaveBalances.map(b => (
                    <View key={b.leaveType} style={styles.balanceItem}>
                      <Text style={styles.balanceType}>{b.leaveType}</Text>
                      <Text style={styles.balanceAvailable}>{b.available}</Text>
                      <Text style={styles.balanceSub}>Used: {b.used} / {b.allocated}</Text>
                    </View>
                  ))
                )}
              </View>
            </Card>

            {/* Leave Requests */}
            <Card style={styles.card}>
              <Text style={styles.sectionHeading}>Recent Leave Applications</Text>
              {empLeaves.length === 0 ? (
                <Text style={styles.emptyNote}>No leave requests recorded.</Text>
              ) : (
                empLeaves.slice(0, 5).map(l => (
                  <View key={l.id} style={styles.leaveReqRow}>
                    <View>
                      <Text style={styles.leaveReqType}>{l.leaveType} ({l.daysCount || 1} Days)</Text>
                      <Text style={styles.leaveReqDates}>
                        {l.startDate} to {l.endDate}
                      </Text>
                      <Text style={styles.leaveReqReason}>{l.reason}</Text>
                    </View>
                    <StatusBadge status={l.status} size="small" />
                  </View>
                ))
              )}
            </Card>
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 6: SALARY & PAYROLL (RBAC PROTECTED) */}
        {/* ============================================================ */}
        {activeTab === 'salary' && canViewSalary && (
          <View style={styles.tabSection}>
            {salaryStructure ? (
              <Card style={styles.card}>
                <Text style={styles.sectionHeading}>Monthly Compensation Structure</Text>

                <View style={styles.salaryRow}>
                  <Text style={styles.salaryLabel}>Basic Monthly Wage</Text>
                  <Text style={styles.salaryVal}>₹{salaryStructure.baseSalary?.toLocaleString()}</Text>
                </View>
                <View style={styles.salaryRow}>
                  <Text style={styles.salaryLabel}>House Rent Allowance (HRA)</Text>
                  <Text style={styles.salaryVal}>₹{salaryStructure.hra?.toLocaleString()}</Text>
                </View>
                <View style={styles.salaryRow}>
                  <Text style={styles.salaryLabel}>Field & Special Allowance</Text>
                  <Text style={styles.salaryVal}>₹{salaryStructure.specialAllowance?.toLocaleString()}</Text>
                </View>
                <View style={[styles.salaryRow, styles.totalSalaryRow]}>
                  <Text style={styles.totalSalaryLabel}>Gross Monthly Emoluments</Text>
                  <Text style={styles.totalSalaryVal}>
                    ₹{(
                      (salaryStructure.baseSalary || 0) +
                      (salaryStructure.hra || 0) +
                      (salaryStructure.specialAllowance || 0)
                    ).toLocaleString()}
                  </Text>
                </View>

                {/* Deductions */}
                <Text style={[styles.sectionHeading, { marginTop: spacing.lg }]}>Statutory Deductions</Text>
                <View style={styles.salaryRow}>
                  <Text style={styles.salaryLabel}>Provident Fund (PF - 12%)</Text>
                  <Text style={[styles.salaryVal, { color: colors.danger }]}>
                    -₹{salaryStructure.pfDeduction?.toLocaleString() || '1,800'}
                  </Text>
                </View>
                <View style={styles.salaryRow}>
                  <Text style={styles.salaryLabel}>Professional Tax (PT)</Text>
                  <Text style={[styles.salaryVal, { color: colors.danger }]}>
                    -₹{salaryStructure.ptDeduction?.toLocaleString() || '200'}
                  </Text>
                </View>
                <View style={[styles.salaryRow, styles.netSalaryRow]}>
                  <Text style={styles.netSalaryLabel}>Net Take-Home Pay</Text>
                  <Text style={styles.netSalaryVal}>
                    ₹{salaryStructure.netSalary?.toLocaleString() || '52,000'}
                  </Text>
                </View>
              </Card>
            ) : (
              <Card style={styles.card}>
                <Text style={styles.sectionHeading}>Salary Baseline</Text>
                <View style={styles.salaryRow}>
                  <Text style={styles.salaryLabel}>Contract Base Salary</Text>
                  <Text style={styles.salaryVal}>₹{(emp.baseSalary || 50000).toLocaleString()}</Text>
                </View>
                <Text style={styles.helperNotice}>
                  Detailed salary structure will be processed when payroll cycles run.
                </Text>
              </Card>
            )}

            {/* Payslips History */}
            <Card style={styles.card}>
              <Text style={styles.sectionHeading}>Issued Payslips</Text>
              {empPayslips.length === 0 ? (
                <Text style={styles.emptyNote}>No historical payslips generated yet.</Text>
              ) : (
                empPayslips.map(ps => (
                  <View key={ps.id} style={styles.payslipRow}>
                    <View>
                      <Text style={styles.payslipMonth}>{ps.month} {ps.year}</Text>
                      <Text style={styles.payslipNet}>Net: ₹{ps.netSalary?.toLocaleString()}</Text>
                    </View>
                    <StatusBadge status={ps.status || 'Paid'} size="small" />
                  </View>
                ))
              )}
            </Card>
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 7: EXPENSES & REIMBURSEMENTS */}
        {/* ============================================================ */}
        {activeTab === 'expenses' && (
          <View style={styles.tabSection}>
            <Card style={styles.card}>
              <Text style={styles.sectionHeading}>Expense Claims</Text>
              {empExpenses.length === 0 ? (
                <Text style={styles.emptyNote}>No expense claims filed.</Text>
              ) : (
                empExpenses.map(exp => (
                  <View key={exp.id} style={styles.claimRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.claimCategory}>{exp.category} - {exp.project}</Text>
                      <Text style={styles.claimDesc}>{exp.description}</Text>
                      <Text style={styles.claimDate}>{exp.date}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={styles.claimAmount}>₹{exp.requestedAmount?.toLocaleString()}</Text>
                      <StatusBadge status={exp.status} size="small" />
                    </View>
                  </View>
                ))
              )}
            </Card>

            <Card style={styles.card}>
              <Text style={styles.sectionHeading}>Travel Reimbursements</Text>
              {empReimbursements.length === 0 ? (
                <Text style={styles.emptyNote}>No travel reimbursement claims filed.</Text>
              ) : (
                empReimbursements.map(reim => (
                  <View key={reim.id} style={styles.claimRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.claimCategory}>{reim.tripPurpose}</Text>
                      <Text style={styles.claimDesc}>{reim.origin} → {reim.destination}</Text>
                      <Text style={styles.claimDate}>{reim.departureDate}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={styles.claimAmount}>₹{reim.totalClaimAmount?.toLocaleString()}</Text>
                      <StatusBadge status={reim.status} size="small" />
                    </View>
                  </View>
                ))
              )}
            </Card>
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 8: PERFORMANCE APPRAISALS */}
        {/* ============================================================ */}
        {activeTab === 'performance' && (
          <View style={styles.tabSection}>
            {empAppraisals.length === 0 ? (
              <Card style={styles.card}>
                <EmptyState
                  title="No Appraisal Records"
                  message="No formal performance reviews have been filed for this employee yet."
                  icon={<Award size={40} color={colors.text.tertiary} />}
                />
              </Card>
            ) : (
              empAppraisals.map(appr => (
                <Card key={appr.id} style={styles.card}>
                  <View style={styles.apprHeader}>
                    <View>
                      <Text style={styles.apprCycle}>{appr.cycle}</Text>
                      <Text style={styles.apprReviewer}>Reviewer: {appr.reviewerName}</Text>
                    </View>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreText}>{appr.overallScore} / 5.0</Text>
                    </View>
                  </View>

                  {/* Ratings Breakdown */}
                  <View style={styles.ratingsList}>
                    <View style={styles.ratingRow}>
                      <Text style={styles.ratingName}>Technical Competency</Text>
                      <Text style={styles.ratingScore}>{appr.ratings.technicalCompetency} / 5</Text>
                    </View>
                    <View style={styles.ratingRow}>
                      <Text style={styles.ratingName}>Field Execution & Rig Rigor</Text>
                      <Text style={styles.ratingScore}>{appr.ratings.fieldExecution} / 5</Text>
                    </View>
                    <View style={styles.ratingRow}>
                      <Text style={styles.ratingName}>HSE & Safety Standards</Text>
                      <Text style={styles.ratingScore}>{appr.ratings.safetyHse} / 5</Text>
                    </View>
                    <View style={styles.ratingRow}>
                      <Text style={styles.ratingName}>Team Leadership</Text>
                      <Text style={styles.ratingScore}>{appr.ratings.leadership} / 5</Text>
                    </View>
                  </View>

                  {/* Feedback */}
                  <View style={styles.feedbackBlock}>
                    <Text style={styles.feedbackLabel}>Manager Feedback:</Text>
                    <Text style={styles.feedbackText}>{appr.managerFeedback}</Text>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* ============================================================ */}
        {/* TAB 9: EXIT & CLEARANCE */}
        {/* ============================================================ */}
        {activeTab === 'exit' && empExit && (
          <View style={styles.tabSection}>
            <Card style={styles.card}>
              <View style={styles.exitHeader}>
                <LogOut size={20} color={colors.danger} />
                <Text style={styles.sectionHeading}>Exit & Full & Final Status</Text>
              </View>

              <View style={styles.dataGrid}>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Exit Type</Text>
                  <Text style={styles.dataValue}>{empExit.exitType}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Resignation Date</Text>
                  <Text style={styles.dataValue}>{empExit.resignationDate}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Last Working Day (LWD)</Text>
                  <Text style={styles.dataValue}>{empExit.approvedLWD}</Text>
                </View>
                <View style={styles.dataItem}>
                  <Text style={styles.dataLabel}>Clearance Status</Text>
                  <Text style={[styles.dataValue, { color: colors.warning, fontWeight: '700' }]}>
                    {empExit.status}
                  </Text>
                </View>
              </View>

              {/* Department Clearances */}
              <Text style={[styles.sectionHeading, { marginTop: spacing.md }]}>Department NOC Clearances</Text>
              {empExit.clearances.map(c => (
                <View key={c.id} style={styles.clearanceItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.clearanceDept}>{c.department}</Text>
                    <Text style={styles.clearanceReviewer}>{c.reviewerName}</Text>
                    <Text style={styles.clearanceNotes}>{c.checklistNotes}</Text>
                  </View>
                  <StatusBadge status={c.status} size="small" />
                </View>
              ))}

              {/* FnF Settlement */}
              {empExit.fnf && (
                <View style={styles.fnfBox}>
                  <Text style={styles.fnfTitle}>Full & Final Settlement (FnF)</Text>
                  <View style={styles.salaryRow}>
                    <Text style={styles.salaryLabel}>Gross Payable</Text>
                    <Text style={styles.salaryVal}>₹{empExit.fnf.grossPayable?.toLocaleString()}</Text>
                  </View>
                  <View style={styles.salaryRow}>
                    <Text style={styles.salaryLabel}>Total Deductions</Text>
                    <Text style={[styles.salaryVal, { color: colors.danger }]}>
                      -₹{empExit.fnf.totalDeductions?.toLocaleString()}
                    </Text>
                  </View>
                  <View style={[styles.salaryRow, styles.netSalaryRow]}>
                    <Text style={styles.netSalaryLabel}>Net Disbursed Settlement</Text>
                    <Text style={styles.netSalaryVal}>₹{empExit.fnf.netPayable?.toLocaleString()}</Text>
                  </View>
                </View>
              )}
            </Card>
          </View>
        )}

        {/* ========================================== */}
        {/* DOCUMENTS & KYC TAB */}
        {/* ========================================== */}
        {activeTab === 'documents' && (
          <View style={styles.tabSection}>
            <Card style={styles.card}>
              <View style={styles.cardTitleWithBadge}>
                <Text style={styles.sectionHeading}>Verified Credentials & Document Dossier</Text>
                <TouchableOpacity
                  style={styles.manageDocsBtn}
                  onPress={() =>
                    navigation.navigate('EmployeeDocuments', {
                      employeeId: emp.employeeId,
                    })
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.manageDocsBtnText}>Manage Dossier</Text>
                  <ChevronRight size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {empDocuments.length === 0 ? (
                <View style={styles.emptyDocsBox}>
                  <FileText size={32} color={colors.text.tertiary} />
                  <Text style={styles.emptyDocsText}>
                    No verified credentials or KYC records uploaded for this employee yet.
                  </Text>
                  <TouchableOpacity
                    style={styles.uploadDocPromptBtn}
                    onPress={() =>
                      navigation.navigate('EmployeeDocuments', {
                        employeeId: emp.employeeId,
                      })
                    }
                  >
                    <Upload size={14} color="#FFFFFF" />
                    <Text style={styles.uploadDocPromptBtnText}>Upload Credential</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.docCardsList}>
                  {empDocuments.map((doc) => {
                    const isLicense =
                      doc.documentType.includes('DGMS') || doc.documentType.includes('Pilot');
                    return (
                      <View key={doc.id} style={styles.docRowCard}>
                        <View style={styles.docRowIconWrap}>
                          {isLicense ? (
                            <Award size={20} color="#4F46E5" />
                          ) : (
                            <FileText size={20} color={colors.primary} />
                          )}
                        </View>

                        <View style={styles.docRowInfo}>
                          <Text style={styles.docRowType}>{doc.documentType}</Text>
                          <Text style={styles.docRowMeta}>
                            {doc.fileName} • {doc.fileSize}
                          </Text>
                          <Text style={styles.docRowDate}>
                            Uploaded: {doc.uploadedOn}
                            {doc.expiryDate ? ` • Expires: ${doc.expiryDate}` : ' • Lifetime'}
                          </Text>
                        </View>

                        <View style={styles.docRowRight}>
                          <StatusBadge
                            status={
                              doc.status === 'Verified'
                                ? 'approved'
                                : doc.status === 'Pending Review'
                                ? 'pending'
                                : 'rejected'
                            }
                            customLabel={doc.status}
                            size="small"
                          />

                          <TouchableOpacity
                            style={styles.docRowInspectBtn}
                            onPress={() =>
                              navigation.navigate('EmployeeDocuments', {
                                employeeId: emp.employeeId,
                              })
                            }
                          >
                            <Eye size={14} color={colors.primary} />
                            <Text style={styles.docRowInspectText}>Inspect</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </Card>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  editBtnText: {
    ...typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    gap: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primaryLight,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    ...typography.h3,
    fontWeight: '800',
    color: colors.primary,
  },
  heroInfo: {
    flex: 1,
  },
  heroNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroName: {
    ...typography.h4,
    fontWeight: '800',
    color: colors.text.primary,
    flexShrink: 1,
  },
  kycVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  kycVerifiedText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.success,
  },
  heroDesig: {
    ...typography.bodySmall,
    color: colors.primary,
    fontWeight: '700',
  },
  heroDept: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  heroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  empIdPill: {
    backgroundColor: colors.background.tertiary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  empIdPillText: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.secondary,
  },
  roleText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  heroContactStrip: {
    gap: spacing.sm,
  },
  contactCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsContainer: {
    backgroundColor: colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  tabsScroll: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  tabChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  tabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  tabSection: {
    gap: spacing.md,
  },
  kpiRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kpiCard: {
    flex: 1,
    padding: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    gap: 2,
  },
  kpiValue: {
    ...typography.h4,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4,
  },
  kpiLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  sectionHeading: {
    ...typography.bodyLarge,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  cardTitleWithBadge: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  dataGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
  },
  dataItem: {
    width: '50%',
    paddingRight: spacing.sm,
  },
  dataLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  dataValue: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  monoValue: {
    fontFamily: 'monospace',
    color: colors.primary,
  },
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  emergencyBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  emergencyName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emergencyRel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  emergencyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.danger,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  emergencyCallBtnText: {
    ...typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  logDateBlock: {
    gap: 2,
  },
  logDate: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  logLocation: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  logTimes: {
    alignItems: 'center',
  },
  logTimeText: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.secondary,
  },
  balanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  balanceItem: {
    width: '48%',
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
  },
  balanceType: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  balanceAvailable: {
    ...typography.h3,
    fontWeight: '800',
    color: colors.success,
  },
  balanceSub: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.tertiary,
  },
  leaveReqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  leaveReqType: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  leaveReqDates: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  leaveReqReason: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
    fontStyle: 'italic',
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  salaryLabel: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  salaryVal: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  totalSalaryRow: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  totalSalaryLabel: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  totalSalaryVal: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.primary,
  },
  netSalaryRow: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  netSalaryLabel: {
    ...typography.body,
    fontWeight: '800',
    color: colors.success,
  },
  netSalaryVal: {
    ...typography.h4,
    fontWeight: '800',
    color: colors.success,
  },
  payslipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  payslipMonth: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  payslipNet: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  claimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  claimCategory: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  claimDesc: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  claimDate: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  claimAmount: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.primary,
  },
  apprHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  apprCycle: {
    ...typography.bodyLarge,
    fontWeight: '800',
    color: colors.text.primary,
  },
  apprReviewer: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  scoreBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  scoreText: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: colors.primary,
  },
  ratingsList: {
    gap: 4,
    marginBottom: spacing.md,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  ratingName: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  ratingScore: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  feedbackBlock: {
    backgroundColor: colors.background.secondary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  feedbackLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.tertiary,
    textTransform: 'uppercase',
  },
  feedbackText: {
    ...typography.bodySmall,
    color: colors.text.primary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  exitHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  clearanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  clearanceDept: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  clearanceReviewer: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
  },
  clearanceNotes: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 10,
  },
  fnfBox: {
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
  },
  fnfTitle: {
    ...typography.body,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  emptyNote: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
  },
  helperNotice: {
    ...typography.caption,
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  errorTitle: {
    ...typography.h3,
    fontWeight: '800',
    color: colors.text.primary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  errorMessage: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  manageDocsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  manageDocsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  emptyDocsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  emptyDocsText: {
    ...typography.caption,
    color: colors.text.tertiary,
    textAlign: 'center',
    maxWidth: 240,
  },
  uploadDocPromptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  uploadDocPromptBtnText: {
    ...typography.bodySmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  docCardsList: {
    gap: spacing.sm,
  },
  docRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    gap: spacing.sm,
  },
  docRowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  docRowInfo: {
    flex: 1,
  },
  docRowType: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  docRowMeta: {
    ...typography.caption,
    fontFamily: 'monospace',
    color: colors.text.tertiary,
    fontSize: 10,
    marginTop: 1,
  },
  docRowDate: {
    ...typography.caption,
    color: colors.text.secondary,
    fontSize: 10,
    marginTop: 2,
  },
  docRowRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  docRowInspectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#EFF6FF',
  },
  docRowInspectText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
});
