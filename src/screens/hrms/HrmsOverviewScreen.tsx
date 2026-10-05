import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { ScreenContainer, AppHeader, Card, StatCard, StatusBadge } from '../../components/common';
import { DonutChart, MiniBarChart } from '../../components/common/NativeCharts';
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
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react-native';
import { getAttendanceMetrics } from '../../constants/attendance';

export const HrmsOverviewScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { employees, attendance, leaves, corrections, todayAttendance, punchIn, punchOut } = useHrms();
  const { session, hasRole } = useAuth();

  const isHrOrAdmin = hasRole(['Admin', 'HR']);
  const activeEmpId = (session as any)?.employeeId || (isHrOrAdmin ? 'BGS-2021-001' : 'BGS-2023-044');
  const activeEmpName = (session as any)?.name || 'Team Member';

  const [isPunching, setIsPunching] = useState(false);

  const metrics = useMemo(
    () => getAttendanceMetrics(employees, attendance, leaves, corrections),
    [employees, attendance, leaves, corrections]
  );

  const todayStr = new Date().toISOString().split('T')[0];
  const myTodayRecord = attendance.find((a) => a.employeeId === activeEmpId && a.date === todayStr) || todayAttendance;
  const isCheckedIn = !!myTodayRecord?.punchIn && (!myTodayRecord.punchOut || myTodayRecord.punchOut === '-');

  const { myPresentDays, myLateCount, myPendingCorrections, pendingLeavesCount } = useMemo(() => {
    const myTotalRecords = attendance.filter((a) => a.employeeId === activeEmpId);
    const present = myTotalRecords.filter(
      (a) => a.status === 'Present' || a.status === 'Field Duty' || a.status === 'Late'
    ).length;
    const late = myTotalRecords.filter((a) => a.status === 'Late' || (a.lateBy && a.lateBy !== '-')).length;
    const pendingCorr = corrections.filter(
      (c) => c.employeeId === activeEmpId && c.status === 'Pending'
    ).length;
    const pendingLv = leaves.filter((l) => l.status === 'Pending').length;

    return {
      myPresentDays: present,
      myLateCount: late,
      myPendingCorrections: pendingCorr,
      pendingLeavesCount: pendingLv,
    };
  }, [attendance, activeEmpId, corrections, leaves]);

  const handlePunchToggle = useCallback(async () => {
    setIsPunching(true);
    try {
      if (isCheckedIn) {
        await punchOut();
        Alert.alert('Punched Out', 'Your biometric check-out has been verified and recorded.');
      } else {
        await punchIn('Jaipur HQ Geofence', { latitude: 26.9124, longitude: 75.7873 }, 'Mobile Biometric');
        Alert.alert('Punched In', 'Geo-verified attendance registered at Jaipur HQ.');
      }
    } catch (e: any) {
      Alert.alert('Attendance Error', e.message || 'Could not record attendance');
    } finally {
      setIsPunching(false);
    }
  }, [isCheckedIn, punchOut, punchIn]);

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title={isHrOrAdmin ? 'HRMS Command Center' : 'My Workforce Portal'}
          subtitle={
            isHrOrAdmin
              ? 'Live biometric muster, field site compliance & payroll'
              : `Welcome back, ${activeEmpName}`
          }
          scenicBanner
          badge="Workforce HRMS"
          badgeIcon={<Users size={12} color="#0d9488" />}
          showBack
          onBack={() => navigation.goBack()}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
      contentContainerStyle={styles.content}
    >
        <View style={styles.modePillContainer}>
          <View style={[styles.modePill, isHrOrAdmin ? styles.modePillHr : styles.modePillEmp]}>
            <Sparkles size={12} color={isHrOrAdmin ? colors.primary : '#059669'} />
            <Text style={[styles.modePillText, isHrOrAdmin ? styles.modePillTextHr : styles.modePillTextEmp]}>
              {isHrOrAdmin ? 'HR & Corporate Governance Mode' : 'Employee Self-Service Mode'}
            </Text>
          </View>
        </View>

        <Card style={styles.biometricCard}>
          <View style={styles.biometricHeader}>
            <View style={styles.biometricIconBadge}>
              <Fingerprint size={22} color={colors.primary} />
            </View>
            <View style={styles.biometricInfo}>
              <Text style={styles.biometricTitle}>Biometric Geo-Attendance</Text>
              <View style={styles.geoRow}>
                <MapPin size={12} color={colors.text.tertiary} />
                <Text style={styles.geoText}>Jaipur Mining HQ • Geofence Valid</Text>
              </View>
            </View>
            <StatusBadge
              status={isCheckedIn ? 'Present' : 'Not Punched'}
              variant="outline"
              size="sm"
            />
          </View>

          <View style={styles.biometricBody}>
            <View style={styles.punchDetails}>
              <Text style={styles.punchTimeLabel}>TODAY'S STATUS</Text>
              <Text style={styles.punchTimeValue}>
                {myTodayRecord?.punchIn ? `Punch In: ${myTodayRecord.punchIn}` : 'Not Checked In Yet'}
              </Text>
              <Text style={styles.punchSubText}>
                {myTodayRecord?.punchOut && myTodayRecord.punchOut !== '-'
                  ? `Shift Ended: ${myTodayRecord.punchOut}`
                  : isCheckedIn
                  ? 'Shift in progress • Core hours tracked'
                  : 'Standard 09:00 AM - 06:00 PM Roster'}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.punchButton,
                isCheckedIn ? styles.punchButtonOut : styles.punchButtonIn,
              ]}
              onPress={handlePunchToggle}
              disabled={isPunching}
              activeOpacity={0.85}
            >
              <Fingerprint size={18} color="#FFFFFF" />
              <Text style={styles.punchButtonText}>
                {isPunching ? 'Verifying...' : isCheckedIn ? 'Punch Out' : 'Punch In'}
              </Text>
            </TouchableOpacity>
          </View>
        </Card>

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

        <View style={styles.kpiSection}>
          <Text style={styles.sectionHeader}>
            {isHrOrAdmin ? "TODAY'S MUSTER METRICS" : 'MY ATTENDANCE SNAPSHOT'}
          </Text>

          {isHrOrAdmin ? (
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCol}>
                <StatCard
                  title="PRESENT TODAY"
                  value={String(metrics.presentCount)}
                  caption={`${metrics.presentPct}% of ${metrics.totalStaff} Staff`}
                  icon={<UserCheck size={18} color={colors.semantic.success} />}
                  chart={<DonutChart percentage={Number(metrics.presentPct)} color="#10B981" size={40} strokeWidth={5} />}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="ABSENT / LEAVE"
                  value={String(metrics.absentCount + metrics.leaveCount)}
                  caption={`${metrics.leaveCount} Approved Leaves`}
                  icon={<UserX size={18} color={colors.semantic.danger} />}
                  chart={<MiniBarChart values={[metrics.absentCount, metrics.leaveCount, metrics.lateCount]} color="#EF4444" height={26} barWidth={5} />}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="FIELD DEPLOYED"
                  value={String(metrics.fieldCount)}
                  caption="Bhilwara & Mines"
                  icon={<Fingerprint size={18} color="#0D9488" />}
                  trend={{ value: 'On Site', isPositive: true }}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="CORRECTIONS"
                  value={String(metrics.pendingCorrections)}
                  caption={metrics.pendingCorrections > 0 ? 'Action Required' : 'All Clear'}
                  icon={<FileEdit size={18} color={colors.primary} />}
                  trend={{ value: metrics.pendingCorrections > 0 ? 'Pending' : 'Zero', isPositive: metrics.pendingCorrections === 0 }}
                />
              </View>
            </View>
          ) : (
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCol}>
                <StatCard
                  title="PUNCH TODAY"
                  value={myTodayRecord?.punchIn || 'Pending'}
                  caption={myTodayRecord?.punchOut && myTodayRecord.punchOut !== '-' ? `Out: ${myTodayRecord.punchOut}` : 'Shift Active'}
                  icon={<Clock size={18} color={colors.primary} />}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="PRESENT DAYS"
                  value={`${myPresentDays} Days`}
                  caption="This Pay Cycle"
                  icon={<CalendarDays size={18} color={colors.semantic.success} />}
                  chart={<DonutChart percentage={Math.round((myPresentDays / 26) * 100)} color="#10B981" size={40} strokeWidth={5} />}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="LATE ARRIVALS"
                  value={String(myLateCount)}
                  caption="Grace Window"
                  icon={<ClockAlert size={18} color={colors.semantic.warning} />}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="REGULARIZATION"
                  value={String(myPendingCorrections)}
                  caption={myPendingCorrections > 0 ? 'Under Review' : 'Nil Pending'}
                  icon={<FileEdit size={18} color="#8B5CF6" />}
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.launchpadSection}>
          <Text style={styles.sectionHeader}>QUICK HRMS ACTIONS</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Attendance')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#EFF6FF' }]}>
                <Clock size={22} color="#2563EB" />
              </View>
              <Text style={styles.actionTileTitle}>Attendance</Text>
              <Text style={styles.actionTileSub}>Daily Ledger</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('MonthlyAttendance')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#FAF5FF' }]}>
                <CalendarDays size={22} color="#9333EA" />
              </View>
              <Text style={styles.actionTileTitle}>Monthly Muster</Text>
              <Text style={styles.actionTileSub}>30-Day Grid</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Leave')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#F0FDF4' }]}>
                <CalendarCheck size={22} color="#16A34A" />
              </View>
              <Text style={styles.actionTileTitle}>Leaves</Text>
              <Text style={styles.actionTileSub}>Quotas & Apply</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('AttendanceCorrections')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#FFFBEB' }]}>
                <FileEdit size={22} color="#D97706" />
              </View>
              <Text style={styles.actionTileTitle}>Corrections</Text>
              <Text style={styles.actionTileSub}>Missed Punches</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('EmployeeDirectory')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#FDF2F8' }]}>
                <Users size={22} color="#DB2777" />
              </View>
              <Text style={styles.actionTileTitle}>Directory</Text>
              <Text style={styles.actionTileSub}>Staff Contacts</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionTile}
              onPress={() => navigation.navigate('Payroll')}
              activeOpacity={0.8}
            >
              <View style={[styles.actionSquircle, { backgroundColor: '#F0FDFA' }]}>
                <CreditCard size={22} color="#0D9488" />
              </View>
              <Text style={styles.actionTileTitle}>Payroll</Text>
              <Text style={styles.actionTileSub}>Salary Slips</Text>
            </TouchableOpacity>
          </View>
        </View>

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
              <Text style={styles.moduleSubtitle}>Annual quotas, casual leave & muster approvals</Text>
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
              <Text style={styles.moduleSubtitle}>Staff KYC, contacts, DGMS licenses & designations</Text>
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
              <Text style={styles.moduleTitle}>Organization Hierarchy</Text>
              <Text style={styles.moduleSubtitle}>Divisions, project sites & grade bands</Text>
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
              <Text style={styles.moduleSubtitle}>HQ, mine site & diamond core drilling rotas</Text>
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
              <Text style={styles.moduleTitle}>HR Policy Vault</Text>
              <Text style={styles.moduleSubtitle}>Company circulars, safety guidelines & SOPs</Text>
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
                {isHrOrAdmin ? 'Staff Document KYC Vault' : 'My Certificates & ID Cards'}
              </Text>
              <Text style={styles.moduleSubtitle}>Aadhaar, PAN, degrees & statutory DGMS credentials</Text>
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
              <Text style={styles.moduleTitle}>MIS Analytics & Workforce BI</Text>
              <Text style={styles.moduleSubtitle}>Zero-fake-numbers dynamic board intelligence</Text>
            </View>
            <ChevronRight size={18} color={colors.text.tertiary} />
          </Card>
        </View>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
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
  biometricCard: {
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  biometricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  biometricIconBadge: {
    width: 42,
    height: 42,
    borderRadius: radius.lg,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  biometricInfo: {
    flex: 1,
  },
  biometricTitle: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  geoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  geoText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.tertiary,
  },
  biometricBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  punchDetails: {
    flex: 1,
    marginRight: spacing.sm,
  },
  punchTimeLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.tertiary,
    letterSpacing: 0.5,
  },
  punchTimeValue: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  punchSubText: {
    fontSize: typography.fontSizes.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  punchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    ...shadows.sm,
  },
  punchButtonIn: {
    backgroundColor: '#0D9488',
  },
  punchButtonOut: {
    backgroundColor: '#EF4444',
  },
  punchButtonText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: '#FFFFFF',
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
    fontSize: 11,
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
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  actionTile: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  actionSquircle: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  actionTileTitle: {
    fontSize: 12,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    textAlign: 'center',
  },
  actionTileSub: {
    fontSize: 10,
    color: colors.text.tertiary,
    marginTop: 1,
    textAlign: 'center',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: spacing.md,
    ...shadows.sm,
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
