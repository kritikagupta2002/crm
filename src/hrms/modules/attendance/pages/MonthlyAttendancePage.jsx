import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, ChevronLeft, ChevronRight, Search, Building2, UserCheck, CalendarOff, Clock } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/common/Select';
import { Input } from '@/components/common/Input';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { storage } from '@/core/storage/storage';
import { getEmployeeProject, STANDARD_PROJECTS } from '@/core/constants/projects';
import { downloadCsv } from '../../../../shared/utils/exportCsv';
import { todayIso } from '@/modules/attendance/utils/punch';
import { weeklyOffFor } from '@/modules/attendance/utils/weeklyOff';
import { markedDays } from '@/modules/leave/utils/workingDays';
import { Modal } from '@/components/common/Modal';
import { useToast } from '@/contexts/ToastContext';
import { useAccess } from '../../../../core/permissions/crm';
import { attendanceService } from '@/modules/attendance/services/attendance.service';
import { SkeletonTableRows } from '@/components/common/Skeleton';

const CELL = {
    P: { title: 'Present', bg: 'bg-emerald-50 text-emerald-700 font-semibold dark:bg-emerald-950/70 dark:text-emerald-300' },
    L: { title: 'Late', bg: 'bg-amber-100 text-amber-700 font-bold dark:bg-amber-950/70 dark:text-amber-300' },
    A: { title: 'Absent', bg: 'bg-rose-100 text-rose-700 font-bold dark:bg-rose-950/70 dark:text-rose-300' },
    LV: { title: 'Leave', bg: 'bg-purple-100 text-purple-700 font-bold dark:bg-purple-950/70 dark:text-purple-300' },
    WO: { title: 'Weekly off', bg: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
    SU: { title: 'Sunday', bg: 'att-cell-sunday' },
    H: { title: 'Holiday', bg: 'att-cell-holiday' },
    HD: { title: 'Half day', bg: 'att-cell-halfday' },
    '-': { title: 'No entry', bg: 'text-slate-300 dark:text-slate-600' },
};
const STATUS_CODE = { Present: 'P', Late: 'L', Absent: 'A', 'On Leave': 'LV' };
const pad = (n) => String(n).padStart(2, '0');
const WEEKDAY = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MAX_MONTHS_AHEAD = 12;

/* One row per person for the month, from the attendance register, their weekly off and the holidays. */
export const MonthlyAttendancePage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { currentRole } = useRole();
    const isEmp = currentRole === 'employee' || user?.role === 'employee';
    // HR and admins (settings permission) mark holidays and half days on this calendar.
    const canMark = useAccess().has('settings.manage');
    const toast = useToast();
    const empId = user?.employeeId ?? '';
    const rawEmployees = storage.getEmployees();
    // An employee sees only their own row.
    const employees = useMemo(() => (isEmp ? rawEmployees.filter((e) => e.employeeId === empId) : rawEmployees), [isEmp, empId, rawEmployees]);
    const today = todayIso();
    const [monthKey, setMonthKey] = useState(today.slice(0, 7));
    const [selectedDept, setSelectedDept] = useState('all');
    const [selectedProject, setSelectedProject] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [year, month] = monthKey.split('-').map(Number);
    const monthLabel = new Date(year, month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const days = Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => i + 1);
    // Future months can be opened too, to see upcoming Sundays and holidays.
    const lastMonthKey = (() => {
        const d = new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1 + MAX_MONTHS_AHEAD, 1);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    })();
    const shiftMonth = (delta) => {
        const d = new Date(year, month - 1 + delta, 1);
        const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
        if (key <= lastMonthKey) setMonthKey(key);
    };

    // The register: cached copy for the first paint, then the live list from the API.
    const [attendance, setAttendance] = useState(() => storage.getAttendance());
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let alive = true;
        attendanceService.getAttendance()
            .then((list) => { if (alive) setAttendance(list); })
            .catch(() => null)
            .finally(() => { if (alive) setLoading(false); });
        return () => { alive = false; };
    }, []);

    // Days HR / Admin marked as a holiday or half day (there is no built-in holiday list).
    const [marked, setMarked] = useState(() => markedDays(storage.getLeaveSettings()?.companyHolidays));
    const holidays = useMemo(() => {
        const map = new Map();
        for (const h of marked) if (h.date.startsWith(monthKey)) map.set(h.date, h);
        return map;
    }, [marked, monthKey]);

    // Mark-a-day dialog
    const [editing, setEditing] = useState(null);
    const [editKind, setEditKind] = useState('Holiday');
    const [editName, setEditName] = useState('');
    const [saving, setSaving] = useState(false);
    const openMark = (d) => {
        if (!canMark) return;
        const current = holidays.get(d.iso);
        setEditing(d);
        setEditKind(current?.kind || 'Holiday');
        setEditName(current?.name && current.name !== current.kind ? current.name : '');
    };
    const saveMark = async (clear = false) => {
        if (!editing) return;
        setSaving(true);
        try {
            if (clear) await attendanceService.clearDay(editing.iso);
            else await attendanceService.markDay(editing.iso, editKind, editName.trim());
            setMarked(markedDays(storage.getLeaveSettings()?.companyHolidays));
            toast.success(clear ? `${editing.label} is a working day again.` : `${editing.label} marked as ${editKind.toLowerCase()}.`, 'Calendar updated');
            setEditing(null);
        }
        catch (err) {
            toast.error(err.message || 'Could not update the calendar.', 'Not saved');
        }
        finally {
            setSaving(false);
        }
    };
    const dayInfo = useMemo(() => days.map((day) => {
        const iso = `${monthKey}-${pad(day)}`;
        const weekday = new Date(year, month - 1, day).getDay();
        const mark = holidays.get(iso);
        const label = new Date(year, month - 1, day).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        return { day, iso, weekday, label, isSunday: weekday === 0, holiday: mark?.kind === 'Holiday' ? mark.name : null, halfDay: mark?.kind === 'Half Day' ? mark.name : null };
    }), [days, monthKey, year, month, holidays]);
    const columnClass = (d) => (d.holiday ? 'att-col-holiday' : d.halfDay ? 'att-col-halfday' : d.isSunday ? 'att-col-sunday' : '');
    const columnTitle = (d) => (d.holiday ? `Holiday: ${d.holiday}` : d.halfDay ? `Half day: ${d.halfDay}` : d.isSunday ? 'Sunday' : '') + (canMark ? `${d.holiday || d.halfDay || d.isSunday ? ' · ' : ''}Click to mark as holiday or half day` : '');

    const filteredEmployees = employees.filter((emp) => {
        if (!isEmp) {
            if (selectedDept !== 'all' && emp.employment.department !== selectedDept)
                return false;
            if (selectedProject !== 'all' && getEmployeeProject(emp) !== selectedProject)
                return false;
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            if (!emp.name.toLowerCase().includes(q) && !emp.employeeId.toLowerCase().includes(q))
                return false;
        }
        return true;
    });

    const rows = useMemo(() => {
        const monthRecords = attendance.filter((a) => a.date?.startsWith(monthKey));
        return filteredEmployees.map((emp) => {
            const offDays = weeklyOffFor(emp.employeeId);
            const mine = new Map(monthRecords.filter((a) => a.employeeId === emp.employeeId).map((a) => [a.date, a]));
            const cells = dayInfo.map((d) => {
                const rec = mine.get(d.iso);
                if (rec && STATUS_CODE[rec.status]) return STATUS_CODE[rec.status];
                // Marked days and Sundays show on every date, past or upcoming.
                if (d.holiday) return 'H';
                if (d.halfDay) return 'HD';
                if (d.isSunday) return 'SU';
                if (offDays.includes(d.weekday)) return 'WO';
                return '-';
            });
            const count = (code) => cells.filter((c) => c === code).length;
            return { emp, cells, present: count('P') + count('L'), late: count('L'), absent: count('A'), leave: count('LV'), off: count('WO') + count('SU') };
        });
    }, [filteredEmployees, monthKey, dayInfo, attendance]);
    const mine = isEmp ? rows[0] : null;

    const exportMonth = () => downloadCsv(`Attendance_${monthKey}.csv`, [
        { label: 'Employee ID', value: (r) => r.emp.employeeId },
        { label: 'Name', value: (r) => r.emp.name },
        { label: 'Department', value: (r) => r.emp.employment?.department },
        ...days.map((d, i) => ({ label: String(d), value: (r) => r.cells[i] })),
        { label: 'Present', value: (r) => r.present },
        { label: 'Late', value: (r) => r.late },
        { label: 'Absent', value: (r) => r.absent },
        { label: 'Leave', value: (r) => r.leave },
    ], rows);

    return (<div className="space-y-6">
      <PageHeader title={isEmp ? 'My Monthly Attendance' : 'Monthly Attendance'} description={isEmp
            ? `Your attendance for ${monthLabel}.`
            : `Everyone's attendance for ${monthLabel}, from the punch register.`} breadcrumbs={[
            { label: isEmp ? 'My Portal' : 'Dashboard', path: '/hr' },
            { label: 'Attendance', path: '/hr/attendance' },
            { label: 'Monthly' },
        ]} actions={<div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/hr/attendance')} leftIcon={<ArrowLeft className="w-4 h-4"/>}>
              {isEmp ? 'My Attendance Log' : 'Back to Overview'}
            </Button>
            <Button variant="primary" size="sm" onClick={exportMonth} disabled={!rows.length} leftIcon={<Download className="w-4 h-4"/>}>
              Export CSV
            </Button>
          </div>}/>

      {mine && (<div className="stat-grid">
          {[
                { title: 'Present Days', value: mine.present, Icon: UserCheck, tone: 'border-l-emerald-500', icon: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' },
                { title: 'Late Marks', value: mine.late, Icon: Clock, tone: 'border-l-amber-500', icon: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' },
                { title: 'Leave Days', value: mine.leave, Icon: CalendarOff, tone: 'border-l-purple-500', icon: 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400' },
                { title: 'Weekly Offs', value: mine.off, Icon: Building2, tone: 'border-l-slate-400', icon: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' },
            ].map((c) => (<StatCard key={c.title} title={c.title} value={c.value} icon={<c.Icon />} iconBgColor={c.icon}/>))}
        </div>)}

      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="p-1.5" onClick={() => shiftMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={16} style={{ width: 16, height: 16, flexShrink: 0 }}/>
          </Button>
          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 px-3 min-w-[140px] text-center">{monthLabel}</span>
          <Button variant="outline" size="sm" className="p-1.5" onClick={() => shiftMonth(1)} disabled={monthKey >= lastMonthKey} aria-label="Next month">
            <ChevronRight size={16} style={{ width: 16, height: 16, flexShrink: 0 }}/>
          </Button>
        </div>
        <div className="flex items-center gap-3 text-xs flex-wrap text-slate-700 dark:text-slate-300">
          {['P', 'L', 'A', 'LV', 'SU', 'WO', 'H', 'HD'].map((code) => (<span key={code} className="inline-flex items-center gap-1.5">
              <span className={`min-w-4 h-4 px-0.5 rounded text-[10px] flex items-center justify-center font-bold ${CELL[code].bg}`}>{code}</span>
              {CELL[code].title}
            </span>))}
        </div>
      </Card>

      {(holidays.size > 0 || canMark) && (<div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            {holidays.size > 0 ? `Holidays & half days in ${monthLabel}:` : `No holidays or half days marked in ${monthLabel}.`}
          </span>
          {[...holidays.values()].map((h) => {
                const d = dayInfo.find((x) => x.iso === h.date);
                const text = `${new Date(`${h.date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' })} · ${h.kind === 'Half Day' ? 'Half day' : 'Holiday'}${h.name && h.name !== h.kind ? ` · ${h.name}` : ''}`;
                return canMark && d ? (<button key={h.date} type="button" className={`att-holiday-chip ${h.kind === 'Half Day' ? 'is-half' : ''}`} onClick={() => openMark(d)} title="Change or remove">{text}</button>) : (<span key={h.date} className={`att-holiday-chip ${h.kind === 'Half Day' ? 'is-half' : ''}`}>{text}</span>);
            })}
          {canMark && <span className="text-slate-500">Click a date in the calendar header to mark a holiday or half day.</span>}
        </div>)}

      {!isEmp && (<div className="flex flex-wrap items-center gap-3 bg-white dark:bg-[#1A2430] p-4 rounded-xl border border-slate-200 dark:border-[#253344] shadow-xs">
          <div className="w-full sm:w-64">
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by staff name or ID..." leftIcon={<Search className="w-4 h-4 text-slate-400"/>}/>
          </div>
          <div className="w-full sm:w-48">
            <Select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)} options={[
                { value: 'all', label: 'All Departments' },
                ...[...new Set(rawEmployees.map((e) => e.employment?.department).filter(Boolean))].map((d) => ({ value: d, label: d })),
            ]}/>
          </div>
          <div className="w-full sm:w-56">
            <Select value={selectedProject} onChange={(e) => setSelectedProject(e.target.value)} options={[
                { value: 'all', label: 'All Projects / Sites' },
                ...STANDARD_PROJECTS.map((p) => ({ value: p, label: p })),
            ]}/>
          </div>
          {(selectedDept !== 'all' || selectedProject !== 'all' || searchQuery.trim()) && (<Button variant="ghost" size="sm" onClick={() => {
                    setSelectedDept('all');
                    setSelectedProject('all');
                    setSearchQuery('');
                }} className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs">
              Reset Filters
            </Button>)}
          <span className="text-xs text-slate-500 dark:text-slate-400 ml-auto hidden md:inline">
            Showing <strong>{filteredEmployees.length}</strong> of <strong>{employees.length}</strong> employees
          </span>
        </div>)}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto custom-sidebar-scroll">
          <table className="w-full text-center text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#111821] border-b border-slate-200 dark:border-[#253344] text-slate-700 dark:text-slate-300">
                <th className="sticky left-0 z-20 bg-slate-100 dark:bg-[#111821] py-3 px-3 text-left font-bold text-slate-800 dark:text-slate-100 min-w-[220px] border-r border-slate-200 dark:border-[#253344]">
                  Staff Member
                </th>
                {dayInfo.map((d) => (<th key={d.day} title={columnTitle(d) || undefined} className={`p-0 min-w-[32px] font-mono text-[11px] font-semibold border-r border-slate-200 dark:border-[#253344] ${columnClass(d)} ${d.iso === today ? 'att-col-today' : ''}`}>
                    {canMark ? (<button type="button" className="att-day-btn" onClick={() => openMark(d)} aria-label={`${d.label}: mark as holiday or half day`}>
                        <span className="att-day-name">{WEEKDAY[d.weekday]}</span>
                        {d.day}
                      </button>) : (<span className="att-day-btn">
                        <span className="att-day-name">{WEEKDAY[d.weekday]}</span>
                        {d.day}
                      </span>)}
                  </th>))}
                <th className="py-3 px-2 font-bold text-emerald-800 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">P</th>
                <th className="py-3 px-2 font-bold text-rose-800 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20">A</th>
                <th className="py-3 px-2 font-bold text-purple-800 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-950/20">LV</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-[#253344]">
              {loading && !attendance.length ? (<SkeletonTableRows rows={6} columns={days.length + 4}/>) : rows.length === 0 ? (<tr>
                  <td colSpan={days.length + 4} className="py-8 text-center text-slate-400">
                    {isEmp ? 'Your HR record is not set up yet.' : 'No employees match the selected filters.'}
                  </td>
                </tr>) : (rows.map((r) => (<tr key={r.emp.id} className="hover:bg-slate-50/80 dark:hover:bg-[#253344]/40 transition-colors">
                    <td className="sticky left-0 z-10 bg-white dark:bg-[#1A2430] py-2 px-3 text-left font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-[#253344]">
                      <div className="truncate max-w-[210px] font-bold text-slate-900 dark:text-white">{r.emp.name}</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono font-bold text-slate-500">{r.emp.employeeId}</span>
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 truncate max-w-[130px]" title={getEmployeeProject(r.emp)}>
                          • {getEmployeeProject(r.emp)}
                        </span>
                      </div>
                    </td>
                    {r.cells.map((code, i) => (<td key={days[i]} className={`p-1 border-r border-slate-100 dark:border-[#253344] ${dayInfo[i].holiday ? 'att-td-holiday' : dayInfo[i].halfDay ? 'att-td-halfday' : dayInfo[i].isSunday ? 'att-td-sunday' : ''}`}>
                        <span className={`inline-block min-w-6 h-6 leading-6 px-0.5 rounded text-[10px] ${CELL[code].bg}`} title={code === 'H' ? `Holiday: ${dayInfo[i].holiday}` : code === 'HD' ? `Half day: ${dayInfo[i].halfDay}` : dayInfo[i].halfDay ? `${CELL[code].title} (half day: ${dayInfo[i].halfDay})` : CELL[code].title}>
                          {code}
                        </span>
                      </td>))}
                    <td className="font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20 tabular-nums">{r.present}</td>
                    <td className="font-bold text-rose-700 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/20 tabular-nums">{r.absent}</td>
                    <td className="font-bold text-purple-700 dark:text-purple-400 bg-purple-50/30 dark:bg-purple-950/20 tabular-nums">{r.leave}</td>
                  </tr>)))}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal isOpen={Boolean(editing)} onClose={() => !saving && setEditing(null)} title="Mark this day" description={editing ? `${editing.label} — applies to everyone.` : ''} footer={<>
            {editing && holidays.has(editing.iso) && (<Button variant="ghost" size="sm" className="text-rose-600 mr-auto" onClick={() => saveMark(true)} disabled={saving}>
                Make it a working day
              </Button>)}
            <Button variant="outline" size="sm" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={() => saveMark(false)} isLoading={saving}>Save</Button>
          </>}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Day type">
            {[
                { kind: 'Holiday', title: 'Holiday', text: 'Office closed. Not counted as a working day; no leave is used.' },
                { kind: 'Half Day', title: 'Half day', text: 'Office works half the day. Leave taken on it uses 0.5 day.' },
            ].map((o) => (<button key={o.kind} type="button" role="radio" aria-checked={editKind === o.kind} onClick={() => setEditKind(o.kind)} className={`att-kind-option ${editKind === o.kind ? 'is-active' : ''}`}>
                <strong>{o.title}</strong>
                <span>{o.text}</span>
              </button>))}
          </div>
          <Input label="Name (optional)" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder={editKind === 'Holiday' ? 'e.g. Diwali' : 'e.g. Office function in the evening'} maxLength={80}/>
        </div>
      </Modal>
    </div>);
};
