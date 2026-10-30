import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit2, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Modal } from '@/components/common/Modal';
import { Input } from '@/components/common/Input';
import { useToast } from '@/contexts/ToastContext';
import { payrollService } from '@/modules/payroll/services/payroll.service';
import { getEmployeeProjectById, STANDARD_PROJECTS } from '@/core/constants/projects';
import { storage } from '@/core/storage/storage';
export const SalaryStructurePage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [structures, setStructures] = useState([]);
    const [editingStruct, setEditingStruct] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Filters
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');
    // Form states
    const [basic, setBasic] = useState(0);
    const [hra, setHra] = useState(0);
    const [conveyance, setConveyance] = useState(0);
    const [specialAllowance, setSpecialAllowance] = useState(0);
    const [siteAllowance, setSiteAllowance] = useState(0);
    const payrollSettings = storage.getPayrollSettings();
    const [pt, setPt] = useState(Number(payrollSettings.professionalTaxMonthly ?? 0));
    const [tds, setTds] = useState(0);
    const load = async () => {
        const data = await payrollService.getSalaryStructures();
        setStructures(data);
    };
    useEffect(() => {
        load();
    }, []);
    const filteredStructures = structures.filter((s) => {
        if (selectedDept !== 'all' && s.department !== selectedDept)
            return false;
        if (selectedProject !== 'all' && getEmployeeProjectById(s.employeeId) !== selectedProject)
            return false;
        return true;
    });
    const handleOpenEdit = (s) => {
        setEditingStruct(s);
        setBasic(s.basic);
        setHra(s.hra);
        setConveyance(s.conveyance);
        setSpecialAllowance(s.specialAllowance);
        setSiteAllowance(s.siteAllowance);
        setPt(s.status === 'Not set' ? Number(payrollSettings.professionalTaxMonthly ?? 0) : s.professionalTax);
        setTds(s.tds);
        setIsModalOpen(true);
    };
    const calculatedGross = basic + hra + conveyance + specialAllowance + siteAllowance;
    // PF is the payroll-settings rate on the basic, the same way the payslips work it out.
    const pf = Math.round((basic * Number(payrollSettings.pfDeductionPercentage ?? 12)) / 100);
    const calculatedDeductions = pf + pt + tds;
    const calculatedNet = calculatedGross - calculatedDeductions;
    const handleSave = async () => {
        if (!editingStruct)
            return;
        if ([basic, hra, conveyance, specialAllowance, siteAllowance, pt, tds].some((v) => !Number.isFinite(v) || v < 0)) {
            toast.error('Amounts cannot be negative.', 'Check the figures');
            return;
        }
        if (basic <= 0) {
            toast.error('Enter the basic salary.', 'Check the figures');
            return;
        }
        if (calculatedNet < 0) {
            toast.error('Deductions are more than the gross salary.', 'Check the figures');
            return;
        }
        await payrollService.updateSalaryStructure(editingStruct.id, {
            basic,
            hra,
            conveyance,
            specialAllowance,
            siteAllowance,
            providentFund: pf,
            professionalTax: pt,
            tds,
            monthlyGross: calculatedGross,
            monthlyNet: calculatedNet,
            annualCtc: calculatedGross * 12,
        });
        toast.success(`Salary structure for ${editingStruct.employeeName} updated.`, 'Structure Saved');
        setIsModalOpen(false);
        load();
    };
    const columns = [
        {
            key: 'employeeId',
            header: 'Emp ID',
            sortable: true,
            className: 'w-24 font-mono font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap',
        },
        {
            key: 'employeeName',
            header: 'Staff Member',
            sortable: true,
            className: 'min-w-[180px] whitespace-nowrap',
            render: (s) => (<div>
          <span className="font-bold text-slate-900 dark:text-white text-xs">{s.employeeName}</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{s.designation}</p>
        </div>),
        },
        {
            key: 'project',
            header: 'Project / Site',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (s) => {
                const proj = getEmployeeProjectById(s.employeeId);
                return (<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D5860B]"/>
            {proj}
          </span>);
            },
        },
        {
            key: 'annualCtc',
            header: 'Annual CTC',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (s) => (s.status === 'Not set'
                ? <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">Not set</span>
                : <span className="font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap">₹{(s.annualCtc / 100000).toFixed(1)} LPA</span>),
        },
        {
            key: 'monthlyGross',
            header: 'Gross / Month',
            className: 'whitespace-nowrap',
            render: (s) => (<span className="text-xs font-semibold text-slate-800 dark:text-slate-200 tabular-nums whitespace-nowrap">
          ₹{s.monthlyGross.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'basic',
            header: 'Basic',
            className: 'whitespace-nowrap',
            render: (s) => (<span className="text-xs font-medium text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">₹{s.basic.toLocaleString('en-IN')}</span>),
        },
        {
            key: 'hra',
            header: 'HRA',
            className: 'whitespace-nowrap',
            render: (s) => (<span className="text-xs font-medium text-slate-600 dark:text-slate-400 tabular-nums whitespace-nowrap">₹{s.hra.toLocaleString('en-IN')}</span>),
        },
        {
            key: 'providentFund',
            header: 'PF (12%)',
            className: 'whitespace-nowrap',
            render: (s) => (<span className="text-xs font-semibold text-rose-600 dark:text-rose-400 tabular-nums whitespace-nowrap">₹{s.providentFund.toLocaleString('en-IN')}</span>),
        },
        {
            key: 'monthlyNet',
            header: 'Net Take-Home',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (s) => (<span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded tabular-nums whitespace-nowrap">
          ₹{s.monthlyNet.toLocaleString('en-IN')}
        </span>),
        },
        {
            key: 'actions',
            header: 'Actions',
            className: 'text-right',
            render: (s) => (<Button variant="ghost" size="sm" onClick={() => handleOpenEdit(s)} leftIcon={<Edit2 className="w-3.5 h-3.5"/>}>
          {s.status === 'Not set' ? 'Set salary' : 'Edit CTC'}
        </Button>),
        },
    ];
    return (<div className="space-y-6">
      <PageHeader title="Salary Structure & Compensation" description="Statutory component breakdown, provident fund, and site allowance frameworks." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Payroll', path: '/hr/payroll' },
            { label: 'Salary Structure' },
        ]} actions={<Button variant="outline" size="sm" onClick={() => navigate('/hr/payroll')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
            Payroll Overview
          </Button>}/>

      <DataTable compact={true} columns={columns} data={filteredStructures} keyField="id" searchPlaceholder="Search by employee name or code..." searchFields={['employeeName', 'employeeId', 'designation']} filterComponent={<div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
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
            {(selectedDept !== 'all' || selectedProject !== 'all') && (<Button variant="ghost" size="sm" onClick={() => {
                    setSelectedDept('all');
                    setSelectedProject('all');
                }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs shrink-0 font-semibold w-full xs:w-auto flex items-center justify-center gap-1">
                <RotateCcw className="w-3 h-3"/>
                <span>Reset</span>
              </Button>)}
          </div>}/>

      {/* Edit Structure Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Adjust Compensation: ${editingStruct?.employeeName}`} description="Modify monthly earnings components and statutory deductions." maxWidth="2xl" footer={<>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Structure
            </Button>
          </>}>
        <div className="space-y-5">
          {/* Earnings */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Monthly Earnings (₹)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input label="Basic Salary (40-50%)" type="number" value={basic} onChange={(e) => setBasic(Number(e.target.value))}/>
              <Input label="House Rent Allowance" type="number" value={hra} onChange={(e) => setHra(Number(e.target.value))}/>
              <Input label="Conveyance" type="number" value={conveyance} onChange={(e) => setConveyance(Number(e.target.value))}/>
              <Input label="Special Allowance" type="number" value={specialAllowance} onChange={(e) => setSpecialAllowance(Number(e.target.value))}/>
              <Input label="Site / Field Duty Allowance" type="number" value={siteAllowance} onChange={(e) => setSiteAllowance(Number(e.target.value))}/>
            </div>
          </div>

          {/* Deductions */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Statutory Monthly Deductions (₹)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <Input label={`Provident Fund (${payrollSettings.pfDeductionPercentage ?? 12}% of basic)`} type="number" value={pf} readOnly disabled/>
              <Input label="Professional Tax (PT)" type="number" value={pt} onChange={(e) => setPt(Number(e.target.value))}/>
              <Input label="TDS (Income Tax)" type="number" value={tds} onChange={(e) => setTds(Number(e.target.value))}/>
            </div>
          </div>

          {/* Computed Summary */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Gross Monthly</span>
              <p className="text-base font-bold text-slate-900 mt-0.5">₹{calculatedGross.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 uppercase font-semibold">Total Deductions</span>
              <p className="text-base font-bold text-rose-600 mt-0.5">-₹{calculatedDeductions.toLocaleString('en-IN')}</p>
            </div>
            <div>
              <span className="text-[11px] text-emerald-700 uppercase font-semibold">Net Take-Home</span>
              <p className="text-base font-extrabold text-emerald-800 mt-0.5">₹{calculatedNet.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>);
};
