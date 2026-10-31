import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCheck, UserX, ClockAlert, CalendarOff, Clock, Fingerprint, CalendarDays, FileEdit, Download, MapPin } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { DatePicker } from '@/components/common/DatePicker';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { attendanceService } from '@/modules/attendance/services/attendance.service';
import { storage } from '@/core/storage/storage';
import { DAYS_OF_WEEK, getDayOfWeekFromIso } from '../utils/attendanceFilters';
import { downloadCsv } from '../../../../shared/utils/exportCsv';
import { GeofenceModal } from '../components/GeofenceModal';
import { OFFICE_CENTROID } from '../utils/geofence';
export const AttendanceDashboardPage = () => {
    const { user } = useAuth();
    const { currentRole } = useRole();
    const [records, setRecords] = useState([]);
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [filterMode, setFilterMode] = useState('all'); // 'all' | 'date' | 'day' | 'month'
    const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [selectedDay, setSelectedDay] = useState('Monday');
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));
    const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
    const [userCoords, setUserCoords] = useState(() => ({
        latitude: OFFICE_CENTROID[0],
        longitude: OFFICE_CENTROID[1],
        accuracy: 8,
        simulated: true,
    }));
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
        if (filterMode === 'date' && selectedDate && r.date !== selectedDate) return false;
        if (filterMode === 'day' && selectedDay) {
            const dayOfWeek = getDayOfWeekFromIso(r.date);
            if (dayOfWeek.toLowerCase() !== selectedDay.toLowerCase()) return false;
        }
        if (filterMode === 'month' && selectedMonth && (!r.date || !r.date.startsWith(selectedMonth))) return false;
        if (selectedDept !== 'all' && r.department !== selectedDept)
            return false;
        if (selectedStatus !== 'all' && r.status !== selectedStatus)
            return false;
        return true;
    });

    const empStats = React.useMemo(() => {
        if (!isEmp) return null;
        const todayIso = new Date().toLocaleDateString('en-CA');
        const monthPrefix = selectedMonth || todayIso.slice(0, 7);
        const monthRecs = records.filter((r) => r.date && r.date.startsWith(monthPrefix));
        const todayRec = records.find((r) => r.date === todayIso);

        const present = monthRecs.filter((r) => r.status === 'Present' || r.status === 'Late').length;
        const late = monthRecs.filter((r) => r.status === 'Late').length;
        const leave = monthRecs.filter((r) => r.status === 'On Leave').length;
        const total = monthRecs.length || 1;
        const rate = Math.round((present / total) * 100);

        const otMins = monthRecs.reduce((sum, r) => {
          const match = String(r.overtime || '').match(/^(\d+)m$/);
          return sum + (match ? Number(match[1]) : 0);
        }, 0);
        const otHrs = otMins > 0 ? `${(otMins / 60).toFixed(1)}h` : '0h';

        const correctionsCount = (storage.getCorrections?.() || []).filter(
          (c) => c.employeeId === (user?.employeeId || '') && c.status === 'Pending'
        ).length;

        return {
            todayIn: todayRec?.checkIn || 'Not Punched',
            todayBadge: todayRec ? (todayRec.status === 'Late' ? 'Late' : 'On Time') : 'Pending',
            todayBadgeColor: todayRec ? (todayRec.status === 'Late' ? 'bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-400' : 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-400') : 'bg-slate-50 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400',
            presentStr: `${present} / ${total}`,
            rateStr: `${rate}%`,
            lateStr: String(late),
            leaveStr: String(leave),
            otStr: otHrs,
            correctionsStr: String(correctionsCount),
        };
    }, [isEmp, records, selectedMonth, user?.employeeId]);
    const handleExport = () => {
        if (!filteredRecords.length) {
            toast.error('No attendance records in this view.', 'Nothing to export');
            return;
        }
        downloadCsv(`Attendance_${new Date().toLocaleDateString('en-CA')}.csv`, [
        { label: 'Date', value: (r) => r.date },
        { label: 'Employee ID', value: (r) => r.employeeId },
        { label: 'Name', value: (r) => r.employeeName },
        { label: 'Department', value: (r) => r.department },
        { label: 'Punch in', value: (r) => r.checkIn },
        { label: 'Punch out', value: (r) => r.checkOut },
        { label: 'Hours', value: (r) => r.workingHours },
        { label: 'Late by', value: (r) => r.lateBy },
        { label: 'Status', value: (r) => r.status },
        { label: 'Source', value: (r) => r.punchSource },
    ], filteredRecords);
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
            <Button variant="outline" size="sm" onClick={() => setIsGeofenceModalOpen(true)} leftIcon={<MapPin className="w-4 h-4 text-teal-600"/>}>
              Geofence Map
            </Button>
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
      <div className="hr-stat-row">
        {(isEmp
            ? [
                {
                    title: 'Punch In Today',
                    value: empStats?.todayIn || 'Not Punched',
                    badge: empStats?.todayBadge || 'Pending',
                    badgeColor: empStats?.todayBadgeColor || 'bg-slate-50 text-slate-600',
                    subtitle: 'Shift Attendance',
                    icon: <UserCheck className="w-3.5 h-3.5"/>,
                    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
                },
                {
                    title: 'Present Days',
                    value: empStats?.presentStr || '0 / 0',
                    badge: empStats?.rateStr || '0%',
                    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800/60',
                    subtitle: 'This Month',
                    icon: <CalendarDays className="w-3.5 h-3.5"/>,
                    iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
                },
                {
                    title: 'Late Marks',
                    value: empStats?.lateStr || '0',
                    badge: Number(empStats?.lateStr) > 0 ? 'Review' : 'None',
                    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60',
                    subtitle: 'Late arrivals',
                    icon: <ClockAlert className="w-3.5 h-3.5"/>,
                    iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
                },
                {
                    title: 'Leave Days',
                    value: empStats?.leaveStr || '0',
                    badge: Number(empStats?.leaveStr) > 0 ? 'Approved' : 'None',
                    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200/80 dark:bg-purple-950/60 dark:text-purple-400 dark:border-purple-800/60',
                    subtitle: 'Approved leave',
                    icon: <CalendarOff className="w-3.5 h-3.5"/>,
                    iconBg: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400',
                },
                {
                    title: 'Field Extra Hrs',
                    value: empStats?.otStr || '0h',
                    badge: 'Logged',
                    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/60 dark:text-teal-400 dark:border-teal-800/60',
                    subtitle: 'Site exploration OT',
                    icon: <Clock className="w-4 h-4"/>,
                    iconBg: 'bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400',
                },
                {
                    title: 'Punch Corrections',
                    value: empStats?.correctionsStr || '0',
                    badge: Number(empStats?.correctionsStr) > 0 ? 'Pending' : 'Synced',
                    badgeColor: Number(empStats?.correctionsStr) > 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-50 text-slate-700',
                    subtitle: 'Correction requests',
                    icon: <FileEdit className="w-4 h-4"/>,
                    iconBg: 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
                },
            ]
            : (() => {
                const allEmps = storage.getEmployees();
                const totalStaff = allEmps.length;
                const presentCount = records.filter((r) => r.status === 'Present' || r.status === 'Late').length;
                const leaveCount = storage.getLeaveRequests().filter((l) => l.status === 'Approved').length;
                const absentCount = Math.max(0, totalStaff - presentCount - leaveCount);
                const lateCount = records.filter((r) => r.lateBy && r.lateBy !== '-').length;
                const fieldCount = allEmps.filter((e) => e.employment?.workLocation?.includes('Field') || e.employment?.workLocation?.includes('Bhilwara')).length;
                const pendingCorrections = (storage.getCorrections?.() || []).filter((c) => c.status === 'Pending').length;
                const presentPercent = totalStaff > 0 ? ((presentCount / totalStaff) * 100).toFixed(1) : '0';
                const absentPercent = totalStaff > 0 ? ((absentCount / totalStaff) * 100).toFixed(1) : '0';
                return [
                    {
                        title: 'Present Today',
                        value: String(presentCount),
                        badge: `${presentPercent}%`,
                        badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800/60',
                        subtitle: `${presentCount} of ${totalStaff} Staff`,
                        icon: <UserCheck className="w-4 h-4"/>,
                        iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400',
                    },
                    {
                        title: 'Absent',
                        value: String(absentCount),
                        badge: `${absentPercent}%`,
                        badgeColor: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800/60',
                        subtitle: 'Unplanned absence',
                        icon: <UserX className="w-4 h-4"/>,
                        iconBg: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400',
                    },
                    {
                        title: 'Late Arrivals',
                        value: String(lateCount),
                        badge: 'Grace Window',
                        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60',
                        subtitle: 'Punched after 09:45',
                        icon: <ClockAlert className="w-4 h-4"/>,
                        iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
                    },
                    {
                        title: 'Corrections Pending',
                        value: String(pendingCorrections),
                        badge: pendingCorrections > 0 ? 'Review' : 'Nil',
                        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60',
                        subtitle: 'Requires Director approval',
                        icon: <FileEdit className="w-4 h-4"/>,
                        iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
                    },
                    {
                        title: 'On Leave',
                        value: String(leaveCount),
                        badge: 'Approved',
                        badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-800/60',
                        subtitle: 'Active approvals',
                        icon: <CalendarOff className="w-4 h-4"/>,
                        iconBg: 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400',
                    },
                    {
                        title: 'Field Deployed',
                        value: String(fieldCount),
                        badge: 'Live',
                        badgeColor: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800/60',
                        subtitle: 'Bhilwara & Remote Sites',
                        icon: <Fingerprint className="w-4 h-4"/>,
                        iconBg: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400',
                    },
                ];
            })()).map((kpi) => {
                const notPunched = kpi.value === 'Not Punched';
                return (<StatCard key={kpi.title} title={kpi.title} value={notPunched ? '—' : kpi.value} icon={kpi.icon} iconBgColor={kpi.iconBg} caption={notPunched ? 'Not punched in yet' : [kpi.subtitle, kpi.badge].filter(Boolean).join(' · ')}/>);
            })}
      </div>

      {/* Attendance Table with Filter Bar */}
      <DataTable
        compact={true}
        columns={columns}
        data={filteredRecords}
        keyField="id"
        emptyTitle="No attendance records found for the selected period."
        searchPlaceholder={isEmp ? 'Search my attendance records...' : 'Search employee, ID, location...'}
        searchFields={isEmp ? ['date', 'punchSource', 'status'] : ['employeeName', 'employeeId', 'department']}
        filterComponent={
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {/* Filter Mode Selector: All | Date | Day | Month */}
            <div className="inline-flex rounded-xl p-0.5 bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold h-[34px] items-center">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`h-[28px] px-2.5 flex items-center justify-center rounded-lg transition-colors ${
                  filterMode === 'all'
                    ? 'bg-white dark:bg-[#1A2430] text-teal-700 dark:text-teal-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('date')}
                className={`h-[28px] px-2.5 flex items-center justify-center rounded-lg transition-colors ${
                  filterMode === 'date'
                    ? 'bg-white dark:bg-[#1A2430] text-teal-700 dark:text-teal-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Date
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('day')}
                className={`h-[28px] px-2.5 flex items-center justify-center rounded-lg transition-colors ${
                  filterMode === 'day'
                    ? 'bg-white dark:bg-[#1A2430] text-teal-700 dark:text-teal-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('month')}
                className={`h-[28px] px-2.5 flex items-center justify-center rounded-lg transition-colors ${
                  filterMode === 'month'
                    ? 'bg-white dark:bg-[#1A2430] text-teal-700 dark:text-teal-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Month
              </button>
            </div>

            {/* Dynamic Pickers based on Mode */}
            {filterMode === 'date' && (
              <div className="w-36">
                <DatePicker size="sm" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>
            )}

            {filterMode === 'day' && (
              <div className="w-32">
                <Select
                  size="sm"
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  options={DAYS_OF_WEEK.map((d) => ({ label: d, value: d }))}
                />
              </div>
            )}

            {filterMode === 'month' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-[34px] px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#253344] bg-white dark:bg-[#1A2430] text-slate-800 dark:text-slate-200"
              />
            )}

            {!isEmp && (
              <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[140px]">
                <Select
                  size="sm"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  options={[
                    { label: 'All Departments', value: 'all' },
                    { label: 'Geology & Exploration', value: 'Geology & Mineral Exploration' },
                    { label: 'Mining & Mine Planning', value: 'Mining & Mine Planning' },
                    { label: 'GIS & UAV Drone', value: 'GIS, Remote Sensing & UAV' },
                    { label: 'Hydrogeology', value: 'Hydrogeology & Groundwater' },
                    { label: 'Finance & Economics', value: 'Finance & Mineral Economics' },
                    { label: 'HR & Admin', value: 'Human Resources & Admin' },
                  ]}
                />
              </div>
            )}

            <div className="w-full xs:w-auto flex-1 xs:flex-initial min-w-[120px]">
              <Select
                size="sm"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                options={[
                  { label: 'All Statuses', value: 'all' },
                  { label: 'Present', value: 'Present' },
                  { label: 'Late', value: 'Late' },
                  { label: 'Absent', value: 'Absent' },
                  { label: 'On Leave', value: 'On Leave' },
                ]}
              />
            </div>

            {((!isEmp && selectedDept !== 'all') ||
              selectedStatus !== 'all' ||
              filterMode !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedDept('all');
                  setSelectedStatus('all');
                  setFilterMode('all');
                }}
                className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs shrink-0 font-semibold"
              >
                Reset
              </Button>
            )}
          </div>
        }
      />

      <GeofenceModal
        isOpen={isGeofenceModalOpen}
        onClose={() => setIsGeofenceModalOpen(false)}
        userCoords={userCoords}
        onCoordsChange={setUserCoords}
      />
    </div>);
};
