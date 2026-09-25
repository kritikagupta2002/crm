import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Printer, Eye, ArrowLeft, Compass, RotateCcw, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Select } from '@/components/common/Select';
import { QRCodeCanvas } from '@/components/common/QRCodeCanvas';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { payrollService } from '@/modules/payroll/services/payroll.service';
import { getEmployeeProjectById, STANDARD_PROJECTS } from '@/core/constants/projects';
export const PayslipsPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const { user } = useAuth();
    const { currentRole } = useRole();
    const [payslips, setPayslips] = useState([]);
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    // Filters
    const [selectedMonth, setSelectedMonth] = useState('all');
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const isEmp = currentRole === 'employee' || user?.role === 'employee';
    const load = async () => {
        const data = await payrollService.getPayslips();
        if (isEmp) {
            const empId = user?.employeeId;
            const filtered = data.filter((p) => (empId && p.employeeId === empId) || (user?.name && p.employeeName?.toLowerCase() === user.name.toLowerCase()));
            setPayslips(filtered);
        }
        else {
            setPayslips(data);
        }
    };
    useEffect(() => {
        load();
    }, [currentRole, user?.employeeId]);
    const availableMonths = Array.from(new Set(payslips.map((p) => p.month))).filter(Boolean);
    const filteredPayslips = payslips.filter((p) => {
        if (selectedMonth !== 'all' && p.month !== selectedMonth)
            return false;
        if (selectedDept !== 'all' && p.department !== selectedDept)
            return false;
        if (selectedProject !== 'all' && getEmployeeProjectById(p.employeeId) !== selectedProject)
            return false;
        if (selectedStatus !== 'all' && p.paymentStatus !== selectedStatus)
            return false;
        return true;
    });
    const handleOpenPreview = (p) => {
        setSelectedPayslip(p);
        setIsPreviewOpen(true);
    };
    const handlePrint = () => {
        window.print();
    };
    const columns = [
        {
            key: 'payslipNumber',
            header: 'Payslip Ref #',
            sortable: true,
            className: 'w-36 font-mono font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap',
        },
        ...(!isEmp
            ? [
                {
                    key: 'employeeName',
                    header: 'Staff Member',
                    sortable: true,
                    className: 'min-w-[180px] whitespace-nowrap',
                    render: (p) => (<div>
                <span className="font-bold text-slate-900 dark:text-white text-xs">{p.employeeName}</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">{p.employeeId} • {p.designation}</p>
              </div>),
                },
                {
                    key: 'project',
                    header: 'Project / Site',
                    sortable: true,
                    className: 'whitespace-nowrap',
                    render: (p) => {
                        const proj = getEmployeeProjectById(p.employeeId);
                        return (<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 whitespace-nowrap">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D5860B]"/>
                  {proj}
                </span>);
                    },
                },
            ]
            : []),
        {
            key: 'month',
            header: 'Disbursal Period',
            sortable: true,
            className: 'font-semibold text-slate-800 dark:text-slate-200 text-xs whitespace-nowrap',
        },
        {
            key: 'grossEarnings',
            header: 'Gross Salary',
            className: 'whitespace-nowrap',
            render: (p) => (<span className="text-xs font-semibold text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">₹{p.grossEarnings.toLocaleString('en-IN')}</span>),
        },
        {
            key: 'totalDeductions',
            header: 'Deductions',
            className: 'whitespace-nowrap',
            render: (p) => (<span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">-₹{p.totalDeductions.toLocaleString('en-IN')}</span>),
        },
        {
            key: 'netSalary',
            header: 'Net Pay',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (p) => (<span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded tabular-nums whitespace-nowrap">
          ₹{p.netSalary.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'paymentStatus',
            header: 'Status',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (p) => <StatusBadge status={p.paymentStatus} size="sm"/>,
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right whitespace-nowrap',
            render: (p) => (<div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button variant="outline" size="sm" onClick={() => handleOpenPreview(p)} leftIcon={<Eye className="w-3.5 h-3.5"/>}>
            View Payslip
          </Button>
        </div>),
        },
    ];
    return (<div className="space-y-3">
      <PageHeader title={isEmp ? 'My Payslips & Salary Statements' : 'Employee Payslips'} description={isEmp
            ? 'Your monthly salary slips, earnings, allowances, and statutory tax deductions.'
            : 'Official salary statements with Indian statutory breakdowns, tax deductions, and corporate branding.'} breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Payroll', path: '/hr/payroll' },
            { label: 'Payslips' },
        ]} actions={!isEmp ? (<Button variant="outline" size="sm" onClick={() => navigate('/hr/payroll')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
              Payroll Dashboard
            </Button>) : undefined}/>

      <DataTable compact={true} columns={columns} data={filteredPayslips} keyField="id" searchPlaceholder={isEmp ? 'Search my payslips by month or ref #...' : 'Search by payslip #, name, or employee ID...'} searchFields={isEmp ? ['payslipNumber', 'month'] : ['payslipNumber', 'employeeName', 'employeeId']} onRowClick={(p) => handleOpenPreview(p)} filterComponent={<div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[140px]">
              <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} options={[
                { label: 'All Disbursal Months', value: 'all' },
                ...availableMonths.map((m) => ({ label: m, value: m })),
            ]}/>
            </div>
            {!isEmp && (<>
                <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[150px]">
                  <Select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} options={[
                    { label: 'All Departments', value: 'all' },
                    { label: 'Geology & Exploration', value: 'Geology & Mineral Exploration' },
                    { label: 'Mining & Planning', value: 'Mining & Mine Planning' },
                    { label: 'GIS & Remote Sensing', value: 'GIS, Remote Sensing & UAV' },
                    { label: 'Hydrogeology', value: 'Hydrogeology & Groundwater' },
                    { label: 'Finance & Economics', value: 'Finance & Mineral Economics' },
                    { label: 'HR & Admin', value: 'Human Resources & Admin' },
                ]}/>
                </div>
                <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[170px]">
                  <Select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} options={[
                    { label: 'All Projects / Sites', value: 'all' },
                    ...STANDARD_PROJECTS.map((p) => ({ label: p, value: p })),
                ]}/>
                </div>
              </>)}
            <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[120px]">
              <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Paid', value: 'Paid' },
                { label: 'Processing', value: 'Processing' },
                { label: 'Pending', value: 'Pending' },
            ]}/>
            </div>
            {(selectedMonth !== 'all' || selectedDept !== 'all' || selectedProject !== 'all' || selectedStatus !== 'all') && (<Button variant="ghost" size="sm" onClick={() => {
                    setSelectedMonth('all');
                    setSelectedDept('all');
                    setSelectedProject('all');
                    setSelectedStatus('all');
                }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs shrink-0 font-semibold w-full xs:w-auto flex items-center justify-center gap-1">
                <RotateCcw className="w-3 h-3"/>
                <span>Reset</span>
              </Button>)}
          </div>}/>

      {/* Official Branded Payslip Modal */}
      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} maxWidth="3xl" title="Official Salary Statement Preview" footer={<>
            <Button variant="outline" size="sm" onClick={() => setIsPreviewOpen(false)}>
              Close
            </Button>
            <Button variant="primary" size="sm" onClick={handlePrint} leftIcon={<Printer className="w-4 h-4"/>}>
              Print / Save PDF
            </Button>
          </>}>
        {selectedPayslip && (<div className="printable-payslip p-6 bg-white dark:bg-[#1A2430] border border-slate-300 dark:border-[#253344] rounded-lg shadow-xs space-y-6 text-[#242424] dark:text-slate-200">
            {/* Corporate Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b-2 border-[#1A2430] dark:border-slate-700 gap-4 relative after:content-[''] after:absolute after:-bottom-[2px] after:left-0 after:w-32 after:h-[2px] after:bg-[#FEC13D]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-[#1A2430] flex items-center justify-center text-white shrink-0 border border-[#FEC13D]/40">
                  <Compass className="w-7 h-7 text-[#FEC13D]"/>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#1A2430] dark:text-slate-100 tracking-tight uppercase">
                    Bansal Geo Solutions Pvt. Ltd.
                  </h2>
                  <p className="text-[11px] text-[#5A5A5A] dark:text-slate-400 max-w-sm leading-snug">
                    604, 607 & 612, Okay Plus Square, Madhyam Marg, Mansarovar, Jaipur, Rajasthan - 302020
                  </p>
                  <p className="text-[10px] font-mono text-[#5A5A5A] dark:text-slate-500 mt-0.5">
                    CIN: U14290RJ2022PTC083921 • GSTIN: 08AAFCB4920M1Z8 • PAN: AAFCB4920M
                  </p>
                </div>
              </div>

              <div className="text-left sm:text-right shrink-0">
                <span className="inline-block px-2.5 py-1 rounded bg-[#FEC13D]/20 text-[#1A2430] dark:text-[#FEC13D] border border-[#FEC13D]/40 font-bold text-xs uppercase tracking-wider">
                  Payslip for {selectedPayslip.month}
                </span>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1">
                  Ref: {selectedPayslip.payslipNumber}
                </p>
              </div>
            </div>

            {/* Employee Demographics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-[#111821] rounded-lg text-xs border border-slate-200 dark:border-[#253344]">
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Employee Name</span>
                <p className="font-bold text-slate-900 dark:text-white mt-0.5">{selectedPayslip.employeeName}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Employee ID</span>
                <p className="font-mono font-bold text-blue-700 dark:text-blue-400 mt-0.5">{selectedPayslip.employeeId}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Designation</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{selectedPayslip.designation}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Department</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{selectedPayslip.department}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">PAN Number</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedPayslip.pan}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">UAN (PF)</span>
                <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedPayslip.uan}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Bank Name</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{selectedPayslip.bankName}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Account Number</span>
                <p className="font-mono text-slate-800 dark:text-slate-200 mt-0.5">{selectedPayslip.accountNumber}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Working Days</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedPayslip.workingDays}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Paid Days</span>
                <p className="font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">{selectedPayslip.paidDays}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Loss of Pay (LOP)</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{selectedPayslip.lopDays} Days</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] uppercase font-bold">Payment Mode</span>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">Direct NEFT Transfer</p>
              </div>
            </div>

            {/* Earnings vs Deductions Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Earnings */}
              <div className="border border-slate-200 dark:border-[#253344] rounded-lg overflow-hidden text-xs">
                <div className="bg-slate-100 dark:bg-[#111821] px-3 py-2 font-bold text-slate-800 dark:text-slate-200 flex justify-between uppercase text-[11px]">
                  <span>Earnings Component</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-[#253344] p-1">
                  <div className="py-1.5 px-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Basic Salary</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">₹{selectedPayslip.basic.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="py-1.5 px-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">House Rent Allowance (HRA)</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">₹{selectedPayslip.hra.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="py-1.5 px-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Conveyance Allowance</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">₹{selectedPayslip.conveyance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="py-1.5 px-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Special Allowance</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">₹{selectedPayslip.specialAllowance.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="py-1.5 px-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Site / Field Duty Allowance</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">₹{selectedPayslip.siteAllowance.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedPayslip.bonus > 0 && (<div className="py-1.5 px-2 flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Performance Bonus</span>
                      <span className="font-mono font-medium text-slate-800 dark:text-slate-200">₹{selectedPayslip.bonus.toLocaleString('en-IN')}</span>
                    </div>)}
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-950/30 px-3 py-2 border-t border-slate-200 dark:border-[#253344] font-bold text-blue-900 dark:text-blue-300 flex justify-between">
                  <span>Gross Earnings</span>
                  <span className="font-mono">₹{selectedPayslip.grossEarnings.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="border border-slate-200 dark:border-[#253344] rounded-lg overflow-hidden text-xs">
                <div className="bg-slate-100 dark:bg-[#111821] px-3 py-2 font-bold text-slate-800 dark:text-slate-200 flex justify-between uppercase text-[11px]">
                  <span>Statutory Deductions</span>
                  <span>Amount (₹)</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-[#253344] p-1">
                  <div className="py-1.5 px-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Provident Fund (Employee PF 12%)</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">₹{selectedPayslip.providentFund.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="py-1.5 px-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Professional Tax (PT)</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">₹{selectedPayslip.professionalTax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="py-1.5 px-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Employees' State Insurance (ESI)</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">₹{selectedPayslip.esi.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="py-1.5 px-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Tax Deducted at Source (TDS)</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">₹{selectedPayslip.tds.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="py-1.5 px-2 flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Other Adjustments</span>
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-200">₹{selectedPayslip.otherDeductions.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="bg-rose-50/50 dark:bg-rose-950/30 px-3 py-2 border-t border-slate-200 dark:border-[#253344] font-bold text-rose-900 dark:text-rose-300 flex justify-between">
                  <span>Total Deductions</span>
                  <span className="font-mono">₹{selectedPayslip.totalDeductions.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Net Take Home Banner: Strong Dark + Gold Contrast Motif */}
            <div className="p-4 bg-[#1A2430] border-2 border-[#FEC13D] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-white shadow-sm">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#FEC13D]">
                  Net Salary Transferred
                </span>
                <p className="text-xs text-slate-300 italic mt-0.5">
                  Amount in words: <strong className="text-white">{selectedPayslip.netSalaryInWords}</strong>
                </p>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-2xl font-extrabold text-[#FEC13D] font-mono">
                  ₹{selectedPayslip.netSalary.toLocaleString('en-IN')}
                </span>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Ref: {selectedPayslip.transactionRef || 'NEFT-COMPLETED'}
                </p>
              </div>
            </div>

            {/* Footer Signoff & Digital Verification QR */}
            <div className="pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-[#253344]">
              <div className="text-left">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Chhavi Bansal</p>
                <p className="text-[11px] text-slate-400">Director - Finance & Administration</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Bansal Geo Solutions Pvt. Ltd.</p>
              </div>

              {/* Payslip Digital Authenticity QR Code */}
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                <QRCodeCanvas
                  value={JSON.stringify({
                    doc: 'BGSPL-PAYSLIP',
                    empId: selectedPayslip.employeeId,
                    month: selectedPayslip.month,
                    net: selectedPayslip.netSalary,
                    ref: selectedPayslip.transactionRef,
                    verified: true,
                  })}
                  size={64}
                />
                <div className="text-[10px] text-left leading-tight text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Digitally Certified</span>
                  <span>Scan to verify payroll authenticity</span>
                  <span className="font-mono block text-teal-700 dark:text-teal-400 font-semibold mt-0.5">ID: {selectedPayslip.id}</span>
                </div>
              </div>

              <div className="text-left sm:text-right text-[11px] text-slate-400 max-w-xs">
                This is a computer-generated salary slip and does not require an ink physical signature under the IT Act 2000.
              </div>
            </div>
          </div>)}
      </Modal>
    </div>);
};
