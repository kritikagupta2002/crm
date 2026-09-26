import React, { useState, useEffect, useMemo } from 'react';
import { Users, UserCheck, CalendarOff, FileCheck2, Calendar, Sparkles, CreditCard, UserPlus, CalendarDays, Clock, FileText, Send, RotateCcw, ChevronDown, BarChart3, Filter, } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, BarChart, Bar, } from 'recharts';
import { Button } from '@/components/common/Button';
import { Modal } from '@/components/common/Modal';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { useToast } from '@/contexts/ToastContext';
import { useTheme } from '@/contexts/ThemeContext';
import { storage } from '@/core/storage/storage';
import { leaveService } from '@/modules/leave/services/leave.service';
import { attendanceService } from '@/modules/attendance/services/attendance.service';
import { EmployeeDashboard } from '../components/EmployeeDashboard';
import { getDailyQuote } from '@/data';
import { useCrm, ROLE_COLORS } from '../../../../context/crm';
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
const birthdaysList = [
    { name: 'Aman Jain', role: 'Software Engineer', date: '10 Sep', avatar: '' },
    { name: 'Priya Sharma', role: 'Project Coordinator', date: '12 Sep', avatar: '' },
    { name: 'Karan Mehta', role: 'Field Executive', date: '15 Sep', avatar: '' },
    { name: 'Sneha Verma', role: 'HR Executive', date: '18 Sep', avatar: '' },
];
const anniversariesList = [
    { name: 'Dr. Amit Bansal', role: 'Managing Director', date: '14 Sep', years: '12 Years', avatar: '' },
    { name: 'Vikramaditya Rathore', role: 'GIS Lead', date: '21 Sep', years: '5 Years', avatar: '' },
];
const upcomingHolidaysList = [
    { title: 'Gandhi Jayanti', date: '02 Oct 2026', day: 'Friday', badge: 'National' },
    { title: 'Dussehra', date: '20 Oct 2026', day: 'Tuesday', badge: 'Gazetted' },
    { title: 'Diwali', date: '08 Nov 2026', day: 'Sunday', badge: 'Gazetted' },
];
const AdminDashboard = () => {
    const { role } = useCrm();
    const roleColor = ROLE_COLORS[role]?.color || '#1F6F78';
    const { user, updateUser } = useAuth();
    const { currentRole, setRole } = useRole();
    const { isDark } = useTheme();
    const toast = useToast();
    const navigate = useNavigate();
    // Live master data directly from storage
    const [allEmployees, setAllEmployees] = useState(() => storage.getEmployees());
    const [allAttendance, setAllAttendance] = useState(() => storage.getAttendance());
    const [allLeaveRequests, setAllLeaveRequests] = useState(() => storage.getLeaveRequests());
    // State
    const [pendingLeaves, setPendingLeaves] = useState([]);
    const [greeting, setGreeting] = useState('');
    const [hasClockedIn, setHasClockedIn] = useState(true);
    const [chartTab, setChartTab] = useState('attendance');
    // Dashboard Global Filters State
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [selectedPeriod, setSelectedPeriod] = useState('today');
    // Interactive Chart Range Selectors
    const [attendanceRange, setAttendanceRange] = useState('7days');
    const [leaveRange, setLeaveRange] = useState('this_month');
    // Dynamic Daily Quote Rotation (changes automatically every day, or click to shuffle)
    const [quoteOffset, setQuoteOffset] = useState(0);
    const [isQuoteFading, setIsQuoteFading] = useState(false);
    const activeQuote = useMemo(() => {
        return getDailyQuote(new Date(), quoteOffset);
    }, [quoteOffset]);
    const handleNextQuote = (e) => {
        e.stopPropagation();
        setIsQuoteFading(true);
        setTimeout(() => {
            setQuoteOffset((prev) => prev + 1);
            setIsQuoteFading(false);
        }, 150);
    };
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
        // One day's register (the latest one recorded), each person counted once: the register holds many days.
        const day = allAttendance.reduce((d, a) => (a.date <= todayStr && a.date > d ? a.date : d), '');
        const dayRecords = allAttendance.filter((a) => a.date === day && empIds.has(a.employeeId));
        const present = new Set(dayRecords.filter((a) => a.status === 'Present' || a.status === 'Late').map((a) => a.employeeId)).size;
        const leave = filteredEmps.filter((e) => onLeaveEmpIds.has(e.employeeId)).length;
        const absent = Math.max(0, total - present - leave);
        const late = new Set(dayRecords.filter((a) => a.lateBy && a.lateBy !== '-').map((a) => a.employeeId)).size;
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
    }, [allEmployees, allAttendance, allLeaveRequests, selectedDept, selectedLocation]);
    // Attendance Trend Data derived from live attendance counts
    const currentAttendanceData = useMemo(() => {
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-CA');
        const result = [];
        const total = allEmployees.length || 10;
        const presentToday = allAttendance.filter((a) => a.status === 'Present').length;
        const leaveToday = allLeaveRequests.filter((l) => {
            if (l.status !== 'Approved' && l.status !== 'Partially Approved')
                return false;
            return todayStr >= l.startDate && todayStr <= l.endDate;
        }).length;
        const absentToday = Math.max(0, total - presentToday - leaveToday);
        const numDays = attendanceRange === '30days' ? 10 : attendanceRange === '14days' ? 14 : 7;
        for (let i = numDays - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i * (attendanceRange === '30days' ? 3 : 1));
            const dateStr = `${d.getDate()} ${d.toLocaleString('default', { month: 'short' })}`;
            if (i === 0) {
                result.push({ date: dateStr, present: presentToday, absent: absentToday, leave: leaveToday });
            }
            else {
                const factor = 0.85 + (i % 3) * 0.05;
                const p = Math.max(0, Math.round(presentToday * factor));
                const l = Math.max(0, Math.min(total - p, Math.round(leaveToday * (0.8 + (i % 2) * 0.2))));
                const a = Math.max(0, total - p - l);
                result.push({ date: dateStr, present: p, absent: a, leave: l });
            }
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
        const counts = { 'CL': 0, 'SL': 0, 'EL': 0, 'ML': 0, 'Others': 0 };
        filtered.forEach((l) => {
            const type = l.leaveType || '';
            const days = Number(l.approvedDays ?? l.days) || 1;
            if (type.includes('Casual'))
                counts['CL'] += days;
            else if (type.includes('Sick'))
                counts['SL'] += days;
            else if (type.includes('Earned') || type.includes('Privilege'))
                counts['EL'] += days;
            else if (type.includes('Maternity') || type.includes('Paternity'))
                counts['ML'] += days;
            else
                counts['Others'] += days;
        });
        const colors = isDark
            ? { 'CL': roleColor, 'SL': '#FBBF24', 'EL': '#F87171', 'ML': '#60A5FA', 'Others': '#94A3B8' }
            : { 'CL': roleColor, 'SL': '#C8943A', 'EL': '#D24C47', 'ML': '#31485A', 'Others': '#7C8B96' };
        return [
            { type: 'CL', count: counts['CL'], color: colors['CL'] },
            { type: 'SL', count: counts['SL'], color: colors['SL'] },
            { type: 'EL', count: counts['EL'], color: colors['EL'] },
            { type: 'ML', count: counts['ML'], color: colors['ML'] },
            { type: 'Others', count: counts['Others'], color: colors['Others'] },
        ];
    }, [allLeaveRequests, leaveRange, isDark]);
    // Interactive Quick Leave Modal
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [leaveType, setLeaveType] = useState('Casual Leave (CL)');
    const [leaveStartDate, setLeaveStartDate] = useState('2026-09-22');
    const [leaveEndDate, setLeaveEndDate] = useState('2026-09-23');
    const [leaveReason, setLeaveReason] = useState('');
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
    const handleApproveLeave = async (id, empName) => {
        await leaveService.reviewLeave(id, 'Approved', user?.name || 'Kritika Gupta', 'Approved via HR Command Center');
        refreshData();
        toast.success(`Leave request approved for ${empName}`, 'Approval Confirmed');
    };
    const handleRejectLeave = async (id, empName) => {
        await leaveService.reviewLeave(id, 'Rejected', user?.name || 'Kritika Gupta', 'Rejected via HR Command Center');
        refreshData();
        toast.info(`Leave request rejected for ${empName}`, 'Status Updated');
    };
    // Employee Clock In/Out Toggle
    const handleClockToggle = async () => {
        try {
            const type = hasClockedIn ? 'checkOut' : 'checkIn';
            await attendanceService.recordPunch(user?.employeeId || 'BGS-006', type, 'Field GPS & Biometric - Bhilwara Exploration Camp');
            setHasClockedIn(!hasClockedIn);
            if (!hasClockedIn) {
                toast.success('Punched in successfully at Bhilwara Exploration Project site.', 'Check-In Recorded');
            }
            else {
                toast.info('Punched out successfully. Total shift duration logged: 08h 14m.', 'Check-Out Recorded');
            }
        }
        catch {
            toast.error('Could not connect to biometric sync node.', 'Error');
        }
    };
    // Employee Quick Leave Submit
    const handleQuickLeaveSubmit = async (e) => {
        e.preventDefault();
        if (!leaveReason.trim()) {
            toast.error('Please specify a reason for leave.', 'Validation Error');
            return;
        }
        try {
            await leaveService.applyLeave({
                employeeId: user?.employeeId || 'BGS-006',
                employeeName: user?.name || 'Rohan Deshmukh',
                department: user?.department || 'Geology & Mineral Exploration',
                leaveType: leaveType,
                startDate: leaveStartDate,
                endDate: leaveEndDate,
                days: 2,
                reason: leaveReason,
                contactDuringLeave: '+91 98290 12345',
            });
            setIsLeaveModalOpen(false);
            setLeaveReason('');
            toast.success('Leave application submitted for approval to HR & Manager.', 'Application Sent');
        }
        catch {
            toast.error('Failed to submit leave.', 'Error');
        }
    };
    // Role Switcher shortcut inside dashboard
    const handleSwitchToEmployee = () => {
        setRole('employee');
        updateUser({
            id: 'emp-006',
            name: 'Rohan Deshmukh',
            email: 'rohan.deshmukh@bansalgeo.com',
            role: 'employee',
            employeeId: 'BGS-006',
            avatarUrl: '',
            department: 'Geology & Mineral Exploration',
            designation: 'Senior Exploration Geologist',
        });
        toast.info('Switched to Employee Self-Service View (Rohan Deshmukh)', 'View Switched');
    };
    const handleSwitchToHR = () => {
        setRole('hr');
        updateUser({
            id: 'emp-004',
            name: 'Kritika Gupta',
            email: 'kritika.gupta@bansalgeo.com',
            role: 'hr',
            employeeId: 'BGS-004',
            avatarUrl: '',
            department: 'Human Resources & Admin',
            designation: 'Head - HR & Administration',
        });
        toast.info('Switched to HR & Admin Command Center (Kritika Gupta)', 'View Switched');
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
                <path d="M0,100 C300,20 600,180 1200,60" strokeWidth="1.5"/>
                <path d="M0,130 C350,50 650,210 1200,90" strokeWidth="1.5"/>
                <path d="M0,70 C250,-10 550,150 1200,30" strokeWidth="1.5"/>
                <path d="M0,160 C400,80 700,240 1200,120" strokeWidth="1.5"/>
              </svg>
            </div>

            {/* Right side realistic mountain peaks bleed graphic */}
            <div className="absolute right-0 top-0 bottom-0 w-[46%] sm:w-[42%] md:w-[38%] pointer-events-none overflow-hidden select-none">
              {/* Golden Sun & Concentric Contour Rings */}
              <div className="absolute right-10 top-2 w-44 h-44 rounded-full border border-amber-400/40 dark:border-amber-400/20 pointer-events-none"/>
              <div className="absolute right-4 -top-4 w-60 h-60 rounded-full border border-amber-300/30 dark:border-amber-400/15 pointer-events-none"/>
              <div className="absolute -right-6 -top-10 w-76 h-76 rounded-full border border-amber-200/30 dark:border-amber-400/10 pointer-events-none"/>

              {/* High-res rugged mountain peaks image with left fade mask */}
              <img src="/hero-mountain.jpg" alt="Bansal Geo Mountains" className="absolute right-0 bottom-0 h-full w-full object-cover object-right-bottom opacity-20 sm:opacity-100 dark:opacity-30 sm:dark:opacity-60 dark:brightness-75 dark:contrast-125 transition-all duration-300" style={{
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 15%, black 45%, black 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.4) 15%, black 45%, black 100%)',
        }}/>
            </div>

            <div className="relative z-10 w-full flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 pr-0 md:pr-8">
              {/* Top row on mobile / Left column on desktop: Greeting + Mobile Date Chip */}
              <div className="flex items-start justify-between md:block gap-2">
                <div className="max-w-xs">
                  <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-normal">
                    {(greeting || 'Good evening')},
                  </p>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-extrabold text-[#1E293B] dark:text-white tracking-tight mt-0.5">
                    {(user?.name?.split(' ')[0] || 'there')}!
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-sm mt-0.5 sm:mt-1 font-normal">
                    Let's make today productive.
                  </p>
                </div>

                {/* Mobile Date Badge (<768px) */}
                <div className="md:hidden flex items-center gap-1.5 bg-white/95 dark:bg-[#131E2B]/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-[#223347] shadow-2xs shrink-0">
                  <Calendar className="w-3.5 h-3.5 text-[#2B5B84] dark:text-amber-400"/>
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-100">
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>

              {/* Center: Daily Inspiration Quote stacked in 2 lines with gold underline (Visible on ALL devices) */}
              <div onClick={handleNextQuote} title="Daily Thought • Click to preview other thoughts" className="flex flex-col items-start relative pl-5 sm:pl-6 cursor-pointer select-none group my-1 md:my-0">
                <span className="text-[#D97706] text-2xl sm:text-3xl md:text-4xl font-serif font-black absolute -left-0.5 sm:-left-1 -top-1.5 sm:-top-2 leading-none select-none transition-transform duration-300 group-hover:scale-110">
                  “
                </span>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 opacity-80 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="w-2.5 h-2.5 text-amber-500 animate-pulse"/>
                    Daily Thought
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                    • {activeQuote.category}
                  </span>
                </div>
                <div className={`text-lg sm:text-xl md:text-2xl font-serif italic text-[#1E293B] dark:text-slate-100 font-semibold tracking-wide leading-tight group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-all duration-200 ${isQuoteFading ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'}`}>
                  <div>{activeQuote.line1}</div>
                  <div>{activeQuote.line2}</div>
                </div>
                <div className="w-12 sm:w-14 h-0.5 bg-[#D97706] mt-1.5 sm:mt-2 rounded-full transition-all duration-300 group-hover:w-28 group-hover:bg-amber-500"/>
              </div>

              {/* Right: Date Card floating in front of mountains (Visible on tablet/desktop >= 768px) */}
              <div className="hidden md:flex items-center gap-3 sm:gap-4 shrink-0">
                <div className="flex items-center gap-2.5 sm:gap-3 bg-white/95 dark:bg-[#131E2B]/95 backdrop-blur-md px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl border border-slate-200/90 dark:border-[#223347] shadow-xs">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-100 dark:bg-[#1C2C3D] flex items-center justify-center text-[#2B5B84] dark:text-amber-400 shrink-0">
                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4"/>
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

          {/* ── DASHBOARD FILTERS BAR ── */}
          <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3 sm:p-4 shadow-2xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
                <Filter className="w-4 h-4"/>
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  Dashboard Scope & Filters
                  {(selectedDept !== 'all' || selectedLocation !== 'all' || selectedPeriod !== 'today') && (<span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"/>)}
                </h4>
                <p className="text-[10px] text-slate-400">Filter metrics by department, site location & date period</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto [&>div]:w-full [&>div]:xs:w-auto [&>div]:flex-1 [&>div]:xs:flex-initial [&>div]:min-w-[130px]">
              {/* Department Filter */}
              <div className="relative">
                <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#0E1622] border border-slate-200 dark:border-[#24374D] text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer shadow-2xs">
                  <option value="all">🏢 All Departments ({allEmployees.length})</option>
                  {departmentsList.map((d) => (<option key={d.name} value={d.name}>
                      {d.name} ({d.count})
                    </option>))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"/>
              </div>

              {/* Location Filter */}
              <div className="relative">
                <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#0E1622] border border-slate-200 dark:border-[#24374D] text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer shadow-2xs">
                  <option value="all">📍 All Locations</option>
                  <option value="jaipur">Jaipur HQ</option>
                  <option value="bhilwara">Bhilwara Field Camp</option>
                  <option value="udaipur">Udaipur Exploration Site</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"/>
              </div>

              {/* Date Period Filter */}
              <div className="relative">
                <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)} className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-[#0E1622] border border-slate-200 dark:border-[#24374D] text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-teal-500/50 focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer shadow-2xs">
                  <option value="today">📅 Today (Live)</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">Full Year 2026</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"/>
              </div>

              {/* Reset Button */}
              {(selectedDept !== 'all' || selectedLocation !== 'all' || selectedPeriod !== 'today') && (<button onClick={() => {
                setSelectedDept('all');
                setSelectedLocation('all');
                setSelectedPeriod('today');
            }} className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center gap-1 transition-colors w-full xs:w-auto" title="Reset all filters">
                  <RotateCcw className="w-3 h-3"/>
                  <span>Reset</span>
                </button>)}
            </div>
          </div>

          {/* ── ROW OF 6 STAT CARDS ── */}
          <div className="hr-stat-row">
            {/* Card 1: Total Employees */}
            <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3 sm:p-5 shadow-2xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:border-teal-500/40 dark:hover:border-teal-500/40 hover:shadow-xs dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-all flex flex-col justify-between">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-[#C8943A] dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Users className="w-4.5 h-4.5 sm:w-5 sm:h-5"/>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-300 truncate">Total Employees</p>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-extrabold text-[#1E293B] dark:text-white tracking-tight leading-tight mt-0.5">{currentStats.total}</h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 sm:mt-3 pt-1">
                <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-[#FEF3C7] dark:bg-amber-900/30 text-[#B07D27] dark:text-amber-400">
                  ↑ +{currentStats.newJoiners}
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 truncate">vs last month</span>
              </div>
            </div>

            {/* Card 2: Present Today */}
            <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3 sm:p-5 shadow-2xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:border-teal-500/40 dark:hover:border-teal-500/40 hover:shadow-xs dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-all flex flex-col justify-between">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4.5 h-4.5 sm:w-5 sm:h-5"/>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-300 truncate">Present Today</p>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-extrabold text-[#1E293B] dark:text-white tracking-tight leading-tight mt-0.5">{currentStats.present}</h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 sm:mt-3 pt-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-teal-700 dark:text-teal-400">
                  {currentStats.presentPercent}%
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 truncate">of total workforce</span>
              </div>
            </div>

            {/* Card 3: Absent Today */}
            <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3 sm:p-5 shadow-2xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:border-teal-500/40 dark:hover:border-teal-500/40 hover:shadow-xs dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-all flex flex-col justify-between">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-[#D24C47] dark:text-rose-400 flex items-center justify-center shrink-0">
                  <CalendarOff className="w-4.5 h-4.5 sm:w-5 sm:h-5"/>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-300 truncate">Absent Today</p>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-extrabold text-[#1E293B] dark:text-white tracking-tight leading-tight mt-0.5">{currentStats.absent}</h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 sm:mt-3 pt-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-[#D24C47] dark:text-rose-400">
                  {currentStats.absentPercent}%
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 truncate">of total workforce</span>
              </div>
            </div>

            {/* Card 4: On Leave */}
            <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3 sm:p-5 shadow-2xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:border-teal-500/40 dark:hover:border-teal-500/40 hover:shadow-xs dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-all flex flex-col justify-between">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-[#C8943A] dark:text-amber-400 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4.5 h-4.5 sm:w-5 sm:h-5"/>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-300 truncate">On Leave</p>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-extrabold text-[#1E293B] dark:text-white tracking-tight leading-tight mt-0.5">{currentStats.leave}</h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 sm:mt-3 pt-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-[#C8943A] dark:text-amber-400">
                  {currentStats.leavePercent}%
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 truncate">of total workforce</span>
              </div>
            </div>

            {/* Card 5: Late Arrivals */}
            <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3 sm:p-5 shadow-2xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:border-teal-500/40 dark:hover:border-teal-500/40 hover:shadow-xs dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-all flex flex-col justify-between">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 text-[#4A5B68] dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Clock className="w-4.5 h-4.5 sm:w-5 sm:h-5"/>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-300 truncate">Late Arrivals</p>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-extrabold text-[#1E293B] dark:text-white tracking-tight leading-tight mt-0.5">{currentStats.late}</h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 sm:mt-3 pt-1">
                <span className="text-[9px] sm:text-[10px] font-bold text-[#4A5B68] dark:text-slate-300">
                  {currentStats.latePercent}%
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 truncate">of total workforce</span>
              </div>
            </div>

            {/* Card 6: New Joiners */}
            <div className="bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-3 sm:p-5 shadow-2xs dark:shadow-[0_4px_16px_rgba(0,0,0,0.25)] hover:border-teal-500/40 dark:hover:border-teal-500/40 hover:shadow-xs dark:hover:shadow-[0_6px_20px_rgba(0,0,0,0.35)] transition-all flex flex-col justify-between">
              <div className="flex items-start gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4.5 h-4.5 sm:w-5 sm:h-5"/>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-300 truncate">New Joiners</p>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-serif font-extrabold text-[#1E293B] dark:text-white tracking-tight leading-tight mt-0.5">{currentStats.newJoiners}</h3>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2 sm:mt-3 pt-1">
                <span className="px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-[#CCFBF1] dark:bg-teal-900/30 text-teal-800 dark:text-teal-300">
                  ↑ +2
                </span>
                <span className="text-[9px] sm:text-[10px] text-slate-400 truncate">this month</span>
              </div>
            </div>
          </div>

          {/* ── MIDDLE ROW: 3 VISUAL CHARTS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            {/* Chart 1: Attendance Trend (5 cols) */}
            <div className="lg:col-span-5 bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-4 sm:p-5 shadow-2xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-teal-700 dark:text-teal-400"/>
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
                    <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"/>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-300 mb-4 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs" style={{ backgroundColor: roleColor }}/>
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#D24C47] dark:bg-[#F87171]"/>
                    <span>Absent</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#C8943A] dark:bg-[#FBBF24]"/>
                    <span>Leave</span>
                  </div>
                </div>
              </div>

              {/* Stacked Bar Chart with Fixed Domain & Bottom Padding */}
              <div className="h-48 sm:h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentAttendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 14 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1F3044' : '#F1F5F9'}/>
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} domain={[0, Math.max(14, allEmployees.length + 3)]} ticks={[0, 3, 6, 9, 12, 15]} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{
            backgroundColor: isDark ? '#0D1520' : '#FFFFFF',
            borderColor: isDark ? '#223347' : '#E2E8F0',
            color: isDark ? '#F8FAFC' : '#0F172A',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            fontSize: '12px',
        }}/>
                    <Bar dataKey="present" stackId="a" fill={roleColor} radius={[0, 0, 0, 0]} barSize={20} isAnimationActive={false}/>
                    <Bar dataKey="absent" stackId="a" fill={isDark ? '#F87171' : '#D24C47'} radius={[0, 0, 0, 0]} barSize={20} isAnimationActive={false}/>
                    <Bar dataKey="leave" stackId="a" fill={isDark ? '#FBBF24' : '#C8943A'} radius={[3, 3, 0, 0]} barSize={20} isAnimationActive={false}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Department-wise Employees (4 cols) */}
            <div className="lg:col-span-4 bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-4 sm:p-5 shadow-2xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between">
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
                        {departmentData.map((entry, index) => (<Cell key={`dept-${index}`} fill={entry.color}/>))}
                      </Pie>
                      <Tooltip contentStyle={{
            backgroundColor: isDark ? '#0D1520' : '#FFFFFF',
            borderColor: isDark ? '#223347' : '#E2E8F0',
            color: isDark ? '#F8FAFC' : '#0F172A',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            fontSize: '12px',
        }}/>
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
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: d.color }}/>
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
            <div className="lg:col-span-3 bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-4 sm:p-5 shadow-2xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between">
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
                    <ChevronDown className="w-3 h-3 text-slate-400 pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"/>
                  </div>
                </div>
              </div>

              {/* Column Bar Chart with Adequate Domain & Margin */}
              <div className="h-48 sm:h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={currentLeaveData} margin={{ top: 20, right: 10, left: -25, bottom: 14 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#1F3044' : '#F1F5F9'}/>
                    <XAxis dataKey="type" tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#64748B' }} domain={[0, 8]} ticks={[0, 2, 4, 6, 8]} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{
            backgroundColor: isDark ? '#0D1520' : '#FFFFFF',
            borderColor: isDark ? '#223347' : '#E2E8F0',
            color: isDark ? '#F8FAFC' : '#0F172A',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
            fontSize: '12px',
        }}/>
                    <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={24} isAnimationActive={false}>
                      {currentLeaveData.map((entry, index) => (<Cell key={`leave-bar-${index}`} fill={entry.color}/>))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* ── BOTTOM ROW: PENDING APPROVALS + RECENT ACTIVITY + CELEBRATIONS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
            {/* 1. Pending Approvals Table (6 cols) */}
            <div className="lg:col-span-6 bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-4 sm:p-5 shadow-2xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-[#1E293B] dark:text-slate-100">
                      Pending Approvals
                    </h3>
                    <span className="w-5 h-5 rounded-full bg-[#31485A] text-white dark:bg-slate-700 dark:text-white text-[11px] font-bold flex items-center justify-center shadow-2xs">
                      3
                    </span>
                  </div>
                  <button type="button" onClick={() => navigate('/hr/leave/approvals')} className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors">
                    <span>View All</span>
                    <span>→</span>
                  </button>
                </div>

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
                      {/* Row 1: Ravi Gurjar */}
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs shrink-0">{'Ravi Gurjar'.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                            <div className="min-w-0">
                              <p className="font-bold text-[#1E293B] dark:text-slate-100 text-xs leading-tight whitespace-nowrap">Ravi Gurjar</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">BGS-031 • Applied 9 Sep</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60 whitespace-nowrap">
                            Earned Leave
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="whitespace-nowrap leading-tight">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">12 Sep – 14 Sep</span>
                            <span className="text-[10px] text-slate-400 font-medium ml-1.5">(3 days)</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button type="button" onClick={() => handleApproveLeave('lr-001', 'Ravi Gurjar')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800/60 transition-colors shadow-2xs cursor-pointer">
                              Approve
                            </button>
                            <button type="button" onClick={() => handleRejectLeave('lr-001', 'Ravi Gurjar')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-[#D24C47] dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 transition-colors shadow-2xs cursor-pointer">
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Row 2: Rohan Deshmukh */}
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs shrink-0">{'Rohan Deshmukh'.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                            <div className="min-w-0">
                              <p className="font-bold text-[#1E293B] dark:text-slate-100 text-xs leading-tight whitespace-nowrap">Rohan Deshmukh</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">BGS-017 • Applied 8 Sep</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60 whitespace-nowrap">
                            Sick Leave
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="whitespace-nowrap leading-tight">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">10 Sep – 10 Sep</span>
                            <span className="text-[10px] text-slate-400 font-medium ml-1.5">(1 day)</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button type="button" onClick={() => handleApproveLeave('lr-002', 'Rohan Deshmukh')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800/60 transition-colors shadow-2xs cursor-pointer">
                              Approve
                            </button>
                            <button type="button" onClick={() => handleRejectLeave('lr-002', 'Rohan Deshmukh')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-[#D24C47] dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 transition-colors shadow-2xs cursor-pointer">
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Row 3: Vikramaditya Rathore */}
                      <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <span className="w-8 h-8 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs shrink-0">{'Vikramaditya Rathore'.split(" ").map((w) => w[0]).join("").slice(0, 2)}</span>
                            <div className="min-w-0">
                              <p className="font-bold text-[#1E293B] dark:text-slate-100 text-xs leading-tight whitespace-nowrap">Vikramaditya Rathore</p>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5 whitespace-nowrap">BGS-005 • Applied 8 Sep</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60 whitespace-nowrap">
                            Casual Leave
                          </span>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="whitespace-nowrap leading-tight">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">18 Sep – 19 Sep</span>
                            <span className="text-[10px] text-slate-400 font-medium ml-1.5">(2 days)</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <button type="button" onClick={() => handleApproveLeave('lr-003', 'Vikramaditya Rathore')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-800/60 transition-colors shadow-2xs cursor-pointer">
                              Approve
                            </button>
                            <button type="button" onClick={() => handleRejectLeave('lr-003', 'Vikramaditya Rathore')} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-[#D24C47] dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-800/60 transition-colors shadow-2xs cursor-pointer">
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom footer summary */}
              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-[#253344] flex items-center justify-between">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  3 requests awaiting manager review
                </span>
                <button type="button" onClick={() => navigate('/hr/leave/approvals')} className="text-xs font-bold text-[#B07D27] dark:text-amber-400 hover:text-[#8F621A] dark:hover:text-amber-300 flex items-center gap-1 transition-colors">
                  <span>Review all</span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* 2. Recent Activity Timeline (3 cols) */}
            <div className="lg:col-span-3 bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-4 sm:p-5 shadow-2xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between">
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

                {/* Activity List */}
                <div className="space-y-3">
                  {/* Item 1 */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200/50 dark:border-teal-800/40">
                      <FileText className="w-4 h-4"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#1E293B] dark:text-slate-200 leading-tight">
                        Leave approved for Rajesh Sharma
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">2 hours ago</p>
                    </div>
                  </div>

                  {/* Item 2: Live Expense Activity */}
                  <div 
                    className="flex items-start gap-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 p-1 -m-1 rounded-xl transition-colors"
                    onClick={() => navigate('/hr/expenses/approvals')}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-[#C8943A] dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200/50 dark:border-amber-800/40">
                      <CreditCard className="w-4 h-4"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      {latestExpenseActivity ? (
                        <>
                          <p className="text-xs font-medium text-[#1E293B] dark:text-slate-200 leading-tight">
                            {latestExpenseActivity.employeeName} filed claim ({latestExpenseActivity.expenseNumber})
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {latestExpenseActivity.category} • ₹{Number(latestExpenseActivity.requestedAmount || latestExpenseActivity.amount || 0).toLocaleString('en-IN')}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-medium text-[#1E293B] dark:text-slate-200 leading-tight">
                            No pending expense claims
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Expense queue cleared</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Item 3 */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#31485A] dark:text-slate-300 flex items-center justify-center shrink-0 border border-slate-200/60 dark:border-slate-700/50">
                      <FileCheck2 className="w-4 h-4"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#1E293B] dark:text-slate-200 leading-tight">
                        Ravi Gurjar uploaded a document
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">6 hours ago</p>
                    </div>
                  </div>

                  {/* Item 4 */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center shrink-0 border border-teal-200/50 dark:border-teal-800/40">
                      <Clock className="w-4 h-4"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#1E293B] dark:text-slate-200 leading-tight">
                        Biometric attendance sync completed
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">1 day ago</p>
                    </div>
                  </div>

                  {/* Item 5 */}
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200/50 dark:border-emerald-800/40">
                      <UserPlus className="w-4 h-4"/>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#1E293B] dark:text-slate-200 leading-tight">
                        New employee Aman Jain joined
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">1 day ago</p>
                    </div>
                  </div>
                </div>
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
            <div className="lg:col-span-3 bg-white dark:bg-[#131E2B] border border-slate-200/80 dark:border-[#223347] rounded-2xl p-4 sm:p-5 shadow-2xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] flex flex-col justify-between">
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
                          <span className="text-sm">🎁</span>
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
                          <span className="text-sm">🎉</span>
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
                          <span className="text-sm">🌴</span>
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

          {/* ── FOOTER BAR ── */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-[#253344] flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <div>
              © 2026 Bansal Geo Solutions Pvt. Ltd. &nbsp;|&nbsp; HRMS
            </div>
            <div className="flex items-center gap-4 text-xs">
              <a href="#support" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">Support</a>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <a href="#privacy" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">Privacy Policy</a>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <a href="#terms" className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors">Terms of Use</a>
            </div>
          </div>
        </div>

      {/* Quick Leave Application Modal for Employees */}
      <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Apply for Employee Leave" maxWidth="md">
        <form onSubmit={handleQuickLeaveSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Select Leave Category</label>
            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)} className="w-full text-xs rounded-xl border border-slate-300 dark:border-[#253344] px-3 py-2 bg-white dark:bg-[#111821] text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-[#FEC13D]">
              <option value="Casual Leave (CL)">Casual Leave (CL) - 4 Available</option>
              <option value="Sick Leave (SL)">Sick Leave (SL) - 7 Available</option>
              <option value="Earned Leave (EL)">Earned Leave (EL) - 12 Available</option>
              <option value="Field Rest & Recuperation">Field R&R (Site Staff)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">From Date</label>
              <input type="date" value={leaveStartDate} onChange={(e) => setLeaveStartDate(e.target.value)} className="w-full text-xs rounded-xl border border-slate-300 dark:border-[#253344] px-3 py-2 bg-white dark:bg-[#111821] text-slate-800 dark:text-slate-200"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">To Date</label>
              <input type="date" value={leaveEndDate} onChange={(e) => setLeaveEndDate(e.target.value)} className="w-full text-xs rounded-xl border border-slate-300 dark:border-[#253344] px-3 py-2 bg-white dark:bg-[#111821] text-slate-800 dark:text-slate-200"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">Reason for Leave</label>
            <textarea rows={3} value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} placeholder="Provide reason for leave..." className="w-full text-xs rounded-xl border border-slate-300 dark:border-[#253344] p-3 bg-white dark:bg-[#111821] text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"/>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsLeaveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" leftIcon={<Send className="w-3.5 h-3.5"/>}>
              Submit Application
            </Button>
          </div>
        </form>
      </Modal>
    </div>);
};
export const DashboardPage = () => {
    const { currentRole } = useRole();
    if (currentRole === 'employee') {
        return <EmployeeDashboard />;
    }
    return <AdminDashboard />;
};
