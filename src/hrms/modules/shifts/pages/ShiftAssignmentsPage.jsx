import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, RotateCcw } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Modal } from '@/components/common/Modal';
import { Select } from '@/components/common/Select';
import { DatePicker } from '@/components/common/DatePicker';
import { useToast } from '@/contexts/ToastContext';
import { shiftService } from '@/modules/shifts/services/shift.service';
import { storage } from '@/core/storage/storage';
import { getEmployeeProjectById, STANDARD_PROJECTS } from '@/core/constants/projects';
export const ShiftAssignmentsPage = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [assignments, setAssignments] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [employees, setEmployees] = useState([]);
    // Filter states
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');
    const [selectedShift, setSelectedShift] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEmpId, setSelectedEmpId] = useState('');
    const [selectedShiftId, setSelectedShiftId] = useState('');
    const [effectiveFrom, setEffectiveFrom] = useState('2026-10-01');
    const [weeklyOff, setWeeklyOff] = useState('Sunday');
    const load = async () => {
        const a = await shiftService.getAssignments();
        const s = await shiftService.getShifts();
        const e = storage.getEmployees();
        setAssignments(a);
        setShifts(s);
        setEmployees(e);
        if (e.length > 0)
            setSelectedEmpId(e[0].employeeId);
        if (s.length > 0)
            setSelectedShiftId(s[0].id);
    };
    useEffect(() => {
        load();
    }, []);
    const filteredAssignments = assignments.filter((a) => {
        if (selectedDept !== 'all' && a.department !== selectedDept)
            return false;
        if (selectedProject !== 'all' && getEmployeeProjectById(a.employeeId) !== selectedProject)
            return false;
        if (selectedShift !== 'all' && a.shiftName !== selectedShift)
            return false;
        return true;
    });
    const handleAssign = async () => {
        const emp = employees.find((e) => e.employeeId === selectedEmpId);
        const sh = shifts.find((s) => s.id === selectedShiftId);
        if (!emp || !sh)
            return;
        await shiftService.assignShift({
            employeeId: emp.employeeId,
            employeeName: emp.name,
            department: emp.employment.department,
            shiftId: sh.id,
            shiftName: sh.name,
            effectiveFrom,
            weeklyOff,
            status: 'Active',
        });
        toast.success(`Assigned ${emp.name} to ${sh.name}.`, 'Shift Assigned');
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
            render: (a) => (<div>
          <span className="font-bold text-slate-900 dark:text-white text-xs">{a.employeeName}</span>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{a.department}</p>
        </div>),
        },
        {
            key: 'project',
            header: 'Project / Site',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (a) => {
                const proj = getEmployeeProjectById(a.employeeId);
                return (<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D5860B]"/>
            {proj}
          </span>);
            },
        },
        {
            key: 'shiftName',
            header: 'Roster / Shift',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (a) => <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{a.shiftName}</span>,
        },
        {
            key: 'weeklyOff',
            header: 'Weekly Off',
            className: 'whitespace-nowrap',
            render: (a) => <span className="text-slate-600 dark:text-slate-400 text-xs">{a.weeklyOff}</span>,
        },
        {
            key: 'effectiveFrom',
            header: 'Effective Date',
            className: 'whitespace-nowrap',
            render: (a) => (<span className="font-mono text-xs text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">{a.effectiveFrom}</span>),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            className: 'whitespace-nowrap',
            render: (a) => <StatusBadge status={a.status} size="sm"/>,
        },
    ];
    return (<div className="space-y-6">
      <PageHeader title="Shift Roster Assignments" description="Allocate staff members to corporate HQ or field mining shifts." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Shifts', path: '/hr/shifts' },
            { label: 'Assignments' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/shifts')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
              Shifts List
            </Button>
            <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4"/>}>
              Assign Shift
            </Button>
          </div>}/>

      <DataTable compact={true} columns={columns} data={filteredAssignments} keyField="id" searchPlaceholder="Search assignment records..." searchFields={['employeeName', 'employeeId', 'shiftName', 'department']} filterComponent={<div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
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
            <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[140px]">
              <Select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)} options={[
                { label: 'All Shifts / Rosters', value: 'all' },
                ...shifts.map((s) => ({ label: s.name, value: s.name })),
            ]}/>
            </div>
            {(selectedDept !== 'all' || selectedProject !== 'all' || selectedShift !== 'all') && (<Button variant="ghost" size="sm" onClick={() => {
                    setSelectedDept('all');
                    setSelectedProject('all');
                    setSelectedShift('all');
                }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs shrink-0 font-semibold w-full xs:w-auto flex items-center justify-center gap-1">
                <RotateCcw className="w-3 h-3"/>
                <span>Reset</span>
              </Button>)}
          </div>}/>

      {/* Assign Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Assign Shift to Staff Member" description="Map employee to an operational schedule and weekly rest day." footer={<>
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleAssign}>
              Save Assignment
            </Button>
          </>}>
        <div className="space-y-4">
          <Select label="Select Employee" isRequired value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)} options={employees.map((e) => ({
            label: `${e.name} (${e.employeeId} - ${e.employment.department})`,
            value: e.employeeId,
        }))}/>

          <Select label="Select Target Shift" isRequired value={selectedShiftId} onChange={(e) => setSelectedShiftId(e.target.value)} options={shifts.map((s) => ({
            label: `${s.name} (${s.startTime} - ${s.endTime})`,
            value: s.id,
        }))}/>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DatePicker label="Effective From Date" isRequired value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)}/>
            <Select label="Designated Weekly Off" value={weeklyOff} onChange={(e) => setWeeklyOff(e.target.value)} options={[
            { label: 'Saturday & Sunday', value: 'Saturday & Sunday' },
            { label: 'Sunday Only', value: 'Sunday' },
            { label: 'Rotational (1 day / week)', value: 'Rotational (1 day / week)' },
        ]}/>
          </div>
        </div>
      </Modal>
    </div>);
};
