import { useState, useMemo } from 'react';
import { Alert } from 'react-native';
import { useHrms, useAuth } from '../../context';
import { SalaryStructure, PayrollRun } from '../../types';

export const usePayroll = () => {
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

  const [selectedCycle, setSelectedCycle] = useState('2026-09');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processSuccess, setProcessSuccess] = useState(false);
  const [lastProcessedRun, setLastProcessedRun] = useState<PayrollRun | null>(null);

  const [structureSearch, setStructureSearch] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All');

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

  const activeStaff = useMemo(() => {
    return employees.filter(
      (e) => e.employment?.status !== 'Terminated' && e.employment?.status !== 'Resigned'
    );
  }, [employees]);

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

  const previewBatchGross = useMemo(() => {
    return processRosterPreview.reduce((sum, item) => sum + item.proratedGross, 0);
  }, [processRosterPreview]);

  const previewBatchDeductions = useMemo(() => {
    return processRosterPreview.reduce((sum, item) => sum + item.deductions, 0);
  }, [processRosterPreview]);

  const previewBatchNet = useMemo(() => {
    return processRosterPreview.reduce((sum, item) => sum + item.net, 0);
  }, [processRosterPreview]);

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

  return {
    isHrOrAdmin,
    activeTab,
    setActiveTab,
    selectedCycle,
    setSelectedCycle,
    isProcessing,
    processSuccess,
    setProcessSuccess,
    lastProcessedRun,
    structureSearch,
    setStructureSearch,
    selectedDeptFilter,
    setSelectedDeptFilter,
    editingStructure,
    setEditingStructure,
    editBasic,
    setEditBasic,
    editHra,
    setEditHra,
    editConveyance,
    setEditConveyance,
    editSpecial,
    setEditSpecial,
    editSite,
    setEditSite,
    editPt,
    setEditPt,
    editTds,
    setEditTds,
    editError,
    isSavingStructure,
    activeStaff,
    totalMonthlyGross,
    totalNetTakeHome,
    totalMonthlyDeductions,
    cycleWorkingDays,
    processRosterPreview,
    previewBatchGross,
    previewBatchDeductions,
    previewBatchNet,
    filteredStructures,
    departmentsList,
    handleOpenEditStructure,
    computedEditGross,
    computedEditEpf,
    computedEditEsi,
    computedEditDeductions,
    computedEditNet,
    handleSaveStructure,
    handleExecutePayroll,
    payrollRuns,
  };
};
