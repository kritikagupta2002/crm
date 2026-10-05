import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  ArrowLeft,
  Download,
  Fingerprint,
  UserCheck,
  UserX,
  ClockAlert,
  CalendarOff,
  Filter,
  RotateCcw,
  CalendarDays,
} from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/common/Button';
import { DatePicker } from '@/components/common/DatePicker';
import { Select } from '@/components/common/Select';
import { useToast } from '@/contexts/ToastContext';
import { attendanceService } from '@/modules/attendance/services/attendance.service';
import { getEmployeeProjectById, STANDARD_PROJECTS } from '@/core/constants/projects';
import {
  DAYS_OF_WEEK,
  filterAttendanceRecords,
  computeAttendanceMetrics,
} from '../utils/attendanceFilters';

export const DailyAttendancePage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [records, setRecords] = useState([]);
  const [filterMode, setFilterMode] = useState('date'); // 'date' | 'day' | 'month'

  // Default date to today's ISO string (local date)
  const todayIso = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [selectedMonth, setSelectedMonth] = useState(() => todayIso.slice(0, 7)); // 'YYYY-MM'

  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');

  useEffect(() => {
    const load = async () => {
      const data = await attendanceService.getAttendance();
      setRecords(data || []);
      // If records exist and today has no records, sync to the latest recorded date
      if (data && data.length > 0) {
        const hasToday = data.some((r) => r.date === todayIso);
        if (!hasToday) {
          const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
          setSelectedDate(sorted[0].date);
          setSelectedMonth(sorted[0].date.slice(0, 7));
        }
      }
    };
    load();
  }, [todayIso]);

  // Unified single source of truth for filtered records
  const filteredRecords = useMemo(() => {
    return filterAttendanceRecords(records, {
      mode: filterMode,
      date: selectedDate,
      day: selectedDay,
      month: selectedMonth,
      department: selectedDept,
      project: selectedProject,
      status: selectedStatus,
      punchSource: selectedSource,
      getProjectFn: getEmployeeProjectById,
    });
  }, [
    records,
    filterMode,
    selectedDate,
    selectedDay,
    selectedMonth,
    selectedDept,
    selectedProject,
    selectedStatus,
    selectedSource,
  ]);

  // Unified metrics for counters and stat cards
  const metrics = useMemo(() => {
    return computeAttendanceMetrics(filteredRecords);
  }, [filteredRecords]);

  const handleExport = () => {
    const label =
      filterMode === 'date'
        ? selectedDate
        : filterMode === 'day'
        ? `${selectedDay}s`
        : selectedMonth;
    toast.success(`Exporting attendance shift records for ${label}.`, 'Export Complete');
  };

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
      render: (r) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-100">{r.employeeName}</span>
          <p className="text-[11px] text-slate-400">{r.department}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      className: 'font-mono text-xs text-slate-700 dark:text-slate-300',
    },
    {
      key: 'project',
      header: 'Project / Site',
      sortable: true,
      render: (r) => {
        const proj = getEmployeeProjectById(r.employeeId);
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D5860B]" />
            {proj}
          </span>
        );
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
      render: (r) => (
        <span
          className={
            r.lateBy !== '-'
              ? 'text-amber-600 dark:text-amber-400 font-bold text-xs'
              : 'text-slate-400 text-xs'
          }
        >
          {r.lateBy}
        </span>
      ),
    },
    {
      key: 'punchSource',
      header: 'Punch Source',
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
          <Fingerprint className="w-3.5 h-3.5 text-blue-500" />
          {r.punchSource}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
  ];

  const currentPeriodLabel =
    filterMode === 'date'
      ? selectedDate
      : filterMode === 'day'
      ? `${selectedDay} Logs`
      : `${selectedMonth} Monthly Logs`;

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      <PageHeader
        title="Attendance Register & Shift Logs"
        description="Biometric punch ledger, mobile field GPS logs, and shift compliance."
        breadcrumbs={[
          { label: 'Dashboard', path: '/hr' },
          { label: 'Attendance', path: '/hr/attendance' },
          { label: 'Register View' },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/hr/attendance')}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Overview
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export Report
            </Button>
          </div>
        }
      />

      {/* KPI Counters Strip - Directly derived from filteredRecords */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3 sm:p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
              Total Logs
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {metrics.totalLogs}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3 sm:p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
              Present
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {metrics.presentCount}{' '}
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                ({metrics.presentPercent}%)
              </span>
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3 sm:p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ClockAlert className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
              Late Arrivals
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {metrics.lateCount}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3 sm:p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 flex items-center justify-center shrink-0">
            <UserX className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
              Absences
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {metrics.absentCount}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3 sm:p-4 shadow-2xs flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 flex items-center justify-center shrink-0">
            <CalendarOff className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold truncate">
              On Leave
            </p>
            <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {metrics.onLeaveCount}
            </h3>
          </div>
        </div>
      </div>

      {/* Main Filter Bar */}
      <div className="bg-white dark:bg-[#1A2430] p-4 rounded-2xl border border-slate-200/90 dark:border-[#253344] shadow-xs space-y-3">
        {/* Top Filter Row: Filter Mode Switcher (Date | Day | Month) + Mode specific picker */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 shrink-0">
              <Filter className="w-4 h-4 text-teal-600" /> Filter Mode:
            </span>
            <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-[#111821] border border-slate-200 dark:border-[#253344] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterMode('date')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filterMode === 'date'
                    ? 'bg-white dark:bg-[#1A2430] text-teal-700 dark:text-teal-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Date
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('day')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filterMode === 'day'
                    ? 'bg-white dark:bg-[#1A2430] text-teal-700 dark:text-teal-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('month')}
                className={`px-3 py-1 rounded-lg transition-colors ${
                  filterMode === 'month'
                    ? 'bg-white dark:bg-[#1A2430] text-teal-700 dark:text-teal-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Month
              </button>
            </div>
          </div>

          {/* Dynamic Input based on Mode */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {filterMode === 'date' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                  Select Date:
                </span>
                <div className="w-full sm:w-44">
                  <DatePicker
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {filterMode === 'day' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                  Select Day:
                </span>
                <div className="w-full sm:w-44">
                  <Select
                    options={DAYS_OF_WEEK.map((d) => ({ value: d, label: d }))}
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                  />
                </div>
              </div>
            )}

            {filterMode === 'month' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 shrink-0">
                  Select Month:
                </span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#253344] bg-slate-50 dark:bg-[#111821] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            )}
          </div>
        </div>

        {/* Secondary Filter Row: Department, Project, Status, Punch Source */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
          <div className="w-full sm:w-48">
            <Select
              options={[
                { value: 'all', label: 'All Departments' },
                { value: 'Geology & Mineral Exploration', label: 'Geology & Exploration' },
                { value: 'Mining & Mine Planning', label: 'Mining & Planning' },
                { value: 'GIS, Remote Sensing & UAV', label: 'GIS & Remote Sensing' },
                { value: 'Hydrogeology & Groundwater', label: 'Hydrogeology' },
                { value: 'Finance & Mineral Economics', label: 'Finance & Economics' },
                { value: 'Human Resources & Admin', label: 'HR & Admin' },
              ]}
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
            />
          </div>

          {/* Project Filter */}
          <div className="w-full sm:w-52">
            <Select
              options={[
                { value: 'all', label: 'All Projects / Sites' },
                ...STANDARD_PROJECTS.map((p) => ({ value: p, label: p })),
              ]}
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-36">
            <Select
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'Present', label: 'Present' },
                { value: 'Late', label: 'Late Arrival' },
                { value: 'Absent', label: 'Absent' },
                { value: 'On Leave', label: 'On Leave' },
              ]}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
          </div>

          {/* Punch Source Filter */}
          <div className="w-full sm:w-44">
            <Select
              options={[
                { value: 'all', label: 'All Punch Sources' },
                { value: 'Biometric', label: 'Biometric Terminal' },
                { value: 'GPS', label: 'Field GPS Mobile' },
                { value: 'Approved leave', label: 'Approved Leave' },
              ]}
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
            />
          </div>

          {/* Reset Filters Button */}
          {(selectedDept !== 'all' ||
            selectedProject !== 'all' ||
            selectedStatus !== 'all' ||
            selectedSource !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedDept('all');
                setSelectedProject('all');
                setSelectedStatus('all');
                setSelectedSource('all');
              }}
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset Filters
            </Button>
          )}

          <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto hidden lg:inline">
            Showing <strong>{filteredRecords.length}</strong> logs for <strong>{currentPeriodLabel}</strong>
          </span>
        </div>
      </div>

      {/* Main Table with Explicit Empty State Requirement */}
      {filteredRecords.length === 0 ? (
        <div className="bg-white dark:bg-[#1A2430] border border-slate-200/90 dark:border-[#253344] rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <CalendarOff className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No attendance records found for the selected period.
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            No punch or shift entries match the chosen {filterMode} ({currentPeriodLabel}). Try picking another date, weekday, or month.
          </p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredRecords}
          keyField="id"
          searchPlaceholder="Search staff by name or code..."
          emptyTitle="No attendance records found for the selected period."
        />
      )}
    </div>
  );
};
