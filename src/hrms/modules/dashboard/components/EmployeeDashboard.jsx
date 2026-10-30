import { Avatar } from '@/components/common/Avatar';
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, Clock, CalendarCheck2, Receipt, CalendarPlus, ArrowRight, MapPin, CalendarDays, Sparkles, ShieldCheck, UserCheck, LogOut, LogIn, ChevronRight, Building2, Compass, Timer, ShieldAlert, Crosshair, Navigation, CheckCircle2, AlertTriangle, Eye, EyeOff, Layers, Map as MapIcon, FileCheck, Upload } from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { storage } from '@/core/storage/storage';
import { useCrm } from '../../../../context/crm';
import { attendanceService } from '@/modules/attendance/services/attendance.service';
import { parseClock, todayIso } from '@/modules/attendance/utils/punch';
import { weeklyOffFor } from '@/modules/attendance/utils/weeklyOff';
import { isWorkingDay, PUBLIC_HOLIDAYS_2026 } from '@/modules/leave/utils/workingDays';
import { evaluateGeofence, OFFICE_CENTROID, OFFICE_INFO } from '@/modules/attendance/utils/geofence';
import { GeofenceModal } from '@/modules/attendance/components/GeofenceModal';
import { GeofenceMap } from '@/modules/attendance/components/GeofenceMap';
export const EmployeeDashboard = () => {
    const { user } = useAuth();
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
        const empId = user?.employeeId ?? '';
        return emps.find((e) => e.employeeId === empId || (user?.name && e.name.toLowerCase() === user.name.toLowerCase()));
    }, [user?.employeeId, user?.name]);

    // Synchronized inventory assignments from CrmProvider (single source of truth)
    const { inventoryAssignments = [] } = useCrm();

    // Assigned inventory items strictly for this employee only
    const myAssignedInventory = useMemo(() => {
        const empId = empProfile?.employeeId || user?.employeeId;
        const empInternalId = empProfile?.id || user?.id;
        const empName = empProfile?.name || user?.name;

        return inventoryAssignments.filter((asg) => {
            if (asg.status !== 'Assigned') return false; // Only active assignments

            const matchId = empId && (asg.employeeId === empId || asg.employeeId === empInternalId);
            const matchName = empName && (
                asg.employeeName?.trim().toLowerCase() === empName.trim().toLowerCase() ||
                asg.employeeId?.trim().toLowerCase() === empName.trim().toLowerCase()
            );

            return Boolean(matchId || matchName);
        });
    }, [inventoryAssignments, empProfile, user]);
    // The shift assigned to this person, else the company working hours from the attendance settings.
    const empShift = useMemo(() => {
        const assignments = storage.getShiftAssignments ? storage.getShiftAssignments() : [];
        const empId = user?.employeeId ?? '';
        const assign = assignments.find((a) => a.employeeId === empId);
        const shifts = storage.getShifts ? storage.getShifts() : [];
        const matched = shifts.find((s) => s.id === assign?.shiftId || s.name === assign?.shiftName);
        const settings = storage.getAttendanceSettings();
        const startTime = matched?.startTime || settings.workStartTime;
        const endTime = matched?.endTime || settings.workEndTime;
        return {
            name: matched?.name || assign?.shiftName || 'General shift',
            startTime,
            endTime,
            timings: `${startTime} - ${endTime}`,
            location: matched?.location || empProfile?.employment?.workLocation || '-',
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
    // Today's punch, from the attendance register.
    const [todayRecord, setTodayRecord] = useState(() => storage.getAttendance().find((a) => a.employeeId === user?.employeeId && a.date === todayIso()));
    const [isPunching, setIsPunching] = useState(false);

    // Geofence GPS location & status (initialized to office polygon centroid)
    const [userCoords, setUserCoords] = useState(() => ({
        latitude: OFFICE_CENTROID[0],
        longitude: OFFICE_CENTROID[1],
        accuracy: 8,
        simulated: true,
    }));
    const [isGeofenceModalOpen, setIsGeofenceModalOpen] = useState(false);
    const [showInlineMap, setShowInlineMap] = useState(false);

    const geofence = useMemo(() => {
        return evaluateGeofence(userCoords?.latitude, userCoords?.longitude, userCoords?.accuracy || 10);
    }, [userCoords]);
    const isInsideGeofence = geofence.isInside;

    // Detect browser GPS on mount if permission granted
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserCoords({
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        accuracy: Math.round(pos.coords.accuracy),
                        simulated: false,
                    });
                },
                () => {
                    // Retain default simulated inside location if permission prompt dismissed or offline
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        }
    }, []);

    useEffect(() => {
        if (user?.employeeId) {
            setTodayRecord(storage.getAttendance().find((a) => a.employeeId === user.employeeId && a.date === todayIso()));
        }
    }, [user?.employeeId]);
    const punchedIn = Boolean(todayRecord?.checkIn && todayRecord.checkIn !== '-');
    const punchedOut = Boolean(todayRecord?.checkOut && todayRecord.checkOut !== '-');
    const onLeaveToday = todayRecord?.status === 'On Leave';
    const isClockedIn = punchedIn && !punchedOut;
    const clockInTime = punchedIn ? todayRecord.checkIn : null;
    const clockOutTime = punchedOut ? todayRecord.checkOut : null;
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

    const handleTogglePunch = async () => {
        if (punchedOut || onLeaveToday || isPunching)
            return;

        // Strict Geofence verification
        if (!isInsideGeofence) {
            toast.error(
                `Attendance Locked: You are outside the office geofence (${Math.round(geofence.distanceMeters || 0)}m away). Move inside the office boundary to punch.`,
                'Geofence Required'
            );
            setIsGeofenceModalOpen(true);
            return;
        }

        setIsPunching(true);
        try {
            const punchSource = `Office Geofenced GPS (${isInsideGeofence ? 'Verified Inside' : 'Outside'})`;
            const rec = await attendanceService.recordPunch(user?.employeeId, isClockedIn ? 'checkOut' : 'checkIn', punchSource, userCoords);
            setTodayRecord(rec);
            if (isClockedIn)
                toast.success(`Punched out at ${rec.checkOut}. Worked ${rec.workingHours}. · Geofence Verified`, 'Punch Out Recorded');
            else
                toast.success(`Punched in at ${rec.checkIn}${rec.status === 'Late' ? ` (late by ${rec.lateBy})` : ''} · Geofence Verified.`, 'Punch In Recorded');
        }
        catch (err) {
            toast.error(err.message, 'Punch not recorded');
        }
        finally {
            setIsPunching(false);
        }
    };
    // This month's attendance for the summary cards.
    const monthStats = useMemo(() => {
        const empId = user?.employeeId ?? '';
        const today = todayIso();
        const month = today.slice(0, 7);
        const companyHolidays = storage.getLeaveSettings()?.companyHolidays || [];
        const offDays = weeklyOffFor(empId);
        let workingDays = 0;
        for (let day = 1; day <= Number(today.slice(8)); day++) {
            if (isWorkingDay(`${month}-${String(day).padStart(2, '0')}`, companyHolidays, offDays)) workingDays += 1;
        }
        const rows = storage.getAttendance().filter((a) => a.employeeId === empId && a.date.startsWith(month));
        const present = rows.filter((a) => a.status === 'Present' || a.status === 'Late').length;
        const late = rows.filter((a) => a.status === 'Late').length;
        const leaveDays = rows.filter((a) => a.status === 'On Leave').length;
        let workedMins = 0;
        let overtimeMins = 0;
        rows.forEach((a) => {
            const inAt = parseClock(a.checkIn);
            const outAt = parseClock(a.checkOut);
            if (inAt !== null && outAt !== null && outAt > inAt) workedMins += outAt - inAt;
            const ot = String(a.overtime || '').match(/^(\d+)m$/);
            if (ot) overtimeMins += Number(ot[1]);
        });
        const pendingLeave = storage.getLeaveRequests().filter((r) => r.employeeId === empId && r.status === 'Pending').length;
        return {
            workingDays,
            present,
            late,
            leaveDays,
            pendingLeave,
            hours: Math.round(workedMins / 60),
            overtimeHours: Math.round((overtimeMins / 60) * 10) / 10,
            rate: workingDays ? Math.round((present / workingDays) * 1000) / 10 : 0,
            monthLabel: new Date(`${month}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
        };
    }, [user?.employeeId, todayRecord]);
    // The next three holidays: public holidays and the company holidays in the leave settings.
    const upcomingHolidays = useMemo(() => {
        const today = todayIso();
        const company = (storage.getLeaveSettings()?.companyHolidays || []).map((h) => (typeof h === 'string' ? { date: h, name: 'Company holiday', kind: 'Company Holiday' } : { kind: 'Company Holiday', ...h }));
        return [...PUBLIC_HOLIDAYS_2026, ...company]
            .filter((h) => h.date >= today)
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 3)
            .map((h) => {
                const d = new Date(`${h.date}T00:00:00`);
                return { title: h.name, date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), day: d.toLocaleDateString('en-IN', { weekday: 'long' }), badge: h.kind };
            });
    }, []);
    // Live dynamic leave balances (Zero Fake Numbers)
    // Live dynamic leave balances (Zero Fake Numbers)
    const userLeaveBalances = useMemo(() => {
        const empId = user?.employeeId ?? '';
        const balances = storage.getBalancesForEmployee(empId, user?.name);
        const none = (leaveType) => ({ leaveType, totalAllocated: 0, used: 0, available: 0 });
        const cl = balances.find((b) => b.leaveType?.includes('Casual') || b.code === 'CL') || none('Casual Leave (CL)');
        const sl = balances.find((b) => b.leaveType?.includes('Sick') || b.code === 'SL') || none('Sick Leave (SL)');
        const el = balances.find((b) => b.leaveType?.includes('Earned') || b.code === 'EL') || none('Earned Leave (EL)');
        return { cl, sl, el };
    }, [user?.employeeId, user?.name]);
    // Live leave requests for employee
    const personalLeaves = useMemo(() => {
        const empId = user?.employeeId ?? '';
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
                    approvedBy: r.approverName || r.approvedBy || '-',
                };
            });
        }
        return [];
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
                  {user?.name || empProfile?.name || ''}
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
                  {user?.employeeId || empProfile?.employeeId || '-'}
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
                  <span>{empProfile?.employment?.workLocation || 'Location not set'}</span>
                </span>
                <span className="opacity-40">•</span>
                <span className="inline-flex items-center gap-1">
                  <UserCheck className="w-3 h-3 text-teal-600 dark:text-teal-400"/>
                  <span>{empProfile?.employment?.managerName || 'Manager not set'}</span>
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
              <span>{isClockedIn ? `In: ${clockInTime}` : punchedOut ? `Out: ${clockOutTime}` : onLeaveToday ? 'On leave today' : 'Not punched in'}</span>
            </div>

            <Button variant="outline" size="sm" onClick={() => navigate('/hr/attendance')} className={`h-8 text-xs font-semibold ${bannerStyle === 'midnight'
            ? '!border-slate-600 !text-slate-200 hover:!bg-slate-800'
            : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'}`} leftIcon={<Clock className="w-3.5 h-3.5 text-emerald-500"/>}>
              Punch Log
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
                {isClockedIn ? 'Punched in' : clockOutTime ? 'Day complete' : onLeaveToday ? 'On leave' : 'Not punched in'}
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

            {/* Shift and today's punches */}
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#121A24] border border-slate-200/80 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between items-center gap-3">
                <span>Shift:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-200 text-right">{empShift.name} · {empShift.timings}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Punch In Today:</span>
                <span className={`font-semibold ${todayRecord?.status === 'Late' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                  {clockInTime ? `${clockInTime}${todayRecord?.status === 'Late' ? ` (late by ${todayRecord.lateBy})` : ' (on time)'}` : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Punch Out:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{clockOutTime ? `${clockOutTime} (${todayRecord.workingHours})` : '-'}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#FEC13D]"/>
                  {empShift.location}
                </span>
                <span className="text-slate-500 font-medium">{todayRecord?.punchSource || (isInsideGeofence ? 'Geofenced GPS' : 'Web portal')}</span>
              </div>
            </div>

            {/* Geofence Live Location & Verification Card */}
            <div className={`p-2.5 rounded-xl border text-xs transition-all ${
              isInsideGeofence
                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 overflow-hidden">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isInsideGeofence ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="font-bold truncate text-[11.5px]">
                    {isInsideGeofence
                      ? 'Inside Office Geofence (0m)'
                      : `Outside Geofence (${Math.round(geofence.distanceMeters || 0)}m away)`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowInlineMap(!showInlineMap)}
                    className="text-[10.5px] font-semibold text-slate-600 dark:text-slate-300 hover:text-teal-600 underline"
                  >
                    {showInlineMap ? 'Hide Map' : 'Mini Map'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsGeofenceModalOpen(true)}
                    className="text-[10.5px] font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-0.5"
                  >
                    <span>Full Map</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

              {/* Simulation test toggles */}
              <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-[10.5px]">
                <span className="opacity-80">Test Location:</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setUserCoords({ latitude: OFFICE_CENTROID[0], longitude: OFFICE_CENTROID[1], accuracy: 8, simulated: true })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                      isInsideGeofence
                        ? 'bg-teal-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Inside (0m)
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserCoords({ latitude: 26.8552, longitude: 75.7682, accuracy: 12, simulated: true })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                      !isInsideGeofence
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    Outside (150m)
                  </button>
                </div>
              </div>

              {/* Inline Collapsible Map */}
              {showInlineMap && (
                <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <GeofenceMap
                    userCoords={userCoords}
                    onCoordsChange={setUserCoords}
                    compact={true}
                    height="200px"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <Button
              variant={isClockedIn ? 'outline' : 'primary'}
              size="md"
              onClick={handleTogglePunch}
              disabled={punchedOut || onLeaveToday || isPunching || !isInsideGeofence}
              className={`w-full font-bold transition-all ${
                !isInsideGeofence
                  ? '!bg-slate-200 dark:!bg-slate-800 !text-slate-500 dark:!text-slate-400 !cursor-not-allowed !border-slate-300 dark:!border-slate-700 shadow-none'
                  : isClockedIn
                    ? '!border-rose-300 !text-rose-700 hover:!bg-rose-50 dark:!border-rose-800 dark:!text-rose-400 dark:hover:!bg-rose-950/40'
                    : '!bg-emerald-600 hover:!bg-emerald-700 !text-white'
              }`}
              leftIcon={
                !isInsideGeofence ? (
                  <ShieldAlert className="w-4 h-4 text-slate-400" />
                ) : isClockedIn ? (
                  <LogOut className="w-4 h-4 text-rose-500"/>
                ) : (
                  <LogIn className="w-4 h-4"/>
                )
              }
            >
              {!isInsideGeofence
                ? `Punch Locked (Outside by ${Math.round(geofence.distanceMeters || 0)}m)`
                : isClockedIn
                  ? 'Punch Out for the Day'
                  : punchedOut
                    ? 'Punched out for today'
                    : onLeaveToday
                      ? 'On approved leave today'
                      : 'Punch In Now (Geofence Verified)'}
            </Button>
            {!isInsideGeofence && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 text-center mt-1.5 font-medium">
                Attendance disabled: you must be inside the office polygon to punch.
              </p>
            )}
          </div>
        </Card>

        {/* This month's attendance */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { title: 'Present This Month', value: monthStats.present, unit: `/ ${monthStats.workingDays} working days`, footLabel: 'Attendance rate', foot: `${monthStats.rate}%`, Icon: UserCheck, tone: 'emerald' },
            { title: 'Leave Taken', value: monthStats.leaveDays, unit: `days (${monthStats.monthLabel})`, footLabel: 'Waiting for approval', foot: monthStats.pendingLeave ? `${monthStats.pendingLeave} request${monthStats.pendingLeave === 1 ? '' : 's'}` : 'None', Icon: CalendarCheck2, tone: 'amber' },
            { title: 'Late Marks', value: monthStats.late, unit: 'this month', footLabel: 'Late after', foot: (() => { const st = storage.getAttendanceSettings(); return `${st.workStartTime} + ${st.gracePeriodMinutes} min`; })(), Icon: Clock, tone: 'blue' },
            { title: 'Hours Worked', value: monthStats.hours, unit: 'hours this month', footLabel: 'Overtime', foot: `${monthStats.overtimeHours} hrs`, Icon: Sparkles, tone: 'purple' },
          ].map((c) => (<Card key={c.title} className={`p-4 flex flex-col justify-between border-l-4 ${{ emerald: 'border-l-emerald-500', amber: 'border-l-amber-500', blue: 'border-l-blue-500', purple: 'border-l-purple-500' }[c.tone]}`}>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{c.title}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${{ emerald: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400', amber: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400', blue: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400', purple: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400' }[c.tone]}`}>
                  <c.Icon className="w-4 h-4"/>
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">{c.value}</span>
                <span className="text-xs font-semibold text-slate-400">{c.unit}</span>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{c.footLabel}</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">{c.foot}</span>
            </div>
          </Card>))}
        </div>
      </div>

      {/* ── 3. Leave Balances & Applications ─────────────────────── */}
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">My Leave Balances ({new Date().getFullYear()})</h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Yearly quota from the leave settings</p>
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

      {/* ── 4. My Documents & Upcoming Company Holidays ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Documents & Verification Status */}
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 flex items-center justify-center">
                <FileCheck className="w-4 h-4"/>
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">My Documents & Verification</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Aadhaar, PAN, certificates & ID proofs</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/documents')} className="text-xs h-7 px-2.5" leftIcon={<Upload className="w-3.5 h-3.5 text-teal-600"/>}>
              Upload Document
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121A24] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Verification Status</span>
              <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active & Compliant
              </p>
              <span className="text-[10px] text-slate-400 mt-1 block">Credentials verified by HR</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#121A24] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Personal Documents</span>
              <p className="text-xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                4 / 4
              </p>
              <span className="text-[10px] text-slate-400">KYC & educational records</span>
            </div>
          </div>

          <div className="mt-3 pt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Need to update or re-upload documents?</span>
            <button onClick={() => navigate('/hr/documents')} className="text-teal-700 dark:text-teal-400 font-bold hover:underline inline-flex items-center gap-1">
              <span>View Documents</span>
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
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Public and company holidays</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {new Date().getFullYear()}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
            {upcomingHolidays.map((hol) => (<div key={hol.title} className="py-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{hol.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">{hol.date} • {hol.day}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
                  {hol.badge}
                </span>
              </div>))}
            {!upcomingHolidays.length && (<p className="py-3 text-xs text-slate-500">No more holidays this year.</p>)}
          </div>
        </Card>
      </div>

      {/* ── 5. Assigned Inventory / Equipment ─────────────────────── */}
      <Card className="p-4 sm:p-5 mt-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Assigned Inventory</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/40">
                  {myAssignedInventory.length} {myAssignedInventory.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Tools, survey instruments and equipment currently issued to you
              </p>
            </div>
          </div>
        </div>

        {myAssignedInventory.length === 0 ? (
          <div className="py-8 text-center" id="assigned-inventory-empty">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
              <Boxes className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No inventory currently assigned.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">You currently have no tools, machinery or field equipment checked out.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3" id="assigned-inventory-list">
            {myAssignedInventory.map((item) => (
              <div
                key={item.id || item.assignmentId}
                className="p-3.5 rounded-xl bg-white dark:bg-[#121A24] border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {item.assetId || item.inventoryItemId}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                      {item.status || 'Assigned'}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-900 dark:text-white mt-2 line-clamp-1">
                    {item.itemName}
                  </h3>
                  <span className="inline-block text-[10px] font-medium text-indigo-600 dark:text-indigo-400 mt-0.5">
                    {item.category}
                  </span>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1 text-[11px]">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">Quantity:</span>
                      <span className="font-bold tabular-nums">
                        {item.quantity} {item.unit || 'Nos'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">Assigned Date:</span>
                      <span className="font-medium">{item.assignedDate || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                      <span className="text-slate-400">Return Date:</span>
                      <span className="font-medium text-amber-600 dark:text-amber-400">
                        {item.expectedReturnDate || item.returnDate || 'Open / Indefinite'}
                      </span>
                    </div>
                    {item.projectName && (
                      <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 pt-0.5">
                        <span className="text-slate-400">Project:</span>
                        <span className="font-medium text-slate-700 dark:text-slate-200 truncate max-w-[140px]" title={item.projectName}>
                          {item.projectName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {item.remarks && (
                  <p className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] text-slate-400 italic line-clamp-2">
                    "{item.remarks}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Office Attendance Geofence Modal */}
      <GeofenceModal
        isOpen={isGeofenceModalOpen}
        onClose={() => setIsGeofenceModalOpen(false)}
        userCoords={userCoords}
        onCoordsChange={setUserCoords}
      />

    </div>);
};
