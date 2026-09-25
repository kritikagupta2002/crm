import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ArrowLeft, Download, Fingerprint } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { DatePicker } from '@/components/common/DatePicker';
import { Select } from '@/components/common/Select';
import { useToast } from '@/contexts/ToastContext';
import { attendanceService } from '@/modules/attendance/services/attendance.service';
import { getEmployeeProjectById, STANDARD_PROJECTS } from '@/core/constants/projects';
export const DailyAttendancePage = () => {
    const [selectedDate, setSelectedDate] = useState('2026-09-18');
    const [records, setRecords] = useState([]);
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedSource, setSelectedSource] = useState('all');
    const navigate = useNavigate();
    const toast = useToast();
    useEffect(() => {
        const load = async () => {
            const data = await attendanceService.getAttendance();
            setRecords(data);
        };
        load();
    }, []);
    const filteredRecords = records.filter((r) => {
        if (selectedDept !== 'all' && r.department !== selectedDept)
            return false;
        if (selectedProject !== 'all' && getEmployeeProjectById(r.employeeId) !== selectedProject)
            return false;
        if (selectedStatus !== 'all' && r.status !== selectedStatus)
            return false;
        if (selectedSource !== 'all' && !r.punchSource.toLowerCase().includes(selectedSource.toLowerCase()))
            return false;
        return true;
    });
    const columns = [
        {
            key: 'employeeId',
            header: 'Emp ID',
            sortable: true,
            className: 'w-24 font-mono font-bold text-blue-700 dark:text-blue-400',
        },
        {
            key: 'employeeName',
            header: 'Staff Member',
            sortable: true,
            render: (r) => (<div>
          <span className="font-bold text-slate-900 dark:text-slate-100">{r.employeeName}</span>
          <p className="text-[11px] text-slate-400">{r.department}</p>
        </div>),
        },
        {
            key: 'project',
            header: 'Project / Site',
            sortable: true,
            render: (r) => {
                const proj = getEmployeeProjectById(r.employeeId);
                return (<span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D5860B]"/>
            {proj}
          </span>);
            },
        },
        {
            key: 'checkIn',
            header: 'Check In',
            className: 'font-mono text-xs font-semibold text-slate-800 dark:text-slate-200',
        },
        {
            key: 'checkOut',
            header: 'Check Out',
            className: 'font-mono text-xs text-slate-600 dark:text-slate-400',
        },
        {
            key: 'workingHours',
            header: 'Duration',
            className: 'font-semibold text-xs text-slate-800 dark:text-slate-200',
        },
        {
            key: 'lateBy',
            header: 'Late Mark',
            render: (r) => (<span className={r.lateBy !== '-' ? 'text-amber-600 dark:text-amber-400 font-bold text-xs' : 'text-slate-400 text-xs'}>
          {r.lateBy}
        </span>),
        },
        {
            key: 'punchSource',
            header: 'Punch Source',
            render: (r) => (<span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
          <Fingerprint className="w-3.5 h-3.5 text-blue-500"/>
          {r.punchSource}
        </span>),
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            render: (r) => <StatusBadge status={r.status} size="sm"/>,
        },
    ];
    return (<div className="space-y-6">
      <PageHeader title="Daily Attendance Register" description="Day-specific biometric punch ledger and shift compliance." breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Attendance', path: '/hr/attendance' },
            { label: 'Daily View' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/attendance')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
              Back to Overview
            </Button>
            <Button variant="outline" size="sm" onClick={() => toast.success('Exporting daily shift punch records.', 'Export Complete')} leftIcon={<Download className="w-4 h-4"/>}>
              Export Day Report
            </Button>
          </div>}/>

      <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#1A2430] p-4 rounded-xl border border-slate-200 dark:border-[#253344] shadow-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
            <Calendar className="w-4 h-4 text-blue-600"/> Date:
          </span>
          <div className="w-full sm:w-40 flex-1 sm:flex-initial">
            <DatePicker value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)}/>
          </div>
        </div>

        {/* Department Filter */}
        <div className="w-full sm:w-48">
          <Select options={[
            { value: 'all', label: 'All Departments' },
            { value: 'Geology & Mineral Exploration', label: 'Geology & Exploration' },
            { value: 'Mining & Mine Planning', label: 'Mining & Planning' },
            { value: 'GIS, Remote Sensing & UAV', label: 'GIS & Remote Sensing' },
            { value: 'Hydrogeology & Groundwater', label: 'Hydrogeology' },
            { value: 'Finance & Mineral Economics', label: 'Finance & Economics' },
            { value: 'Human Resources & Admin', label: 'HR & Admin' },
        ]} value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}/>
        </div>

        {/* Project Filter */}
        <div className="w-full sm:w-52">
          <Select options={[
            { value: 'all', label: 'All Projects / Sites' },
            ...STANDARD_PROJECTS.map((p) => ({ value: p, label: p })),
        ]} value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)}/>
        </div>

        {/* Status Filter */}
        <div className="w-full sm:w-36">
          <Select options={[
            { value: 'all', label: 'All Statuses' },
            { value: 'Present', label: 'Present' },
            { value: 'Late', label: 'Late Arrival' },
            { value: 'Absent', label: 'Absent' },
            { value: 'On Leave', label: 'On Leave' },
        ]} value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}/>
        </div>

        {/* Punch Source Filter */}
        <div className="w-full sm:w-44">
          <Select options={[
            { value: 'all', label: 'All Punch Sources' },
            { value: 'Biometric', label: 'Biometric Terminal' },
            { value: 'GPS', label: 'Field GPS Mobile' },
            { value: 'Web', label: 'Web Portal' },
        ]} value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}/>
        </div>

        {(selectedDept !== 'all' || selectedProject !== 'all' || selectedStatus !== 'all' || selectedSource !== 'all') && (<Button variant="ghost" size="sm" onClick={() => {
                setSelectedDept('all');
                setSelectedProject('all');
                setSelectedStatus('all');
                setSelectedSource('all');
            }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs">
            Reset Filters
          </Button>)}

        <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto hidden lg:inline">
          Showing <strong>{filteredRecords.length}</strong> of <strong>{records.length}</strong> logs for <strong>{selectedDate}</strong>
        </span>
      </div>

      <DataTable columns={columns} data={filteredRecords} keyField="id" searchPlaceholder="Search staff by name or code..."/>
    </div>);
};
