import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useHrms, useAuth } from '../../context';
import { colors, spacing, typography, borderRadius } from '../../theme';
import {
  AppHeader,
  Card,
  StatCard,
  Button,
  StatusBadge,
  SegmentedControl,
  EmptyState,
} from '../../components';
import { SalaryStructure, Payslip, PayrollRun } from '../../types';
import {
  BadgeIndianRupee,
  Users,
  CheckCircle2,
  Clock,
  Play,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Search,
  Edit2,
  X,
  History,
  ArrowRight,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react-native';

export const PayrollScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const {
    employees,
    salaryStructures,
    payslips,
    payrollRuns,
    processPayroll,
    updateSalaryStructure,
    attendance,
    leaves,
  } = useHrms();
  const { hasRole, session } = useAuth();

  const isHrOrAdmin = hasRole(['Admin', 'HR', 'Accountant']);

  const [activeTab, setActiveTab] = useState<'overview' | 'structures' | 'process' | 'history'>('overview');

  // Process tab state
  const [selectedCycle, setSelectedCycle] = useState('2026-09');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processSuccess, setProcessSuccess] = useState(false);
  const [lastProcessedRun, setLastProcessedRun] = useState<PayrollRun | null>(null);

  // Structures search & filter
  const [structureSearch, setStructureSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');

  // Edit structure modal
  const [editingStructure, setEditingStructure] = useState<SalaryStructure | null>(null);
  const [editBasic, setEditBasic] = useState('0');
  const [editHra, setEditHra] = useState('0');
  const [editConveyance, setEditConveyance] = useState('0');
  const [editSpecial, setEditSpecial] = useState('0');
  const [editSite, setEditSite] = useState('0');
  const [editPt, setEditPt] = useState('200');
  const [editTds, setEditTds] = useState('0');
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingStructure, setIsSavingStructure] = useState(false);

  // Compute Overview KPIs from actual stored structures & runs
  const activeStaff = employees.filter(
    (e) => e.employment?.status !== 'Terminated' && e.employment?.status !== 'Resigned'
  );

  const totalMonthlyGross = useMemo(() => {
    return salaryStructures.reduce((sum, s) => sum + (Number(s.monthlyGross) || 0), 0);
  }, [salaryStructures]);

  const totalNetTakeHome = useMemo(() => {
    return salaryStructures.reduce(
      (sum, s) => sum + (Number(s.monthlyNet) || Number(s.netSalary) || 0),
      0
    );
  }, [salaryStructures]);

  const totalMonthlyDeductions = Math.max(0, totalMonthlyGross - totalNetTakeHome);

  // Calculate live preview for Process Payroll tab
  const cycleWorkingDays = useMemo(() => {
    const [yearStr, monthStr] = selectedCycle.split('-');
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10);
    return new Date(y, m, 0).getDate();
  }, [selectedCycle]);

  const processRosterPreview = useMemo(() => {
    return activeStaff.map((emp) => {
      const struct = salaryStructures.find((s) => s.employeeId === emp.employeeId);
      const gross = struct ? struct.monthlyGross : 55000;
      const basic = struct ? struct.basic : Math.round(gross * 0.5);

      // Check attendance records for this month
      const empAtt = attendance.filter(
        (a) => a.employeeId === emp.employeeId && a.date && a.date.startsWith(selectedCycle)
      );

      let absentDays = 0;
      let halfDays = 0;
      let presentDays = 0;

      empAtt.forEach((a) => {
        if (a.status === 'Absent') absentDays += 1;
        else if (a.status === 'Half-Day' || a.status === 'Half Day') halfDays += 1;
        else presentDays += 1;
      });

      const lopDays = absentDays + halfDays * 0.5;
      const paidDays = Math.max(0, cycleWorkingDays - lopDays);
      const proration = cycleWorkingDays > 0 ? paidDays / cycleWorkingDays : 1;

      const proratedGross = Math.round(gross * proration);
      const proratedBasic = Math.round(basic * proration);
      const epf = Math.round(Math.min(proratedBasic, 15000) * 0.12);
      const esi = proratedGross <= 21000 ? Math.round(proratedGross * 0.0075) : 0;
      const pt = proratedGross > 0 ? 200 : 0;
      const tds = Math.round((struct?.tds || 0) * proration);
      const deductions = epf + esi + pt + tds;
      const net = proratedGross - deductions;

      return {
        emp,
        struct,
        presentDays: presentDays > 0 ? presentDays : paidDays,
        lopDays,
        paidDays,
        proratedGross,
        deductions,
        net,
      };
    });
  }, [activeStaff, salaryStructures, attendance, selectedCycle, cycleWorkingDays]);

  const previewBatchGross = processRosterPreview.reduce((sum, item) => sum + item.proratedGross, 0);
  const previewBatchDeductions = processRosterPreview.reduce((sum, item) => sum + item.deductions, 0);
  const previewBatchNet = processRosterPreview.reduce((sum, item) => sum + item.net, 0);

  // Filtered salary structures
  const filteredStructures = useMemo(() => {
    return salaryStructures.filter((s) => {
      const matchSearch =
        s.employeeName.toLowerCase().includes(structureSearch.toLowerCase()) ||
        s.employeeId.toLowerCase().includes(structureSearch.toLowerCase()) ||
        (s.designation && s.designation.toLowerCase().includes(structureSearch.toLowerCase()));

      const matchDept =
        selectedDeptFilter === 'All' ||
        (s.department && s.department.toLowerCase() === selectedDeptFilter.toLowerCase());

      return matchSearch && matchDept;
    });
  }, [salaryStructures, structureSearch, selectedDeptFilter]);

  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    salaryStructures.forEach((s) => {
      if (s.department) set.add(s.department);
    });
    return ['All', ...Array.from(set)];
  }, [salaryStructures]);

  // Open Edit Structure Modal
  const handleOpenEditStructure = (s: SalaryStructure) => {
    setEditingStructure(s);
    setEditBasic(String(s.basic || 0));
    setEditHra(String(s.hra || 0));
    setEditConveyance(String(s.conveyance || 0));
    setEditSpecial(String(s.specialAllowance || 0));
    setEditSite(String(s.siteAllowance || 0));
    setEditPt(String(s.pt || s.professionalTax || 200));
    setEditTds(String(s.tds || 0));
    setEditError(null);
  };

  // Live computed edit structure values
  const editBasicNum = parseFloat(editBasic) || 0;
  const editHraNum = parseFloat(editHra) || 0;
  const editConveyanceNum = parseFloat(editConveyance) || 0;
  const editSpecialNum = parseFloat(editSpecial) || 0;
  const editSiteNum = parseFloat(editSite) || 0;
  const editPtNum = parseFloat(editPt) || 0;
  const editTdsNum = parseFloat(editTds) || 0;

  const computedEditGross = editBasicNum + editHraNum + editConveyanceNum + editSpecialNum + editSiteNum;
  const computedEditEpf = Math.round(Math.min(editBasicNum, 15000) * 0.12);
  const computedEditEsi = computedEditGross <= 21000 ? Math.round(computedEditGross * 0.0075) : 0;
  const computedEditDeductions = computedEditEpf + computedEditEsi + editPtNum + editTdsNum;
  const computedEditNet = computedEditGross - computedEditDeductions;

  const handleSaveStructure = async () => {
    if (!editingStructure) return;

    if (
      editBasicNum < 0 ||
      editHraNum < 0 ||
      editConveyanceNum < 0 ||
      editSpecialNum < 0 ||
      editSiteNum < 0 ||
      editPtNum < 0 ||
      editTdsNum < 0
    ) {
      setEditError('Salary values cannot be negative.');
      return;
    }

    try {
      setIsSavingStructure(true);
      setEditError(null);
      await updateSalaryStructure(editingStructure.id, {
        basic: editBasicNum,
        hra: editHraNum,
        conveyance: editConveyanceNum,
        specialAllowance: editSpecialNum,
        siteAllowance: editSiteNum,
        pt: editPtNum,
        professionalTax: editPtNum,
        tds: editTdsNum,
      });

      setEditingStructure(null);
      Alert.alert('Success', `Salary structure updated for ${editingStructure.employeeName}.`);
    } catch (err: any) {
      setEditError(err.message || 'Failed to update salary structure.');
    } finally {
      setIsSavingStructure(false);
    }
  };

  // Execute Monthly Payroll
  const handleExecutePayroll = async () => {
    const cycleLabels: Record<string, string> = {
      '2026-09': 'September 2026',
      '2026-10': 'October 2026',
      '2026-08': 'August 2026',
      '2026-07': 'July 2026',
    };
    const cycleLabel = cycleLabels[selectedCycle] || selectedCycle;

    Alert.alert(
      'Execute Payroll Disbursal',
      `Confirm processing ${cycleLabel} payroll for ${activeStaff.length} active personnel?\n\nTotal Gross: ₹${previewBatchGross.toLocaleString('en-IN')}\nTotal Net: ₹${previewBatchNet.toLocaleString('en-IN')}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Disburse',
          style: 'default',
          onPress: async () => {
            try {
              setIsProcessing(true);
              const result = await processPayroll(selectedCycle, cycleLabel);
              setLastProcessedRun(result.run);
              setProcessSuccess(true);
              Alert.alert(
                'Payroll Disbursed',
                `Successfully finalized ${cycleLabel} payroll for ${result.run.totalEmployees} personnel.`
              );
            } catch (err: any) {
              Alert.alert('Processing Error', err.message || 'Failed to process monthly payroll.');
            } finally {
              setIsProcessing(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <AppHeader
        title="Payroll & Compensation"
        subtitle="Statutory computation, PF, ESI, PT, and salary disbursals"
        showBack
        onBack={() => navigation.goBack()}
        rightAction={
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Payslips')}
          >
            <FileText size={16} color={colors.primary} />
            <Text style={styles.headerBtnText}>Payslips</Text>
          </TouchableOpacity>
        }
      />

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <SegmentedControl
          options={['Overview', 'Structures', 'Process', 'History']}
          selectedIndex={
            activeTab === 'overview'
              ? 0
              : activeTab === 'structures'
              ? 1
              : activeTab === 'process'
              ? 2
              : 3
          }
          onSelect={(idx) => {
            const tabs: ('overview' | 'structures' | 'process' | 'history')[] = [
              'overview',
              'structures',
              'process',
              'history',
            ];
            setActiveTab(tabs[idx]);
          }}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* KPI Cards */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCol}>
                <StatCard
                  title="TOTAL MONTHLY GROSS"
                  value={
                    totalMonthlyGross > 0
                      ? `₹${totalMonthlyGross.toLocaleString('en-IN')}`
                      : '₹0'
                  }
                  caption="Gross compensation"
                  icon={<BadgeIndianRupee size={18} color="#2563EB" />}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="NET DISBURSED"
                  value={
                    totalNetTakeHome > 0
                      ? `₹${totalNetTakeHome.toLocaleString('en-IN')}`
                      : '₹0'
                  }
                  caption="Take-home remittance"
                  icon={<CheckCircle2 size={18} color="#059669" />}
                />
              </View>
            </View>

            <View style={styles.kpiGrid}>
              <View style={styles.kpiCol}>
                <StatCard
                  title="TOTAL DEDUCTIONS"
                  value={
                    totalMonthlyDeductions > 0
                      ? `₹${totalMonthlyDeductions.toLocaleString('en-IN')}`
                      : '₹0'
                  }
                  caption="PF, ESI, PT & TDS"
                  icon={<Clock size={18} color="#7C3AED" />}
                />
              </View>
              <View style={styles.kpiCol}>
                <StatCard
                  title="ON PAYROLL"
                  value={String(activeStaff.length)}
                  caption="Active personnel"
                  icon={<Users size={18} color="#D97706" />}
                />
              </View>
            </View>

            {/* Quick Actions Tiles */}
            <Text style={styles.sectionHeader}>PAYROLL WORKFLOWS</Text>
            <View style={styles.actionGrid}>
              {isHrOrAdmin && (
                <TouchableOpacity
                  style={styles.actionTile}
                  onPress={() => setActiveTab('process')}
                >
                  <View style={[styles.tileIconBox, { backgroundColor: '#EFF6FF' }]}>
                    <FileSpreadsheet size={20} color="#2563EB" />
                  </View>
                  <Text style={styles.tileTitle}>Process Monthly Payroll</Text>
                  <Text style={styles.tileSub}>
                    Calculate biometric attendance, LOP deductions, and execute disbursal.
                  </Text>
                  <View style={styles.tileFooter}>
                    <Text style={[styles.tileLink, { color: '#2563EB' }]}>Open Wizard</Text>
                    <ArrowRight size={14} color="#2563EB" />
                  </View>
                </TouchableOpacity>
              )}

              {isHrOrAdmin && (
                <TouchableOpacity
                  style={styles.actionTile}
                  onPress={() => setActiveTab('structures')}
                >
                  <View style={[styles.tileIconBox, { backgroundColor: '#EEF2FF' }]}>
                    <SlidersHorizontal size={20} color="#4F46E5" />
                  </View>
                  <Text style={styles.tileTitle}>CTC & Salary Structures</Text>
                  <Text style={styles.tileSub}>
                    Configure Basic, HRA, site allowances, PF, ESI, and PT for staff.
                  </Text>
                  <View style={styles.tileFooter}>
                    <Text style={[styles.tileLink, { color: '#4F46E5' }]}>Manage Structures</Text>
                    <ArrowRight size={14} color="#4F46E5" />
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.actionTile}
                onPress={() => navigation.navigate('Payslips')}
              >
                <View style={[styles.tileIconBox, { backgroundColor: '#ECFDF5' }]}>
                  <FileText size={20} color="#059669" />
                </View>
                <Text style={styles.tileTitle}>Employee Payslip Vault</Text>
                <Text style={styles.tileSub}>
                  View, export, and verify digitally certified Bansal Geo salary slips.
                </Text>
                <View style={styles.tileFooter}>
                  <Text style={[styles.tileLink, { color: '#059669' }]}>View Payslips</Text>
                  <ArrowRight size={14} color="#059669" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Recent Batches List */}
            <View style={styles.recentSectionHeader}>
              <Text style={styles.sectionHeader}>RECENT PAYROLL BATCHES</Text>
              {payrollRuns.length > 0 && (
                <TouchableOpacity onPress={() => setActiveTab('history')}>
                  <Text style={styles.seeAllText}>Full History ({payrollRuns.length})</Text>
                </TouchableOpacity>
              )}
            </View>

            {payrollRuns.length === 0 ? (
              <EmptyState
                icon={<Clock size={40} color={colors.text.tertiary} />}
                title="No payroll run yet"
                description="Execute your first monthly payroll batch to see historical compensation records here."
              />
            ) : (
              payrollRuns.slice(0, 3).map((run) => (
                <Card key={run.id} style={styles.runCard}>
                  <View style={styles.runHeader}>
                    <View>
                      <Text style={styles.runMonth}>{run.month}</Text>
                      <Text style={styles.runDate}>Processed: {run.processedDate}</Text>
                    </View>
                    <StatusBadge status={run.status || 'Completed'} size="sm" />
                  </View>

                  <View style={styles.runMetaGrid}>
                    <View style={styles.runMetaItem}>
                      <Text style={styles.runMetaLabel}>HEADCOUNT</Text>
                      <Text style={styles.runMetaVal}>{run.totalEmployees} Staff</Text>
                    </View>
                    <View style={styles.runMetaItem}>
                      <Text style={styles.runMetaLabel}>TOTAL GROSS</Text>
                      <Text style={styles.runMetaVal}>₹{run.totalGross.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.runMetaItem}>
                      <Text style={styles.runMetaLabel}>DEDUCTIONS</Text>
                      <Text style={[styles.runMetaVal, { color: colors.semantic.danger }]}>
                        -₹{run.totalDeductions.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.runMetaItem}>
                      <Text style={styles.runMetaLabel}>NET DISBURSED</Text>
                      <Text style={[styles.runMetaVal, { color: colors.semantic.success }]}>
                        ₹{run.totalNetDisbursed.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.runFooter}>
                    <Text style={styles.runAuthor}>Auth: {run.processedBy}</Text>
                    <TouchableOpacity
                      style={styles.runViewSlipsBtn}
                      onPress={() => navigation.navigate('Payslips')}
                    >
                      <Text style={styles.runViewSlipsText}>View Payslips</Text>
                      <ChevronRight size={14} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 2: SALARY STRUCTURES */}
        {/* ========================================================= */}
        {activeTab === 'structures' && (
          <View style={styles.tabContent}>
            {/* Search and Filters */}
            <View style={styles.searchBar}>
              <Search size={16} color={colors.text.tertiary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search staff by name or employee ID..."
                placeholderTextColor={colors.text.tertiary}
                value={structureSearch}
                onChangeText={setStructureSearch}
              />
              {structureSearch ? (
                <TouchableOpacity onPress={() => setStructureSearch('')}>
                  <X size={16} color={colors.text.tertiary} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Department Filter Chips */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
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

            <Text style={styles.resultCountText}>
              Showing {filteredStructures.length} employee salary structures
            </Text>

            {filteredStructures.length === 0 ? (
              <EmptyState
                icon={<SlidersHorizontal size={36} color={colors.text.tertiary} />}
                title="No salary structure configured"
                description="No structures found matching your search criteria."
              />
            ) : (
              filteredStructures.map((s) => (
                <Card key={s.id} style={styles.structureCard}>
                  <View style={styles.structHeader}>
                    <View style={styles.structTitleWrap}>
                      <Text style={styles.structEmpId}>{s.employeeId}</Text>
                      <Text style={styles.structEmpName}>{s.employeeName}</Text>
                      <Text style={styles.structEmpRole}>
                        {s.designation} • {s.department}
                      </Text>
                    </View>
                    <View style={styles.structCtcBadge}>
                      <Text style={styles.structCtcLabel}>ANNUAL CTC</Text>
                      <Text style={styles.structCtcVal}>
                        ₹{((s.annualCtc || s.monthlyGross * 12) / 100000).toFixed(1)} LPA
                      </Text>
                    </View>
                  </View>

                  {/* Component Breakdown Grid */}
                  <View style={styles.compGrid}>
                    <View style={styles.compCol}>
                      <Text style={styles.compLabel}>BASIC</Text>
                      <Text style={styles.compVal}>₹{s.basic.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.compCol}>
                      <Text style={styles.compLabel}>HRA</Text>
                      <Text style={styles.compVal}>₹{s.hra.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.compCol}>
                      <Text style={styles.compLabel}>SPECIAL</Text>
                      <Text style={styles.compVal}>₹{s.specialAllowance.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.compCol}>
                      <Text style={styles.compLabel}>PF (12%)</Text>
                      <Text style={[styles.compVal, { color: colors.semantic.danger }]}>
                        ₹{(s.providentFund || s.epf || 1800).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.structFooter}>
                    <View>
                      <Text style={styles.grossMonthlyLabel}>GROSS MONTHLY</Text>
                      <Text style={styles.grossMonthlyVal}>
                        ₹{s.monthlyGross.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.netHighlight}>
                      <Text style={styles.netHighlightLabel}>NET TAKE-HOME</Text>
                      <Text style={styles.netHighlightVal}>
                        ₹{(s.monthlyNet || s.netSalary || 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                    {isHrOrAdmin && (
                      <Button
                        title="Edit CTC"
                        variant="outline"
                        size="sm"
                        leftIcon={<Edit2 size={12} color={colors.primary} />}
                        onPress={() => handleOpenEditStructure(s)}
                      />
                    )}
                  </View>
                </Card>
              ))
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PROCESS MONTHLY PAYROLL WIZARD */}
        {/* ========================================================= */}
        {activeTab === 'process' && (
          <View style={styles.tabContent}>
            {processSuccess ? (
              <Card style={styles.successCard}>
                <View style={styles.successIconBox}>
                  <CheckCircle2 size={44} color="#059669" />
                </View>
                <Text style={styles.successTitle}>
                  {lastProcessedRun?.month || 'Monthly'} Payroll Finalized
                </Text>
                <Text style={styles.successDesc}>
                  All salaries, biometric attendance proration, statutory PF/ESI/PT/TDS remittances, and itemized payslips have been generated and archived in the employee vault.
                </Text>
                <View style={styles.successSummaryBox}>
                  <Text style={styles.successSummaryText}>
                    Personnel Processed: {lastProcessedRun?.totalEmployees || activeStaff.length}
                  </Text>
                  <Text style={styles.successSummaryText}>
                    Total Gross: ₹{(lastProcessedRun?.totalGross || 0).toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.successSummaryText}>
                    Net Transferred: ₹{(lastProcessedRun?.totalNetDisbursed || 0).toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={styles.successActions}>
                  <Button
                    title="Process Another Cycle"
                    variant="outline"
                    onPress={() => setProcessSuccess(false)}
                    style={{ flex: 1 }}
                  />
                  <Button
                    title="View Payslips"
                    variant="primary"
                    onPress={() => navigation.navigate('Payslips')}
                    style={{ flex: 1 }}
                  />
                </View>
              </Card>
            ) : (
              <View style={{ gap: spacing.md }}>
                {/* Step 1: Select Cycle */}
                <Card style={styles.stepCard}>
                  <Text style={styles.stepTitle}>Step 1: Select Disbursal Cycle</Text>
                  <View style={styles.cycleChips}>
                    {[
                      { key: '2026-09', label: 'September 2026 (Current)' },
                      { key: '2026-10', label: 'October 2026 (Upcoming)' },
                      { key: '2026-08', label: 'August 2026 (Re-run)' },
                    ].map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.cycleChip,
                          selectedCycle === item.key && styles.cycleChipActive,
                        ]}
                        onPress={() => setSelectedCycle(item.key)}
                      >
                        <Text
                          style={[
                            styles.cycleChipText,
                            selectedCycle === item.key && styles.cycleChipTextActive,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.syncStatusRow}>
                    <ShieldCheck size={16} color="#059669" />
                    <Text style={styles.syncStatusText}>
                      Biometric Attendance Synced • 2026 Statutory Tax Slabs Verified
                    </Text>
                  </View>
                </Card>

                {/* Step 2: Batch Preliminary Summary */}
                <View style={styles.kpiGrid}>
                  <View style={styles.kpiCol}>
                    <StatCard
                      title="ELIGIBLE HEADCOUNT"
                      value={`${activeStaff.length} Staff`}
                      caption={`Working days: ${cycleWorkingDays}`}
                      icon={<Users size={18} color="#2563EB" />}
                    />
                  </View>
                  <View style={styles.kpiCol}>
                    <StatCard
                      title="TOTAL GROSS DISBURSAL"
                      value={`₹${previewBatchGross.toLocaleString('en-IN')}`}
                      caption="Calculated gross"
                      icon={<BadgeIndianRupee size={18} color="#059669" />}
                    />
                  </View>
                </View>

                <View style={styles.kpiGrid}>
                  <View style={styles.kpiCol}>
                    <StatCard
                      title="STATUTORY DEDUCTIONS"
                      value={`-₹${previewBatchDeductions.toLocaleString('en-IN')}`}
                      caption="PF, ESI, PT & TDS"
                      icon={<Clock size={18} color="#E11D48" />}
                    />
                  </View>
                  <View style={styles.kpiCol}>
                    <StatCard
                      title="NET BANK DISBURSAL"
                      value={`₹${previewBatchNet.toLocaleString('en-IN')}`}
                      caption="Net take-home total"
                      icon={<CheckCircle2 size={18} color="#0D9488" />}
                    />
                  </View>
                </View>

                {/* Step 3: Employee Disbursal Roster */}
                <Text style={styles.sectionHeader}>
                  EMPLOYEE DISBURSAL ROSTER ({processRosterPreview.length})
                </Text>

                {processRosterPreview.map((item) => (
                  <Card key={item.emp.id} style={styles.rosterCard}>
                    <View style={styles.rosterHeader}>
                      <View>
                        <Text style={styles.rosterEmpId}>{item.emp.employeeId}</Text>
                        <Text style={styles.rosterEmpName}>{item.emp.name}</Text>
                        <Text style={styles.rosterEmpDept}>{item.emp.employment?.department}</Text>
                      </View>
                      <View style={styles.rosterDaysBadge}>
                        <Text style={styles.rosterDaysLabel}>PAYABLE DAYS</Text>
                        <Text style={styles.rosterDaysVal}>
                          {item.paidDays} / {cycleWorkingDays}
                        </Text>
                        {item.lopDays > 0 ? (
                          <Text style={styles.rosterLopText}>{item.lopDays} LOP</Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.rosterFinancials}>
                      <View style={styles.rosterFinCol}>
                        <Text style={styles.rosterFinLabel}>MONTHLY GROSS</Text>
                        <Text style={styles.rosterFinVal}>
                          ₹{item.proratedGross.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.rosterFinCol}>
                        <Text style={styles.rosterFinLabel}>DEDUCTIONS</Text>
                        <Text style={[styles.rosterFinVal, { color: colors.semantic.danger }]}>
                          -₹{item.deductions.toLocaleString('en-IN')}
                        </Text>
                      </View>
                      <View style={styles.rosterFinCol}>
                        <Text style={styles.rosterFinLabel}>NET TAKE-HOME</Text>
                        <Text style={[styles.rosterFinVal, { color: colors.semantic.success }]}>
                          ₹{item.net.toLocaleString('en-IN')}
                        </Text>
                      </View>
                    </View>
                  </Card>
                ))}

                {/* Action Button */}
                {isHrOrAdmin && (
                  <Button
                    title={
                      isProcessing
                        ? 'Executing Monthly Disbursal...'
                        : `Execute ${selectedCycle} Payroll Disbursal`
                    }
                    variant="primary"
                    size="lg"
                    loading={isProcessing}
                    leftIcon={<Play size={18} color="#FFFFFF" />}
                    onPress={handleExecutePayroll}
                    style={{ marginTop: spacing.md }}
                  />
                )}
              </View>
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PAYROLL HISTORY */}
        {/* ========================================================= */}
        {activeTab === 'history' && (
          <View style={styles.tabContent}>
            <Text style={styles.sectionHeader}>HISTORICAL AUDIT ARCHIVE</Text>

            {payrollRuns.length === 0 ? (
              <EmptyState
                icon={<History size={40} color={colors.text.tertiary} />}
                title="No payroll run yet"
                description="Completed monthly payroll executions will be archived here for financial audit and compliance."
              />
            ) : (
              payrollRuns.map((run) => (
                <Card key={run.id} style={styles.runCard}>
                  <View style={styles.runHeader}>
                    <View>
                      <Text style={styles.runMonth}>{run.month}</Text>
                      <Text style={styles.runDate}>Executed: {run.processedDate}</Text>
                    </View>
                    <StatusBadge status={run.status || 'Completed'} size="sm" />
                  </View>

                  <View style={styles.runMetaGrid}>
                    <View style={styles.runMetaItem}>
                      <Text style={styles.runMetaLabel}>STAFF PROCESSED</Text>
                      <Text style={styles.runMetaVal}>{run.totalEmployees} Personnel</Text>
                    </View>
                    <View style={styles.runMetaItem}>
                      <Text style={styles.runMetaLabel}>TOTAL GROSS</Text>
                      <Text style={styles.runMetaVal}>₹{run.totalGross.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.runMetaItem}>
                      <Text style={styles.runMetaLabel}>TOTAL DEDUCTIONS</Text>
                      <Text style={[styles.runMetaVal, { color: colors.semantic.danger }]}>
                        -₹{run.totalDeductions.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.runMetaItem}>
                      <Text style={styles.runMetaLabel}>NET DISBURSED</Text>
                      <Text style={[styles.runMetaVal, { color: colors.semantic.success }]}>
                        ₹{run.totalNetDisbursed.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.runFooter}>
                    <Text style={styles.runAuthor}>Authorized By: {run.processedBy}</Text>
                    <TouchableOpacity
                      style={styles.runViewSlipsBtn}
                      onPress={() => navigation.navigate('Payslips')}
                    >
                      <Text style={styles.runViewSlipsText}>View Payslips</Text>
                      <ChevronRight size={14} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </Card>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* EDIT SALARY STRUCTURE MODAL */}
      {/* ========================================================= */}
      <Modal
        visible={!!editingStructure}
        animationType="slide"
        transparent
        onRequestClose={() => setEditingStructure(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Adjust Compensation</Text>
                <Text style={styles.modalSubtitle}>
                  {editingStructure?.employeeName} ({editingStructure?.employeeId})
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setEditingStructure(null)}
              >
                <X size={20} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {editError ? (
                <View style={styles.errorBox}>
                  <AlertCircle size={16} color={colors.semantic.danger} />
                  <Text style={styles.errorText}>{editError}</Text>
                </View>
              ) : null}

              <Text style={styles.modalSectionTitle}>MONTHLY EARNINGS (₹)</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Basic Salary</Text>
                <TextInput
                  style={styles.numInput}
                  keyboardType="numeric"
                  value={editBasic}
                  onChangeText={setEditBasic}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>House Rent Allowance (HRA)</Text>
                <TextInput
                  style={styles.numInput}
                  keyboardType="numeric"
                  value={editHra}
                  onChangeText={setEditHra}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Conveyance Allowance</Text>
                <TextInput
                  style={styles.numInput}
                  keyboardType="numeric"
                  value={editConveyance}
                  onChangeText={setEditConveyance}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Special Allowance</Text>
                <TextInput
                  style={styles.numInput}
                  keyboardType="numeric"
                  value={editSpecial}
                  onChangeText={setEditSpecial}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Site / Field Duty Allowance</Text>
                <TextInput
                  style={styles.numInput}
                  keyboardType="numeric"
                  value={editSite}
                  onChangeText={setEditSite}
                />
              </View>

              <Text style={[styles.modalSectionTitle, { marginTop: spacing.md }]}>
                STATUTORY DEDUCTIONS (₹)
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Professional Tax (PT)</Text>
                <TextInput
                  style={styles.numInput}
                  keyboardType="numeric"
                  value={editPt}
                  onChangeText={setEditPt}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tax Deducted at Source (TDS)</Text>
                <TextInput
                  style={styles.numInput}
                  keyboardType="numeric"
                  value={editTds}
                  onChangeText={setEditTds}
                />
              </View>

              {/* Computed Live Summary */}
              <View style={styles.computedBox}>
                <Text style={styles.computedTitle}>CALCULATED COMPENSATION</Text>
                <View style={styles.computedRow}>
                  <Text style={styles.computedLabel}>Gross Monthly:</Text>
                  <Text style={styles.computedVal}>₹{computedEditGross.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.computedRow}>
                  <Text style={styles.computedLabel}>EPF Contribution (12%):</Text>
                  <Text style={styles.computedVal}>₹{computedEditEpf.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.computedRow}>
                  <Text style={styles.computedLabel}>ESI Contribution:</Text>
                  <Text style={styles.computedVal}>₹{computedEditEsi.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.computedRow}>
                  <Text style={styles.computedLabel}>Total Deductions:</Text>
                  <Text style={[styles.computedVal, { color: colors.semantic.danger }]}>
                    -₹{computedEditDeductions.toLocaleString('en-IN')}
                  </Text>
                </View>
                <View style={[styles.computedRow, styles.computedRowNet]}>
                  <Text style={styles.computedNetLabel}>Net Take-Home:</Text>
                  <Text style={styles.computedNetVal}>₹{computedEditNet.toLocaleString('en-IN')}</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setEditingStructure(null)}
                style={{ flex: 1 }}
              />
              <Button
                title="Save Structure"
                variant="primary"
                loading={isSavingStructure}
                onPress={handleSaveStructure}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    backgroundColor: `${colors.primary}15`,
  },
  headerBtnText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  tabsWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  tabContent: {
    gap: spacing.md,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  kpiCol: {
    flex: 1,
  },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    marginTop: spacing.xs,
  },
  actionGrid: {
    gap: spacing.sm,
  },
  actionTile: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  tileIconBox: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  tileTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: 2,
  },
  tileSub: {
    ...typography.caption,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  tileFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: spacing.sm,
  },
  tileLink: {
    ...typography.caption,
    fontWeight: '700',
  },
  recentSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  seeAllText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  runCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  runHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  runMonth: {
    ...typography.h4,
    color: colors.text.primary,
  },
  runDate: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: 1,
  },
  runMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  runMetaItem: {
    alignItems: 'center',
  },
  runMetaLabel: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '700',
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  runMetaVal: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  runFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.xs,
  },
  runAuthor: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.secondary,
  },
  runViewSlipsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  runViewSlipsText: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.primary,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  searchInput: {
    flex: 1,
    ...typography.bodySmall,
    color: colors.text.primary,
    padding: 0,
  },
  filterScroll: {
    gap: spacing.xs,
    paddingVertical: 2,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  resultCountText: {
    ...typography.caption,
    color: colors.text.tertiary,
    fontSize: 11,
  },
  structureCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  structHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  structTitleWrap: {
    flex: 1,
  },
  structEmpId: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
  },
  structEmpName: {
    ...typography.h4,
    color: colors.text.primary,
    marginTop: 1,
  },
  structEmpRole: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  structCtcBadge: {
    backgroundColor: `${colors.primary}12`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    alignItems: 'flex-end',
  },
  structCtcLabel: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '700',
    color: colors.primary,
  },
  structCtcVal: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
  },
  compGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  compCol: {
    alignItems: 'center',
  },
  compLabel: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '700',
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  compVal: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  structFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: spacing.xs,
  },
  grossMonthlyLabel: {
    ...typography.caption,
    fontSize: 9,
    color: colors.text.tertiary,
  },
  grossMonthlyVal: {
    ...typography.bodySmall,
    fontWeight: '700',
    color: colors.text.primary,
  },
  netHighlight: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  netHighlightLabel: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '700',
    color: '#059669',
  },
  netHighlightVal: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: '#059669',
  },
  stepCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
  },
  stepTitle: {
    ...typography.h4,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  cycleChips: {
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  cycleChip: {
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  cycleChipActive: {
    backgroundColor: `${colors.primary}15`,
    borderColor: colors.primary,
  },
  cycleChipText: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.text.secondary,
  },
  cycleChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  syncStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
  syncStatusText: {
    ...typography.caption,
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  rosterCard: {
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  rosterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  rosterEmpId: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.primary,
  },
  rosterEmpName: {
    ...typography.body,
    fontWeight: '700',
    color: colors.text.primary,
  },
  rosterEmpDept: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  rosterDaysBadge: {
    alignItems: 'flex-end',
  },
  rosterDaysLabel: {
    ...typography.caption,
    fontSize: 8,
    fontWeight: '700',
    color: colors.text.tertiary,
  },
  rosterDaysVal: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  rosterLopText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.semantic.danger,
    fontWeight: '700',
  },
  rosterFinancials: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.background.tertiary,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  rosterFinCol: {
    alignItems: 'center',
  },
  rosterFinLabel: {
    ...typography.caption,
    fontSize: 8,
    color: colors.text.tertiary,
    marginBottom: 2,
  },
  rosterFinVal: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  successCard: {
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  successIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successTitle: {
    ...typography.h3,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  successDesc: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: spacing.lg,
  },
  successSummaryBox: {
    width: '100%',
    backgroundColor: colors.background.tertiary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: 4,
    marginBottom: spacing.lg,
  },
  successSummaryText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  successActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
    padding: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.subtle,
    paddingBottom: spacing.sm,
    marginBottom: spacing.md,
  },
  modalTitle: {
    ...typography.h4,
    color: colors.text.primary,
  },
  modalSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: 1,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  modalScroll: {
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${colors.semantic.danger}15`,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  errorText: {
    ...typography.caption,
    color: colors.semantic.danger,
    fontWeight: '600',
  },
  modalSectionTitle: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  numInput: {
    backgroundColor: colors.background.tertiary,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    color: colors.text.primary,
    ...typography.body,
    fontWeight: '600',
  },
  computedBox: {
    backgroundColor: colors.background.tertiary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginTop: spacing.md,
    gap: 6,
  },
  computedTitle: {
    ...typography.caption,
    fontSize: 9,
    fontWeight: '800',
    color: colors.text.tertiary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  computedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  computedRowNet: {
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
    paddingTop: 6,
    marginTop: 4,
  },
  computedLabel: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  computedVal: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
  },
  computedNetLabel: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: '#059669',
  },
  computedNetVal: {
    ...typography.bodySmall,
    fontWeight: '800',
    color: '#059669',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.subtle,
  },
});
