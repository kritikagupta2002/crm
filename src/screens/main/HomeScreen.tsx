import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Users,
  FolderKanban,
  CheckCircle,
  Clock,
  TrendingUp,
  Receipt,
  FileCheck,
  AlertCircle,
  Building2,
  Calendar,
  Landmark,
  ShieldCheck,
  FileSpreadsheet,
  Briefcase,
  Layers,
  ChevronRight,
} from 'lucide-react-native';
import { ScreenContainer, AppHeader, StatCard, Card, StatusBadge, Button } from '../../components/common';
import { colors, spacing, typography, radius, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { useCrm } from '../../context/CrmContext';
import { useHrms } from '../../context/HrmsContext';
import { misService } from '../../services';

interface HomeScreenProps {
  navigation: any;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { session, role } = useAuth();
  const { projects, quotes, leads, tenders, workOrders } = useCrm();
  const {
    todayAttendance,
    punchIn,
    punchOut,
    leaveBalances,
    leaves,
    expenses,
    invoices,
    vendorBills,
    vouchers,
    payslips,
  } = useHrms();

  const [attMetrics, setAttMetrics] = useState<any>({
    totalStaff: 0,
    presentToday: 0,
    onLeaveToday: 0,
    absentToday: 0,
    attendancePercentage: '0.0',
  });
  const [commMetrics, setCommMetrics] = useState<any>({
    pipelineValue: 0,
    activeProjects: 0,
    conversionRate: '0.0',
    pendingApprovals: 0,
  });
  const [punching, setPunching] = useState(false);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const [att, comm] = await Promise.all([
          misService.getZeroFakeAttendanceMetrics(),
          misService.getCommercialKpis(),
        ]);
        setAttMetrics(att);
        setCommMetrics(comm);
      } catch (e) {
        console.error('Error fetching home metrics:', e);
      }
    };
    fetchMetrics();
  }, [projects, quotes, leads, todayAttendance]);

  const handlePunchToggle = async () => {
    setPunching(true);
    try {
      if (todayAttendance?.punchIn && todayAttendance.punchOut === '-') {
        await punchOut();
      } else {
        await punchIn('Field Mobile Geotag Check-in');
      }
    } catch (e: any) {
      console.error('Punch error:', e);
    } finally {
      setPunching(false);
    }
  };

  const formatCurrency = (amt: number) => {
    if (amt >= 10000000) return `₹${(amt / 10000000).toFixed(2)} Cr`;
    if (amt >= 100000) return `₹${(amt / 100000).toFixed(2)} L`;
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  const totalLeaveBalance = leaveBalances.reduce((sum, b) => sum + (b.available || 0), 0);
  const pendingLeavesCount = leaves.filter((l) => l.status === 'Pending').length;
  const pendingExpensesCount = expenses.filter((e) => e.status === 'Pending').length;
  const totalReceivables = invoices
    .filter((i) => i.status !== 'Paid')
    .reduce((sum, i) => sum + i.totalAmount, 0);

  return (
    <ScreenContainer
      scrollable
      header={
        <AppHeader
          title={(session as any)?.name || 'Bansal Geo Mobile'}
          subtitle={`${(session as any)?.designation || 'Team Staff'} • ${(session as any)?.department || 'HQ'}`}
          onNotificationPress={() => navigation.navigate('Notifications')}
        />
      }
    >
      {/* 1. ROLE-ADAPTIVE BANNER */}
      <View style={styles.roleBanner}>
        <View style={styles.roleBadgeContainer}>
          <ShieldCheck size={16} color={colors.primary} />
          <Text style={styles.roleBadgeText}>ACTIVE ROLE: {role.toUpperCase()}</Text>
        </View>
        <Text style={styles.roleBannerDesc}>
          {role === 'admin' && 'Executive command view across all 8 enterprise workspaces.'}
          {role === 'hr' && 'Workforce muster, attendance regularizations & HR audits.'}
          {role === 'accountant' && 'Double-entry general ledger, invoices & statutory compliance.'}
          {role === 'lead' && 'Geological field projects, milestone tasks & sealed bids.'}
          {role === 'employee' && 'Daily attendance punch, personal leaves & expense claims.'}
        </Text>
      </View>

      {/* 2. EMPLOYEE / GENERAL ATTENDANCE CARD */}
      <Card style={styles.punchCard}>
        <View style={styles.punchRow}>
          <View style={styles.punchInfo}>
            <Text style={styles.punchLabel}>Daily Biometric Check-In Status</Text>
            <View style={styles.punchStatusRow}>
              <StatusBadge status={todayAttendance?.status || 'Not Checked In'} />
              {todayAttendance?.punchIn ? (
                <Text style={styles.punchTime}>In: {todayAttendance.punchIn}</Text>
              ) : null}
            </View>
          </View>
          <Button
            title={
              todayAttendance?.punchIn && todayAttendance.punchOut === '-'
                ? 'Punch Out'
                : 'Punch In'
            }
            variant={
              todayAttendance?.punchIn && todayAttendance.punchOut === '-'
                ? 'danger'
                : 'primary'
            }
            size="sm"
            onPress={handlePunchToggle}
            loading={punching}
          />
        </View>
      </Card>

      {/* 3. ROLE-TAILORED KPI STAT CARDS */}
      <Text style={styles.sectionHeader}>
        {role === 'admin' && 'Enterprise Executive Metrics'}
        {role === 'hr' && 'Workforce & Muster Overview'}
        {role === 'accountant' && 'Financial Snapshot & Payables'}
        {role === 'lead' && 'Field Exploration Overview'}
        {role === 'employee' && 'My Workforce Dashboard'}
      </Text>

      {/* === ADMIN METRICS === */}
      {role === 'admin' && (
        <>
          <View style={styles.statGrid}>
            <StatCard
              title="Staff Present Today"
              value={`${attMetrics.presentToday}/${attMetrics.totalStaff}`}
              subtitle={`${attMetrics.attendancePercentage}% muster presence`}
              icon={<Users size={18} color={colors.primary} />}
              color={colors.primary}
            />
            <StatCard
              title="Active Projects (ERM)"
              value={commMetrics.activeProjects}
              subtitle="Field exploration stages"
              icon={<FolderKanban size={18} color={colors.accent} />}
              color={colors.accent}
            />
          </View>
          <View style={styles.statGrid}>
            <StatCard
              title="Pipeline Volume"
              value={formatCurrency(commMetrics.pipelineValue)}
              subtitle={`${commMetrics.conversionRate}% conversion rate`}
              icon={<TrendingUp size={18} color={colors.warning} />}
              color={colors.warning}
            />
            <StatCard
              title="Pending Approvals"
              value={commMetrics.pendingApprovals}
              subtitle="Director quotation gate"
              icon={<AlertCircle size={18} color={colors.danger} />}
              color={colors.danger}
            />
          </View>
        </>
      )}

      {/* === HR METRICS === */}
      {role === 'hr' && (
        <>
          <View style={styles.statGrid}>
            <StatCard
              title="Staff Present Today"
              value={`${attMetrics.presentToday}/${attMetrics.totalStaff}`}
              subtitle={`${attMetrics.attendancePercentage}% presence`}
              icon={<Users size={18} color={colors.primary} />}
              color={colors.primary}
            />
            <StatCard
              title="On Leave Today"
              value={attMetrics.onLeaveToday}
              subtitle="Approved absence"
              icon={<Calendar size={18} color={colors.warning} />}
              color={colors.warning}
            />
          </View>
          <View style={styles.statGrid}>
            <StatCard
              title="Pending Leaves"
              value={pendingLeavesCount}
              subtitle="Awaiting HR approval"
              icon={<Clock size={18} color={colors.danger} />}
              color={colors.danger}
            />
            <StatCard
              title="Pending Claims"
              value={pendingExpensesCount}
              subtitle="Unreviewed expense claims"
              icon={<Receipt size={18} color={colors.accent} />}
              color={colors.accent}
            />
          </View>
        </>
      )}

      {/* === ACCOUNTANT METRICS === */}
      {role === 'accountant' && (
        <>
          <View style={styles.statGrid}>
            <StatCard
              title="Tax Invoices"
              value={invoices.length}
              subtitle="Exploration billings"
              icon={<Receipt size={18} color={colors.primary} />}
              color={colors.primary}
            />
            <StatCard
              title="Receivables"
              value={formatCurrency(totalReceivables)}
              subtitle="Outstanding payments"
              icon={<TrendingUp size={18} color={colors.warning} />}
              color={colors.warning}
            />
          </View>
          <View style={styles.statGrid}>
            <StatCard
              title="Vendor Bills"
              value={vendorBills.length}
              subtitle="Subcontractor claims"
              icon={<Briefcase size={18} color={colors.accent} />}
              color={colors.accent}
            />
            <StatCard
              title="General Ledger"
              value={vouchers.length}
              subtitle="Double-entry vouchers"
              icon={<Landmark size={18} color={colors.success} />}
              color={colors.success}
            />
          </View>
        </>
      )}

      {/* === TEAM LEAD METRICS === */}
      {role === 'lead' && (
        <>
          <View style={styles.statGrid}>
            <StatCard
              title="Exploration Sites"
              value={projects.length}
              subtitle="Active field projects"
              icon={<FolderKanban size={18} color={colors.primary} />}
              color={colors.primary}
            />
            <StatCard
              title="Tenders & Bids"
              value={tenders.length}
              subtitle="Subcontractor tenders"
              icon={<Layers size={18} color={colors.accent} />}
              color={colors.accent}
            />
          </View>
          <View style={styles.statGrid}>
            <StatCard
              title="Awarded Work Orders"
              value={workOrders.length}
              subtitle="Active field contracts"
              icon={<Briefcase size={18} color={colors.warning} />}
              color={colors.warning}
            />
            <StatCard
              title="Field Deliverables"
              value="12"
              subtitle="Assay logs & CAD maps"
              icon={<FileCheck size={18} color={colors.success} />}
              color={colors.success}
            />
          </View>
        </>
      )}

      {/* === EMPLOYEE METRICS === */}
      {role === 'employee' && (
        <>
          <View style={styles.statGrid}>
            <StatCard
              title="My Leave Balance"
              value={`${totalLeaveBalance} Days`}
              subtitle="CL + SL + EL remaining"
              icon={<Calendar size={18} color={colors.primary} />}
              color={colors.primary}
            />
            <StatCard
              title="My Expense Claims"
              value={expenses.length}
              subtitle="Reimbursements filed"
              icon={<Receipt size={18} color={colors.accent} />}
              color={colors.accent}
            />
          </View>
          <View style={styles.statGrid}>
            <StatCard
              title="Latest Payslip"
              value={payslips.length > 0 ? 'Ready' : 'Pending'}
              subtitle="Monthly itemized salary"
              icon={<FileSpreadsheet size={18} color={colors.success} />}
              color={colors.success}
            />
            <StatCard
              title="Field Status"
              value={todayAttendance?.status || 'Active'}
              subtitle="Daily shift logged"
              icon={<CheckCircle size={18} color={colors.warning} />}
              color={colors.warning}
            />
          </View>
        </>
      )}

      {/* 4. ROLE-TAILORED QUICK ACTIONS */}
      <Text style={styles.sectionHeader}>Quick Actions</Text>
      <View style={styles.quickActionRow}>
        {role === 'admin' && (
          <>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Leads')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.primaryBg }]}>
                <Users size={22} color={colors.primary} />
              </View>
              <Text style={styles.qaText}>Leads</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Projects')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.accentBg }]}>
                <FolderKanban size={22} color={colors.accent} />
              </View>
              <Text style={styles.qaText}>Projects</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Tenders')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.warningBg }]}>
                <ShieldCheck size={22} color={colors.warning} />
              </View>
              <Text style={styles.qaText}>Sealed Bids</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('MisReports')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.successBg }]}>
                <TrendingUp size={22} color={colors.success} />
              </View>
              <Text style={styles.qaText}>MIS Reports</Text>
            </TouchableOpacity>
          </>
        )}

        {role === 'hr' && (
          <>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('LeaveApprovals')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.dangerBg }]}>
                <Clock size={22} color={colors.danger} />
              </View>
              <Text style={styles.qaText}>Approvals</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('EmployeeDirectory')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.primaryBg }]}>
                <Users size={22} color={colors.primary} />
              </View>
              <Text style={styles.qaText}>Directory</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Attendance')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.accentBg }]}>
                <Calendar size={22} color={colors.accent} />
              </View>
              <Text style={styles.qaText}>Muster</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Expenses')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.warningBg }]}>
                <Receipt size={22} color={colors.warning} />
              </View>
              <Text style={styles.qaText}>Audits</Text>
            </TouchableOpacity>
          </>
        )}

        {role === 'accountant' && (
          <>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Vouchers')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.successBg }]}>
                <Landmark size={22} color={colors.success} />
              </View>
              <Text style={styles.qaText}>Vouchers</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Invoices')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.primaryBg }]}>
                <Receipt size={22} color={colors.primary} />
              </View>
              <Text style={styles.qaText}>Invoices</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('VendorBills')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.accentBg }]}>
                <Briefcase size={22} color={colors.accent} />
              </View>
              <Text style={styles.qaText}>Vendor Bills</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('TaxCompliance')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.warningBg }]}>
                <TrendingUp size={22} color={colors.warning} />
              </View>
              <Text style={styles.qaText}>Tax / GST</Text>
            </TouchableOpacity>
          </>
        )}

        {role === 'lead' && (
          <>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Projects')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.primaryBg }]}>
                <FolderKanban size={22} color={colors.primary} />
              </View>
              <Text style={styles.qaText}>Projects</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Tenders')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.accentBg }]}>
                <ShieldCheck size={22} color={colors.accent} />
              </View>
              <Text style={styles.qaText}>Tenders</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('DocumentInbox')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.warningBg }]}>
                <FileCheck size={22} color={colors.warning} />
              </View>
              <Text style={styles.qaText}>CAD Vault</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('WorkOrders')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.successBg }]}>
                <Briefcase size={22} color={colors.success} />
              </View>
              <Text style={styles.qaText}>Contracts</Text>
            </TouchableOpacity>
          </>
        )}

        {role === 'employee' && (
          <>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Attendance')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.primaryBg }]}>
                <Clock size={22} color={colors.primary} />
              </View>
              <Text style={styles.qaText}>Punch Log</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Leave')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.successBg }]}>
                <Calendar size={22} color={colors.success} />
              </View>
              <Text style={styles.qaText}>Apply Leave</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('ExpenseClaim')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.warningBg }]}>
                <Receipt size={22} color={colors.warning} />
              </View>
              <Text style={styles.qaText}>Claim Bill</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => navigation.navigate('Payslips')}>
              <View style={[styles.qaIcon, { backgroundColor: colors.accentBg }]}>
                <FileSpreadsheet size={22} color={colors.accent} />
              </View>
              <Text style={styles.qaText}>My Payslip</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* 5. ROLE-SPECIFIC CONTENT HIGHLIGHTS */}
      {role === 'employee' ? (
        <>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeader}>My Recent Claims & Activity</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Expenses')}>
              <Text style={styles.seeAll}>View All &rarr;</Text>
            </TouchableOpacity>
          </View>
          {expenses.slice(0, 2).map((exp) => (
            <Card key={exp.id} onPress={() => navigation.navigate('Expenses')}>
              <View style={styles.projHeader}>
                <Text style={styles.projCode}>{exp.id}</Text>
                <StatusBadge status={exp.status} size="sm" />
              </View>
              <Text style={styles.projTitle}>{exp.category} — ₹{(exp.requestedAmount || 0).toLocaleString('en-IN')}</Text>
              <Text style={styles.projClient}>Filed on {exp.date} • {exp.project || 'General'}</Text>
            </Card>
          ))}
        </>
      ) : (
        <>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionHeader}>Active Geological Projects</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
              <Text style={styles.seeAll}>See All &rarr;</Text>
            </TouchableOpacity>
          </View>

          {projects.slice(0, 2).map((p) => (
            <Card
              key={p.id}
              onPress={() => navigation.navigate('ProjectDetail', { projectId: p.id })}
            >
              <View style={styles.projHeader}>
                <Text style={styles.projCode}>{p.projectCode}</Text>
                <StatusBadge status={p.stageName} size="sm" />
              </View>
              <Text style={styles.projTitle}>{p.title}</Text>
              <Text style={styles.projClient}>{p.clientName} • {p.location}</Text>
              <View style={styles.projFooter}>
                <Text style={styles.projBudget}>Budget: {formatCurrency(p.baselineBudget)}</Text>
                <Text style={styles.projTasks}>
                  {p.tasks.length} Tasks • {p.deliverables.length} Deliverables
                </Text>
              </View>
            </Card>
          ))}
        </>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  roleBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  roleBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
  },
  roleBannerDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  punchCard: {
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  punchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  punchInfo: {
    flex: 1,
  },
  punchLabel: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginBottom: 4,
  },
  punchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  punchTime: {
    fontSize: typography.fontSizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeights.medium,
  },
  sectionHeader: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  seeAll: {
    fontSize: typography.fontSizes.xs,
    color: colors.primary,
    fontWeight: typography.fontWeights.semibold,
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  quickAction: {
    alignItems: 'center',
    flex: 1,
  },
  qaIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  qaText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  projHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  projCode: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  projTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  projClient: {
    fontSize: typography.fontSizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  projFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  projBudget: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.textPrimary,
  },
  projTasks: {
    fontSize: typography.fontSizes.xxs,
    color: colors.textMuted,
  },
});
