import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, UserX, ClockAlert, CalendarOff, Clock, Fingerprint, CalendarDays, FileEdit, Download, } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { attendanceService } from '@/modules/attendance/services/attendance.service';
import { storage } from '@/core/storage/storage';
export const AttendanceDashboardPage = () => {
    const { user } = useAuth();
    const { currentRole } = useRole();
    const [records, setRecords] = useState([]);
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const navigate = useNavigate();
    const toast = useToast();
    const isEmp = currentRole === 'employee' || user?.role === 'employee';
    const loadData = async () => {
        const data = await attendanceService.getAttendance();
        if (isEmp) {
            const empId = user?.employeeId;
            setRecords(data.filter((r) => (empId && r.employeeId === empId) || (user?.name && r.employeeName?.toLowerCase() === user.name.toLowerCase())));
        }
        else {
            setRecords(data);
        }
    };
    useEffect(() => {
        loadData();
    }, [currentRole, user?.employeeId]);
    const filteredRecords = records.filter((r) => {
        if (selectedDept !== 'all' && r.department !== selectedDept)
            return false;
        if (selectedStatus !== 'all' && r.status !== selectedStatus)
            return false;
        return true;
    });
    const handleExport = () => {
        toast.success('Biometric attendance records exported for September 2026.', 'Export Ready');
    };
    const columns = [
        ...(!isEmp
            ? [
                {
                    key: 'employeeId',
                    header: 'Emp ID',
                    sortable: true,
                    className: 'w-24 whitespace-nowrap',
                    render: (r) => (<span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 tabular-nums">
                {r.employeeId}
              </span>),
                },
                {
                    key: 'employeeName',
                    header: 'Employee Name',
                    sortable: true,
                    render: (r) => (<div>
                <span className="font-bold text-slate-900 dark:text-white hover:text-[#D5860B] transition-colors">{r.employeeName}</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{r.department}</p>
              </div>),
                },
            ]
            : []),
        {
            key: 'date',
            header: 'Date',
            sortable: true,
            className: 'text-xs tabular-nums text-slate-600 dark:text-slate-300',
        },
        {
            key: 'checkIn',
            header: 'Check In',
            render: (r) => (<span className="text-xs font-semibold text-slate-800 dark:text-slate-200 tabular-nums">{r.checkIn}</span>),
        },
        {
            key: 'checkOut',
            header: 'Check Out',
            render: (r) => (<span className="text-xs text-slate-600 dark:text-slate-400 tabular-nums">{r.checkOut}</span>),
        },
        {
            key: 'workingHours',
            header: 'Total Hours',
            sortable: true,
            render: (r) => (<span className="font-bold text-slate-900 dark:text-slate-100 text-xs tabular-nums">{r.workingHours}</span>),
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
            header: 'Biometric Source',
            render: (r) => (<span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-slate-700">
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
    return (<div className="space-y-3">
      <PageHeader title={isEmp ? 'My Attendance Log' : 'Attendance Management'} description={isEmp
            ? 'Personal punch records, shift check-ins, and biometric source logs.'
            : 'Daily biometric log, site shift punches, and mobile field check-ins.'} breadcrumbs={[
            { label: 'Dashboard', path: '/hr' },
            { label: 'Attendance' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/attendance/monthly')} leftIcon={<CalendarDays className="w-4 h-4 text-blue-600"/>}>
              Monthly Matrix
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/attendance/corrections')} leftIcon={<FileEdit className="w-4 h-4 text-amber-600"/>}>
              Punch Corrections
            </Button>
            {!isEmp && (<Button variant="primary" size="sm" onClick={handleExport} leftIcon={<Download className="w-4 h-4"/>}>
                Export Report
              </Button>)}
          </div>}/>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {(isEmp
            ? [
                {
                    title: 'Punch In Today',
                    value: '09:14 AM',
                    badge: 'On Time',
                    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60',
                    subtitle: 'General Shift 09:00',
                    icon: <UserCheck className="w-3.5 h-3.5"/>,
                    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
                },
                {
                    title: 'Present Days',
                    value: '21 / 24',
                    badge: '87.5%',
                    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800/60',
                    subtitle: 'September 2026',
                    icon: <CalendarDays className="w-3.5 h-3.5"/>,
                    iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
                },
                {
                    title: 'Late Marks',
                    value: '1',
                    badge: 'Grace',
                    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60',
                    subtitle: 'In grace window',
                    icon: <ClockAlert className="w-3.5 h-3.5"/>,
                    iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
                },
                {
                    title: 'Leave Days',
                    value: '2',
                    badge: 'Approved',
                    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800/60',
                    subtitle: 'CL & SL taken',
                    icon: <CalendarOff className="w-3.5 h-3.5"/>,
                    iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
                },
                {
                    title: 'Field Extra Hrs',
                    value: '8.5h',
                    badge: 'Logged',
                    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/60 dark:text-teal-400 dark:border-teal-800/60',
                    subtitle: 'Site exploration',
                    icon: <Clock className="w-3.5 h-3.5"/>,
                    iconBg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400',
                },
                {
                    title: 'Corrections',
                    value: '0',
                    badge: 'Nil',
                    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                    subtitle: 'All punches synced',
                    icon: <FileEdit className="w-3.5 h-3.5"/>,
                    iconBg: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
                },
            ]
            : (() => {
                const allEmps = storage.getEmployees();
                const totalStaff = allEmps.length;
                const presentCount = records.filter((r) => r.status === 'Present').length;
                const leaveCount = storage.getLeaveRequests().filter((l) => l.status === 'Approved').length;
                const absentCount = Math.max(0, totalStaff - presentCount - leaveCount);
                const lateCount = records.filter((r) => r.lateBy && r.lateBy !== '-').length;
                const fieldCount = allEmps.filter((e) => e.employment?.workLocation?.includes('Field') || e.employment?.workLocation?.includes('Bhilwara')).length;
                const presentPercent = totalStaff > 0 ? ((presentCount / totalStaff) * 100).toFixed(1) : '0';
                const absentPercent = totalStaff > 0 ? ((absentCount / totalStaff) * 100).toFixed(1) : '0';
                return [
                    {
                        title: 'Present Today',
                        value: String(presentCount),
                        badge: `${presentPercent}%`,
                        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60',
                        subtitle: `${presentCount} of ${totalStaff} Staff`,
                        icon: <UserCheck className="w-3.5 h-3.5"/>,
                        iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
                    },
                    {
                        title: 'Absent',
                        value: String(absentCount),
                        badge: `${absentPercent}%`,
                        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60',
                        subtitle: 'Unplanned absence',
                        icon: <UserX className="w-3.5 h-3.5"/>,
                        iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
                    },
                    {
                        title: 'Late Arrivals',
                        value: String(lateCount),
                        badge: 'Grace',
                        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60',
                        subtitle: 'In grace window',
                        icon: <ClockAlert className="w-3.5 h-3.5"/>,
                        iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
                    },
                    {
                        title: 'Early Departures',
                        value: '0',
                        badge: 'Nil',
                        badgeColor: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
                        subtitle: 'Standard shifts',
                        icon: <Clock className="w-3.5 h-3.5"/>,
                        iconBg: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
                    },
                    {
                        title: 'On Leave',
                        value: String(leaveCount),
                        badge: 'Approved',
                        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800/60',
                        subtitle: 'CL & SL active',
                        icon: <CalendarOff className="w-3.5 h-3.5"/>,
                        iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
                    },
                    {
                        title: 'Field Deployed',
                        value: String(fieldCount),
                        badge: 'Live',
                        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60',
                        subtitle: 'Bhilwara & Sites',
                        icon: <Fingerprint className="w-3.5 h-3.5"/>,
                        iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
                    },
                ];
            })()).map((kpi, idx) => (<div key={idx} className="p-2.5 rounded-xl bg-white dark:bg-[#1A2430] border border-slate-200/80 dark:border-[#253344] shadow-2xs flex flex-col justify-between">
            <div className="flex items-start justify-between gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 truncate font-mono">
                {kpi.title}
              </span>
              <div className={`p-1.5 rounded-lg shrink-0 ${kpi.iconBg}`}>
                {kpi.icon}
              </div>
            </div>
            <div className="mt-1">
              <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                {kpi.value}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{kpi.title}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">{kpi.subtitle}</p>
            </div>
          </div>))}
      </div>

      {/* Attendance Table with Filter Bar */}
      <DataTable compact={true} columns={columns} data={filteredRecords} keyField="id" searchPlaceholder={isEmp ? 'Search my attendance records...' : 'Search employee, ID, location...'} searchFields={isEmp ? ['date', 'punchSource', 'status'] : ['employeeName', 'employeeId', 'department']} filterComponent={<div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {!isEmp && (<div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[140px]">
                <Select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} options={[
                    { label: 'All Departments', value: 'all' },
                    { label: 'Geology & Exploration', value: 'Geology & Mineral Exploration' },
                    { label: 'Mining & Mine Planning', value: 'Mining & Mine Planning' },
                    { label: 'GIS & UAV Drone', value: 'GIS, Remote Sensing & UAV' },
                    { label: 'Hydrogeology', value: 'Hydrogeology & Groundwater' },
                    { label: 'Finance & Economics', value: 'Finance & Mineral Economics' },
                    { label: 'HR & Admin', value: 'Human Resources & Admin' },
                ]}/>
              </div>)}
            <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[120px]">
              <Select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} options={[
                { label: 'All Statuses', value: 'all' },
                { label: 'Present', value: 'Present' },
                { label: 'Late', value: 'Late' },
                { label: 'Absent', value: 'Absent' },
                { label: 'On Leave', value: 'On Leave' },
            ]}/>
            </div>
            {((!isEmp && selectedDept !== 'all') || selectedStatus !== 'all') && (<Button variant="ghost" size="sm" onClick={() => {
                    setSelectedDept('all');
                    setSelectedStatus('all');
                }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs shrink-0 font-semibold">
                Reset
              </Button>)}
          </div>}/>
    </div>);
};
