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
import { downloadCsv } from '../../../../shared/utils/exportCsv';
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

  // Base records for the current period (before status tab filtering) to power live tab counts and KPI cards
  const basePeriodRecords = useMemo(() => {
    return filterAttendanceRecords(records, {
      mode: filterMode,
      date: selectedDate,
      day: selectedDay,
      month: selectedMonth,
      department: selectedDept,
      project: selectedProject,
      status: 'all',
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
    selectedSource,
  ]);

  // Filtered records respecting both toolbar filters and the active status tab
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
    return computeAttendanceMetrics(basePeriodRecords);
  }, [basePeriodRecords]);

  // CRM Stage Tabs for status navigation
  const tabs = useMemo(() => [
    { id: 'all', label: 'All Logs', count: metrics.totalLogs },
    { id: 'Present', label: 'Present', count: metrics.presentCount },
    { id: 'Late', label: 'Late Arrivals', count: metrics.lateCount },
    { id: 'Absent', label: 'Absences', count: metrics.absentCount },
    { id: 'On Leave', label: 'On Leave', count: metrics.onLeaveCount },
  ], [metrics]);

  const currentPeriodLabel = useMemo(() => {
    if (filterMode === 'date') return selectedDate;
    if (filterMode === 'day') return `Every ${selectedDay}`;
    if (filterMode === 'month') return selectedMonth;
    return '';
  }, [filterMode, selectedDate, selectedDay, selectedMonth]);

  const handleExport = () => {
    const label =
      filterMode === 'date'
        ? selectedDate
        : filterMode === 'day'
        ? `${selectedDay}s`
        : selectedMonth;
    if (!filteredRecords.length) {
      toast.error('No attendance records in this view.', 'Nothing to export');
      return;
    }
    downloadCsv(`Attendance_${String(label).replace(/\s+/g, '_')}.csv`, [
      { label: 'Date', value: (r) => r.date },
      { label: 'Employee ID', value: (r) => r.employeeId },
      { label: 'Name', value: (r) => r.employeeName },
      { label: 'Department', value: (r) => r.department },
      { label: 'Project', value: (r) => getEmployeeProjectById(r.employeeId) },
      { label: 'Punch in', value: (r) => r.checkIn },
      { label: 'Punch out', value: (r) => r.checkOut },
      { label: 'Hours', value: (r) => r.workingHours || r.workHours || '-' },
      { label: 'Late by', value: (r) => r.lateBy || '-' },
      { label: 'Status', value: (r) => r.status },
      { label: 'Source', value: (r) => r.punchSource || 'Biometric' },
    ], filteredRecords);
    toast.success(`Exported ${filteredRecords.length} records to CSV.`);
  };

  const columns = [
    {
      key: 'employeeId',
      header: 'Emp ID',
      sortable: true,
      className: 'w-24 font-mono font-bold text-teal-800 tabular-nums whitespace-nowrap',
    },
    {
      key: 'employeeName',
      header: 'Staff Member',
      sortable: true,
      className: 'min-w-[190px]',
      render: (r) => (
        <div>
          <span className="font-bold text-ink text-xs">{r.employeeName}</span>
          <p className="text-[11px] text-ink-3">{r.department}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      className: 'font-mono text-xs text-ink-2 tabular-nums whitespace-nowrap',
      render: (r) => {
        const dayStr = new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', {
          weekday: 'short',
        });
        return (
          <span>
            {r.date} <span className="text-[10px] text-ink-3">({dayStr})</span>
          </span>
        );
      },
    },
    {
      key: 'project',
      header: 'Project / Site',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => {
        const proj = getEmployeeProjectById(r.employeeId);
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D5860B]" />
            {proj}
          </span>
        );
      },
    },
    {
      key: 'checkIn',
      header: 'Check In',
      className: 'font-mono text-xs font-semibold text-ink tabular-nums whitespace-nowrap',
      render: (r) => <span>{r.checkIn || '—'}</span>,
    },
    {
      key: 'checkOut',
      header: 'Check Out',
      className: 'font-mono text-xs text-ink-2 tabular-nums whitespace-nowrap',
      render: (r) => <span>{r.checkOut || '—'}</span>,
    },
    {
      key: 'workingHours',
      header: 'Duration',
      className: 'font-mono font-bold text-xs text-ink tabular-nums whitespace-nowrap',
      render: (r) => <span>{r.workingHours || (r.workHours ? `${r.workHours}h` : '—')}</span>,
    },
    {
      key: 'lateBy',
      header: 'Late Mark',
      render: (r) => (
        <span
          className={
            r.lateBy && r.lateBy !== '-' && r.lateBy !== '0'
              ? 'text-amber-700 font-bold text-xs tabular-nums whitespace-nowrap'
              : 'text-ink-4 text-xs whitespace-nowrap'
          }
        >
          {r.lateBy || '-'}
        </span>
      ),
    },
    {
      key: 'punchSource',
      header: 'Punch Source',
      className: 'whitespace-nowrap',
      render: (r) => (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-ink-3">
          <Fingerprint className="w-3.5 h-3.5 text-teal-600" />
          {r.punchSource || 'Biometric'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      className: 'whitespace-nowrap',
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
  ];

  const filterControls = (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Mode Switcher Segmented Pills */}
      <div className="inline-flex rounded-md p-0.5 bg-slate-100 border border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setFilterMode('date')}
          className={`px-2.5 py-0.5 rounded transition-colors ${
            filterMode === 'date'
              ? 'bg-white text-teal-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Date
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('day')}
          className={`px-2.5 py-0.5 rounded transition-colors ${
            filterMode === 'day'
              ? 'bg-white text-teal-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Day
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('month')}
          className={`px-2.5 py-0.5 rounded transition-colors ${
            filterMode === 'month'
              ? 'bg-white text-teal-700 shadow-xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Month
        </button>
      </div>

      {/* Mode Input */}
      {filterMode === 'date' && (
        <div className="w-36">
          <DatePicker
            size="sm"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e?.target?.value ?? e)}
          />
        </div>
      )}

      {filterMode === 'day' && (
        <div className="w-36">
          <Select
            size="sm"
            options={DAYS_OF_WEEK.map((d) => ({ value: d, label: d }))}
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          />
        </div>
      )}

      {filterMode === 'month' && (
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="select select-sm w-36 font-semibold"
        />
      )}

      {/* Department Filter */}
      <div className="w-44 sm:w-48">
        <Select
          size="sm"
          options={[
            { value: 'all', label: 'All Departments' },
            {
              value: 'Geology & Mineral Exploration',
              label: 'Geology & Exploration',
            },
            { value: 'Mining & Mine Planning', label: 'Mining & Planning' },
            {
              value: 'GIS, Remote Sensing & UAV',
              label: 'GIS & Remote Sensing',
            },
            {
              value: 'Hydrogeology & Groundwater',
              label: 'Hydrogeology',
            },
            {
              value: 'Finance & Mineral Economics',
              label: 'Finance & Economics',
            },
            { value: 'Human Resources & Admin', label: 'HR & Admin' },
          ]}
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
        />
      </div>

      {/* Project Filter */}
      <div className="w-44 sm:w-52">
        <Select
          size="sm"
          options={[
            { value: 'all', label: 'All Projects / Sites' },
            ...STANDARD_PROJECTS.map((p) => ({ value: p, label: p })),
          ]}
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        />
      </div>

      {/* Source Filter */}
      <div className="w-40">
        <Select
          size="sm"
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

      {(selectedDept !== 'all' ||
        selectedProject !== 'all' ||
        selectedSource !== 'all') && (
        <button
          type="button"
          onClick={() => {
            setSelectedDept('all');
            setSelectedProject('all');
            setSelectedSource('all');
          }}
          className="link-button text-xs"
        >
          <RotateCcw size={13} /> Reset
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* CRM Page Header with Contour Lines */}
      <PageHeader
        title="Attendance Register & Shift Logs"
        description={`Biometric punch ledger, mobile field GPS logs, and shift compliance for ${currentPeriodLabel}.`}
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

      {/* CRM Stat Cards Strip */}
      <section className="stat-grid">
        <div className="card stat-card tone-info">
          <div className="stat-top">
            <span className="stat-icon">
              <CalendarDays size={20} />
            </span>
            <h3>Total Logs</h3>
          </div>
          <strong className="stat-value">{metrics.totalLogs}</strong>
          <div className="stat-meta">
            <span className="muted">{currentPeriodLabel}</span>
          </div>
        </div>

        <div className="card stat-card tone-good">
          <div className="stat-top">
            <span className="stat-icon">
              <UserCheck size={20} />
            </span>
            <h3>Present</h3>
          </div>
          <strong className="stat-value">
            {metrics.presentCount}{' '}
            <span className="text-sm font-semibold text-emerald-700">
              ({metrics.presentPercent}%)
            </span>
          </strong>
          <div className="stat-meta">
            <span className="muted">On-duty staff</span>
          </div>
        </div>

        <div className="card stat-card tone-attention">
          <div className="stat-top">
            <span className="stat-icon">
              <ClockAlert size={20} />
            </span>
            <h3>Late Arrivals</h3>
          </div>
          <strong className="stat-value">{metrics.lateCount}</strong>
          <div className="stat-meta">
            <span className="muted">Punched after grace period</span>
          </div>
        </div>

        <div className="card stat-card tone-urgent">
          <div className="stat-top">
            <span className="stat-icon">
              <UserX size={20} />
            </span>
            <h3>Absences</h3>
          </div>
          <strong className="stat-value">{metrics.absentCount}</strong>
          <div className="stat-meta">
            <span className="muted">Unaccounted absence</span>
          </div>
        </div>

        <div className="card stat-card tone-info">
          <div className="stat-top">
            <span className="stat-icon">
              <CalendarOff size={20} />
            </span>
            <h3>On Leave</h3>
          </div>
          <strong className="stat-value">{metrics.onLeaveCount}</strong>
          <div className="stat-meta">
            <span className="muted">Approved leave quota</span>
          </div>
        </div>
      </section>

      {/* Single Unified CRM Card with Toolbar, Stage Tabs, Table & Pager */}
      <DataTable
        columns={columns}
        data={filteredRecords}
        keyField="id"
        tabs={tabs}
        activeTab={selectedStatus}
        onTabChange={setSelectedStatus}
        filterComponent={filterControls}
        searchPlaceholder="Search staff by name or code..."
        searchFields={['employeeName', 'employeeId', 'department']}
        emptyTitle="No attendance records found for the selected period."
        emptyDescription={`No punch or shift entries match the chosen ${filterMode} (${currentPeriodLabel}). Try picking another date, weekday, or month.`}
      />
    </div>
  );
};
