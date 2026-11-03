import React, { useState, useEffect, useMemo } from 'react';
import { Users, UserCheck, CalendarOff, Calendar, UserPlus, CalendarDays, Clock, RotateCcw, ChevronDown, BarChart3, Filter, Plus, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, } from 'recharts';
import { Button } from '@/components/common/Button';
import { StatCard } from '@/components/common/StatCard';
import { Modal } from '@/components/common/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { storage } from '@/core/storage/storage';
import { leaveService } from '@/modules/leave/services/leave.service';
import { EmployeeDashboard } from '../components/EmployeeDashboard';
import { PunchPanel } from '@/modules/attendance/components/PunchPanel';
import { markedDays } from '@/modules/leave/utils/workingDays';
import { todayIso } from '@/modules/attendance/utils/punch';
import { weeklyOffFor } from '@/modules/attendance/utils/weeklyOff';
// Live Digital Clock isolated component to prevent parent dashboard re-renders
const LiveClock = ({ className }) => {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  }));
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return <span className={className}>{time}</span>;
};
const AdminDashboard = () => {
  const { user } = useAuth();
  const { currentRole } = useRole();
  const { isDark } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();
  // Live master data directly from storage
  const [allEmployees, setAllEmployees] = useState(() => storage.getEmployees());
  const [allAttendance, setAllAttendance] = useState(() => storage.getAttendance());
  const [allLeaveRequests, setAllLeaveRequests] = useState(() => storage.getLeaveRequests());

  // Dynamic birthdays computed from real employee records
  const birthdaysList = useMemo(() => {
    return allEmployees
      .filter((e) => e.personal?.dob)
      .map((e) => {
        const parts = e.personal.dob.split('-');
        const m = parts[1] || '01';
        const d = parts[2] || '01';
        const dateObj = new Date(2026, parseInt(m, 10) - 1, parseInt(d, 10));
        return {
          name: e.name,
          role: e.employment?.designation || e.role || 'Team Member',
          date: dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          rawSort: `${m}-${d}`,
        };
      })
      .sort((a, b) => a.rawSort.localeCompare(b.rawSort))
      .slice(0, 4);
  }, [allEmployees]);

  // Dynamic anniversaries computed from real joining dates
  const anniversariesList = useMemo(() => {
    return allEmployees
      .filter((e) => e.employment?.joiningDate)
      .map((e) => {
        const parts = e.employment.joiningDate.split('-');
        const y = parseInt(parts[0] || '2026', 10);
        const m = parts[1] || '01';
        const d = parts[2] || '01';
        const yearsCount = Math.max(1, 2026 - y);
        const dateObj = new Date(2026, parseInt(m, 10) - 1, parseInt(d, 10));
        return {
          name: e.name,
          role: e.employment?.designation || 'Team Member',
          date: dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
          years: `${yearsCount} Year${yearsCount > 1 ? 's' : ''}`,
          rawSort: `${m}-${d}`,
        };
      })
      .sort((a, b) => a.rawSort.localeCompare(b.rawSort))
      .slice(0, 4);
  }, [allEmployees]);

  // Dynamic upcoming holidays computed from holiday schedule
  const upcomingHolidaysList = useMemo(() => {
    const today = todayIso();
    // Only the days HR / Admin marked on the attendance calendar (holidays and half days).
    return markedDays(storage.getLeaveSettings()?.companyHolidays)
      .map((h) => ({ ...h, name: h.name || h.kind }))
      .filter((h) => h.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4)
      .map((h) => {
        const d = new Date(`${h.date}T00:00:00`);
        return {
          title: h.name,
          date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          day: d.toLocaleDateString('en-IN', { weekday: 'long' }),
          badge: h.kind || 'Gazetted',
        };
      });
  }, []);
  // State
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [greeting, setGreeting] = useState('');
  const [chartTab, setChartTab] = useState('attendance');
  // Dashboard Global Filters State
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [locations, setLocations] = useState(() => storage.getLocations());
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationStatus, setNewLocationStatus] = useState('Active');
  const [locationError, setLocationError] = useState('');

  const handleAddLocationSubmit = (e) => {
    e?.preventDefault();
    const trimmed = newLocationName.trim();
    if (!trimmed) {
      setLocationError('Location name is required.');
      return;
    }
    try {
      const newLoc = storage.addLocation({ name: trimmed, status: newLocationStatus });
      const updated = storage.getLocations();
      setLocations(updated);
      setSelectedLocation(newLoc.name.toLowerCase());
      setIsAddLocationModalOpen(false);
      setNewLocationName('');
      setNewLocationStatus('Active');
      setLocationError('');
      toast.success('Location added successfully.');
    } catch (err) {
      setLocationError(err.message || 'Failed to add location.');
    }
  };
  // Interactive Chart Range Selectors
  const [attendanceRange, setAttendanceRange] = useState('7days');
  const [leaveRange, setLeaveRange] = useState('this_month');
  // Dynamic Department List
  const departmentsList = useMemo(() => {
    const counts = {};
    allEmployees.forEach((e) => {
      const dept = e.employment?.department || 'Other';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [allEmployees]);
  // Dynamic Department Distribution for Pie Chart
  const departmentData = useMemo(() => {
    const palette = isDark
      ? ['#2DD4BF', '#38BDF8', '#FBBF24', '#A78BFA', '#F472B6', '#34D399', '#818CF8', '#FB923C']
      : ['#1F6F78', '#3DA8B2', '#C8943A', '#31485A', '#B07D27', '#7C8B96', '#06B6D4', '#8B5CF6'];
    const total = allEmployees.length || 1;
    return departmentsList.map((d, idx) => ({
      name: d.name,
      count: d.count,
      percent: `${Math.round((d.count / total) * 100)}%`,
      color: palette[idx % palette.length],
    }));
  }, [departmentsList, allEmployees, isDark]);

  // Live Recent Expense Claim Activity
  const latestExpenseActivity = useMemo(() => {
    try {
      const exps = storage.getExpenses();
      return exps && exps.length > 0 ? exps[0] : null;
    } catch {
      return null;
    }
  }, []);
  // Dynamically Filtered Metrics for Stat Cards
  const currentStats = useMemo(() => {
    let filteredEmps = allEmployees;
    if (selectedDept !== 'all') {
      filteredEmps = filteredEmps.filter((e) => e.employment?.department?.toLowerCase() === selectedDept.toLowerCase() ||
        e.employment?.department?.toLowerCase().includes(selectedDept.toLowerCase()));
    }
    if (selectedLocation !== 'all') {
      filteredEmps = filteredEmps.filter((e) => (e.employment?.workLocation || e.address?.city || '').toLowerCase().includes(selectedLocation.toLowerCase()));
    }
    const empIds = new Set(filteredEmps.map((e) => e.employeeId));
    const total = filteredEmps.length;
    const todayStr = new Date().toLocaleDateString('en-CA');
    const onLeaveEmpIds = new Set(allLeaveRequests
      .filter((l) => {
        if (l.status !== 'Approved' && l.status !== 'Partially Approved')
          return false;
        return todayStr >= l.startDate && todayStr <= l.endDate;
      })
      .map((l) => l.employeeId));

    let present = 0;
    let absent = 0;
    let leave = 0;
    let late = 0;

    if (selectedPeriod === 'today') {
      // One day's register (today or the latest one recorded)
      const day = allAttendance.reduce((d, a) => (a.date <= todayStr && a.date > d ? a.date : d), todayStr);
      const dayRecords = allAttendance.filter((a) => a.date === day && empIds.has(a.employeeId));
      present = new Set(dayRecords.filter((a) => a.status === 'Present' || a.status === 'Late').map((a) => a.employeeId)).size;
      leave = new Set([
        ...filteredEmps.filter((e) => onLeaveEmpIds.has(e.employeeId)).map((e) => e.employeeId),
        ...dayRecords.filter((a) => a.status === 'On Leave').map((a) => a.employeeId),
      ]).size;
      absent = Math.max(0, total - present - leave);
      late = new Set(dayRecords.filter((a) => a.lateBy && a.lateBy !== '-').map((a) => a.employeeId)).size;
    } else {
      const now = new Date();
      let startIso = todayStr;
      if (selectedPeriod === 'week') {
        const d = new Date(now);
        const dayOfWeek = d.getDay() || 7;
        d.setDate(d.getDate() - dayOfWeek + 1); // Monday
        startIso = d.toLocaleDateString('en-CA');
      } else if (selectedPeriod === 'month') {
        startIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      } else if (selectedPeriod === 'quarter') {
        const qMonth = Math.floor(now.getMonth() / 3) * 3 + 1;
        startIso = `${now.getFullYear()}-${String(qMonth).padStart(2, '0')}-01`;
      } else if (selectedPeriod === 'year') {
        startIso = `${now.getFullYear()}-01-01`;
      }
      const periodRecords = allAttendance.filter((a) => a.date >= startIso && a.date <= todayStr && empIds.has(a.employeeId));
      const recordedDates = [...new Set(periodRecords.map((a) => a.date))];
      const numDays = recordedDates.length || 1;

      const totalPresent = periodRecords.filter((a) => a.status === 'Present' || a.status === 'Late').length;
      const totalLeave = periodRecords.filter((a) => a.status === 'On Leave').length;
      const totalLate = periodRecords.filter((a) => a.lateBy && a.lateBy !== '-').length;

      present = Math.round(totalPresent / numDays);
      leave = Math.round(totalLeave / numDays);
      absent = Math.max(0, total - present - leave);
      late = Math.round(totalLate / numDays);
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const newJoiners = filteredEmps.filter((e) => {
      if (!e.employment?.joiningDate)
        return false;
      const jd = new Date(e.employment.joiningDate);
      return jd >= thirtyDaysAgo;
    }).length;

    const presentPercent = total > 0 ? ((present / total) * 100).toFixed(1) : '0';
    const absentPercent = total > 0 ? ((absent / total) * 100).toFixed(1) : '0';
    const leavePercent = total > 0 ? ((leave / total) * 100).toFixed(1) : '0';
    const latePercent = total > 0 ? ((late / total) * 100).toFixed(1) : '0';

    return { total, present, absent, leave, late, newJoiners, presentPercent, absentPercent, leavePercent, latePercent };
  }, [allEmployees, allAttendance, allLeaveRequests, selectedDept, selectedLocation, selectedPeriod]);
  // Attendance trend from real records, day by day. Days before the first recorded punch show no bars, and
  // people on their weekly off or not yet joined are not counted as absent.
  const currentAttendanceData = useMemo(() => {
    const iso = (d) => d.toLocaleDateString('en-CA');
    const step = attendanceRange === '30days' ? 3 : 1;
    const numDays = attendanceRange === '30days' ? 10 : attendanceRange === '14days' ? 14 : 7;
    const firstRecorded = allAttendance.reduce((min, a) => (a.date && (!min || a.date < min) ? a.date : min), '');
    const active = allEmployees.filter((e) => !['Inactive', 'Relieved', 'Terminated'].includes(e.employment?.status || e.status));
    const result = [];
    for (let i = numDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * step);
      const day = iso(d);
      const label = `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`;
      if (!firstRecorded || day < firstRecorded) {
        result.push({ date: label, present: 0, absent: 0, leave: 0 });
        continue;
      }
      const onRoll = active.filter((e) => (!e.employment?.joiningDate || e.employment.joiningDate <= day) && !weeklyOffFor(e.employeeId).includes(d.getDay()));
      const ids = new Set(onRoll.map((e) => e.employeeId));
      const records = allAttendance.filter((a) => a.date === day && ids.has(a.employeeId));
      const present = records.filter((a) => a.status === 'Present' || a.status === 'Late').length;
      const onLeave = new Set([
        ...records.filter((a) => a.status === 'On Leave').map((a) => a.employeeId),
        ...allLeaveRequests.filter((l) => ['Approved', 'Partially Approved'].includes(l.status) && day >= l.startDate && day <= l.endDate && ids.has(l.employeeId)).map((l) => l.employeeId),
      ]).size;
      result.push({ date: label, present, leave: onLeave, absent: Math.max(0, onRoll.length - present - onLeave) });
    }
    return result;
  }, [attendanceRange, allEmployees, allAttendance, allLeaveRequests]);
  // Dynamic Leave Overview Data derived from real requests without fabricated multipliers
  const currentLeaveData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA');
    const startOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const startOfLastMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}-01`;
    const endOfLastMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-00`;
    const startOfYear = `${now.getFullYear()}-01-01`;
    const filtered = allLeaveRequests.filter((l) => {
      if (l.status === 'Rejected' || l.status === 'Cancelled')
        return false;
      const dateToCheck = l.startDate || l.appliedOn;
      if (leaveRange === 'this_month')
        return dateToCheck >= startOfMonth && dateToCheck <= todayStr;
      if (leaveRange === 'last_month')
        return dateToCheck >= startOfLastMonth && dateToCheck <= endOfLastMonth;
      if (leaveRange === 'ytd')
        return dateToCheck >= startOfYear && dateToCheck <= todayStr;
      return true;
    });
    const counts = { 'PL': 0, 'CL': 0, 'SL': 0, 'Others': 0 };
    filtered.forEach((l) => {
      const type = l.leaveType || '';
      const days = Number(l.approvedDays ?? l.days) || 1;
      if (type.includes('Casual'))
        counts['CL'] += days;
      else if (type.includes('Sick'))
        counts['SL'] += days;
      else if (type.includes('Privilege') || type.includes('Earned'))
        counts['PL'] += days;
      else
        counts['Others'] += days;
    });
    const colors = isDark
      ? { 'CL': '#2DD4BF', 'SL': '#FBBF24', 'PL': '#F87171', 'Others': '#94A3B8' }
      : { 'CL': '#1F6F78', 'SL': '#C8943A', 'PL': '#D24C47', 'Others': '#7C8B96' };
    return [
      { type: 'PL', count: counts['PL'], color: colors['PL'] },
      { type: 'CL', count: counts['CL'], color: colors['CL'] },
      { type: 'SL', count: counts['SL'], color: colors['SL'] },
      { type: 'Others', count: counts['Others'], color: colors['Others'] },
    ];
  }, [allLeaveRequests, leaveRange, isDark]);
  const refreshData = () => {
    try {
      setAllEmployees(storage.getEmployees());
      setAllAttendance(storage.getAttendance());
      const allLeaves = storage.getLeaveRequests();
      setAllLeaveRequests(allLeaves);
      setPendingLeaves(allLeaves.filter((l) => l.status === 'Pending'));
    }
    catch {
      // ignore
    }
  };
  // Greeting and initial data
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12)
      setGreeting('Good morning');
    else if (hour < 17)
      setGreeting('Good afternoon');
    else
      setGreeting('Good evening');
    refreshData();
    window.addEventListener('focus', refreshData);
    return () => window.removeEventListener('focus', refreshData);
  }, []);
  // Handlers for HR Actions
  const reviewLeave = async (id, decision) => {
    try {
      await leaveService.reviewLeave(id, decision, user?.name ?? '', '', undefined, user?.employeeId);
      return true;
    }
    catch (err) {
      toast.error(err.message, 'Not allowed');
      return false;
    }
    finally {
      refreshData();
    }
  };
  const handleApproveLeave = async (id, empName) => {
    if (await reviewLeave(id, 'Approved'))
      toast.success(`Leave request approved for ${empName}`, 'Approval Confirmed');
  };
  const handleRejectLeave = async (id, empName) => {
    if (await reviewLeave(id, 'Rejected'))
      toast.info(`Leave request rejected for ${empName}`, 'Status Updated');
  };
  // 1. Stacked Attendance Trends (matching reference)
  // Tab for Celebrations widget
  const [celebrationTab, setCelebrationTab] = useState('birthdays');
  return (<div className="space-y-5 sm:space-y-6">
    {/* ========================================================================= */}
    {/* HR & ADMIN COMMAND CENTER VIEW                                             */}
    {/* ========================================================================= */}
    <div className="space-y-5 animate-fade-in pb-12">
      {/* ── TOP HERO HEADER SECTION ── */}
      <div className="relative rounded-3xl bg-gradient-to-r from-[#FAF9F6] via-[#FCFAF6] to-[#F5EFE6]/40 dark:from-[#111A26] dark:via-[#142130] dark:to-[#182738] border border-slate-200/80 dark:border-[#223347] p-4 sm:p-7 min-h-[140px] sm:min-h-[160px] flex items-center overflow-hidden shadow-xs dark:shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
        {/* Topographic Lines Watermark Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-40 dark:opacity-10">
          <svg viewBox="0 0 1200 200" fill="none" className="w-full h-full text-amber-500/20" stroke="currentColor">
            <path d="M0,100 C300,20 600,180 1200,60" strokeWidth="1.5" />
            <path d="M0,130 C350,50 650,210 1200,90" strokeWidth="1.5" />
            <path d="M0,70 C250,-10 550,150 1200,30" strokeWidth="1.5" />
            <path d="M0,160 C400,80 700,240 1200,120" strokeWidth="1.5" />
          </svg>
        </div>

        {/* Right side realistic mountain peaks bleed graphic */}
        <div className="absolute right-0 top-0 bottom-0 w-[46%] sm:w-[42%] md:w-[38%] pointer-events-none overflow-hidden select-none">
          {/* Golden Sun & Concentric Contour Rings */}
          <div className="absolute right-10 top-2 w-44 h-44 rounded-full border border-amber-400/40 dark:border-amber-400/20 pointer-events-none" />
          <div className="absolute right-4 -top-4 w-60 h-60 rounded-full border border-amber-300/30 dark:border-amber-400/15 pointer-events-none" />
          <div className="absolute -right-6 -top-10 w-76 h-76 rounded-full border border-amber-200/30 dark:border-amber-400/10 pointer-events-none" />

          {/* High-res rugged mountain peaks image with left fade mask */}
          <img src="/hero-mountain.jpg" alt="Bansal Geo Mountains" className="absolute right-0 bottom-0 h-full w-full object-cover object-right-bottom opacity-20 sm:opacity-100 dark:opacity-30 sm:dark:opacity-60 dark:brightness-75 dark:contrast-125 transition-all duration-300" style={{
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 15%, black 45%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 15%, black 45%, black 100%)',
          }} />
        </div>

        <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 pr-0 md:pr-8">
          {/* Top row on mobile / Left column on desktop: Greeting + Mobile Date Chip */}
          <div className="flex items-start justify-between md:block gap-2">
            <div className="max-w-xs">
              <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-normal">
                {(greeting || 'Good evening')},
              </p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-[#1E293B] dark:text-white tracking-tight mt-0.5">
                {firstName(user?.name)}!
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-sm mt-0.5 sm:mt-1 font-normal">
                Let's make today productive.
              </p>
            </div>

            {/* Mobile Date Badge (<768px) */}
            <div className="md:hidden flex items-center gap-1.5 bg-white/95 dark:bg-[#131E2B]/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-[#223347] shadow-2xs shrink-0">
              <Calendar className="w-3.5 h-3.5 text-[#2B5B84] dark:text-amber-400" />
              <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100">
                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          </div>

          {/* Right: Date Card floating in front of mountains (Visible on tablet/desktop >= 768px) */}
          <div className="hidden md:flex items-center gap-3 sm:gap-4 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 bg-white/95 dark:bg-[#131E2B]/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-slate-200/90 dark:border-[#223347] shadow-xs">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 dark:bg-[#1C2C3D] flex items-center justify-center text-[#2B5B84] dark:text-amber-400 shrink-0">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <div className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-100">
                  {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400">
                  Jaipur, Rajasthan
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXECUTIVE ATTENDANCE PUNCH (AMIT BANSAL & DHARMENDRA GOYAL) ── */}
      <PunchPanel />

      {/* ── DASHBOARD FILTERS BAR ── */}
      <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3 sm:p-4 shadow-2xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              Dashboard Scope & Filters
              {(selectedDept !== 'all' || selectedLocation !== 'all' || selectedPeriod !== 'today') && (<span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse" />)}
            </h4>
            <p className="text-[10px] text-slate-400">Filter metrics by department, site location & date period</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto [&>div]:w-full [&>div]:xs:w-auto [&>div]:flex-1 [&>div]:xs:flex-initial [&>div]:min-w-[130px]">
          {/* Department Filter */}
          <div className="relative">
            <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#0E1622] border border-slate-200 dark:border-[#24374D] text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer shadow-2xs">
              <option value="all">All departments ({allEmployees.length})</option>
              {departmentsList.map((d) => (<option key={d.name} value={d.name}>
                {d.name} ({d.count})
              </option>))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Location Filter */}
          <div className="relative">
            <select
              value={selectedLocation}
              onChange={(e) => {
                if (e.target.value === '__add_new__') {
                  setLocationError('');
                  setNewLocationName('');
                  setNewLocationStatus('Active');
                  setIsAddLocationModalOpen(true);
                } else {
                  setSelectedLocation(e.target.value);
                }
              }}
              className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#0E1622] border border-slate-200 dark:border-[#24374D] text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer shadow-2xs"
            >
              <option value="all">All locations</option>
              {locations.filter((l) => l.status !== 'Inactive').map((l) => (
                <option key={l.id || l.name} value={l.name.toLowerCase()}>
                  {l.name}
                </option>
              ))}
              <option value="__add_new__" className="text-teal-600 font-bold">+ Add Location...</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Date Period Filter */}
          <div className="relative">
            <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#0E1622] border border-slate-200 dark:border-[#24374D] text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer shadow-2xs">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">Full Year 2026</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Reset Button */}
          {(selectedDept !== 'all' || selectedLocation !== 'all' || selectedPeriod !== 'today') && (<button onClick={() => {
            setSelectedDept('all');
            setSelectedLocation('all');
            setSelectedPeriod('today');
          }} className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center gap-1 transition-colors w-full xs:w-auto" title="Reset all filters">
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>)}
        </div>
      </div>

      {/* ── ROW OF 6 STAT CARDS ── */}
      <div className="hr-stat-row">
        <StatCard title="Total employees" value={currentStats.total} icon={<Users />} tone="tone-info" caption={`+${currentStats.newJoiners} vs last month`} />
        <StatCard title={selectedPeriod === 'today' ? 'Present today' : 'Present (avg)'} value={currentStats.present} icon={<UserCheck />} tone="tone-good" caption={`${currentStats.presentPercent}% of the workforce`} />
        <StatCard title={selectedPeriod === 'today' ? 'Absent today' : 'Absent (avg)'} value={currentStats.absent} icon={<CalendarOff />} tone="tone-urgent" caption={`${currentStats.absentPercent}% of the workforce`} />
        <StatCard title={selectedPeriod === 'today' ? 'On leave' : 'On leave (avg)'} value={currentStats.leave} icon={<CalendarDays />} tone="tone-attention" caption={`${currentStats.leavePercent}% of the workforce`} />
        <StatCard title={selectedPeriod === 'today' ? 'Late arrivals' : 'Late arrivals (avg)'} value={currentStats.late} icon={<Clock />} tone="tone-neutral" caption={`${currentStats.latePercent}% of the workforce`} />
        <StatCard title="New joiners" value={currentStats.newJoiners} icon={<UserPlus />} tone="tone-good" caption="this month" />
      </div>

      {/* ── MIDDLE ROW: 3 VISUAL CHARTS ── */}
      <div className="dash-row dash-row-charts">
        {/* Chart 1: Attendance Trend (5 cols) */}
        <div className="dash-cell dash-span-5 bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-4 sm:p-5 shadow-2xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-teal-700 dark:text-teal-400" />
                <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
                  Attendance Trend
                </h3>
              </div>
              <div className="relative">
                <select value={attendanceRange} onChange={(e) => setAttendanceRange(e.target.value)} className="appearance-none pl-2.5 pr-7 py-1 rounded-lg border border-slate-200 dark:border-[#223347] bg-white dark:bg-[#0E1622] text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs">
                  <option value="7days">Last 7 days</option>
                  <option value="14days">Last 14 days</option>
                  <option value="30days">Last 30 days</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-300 mb-4 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#1F6F78] dark:bg-[#2DD4BF]" />
                <span>Present</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#D24C47] dark:bg-[#F87171]" />
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#C8943A] dark:bg-[#FBBF24]" />
                <span>Leave</span>
              </div>
            </div>
          </div>

          {/* Stacked Bar Chart with Fixed Domain & Bottom Padding */}
          <div className="h-48 sm:h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 14 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1F3044' : '#F1F5F9'} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} domain={[0, Math.max(14, allEmployees.length + 3)]} ticks={[0, 3, 6, 9, 12, 15]} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{
                  backgroundColor: isDark ? '#0D1520' : '#FFFFFF',
                  borderColor: isDark ? '#223347' : '#E2E8F0',
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  fontSize: '12px',
                }} />
                <Bar dataKey="present" stackId="a" fill={isDark ? '#2DD4BF' : '#1F6F78'} radius={[0, 0, 0, 0]} barSize={20} isAnimationActive={false} />
                <Bar dataKey="absent" stackId="a" fill={isDark ? '#F87171' : '#D24C47'} radius={[0, 0, 0, 0]} barSize={20} isAnimationActive={false} />
                <Bar dataKey="leave" stackId="a" fill={isDark ? '#FBBF24' : '#C8943A'} radius={[3, 3, 0, 0]} barSize={20} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Department-wise Employees (4 cols) */}
        <div className="dash-cell dash-span-4 bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-4 sm:p-5 shadow-2xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
              Department-wise Employees
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-2 py-2">
            {/* Donut Chart with Centered Text */}
            <div className="relative w-36 h-36 sm:w-40 sm:h-40 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={departmentData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={46} outerRadius={66} paddingAngle={2} isAnimationActive={false}>
                    {departmentData.map((entry, index) => (<Cell key={`dept-${index}`} fill={entry.color} />))}
                  </Pie>
                  <Tooltip contentStyle={{
                    backgroundColor: isDark ? '#0D1520' : '#FFFFFF',
                    borderColor: isDark ? '#223347' : '#E2E8F0',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                    fontSize: '12px',
                  }} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-[#1E293B] dark:text-white leading-none">{allEmployees.length}</span>
                <span className="text-[10px] text-slate-400 mt-0.5 font-medium">Employees</span>
              </div>
            </div>

            {/* Legend List on Right / Below on Mobile */}
            <div className="w-full sm:flex-1 grid grid-cols-2 sm:grid-cols-1 gap-x-2 gap-y-1.5 sm:space-y-1.5 text-[10px] sm:text-[11px] min-w-0">
              {departmentData.map((d) => (<div key={d.name} className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-slate-600 dark:text-slate-300 truncate">{d.name}</span>
                </div>
                <span className="text-slate-800 dark:text-white font-bold shrink-0 ml-1">
                  {d.count} <span className="font-normal text-slate-400">({d.percent})</span>
                </span>
              </div>))}
            </div>
          </div>
        </div>

        {/* Chart 3: Leave Overview (3 cols) */}
        <div className="dash-cell dash-span-3 bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-4 sm:p-5 shadow-2xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
                Leave Overview
              </h3>
              <div className="relative">
                <select value={leaveRange} onChange={(e) => setLeaveRange(e.target.value)} className="appearance-none pl-2.5 pr-7 py-1 rounded-lg border border-slate-200 dark:border-[#223347] bg-white dark:bg-[#0E1622] text-[11px] font-medium text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-teal-500/50 focus:outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer shadow-2xs">
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="ytd">Year to Date</option>
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Column Bar Chart with Adequate Domain & Margin */}
          <div className="h-48 sm:h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currentLeaveData} margin={{ top: 20, right: 10, left: -25, bottom: 14 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1F3044' : '#F1F5F9'} />
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} domain={[0, 8]} ticks={[0, 2, 4, 6, 8]} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{
                  backgroundColor: isDark ? '#0D1520' : '#FFFFFF',
                  borderColor: isDark ? '#223347' : '#E2E8F0',
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                  fontSize: '12px',
                }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24} isAnimationActive={false}>
                  {currentLeaveData.map((entry, index) => (<Cell key={`leave-bar-${index}`} fill={entry.color} />))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: PENDING APPROVALS + RECENT ACTIVITY + CELEBRATIONS ── */}
      <div className="dash-row dash-row-work">
        {/* 1. Pending Approvals Table (6 cols) */}
        <div className="dash-cell dash-span-6 bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-4 sm:p-5 shadow-2xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
                  Pending Approvals
                </h3>
                <span className="w-5 h-5 rounded-full bg-[#31485A] text-white dark:bg-slate-700 dark:text-white text-[11px] font-bold flex items-center justify-center shadow-2xs">
                  {allLeaveRequests.filter((l) => l.status === 'Pending').length}
                </span>
              </div>
              <button type="button" onClick={() => navigate('/hr/leave/approvals')} className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors">
                <span>View All</span>
                <span>→</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 -mt-2.5 mb-3">
              {user?.name?.includes('Dharmendra')
                ? 'Designated Approver: Reviewing all employee leave and attendance requests.'
                : 'Requests from all employees that are waiting for a decision.'}
            </p>

            {/* Table */}
            <div className="overflow-x-auto custom-sidebar-scroll">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-[#253344] text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-2.5 px-3 whitespace-nowrap">Employee</th>
                    <th className="pb-2.5 px-3 whitespace-nowrap">Type</th>
                    <th className="pb-2.5 px-3 whitespace-nowrap">Dates</th>
                    <th className="pb-2.5 px-3 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#253344]">
                  {allLeaveRequests.filter((l) => l.status === 'Pending').length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-xs text-slate-400">
                        No pending requests waiting for review. All requests processed.
                      </td>
                    </tr>
                  ) : (
                    allLeaveRequests
                      .filter((l) => l.status === 'Pending')
                      .slice(0, 4)
                      .map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
                                {req.employeeName.split(' ').map((w) => w[0]).join('').slice(0, 2)}
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-[#1E293B] dark:text-slate-100 text-xs leading-tight whitespace-nowrap">
                                  {req.employeeName}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">
                                  {req.employeeId} • Applied {req.appliedOn}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60 whitespace-nowrap">
                              {req.leaveType}
                            </span>
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="whitespace-nowrap leading-tight">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                                {req.startDate} – {req.endDate}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium ml-1.5">
                                ({req.requestedDays || req.days} days)
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleApproveLeave(req.id, req.employeeName)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800/60 transition-colors shadow-2xs cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectLeave(req.id, req.employeeName)}
                                className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-[#D24C47] dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 transition-colors shadow-2xs cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bottom footer summary */}
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-[#253344] flex items-center justify-between">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {(() => { const n = allLeaveRequests.filter((l) => l.status === 'Pending').length; return n ? `${n} request${n > 1 ? 's' : ''} waiting for a decision` : 'Nothing waiting for a decision'; })()}
            </span>
            <button type="button" onClick={() => navigate('/hr/leave/approvals')} className="text-xs font-bold text-[#B07D27] dark:text-amber-400 hover:text-[#8F621A] dark:hover:text-amber-300 flex items-center gap-1 transition-colors">
              <span>Review all</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* 2. Recent Activity Timeline (3 cols) */}
        <div className="dash-cell dash-span-3 bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-4 sm:p-5 shadow-2xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
                Recent Activity
              </h3>
              <button onClick={() => navigate('/hr/notifications')} className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
                <span>View All</span>
                <span>→</span>
              </button>
            </div>

            {/* Activity: the latest notifications meant for this person, from the server. */}
            <RecentActivity onOpen={() => navigate('/hr/notifications')} />
          </div>

          {/* Bottom link */}
          <div className="pt-3 mt-3 border-t border-slate-100 dark:border-[#253344]">
            <button type="button" onClick={() => navigate('/hr/notifications')} className="text-xs font-bold text-[#B07D27] dark:text-amber-400 hover:text-[#8F621A] dark:hover:text-amber-300 flex items-center gap-1 transition-colors">
              <span>View all notifications</span>
              <span>→</span>
            </button>
          </div>
        </div>

        {/* 3. Celebrations / Dates Widget (3 cols) */}
        <div className="dash-cell dash-span-3 bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-4 sm:p-5 shadow-2xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between">
          <div>
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-[#0E1622] border border-slate-200/60 dark:border-[#223347] mb-4">
              <button type="button" onClick={() => setCelebrationTab('birthdays')} className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap text-center ${celebrationTab === 'birthdays'
                ? 'bg-amber-100/90 dark:bg-amber-500/20 text-[#8F621A] dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                Birthdays
              </button>
              <button type="button" onClick={() => setCelebrationTab('anniversaries')} className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap text-center ${celebrationTab === 'anniversaries'
                ? 'bg-amber-100/90 dark:bg-amber-500/20 text-[#8F621A] dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                Anniversaries
              </button>
              <button type="button" onClick={() => setCelebrationTab('holidays')} className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap text-center ${celebrationTab === 'holidays'
                ? 'bg-amber-100/90 dark:bg-amber-500/20 text-[#8F621A] dark:text-amber-300 border border-amber-200/80 dark:border-amber-500/30 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'}`}>
                Holidays
              </button>
            </div>

            {/* Content based on Tab */}
            {celebrationTab === 'birthdays' && (<div className="space-y-3">
              {birthdaysList.map((b) => (<div key={b.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs shrink-0">{b.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1E293B] dark:text-slate-100 truncate">{b.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{b.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 font-mono">{b.date}</span>
                </div>
              </div>))}
            </div>)}

            {celebrationTab === 'anniversaries' && (<div className="space-y-3">
              {anniversariesList.map((a) => (<div key={a.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs shrink-0">{a.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#1E293B] dark:text-slate-100 truncate">{a.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{a.role} • {a.years}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 font-mono">{a.date}</span>
                </div>
              </div>))}
            </div>)}

            {celebrationTab === 'holidays' && (<div className="space-y-3">
              {upcomingHolidaysList.map((h) => (<div key={h.title} className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-[#1E293B] dark:text-slate-100">{h.title}</p>
                  <p className="text-[10px] text-slate-400">{h.day} • <span className="text-amber-600 dark:text-amber-400 font-medium">{h.badge}</span></p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[11px] font-semibold text-[#B07D27] dark:text-amber-400 font-mono">{h.date}</span>
                </div>
              </div>))}
            </div>)}
          </div>

          {/* Bottom link */}
          <div className="pt-3 mt-2 border-t border-slate-100 dark:border-[#253344]">
            <button type="button" onClick={() => {
              if (celebrationTab === 'holidays') {
                navigate('/hr/leave');
              }
              else {
                navigate('/hr/employees');
              }
            }} className="text-xs font-bold text-[#B07D27] dark:text-amber-400 hover:text-[#8F621A] dark:hover:text-amber-300 flex items-center gap-1 transition-colors">
              <span>{celebrationTab === 'holidays' ? 'View all holidays' : celebrationTab === 'anniversaries' ? 'Show all anniversaries' : 'Show all birthdays'}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

    </div>


    {/* Dynamic Add Location Master Modal */}
    <Modal isOpen={isAddLocationModalOpen} onClose={() => setIsAddLocationModalOpen(false)} title="Add New Location Master" maxWidth="sm">
      <form onSubmit={handleAddLocationSubmit} className="space-y-4">
        {locationError && (
          <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{locationError}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
            Location Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Kota Exploration Camp"
            value={newLocationName}
            onChange={(e) => {
              setNewLocationName(e.target.value);
              if (locationError) setLocationError('');
            }}
            className="w-full text-xs rounded-xl border border-slate-300 dark:border-[#253344] px-3 py-2 bg-white dark:bg-[#111821] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
            Status
          </label>
          <select
            value={newLocationStatus}
            onChange={(e) => setNewLocationStatus(e.target.value)}
            className="w-full text-xs rounded-xl border border-slate-300 dark:border-[#253344] px-3 py-2 bg-white dark:bg-[#111821] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Button variant="secondary" size="sm" type="button" onClick={() => setIsAddLocationModalOpen(false)}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Location
          </Button>
        </div>
      </form>
    </Modal>
  </div>);
};
/* First name for the greeting; a title such as "Dr." stays with the name after it. */
const firstName = (name = '') => {
  const parts = name.trim().split(/\s+/);
  if (!parts[0]) return 'there';
  return /^(dr|mr|mrs|ms|er|prof)\.?$/i.test(parts[0]) && parts[1] ? `${parts[0]} ${parts[1]}` : parts[0];
};

export const DashboardPage = () => {
  const { currentRole } = useRole();
  if (currentRole === 'employee') {
    return <EmployeeDashboard />;
  }
  return <AdminDashboard />;
};


const timeAgo = (iso) => {
  if (!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} h ago`;
  const days = Math.round(hrs / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
};

function RecentActivity({ onOpen }) {
  const items = (storage.getNotifications?.() || []).slice(0, 5);
  if (!items.length) {
    return <p className="text-sm text-slate-500 py-6 text-center">Nothing new. Updates about leave, attendance and documents will appear here.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((n) => (
        <li key={n.id}>
          <button type="button" onClick={onOpen} className="flex items-start gap-2.5 w-full text-left rounded-lg p-1 -m-1 hover:bg-slate-50">
            <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-slate-300' : 'bg-teal-600'}`} aria-hidden="true" />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-slate-800">{n.title}</span>
              {n.message && <span className="block text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</span>}
              <span className="block text-xs text-slate-400 mt-0.5">{timeAgo(n.createdAt)}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
