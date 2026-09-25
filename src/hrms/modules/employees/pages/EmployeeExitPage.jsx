import React, { useState, useEffect, useMemo } from 'react';
import { UserMinus, CheckCircle2, Clock, AlertCircle, FileCheck2, Download, CreditCard, Plus, Search, X, HelpCircle, ChevronDown, RotateCcw, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Textarea } from '@/components/common/Textarea';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { exitService } from '@/modules/employees/services/exit.service';
export const EmployeeExitPage = () => {
    const toast = useToast();
    const { user } = useAuth();
    const [exits, setExits] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedType, setSelectedType] = useState('all');
    const [selectedDept, setSelectedDept] = useState('all');
    const [loading, setLoading] = useState(true);
    // Modals
    const [isInitiateModalOpen, setIsInitiateModalOpen] = useState(false);
    const [managingClearanceExit, setManagingClearanceExit] = useState(null);
    const [viewingFnFExit, setViewingFnFExit] = useState(null);
    // Initiate Exit Form
    const [formEmpName, setFormEmpName] = useState('Deepak Chouhan');
    const [formEmpId, setFormEmpId] = useState('BGS-024');
    const [formDept, setFormDept] = useState('Geology & Mineral Exploration');
    const [formDesig, setFormDesig] = useState('Field Geologist');
    const [formType, setFormType] = useState('Resignation');
    const [formLWD, setFormLWD] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('en-CA');
    });
    const [formReason, setFormReason] = useState('');
    const loadData = async () => {
        setLoading(true);
        const data = await exitService.getExits();
        setExits(data);
        setLoading(false);
    };
    useEffect(() => {
        loadData();
    }, []);
    const filteredExits = useMemo(() => {
        return exits.filter((e) => {
            const matchStatus = selectedStatus === 'all' || e.status === selectedStatus;
            const matchType = selectedType === 'all' || e.exitType === selectedType;
            const matchDept = selectedDept === 'all' || e.department.toLowerCase().includes(selectedDept.toLowerCase());
            const matchSearch = !searchQuery ||
                e.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.designation.toLowerCase().includes(searchQuery.toLowerCase());
            return matchStatus && matchType && matchDept && matchSearch;
        });
    }, [exits, selectedStatus, selectedType, selectedDept, searchQuery]);
    const stats = useMemo(() => {
        const active = exits.filter((e) => e.status !== 'Settled & Relieved' && e.status !== 'Revoked').length;
        let pendingClearanceCount = 0;
        exits.forEach((e) => {
            if (e.status === 'In Clearance' || e.status === 'Initiated') {
                pendingClearanceCount += e.clearances.filter((c) => c.status === 'Pending').length;
            }
        });
        const completed = exits.filter((e) => e.status === 'Settled & Relieved').length;
        return { active, pendingClearanceCount, completed, avgNotice: 96 };
    }, [exits]);
    const handleInitiateExit = async () => {
        if (!formEmpName || !formReason) {
            toast.error('Please enter employee name and reason for exit.', 'Validation Error');
            return;
        }
        await exitService.initiateExit({
            employeeId: formEmpId,
            employeeName: formEmpName,
            department: formDept,
            designation: formDesig,
            exitType: formType,
            resignationDate: new Date().toLocaleDateString('en-CA'),
            requestedLWD: formLWD,
            approvedLWD: formLWD,
            noticePeriodDays: 30,
            noticeServedDays: 30,
            reason: formReason,
            status: 'In Clearance',
            exitInterviewDone: false,
            fnf: {
                id: `fnf-${Date.now()}`,
                exitRequestId: '',
                employeeId: formEmpId,
                payableDaysSalary: 35000,
                leaveEncashmentAmount: 12000,
                gratuityAmount: 0,
                annualBonusAmount: 0,
                grossPayable: 47000,
                noticeShortfallDeduction: 0,
                unsettledAdvanceDeduction: 0,
                taxTdsDeduction: 1200,
                totalDeductions: 1200,
                netPayable: 45800,
                paymentStatus: 'Pending',
            },
        });
        toast.success(`Exit and clearance workflow initiated for ${formEmpName}.`, 'Separation Initiated');
        setIsInitiateModalOpen(false);
        setFormReason('');
        loadData();
    };
    const handleClearanceUpdate = async (exitId, dept, status, notes) => {
        await exitService.updateClearance(exitId, dept, status, notes);
        toast.success(`${dept} clearance updated to ${status}.`, 'Clearance Recorded');
        const updatedExits = await exitService.getExits();
        setExits(updatedExits);
        const updated = updatedExits.find((e) => e.id === exitId);
        if (updated)
            setManagingClearanceExit(updated);
    };
    const handleFinalizeFnF = async (exitId) => {
        await exitService.finalizeFnF(exitId);
        toast.success('Full & Final Settlement processed. Relieving Letter ready.', 'F&F Completed');
        setViewingFnFExit(null);
        loadData();
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Settled & Relieved':
                return 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60';
            case 'FnF Pending':
                return 'bg-amber-50 text-[#B07D27] dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60';
            case 'In Clearance':
                return 'bg-teal-50 text-teal-800 dark:bg-teal-950/50 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800/60';
            default:
                return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
        }
    };
    return (<div className="space-y-6 pb-12 animate-fade-in">
      {/* Header */}
      <PageHeader title="Employee Exit & Separation Management" description="Resignation processing, 4-department clearance workflows (IT, Admin, Finance, HR), and Full & Final (F&F) settlements." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Workforce', path: '/hr/employees' },
            { label: 'Exit Management' },
        ]} actions={<Button variant="primary" size="sm" onClick={() => setIsInitiateModalOpen(true)} leftIcon={<Plus className="w-4 h-4"/>}>
            Initiate Exit / Resignation
          </Button>}/>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard title="Active Exits in Pipeline" value={`${stats.active} Cases`} icon={<UserMinus className="w-5 h-5 text-teal-700 dark:text-teal-400"/>} iconBgColor="bg-teal-50 dark:bg-teal-950/40 text-teal-700 border border-teal-200/60" change="In Pipeline" changeType="neutral" caption="Resignations under process"/>
        <StatCard title="Pending Clearances" value={`${stats.pendingClearanceCount} Sign-offs`} icon={<Clock className="w-5 h-5 text-[#B07D27] dark:text-amber-400"/>} iconBgColor="bg-amber-50 dark:bg-amber-950/40 text-[#B07D27] border border-amber-200/60" change="Dept Tasks" changeType="neutral" caption="IT, Admin, Finance, HR"/>
        <StatCard title="Settled & Relieved" value={`${stats.completed} Completed`} icon={<CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400"/>} iconBgColor="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border border-emerald-200/60" change="Full & Final" changeType="increase" caption="Relieving letters issued"/>
        <StatCard title="Notice Period Compliance" value={`${stats.avgNotice}%`} icon={<FileCheck2 className="w-5 h-5 text-[#31485A] dark:text-slate-300"/>} iconBgColor="bg-slate-100 dark:bg-slate-800 text-[#31485A] border border-slate-200/60" change="Adherence" changeType="increase" caption="Standard 30 days served"/>
      </div>

      {/* Search & Filter Bar */}
      <Card className="p-3.5 sm:p-4 border border-slate-200/90 dark:border-[#253344] shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by employee name, BGS ID, or role..." className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#111821] border border-slate-200 dark:border-[#253344] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 shadow-2xs transition-all"/>
            {searchQuery && (<button type="button" onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5" title="Clear search">
                <X className="w-3.5 h-3.5"/>
              </button>)}
          </div>

          {/* Filters & Actions Group */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Status Filter */}
            <div className="relative min-w-[160px]">
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111821] border border-slate-200 dark:border-[#253344] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer shadow-2xs transition-all">
                <option value="all">📁 All Exit Statuses</option>
                <option value="In Clearance">In Clearance</option>
                <option value="FnF Pending">F&F Pending</option>
                <option value="Settled & Relieved">Settled & Relieved</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"/>
            </div>

            {/* Exit Type Filter */}
            <div className="relative min-w-[155px]">
              <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111821] border border-slate-200 dark:border-[#253344] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer shadow-2xs transition-all">
                <option value="all">📋 All Exit Types</option>
                <option value="Resignation">Resignation</option>
                <option value="Mutual Separation">Mutual Separation</option>
                <option value="Retirement">Retirement</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"/>
            </div>

            {/* Department Filter */}
            <div className="relative min-w-[160px]">
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full appearance-none pl-3 pr-8 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#111821] border border-slate-200 dark:border-[#253344] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer shadow-2xs transition-all">
                <option value="all">🏢 All Departments</option>
                <option value="Geology">Geology & Exploration</option>
                <option value="GIS">GIS & Remote Sensing</option>
                <option value="Finance">Finance & Accounts</option>
                <option value="HR">HR & Administration</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"/>
            </div>

            {/* Reset Button (when active filters exist) */}
            {(selectedStatus !== 'all' || selectedType !== 'all' || selectedDept !== 'all' || searchQuery) && (<button type="button" onClick={() => {
                setSelectedStatus('all');
                setSelectedType('all');
                setSelectedDept('all');
                setSearchQuery('');
            }} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 transition-all shadow-2xs cursor-pointer" title="Reset all filters">
                <RotateCcw className="w-3.5 h-3.5"/>
                <span>Reset</span>
              </button>)}

            {/* Counter Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100/90 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 text-xs font-medium border border-slate-200/70 dark:border-slate-700/60">
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">{filteredExits.length}</span>
              <span>records</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Exits Table */}
      <Card className="overflow-hidden border border-slate-200/90 dark:border-[#253344] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#253344] bg-[#F8FAFC] dark:bg-[#111821]/80 text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">Employee</th>
                <th className="py-3.5 px-4 font-semibold">Exit Type & Dates</th>
                <th className="py-3.5 px-4 font-semibold">Clearance Checklist (4 Depts)</th>
                <th className="py-3.5 px-4 font-semibold">F&F Settlement</th>
                <th className="py-3.5 px-4 font-semibold">Exit Status</th>
                <th className="py-3.5 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#253344]">
              {filteredExits.length === 0 ? (<tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No employee exit records found matching filters.
                  </td>
                </tr>) : (filteredExits.map((exit) => {
            const approvedClearances = exit.clearances.filter((c) => c.status === 'Approved').length;
            return (<tr key={exit.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                      {/* Employee */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {exit.avatar ? (<img src={exit.avatar} alt={exit.employeeName} className="w-9 h-9 rounded-full object-cover ring-2 ring-teal-600/20 dark:ring-teal-500/20 shrink-0"/>) : (<div className="w-9 h-9 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold flex items-center justify-center text-xs ring-2 ring-teal-600/20 shrink-0">
                              {exit.employeeName.charAt(0)}
                            </div>)}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-[13px] leading-snug">
                              {exit.employeeName}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[10px] font-bold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-200/70 dark:border-teal-800/40">
                                {exit.employeeId}
                              </span>
                              <span className="text-[11.5px] text-slate-500 dark:text-slate-400 font-medium">
                                {exit.designation}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                            {exit.exitType}
                          </span>
                          <p className="text-[11.5px] text-slate-500 dark:text-slate-400 mt-1">
                            LWD: <strong className="text-slate-900 dark:text-white font-semibold">{exit.approvedLWD}</strong>
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                            Notice: <span className="font-semibold text-slate-600 dark:text-slate-300">{exit.noticeServedDays}/{exit.noticePeriodDays}d</span>
                          </p>
                        </div>
                      </td>

                      {/* 4-Dept Clearance Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {exit.clearances.map((c) => {
                    const shortName = c.department.split(' ')[0];
                    const isApproved = c.status === 'Approved';
                    return (<span key={c.id} title={`${c.department}: ${c.status}`} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors ${isApproved
                            ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/50'
                            : 'bg-amber-50 text-[#B07D27] dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/50'}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${isApproved ? 'bg-emerald-600' : 'bg-[#B07D27]'}`}/>
                                {shortName}
                              </span>);
                })}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          <span className={`w-2 h-2 rounded-full ${approvedClearances === 4 ? 'bg-emerald-500' : 'bg-teal-500'}`}/>
                          <span>{approvedClearances} of 4 cleared</span>
                        </div>
                      </td>

                      {/* F&F Settlement */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {exit.fnf ? (<div>
                            <p className="font-bold text-[13.5px] text-slate-900 dark:text-white tabular-nums tracking-tight">
                              ₹{exit.fnf.netPayable.toLocaleString('en-IN')}
                            </p>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold mt-1 ${exit.fnf.paymentStatus === 'Processed'
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/60'
                        : 'bg-amber-50 text-[#B07D27] dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/60'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${exit.fnf.paymentStatus === 'Processed' ? 'bg-emerald-500' : 'bg-[#B07D27]'}`}/>
                              {exit.fnf.paymentStatus === 'Processed' ? 'Settled & Disbursed' : 'F&F Calculated'}
                            </span>
                          </div>) : (<span className="text-[11px] font-medium text-slate-400">Pending Clearances</span>)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold ${getStatusBadge(exit.status)}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${exit.status === 'Settled & Relieved'
                    ? 'bg-emerald-500'
                    : exit.status === 'FnF Pending'
                        ? 'bg-[#B07D27]'
                        : 'bg-teal-600 animate-pulse'}`}/>
                          {exit.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button type="button" onClick={() => setManagingClearanceExit(exit)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 dark:bg-[#1A2430] dark:hover:bg-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-all shadow-2xs hover:shadow cursor-pointer">
                            <FileCheck2 className="w-3.5 h-3.5 text-teal-700 dark:text-teal-400"/>
                            <span>Clearances</span>
                          </button>
                          <button type="button" onClick={() => setViewingFnFExit(exit)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-50/80 hover:bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:hover:bg-teal-900/50 dark:text-teal-300 border border-teal-200/90 dark:border-teal-800/60 transition-all shadow-2xs hover:shadow cursor-pointer">
                            <CreditCard className="w-3.5 h-3.5 text-teal-700 dark:text-teal-300"/>
                            <span>F&F Sheet</span>
                          </button>
                        </div>
                      </td>
                    </tr>);
        }))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── MODAL: 4-DEPARTMENT CLEARANCES ── */}
      {managingClearanceExit && (<Modal isOpen={true} onClose={() => setManagingClearanceExit(null)} title={`Department Clearances • ${managingClearanceExit.employeeName} (${managingClearanceExit.employeeId})`} maxWidth="lg">
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  Last Working Day: {managingClearanceExit.approvedLWD}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Reason: {managingClearanceExit.reason}
                </p>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getStatusBadge(managingClearanceExit.status)}`}>
                {managingClearanceExit.status}
              </span>
            </div>

            {/* Checklist per department */}
            <div className="space-y-3">
              {managingClearanceExit.clearances.map((c) => (<div key={c.id} className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-[#1A2430] shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        {c.department} Clearance
                      </span>
                      <span className="text-[10.5px] text-slate-400">
                        • Verified by {c.reviewerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.status === 'Approved'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200'
                    : 'bg-amber-50 text-[#B07D27] dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200'}`}>
                        {c.status}
                      </span>

                      {c.status !== 'Approved' && (<button type="button" onClick={() => handleClearanceUpdate(managingClearanceExit.id, c.department, 'Approved', 'Verified and all assets/dues successfully cleared.')} className="px-2 py-0.5 rounded-lg text-[10.5px] font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-2xs transition-colors">
                          Sign-off Clearance
                        </button>)}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    <strong>Checklist Notes:</strong> {c.checklistNotes}
                  </p>
                  {c.pendingDuesOrAssets && (<p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5"/>
                      Pending: {c.pendingDuesOrAssets}
                    </p>)}
                  {c.clearanceDate && (<p className="text-[10px] text-slate-400 mt-1">Cleared on {c.clearanceDate}</p>)}
                </div>))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="primary" size="sm" onClick={() => setManagingClearanceExit(null)}>
                Done
              </Button>
            </div>
          </div>
        </Modal>)}

      {/* ── MODAL: FULL & FINAL (F&F) SETTLEMENT SHEET ── */}
      {viewingFnFExit && viewingFnFExit.fnf && (<Modal isOpen={true} onClose={() => setViewingFnFExit(null)} title={`Full & Final (F&F) Settlement Statement • ${viewingFnFExit.employeeName}`} maxWidth="lg">
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-xs">
                  {viewingFnFExit.employeeName} ({viewingFnFExit.employeeId})
                </p>
                <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {viewingFnFExit.designation} • {viewingFnFExit.department}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">Relieving Date</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{viewingFnFExit.approvedLWD}</span>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Earnings & Payables */}
              <div className="p-3.5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <h5 className="font-bold text-emerald-800 dark:text-emerald-300 text-xs uppercase tracking-wider mb-2.5 pb-1 border-b border-emerald-200/60">
                  Gross Payables & Accruals
                </h5>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Worked Days Salary:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{viewingFnFExit.fnf.payableDaysSalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Earned Leave Encashment:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{viewingFnFExit.fnf.leaveEncashmentAmount.toLocaleString('en-IN')}</span>
                  </div>
                  {viewingFnFExit.fnf.gratuityAmount > 0 && (<div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Statutory Gratuity:</span>
                      <span className="font-bold text-slate-900 dark:text-white">₹{viewingFnFExit.fnf.gratuityAmount.toLocaleString('en-IN')}</span>
                    </div>)}
                  {viewingFnFExit.fnf.annualBonusAmount > 0 && (<div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Pro-rata Bonus:</span>
                      <span className="font-bold text-slate-900 dark:text-white">₹{viewingFnFExit.fnf.annualBonusAmount.toLocaleString('en-IN')}</span>
                    </div>)}
                  <div className="pt-2 border-t border-emerald-200/60 flex justify-between font-bold text-xs text-emerald-800 dark:text-emerald-300">
                    <span>Total Gross Earnings:</span>
                    <span>₹{viewingFnFExit.fnf.grossPayable.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="p-3.5 rounded-xl bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <h5 className="font-bold text-rose-800 dark:text-rose-300 text-xs uppercase tracking-wider mb-2.5 pb-1 border-b border-rose-200/60">
                  Deductions & Recoveries
                </h5>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Notice Shortfall Deduction:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{viewingFnFExit.fnf.noticeShortfallDeduction.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">Unsettled Imprest / Advances:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{viewingFnFExit.fnf.unsettledAdvanceDeduction.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-300">TDS / Statutory Deductions:</span>
                    <span className="font-bold text-slate-900 dark:text-white">₹{viewingFnFExit.fnf.taxTdsDeduction.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-2 border-t border-rose-200/60 flex justify-between font-bold text-xs text-rose-800 dark:text-rose-300">
                    <span>Total Deductions:</span>
                    <span>₹{viewingFnFExit.fnf.totalDeductions.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Amount Banner */}
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#8F621A] dark:text-amber-400">
                  Final Net Payable Settlement Amount
                </span>
                <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight mt-0.5">
                  ₹{viewingFnFExit.fnf.netPayable.toLocaleString('en-IN')}
                </p>
              </div>

              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${viewingFnFExit.fnf.paymentStatus === 'Processed'
                ? 'bg-teal-600 text-white'
                : 'bg-amber-500 text-white'}`}>
                  {viewingFnFExit.fnf.paymentStatus === 'Processed' ? 'Disbursed' : 'Awaiting Payment'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => {
                toast.success(`Relieving & Experience Certificate for ${viewingFnFExit.employeeName} generated.`, 'Certificate Ready');
            }} leftIcon={<Download className="w-3.5 h-3.5"/>}>
                Download Relieving & Experience Letter
              </Button>

              <div className="flex items-center gap-2">
                {viewingFnFExit.fnf.paymentStatus !== 'Processed' && (<Button variant="primary" size="sm" onClick={() => handleFinalizeFnF(viewingFnFExit.id)} leftIcon={<CheckCircle2 className="w-3.5 h-3.5"/>}>
                    Mark Settled & Process Disbursement
                  </Button>)}
                <Button variant="secondary" size="sm" onClick={() => setViewingFnFExit(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>)}

      {/* ── MODAL: INITIATE RESIGNATION / EXIT ── */}
      {isInitiateModalOpen && (<Modal isOpen={true} onClose={() => setIsInitiateModalOpen(false)} title="Initiate Employee Separation / Exit" maxWidth="md">
          <div className="space-y-4 text-xs">
            <Input label="Employee Full Name" value={formEmpName} onChange={(e) => setFormEmpName(e.target.value)} placeholder="e.g. Deepak Chouhan" required/>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Employee ID" value={formEmpId} onChange={(e) => setFormEmpId(e.target.value)} placeholder="e.g. BGS-024" required/>
              <Select label="Exit Category" value={formType} onChange={(e) => setFormType(e.target.value)} options={[
                { value: 'Resignation', label: 'Voluntary Resignation' },
                { value: 'Mutual Separation', label: 'Mutual Separation' },
                { value: 'Retirement', label: 'Retirement' },
                { value: 'Contract End', label: 'End of Contract' },
            ]}/>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select label="Department" value={formDept} onChange={(e) => setFormDept(e.target.value)} options={[
                { value: 'Geology & Mineral Exploration', label: 'Geology & Mineral Exploration' },
                { value: 'GIS & Remote Sensing', label: 'GIS & Remote Sensing' },
                { value: 'HR & Administration', label: 'HR & Administration' },
                { value: 'Finance & Accounts', label: 'Finance & Accounts' },
            ]}/>
              <Input label="Approved Last Working Day" type="date" value={formLWD} onChange={(e) => setFormLWD(e.target.value)} required/>
            </div>

            <Textarea label="Reason for Separation / Handover Brief" value={formReason} onChange={(e) => setFormReason(e.target.value)} placeholder="Detail reasons for leaving, projects to hand over, or relocation context..." rows={3} required/>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-[#8F621A] dark:text-amber-300 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 shrink-0 mt-0.5"/>
              <span>
                Initiating exit automatically creates 4-department clearance checklists (IT, Admin, Finance, HR) and queues the employee for Full & Final (F&F) settlement.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <Button variant="outline" size="sm" onClick={() => setIsInitiateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleInitiateExit}>
                Initiate Clearance Workflow
              </Button>
            </div>
          </div>
        </Modal>)}
    </div>);
};
