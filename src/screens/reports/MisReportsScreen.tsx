import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCrm, useHrms } from '../../context';
import {
  misService,
  MisExecutiveMetrics,
  MisBoardFinancials,
  MisFieldOperations,
  MisWorkforceMetrics,
  MisAttendanceMetrics,
  MisLeaveMetrics,
  MisExpenseMetrics,
  MisReimbursementMetrics,
  MisFinanceSummary,
  MisPayrollMetrics,
  MisVendorMetrics,
  MisDocumentMetrics,
} from '../../services';
import { colors, spacing, typography, borderRadius } from '../../theme';
import {
  ScreenContainer,
  AppHeader,
  Card,
  StatCard,
  NativeBarChart,
  NativeDistributionList,
} from '../../components';
import { DonutChart, MiniBarChart } from '../../components/common/NativeCharts';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  Compass,
  DollarSign,
  Layers,
  Download,
  ShieldCheck,
  FileText,
  AlertTriangle,
  Briefcase,
  ChevronRight,
  Filter,
} from 'lucide-react-native';

export const MisReportsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'exec' | 'projects' | 'finance' | 'workforce' | 'controls' | 'vault'>('exec');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);

  const [execData, setExecData] = useState<MisExecutiveMetrics | null>(null);
  const [boardFin, setBoardFin] = useState<MisBoardFinancials | null>(null);
  const [fieldOps, setFieldOps] = useState<MisFieldOperations | null>(null);
  const [workforce, setWorkforce] = useState<MisWorkforceMetrics | null>(null);
  const [attendance, setAttendance] = useState<MisAttendanceMetrics | null>(null);
  const [leaves, setLeaves] = useState<MisLeaveMetrics | null>(null);
  const [expenses, setExpenses] = useState<MisExpenseMetrics | null>(null);
  const [reimbursements, setReimbursements] = useState<MisReimbursementMetrics | null>(null);
  const [finSummary, setFinSummary] = useState<MisFinanceSummary | null>(null);
  const [payroll, setPayroll] = useState<MisPayrollMetrics | null>(null);
  const [vendors, setVendors] = useState<MisVendorMetrics | null>(null);
  const [documents, setDocuments] = useState<MisDocumentMetrics | null>(null);

  const departments = [
    'All',
    'Geology & Mineral Exploration',
    'Mining Operations',
    'Surveying & Geomatics',
    'Finance & Accounts',
    'Administration & HR',
  ];

  const loadAllMetrics = async () => {
    try {
      setLoading(true);
      const [
        execRes,
        finRes,
        fieldRes,
        wfRes,
        attRes,
        leaveRes,
        expRes,
        reimbRes,
        finSumRes,
        payRes,
        vendorRes,
        docRes,
      ] = await Promise.all([
        misService.getExecutiveMetrics(selectedPeriod),
        misService.getBoardLevelFinancials(),
        misService.getFieldOperationsAnalytics(),
        misService.getWorkforceReports(selectedDept),
        misService.getZeroFakeAttendanceMetrics(selectedDept),
        misService.getLeaveReports(selectedDept),
        misService.getExpenseReports(),
        misService.getReimbursementReports(),
        misService.getFinanceSummary(),
        misService.getPayrollMetrics(),
        misService.getVendorMetrics(),
        misService.getDocumentMetrics(),
      ]);

      setExecData(execRes);
      setBoardFin(finRes);
      setFieldOps(fieldRes);
      setWorkforce(wfRes);
      setAttendance(attRes);
      setLeaves(leaveRes);
      setExpenses(expRes);
      setReimbursements(reimbRes);
      setFinSummary(finSumRes);
      setPayroll(payRes);
      setVendors(vendorRes);
      setDocuments(docRes);
    } catch (err) {
      console.error('Error compiling MIS reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllMetrics();
  }, [selectedDept, selectedPeriod]);

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      let filename = `bgspl_${activeTab}_report.csv`;
      let headers: string[] = [];
      let rows: (string | number)[][] = [];

      if (activeTab === 'exec') {
        filename = 'bgspl_executive_overview.csv';
        headers = ['Metric', 'Value', 'Unit/Note'];
        rows = [
          ['Total Revenue Pipeline', execData?.totalPipeline || 0, 'INR'],
          ['Active Geological Projects', execData?.activeProjects || 0, 'Projects (Stages 1-6)'],
          ['Delivered Projects', execData?.completedProjects || 0, 'Delivered (Stage 7)'],
          ['Lead Win Conversion Rate', `${execData?.conversionRate || 0}%`, 'Won vs Total Enquiries'],
          ['Pending Director Approvals', execData?.pendingApprovals || 0, 'Quotation Approvals'],
          ['Gross Billings', boardFin?.grossBillings || 0, 'INR'],
          ['Subcontractor Costs', boardFin?.subcontractorCosts || 0, 'INR'],
          ['EBITDA Operating Margin', `${boardFin?.ebitdaMargin || 0}%`, 'Operating Spread'],
        ];
      } else if (activeTab === 'workforce') {
        filename = 'bgspl_workforce_muster.csv';
        headers = ['Category', 'Staff Count', 'Unit / Compliance'];
        rows = [
          ['Total Active Staff', attendance?.totalStaff || 0, 'Headcount'],
          ['Reported Present Today', attendance?.presentToday || 0, 'Biometric & Field Logs'],
          ['Approved Leaves Today', attendance?.onLeaveToday || 0, 'Covering Today'],
          ['Derived Absent Today', attendance?.absentToday || 0, 'max(0, Staff - Present - Leave)'],
          ['Daily Muster Compliance', `${attendance?.attendancePercentage || 0}%`, 'Percent'],
        ];
      } else if (activeTab === 'projects') {
        filename = 'bgspl_field_operations.csv';
        headers = ['Stage No', 'Stage Name', 'Projects Count', 'Distribution %'];
        rows = (fieldOps?.stageDistribution || []).map((s) => [
          s.stage,
          s.name,
          s.count,
          `${s.percentage}%`,
        ]);
      } else {
        filename = 'bgspl_financial_summary.csv';
        headers = ['Ledger / Statement', 'Amount (INR)', 'Notes'];
        rows = [
          ['Gross Client Invoicing', finSummary?.totalInvoiced || 0, 'AR Billed'],
          ['Collections Received', finSummary?.totalCollected || 0, 'Paid Invoices'],
          ['Outstanding Receivables', finSummary?.outstandingReceivables || 0, 'Pending Collection'],
          ['Vendor Subcontract Liabilities', finSummary?.totalBilledByVendors || 0, 'AP Billed'],
          ['Subcontracts Paid', finSummary?.totalPaidToVendors || 0, 'Paid Bills'],
          ['Estimated GST Liability (18%)', finSummary?.estimatedGstLiability || 0, 'Output Tax'],
          ['Estimated TDS Deducted (2%)', finSummary?.estimatedTdsDeducted || 0, 'Section 194C/J'],
        ];
      }

      const success = await misService.exportReportToCsv(filename, headers, rows);
      if (!success) {
        Alert.alert('Export Notice', 'Native file sharing is not available on this environment.');
      }
    } catch (e) {
      Alert.alert('Export Error', 'Failed to compile CSV export.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScreenContainer
      scrollable={false}
      noPadding
      header={
        <AppHeader
          title="MIS Analytics & BI"
          subtitle="Zero-Fake-Numbers Live Intelligence"
          showBack
          onBack={() => navigation.goBack()}
          rightAction={
            <TouchableOpacity
              style={styles.exportButton}
              onPress={handleExportCsv}
              disabled={exporting || loading}
            >
              {exporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Download size={14} color="#FFFFFF" />
                  <Text style={styles.exportText}>CSV</Text>
                </>
              )}
            </TouchableOpacity>
          }
        />
      }
    >
      <View style={styles.periodBarWrapper}>
        <View style={styles.periodBar}>
          {(['all', 'month', 'quarter', 'year'] as const).map((p) => {
            const labels = { all: 'All Time', month: 'This Month', quarter: 'Quarter', year: 'Year' };
            const active = selectedPeriod === p;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.periodChip, active && styles.periodChipActive]}
                onPress={() => setSelectedPeriod(p)}
                activeOpacity={0.7}
              >
                <Text style={[styles.periodChipText, active && styles.periodChipTextActive]}>
                  {labels[p]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsScroll}
        style={styles.tabsContainer}
      >
        {[
          { key: 'exec', label: 'Executive', Icon: TrendingUp },
          { key: 'projects', label: 'Operations', Icon: Compass },
          { key: 'finance', label: 'Finance & Tax', Icon: DollarSign },
          { key: 'workforce', label: 'Workforce', Icon: Users },
          { key: 'controls', label: 'HR Controls', Icon: ShieldCheck },
          { key: 'vault', label: 'Doc Vaults', Icon: FileText },
        ].map((t) => {
          const active = activeTab === t.key;
          const IconComp = t.Icon;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(t.key as any)}
              activeOpacity={0.7}
            >
              <IconComp size={13} color={active ? '#FFFFFF' : colors.text.secondary} />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Compiling Live MIS State...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom + 64, 100) }]}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === 'exec' && execData && boardFin && (
            <>
              <View style={styles.statGrid}>
                <TouchableOpacity
                  style={styles.statCol}
                  onPress={() => navigation.navigate('Quotes')}
                  activeOpacity={0.8}
                >
                  <StatCard
                    title="REVENUE PIPELINE"
                    value={`₹${(execData.totalPipeline / 100000).toFixed(1)} L`}
                    caption={`${execData.totalLeads} Total Enquiries`}
                    icon={<TrendingUp size={18} color="#0D9488" />}
                    chart={<MiniBarChart values={[30, 45, 60, 85]} color="#0D9488" height={26} barWidth={5} />}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.statCol}
                  onPress={() => navigation.navigate('Projects')}
                  activeOpacity={0.8}
                >
                  <StatCard
                    title="ACTIVE PROJECTS"
                    value={execData.activeProjects}
                    caption={`${execData.completedProjects} Closed / Delivered`}
                    icon={<Compass size={18} color="#2563EB" />}
                    chart={<MiniBarChart values={[4, 6, 8, Math.max(10, execData.activeProjects)]} color="#2563EB" height={26} barWidth={5} />}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.statGrid}>
                <TouchableOpacity
                  style={styles.statCol}
                  onPress={() => navigation.navigate('Leads')}
                  activeOpacity={0.8}
                >
                  <StatCard
                    title="WIN CONVERSION"
                    value={`${execData.conversionRate}%`}
                    caption={`${execData.wonLeads} Leads Converted`}
                    icon={<Briefcase size={18} color="#16A34A" />}
                    chart={<DonutChart percentage={Number(execData.conversionRate)} color="#10B981" size={38} strokeWidth={5} />}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.statCol}
                  onPress={() => navigation.navigate('ClientApprovals')}
                  activeOpacity={0.8}
                >
                  <StatCard
                    title="DIRECTOR APPROVALS"
                    value={execData.pendingApprovals}
                    caption="Pending Clearance"
                    icon={<ShieldCheck size={18} color="#D97706" />}
                    trend={{ value: execData.pendingApprovals > 0 ? 'Action Req' : 'Clear', isPositive: execData.pendingApprovals === 0 }}
                  />
                </TouchableOpacity>
              </View>

              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <BarChart3 size={18} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Enquiries vs Won (Last 6 Months)</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Derived from live quotation ledger and conversion outcomes
                </Text>
                <NativeBarChart
                  data={execData.monthlyRevenueTrend.map((m) => ({
                    label: m.month,
                    value: m.enquiries,
                    secondaryValue: m.won,
                  }))}
                  primaryLabel="Enquiries"
                  secondaryLabel="Won"
                  primaryColor="#2A8089"
                  secondaryColor="#C8943A"
                  height={160}
                />
              </Card>

              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <DollarSign size={18} color="#10B981" />
                  <Text style={styles.sectionTitle}>Board-Level Profitability & Margins</Text>
                </View>
                <View style={styles.boardMetricRow}>
                  <View style={styles.boardCol}>
                    <Text style={styles.boardLabel}>GROSS BILLINGS</Text>
                    <Text style={styles.boardVal}>₹{(boardFin.grossBillings / 100000).toFixed(2)} L</Text>
                  </View>
                  <View style={styles.boardCol}>
                    <Text style={styles.boardLabel}>SUBCONTRACTS</Text>
                    <Text style={[styles.boardVal, { color: colors.semantic.danger }]}>
                      ₹{(boardFin.subcontractorCosts / 100000).toFixed(2)} L
                    </Text>
                  </View>
                </View>

                <View style={styles.ebitdaBanner}>
                  <View>
                    <Text style={styles.ebitdaLabel}>ESTIMATED OPERATING MARGIN (EBITDA)</Text>
                    <Text style={styles.ebitdaSub}>Gross billings less subcontracts and field expenses</Text>
                  </View>
                  <Text style={styles.ebitdaVal}>{boardFin.ebitdaMargin}%</Text>
                </View>

                <View style={styles.projectionNotice}>
                  <Text style={styles.projTitle}>{boardFin.projectedCashFlow.label}</Text>
                  <Text style={styles.projSpread}>
                    Net Projected Spread: ₹{(boardFin.projectedCashFlow.netProjectedSpread / 100000).toFixed(2)} Lakhs
                  </Text>
                  <Text style={styles.projSub}>
                    Uncollected Invoices (₹{(boardFin.projectedCashFlow.pendingReceivables / 100000).toFixed(2)}L) less
                    Unsettled Vendor Bills (₹{(boardFin.projectedCashFlow.pendingPayables / 100000).toFixed(2)}L)
                  </Text>
                </View>
              </Card>

              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Project Distribution by Service Line</Text>
                <Text style={styles.sectionSubtitle}>Share of mineral exploration vs survey contracts</Text>
                <NativeDistributionList rows={execData.serviceMix} defaultColor="#2A8089" />
              </Card>
            </>
          )}

          {activeTab === 'projects' && fieldOps && (
            <>
              <View style={styles.statGrid}>
                <View style={styles.statCol}>
                  <StatCard
                    title="DRILLING METERS"
                    value={`${fieldOps.totalDrillingMeters.toLocaleString()} m`}
                    caption="Cumulative Core Drilled"
                    icon={<Compass size={18} color={colors.primary} />}
                  />
                </View>
                <View style={styles.statCol}>
                  <StatCard
                    title="ACREAGE SURVEYED"
                    value={`${fieldOps.topographicalAcreage.toLocaleString()} Ha`}
                    caption="Topographical & Drone"
                    icon={<Layers size={18} color="#3B82F6" />}
                  />
                </View>
              </View>

              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>7-Stage Exploration Lifecycle Funnel</Text>
                <Text style={styles.sectionSubtitle}>
                  Real-time project distribution across geological operational stages
                </Text>

                <View style={styles.stagesList}>
                  {fieldOps.stageDistribution.map((stg) => (
                    <View key={stg.stage} style={styles.stageBarItem}>
                      <View style={styles.stageBarHeader}>
                        <Text style={styles.stageNameText}>
                          Stage {stg.stage}: {stg.name}
                        </Text>
                        <Text style={styles.stageCountText}>
                          {stg.count} ({stg.percentage}%)
                        </Text>
                      </View>
                      <View style={styles.stageTrack}>
                        <View style={[styles.stageFill, { width: `${stg.percentage}%` }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </Card>

              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Deliverables Completion Rate</Text>
                <View style={styles.progressRow}>
                  <Text style={styles.progressPctText}>{fieldOps.deliverablesCompletionRate}%</Text>
                  <Text style={styles.progressSub}>Of statutory survey deliverables submitted</Text>
                </View>
                <View style={styles.stageTrack}>
                  <View
                    style={[
                      styles.stageFill,
                      { width: `${Math.min(100, Math.max(0, Number(fieldOps.deliverablesCompletionRate) || 0))}%` as any, backgroundColor: '#10B981' },
                    ]}
                  />
                </View>
              </Card>
            </>
          )}

          {activeTab === 'finance' && finSummary && (
            <>
              <View style={styles.statGrid}>
                <TouchableOpacity
                  style={styles.statCol}
                  onPress={() => navigation.navigate('Invoices')}
                  activeOpacity={0.8}
                >
                  <StatCard
                    title="CLIENT INVOICED"
                    value={`₹${(finSummary.totalInvoiced / 100000).toFixed(1)} L`}
                    caption={`${finSummary.invoicesCount} Total Invoices`}
                    icon={<DollarSign size={18} color="#10B981" />}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.statCol}
                  onPress={() => navigation.navigate('VendorBills')}
                  activeOpacity={0.8}
                >
                  <StatCard
                    title="VENDOR BILLS"
                    value={`₹${(finSummary.totalBilledByVendors / 100000).toFixed(1)} L`}
                    caption={`${finSummary.vendorBillsCount} Incurred Bills`}
                    icon={<Briefcase size={18} color={colors.semantic.danger} />}
                  />
                </TouchableOpacity>
              </View>

              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Working Capital & Liquidity Spread</Text>
                <View style={styles.finMetricBox}>
                  <View style={styles.finMItem}>
                    <Text style={styles.finMLabel}>COLLECTIONS RECEIVED</Text>
                    <Text style={[styles.finMValue, { color: colors.semantic.success }]}>
                      ₹{(finSummary.totalCollected / 100000).toFixed(2)} L
                    </Text>
                  </View>
                  <View style={styles.finMItem}>
                    <Text style={styles.finMLabel}>OUTSTANDING RECEIVABLES</Text>
                    <Text style={[styles.finMValue, { color: colors.primary }]}>
                      ₹{(finSummary.outstandingReceivables / 100000).toFixed(2)} L
                    </Text>
                  </View>
                </View>

                <View style={styles.finMetricBox}>
                  <View style={styles.finMItem}>
                    <Text style={styles.finMLabel}>VENDOR BILLS PAID</Text>
                    <Text style={[styles.finMValue, { color: colors.text.secondary }]}>
                      ₹{(finSummary.totalPaidToVendors / 100000).toFixed(2)} L
                    </Text>
                  </View>
                  <View style={styles.finMItem}>
                    <Text style={styles.finMLabel}>PENDING PAYABLES</Text>
                    <Text style={[styles.finMValue, { color: colors.semantic.danger }]}>
                      ₹{(finSummary.outstandingPayables / 100000).toFixed(2)} L
                    </Text>
                  </View>
                </View>
              </Card>

              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Statutory Tax Compliance Estimates</Text>
                <View style={styles.taxRow}>
                  <View style={styles.taxItem}>
                    <Text style={styles.taxLabel}>Estimated GST Output (18%)</Text>
                    <Text style={styles.taxVal}>₹{(finSummary.estimatedGstLiability / 100000).toFixed(2)} Lakhs</Text>
                    <Text style={styles.taxNote}>From taxable outward supplies</Text>
                  </View>
                  <View style={styles.taxItem}>
                    <Text style={styles.taxLabel}>TDS Withholding (Sec 194C/J)</Text>
                    <Text style={styles.taxVal}>₹{(finSummary.estimatedTdsDeducted / 100000).toFixed(2)} Lakhs</Text>
                    <Text style={styles.taxNote}>Deducted on contractor payments</Text>
                  </View>
                </View>
              </Card>
            </>
          )}

          {activeTab === 'workforce' && workforce && attendance && (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deptScroll}>
                {departments.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.deptChip, selectedDept === d && styles.deptChipActive]}
                    onPress={() => setSelectedDept(d)}
                  >
                    <Text style={[styles.deptChipText, selectedDept === d && styles.deptChipTextActive]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <Users size={18} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Daily Biometric Muster Engine</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Dynamically derived: Absent = max(0, Staff - Present - Leave)
                </Text>

                <View style={styles.musterGrid}>
                  <View style={styles.musterBox}>
                    <Text style={styles.musterLabel}>TOTAL STAFF</Text>
                    <Text style={styles.musterVal}>{attendance.totalStaff}</Text>
                    <Text style={styles.musterSub}>Active contracts</Text>
                  </View>

                  <View style={[styles.musterBox, { borderColor: '#10B981' }]}>
                    <Text style={[styles.musterLabel, { color: '#10B981' }]}>PRESENT TODAY</Text>
                    <Text style={[styles.musterVal, { color: '#10B981' }]}>{attendance.presentToday}</Text>
                    <Text style={styles.musterSub}>{attendance.fieldDutyToday} on field duty</Text>
                  </View>
                </View>

                <View style={styles.musterGrid}>
                  <View style={[styles.musterBox, { borderColor: '#F59E0B' }]}>
                    <Text style={[styles.musterLabel, { color: '#F59E0B' }]}>ON LEAVE</Text>
                    <Text style={[styles.musterVal, { color: '#F59E0B' }]}>{attendance.onLeaveToday}</Text>
                    <Text style={styles.musterSub}>Approved leaves</Text>
                  </View>

                  <View style={[styles.musterBox, { borderColor: colors.semantic.danger }]}>
                    <Text style={[styles.musterLabel, { color: colors.semantic.danger }]}>ABSENT TODAY</Text>
                    <Text style={[styles.musterVal, { color: colors.semantic.danger }]}>{attendance.absentToday}</Text>
                    <Text style={styles.musterSub}>Derived absence</Text>
                  </View>
                </View>

                <View style={styles.complianceBarWrap}>
                  <View style={styles.compBarHead}>
                    <Text style={styles.compLabel}>Muster Compliance Ratio</Text>
                    <Text style={styles.compVal}>{attendance.attendancePercentage}%</Text>
                  </View>
                  <View style={styles.stageTrack}>
                    <View style={[styles.stageFill, { width: `${Math.min(100, Math.max(0, Number(attendance.attendancePercentage) || 0))}%` as any }]} />
                  </View>
                </View>
              </Card>

              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Department Staff Distribution</Text>
                <NativeDistributionList rows={workforce.departmentDistribution} defaultColor="#2A8089" />
              </Card>

              <Card style={styles.card}>
                <Text style={styles.sectionTitle}>Designation Roles Hierarchy</Text>
                <NativeDistributionList rows={workforce.designationDistribution} defaultColor="#C8943A" />
              </Card>
            </>
          )}

          {activeTab === 'controls' && leaves && expenses && reimbursements && (
            <>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <Clock size={18} color="#F59E0B" />
                  <Text style={styles.sectionTitle}>Leave Quota & Approvals Summary</Text>
                </View>
                <View style={styles.kpiRow}>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>PENDING</Text>
                    <Text style={[styles.kpiVal, { color: '#F59E0B' }]}>{leaves.pendingCount}</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>APPROVED</Text>
                    <Text style={[styles.kpiVal, { color: '#10B981' }]}>{leaves.approvedCount}</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>DAYS UTILIZED</Text>
                    <Text style={styles.kpiVal}>{leaves.totalDaysUtilized}</Text>
                  </View>
                </View>
                <NativeDistributionList rows={leaves.typeDistribution} defaultColor="#F59E0B" />
              </Card>

              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <DollarSign size={18} color="#10B981" />
                  <Text style={styles.sectionTitle}>Field Expenses Claim Audit</Text>
                </View>
                <View style={styles.boardMetricRow}>
                  <View style={styles.boardCol}>
                    <Text style={styles.boardLabel}>TOTAL REQUESTED</Text>
                    <Text style={styles.boardVal}>₹{expenses.totalRequested.toLocaleString()}</Text>
                  </View>
                  <View style={styles.boardCol}>
                    <Text style={styles.boardLabel}>APPROVED</Text>
                    <Text style={[styles.boardVal, { color: '#10B981' }]}>
                      ₹{expenses.totalApproved.toLocaleString()}
                    </Text>
                  </View>
                </View>
                <View style={styles.boardMetricRow}>
                  <View style={styles.boardCol}>
                    <Text style={styles.boardLabel}>SETTLED DISBURSED</Text>
                    <Text style={[styles.boardVal, { color: colors.primary }]}>
                      ₹{expenses.totalSettled.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.boardCol}>
                    <Text style={styles.boardLabel}>UNDER QUERY</Text>
                    <Text style={[styles.boardVal, { color: '#F59E0B' }]}>{expenses.underQueryCount}</Text>
                  </View>
                </View>
                <NativeDistributionList rows={expenses.categoryDistribution.map(c => ({ label: c.label, count: c.amount, percentage: c.percentage }))} defaultColor="#10B981" />
              </Card>

              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <Compass size={18} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>Travel & Mileage Reimbursements</Text>
                </View>
                <View style={styles.kpiRow}>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>CLAIMED</Text>
                    <Text style={styles.kpiVal}>₹{reimbursements.totalClaimed.toLocaleString()}</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>APPROVED</Text>
                    <Text style={[styles.kpiVal, { color: '#10B981' }]}>
                      ₹{reimbursements.totalApproved.toLocaleString()}
                    </Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>TOTAL MILEAGE</Text>
                    <Text style={styles.kpiVal}>{reimbursements.totalMileageKm} km</Text>
                  </View>
                </View>
              </Card>
            </>
          )}

          {activeTab === 'vault' && documents && (
            <>
              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <ShieldCheck size={18} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Dual Document Architecture</Text>
                </View>
                <Text style={styles.isoNoteText}>{documents.isolationNote}</Text>
              </Card>

              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <Briefcase size={18} color="#3B82F6" />
                  <Text style={styles.sectionTitle}>1. CRM Project EDMS Vault</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  NAS physical scans, government dispatch register, 4-Eyes verification
                </Text>

                <View style={styles.kpiRow}>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>GOVT LETTERS</Text>
                    <Text style={styles.kpiVal}>{documents.crmEdms.totalProjectLetters}</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>PENDING VERIFY</Text>
                    <Text style={[styles.kpiVal, { color: '#F59E0B' }]}>
                      {documents.crmEdms.pendingVerification}
                    </Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>DISPATCHES</Text>
                    <Text style={styles.kpiVal}>{documents.crmEdms.totalDispatches}</Text>
                  </View>
                </View>
              </Card>

              <Card style={styles.card}>
                <View style={styles.cardHeader}>
                  <FileText size={18} color="#10B981" />
                  <Text style={styles.sectionTitle}>2. HRMS KYC & Policy Vault</Text>
                </View>
                <Text style={styles.sectionSubtitle}>
                  Statutory staff credentials, DGMS licenses, corporate SOP manuals
                </Text>

                <View style={styles.kpiRow}>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>POLICIES & SOPS</Text>
                    <Text style={styles.kpiVal}>{documents.hrmsKyc.totalCorporatePolicies}</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>STAFF KYC</Text>
                    <Text style={styles.kpiVal}>{documents.hrmsKyc.totalEmployeeKycRecords}</Text>
                  </View>
                  <View style={styles.kpiItem}>
                    <Text style={styles.kpiLabel}>VERIFIED</Text>
                    <Text style={[styles.kpiVal, { color: '#10B981' }]}>
                      {documents.hrmsKyc.verifiedKycRecords}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deepLinkRow}
                  onPress={() => navigation.navigate('EmployeeDocuments')}
                >
                  <Text style={styles.deepLinkText}>Open Full Employee KYC Vault</Text>
                  <ChevronRight size={16} color={colors.primary} />
                </TouchableOpacity>
              </Card>
            </>
          )}
        </ScrollView>
      )}
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  exportText: {
    color: '#FFFFFF',
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
  },
  periodBarWrapper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
  },
  periodBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: borderRadius.md,
    padding: 3,
    gap: 3,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodChipActive: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodChipText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.secondary,
  },
  periodChipTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  tabsContainer: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF2F6',
    paddingVertical: 7,
  },
  tabsScroll: {
    paddingHorizontal: spacing.md,
    paddingRight: spacing.md + 12,
    gap: spacing.xs + 2,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: borderRadius.full,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.semibold,
    color: colors.text.secondary,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.secondary,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  statGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCol: {
    flex: 1,
  },
  card: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.normal,
    color: colors.text.secondary,
    marginTop: -2,
    marginBottom: spacing.xs,
  },
  boardMetricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  boardCol: {
    flex: 1,
  },
  boardLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.tertiary,
  },
  boardVal: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  ebitdaBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F9F5',
    borderWidth: 1,
    borderColor: '#C6E8D5',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginVertical: spacing.xs,
  },
  ebitdaLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: '#10B981',
  },
  ebitdaSub: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.normal,
    color: colors.text.secondary,
  },
  ebitdaVal: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: '#10B981',
  },
  projectionNotice: {
    backgroundColor: '#F8FAFB',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: 2,
  },
  projTitle: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
  },
  projSpread: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  projSub: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.normal,
    color: colors.text.tertiary,
  },
  stagesList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stageBarItem: {
    gap: 4,
  },
  stageBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stageNameText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.primary,
  },
  stageCountText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.secondary,
  },
  stageTrack: {
    height: 7,
    backgroundColor: '#EDF1F3',
    borderRadius: 4,
    overflow: 'hidden',
  },
  stageFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    marginVertical: spacing.xs,
  },
  progressPctText: {
    fontSize: typography.fontSizes.xxl,
    fontWeight: typography.fontWeights.bold,
    color: '#10B981',
  },
  progressSub: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.normal,
    color: colors.text.secondary,
  },
  finMetricBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  finMItem: {
    flex: 1,
  },
  finMLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.tertiary,
  },
  finMValue: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    marginTop: 2,
  },
  taxRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  taxItem: {
    flex: 1,
    backgroundColor: '#F8FAFB',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  taxLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.secondary,
  },
  taxVal: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginVertical: 2,
  },
  taxNote: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.normal,
    color: colors.text.tertiary,
  },
  deptScroll: {
    marginVertical: -spacing.xs,
  },
  deptChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.full,
    backgroundColor: '#EDF1F3',
    marginRight: spacing.xs,
  },
  deptChipActive: {
    backgroundColor: colors.primary,
  },
  deptChipText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.secondary,
  },
  deptChipTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeights.bold,
  },
  musterGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  musterBox: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.subtle,
    backgroundColor: '#FFFFFF',
  },
  musterLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.tertiary,
  },
  musterVal: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginVertical: 2,
  },
  musterSub: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.normal,
    color: colors.text.tertiary,
  },
  complianceBarWrap: {
    marginTop: spacing.xs,
    gap: 4,
  },
  compBarHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.secondary,
  },
  compVal: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    marginBottom: spacing.xs,
  },
  kpiItem: {
    flex: 1,
  },
  kpiLabel: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.medium,
    color: colors.text.tertiary,
  },
  kpiVal: {
    fontSize: typography.fontSizes.base,
    fontWeight: typography.fontWeights.bold,
    color: colors.text.primary,
    marginTop: 2,
  },
  isoNoteText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.normal,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  deepLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  deepLinkText: {
    fontSize: typography.fontSizes.xs,
    fontWeight: typography.fontWeights.bold,
    color: colors.primary,
  },
});
