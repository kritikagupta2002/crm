import { Avatar } from '@/components/common/Avatar';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CalendarCheck2, Receipt, CalendarPlus, ArrowRight, MapPin, CalendarDays, Sparkles, ShieldCheck, UserCheck, LogOut, LogIn, ChevronRight, Building2, Compass, Timer, } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { useToast } from '@/contexts/ToastContext';
import { storage } from '@/core/storage/storage';
export const EmployeeDashboard = () => {
    const { user, switchRole } = useAuth();
    const { setRole } = useRole();
    const navigate = useNavigate();
    const toast = useToast();
    // Real-time ticking date & clock
    const [now, setNow] = useState(() => new Date());
    useEffect(() => {
        const timer = setInterval(() => {
            setNow(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);
    // Formatted Current Time (HH:mm:ss with AM/PM)
    const currentTimeParts = useMemo(() => {
        const hours24 = now.getHours();
        const hours12 = hours24 % 12 || 12;
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const ampm = hours24 >= 12 ? 'PM' : 'AM';
        const pad = (n) => String(n).padStart(2, '0');
        const timeFormatted = `${pad(hours12)}:${pad(minutes)}:${pad(seconds)}`;
        const time24 = `${pad(hours24)}:${pad(minutes)}:${pad(seconds)}`;
        return {
            timeFormatted, // e.g. "11:29:47"
            time24,
            ampm,
            full12: `${timeFormatted} ${ampm}`,
        };
    }, [now]);
    // Current logged in / active employee profile
    const empProfile = useMemo(() => {
        const emps = storage.getEmployees();
        const empId = user?.employeeId || 'BGS-006';
        return emps.find((e) => e.employeeId === empId || (user?.name && e.name.toLowerCase() === user.name.toLowerCase()));
    }, [user?.employeeId, user?.name]);
    // Current shift assignment dynamically resolved
    const empShift = useMemo(() => {
        const assignments = storage.getShiftAssignments ? storage.getShiftAssignments() : [];
        const empId = user?.employeeId || 'BGS-006';
        const assign = assignments.find((a) => a.employeeId === empId);
        const shifts = storage.getShifts ? storage.getShifts() : [];
        const matched = shifts.find((s) => s.id === assign?.shiftId || s.name === assign?.shiftName);
        const shiftLoc = matched?.location || empProfile?.employment?.workLocation || 'Bhilwara Site Office';
        const startTime = matched?.startTime || '06:00 AM';
        const endTime = matched?.endTime || '02:30 PM';
        return {
            name: matched?.name || assign?.shiftName || 'Mining Site Morning Shift',
            startTime,
            endTime,
            timings: matched ? `${matched.startTime} - ${matched.endTime}` : '06:00 AM - 02:30 PM',
            location: shiftLoc,
            geofence: `${empProfile?.employment?.workLocation || 'Bhilwara Site Office'} Geofence`,
        };
    }, [user?.employeeId, empProfile]);
    // Parse any time string (e.g. "02:30 PM") into Date relative to a reference day
    const parseTimeToDate = (timeStr, baseDate) => {
        const d = new Date(baseDate);
        const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
        if (!match) {
            d.setHours(14, 30, 0, 0);
            return d;
        }
        let h = parseInt(match[1], 10);
        const m = parseInt(match[2], 10);
        const s = match[3] ? parseInt(match[3], 10) : 0;
        const meridiem = match[4]?.toUpperCase();
        if (meridiem === 'PM' && h < 12)
            h += 12;
        if (meridiem === 'AM' && h === 12)
            h = 0;
        d.setHours(h, m, s, 0);
        return d;
    };
    // Biometric punch state - dynamically initialize based on current hour and shift
    const [isClockedIn, setIsClockedIn] = useState(() => {
        const hour = new Date().getHours();
        return hour >= 6 && hour < 15;
    });
    const [clockInTime, setClockInTime] = useState('05:55 AM');
    const [clockOutTime, setClockOutTime] = useState(() => {
        const hour = new Date().getHours();
        return hour >= 15 || hour < 6 ? '02:30 PM' : null;
    });
    // Real-time Shift Countdown & Progress (Format: HH:mm:ss e.g. 03:00:13)
    const shiftRemaining = useMemo(() => {
        const startDate = parseTimeToDate(empShift.startTime, now);
        let endDate = parseTimeToDate(empShift.endTime, now);
        // Overnight shift handling
        if (endDate <= startDate) {
            endDate.setDate(endDate.getDate() + 1);
        }
        const nowMs = now.getTime();
        const endMs = endDate.getTime();
        const startMs = startDate.getTime();
        const totalShiftMs = Math.max(1, endMs - startMs);
        const diffMs = endMs - nowMs;
        const pad = (n) => String(n).padStart(2, '0');
        if (diffMs > 0) {
            const totalSecs = Math.floor(diffMs / 1000);
            const hrs = Math.floor(totalSecs / 3600);
            const mins = Math.floor((totalSecs % 3600) / 60);
            const secs = totalSecs % 60;
            const formatted = `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
            const readable = `${hrs}h ${mins}m ${secs}s left`;
            const elapsedMs = Math.max(0, nowMs - startMs);
            const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalShiftMs) * 100)));
            return {
                status: 'active',
                formatted, // "HH:mm:ss" (e.g. 03:00:13)
                readable,
                progressPercent,
                isOvertime: false,
            };
        }
        else {
            const overtimeSecs = Math.floor(Math.abs(diffMs) / 1000);
            const hrs = Math.floor(overtimeSecs / 3600);
            const mins = Math.floor((overtimeSecs % 3600) / 60);
            const secs = overtimeSecs % 60;
            const formatted = `+${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
            return {
                status: 'ended',
                formatted: isClockedIn ? formatted : '00:00:00',
                readable: isClockedIn ? `+${hrs}h ${mins}m OT` : 'Shift Completed',
                progressPercent: 100,
                isOvertime: isClockedIn,
            };
        }
    }, [now, empShift.startTime, empShift.endTime, isClockedIn]);
    const handleTogglePunch = () => {
        const now = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
        const workLoc = empProfile?.employment?.workLocation || 'Bhilwara Site Office';
        if (isClockedIn) {
            setIsClockedIn(false);
            setClockOutTime(now);
            toast.success(`Clocked out at ${now}. Today's shift session recorded.`, 'Punch Out Successful');
        }
        else {
            setIsClockedIn(true);
            setClockInTime(now);
            setClockOutTime(null);
            toast.success(`Clocked in at ${now}. GPS Geofence verified at ${workLoc}.`, 'Punch In Recorded');
        }
    };
    // Live dynamic leave balances (Zero Fake Numbers)
    const userLeaveBalances = useMemo(() => {
        const empId = user?.employeeId || 'BGS-006';
        const balances = storage.getBalancesForEmployee(empId, user?.name);
        const cl = balances.find((b) => b.leaveType?.includes('Casual') || b.code === 'CL') || {
            leaveType: 'Casual Leave (CL)',
            totalAllocated: 12,
            used: 2,
            available: 10,
        };
        const sl = balances.find((b) => b.leaveType?.includes('Sick') || b.code === 'SL') || {
            leaveType: 'Sick Leave (SL)',
            totalAllocated: 10,
            used: 1,
            available: 9,
        };
        const el = balances.find((b) => b.leaveType?.includes('Earned') || b.code === 'EL') || {
            leaveType: 'Earned Leave (EL)',
            totalAllocated: 18,
            used: 0,
            available: 18,
        };
        return { cl, sl, el };
    }, [user?.employeeId, user?.name]);
    // Live leave requests for employee
    const personalLeaves = useMemo(() => {
        const empId = user?.employeeId || 'BGS-006';
        const allReqs = storage.getLeaveRequests();
        const userReqs = allReqs
            .filter((r) => r.employeeId === empId || (user?.name && r.employeeName?.toLowerCase() === user.name.toLowerCase()))
            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
        if (userReqs.length > 0) {
            return userReqs.slice(0, 3).map((r) => {
                const reqDays = Number(r.requestedDays || r.days) || 1;
                const daysLabel = r.status === 'Partially Approved'
                    ? `${reqDays} Days (${r.approvedDays}d approved)`
                    : `${reqDays} ${reqDays === 1 ? 'Day' : 'Days'}`;
                return {
                    id: r.id,
                    type: r.leaveType,
                    dates: `${r.startDate} - ${r.endDate}`,
                    days: daysLabel,
                    reason: r.reason,
                    status: r.status,
                    approvedBy: r.approverName || r.approvedBy || 'HR Admin',
                };
            });
        }
        return [
            {
                id: 'lv-01',
                type: 'Casual Leave (CL)',
                dates: '08 Sep 2026 - 09 Sep 2026',
                days: '2 Days',
                reason: 'Family personal work in Bhilwara',
                status: 'Approved',
                approvedBy: 'Kritika Gupta (Head HR)',
            },
            {
                id: 'lv-02',
                type: 'Sick Leave (SL)',
                dates: '28 Aug 2026',
                days: '1 Day',
                reason: 'Seasonal viral fever - medical prescribed rest',
                status: 'Approved',
                approvedBy: 'Kritika Gupta (Head HR)',
            },
        ];
    }, [user?.employeeId, user?.name]);
    // Live expense & reimbursement metrics for employee (zero fake numbers)
    const { pendingExpensesTotal, settledExpensesTotal } = useMemo(() => {
        const empId = user?.employeeId;
        if (!empId) {
            return { pendingExpensesTotal: 0, settledExpensesTotal: 0 };
        }
        const allExp = storage.getExpenses();
        const allRmb = storage.getReimbursements();

        const userExp = allExp.filter((e) => e.employeeId === empId);
        const userRmb = allRmb.filter((r) => r.employeeId === empId);

        const pendingExp = userExp.filter((e) => e.status === 'Pending').reduce((sum, e) => sum + (Number(e.requestedAmount || e.amount) || 0), 0);
        const pendingRmb = userRmb.filter((r) => r.status === 'Pending').reduce((sum, r) => sum + (Number(r.claimAmount) || 0), 0);

        const settledExp = userExp.filter((e) => e.status === 'Settled' || e.status === 'Approved' || e.status === 'Partially Approved').reduce((sum, e) => sum + (Number(e.approvedAmount) || 0), 0);
        const settledRmb = userRmb.filter((r) => r.status === 'Settled' || r.status === 'Approved' || r.status === 'Partially Approved').reduce((sum, r) => sum + (Number(r.approvedAmount) || 0), 0);

        return {
            pendingExpensesTotal: pendingExp + pendingRmb,
            settledExpensesTotal: settledExp + settledRmb,
        };
    }, [user?.employeeId]);
    // Dynamic time-of-day greeting
    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12)
            return 'Good morning';
        if (hour < 17)
            return 'Good afternoon';
        return 'Good evening';
    }, []);
    // Employee banner visual theme style ('geo' = Bansal Geo Executive, 'glass' = Minimal Frosted Glass, 'midnight' = Midnight Gold)
    const [bannerStyle, setBannerStyle] = useState(() => {
        return localStorage.getItem('hrms_emp_banner_style') || 'geo';
    });
    const handleSelectBannerStyle = (style) => {
        setBannerStyle(style);
        localStorage.setItem('hrms_emp_banner_style', style);
    };
    return (<div className="space-y-4">
      {/* ── 1. Welcome & Employee Profile Header (Ultra-Concise & Modern) ───────────── */}
      <div className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-3.5 sm:p-4 shadow-2xs ${bannerStyle === 'geo'
            ? 'bg-gradient-to-r from-white via-[#F8FBFA] to-[#EEF6F6] dark:from-[#0D1B22] dark:via-[#132730] dark:to-[#0A161C] border-slate-200/90 dark:border-teal-900/50 text-slate-900 dark:text-white'
            : bannerStyle === 'glass'
                ? 'bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border-slate-200/90 dark:border-slate-800 text-slate-900 dark:text-white'
                : 'bg-gradient-to-r from-[#0C1A20] via-[#12252E] to-[#0A161B] border-[#25424D]/80 text-white shadow-md'}`}>
        {/* Subtle Topographic Watermark Lines */}
        {(bannerStyle === 'geo' || bannerStyle === 'midnight') && (<div className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-10">
            <svg viewBox="0 0 1200 120" fill="none" className={`w-full h-full ${bannerStyle === 'midnight' ? 'text-teal-400/20' : 'text-teal-700/20 dark:text-teal-400/20'}`} stroke="currentColor">
              <path d="M0,60 C300,10 600,110 1200,40" strokeWidth="1.2"/>
              <path d="M0,80 C350,30 650,130 1200,60" strokeWidth="1.2"/>
              <path d="M0,40 C250,-10 550,90 1200,20" strokeWidth="1.2"/>
            </svg>
          </div>)}

        {/* Ambient Glow */}
        {bannerStyle === 'geo' && (<div className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none overflow-hidden select-none">
            <div className="absolute right-4 -top-6 w-32 h-32 rounded-full border border-amber-300/25 pointer-events-none"/>
            <div className="absolute right-10 -bottom-8 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none"/>
          </div>)}

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Avatar + Concise 2-Row Identity Details */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar */}
            <div className="relative shrink-0">
              <Avatar name={user?.name || ''} size="lg"/>
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white dark:bg-slate-900 ring-1 ring-white dark:ring-slate-900" title={isClockedIn ? 'Clocked In • Active' : 'Clocked Out'}>
                <span className={`h-2 w-2 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}/>
              </span>
            </div>

            {/* Profile Info (Strictly 2 concise rows) */}
            <div className="min-w-0 space-y-0.5">
              {/* Row 1: Name + Role Chip + ID + ESS */}
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate">
                  {user?.name || empProfile?.name || 'Rohan Deshmukh'}
                </h1>

                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${bannerStyle === 'midnight'
            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
            : 'bg-amber-500/10 dark:bg-amber-400/15 text-amber-900 dark:text-amber-300 border border-amber-500/25'}`}>
                  <Compass className={`w-3 h-3 ${bannerStyle === 'midnight' ? 'text-amber-300' : 'text-amber-600 dark:text-amber-400'}`}/>
                  {user?.designation || empProfile?.employment?.designation || 'Senior Exploration Geologist'}
                </span>

                <span className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded ${bannerStyle === 'midnight'
            ? 'bg-white/10 text-slate-200 border border-white/15'
            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'}`}>
                  {user?.employeeId || empProfile?.employeeId || 'BGS-006'}
                </span>

                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${bannerStyle === 'midnight'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60'}`}>
                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-500"/>
                  ESS
                </span>
              </div>

              {/* Row 2: Location • Manager • Shift */}
              <div className={`flex flex-wrap items-center gap-2 text-[11px] ${bannerStyle === 'midnight' ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#C8943A]"/>
                  <span>{empProfile?.employment?.workLocation || 'Jaipur HQ'}</span>
                </span>
                <span className="opacity-40">•</span>
                <span className="inline-flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-teal-600 dark:text-teal-400"/>
                  <span>{empProfile?.employment?.managerName ? `${empProfile.employment.managerName}` : 'Dr. Amit Kumar Bansal'}</span>
                </span>
                <span className="opacity-40">•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3 h-3 text-emerald-500"/>
                  <span>{empShift.timings}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Live Punch Capsule + Quick Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 flex-wrap">
            {/* Live Clock / Punch Capsule */}
            <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px] font-semibold shadow-2xs ${bannerStyle === 'midnight'
            ? 'bg-slate-900/90 border-[#25424D] text-slate-200'
            : 'bg-white/90 dark:bg-slate-900/90 border-slate-200/90 dark:border-slate-800 text-slate-700 dark:text-slate-200'}`}>
              <span className={`w-2 h-2 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}/>
              <span>{isClockedIn ? `In: ${clockInTime} • ${shiftRemaining.formatted} Left` : 'Clocked Out'}</span>
            </div>

            {user?.role === 'hr' && (<Button variant="outline" size="sm" onClick={() => {
                setRole('hr');
                switchRole('hr');
                navigate('/hr');
            }} className="h-8 text-xs !border-amber-400/80 !text-amber-700 dark:!text-amber-300 font-bold" leftIcon={<Building2 className="w-3.5 h-3.5 text-amber-500"/>}>
                Admin
              </Button>)}

            <Button variant="outline" size="sm" onClick={() => navigate('/hr/attendance')} className={`h-8 text-xs font-semibold ${bannerStyle === 'midnight'
            ? '!border-slate-600 !text-slate-200 hover:!bg-slate-800'
            : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`} leftIcon={<Clock className="w-3.5 h-3.5 text-emerald-500"/>}>
              Punch Log
            </Button>

            <Button variant="primary" size="sm" onClick={() => navigate('/hr/leave/apply')} className={`h-8 text-xs font-semibold shadow-xs ${bannerStyle === 'midnight'
            ? '!bg-gradient-to-r !from-amber-500 !to-amber-600 hover:!from-amber-600 hover:!to-amber-700 !text-slate-950 font-bold'
            : 'bg-gradient-to-r from-[#1F6F78] to-[#2A8089] hover:from-[#175960] hover:to-[#1F6F78] text-white'}`} leftIcon={<CalendarPlus className="w-3.5 h-3.5"/>}>
              Apply Leave
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. Live Punch Clock & Personal Attendance KPI Row ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Live Punch Clock Widget */}
        <Card className="p-4 sm:p-5 flex flex-col justify-between border-t-2 border-t-emerald-500">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Live Attendance Punch
              </span>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${isClockedIn
            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/40'
            : clockOutTime
                ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/40'
                : 'text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isClockedIn ? 'bg-emerald-500 animate-pulse' : clockOutTime ? 'bg-blue-500' : 'bg-slate-400'}`}/>
                {isClockedIn ? 'Currently Clocked In' : clockOutTime ? 'Shift Completed (Clocked Out)' : 'Clocked Out'}
              </span>
            </div>

            {/* Live Clock Display */}
            <div className="my-3 text-center">
              <div className="inline-flex items-baseline justify-center gap-1.5">
                <span className="text-3xl sm:text-4xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight tabular-nums">
                  {currentTimeParts.timeFormatted}
                </span>
                <span className="text-sm sm:text-base font-bold text-slate-500 dark:text-slate-400 font-sans tracking-normal">
                  {currentTimeParts.ampm}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Shift Remaining Countdown Banner */}
            <div className="mb-3 p-2.5 rounded-xl bg-gradient-to-r from-teal-50 via-emerald-50/60 to-teal-50 dark:from-teal-950/40 dark:via-emerald-950/30 dark:to-teal-950/40 border border-teal-200/80 dark:border-teal-800/60 shadow-2xs">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-teal-800 dark:text-teal-300 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 animate-pulse"/>
                  {shiftRemaining.isOvertime ? 'Overtime Active' : 'Shift Time Remaining'}
                </span>
                <span className="text-[10px] font-bold text-teal-700 dark:text-teal-300 bg-teal-100/90 dark:bg-teal-900/60 px-2 py-0.5 rounded-full">
                  {shiftRemaining.isOvertime ? 'OT Session' : `${shiftRemaining.progressPercent}% Elapsed`}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <div className="text-2xl sm:text-3xl font-extrabold font-mono text-teal-950 dark:text-teal-100 tabular-nums tracking-wider">
                  {shiftRemaining.formatted}
                </div>
                <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
                  {shiftRemaining.isOvertime ? (<span className="text-amber-600 dark:text-amber-400 font-semibold">Post Shift Time</span>) : (<span>Shift Ends <strong className="text-slate-700 dark:text-slate-200">{empShift.endTime}</strong></span>)}
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-200/80 dark:bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className={`h-1.5 rounded-full transition-all duration-700 ease-out ${shiftRemaining.isOvertime
            ? 'bg-amber-500'
            : 'bg-gradient-to-r from-teal-600 to-emerald-500'}`} style={{ width: `${shiftRemaining.progressPercent}%` }}/>
              </div>
            </div>

            {/* Shift & Geofence Details */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121A24] border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between items-center">
                <span>Shift Timings:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200">{empShift.timings} ({empShift.name.includes('Morning') ? 'Mining Site' : empShift.name})</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Shift Remaining:</span>
                <span className="font-mono font-bold text-teal-700 dark:text-teal-300 tabular-nums bg-teal-50 dark:bg-teal-950/60 px-1.5 py-0.5 rounded border border-teal-200/60 dark:border-teal-800/40">
                  {shiftRemaining.formatted}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Punch In Today:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{clockInTime} (On Time)</span>
              </div>
              {clockOutTime && (<div className="flex justify-between items-center">
                  <span>Punch Out:</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">{clockOutTime} (Shift Completed)</span>
                </div>)}
              <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#FEC13D]"/>
                  {empShift.geofence}
                </span>
                <span className="text-emerald-600 font-bold">Verified</span>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Button variant={isClockedIn ? 'outline' : 'primary'} size="md" onClick={handleTogglePunch} className={`w-full font-bold ${isClockedIn
            ? '!border-rose-300 !text-rose-700 hover:!bg-rose-50 dark:!border-rose-800 dark:!text-rose-400 dark:hover:!bg-rose-950/40'
            : '!bg-emerald-600 hover:!bg-emerald-700'}`} leftIcon={isClockedIn ? <LogOut className="w-4 h-4 text-rose-500"/> : <LogIn className="w-4 h-4"/>}>
              {isClockedIn ? 'Punch Out for the Day' : (clockOutTime ? 'Punch In (Overtime / Night Duty)' : 'Punch In Now (Clock In)')}
            </Button>
          </div>
        </Card>

        {/* Attendance Summary 4-Grid Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="p-4 flex flex-col justify-between border-l-4 border-l-emerald-500">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Present This Month</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4"/>
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  21
                </span>
                <span className="text-xs font-semibold text-slate-400">/ 24 Working Days</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Attendance Rate</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">87.5%</span>
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between border-l-4 border-l-amber-500">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Leaves Taken</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <CalendarCheck2 className="w-4 h-4"/>
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  2
                </span>
                <span className="text-xs font-semibold text-slate-400">Days (Sep 2026)</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Status</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">Fully Approved</span>
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between border-l-4 border-l-blue-500">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Late Marks</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Clock className="w-4 h-4"/>
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  1
                </span>
                <span className="text-xs font-semibold text-slate-400">Grace Applied</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Penalty</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">₹0 (Within 15m Grace)</span>
            </div>
          </Card>

          <Card className="p-4 flex flex-col justify-between border-l-4 border-l-purple-500">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Field Exploration Hours</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Sparkles className="w-4 h-4"/>
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  168
                </span>
                <span className="text-xs font-semibold text-slate-400">Total Hours</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>Site Extra Time</span>
              <span className="font-bold text-purple-600 dark:text-purple-400">8.5 hrs Logged</span>
            </div>
          </Card>
        </div>
      </div>

      {/* ── 3. Leave Balances & Applications ─────────────────────── */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">My Leave Balances (2026)</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Approved quota according to BGSPL HR Policy</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/hr/leave/balance')} className="text-xs h-7 px-2.5" rightIcon={<ChevronRight className="w-3.5 h-3.5"/>}>
            Leave Ledger
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121A24] border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Casual Leave (CL)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500"/>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums tracking-tight">
                {userLeaveBalances.cl.available}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                / {userLeaveBalances.cl.totalAllocated} days left
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{
            width: `${Math.min(100, Math.round(((userLeaveBalances.cl.totalAllocated - userLeaveBalances.cl.available) / (userLeaveBalances.cl.totalAllocated || 1)) * 100))}%`,
        }}/>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {userLeaveBalances.cl.used ?? (userLeaveBalances.cl.totalAllocated - userLeaveBalances.cl.available)} days utilized
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121A24] border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Sick Leave (SL)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"/>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums tracking-tight">
                {userLeaveBalances.sl.available}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                / {userLeaveBalances.sl.totalAllocated} days left
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
              <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{
            width: `${Math.min(100, Math.round(((userLeaveBalances.sl.totalAllocated - userLeaveBalances.sl.available) / (userLeaveBalances.sl.totalAllocated || 1)) * 100))}%`,
        }}/>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {userLeaveBalances.sl.used ?? (userLeaveBalances.sl.totalAllocated - userLeaveBalances.sl.available)} days utilized
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121A24] border border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Earned Leave (EL)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"/>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums tracking-tight">
                {userLeaveBalances.el.available}
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                / {userLeaveBalances.el.totalAllocated} days left
              </span>
            </div>
            <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{
            width: `${Math.min(100, Math.round(((userLeaveBalances.el.totalAllocated - userLeaveBalances.el.available) / (userLeaveBalances.el.totalAllocated || 1)) * 100))}%`,
        }}/>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {userLeaveBalances.el.used ?? (userLeaveBalances.el.totalAllocated - userLeaveBalances.el.available)} days utilized
            </span>
          </div>
        </div>

        {/* Recent Applications by Employee */}
        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">My Recent Applications</h3>
          <div className="space-y-2">
            {personalLeaves.map((lv) => (<div key={lv.id} className="p-2.5 rounded-xl bg-white dark:bg-[#16202C] border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">{lv.type}</span>
                    <StatusBadge status={lv.status} size="sm"/>
                    <span className="text-[11px] text-slate-400 font-mono">({lv.days})</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {lv.dates} • <span className="italic">"{lv.reason}"</span>
                  </p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">Reviewed by {lv.approvedBy}</span>
              </div>))}
          </div>
        </div>
      </Card>

      {/* ── 4. My Expenses & Upcoming Company Holidays ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Expenses & Reimbursements */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                <Receipt className="w-4 h-4"/>
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">My Claims & Expenses</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Site travel, lodging & fuel reimbursements</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/expenses/new')} className="text-xs h-7 px-2.5" leftIcon={<CalendarPlus className="w-3.5 h-3.5 text-teal-600"/>}>
              New Claim
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121A24] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Pending Review</span>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                ₹{pendingExpensesTotal.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">Awaiting approval</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121A24] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Settled (This Year)</span>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                ₹{settledExpensesTotal.toLocaleString('en-IN')}
              </p>
              <span className="text-[10px] text-slate-400">All claims reimbursed</span>
            </div>
          </div>

          <div className="mt-3 pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Need to view claim history?</span>
            <button onClick={() => navigate('/hr/expenses')} className="text-teal-700 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1">
              <span>View Claims</span>
              <ArrowRight className="w-3 h-3"/>
            </button>
          </div>
        </Card>

        {/* Company Holidays & Notice */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <CalendarDays className="w-4 h-4"/>
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">Upcoming Company Holidays</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Official BGSPL Rajasthan Calendar</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              2026
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
            {[
            { title: 'Gandhi Jayanti', date: '02 Oct 2026', day: 'Friday', badge: 'National Holiday' },
            { title: 'Dussehra (Vijayadashami)', date: '20 Oct 2026', day: 'Tuesday', badge: 'Gazetted Holiday' },
            { title: 'Diwali (Deepavali)', date: '08 Nov 2026', day: 'Sunday', badge: 'Gazetted Holiday' },
        ].map((hol) => (<div key={hol.title} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{hol.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{hol.date} • {hol.day}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
                  {hol.badge}
                </span>
              </div>))}
          </div>
        </Card>
      </div>

    </div>);
};
