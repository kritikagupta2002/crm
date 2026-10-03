import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { AppHeader, Card, StatCard, StatusBadge } from '../../components/common';
import {
  Users,
  Clock,
  CalendarCheck,
  Building2,
  Calendar,
  CreditCard,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  Fingerprint,
  CalendarDays,
  FileEdit,
  UserCheck,
  UserX,
  ClockAlert,
  CalendarOff,
  MapPin,
  Sparkles,
  FileText,
  FolderLock,
  BarChart3,
} from 'lucide-react-native';
import { getAttendanceMetrics } from '../../constants/attendance';

export const HrmsOverviewScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { employees, attendance, leaves, corrections, todayAttendance } = useHrms();
  const { session, userRole, hasRole } = useAuth();

  const isHrOrAdmin = hasRole(['Admin', 'HR']);
  const isEmployee = !isHrOrAdmin;
  const activeEmpId = (session as any)?.employeeId || (isHrOrAdmin ? 'BGS-2021-001' : 'BGS-2023-044');
  const activeEmpName = (session as any)?.name || 'Team Member';

  // Dynamic calculations: "Zero Fake Numbers" engine
  const metrics = getAttendanceMetrics(employees, attendance, leaves, corrections);

  // Employee-specific calculations for Employee mode
  const todayStr = new Date().toISOString().split('T')[0];
  const myTodayRecord = attendance.find((a) => a.employeeId === activeEmpId && a.date === todayStr) || todayAttendance;
  const myTotalRecords = attendance.filter((a) => a.employeeId === activeEmpId);
  const myPresentDays = myTotalRecords.filter(
    (a) => a.status === 'Present' || a.status === 'Field Duty' || a.status === 'Late'
  ).length;
  const myLateCount = myTotalRecords.filter((a) => a.status === 'Late' || (a.lateBy && a.lateBy !== '-')).length;
  const myPendingCorrections = corrections.filter(
    (c) => c.employeeId === activeEmpId && c.status === 'Pending'
  ).length;

  const pendingLeavesCount = leaves.filter((l) => l.status === 'Pending').length;

  return (
    <View style={styles.container}>
      <AppHeader
        title={isHrOrAdmin ? 'HRMS Command Center' : 'My Workforce Portal'}
        subtitle={
          isHrOrAdmin
            ? 'Live biometric muster, field site compliance & payroll'
            : `Welcome back, ${activeEmpName}`
        }
        showBack
        onBack={() => navigation.goBack()}
        onNotificationPress={() => navigation.navigate('Notifications')}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Operational Mode Header Banner */}
        <View style={styles.modePillContainer}>
          <View style={[styles.modePill, isHrOrAdmin ? styles.modePillHr : styles.modePillEmp]}>
            <Sparkles size={12} color={isHrOrAdmin ? colors.primary : '#059669'} />
            <Text style={[styles.modePillText, isHrOrAdmin ? styles.modePillTextHr : styles.modePillTextEmp]}>
              {isHrOrAdmin ? 'HR / Managerial Governance Mode' : 'Employee Self-Service Mode'}
            </Text>
          </View>
        </View>

        {/* Attention Banner if Pending Corrections or Approvals */}
        {isHrOrAdmin && pendingLeavesCount > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('LeaveApprovals')}
          >
            <Card style={styles.actionBanner}>
              <View style={[styles.bannerIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <ShieldCheck size={20} color={colors.primary} />
              </View>
              <View style={styles.bannerTextWrap}>
                <Text style={styles.bannerTitle}>Leave Approvals Queue</Text>
                <Text style={styles.bannerSubtitle}>
                  {pendingLeavesCount} employee leave application{pendingLeavesCount > 1 ? 's' : ''} awaiting review & muster backfill.
                </Text>
              </View>
              <ChevronRight size={18} color={colors.text.tertiary} />
            </Card>
          </TouchableOpacity>
        )}

        {isHrOrAdmin && metrics.pendingCorrections > 0 && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AttendanceCorrections')}
          >
            <Card style={styles.actionBanner}>
              <View style={styles.bannerIconWrap}>
                <ShieldAlert size={20} color={colors.semantic.warning} />
              </View>
              <View style={styles.bannerTextWrap}>
                <Text style={styles.bannerTitle}>Attendance Regularizations Pending</Text>
                <Text style={styles.bannerSubtitle}>
                  {metrics.pendingCorrections} employee correction request{metrics.pendingCorrections > 1 ? 's' : ''} awaiting your review.
                </Text>
              </View>
              <ChevronRight size={18} color={colors.text.tertiary} />
            </Card>
          </TouchableOpacity>
        )}

        {/* Dynamic KPI Section */}
        {isHrOrAdmin ? (
          /* HR / Admin 6-Metric Command Grid */
          <View style={styles.kpiSection}>
            <Text style={styles.sectionHeader}>LIVE TODAY'S MUSTER</Text>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCol}>
                <StatCard
                  title="PRESENT TODAY"
                  value={String(metrics.presentCount)}
                  caption={`${metrics.presentPct}% of ${metrics.totalStaff} Staff`}
                  icon={<UserCheck size={18} color={colors.semantic.success} />}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="ABSENT"
                  value={String(metrics.absentCount)}
                  caption="Unplanned Absence"
                  icon={<UserX size={18} color={colors.semantic.danger} />}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="LATE ARRIVALS"
                  value={String(metrics.lateCount)}
                  caption="In Grace Window"
                  icon={<ClockAlert size={18} color={colors.semantic.warning} />}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="ON LEAVE"
                  value={String(metrics.leaveCount)}
                  caption="Approved Leaves"
                  icon={<CalendarOff size={18} color="#8B5CF6" />}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="FIELD DEPLOYED"
                  value={String(metrics.fieldCount)}
                  caption="Bhilwara & Mines"
                  icon={<Fingerprint size={18} color="#0D9488" />}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="CORRECTIONS"
                  value={String(metrics.pendingCorrections)}
                  caption="Action Required"
                  icon={<FileEdit size={18} color={colors.primary} />}
                />
              </View>
            </View>
          </View>
        ) : (
          /* Employee Self-Service 4-Metric Grid */
          <View style={styles.kpiSection}>
            <Text style={styles.sectionHeader}>MY ATTENDANCE SNAPSHOT</Text>
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCol}>
                <StatCard
                  title="PUNCH TODAY"
                  value={myTodayRecord?.punchIn || 'Not Yet'}
                  caption={myTodayRecord?.punchOut && myTodayRecord.punchOut !== '-' ? `Out: ${myTodayRecord.punchOut}` : 'Shift In Progress'}
                  icon={<Clock size={18} color={colors.primary} />}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="PRESENT DAYS"
                  value={`${myPresentDays} Days`}
                  caption="This Pay Period"
                  icon={<CalendarDays size={18} color={colors.semantic.success} />}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="LATE MARKS"
                  value={String(myLateCount)}
                  caption="Within Grace"
                  icon={<ClockAlert size={18} color={colors.semantic.warning} />}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="CORRECTIONS"
                  value={String(myPendingCorrections)}
                  caption={myPendingCorrections > 0 ? 'Pending Review' : 'Nil Pending'}
                  icon={<FileEdit size={18} color="#8B5CF6" />}
                />
              </View>
            </View>
          </View>
        )}

        {/* Quick Launchpad for Attendance Features */}
        <View style={styles.launchpadSection}>
          <Text style={styles.sectionHeader}>ATTENDANCE WORKSPACE</Text>
          <View style={styles.launchpadGrid}>
            <TouchableOpacity
              style={styles.launchpadCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Attendance')}
            >
              <View style={[styles.launchpadIcon, { backgroundColor: '#EFF6FF' }]}>
                <Clock size={20} color={colors.primary} />
              </View>
              <Text style={styles.launchpadTitle}>
                {isHrOrAdmin ? "Today's Attendance" : 'Punch In / Out'}
              </Text>
              <Text style={styles.launchpadDesc}>
                {isHrOrAdmin ? 'Live punch ledger & status' : 'Geo-tag biometric check-in'}
              </Text>
            </TouchableOpacity>

            {isHrOrAdmin && (
              <TouchableOpacity
                style={styles.launchpadCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('DailyAttendance')}
              >
                <View style={[styles.launchpadIcon, { backgroundColor: '#F0FDF4' }]}>
                  <Fingerprint size={20} color="#16A34A" />
                </View>
                <Text style={styles.launchpadTitle}>Daily Register</Text>
                <Text style={styles.launchpadDesc}>Day-specific shift compliance</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.launchpadCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('MonthlyAttendance')}
            >
              <View style={[styles.launchpadIcon, { backgroundColor: '#FAF5FF' }]}>
                <CalendarDays size={20} color="#9333EA" />
              </View>
              <Text style={styles.launchpadTitle}>Monthly Matrix</Text>
              <Text style={styles.launchpadDesc}>
                {isHrOrAdmin ? 'Company 30-day muster' : 'Personal monthly matrix'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.launchpadCard}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('AttendanceCorrections')}
            >
              <View style={[styles.launchpadIcon, { backgroundColor: '#FFFBEB' }]}>
                <FileEdit size={20} color="#D97706" />
              </View>
              <Text style={styles.launchpadTitle}>Corrections</Text>
              <Text style={styles.launchpadDesc}>
                {isHrOrAdmin ? 'Sign off missed punches' : 'Submit regularization'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Other Workforce Modules */}
        <View style={styles.modulesSection}>
          <Text style={styles.sectionHeader}>ALL WORKFORCE MODULES</Text>

          <Card
            style={styles.moduleCard}
            onPress={() => navigation.navigate('Leave')}
          >
            <View style={[styles.moduleIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <CalendarCheck size={20} color="#2563EB" />
            </View>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>Leave Management</Text>
              <Text style={styles.moduleSubtitle}>Annual quotas, casual leave & approvals</Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </Card>

          <Card
            style={styles.moduleCard}
            onPress={() => navigation.navigate('EmployeeDirectory')}
          >
            <View style={[styles.moduleIconCircle, { backgroundColor: '#F3E8FF' }]}>
              <Users size={20} color="#9333EA" />
            </View>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>Employee Directory</Text>
              <Text style={styles.moduleSubtitle}>Staff KYC, contacts & designations</Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </Card>

          <Card
            style={styles.moduleCard}
            onPress={() => navigation.navigate('Organization')}
          >
            <View style={[styles.moduleIconCircle, { backgroundColor: '#FDF2F8' }]}>
              <Building2 size={20} color="#DB2777" />
            </View>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>Organization Structure</Text>
              <Text style={styles.moduleSubtitle}>Departments & designation grading</Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </Card>

          <Card
            style={styles.moduleCard}
            onPress={() => navigation.navigate('Shifts')}
          >
            <View style={[styles.moduleIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Calendar size={20} color="#D97706" />
            </View>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>Shifts & Rosters</Text>
              <Text style={styles.moduleSubtitle}>Corporate HQ, mine site & field schedules</Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </Card>

          <Card
            style={styles.moduleCard}
            onPress={() => navigation.navigate('Payroll')}
          >
            <View style={[styles.moduleIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <CreditCard size={20} color="#059669" />
            </View>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>Payroll & Statutory</Text>
              <Text style={styles.moduleSubtitle}>Salary slips, EPF, ESI & TDS</Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </Card>

          <Card
            style={styles.moduleCard}
            onPress={() => navigation.navigate('HrDocuments')}
          >
            <View style={[styles.moduleIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <FileText size={20} color="#2563EB" />
            </View>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>HR Documents & Vault</Text>
              <Text style={styles.moduleSubtitle}>Policies, SOPs, compliance guidelines & circulars</Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </Card>

          <Card
            style={styles.moduleCard}
            onPress={() => navigation.navigate('EmployeeDocuments')}
          >
            <View style={[styles.moduleIconCircle, { backgroundColor: '#F0FDF4' }]}>
              <FolderLock size={20} color="#059669" />
            </View>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>
                {isHrOrAdmin ? 'Employee KYC Document Vault' : 'My Documents & Credentials'}
              </Text>
              <Text style={styles.moduleSubtitle}>
                {isHrOrAdmin
                  ? 'Aadhaar, PAN, degrees & statutory DGMS/Drone licenses'
                  : 'Personal identity cards, certifications & statutory licenses'}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </Card>

          <Card
            style={styles.moduleCard}
            onPress={() => navigation.navigate('MisReports')}
          >
            <View style={[styles.moduleIconCircle, { backgroundColor: '#F0FDFA' }]}>
              <BarChart3 size={20} color="#0D9488" />
            </View>
            <View style={styles.moduleContent}>
              <Text style={styles.moduleTitle}>MIS Analytics & BI</Text>
              <Text style={styles.moduleSubtitle}>Zero-fake-numbers dynamic business intelligence</Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </Card>
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
  modePillContainer: {
    marginBottom: spacing.sm,
  },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  modePillHr: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  modePillEmp: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  modePillText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  modePillTextHr: {
    color: colors.primary,
  },
  modePillTextEmp: {
    color: '#15803D',
  },
  actionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  bannerIconWrap: {
    padding: spacing.xs,
    backgroundColor: '#FEF3C7',
    borderRadius: radius.md,
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: '#92400E',
  },
  bannerSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: '#B45309',
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.secondary,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  kpiSection: {
    marginBottom: spacing.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  kpiCol: {
    width: '50%',
    padding: spacing.xs,
  },
  launchpadSection: {
    marginBottom: spacing.md,
  },
  launchpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  launchpadCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    ...shadows.sm,
  },
  launchpadIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  launchpadTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  launchpadDesc: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  modulesSection: {
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    gap: spacing.md,
  },
  moduleIconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduleContent: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  moduleSubtitle: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
});
